import type { BookMetadata } from '@/src/domain/books';
import { GoogleBooksClient, GoogleBooksService } from '@/src/infrastructure/google-books';
import { normalizeIsbn, type SearchGoogleBooksInput, type SearchGoogleBooksResult } from '@/src/infrastructure/google-books';
import { BrasilApiBookNotFoundError, BrasilApiClient, BrasilApiService } from '@/src/infrastructure/brasil-api';

interface GoogleBooksSearchDependency {
  findGoogleBookByIsbn: (input: { isbn: string; signal?: AbortSignal }) => Promise<BookMetadata[]>;
  searchGoogleBooks: (input: SearchGoogleBooksInput) => Promise<SearchGoogleBooksResult>;
}

interface BrasilApiIsbnDependency {
  findBookByIsbn: (input: { isbn: string; signal?: AbortSignal }) => Promise<BookMetadata>;
}

export async function searchGoogleBooks(
  input: SearchGoogleBooksInput,
  service: GoogleBooksSearchDependency = new GoogleBooksService(new GoogleBooksClient()),
  brasilApiService: BrasilApiIsbnDependency = new BrasilApiService(new BrasilApiClient()),
): Promise<SearchGoogleBooksResult> {
  const isbn = normalizeIsbn(input.query);

  if (isbn) {
    const googleBooksItems = await service.findGoogleBookByIsbn({
      isbn,
      signal: input.signal,
    });

    if (googleBooksItems.length > 0) {
      return {
        totalItems: googleBooksItems.length,
        startIndex: 0,
        items: googleBooksItems,
      };
    }

    try {
      const brasilApiItem = await brasilApiService.findBookByIsbn({
        isbn,
        signal: input.signal,
      });

      return {
        totalItems: 1,
        startIndex: 0,
        items: [brasilApiItem],
      };
    } catch (error) {
      if (error instanceof BrasilApiBookNotFoundError) {
        return {
          totalItems: 0,
          startIndex: 0,
          items: [],
        };
      }

      throw error;
    }
  }

  return service.searchGoogleBooks(input);
}
