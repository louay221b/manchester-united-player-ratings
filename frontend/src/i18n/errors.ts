import type { TFunction } from 'i18next';

import { ApiError } from '../lib/api';
import { StorageValidationError } from '../services/storage.service';

const getTranslation = (t: TFunction<'common'>, key: string) => {
  const translated = t(key, { defaultValue: '' });
  return translated && translated !== key ? translated : '';
};

export const translateApiError = (
  error: unknown,
  t: TFunction<'common'>,
  fallbackKey = 'errors.UNKNOWN',
) => {
  if (error instanceof ApiError) {
    return (
      getTranslation(t, `errors.${error.code}`) || getTranslation(t, fallbackKey) || error.message
    );
  }

  if (error instanceof StorageValidationError) {
    return (
      getTranslation(t, `errors.storage.${error.code}`) ||
      getTranslation(t, fallbackKey) ||
      error.message
    );
  }

  return (
    getTranslation(t, fallbackKey) || (error instanceof Error ? error.message : t('errors.UNKNOWN'))
  );
};
