import type { componentHeights, iconSizes, spacing } from './spacing';
import type { lightColors } from './colors';
import type { radii } from './radii';
import type { shadows } from './shadows';
import type { typography } from './typography';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedThemeMode = 'light' | 'dark';
export type ThemeColorName = keyof typeof lightColors;
export type ThemeColors = Record<ThemeColorName, string>;
export type TextVariant = keyof typeof typography;

export interface AppearancePreferenceStore {
  getPreference: () => Promise<ThemeMode>;
  setPreference: (preference: ThemeMode) => Promise<void>;
  clearPreference: () => Promise<void>;
}

export interface AppTheme {
  mode: ResolvedThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  typography: typeof typography;
  iconSizes: typeof iconSizes;
  componentHeights: typeof componentHeights;
}
