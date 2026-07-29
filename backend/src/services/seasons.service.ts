import type { SupabaseClient } from '@supabase/supabase-js';

import { supabasePublicClient } from '../lib/supabase.js';
import type {
  CreateSeasonInput,
  SeasonStatus,
  UpdateSeasonInput,
} from '../schemas/seasons.schema.js';
import { HttpError } from '../utils/http-error.js';
import { createNotFoundError, mapSupabaseError } from '../utils/supabase-error.js';

interface SeasonRow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: SeasonStatus;
  created_at: string;
  updated_at: string;
}

interface SeasonDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SeasonStatus;
  createdAt: string;
  updatedAt: string;
}

const seasonFields = 'id, name, start_date, end_date, status, created_at, updated_at';

const mapSeasonRow = (season: SeasonRow): SeasonDto => ({
  id: season.id,
  name: season.name,
  startDate: season.start_date,
  endDate: season.end_date,
  status: season.status,
  createdAt: season.created_at,
  updatedAt: season.updated_at,
});

const mapCreateSeasonInput = (input: CreateSeasonInput) => ({
  name: input.name,
  start_date: input.startDate,
  end_date: input.endDate,
  status: input.status,
});

const mapUpdateSeasonInput = (input: UpdateSeasonInput) => ({
  ...(input.name === undefined ? {} : { name: input.name }),
  ...(input.startDate === undefined ? {} : { start_date: input.startDate }),
  ...(input.endDate === undefined ? {} : { end_date: input.endDate }),
  ...(input.status === undefined ? {} : { status: input.status }),
});

const ensureSeasonDateOrder = (startDate: string, endDate: string) => {
  if (endDate <= startDate) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'endDate must be after startDate', [
      {
        path: 'endDate',
        message: 'endDate must be after startDate',
      },
    ]);
  }
};

const getSeasonRowById = async (client: SupabaseClient, seasonId: string) => {
  const { data, error } = await client
    .from('seasons')
    .select(seasonFields)
    .eq('id', seasonId)
    .maybeSingle<SeasonRow>();

  if (error) {
    throw mapSupabaseError(error, 'Unable to fetch season');
  }

  if (!data) {
    throw createNotFoundError('Season');
  }

  return data;
};

export const listSeasons = async () => {
  const { data, error } = await supabasePublicClient
    .from('seasons')
    .select(seasonFields)
    .order('start_date', { ascending: false });

  if (error) {
    throw mapSupabaseError(error, 'Unable to fetch seasons');
  }

  return (data ?? []).map((season) => mapSeasonRow(season as SeasonRow));
};

export const getSeasonById = async (seasonId: string) => {
  const season = await getSeasonRowById(supabasePublicClient, seasonId);

  return mapSeasonRow(season);
};

export const createSeason = async (client: SupabaseClient, input: CreateSeasonInput) => {
  const { data, error } = await client
    .from('seasons')
    .insert(mapCreateSeasonInput(input))
    .select(seasonFields)
    .maybeSingle<SeasonRow>();

  if (error) {
    throw mapSupabaseError(error, 'Unable to create season');
  }

  if (!data) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'Season was not returned after creation');
  }

  return mapSeasonRow(data);
};

export const updateSeason = async (
  client: SupabaseClient,
  seasonId: string,
  input: UpdateSeasonInput,
) => {
  const existingSeason = await getSeasonRowById(client, seasonId);
  const nextStartDate = input.startDate ?? existingSeason.start_date;
  const nextEndDate = input.endDate ?? existingSeason.end_date;

  ensureSeasonDateOrder(nextStartDate, nextEndDate);

  const { data, error } = await client
    .from('seasons')
    .update(mapUpdateSeasonInput(input))
    .eq('id', seasonId)
    .select(seasonFields)
    .maybeSingle<SeasonRow>();

  if (error) {
    throw mapSupabaseError(error, 'Unable to update season');
  }

  if (!data) {
    throw createNotFoundError('Season');
  }

  return mapSeasonRow(data);
};

export const deleteSeason = async (client: SupabaseClient, seasonId: string) => {
  await getSeasonRowById(client, seasonId);

  const { count, error: matchesError } = await client
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('season_id', seasonId);

  if (matchesError) {
    throw mapSupabaseError(matchesError, 'Unable to verify season usage');
  }

  if ((count ?? 0) > 0) {
    throw new HttpError(
      409,
      'RESOURCE_IN_USE',
      'This season already contains matches and cannot be deleted',
    );
  }

  const { error } = await client.from('seasons').delete().eq('id', seasonId);

  if (error) {
    throw mapSupabaseError(error, 'Unable to delete season');
  }
};

export const activateSeason = async (client: SupabaseClient, seasonId: string) => {
  const { data, error } = await client.rpc('activate_season', {
    p_season_id: seasonId,
  });

  if (error) {
    throw mapSupabaseError(error, 'Unable to activate season');
  }

  const row = Array.isArray(data) ? (data[0] as SeasonRow | undefined) : (data as SeasonRow | null);

  if (!row) {
    throw createNotFoundError('Season');
  }

  return mapSeasonRow(row);
};
