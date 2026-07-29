import { Save, Trash2, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';

import { ApiPlayerAvatar } from '../../components/ApiPlayerAvatar';
import { PageHeader } from '../../components/PageHeader';
import { useMatchLineup, useMatchLineupMutations } from '../../hooks/use-match-lineup';
import { usePlayers } from '../../hooks/use-players';
import { ApiError } from '../../lib/api';
import type { LineupPlayerPayload, ParticipationStatus } from '../../types/match';
import type { Player } from '../../types/player';

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

const participationLabels: Record<ParticipationStatus, string> = {
  starter: 'Titulaire',
  substitute_entered: 'Remplacant entre',
  substitute_unused: 'Remplacant non utilise',
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

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

const withCalculatedMinutes = (row: LineupFormRow, field: 'enteredMinute' | 'exitedMinute', value: string) => {
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
  const { matchId } = useParams();
  const lineupQuery = useMatchLineup(matchId ?? '');
  const playersQuery = usePlayers({ page: 1, limit: 100, active: true });
  const { replaceMatchLineup } = useMatchLineupMutations();
  const [rows, setRows] = useState<LineupFormRow[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [notification, setNotification] = useState<Notification | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

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

  const updateRow = (playerId: string, updater: (row: LineupFormRow) => LineupFormRow) => {
    setRows((current) => current.map((row) => (row.playerId === playerId ? updater(row) : row)));
  };

  const addPlayer = () => {
    if (!selectedPlayerId) {
      return;
    }

    if (rows.some((row) => row.playerId === selectedPlayerId)) {
      setValidationError('Ce joueur est deja dans la composition.');
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
      return 'Ajoute au moins un joueur.';
    }

    const uniquePlayers = new Set(rows.map((row) => row.playerId));

    if (uniquePlayers.size !== rows.length) {
      return 'Un joueur ne peut apparaitre qu une fois.';
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

    return invalidRow ? 'Corrige les minutes, le statut ou l eligibilite avant d enregistrer.' : null;
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
    if (!matchId || isLocked) {
      return;
    }

    const error = validateRows();
    setValidationError(error);

    if (error) {
      return;
    }

    setNotification(null);
    replaceMatchLineup.mutate(
      { matchId, payload: { players: toPayload() } },
      {
        onSuccess: () => {
          setNotification({ type: 'success', message: 'Composition enregistree.' });
        },
        onError: (mutationError) => {
          setNotification({
            type: 'error',
            message: getErrorMessage(mutationError, 'Impossible d enregistrer la composition.'),
          });
        },
      },
    );
  };

  if (!matchId) {
    return (
      <PageHeader
        eyebrow="Composition"
        title="Match introuvable"
        description="Aucun identifiant de match n a ete fourni."
      />
    );
  }

  if (lineupQuery.isLoading) {
    return <div className="panel p-6 text-sm font-semibold text-zinc-600">Chargement...</div>;
  }

  if (lineupQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Composition"
          title="Composition introuvable"
          description={getErrorMessage(lineupQuery.error, 'Impossible de charger la composition.')}
        />
        <button
          type="button"
          onClick={() => void lineupQuery.refetch()}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
        >
          Reessayer
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
        eyebrow="Composition"
        title={`Manchester United vs ${match.opponentName}`}
        description="Titulaires, remplacants entres, remplacants non utilises et eligibilite au vote."
        action={
          <Link
            to="/admin/matches"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 hover:bg-zinc-100"
          >
            Retour aux matchs
          </Link>
        }
      />

      {isLocked ? (
        <div className="panel border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          Les votes sont termines. La composition ne peut plus etre modifiee.
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
            Ajouter un joueur actif
            <select
              value={selectedPlayerId}
              onChange={(event) => setSelectedPlayerId(event.target.value)}
              className="focus-ring w-full rounded-md border border-zinc-300 px-3 py-2"
              disabled={isLocked || playersQuery.isLoading}
            >
              <option value="">Selectionner</option>
              {availablePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.displayName} - {player.position}
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
            Ajouter
          </button>
        </div>
      </section>

      <section className="panel overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-6 text-sm font-semibold text-zinc-600">Aucun joueur dans la composition.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="table-head">Joueur</th>
                  <th className="table-head">Statut</th>
                  <th className="table-head">Entree</th>
                  <th className="table-head">Sortie</th>
                  <th className="table-head">Minutes</th>
                  <th className="table-head">Eligible</th>
                  <th className="table-head text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {rows.map((row) => {
                  const player = playersById.get(row.playerId);
                  const apiPlayer =
                    lineupData.players.find((lineupPlayer) => lineupPlayer.playerId === row.playerId)
                      ?.player ?? null;

                  return (
                    <tr key={row.playerId}>
                      <td className="table-cell">
                        <span className="flex items-center gap-3 font-black text-zinc-950">
                          {apiPlayer ? <ApiPlayerAvatar player={apiPlayer} size="sm" /> : null}
                          {player?.displayName ?? 'Joueur'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <select
                          value={row.participationStatus}
                          onChange={(event) =>
                            updateRow(row.playerId, (current) =>
                              getDefaultRowForStatus(current, event.target.value as ParticipationStatus),
                            )
                          }
                          className="focus-ring min-w-44 rounded-md border border-zinc-300 px-3 py-2"
                          disabled={isLocked}
                        >
                          {Object.entries(participationLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
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
                            <span className="sr-only">Retirer</span>
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
          {replaceMatchLineup.isPending ? 'Enregistrement...' : 'Enregistrer la composition'}
        </button>
      </div>
    </div>
  );
}
