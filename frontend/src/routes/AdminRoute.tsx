import { Navigate, Outlet, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/useAuth';
import { AccessDeniedPage } from '../pages/AccessDeniedPage';

export function AdminRoute() {
  const { isAuthenticated, isLoading, profileError, role } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="panel p-6 text-sm font-semibold text-zinc-600">
        {t('common.checkingAdminRights')}
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
