import { Link } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate, matches, UNITED_TEAM_NAME } from '../../data/mockData';

export function MatchesAdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Gestion des matchs"
        description="Manchester United est fixe, l administrateur renseigne seulement l adversaire et les informations du match."
      />

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="table-head">Match</th>
                <th className="table-head">Date</th>
                <th className="table-head">Lieu</th>
                <th className="table-head">Statut</th>
                <th className="table-head">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {matches.map((match) => (
                <tr key={match.id}>
                  <td className="table-cell font-semibold text-zinc-950">
                    {UNITED_TEAM_NAME} vs {match.opponent}
                  </td>
                  <td className="table-cell">{formatDate(match.date)}</td>
                  <td className="table-cell">{match.venue}</td>
                  <td className="table-cell">
                    <StatusBadge status={match.status} />
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to="/admin/lineup"
                        className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700"
                      >
                        Composition
                      </Link>
                      <button
                        type="button"
                        className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700"
                      >
                        Modifier
                      </button>
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
