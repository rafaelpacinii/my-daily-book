import * as queries from '@/src/application/queries/reading';
import {
  completeReadingCycle,
  createReadingLog,
  deleteReadingLog,
  dropReadingCycle,
  startReadingCycle,
  updateReadingLog,
} from '@/src/application/use-cases/reading';

export const readingApi = {
  getActiveCycle: queries.getActiveReadingCycle,
  listActiveCycles: queries.listActiveReadingCycles,
  getCycleDetails: queries.getReadingCycleDetails,
  getLogDetails: queries.getReadingLogDetails,
  listHistory: queries.listReadingHistory,
  listLogsByDate: queries.listReadingLogsByDate,
  listLogsByDateRange: queries.listReadingLogsByDateRange,
  getDailySummary: queries.getDailyReadingSummary,
  startCycle: startReadingCycle,
  completeCycle: completeReadingCycle,
  dropCycle: dropReadingCycle,
  createLog: createReadingLog,
  updateLog: updateReadingLog,
  deleteLog: deleteReadingLog,
};

export type ReadingApi = typeof readingApi;
