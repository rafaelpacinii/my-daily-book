import { normalizeAuthors, normalizeGoogleBooksImageUrl, normalizeIsbn } from '@/src/infrastructure/google-books';

import type { BrasilApiBookMetadata, BrasilApiIsbnResponse } from './brasil-api-types';

export function mapBrasilApiIsbnToBookMetadata(response: BrasilApiIsbnResponse): BrasilApiBookMetadata {
  const isbn = normalizeIsbn(response.isbn) ?? response.isbn.replace(/[\s-]/g, '').toUpperCase();
  const isbn10 = isbn.length === 10 ? isbn : null;
  const isbn13 = isbn.length === 13 ? isbn : null;

  return {
    source: 'brasil_api',
    externalId: `brasil-api:isbn:${isbn}`,
    googleBooksId: null,
    etag: null,
    title: response.title.trim(),
    subtitle: optionalTrimmed(response.subtitle),
    description: optionalTrimmed(response.synopsis),
    authors: normalizeAuthors(response.authors ?? []),
    publisher: optionalTrimmed(response.publisher),
    publishedDate: normalizeYear(response.year),
    pageCount: normalizePositiveInteger(response.page_count),
    language: null,
    printType: null,
    format: optionalTrimmed(response.format),
    subjects: normalizeAuthors(response.subjects ?? []),
    isbn10,
    isbn13,
    thumbnailUrl: normalizeGoogleBooksImageUrl(response.cover_url),
    smallThumbnailUrl: null,
    coverUrl: normalizeGoogleBooksImageUrl(response.cover_url),
    previewLink: null,
    infoLink: null,
    canonicalVolumeLink: null,
  };
}

function optionalTrimmed(value?: string | null): string | null {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function normalizeYear(value?: number | null): string | null {
  return value != null && Number.isInteger(value) && value >= 1000 && value <= 9999
    ? String(value)
    : null;
}

function normalizePositiveInteger(value?: number | null): number | null {
  return value != null && Number.isInteger(value) && value > 0 ? value : null;
}
