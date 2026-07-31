import { Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { SeasonForm } from '../../components/admin/SeasonForm';
import { PageHeader } from '../../components/PageHeader';
import { useSeasonMutations, useSeasons } from '../../hooks/use-seasons';
import { translateApiError } from '../../i18n/errors';
import { useFormatters } from '../../i18n/format';
import type { Season, SeasonPayload, SeasonStatus } from '../../types/season';

interface Notification {
  type: 'success' | 'error';
  message: string;
}

const statusClassNames: Record<SeasonStatus, string> = {
  draft: 'bg-zinc-100 text-zinc-700',
  active: 'bg-green-100 text-green-800',
  closed: 'bg-zinc-900 text-white',
};

export function AdminSeasonsPage() {
  const { t } = useTranslation();
  const { formatDate } = useFormatters();
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
            setNotification({ type: 'success', message: t('admin.seasons.updated') });
          },
          onError: (error) => {
            setFormError(translateApiError(error, t, 'admin.seasons.updateFailed'));
          },
        },
      );
      return;
    }

    createSeason.mutate(payload, {
      onSuccess: () => {
        closeForm();
        setNotification({ type: 'success', message: t('admin.seasons.created') });
      },
      onError: (error) => {
        setFormError(translateApiError(error, t, 'admin.seasons.createFailed'));
      },
    });
  };

  const handleActivate = (season: Season) => {
    setNotification(null);
    activateSeason.mutate(season.id, {
      onSuccess: () => {
        setNotification({
          type: 'success',
          message: t('admin.seasons.activated', { season: season.name }),
        });
      },
      onError: (error) => {
        setNotification({
          type: 'error',
          message: translateApiError(error, t, 'admin.seasons.activateFailed'),
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
        setNotification({ type: 'success', message: t('admin.seasons.deleted') });
        setSeasonToDelete(undefined);
      },
      onError: (error) => {
        setNotification({
          type: 'error',
          message: translateApiError(error, t, 'admin.seasons.deleteFailed'),
        });
        setSeasonToDelete(undefined);
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('admin.eyebrow')}
        title={t('admin.seasons.title')}
        description={t('admin.seasons.description')}
        action={
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('common.create')}
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
          submitLabel={editingSeason ? t('common.edit') : t('common.create')}
          isSubmitting={isSubmitting}
          serverError={formError}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      ) : null}

      <section className="panel overflow-hidden">
        {seasonsQuery.isLoading ? (
          <div className="p-6 text-sm font-semibold text-zinc-600">
            {t('admin.seasons.loading')}
          </div>
        ) : null}

        {seasonsQuery.isError ? (
          <div className="space-y-3 p-6">
            <p className="text-sm font-semibold text-red-700">
              {translateApiError(seasonsQuery.error, t, 'admin.seasons.loadError')}
            </p>
            <button
              type="button"
              onClick={() => void seasonsQuery.refetch()}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : null}

        {seasonsQuery.isSuccess && seasonsQuery.data.length === 0 ? (
          <div className="p-6 text-sm font-semibold text-zinc-600">{t('admin.seasons.empty')}</div>
        ) : null}

        {seasonsQuery.isSuccess && seasonsQuery.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="table-head">{t('common.season')}</th>
                  <th className="table-head">{t('admin.seasons.period')}</th>
                  <th className="table-head">{t('common.status')}</th>
                  <th className="table-head">{t('common.active')}</th>
                  <th className="table-head text-end">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {seasonsQuery.data.map((season) => (
                  <tr key={season.id}>
                    <td className="table-cell font-black text-zinc-950">{season.name}</td>
                    <td className="table-cell">
                      {formatDate(season.startDate, {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      -{' '}
                      {formatDate(season.endDate, {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${statusClassNames[season.status]}`}
                      >
                        {t(`statuses.season.${season.status}`)}
                      </span>
                    </td>
                    <td className="table-cell">
                      {season.status === 'active' ? (
                        <span className="font-black text-green-700">{t('common.yes')}</span>
                      ) : (
                        <span className="text-zinc-500">{t('common.no')}</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(season)}
                          className="rounded-md border border-zinc-300 p-2 text-zinc-700 hover:bg-zinc-100"
                          title={t('common.edit')}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">{t('common.edit')}</span>
                        </button>
                        {season.status !== 'active' ? (
                          <button
                            type="button"
                            onClick={() => handleActivate(season)}
                            className="rounded-md border border-green-200 p-2 text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:bg-zinc-100"
                            title={t('common.activate')}
                            disabled={activateSeason.isPending}
                          >
                            <Power className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">{t('common.activate')}</span>
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setSeasonToDelete(season)}
                          className="rounded-md border border-red-200 p-2 text-red-700 hover:bg-red-50"
                          title={t('common.delete')}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">{t('common.delete')}</span>
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
          title={t('admin.seasons.deleteTitle')}
          message={t('admin.seasons.deleteMessage', { season: seasonToDelete.name })}
          confirmLabel={t('common.delete')}
          isSubmitting={deleteSeason.isPending}
          onConfirm={handleDelete}
          onCancel={() => setSeasonToDelete(undefined)}
        />
      ) : null}
    </div>
  );
}
