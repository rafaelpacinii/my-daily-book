import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { tabRoutes } from '@/src/components/navigation/tab-routes';
import { useAppTheme } from '@/src/presentation';

export default function TabLayout() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          minHeight: theme.componentHeights.tabBar,
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      {tabRoutes.map((route) => (
        <Tabs.Screen
          key={route.name}
          name={route.name}
          options={{
            title: t(route.titleKey),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={route.icon} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
