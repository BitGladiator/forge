import type { Project } from './project';
import type { RubricScore } from './rubric';

export interface AssignedProject {
  assignmentId: string;
  project: Project;
  status: 'pending' | 'in_progress' | 'completed';
  assignedAt: string;
  evaluatedAt?: string;
  currentScores?: RubricScore[];
  feedback?: string;
}

export interface JudgeStats {
  assignedCount: number;
  reviewedCount: number;
  remainingCount: number;
  progressPercentage: number;
}
