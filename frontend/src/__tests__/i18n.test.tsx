import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';
import i18n from '../i18n';
import { translateApiError } from '../i18n/errors';
import { ApiError } from '../lib/api';

describe('i18n', () => {
  it('loads French, English and Arabic translations', async () => {
    await i18n.changeLanguage('fr');
    expect(i18n.t('navigation.home')).toBe('Accueil');
    expect(document.documentElement).toHaveAttribute('lang', 'fr');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');

    await i18n.changeLanguage('en');
    expect(i18n.t('navigation.home')).toBe('Home');
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');

    await i18n.changeLanguage('ar');
    expect(i18n.t('navigation.home')).not.toBe('navigation.home');
    expect(document.documentElement).toHaveAttribute('lang', 'ar');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
  });

  it('switches language from the UI and persists the choice', () => {
    render(<LanguageSwitcher />);

    fireEvent.change(screen.getByLabelText('Langue de l’interface'), {
      target: { value: 'en' },
    });

    expect(i18n.language).toBe('en');
    expect(window.localStorage.getItem('i18nextLng')).toBe('en');
    expect(screen.getByLabelText('Interface language')).toHaveValue('en');
  });

  it('falls back to English when a key is missing in the active language', async () => {
    await i18n.changeLanguage('fr');

    expect(i18n.t('fallback.englishOnly')).toBe('English fallback');
  });

  it('translates known API error codes before using backend messages', async () => {
    await i18n.changeLanguage('fr');

    const message = translateApiError(
      new ApiError(401, 'AUTH_REQUIRED', 'Backend fallback message'),
      i18n.t,
    );

    expect(message).toBe('Connecte-toi pour continuer.');
  });
});
