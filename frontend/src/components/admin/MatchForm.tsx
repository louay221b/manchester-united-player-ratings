import type { FormEvent } from 'react';
import { useState } from 'react';

import type { Match, MatchPayload } from '../../types/match';
import type { Season } from '../../types/season';

interface MatchFormProps {
  seasons: Season[];
  initialMatch?: Match;
  submitLabel: string;
  isSubmitting: boolean;
  serverError?: string | null;
  onSubmit: (payload: MatchPayload) => void;
  onCancel: () => void;
}

interface MatchFormState {
  seasonId: string;
  opponentName: string;
  opponentLogoUrl: string;
  competition: string;
  matchDate: string;
  venue: string;
  isHome: boolean;
}

const toDatetimeLocal = (value?: string) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 16);
};

const toIsoDate = (value: string) => new Date(value).toISOString();

const isValidUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const validateMatchForm = (form: MatchFormState) => {
  const errors: Partial<Record<keyof MatchFormState, string>> = {};

  if (!form.seasonId) {
    errors.seasonId = 'Selectionne une saison.';
  }

  if (!form.opponentName.trim()) {
    errors.opponentName = 'L adversaire est obligatoire.';
  }

  if (!form.competition.trim()) {
    errors.competition = 'La competition est obligatoire.';
  }

  if (!form.matchDate || Number.isNaN(new Date(form.matchDate).getTime())) {
    errors.matchDate = 'La date du match est obligatoire.';
  }

  if (form.opponentLogoUrl.trim() && !isValidUrl(form.opponentLogoUrl.trim())) {
    errors.opponentLogoUrl = 'L URL du logo doit etre valide.';
  }

  return errors;
};

export function MatchForm({
  seasons,
  initialMatch,
  submitLabel,
  isSubmitting,
  serverError,
  onSubmit,
  onCancel,
}: MatchFormProps) {
  const activeSeason = seasons.find((season) => season.status === 'active') ?? seasons[0];
  const [form, setForm] = useState<MatchFormState>({
    seasonId: initialMatch?.seasonId ?? activeSeason?.id ?? '',
    opponentName: initialMatch?.opponentName ?? '',
    opponentLogoUrl: initialMatch?.opponentLogoUrl ?? '',
    competition: initialMatch?.competition ?? 'Premier League',
    matchDate: toDatetimeLocal(initialMatch?.matchDate),
    venue: initialMatch?.venue ?? '',
    isHome: initialMatch?.isHome ?? true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof MatchFormState, string>>>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateMatchForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      seasonId: form.seasonId,
      opponentName: form.opponentName.trim(),
      opponentLogoUrl: form.opponentLogoUrl.trim() || null,
      competition: form.competition.trim(),
      matchDate: toIsoDate(form.matchDate),
      venue: form.venue.trim() || null,
      isHome: form.isHome,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="panel space-y-4 p-5">
      <div>
        <h2 className="text-xl font-black text-zinc-950">
          {initialMatch ? 'Modifier le match' : 'Creer un match'}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">Manchester United reste l equipe principale.</p>
      </div>

      {serverError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {serverError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-bold text-zinc-700">
          Saison
          <select
            value={form.seasonId}
            onChange={(event) =>
              setForm((current) => ({ ...current, seasonId: event.target.value }))
            }
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            disabled={isSubmitting}
          >
            <option value="">Selectionner</option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
              </option>
            ))}
          </select>
          {errors.seasonId ? <span className="text-xs text-red-700">{errors.seasonId}</span> : null}
        </label>

        <label className="space-y-1 text-sm font-bold text-zinc-700">
          Competition
          <input
            value={form.competition}
            onChange={(event) =>
              setForm((current) => ({ ...current, competition: event.target.value }))
            }
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            disabled={isSubmitting}
          />
          {errors.competition ? (
            <span className="text-xs text-red-700">{errors.competition}</span>
          ) : null}
        </label>

        <label className="space-y-1 text-sm font-bold text-zinc-700">
          Adversaire
          <input
            value={form.opponentName}
            onChange={(event) =>
              setForm((current) => ({ ...current, opponentName: event.target.value }))
            }
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            disabled={isSubmitting}
          />
          {errors.opponentName ? (
            <span className="text-xs text-red-700">{errors.opponentName}</span>
          ) : null}
        </label>

        <label className="space-y-1 text-sm font-bold text-zinc-700">
          Date
          <input
            type="datetime-local"
            value={form.matchDate}
            onChange={(event) =>
              setForm((current) => ({ ...current, matchDate: event.target.value }))
            }
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            disabled={isSubmitting}
          />
          {errors.matchDate ? (
            <span className="text-xs text-red-700">{errors.matchDate}</span>
          ) : null}
        </label>

        <label className="space-y-1 text-sm font-bold text-zinc-700">
          Stade
          <input
            value={form.venue}
            onChange={(event) => setForm((current) => ({ ...current, venue: event.target.value }))}
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            placeholder="Old Trafford"
            disabled={isSubmitting}
          />
        </label>

        <label className="space-y-1 text-sm font-bold text-zinc-700">
          Logo adversaire
          <input
            value={form.opponentLogoUrl}
            onChange={(event) =>
              setForm((current) => ({ ...current, opponentLogoUrl: event.target.value }))
            }
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            placeholder="https://example.com/logo.png"
            disabled={isSubmitting}
          />
          {errors.opponentLogoUrl ? (
            <span className="text-xs text-red-700">{errors.opponentLogoUrl}</span>
          ) : null}
        </label>

        <label className="flex items-center gap-3 text-sm font-bold text-zinc-700">
          <input
            type="checkbox"
            checked={form.isHome}
            onChange={(event) =>
              setForm((current) => ({ ...current, isHome: event.target.checked }))
            }
            className="h-4 w-4 accent-united-red"
            disabled={isSubmitting}
          />
          Match a domicile
        </label>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
          disabled={isSubmitting}
        >
          Annuler
        </button>
        <button
          type="submit"
          className="rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enregistrement...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
