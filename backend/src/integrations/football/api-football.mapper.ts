import type {
  SyncedFixture,
  SyncedFixtureEvent,
  SyncedFixtureLineup,
  SyncedLineupPlayer,
  SyncedPlayer,
  SyncedTeam,
  SyncedParticipationStatus,
  SyncedMatchStatus,
} from './football-sync.types.js';

interface ApiFootballTeam {
  id: number;
  name: string;
  code?: string | null;
  country?: string | null;
  logo?: string | null;
}

interface ApiFootballFixture {
  fixture: {
    id: number;
    date: string;
    venue?: {
      name?: string | null;
    } | null;
    status?: {
      short?: string | null;
      long?: string | null;
    } | null;
  };
  league: {
    name: string;
    season: number;
  };
  teams: {
    home: ApiFootballTeam;
    away: ApiFootballTeam;
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  } | null;
}

interface ApiFootballLineupPlayer {
  player: {
    id: number;
    name: string;
    number?: number | null;
    pos?: string | null;
  };
}

interface ApiFootballLineup {
  team: ApiFootballTeam;
  startXI?: ApiFootballLineupPlayer[];
  substitutes?: ApiFootballLineupPlayer[];
}

interface ApiFootballEvent {
  time?: {
    elapsed?: number | null;
  } | null;
  team?: {
    id?: number | null;
  } | null;
  player?: {
    id?: number | null;
    name?: string | null;
  } | null;
  assist?: {
    id?: number | null;
    name?: string | null;
  } | null;
  type?: string | null;
  detail?: string | null;
}

interface ApiFootballSquadPlayer {
  id: number;
  name: string;
  number?: number | null;
  position?: string | null;
  photo?: string | null;
}

const finishedStatuses = new Set(['FT', 'AET', 'PEN']);
const cancelledStatuses = new Set(['CANC', 'ABD', 'AWD', 'WO']);

const positionMap: Record<string, string> = {
  G: 'Goalkeeper',
  D: 'Defender',
  M: 'Midfielder',
  F: 'Forward',
};

const splitPlayerName = (name: string) => {
  const normalized = name.trim().replace(/\s+/g, ' ');
  const parts = normalized.split(' ');

  if (parts.length <= 1) {
    return {
      firstName: normalized,
      lastName: normalized,
    };
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1] ?? normalized,
  };
};

const toStringId = (id: number | string) => String(id);

export const normalizeClubName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(fc|cf|afc|club)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const mapApiTeam = (team: ApiFootballTeam): SyncedTeam => ({
  externalId: toStringId(team.id),
  name: team.name,
  shortName: team.code?.trim() || null,
  country: team.country?.trim() || null,
  logoUrl: team.logo?.trim() || null,
});

const mapFixtureStatus = (shortStatus: string | null | undefined): SyncedMatchStatus => {
  const normalizedStatus = shortStatus?.trim().toUpperCase() ?? '';

  if (finishedStatuses.has(normalizedStatus)) {
    return 'finished';
  }

  if (cancelledStatuses.has(normalizedStatus)) {
    return 'cancelled';
  }

  return 'scheduled';
};

export const mapApiFixture = (
  fixture: ApiFootballFixture,
  manchesterUnitedExternalId: string,
): SyncedFixture => {
  const homeTeam = mapApiTeam(fixture.teams.home);
  const awayTeam = mapApiTeam(fixture.teams.away);
  const isHome = homeTeam.externalId === manchesterUnitedExternalId;
  const opponent = isHome ? awayTeam : homeTeam;
  const homeScore = fixture.goals?.home ?? null;
  const awayScore = fixture.goals?.away ?? null;

  return {
    externalFixtureId: toStringId(fixture.fixture.id),
    externalStatus:
      fixture.fixture.status?.short?.trim() || fixture.fixture.status?.long?.trim() || 'unknown',
    status: mapFixtureStatus(fixture.fixture.status?.short),
    competition: fixture.league.name,
    seasonYear: fixture.league.season,
    matchDate: new Date(fixture.fixture.date).toISOString(),
    venue: fixture.fixture.venue?.name?.trim() || null,
    homeTeam,
    awayTeam,
    opponent,
    isHome,
    manchesterUnitedScore: isHome ? homeScore : awayScore,
    opponentScore: isHome ? awayScore : homeScore,
  };
};

