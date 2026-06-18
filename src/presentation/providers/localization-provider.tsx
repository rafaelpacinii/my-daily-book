import { Redirect, usePathname } from 'expo-router';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { I18nextProvider } from 'react-i18next';

import {
  i18n,
  type LocalePreferenceStore,
  type SupportedLocale,
} from '@/src/localization';

export interface LocalizationContextValue {
  locale: SupportedLocale | null;
  ready: boolean;
  setLocale: (locale: SupportedLocale) => Promise<void>;
}

export interface AppLocalizationProviderProps extends PropsWithChildren {
  preferenceStore: LocalePreferenceStore;
}

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

export function AppLocalizationProvider({
  children,
  preferenceStore,
}: AppLocalizationProviderProps) {
  const [locale, setLocaleState] = useState<SupportedLocale | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    preferenceStore
      .getLocale()
      .then(async (storedLocale) => {
        if (storedLocale) {
          await i18n.changeLanguage(storedLocale);
        }
        if (mounted) setLocaleState(storedLocale);
      })
      .catch(() => {
        if (mounted) setLocaleState(null);
      })
      .finally(() => {
        if (mounted) setReady(true);
      });

    return () => {
      mounted = false;
    };
  }, [preferenceStore]);

  const setLocale = useCallback(async (nextLocale: SupportedLocale) => {
    await i18n.changeLanguage(nextLocale);
    await preferenceStore.setLocale(nextLocale);
    setLocaleState(nextLocale);
  }, [preferenceStore]);

  const value = useMemo(
    () => ({ locale, ready, setLocale }),
    [locale, ready, setLocale],
  );

  return (
    <I18nextProvider i18n={i18n}>
      <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>
    </I18nextProvider>
  );
}

export function LocaleBootstrapGate({ children }: PropsWithChildren) {
  const { locale, ready } = useLocalization();
  const pathname = usePathname();
  const isLanguageRoute = pathname === '/welcome/language';

  if (!ready) {
    return null;
  }

  if (!locale && !isLanguageRoute) {
    return <Redirect href="/welcome/language" />;
  }

  if (locale && isLanguageRoute) {
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
}

export function useLocalization(): LocalizationContextValue {
  const context = useContext(LocalizationContext);

  if (!context) {
    throw new Error('useLocalization must be used within AppLocalizationProvider.');
  }

  return context;
}
