import { CheckCircle2, ImagePlus, Loader2, Trash2, UploadCloud, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';

import { PageHeader } from '../../components/PageHeader';
import { PlayerAvatar } from '../../components/players/PlayerAvatar';
import { playerQueryKey, playersQueryKey, usePlayers } from '../../hooks/use-players';
import { matchLineupsQueryKey, rankingsQueryKey } from '../../hooks/query-keys';
import { ApiError } from '../../lib/api';
import { updatePlayer } from '../../services/players-api.service';
import {
  removePlayerPhoto,
  StorageValidationError,
  uploadPlayerPhoto,
  validateImageFile,
} from '../../services/storage.service';
import type { MatchLineup } from '../../types/match';
import type { Player } from '../../types/player';
import type { SeasonRanking } from '../../types/ranking';

type UploadStatus = 'ready' | 'uploading' | 'sent' | 'skipped' | 'error';

interface RowResult {
  status: UploadStatus;
  message: string;
}

interface BatchItem {
  id: string;
  file: File;
  playerId: string;
  status: UploadStatus;
  message: string;
}

interface PlayerListCache {
  data: Player[];
  pagination: unknown;
}

const activePlayersFilters = { page: 1, limit: 100, active: true };
const maxConcurrentUploads = 2;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError || error instanceof StorageValidationError
    ? error.message
    : error instanceof Error
      ? error.message
      : fallback;

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} Ko`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} Mo`;
};

const formatPlayerOption = (player: Player) =>
  [player.displayName, player.shirtNumber ? `#${player.shirtNumber}` : null, player.position]
    .filter(Boolean)
    .join(' - ');

const getItemId = (file: File, index: number) =>
  `${file.name}-${file.size}-${file.lastModified}-${index}`;

const runWithConcurrencyLimit = async <T,>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
) => {
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex];
      nextIndex += 1;
      await worker(item);
    }
  });

  await Promise.all(workers);
};

function FilePreview({ file }: { file: File }) {
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <img
      src={previewUrl}
      alt={`Previsualisation ${file.name}`}
      className="h-16 w-16 shrink-0 rounded-lg object-cover"
    />
  );
}

function StatusMessage({ result }: { result?: RowResult | Pick<BatchItem, 'status' | 'message'> }) {
  if (!result?.message) {
    return null;
  }

  const styles =
    result.status === 'sent'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : result.status === 'skipped'
        ? 'border-zinc-200 bg-zinc-50 text-zinc-600'
        : 'border-red-200 bg-red-50 text-red-700';

  return (
    <p className={`rounded-md border px-3 py-2 text-sm font-semibold ${styles}`}>
      {result.message}
    </p>
  );
}

