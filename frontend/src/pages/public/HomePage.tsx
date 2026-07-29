import { ArrowRight, BarChart3, CalendarDays, Star } from 'lucide-react';
import { Link } from 'react-router';

import { ApiPlayerAvatar } from '../../components/ApiPlayerAvatar';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { VoteStatusBadge } from '../../components/VoteStatusBadge';
import { useAuth } from '../../contexts/useAuth';
import { useMatches } from '../../hooks/use-matches';
import { usePlayers } from '../../hooks/use-players';
import { useActiveSeasonRanking } from '../../hooks/use-season-ranking';
import { useSeasons } from '../../hooks/use-seasons';
import { useVotingMatches } from '../../hooks/use-voting-matches';
import type { Match, MatchFilters } from '../../types/match';
import type { PlayerFilters } from '../../types/player';
import type { RankingFilters, SeasonRankingRow } from '../../types/ranking';

const recentMatchesFilters: MatchFilters = { page: 1, limit: 2 };
const openMatchesFilters: MatchFilters = { page: 1, limit: 1, votingStatus: 'open' };
const activePlayersFilters: PlayerFilters = { page: 1, limit: 1, active: true };
const homeRankingFilters: RankingFilters = { active: true };

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));

const formatScore = (match: Match) => {
  if (match.manchesterUnitedScore === null || match.opponentScore === null) {
    return 'A venir';
  }

  return `${match.manchesterUnitedScore}-${match.opponentScore}`;
};

