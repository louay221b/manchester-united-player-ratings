import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { formatDate, getLineupPlayers, getMatchById, UNITED_TEAM_NAME } from '../../data/mockData';

const ratingOptions = Array.from({ length: 10 }, (_, index) => index + 1);

export function PlayerVotePage() {
  const { matchId } = useParams();
  const match = matchId ? getMatchById(matchId) : undefined;
  const [ratings, setRatings] = useState<Record<string, number>>({});

  if (!match) {
    return <PageHeader title="Vote indisponible" description="Le match demande n existe pas encore." />;
  }

  const lineup = getLineupPlayers(match);
  const allRated = lineup.every((player) => ratings[player.id]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vote supporters"
        title={`Noter ${UNITED_TEAM_NAME} vs ${match.opponent}`}
        description={`${formatDate(match.date)} - ${match.lineupPlayerIds.length} joueurs a noter`}
      />

      <form className="space-y-4">
        {lineup.map((player) => (
          <section key={player.id} className="panel p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-lg font-bold text-zinc-950">
                  #{player.shirtNumber} {player.name}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {player.position} - {player.nationality}
                </p>
              </div>
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                {ratingOptions.map((score) => {
                  const isSelected = ratings[player.id] === score;

                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setRatings((current) => ({ ...current, [player.id]: score }))}
                      className={[
                        'focus-ring flex h-10 w-10 items-center justify-center rounded-md border text-sm font-bold',
                        isSelected
                          ? 'border-united-red bg-united-red text-white'
                          : 'border-zinc-300 bg-white text-zinc-700 hover:border-united-red hover:text-united-red',
                      ].join(' ')}
                      aria-pressed={isSelected}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        ))}

        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-600">
            {Object.keys(ratings).length}/{lineup.length} joueurs notes
          </p>
          <button
            type="button"
            disabled={!allRated}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            <CheckCircle2 size={18} aria-hidden="true" />
            Envoyer les notes
          </button>
        </div>
      </form>

      <Link to={`/matches/${match.id}`} className="inline-block text-sm font-semibold text-united-red">
        Retour au match
      </Link>
    </div>
  );
}
