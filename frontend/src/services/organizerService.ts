import { apiClient, ApiError } from '../api/apiClient';
import { API_CONFIG } from '../api/config';
import {
  MOCK_EVENT_OVERVIEW,
  MOCK_JUDGES,
  MOCK_ASSIGNMENTS,
  MOCK_RUBRIC_CRITERIA,
  MOCK_RANKING_RESULTS,
  MOCK_PROJECTS,
} from '../api/mockData';
import type {
  EventOverview,
  JudgeUser,
  JudgeAssignment,
  RubricCriterion,
  ProjectRankingResult,
  Hackathon,
  HackathonFormData,
} from '../types';

class OrganizerService {
  private overview: EventOverview = { ...MOCK_EVENT_OVERVIEW };
  private judges: JudgeUser[] = [...MOCK_JUDGES];
  private assignments: JudgeAssignment[] = [...MOCK_ASSIGNMENTS];
  private rubric: RubricCriterion[] = [...MOCK_RUBRIC_CRITERIA];
  private results: ProjectRankingResult[] = [...MOCK_RANKING_RESULTS];
  private hackathons: Hackathon[] = [
    {
      id: 'evt_dogfood_2026',
      name: 'DOGFOOD 2026',
      tagline: 'Engineering platform dogfooding & internal evaluation summit',
      description: 'Official self-hosted hackathon evaluation summit for DOGFOOD 2026.',
      startDate: '2026-09-01T09:00:00Z',
      submissionsOpen: true,
      submissionsClose: '2026-09-20T23:59:59Z',
      judgingDeadline: '2026-09-25T18:00:00Z',
      tracks: ['Infrastructure', 'Developer Tools', 'AI & Machine Learning'],
      prizes: [
        { name: 'First Place - Grand Champion', amount: '$5,000' },
        { name: 'Best Developer Tool', amount: '$2,500' },
        { name: 'Best Infrastructure Project', amount: '$2,500' },
      ],
      totalProjects: 4,
      submittedProjects: 4,
      totalJudges: 2,
      assignmentsTotal: 4,
      assignmentsCompleted: 3,
      judgingProgress: 75.0,
      createdAt: '2026-09-01T00:00:00Z',
    },
  ];

  async getEvents(): Promise<Hackathon[]> {
    if (!API_CONFIG.useMock) {
      return await apiClient<Hackathon[]>('/organizer/events');
    }
    await new Promise((r) => setTimeout(r, 200));
    return [...this.hackathons];
  }

  async getEvent(id: string): Promise<Hackathon> {
    if (!API_CONFIG.useMock) {
      return await apiClient<Hackathon>(`/organizer/events/${id}`);
    }
    await new Promise((r) => setTimeout(r, 200));
    const h = this.hackathons.find((item) => item.id === id);
    if (!h) throw new ApiError(404, `Hackathon ${id} not found`);
    return { ...h };
  }

