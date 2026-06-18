import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/src/components/feedback';
import { Button } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';

export interface PaginatedListFooterProps {
  loading: boolean;
  error: unknown;
  hasMore: boolean;
  onRetry: () => void;
}

export function PaginatedListFooter({
  loading,
  error,
  hasMore,
  onRetry,
}: PaginatedListFooterProps) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  if (loading) {
    return (
      <View
        accessible
        accessibilityLabel={t('library.screen.loadMoreLoading')}
        style={{ paddingVertical: theme.spacing.lg }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <ErrorState
        title={t('library.screen.loadMoreErrorTitle')}
        description={t('library.screen.loadMoreErrorDescription')}
        actionLabel={t('common.actions.retry')}
        onAction={onRetry}
      />
    );
  }

  if (!hasMore) return null;

  return <Button title={t('library.screen.loadMoreAction')} variant="outline" onPress={onRetry} />;
}
