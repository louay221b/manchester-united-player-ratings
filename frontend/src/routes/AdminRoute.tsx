import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from '../contexts/useAuth';
import { AccessDeniedPage } from '../pages/AccessDeniedPage';

export function AdminRoute() {
  const { isAuthenticated, isLoading, profileError, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="panel p-6 text-sm font-semibold text-zinc-600">
        Verification des droits administrateur...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role !== 'admin') {
    return <AccessDeniedPage description={profileError ?? undefined} />;
  }

  return <Outlet />;
}
