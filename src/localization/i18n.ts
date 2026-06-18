import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import ptBR from './locales/pt-BR';

export const i18n = createInstance();

void i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    fallbackLng: 'en',
    lng: 'en',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: { translation: en },
      'pt-BR': { translation: ptBR },
    },
  });
