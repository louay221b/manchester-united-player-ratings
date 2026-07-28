import type { VoteStatus } from '../types';

const labels: Record<VoteStatus, string> = {
  open: 'Votes ouverts',
  closed: 'Votes fermes',
  finished: 'Votes termines',
};

const styles: Record<VoteStatus, string> = {
  open: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  closed: 'bg-amber-50 text-amber-700 ring-amber-200',
  finished: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
};

export function VoteStatusBadge({ status }: { status: VoteStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
