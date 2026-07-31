import { useTranslation } from 'react-i18next';

import type { VotingStatus } from '../types/match';

type BadgeVoteStatus = VotingStatus;

const styles: Record<BadgeVoteStatus, string> = {
  open: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  closed: 'bg-amber-50 text-amber-700 ring-amber-200',
  completed: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
};

export function VoteStatusBadge({ status }: { status: BadgeVoteStatus }) {
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${styles[status]}`}
    >
      {t(`statuses.voting.${status}`)}
    </span>
  );
}