  async createEvent(data: HackathonFormData): Promise<Hackathon> {
    if (!API_CONFIG.useMock) {
      return await apiClient<Hackathon>('/organizer/events', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
    await new Promise((r) => setTimeout(r, 300));
    const newEvent: Hackathon = {
      id: `evt_${Date.now()}`,
      ...data,
      submissionsOpen: true,
      totalProjects: 0,
      submittedProjects: 0,
      totalJudges: 0,
      assignmentsTotal: 0,
      assignmentsCompleted: 0,
      judgingProgress: 0,
      createdAt: new Date().toISOString(),
    };
    this.hackathons.unshift(newEvent);
    return newEvent;
  }

  async updateEvent(id: string, data: Partial<HackathonFormData> & { submissionsOpen?: boolean }): Promise<{ success: boolean; id: string }> {
    if (!API_CONFIG.useMock) {
      return await apiClient<{ success: boolean; id: string }>(`/organizer/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
    await new Promise((r) => setTimeout(r, 200));
    const idx = this.hackathons.findIndex((item) => item.id === id);
    if (idx !== -1) {
      this.hackathons[idx] = { ...this.hackathons[idx], ...data };
    }
    return { success: true, id };
  }

  async getEventOverview(eventId?: string): Promise<EventOverview> {
    if (!API_CONFIG.useMock) {
      const url = eventId ? `/organizer/overview?eventId=${encodeURIComponent(eventId)}` : '/organizer/overview';
      return await apiClient<EventOverview>(url);
    }

    await new Promise((r) => setTimeout(r, 200));
    return { ...this.overview };
  }

  async getJudges(eventId?: string): Promise<JudgeUser[]> {
    if (!API_CONFIG.useMock) {
      const url = eventId ? `/organizer/judges?eventId=${encodeURIComponent(eventId)}` : '/organizer/judges';
      return await apiClient<JudgeUser[]>(url);
    }

    await new Promise((r) => setTimeout(r, 200));
    return [...this.judges];
  }

  async inviteJudge(data: { name: string; email: string; assignedTracks: string[] }): Promise<JudgeUser> {
    if (!API_CONFIG.useMock) {
      return await apiClient<JudgeUser>('/organizer/judges/invite', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }

    await new Promise((r) => setTimeout(r, 300));
    const newJudge: JudgeUser = {
      id: `usr_j${Date.now()}`,
      name: data.name,
      email: data.email,
      role: 'judge',
      assignedTracks: data.assignedTracks,
      assignedProjectsCount: 0,
      completedReviewsCount: 0,
      status: 'active',
    };
    this.judges.push(newJudge);
    this.overview.totalJudges += 1;
    this.overview.activeJudges += 1;
    return newJudge;
  }

  async getAssignments(eventId?: string): Promise<JudgeAssignment[]> {
    if (!API_CONFIG.useMock) {
      const url = eventId ? `/organizer/assignments?eventId=${encodeURIComponent(eventId)}` : '/organizer/assignments';
      return await apiClient<JudgeAssignment[]>(url);
    }

    await new Promise((r) => setTimeout(r, 200));
    return [...this.assignments];
  }

  async assignJudge(judgeId: string, projectId: string, eventId?: string): Promise<JudgeAssignment> {
    if (!API_CONFIG.useMock) {
      return await apiClient<JudgeAssignment>('/organizer/assignments', {
        method: 'POST',
        body: JSON.stringify({ judgeId, projectId, eventId }),
      });
    }

    await new Promise((r) => setTimeout(r, 300));
    const judge = this.judges.find((j) => j.id === judgeId);
    const project = MOCK_PROJECTS.find((p) => p.id === projectId);

    if (!judge || !project) {
      throw new ApiError(404, 'Judge or Project was not found.');
    }

    const existing = this.assignments.find((a) => a.judgeId === judgeId && a.projectId === projectId);
    if (existing) {
      throw new ApiError(409, 'This judge is already assigned to this project.');
    }

    const assignment: JudgeAssignment = {
      id: `asgn_${Date.now()}`,
      judgeId,
      judgeName: judge.name,
      projectId,
      projectTitle: project.title,
      track: project.track,
      status: 'assigned',
      assignedAt: new Date().toISOString(),
    };

    this.assignments.push(assignment);
    judge.assignedProjectsCount += 1;
    this.overview.assignmentsTotal += 1;
    return assignment;
  }

  async removeAssignment(assignmentId: string): Promise<void> {
    if (!API_CONFIG.useMock) {
      await apiClient(`/organizer/assignments/${assignmentId}`, { method: 'DELETE' });
      return;
    }

    await new Promise((r) => setTimeout(r, 200));
    const index = this.assignments.findIndex((a) => a.id === assignmentId);
    if (index !== -1) {
      const asgn = this.assignments[index];
      const judge = this.judges.find((j) => j.id === asgn.judgeId);
      if (judge && judge.assignedProjectsCount > 0) {
        judge.assignedProjectsCount -= 1;
      }
      this.assignments.splice(index, 1);
      this.overview.assignmentsTotal -= 1;
    }
  }

  async getRubric(eventId?: string): Promise<RubricCriterion[]> {
    if (!API_CONFIG.useMock) {
      const url = eventId ? `/organizer/rubric?eventId=${encodeURIComponent(eventId)}` : '/organizer/rubric';
      return await apiClient<RubricCriterion[]>(url);
    }

    await new Promise((r) => setTimeout(r, 150));
    return [...this.rubric];
  }

  async saveRubric(criteria: RubricCriterion[], eventId?: string): Promise<RubricCriterion[]> {
    if (!API_CONFIG.useMock) {
      const url = eventId ? `/organizer/rubric?eventId=${encodeURIComponent(eventId)}` : '/organizer/rubric';
      return await apiClient<RubricCriterion[]>(url, {
        method: 'PUT',
        body: JSON.stringify({ criteria }),
      });
    }

    await new Promise((r) => setTimeout(r, 300));
    this.rubric = [...criteria];
    return [...this.rubric];
  }

  async getResults(eventId?: string): Promise<ProjectRankingResult[]> {
    if (!API_CONFIG.useMock) {
      const url = eventId ? `/organizer/results?eventId=${encodeURIComponent(eventId)}` : '/organizer/results';
      return await apiClient<ProjectRankingResult[]>(url);
    }

    await new Promise((r) => setTimeout(r, 200));
    return [...this.results];
  }

  async exportCsv(eventId?: string): Promise<Blob> {
    if (!API_CONFIG.useMock) {
      const url = eventId ? `/organizer/export/csv?eventId=${encodeURIComponent(eventId)}` : '/organizer/export/csv';
      return await apiClient<Blob>(url, {
        method: 'GET',
        headers: { Accept: 'text/csv' },
      });
    }

    await new Promise((r) => setTimeout(r, 500));
    const headers = ['Rank', 'Project Title', 'Team Name', 'Track', 'Average Score', 'Evaluations Count', 'Status'];
    const rows = this.results.map((item) => [
      item.rank,
      `"${item.projectTitle.replace(/"/g, '""')}"`,
      `"${item.teamName.replace(/"/g, '""')}"`,
      item.track,
      item.averageScore.toFixed(2),
      item.totalEvaluations,
      item.reviewStatus,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }
}

export const organizerService = new OrganizerService();
