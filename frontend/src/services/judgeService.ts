import { apiClient, ApiError } from '../api/apiClient';
import { API_CONFIG } from '../api/config';
import { MOCK_ASSIGNED_PROJECTS, MOCK_RUBRIC_CRITERIA, MOCK_EVALUATIONS } from '../api/mockData';
import type { AssignedProject, RubricCriterion, ProjectEvaluation, RubricScore, JudgeStats } from '../types';

class JudgeService {
  private assignments: AssignedProject[] = [...MOCK_ASSIGNED_PROJECTS];
  private rubricCriteria: RubricCriterion[] = [...MOCK_RUBRIC_CRITERIA];
  private evaluations: Record<string, ProjectEvaluation> = { ...MOCK_EVALUATIONS };

  async getAssignedProjects(): Promise<AssignedProject[]> {
    if (!API_CONFIG.useMock) {
      try {
        return await apiClient<AssignedProject[]>('/judge/assignments');
      } catch (err) {
        throw err;
      }
    }

    await new Promise((r) => setTimeout(r, 200));
    return [...this.assignments];
  }

  async getJudgeStats(): Promise<JudgeStats> {
    const list = await this.getAssignedProjects();
    const assignedCount = list.length;
    const reviewedCount = list.filter((a) => a.status === 'completed').length;
    const remainingCount = assignedCount - reviewedCount;
    const progressPercentage = assignedCount > 0 ? Math.round((reviewedCount / assignedCount) * 100) : 0;

    return {
      assignedCount,
      reviewedCount,
      remainingCount,
      progressPercentage,
    };
  }

  async getRubric(): Promise<RubricCriterion[]> {
    if (!API_CONFIG.useMock) {
      try {
        return await apiClient<RubricCriterion[]>('/judge/rubric');
      } catch (err) {
        throw err;
      }
    }

    await new Promise((r) => setTimeout(r, 150));
    return [...this.rubricCriteria];
  }

  async getProjectEvaluation(projectId: string, judgeId = 'usr_j1'): Promise<ProjectEvaluation | null> {
    if (!API_CONFIG.useMock) {
      try {
        return await apiClient<ProjectEvaluation>(`/judge/projects/${projectId}/evaluation`);
      } catch (err: any) {
        if (err.status === 404) return null;
        throw err;
      }
    }

    await new Promise((r) => setTimeout(r, 150));
    const key = `${judgeId}_${projectId}`;
    return this.evaluations[key] || null;
  }

  async saveEvaluation(
    data: { projectId: string; scores: RubricScore[]; generalFeedback?: string },
    judgeId = 'usr_j1'
  ): Promise<ProjectEvaluation> {
    if (!API_CONFIG.useMock) {
      try {
        return await apiClient<ProjectEvaluation>(`/judge/projects/${data.projectId}/evaluation`, {
          method: 'POST',
          body: JSON.stringify({ ...data, submitted: false }),
        });
      } catch (err) {
        throw err;
      }
    }

    await new Promise((r) => setTimeout(r, 300));
    const key = `${judgeId}_${data.projectId}`;
    const evalRecord: ProjectEvaluation = {
      projectId: data.projectId,
      judgeId,
      scores: data.scores,
      generalFeedback: data.generalFeedback,
      submitted: false,
    };
    this.evaluations[key] = evalRecord;

    // Update assignment status
    const asgn = this.assignments.find((a) => a.project.id === data.projectId);
    if (asgn && asgn.status !== 'completed') {
      asgn.status = 'in_progress';
      asgn.currentScores = data.scores;
      asgn.feedback = data.generalFeedback;
    }

    return evalRecord;
  }

  async submitEvaluation(
    data: { projectId: string; scores: RubricScore[]; generalFeedback?: string },
    judgeId = 'usr_j1'
  ): Promise<ProjectEvaluation> {
    if (!API_CONFIG.useMock) {
      try {
        return await apiClient<ProjectEvaluation>(`/judge/projects/${data.projectId}/evaluation/submit`, {
          method: 'POST',
          body: JSON.stringify({ ...data, submitted: true }),
        });
      } catch (err) {
        throw err;
      }
    }

    await new Promise((r) => setTimeout(r, 350));

    // Backend authoritative validation
    const missingScore = this.rubricCriteria.some(
      (c) => !data.scores.some((s) => s.criterionId === c.id && s.score > 0)
    );
    if (missingScore) {
      throw new ApiError(400, 'All rubric criteria must be scored before final submission.');
    }

    const key = `${judgeId}_${data.projectId}`;
    const evalRecord: ProjectEvaluation = {
      projectId: data.projectId,
      judgeId,
      scores: data.scores,
      generalFeedback: data.generalFeedback,
      submitted: true,
      submittedAt: new Date().toISOString(),
    };
    this.evaluations[key] = evalRecord;

    const asgn = this.assignments.find((a) => a.project.id === data.projectId);
    if (asgn) {
      asgn.status = 'completed';
      asgn.evaluatedAt = evalRecord.submittedAt;
      asgn.currentScores = data.scores;
      asgn.feedback = data.generalFeedback;
    }

    return evalRecord;
  }
}

export const judgeService = new JudgeService();
