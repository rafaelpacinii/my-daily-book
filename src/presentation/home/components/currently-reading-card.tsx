import { Image, StyleSheet, View } from 'react-native';

import { AppText, Card, ProgressBar } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';

import { formatCivilDate } from '../home-formatters';
import type { CurrentlyReadingBookViewModel } from '../home-types';

export interface CurrentlyReadingCardProps {
  book: CurrentlyReadingBookViewModel;
}

export function CurrentlyReadingCard({ book }: CurrentlyReadingCardProps) {
  const { theme } = useAppTheme();
  const progressLabel = book.progressPercentage == null
    ? 'Progress unavailable'
    : `${Math.round(book.progressPercentage)}%`;
  const pageLabel = formatPageLabel(book.currentPage, book.pageCount);

  return (
    <Card variant="outlined">
      <View style={[styles.row, { gap: theme.spacing.md }]}>
        {book.coverUrl ? (
          <Image
            source={{ uri: book.coverUrl }}
            resizeMode="cover"
            accessibilityLabel={`Cover for ${book.title}`}
            style={[
              styles.cover,
              {
                borderRadius: theme.radii.sm,
                backgroundColor: theme.colors.surfaceSecondary,
              },
            ]}
          />
        ) : (
          <View
            accessibilityRole="image"
            accessibilityLabel={`No cover available for ${book.title}`}
            style={[
              styles.cover,
              styles.placeholder,
              {
                borderRadius: theme.radii.sm,
                backgroundColor: theme.colors.surfaceSecondary,
              },
            ]}>
            <AppText variant="caption" align="center" color="textSecondary">
              No cover
            </AppText>
          </View>
        )}
        <View style={styles.copy}>
          <AppText variant="heading3" numberOfLines={2}>
            {book.title}
          </AppText>
          <AppText color="textSecondary" numberOfLines={1}>
            {book.authors}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {book.format ?? 'Format unknown'}
          </AppText>
          {pageLabel ? (
            <AppText variant="caption" color="textSecondary">
              {pageLabel}
            </AppText>
          ) : null}
          {book.lastReadDate ? (
            <AppText variant="caption" color="textSecondary">
              Last read {formatCivilDate(book.lastReadDate)}
            </AppText>
          ) : null}
        </View>
      </View>
      {book.progressPercentage == null ? (
        <AppText variant="caption" color="textSecondary">
          {progressLabel}
        </AppText>
      ) : (
        <View style={styles.progress}>
          <ProgressBar
            value={book.progressPercentage}
            accessibilityLabel={`Reading progress for ${book.title}`}
          />
          <AppText variant="caption" color="textSecondary">
            {progressLabel}
          </AppText>
        </View>
      )}
    </Card>
  );
}

function formatPageLabel(currentPage: number | null, pageCount: number | null): string | null {
  if (currentPage != null && pageCount != null) return `Page ${currentPage} of ${pageCount}`;
  if (currentPage != null) return `Page ${currentPage}`;
  if (pageCount != null) return `${pageCount} pages`;
  return null;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  cover: {
    height: 104,
    width: 72,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  progress: {
    gap: 6,
  },
});
