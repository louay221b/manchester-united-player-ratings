import type { TFunction } from 'i18next';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ImageUploadField } from '../forms/ImageUploadField';
import type { Match, MatchPayload } from '../../types/match';
import type { Season } from '../../types/season';

export interface MatchLogoChange {
  file: File | null;
  remove: boolean;
}

interface MatchFormProps {
  seasons: Season[];
  initialMatch?: Match;
  submitLabel: string;
  isSubmitting: boolean;
  isUploading?: boolean;
  serverError?: string | null;
  onSubmit: (payload: MatchPayload, logoChange: MatchLogoChange) => void;
  onCancel: () => void;
}

interface MatchFormState {
  seasonId: string;
  opponentName: string;
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

const validateMatchForm = (form: MatchFormState, t: TFunction<'common'>) => {
  const errors: Partial<Record<keyof MatchFormState, string>> = {};

  if (!form.seasonId) {
    errors.seasonId = t('admin.matches.selectSeason');
  }

  if (!form.opponentName.trim()) {
    errors.opponentName = t('admin.matches.opponentRequired');
  }

  if (!form.competition.trim()) {
    errors.competition = t('admin.matches.competitionRequired');
  }

  if (!form.matchDate || Number.isNaN(new Date(form.matchDate).getTime())) {
    errors.matchDate = t('admin.matches.dateRequired');
  }

  return errors;
};

export function MatchForm({
  seasons,
  initialMatch,
  submitLabel,
  isSubmitting,
  isUploading = false,
  serverError,
  onSubmit,
  onCancel,
}: MatchFormProps) {
  const { t } = useTranslation();
  const activeSeason = seasons.find((season) => season.status === 'active') ?? seasons[0];
  const [form, setForm] = useState<MatchFormState>({
    seasonId: initialMatch?.seasonId ?? activeSeason?.id ?? '',
    opponentName: initialMatch?.opponentName ?? '',
    competition: initialMatch?.competition ?? 'Premier League',
    matchDate: toDatetimeLocal(initialMatch?.matchDate),
    venue: initialMatch?.venue ?? '',
    isHome: initialMatch?.isHome ?? true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof MatchFormState, string>>>({});
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  const isBusy = isSubmitting || isUploading;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateMatchForm(form, t);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit(
      {
        seasonId: form.seasonId,
        opponentName: form.opponentName.trim(),
        opponentLogoUrl: initialMatch?.opponentLogoUrl ?? null,
        opponentLogoPath: initialMatch?.opponentLogoPath ?? null,
        competition: form.competition.trim(),
        matchDate: toIsoDate(form.matchDate),
        venue: form.venue.trim() || null,
        isHome: form.isHome,
      },
      {
        file: selectedLogoFile,
        remove: removeLogo,
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="panel space-y-4 p-5">
      <div>
        <h2 className="text-xl font-black text-zinc-950">
          {initialMatch ? t('admin.matches.edit') : t('admin.matches.create')}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">{t('admin.matches.mainTeamHelp')}</p>
      </div>

      {serverError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {serverError}
        </div>
      ) : null}

      <ImageUploadField
        label={t('admin.matches.opponentLogo')}
        currentImageUrl={initialMatch?.opponentLogoUrl ?? null}
        placeholderLabel={t('admin.matches.opponentLogoUnavailable')}
        imageAlt={t('imageUpload.opponentLogoAlt', {
          opponent: form.opponentName || t('admin.matches.opponent'),
        })}
        selectedFile={selectedLogoFile}
        removeRequested={removeLogo}
        isUploading={isUploading}
        disabled={isBusy}
        variant="logo"
        onFileChange={setSelectedLogoFile}
        onRemoveChange={setRemoveLogo}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-bold text-zinc-700">
          {t('common.season')}
          <select
            value={form.seasonId}
            onChange={(event) =>
              setForm((current) => ({ ...current, seasonId: event.target.value }))
            }
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            disabled={isBusy}
          >
            <option value="">{t('common.select')}</option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
              </option>
            ))}
          </select>
          {errors.seasonId ? <span className="text-xs text-red-700">{errors.seasonId}</span> : null}
        </label>

        <label className="space-y-1 text-sm font-bold text-zinc-700">
          {t('admin.matches.competition')}
          <input
            value={form.competition}
            onChange={(event) =>
              setForm((current) => ({ ...current, competition: event.target.value }))
            }
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            disabled={isBusy}
          />
          {errors.competition ? (
            <span className="text-xs text-red-700">{errors.competition}</span>
          ) : null}
        </label>

        <label className="space-y-1 text-sm font-bold text-zinc-700">
          {t('admin.matches.opponent')}
          <input
            value={form.opponentName}
            onChange={(event) =>
              setForm((current) => ({ ...current, opponentName: event.target.value }))
            }
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            disabled={isBusy}
          />
          {errors.opponentName ? (
            <span className="text-xs text-red-700">{errors.opponentName}</span>
          ) : null}
        </label>

        <label className="space-y-1 text-sm font-bold text-zinc-700">
          {t('admin.matches.date')}
          <input
            type="datetime-local"
            value={form.matchDate}
            onChange={(event) =>
              setForm((current) => ({ ...current, matchDate: event.target.value }))
            }
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            disabled={isBusy}
          />
          {errors.matchDate ? (
            <span className="text-xs text-red-700">{errors.matchDate}</span>
          ) : null}
        </label>

        <label className="space-y-1 text-sm font-bold text-zinc-700">
          {t('admin.matches.stadium')}
          <input
            value={form.venue}
            onChange={(event) => setForm((current) => ({ ...current, venue: event.target.value }))}
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            placeholder="Old Trafford"
            disabled={isBusy}
          />
        </label>

        <label className="flex items-center gap-3 text-sm font-bold text-zinc-700">
          <input
            type="checkbox"
            checked={form.isHome}
            onChange={(event) =>
              setForm((current) => ({ ...current, isHome: event.target.checked }))
            }
            className="h-4 w-4 accent-united-red"
            disabled={isBusy}
          />
          {t('admin.matches.homeMatch')}
        </label>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
          disabled={isBusy}
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          disabled={isBusy}
        >
          {isBusy ? t('common.saving') : submitLabel}
        </button>
      </div>
    </form>
  );
}
