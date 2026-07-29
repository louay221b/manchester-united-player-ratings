import type { RankingFilters as RankingFiltersState } from '../../types/ranking';

interface RankingFiltersProps {
  filters: RankingFiltersState;
  onChange: (filters: RankingFiltersState) => void;
  showActiveFilter?: boolean;
  publishedOnly?: boolean;
  onPublishedOnlyChange?: (publishedOnly: boolean) => void;
}

const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

export function RankingFilters({
  filters,
  onChange,
  showActiveFilter = false,
  publishedOnly,
  onPublishedOnlyChange,
}: RankingFiltersProps) {
  const updateFilter = (nextFilters: Partial<RankingFiltersState>) => {
    onChange({
      ...filters,
      ...nextFilters,
    });
  };

  return (
    <section className="panel grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
      <label className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wide text-zinc-500">Joueur</span>
        <input
          type="search"
          value={filters.search ?? ''}
          onChange={(event) => updateFilter({ search: event.target.value })}
          placeholder="Rechercher un joueur"
          className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wide text-zinc-500">Poste</span>
        <select
          value={filters.position ?? ''}
          onChange={(event) => updateFilter({ position: event.target.value || undefined })}
          className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">Tous les postes</option>
          {positions.map((position) => (
            <option key={position} value={position}>
              {position}
            </option>
          ))}
        </select>
      </label>

      {showActiveFilter ? (
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-500">Statut</span>
          <select
            value={filters.active === undefined ? 'all' : String(filters.active)}
            onChange={(event) => {
              const value = event.target.value;
              updateFilter({
                active: value === 'all' ? undefined : value === 'true',
              });
            }}
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="all">Tous les joueurs</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </select>
        </label>
      ) : null}

      <label className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wide text-zinc-500">Minimum MJ</span>
        <input
          type="number"
          min={0}
          value={filters.minMatches ?? ''}
          onChange={(event) => {
            const parsedValue = Number.parseInt(event.target.value, 10);
            updateFilter({
              minMatches:
                event.target.value === '' || Number.isNaN(parsedValue) ? undefined : parsedValue,
            });
          }}
          className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>

      {onPublishedOnlyChange ? (
        <label className="flex items-center gap-3 rounded-md border border-zinc-200 px-3 py-2">
          <input
            type="checkbox"
            checked={Boolean(publishedOnly)}
            onChange={(event) => onPublishedOnlyChange(event.target.checked)}
            className="h-4 w-4 accent-united-red"
          />
          <span className="text-sm font-bold text-zinc-700">Resultats publies uniquement</span>
        </label>
      ) : null}
    </section>
  );
}
