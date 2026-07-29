import type { SeasonStatus } from './season';

export interface RankingSeason {
  id: string;
  name: string;
  status: SeasonStatus;
}

export interface SeasonRankingRow {
  rank: number;
  playerId: string;
  firstName: string;
  lastName: string;
  shirtNumber: number | null;
  position: string;
  photoUrl: string | null;
  active: boolean;
  matchesPlayed: number;
  ratedMatches: number;
  totalVotes: number;
  seasonAverage: number | null;
  manOfTheMatchCount: number;
}

export interface SeasonRanking {
  season: RankingSeason | null;
  ranking: SeasonRankingRow[];
}

export interface RankingFilters {
  search?: string;
  position?: string;
  active?: boolean;
  minMatches?: number;
}

export interface AdminStatisticsSummary {
  seasonId: string;
  seasonName: string;
  seasonStatus: SeasonStatus;
  publishedOnly: boolean;
  totalMatches: number;
  finishedMatches: number;
  matchesWithCompletedVoting: number;
  publishedMatches: number;
  totalRatings: number;
  usersWhoVoted: number;
  playersRated: number;
}

export interface AdminSeasonStatistics extends SeasonRanking {
  season: RankingSeason;
  summary: AdminStatisticsSummary;
}

export interface AdminStatisticsFilters extends RankingFilters {
  publishedOnly: boolean;
}
