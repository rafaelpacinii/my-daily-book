import { StyleSheet, View } from 'react-native';

import { AppLogo } from '@/src/components/brand';
import { AppText, IconButton } from '@/src/components/ui';
import { useAppTheme } from '@/src/presentation';

export interface HomeHeaderProps {
  greeting: string;
  dateLabel: string;
  onOpenSettings: () => void;
}

export function HomeHeader({ greeting, dateLabel, onOpenSettings }: HomeHeaderProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { gap: theme.spacing.md }]}>
      <AppLogo size={52} />
      <View style={styles.copy}>
        <AppText variant="caption" color="textSecondary">
          {greeting}
        </AppText>
        <AppText variant="heading2">My Daily Book</AppText>
        <AppText color="textSecondary">{dateLabel}</AppText>
      </View>
      <IconButton
        icon="settings-outline"
        accessibilityLabel="Open settings"
        onPress={onOpenSettings}
        variant="default"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  copy: {
    flex: 1,
  },
});
