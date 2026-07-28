import { ArrowRight, BarChart3, Star } from 'lucide-react';
import { Link } from 'react-router';

import { VoteStatusBadge } from './VoteStatusBadge';
import {
  formatDate,
  formatScore,
  getCompetitionById,
  UNITED_TEAM_NAME,
} from '../data/mockData';
import type { Match } from '../types';

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const competition = getCompetitionById(match.competitionId);

  return (
    <article className="panel overflow-hidden">
      <div className="border-b border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">{competition?.shortName ?? 'Match'}</p>
            <h2 className="mt-2 text-xl font-black text-zinc-950">
              {UNITED_TEAM_NAME} vs {match.opponent}
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              {formatDate(match.date)} - {match.venue}
            </p>
          </div>
          <VoteStatusBadge status={match.voteStatus} />
        </div>
        <p className="mt-4 text-3xl font-black text-zinc-950">{formatScore(match)}</p>
      </div>
      <div className="flex flex-wrap gap-2 bg-zinc-50 px-5 py-4">
        <Link
          to={`/matches/${match.id}`}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-bold text-zinc-700 hover:border-united-red hover:text-united-red"
        >
          Details
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        {match.voteStatus === 'open' ? (
          <Link
            to={`/matches/${match.id}/vote`}
            className="inline-flex items-center gap-2 rounded-md bg-united-red px-3 py-2 text-sm font-bold text-white hover:bg-red-800"
          >
            Voter
            <Star size={16} aria-hidden="true" />
          </Link>
        ) : null}
        <Link
          to={`/matches/${match.id}/results`}
          className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-3 py-2 text-sm font-bold text-white hover:bg-zinc-800"
        >
          Resultats
          <BarChart3 size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
