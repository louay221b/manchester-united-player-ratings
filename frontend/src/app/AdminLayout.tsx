import { Outlet } from 'react-router';

import { NavLinkItem } from '../components/NavLinkItem';

const adminLinks = [
  { to: '/admin', label: 'Tableau de bord', end: true },
  { to: '/admin/seasons', label: 'Saisons' },
  { to: '/admin/players', label: 'Joueurs' },
  { to: '/admin/matches', label: 'Matchs' },
  { to: '/admin/lineup', label: 'Composition' },
  { to: '/admin/votes', label: 'Votes' },
  { to: '/admin/season-stats', label: 'Stats saison' },
];

export function AdminLayout() {
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="panel h-fit p-3">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Administration
        </p>
        <nav className="mt-2 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {adminLinks.map((link) => (
            <NavLinkItem key={link.to} {...link} />
          ))}
        </nav>
      </aside>
      <section>
        <Outlet />
      </section>
    </div>
  );
}
