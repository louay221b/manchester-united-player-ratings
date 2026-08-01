import { Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router';

import { AdminLayout } from '../layouts/AdminLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import {
  AdminDashboardPage,
  AdminFootballIntegrationPage,
  AdminMatchesPage,
  AdminMatchLineupPage,
  AdminMatchVotesPage,
  AdminPlayerPhotosPage,
  AdminPlayersPage,
  AdminSeasonsPage,
  AdminStatisticsPage,
  ForgotPasswordPage,
  HomePage,
  LoginPage,
  MatchDetailsPage,
  MatchesPage,
  MatchResultsPage,
  PlayerProfilePage,
  PlayerVotePage,
  ProfilePage,
  RankingPage,
  RegisterPage,
  ResetPasswordPage,
} from './lazy-pages';
import { RouteFallback } from './RouteFallback';
import { AdminRoute } from './AdminRoute';
import { GuestRoute } from './GuestRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { NotFoundPage } from '../pages/NotFoundPage';

const withSuspense = (element: ReactNode) => (
  <Suspense fallback={<RouteFallback />}>{element}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: 'matches', element: withSuspense(<MatchesPage />) },
      { path: 'matches/:matchId', element: withSuspense(<MatchDetailsPage />) },
      { path: 'ranking', element: withSuspense(<RankingPage />) },
      { path: 'players/:playerId', element: withSuspense(<PlayerProfilePage />) },
      { path: 'forgot-password', element: withSuspense(<ForgotPasswordPage />) },
      { path: 'reset-password', element: withSuspense(<ResetPasswordPage />) },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'profile', element: withSuspense(<ProfilePage />) },
          { path: 'matches/:matchId/vote', element: withSuspense(<PlayerVotePage />) },
          { path: 'matches/:matchId/results', element: withSuspense(<MatchResultsPage />) },
        ],
      },
      {
        element: <GuestRoute />,
        children: [
          { path: 'login', element: withSuspense(<LoginPage />) },
          { path: 'register', element: withSuspense(<RegisterPage />) },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          {
            path: 'admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: withSuspense(<AdminDashboardPage />) },
              { path: 'seasons', element: withSuspense(<AdminSeasonsPage />) },
              { path: 'players', element: withSuspense(<AdminPlayersPage />) },
              { path: 'players/photos', element: withSuspense(<AdminPlayerPhotosPage />) },
              { path: 'matches', element: withSuspense(<AdminMatchesPage />) },
              {
                path: 'integrations/football',
                element: withSuspense(<AdminFootballIntegrationPage />),
              },
              { path: 'matches/:matchId/lineup', element: withSuspense(<AdminMatchLineupPage />) },
              { path: 'matches/:matchId/votes', element: withSuspense(<AdminMatchVotesPage />) },
              { path: 'statistics', element: withSuspense(<AdminStatisticsPage />) },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
