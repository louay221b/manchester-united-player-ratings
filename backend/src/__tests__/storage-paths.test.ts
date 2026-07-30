import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import { updateMatch } from '../services/matches.service.js';
import { updatePlayer } from '../services/players.service.js';

const playerId = '11111111-1111-4111-8111-111111111111';
const otherPlayerId = '22222222-2222-4222-8222-222222222222';
const matchId = '33333333-3333-4333-8333-333333333333';
const otherMatchId = '44444444-4444-4444-8444-444444444444';
const seasonId = '55555555-5555-4555-8555-555555555555';

const createQueryClient = (row: unknown) => {
  const query = {
    eq: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
    select: vi.fn(() => query),
  };

  return {
    from: vi.fn(() => query),
  } as unknown as SupabaseClient;
};

describe('storage path ownership safeguards', () => {
  it('rejects a player photo path scoped to another player', async () => {
    const client = createQueryClient({
      id: playerId,
      first_name: 'Kobbie',
      last_name: 'Mainoo',
      shirt_number: 37,
      position: 'Midfielder',
      photo_url: null,
      photo_path: null,
      active: true,
      joined_at: null,
      left_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    });

    await expect(
      updatePlayer(client, playerId, { photoPath: `${otherPlayerId}/photo.webp` }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('rejects an opponent logo path scoped to another match', async () => {
    const client = createQueryClient({
      id: matchId,
      season_id: seasonId,
      opponent_name: 'Liverpool',
      opponent_logo_url: null,
      opponent_logo_path: null,
      competition: 'Premier League',
      match_date: '2026-09-14T16:30:00.000Z',
      venue: 'Old Trafford',
      is_home: true,
      manchester_united_score: null,
      opponent_score: null,
      status: 'scheduled',
      voting_status: 'closed',
      results_published: false,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    });

    await expect(
      updateMatch(client, matchId, { opponentLogoPath: `${otherMatchId}/logo.png` }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });
});
