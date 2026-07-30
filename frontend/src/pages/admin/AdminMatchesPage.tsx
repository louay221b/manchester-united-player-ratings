import { Eye, EyeOff, ListChecks, Pencil, Plus, SquareCheckBig, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useState } from 'react';

import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { FinishMatchForm } from '../../components/admin/FinishMatchForm';
import { MatchForm, type MatchLogoChange } from '../../components/admin/MatchForm';
import { OpponentLogo } from '../../components/OpponentLogo';
import { PageHeader } from '../../components/PageHeader';
import { VoteStatusBadge } from '../../components/VoteStatusBadge';
import { useMatchMutations, useMatches } from '../../hooks/use-matches';
import { useSeasons } from '../../hooks/use-seasons';
import { ApiError } from '../../lib/api';
import {
  removeOpponentLogo as removeStoredOpponentLogo,
  StorageValidationError,
  uploadOpponentLogo,
} from '../../services/storage.service';
import type { Match, MatchPayload, MatchStatus } from '../../types/match';

interface Notification {
  type: 'success' | 'error' | 'warning';
  message: string;
}

const pageSize = 20;

const matchStatusLabels: Record<MatchStatus, string> = {
  scheduled: 'Programme',
  finished: 'Termine',
  cancelled: 'Annule',
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError || error instanceof StorageValidationError
    ? error.message
    : error instanceof Error
      ? error.message
      : fallback;

const cleanupUploadedLogo = async (path: string | null) => {
  if (!path) {
    return false;
  }

  try {
    await removeStoredOpponentLogo(path);
    return false;
  } catch {
    return true;
  }
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));

const formatScore = (match: Match) => {
  if (match.manchesterUnitedScore === null || match.opponentScore === null) {
    return 'A venir';
  }

  return `${match.manchesterUnitedScore}-${match.opponentScore}`;
};

