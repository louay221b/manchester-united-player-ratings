import { createBrowserRouter, Navigate } from 'react-router';

import { AdminLayout } from './AdminLayout';
import { AppLayout } from './AppLayout';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { MatchLineupAdminPage } from '../pages/admin/MatchLineupAdminPage';
import { MatchesAdminPage } from '../pages/admin/MatchesAdminPage';
import { PlayersAdminPage } from '../pages/admin/PlayersAdminPage';
import { SeasonsAdminPage } from '../pages/admin/SeasonsAdminPage';
import { SeasonStatsAdminPage } from '../pages/admin/SeasonStatsAdminPage';
import { VoteResultsAdminPage } from '../pages/admin/VoteResultsAdminPage';
import { HomePage } from '../pages/public/HomePage';
import { LoginPage } from '../pages/public/LoginPage';
import { MatchDetailsPage } from '../pages/public/MatchDetailsPage';
import { MatchesPage } from '../pages/public/MatchesPage';
import { MatchResultsPage } from '../pages/public/MatchResultsPage';
import { PlayerProfilePage } from '../pages/public/PlayerProfilePage';
import { PlayerVotePage } from '../pages/public/PlayerVotePage';
import { RegisterPage } from '../pages/public/RegisterPage';
import { SeasonLeaderboardPage } from '../pages/public/SeasonLeaderboardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'matches', element: <MatchesPage /> },
      { path: 'matches/:matchId', element: <MatchDetailsPage /> },
      { path: 'matches/:matchId/vote', element: <PlayerVotePage /> },
      { path: 'matches/:matchId/results', element: <MatchResultsPage /> },
      { path: 'season', element: <SeasonLeaderboardPage /> },
      { path: 'players/:playerId', element: <PlayerProfilePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        path: 'admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'seasons', element: <SeasonsAdminPage /> },
          { path: 'players', element: <PlayersAdminPage /> },
          { path: 'matches', element: <MatchesAdminPage /> },
          { path: 'lineup', element: <MatchLineupAdminPage /> },
          { path: 'votes', element: <VoteResultsAdminPage /> },
          { path: 'season-stats', element: <SeasonStatsAdminPage /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
