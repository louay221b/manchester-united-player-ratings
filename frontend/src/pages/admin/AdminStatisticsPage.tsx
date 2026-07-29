import { useState } from 'react';

import { PageHeader } from '../../components/PageHeader';
import { RankingFilters } from '../../components/ranking/RankingFilters';
import { RankingTable } from '../../components/ranking/RankingTable';
import { SeasonSelector } from '../../components/ranking/SeasonSelector';
import { StatCard } from '../../components/StatCard';
import { useAdminSeasonStatistics } from '../../hooks/use-season-ranking';
import { useSeasons } from '../../hooks/use-seasons';
import { ApiError } from '../../lib/api';
import type {
  AdminStatisticsFilters,
  RankingFilters as RankingFiltersState,
} from '../../types/ranking';

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

export function AdminStatisticsPage() {
  const [manualSeasonId, setManualSeasonId] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminStatisticsFilters>({
    publishedOnly: false,
  });
  const seasonsQuery = useSeasons();
  const seasons = seasonsQuery.data ?? [];
  const defaultSeasonId =
    seasons.find((season) => season.status === 'active')?.id ?? seasons[0]?.id ?? '';
  const selectedSeasonId = manualSeasonId ?? defaultSeasonId;
  const statisticsQuery = useAdminSeasonStatistics(
    selectedSeasonId,
    filters,
    Boolean(selectedSeasonId),
  );
  const summary = statisticsQuery.data?.summary;
  const rankingRows = statisticsQuery.data?.ranking ?? [];

  const updateRankingFilters = (nextFilters: RankingFiltersState) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      ...nextFilters,
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Statistiques de la saison"
        description="Classement calcule depuis les votes reels, avec moyenne de saison par moyennes de match."
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SeasonSelector
          seasons={seasons}
          selectedSeasonId={selectedSeasonId}
          onChange={setManualSeasonId}
          isLoading={seasonsQuery.isLoading}
        />
        <div className="lg:flex-1">
          <RankingFilters
            filters={filters}
            onChange={updateRankingFilters}
            publishedOnly={filters.publishedOnly}
            onPublishedOnlyChange={(publishedOnly) =>
              setFilters((currentFilters) => ({
                ...currentFilters,
                publishedOnly,
              }))
            }
          />
        </div>
      </div>

      {!filters.publishedOnly ? (
        <div className="panel border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          Ces statistiques administrateur incluent les matchs dont les votes sont clotures, meme si
          les resultats ne sont pas encore publies.
        </div>
      ) : null}

      {seasonsQuery.isLoading || statisticsQuery.isLoading ? (
        <div className="panel p-6 text-sm font-semibold text-zinc-600">
          Chargement des statistiques...
        </div>
      ) : null}

      {seasonsQuery.isError || statisticsQuery.isError ? (
        <section className="panel border-red-200 bg-red-50 p-6">
          <p className="font-black text-red-800">Statistiques indisponibles</p>
          <p className="mt-2 text-sm text-red-700">
            {getErrorMessage(
              seasonsQuery.error ?? statisticsQuery.error,
              'Impossible de charger les statistiques.',
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              void seasonsQuery.refetch();
              void statisticsQuery.refetch();
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

      {summary ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Matchs totaux" value={summary.totalMatches} />
          <StatCard label="Matchs termines" value={summary.finishedMatches} />
          <StatCard label="Votes clotures" value={summary.matchesWithCompletedVoting} />
          <StatCard label="Resultats publies" value={summary.publishedMatches} />
          <StatCard label="Notes recues" value={summary.totalRatings} />
          <StatCard label="Utilisateurs ayant vote" value={summary.usersWhoVoted} />
          <StatCard label="Joueurs notes" value={summary.playersRated} />
        </section>
      ) : null}

      {statisticsQuery.data ? (
        <RankingTable
          rows={rankingRows}
          emptyMessage="Aucun joueur ne correspond aux filtres de statistiques."
        />
      ) : null}
    </div>
  );
}
