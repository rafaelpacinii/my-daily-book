import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/src/presentation';

import { clampProgressValue } from './component-state';

export interface ProgressBarProps {
  value: number;
  accessibilityLabel?: string;
}

export function ProgressBar({ value, accessibilityLabel = 'Progress' }: ProgressBarProps) {
  const { theme } = useAppTheme();
  const safeValue = clampProgressValue(value);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: safeValue }}
      style={[
        styles.track,
        {
          backgroundColor: theme.colors.surfaceSecondary,
          borderRadius: theme.radii.full,
        },
      ]}>
      <View
        style={[
          styles.fill,
          {
            width: `${safeValue}%`,
            backgroundColor: theme.colors.primary,
            borderRadius: theme.radii.full,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
