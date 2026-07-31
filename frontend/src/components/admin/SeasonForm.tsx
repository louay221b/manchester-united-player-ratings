import type { TFunction } from 'i18next';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Season, SeasonPayload, SeasonStatus } from '../../types/season';

interface SeasonFormProps {
  initialSeason?: Season;
  submitLabel: string;
  isSubmitting: boolean;
  serverError?: string | null;
  onSubmit: (payload: SeasonPayload) => void;
  onCancel: () => void;
}

interface SeasonFormState {
  name: string;
  startDate: string;
  endDate: string;
  status: SeasonStatus;
}

const statusOptions: SeasonStatus[] = ['draft', 'active', 'closed'];

const validateSeasonForm = (form: SeasonFormState, t: TFunction<'common'>) => {
  const errors: Partial<Record<keyof SeasonFormState, string>> = {};

  if (!/^\d{4}\/\d{4}$/.test(form.name.trim())) {
    errors.name = t('admin.seasons.nameFormat');
  }

  if (!form.startDate) {
    errors.startDate = t('admin.seasons.startRequired');
  }

  if (!form.endDate) {
    errors.endDate = t('admin.seasons.endRequired');
  }

  if (form.startDate && form.endDate && form.endDate <= form.startDate) {
    errors.endDate = t('admin.seasons.endAfterStart');
  }

  return errors;
};

export function SeasonForm({
  initialSeason,
  submitLabel,
  isSubmitting,
  serverError,
  onSubmit,
  onCancel,
}: SeasonFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<SeasonFormState>({
    name: initialSeason?.name ?? '',
    startDate: initialSeason?.startDate ?? '',
    endDate: initialSeason?.endDate ?? '',
    status: initialSeason?.status ?? 'draft',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SeasonFormState, string>>>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateSeasonForm(form, t);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="panel space-y-4 p-5">
      <div>
        <h2 className="text-xl font-black text-zinc-950">
          {initialSeason ? t('admin.seasons.edit') : t('admin.seasons.create')}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">{t('admin.seasons.activeUnique')}</p>
      </div>

      {serverError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {serverError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-bold text-zinc-700">
          {t('admin.seasons.name')}
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            placeholder="2026/2027"
            disabled={isSubmitting}
          />
          {errors.name ? <span className="text-xs text-red-700">{errors.name}</span> : null}
        </label>

        <label className="space-y-1 text-sm font-bold text-zinc-700">
          {t('common.status')}
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({ ...current, status: event.target.value as SeasonStatus }))
            }
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            disabled={isSubmitting}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {t(`statuses.season.${status}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm font-bold text-zinc-700">
          {t('admin.seasons.startDate')}
          <input
            type="date"
            value={form.startDate}
            onChange={(event) =>
              setForm((current) => ({ ...current, startDate: event.target.value }))
            }
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            disabled={isSubmitting}
          />
          {errors.startDate ? (
            <span className="text-xs text-red-700">{errors.startDate}</span>
          ) : null}
        </label>

        <label className="space-y-1 text-sm font-bold text-zinc-700">
          {t('admin.seasons.endDate')}
          <input
            type="date"
            value={form.endDate}
            onChange={(event) =>
              setForm((current) => ({ ...current, endDate: event.target.value }))
            }
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            disabled={isSubmitting}
          />
          {errors.endDate ? <span className="text-xs text-red-700">{errors.endDate}</span> : null}
        </label>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
          disabled={isSubmitting}
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('common.saving') : submitLabel}
        </button>
      </div>
    </form>
  );
}
