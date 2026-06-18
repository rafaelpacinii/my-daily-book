import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SectionHeader } from '@/src/components/layout';
import { Button } from '@/src/components/ui';
import { domainIcons } from '@/src/components/navigation/domain-icons';
import { useAppTheme } from '@/src/presentation';
import { appRoutes } from '@/src/presentation/navigation/routes';

export function QuickActionsSection() {
  const { theme } = useAppTheme();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title="Quick actions" />
      <View style={[styles.grid, { gap: theme.spacing.md }]}>
        <Button
          title="Add book"
          variant="secondary"
          disabled
          accessibilityLabel="Add book unavailable"
          icon={<Ionicons name={domainIcons.add} size={18} color={theme.colors.textPrimary} />}
        />
        <Button
          title="Record reading"
          variant="outline"
          accessibilityLabel="Record reading"
          onPress={() => router.push(appRoutes.reading)}
          icon={<Ionicons name={domainIcons.reading} size={18} color={theme.colors.primary} />}
        />
        <Button
          title="View library"
          variant="outline"
          accessibilityLabel="View library"
          onPress={() => router.push(appRoutes.library)}
          icon={<Ionicons name={domainIcons.library} size={18} color={theme.colors.primary} />}
        />
        <Button
          title="Statistics"
          variant="ghost"
          accessibilityLabel="Open statistics"
          onPress={() => router.push(appRoutes.statistics)}
          icon={<Ionicons name={domainIcons.statistics} size={18} color={theme.colors.primary} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    alignItems: 'stretch',
  },
});
