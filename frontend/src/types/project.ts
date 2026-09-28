export type SubmissionStatus = 'draft' | 'submitted' | 'under_review' | 'scored';

export interface Project {
  id: string;
  title: string;
  summary: string;
  description: string;
  track: string;
  teamId: string;
  teamName: string;
  repositoryUrl?: string;
  demoUrl?: string;
  submissionStatus: SubmissionStatus;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFormData {
  title: string;
  summary: string;
  description: string;
  track: string;
  repositoryUrl: string;
  demoUrl: string;
  isDraft?: boolean;
}

export interface ProjectFilters {
  search?: string;
  track?: string;
  status?: string;
}
