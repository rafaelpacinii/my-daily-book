import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/src/presentation';

export interface CardProps extends PropsWithChildren {
  variant?: 'default' | 'outlined' | 'elevated' | 'interactive';
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

export function Card({
  children,
  variant = 'default',
  onPress,
  accessibilityLabel,
  style,
}: CardProps) {
  const { theme } = useAppTheme();
  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: variant === 'default' ? 'transparent' : theme.colors.border,
          borderRadius: theme.radii.md,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
        },
        variant === 'elevated' && theme.shadows.sm,
        style,
      ]}>
      {children}
    </View>
  );

  if (variant === 'interactive' || onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});
