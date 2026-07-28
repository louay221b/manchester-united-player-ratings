import type {
  Competition,
  Match,
  MatchPlayer,
  MatchResultRow,
  Player,
  Season,
  SeasonPlayerStats,
  Vote,
} from '../types';

export const UNITED_TEAM_NAME = 'Manchester United';

export const competitions: Competition[] = [
  { id: 'premier-league', name: 'Premier League', shortName: 'PL', type: 'league' },
  { id: 'fa-cup', name: 'FA Cup', shortName: 'FAC', type: 'cup' },
  { id: 'europa-league', name: 'Europa League', shortName: 'UEL', type: 'europe' },
];

export const seasons: Season[] = [
  {
    id: 'season-2026-2027',
    name: 'Saison 2026-2027',
    startDate: '2026-08-01',
    endDate: '2027-05-30',
    active: true,
    competitionIds: ['premier-league', 'fa-cup', 'europa-league'],
  },
];

export const players: Player[] = [
  {
    id: 'onana',
    firstName: 'Andre',
    lastName: 'Onana',
    displayName: 'Andre Onana',
    shirtNumber: 24,
    position: 'GK',
    nationality: 'Cameroun',
    preferredFoot: 'right',
    placeholderColor: 'bg-emerald-700',
  },
  {
    id: 'dalot',
    firstName: 'Diogo',
    lastName: 'Dalot',
    displayName: 'Diogo Dalot',
    shirtNumber: 20,
    position: 'DEF',
    nationality: 'Portugal',
    preferredFoot: 'right',
    placeholderColor: 'bg-sky-700',
  },
  {
    id: 'de-ligt',
    firstName: 'Matthijs',
    lastName: 'de Ligt',
    displayName: 'Matthijs de Ligt',
    shirtNumber: 4,
    position: 'DEF',
    nationality: 'Pays-Bas',
    preferredFoot: 'right',
    placeholderColor: 'bg-zinc-800',
  },
  {
    id: 'yoro',
    firstName: 'Leny',
    lastName: 'Yoro',
    displayName: 'Leny Yoro',
    shirtNumber: 15,
    position: 'DEF',
    nationality: 'France',
    preferredFoot: 'right',
    placeholderColor: 'bg-violet-700',
  },
  {
    id: 'shaw',
    firstName: 'Luke',
    lastName: 'Shaw',
    displayName: 'Luke Shaw',
    shirtNumber: 23,
    position: 'DEF',
    nationality: 'Angleterre',
    preferredFoot: 'left',
    placeholderColor: 'bg-teal-700',
  },
  {
    id: 'ugarte',
    firstName: 'Manuel',
    lastName: 'Ugarte',
    displayName: 'Manuel Ugarte',
    shirtNumber: 25,
    position: 'MID',
    nationality: 'Uruguay',
    preferredFoot: 'right',
    placeholderColor: 'bg-cyan-700',
  },
  {
    id: 'mainoo',
    firstName: 'Kobbie',
    lastName: 'Mainoo',
    displayName: 'Kobbie Mainoo',
    shirtNumber: 37,
    position: 'MID',
    nationality: 'Angleterre',
    preferredFoot: 'right',
    placeholderColor: 'bg-indigo-700',
  },
  {
    id: 'fernandes',
    firstName: 'Bruno',
    lastName: 'Fernandes',
    displayName: 'Bruno Fernandes',
    shirtNumber: 8,
    position: 'MID',
    nationality: 'Portugal',
    preferredFoot: 'right',
    placeholderColor: 'bg-united-red',
  },
  {
    id: 'mount',
    firstName: 'Mason',
    lastName: 'Mount',
    displayName: 'Mason Mount',
    shirtNumber: 7,
    position: 'MID',
    nationality: 'Angleterre',
    preferredFoot: 'right',
    placeholderColor: 'bg-lime-700',
  },
  {
    id: 'garnacho',
    firstName: 'Alejandro',
    lastName: 'Garnacho',
    displayName: 'Alejandro Garnacho',
    shirtNumber: 17,
    position: 'FWD',
    nationality: 'Argentine',
    preferredFoot: 'right',
    placeholderColor: 'bg-rose-700',
  },
  {
    id: 'amad',
    firstName: 'Amad',
    lastName: 'Diallo',
    displayName: 'Amad Diallo',
    shirtNumber: 16,
    position: 'FWD',
    nationality: 'Cote d Ivoire',
    preferredFoot: 'left',
    placeholderColor: 'bg-orange-700',
  },
  {
    id: 'hojlund',
    firstName: 'Rasmus',
    lastName: 'Hojlund',
    displayName: 'Rasmus Hojlund',
    shirtNumber: 9,
    position: 'FWD',
    nationality: 'Danemark',
    preferredFoot: 'left',
    placeholderColor: 'bg-red-800',
  },
];

