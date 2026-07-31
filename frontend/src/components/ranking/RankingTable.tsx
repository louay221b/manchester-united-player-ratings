import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import { ApiPlayerAvatar } from '../ApiPlayerAvatar';
import { useFormatters } from '../../i18n/format';
import type { SeasonRankingRow } from '../../types/ranking';

interface RankingTableProps {
  rows: SeasonRankingRow[];
  linkPlayers?: boolean;
  emptyMessage?: string;
}

const getDisplayName = (row: SeasonRankingRow) => `${row.firstName} ${row.lastName}`;

export function RankingTable({ rows, linkPlayers = true, emptyMessage }: RankingTableProps) {
  const { t } = useTranslation();
  const { formatNumber, formatRating } = useFormatters();
  const resolvedEmptyMessage = emptyMessage ?? t('ranking.noMatchingPlayers');

  if (rows.length === 0) {
    return (
      <div className="panel p-6 text-sm font-semibold text-zinc-600">{resolvedEmptyMessage}</div>
    );
  }

  return (
    <section className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="table-head">{t('ranking.rank')}</th>
              <th className="table-head">{t('players.player')}</th>
              <th className="table-head">{t('players.position')}</th>
              <th className="table-head">{t('ranking.matchesPlayed')}</th>
              <th className="table-head">{t('ranking.ratedMatches')}</th>
              <th className="table-head">{t('ranking.totalVotes')}</th>
              <th className="table-head">{t('ranking.averageRating')}</th>
              <th className="table-head">{t('ranking.manOfTheMatch')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {rows.map((row) => {
              const displayName = getDisplayName(row);
              const playerIdentity = (
                <span className="flex min-w-52 items-center gap-3">
                  <ApiPlayerAvatar
                    player={{
                      firstName: row.firstName,
                      lastName: row.lastName,
                      displayName,
                      photoUrl: row.photoUrl,
                    }}
                    size="sm"
                  />
                  <span>
                    <span className="block font-black text-zinc-950">{displayName}</span>
                    <span className="text-xs font-semibold text-zinc-500">
                      {row.shirtNumber
                        ? `#${formatNumber(row.shirtNumber)}`
                        : t('players.noNumber')}
                    </span>
                  </span>
                </span>
              );

              return (
                <tr key={row.playerId}>
                  <td className="table-cell text-lg font-black text-zinc-950">
                    #{formatNumber(row.rank)}
                  </td>
                  <td className="table-cell">
                    {linkPlayers ? (
                      <Link to={`/players/${row.playerId}`} className="hover:text-united-red">
                        {playerIdentity}
                      </Link>
                    ) : (
                      playerIdentity
                    )}
                  </td>
                  <td className="table-cell">
                    {t(`positions.${row.position}`, { defaultValue: row.position })}
                  </td>
                  <td className="table-cell">{formatNumber(row.matchesPlayed)}</td>
                  <td className="table-cell">{formatNumber(row.ratedMatches)}</td>
                  <td className="table-cell">{formatNumber(row.totalVotes)}</td>
                  <td className="table-cell text-lg font-black text-united-red">
                    {formatRating(row.seasonAverage, t('common.dash'))}
                  </td>
                  <td className="table-cell">{formatNumber(row.manOfTheMatchCount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
