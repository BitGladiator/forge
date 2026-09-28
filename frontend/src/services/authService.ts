import { apiClient } from '../api/apiClient';
import type { User, LoginCredentials, RegisterData, AuthSession } from '../types';

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    this.token = localStorage.getItem('forge_token');
    const storedUser = localStorage.getItem('forge_user');
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser);
      } catch {
        this.user = null;
      }
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('forge_token');
    }
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    try {
      const session = await apiClient<AuthSession>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email.trim(),
          password: credentials.password,
        }),
      });

      this.token = session.token;
      this.user = session.user;
      localStorage.setItem('forge_token', session.token);
      localStorage.setItem('forge_user', JSON.stringify(session.user));
      return session;
    } catch (err) {
      this.clearSession();
      throw err;
    }
  }

  async register(data: RegisterData): Promise<AuthSession> {
    try {
      const session = await apiClient<AuthSession>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          password: data.password,
        }),
      });

      this.token = session.token;
      this.user = session.user;
      localStorage.setItem('forge_token', session.token);
      localStorage.setItem('forge_user', JSON.stringify(session.user));
      return session;
    } catch (err) {
      this.clearSession();
      throw err;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) {
      this.clearSession();
      return null;
    }

    try {
      // Call authoritative backend endpoint /api/auth/me to verify token and retrieve true role
      const user = await apiClient<User>('/auth/me');
      this.user = user;
      localStorage.setItem('forge_user', JSON.stringify(user));
      return user;
    } catch (err) {
      // If token is invalid, expired, or backend rejects, clear local credentials
      this.clearSession();
      return null;
    }
  }

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await apiClient('/auth/logout', { method: 'POST' });
      } catch {
        // Ignore network errors on logout
      }
    }
    this.clearSession();
  }

  clearSession(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('forge_token');
    localStorage.removeItem('forge_user');
  }
}

export const authService = new AuthService();
