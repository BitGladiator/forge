import type { User, UserRole } from './auth';

export interface Prize {
  id?: string;
  name: string;
  description?: string;
  amount?: string;
  track?: string;
}

export interface Hackathon {
  id: string;
  name: string;
  tagline: string;
  description: string;
  startDate: string;
  submissionsOpen: boolean;
  submissionsClose: string;
  judgingDeadline: string;
  tracks: string[];
  prizes: Prize[];
  organizerId?: string;
  projectCount?: number;
  totalProjects?: number;
  submittedProjects?: number;
  totalJudges?: number;
  assignmentsTotal?: number;
  assignmentsCompleted?: number;
  judgingProgress?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface HackathonFormData {
  name: string;
  tagline: string;
  description: string;
  startDate: string;
  submissionsClose: string;
  judgingDeadline: string;
  tracks: string[];
  prizes: Prize[];
}

export interface EventOverview {
  eventId?: string;
  eventName: string;
  tagline: string;
  totalProjects: number;
  submittedProjects: number;
  totalJudges: number;
  activeJudges: number;
  assignmentsTotal: number;
  assignmentsCompleted: number;
  judgingProgress: number; // percentage 0-100
  submissionDeadline: string;
  submissionOpen: boolean;
}

export interface JudgeUser extends User {
  assignedTracks: string[];
  assignedProjectsCount: number;
  completedReviewsCount: number;
  status: 'active' | 'pending' | 'inactive';
}

export interface JudgeAssignment {
  id: string;
  eventId?: string;
  judgeId: string;
  judgeName: string;
  projectId: string;
  projectTitle: string;
  track: string;
  status: 'assigned' | 'completed';
  assignedAt: string;
}

export interface ProjectRankingResult {
  rank: number;
  projectId: string;
  projectTitle: string;
  teamName: string;
  track: string;
  averageScore: number;
  totalEvaluations: number;
  reviewStatus: 'completed' | 'partial' | 'unassigned';
}

export interface AdminPlatformOverview {
  totalUsers: number;
  roleCounts: Record<string, number>;
  totalEvents: number;
  totalProjects: number;
  totalScores: number;
  totalAssignments: number;
  platformVersion: string;
  sqliteVersion: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId?: string | null;
  createdAt: string;
}

export interface AdminEventSummary extends Hackathon {
  organizerName?: string;
  organizerEmail?: string;
  judgeCount?: number;
}
