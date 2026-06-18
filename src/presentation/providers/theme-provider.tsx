import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import { getTheme, type AppTheme, type AppearancePreferenceStore, type ThemeMode } from '@/src/theme';
import { missingThemeProviderMessage, resolveThemeMode } from './theme-mode';

export interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  theme: AppTheme;
  ready: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const fallbackAppearancePreferenceStore: AppearancePreferenceStore = {
  async getPreference() {
    return 'system';
  },
  async setPreference() {},
  async clearPreference() {},
};

export interface AppThemeProviderProps extends PropsWithChildren {
  preferenceStore?: AppearancePreferenceStore;
}

export function AppThemeProvider({
  children,
  preferenceStore = fallbackAppearancePreferenceStore,
}: AppThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);
  const resolvedMode = resolveThemeMode(mode, systemScheme);
  const theme = useMemo(() => getTheme(resolvedMode), [resolvedMode]);
  const updateMode = useMemo(
    () => async (nextMode: ThemeMode) => {
      setMode(nextMode);
      await preferenceStore.setPreference(nextMode);
    },
    [preferenceStore],
  );
  const value = useMemo(
    () => ({ mode, resolvedMode, theme, ready, setMode: updateMode }),
    [mode, ready, resolvedMode, theme, updateMode],
  );

  useEffect(() => {
    let mounted = true;

    preferenceStore
      .getPreference()
      .then((preference) => {
        if (mounted) setMode(preference);
      })
      .catch(() => {
        if (mounted) setMode('system');
      })
      .finally(() => {
        if (mounted) setReady(true);
      });

    return () => {
      mounted = false;
    };
  }, [preferenceStore]);

  if (!ready) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(missingThemeProviderMessage);
  }

  return context;
}
