import { Link } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { VoteStatusBadge } from '../../components/VoteStatusBadge';
import {
  formatDate,
  formatScore,
  getCompetitionById,
  matches,
  UNITED_TEAM_NAME,
} from '../../data/mockData';

export function AdminMatchesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Gestion des matchs"
        description="Manchester United est fixe, l adversaire et le statut des votes varient par match."
      />

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="table-head">Match</th>
                <th className="table-head">Competition</th>
                <th className="table-head">Date</th>
                <th className="table-head">Score</th>
                <th className="table-head">Votes</th>
                <th className="table-head">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {matches.map((match) => (
                <tr key={match.id}>
                  <td className="table-cell font-black text-zinc-950">
                    {UNITED_TEAM_NAME} vs {match.opponent}
                  </td>
                  <td className="table-cell">{getCompetitionById(match.competitionId)?.shortName}</td>
                  <td className="table-cell">{formatDate(match.date)}</td>
                  <td className="table-cell">{formatScore(match)}</td>
                  <td className="table-cell">
                    <VoteStatusBadge status={match.voteStatus} />
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/admin/matches/${match.id}/lineup`}
                        className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-bold text-zinc-700 hover:border-united-red hover:text-united-red"
                      >
                        Composition
                      </Link>
                      <Link
                        to={`/admin/matches/${match.id}/votes`}
                        className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-bold text-white hover:bg-zinc-800"
                      >
                        Votes
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
