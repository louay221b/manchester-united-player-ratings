import { Save, Trash2, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';

import { ApiPlayerAvatar } from '../../components/ApiPlayerAvatar';
import { BrandLogo } from '../../components/layout/BrandLogo';
import { OpponentLogo } from '../../components/OpponentLogo';
import { PageHeader } from '../../components/PageHeader';
import { useMatchLineup, useMatchLineupMutations } from '../../hooks/use-match-lineup';
import { usePlayers } from '../../hooks/use-players';
import { translateApiError } from '../../i18n/errors';
import { useFormatters } from '../../i18n/format';
import type { LineupPlayerPayload, ParticipationStatus } from '../../types/match';
import type { Player } from '../../types/player';
import { isUuid } from '../../utils/uuid';

interface LineupFormRow {
  playerId: string;
  participationStatus: ParticipationStatus;
  enteredMinute: string;
  exitedMinute: string;
  minutesPlayed: string;
  eligibleForRating: boolean;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

const participationStatuses: ParticipationStatus[] = [
  'starter',
  'substitute_entered',
  'substitute_unused',
];

const toMinuteString = (value: number | null) => (value === null ? '' : String(value));

const toNullableMinute = (value: string) => (value.trim() === '' ? null : Number(value));

const getDefaultRow = (playerId: string): LineupFormRow => ({
  playerId,
  participationStatus: 'starter',
  enteredMinute: '0',
  exitedMinute: '90',
  minutesPlayed: '90',
  eligibleForRating: true,
});

const getDefaultRowForStatus = (
  row: LineupFormRow,
  participationStatus: ParticipationStatus,
): LineupFormRow => {
  if (participationStatus === 'substitute_unused') {
    return {
      ...row,
      participationStatus,
      enteredMinute: '',
      exitedMinute: '',
      minutesPlayed: '0',
      eligibleForRating: false,
    };
  }

  if (participationStatus === 'substitute_entered') {
    return {
      ...row,
      participationStatus,
      enteredMinute: '65',
      exitedMinute: '90',
      minutesPlayed: '25',
      eligibleForRating: true,
    };
  }

  return {
    ...row,
    participationStatus,
    enteredMinute: '0',
    exitedMinute: '90',
    minutesPlayed: '90',
    eligibleForRating: true,
  };
};

const withCalculatedMinutes = (
  row: LineupFormRow,
  field: 'enteredMinute' | 'exitedMinute',
  value: string,
) => {
  const nextRow = { ...row, [field]: value };
  const enteredMinute = toNullableMinute(nextRow.enteredMinute);
  const exitedMinute = toNullableMinute(nextRow.exitedMinute);

  if (enteredMinute !== null && exitedMinute !== null && exitedMinute >= enteredMinute) {
    const minutesPlayed = exitedMinute - enteredMinute;

    return {
      ...nextRow,
      minutesPlayed: String(minutesPlayed),
      eligibleForRating:
        nextRow.participationStatus === 'substitute_unused' ? false : minutesPlayed >= 10,
    };
  }

  return nextRow;
};

export function AdminMatchLineupPage() {
  const { t } = useTranslation();
  const { formatNumber } = useFormatters();
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const hasValidMatchId = isUuid(matchId);
  const safeMatchId = hasValidMatchId ? matchId : '';
  const lineupQuery = useMatchLineup(safeMatchId);
  const playersQuery = usePlayers({ page: 1, limit: 100, active: true }, hasValidMatchId);
  const { replaceMatchLineup } = useMatchLineupMutations();
  const [rows, setRows] = useState<LineupFormRow[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [notification, setNotification] = useState<Notification | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasValidMatchId) {
      navigate('/admin/matches', {
        replace: true,
        state: { message: t('admin.lineup.invalidMatch') },
      });
    }
  }, [hasValidMatchId, navigate, t]);

  useEffect(() => {
    if (!lineupQuery.data) {
      return;
    }

    queueMicrotask(() => {
      setRows(
        lineupQuery.data.players.map((player) => ({
          playerId: player.playerId,
          participationStatus: player.participationStatus,
          enteredMinute: toMinuteString(player.enteredMinute),
          exitedMinute: toMinuteString(player.exitedMinute),
          minutesPlayed: String(player.minutesPlayed),
          eligibleForRating: player.eligibleForRating,
        })),
      );
    });
  }, [lineupQuery.data]);

  const playerOptions = useMemo(() => playersQuery.data?.data ?? [], [playersQuery.data?.data]);
  const playersById = useMemo(() => {
    const map = new Map<string, Player | { id: string; displayName: string; position: string }>();

    playerOptions.forEach((player) => map.set(player.id, player));
    lineupQuery.data?.players.forEach((lineupPlayer) =>
      map.set(lineupPlayer.player.id, {
        id: lineupPlayer.player.id,
        displayName: lineupPlayer.player.displayName,
        position: lineupPlayer.player.position,
      }),
    );

    return map;
  }, [lineupQuery.data?.players, playerOptions]);

  const availablePlayers = playerOptions.filter(
    (player) => !rows.some((row) => row.playerId === player.id),
  );
  const isLocked = lineupQuery.data?.match.votingStatus === 'completed';

  const formatPlayerOption = (player: Player) =>
    [
      player.displayName,
      player.shirtNumber ? `#${formatNumber(player.shirtNumber)}` : null,
      t(`positions.${player.position}`, { defaultValue: player.position }),
    ]
      .filter(Boolean)
      .join(' - ');

  const updateRow = (playerId: string, updater: (row: LineupFormRow) => LineupFormRow) => {
    setRows((current) => current.map((row) => (row.playerId === playerId ? updater(row) : row)));
  };

  const addPlayer = () => {
    if (!selectedPlayerId) {
      return;
    }

    if (rows.some((row) => row.playerId === selectedPlayerId)) {
      setValidationError(t('admin.lineup.duplicatePlayer'));
      return;
    }

    setRows((current) => [...current, getDefaultRow(selectedPlayerId)]);
    setSelectedPlayerId('');
    setValidationError(null);
  };

  const removePlayer = (playerId: string) => {
    setRows((current) => current.filter((row) => row.playerId !== playerId));
  };

  const validateRows = () => {
    if (rows.length === 0) {
      return t('admin.lineup.needPlayer');
    }

    const uniquePlayers = new Set(rows.map((row) => row.playerId));

    if (uniquePlayers.size !== rows.length) {
      return t('admin.lineup.duplicateValidation');
    }

    const invalidRow = rows.find((row) => {
      const minutesPlayed = Number(row.minutesPlayed);
      const enteredMinute = toNullableMinute(row.enteredMinute);
      const exitedMinute = toNullableMinute(row.exitedMinute);

      return (
        !row.playerId ||
        !Number.isInteger(minutesPlayed) ||
        minutesPlayed < 0 ||
        minutesPlayed > 130 ||
        (enteredMinute !== null && exitedMinute !== null && exitedMinute < enteredMinute) ||
        (row.participationStatus === 'substitute_unused' &&
          (minutesPlayed !== 0 ||
            row.eligibleForRating ||
            enteredMinute !== null ||
            exitedMinute !== null)) ||
        (row.participationStatus !== 'substitute_unused' && minutesPlayed <= 0)
      );
    });

    return invalidRow ? t('admin.lineup.invalidRows') : null;
  };

  const toPayload = (): LineupPlayerPayload[] =>
    rows.map((row) => ({
      playerId: row.playerId,
      participationStatus: row.participationStatus,
      enteredMinute: toNullableMinute(row.enteredMinute),
      exitedMinute: toNullableMinute(row.exitedMinute),
      minutesPlayed: Number(row.minutesPlayed),
      eligibleForRating: row.eligibleForRating,
    }));

  const handleSave = () => {
    if (!hasValidMatchId || isLocked) {
      return;
    }

    const error = validateRows();
    setValidationError(error);

    if (error) {
      return;
    }

    setNotification(null);
    replaceMatchLineup.mutate(
      { matchId: safeMatchId, payload: { players: toPayload() } },
      {
        onSuccess: () => {
          setNotification({ type: 'success', message: t('admin.lineup.saved') });
        },
        onError: (mutationError) => {
          setNotification({
            type: 'error',
            message: translateApiError(mutationError, t, 'admin.lineup.saveFailed'),
          });
        },
      },
    );
  };

  if (!hasValidMatchId) {
    return (
      <PageHeader
        eyebrow={t('admin.lineup.title')}
        title={t('admin.lineup.invalidMatch')}
        description={t('admin.lineup.backDescription')}
      />
    );
  }

  if (lineupQuery.isLoading) {
    return (
      <div className="panel p-6 text-sm font-semibold text-zinc-600">{t('common.loading')}</div>
    );
  }

  if (lineupQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow={t('admin.lineup.title')}
          title={t('admin.lineup.notFound')}
          description={translateApiError(lineupQuery.error, t, 'admin.lineup.loadError')}
        />
        <button
          type="button"
          onClick={() => void lineupQuery.refetch()}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  const lineupData = lineupQuery.data;

  if (!lineupData) {
    return null;
  }

  const match = lineupData.match;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('admin.lineup.title')}
        title={`Manchester United vs ${match.opponentName}`}
        description={t('admin.lineup.description')}
        action={
          <>
            <BrandLogo size="sm" />
            <OpponentLogo
              opponentName={match.opponentName}
              logoUrl={match.opponentLogoUrl}
              size="md"
            />
            <Link
              to="/admin/matches"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
            >
              {t('admin.lineup.backToMatches')}
            </Link>
          </>
        }
      />

      {isLocked ? (
        <div className="panel border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          {t('admin.lineup.locked')}
        </div>
      ) : null}

      {notification || validationError ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm font-semibold ${
            notification?.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {validationError ?? notification?.message}
        </div>
      ) : null}

      <section className="panel p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="flex-1 space-y-1 text-sm font-bold text-zinc-700">
            {t('admin.lineup.addActivePlayer')}
            <select
              value={selectedPlayerId}
              onChange={(event) => setSelectedPlayerId(event.target.value)}
              className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
              disabled={isLocked || playersQuery.isLoading}
            >
              <option value="">{t('common.select')}</option>
              {availablePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {formatPlayerOption(player)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={addPlayer}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={isLocked || !selectedPlayerId}
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            {t('common.add')}
          </button>
        </div>
      </section>

      <section className="panel overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-6 text-sm font-semibold text-zinc-600">{t('admin.lineup.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="table-head">{t('players.player')}</th>
                  <th className="table-head">{t('common.status')}</th>
                  <th className="table-head">{t('admin.lineup.entry')}</th>
                  <th className="table-head">{t('admin.lineup.exit')}</th>
                  <th className="table-head">{t('admin.lineup.minutes')}</th>
                  <th className="table-head">{t('admin.lineup.eligible')}</th>
                  <th className="table-head text-end">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {rows.map((row) => {
                  const player = playersById.get(row.playerId);
                  const apiPlayer =
                    lineupData.players.find(
                      (lineupPlayer) => lineupPlayer.playerId === row.playerId,
                    )?.player ?? null;

                  return (
                    <tr key={row.playerId}>
                      <td className="table-cell">
                        <span className="flex items-center gap-3 font-black text-zinc-950">
                          {apiPlayer ? <ApiPlayerAvatar player={apiPlayer} size="sm" /> : null}
                          {player?.displayName ?? t('players.player')}
                        </span>
                      </td>
                      <td className="table-cell">
                        <select
                          value={row.participationStatus}
                          onChange={(event) =>
                            updateRow(row.playerId, (current) =>
                              getDefaultRowForStatus(
                                current,
                                event.target.value as ParticipationStatus,
                              ),
                            )
                          }
                          className="focus-ring min-w-44 rounded-md border border-zinc-300 px-3 py-2"
                          disabled={isLocked}
                        >
                          {participationStatuses.map((status) => (
                            <option key={status} value={status}>
                              {t(`statuses.participation.${status}`)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="table-cell">
                        <input
                          type="number"
                          min="0"
                          max="130"
                          value={row.enteredMinute}
                          onChange={(event) =>
                            updateRow(row.playerId, (current) =>
                              withCalculatedMinutes(current, 'enteredMinute', event.target.value),
                            )
                          }
                          className="focus-ring w-24 rounded-md border border-zinc-300 px-3 py-2"
                          disabled={isLocked || row.participationStatus === 'substitute_unused'}
                        />
                      </td>
                      <td className="table-cell">
                        <input
                          type="number"
                          min="0"
                          max="130"
                          value={row.exitedMinute}
                          onChange={(event) =>
                            updateRow(row.playerId, (current) =>
                              withCalculatedMinutes(current, 'exitedMinute', event.target.value),
                            )
                          }
                          className="focus-ring w-24 rounded-md border border-zinc-300 px-3 py-2"
                          disabled={isLocked || row.participationStatus === 'substitute_unused'}
                        />
                      </td>
                      <td className="table-cell">
                        <input
                          type="number"
                          min="0"
                          max="130"
                          value={row.minutesPlayed}
                          onChange={(event) =>
                            updateRow(row.playerId, (current) => {
                              const minutesPlayed = Number(event.target.value);

                              return {
                                ...current,
                                minutesPlayed: event.target.value,
                                eligibleForRating:
                                  current.participationStatus === 'substitute_unused'
                                    ? false
                                    : Number.isFinite(minutesPlayed) && minutesPlayed >= 10,
                              };
                            })
                          }
                          className="focus-ring w-24 rounded-md border border-zinc-300 px-3 py-2"
                          disabled={isLocked}
                        />
                      </td>
                      <td className="table-cell">
                        <input
                          type="checkbox"
                          checked={row.eligibleForRating}
                          onChange={(event) =>
                            updateRow(row.playerId, (current) => ({
                              ...current,
                              eligibleForRating:
                                current.participationStatus === 'substitute_unused'
                                  ? false
                                  : event.target.checked,
                            }))
                          }
                          className="h-4 w-4 accent-united-red"
                          disabled={isLocked || row.participationStatus === 'substitute_unused'}
                        />
                      </td>
                      <td className="table-cell">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => removePlayer(row.playerId)}
                            className="rounded-md border border-red-200 p-2 text-red-700 hover:bg-red-50"
                            disabled={isLocked}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">{t('admin.lineup.remove')}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="sticky bottom-4 z-20 flex justify-end rounded-lg border border-zinc-200 bg-white p-4 shadow-subtle">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          disabled={isLocked || replaceMatchLineup.isPending}
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {replaceMatchLineup.isPending ? t('common.saving') : t('admin.lineup.save')}
        </button>
      </div>
    </div>
  );
}
