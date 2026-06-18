import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';

import type { ReadingLogViewModel } from '../reading-types';

export function ReadingLogCard({
  log,
  onEdit,
}: {
  log: ReadingLogViewModel;
  onEdit?: () => void;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Card variant="outlined">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <AppText variant="heading3">{log.dateLabel}</AppText>
          <AppText>{log.pageRangeLabel}</AppText>
          <AppText color="textSecondary">
            {log.pagesReadLabel} - {log.durationLabel}
          </AppText>
          {log.notes ? <AppText color="textSecondary">{log.notes}</AppText> : null}
        </View>
        {onEdit ? <Button title={t('common.actions.edit')} variant="ghost" onPress={onEdit} /> : null}
      </View>
    </Card>
  );
}
