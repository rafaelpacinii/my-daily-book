import { darkColors, lightColors } from './colors';
import { radii } from './radii';
import { componentHeights, iconSizes, spacing } from './spacing';
import { shadows } from './shadows';
import { typography } from './typography';
import type { AppTheme } from './types';

export const lightTheme: AppTheme = {
  mode: 'light',
  colors: lightColors,
  spacing,
  radii,
  shadows,
  typography,
  iconSizes,
  componentHeights,
};

export const darkTheme: AppTheme = {
  ...lightTheme,
  mode: 'dark',
  colors: darkColors,
};

export function getTheme(mode: 'light' | 'dark'): AppTheme {
  return mode === 'dark' ? darkTheme : lightTheme;
}

