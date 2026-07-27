import type { Match, Player, PlayerMatchRating, PlayerSeasonStats, Season } from '../types/domain';

export const UNITED_TEAM_NAME = 'Manchester United';

export const seasons: Season[] = [
  { id: '2026-2027', name: 'Saison 2026-2027', status: 'active' },
  { id: '2025-2026', name: 'Saison 2025-2026', status: 'archived' },
];

export const players: Player[] = [
  { id: 'onana', name: 'Andre Onana', shirtNumber: 24, position: 'GK', nationality: 'Cameroun' },
  { id: 'dalot', name: 'Diogo Dalot', shirtNumber: 20, position: 'DEF', nationality: 'Portugal' },
  { id: 'de-ligt', name: 'Matthijs de Ligt', shirtNumber: 4, position: 'DEF', nationality: 'Pays-Bas' },
  { id: 'yoro', name: 'Leny Yoro', shirtNumber: 15, position: 'DEF', nationality: 'France' },
  { id: 'shaw', name: 'Luke Shaw', shirtNumber: 23, position: 'DEF', nationality: 'Angleterre' },
  { id: 'ugarte', name: 'Manuel Ugarte', shirtNumber: 25, position: 'MID', nationality: 'Uruguay' },
  { id: 'mainoo', name: 'Kobbie Mainoo', shirtNumber: 37, position: 'MID', nationality: 'Angleterre' },
  { id: 'fernandes', name: 'Bruno Fernandes', shirtNumber: 8, position: 'MID', nationality: 'Portugal' },
  { id: 'garnacho', name: 'Alejandro Garnacho', shirtNumber: 17, position: 'FWD', nationality: 'Argentine' },
  { id: 'amad', name: 'Amad Diallo', shirtNumber: 16, position: 'FWD', nationality: 'Cote d Ivoire' },
  { id: 'hojlund', name: 'Rasmus Hojlund', shirtNumber: 9, position: 'FWD', nationality: 'Danemark' },
  { id: 'mount', name: 'Mason Mount', shirtNumber: 7, position: 'MID', nationality: 'Angleterre' },
];

export const matches: Match[] = [
  {
    id: 'mun-brighton-2026',
    opponent: 'Brighton & Hove Albion',
    competition: 'Premier League',
    date: '2026-08-15T16:30:00.000Z',
    venue: 'Old Trafford',
    status: 'voting-open',
    unitedScore: 2,
    opponentScore: 1,
    lineupPlayerIds: [
      'onana',
      'dalot',
      'de-ligt',
      'yoro',
      'shaw',
      'ugarte',
      'mainoo',
      'fernandes',
      'garnacho',
      'amad',
      'hojlund',
    ],
  },
  {
    id: 'mun-everton-2026',
    opponent: 'Everton',
    competition: 'Premier League',
    date: '2026-08-22T14:00:00.000Z',
    venue: 'Goodison Park',
    status: 'upcoming',
    lineupPlayerIds: [
      'onana',
      'dalot',
      'de-ligt',
      'shaw',
      'ugarte',
      'mainoo',
      'fernandes',
      'mount',
      'garnacho',
      'amad',
      'hojlund',
    ],
  },
  {
    id: 'mun-leeds-2026',
    opponent: 'Leeds United',
    competition: 'Premier League',
    date: '2026-08-08T12:30:00.000Z',
    venue: 'Old Trafford',
    status: 'completed',
    unitedScore: 3,
    opponentScore: 0,
    lineupPlayerIds: [
      'onana',
      'dalot',
      'de-ligt',
      'yoro',
      'shaw',
      'ugarte',
      'mainoo',
      'fernandes',
      'garnacho',
      'amad',
      'hojlund',
    ],
  },
];

export const matchRatings: PlayerMatchRating[] = [
  { matchId: 'mun-leeds-2026', playerId: 'onana', averageRating: 7.2, totalVotes: 1284 },
  { matchId: 'mun-leeds-2026', playerId: 'dalot', averageRating: 7.4, totalVotes: 1269 },
  { matchId: 'mun-leeds-2026', playerId: 'de-ligt', averageRating: 7.8, totalVotes: 1298 },
  { matchId: 'mun-leeds-2026', playerId: 'yoro', averageRating: 7.5, totalVotes: 1211 },
  { matchId: 'mun-leeds-2026', playerId: 'shaw', averageRating: 7.1, totalVotes: 1198 },
  { matchId: 'mun-leeds-2026', playerId: 'ugarte', averageRating: 7.6, totalVotes: 1265 },
  { matchId: 'mun-leeds-2026', playerId: 'mainoo', averageRating: 8.1, totalVotes: 1334 },
  {
    matchId: 'mun-leeds-2026',
    playerId: 'fernandes',
    averageRating: 8.7,
    totalVotes: 1412,
    isManOfTheMatch: true,
  },
  { matchId: 'mun-leeds-2026', playerId: 'garnacho', averageRating: 8.0, totalVotes: 1360 },
  { matchId: 'mun-leeds-2026', playerId: 'amad', averageRating: 7.7, totalVotes: 1304 },
  { matchId: 'mun-leeds-2026', playerId: 'hojlund', averageRating: 8.3, totalVotes: 1398 },
];

export const seasonStats: PlayerSeasonStats[] = [
  {
    playerId: 'fernandes',
    matchesPlayed: 38,
    matchesRated: 36,
    totalVotes: 42154,
    averageRating: 7.8,
    manOfTheMatchAwards: 8,
  },
  {
    playerId: 'mainoo',
    matchesPlayed: 34,
    matchesRated: 33,
    totalVotes: 38921,
    averageRating: 7.5,
    manOfTheMatchAwards: 5,
  },
  {
    playerId: 'hojlund',
    matchesPlayed: 32,
    matchesRated: 30,
    totalVotes: 35218,
    averageRating: 7.3,
    manOfTheMatchAwards: 4,
  },
  {
    playerId: 'de-ligt',
    matchesPlayed: 31,
    matchesRated: 29,
    totalVotes: 32774,
    averageRating: 7.1,
    manOfTheMatchAwards: 2,
  },
  {
    playerId: 'onana',
    matchesPlayed: 37,
    matchesRated: 35,
    totalVotes: 40110,
    averageRating: 6.9,
    manOfTheMatchAwards: 3,
  },
];

export const getPlayerById = (playerId: string) => players.find((player) => player.id === playerId);

export const getMatchById = (matchId: string) => matches.find((match) => match.id === matchId);

export const getLineupPlayers = (match: Match) =>
  match.lineupPlayerIds
    .map((playerId) => getPlayerById(playerId))
    .filter((player): player is Player => Boolean(player));

export const getRatingsForMatch = (matchId: string) =>
  matchRatings.filter((rating) => rating.matchId === matchId);

export const getStatsWithPlayers = () =>
  seasonStats
    .map((stats) => ({ ...stats, player: getPlayerById(stats.playerId) }))
    .filter((stats): stats is PlayerSeasonStats & { player: Player } => Boolean(stats.player));

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
