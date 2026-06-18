import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/src/presentation';

import { AppText } from './AppText';
import { getButtonTone } from './component-state';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const { theme } = useAppTheme();
  const isDisabled = disabled || loading;
  const tone = getButtonTone(variant, isDisabled);
  const backgroundColor = tone.transparentBackground
    ? 'transparent'
    : theme.colors[tone.backgroundToken ?? 'surface'];
  const borderColor = tone.transparentBorder
    ? 'transparent'
    : theme.colors[tone.borderToken ?? 'border'];
  const textColor = theme.colors[tone.textToken];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: theme.componentHeights.button,
          borderRadius: theme.radii.md,
          backgroundColor,
          borderColor,
          opacity: pressed && !isDisabled ? 0.86 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}>
      <View style={styles.content}>
        {loading ? <ActivityIndicator color={textColor} /> : icon}
        <AppText variant="button" color={tone.textToken} align="center" style={styles.label}>
          {title}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  label: {
    flexShrink: 1,
  },
});
