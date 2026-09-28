import { apiClient, ApiError } from '../api/apiClient';
import { API_CONFIG } from '../api/config';
import { MOCK_PROJECTS } from '../api/mockData';
import type { Project, ProjectFormData, ProjectFilters } from '../types';

class ProjectService {
  private projects: Project[] = [...MOCK_PROJECTS];

  async getProjects(filters?: ProjectFilters): Promise<Project[]> {
    if (!API_CONFIG.useMock) {
      try {
        return await apiClient<Project[]>('/projects', {
          params: {
            search: filters?.search,
            track: filters?.track,
            status: filters?.status,
          },
        });
      } catch (err) {
        throw err;
      }
    }

    // Mock query logic
    await new Promise((r) => setTimeout(r, 200));
    let result = [...this.projects];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.teamName.toLowerCase().includes(q) ||
          p.track.toLowerCase().includes(q)
      );
    }

    if (filters?.track && filters.track !== 'all') {
      result = result.filter((p) => p.track.toLowerCase() === filters.track!.toLowerCase());
    }

    if (filters?.status && filters.status !== 'all') {
      result = result.filter((p) => p.submissionStatus === filters.status);
    }

    return result;
  }

  async getProjectById(id: string): Promise<Project> {
    if (!API_CONFIG.useMock) {
      try {
        return await apiClient<Project>(`/projects/${id}`);
      } catch (err) {
        throw err;
      }
    }

    await new Promise((r) => setTimeout(r, 150));
    const found = this.projects.find((p) => p.id === id);
    if (!found) {
      throw new ApiError(404, `Project with ID ${id} was not found.`);
    }
    return found;
  }

  async getUserProject(teamId?: string): Promise<Project | null> {
    if (!API_CONFIG.useMock) {
      try {
        return await apiClient<Project>('/participant/project');
      } catch (err: any) {
        if (err.status === 404) return null;
        throw err;
      }
    }

    await new Promise((r) => setTimeout(r, 150));
    const project = this.projects.find((p) => p.teamId === (teamId || 'team_aurora'));
    return project || null;
  }

  async saveProject(data: ProjectFormData, existingId?: string): Promise<Project> {
    if (!API_CONFIG.useMock) {
      try {
        const endpoint = existingId ? `/projects/${existingId}` : '/projects';
        const method = existingId ? 'PUT' : 'POST';
        return await apiClient<Project>(endpoint, {
          method,
          body: JSON.stringify(data),
        });
      } catch (err) {
        throw err;
      }
    }

    await new Promise((r) => setTimeout(r, 300));

    if (existingId) {
      const index = this.projects.findIndex((p) => p.id === existingId);
      if (index !== -1) {
        const updated: Project = {
          ...this.projects[index],
          title: data.title,
          summary: data.summary,
          description: data.description,
          track: data.track,
          repositoryUrl: data.repositoryUrl,
          demoUrl: data.demoUrl,
          submissionStatus: data.isDraft ? 'draft' : 'submitted',
          submittedAt: data.isDraft ? this.projects[index].submittedAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.projects[index] = updated;
        return updated;
      }
    }

    const newProject: Project = {
      id: `proj_${Date.now()}`,
      title: data.title,
      summary: data.summary,
      description: data.description,
      track: data.track,
      teamId: 'team_aurora',
      teamName: 'Aurora Systems',
      repositoryUrl: data.repositoryUrl,
      demoUrl: data.demoUrl,
      submissionStatus: data.isDraft ? 'draft' : 'submitted',
      submittedAt: data.isDraft ? undefined : new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects.unshift(newProject);
    return newProject;
  }

  async submitProject(id: string): Promise<Project> {
    if (!API_CONFIG.useMock) {
      try {
        return await apiClient<Project>(`/projects/${id}/submit`, { method: 'POST' });
      } catch (err) {
        throw err;
      }
    }

    await new Promise((r) => setTimeout(r, 300));
    const project = this.projects.find((p) => p.id === id);
    if (!project) throw new ApiError(404, 'Project not found');

    project.submissionStatus = 'submitted';
    project.submittedAt = new Date().toISOString();
    project.updatedAt = new Date().toISOString();
    return { ...project };
  }

  async getActiveEvent(): Promise<{
    id: string;
    eventName: string;
    tagline: string;
    description: string;
    submissionDeadline: string;
    submissionOpen: boolean;
    tracks: string[];
  } | null> {
    if (!API_CONFIG.useMock) {
      try {
        return await apiClient<any>('/event');
      } catch {
        return null;
      }
    }

    await new Promise((r) => setTimeout(r, 100));
    return {
      id: 'evt_dogfood_2026',
      eventName: 'DOGFOOD 2026 Hackathon',
      tagline: 'Engineering the next generation of developer infrastructure',
      description: 'Official self-hosted hackathon evaluation summit for DOGFOOD 2026.',
      submissionDeadline: '2026-09-20T23:59:59Z',
      submissionOpen: true,
      tracks: ['Infrastructure', 'Developer Tools'],
    };
  }
}

export const projectService = new ProjectService();
