export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export type VoteStatus = 'open' | 'closed' | 'finished';

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  shirtNumber: number;
  position: PlayerPosition;
  nationality: string;
  preferredFoot: 'left' | 'right';
  placeholderColor: string;
}

export interface Match {
  id: string;
  seasonId: string;
  competitionId: string;
  opponent: string;
  date: string;
  venue: string;
  homeAway: 'home' | 'away' | 'neutral';
  voteStatus: VoteStatus;
  unitedScore?: number;
  opponentScore?: number;
}

export interface MatchPlayer {
  id: string;
  matchId: string;
  playerId: string;
  position: PlayerPosition;
  starter: boolean;
  minutesPlayed: number;
}

export interface Vote {
  id: string;
  matchId: string;
  playerId: string;
  supporterId: string;
  rating: number;
  createdAt: string;
}

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
  competitionIds: string[];
}

export interface Competition {
  id: string;
  name: string;
  shortName: string;
  type: 'league' | 'cup' | 'europe';
}

export interface MatchResultRow {
  matchPlayer: MatchPlayer;
  player: Player;
  totalVotes: number;
  averageRating: number | null;
  isManOfTheMatch: boolean;
}

export interface SeasonPlayerStats {
  player: Player;
  rank: number;
  matchesPlayed: number;
  matchesRated: number;
  totalVotes: number;
  seasonAverage: number | null;
  manOfTheMatchAwards: number;
}
