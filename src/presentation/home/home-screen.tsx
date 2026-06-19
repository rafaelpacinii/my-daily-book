import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/src/components/feedback';
import { Screen } from '@/src/components/layout';
import { useApplication, useAppTheme } from '@/src/presentation';
import { appRoutes } from '@/src/presentation/navigation/routes';

import {
  ActiveGoalsSection,
  CurrentlyReadingSection,
  HomeHeader,
  HomeLoadingState,
  LibraryOverviewSection,
  QuickActionsSection,
  ReadingStreakCard,
  TodaySummaryCard,
} from './components';
import {
  formatHomeDate,
  getLocalGreeting,
} from './home-formatters';
import { useHomeScreen } from './home-controller';

export function HomeScreen() {
  const { api } = useApplication();

  if (!api) {
    return (
      <Screen>
        <HomeLoadingState />
      </Screen>
    );
  }

  return <HomeScreenContent api={api} />;
}

function HomeScreenContent({ api }: { api: NonNullable<ReturnType<typeof useApplication>['api']> }) {
  const { theme } = useAppTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'pt-BR' ? 'pt-BR' : 'en';
  const { status, viewModel, error, retry, refresh } = useHomeScreen({ api });
  const isInitialLoading = status === 'idle' || (status === 'loading' && !viewModel);
  const isRefreshing = status === 'refreshing';

  if (isInitialLoading) {
    return (
      <Screen>
        <HomeLoadingState />
      </Screen>
    );
  }

  if (!viewModel && error) {
    return (
      <Screen>
        <ErrorState
          title={t('home.loadErrorTitle')}
          description={t('home.loadErrorDescription')}
          actionLabel={t('common.actions.retry')}
          onAction={retry}
        />
      </Screen>
    );
  }

  if (!viewModel) {
    return (
      <Screen>
        <HomeLoadingState />
      </Screen>
    );
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }>
      <HomeHeader
        greeting={getLocalGreeting(new Date(), locale)}
        dateLabel={formatHomeDate(new Date(), locale)}
        onOpenSettings={() => router.push(appRoutes.settings)}
      />
      {error ? (
        <ErrorState
          title={t('home.refreshErrorTitle')}
          description={t('home.refreshErrorDescription')}
          actionLabel={t('common.actions.retry')}
          onAction={refresh}
        />
      ) : null}
      <TodaySummaryCard summary={viewModel.todaySummary} />
      <CurrentlyReadingSection books={viewModel.currentlyReading} />
      <QuickActionsSection />
      <LibraryOverviewSection overview={viewModel.libraryOverview} />
      <ReadingStreakCard streak={viewModel.streak} />
      <ActiveGoalsSection goals={viewModel.activeGoals} />
      <View />
    </Screen>
  );
}
