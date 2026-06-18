import { View } from 'react-native';

import { SectionHeader } from '@/src/components/layout';
import { AppText, Card } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';

import { formatDuration } from '../library-formatters';
import type { LibraryBookDetailsViewModel } from '../library-types';

export function ReadingHistorySummary({
  details,
}: {
  details: LibraryBookDetailsViewModel;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title="Reading history" />
      {details.readingHistory.length === 0 ? (
        <Card variant="outlined">
          <AppText color="textSecondary">No reading cycles recorded yet.</AppText>
        </Card>
      ) : (
        details.readingHistory.map((cycle) => (
          <Card key={cycle.id} variant="outlined">
            <AppText variant="heading3">Cycle {cycle.cycleNumber}</AppText>
            <AppText color="textSecondary">{cycle.status} - {cycle.editionTitle}</AppText>
            <AppText color="textSecondary">Started {cycle.startedAt}</AppText>
            {cycle.finishedAt ? <AppText color="textSecondary">Finished {cycle.finishedAt}</AppText> : null}
            {cycle.droppedAt ? <AppText color="textSecondary">Dropped {cycle.droppedAt}</AppText> : null}
            <AppText color="textSecondary">
              {cycle.totalPages} pages, {formatDuration(cycle.totalDurationSeconds)}
            </AppText>
          </Card>
        ))
      )}
    </View>
  );
}
