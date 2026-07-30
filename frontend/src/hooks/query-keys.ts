export const matchesQueryKey = ['matches'];
export const matchQueryKey = (matchId: string) => ['match', matchId];
export const matchLineupsQueryKey = ['match-lineup'];
export const matchLineupQueryKey = (matchId: string) => [...matchLineupsQueryKey, matchId];
export const votingMatchesQueryKey = ['voting-matches'];
export const votingMatchQueryKey = (matchId: string) => ['voting-match', matchId];
export const votingBallotQueryKey = (matchId: string) => ['voting-ballot', matchId];
export const matchResultsQueryKey = (matchId: string) => ['match-results', matchId];
export const adminMatchResultsQueryKey = (matchId: string) => ['admin-match-results', matchId];
export const rankingsQueryKey = ['rankings'];
export const activeSeasonRankingBaseQueryKey = [...rankingsQueryKey, 'active'];
export const activeSeasonRankingQueryKey = (filters: object) => [
  ...activeSeasonRankingBaseQueryKey,
  filters,
];
export const seasonRankingBaseQueryKey = (seasonId: string) => [
  ...rankingsQueryKey,
  'season',
  seasonId,
];
export const seasonRankingQueryKey = (seasonId: string, filters: object) => [
  ...seasonRankingBaseQueryKey(seasonId),
  filters,
];
export const adminStatisticsQueryKey = ['admin-statistics'];
export const adminSeasonStatisticsBaseQueryKey = (seasonId: string) => [
  ...adminStatisticsQueryKey,
  'season',
  seasonId,
];
export const adminSeasonStatisticsQueryKey = (seasonId: string, filters: object) => [
  ...adminSeasonStatisticsBaseQueryKey(seasonId),
  filters,
];
