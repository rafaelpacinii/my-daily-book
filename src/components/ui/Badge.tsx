import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/src/presentation';

import { AppText } from './AppText';
import { getBadgeTone } from './component-state';

export type BadgeVariant =
  | 'default'
  | 'to_read'
  | 'reading'
  | 'read'
  | 'dropped'
  | 'active'
  | 'completed'
  | 'cancelled';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const { theme } = useAppTheme();
  const tone = getBadgeTone(variant);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.colors[tone.backgroundToken ?? 'surfaceSecondary'],
          borderColor: theme.colors[tone.borderToken ?? 'border'],
          borderRadius: theme.radii.full,
        },
      ]}>
      <AppText variant="caption" color={tone.textToken}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
