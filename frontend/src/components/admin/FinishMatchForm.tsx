import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { FinishMatchPayload, Match } from '../../types/match';

interface FinishMatchFormProps {
  match: Match;
  isSubmitting: boolean;
  serverError?: string | null;
  onSubmit: (payload: FinishMatchPayload) => void;
  onCancel: () => void;
}

export function FinishMatchForm({
  match,
  isSubmitting,
  serverError,
  onSubmit,
  onCancel,
}: FinishMatchFormProps) {
  const { t } = useTranslation();
  const [manchesterUnitedScore, setManchesterUnitedScore] = useState('');
  const [opponentScore, setOpponentScore] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const unitedScore = Number(manchesterUnitedScore);
    const rivalScore = Number(opponentScore);

    if (
      !Number.isInteger(unitedScore) ||
      !Number.isInteger(rivalScore) ||
      unitedScore < 0 ||
      rivalScore < 0
    ) {
      setError(t('admin.matches.scoreValidation'));
      return;
    }

    setError(null);
    onSubmit({
      manchesterUnitedScore: unitedScore,
      opponentScore: rivalScore,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="panel space-y-4 border-amber-200 bg-amber-50 p-5">
      <div>
        <h2 className="text-xl font-black text-zinc-950">{t('admin.matches.finishTitle')}</h2>
        <p className="mt-1 text-sm font-semibold text-amber-800">{t('admin.matches.finishHelp')}</p>
        <p className="mt-1 text-sm text-zinc-600">Manchester United vs {match.opponentName}</p>
      </div>

      {error || serverError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error ?? serverError}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-bold text-zinc-700">
          Manchester United
          <input
            type="number"
            min="0"
            value={manchesterUnitedScore}
            onChange={(event) => setManchesterUnitedScore(event.target.value)}
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            disabled={isSubmitting}
          />
        </label>

        <label className="space-y-1 text-sm font-bold text-zinc-700">
          {match.opponentName}
          <input
            type="number"
            min="0"
            value={opponentScore}
            onChange={(event) => setOpponentScore(event.target.value)}
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            disabled={isSubmitting}
          />
        </label>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
          disabled={isSubmitting}
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('admin.matches.finishing') : t('admin.matches.finishSubmit')}
        </button>
      </div>
    </form>
  );
}
