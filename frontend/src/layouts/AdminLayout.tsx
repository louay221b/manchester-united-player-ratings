import { Link, Outlet, useNavigate } from 'react-router';

import { NavLinkItem } from '../components/NavLinkItem';
import { useAuth } from '../contexts/useAuth';
import { AccessDeniedPage } from '../pages/AccessDeniedPage';

const links = [
  { to: '/admin', label: 'Tableau de bord', end: true },
  { to: '/admin/seasons', label: 'Saisons' },
  { to: '/admin/players', label: 'Joueurs' },
  { to: '/admin/matches', label: 'Matchs' },
  { to: '/admin/statistics', label: 'Statistiques' },
];

export function AdminLayout() {
  const { isLoading, profile, profileError, role, signOut, user } = useAuth();
  const navigate = useNavigate();
  const displayName = profile?.full_name || user?.email || 'Administrateur';

  if (isLoading) {
    return (
      <div className="panel p-6 text-sm font-semibold text-zinc-600">
        Chargement de l espace administrateur...
      </div>
    );
  }

  if (role !== 'admin') {
    return <AccessDeniedPage description={profileError ?? undefined} />;
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="panel h-fit p-3">
        <div className="px-3 py-2">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-united-red">Admin</p>
          <p className="mt-1 text-sm font-semibold text-zinc-500">{displayName}</p>
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
        <div className="mt-4 border-t border-zinc-200 px-3 pt-4 text-xs font-semibold text-zinc-500">
          <p>Developpe par Ing. Louay Tanazefti</p>
          <a
            href="mailto:tanazeftilouay@gmail.com"
            className="focus-ring mt-1 inline-flex rounded-md text-united-red hover:text-red-800"
          >
            tanazeftilouay@gmail.com
          </a>
        </div>
      </aside>
      <section>
        <Outlet />
      </section>
    </div>
  );
}
