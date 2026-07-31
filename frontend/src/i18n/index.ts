import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import ar from './locales/ar/common.json';
import en from './locales/en/common.json';
import fr from './locales/fr/common.json';

export const supportedLanguages = ['fr', 'en', 'ar'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage: SupportedLanguage = 'en';

export const isSupportedLanguage = (language: string): language is SupportedLanguage =>
  supportedLanguages.includes(language as SupportedLanguage);

export const normalizeLanguage = (language?: string): SupportedLanguage => {
  const baseLanguage = language?.split('-')[0] ?? defaultLanguage;

  return isSupportedLanguage(baseLanguage) ? baseLanguage : defaultLanguage;
};

export const setDocumentLanguage = (language?: string) => {
  if (typeof document === 'undefined') {
    return;
  }

  const normalizedLanguage = normalizeLanguage(language);
  document.documentElement.lang = normalizedLanguage;
  document.documentElement.dir = normalizedLanguage === 'ar' ? 'rtl' : 'ltr';
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { common: fr },
      en: { common: en },
      ar: { common: ar },
    },
    fallbackLng: defaultLanguage,
    supportedLngs: supportedLanguages,
    ns: ['common'],
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

setDocumentLanguage(i18n.resolvedLanguage ?? i18n.language);
i18n.on('languageChanged', setDocumentLanguage);

export default i18n;
