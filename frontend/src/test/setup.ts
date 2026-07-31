import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

import i18n from '../i18n';

beforeEach(async () => {
  window.localStorage.setItem('i18nextLng', 'fr');
  await i18n.changeLanguage('fr');
});
