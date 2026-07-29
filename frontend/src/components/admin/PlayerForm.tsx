import type { FormEvent } from 'react';
import { useState } from 'react';

import type { Player, PlayerPayload } from '../../types/player';

interface PlayerFormProps {
  initialPlayer?: Player;
  submitLabel: string;
  isSubmitting: boolean;
  serverError?: string | null;
  onSubmit: (payload: PlayerPayload) => void;
  onCancel: () => void;
}

interface PlayerFormState {
  firstName: string;
  lastName: string;
  shirtNumber: string;
  position: string;
  photoUrl: string;
  joinedAt: string;
  leftAt: string;
  active: boolean;
}

const isValidUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const validatePlayerForm = (form: PlayerFormState) => {
  const errors: Partial<Record<keyof PlayerFormState, string>> = {};

  if (!form.firstName.trim() || form.firstName.trim().length > 80) {
    errors.firstName = 'Le prenom doit contenir entre 1 et 80 caracteres.';
  }

  if (!form.lastName.trim() || form.lastName.trim().length > 80) {
    errors.lastName = 'Le nom doit contenir entre 1 et 80 caracteres.';
  }

  if (!form.position.trim() || form.position.trim().length > 80) {
    errors.position = 'Le poste doit contenir entre 1 et 80 caracteres.';
  }

  if (form.shirtNumber.trim()) {
    const shirtNumber = Number(form.shirtNumber);

    if (!Number.isInteger(shirtNumber) || shirtNumber < 1 || shirtNumber > 99) {
      errors.shirtNumber = 'Le numero doit etre compris entre 1 et 99.';
    }
  }

  if (form.photoUrl.trim() && !isValidUrl(form.photoUrl.trim())) {
    errors.photoUrl = 'L URL de photo doit etre valide.';
  }

  if (form.joinedAt && form.leftAt && form.leftAt < form.joinedAt) {
    errors.leftAt = 'La date de depart ne peut pas preceder la date d arrivee.';
  }

  return errors;
};

export function PlayerForm({
  initialPlayer,
  submitLabel,
  isSubmitting,
  serverError,
  onSubmit,
  onCancel,
}: PlayerFormProps) {
  const [form, setForm] = useState<PlayerFormState>({
    firstName: initialPlayer?.firstName ?? '',
    lastName: initialPlayer?.lastName ?? '',
    shirtNumber: initialPlayer?.shirtNumber ? String(initialPlayer.shirtNumber) : '',
    position: initialPlayer?.position ?? '',
    photoUrl: initialPlayer?.photoUrl ?? '',
    joinedAt: initialPlayer?.joinedAt ?? '',
    leftAt: initialPlayer?.leftAt ?? '',
    active: initialPlayer?.active ?? true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PlayerFormState, string>>>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validatePlayerForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      shirtNumber: form.shirtNumber.trim() ? Number(form.shirtNumber) : null,
      position: form.position.trim(),
      photoUrl: form.photoUrl.trim() || null,
      active: form.active,
      joinedAt: form.joinedAt || null,
      leftAt: form.leftAt || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="panel space-y-4 p-5">
      <div>
        <h2 className="text-xl font-black text-zinc-950">
          {initialPlayer ? 'Modifier le joueur' : 'Ajouter un joueur'}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">Aucun upload image pour cette etape.</p>
      </div>

      {serverError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {serverError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-bold text-zinc-700">
          Prenom
          <input
            value={form.firstName}
            onChange={(event) =>
              setForm((current) => ({ ...current, firstName: event.target.value }))
            }
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            disabled={isSubmitting}
          />
          {errors.firstName ? <span className="text-xs text-red-700">{errors.firstName}</span> : null}
        </label>

        <label className="space-y-1 text-sm font-bold text-zinc-700">
          Nom
          <input
            value={form.lastName}
            onChange={(event) =>
              setForm((current) => ({ ...current, lastName: event.target.value }))
            }
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            disabled={isSubmitting}
          />
          {errors.lastName ? <span className="text-xs text-red-700">{errors.lastName}</span> : null}
        </label>

        <label className="space-y-1 text-sm font-bold text-zinc-700">
          Numero
          <input
            type="number"
            min="1"
            max="99"
            value={form.shirtNumber}
            onChange={(event) =>
              setForm((current) => ({ ...current, shirtNumber: event.target.value }))
            }
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            disabled={isSubmitting}
          />
          {errors.shirtNumber ? (
            <span className="text-xs text-red-700">{errors.shirtNumber}</span>
          ) : null}
        </label>

        <label className="space-y-1 text-sm font-bold text-zinc-700">
          Poste
          <input
            value={form.position}
            onChange={(event) =>
              setForm((current) => ({ ...current, position: event.target.value }))
            }
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            placeholder="Midfielder"
            disabled={isSubmitting}
          />
          {errors.position ? <span className="text-xs text-red-700">{errors.position}</span> : null}
        </label>

        <label className="space-y-1 text-sm font-bold text-zinc-700 md:col-span-2">
          URL de photo
          <input
            value={form.photoUrl}
            onChange={(event) =>
              setForm((current) => ({ ...current, photoUrl: event.target.value }))
            }
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            placeholder="https://example.com/player.jpg"
            disabled={isSubmitting}
          />
          {errors.photoUrl ? <span className="text-xs text-red-700">{errors.photoUrl}</span> : null}
        </label>

        <label className="space-y-1 text-sm font-bold text-zinc-700">
          Date d arrivee
          <input
            type="date"
            value={form.joinedAt}
            onChange={(event) => setForm((current) => ({ ...current, joinedAt: event.target.value }))}
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            disabled={isSubmitting}
          />
        </label>

        <label className="space-y-1 text-sm font-bold text-zinc-700">
          Date de depart
          <input
            type="date"
            value={form.leftAt}
            onChange={(event) => setForm((current) => ({ ...current, leftAt: event.target.value }))}
            className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            disabled={isSubmitting}
          />
          {errors.leftAt ? <span className="text-xs text-red-700">{errors.leftAt}</span> : null}
        </label>

        <label className="flex items-center gap-3 text-sm font-bold text-zinc-700">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
            className="h-4 w-4 accent-united-red"
            disabled={isSubmitting}
          />
          Joueur actif
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
