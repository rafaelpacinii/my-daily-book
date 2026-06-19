import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Badge, Card, IconButton, ProgressBar } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';

import type { LibraryBookDetailsViewModel } from '../library-types';
import { BookCover } from '../components';

export interface LibraryBookHeaderProps {
  details: LibraryBookDetailsViewModel;
  onBack: () => void;
}

export function LibraryBookHeader({ details, onBack }: LibraryBookHeaderProps) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Card variant="elevated">
      <View style={styles.topRow}>
        <IconButton icon="chevron-back" accessibilityLabel={t('library.details.goBack')} onPress={onBack} />
        <IconButton icon="ellipsis-horizontal" accessibilityLabel={t('library.details.actionsUnavailable')} disabled />
      </View>
      <View style={[styles.row, { gap: theme.spacing.lg }]}>
        <BookCover url={details.coverUrl} title={details.title} size="lg" />
        <View style={styles.copy}>
          <AppText variant="heading2">{details.title}</AppText>
          {details.originalTitle ? (
            <AppText color="textSecondary">{details.originalTitle}</AppText>
          ) : null}
          <AppText color="textSecondary">{details.authors}</AppText>
          <Badge label={details.statusLabel} variant={details.status === 'all' ? 'default' : details.status} />
          {details.progressPercentage == null ? (
            <AppText variant="caption" color="textSecondary">{t('library.details.progressUnavailable')}</AppText>
          ) : (
            <View style={styles.progress}>
              <ProgressBar
                value={details.progressPercentage}
                accessibilityLabel={t('library.details.readingProgress', { title: details.title })}
              />
              <AppText variant="caption" color="textSecondary">
                {Math.round(details.progressPercentage)}%
              </AppText>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
  },
  copy: {
    flex: 1,
    gap: 8,
  },
  progress: {
    gap: 6,
  },
});
