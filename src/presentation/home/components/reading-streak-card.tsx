import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/src/components/ui';

import { pluralize } from '../home-formatters';
import type { ReadingStreakViewModel } from '../home-types';

export interface ReadingStreakCardProps {
  streak: ReadingStreakViewModel;
}

export function ReadingStreakCard({ streak }: ReadingStreakCardProps) {
  return (
    <Card variant="outlined">
      <AppText variant="heading3">Reading streak</AppText>
      <View style={styles.row}>
        <View style={styles.item}>
          <AppText variant="heading2">{streak.current}</AppText>
          <AppText color="textSecondary">{pluralize(streak.current, 'day')}</AppText>
          <AppText variant="caption" color="textSecondary">Current streak</AppText>
        </View>
        <View style={styles.item}>
          <AppText variant="heading2">{streak.longest}</AppText>
          <AppText color="textSecondary">{pluralize(streak.longest, 'day')}</AppText>
          <AppText variant="caption" color="textSecondary">Longest streak</AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  item: {
    flex: 1,
  },
});
