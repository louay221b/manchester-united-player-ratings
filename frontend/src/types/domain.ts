export type MatchStatus = 'upcoming' | 'voting-open' | 'completed';

export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  id: string;
  name: string;
  shirtNumber: number;
  position: PlayerPosition;
  nationality: string;
}

export interface Match {
  id: string;
  opponent: string;
  competition: string;
  date: string;
  venue: string;
  status: MatchStatus;
  unitedScore?: number;
  opponentScore?: number;
  lineupPlayerIds: string[];
}

export interface PlayerMatchRating {
  matchId: string;
  playerId: string;
  averageRating: number;
  totalVotes: number;
  isManOfTheMatch?: boolean;
}

export interface PlayerSeasonStats {
  playerId: string;
  matchesPlayed: number;
  matchesRated: number;
  totalVotes: number;
  averageRating: number;
  manOfTheMatchAwards: number;
}

export interface Season {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'archived';
}
