import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/src/presentation';

export interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'ghost' | 'danger';
}

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  disabled = false,
  loading = false,
  variant = 'ghost',
}: IconButtonProps) {
  const { theme } = useAppTheme();
  const color = variant === 'danger' ? theme.colors.error : theme.colors.primary;
  const backgroundColor = variant === 'default' ? theme.colors.surfaceSecondary : 'transparent';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: theme.componentHeights.touchTarget,
          minWidth: theme.componentHeights.touchTarget,
          borderRadius: theme.radii.full,
          backgroundColor,
          opacity: pressed && !isDisabled ? 0.72 : isDisabled ? 0.5 : 1,
        },
      ]}>
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Ionicons name={icon} color={color} size={theme.iconSizes.lg} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

