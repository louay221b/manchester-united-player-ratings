import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  buildManchesterUnitedLineup,
  normalizeClubName,
} from '../integrations/football/api-football.mapper.js';
import type {
  SyncedFixtureEvent,
  SyncedFixtureLineup,
} from '../integrations/football/football-sync.types.js';
import { cronFootballSyncSchema } from '../schemas/football.schema.js';

const externalSyncMigrationPath = fileURLToPath(
  new URL('../../../supabase/migrations/010_football_external_sync.sql', import.meta.url),
);
const cronMigrationPath = fileURLToPath(
  new URL('../../../supabase/migrations/011_football_cron_documentation.sql', import.meta.url),
);
const frontendSourcePath = fileURLToPath(new URL('../../../frontend/src', import.meta.url));

const externalSyncMigrationSql = readFileSync(externalSyncMigrationPath, 'utf8');
const cronMigrationSql = readFileSync(cronMigrationPath, 'utf8');

const readTextFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return readTextFiles(path);
    }

    if (!/\.(ts|tsx|js|jsx|json|css|html)$/i.test(entry)) {
      return [];
    }

    return readFileSync(path, 'utf8');
  });

describe('football external sync migration', () => {
  it('adds external identifiers with partial uniqueness for idempotent imports', () => {
    expect(externalSyncMigrationSql).toContain('create table if not exists public.clubs');
    expect(externalSyncMigrationSql).toContain('add column if not exists external_fixture_id text');
    expect(externalSyncMigrationSql).toContain('add column if not exists external_player_id text');
    expect(externalSyncMigrationSql).toContain('clubs_external_provider_external_id_unique');
    expect(externalSyncMigrationSql).toContain('matches_external_provider_fixture_id_unique');
    expect(externalSyncMigrationSql).toContain('players_external_provider_player_id_unique');
  });

  it('documents cron jobs without committing a real secret', () => {
    expect(cronMigrationSql).toContain('/api/internal/football/sync');
    expect(cronMigrationSql).toContain('{"mode":"fixtures"}');
    expect(cronMigrationSql).toContain('{"mode":"live"}');
    expect(cronMigrationSql).toContain('Supabase Vault');
  });
});

describe('football synchronization mapping', () => {
  it('normalizes club names for fallback duplicate detection', () => {
    expect(normalizeClubName('Atlético Madrid FC')).toBe('atletico madrid');
    expect(normalizeClubName('Atletico Madrid')).toBe('atletico madrid');
  });

  it('maps starters, used substitutes and unused substitutes from events', () => {
    const lineups: SyncedFixtureLineup[] = [
      {
        teamExternalId: '33',
        starters: [
          {
            externalPlayerId: '8',
            firstName: 'Bruno',
            lastName: 'Fernandes',
            displayName: 'Bruno Fernandes',
            shirtNumber: 8,
            position: 'Midfielder',
            photoUrl: null,
          },
        ],
        substitutes: [
          {
            externalPlayerId: '17',
            firstName: 'Alejandro',
            lastName: 'Garnacho',
            displayName: 'Alejandro Garnacho',
            shirtNumber: 17,
            position: 'Forward',
            photoUrl: null,
          },
          {
            externalPlayerId: '24',
            firstName: 'Andre',
            lastName: 'Onana',
            displayName: 'Andre Onana',
            shirtNumber: 24,
            position: 'Goalkeeper',
            photoUrl: null,
          },
        ],
      },
    ];
    const events: SyncedFixtureEvent[] = [
      {
        elapsed: 65,
        teamExternalId: '33',
        playerExternalId: '8',
        assistExternalId: '17',
        type: 'subst',
        detail: null,
      },
    ];

    const lineup = buildManchesterUnitedLineup(lineups, events, '33');
    const starter = lineup.find((player) => player.player.externalPlayerId === '8');
    const usedSubstitute = lineup.find((player) => player.player.externalPlayerId === '17');
    const unusedSubstitute = lineup.find((player) => player.player.externalPlayerId === '24');

    expect(starter).toMatchObject({
      participationStatus: 'starter',
      exitedMinute: 65,
      minutesPlayed: 65,
      eligibleForRating: true,
    });
    expect(usedSubstitute).toMatchObject({
      participationStatus: 'substitute_entered',
      enteredMinute: 65,
      minutesPlayed: 25,
      eligibleForRating: true,
    });
    expect(unusedSubstitute).toMatchObject({
      participationStatus: 'substitute_unused',
      minutesPlayed: 0,
      eligibleForRating: false,
    });
  });
});

describe('football synchronization safeguards', () => {
  it('validates cron mode payloads', () => {
    expect(() => cronFootballSyncSchema.parse({ mode: 'fixtures' })).not.toThrow();
    expect(() => cronFootballSyncSchema.parse({ mode: 'live' })).not.toThrow();
    expect(() => cronFootballSyncSchema.parse({ mode: 'season' })).toThrow();
  });

  it('keeps football provider secrets out of frontend source files', () => {
    const frontendSource = readTextFiles(frontendSourcePath).join('\n');

    expect(frontendSource).not.toContain(`FOOTBALL_${'API_KEY'}`);
    expect(frontendSource).not.toContain(`x-${'apisports'}-key`);
    expect(frontendSource).not.toContain(`CRON_${'SYNC_SECRET'}`);
  });
});
