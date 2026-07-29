import { Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { SeasonForm } from '../../components/admin/SeasonForm';
import { PageHeader } from '../../components/PageHeader';
import { useSeasonMutations, useSeasons } from '../../hooks/use-seasons';
import { ApiError } from '../../lib/api';
import type { Season, SeasonPayload, SeasonStatus } from '../../types/season';

interface Notification {
  type: 'success' | 'error';
  message: string;
}

const statusLabels: Record<SeasonStatus, string> = {
  draft: 'Brouillon',
  active: 'Active',
  closed: 'Fermee',
};

const statusClassNames: Record<SeasonStatus, string> = {
  draft: 'bg-zinc-100 text-zinc-700',
  active: 'bg-green-100 text-green-800',
  closed: 'bg-zinc-900 text-white',
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

export function AdminSeasonsPage() {
  const seasonsQuery = useSeasons();
  const { createSeason, updateSeason, deleteSeason, activateSeason } = useSeasonMutations();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | undefined>();
  const [seasonToDelete, setSeasonToDelete] = useState<Season | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);

  const isSubmitting = createSeason.isPending || updateSeason.isPending;

  const openCreateForm = () => {
    setEditingSeason(undefined);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (season: Season) => {
    setEditingSeason(season);
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingSeason(undefined);
    setFormError(null);
  };

  const handleSubmit = (payload: SeasonPayload) => {
    setFormError(null);
    setNotification(null);

    if (editingSeason) {
      updateSeason.mutate(
        { seasonId: editingSeason.id, payload },
        {
          onSuccess: () => {
            closeForm();
            setNotification({ type: 'success', message: 'Saison modifiee.' });
          },
          onError: (error) => {
            setFormError(getErrorMessage(error, 'Impossible de modifier la saison.'));
          },
        },
      );
      return;
    }

    createSeason.mutate(payload, {
      onSuccess: () => {
        closeForm();
        setNotification({ type: 'success', message: 'Saison creee.' });
      },
      onError: (error) => {
        setFormError(getErrorMessage(error, 'Impossible de creer la saison.'));
      },
    });
  };

  const handleActivate = (season: Season) => {
    setNotification(null);
    activateSeason.mutate(season.id, {
      onSuccess: () => {
        setNotification({ type: 'success', message: `${season.name} est maintenant active.` });
      },
      onError: (error) => {
        setNotification({
          type: 'error',
          message: getErrorMessage(error, 'Impossible d activer cette saison.'),
        });
      },
    });
  };

  const handleDelete = () => {
    if (!seasonToDelete) {
      return;
    }

    setNotification(null);
    deleteSeason.mutate(seasonToDelete.id, {
      onSuccess: () => {
        setNotification({ type: 'success', message: 'Saison supprimee.' });
        setSeasonToDelete(undefined);
      },
      onError: (error) => {
        setNotification({
          type: 'error',
          message: getErrorMessage(
            error,
            'Impossible de supprimer cette saison. Verifie qu elle ne contient aucun match.',
          ),
        });
        setSeasonToDelete(undefined);
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Gestion des saisons"
        description="Saisons stockees dans Supabase, protegees par Express et les politiques RLS."
        action={
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Creer
          </button>
        }
      />

      {notification ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm font-semibold ${
            notification.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {notification.message}
        </div>
      ) : null}

      {isFormOpen ? (
        <SeasonForm
          key={editingSeason?.id ?? 'create'}
          initialSeason={editingSeason}
          submitLabel={editingSeason ? 'Modifier' : 'Creer'}
          isSubmitting={isSubmitting}
          serverError={formError}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      ) : null}

      <section className="panel overflow-hidden">
        {seasonsQuery.isLoading ? (
          <div className="p-6 text-sm font-semibold text-zinc-600">Chargement des saisons...</div>
        ) : null}

        {seasonsQuery.isError ? (
          <div className="space-y-3 p-6">
            <p className="text-sm font-semibold text-red-700">
              {getErrorMessage(seasonsQuery.error, 'Impossible de charger les saisons.')}
            </p>
            <button
              type="button"
              onClick={() => void seasonsQuery.refetch()}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
            >
              Reessayer
            </button>
          </div>
        ) : null}

        {seasonsQuery.isSuccess && seasonsQuery.data.length === 0 ? (
          <div className="p-6 text-sm font-semibold text-zinc-600">Aucune saison pour le moment.</div>
        ) : null}

        {seasonsQuery.isSuccess && seasonsQuery.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="table-head">Saison</th>
                  <th className="table-head">Periode</th>
                  <th className="table-head">Statut</th>
                  <th className="table-head">Active</th>
                  <th className="table-head text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {seasonsQuery.data.map((season) => (
                  <tr key={season.id}>
                    <td className="table-cell font-black text-zinc-950">{season.name}</td>
                    <td className="table-cell">
                      {season.startDate} - {season.endDate}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${statusClassNames[season.status]}`}
                      >
                        {statusLabels[season.status]}
                      </span>
                    </td>
                    <td className="table-cell">
                      {season.status === 'active' ? (
                        <span className="font-black text-green-700">Oui</span>
                      ) : (
                        <span className="text-zinc-500">Non</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(season)}
                          className="rounded-md border border-zinc-300 p-2 text-zinc-700 hover:bg-zinc-100"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">Modifier</span>
                        </button>
                        {season.status !== 'active' ? (
                          <button
                            type="button"
                            onClick={() => handleActivate(season)}
                            className="rounded-md border border-green-200 p-2 text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:bg-zinc-100"
                            title="Activer"
                            disabled={activateSeason.isPending}
                          >
                            <Power className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">Activer</span>
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setSeasonToDelete(season)}
                          className="rounded-md border border-red-200 p-2 text-red-700 hover:bg-red-50"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">Supprimer</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {seasonToDelete ? (
        <ConfirmDialog
          title="Supprimer la saison"
          message={`Supprimer ${seasonToDelete.name} ? Les saisons contenant deja des matchs seront refusees par l API.`}
          confirmLabel="Supprimer"
          isSubmitting={deleteSeason.isPending}
          onConfirm={handleDelete}
          onCancel={() => setSeasonToDelete(undefined)}
        />
      ) : null}
    </div>
  );
}
