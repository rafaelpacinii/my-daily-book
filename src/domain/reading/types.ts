import type { ReadingCycleStatus } from '@/src/database/schema';

export interface ReadingCycleDateBounds {
  startedAt: string;
  status: ReadingCycleStatus;
  finishedAt?: string | null;
  droppedAt?: string | null;
}

export interface ReadingPageRange {
  startPage: number;
  endPage: number;
}

export interface ReadingContinuityResult {
  isContinuous: boolean;
  expectedStartPage: number | null;
}

export interface ReadingProgressInput {
  currentPage: number | null;
  pageCount?: number | null;
}

export interface ReadingLogStatsInput extends ReadingPageRange {
  readingDate: string;
  durationSeconds?: number | null;
}

