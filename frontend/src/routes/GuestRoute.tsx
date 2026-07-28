import { Navigate, Outlet } from 'react-router';

import { useAuth } from '../contexts/useAuth';

export function GuestRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
