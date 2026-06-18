import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, AppText, Button, ProgressBar } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';
import { BookCover } from '@/src/presentation/library/components';

import type { ActiveReadingViewModel } from '../reading-types';
import { ReadingMetricRow } from './reading-metric-row';
import { ReadingStatusBadge } from './reading-status-badge';

export function ActiveReadingCard({
  cycle,
  onOpen,
  onLog,
}: {
  cycle: ActiveReadingViewModel;
  onOpen: () => void;
  onLog: () => void;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Card variant="interactive" onPress={onOpen} accessibilityLabel={`${t('common.actions.open')} ${cycle.title}`}>
      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <BookCover url={cycle.coverUrl} title={cycle.title} size="md" />
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            <ReadingStatusBadge status={cycle.status} label={cycle.statusLabel} />
            <ReadingStatusBadge status="reading" label={cycle.cycleNumberLabel} />
          </View>
          <AppText variant="heading3">{cycle.title}</AppText>
          <AppText color="textSecondary">{cycle.authors}</AppText>
          <AppText color="textSecondary">{cycle.editionTitle}</AppText>
          <AppText color="textSecondary">{cycle.copyFormatLabel}</AppText>
        </View>
      </View>
      <View style={{ gap: theme.spacing.xs }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
          <AppText>{cycle.currentPageLabel}</AppText>
          <AppText color="textSecondary">{cycle.progressLabel}</AppText>
        </View>
        <ProgressBar
          value={cycle.progressPercentage ?? 0}
          accessibilityLabel={`${cycle.title} ${t('reading.cycle.progressAccessibility').toLocaleLowerCase()}`}
        />
        {cycle.progressPercentage == null ? (
          <AppText color="textSecondary">{t('reading.cycle.progressUnavailable')}</AppText>
        ) : null}
      </View>
      <ReadingMetricRow
        items={[
          { label: t('reading.cycle.lastRead'), value: cycle.lastReadAtLabel },
          { label: t('reading.cycle.pages'), value: cycle.totalPagesReadLabel },
          { label: t('reading.cycle.duration'), value: cycle.totalDurationLabel },
          { label: t('statistics.metrics.readingDays'), value: cycle.readingDaysLabel },
        ]}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <Button title={t('reading.cycle.recordReading')} onPress={onLog} />
        <Button title={t('common.actions.viewDetails')} variant="outline" onPress={onOpen} />
      </View>
    </Card>
  );
}
