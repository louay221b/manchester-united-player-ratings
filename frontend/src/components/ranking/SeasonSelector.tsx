import type { Season } from '../../types/season';

interface SeasonSelectorProps {
  seasons: Season[];
  selectedSeasonId: string;
  onChange: (seasonId: string) => void;
  isLoading?: boolean;
}

export function SeasonSelector({
  seasons,
  selectedSeasonId,
  onChange,
  isLoading = false,
}: SeasonSelectorProps) {
  return (
    <label className="panel flex flex-col gap-2 p-4 sm:max-w-xs">
      <span className="text-xs font-black uppercase tracking-wide text-zinc-500">Saison</span>
      <select
        value={selectedSeasonId}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading || seasons.length === 0}
        className="focus-ring rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-100"
      >
        {seasons.length === 0 ? <option value="">Aucune saison</option> : null}
        {seasons.map((season) => (
          <option key={season.id} value={season.id}>
            {season.name} {season.status === 'active' ? '(active)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
