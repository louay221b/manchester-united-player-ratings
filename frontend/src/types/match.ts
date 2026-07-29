import type { Season } from './season';

export type MatchStatus = 'scheduled' | 'finished' | 'cancelled';
export type VotingStatus = 'closed' | 'open' | 'completed';
export type ParticipationStatus = 'starter' | 'substitute_entered' | 'substitute_unused';

export interface Match {
  id: string;
  seasonId: string;
  opponentName: string;
  opponentLogoUrl: string | null;
  competition: string;
  matchDate: string;
  venue: string | null;
  isHome: boolean;
  manchesterUnitedScore: number | null;
  opponentScore: number | null;
  status: MatchStatus;
  votingStatus: VotingStatus;
  resultsPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MatchPlayerSummary {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  shirtNumber: number | null;
  position: string;
  photoUrl: string | null;
  active: boolean;
}

export interface MatchLineupPlayer {
  id: string;
  matchId: string;
  playerId: string;
  participationStatus: ParticipationStatus;
  enteredMinute: number | null;
  exitedMinute: number | null;
  minutesPlayed: number;
  eligibleForRating: boolean;
  createdAt: string;
  updatedAt: string;
  player: MatchPlayerSummary;
}

export interface MatchDetails extends Match {
  season: Season;
  lineup: MatchLineupPlayer[];
}

export interface MatchLineup {
  match: Match;
  players: MatchLineupPlayer[];
}

export interface MatchPayload {
  seasonId: string;
  opponentName: string;
  opponentLogoUrl: string | null;
  competition: string;
  matchDate: string;
  venue: string | null;
  isHome: boolean;
}

export interface MatchFilters {
  seasonId?: string;
  status?: MatchStatus;
  votingStatus?: VotingStatus;
  competition?: string;
  page: number;
  limit: number;
}

export interface MatchPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LineupPlayerPayload {
  playerId: string;
  participationStatus: ParticipationStatus;
  enteredMinute: number | null;
  exitedMinute: number | null;
  minutesPlayed: number;
  eligibleForRating: boolean;
}

export interface ReplaceLineupPayload {
  players: LineupPlayerPayload[];
}

export interface FinishMatchPayload {
  manchesterUnitedScore: number;
  opponentScore: number;
}

export interface FinishMatchResult {
  match: Match;
  eligiblePlayers: MatchLineupPlayer[];
}

export interface VotingMatchDetails {
  match: Match;
  eligiblePlayers: MatchLineupPlayer[];
}
