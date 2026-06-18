import type {
  DailyReadingSummary,
  LibraryBookDetails,
  LibraryBookSummary,
  ReadingCycleDetails,
  ReadingHistoryItem,
  ReadingLogSummary,
} from '@/src/application';
import { i18n } from '@/src/localization/i18n';
import {
  formatAuthors,
  formatBookFormat,
  formatLibraryStatus,
  normalizeHttpsUrl,
} from '@/src/presentation/library/library-formatters';
import {
  formatCivilDate,
  formatCurrentPage,
  formatCycleNumber,
  formatDuration,
  formatPageRange,
  formatPagesRead,
  formatProgress,
  formatReadingStatus,
} from './reading-formatters';
import type {
  ActiveReadingViewModel,
  DailyReadingSummaryViewModel,
  ReadingCycleViewModel,
  ReadingHistoryItemViewModel,
  ReadingLogViewModel,
  StartReadingBookOption,
  StartReadingCopyOption,
  StartReadingDetailsViewModel,
  StartReadingEditionOption,
} from './reading-types';

export function mapActiveReading(details: ReadingCycleDetails): ActiveReadingViewModel {
  const cycle = mapReadingCycle(details);
  const previousEndPage = details.logs.reduce((highest, log) => Math.max(highest, log.endPage), 0);

  return {
    ...cycle,
    nextStartPage: previousEndPage + 1,
  };
}

export function mapReadingCycle(details: ReadingCycleDetails): ReadingCycleViewModel {
  const currentPage = details.logs.reduce<number | null>(
    (highest, log) => Math.max(highest ?? 0, log.endPage),
    null,
  );
  const readingDays = new Set(details.logs.map((log) => log.readingDate)).size;
  const logs = [...details.logs]
    .sort(compareLogs)
    .map((log): ReadingLogViewModel => ({
      id: log.id,
      readingCycleId: log.readingCycleId,
      readingDate: log.readingDate,
      dateLabel: formatCivilDate(log.readingDate),
      pageRangeLabel: formatPageRange(log.startPage, log.endPage),
      pagesRead: log.endPage - log.startPage + 1,
      pagesReadLabel: formatPagesRead(log.endPage - log.startPage + 1),
      startPage: log.startPage,
      endPage: log.endPage,
      durationSeconds: log.durationSeconds,
      durationLabel: formatDuration(log.durationSeconds),
      notes: log.notes,
      createdAt: log.createdAt,
    }));

  return {
    id: details.cycle.id,
    libraryBookId: details.libraryBook.id,
    title: details.work.title,
    authors: formatAuthors(details.authors.map((author) => author.name)),
    coverUrl: normalizeHttpsUrl(details.edition.coverUrl ?? details.edition.thumbnailUrl),
    editionTitle: details.edition.title,
    editionMeta: formatEditionMeta(details),
    copyFormatLabel: details.copy ? formatCopy(details.copy) : t('reading.formatters.noOwnedCopy'),
    cycleNumber: details.cycle.cycleNumber,
    cycleNumberLabel: formatCycleNumber(details.cycle.cycleNumber),
    status: details.cycle.status,
    statusLabel: formatReadingStatus(details.cycle.status),
    startedAt: details.cycle.startedAt,
    startedAtLabel: formatCivilDate(details.cycle.startedAt),
    finishedAt: details.cycle.finishedAt,
    finishedAtLabel: details.cycle.finishedAt ? formatCivilDate(details.cycle.finishedAt) : null,
    droppedAt: details.cycle.droppedAt,
    droppedAtLabel: details.cycle.droppedAt ? formatCivilDate(details.cycle.droppedAt) : null,
    lastReadAt: details.cycle.lastReadAt,
    lastReadAtLabel: details.cycle.lastReadAt ? formatCivilDate(details.cycle.lastReadAt) : t('reading.formatters.notLoggedYet'),
    currentPage,
    currentPageLabel: formatCurrentPage(currentPage),
    pageCount: details.edition.pageCount,
    pageCountLabel: details.edition.pageCount
      ? t('reading.start.pageCount', { count: details.edition.pageCount })
      : t('reading.formatters.pageCountUnknown'),
    progressPercentage: details.progressPercentage,
    progressLabel: formatProgress(details.progressPercentage),
    totalPagesRead: details.totalPagesRead,
    totalPagesReadLabel: formatPagesRead(details.totalPagesRead),
    totalDurationSeconds: details.totalDurationSeconds,
    totalDurationLabel: formatDuration(details.totalDurationSeconds),
    readingDays,
    readingDaysLabel: t('reading.formatters.readingDays', { count: readingDays }),
    rating: details.cycle.rating,
    notes: details.cycle.notes,
    logs,
  };
}

