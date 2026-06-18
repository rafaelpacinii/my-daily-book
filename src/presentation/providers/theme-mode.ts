import type { ColorSchemeName } from 'react-native';

import type { ResolvedThemeMode, ThemeMode } from '@/src/theme';

export const missingThemeProviderMessage = 'useAppTheme must be used within AppThemeProvider.';

export function resolveThemeMode(
  mode: ThemeMode,
  systemScheme: ColorSchemeName,
): ResolvedThemeMode {
  if (mode === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }

  return mode;
}
