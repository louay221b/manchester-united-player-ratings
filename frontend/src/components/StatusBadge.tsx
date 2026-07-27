import type { MatchStatus } from '../types/domain';

const statusLabels: Record<MatchStatus, string> = {
  upcoming: 'A venir',
  'voting-open': 'Votes ouverts',
  completed: 'Termine',
};

const statusClasses: Record<MatchStatus, string> = {
  upcoming: 'bg-sky-50 text-sky-700 ring-sky-200',
  'voting-open': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  completed: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
};

export function StatusBadge({ status }: { status: MatchStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
