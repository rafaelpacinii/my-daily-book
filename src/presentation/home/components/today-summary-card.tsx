import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/src/components/feedback';
import { AppText, Card } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';

import { formatDuration, pluralize } from '../home-formatters';
import type { TodaySummaryViewModel } from '../home-types';

export interface TodaySummaryCardProps {
  summary: TodaySummaryViewModel;
}

export function TodaySummaryCard({ summary }: TodaySummaryCardProps) {
  const { theme } = useAppTheme();

  if (summary.logCount === 0) {
    return (
      <Card variant="elevated">
        <EmptyState
          icon="calendar-outline"
          title="No reading recorded today"
          description="Pages, time and sessions will appear here after reading is recorded."
        />
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <AppText variant="heading3">{"Today's reading"}</AppText>
      <View style={[styles.grid, { gap: theme.spacing.md }]}>
        <Metric label="Pages read" value={pluralize(summary.pagesRead, 'page')} />
        <Metric label="Duration" value={formatDuration(summary.durationSeconds)} />
        <Metric label="Sessions" value={pluralize(summary.logCount, 'session')} />
        <Metric label="Books" value={pluralize(summary.booksRead, 'book')} />
      </View>
    </Card>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <AppText variant="heading3">{value}</AppText>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metric: {
    flexBasis: '45%',
    flexGrow: 1,
  },
});
