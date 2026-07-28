import { BarChart3, CalendarDays, Trophy, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { activeSeason, getSeasonPlayerStats, matches, players, votes } from '../../data/mockData';
import { ApiError } from '../../lib/api';
import { verifyAdminApiAccess } from '../../services/auth-api.service';

export function AdminDashboardPage() {
  const leader = getSeasonPlayerStats()[0];
  const openVotes = matches.filter((match) => match.voteStatus === 'open').length;
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [apiMessage, setApiMessage] = useState('');

  useEffect(() => {
    let isCancelled = false;

    const verifyApiAccess = async () => {
      setApiStatus('loading');
      setApiMessage('');

      try {
        await verifyAdminApiAccess();

        if (!isCancelled) {
          setApiStatus('success');
          setApiMessage('Acces API administrateur verifie');
        }
      } catch (error) {
        if (!isCancelled) {
          setApiStatus('error');
          setApiMessage(
            error instanceof ApiError
              ? error.message
              : 'Impossible de verifier l acces API administrateur.',
          );
        }
      }
    };

    void verifyApiAccess();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Tableau de bord"
        description="Vue temporaire pour piloter les saisons, les joueurs, les matchs et les votes."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Saison active" value={activeSeason.name.replace('Saison ', '')} />
        <StatCard label="Joueurs" value={players.length} />
        <StatCard label="Matchs" value={matches.length} />
        <StatCard label="Votes" value={votes.length} helper={`${openVotes} matchs ouverts`} />
      </section>

      <section
        className={[
          'panel p-5',
          apiStatus === 'success' ? 'border-emerald-200 bg-emerald-50' : '',
          apiStatus === 'error' ? 'border-red-200 bg-red-50' : '',
        ].join(' ')}
      >
        <p className="text-sm font-black uppercase tracking-[0.12em] text-zinc-500">
          Verification API
        </p>
        <p
          className={[
            'mt-2 font-black',
            apiStatus === 'success' ? 'text-emerald-700' : '',
            apiStatus === 'error' ? 'text-red-700' : '',
            apiStatus === 'loading' ? 'text-zinc-700' : '',
          ].join(' ')}
        >
          {apiStatus === 'loading' ? 'Verification de l acces API administrateur...' : apiMessage}
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <Link
          to="/admin/matches"
          className="panel flex items-start gap-4 p-5 hover:border-united-red hover:bg-red-50/40"
        >
          <CalendarDays className="mt-1 text-united-red" size={24} aria-hidden="true" />
          <span>
            <span className="block font-black text-zinc-950">Matchs</span>
            <span className="mt-1 block text-sm text-zinc-500">Scores, statuts et adversaires.</span>
          </span>
        </Link>
        <Link
          to="/admin/players"
          className="panel flex items-start gap-4 p-5 hover:border-united-red hover:bg-red-50/40"
        >
          <Users className="mt-1 text-united-red" size={24} aria-hidden="true" />
          <span>
            <span className="block font-black text-zinc-950">Joueurs</span>
            <span className="mt-1 block text-sm text-zinc-500">Effectif Manchester United.</span>
          </span>
        </Link>
        <Link
          to="/admin/statistics"
          className="panel flex items-start gap-4 p-5 hover:border-united-red hover:bg-red-50/40"
        >
          <BarChart3 className="mt-1 text-united-red" size={24} aria-hidden="true" />
          <span>
            <span className="block font-black text-zinc-950">Statistiques</span>
            <span className="mt-1 block text-sm text-zinc-500">Moyennes de saison calculees.</span>
          </span>
        </Link>
        <article className="panel flex items-start gap-4 p-5">
          <Trophy className="mt-1 text-united-red" size={24} aria-hidden="true" />
          <span>
            <span className="block font-black text-zinc-950">{leader?.player.displayName ?? '-'}</span>
            <span className="mt-1 block text-sm text-zinc-500">Leader actuel</span>
          </span>
        </article>
      </section>
    </div>
  );
}
