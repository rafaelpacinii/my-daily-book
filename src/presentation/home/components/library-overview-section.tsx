import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { SectionHeader } from '@/src/components/layout';
import { AppText, Card } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';
import { appRoutes } from '@/src/presentation/navigation/routes';

import type { LibraryOverviewViewModel } from '../home-types';

const overviewItems = [
  ['To read', 'toRead'],
  ['Reading', 'reading'],
  ['Read', 'read'],
  ['Dropped', 'dropped'],
] as const;

export interface LibraryOverviewSectionProps {
  overview: LibraryOverviewViewModel;
}

export function LibraryOverviewSection({ overview }: LibraryOverviewSectionProps) {
  const { theme } = useAppTheme();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader
        title="Library overview"
        description={`${overview.total} total books, ${overview.owned} owned`}
      />
      <View style={[styles.grid, { gap: theme.spacing.md }]}>
        {overviewItems.map(([label, key]) => (
          <View key={key} style={styles.item}>
            <Card
              variant="interactive"
              accessibilityLabel={`Open Library filtered by ${label}`}
              onPress={() => router.push(appRoutes.library)}>
              <AppText variant="heading2">{overview[key]}</AppText>
              <AppText color="textSecondary">{label}</AppText>
            </Card>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    flexBasis: '45%',
    flexGrow: 1,
  },
});
