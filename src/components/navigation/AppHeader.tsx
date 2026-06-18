import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/src/presentation';
import { AppLogo } from '@/src/components/brand/AppLogo';
import { AppText } from '@/src/components/ui/AppText';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  showLogo?: boolean;
}

export function AppHeader({
  title,
  subtitle,
  leftAction,
  rightAction,
  showLogo = false,
}: AppHeaderProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { gap: theme.spacing.md }]}>
      <View style={styles.topRow}>
        <View style={styles.side}>{leftAction}</View>
        {showLogo ? <AppLogo size={44} /> : null}
        <View style={styles.side}>{rightAction}</View>
      </View>
      <View style={styles.copy}>
        <AppText variant="heading1" align="center">
          {title}
        </AppText>
        {subtitle ? (
          <AppText color="textSecondary" align="center">
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  side: {
    minWidth: 44,
    alignItems: 'center',
  },
  copy: {
    gap: 6,
  },
});

