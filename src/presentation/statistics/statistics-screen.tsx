import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState } from '@/src/components/feedback';
import { Screen, SectionHeader } from '@/src/components/layout';
import { AppHeader } from '@/src/components/navigation';
import { AppText, Button, Card } from '@/src/components/ui';
import { useApplication, useAppTheme } from '@/src/presentation';
import { ReadingFormField } from '@/src/presentation/reading/components';

import { useStatisticsScreen } from './statistics-controller';
import { formatInteger } from './statistics-formatters';
import { statisticsPeriodOptions } from './statistics-periods';
import type {
  AuthorStatisticsViewModel,
  BookStatisticsSortKey,
  BookStatisticsViewModel,
  ChartPointViewModel,
  FormatStatisticsViewModel,
  StatisticMetricViewModel,
  StatisticsPeriodKey,
} from './statistics-types';

export function StatisticsScreen() {
  const { api } = useApplication();
  const { t } = useTranslation();
  if (!api) return <Screen loading loadingMessage={t('statistics.screen.loading')} />;
  return <StatisticsScreenContent api={api.statistics} />;
}

function StatisticsScreenContent({
  api,
}: {
  api: NonNullable<ReturnType<typeof useApplication>['api']>['statistics'];
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const state = useStatisticsScreen(api);
  const loading = state.status === 'idle' || (state.status === 'loading' && !state.viewModel);

  if (loading) return <Screen loading loadingMessage={t('statistics.screen.loading')} />;

  if (state.status === 'error' && !state.viewModel) {
    return (
      <Screen header={<Header />}>
        <ErrorState title={t('statistics.screen.loadErrorTitle')} description={t('errors.generic')} actionLabel={t('common.actions.retry')} onAction={state.retry} />
      </Screen>
    );
  }

  const viewModel = state.viewModel;
  if (!viewModel) return <Screen loading loadingMessage={t('statistics.screen.loading')} />;

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={state.refresh} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
      header={<Header />}>
      {state.error ? <ErrorState title={t('statistics.screen.refreshErrorTitle')} description={t('statistics.screen.refreshErrorDescription')} actionLabel={t('common.actions.retry')} onAction={state.refresh} /> : null}

      <PeriodSelector selected={state.periodKey} onSelect={state.setPeriodKey} />
      {state.periodKey === 'custom' ? (
        <CustomPeriodFields
          startDate={state.customForm.startDate}
          endDate={state.customForm.endDate}
          error={state.formError}
          onStartDateChange={(startDate) => state.setCustomForm((current) => ({ ...current, startDate }))}
          onEndDateChange={(endDate) => state.setCustomForm((current) => ({ ...current, endDate }))}
          onApply={state.refresh}
        />
      ) : null}

      {!viewModel.hasReadingData ? (
        <Card variant="outlined">
          <EmptyState
            icon="stats-chart-outline"
            title={t('statistics.screen.emptyTitle')}
            description={t('statistics.screen.emptyDescription')}
          />
        </Card>
      ) : null}

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader title={t('statistics.screen.overview')} description={viewModel.period.label} />
        <MetricGrid metrics={viewModel.summary} />
      </View>

      <View style={{ gap: theme.spacing.md }}>
        <SectionHeader title={t('statistics.screen.streak')} />
        <MetricGrid metrics={viewModel.streak} />
      </View>

      <SimpleBarChart title={t('statistics.charts.pagesByDay')} points={viewModel.pagesByDay} emptyTitle={t('statistics.screen.noPagesPeriod')} />
      <SimpleBarChart title={t('statistics.charts.readingTimeByDay')} points={viewModel.readingTimeByDay} emptyTitle={t('statistics.screen.noTimePeriod')} />
      <SimpleBarChart title={t('statistics.charts.pagesByMonth')} points={viewModel.pagesByMonth} emptyTitle={t('statistics.screen.noMonthlyPages')} />

      <BooksSection
        books={viewModel.books}
        sort={state.bookSort}
        onSortChange={state.setBookSort}
      />
      <AuthorsSection authors={viewModel.authors} />
      <FormatsSection formats={viewModel.formats} />
    </Screen>
  );
}

