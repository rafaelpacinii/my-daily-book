import { GoogleBooksInvalidQueryError } from './google-books-errors';
import {
  mapGoogleBooksVolumes,
  normalizeIsbn,
  scorePossibleEdition,
  sortPossibleEditions,
} from './google-books-mappers';
import { buildGoogleBooksQuery, normalizeQueryText, type GoogleBooksQueryInput } from './google-books-query';
import type { GoogleBooksClient } from './google-books-client';
import type { GoogleBooksVolume, PossibleEditionResult, SearchGoogleBooksResult } from './google-books-types';

export interface SearchGoogleBooksInput {
  query: string;
  startIndex?: number;
  maxResults?: number;
  language?: string;
  orderBy?: 'relevance' | 'newest';
  printType?: 'all' | 'books' | 'magazines';
  signal?: AbortSignal;
}

export class GoogleBooksService {
  constructor(private readonly client: GoogleBooksClient) {}

  async searchGoogleBooks(input: SearchGoogleBooksInput): Promise<SearchGoogleBooksResult> {
    const query = normalizeQueryText(input.query);

    if (query.length === 0) {
      throw new GoogleBooksInvalidQueryError('Google Books query cannot be empty.');
    }

    const startIndex = validateStartIndex(input.startIndex);
    const maxResults = validateMaxResults(input.maxResults);
    const response = await this.client.searchVolumes({
      query,
      startIndex,
      maxResults,
      language: input.language,
      orderBy: input.orderBy,
      printType: input.printType,
      signal: input.signal,
    });

    return {
      totalItems: response.totalItems ?? 0,
      startIndex,
      items: mapGoogleBooksVolumes(response.items ?? []),
    };
  }

  async getGoogleBookVolume(input: { volumeId: string; signal?: AbortSignal }): Promise<GoogleBooksVolume> {
    const volumeId = input.volumeId.trim();

    if (volumeId.length === 0) {
      throw new GoogleBooksInvalidQueryError('Google Books volume ID cannot be empty.');
    }

    const volume = mapGoogleBooksVolumes([await this.client.getVolumeById(volumeId, input.signal)])[0];

    if (!volume) {
      throw new GoogleBooksInvalidQueryError('Google Books volume is not usable.');
    }

    return volume;
  }

  async findGoogleBookByIsbn(input: { isbn: string; signal?: AbortSignal }): Promise<GoogleBooksVolume[]> {
    const isbn = normalizeIsbn(input.isbn);

    if (!isbn) {
      throw new GoogleBooksInvalidQueryError('Google Books ISBN query is invalid.');
    }

    const response = await this.client.findVolumesByIsbn(isbn, input.signal);

    return mapGoogleBooksVolumes(response.items ?? []).sort(
      (left, right) =>
        left.title.localeCompare(right.title) ||
        left.googleBooksId.localeCompare(right.googleBooksId),
    );
  }

  async searchPossibleEditions(
    source: GoogleBooksVolume,
    input: { signal?: AbortSignal } = {},
  ): Promise<PossibleEditionResult[]> {
    const query = buildGoogleBooksQuery({
      title: source.title,
      author: source.authors[0],
    });
    const response = await this.searchGoogleBooks({
      query,
      maxResults: 20,
      signal: input.signal,
    });
    const googleVolumes = response.items.filter((volume): volume is GoogleBooksVolume =>
      volume.source === 'google_books',
    );
    const scored = googleVolumes.flatMap((volume) => {
      const result = scorePossibleEdition(source, volume);

      return result ? [result] : [];
    });

    return sortPossibleEditions(scored);
  }
}

export function buildAdvancedGoogleBooksQuery(input: GoogleBooksQueryInput): string {
  return buildGoogleBooksQuery(input);
}

function validateStartIndex(value?: number): number {
  if (value == null) {
    return 0;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new GoogleBooksInvalidQueryError('Google Books startIndex must be greater than or equal to zero.');
  }

  return value;
}

function validateMaxResults(value?: number): number {
  if (value == null) {
    return 20;
  }

  if (!Number.isInteger(value) || value < 1) {
    throw new GoogleBooksInvalidQueryError('Google Books maxResults must be greater than zero.');
  }

  return Math.min(value, 40);
}
