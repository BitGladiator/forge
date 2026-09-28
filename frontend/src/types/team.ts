export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'leader' | 'member';
  joinedAt: string;
}

export interface Team {
  id: string;
  name: string;
  inviteCode: string;
  projectId?: string;
  members: TeamMember[];
  status: 'active' | 'forming' | 'locked';
  createdAt: string;
}
