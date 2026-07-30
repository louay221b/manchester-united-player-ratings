import { describe, expect, it } from 'vitest';

import {
  createMatchSchema,
  finishMatchSchema,
  updateMatchSchema,
} from '../schemas/matches.schema.js';
import { createPlayerSchema, updatePlayerSchema } from '../schemas/players.schema.js';
import { createSeasonSchema } from '../schemas/seasons.schema.js';
import { submitBallotSchema } from '../schemas/voting.schema.js';

const playerId = '11111111-1111-4111-8111-111111111111';
const secondPlayerId = '22222222-2222-4222-8222-222222222222';
const seasonId = '33333333-3333-4333-8333-333333333333';

describe('business validation schemas', () => {
  it('accepts a valid season and rejects an invalid date order', () => {
    expect(() =>
      createSeasonSchema.parse({
        name: '2026/2027',
        startDate: '2026-08-01',
        endDate: '2027-05-31',
        status: 'active',
      }),
    ).not.toThrow();

    expect(() =>
      createSeasonSchema.parse({
        name: '2026/2027',
        startDate: '2027-05-31',
        endDate: '2026-08-01',
        status: 'active',
      }),
    ).toThrow();
  });

  it('rejects a player whose leaving date is before his joining date', () => {
    expect(() =>
      createPlayerSchema.parse({
        firstName: 'Bruno',
        lastName: 'Fernandes',
        shirtNumber: 8,
        position: 'Midfielder',
        photoUrl: null,
        active: true,
        joinedAt: '2026-08-01',
        leftAt: '2026-07-31',
      }),
    ).toThrow();
  });

  it('accepts a scheduled match payload and a finish-match payload', () => {
    expect(() =>
      createMatchSchema.parse({
        seasonId,
        opponentName: 'Liverpool',
        opponentLogoUrl: null,
        competition: 'Premier League',
        matchDate: '2026-09-14T16:30:00.000Z',
        venue: 'Old Trafford',
        isHome: true,
      }),
    ).not.toThrow();

    expect(() =>
      finishMatchSchema.parse({
        manchesterUnitedScore: 2,
        opponentScore: 1,
      }),
    ).not.toThrow();
  });

  it('rejects storage paths on create and unsafe paths on update', () => {
    expect(() =>
      createPlayerSchema.parse({
        firstName: 'Bruno',
        lastName: 'Fernandes',
        shirtNumber: 8,
        position: 'Midfielder',
        photoUrl: null,
        photoPath: `${playerId}/photo.webp`,
        active: true,
        joinedAt: '2026-08-01',
        leftAt: null,
      }),
    ).toThrow();

    expect(() =>
      updatePlayerSchema.parse({
        photoPath: '../private/photo.webp',
      }),
    ).toThrow();

    expect(() =>
      createMatchSchema.parse({
        seasonId,
        opponentName: 'Liverpool',
        opponentLogoUrl: null,
        opponentLogoPath: `${playerId}/logo.png`,
        competition: 'Premier League',
        matchDate: '2026-09-14T16:30:00.000Z',
        venue: 'Old Trafford',
        isHome: true,
      }),
    ).toThrow();

    expect(() =>
      updateMatchSchema.parse({
        opponentLogoPath: '/logos/liverpool.png',
      }),
    ).toThrow();
  });

  it('rejects duplicate ballot players and invalid rating steps', () => {
    expect(() =>
      submitBallotSchema.parse({
        ratings: [
          { playerId, rating: 7.5 },
          { playerId, rating: 8 },
        ],
        manOfTheMatchPlayerId: playerId,
      }),
    ).toThrow();

    expect(() =>
      submitBallotSchema.parse({
        ratings: [
          { playerId, rating: 7.25 },
          { playerId: secondPlayerId, rating: 8 },
        ],
        manOfTheMatchPlayerId: secondPlayerId,
      }),
    ).toThrow();
  });
});
