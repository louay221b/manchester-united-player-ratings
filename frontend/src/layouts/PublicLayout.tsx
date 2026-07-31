import { Link, Outlet, useNavigate } from 'react-router';

import { BrandLogo } from '../components/layout/BrandLogo';
import { Footer } from '../components/layout/Footer';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';
import { NavLinkItem } from '../components/NavLinkItem';
import { useAuth } from '../contexts/useAuth';
import { useTranslation } from 'react-i18next';

export function PublicLayout() {
  const { isAuthenticated, isLoading, profile, role, signOut, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const displayName = profile?.full_name || user?.email || 'Compte';
  const links = [
    { to: '/', label: t('navigation.home'), end: true },
    { to: '/matches', label: t('navigation.matches') },
    { to: '/ranking', label: t('navigation.ranking') },
    ...(isAuthenticated && !isLoading ? [{ to: '/profile', label: t('navigation.profile') }] : []),
    ...(role === 'admin' ? [{ to: '/admin', label: t('navigation.admin') }] : []),
    ...(!isAuthenticated && !isLoading
      ? [
          { to: '/login', label: t('navigation.signIn') },
          { to: '/register', label: t('navigation.signUp') },
        ]
      : []),
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3">
              <BrandLogo />
              <span>
                <span className="block text-xs font-black uppercase tracking-[0.14em] text-zinc-500">
                  {t('brand.name')}
                </span>
                <span className="block text-lg font-black text-zinc-950">{t('brand.title')}</span>
              </span>
            </Link>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <LanguageSwitcher />
              {isLoading ? (
                <span className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-bold text-zinc-500">
                  {t('common.sessionLoading')}
                </span>
              ) : isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <span className="hidden text-end text-sm sm:block">
                    <span className="block font-black text-zinc-950">{displayName}</span>
                    <span className="text-xs font-semibold uppercase text-zinc-500">
                      {role ?? 'user'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-black text-white hover:bg-zinc-800"
                  >
                    {t('navigation.signOut')}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {links.map((link) => (
              <NavLinkItem key={link.to} {...link} />
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
