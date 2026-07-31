import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ApiPlayerAvatar } from '../../components/ApiPlayerAvatar';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { PlayerForm, type PlayerImageChange } from '../../components/admin/PlayerForm';
import { PageHeader } from '../../components/PageHeader';
import { usePlayerMutations, usePlayers } from '../../hooks/use-players';
import { translateApiError } from '../../i18n/errors';
import { useFormatters } from '../../i18n/format';
import { ApiError } from '../../lib/api';
import {
  removePlayerPhoto as removeStoredPlayerPhoto,
  uploadPlayerPhoto,
} from '../../services/storage.service';
import type { Player, PlayerPayload } from '../../types/player';

interface Notification {
  type: 'success' | 'error' | 'warning';
  message: string;
}

type ActiveFilter = 'all' | 'active' | 'inactive';

const pageSize = 10;

const cleanupUploadedPhoto = async (path: string | null) => {
  if (!path) {
    return false;
  }

  try {
    await removeStoredPlayerPhoto(path);
    return false;
  } catch {
    return true;
  }
};

export function AdminPlayersPage() {
  const { t } = useTranslation();
  const { formatNumber } = useFormatters();
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>();
  const [playerToDelete, setPlayerToDelete] = useState<Player | undefined>();
  const [deleteConflictPlayer, setDeleteConflictPlayer] = useState<Player | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isAssetProcessing, setIsAssetProcessing] = useState(false);
  const { createPlayer, updatePlayer, updatePlayerStatus, deletePlayer } = usePlayerMutations();

  const filters = useMemo(
    () => ({
      search,
      position: position || undefined,
      active: activeFilter === 'all' ? undefined : activeFilter === 'active',
      page,
      limit: pageSize,
    }),
    [activeFilter, page, position, search],
  );

  const playersQuery = usePlayers(filters);
  const isSubmitting = createPlayer.isPending || updatePlayer.isPending || isAssetProcessing;
  const totalPages = Math.max(1, playersQuery.data?.pagination.totalPages ?? 1);

  const resetPage = () => setPage(1);

  const openCreateForm = () => {
    setEditingPlayer(undefined);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (player: Player) => {
    setEditingPlayer(player);
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingPlayer(undefined);
    setFormError(null);
  };

  const createPlayerWithOptionalPhoto = async (
    payload: PlayerPayload,
    imageChange: PlayerImageChange,
  ) => {
    const createdPlayer = await createPlayer.mutateAsync({
      ...payload,
      photoUrl: null,
      photoPath: null,
    });

    if (!imageChange.file) {
      closeForm();
      resetPage();
      setNotification({ type: 'success', message: t('admin.players.created') });
      return;
    }

    let uploadedPhoto: { path: string; publicUrl: string } | null = null;

    try {
      uploadedPhoto = await uploadPlayerPhoto(createdPlayer.id, imageChange.file);
      await updatePlayer.mutateAsync({
        playerId: createdPlayer.id,
        payload: {
          photoUrl: uploadedPhoto.publicUrl,
          photoPath: uploadedPhoto.path,
        },
      });
      closeForm();
      resetPage();
      setNotification({ type: 'success', message: t('admin.players.createdWithPhoto') });
    } catch (error) {
      await cleanupUploadedPhoto(uploadedPhoto?.path ?? null);
      setEditingPlayer(createdPlayer);
      resetPage();
      setFormError(translateApiError(error, t, 'admin.players.createdPhotoFailed'));
    }
  };

  const updatePlayerWithOptionalPhoto = async (
    player: Player,
    payload: PlayerPayload,
    imageChange: PlayerImageChange,
  ) => {
    if (imageChange.file) {
      let uploadedPhoto: { path: string; publicUrl: string } | null = null;

      try {
        uploadedPhoto = await uploadPlayerPhoto(player.id, imageChange.file);
        await updatePlayer.mutateAsync({
          playerId: player.id,
          payload: {
            ...payload,
            photoUrl: uploadedPhoto.publicUrl,
            photoPath: uploadedPhoto.path,
          },
        });

        const cleanupWarning = await cleanupUploadedPhoto(player.photoPath);
        closeForm();
        setNotification({
          type: cleanupWarning ? 'warning' : 'success',
          message: cleanupWarning
            ? t('admin.players.updatedOldPhotoWarning')
            : t('admin.players.updated'),
        });
      } catch (error) {
        await cleanupUploadedPhoto(uploadedPhoto?.path ?? null);
        throw error;
      }

      return;
    }

    if (imageChange.remove) {
      await updatePlayer.mutateAsync({
        playerId: player.id,
        payload: {
          ...payload,
          photoUrl: null,
          photoPath: null,
        },
      });

      const cleanupWarning = await cleanupUploadedPhoto(player.photoPath);
      closeForm();
      setNotification({
        type: cleanupWarning ? 'warning' : 'success',
        message: cleanupWarning
          ? t('admin.players.updatedStorageWarning')
          : t('admin.players.updated'),
      });
      return;
    }

    await updatePlayer.mutateAsync({ playerId: player.id, payload });
    closeForm();
    setNotification({ type: 'success', message: t('admin.players.updated') });
  };

  const handleSubmit = (payload: PlayerPayload, imageChange: PlayerImageChange) => {
    setFormError(null);
    setNotification(null);
    setIsAssetProcessing(true);

    const operation = editingPlayer
      ? updatePlayerWithOptionalPhoto(editingPlayer, payload, imageChange)
      : createPlayerWithOptionalPhoto(payload, imageChange);

    void operation
      .catch((error: unknown) => {
        setFormError(
          translateApiError(
            error,
            t,
            editingPlayer ? 'admin.players.updateFailed' : 'admin.players.createFailed',
          ),
        );
      })
      .finally(() => {
        setIsAssetProcessing(false);
      });
  };

  const handleStatusChange = (player: Player, active: boolean) => {
    setNotification(null);
    updatePlayerStatus.mutate(
      { playerId: player.id, active },
      {
        onSuccess: () => {
          setDeleteConflictPlayer(undefined);
          setNotification({
            type: 'success',
            message: active ? t('admin.players.reactivated') : t('admin.players.deactivated'),
          });
        },
        onError: (error) => {
          setNotification({
            type: 'error',
            message: translateApiError(error, t, 'admin.players.statusFailed'),
          });
        },
      },
    );
  };

  const handleDelete = () => {
    if (!playerToDelete) {
      return;
    }

    const targetPlayer = playerToDelete;
    setNotification(null);

    deletePlayer.mutate(targetPlayer.id, {
      onSuccess: (result) => {
        const hasWarnings = Boolean(result.warnings?.length);
        setNotification({
          type: hasWarnings ? 'warning' : 'success',
          message: hasWarnings
            ? t('admin.players.deletedStorageWarning')
            : t('admin.players.deleted'),
        });
        setPlayerToDelete(undefined);
      },
      onError: (error) => {
        setNotification({
          type: 'error',
          message: translateApiError(error, t, 'admin.players.deleteFailed'),
        });

        if (error instanceof ApiError && error.status === 409) {
          setDeleteConflictPlayer(targetPlayer);
        }

        setPlayerToDelete(undefined);
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('admin.eyebrow')}
        title={t('admin.players.title')}
        description={t('admin.players.description')}
        action={
          <>
            <Link
              to="/admin/players/photos"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:border-united-red hover:text-united-red"
            >
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              {t('admin.players.photos')}
            </Link>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('common.add')}
            </button>
          </>
        }
      />

      {notification ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm font-semibold ${
            notification.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : notification.type === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {notification.message}
        </div>
      ) : null}

      {deleteConflictPlayer ? (
        <section className="panel flex flex-col gap-3 border-amber-200 bg-amber-50 p-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold">
            {t('admin.players.historyWarning', { player: deleteConflictPlayer.displayName })}
          </p>
          <button
            type="button"
            onClick={() => handleStatusChange(deleteConflictPlayer, false)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-700 px-4 py-2 text-sm font-black text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={updatePlayerStatus.isPending || !deleteConflictPlayer.active}
          >
            <Power className="h-4 w-4" aria-hidden="true" />
            {t('admin.players.deactivate')}
          </button>
        </section>
      ) : null}

      {isFormOpen ? (
        <PlayerForm
          key={editingPlayer?.id ?? 'create'}
          initialPlayer={editingPlayer}
          submitLabel={editingPlayer ? t('common.edit') : t('common.add')}
          isSubmitting={isSubmitting}
          isUploading={isAssetProcessing}
          serverError={formError}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      ) : null}

      <section className="panel p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_180px]">
          <label className="space-y-1 text-sm font-bold text-zinc-700">
            {t('common.search')}
            <span className="relative block">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  resetPage();
                }}
                className="focus-ring w-full rounded-md border border-zinc-300 py-2 pe-3 ps-9"
                placeholder={t('players.searchPlaceholder')}
              />
            </span>
          </label>

          <label className="space-y-1 text-sm font-bold text-zinc-700">
            {t('players.position')}
            <input
              value={position}
              onChange={(event) => {
                setPosition(event.target.value);
                resetPage();
              }}
              className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
              placeholder={t('players.positionPlaceholder')}
            />
          </label>

          <label className="space-y-1 text-sm font-bold text-zinc-700">
            {t('common.status')}
            <select
              value={activeFilter}
              onChange={(event) => {
                setActiveFilter(event.target.value as ActiveFilter);
                resetPage();
              }}
              className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
            >
              <option value="all">{t('common.all')}</option>
              <option value="active">{t('common.active')}</option>
              <option value="inactive">{t('common.inactive')}</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel overflow-hidden">
        {playersQuery.isLoading ? (
          <div className="p-6 text-sm font-semibold text-zinc-600">
            {t('admin.players.loading')}
          </div>
        ) : null}

        {playersQuery.isError ? (
          <div className="space-y-3 p-6">
            <p className="text-sm font-semibold text-red-700">
              {translateApiError(playersQuery.error, t, 'admin.players.loadError')}
            </p>
            <button
              type="button"
              onClick={() => void playersQuery.refetch()}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : null}

        {playersQuery.isSuccess && playersQuery.data.data.length === 0 ? (
          <div className="p-6 text-sm font-semibold text-zinc-600">{t('admin.players.empty')}</div>
        ) : null}

        {playersQuery.isSuccess && playersQuery.data.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="table-head">{t('players.player')}</th>
                    <th className="table-head">{t('players.shirtNumber')}</th>
                    <th className="table-head">{t('players.position')}</th>
                    <th className="table-head">{t('common.status')}</th>
                    <th className="table-head">{t('players.arrival')}</th>
                    <th className="table-head text-end">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {playersQuery.data.data.map((player) => (
                    <tr key={player.id}>
                      <td className="table-cell">
                        <span className="flex items-center gap-3 font-black text-zinc-950">
                          <ApiPlayerAvatar player={player} size="sm" />
                          {player.displayName}
                        </span>
                      </td>
                      <td className="table-cell">
                        {player.shirtNumber ? `#${formatNumber(player.shirtNumber)}` : '-'}
                      </td>
                      <td className="table-cell">
                        {t(`positions.${player.position}`, { defaultValue: player.position })}
                      </td>
                      <td className="table-cell">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${
                            player.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-zinc-200 text-zinc-700'
                          }`}
                        >
                          {player.active ? t('common.active') : t('common.inactive')}
                        </span>
                      </td>
                      <td className="table-cell">{player.joinedAt ?? '-'}</td>
                      <td className="table-cell">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(player)}
                            className="rounded-md border border-zinc-300 p-2 text-zinc-700 hover:bg-zinc-100"
                            title={t('common.edit')}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">{t('common.edit')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(player, !player.active)}
                            className="rounded-md border border-zinc-300 p-2 text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                            title={
                              player.active
                                ? t('admin.players.deactivate')
                                : t('admin.players.reactivate')
                            }
                            disabled={updatePlayerStatus.isPending}
                          >
                            {player.active ? (
                              <Power className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <RotateCcw className="h-4 w-4" aria-hidden="true" />
                            )}
                            <span className="sr-only">
                              {player.active
                                ? t('admin.players.deactivate')
                                : t('admin.players.reactivate')}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPlayerToDelete(player)}
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

            <div className="flex flex-col gap-3 border-t border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {t('admin.players.pagination', {
                  count: playersQuery.data.pagination.total,
                  page: formatNumber(page),
                  totalPages: formatNumber(totalPages),
                })}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 font-black text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  {t('common.previous')}
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 font-black text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                  disabled={page >= totalPages}
                >
                  {t('common.next')}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        ) : null}
      </section>

      {playerToDelete ? (
        <ConfirmDialog
          title={t('admin.players.deleteTitle')}
          message={t('admin.players.deleteMessage', { player: playerToDelete.displayName })}
          confirmLabel={t('common.delete')}
          isSubmitting={deletePlayer.isPending}
          onConfirm={handleDelete}
          onCancel={() => setPlayerToDelete(undefined)}
        />
      ) : null}
    </div>
  );
}
