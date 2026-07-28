import { Navigate, Outlet } from 'react-router';

import { useAuth } from '../contexts/useAuth';

export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="panel p-6 text-sm font-semibold text-zinc-600">
        Chargement de la session...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
