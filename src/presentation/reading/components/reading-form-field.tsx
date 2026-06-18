import { TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { AppText } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';

export function ReadingFormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        style={{
          minHeight: multiline ? 96 : theme.componentHeights.input,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.md,
          color: theme.colors.textPrimary,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}
