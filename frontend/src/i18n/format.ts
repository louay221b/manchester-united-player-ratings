import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { normalizeLanguage } from '.';

const localeByLanguage = {
  fr: 'fr-FR',
  en: 'en-GB',
  ar: 'ar',
};

export const getIntlLocale = (language?: string) => localeByLanguage[normalizeLanguage(language)];

export function useFormatters() {
  const { i18n } = useTranslation();
  const locale = getIntlLocale(i18n.resolvedLanguage ?? i18n.language);

  return useMemo(() => {
    const integerFormatter = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
    });
    const ratingFormatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const ratingStepFormatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    const compactFileFormatter = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
    });
    const decimalFileFormatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

    return {
      formatDate: (value: string | Date, options: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat(locale, options).format(new Date(value)),
      formatNumber: (value: number) => integerFormatter.format(value),
      formatRating: (value: number | null, emptyValue = '-') =>
        value === null ? emptyValue : ratingFormatter.format(value),
      formatRatingStep: (value: number) => ratingStepFormatter.format(value),
      formatScore: (homeScore: number | null, awayScore: number | null, emptyValue: string) =>
        homeScore === null || awayScore === null
          ? emptyValue
          : `${integerFormatter.format(homeScore)}-${integerFormatter.format(awayScore)}`,
      formatFileSize: (size: number) => {
        if (size < 1024 * 1024) {
          return `${compactFileFormatter.format(Math.max(1, Math.round(size / 1024)))} KB`;
        }

        return `${decimalFileFormatter.format(size / 1024 / 1024)} MB`;
      },
    };
  }, [locale]);
}