export const mapApiSquadPlayer = (player: ApiFootballSquadPlayer): SyncedPlayer => {
  const { firstName, lastName } = splitPlayerName(player.name);
  const position = player.position?.trim() ?? '';
  const mappedPosition = positionMap[position] ?? positionMap[position.charAt(0)] ?? position;

  return {
    externalPlayerId: toStringId(player.id),
    firstName,
    lastName,
    displayName: player.name,
    shirtNumber: player.number ?? null,
    position: mappedPosition || 'Player',
    photoUrl: player.photo?.trim() || null,
  };
};

const mapLineupPlayer = (player: ApiFootballLineupPlayer): SyncedPlayer =>
  mapApiSquadPlayer({
    id: player.player.id,
    name: player.player.name,
    number: player.player.number ?? null,
    position: player.player.pos ?? null,
    photo: null,
  });

export const mapApiLineup = (lineup: ApiFootballLineup): SyncedFixtureLineup => ({
  teamExternalId: toStringId(lineup.team.id),
  starters: (lineup.startXI ?? []).map(mapLineupPlayer),
  substitutes: (lineup.substitutes ?? []).map(mapLineupPlayer),
});

export const mapApiEvent = (event: ApiFootballEvent): SyncedFixtureEvent => ({
  elapsed: event.time?.elapsed ?? null,
  teamExternalId:
    event.team?.id === null || event.team?.id === undefined ? null : toStringId(event.team.id),
  playerExternalId:
    event.player?.id === null || event.player?.id === undefined
      ? null
      : toStringId(event.player.id),
  assistExternalId:
    event.assist?.id === null || event.assist?.id === undefined
      ? null
      : toStringId(event.assist.id),
  type: event.type?.trim().toLowerCase() ?? '',
  detail: event.detail?.trim() || null,
});

export const buildManchesterUnitedLineup = (
  lineups: SyncedFixtureLineup[],
  events: SyncedFixtureEvent[],
  manchesterUnitedExternalId: string,
): SyncedLineupPlayer[] => {
  const lineup = lineups.find((item) => item.teamExternalId === manchesterUnitedExternalId);

  if (!lineup) {
    return [];
  }

  const rows = new Map<string, SyncedLineupPlayer>();

  lineup.starters.forEach((player) => {
    rows.set(player.externalPlayerId, {
      player,
      participationStatus: 'starter',
      enteredMinute: 0,
      exitedMinute: 90,
      minutesPlayed: 90,
      eligibleForRating: true,
    });
  });

  lineup.substitutes.forEach((player) => {
    rows.set(player.externalPlayerId, {
      player,
      participationStatus: 'substitute_unused',
      enteredMinute: null,
      exitedMinute: null,
      minutesPlayed: 0,
      eligibleForRating: false,
    });
  });

  events
    .filter(
      (event) =>
        event.teamExternalId === manchesterUnitedExternalId &&
        event.type === 'subst' &&
        event.elapsed !== null,
    )
    .forEach((event) => {
      const minute = Math.min(Math.max(event.elapsed ?? 0, 0), 130);

      if (event.playerExternalId) {
        const leavingPlayer = rows.get(event.playerExternalId);

        if (leavingPlayer) {
          leavingPlayer.exitedMinute = minute;
          leavingPlayer.minutesPlayed = Math.max(minute - (leavingPlayer.enteredMinute ?? 0), 0);
          leavingPlayer.eligibleForRating = leavingPlayer.minutesPlayed >= 10;
        }
      }

      if (event.assistExternalId) {
        const enteringPlayer = rows.get(event.assistExternalId);

        if (enteringPlayer) {
          enteringPlayer.participationStatus = 'substitute_entered';
          enteringPlayer.enteredMinute = minute;
          enteringPlayer.exitedMinute = 90;
          enteringPlayer.minutesPlayed = Math.max(90 - minute, 1);
          enteringPlayer.eligibleForRating = enteringPlayer.minutesPlayed >= 10;
        }
      }
    });

  return Array.from(rows.values()).map((row) => {
    const participationStatus: SyncedParticipationStatus = row.participationStatus;

    return {
      ...row,
      participationStatus,
      eligibleForRating: participationStatus !== 'substitute_unused' && row.minutesPlayed >= 10,
    };
  });
};
