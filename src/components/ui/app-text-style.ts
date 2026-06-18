import type { TextStyle } from 'react-native';

import type { AppTheme, TextVariant, ThemeColorName } from '@/src/theme';

export type AppTextStyleProp =
  | TextStyle
  | false
  | null
  | undefined
  | AppTextStyleProp[]
  | readonly AppTextStyleProp[];

export interface ResolveAppTextStyleInput {
  theme: AppTheme;
  variant: TextVariant;
  color?: ThemeColorName;
  inheritedColor?: TextStyle['color'];
  align?: TextStyle['textAlign'];
  style?: AppTextStyleProp;
}

export function resolveAppTextStyle({
  theme,
  variant,
  color,
  inheritedColor,
  align,
  style,
}: ResolveAppTextStyleInput): TextStyle {
  const fallbackColor = inheritedColor ?? theme.colors.textPrimary;
  const semanticColor = color ? theme.colors[color] : fallbackColor;

  return flattenTextStyles([
    { letterSpacing: 0 },
    theme.typography[variant],
    { color: semanticColor, textAlign: align },
    style,
  ]);
}

function flattenTextStyles(styles: readonly AppTextStyleProp[]): TextStyle {
  return styles.reduce<TextStyle>((result, item) => {
    if (!item) return result;
    if (isStyleArray(item)) {
      return { ...result, ...flattenTextStyles(item) };
    }

    if (typeof item === 'object') {
      return { ...result, ...item };
    }

    return result;
  }, {});
}

function isStyleArray(item: AppTextStyleProp): item is readonly AppTextStyleProp[] {
  return Array.isArray(item);
}