export const matches: Match[] = [
  {
    id: 'mun-leeds-2026',
    seasonId: 'season-2026-2027',
    competitionId: 'premier-league',
    opponent: 'Leeds United',
    date: '2026-08-08T12:30:00.000Z',
    venue: 'Old Trafford',
    homeAway: 'home',
    voteStatus: 'finished',
    unitedScore: 3,
    opponentScore: 0,
  },
  {
    id: 'mun-brighton-2026',
    seasonId: 'season-2026-2027',
    competitionId: 'premier-league',
    opponent: 'Brighton & Hove Albion',
    date: '2026-08-15T16:30:00.000Z',
    venue: 'Old Trafford',
    homeAway: 'home',
    voteStatus: 'open',
    unitedScore: 2,
    opponentScore: 1,
  },
  {
    id: 'mun-everton-2026',
    seasonId: 'season-2026-2027',
    competitionId: 'premier-league',
    opponent: 'Everton',
    date: '2026-08-22T14:00:00.000Z',
    venue: 'Goodison Park',
    homeAway: 'away',
    voteStatus: 'closed',
    unitedScore: 1,
    opponentScore: 1,
  },
  {
    id: 'mun-celta-2026',
    seasonId: 'season-2026-2027',
    competitionId: 'europa-league',
    opponent: 'Celta Vigo',
    date: '2026-09-03T19:00:00.000Z',
    venue: 'Old Trafford',
    homeAway: 'home',
    voteStatus: 'open',
  },
];

const regularLineup = [
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
];

const evertonLineup = [
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
];

const celtaLineup = [
  'onana',
  'dalot',
  'yoro',
  'shaw',
  'ugarte',
  'mainoo',
  'fernandes',
  'mount',
  'garnacho',
  'amad',
  'hojlund',
];

const playerPosition = (playerId: string) => {
  const player = players.find((item) => item.id === playerId);
  if (!player) {
    throw new Error(`Unknown player ${playerId}`);
  }
  return player.position;
};

const buildLineup = (matchId: string, playerIds: string[]): MatchPlayer[] =>
  playerIds.map((playerId, index) => ({
    id: `${matchId}-${playerId}`,
    matchId,
    playerId,
    position: playerPosition(playerId),
    starter: index < 11,
    minutesPlayed: index < 9 ? 90 : 76,
  }));

export const matchPlayers: MatchPlayer[] = [
  ...buildLineup('mun-leeds-2026', regularLineup),
  ...buildLineup('mun-brighton-2026', regularLineup),
  ...buildLineup('mun-everton-2026', evertonLineup),
  ...buildLineup('mun-celta-2026', celtaLineup),
];

const createVotes = (
  matchId: string,
  playerId: string,
  ratings: number[],
  date = '2026-08-10T09:00:00.000Z',
): Vote[] =>
  ratings.map((rating, index) => ({
    id: `${matchId}-${playerId}-vote-${index + 1}`,
    matchId,
    playerId,
    supporterId: `supporter-${index + 1}`,
    rating,
    createdAt: date,
  }));

