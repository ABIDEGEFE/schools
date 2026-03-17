import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'AD' | 'TC' | 'ST' | 'SA'; // Admin, Teacher, Student, Super Admin
  requiresLicense?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiresLicense = false
}) => {
  const { state } = useAuth();

  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && state.user?.role !== requiredRole) {
    return <Navigate to="/profile" replace />;
  }

  if (requiresLicense && !state.user?.is_licensed) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
};