import { createBrowserRouter } from 'react-router';

import { AdminLayout } from '../layouts/AdminLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { AdminRoute } from './AdminRoute';
import { GuestRoute } from './GuestRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminMatchLineupPage } from '../pages/admin/AdminMatchLineupPage';
import { AdminMatchVotesPage } from '../pages/admin/AdminMatchVotesPage';
import { AdminMatchesPage } from '../pages/admin/AdminMatchesPage';
import { AdminPlayersPage } from '../pages/admin/AdminPlayersPage';
import { AdminSeasonsPage } from '../pages/admin/AdminSeasonsPage';
import { AdminStatisticsPage } from '../pages/admin/AdminStatisticsPage';
import { HomePage } from '../pages/public/HomePage';
import { LoginPage } from '../pages/public/LoginPage';
import { MatchDetailsPage } from '../pages/public/MatchDetailsPage';
import { MatchesPage } from '../pages/public/MatchesPage';
import { MatchResultsPage } from '../pages/public/MatchResultsPage';
import { PlayerProfilePage } from '../pages/public/PlayerProfilePage';
import { PlayerVotePage } from '../pages/public/PlayerVotePage';
import { RankingPage } from '../pages/public/RankingPage';
import { RegisterPage } from '../pages/public/RegisterPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'matches', element: <MatchesPage /> },
      { path: 'matches/:matchId', element: <MatchDetailsPage /> },
      { path: 'matches/:matchId/results', element: <MatchResultsPage /> },
      { path: 'ranking', element: <RankingPage /> },
      { path: 'players/:playerId', element: <PlayerProfilePage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'matches/:matchId/vote', element: <PlayerVotePage /> },
        ],
      },
      {
        element: <GuestRoute />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          {
            path: 'admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboardPage /> },
              { path: 'seasons', element: <AdminSeasonsPage /> },
              { path: 'players', element: <AdminPlayersPage /> },
              { path: 'matches', element: <AdminMatchesPage /> },
              { path: 'matches/:matchId/lineup', element: <AdminMatchLineupPage /> },
              { path: 'matches/:matchId/votes', element: <AdminMatchVotesPage /> },
              { path: 'statistics', element: <AdminStatisticsPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