export const votes: Vote[] = [
  ...createVotes('mun-leeds-2026', 'onana', [7, 7.5, 7, 7.5, 7, 7.5]),
  ...createVotes('mun-leeds-2026', 'dalot', [7, 7.5, 7.5, 7, 7.5, 8]),
  ...createVotes('mun-leeds-2026', 'de-ligt', [8, 7.5, 8, 8, 7.5, 8.5]),
  ...createVotes('mun-leeds-2026', 'yoro', [7.5, 7.5, 8, 7, 7.5, 8]),
  ...createVotes('mun-leeds-2026', 'shaw', [7, 7, 7.5, 7, 7, 7.5]),
  ...createVotes('mun-leeds-2026', 'ugarte', [7.5, 8, 7.5, 7.5, 8, 7]),
  ...createVotes('mun-leeds-2026', 'mainoo', [8, 8.5, 8, 8.5, 8, 8]),
  ...createVotes('mun-leeds-2026', 'fernandes', [9, 8.5, 9, 9.5, 8.5, 9]),
  ...createVotes('mun-leeds-2026', 'garnacho', [8, 8, 8.5, 7.5, 8, 8]),
  ...createVotes('mun-leeds-2026', 'amad', [7.5, 8, 7.5, 8, 7.5, 8]),
  ...createVotes('mun-leeds-2026', 'hojlund', [8.5, 8, 8.5, 8, 8.5, 8.5]),
  ...createVotes('mun-brighton-2026', 'onana', [6.5, 7, 6.5, 7]),
  ...createVotes('mun-brighton-2026', 'dalot', [7, 7, 7.5, 7]),
  ...createVotes('mun-brighton-2026', 'de-ligt', [7.5, 7, 7.5, 8]),
  ...createVotes('mun-brighton-2026', 'yoro', [7, 7.5, 7, 7]),
  ...createVotes('mun-brighton-2026', 'shaw', [6.5, 7, 6.5, 7]),
  ...createVotes('mun-brighton-2026', 'ugarte', [7, 7.5, 7, 7.5]),
  ...createVotes('mun-brighton-2026', 'mainoo', [8, 8, 7.5, 8.5]),
  ...createVotes('mun-brighton-2026', 'fernandes', [8, 8.5, 8, 8.5]),
  ...createVotes('mun-brighton-2026', 'garnacho', [7.5, 8, 7.5, 8]),
  ...createVotes('mun-brighton-2026', 'amad', [8.5, 8.5, 8, 9]),
  ...createVotes('mun-brighton-2026', 'hojlund', [7.5, 8, 8, 7.5]),
  ...createVotes('mun-everton-2026', 'onana', [7.5, 7, 7.5, 7.5, 8]),
  ...createVotes('mun-everton-2026', 'dalot', [6.5, 7, 6.5, 7, 7]),
  ...createVotes('mun-everton-2026', 'de-ligt', [7, 7.5, 7, 7.5, 7]),
  ...createVotes('mun-everton-2026', 'shaw', [6.5, 6.5, 7, 6.5, 7]),
  ...createVotes('mun-everton-2026', 'ugarte', [7, 7, 7.5, 7, 7.5]),
  ...createVotes('mun-everton-2026', 'mainoo', [7.5, 7.5, 8, 7.5, 8]),
  ...createVotes('mun-everton-2026', 'fernandes', [7.5, 8, 7.5, 8, 7.5]),
  ...createVotes('mun-everton-2026', 'mount', [7, 7, 7.5, 7, 7]),
  ...createVotes('mun-everton-2026', 'garnacho', [6.5, 7, 7, 6.5, 7]),
  ...createVotes('mun-everton-2026', 'amad', [7, 7.5, 7, 7.5, 7]),
  ...createVotes('mun-everton-2026', 'hojlund', [7, 7, 7.5, 7, 7.5]),
];

export const activeSeason = seasons.find((season) => season.active) ?? seasons[0];

export const getCompetitionById = (competitionId: string) =>
  competitions.find((competition) => competition.id === competitionId);

export const getMatchById = (matchId: string) => matches.find((match) => match.id === matchId);

export const getPlayerById = (playerId: string) => players.find((player) => player.id === playerId);

export const getPlayerInitials = (player: Player) =>
  `${player.firstName.slice(0, 1)}${player.lastName.slice(0, 1)}`.toUpperCase();

export const getMatchPlayers = (matchId: string) =>
  matchPlayers.filter((matchPlayer) => matchPlayer.matchId === matchId);

