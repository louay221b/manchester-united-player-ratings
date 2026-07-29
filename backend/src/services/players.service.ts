import type { SupabaseClient } from '@supabase/supabase-js';

import { supabasePublicClient } from '../lib/supabase.js';
import type {
  CreatePlayerInput,
  PlayerQueryInput,
  PlayerStatusInput,
  UpdatePlayerInput,
} from '../schemas/players.schema.js';
import { HttpError } from '../utils/http-error.js';
import { createNotFoundError, mapSupabaseError } from '../utils/supabase-error.js';

interface PlayerRow {
  id: string;
  first_name: string;
  last_name: string;
  shirt_number: number | null;
  position: string;
  photo_url: string | null;
  active: boolean;
  joined_at: string | null;
  left_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PlayerDto {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  shirtNumber: number | null;
  position: string;
  photoUrl: string | null;
  active: boolean;
  joinedAt: string | null;
  leftAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const playerFields =
  'id, first_name, last_name, shirt_number, position, photo_url, active, joined_at, left_at, created_at, updated_at';

const mapPlayerRow = (player: PlayerRow): PlayerDto => ({
  id: player.id,
  firstName: player.first_name,
  lastName: player.last_name,
  displayName: `${player.first_name} ${player.last_name}`,
  shirtNumber: player.shirt_number,
  position: player.position,
  photoUrl: player.photo_url,
  active: player.active,
  joinedAt: player.joined_at,
  leftAt: player.left_at,
  createdAt: player.created_at,
  updatedAt: player.updated_at,
});

const mapCreatePlayerInput = (input: CreatePlayerInput) => ({
  first_name: input.firstName,
  last_name: input.lastName,
  shirt_number: input.shirtNumber,
  position: input.position,
  photo_url: input.photoUrl,
  active: input.active,
  joined_at: input.joinedAt,
  left_at: input.leftAt,
});

const mapUpdatePlayerInput = (input: UpdatePlayerInput) => ({
  ...(input.firstName === undefined ? {} : { first_name: input.firstName }),
  ...(input.lastName === undefined ? {} : { last_name: input.lastName }),
  ...(input.shirtNumber === undefined ? {} : { shirt_number: input.shirtNumber }),
  ...(input.position === undefined ? {} : { position: input.position }),
  ...(input.photoUrl === undefined ? {} : { photo_url: input.photoUrl }),
  ...(input.active === undefined ? {} : { active: input.active }),
  ...(input.joinedAt === undefined ? {} : { joined_at: input.joinedAt }),
  ...(input.leftAt === undefined ? {} : { left_at: input.leftAt }),
});

const ensurePlayerDateOrder = (joinedAt: string | null, leftAt: string | null) => {
  if (joinedAt && leftAt && leftAt < joinedAt) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'leftAt must not be before joinedAt', [
      {
        path: 'leftAt',
        message: 'leftAt must not be before joinedAt',
      },
    ]);
  }
};

const sanitizeSearch = (value: string) => value.replace(/[,%()]/g, ' ').trim();

const getPlayerRowById = async (client: SupabaseClient, playerId: string) => {
  const { data, error } = await client
    .from('players')
    .select(playerFields)
    .eq('id', playerId)
    .maybeSingle<PlayerRow>();

  if (error) {
    throw mapSupabaseError(error, 'Unable to fetch player');
  }

  if (!data) {
    throw createNotFoundError('Player');
  }

  return data;
};

export const listPlayers = async (filters: PlayerQueryInput) => {
  let query = supabasePublicClient.from('players').select(playerFields, {
    count: 'exact',
  });

  if (filters.search) {
    const search = sanitizeSearch(filters.search);

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }
  }

  if (filters.position) {
    query = query.eq('position', filters.position);
  }

  if (filters.active !== undefined) {
    query = query.eq('active', filters.active);
  }

  const from = (filters.page - 1) * filters.limit;
  const to = from + filters.limit - 1;
  const { data, error, count } = await query
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })
    .range(from, to);

  if (error) {
    throw mapSupabaseError(error, 'Unable to fetch players');
  }

  const total = count ?? 0;

  return {
    data: (data ?? []).map((player) => mapPlayerRow(player as PlayerRow)),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
};

export const getPlayerById = async (playerId: string) => {
  const player = await getPlayerRowById(supabasePublicClient, playerId);

  return mapPlayerRow(player);
};

export const createPlayer = async (client: SupabaseClient, input: CreatePlayerInput) => {
  const { data, error } = await client
    .from('players')
    .insert(mapCreatePlayerInput(input))
    .select(playerFields)
    .maybeSingle<PlayerRow>();

  if (error) {
    throw mapSupabaseError(error, 'Unable to create player');
  }

  if (!data) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'Player was not returned after creation');
  }

  return mapPlayerRow(data);
};

export const updatePlayer = async (
  client: SupabaseClient,
  playerId: string,
  input: UpdatePlayerInput,
) => {
  const existingPlayer = await getPlayerRowById(client, playerId);
  const nextJoinedAt = input.joinedAt === undefined ? existingPlayer.joined_at : input.joinedAt;
  const nextLeftAt = input.leftAt === undefined ? existingPlayer.left_at : input.leftAt;

  ensurePlayerDateOrder(nextJoinedAt, nextLeftAt);

  const { data, error } = await client
    .from('players')
    .update(mapUpdatePlayerInput(input))
    .eq('id', playerId)
    .select(playerFields)
    .maybeSingle<PlayerRow>();

  if (error) {
    throw mapSupabaseError(error, 'Unable to update player');
  }

  if (!data) {
    throw createNotFoundError('Player');
  }

  return mapPlayerRow(data);
};

export const updatePlayerStatus = async (
  client: SupabaseClient,
  playerId: string,
  input: PlayerStatusInput,
) => {
  const { data, error } = await client
    .from('players')
    .update({ active: input.active })
    .eq('id', playerId)
    .select(playerFields)
    .maybeSingle<PlayerRow>();

  if (error) {
    throw mapSupabaseError(error, 'Unable to update player status');
  }

  if (!data) {
    throw createNotFoundError('Player');
  }

  return mapPlayerRow(data);
};

export const deletePlayer = async (client: SupabaseClient, playerId: string) => {
  await getPlayerRowById(client, playerId);

  const { count, error: historyError } = await client
    .from('match_players')
    .select('id', { count: 'exact', head: true })
    .eq('player_id', playerId);

  if (historyError) {
    throw mapSupabaseError(historyError, 'Unable to verify player history');
  }

  if ((count ?? 0) > 0) {
    throw new HttpError(
      409,
      'RESOURCE_IN_USE',
      'This player has match history and should be deactivated instead of deleted',
    );
  }

  const { error } = await client.from('players').delete().eq('id', playerId);

  if (error) {
    throw mapSupabaseError(error, 'Unable to delete player');
  }
};
