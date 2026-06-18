import { GoogleBooksInvalidResponseError } from './google-books-errors';
import type { BookMetadata } from '@/src/domain/books';
import type {
  GoogleBooksImageLinks,
  GoogleBooksIndustryIdentifier,
  GoogleBooksLibraryInput,
  GoogleBooksVolume,
  GoogleBooksVolumeResource,
  GoogleBooksVolumesResponse,
  PossibleEditionResult,
} from './google-books-types';

export function normalizeIsbn(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/[\s-]/g, '').toUpperCase();

  if (normalized.length !== 10 && normalized.length !== 13) {
    return null;
  }

  return normalized;
}

export function extractIsbn10(identifiers?: GoogleBooksIndustryIdentifier[]): string | null {
  return extractIsbnByLength(identifiers, 10);
}

export function extractIsbn13(identifiers?: GoogleBooksIndustryIdentifier[]): string | null {
  return extractIsbnByLength(identifiers, 13);
}

export function normalizePublishedDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  if (/^\d{4}$/.test(value) || /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    return value;
  }

  const fullDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!fullDateMatch) {
    return null;
  }

  const year = Number(fullDateMatch[1]);
  const month = Number(fullDateMatch[2]);
  const day = Number(fullDateMatch[3]);
  const maxDay = getDaysInMonth(year, month);

  return day >= 1 && day <= maxDay ? value : null;
}

export function normalizeAuthors(authors?: string[]): string[] {
  const seen = new Set<string>();
  const normalizedAuthors: string[] = [];

  for (const author of authors ?? []) {
    const normalized = author.trim();

    if (normalized.length > 0 && !seen.has(normalized)) {
      seen.add(normalized);
      normalizedAuthors.push(normalized);
    }
  }

  return normalizedAuthors;
}

export function normalizeGoogleBooksImageUrl(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  if (value.startsWith('http://books.google.') || value.startsWith('http://www.google.')) {
    return `https://${value.slice('http://'.length)}`;
  }

  return value;
}

export function chooseBestCoverUrl(imageLinks?: GoogleBooksImageLinks): string | null {
  const candidates = [
    imageLinks?.extraLarge,
    imageLinks?.large,
    imageLinks?.medium,
    imageLinks?.thumbnail,
    imageLinks?.smallThumbnail,
  ];

  return candidates.map(normalizeGoogleBooksImageUrl).find((url) => url != null) ?? null;
}

export function parseGoogleBooksVolumesResponse(data: unknown): GoogleBooksVolumesResponse {
  if (!isRecord(data)) {
    throw new GoogleBooksInvalidResponseError('Google Books response must be an object.');
  }

  const totalItems = data.totalItems;
  const items = data.items;

  if (totalItems !== undefined && typeof totalItems !== 'number') {
    throw new GoogleBooksInvalidResponseError('Google Books totalItems must be a number.');
  }

  if (items !== undefined && !Array.isArray(items)) {
    throw new GoogleBooksInvalidResponseError('Google Books items must be an array.');
  }

  return {
    kind: readOptionalString(data.kind),
    totalItems,
    items: Array.isArray(items)
      ? items.flatMap((item) => {
          const parsed = parseGoogleBooksVolumeResource(item);

          return parsed ? [parsed] : [];
        })
      : undefined,
  };
}

export function parseGoogleBooksVolumeResponse(data: unknown): GoogleBooksVolumeResource {
  const parsed = parseGoogleBooksVolumeResource(data);

  if (!parsed) {
    throw new GoogleBooksInvalidResponseError('Google Books volume response is invalid.');
  }

  return parsed;
}

