import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/src/presentation';
import { AppText } from '@/src/components/ui/AppText';

export interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { gap: theme.spacing.md }]}>
      <ActivityIndicator color={theme.colors.primary} />
      {message ? <AppText color="textSecondary" align="center">{message}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

