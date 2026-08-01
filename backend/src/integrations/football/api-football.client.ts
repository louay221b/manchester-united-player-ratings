import { z } from 'zod';

import { env } from '../../config/env.js';
import { HttpError } from '../../utils/http-error.js';
import {
  mapApiEvent,
  mapApiFixture,
  mapApiLineup,
  mapApiSquadPlayer,
  mapApiTeam,
} from './api-football.mapper.js';
import type { FootballProvider } from './football-provider.js';
import type {
  SyncedFixture,
  SyncedFixtureEvent,
  SyncedFixtureLineup,
  SyncedPlayer,
  SyncedTeam,
} from './football-sync.types.js';

const apiTeamSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    code: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    logo: z.string().nullable().optional(),
  })
  .passthrough();

const apiFixtureSchema = z
  .object({
    fixture: z
      .object({
        id: z.number(),
        date: z.string(),
        venue: z
          .object({
            name: z.string().nullable().optional(),
          })
          .nullable()
          .optional(),
        status: z
          .object({
            short: z.string().nullable().optional(),
            long: z.string().nullable().optional(),
          })
          .nullable()
          .optional(),
      })
      .passthrough(),
    league: z
      .object({
        name: z.string(),
        season: z.number(),
      })
      .passthrough(),
    teams: z
      .object({
        home: apiTeamSchema,
        away: apiTeamSchema,
      })
      .passthrough(),
    goals: z
      .object({
        home: z.number().nullable().optional(),
        away: z.number().nullable().optional(),
      })
      .nullable()
      .optional(),
  })
  .passthrough();

const apiLineupPlayerSchema = z
  .object({
    player: z
      .object({
        id: z.number(),
        name: z.string(),
        number: z.number().nullable().optional(),
        pos: z.string().nullable().optional(),
      })
      .passthrough(),
  })
  .passthrough();

const apiLineupSchema = z
  .object({
    team: apiTeamSchema,
    startXI: z.array(apiLineupPlayerSchema).optional(),
    substitutes: z.array(apiLineupPlayerSchema).optional(),
  })
  .passthrough();

const apiEventSchema = z
  .object({
    time: z
      .object({
        elapsed: z.number().nullable().optional(),
      })
      .nullable()
      .optional(),
    team: z
      .object({
        id: z.number().nullable().optional(),
      })
      .nullable()
      .optional(),
    player: z
      .object({
        id: z.number().nullable().optional(),
        name: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
    assist: z
      .object({
        id: z.number().nullable().optional(),
        name: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
    type: z.string().nullable().optional(),
    detail: z.string().nullable().optional(),
  })
  .passthrough();

const apiSquadPlayerSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    number: z.number().nullable().optional(),
    position: z.string().nullable().optional(),
    photo: z.string().nullable().optional(),
  })
  .passthrough();

const apiSquadSchema = z
  .object({
    team: apiTeamSchema,
    players: z.array(apiSquadPlayerSchema),
  })
  .passthrough();

const responseEnvelopeSchema = <T extends z.ZodType>(responseSchema: T) =>
  z
    .object({
      errors: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]).optional(),
      response: responseSchema,
    })
    .passthrough();

