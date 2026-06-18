import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ApplicationBootstrapGate } from '@/src/bootstrap';
import { appearancePreferenceStore } from '@/src/infrastructure/preferences/appearance-preference-store';
import { localePreferenceStore } from '@/src/localization';
import {
  ApplicationProvider,
  AppLocalizationProvider,
  AppThemeProvider,
  LocaleBootstrapGate,
  useAppTheme,
} from '@/src/presentation';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <AppThemeProvider preferenceStore={appearancePreferenceStore}>
      <AppLocalizationProvider preferenceStore={localePreferenceStore}>
        <LocaleBootstrapGate>
          <ApplicationProvider>
            <RootNavigator />
          </ApplicationProvider>
        </LocaleBootstrapGate>
      </AppLocalizationProvider>
    </AppThemeProvider>
  );
}

function RootNavigator() {
  const { theme, resolvedMode } = useAppTheme();
  const navigationTheme = {
    dark: resolvedMode === 'dark',
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
      notification: theme.colors.accent,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' as const },
      medium: { fontFamily: 'System', fontWeight: '500' as const },
      bold: { fontFamily: 'System', fontWeight: '700' as const },
      heavy: { fontFamily: 'System', fontWeight: '700' as const },
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <ApplicationBootstrapGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="error" />
          <Stack.Screen name="welcome/language" />
        </Stack>
      </ApplicationBootstrapGate>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}
