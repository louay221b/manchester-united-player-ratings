import { Link, useParams } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import {
  getMatchById,
  getPlayerById,
  getRatingsForMatch,
  UNITED_TEAM_NAME,
} from '../../data/mockData';

export function MatchResultsPage() {
  const { matchId } = useParams();
  const match = matchId ? getMatchById(matchId) : undefined;

  if (!match) {
    return <PageHeader title="Resultats indisponibles" description="Le match demande n existe pas." />;
  }

  const ratings = getRatingsForMatch(match.id)
    .map((rating) => ({ ...rating, player: getPlayerById(rating.playerId) }))
    .filter((rating) => rating.player)
    .sort((first, second) => second.averageRating - first.averageRating);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Resultats du match"
        title={`${UNITED_TEAM_NAME} vs ${match.opponent}`}
        description="Notes moyennes temporaires, votes recus et homme du match."
      />

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="table-head">Joueur</th>
                <th className="table-head">Poste</th>
                <th className="table-head">Votes</th>
                <th className="table-head">Note moyenne</th>
                <th className="table-head">Distinction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {ratings.map((rating) => (
                <tr key={rating.playerId}>
                  <td className="table-cell font-semibold text-zinc-950">
                    <Link to={`/players/${rating.playerId}`} className="hover:text-united-red">
                      {rating.player?.name}
                    </Link>
                  </td>
                  <td className="table-cell">{rating.player?.position}</td>
                  <td className="table-cell">{rating.totalVotes.toLocaleString('fr-FR')}</td>
                  <td className="table-cell text-lg font-bold text-united-red">
                    {rating.averageRating.toFixed(1)}
                  </td>
                  <td className="table-cell">
                    {rating.isManOfTheMatch ? 'Homme du match' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ratings.length === 0 ? (
          <p className="px-5 py-6 text-sm text-zinc-500">Aucune note temporaire pour ce match.</p>
        ) : null}
      </section>
    </div>
  );
}
