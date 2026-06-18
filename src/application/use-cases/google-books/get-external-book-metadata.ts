import type { BookMetadata, BookMetadataSource } from '@/src/domain/books';
import { BrasilApiClient, BrasilApiService } from '@/src/infrastructure/brasil-api';
import { GoogleBooksClient, GoogleBooksService } from '@/src/infrastructure/google-books';

export interface GetExternalBookMetadataInput {
  source: BookMetadataSource;
  externalId: string;
  signal?: AbortSignal;
}

export async function getExternalBookMetadata(
  input: GetExternalBookMetadataInput,
  googleBooksService = new GoogleBooksService(new GoogleBooksClient()),
  brasilApiService = new BrasilApiService(new BrasilApiClient()),
): Promise<BookMetadata> {
  if (input.source === 'google_books') {
    return googleBooksService.getGoogleBookVolume({
      volumeId: input.externalId,
      signal: input.signal,
    });
  }

  return brasilApiService.findBookByIsbn({
    isbn: extractBrasilApiIsbn(input.externalId),
    signal: input.signal,
  });
}

function extractBrasilApiIsbn(externalId: string): string {
  return externalId.startsWith('brasil-api:isbn:')
    ? externalId.slice('brasil-api:isbn:'.length)
    : externalId;
}
