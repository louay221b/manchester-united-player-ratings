import { ShieldCheck } from 'lucide-react';
import { Link, Outlet } from 'react-router';

import { NavLinkItem } from '../components/NavLinkItem';

const publicLinks = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/matches', label: 'Matchs' },
  { to: '/season', label: 'Classement' },
  { to: '/login', label: 'Connexion' },
];

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-united-red text-white">
                <ShieldCheck size={22} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Manchester United
                </span>
                <span className="block text-lg font-bold text-zinc-950">Player Ratings</span>
              </span>
            </Link>
            <Link
              to="/admin"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-united-red hover:text-united-red"
            >
              Admin
            </Link>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {publicLinks.map((link) => (
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
