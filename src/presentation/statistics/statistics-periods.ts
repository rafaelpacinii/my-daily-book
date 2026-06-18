import { i18n } from '@/src/localization/i18n';
import {
  addCivilDays,
  compareCivilDates,
  isValidCivilDate,
  startOfMonth,
  startOfYear,
  toLocalCivilDate,
} from './statistics-formatters';
import type {
  StatisticsCustomPeriodFormState,
  StatisticsPeriodKey,
  StatisticsPeriodViewModel,
} from './statistics-types';

export const statisticsPeriodOptions: StatisticsPeriodKey[] = ['7d', '30d', 'month', 'year', 'all', 'custom'];

export function resolveStatisticsPeriod(
  key: StatisticsPeriodKey,
  today = toLocalCivilDate(),
  custom?: StatisticsCustomPeriodFormState,
): StatisticsPeriodViewModel {
  if (key === '7d') return createPeriod(key, addCivilDays(today, -6), today);
  if (key === '30d') return createPeriod(key, addCivilDays(today, -29), today);
  if (key === 'month') return createPeriod(key, startOfMonth(today), today);
  if (key === 'year') return createPeriod(key, startOfYear(today), today);
  if (key === 'custom') {
    return createPeriod(
      key,
      custom?.startDate.trim() || today,
      custom?.endDate.trim() || today,
    );
  }

  return createPeriod(key, '0001-01-01', today);
}

export function validateCustomStatisticsPeriod(form: StatisticsCustomPeriodFormState) {
  const startDate = form.startDate.trim();
  const endDate = form.endDate.trim();

  if (!startDate) return invalid('statistics.periods.startRequired');
  if (!endDate) return invalid('statistics.periods.endRequired');
  if (!isValidCivilDate(startDate)) return invalid('statistics.periods.validStartDate');
  if (!isValidCivilDate(endDate)) return invalid('statistics.periods.validEndDate');
  if (compareCivilDates(endDate, startDate) < 0) return invalid('statistics.periods.endBeforeStart');

  return valid({ startDate, endDate });
}

function createPeriod(
  key: StatisticsPeriodKey,
  startDate: string,
  endDate: string,
): StatisticsPeriodViewModel {
  return {
    key,
    label: t(`statistics.periods.${key}`),
    startDate,
    endDate,
  };
}

function valid(input: StatisticsCustomPeriodFormState) {
  return { valid: true as const, message: null, input };
}

function invalid(key: string) {
  return { valid: false as const, message: t(key), input: null };
}

function t(key: string): string {
  return String(i18n.t(key));
}
