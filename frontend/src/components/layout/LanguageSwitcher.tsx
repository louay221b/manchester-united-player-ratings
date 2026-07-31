import { useTranslation } from 'react-i18next';

import { normalizeLanguage, supportedLanguages, type SupportedLanguage } from '../../i18n';

const optionKeyByLanguage: Record<SupportedLanguage, string> = {
  fr: 'language.fr',
  en: 'language.en',
  ar: 'language.ar',
};

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const selectedLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);

  return (
    <label className={`inline-flex min-w-0 items-center gap-2 ${className}`.trim()}>
      <span className="sr-only">{t('language.label')}</span>
      <select
        value={selectedLanguage}
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
        aria-label={t('language.label')}
        className="focus-ring max-w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-black text-zinc-700 hover:border-united-red hover:text-united-red"
      >
        {supportedLanguages.map((language) => (
          <option key={language} value={language}>
            {t(optionKeyByLanguage[language])}
          </option>
        ))}
      </select>
    </label>
  );
}
