import type { VoteStatus } from '../types';

type BadgeVoteStatus = VoteStatus | 'completed';

const labels: Record<BadgeVoteStatus, string> = {
  open: 'Votes ouverts',
  closed: 'Votes fermes',
  finished: 'Votes termines',
  completed: 'Votes termines',
};

const styles: Record<BadgeVoteStatus, string> = {
  open: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  closed: 'bg-amber-50 text-amber-700 ring-amber-200',
  finished: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  completed: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
};

export function VoteStatusBadge({ status }: { status: BadgeVoteStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
