import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/src/presentation';
import { AppText } from '@/src/components/ui/AppText';

export interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { gap: theme.spacing.sm }]}>
      <View style={styles.row}>
        <AppText variant="heading3">{title}</AppText>
        {action}
      </View>
      {description ? <AppText color="textSecondary">{description}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
