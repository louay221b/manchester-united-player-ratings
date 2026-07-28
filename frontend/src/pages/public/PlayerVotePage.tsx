import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { RatingInput } from '../../components/RatingInput';
import {
  formatDate,
  getMatchById,
  getPlayersForMatch,
  UNITED_TEAM_NAME,
} from '../../data/mockData';

export function PlayerVotePage() {
  const { matchId } = useParams();
  const match = matchId ? getMatchById(matchId) : undefined;
  const [ratings, setRatings] = useState<Record<string, number>>({});

  if (!match) {
    return (
      <PageHeader
        eyebrow="Vote"
        title="Match introuvable"
        description="Impossible de charger le formulaire de vote."
      />
    );
  }

  const players = getPlayersForMatch(match.id);
  const allRated = players.every((player) => ratings[player.id]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vote supporters"
        title={`Noter ${UNITED_TEAM_NAME} vs ${match.opponent}`}
        description={`${formatDate(match.date)} - notes de 1 a 10 par pas de 0,5`}
      />

      {match.voteStatus !== 'open' ? (
        <div className="panel border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          Les votes ne sont pas ouverts pour ce match. Le formulaire reste visible comme maquette
          frontend.
        </div>
      ) : null}

      <form className="space-y-4">
        {players.map((player) => (
          <section key={player.id} className="panel p-5">
            <div className="grid gap-4 lg:grid-cols-[280px_1fr] lg:items-center">
              <div className="flex items-center gap-4">
                <PlayerAvatar player={player} />
                <div>
                  <p className="font-black text-zinc-950">
                    #{player.shirtNumber} {player.displayName}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">{player.position}</p>
                </div>
              </div>
              <RatingInput
                value={ratings[player.id]}
                onChange={(rating) =>
                  setRatings((current) => ({
                    ...current,
                    [player.id]: rating,
                  }))
                }
              />
            </div>
          </section>
        ))}

        <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-zinc-600">
            {Object.keys(ratings).length}/{players.length} joueurs notes
          </p>
          <button
            type="button"
            disabled={!allRated}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            <CheckCircle2 size={18} aria-hidden="true" />
            Envoyer les notes
          </button>
        </div>
      </form>

      <Link to={`/matches/${match.id}`} className="text-sm font-black text-united-red hover:text-red-800">
        Retour au match
      </Link>
    </div>
  );
}
