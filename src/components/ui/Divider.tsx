import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/src/presentation';

export function Divider() {
  const { theme } = useAppTheme();

  return <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
});

