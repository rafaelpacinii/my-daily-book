import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/src/components/feedback';
import { AppText, Card } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';

import { formatDuration } from '../home-formatters';
import type { TodaySummaryViewModel } from '../home-types';

export interface TodaySummaryCardProps {
  summary: TodaySummaryViewModel;
}

export function TodaySummaryCard({ summary }: TodaySummaryCardProps) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  if (summary.logCount === 0) {
    return (
      <Card variant="elevated">
        <EmptyState
          icon="calendar-outline"
          title={t('home.today.emptyTitle')}
          description={t('home.today.emptyDescription')}
        />
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <AppText variant="heading3">{t('home.today.title')}</AppText>
      <View style={[styles.grid, { gap: theme.spacing.md }]}>
        <Metric label={t('home.today.pagesRead')} value={t('home.units.page', { count: summary.pagesRead })} />
        <Metric label={t('home.today.duration')} value={formatDuration(summary.durationSeconds, t)} />
        <Metric label={t('home.today.sessions')} value={t('home.units.session', { count: summary.logCount })} />
        <Metric label={t('home.today.books')} value={t('home.units.book', { count: summary.booksRead })} />
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
