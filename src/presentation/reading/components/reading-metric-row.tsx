import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';

export function ReadingMetricRow({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.row, { gap: theme.spacing.sm }]}>
      {items.map((item) => (
        <View
          key={item.label}
          style={[
            styles.item,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.sm,
              padding: theme.spacing.md,
            },
          ]}>
          <AppText variant="caption" color="textSecondary">
            {item.label}
          </AppText>
          <AppText variant="heading3">{item.value}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 130,
  },
});
