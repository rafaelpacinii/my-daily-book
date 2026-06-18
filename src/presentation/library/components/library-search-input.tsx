import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { IconButton } from '@/src/components/ui';
import { domainIcons } from '@/src/components/navigation/domain-icons';
import { useAppTheme } from '@/src/presentation';

export interface LibrarySearchInputProps {
  value: string;
  onChangeText: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export function LibrarySearchInput({
  value,
  onChangeText,
  onClear,
  placeholder,
}: LibrarySearchInputProps) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t('library.screen.searchPlaceholder');

  return (
    <View
      style={[
        styles.container,
        {
          minHeight: theme.componentHeights.input,
          borderRadius: theme.radii.md,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: theme.spacing.md,
          gap: theme.spacing.sm,
        },
      ]}>
      <Ionicons
        name={domainIcons.search}
        size={theme.iconSizes.md}
        color={theme.colors.textSecondary}
      />
      <TextInput
        accessibilityLabel={t('library.screen.searchAccessibility')}
        value={value}
        onChangeText={onChangeText}
        placeholder={resolvedPlaceholder}
        placeholderTextColor={theme.colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={[styles.input, theme.typography.body, { color: theme.colors.textPrimary }]}
      />
      {value.trim().length > 0 ? (
        <IconButton icon="close" accessibilityLabel={t('library.screen.clearSearchAccessibility')} onPress={onClear} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
  },
});