export function mapDailyReadingSummary(summary: DailyReadingSummary): DailyReadingSummaryViewModel {
  return {
    readingDate: summary.readingDate,
    pagesReadLabel: formatPagesRead(summary.pagesRead),
    durationLabel: formatDuration(summary.durationSeconds),
    sessionsLabel: t('reading.formatters.sessions', { count: summary.logCount }),
    booksLabel: t('reading.formatters.books', { count: summary.booksRead }),
  };
}

export function mapReadingHistoryItem(item: ReadingHistoryItem): ReadingHistoryItemViewModel {
  const endedAt = item.cycle.finishedAt ?? item.cycle.droppedAt;

  return {
    id: item.cycle.id,
    title: item.work.title,
    authors: formatAuthors(item.authors.map((author) => author.name)),
    coverUrl: normalizeHttpsUrl(item.edition.coverUrl ?? item.edition.thumbnailUrl),
    cycleNumberLabel: formatCycleNumber(item.cycle.cycleNumber),
    status: item.cycle.status,
    statusLabel: formatReadingStatus(item.cycle.status),
    startedAtLabel: formatCivilDate(item.cycle.startedAt),
    endedAtLabel: endedAt ? formatCivilDate(endedAt) : t('reading.formatters.active'),
    totalPagesReadLabel: formatPagesRead(item.totalPagesRead),
    totalDurationLabel: formatDuration(item.totalDurationSeconds),
    readingDaysLabel: t('common.actions.viewDetails'),
  };
}

export function mapStartReadingBook(summary: LibraryBookSummary): StartReadingBookOption {
  const nextCycleNumber = (summary.latestReadingCycle?.cycleNumber ?? 0) + 1;

  return {
    id: summary.libraryBook.id,
    title: summary.work.title,
    authors: formatAuthors(summary.authors.map((author) => author.name)),
    statusLabel: formatLibraryStatus(summary.libraryBook.status),
    coverUrl: normalizeHttpsUrl(summary.coverUrl),
    owned: summary.copies.length > 0,
    active: summary.activeReadingCycle != null,
    nextCycleNumberLabel: formatCycleNumber(nextCycleNumber),
    reread: nextCycleNumber > 1,
  };
}

export function mapStartReadingDetails(details: LibraryBookDetails): StartReadingDetailsViewModel {
  return {
    book: mapStartReadingBook(details),
    editions: details.editions.map((edition): StartReadingEditionOption => ({
      id: edition.id,
      title: edition.title,
      publisher: edition.publisher,
      publishedDate: edition.publishedDate,
      language: edition.language,
      pageCount: edition.pageCount,
      isbn: edition.isbn13 ?? edition.isbn10,
      coverUrl: normalizeHttpsUrl(edition.coverUrl ?? edition.thumbnailUrl),
    })),
    copies: details.copies.map((copy): StartReadingCopyOption => ({
      id: copy.id,
      editionId: copy.editionId,
      formatLabel: formatBookFormat(copy.format),
      label: copy.label ? `${formatBookFormat(copy.format)} - ${copy.label}` : formatBookFormat(copy.format),
    })),
  };
}

export function mapReadingLogSummary(summary: ReadingLogSummary): ReadingLogViewModel {
  const log = summary.log;

  return {
    id: log.id,
    readingCycleId: log.readingCycleId,
    readingDate: log.readingDate,
    dateLabel: formatCivilDate(log.readingDate),
    pageRangeLabel: formatPageRange(log.startPage, log.endPage),
    pagesRead: summary.pagesRead,
    pagesReadLabel: formatPagesRead(summary.pagesRead),
    startPage: log.startPage,
    endPage: log.endPage,
    durationSeconds: log.durationSeconds,
    durationLabel: formatDuration(log.durationSeconds),
    notes: log.notes,
    createdAt: log.createdAt,
  };
}

function compareLogs(left: ReadingCycleDetails['logs'][number], right: ReadingCycleDetails['logs'][number]): number {
  const dateComparison = left.readingDate.localeCompare(right.readingDate);
  if (dateComparison !== 0) return dateComparison;

  const createdComparison = left.createdAt - right.createdAt;
  if (createdComparison !== 0) return createdComparison;

  return left.id.localeCompare(right.id);
}

function formatEditionMeta(details: ReadingCycleDetails): string {
  const parts = [
    details.edition.publisher,
    details.edition.publishedDate,
    details.edition.language,
    details.edition.pageCount ? t('reading.start.pageCount', { count: details.edition.pageCount }) : null,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(' - ') : t('reading.formatters.editionDetailsUnavailable');
}

function formatCopy(copy: NonNullable<ReadingCycleDetails['copy']>): string {
  return copy.label ? `${formatBookFormat(copy.format)} - ${copy.label}` : formatBookFormat(copy.format);
}

function t(key: string, options?: Record<string, unknown>): string {
  return String(i18n.t(key, options));
}
