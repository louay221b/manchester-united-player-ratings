import { Link, Outlet, useNavigate } from 'react-router';

import { NavLinkItem } from '../components/NavLinkItem';
import { useAuth } from '../contexts/useAuth';
import { matches } from '../data/mockData';
import { AccessDeniedPage } from '../pages/AccessDeniedPage';

const firstMatchId = matches[0]?.id ?? '';

const links = [
  { to: '/admin', label: 'Tableau de bord', end: true },
  { to: '/admin/seasons', label: 'Saisons' },
  { to: '/admin/players', label: 'Joueurs' },
  { to: '/admin/matches', label: 'Matchs' },
  { to: `/admin/matches/${firstMatchId}/lineup`, label: 'Composition' },
  { to: `/admin/matches/${firstMatchId}/votes`, label: 'Votes' },
  { to: '/admin/statistics', label: 'Statistiques' },
];

export function AdminLayout() {
  const { logout, role, user } = useAuth();
  const navigate = useNavigate();

  if (role !== 'admin') {
    return <AccessDeniedPage />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="panel h-fit p-3">
        <div className="px-3 py-2">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-united-red">Admin</p>
          <p className="mt-1 text-sm font-semibold text-zinc-500">
            {user?.name ?? 'Pilotage frontend temporaire'}
          </p>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {links.map((link) => (
            <NavLinkItem key={link.to} {...link} />
          ))}
        </nav>
        <Link
          to="/"
          className="mt-4 block rounded-md border border-zinc-300 px-3 py-2 text-center text-sm font-bold text-zinc-700 hover:border-united-red hover:text-united-red"
        >
          Retour public
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 w-full rounded-md bg-zinc-950 px-3 py-2 text-center text-sm font-black text-white hover:bg-zinc-800"
        >
          Deconnexion
        </button>
      </aside>
      <section>
        <Outlet />
      </section>
    </div>
  );
}
