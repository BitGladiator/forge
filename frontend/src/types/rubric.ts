export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
}

export interface RubricScore {
  criterionId: string;
  score: number;
  comment?: string;
}

export interface ProjectEvaluation {
  projectId: string;
  judgeId: string;
  scores: RubricScore[];
  generalFeedback?: string;
  submitted: boolean;
  submittedAt?: string;
}