export function AdminMatchesPage() {
  const [page] = useState(1);
  const location = useLocation();
  const routeMessage =
    typeof location.state === 'object' &&
    location.state !== null &&
    'message' in location.state &&
    typeof location.state.message === 'string'
      ? location.state.message
      : null;
  const matchesQuery = useMatches({ page, limit: pageSize });
  const seasonsQuery = useSeasons();
  const {
    createMatch,
    updateMatch,
    deleteMatch,
    finishMatch,
    closeMatchVoting,
    publishMatchResults,
    unpublishMatchResults,
  } = useMatchMutations();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | undefined>();
  const [matchToDelete, setMatchToDelete] = useState<Match | undefined>();
  const [matchToFinish, setMatchToFinish] = useState<Match | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isAssetProcessing, setIsAssetProcessing] = useState(false);

  const isSubmitting = createMatch.isPending || updateMatch.isPending || isAssetProcessing;

  const openCreateForm = () => {
    setEditingMatch(undefined);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (match: Match) => {
    setEditingMatch(match);
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingMatch(undefined);
    setFormError(null);
  };

  const createMatchWithOptionalLogo = async (
    payload: MatchPayload,
    logoChange: MatchLogoChange,
  ) => {
    const createdMatch = await createMatch.mutateAsync({
      ...payload,
      opponentLogoUrl: null,
      opponentLogoPath: null,
    });

    if (!logoChange.file) {
      closeForm();
      setNotification({ type: 'success', message: 'Match cree.' });
      return;
    }

    let uploadedLogo: { path: string; publicUrl: string } | null = null;

    try {
      uploadedLogo = await uploadOpponentLogo(createdMatch.id, logoChange.file);
      await updateMatch.mutateAsync({
        matchId: createdMatch.id,
        payload: {
          opponentLogoUrl: uploadedLogo.publicUrl,
          opponentLogoPath: uploadedLogo.path,
        },
      });
      closeForm();
      setNotification({ type: 'success', message: 'Match cree avec logo.' });
    } catch (error) {
      await cleanupUploadedLogo(uploadedLogo?.path ?? null);
      setEditingMatch(createdMatch);
      setFormError(
        getErrorMessage(
          error,
          'Match cree, mais le logo n a pas ete envoye. Ouvre le match pour reessayer.',
        ),
      );
    }
  };

  const updateMatchWithOptionalLogo = async (
    match: Match,
    payload: MatchPayload,
    logoChange: MatchLogoChange,
  ) => {
    if (logoChange.file) {
      let uploadedLogo: { path: string; publicUrl: string } | null = null;

      try {
        uploadedLogo = await uploadOpponentLogo(match.id, logoChange.file);
        await updateMatch.mutateAsync({
          matchId: match.id,
          payload: {
            ...payload,
            opponentLogoUrl: uploadedLogo.publicUrl,
            opponentLogoPath: uploadedLogo.path,
          },
        });

        const cleanupWarning = await cleanupUploadedLogo(match.opponentLogoPath);
        closeForm();
        setNotification({
          type: cleanupWarning ? 'warning' : 'success',
          message: cleanupWarning
            ? 'Match modifie. Ancien logo non supprime automatiquement.'
            : 'Match modifie.',
        });
      } catch (error) {
        await cleanupUploadedLogo(uploadedLogo?.path ?? null);
        throw error;
      }

      return;
    }

    if (logoChange.remove) {
      await updateMatch.mutateAsync({
        matchId: match.id,
        payload: {
          ...payload,
          opponentLogoUrl: null,
          opponentLogoPath: null,
        },
      });

      const cleanupWarning = await cleanupUploadedLogo(match.opponentLogoPath);
      closeForm();
      setNotification({
        type: cleanupWarning ? 'warning' : 'success',
        message: cleanupWarning
          ? 'Match modifie. Logo Storage non supprime automatiquement.'
          : 'Match modifie.',
      });
      return;
    }

    await updateMatch.mutateAsync({ matchId: match.id, payload });
    closeForm();
    setNotification({ type: 'success', message: 'Match modifie.' });
  };

  const handleSubmit = (payload: MatchPayload, logoChange: MatchLogoChange) => {
    setFormError(null);
    setNotification(null);
    setIsAssetProcessing(true);

    const operation = editingMatch
      ? updateMatchWithOptionalLogo(editingMatch, payload, logoChange)
      : createMatchWithOptionalLogo(payload, logoChange);

    void operation
      .catch((error: unknown) => {
        setFormError(
          getErrorMessage(
            error,
            editingMatch ? 'Impossible de modifier le match.' : 'Impossible de creer le match.',
          ),
        );
      })
      .finally(() => {
        setIsAssetProcessing(false);
      });
  };

  const handleFinish = (payload: { manchesterUnitedScore: number; opponentScore: number }) => {
    if (!matchToFinish) {
      return;
    }

    setFinishError(null);
    setNotification(null);
    finishMatch.mutate(
      { matchId: matchToFinish.id, payload },
      {
        onSuccess: () => {
          setMatchToFinish(undefined);
          setNotification({
            type: 'success',
            message: 'Match termine. Les votes sont ouverts automatiquement.',
          });
        },
        onError: (error) => {
          setFinishError(getErrorMessage(error, 'Impossible de terminer le match.'));
        },
      },
    );
  };

  const handleDelete = () => {
    if (!matchToDelete) {
      return;
    }

    deleteMatch.mutate(matchToDelete.id, {
      onSuccess: (result) => {
        const hasWarnings = Boolean(result.warnings?.length);
        setNotification({
          type: hasWarnings ? 'warning' : 'success',
          message: hasWarnings
            ? 'Match supprime. Logo Storage non supprime automatiquement.'
            : 'Match supprime.',
        });
        setMatchToDelete(undefined);
      },
      onError: (error) => {
        setNotification({
          type: 'error',
          message: getErrorMessage(error, 'Impossible de supprimer ce match.'),
        });
        setMatchToDelete(undefined);
      },
    });
  };

  const handleSimpleMutation = (
    action: () => void,
    successMessage: string,
    fallbackError: string,
    mutationState: { isPending: boolean },
  ) => {
    if (mutationState.isPending) {
      return;
    }

    setNotification(null);

    try {
      action();
    } catch {
      setNotification({ type: 'error', message: fallbackError });
    }

    void successMessage;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Gestion des matchs"
        description="Creer les matchs, gerer les compositions et ouvrir les votes via la finalisation du match."
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

      {routeMessage ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {routeMessage}
        </div>
      ) : null}

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

      {isFormOpen ? (
        <MatchForm
          key={editingMatch?.id ?? 'create'}
          seasons={seasonsQuery.data ?? []}
          initialMatch={editingMatch}
          submitLabel={editingMatch ? 'Modifier' : 'Creer'}
          isSubmitting={isSubmitting || seasonsQuery.isLoading}
          isUploading={isAssetProcessing}
          serverError={formError}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      ) : null}

      {matchToFinish ? (
        <FinishMatchForm
          match={matchToFinish}
          isSubmitting={finishMatch.isPending}
          serverError={finishError}
          onSubmit={handleFinish}
          onCancel={() => {
            setMatchToFinish(undefined);
            setFinishError(null);
          }}
        />
      ) : null}

      <section className="panel overflow-hidden">
        {matchesQuery.isLoading ? (
          <div className="p-6 text-sm font-semibold text-zinc-600">Chargement des matchs...</div>
        ) : null}

        {matchesQuery.isError ? (
          <div className="space-y-3 p-6">
            <p className="text-sm font-semibold text-red-700">
              {getErrorMessage(matchesQuery.error, 'Impossible de charger les matchs.')}
            </p>
            <button
              type="button"
              onClick={() => void matchesQuery.refetch()}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
            >
              Reessayer
            </button>
          </div>
        ) : null}

        {matchesQuery.isSuccess && matchesQuery.data.data.length === 0 ? (
          <div className="p-6 text-sm font-semibold text-zinc-600">Aucun match cree.</div>
        ) : null}

        {matchesQuery.isSuccess && matchesQuery.data.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="table-head">Match</th>
                  <th className="table-head">Competition</th>
                  <th className="table-head">Date</th>
                  <th className="table-head">Score</th>
                  <th className="table-head">Statut</th>
                  <th className="table-head">Votes</th>
                  <th className="table-head text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {matchesQuery.data.data.map((match) => (
                  <tr key={match.id}>
                    <td className="table-cell font-black text-zinc-950">
                      <span className="flex items-center gap-3">
                        <OpponentLogo
                          opponentName={match.opponentName}
                          logoUrl={match.opponentLogoUrl}
                          size="sm"
                        />
                        <span>Manchester United vs {match.opponentName}</span>
                      </span>
                    </td>
                    <td className="table-cell">{match.competition}</td>
                    <td className="table-cell">{formatDate(match.matchDate)}</td>
                    <td className="table-cell font-black text-zinc-950">{formatScore(match)}</td>
                    <td className="table-cell">{matchStatusLabels[match.status]}</td>
                    <td className="table-cell">
                      <VoteStatusBadge status={match.votingStatus} />
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-wrap justify-end gap-2">
                        {match.status === 'scheduled' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditForm(match)}
                              className="rounded-md border border-zinc-300 p-2 text-zinc-700 hover:bg-zinc-100"
                              title="Modifier"
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">Modifier</span>
                            </button>
                            <Link
                              to={`/admin/matches/${match.id}/lineup`}
                              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-bold text-zinc-700 hover:border-united-red hover:text-united-red"
                            >
                              <ListChecks className="h-4 w-4" aria-hidden="true" />
                              Composition
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setMatchToFinish(match);
                                setFinishError(null);
                              }}
                              className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-3 py-2 text-sm font-bold text-white hover:bg-zinc-800"
                            >
                              <SquareCheckBig className="h-4 w-4" aria-hidden="true" />
                              Terminer
                            </button>
                            <button
                              type="button"
                              onClick={() => setMatchToDelete(match)}
                              className="rounded-md border border-red-200 p-2 text-red-700 hover:bg-red-50"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">Supprimer</span>
                            </button>
                          </>
                        ) : null}

                        {match.status === 'finished' && match.votingStatus === 'open' ? (
                          <>
                            <Link
                              to={`/admin/matches/${match.id}/votes`}
                              className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-bold text-white hover:bg-zinc-800"
                            >
                              Voir les votes
                            </Link>
                            <button
                              type="button"
                              onClick={() =>
                                handleSimpleMutation(
                                  () =>
                                    closeMatchVoting.mutate(match.id, {
                                      onSuccess: () =>
                                        setNotification({
                                          type: 'success',
                                          message: 'Votes clotures.',
                                        }),
                                      onError: (error) =>
                                        setNotification({
                                          type: 'error',
                                          message: getErrorMessage(
                                            error,
                                            'Impossible de cloturer les votes.',
                                          ),
                                        }),
                                    }),
                                  'Votes clotures.',
                                  'Impossible de cloturer les votes.',
                                  closeMatchVoting,
                                )
                              }
                              className="rounded-md bg-united-red px-3 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                              disabled={closeMatchVoting.isPending}
                            >
                              Cloturer les votes
                            </button>
                          </>
                        ) : null}

                        {match.status === 'finished' && match.votingStatus === 'completed' ? (
                          <>
                            <Link
                              to={`/admin/matches/${match.id}/votes`}
                              className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-bold text-white hover:bg-zinc-800"
                            >
                              Voir les resultats
                            </Link>
                            {match.resultsPublished ? (
                              <button
                                type="button"
                                onClick={() =>
                                  unpublishMatchResults.mutate(match.id, {
                                    onSuccess: () =>
                                      setNotification({
                                        type: 'success',
                                        message: 'Resultats masques.',
                                      }),
                                    onError: (error) =>
                                      setNotification({
                                        type: 'error',
                                        message: getErrorMessage(
                                          error,
                                          'Impossible de masquer les resultats.',
                                        ),
                                      }),
                                  })
                                }
                                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-bold text-zinc-700 hover:bg-zinc-100"
                                disabled={unpublishMatchResults.isPending}
                              >
                                <EyeOff className="h-4 w-4" aria-hidden="true" />
                                Masquer
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  publishMatchResults.mutate(match.id, {
                                    onSuccess: () =>
                                      setNotification({
                                        type: 'success',
                                        message: 'Resultats publies.',
                                      }),
                                    onError: (error) =>
                                      setNotification({
                                        type: 'error',
                                        message: getErrorMessage(
                                          error,
                                          'Impossible de publier les resultats.',
                                        ),
                                      }),
                                  })
                                }
                                className="inline-flex items-center gap-2 rounded-md bg-united-red px-3 py-2 text-sm font-bold text-white hover:bg-red-800"
                                disabled={publishMatchResults.isPending}
                              >
                                <Eye className="h-4 w-4" aria-hidden="true" />
                                Publier
                              </button>
                            )}
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {matchToDelete ? (
        <ConfirmDialog
          title="Supprimer le match"
          message={`Supprimer Manchester United vs ${matchToDelete.opponentName} ? L API refusera la suppression si le match n est plus programme ou possede des votes.`}
          confirmLabel="Supprimer"
          isSubmitting={deleteMatch.isPending}
          onConfirm={handleDelete}
          onCancel={() => setMatchToDelete(undefined)}
        />
      ) : null}
    </div>
  );
}
