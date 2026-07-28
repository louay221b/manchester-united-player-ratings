import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from '../contexts/useAuth';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="panel p-6 text-sm font-semibold text-zinc-600">
        Chargement de la session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
