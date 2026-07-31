import { lazy } from 'react';

export const HomePage = lazy(() =>
  import('../pages/public/HomePage').then(({ HomePage }) => ({ default: HomePage })),
);

export const MatchesPage = lazy(() =>
  import('../pages/public/MatchesPage').then(({ MatchesPage }) => ({ default: MatchesPage })),
);

export const MatchDetailsPage = lazy(() =>
  import('../pages/public/MatchDetailsPage').then(({ MatchDetailsPage }) => ({
    default: MatchDetailsPage,
  })),
);

export const PlayerVotePage = lazy(() =>
  import('../pages/public/PlayerVotePage').then(({ PlayerVotePage }) => ({
    default: PlayerVotePage,
  })),
);

export const MatchResultsPage = lazy(() =>
  import('../pages/public/MatchResultsPage').then(({ MatchResultsPage }) => ({
    default: MatchResultsPage,
  })),
);

export const RankingPage = lazy(() =>
  import('../pages/public/RankingPage').then(({ RankingPage }) => ({ default: RankingPage })),
);

export const PlayerProfilePage = lazy(() =>
  import('../pages/public/PlayerProfilePage').then(({ PlayerProfilePage }) => ({
    default: PlayerProfilePage,
  })),
);

export const LoginPage = lazy(() =>
  import('../pages/public/LoginPage').then(({ LoginPage }) => ({ default: LoginPage })),
);

export const RegisterPage = lazy(() =>
  import('../pages/public/RegisterPage').then(({ RegisterPage }) => ({ default: RegisterPage })),
);

export const ForgotPasswordPage = lazy(() =>
  import('../pages/public/ForgotPasswordPage').then(({ ForgotPasswordPage }) => ({
    default: ForgotPasswordPage,
  })),
);

export const ResetPasswordPage = lazy(() =>
  import('../pages/public/ResetPasswordPage').then(({ ResetPasswordPage }) => ({
    default: ResetPasswordPage,
  })),
);

export const ProfilePage = lazy(() =>
  import('../pages/public/ProfilePage').then(({ ProfilePage }) => ({ default: ProfilePage })),
);

export const AdminDashboardPage = lazy(() =>
  import('../pages/admin/AdminDashboardPage').then(({ AdminDashboardPage }) => ({
    default: AdminDashboardPage,
  })),
);

export const AdminSeasonsPage = lazy(() =>
  import('../pages/admin/AdminSeasonsPage').then(({ AdminSeasonsPage }) => ({
    default: AdminSeasonsPage,
  })),
);

export const AdminPlayersPage = lazy(() =>
  import('../pages/admin/AdminPlayersPage').then(({ AdminPlayersPage }) => ({
    default: AdminPlayersPage,
  })),
);

export const AdminPlayerPhotosPage = lazy(() =>
  import('../pages/admin/AdminPlayerPhotosPage').then(({ AdminPlayerPhotosPage }) => ({
    default: AdminPlayerPhotosPage,
  })),
);

export const AdminMatchesPage = lazy(() =>
  import('../pages/admin/AdminMatchesPage').then(({ AdminMatchesPage }) => ({
    default: AdminMatchesPage,
  })),
);

export const AdminMatchLineupPage = lazy(() =>
  import('../pages/admin/AdminMatchLineupPage').then(({ AdminMatchLineupPage }) => ({
    default: AdminMatchLineupPage,
  })),
);

export const AdminMatchVotesPage = lazy(() =>
  import('../pages/admin/AdminMatchVotesPage').then(({ AdminMatchVotesPage }) => ({
    default: AdminMatchVotesPage,
  })),
);

export const AdminStatisticsPage = lazy(() =>
  import('../pages/admin/AdminStatisticsPage').then(({ AdminStatisticsPage }) => ({
    default: AdminStatisticsPage,
  })),
);
