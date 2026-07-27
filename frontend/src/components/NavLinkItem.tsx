import { NavLink } from 'react-router';

interface NavLinkItemProps {
  to: string;
  label: string;
  end?: boolean;
}

export function NavLinkItem({ to, label, end = false }: NavLinkItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'rounded-md px-3 py-2 text-sm font-medium',
          isActive
            ? 'bg-united-red text-white'
            : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950',
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  );
}
