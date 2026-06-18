import {
  findGoogleBookByIsbn,
  getExternalBookMetadata,
  getGoogleBookVolume,
  searchPossibleEditions,
  searchGoogleBooks,
} from '@/src/application/use-cases/google-books';
import { addBookToLibrary } from '@/src/application/use-cases/library';
import { mapGoogleBooksVolumeToLibraryInput } from '@/src/infrastructure/google-books/google-books-mappers';

export const googleBooksApi = {
  search: searchGoogleBooks,
  getById: getGoogleBookVolume,
  getMetadata: getExternalBookMetadata,
  findByIsbn: findGoogleBookByIsbn,
  searchPossibleEditions,
  prepareLibraryInput: mapGoogleBooksVolumeToLibraryInput,
  prepareAndAddToLibrary: addBookToLibrary,
};

export type GoogleBooksApi = typeof googleBooksApi;
