import { createContext, useContext, type PropsWithChildren } from 'react';
import { Text, type TextStyle } from 'react-native';

import { useAppTheme } from '@/src/presentation';
import type { TextVariant, ThemeColorName } from '@/src/theme';
import { resolveAppTextStyle, type AppTextStyleProp } from './app-text-style';

export interface AppTextProps extends PropsWithChildren {
  variant?: TextVariant;
  color?: ThemeColorName;
  align?: TextStyle['textAlign'];
  numberOfLines?: number;
  style?: AppTextStyleProp;
}

const AppTextColorContext = createContext<TextStyle['color'] | undefined>(undefined);

export function AppText({
  children,
  variant = 'body',
  color,
  align,
  numberOfLines,
  style,
}: AppTextProps) {
  const { theme } = useAppTheme();
  const inheritedColor = useContext(AppTextColorContext);
  const resolvedStyle = resolveAppTextStyle({
    theme,
    variant,
    color,
    inheritedColor,
    align,
    style,
  });
  const resolvedColor = typeof resolvedStyle.color === 'string' ? resolvedStyle.color : undefined;

  return (
    <AppTextColorContext.Provider value={resolvedColor}>
      <Text numberOfLines={numberOfLines} style={resolvedStyle}>
        {children}
      </Text>
    </AppTextColorContext.Provider>
  );
}
