import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';

export interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function FilterChip({ label, selected, onPress }: FilterChipProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          minHeight: theme.componentHeights.touchTarget,
          borderRadius: theme.radii.full,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface,
          opacity: pressed ? 0.82 : 1,
        },
      ]}>
      <AppText variant="label" color={selected ? 'primary' : 'textPrimary'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
});
