import type {
  BookMetadata,
  LibraryBookDetails,
  LibraryBookSummary,
  PossibleEditionResult,
} from '@/src/application';

import {
  formatAuthors,
  formatBookFormat,
  formatLibraryStatus,
  normalizeHttpsUrl,
} from './library-formatters';
import type {
  GoogleBookDetailsViewModel,
  GoogleBooksResultViewModel,
  LibraryBookDetailsViewModel,
  LibraryBookViewModel,
  LibraryCopyViewModel,
  LibraryEditionViewModel,
  PossibleEditionViewModel,
  ReadingCycleSummaryViewModel,
} from './library-types';

export function mapLibraryBookSummary(summary: LibraryBookSummary): LibraryBookViewModel {
  const firstFormat = summary.copies[0]?.format ?? null;

  return {
    id: summary.libraryBook.id,
    title: summary.work.title,
    originalTitle: summary.work.originalTitle,
    authors: formatAuthors(summary.authors.map((author) => author.name)),
    coverUrl: normalizeHttpsUrl(summary.coverUrl),
    status: summary.libraryBook.status,
    statusLabel: formatLibraryStatus(summary.libraryBook.status),
    progressPercentage: summary.progressPercentage,
    formatLabel: firstFormat ? formatBookFormat(firstFormat) : null,
    copyCount: summary.copies.length,
    lastReadDate: summary.latestReadingCycle?.lastReadAt ?? null,
    rating: summary.libraryBook.rating,
  };
}

export function mapLibraryBookDetails(details: LibraryBookDetails): LibraryBookDetailsViewModel {
  const copiedEditionIds = new Set(details.copies.map((copy) => copy.editionId));

  return {
    ...mapLibraryBookSummary(details),
    description: details.work.description,
    notes: details.libraryBook.notes,
    editions: details.editions.map((edition): LibraryEditionViewModel => ({
      id: edition.id,
      title: edition.title,
      publisher: edition.publisher,
      publishedDate: edition.publishedDate,
      language: edition.language,
      pageCount: edition.pageCount,
      isbn10: edition.isbn10,
      isbn13: edition.isbn13,
      coverUrl: normalizeHttpsUrl(edition.coverUrl ?? edition.thumbnailUrl),
      hasCopy: copiedEditionIds.has(edition.id),
    })),
    copies: details.copies.map((copy) => mapCopy(copy, details)),
    readingHistory: details.readingLogsByCycle.map(({ cycle, logs }) => {
      const edition = details.editions.find((item) => item.id === cycle.editionId);
      return mapReadingCycle(cycle.id, cycle.cycleNumber, cycle.status, edition?.title ?? 'Unknown edition', cycle.startedAt, cycle.finishedAt, cycle.droppedAt, logs);
    }),
    lists: details.lists.map(({ list }) => list.name),
    goals: details.goals.map(({ goal }) => goal.name),
  };
}

export function mapGoogleBooksVolume(volume: BookMetadata): GoogleBooksResultViewModel {
  return {
    source: volume.source,
    externalId: volume.externalId,
    googleBooksId: volume.googleBooksId,
    title: volume.title,
    subtitle: volume.subtitle,
    authors: formatAuthors(volume.authors),
    publisher: volume.publisher,
    publishedDate: volume.publishedDate,
    pageCount: volume.pageCount,
    language: volume.language,
    isbn: volume.isbn13 ?? volume.isbn10,
    coverUrl: normalizeHttpsUrl(volume.coverUrl),
    sourceLabel: volume.source === 'brasil_api' ? 'BrasilAPI' : 'Google Books',
  };
}

export function mapGoogleBookDetails(volume: BookMetadata): GoogleBookDetailsViewModel {
  return {
    ...mapGoogleBooksVolume(volume),
    description: volume.description,
    isbn10: volume.isbn10,
    isbn13: volume.isbn13,
    previewLink: volume.previewLink,
    infoLink: volume.infoLink,
  };
}

export function mapPossibleEdition(result: PossibleEditionResult): PossibleEditionViewModel {
  return {
    ...mapGoogleBooksVolume(result.volume),
    score: result.score,
    reasons: result.reasons,
  };
}

type LibraryCopyDetails = LibraryBookDetails['copies'][number];
type ReadingLogDetails = LibraryBookDetails['readingLogsByCycle'][number]['logs'][number];

function mapCopy(copy: LibraryCopyDetails, details: LibraryBookDetails): LibraryCopyViewModel {
  const edition = details.editions.find((item) => item.id === copy.editionId);

  return {
    id: copy.id,
    editionId: copy.editionId,
    editionTitle: edition?.title ?? 'Unknown edition',
    format: copy.format,
    formatLabel: formatBookFormat(copy.format),
    label: copy.label,
    acquiredAt: copy.acquiredAt,
    notes: copy.notes,
  };
}

function mapReadingCycle(
  id: string,
  cycleNumber: number,
  status: string,
  editionTitle: string,
  startedAt: string,
  finishedAt: string | null,
  droppedAt: string | null,
  logs: ReadingLogDetails[],
): ReadingCycleSummaryViewModel {
  return {
    id,
    cycleNumber,
    status,
    editionTitle,
    startedAt,
    finishedAt,
    droppedAt,
    totalPages: logs.reduce((total, log) => total + log.endPage - log.startPage + 1, 0),
    totalDurationSeconds: logs.reduce((total, log) => total + (log.durationSeconds ?? 0), 0),
  };
}
