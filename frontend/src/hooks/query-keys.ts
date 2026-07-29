export const matchesQueryKey = ['matches'];
export const matchQueryKey = (matchId: string) => ['match', matchId];
export const matchLineupQueryKey = (matchId: string) => ['match-lineup', matchId];
export const votingMatchesQueryKey = ['voting-matches'];
export const votingMatchQueryKey = (matchId: string) => ['voting-match', matchId];
export const votingBallotQueryKey = (matchId: string) => ['voting-ballot', matchId];
export const matchResultsQueryKey = (matchId: string) => ['match-results', matchId];
export const adminMatchResultsQueryKey = (matchId: string) => ['admin-match-results', matchId];
