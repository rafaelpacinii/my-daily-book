import { TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Card } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';

export interface GoogleBooksSearchFormProps {
  query: string;
  loading: boolean;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
}

export function GoogleBooksSearchForm({
  query,
  loading,
  onQueryChange,
  onSubmit,
}: GoogleBooksSearchFormProps) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Card variant="outlined">
      <TextInput
        accessibilityLabel={t('library.search.title')}
        value={query}
        onChangeText={onQueryChange}
        onSubmitEditing={onSubmit}
        placeholder={t('library.search.queryPlaceholder')}
        placeholderTextColor={theme.colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={[
          theme.typography.body,
          {
            minHeight: theme.componentHeights.input,
            borderRadius: theme.radii.md,
            borderColor: theme.colors.border,
            borderWidth: 1,
            color: theme.colors.textPrimary,
            paddingHorizontal: theme.spacing.md,
          },
        ]}
      />
      <Button title={t('library.search.submit')} loading={loading} onPress={onSubmit} />
    </Card>
  );
}
