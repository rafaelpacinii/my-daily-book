import type { LibraryBookStatus, ReadingCycleStatus } from '@/src/database/schema';

export interface LibraryBookStatusCycle {
  status: ReadingCycleStatus;
  cycleNumber: number;
}

export function determineLibraryBookStatus(cycles: LibraryBookStatusCycle[]): LibraryBookStatus {
  if (cycles.some((cycle) => cycle.status === 'reading')) {
    return 'reading';
  }

  if (cycles.some((cycle) => cycle.status === 'completed')) {
    return 'read';
  }

  if (cycles.length === 0) {
    return 'to_read';
  }

  const latestCycle = cycles.reduce((latest, cycle) =>
    cycle.cycleNumber > latest.cycleNumber ? cycle : latest,
  );

  return latestCycle.status === 'dropped' ? 'dropped' : 'to_read';
}