export function mapGoogleBooksVolume(resource: GoogleBooksVolumeResource): GoogleBooksVolume | null {
  const volumeInfo = resource.volumeInfo;
  const title = volumeInfo?.title?.trim();

  if (!volumeInfo || !title) {
    return null;
  }

  return {
    source: 'google_books',
    externalId: resource.id,
    googleBooksId: resource.id,
    etag: resource.etag ?? null,
    title,
    subtitle: optionalTrimmed(volumeInfo.subtitle),
    description: optionalTrimmed(volumeInfo.description),
    authors: normalizeAuthors(volumeInfo.authors),
    publisher: optionalTrimmed(volumeInfo.publisher),
    publishedDate: normalizePublishedDate(volumeInfo.publishedDate),
    pageCount: normalizePositiveInteger(volumeInfo.pageCount),
    language: optionalTrimmed(volumeInfo.language),
    printType: optionalTrimmed(volumeInfo.printType),
    format: null,
    subjects: normalizeAuthors(volumeInfo.categories),
    isbn10: extractIsbn10(volumeInfo.industryIdentifiers),
    isbn13: extractIsbn13(volumeInfo.industryIdentifiers),
    thumbnailUrl: normalizeGoogleBooksImageUrl(volumeInfo.imageLinks?.thumbnail),
    smallThumbnailUrl: normalizeGoogleBooksImageUrl(volumeInfo.imageLinks?.smallThumbnail),
    coverUrl: chooseBestCoverUrl(volumeInfo.imageLinks),
    previewLink: optionalTrimmed(volumeInfo.previewLink),
    infoLink: optionalTrimmed(volumeInfo.infoLink),
    canonicalVolumeLink: optionalTrimmed(volumeInfo.canonicalVolumeLink),
  };
}

export function mapGoogleBooksVolumes(resources: GoogleBooksVolumeResource[]): GoogleBooksVolume[] {
  return resources.flatMap((resource) => {
    const volume = mapGoogleBooksVolume(resource);

    return volume ? [volume] : [];
  });
}

export function mapGoogleBooksVolumeToLibraryInput(
  volume: BookMetadata,
  input: { metadataFetchedAt: number; work: GoogleBooksLibraryInput['work'] },
): GoogleBooksLibraryInput {
  return {
    work: input.work,
    authors: volume.authors.map((name, index) => ({
      kind: 'create',
      data: { name },
      position: index,
    })),
    edition: {
      kind: 'create',
      data: {
        googleBooksId: volume.googleBooksId,
        metadataSource: volume.source,
        externalMetadataId: volume.externalId,
        googleBooksEtag: volume.etag,
        title: volume.title,
        subtitle: volume.subtitle,
        description: volume.description,
        publisher: volume.publisher,
        publishedDate: volume.publishedDate,
        pageCount: volume.pageCount,
        language: volume.language,
        printType: volume.printType,
        isbn10: volume.isbn10,
        isbn13: volume.isbn13,
        thumbnailUrl: volume.thumbnailUrl,
        smallThumbnailUrl: volume.smallThumbnailUrl,
        coverSource: volume.coverUrl ? 'remote' : 'none',
        coverMimeType: null,
        coverFileName: null,
        coverUrl: volume.coverUrl,
        previewLink: volume.previewLink,
        infoLink: volume.infoLink,
        canonicalVolumeLink: volume.canonicalVolumeLink,
        metadataFetchedAt: input.metadataFetchedAt,
      },
    },
  };
}

export function scorePossibleEdition(
  source: GoogleBooksVolume,
  candidate: GoogleBooksVolume,
): PossibleEditionResult | null {
  if (source.googleBooksId === candidate.googleBooksId) {
    return null;
  }

  const reasons: string[] = [];
  let score = 0;

  if (normalizeComparableText(source.title) === normalizeComparableText(candidate.title)) {
    score += 50;
    reasons.push('same title');
  }

  const sourceAuthors = new Set(source.authors.map(normalizeComparableText));
  const sharedAuthors = candidate.authors.filter((author) =>
    sourceAuthors.has(normalizeComparableText(author)),
  );

  if (sharedAuthors.length > 0) {
    score += 25;
    reasons.push('shared author');
  }

  if (source.isbn13 && candidate.isbn13 && source.isbn13 !== candidate.isbn13) {
    score += 10;
    reasons.push('different ISBN-13');
  }

  if (source.language && candidate.language && source.language === candidate.language) {
    score += 5;
    reasons.push('same language');
  }

  if (source.publisher && candidate.publisher && source.publisher === candidate.publisher) {
    score += 5;
    reasons.push('same publisher');
  }

  if (source.publishedDate && candidate.publishedDate && source.publishedDate !== candidate.publishedDate) {
    score += 5;
    reasons.push('different publication date');
  }

  return { volume: candidate, score, reasons };
}

export function sortPossibleEditions(results: PossibleEditionResult[]): PossibleEditionResult[] {
  return [...results].sort(
    (left, right) =>
      right.score - left.score ||
      left.volume.title.localeCompare(right.volume.title) ||
      left.volume.googleBooksId.localeCompare(right.volume.googleBooksId),
  );
}