function RecentMatchCard({ match }: { match: Match }) {
  return (
    <article className="panel overflow-hidden">
      <div className="border-b border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">{match.competition}</p>
            <h2 className="mt-2 text-xl font-black text-zinc-950">
              Manchester United vs {match.opponentName}
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              {formatDate(match.matchDate)} - {match.venue ?? 'Lieu a confirmer'}
            </p>
          </div>
          <VoteStatusBadge status={match.votingStatus} />
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
        {match.votingStatus === 'open' ? (
          <Link
            to={`/matches/${match.id}/vote`}
            className="inline-flex items-center gap-2 rounded-md bg-united-red px-3 py-2 text-sm font-bold text-white hover:bg-red-800"
          >
            Voter
            <Star size={16} aria-hidden="true" />
          </Link>
        ) : null}
        {match.resultsPublished ? (
          <Link
            to={`/matches/${match.id}/results`}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-3 py-2 text-sm font-bold text-white hover:bg-zinc-800"
          >
            Resultats
            <BarChart3 size={16} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function RankingLeaderCard({ player }: { player: SeasonRankingRow }) {
  const displayName = `${player.firstName} ${player.lastName}`;

  return (
    <Link
      to={`/players/${player.playerId}`}
      className="panel flex items-center gap-4 p-4 hover:border-united-red hover:bg-red-50/40"
    >
      <ApiPlayerAvatar
        player={{
          firstName: player.firstName,
          lastName: player.lastName,
          displayName,
          photoUrl: player.photoUrl,
        }}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-zinc-950">
          {player.shirtNumber ? `#${player.shirtNumber} ` : ''}
          {displayName}
        </span>
        <span className="mt-1 block text-sm text-zinc-500">{player.position}</span>
      </span>
      <span className="text-right">
        <span className="block text-xl font-black text-united-red">
          {player.seasonAverage === null ? '—' : player.seasonAverage.toFixed(2)}
        </span>
        <span className="text-xs font-semibold uppercase text-zinc-500">moy.</span>
      </span>
    </Link>
  );
}

export function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const seasonsQuery = useSeasons();
  const recentMatchesQuery = useMatches(recentMatchesFilters);
  const openMatchesQuery = useMatches(openMatchesFilters);
  const activePlayersQuery = usePlayers(activePlayersFilters);
  const rankingQuery = useActiveSeasonRanking(homeRankingFilters);
  const votingMatchesQuery = useVotingMatches(isAuthenticated && !isLoading);
  const activeSeason = seasonsQuery.data?.find((season) => season.status === 'active');
  const recentMatches = recentMatchesQuery.data?.data ?? [];
  const leaders = (rankingQuery.data?.ranking ?? [])
    .filter((row) => row.seasonAverage !== null)
    .slice(0, 3);
  const publicOpenMatch = openMatchesQuery.data?.data[0];
  const liveOpenMatch = votingMatchesQuery.data?.[0];
  const voteTargetMatchId = liveOpenMatch?.id ?? publicOpenMatch?.id;
  const publishedVoteCount =
    rankingQuery.data?.ranking.reduce((total, row) => total + row.totalVotes, 0) ?? 0;

  return (
    <div className="space-y-8">
      <section className="panel-dark overflow-hidden">
        <div className="grid gap-8 p-6 md:grid-cols-[1fr_320px] md:p-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-red-200">
              Manchester United
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-normal text-white md:text-5xl">
              Player Ratings
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
              Note les joueurs apres les matchs, consulte les resultats publies et suis le
              classement de saison calcule depuis les moyennes par match.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={voteTargetMatchId ? `/matches/${voteTargetMatchId}/vote` : '/matches'}
                className="inline-flex items-center gap-2 rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
              >
                <Star size={18} aria-hidden="true" />
                Noter un match
              </Link>
              <Link
                to="/ranking"
                className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-4 py-2 text-sm font-black text-white hover:border-white"
              >
                <BarChart3 size={18} aria-hidden="true" />
                Classement
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm font-bold text-zinc-400">Saison active</p>
            <p className="mt-2 text-2xl font-black text-white">
              {seasonsQuery.isLoading ? 'Chargement...' : (activeSeason?.name ?? 'Aucune saison')}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-zinc-950 p-4">
                <p className="text-3xl font-black text-white">
                  {recentMatchesQuery.data?.pagination.total ?? '—'}
                </p>
                <p className="text-sm text-zinc-400">matchs</p>
              </div>
              <div className="rounded-lg bg-zinc-950 p-4">
                <p className="text-3xl font-black text-white">{publishedVoteCount}</p>
                <p className="text-sm text-zinc-400">votes publies</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Votes ouverts" value={openMatchesQuery.data?.pagination.total ?? '—'} />
        <StatCard
          label="Joueurs actifs"
          value={activePlayersQuery.data?.pagination.total ?? '—'}
          helper="Effectif API"
        />
        <StatCard label="Saison" value={activeSeason?.name ?? '—'} helper="Saison active" />
      </section>

      <section className="space-y-4">
        <PageHeader
          eyebrow="Votes"
          title="Votes disponibles"
          description="Les matchs termines apparaissent ici automatiquement quand les votes sont ouverts."
        />

        {!isAuthenticated ? (
          <div className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-zinc-600">
              Connecte-toi pour ouvrir ton bulletin et enregistrer tes notes.
            </p>
            <Link
              to="/login"
              className="rounded-md bg-united-red px-4 py-2 text-sm font-black text-white hover:bg-red-800"
            >
              Connexion
            </Link>
          </div>
        ) : null}

        {isAuthenticated && votingMatchesQuery.isLoading ? (
          <div className="panel p-5 text-sm font-semibold text-zinc-600">
            Chargement des votes disponibles...
          </div>
        ) : null}

        {isAuthenticated && votingMatchesQuery.isError ? (
          <div className="panel p-5 text-sm font-semibold text-red-700">
            Impossible de charger les votes disponibles.
          </div>
        ) : null}

        {isAuthenticated && votingMatchesQuery.isSuccess && votingMatchesQuery.data.length === 0 ? (
          <div className="panel p-5 text-sm font-semibold text-zinc-600">
            Aucun match ouvert au vote pour le moment.
          </div>
        ) : null}

        {isAuthenticated && votingMatchesQuery.isSuccess && votingMatchesQuery.data.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {votingMatchesQuery.data.map((match) => (
              <RecentMatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <PageHeader
            eyebrow="Matchs"
            title="Affiches recentes"
            description="Manchester United reste l equipe principale, seul l adversaire change."
          />
          {recentMatchesQuery.isLoading ? (
            <div className="panel p-5 text-sm font-semibold text-zinc-600">
              Chargement des matchs...
            </div>
          ) : null}
          {recentMatchesQuery.isError ? (
            <div className="panel p-5 text-sm font-semibold text-red-700">
              Impossible de charger les matchs recents.
            </div>
          ) : null}
          {recentMatchesQuery.isSuccess && recentMatches.length === 0 ? (
            <div className="panel p-5 text-sm font-semibold text-zinc-600">
              Aucun match cree pour le moment.
            </div>
          ) : null}
          <div className="grid gap-4">
            {recentMatches.map((match) => (
              <RecentMatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={20} className="text-united-red" aria-hidden="true" />
            <h2 className="text-xl font-black text-zinc-950">Top saison</h2>
          </div>
          {rankingQuery.isLoading ? (
            <div className="panel p-5 text-sm font-semibold text-zinc-600">
              Chargement du classement...
            </div>
          ) : null}
          {rankingQuery.isError ? (
            <div className="panel p-5 text-sm font-semibold text-red-700">
              Impossible de charger le classement public.
            </div>
          ) : null}
          {rankingQuery.isSuccess && leaders.length === 0 ? (
            <div className="panel p-5 text-sm font-semibold text-zinc-600">
              Aucun resultat publie pour le moment.
            </div>
          ) : null}
          <div className="grid gap-3">
            {leaders.map((player) => (
              <RankingLeaderCard key={player.playerId} player={player} />
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
