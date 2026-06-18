import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';

import { formatPageCount } from '../library-formatters';
import type { GoogleBooksResultViewModel } from '../library-types';
import { BookCover } from '../components';

export interface GoogleBooksResultCardProps {
  result: GoogleBooksResultViewModel;
  onPress: () => void;
}

export function GoogleBooksResultCard({ result, onPress }: GoogleBooksResultCardProps) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Card
      variant="interactive"
      accessibilityLabel={`${t('common.actions.viewDetails')} ${result.title}`}
      onPress={onPress}>
      <View style={[styles.row, { gap: theme.spacing.md }]}>
        <BookCover url={result.coverUrl} title={result.title} />
        <View style={styles.copy}>
          <AppText variant="heading3" numberOfLines={2}>{result.title}</AppText>
          {result.subtitle ? <AppText color="textSecondary">{result.subtitle}</AppText> : null}
          <AppText color="textSecondary">{result.authors}</AppText>
          {result.publisher ? <AppText color="textSecondary">{result.publisher}</AppText> : null}
          {result.publishedDate ? <AppText color="textSecondary">{result.publishedDate}</AppText> : null}
          {formatPageCount(result.pageCount) ? (
            <AppText color="textSecondary">{formatPageCount(result.pageCount)}</AppText>
          ) : null}
          {result.language ? <AppText color="textSecondary">{t('library.metadata.language', { language: result.language })}</AppText> : null}
          {result.isbn ? <AppText color="textSecondary">{t('library.metadata.isbn', { isbn: result.isbn })}</AppText> : null}
          <AppText variant="caption" color="textSecondary">{t('common.source', { source: result.sourceLabel })}</AppText>
          <Button title={t('common.actions.viewDetails')} variant="outline" onPress={onPress} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  copy: {
    flex: 1,
    gap: 6,
  },
});
