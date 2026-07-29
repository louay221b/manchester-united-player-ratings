import { Link } from 'react-router';
import { Medal } from 'lucide-react';

import { ApiPlayerAvatar } from '../ApiPlayerAvatar';
import type { SeasonRankingRow } from '../../types/ranking';

interface RankingPodiumProps {
  rows: SeasonRankingRow[];
}

const podiumStyles = [
  'border-united-red bg-red-50',
  'border-zinc-300 bg-zinc-50',
  'border-amber-200 bg-amber-50',
];

const formatAverage = (value: number | null) => (value === null ? '—' : value.toFixed(2));

export function RankingPodium({ rows }: RankingPodiumProps) {
  const podiumRows = rows.filter((row) => row.seasonAverage !== null).slice(0, 3);

  if (podiumRows.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {podiumRows.map((row, index) => {
        const displayName = `${row.firstName} ${row.lastName}`;

        return (
          <Link
            key={row.playerId}
            to={`/players/${row.playerId}`}
            className={`panel flex items-center gap-4 border-2 p-5 hover:border-united-red ${podiumStyles[index]}`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-white">
              <Medal size={20} aria-hidden="true" />
            </span>
            <ApiPlayerAvatar
              player={{
                firstName: row.firstName,
                lastName: row.lastName,
                displayName,
                photoUrl: row.photoUrl,
              }}
              size="md"
            />
            <span className="min-w-0">
              <span className="block text-sm font-black uppercase tracking-wide text-united-red">
                #{row.rank}
              </span>
              <span className="block truncate text-lg font-black text-zinc-950">{displayName}</span>
              <span className="mt-1 block text-sm font-semibold text-zinc-600">
                {formatAverage(row.seasonAverage)} de moyenne
              </span>
            </span>
          </Link>
        );
      })}
    </section>
  );
}