const delay = (milliseconds: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const hasApiErrors = (errors: unknown) => {
  if (Array.isArray(errors)) {
    return errors.length > 0;
  }

  if (errors && typeof errors === 'object') {
    return Object.keys(errors).length > 0;
  }

  return false;
};

interface ApiFootballClientOptions {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
  maxRetries?: number;
  manchesterUnitedExternalId?: string;
}

export class ApiFootballClient implements FootballProvider {
  public readonly name = 'api-football' as const;

  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly manchesterUnitedExternalId: string;

  constructor(options: ApiFootballClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? env.FOOTBALL_API_BASE_URL).replace(/\/$/, '');
    this.apiKey = options.apiKey ?? env.FOOTBALL_API_KEY;
    this.timeoutMs = options.timeoutMs ?? 10000;
    this.maxRetries = options.maxRetries ?? 2;
    this.manchesterUnitedExternalId =
      options.manchesterUnitedExternalId ?? env.MANCHESTER_UNITED_EXTERNAL_ID;

    if (!this.apiKey) {
      throw new HttpError(500, 'FOOTBALL_API_NOT_CONFIGURED', 'Football API key is not configured');
    }

    if (!this.manchesterUnitedExternalId) {
      throw new HttpError(
        500,
        'FOOTBALL_TEAM_NOT_CONFIGURED',
        'Manchester United external identifier is not configured',
      );
    }
  }

  private async request<T>(
    path: string,
    query: Record<string, string>,
    responseSchema: z.ZodType<T>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'x-apisports-key': this.apiKey,
          },
          signal: controller.signal,
        });

        if ((response.status === 429 || response.status >= 500) && attempt < this.maxRetries) {
          await delay(300 * 2 ** attempt);
          continue;
        }

        if (!response.ok) {
          throw new HttpError(
            response.status,
            response.status === 429 ? 'FOOTBALL_RATE_LIMITED' : 'FOOTBALL_PROVIDER_ERROR',
            response.status === 429
              ? 'Football provider rate limit reached'
              : 'Football provider request failed',
          );
        }

        const payload = await response.json();
        const parsedPayload = responseEnvelopeSchema(responseSchema).parse(payload);

       if (hasApiErrors(parsedPayload.errors)) {
  console.error('[api-football] Provider response errors', {
    errors: parsedPayload.errors,
    results: parsedPayload.results,
  });

  throw new HttpError(
    502,
    'FOOTBALL_PROVIDER_ERROR',
    'Football provider returned errors',
  );
}
        return parsedPayload.response;
      } catch (error) {
        if (error instanceof HttpError) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          await delay(300 * 2 ** attempt);
          continue;
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new HttpError(504, 'FOOTBALL_PROVIDER_TIMEOUT', 'Football provider timed out');
        }

        if (error instanceof z.ZodError) {
          throw new HttpError(
            502,
            'FOOTBALL_PROVIDER_INVALID_RESPONSE',
            'Football provider response is invalid',
          );
        }

        throw new HttpError(502, 'FOOTBALL_PROVIDER_ERROR', 'Football provider request failed');
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw new HttpError(502, 'FOOTBALL_PROVIDER_ERROR', 'Football provider request failed');
  }

  async getTeamById(teamId: string): Promise<SyncedTeam> {
    const teams = await this.request(
      '/teams',
      { id: teamId },
      z.array(z.object({ team: apiTeamSchema })),
    );
    const team = teams[0]?.team;

    if (!team) {
      throw new HttpError(404, 'FOOTBALL_TEAM_NOT_FOUND', 'Football team was not found');
    }

    return mapApiTeam(team);
  }

  async getTeamFixtures(teamId: string, season: string): Promise<SyncedFixture[]> {
    const fixtures = await this.request(
      '/fixtures',
      { team: teamId, season },
      z.array(apiFixtureSchema),
    );

    return fixtures.map((fixture) => mapApiFixture(fixture, this.manchesterUnitedExternalId));
  }

  async getFixtureById(fixtureId: string): Promise<SyncedFixture> {
    const fixtures = await this.request('/fixtures', { id: fixtureId }, z.array(apiFixtureSchema));
    const fixture = fixtures[0];

    if (!fixture) {
      throw new HttpError(404, 'FOOTBALL_FIXTURE_NOT_FOUND', 'Football fixture was not found');
    }

    return mapApiFixture(fixture, this.manchesterUnitedExternalId);
  }

  async getFixtureLineups(fixtureId: string): Promise<SyncedFixtureLineup[]> {
    const lineups = await this.request(
      '/fixtures/lineups',
      { fixture: fixtureId },
      z.array(apiLineupSchema),
    );

    return lineups.map(mapApiLineup);
  }

  async getFixtureEvents(fixtureId: string): Promise<SyncedFixtureEvent[]> {
    const events = await this.request(
      '/fixtures/events',
      { fixture: fixtureId },
      z.array(apiEventSchema),
    );

    return events.map(mapApiEvent);
  }

  async getCurrentSquad(teamId: string): Promise<SyncedPlayer[]> {
    const squads = await this.request('/players/squads', { team: teamId }, z.array(apiSquadSchema));

    return (squads[0]?.players ?? []).map(mapApiSquadPlayer);
  }
}
