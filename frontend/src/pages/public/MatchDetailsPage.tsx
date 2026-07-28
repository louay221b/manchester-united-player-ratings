import { BarChart3, Star } from 'lucide-react';
import { Link, useParams } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { PlayerCard } from '../../components/PlayerCard';
import { VoteStatusBadge } from '../../components/VoteStatusBadge';
import {
  formatDate,
  formatScore,
  getCompetitionById,
  getMatchById,
  getPlayersForMatch,
  UNITED_TEAM_NAME,
} from '../../data/mockData';

export function MatchDetailsPage() {
  const { matchId } = useParams();
  const match = matchId ? getMatchById(matchId) : undefined;

  if (!match) {
    return (
      <PageHeader
        eyebrow="Erreur"
        title="Match introuvable"
        description="La fiche demandee n existe pas dans les donnees temporaires."
      />
    );
  }

  const competition = getCompetitionById(match.competitionId);
  const players = getPlayersForMatch(match.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={competition?.name ?? 'Match'}
        title={`${UNITED_TEAM_NAME} vs ${match.opponent}`}
        description={`${formatDate(match.date)} - ${match.venue}`}
        action={
          <>
            {match.voteStatus === 'open' ? (
              <Link
                to={`/matches/${match.id}/vote`}
                className="inline-flex items-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
              >
                <Star size={18} aria-hidden="true" />
                Voter
              </Link>
            ) : null}
            <Link
              to={`/matches/${match.id}/results`}
              className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-black text-white hover:bg-zinc-800"
            >
              <BarChart3 size={18} aria-hidden="true" />
              Resultats
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <article className="panel p-5 md:col-span-2">
          <p className="text-sm font-semibold text-zinc-500">Score</p>
          <p className="mt-2 text-4xl font-black text-zinc-950">{formatScore(match)}</p>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Statut votes</p>
          <div className="mt-3">
            <VoteStatusBadge status={match.voteStatus} />
          </div>
        </article>
        <article className="panel p-5">
          <p className="text-sm font-semibold text-zinc-500">Lieu</p>
          <p className="mt-2 text-lg font-black text-zinc-950">
            {match.homeAway === 'away' ? 'Exterieur' : 'Domicile'}
          </p>
        </article>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-black text-zinc-950">Joueurs participants</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      </section>
    </div>
  );
}
