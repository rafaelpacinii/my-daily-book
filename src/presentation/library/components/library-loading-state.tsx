import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';

export function LibraryLoadingState() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <View
      accessible
      accessibilityLabel={t('library.screen.loading')}
      style={{ gap: theme.spacing.lg }}>
      <Card variant="elevated">
        <ActivityIndicator color={theme.colors.primary} />
        <AppText color="textSecondary" align="center">
          {t('library.screen.loadingDescription')}
        </AppText>
      </Card>
      <View style={[styles.placeholder, { backgroundColor: theme.colors.surfaceSecondary }]} />
      <View style={[styles.placeholder, { backgroundColor: theme.colors.surfaceSecondary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    borderRadius: 12,
    height: 112,
    opacity: 0.8,
  },
});
