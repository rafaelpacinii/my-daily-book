import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/src/presentation';
import { AppText } from '@/src/components/ui/AppText';
import { Button } from '@/src/components/ui/Button';
import { shouldShowOptionalAction } from '@/src/components/ui/component-state';

export interface ErrorStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorState({ title, description, actionLabel, onAction }: ErrorStateProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { gap: theme.spacing.lg }]}>
      <Ionicons name="alert-circle-outline" size={theme.iconSizes.xl} color={theme.colors.error} />
      <View style={styles.copy}>
        <AppText variant="heading3" align="center">
          {title}
        </AppText>
        <AppText color="textSecondary" align="center">
          {description}
        </AppText>
      </View>
      {shouldShowOptionalAction(actionLabel, Boolean(onAction)) ? (
        <Button title={actionLabel ?? ''} onPress={onAction} variant="outline" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: 8,
  },
});