function Header() {
  const { t } = useTranslation();

  return (
    <AppHeader
      title={t('statistics.screen.title')}
      subtitle={t('statistics.screen.subtitle')}
      leftAction={<Button title={t('common.actions.back')} variant="ghost" onPress={() => router.back()} />}
    />
  );
}

function PeriodSelector({
  selected,
  onSelect,
}: {
  selected: StatisticsPeriodKey;
  onSelect: (period: StatisticsPeriodKey) => void;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <SectionHeader title={t('statistics.screen.period')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {statisticsPeriodOptions.map((period) => (
            <Button
              key={period}
              title={t(`statistics.periods.${period}`)}
              variant={selected === period ? 'secondary' : 'outline'}
              accessibilityLabel={t('statistics.screen.periodAccessibility', { label: t(`statistics.periods.${period}`) })}
              onPress={() => onSelect(period)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function CustomPeriodFields({
  startDate,
  endDate,
  error,
  onStartDateChange,
  onEndDateChange,
  onApply,
}: {
  startDate: string;
  endDate: string;
  error: string | null;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onApply: () => void;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <ReadingFormField label={t('statistics.screen.startDate')} value={startDate} placeholder={t('reading.start.datePlaceholder')} onChangeText={onStartDateChange} />
        </View>
        <View style={{ flex: 1 }}>
          <ReadingFormField label={t('statistics.screen.endDate')} value={endDate} placeholder={t('reading.start.datePlaceholder')} onChangeText={onEndDateChange} />
        </View>
      </View>
      {error ? <AppText color="error">{error}</AppText> : null}
      <Button title={t('statistics.screen.applyPeriod')} variant="secondary" onPress={onApply} />
    </View>
  );
}

function MetricGrid({ metrics }: { metrics: StatisticMetricViewModel[] }) {
  const { theme } = useAppTheme();

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
      {metrics.map((metric) => (
        <Card key={metric.label} variant="outlined" style={{ flexBasis: '47%', flexGrow: 1 }}>
          <AppText variant="caption" color="textSecondary">{metric.label}</AppText>
          <AppText variant="heading2">{metric.value}</AppText>
          {metric.description ? <AppText color="textSecondary">{metric.description}</AppText> : null}
        </Card>
      ))}
    </View>
  );
}

function SimpleBarChart({
  title,
  points,
  emptyTitle,
}: {
  title: string;
  points: ChartPointViewModel[];
  emptyTitle: string;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const visiblePoints = points.slice(-14);
  const maxValue = Math.max(0, ...visiblePoints.map((point) => point.value));

  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title={title} />
      {maxValue <= 0 ? (
        <Card variant="outlined">
          <EmptyState icon="stats-chart-outline" title={emptyTitle} description={t('statistics.screen.chartDescription')} />
        </Card>
      ) : (
        <Card variant="outlined">
          <View
            accessible
            accessibilityLabel={t('statistics.charts.highestValue', { title, value: formatInteger(maxValue) })}
            style={{ gap: theme.spacing.sm }}>
            {visiblePoints.map((point) => {
              const width: `${number}%` = `${Math.max(4, (point.value / maxValue) * 100)}%`;
              return (
                <View key={point.key} style={{ gap: theme.spacing.xs }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
                    <AppText variant="caption" color="textSecondary">{point.label}</AppText>
                    <AppText variant="caption">{point.valueLabel}</AppText>
                  </View>
                  <View style={{ height: 10, borderRadius: theme.radii.full, backgroundColor: theme.colors.surfaceSecondary, overflow: 'hidden' }}>
                    <View style={{ width, height: '100%', backgroundColor: theme.colors.accent }} />
                  </View>
                </View>
              );
            })}
          </View>
        </Card>
      )}
    </View>
  );
}

function BooksSection({
  books,
  sort,
  onSortChange,
}: {
  books: BookStatisticsViewModel[];
  sort: BookStatisticsSortKey;
  onSortChange: (sort: BookStatisticsSortKey) => void;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const sortOptions: BookStatisticsSortKey[] = ['pages', 'time', 'completedCycles', 'title'];

  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title={t('statistics.screen.books')} description={t('statistics.screen.booksCount', { count: books.length })} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {sortOptions.map((option) => (
            <Button
              key={option}
              title={t(`statistics.sort.${option}`)}
              variant={sort === option ? 'secondary' : 'outline'}
              onPress={() => onSortChange(option)}
            />
          ))}
        </View>
      </ScrollView>
      {books.length > 0 ? books.map((book) => (
        <Card key={book.id} variant="outlined">
          <AppText variant="heading3">{book.title}</AppText>
          <AppText color="textSecondary">{book.authors}</AppText>
          <MetricLine label={t('statistics.metrics.completedCycles')} value={book.completedCyclesLabel} />
          <MetricLine label={t('statistics.metrics.rereads')} value={book.rereadsLabel} />
          <MetricLine label={t('statistics.metrics.pagesRead')} value={book.pagesReadLabel} />
          <MetricLine label={t('statistics.metrics.readingTime')} value={book.readingTimeLabel} />
          <MetricLine label={t('statistics.metrics.readingDays')} value={book.readingDaysLabel} />
          <MetricLine label={t('statistics.metrics.averagePagesPerDay')} value={book.averagePagesPerDayLabel} />
        </Card>
      )) : (
        <Card variant="outlined">
          <EmptyState icon="book-outline" title={t('statistics.screen.noBookStatsTitle')} description={t('statistics.screen.noBookStatsDescription')} />
        </Card>
      )}
    </View>
  );
}

function AuthorsSection({ authors }: { authors: AuthorStatisticsViewModel[] }) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title={t('statistics.screen.authors')} description={t('statistics.screen.authorsCount', { count: authors.length })} />
      {authors.length > 0 ? authors.map((author) => (
        <Card key={author.id} variant="outlined">
          <AppText variant="heading3">{author.name}</AppText>
          <MetricLine label={t('statistics.metrics.worksRead')} value={author.worksReadLabel} />
          <MetricLine label={t('statistics.metrics.completedCycles')} value={author.completedCyclesLabel} />
          <MetricLine label={t('statistics.metrics.pagesRead')} value={author.pagesReadLabel} />
          <MetricLine label={t('statistics.metrics.readingTime')} value={author.readingTimeLabel} />
          <MetricLine label={t('statistics.metrics.averageRating')} value={author.averageRatingLabel} />
          <MetricLine label={t('statistics.metrics.rereads')} value={author.rereadsLabel} />
        </Card>
      )) : (
        <Card variant="outlined">
          <EmptyState icon="person-outline" title={t('statistics.screen.noAuthorStatsTitle')} description={t('statistics.screen.noAuthorStatsDescription')} />
        </Card>
      )}
    </View>
  );
}

function FormatsSection({ formats }: { formats: FormatStatisticsViewModel[] }) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <View style={{ gap: theme.spacing.md }}>
      <SectionHeader title={t('statistics.screen.formats')} />
      {formats.map((format) => (
        <Card key={format.id} variant="outlined">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
            <AppText variant="heading3">{format.label}</AppText>
            <AppText>{format.percentageLabel}</AppText>
          </View>
          <MetricLine label={t('statistics.metrics.pagesRead')} value={format.pagesReadLabel} />
          <MetricLine label={t('statistics.metrics.readingTime')} value={format.readingTimeLabel} />
          <MetricLine label={t('statistics.metrics.completedCycles')} value={format.completedCyclesLabel} />
          <View style={{ height: 8, borderRadius: theme.radii.full, backgroundColor: theme.colors.surfaceSecondary, overflow: 'hidden' }}>
            <View style={{ width: `${format.percentage}%` as `${number}%`, maxWidth: '100%', height: '100%', backgroundColor: theme.colors.primary }} />
          </View>
        </Card>
      ))}
    </View>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
      <AppText color="textSecondary">{label}</AppText>
      <AppText>{value}</AppText>
    </View>
  );
}
