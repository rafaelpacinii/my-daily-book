import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';
import { BookCover } from '@/src/presentation/library/components';

import type { ReadingHistoryItemViewModel } from '../reading-types';
import { ReadingMetricRow } from './reading-metric-row';
import { ReadingStatusBadge } from './reading-status-badge';

export function ReadingHistoryCard({
  item,
  onPress,
}: {
  item: ReadingHistoryItemViewModel;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Card variant="interactive" onPress={onPress} accessibilityLabel={`${t('common.actions.open')} ${item.title} ${t('reading.screen.historyTitle').toLocaleLowerCase()}`}>
      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <BookCover url={item.coverUrl} title={item.title} size="sm" />
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            <ReadingStatusBadge status={item.status} label={item.statusLabel} />
            <ReadingStatusBadge status="reading" label={item.cycleNumberLabel} />
          </View>
          <AppText variant="heading3">{item.title}</AppText>
          <AppText color="textSecondary">{item.authors}</AppText>
        </View>
      </View>
      <ReadingMetricRow
        items={[
          { label: t('reading.cycle.started'), value: item.startedAtLabel },
          { label: t('reading.history.end'), value: item.endedAtLabel },
          { label: t('reading.cycle.pages'), value: item.totalPagesReadLabel },
          { label: t('reading.cycle.duration'), value: item.totalDurationLabel },
        ]}
      />
    </Card>
  );
}
