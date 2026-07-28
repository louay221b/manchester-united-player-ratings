import { Shield } from 'lucide-react';
import { Link, Outlet, useNavigate } from 'react-router';

import { NavLinkItem } from '../components/NavLinkItem';
import { useAuth } from '../contexts/useAuth';

const baseLinks = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/matches', label: 'Matchs' },
  { to: '/ranking', label: 'Classement' },
];

export function PublicLayout() {
  const { isAuthenticated, logout, role, user } = useAuth();
  const navigate = useNavigate();
  const links = [
    ...baseLinks,
    ...(role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
    ...(!isAuthenticated
      ? [
          { to: '/login', label: 'Connexion' },
          { to: '/register', label: 'Inscription' },
        ]
      : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-united-red text-white">
                <Shield size={24} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
                  Manchester United
                </span>
                <span className="block text-lg font-black text-zinc-950">Player Ratings</span>
              </span>
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="hidden text-right text-sm sm:block">
                  <span className="block font-black text-zinc-950">{user?.name}</span>
                  <span className="text-xs font-semibold uppercase text-zinc-500">{role}</span>
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-black text-white hover:bg-zinc-800"
                >
                  Deconnexion
                </button>
              </div>
            ) : null}
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {links.map((link) => (
              <NavLinkItem key={link.to} {...link} />
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
