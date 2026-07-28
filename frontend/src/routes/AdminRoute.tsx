import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from '../contexts/useAuth';
import { AccessDeniedPage } from '../pages/AccessDeniedPage';

export function AdminRoute() {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role !== 'admin') {
    return <AccessDeniedPage />;
  }

  return <Outlet />;
}
