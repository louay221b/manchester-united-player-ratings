import { Eye, EyeOff, ListChecks, Pencil, Plus, SquareCheckBig, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';

import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { FinishMatchForm } from '../../components/admin/FinishMatchForm';
import { MatchForm, type MatchLogoChange } from '../../components/admin/MatchForm';
import { BrandLogo } from '../../components/layout/BrandLogo';
import { OpponentLogo } from '../../components/OpponentLogo';
import { PageHeader } from '../../components/PageHeader';
import { VoteStatusBadge } from '../../components/VoteStatusBadge';
import { useMatchMutations, useMatches } from '../../hooks/use-matches';
import { useSeasons } from '../../hooks/use-seasons';
import { translateApiError } from '../../i18n/errors';
import { useFormatters } from '../../i18n/format';
import {
  removeOpponentLogo as removeStoredOpponentLogo,
  uploadOpponentLogo,
} from '../../services/storage.service';
import type { Match, MatchPayload } from '../../types/match';

interface Notification {
  type: 'success' | 'error' | 'warning';
  message: string;
}

const pageSize = 20;

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

export function AdminMatchesPage() {
  const { t } = useTranslation();
  const { formatDate, formatScore } = useFormatters();
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
      setNotification({ type: 'success', message: t('admin.matches.created') });
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
      setNotification({ type: 'success', message: t('admin.matches.createdWithLogo') });
    } catch (error) {
      await cleanupUploadedLogo(uploadedLogo?.path ?? null);
      setEditingMatch(createdMatch);
      setFormError(translateApiError(error, t, 'admin.matches.createdLogoFailed'));
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
            ? t('admin.matches.updatedOldLogoWarning')
            : t('admin.matches.updated'),
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
          ? t('admin.matches.updatedStorageWarning')
          : t('admin.matches.updated'),
      });
      return;
    }

    await updateMatch.mutateAsync({ matchId: match.id, payload });
    closeForm();
    setNotification({ type: 'success', message: t('admin.matches.updated') });
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
          translateApiError(
            error,
            t,
            editingMatch ? 'admin.matches.updateFailed' : 'admin.matches.createFailed',
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
            message: t('admin.matches.finished'),
          });
        },
        onError: (error) => {
          setFinishError(translateApiError(error, t, 'admin.matches.finishFailed'));
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
            ? t('admin.matches.deletedStorageWarning')
            : t('admin.matches.deleted'),
        });
        setMatchToDelete(undefined);
      },
      onError: (error) => {
        setNotification({
          type: 'error',
          message: translateApiError(error, t, 'admin.matches.deleteFailed'),
        });
        setMatchToDelete(undefined);
      },
    });
  };

  const handleCloseVoting = (match: Match) => {
    if (closeMatchVoting.isPending) {
      return;
    }

    setNotification(null);
    closeMatchVoting.mutate(match.id, {
      onSuccess: () =>
        setNotification({
          type: 'success',
          message: t('admin.matches.votingClosed'),
        }),
      onError: (error) =>
        setNotification({
          type: 'error',
          message: translateApiError(error, t, 'admin.matches.closeVotingFailed'),
        }),
    });
  };

  const handlePublishResults = (match: Match) => {
    setNotification(null);
    publishMatchResults.mutate(match.id, {
      onSuccess: () =>
        setNotification({
          type: 'success',
          message: t('admin.matches.resultsPublished'),
        }),
      onError: (error) =>
        setNotification({
          type: 'error',
          message: translateApiError(error, t, 'admin.matches.publishResultsFailed'),
        }),
    });
  };

  const handleHideResults = (match: Match) => {
    setNotification(null);
    unpublishMatchResults.mutate(match.id, {
      onSuccess: () =>
        setNotification({
          type: 'success',
          message: t('admin.matches.resultsHidden'),
        }),
      onError: (error) =>
        setNotification({
          type: 'error',
          message: translateApiError(error, t, 'admin.matches.hideResultsFailed'),
        }),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('admin.eyebrow')}
        title={t('admin.matches.title')}
        description={t('admin.matches.description')}
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
          submitLabel={editingMatch ? t('common.edit') : t('common.create')}
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
          <div className="p-6 text-sm font-semibold text-zinc-600">
            {t('admin.matches.loading')}
          </div>
        ) : null}

        {matchesQuery.isError ? (
          <div className="space-y-3 p-6">
            <p className="text-sm font-semibold text-red-700">
              {translateApiError(matchesQuery.error, t, 'admin.matches.loadError')}
            </p>
            <button
              type="button"
              onClick={() => void matchesQuery.refetch()}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : null}

        {matchesQuery.isSuccess && matchesQuery.data.data.length === 0 ? (
          <div className="p-6 text-sm font-semibold text-zinc-600">{t('admin.matches.empty')}</div>
        ) : null}

        {matchesQuery.isSuccess && matchesQuery.data.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="table-head">{t('navigation.matchesAdmin')}</th>
                  <th className="table-head">{t('admin.matches.competition')}</th>
                  <th className="table-head">{t('admin.matches.date')}</th>
                  <th className="table-head">{t('common.score')}</th>
                  <th className="table-head">{t('common.status')}</th>
                  <th className="table-head">{t('admin.votes.title')}</th>
                  <th className="table-head text-end">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {matchesQuery.data.data.map((match) => (
                  <tr key={match.id}>
                    <td className="table-cell font-black text-zinc-950">
                      <span className="flex items-center gap-3">
                        <BrandLogo size="sm" />
                        <span className="text-xs font-black uppercase text-zinc-400">vs</span>
                        <OpponentLogo
                          opponentName={match.opponentName}
                          logoUrl={match.opponentLogoUrl}
                          size="sm"
                        />
                        <span>Manchester United vs {match.opponentName}</span>
                      </span>
                    </td>
                    <td className="table-cell">{match.competition}</td>
                    <td className="table-cell">
                      {formatDate(match.matchDate, {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="table-cell font-black text-zinc-950">
                      {formatScore(
                        match.manchesterUnitedScore,
                        match.opponentScore,
                        t('common.upcoming'),
                      )}
                    </td>
                    <td className="table-cell">{t(`statuses.match.${match.status}`)}</td>
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
                              title={t('common.edit')}
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">{t('common.edit')}</span>
                            </button>
                            <Link
                              to={`/admin/matches/${match.id}/lineup`}
                              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-bold text-zinc-700 hover:border-united-red hover:text-united-red"
                            >
                              <ListChecks className="h-4 w-4" aria-hidden="true" />
                              {t('admin.matches.lineup')}
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
                              {t('admin.matches.finish')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setMatchToDelete(match)}
                              className="rounded-md border border-red-200 p-2 text-red-700 hover:bg-red-50"
                              title={t('common.delete')}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">{t('common.delete')}</span>
                            </button>
                          </>
                        ) : null}

                        {match.status === 'finished' && match.votingStatus === 'open' ? (
                          <>
                            <Link
                              to={`/admin/matches/${match.id}/votes`}
                              className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-bold text-white hover:bg-zinc-800"
                            >
                              {t('admin.matches.viewVotes')}
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleCloseVoting(match)}
                              className="rounded-md bg-united-red px-3 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                              disabled={closeMatchVoting.isPending}
                            >
                              {t('admin.matches.closeVoting')}
                            </button>
                          </>
                        ) : null}

                        {match.status === 'finished' && match.votingStatus === 'completed' ? (
                          <>
                            <Link
                              to={`/admin/matches/${match.id}/votes`}
                              className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-bold text-white hover:bg-zinc-800"
                            >
                              {t('admin.matches.viewResults')}
                            </Link>
                            {match.resultsPublished ? (
                              <button
                                type="button"
                                onClick={() => handleHideResults(match)}
                                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-bold text-zinc-700 hover:bg-zinc-100"
                                disabled={unpublishMatchResults.isPending}
                              >
                                <EyeOff className="h-4 w-4" aria-hidden="true" />
                                {t('common.hide')}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handlePublishResults(match)}
                                className="inline-flex items-center gap-2 rounded-md bg-united-red px-3 py-2 text-sm font-bold text-white hover:bg-red-800"
                                disabled={publishMatchResults.isPending}
                              >
                                <Eye className="h-4 w-4" aria-hidden="true" />
                                {t('common.publish')}
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
          title={t('admin.matches.deleteTitle')}
          message={t('admin.matches.deleteMessage', { opponent: matchToDelete.opponentName })}
          confirmLabel={t('common.delete')}
          isSubmitting={deleteMatch.isPending}
          onConfirm={handleDelete}
          onCancel={() => setMatchToDelete(undefined)}
        />
      ) : null}
    </div>
  );
}
