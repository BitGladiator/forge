import React from 'react';
import { Badge } from '../common/Badge';
import type { SubmissionStatus } from '../../types';

interface StatusBadgeProps {
  status: SubmissionStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'submitted':
      return <Badge variant="success">Submitted</Badge>;
    case 'under_review':
      return <Badge variant="info">Under Review</Badge>;
    case 'scored':
      return <Badge variant="neutral">Scored</Badge>;
    case 'draft':
    default:
      return <Badge variant="warning">Draft</Badge>;
  }
};
