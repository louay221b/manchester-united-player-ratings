import { PageHeader } from '../../components/PageHeader';
import {
  getMatchById,
  getPlayerById,
  getRatingsForMatch,
  matches,
  UNITED_TEAM_NAME,
} from '../../data/mockData';

export function VoteResultsAdminPage() {
  const completedMatch = matches.find((match) => match.status === 'completed') ?? matches[0];
  const ratings = getRatingsForMatch(completedMatch.id)
    .map((rating) => ({ ...rating, player: getPlayerById(rating.playerId) }))
    .filter((rating) => rating.player)
    .sort((first, second) => second.totalVotes - first.totalVotes);
  const match = getMatchById(completedMatch.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Resultats des votes"
        description={`Controle temporaire des votes pour ${UNITED_TEAM_NAME} vs ${match?.opponent}.`}
      />

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="table-head">Joueur</th>
                <th className="table-head">Votes recus</th>
                <th className="table-head">Note moyenne</th>
                <th className="table-head">Homme du match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {ratings.map((rating) => (
                <tr key={rating.playerId}>
                  <td className="table-cell font-semibold text-zinc-950">{rating.player?.name}</td>
                  <td className="table-cell">{rating.totalVotes.toLocaleString('fr-FR')}</td>
                  <td className="table-cell text-lg font-bold text-united-red">
                    {rating.averageRating.toFixed(1)}
                  </td>
                  <td className="table-cell">{rating.isManOfTheMatch ? 'Oui' : 'Non'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
