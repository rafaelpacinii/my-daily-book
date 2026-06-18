export type StatisticsPeriodKey = '7d' | '30d' | 'month' | 'year' | 'all' | 'custom';
export type BookStatisticsSortKey = 'pages' | 'time' | 'completedCycles' | 'title';

export interface StatisticsPeriodViewModel {
  key: StatisticsPeriodKey;
  label: string;
  startDate: string;
  endDate: string;
}

export interface StatisticMetricViewModel {
  label: string;
  value: string;
  description?: string;
}

export interface ChartPointViewModel {
  key: string;
  label: string;
  value: number;
  valueLabel: string;
}

export interface StatisticsOverviewViewModel {
  period: StatisticsPeriodViewModel;
  hasReadingData: boolean;
  summary: StatisticMetricViewModel[];
  streak: StatisticMetricViewModel[];
  pagesByDay: ChartPointViewModel[];
  readingTimeByDay: ChartPointViewModel[];
  pagesByMonth: ChartPointViewModel[];
  books: BookStatisticsViewModel[];
  authors: AuthorStatisticsViewModel[];
  formats: FormatStatisticsViewModel[];
}

export interface BookStatisticsViewModel {
  id: string;
  title: string;
  authors: string;
  completedCycles: number;
  completedCyclesLabel: string;
  rereads: number;
  rereadsLabel: string;
  pagesRead: number;
  pagesReadLabel: string;
  readingTime: number;
  readingTimeLabel: string;
  readingDays: number;
  readingDaysLabel: string;
  averagePagesPerDay: number;
  averagePagesPerDayLabel: string;
}

export interface AuthorStatisticsViewModel {
  id: string;
  name: string;
  worksReadLabel: string;
  completedCyclesLabel: string;
  pagesReadLabel: string;
  readingTimeLabel: string;
  averageRatingLabel: string;
  rereadsLabel: string;
}

export interface FormatStatisticsViewModel {
  id: 'physical' | 'digital' | 'unknown';
  label: string;
  pagesRead: number;
  pagesReadLabel: string;
  readingTimeLabel: string;
  completedCyclesLabel: string;
  percentage: number;
  percentageLabel: string;
}

export interface StatisticsCustomPeriodFormState {
  startDate: string;
  endDate: string;
}
