import { GoogleBooksClient, GoogleBooksService } from '@/src/infrastructure/google-books';
import type { GoogleBooksVolume, PossibleEditionResult } from '@/src/infrastructure/google-books';

export interface FindGoogleBookByIsbnInput {
  isbn: string;
  signal?: AbortSignal;
}

export async function findGoogleBookByIsbn(
  input: FindGoogleBookByIsbnInput,
  service = new GoogleBooksService(new GoogleBooksClient()),
): Promise<GoogleBooksVolume[]> {
  return service.findGoogleBookByIsbn(input);
}

export async function searchPossibleEditions(
  volume: GoogleBooksVolume,
  input: { signal?: AbortSignal } = {},
  service = new GoogleBooksService(new GoogleBooksClient()),
): Promise<PossibleEditionResult[]> {
  return service.searchPossibleEditions(volume, input);
}

