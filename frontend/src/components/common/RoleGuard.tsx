import React from 'react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import { UnauthorizedPage } from '../../pages/error/UnauthorizedPage';
import { ForbiddenPage } from '../../pages/error/ForbiddenPage';
import { LoadingState } from './LoadingState';

export interface RoleGuardProps {
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { role, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState message="Checking session credentials..." />;
  }

  // If no allowedRoles specified, any authenticated user is allowed
  if (!allowedRoles || allowedRoles.length === 0) {
    if (!isAuthenticated) {
      return <UnauthorizedPage />;
    }
    return <>{children}</>;
  }

  // If visitor is trying to access an authenticated-only role
  if (!isAuthenticated && !allowedRoles.includes('visitor')) {
    return <UnauthorizedPage />;
  }

  // If current role is not in the allowed roles
  if (!allowedRoles.includes(role)) {
    return <ForbiddenPage requiredRole={allowedRoles.join(' or ')} currentRole={role} />;
  }

  return <>{children}</>;
};
