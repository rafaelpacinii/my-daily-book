export const palette = {
  deepGreen: '#244A3A',
  sageGreen: '#8FAF9D',
  cream: '#F5F0E6',
  softTerracotta: '#C97B63',
  graphite: '#2D312F',
} as const;

export const lightColors = {
  background: palette.cream,
  surface: '#FFFFFF',
  surfaceSecondary: '#EEE6D8',
  primary: palette.deepGreen,
  primaryStrong: '#183429',
  primarySoft: palette.sageGreen,
  accent: palette.softTerracotta,
  textPrimary: palette.graphite,
  textSecondary: '#626A65',
  textInverse: palette.cream,
  border: '#D8D0C3',
  success: '#3F7E58',
  warning: '#A56F2A',
  error: '#B9564B',
  disabled: '#BDB6AA',
  overlay: 'rgba(45, 49, 47, 0.42)',
} as const;

export const darkColors = {
  background: '#17231D',
  surface: '#203329',
  surfaceSecondary: '#2B4035',
  primary: palette.sageGreen,
  primaryStrong: '#E7F1E9',
  primarySoft: '#587867',
  accent: palette.softTerracotta,
  textPrimary: palette.cream,
  textSecondary: '#B7C7BD',
  textInverse: palette.graphite,
  border: '#3B5447',
  success: '#91C7A1',
  warning: '#D8AD66',
  error: '#DF8B7D',
  disabled: '#6D766F',
  overlay: 'rgba(0, 0, 0, 0.56)',
} as const;

