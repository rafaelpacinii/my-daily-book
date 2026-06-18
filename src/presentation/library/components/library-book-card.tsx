import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Card, ProgressBar } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';

import { formatCopyCount } from '../library-formatters';
import type { LibraryBookViewModel } from '../library-types';
import { BookCover } from './book-cover';

export interface LibraryBookCardProps {
  book: LibraryBookViewModel;
  onPress: () => void;
}

export function LibraryBookCard({ book, onPress }: LibraryBookCardProps) {
  const { theme } = useAppTheme();

  return (
    <Card
      variant="interactive"
      accessibilityLabel={`Open library book ${book.title}`}
      onPress={onPress}>
      <View style={[styles.row, { gap: theme.spacing.md }]}>
        <BookCover url={book.coverUrl} title={book.title} />
        <View style={styles.copy}>
          <View style={styles.titleBlock}>
            <AppText variant="heading3" numberOfLines={2}>
              {book.title}
            </AppText>
            <AppText color="textSecondary" numberOfLines={1}>
              {book.authors}
            </AppText>
          </View>
          <View style={[styles.metaRow, { gap: theme.spacing.sm }]}>
            <Badge label={book.statusLabel} variant={book.status === 'all' ? 'default' : book.status} />
            {book.formatLabel ? <Badge label={book.formatLabel} /> : null}
            <Badge label={formatCopyCount(book.copyCount)} />
          </View>
          {book.progressPercentage == null ? null : (
            <View style={styles.progress}>
              <ProgressBar
                value={book.progressPercentage}
                accessibilityLabel={`Reading progress for ${book.title}`}
              />
              <AppText variant="caption" color="textSecondary">
                {Math.round(book.progressPercentage)}%
              </AppText>
            </View>
          )}
          {book.lastReadDate ? (
            <AppText variant="caption" color="textSecondary">
              Last read {book.lastReadDate}
            </AppText>
          ) : null}
          {book.rating != null ? (
            <AppText variant="caption" color="textSecondary">
              Rating {book.rating}/5
            </AppText>
          ) : null}
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
    gap: 8,
  },
  titleBlock: {
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  progress: {
    gap: 6,
  },
});
