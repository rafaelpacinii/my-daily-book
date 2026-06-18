export const supportedLocales = ['en', 'pt-BR'] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export interface LocalePreferenceStore {
  getLocale: () => Promise<SupportedLocale | null>;
  setLocale: (locale: SupportedLocale) => Promise<void>;
  clearLocale: () => Promise<void>;
}

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return value === 'en' || value === 'pt-BR';
}
