import { useParams } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import {
  formatRating,
  getMatchById,
  getMatchResultRows,
  getVotesForMatch,
  UNITED_TEAM_NAME,
} from '../../data/mockData';

export function AdminMatchVotesPage() {
  const { matchId } = useParams();
  const match = matchId ? getMatchById(matchId) : undefined;

  if (!match) {
    return (
      <PageHeader
        eyebrow="Administration"
        title="Votes introuvables"
        description="Le match demande n existe pas."
      />
    );
  }

  const rows = getMatchResultRows(match.id);
  const totalVotes = getVotesForMatch(match.id).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Votes"
        title={`${UNITED_TEAM_NAME} vs ${match.opponent}`}
        description={`${totalVotes} votes temporaires pour ce match.`}
      />

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="table-head">Joueur</th>
                <th className="table-head">Votes</th>
                <th className="table-head">Note moyenne</th>
                <th className="table-head">Homme du match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {rows.map((row) => (
                <tr key={row.player.id}>
                  <td className="table-cell">
                    <span className="flex items-center gap-3 font-black text-zinc-950">
                      <PlayerAvatar player={row.player} size="sm" />
                      {row.player.displayName}
                    </span>
                  </td>
                  <td className="table-cell">{row.totalVotes}</td>
                  <td className="table-cell text-lg font-black text-united-red">
                    {formatRating(row.averageRating)}
                  </td>
                  <td className="table-cell">{row.isManOfTheMatch ? 'Oui' : 'Non'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
