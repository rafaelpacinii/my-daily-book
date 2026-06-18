import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/src/presentation';
import { AppText } from '@/src/components/ui/AppText';
import { Button } from '@/src/components/ui/Button';
import { shouldShowOptionalAction } from '@/src/components/ui/component-state';

export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'book-outline',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { gap: theme.spacing.md }]}>
      <Ionicons name={icon} size={theme.iconSizes.xl} color={theme.colors.primarySoft} />
      <View style={styles.copy}>
        <AppText variant="heading3" align="center">
          {title}
        </AppText>
        {description ? (
          <AppText color="textSecondary" align="center">
            {description}
          </AppText>
        ) : null}
      </View>
      {shouldShowOptionalAction(actionLabel, Boolean(onAction)) ? (
        <Button title={actionLabel ?? ''} onPress={onAction} variant="secondary" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  copy: {
    gap: 6,
  },
});
