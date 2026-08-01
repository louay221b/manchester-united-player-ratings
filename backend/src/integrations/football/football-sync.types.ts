export type FootballProviderName = 'api-football';

export type SyncedMatchStatus = 'scheduled' | 'finished' | 'cancelled';
export type SyncedVotingStatus = 'closed' | 'open' | 'completed';
export type SyncedParticipationStatus = 'starter' | 'substitute_entered' | 'substitute_unused';

export interface SyncedTeam {
  externalId: string;
  name: string;
  shortName: string | null;
  country: string | null;
  logoUrl: string | null;
}

export interface SyncedFixture {
  externalFixtureId: string;
  externalStatus: string;
  status: SyncedMatchStatus;
  competition: string;
  seasonYear: number;
  matchDate: string;
  venue: string | null;
  homeTeam: SyncedTeam;
  awayTeam: SyncedTeam;
  opponent: SyncedTeam;
  isHome: boolean;
  manchesterUnitedScore: number | null;
  opponentScore: number | null;
}

export interface SyncedPlayer {
  externalPlayerId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  shirtNumber: number | null;
  position: string;
  photoUrl: string | null;
}

export interface SyncedLineupPlayer {
  player: SyncedPlayer;
  participationStatus: SyncedParticipationStatus;
  enteredMinute: number | null;
  exitedMinute: number | null;
  minutesPlayed: number;
  eligibleForRating: boolean;
}

export interface SyncedFixtureLineup {
  teamExternalId: string;
  starters: SyncedPlayer[];
  substitutes: SyncedPlayer[];
}

export interface SyncedFixtureEvent {
  elapsed: number | null;
  teamExternalId: string | null;
  playerExternalId: string | null;
  assistExternalId: string | null;
  type: string;
  detail: string | null;
}

export interface FootballSyncDifference {
  fixtureId: string;
  field: string;
  current: string | number | boolean | null;
  incoming: string | number | boolean | null;
}

export interface FootballSyncSummary {
  created: number;
  updated: number;
  unchanged: number;
  errors: number;
  differences: FootballSyncDifference[];
  lastSyncedAt: string;
}

export interface FootballIntegrationStatus {
  provider: FootballProviderName;
  manchesterUnitedExternalId: string | null;
  currentSeason: string | null;
  lastSynchronization: string | null;
  lastSuccess: string | null;
  lastError: string | null;
}
