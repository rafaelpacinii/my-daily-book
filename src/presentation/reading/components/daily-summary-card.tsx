import { useTranslation } from 'react-i18next';

import { Card } from '@/src/components/ui';

import type { DailyReadingSummaryViewModel } from '../reading-types';
import { ReadingMetricRow } from './reading-metric-row';

export function DailySummaryCard({ summary }: { summary: DailyReadingSummaryViewModel }) {
  const { t } = useTranslation();

  return (
    <Card variant="outlined">
      <ReadingMetricRow
        items={[
          { label: t('reading.screen.pagesToday'), value: summary.pagesReadLabel },
          { label: t('reading.screen.timeToday'), value: summary.durationLabel },
          { label: t('reading.screen.sessionsToday'), value: summary.sessionsLabel },
          { label: t('reading.screen.booksToday'), value: summary.booksLabel },
        ]}
      />
    </Card>
  );
}