export function AdminPlayerPhotosPage() {
  const queryClient = useQueryClient();
  const playersQuery = usePlayers(activePlayersFilters);
  const players = useMemo(() => playersQuery.data?.data ?? [], [playersQuery.data?.data]);
  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const [selectedFilesByPlayer, setSelectedFilesByPlayer] = useState<Record<string, File | null>>(
    {},
  );
  const [rowResults, setRowResults] = useState<Record<string, RowResult>>({});
  const [processingRows, setProcessingRows] = useState<Record<string, boolean>>({});
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isBatchUploading, setIsBatchUploading] = useState(false);

  const updateCachedPlayer = (updatedPlayer: Player) => {
    queryClient.setQueryData(playerQueryKey(updatedPlayer.id), updatedPlayer);
    queryClient.setQueriesData<PlayerListCache>({ queryKey: playersQueryKey }, (current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        data: current.data.map((player) =>
          player.id === updatedPlayer.id ? updatedPlayer : player,
        ),
      };
    });
    queryClient.setQueriesData<SeasonRanking>({ queryKey: rankingsQueryKey }, (current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        ranking: current.ranking.map((row) =>
          row.playerId === updatedPlayer.id ? { ...row, photoUrl: updatedPlayer.photoUrl } : row,
        ),
      };
    });
    queryClient.setQueriesData<MatchLineup>({ queryKey: matchLineupsQueryKey }, (current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        players: current.players.map((lineupPlayer) =>
          lineupPlayer.player.id === updatedPlayer.id
            ? {
                ...lineupPlayer,
                player: {
                  ...lineupPlayer.player,
                  photoUrl: updatedPlayer.photoUrl,
                },
              }
            : lineupPlayer,
        ),
      };
    });
  };

  const invalidatePhotoQueries = (playerId: string) => {
    void queryClient.invalidateQueries({ queryKey: playersQueryKey });
    void queryClient.invalidateQueries({ queryKey: playerQueryKey(playerId) });
    void queryClient.invalidateQueries({ queryKey: rankingsQueryKey });
    void queryClient.invalidateQueries({ queryKey: matchLineupsQueryKey });
  };

  const cleanupOldPhoto = async (path: string | null) => {
    if (!path) {
      return false;
    }

    try {
      await removePlayerPhoto(path);
      return false;
    } catch {
      return true;
    }
  };

  const uploadPhotoForPlayer = async (player: Player, file: File): Promise<RowResult> => {
    let uploadedPhoto: { path: string; publicUrl: string } | null = null;

    try {
      validateImageFile(file);
      uploadedPhoto = await uploadPlayerPhoto(player.id, file);
      const updatedPlayer = await updatePlayer(player.id, {
        photoUrl: uploadedPhoto.publicUrl,
        photoPath: uploadedPhoto.path,
      });
      const cleanupWarning = await cleanupOldPhoto(player.photoPath);

      updateCachedPlayer(updatedPlayer);
      invalidatePhotoQueries(player.id);

      return {
        status: cleanupWarning ? 'error' : 'sent',
        message: cleanupWarning
          ? 'Photo envoyee, mais ancienne photo non supprimee automatiquement.'
          : 'Photo envoyee.',
      };
    } catch (error) {
      if (uploadedPhoto) {
        await cleanupOldPhoto(uploadedPhoto.path);
      }

      return {
        status: 'error',
        message: getErrorMessage(error, 'Impossible d envoyer cette photo.'),
      };
    }
  };

  const removePhotoForPlayer = async (player: Player): Promise<RowResult> => {
    if (!player.photoPath && !player.photoUrl) {
      return {
        status: 'skipped',
        message: 'Aucune photo a supprimer.',
      };
    }

    try {
      const updatedPlayer = await updatePlayer(player.id, {
        photoUrl: null,
        photoPath: null,
      });
      const cleanupWarning = await cleanupOldPhoto(player.photoPath);

      updateCachedPlayer(updatedPlayer);
      invalidatePhotoQueries(player.id);

      return {
        status: cleanupWarning ? 'error' : 'sent',
        message: cleanupWarning
          ? 'Photo retiree du profil, mais fichier Storage non supprime automatiquement.'
          : 'Photo supprimee.',
      };
    } catch (error) {
      return {
        status: 'error',
        message: getErrorMessage(error, 'Impossible de supprimer cette photo.'),
      };
    }
  };

  const setRowProcessing = (playerId: string, isProcessing: boolean) => {
    setProcessingRows((current) => ({
      ...current,
      [playerId]: isProcessing,
    }));
  };

  const handleSingleFileChange = (playerId: string, file: File | null) => {
    if (!file) {
      setSelectedFilesByPlayer((current) => ({ ...current, [playerId]: null }));
      return;
    }

    try {
      validateImageFile(file);
      setSelectedFilesByPlayer((current) => ({ ...current, [playerId]: file }));
      setRowResults((current) => ({
        ...current,
        [playerId]: { status: 'ready', message: 'Photo prete a envoyer.' },
      }));
    } catch (error) {
      setSelectedFilesByPlayer((current) => ({ ...current, [playerId]: null }));
      setRowResults((current) => ({
        ...current,
        [playerId]: {
          status: 'error',
          message: getErrorMessage(error, 'Image invalide.'),
        },
      }));
    }
  };

  const handleSingleUpload = async (player: Player) => {
    const file = selectedFilesByPlayer[player.id];

    if (!file) {
      setRowResults((current) => ({
        ...current,
        [player.id]: { status: 'skipped', message: 'Selectionne une photo avant l envoi.' },
      }));
      return;
    }

    setRowProcessing(player.id, true);
    setRowResults((current) => ({
      ...current,
      [player.id]: { status: 'uploading', message: 'Upload en cours...' },
    }));

    const result = await uploadPhotoForPlayer(player, file);

    setRowResults((current) => ({ ...current, [player.id]: result }));
    setSelectedFilesByPlayer((current) => ({ ...current, [player.id]: null }));
    setRowProcessing(player.id, false);
  };

  const handleSingleDelete = async (player: Player) => {
    setRowProcessing(player.id, true);
    setRowResults((current) => ({
      ...current,
      [player.id]: { status: 'uploading', message: 'Suppression en cours...' },
    }));

    const result = await removePhotoForPlayer(player);

    setRowResults((current) => ({ ...current, [player.id]: result }));
    setSelectedFilesByPlayer((current) => ({ ...current, [player.id]: null }));
    setRowProcessing(player.id, false);
  };

  const handleBatchFiles = (files: FileList | null) => {
    if (!files) {
      return;
    }

    const nextItems = Array.from(files).map((file, index): BatchItem => {
      try {
        validateImageFile(file);

        return {
          id: getItemId(file, index),
          file,
          playerId: '',
          status: 'ready',
          message: 'Selectionne le joueur correspondant.',
        };
      } catch (error) {
        return {
          id: getItemId(file, index),
          file,
          playerId: '',
          status: 'error',
          message: getErrorMessage(error, 'Image invalide.'),
        };
      }
    });

    setBatchItems(nextItems);
  };

  const updateBatchItem = (itemId: string, updater: (item: BatchItem) => BatchItem) => {
    setBatchItems((current) => current.map((item) => (item.id === itemId ? updater(item) : item)));
  };

  const selectedBatchPlayerIds = batchItems
    .filter((item) => item.playerId && item.status !== 'skipped')
    .map((item) => item.playerId);

  const handleBatchUpload = async () => {
    if (isBatchUploading) {
      return;
    }

    const seenPlayerIds = new Set<string>();
    const uploadableItems: BatchItem[] = [];
    const nextItems: BatchItem[] = batchItems.map((item): BatchItem => {
      if (item.status === 'skipped' || item.status === 'sent') {
        return item;
      }

      if (item.status === 'error' && !item.playerId) {
        return item;
      }

      if (!item.playerId) {
        return { ...item, status: 'error', message: 'Selectionne un joueur pour ce fichier.' };
      }

      if (seenPlayerIds.has(item.playerId)) {
        return {
          ...item,
          status: 'error',
          message: 'Ce joueur est deja associe a un autre fichier.',
        };
      }

      seenPlayerIds.add(item.playerId);
      uploadableItems.push(item);
      return { ...item, status: 'ready', message: 'En attente d upload.' };
    });

    setBatchItems(nextItems);

    if (uploadableItems.length === 0) {
      return;
    }

    setIsBatchUploading(true);

    await runWithConcurrencyLimit(uploadableItems, maxConcurrentUploads, async (item) => {
      const player = playersById.get(item.playerId);

      if (!player) {
        updateBatchItem(item.id, (current) => ({
          ...current,
          status: 'error',
          message: 'Joueur introuvable.',
        }));
        return;
      }

      updateBatchItem(item.id, (current) => ({
        ...current,
        status: 'uploading',
        message: 'Upload en cours...',
      }));

      const result = await uploadPhotoForPlayer(player, item.file);

      updateBatchItem(item.id, (current) => ({
        ...current,
        status: result.status,
        message: result.message,
      }));
    });

    setIsBatchUploading(false);
  };

  const clearBatch = () => {
    setBatchItems([]);
  };

  const getStatusIcon = (status: UploadStatus) => {
    if (status === 'uploading') {
      return <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />;
    }

    if (status === 'sent') {
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />;
    }

    if (status === 'error') {
      return <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />;
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Gestion des photos joueurs"
        description="Selection manuelle des images autorisees, upload Supabase Storage et remplacement securise."
        action={
          <Link
            to="/admin/players"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
          >
            Retour aux joueurs
          </Link>
        }
      />

      {playersQuery.isLoading ? (
        <div className="panel p-6 text-sm font-semibold text-zinc-600">
          Chargement des joueurs...
        </div>
      ) : null}

      {playersQuery.isError ? (
        <section className="panel border-red-200 bg-red-50 p-6">
          <p className="font-black text-red-800">Joueurs indisponibles</p>
          <p className="mt-2 text-sm text-red-700">
            {getErrorMessage(playersQuery.error, 'Impossible de charger les joueurs.')}
          </p>
          <button
            type="button"
            onClick={() => void playersQuery.refetch()}
            className="mt-4 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
          >
            Reessayer
          </button>
        </section>
      ) : null}

      {playersQuery.isSuccess ? (
        <>
          <section className="panel space-y-4 p-5">
            <div>
              <h2 className="text-xl font-black text-zinc-950">Import groupe</h2>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                Chaque fichier doit etre associe explicitement a un joueur. Aucun nom de fichier n
                est devine automatiquement.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-black text-zinc-700 hover:border-united-red hover:text-united-red">
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                Selectionner plusieurs fichiers
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => handleBatchFiles(event.target.files)}
                  disabled={isBatchUploading}
                  aria-label="Selectionner plusieurs photos"
                />
              </label>
              {batchItems.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={handleBatchUpload}
                    disabled={isBatchUploading}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                  >
                    <UploadCloud className="h-4 w-4" aria-hidden="true" />
                    {isBatchUploading ? 'Import en cours...' : 'Envoyer l import'}
                  </button>
                  <button
                    type="button"
                    onClick={clearBatch}
                    disabled={isBatchUploading}
                    className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                  >
                    Vider
                  </button>
                </>
              ) : null}
            </div>

            {batchItems.length > 0 ? (
              <div className="space-y-3">
                {batchItems.map((item) => {
                  const takenPlayerIds = selectedBatchPlayerIds.filter(
                    (id) => id !== item.playerId,
                  );

                  return (
                    <article
                      key={item.id}
                      className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-3 md:grid-cols-[72px_minmax(0,1fr)_minmax(220px,320px)_auto]"
                    >
                      <FilePreview file={item.file} />
                      <div className="min-w-0">
                        <p className="truncate font-black text-zinc-950">{item.file.name}</p>
                        <p className="text-sm font-semibold text-zinc-500">
                          {formatFileSize(item.file.size)}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-zinc-600">
                          {getStatusIcon(item.status)}
                          <span>{item.message}</span>
                        </div>
                      </div>
                      <label className="space-y-1 text-sm font-bold text-zinc-700">
                        Joueur correspondant
                        <select
                          value={item.playerId}
                          onChange={(event) =>
                            updateBatchItem(item.id, (current) => ({
                              ...current,
                              playerId: event.target.value,
                              status: current.status === 'error' ? 'ready' : current.status,
                              message: event.target.value
                                ? 'Pret a envoyer.'
                                : 'Selectionne le joueur correspondant.',
                            }))
                          }
                          className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
                          disabled={
                            isBatchUploading || item.status === 'sent' || item.status === 'skipped'
                          }
                        >
                          <option value="">Selectionner</option>
                          {players.map((player) => (
                            <option
                              key={player.id}
                              value={player.id}
                              disabled={takenPlayerIds.includes(player.id)}
                            >
                              {formatPlayerOption(player)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          updateBatchItem(item.id, (current) => ({
                            ...current,
                            status: 'skipped',
                            message: 'Fichier ignore.',
                          }))
                        }
                        className="h-fit rounded-md border border-zinc-300 px-3 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                        disabled={
                          isBatchUploading || item.status === 'sent' || item.status === 'skipped'
                        }
                      >
                        Ignorer
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>

          <section className="panel overflow-hidden">
            <div className="border-b border-zinc-200 px-5 py-4">
              <h2 className="text-xl font-black text-zinc-950">Photos individuelles</h2>
            </div>
            {players.length === 0 ? (
              <div className="p-6 text-sm font-semibold text-zinc-600">Aucun joueur actif.</div>
            ) : (
              <div className="divide-y divide-zinc-200">
                {players.map((player) => {
                  const selectedFile = selectedFilesByPlayer[player.id];
                  const isProcessing = Boolean(processingRows[player.id]);

                  return (
                    <article
                      key={player.id}
                      className="grid gap-4 p-5 lg:grid-cols-[minmax(260px,1fr)_minmax(220px,320px)_auto]"
                    >
                      <div className="flex items-center gap-4">
                        {selectedFile ? (
                          <FilePreview file={selectedFile} />
                        ) : (
                          <PlayerAvatar
                            photoUrl={player.photoUrl}
                            firstName={player.firstName}
                            lastName={player.lastName}
                            size="lg"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-black text-zinc-950">{player.displayName}</p>
                          <p className="text-sm font-semibold text-zinc-500">
                            {player.shirtNumber ? `#${player.shirtNumber} - ` : ''}
                            {player.position}
                          </p>
                          {selectedFile ? (
                            <p className="mt-1 truncate text-sm font-semibold text-zinc-600">
                              {selectedFile.name} - {formatFileSize(selectedFile.size)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-black text-zinc-700 hover:border-united-red hover:text-united-red">
                          <ImagePlus className="h-4 w-4" aria-hidden="true" />
                          Selectionner une photo
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            disabled={isProcessing}
                            aria-label={`Selectionner une photo pour ${player.displayName}`}
                            onChange={(event) =>
                              handleSingleFileChange(player.id, event.target.files?.[0] ?? null)
                            }
                          />
                        </label>
                        <StatusMessage result={rowResults[player.id]} />
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                        <button
                          type="button"
                          onClick={() => void handleSingleUpload(player)}
                          disabled={isProcessing || !selectedFile}
                          className="inline-flex items-center justify-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <UploadCloud className="h-4 w-4" aria-hidden="true" />
                          )}
                          Envoyer
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleSingleDelete(player)}
                          disabled={isProcessing || (!player.photoPath && !player.photoUrl)}
                          className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-black text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Supprimer la photo
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
