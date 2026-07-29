import { Link } from 'react-router';

import { ApiPlayerAvatar } from '../ApiPlayerAvatar';
import type { SeasonRankingRow } from '../../types/ranking';

interface RankingTableProps {
  rows: SeasonRankingRow[];
  linkPlayers?: boolean;
  emptyMessage?: string;
}

const formatAverage = (value: number | null) => (value === null ? '—' : value.toFixed(2));

const getDisplayName = (row: SeasonRankingRow) => `${row.firstName} ${row.lastName}`;

export function RankingTable({
  rows,
  linkPlayers = true,
  emptyMessage = 'Aucun joueur ne correspond aux filtres.',
}: RankingTableProps) {
  if (rows.length === 0) {
    return <div className="panel p-6 text-sm font-semibold text-zinc-600">{emptyMessage}</div>;
  }

  return (
    <section className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="table-head">Rang</th>
              <th className="table-head">Joueur</th>
              <th className="table-head">Poste</th>
              <th className="table-head">Matchs joues</th>
              <th className="table-head">Matchs notes</th>
              <th className="table-head">Votes</th>
              <th className="table-head">Moyenne</th>
              <th className="table-head">Homme du match</th>
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
                      {row.shirtNumber ? `#${row.shirtNumber}` : 'Sans numero'}
                    </span>
                  </span>
                </span>
              );

              return (
                <tr key={row.playerId}>
                  <td className="table-cell text-lg font-black text-zinc-950">#{row.rank}</td>
                  <td className="table-cell">
                    {linkPlayers ? (
                      <Link to={`/players/${row.playerId}`} className="hover:text-united-red">
                        {playerIdentity}
                      </Link>
                    ) : (
                      playerIdentity
                    )}
                  </td>
                  <td className="table-cell">{row.position}</td>
                  <td className="table-cell">{row.matchesPlayed}</td>
                  <td className="table-cell">{row.ratedMatches}</td>
                  <td className="table-cell">{row.totalVotes}</td>
                  <td className="table-cell text-lg font-black text-united-red">
                    {formatAverage(row.seasonAverage)}
                  </td>
                  <td className="table-cell">{row.manOfTheMatchCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
