import { apiClient } from '../api/apiClient';
import { API_CONFIG } from '../api/config';
import type { AdminPlatformOverview, AdminUser, AdminEventSummary, UserRole } from '../types';

class AdminService {
  async getPlatformOverview(): Promise<AdminPlatformOverview> {
    if (!API_CONFIG.useMock) {
      return await apiClient<AdminPlatformOverview>('/admin/overview');
    }
    await new Promise((r) => setTimeout(r, 200));
    return {
      totalUsers: 5,
      roleCounts: { organizer: 1, judge: 2, participant: 1, admin: 1 },
      totalEvents: 1,
      totalProjects: 4,
      totalScores: 12,
      totalAssignments: 4,
      platformVersion: 'Forge v2.0 (DOGFOOD)',
      sqliteVersion: '3.40.0',
    };
  }

  async getUsers(search?: string, role?: string): Promise<AdminUser[]> {
    if (!API_CONFIG.useMock) {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (role && role !== 'all') params.role = role;
      return await apiClient<AdminUser[]>('/admin/users', { params });
    }
    await new Promise((r) => setTimeout(r, 200));
    return [
      { id: 'usr_admin', name: 'Platform Admin', email: 'admin@forge.internal', role: 'admin', createdAt: '2026-09-01T00:00:00Z' },
      { id: 'usr_org', name: 'Lead Organizer', email: 'organizer@forge.internal', role: 'organizer', createdAt: '2026-09-01T00:00:00Z' },
      { id: 'jdg_a', name: 'Judge Alice', email: 'judge.a@forge.internal', role: 'judge', createdAt: '2026-09-01T00:00:00Z' },
      { id: 'jdg_b', name: 'Judge Bob', email: 'judge.b@forge.internal', role: 'judge', createdAt: '2026-09-01T00:00:00Z' },
      { id: 'usr_part', name: 'Participant User', email: 'participant@forge.internal', role: 'participant', createdAt: '2026-09-01T00:00:00Z' },
    ];
  }

  async updateUserRole(userId: string, role: UserRole): Promise<{ success: boolean; userId: string; newRole: UserRole }> {
    if (!API_CONFIG.useMock) {
      return await apiClient<{ success: boolean; userId: string; newRole: UserRole }>(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
    }
    await new Promise((r) => setTimeout(r, 200));
    return { success: true, userId, newRole: role };
  }

  async getAllEvents(): Promise<AdminEventSummary[]> {
    if (!API_CONFIG.useMock) {
      return await apiClient<AdminEventSummary[]>('/admin/events');
    }
    await new Promise((r) => setTimeout(r, 200));
    return [
      {
        id: 'evt_dogfood_2026',
        name: 'DOGFOOD 2026',
        tagline: 'Engineering platform dogfooding & internal evaluation summit',
        description: 'Self-hosted hackathon evaluation summit for DOGFOOD 2026.',
        startDate: '2026-09-01T09:00:00Z',
        submissionsOpen: true,
        submissionsClose: '2026-09-20T23:59:59Z',
        judgingDeadline: '2026-09-25T18:00:00Z',
        tracks: ['Infrastructure', 'Developer Tools'],
        prizes: [{ name: 'Grand Champion', amount: '$5,000' }],
        organizerId: 'usr_org',
        organizerName: 'Lead Organizer',
        organizerEmail: 'organizer@forge.internal',
        projectCount: 4,
        judgeCount: 2,
        createdAt: '2026-09-01T00:00:00Z',
      },
    ];
  }
}

export const adminService = new AdminService();
