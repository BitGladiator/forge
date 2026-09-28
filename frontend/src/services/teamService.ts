import { apiClient, ApiError } from '../api/apiClient';
import { API_CONFIG } from '../api/config';
import { MOCK_TEAMS } from '../api/mockData';
import type { Team } from '../types';

class TeamService {
  private teams: Team[] = [...MOCK_TEAMS];

  async getTeam(teamId?: string): Promise<Team | null> {
    if (!API_CONFIG.useMock) {
      try {
        return await apiClient<Team>('/participant/team');
      } catch (err: any) {
        if (err.status === 404) return null;
        throw err;
      }
    }

    await new Promise((r) => setTimeout(r, 200));
    const targetId = teamId || 'team_aurora';
    const found = this.teams.find((t) => t.id === targetId);
    return found || null;
  }

  async createTeam(name: string): Promise<Team> {
    if (!API_CONFIG.useMock) {
      try {
        return await apiClient<Team>('/participant/team', {
          method: 'POST',
          body: JSON.stringify({ name }),
        });
      } catch (err) {
        throw err;
      }
    }

    await new Promise((r) => setTimeout(r, 300));
    const newTeam: Team = {
      id: `team_${Date.now()}`,
      name,
      inviteCode: `${name.toUpperCase().replace(/\s+/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      status: 'active',
      createdAt: new Date().toISOString(),
      members: [
        {
          id: 'usr_current',
          name: 'Alex Rivera',
          email: 'alex.rivera@example.com',
          role: 'leader',
          joinedAt: new Date().toISOString(),
        },
      ],
    };
    this.teams.push(newTeam);
    return newTeam;
  }

  async joinTeam(inviteCode: string): Promise<Team> {
    if (!API_CONFIG.useMock) {
      try {
        return await apiClient<Team>('/participant/team/join', {
          method: 'POST',
          body: JSON.stringify({ inviteCode }),
        });
      } catch (err) {
        throw err;
      }
    }

    await new Promise((r) => setTimeout(r, 300));
    const cleanCode = inviteCode.trim().toUpperCase();
    const team = this.teams.find((t) => t.inviteCode.toUpperCase() === cleanCode);
    if (!team) {
      throw new ApiError(404, 'Invalid team invite code. Team not found.');
    }

    team.members.push({
      id: `usr_${Date.now()}`,
      name: 'New Teammate',
      email: 'teammate@example.com',
      role: 'member',
      joinedAt: new Date().toISOString(),
    });

    return { ...team };
  }

  async inviteMember(teamId: string, email: string): Promise<void> {
    if (!API_CONFIG.useMock) {
      try {
        await apiClient(`/participant/team/${teamId}/invite`, {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
        return;
      } catch (err) {
        throw err;
      }
    }

    await new Promise((r) => setTimeout(r, 200));
    // Simulation: invitation sent
  }
}

export const teamService = new TeamService();