function parseGoogleBooksVolumeResource(data: unknown): GoogleBooksVolumeResource | null {
  if (!isRecord(data) || typeof data.id !== 'string' || data.id.trim().length === 0) {
    return null;
  }

  const volumeInfo = parseVolumeInfo(data.volumeInfo);

  if (!volumeInfo?.title) {
    return null;
  }

  return {
    kind: readOptionalString(data.kind),
    id: data.id,
    etag: readOptionalString(data.etag),
    selfLink: readOptionalString(data.selfLink),
    volumeInfo,
    saleInfo: readOptionalRecord(data.saleInfo),
    accessInfo: readOptionalRecord(data.accessInfo),
    searchInfo: parseSearchInfo(data.searchInfo),
  };
}

function parseVolumeInfo(data: unknown): GoogleBooksVolumeResource['volumeInfo'] {
  if (!isRecord(data)) {
    return undefined;
  }

  return {
    title: readOptionalString(data.title),
    subtitle: readOptionalString(data.subtitle),
    authors: readOptionalStringArray(data.authors),
    publisher: readOptionalString(data.publisher),
    publishedDate: readOptionalString(data.publishedDate),
    description: readOptionalString(data.description),
    industryIdentifiers: parseIndustryIdentifiers(data.industryIdentifiers),
    readingModes: readOptionalBooleanRecord(data.readingModes),
    pageCount: readOptionalNumber(data.pageCount),
    printedPageCount: readOptionalNumber(data.printedPageCount),
    printType: readOptionalString(data.printType),
    categories: readOptionalStringArray(data.categories),
    averageRating: readOptionalNumber(data.averageRating),
    ratingsCount: readOptionalNumber(data.ratingsCount),
    maturityRating: readOptionalString(data.maturityRating),
    allowAnonLogging: readOptionalBoolean(data.allowAnonLogging),
    contentVersion: readOptionalString(data.contentVersion),
    panelizationSummary: readOptionalBooleanRecord(data.panelizationSummary),
    imageLinks: parseImageLinks(data.imageLinks),
    language: readOptionalString(data.language),
    previewLink: readOptionalString(data.previewLink),
    infoLink: readOptionalString(data.infoLink),
    canonicalVolumeLink: readOptionalString(data.canonicalVolumeLink),
  };
}

function parseIndustryIdentifiers(data: unknown): GoogleBooksIndustryIdentifier[] | undefined {
  if (!Array.isArray(data)) {
    return undefined;
  }

  return data.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    return [{
      type: readOptionalString(item.type),
      identifier: readOptionalString(item.identifier),
    }];
  });
}

function parseImageLinks(data: unknown): GoogleBooksImageLinks | undefined {
  if (!isRecord(data)) {
    return undefined;
  }

  return {
    smallThumbnail: readOptionalString(data.smallThumbnail),
    thumbnail: readOptionalString(data.thumbnail),
    small: readOptionalString(data.small),
    medium: readOptionalString(data.medium),
    large: readOptionalString(data.large),
    extraLarge: readOptionalString(data.extraLarge),
  };
}

function parseSearchInfo(data: unknown): GoogleBooksVolumeResource['searchInfo'] {
  if (!isRecord(data)) {
    return undefined;
  }

  return { textSnippet: readOptionalString(data.textSnippet) };
}

function extractIsbnByLength(
  identifiers: GoogleBooksIndustryIdentifier[] | undefined,
  length: number,
): string | null {
  for (const identifier of identifiers ?? []) {
    const normalized = normalizeIsbn(identifier.identifier);

    if (normalized?.length === length) {
      return normalized;
    }
  }

  return null;
}

function optionalTrimmed(value?: string): string | null {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function normalizePositiveInteger(value?: number): number | null {
  if (value == null || !Number.isInteger(value) || value < 1) {
    return null;
  }

  return value;
}

function normalizeComparableText(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function readOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function readOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function readOptionalStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined;
}

function readOptionalRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function readOptionalBooleanRecord(value: unknown): Record<string, boolean> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const entries = Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean');

  return Object.fromEntries(entries);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getDaysInMonth(year: number, month: number): number {
  if (month === 2) {
    return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0) ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}
