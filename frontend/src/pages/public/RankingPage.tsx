import { useState } from 'react';

import { PageHeader } from '../../components/PageHeader';
import { RankingFilters } from '../../components/ranking/RankingFilters';
import { RankingPodium } from '../../components/ranking/RankingPodium';
import { RankingTable } from '../../components/ranking/RankingTable';
import { SeasonSelector } from '../../components/ranking/SeasonSelector';
import { useSeasonRanking } from '../../hooks/use-season-ranking';
import { useSeasons } from '../../hooks/use-seasons';
import { ApiError } from '../../lib/api';
import type { RankingFilters as RankingFiltersState } from '../../types/ranking';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

export function RankingPage() {
  const [manualSeasonId, setManualSeasonId] = useState<string | null>(null);
  const [filters, setFilters] = useState<RankingFiltersState>({});
  const seasonsQuery = useSeasons();
  const seasons = seasonsQuery.data ?? [];
  const defaultSeasonId =
    seasons.find((season) => season.status === 'active')?.id ?? seasons[0]?.id ?? '';
  const selectedSeasonId = manualSeasonId ?? defaultSeasonId;
  const rankingQuery = useSeasonRanking(selectedSeasonId, filters, Boolean(selectedSeasonId));
  const rankingRows = rankingQuery.data?.ranking ?? [];
  const hasRatedRows = rankingRows.some((row) => row.seasonAverage !== null);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Classement"
        title="Classement de la saison"
        description="La moyenne saisonniere est la moyenne des notes moyennes obtenues match par match."
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SeasonSelector
          seasons={seasons}
          selectedSeasonId={selectedSeasonId}
          onChange={setManualSeasonId}
          isLoading={seasonsQuery.isLoading}
        />
        <div className="lg:flex-1">
          <RankingFilters filters={filters} onChange={setFilters} showActiveFilter />
        </div>
      </div>

      {seasonsQuery.isLoading || rankingQuery.isLoading ? (
        <div className="panel p-6 text-sm font-semibold text-zinc-600">
          Chargement du classement...
        </div>
      ) : null}

      {seasonsQuery.isError || rankingQuery.isError ? (
        <section className="panel border-red-200 bg-red-50 p-6">
          <p className="font-black text-red-800">Classement indisponible</p>
          <p className="mt-2 text-sm text-red-700">
            {getErrorMessage(
              seasonsQuery.error ?? rankingQuery.error,
              'Impossible de charger le classement.',
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              void seasonsQuery.refetch();
              void rankingQuery.refetch();
            }}
            className="mt-4 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
          >
            Reessayer
          </button>
        </section>
      ) : null}

      {!seasonsQuery.isLoading && seasons.length === 0 ? (
        <div className="panel p-6 text-sm font-semibold text-zinc-600">
          Aucune saison n est encore disponible.
        </div>
      ) : null}

      {!rankingQuery.isLoading && rankingQuery.data && rankingRows.length > 0 && !hasRatedRows ? (
        <div className="panel p-6 text-sm font-semibold text-zinc-600">
          Aucun resultat n est encore publie pour cette saison.
        </div>
      ) : null}

      {!rankingQuery.isLoading && rankingQuery.data && hasRatedRows ? (
        <>
          <RankingPodium rows={rankingRows} />
          <RankingTable rows={rankingRows} />
        </>
      ) : null}

      {!rankingQuery.isLoading && rankingQuery.data && rankingRows.length === 0 ? (
        <RankingTable rows={[]} />
      ) : null}
    </div>
  );
}