export const getPlayersForMatch = (matchId: string) =>
  getMatchPlayers(matchId)
    .map((matchPlayer) => getPlayerById(matchPlayer.playerId))
    .filter((player): player is Player => Boolean(player));

export const getVotesForMatch = (matchId: string) =>
  votes.filter((vote) => vote.matchId === matchId);

export const getVotesForPlayerInMatch = (matchId: string, playerId: string) =>
  votes.filter((vote) => vote.matchId === matchId && vote.playerId === playerId);

export const average = (values: number[]) => {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const formatRating = (rating: number | null) => (rating === null ? '-' : rating.toFixed(1));

export const getMatchResultRows = (matchId: string): MatchResultRow[] => {
  const rows = getMatchPlayers(matchId)
    .map((matchPlayer) => {
      const player = getPlayerById(matchPlayer.playerId);
      if (!player) {
        return null;
      }

      const playerVotes = getVotesForPlayerInMatch(matchId, matchPlayer.playerId);
      return {
        matchPlayer,
        player,
        totalVotes: playerVotes.length,
        averageRating: average(playerVotes.map((vote) => vote.rating)),
        isManOfTheMatch: false,
      };
    })
    .filter((row): row is MatchResultRow => Boolean(row));

  const bestAverage = Math.max(
    ...rows.map((row) => row.averageRating ?? 0).filter((rating) => rating > 0),
    0,
  );

  return rows
    .map((row) => ({
      ...row,
      isManOfTheMatch: Boolean(row.averageRating && row.averageRating === bestAverage),
    }))
    .sort((first, second) => (second.averageRating ?? 0) - (first.averageRating ?? 0));
};

export const getSeasonPlayerStats = (seasonId = activeSeason.id): SeasonPlayerStats[] => {
  const seasonMatchIds = matches.filter((match) => match.seasonId === seasonId).map((match) => match.id);

  const stats = players.map((player) => {
    const playedMatchIds = new Set(
      matchPlayers
        .filter(
          (matchPlayer) =>
            matchPlayer.playerId === player.id &&
            seasonMatchIds.includes(matchPlayer.matchId) &&
            matchPlayer.minutesPlayed > 0,
        )
        .map((matchPlayer) => matchPlayer.matchId),
    );

    const perMatchAverages = Array.from(playedMatchIds)
      .map((matchId) =>
        average(getVotesForPlayerInMatch(matchId, player.id).map((vote) => vote.rating)),
      )
      .filter((rating): rating is number => rating !== null);

    const totalVotes = seasonMatchIds.reduce(
      (sum, matchId) => sum + getVotesForPlayerInMatch(matchId, player.id).length,
      0,
    );

    const manOfTheMatchAwards = seasonMatchIds.reduce((sum, matchId) => {
      const rows = getMatchResultRows(matchId);
      return sum + (rows.some((row) => row.player.id === player.id && row.isManOfTheMatch) ? 1 : 0);
    }, 0);

    return {
      player,
      rank: 0,
      matchesPlayed: playedMatchIds.size,
      matchesRated: perMatchAverages.length,
      totalVotes,
      seasonAverage: average(perMatchAverages),
      manOfTheMatchAwards,
    };
  });

  return stats
    .sort((first, second) => {
      const averageDiff = (second.seasonAverage ?? 0) - (first.seasonAverage ?? 0);
      if (averageDiff !== 0) {
        return averageDiff;
      }

      return second.totalVotes - first.totalVotes;
    })
    .map((stat, index) => ({ ...stat, rank: index + 1 }));
};

export const getPlayerSeasonStats = (playerId: string) =>
  getSeasonPlayerStats().find((stat) => stat.player.id === playerId);

export const getRecentResultsForPlayer = (playerId: string) =>
  matches
    .map((match) => {
      const row = getMatchResultRows(match.id).find((result) => result.player.id === playerId);
      return row ? { match, result: row } : null;
    })
    .filter((item): item is { match: Match; result: MatchResultRow } => Boolean(item));

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));

export const formatScore = (match: Match) => {
  if (match.unitedScore === undefined || match.opponentScore === undefined) {
    return 'A venir';
  }

  return `${match.unitedScore} - ${match.opponentScore}`;
};
