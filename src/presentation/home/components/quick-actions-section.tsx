import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { SectionHeader } from '@/src/components/layout';
import { Button } from '@/src/components/ui';
import { domainIcons } from '@/src/components/navigation/domain-icons';
import { useAppTheme } from '@/src/presentation';
import { appRoutes } from '@/src/presentation/navigation/routes';

export function QuickActionsSection() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title={t('home.quickActions.title')} />
      <View style={[styles.grid, { gap: theme.spacing.md }]}>
        <Button
          title={t('home.quickActions.addBook')}
          variant="secondary"
          disabled
          accessibilityLabel={t('home.quickActions.addBookUnavailable')}
          icon={<Ionicons name={domainIcons.add} size={18} color={theme.colors.textPrimary} />}
        />
        <Button
          title={t('home.quickActions.recordReading')}
          variant="outline"
          accessibilityLabel={t('home.quickActions.recordReading')}
          onPress={() => router.push(appRoutes.reading)}
          icon={<Ionicons name={domainIcons.reading} size={18} color={theme.colors.primary} />}
        />
        <Button
          title={t('home.quickActions.viewLibrary')}
          variant="outline"
          accessibilityLabel={t('home.quickActions.viewLibrary')}
          onPress={() => router.push(appRoutes.library)}
          icon={<Ionicons name={domainIcons.library} size={18} color={theme.colors.primary} />}
        />
        <Button
          title={t('home.quickActions.statistics')}
          variant="ghost"
          accessibilityLabel={t('home.quickActions.openStatistics')}
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
