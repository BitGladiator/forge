import { apiClient } from '../api/apiClient';
import { API_CONFIG } from '../api/config';
import { MOCK_USERS } from '../api/mockData';
import type { User, UserRole, LoginCredentials, RegisterData, AuthSession } from '../types';

class AuthService {
  private activeUser: User = MOCK_USERS.participant;
  private token: string | null = localStorage.getItem('forge_token') || 'mock_jwt_token_participant';

  getToken(): string | null {
    return this.token;
  }

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    if (!API_CONFIG.useMock) {
      try {
        const session = await apiClient<AuthSession>('/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials),
        });
        this.token = session.token;
        this.activeUser = session.user;
        localStorage.setItem('forge_token', session.token);
        localStorage.setItem('forge_user', JSON.stringify(session.user));
        return session;
      } catch (err) {
        throw err;
      }
    }

    // Mock implementation
    await new Promise((r) => setTimeout(r, 400));
    
    // Find matching mock user by email or fallback to participant
    const foundUser = Object.values(MOCK_USERS).find((u) => u.email.toLowerCase() === credentials.email.toLowerCase());
    const user = foundUser || {
      id: `usr_${Date.now()}`,
      name: credentials.email.split('@')[0],
      email: credentials.email,
      role: 'participant' as UserRole,
    };

    const token = `mock_token_${user.id}`;
    this.token = token;
    this.activeUser = user;
    localStorage.setItem('forge_token', token);
    localStorage.setItem('forge_user', JSON.stringify(user));

    return { user, token };
  }

  async register(data: RegisterData): Promise<AuthSession> {
    if (!API_CONFIG.useMock) {
      try {
        const session = await apiClient<AuthSession>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        this.token = session.token;
        this.activeUser = session.user;
        localStorage.setItem('forge_token', session.token);
        localStorage.setItem('forge_user', JSON.stringify(session.user));
        return session;
      } catch (err) {
        throw err;
      }
    }

    // Mock registration
    await new Promise((r) => setTimeout(r, 400));
    const user: User = {
      id: `usr_${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role || 'participant',
    };
    const token = `mock_token_${user.id}`;
    this.token = token;
    this.activeUser = user;
    localStorage.setItem('forge_token', token);
    localStorage.setItem('forge_user', JSON.stringify(user));

    return { user, token };
  }

  async getCurrentUser(): Promise<User | null> {
    const storedUser = localStorage.getItem('forge_user');
    if (storedUser) {
      try {
        this.activeUser = JSON.parse(storedUser);
      } catch {
        // use default
      }
    }

    if (!API_CONFIG.useMock) {
      try {
        const user = await apiClient<User>('/auth/me');
        this.activeUser = user;
        localStorage.setItem('forge_user', JSON.stringify(user));
        return user;
      } catch (err) {
        return null;
      }
    }

    return this.activeUser;
  }

  async logout(): Promise<void> {
    if (!API_CONFIG.useMock) {
      try {
        await apiClient('/auth/logout', { method: 'POST' });
      } catch {
        // proceed with local cleanup
      }
    }
    this.token = null;
    this.activeUser = MOCK_USERS.visitor;
    localStorage.removeItem('forge_token');
    localStorage.removeItem('forge_user');
  }

  // Developer tool helper to easily test different roles with real backend tokens
  setSimulatedRole(role: UserRole): User {
    const roleTokens: Record<UserRole, string | null> = {
      visitor: null,
      participant: 'forge_participant_token_2026',
      judge: 'forge_judge_a_token_2026',
      organizer: 'forge_organizer_token_2026',
      admin: 'forge_admin_token_2026',
    };

    const token = roleTokens[role];
    if (token) {
      this.token = token;
      localStorage.setItem('forge_token', token);
    } else {
      this.token = null;
      localStorage.removeItem('forge_token');
    }

    const idMap: Record<UserRole, string> = {
      visitor: 'usr_anon',
      participant: 'usr_part',
      judge: 'jdg_a',
      organizer: 'usr_org',
      admin: 'usr_admin',
    };

    const user: User = {
      id: idMap[role],
      name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
      email: `${role}@forge.internal`,
      role,
    };
    this.activeUser = user;
    localStorage.setItem('forge_user', JSON.stringify(user));
    return user;
  }
}

export const authService = new AuthService();
