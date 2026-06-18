import type { AddBookToLibraryInput } from '@/src/application/use-cases/library/add-book-to-library';
import type { BookMetadata } from '@/src/domain/books';

export interface GoogleBooksIndustryIdentifier {
  type?: string;
  identifier?: string;
}

export interface GoogleBooksImageLinks {
  smallThumbnail?: string;
  thumbnail?: string;
  small?: string;
  medium?: string;
  large?: string;
  extraLarge?: string;
}

export interface GoogleBooksVolumeInfo {
  title?: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  industryIdentifiers?: GoogleBooksIndustryIdentifier[];
  readingModes?: Record<string, boolean>;
  pageCount?: number;
  printedPageCount?: number;
  printType?: string;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  maturityRating?: string;
  allowAnonLogging?: boolean;
  contentVersion?: string;
  panelizationSummary?: Record<string, boolean>;
  imageLinks?: GoogleBooksImageLinks;
  language?: string;
  previewLink?: string;
  infoLink?: string;
  canonicalVolumeLink?: string;
}

export interface GoogleBooksVolumeResource {
  kind?: string;
  id: string;
  etag?: string;
  selfLink?: string;
  volumeInfo?: GoogleBooksVolumeInfo;
  saleInfo?: Record<string, unknown>;
  accessInfo?: Record<string, unknown>;
  searchInfo?: {
    textSnippet?: string;
  };
}

export interface GoogleBooksVolumesResponse {
  kind?: string;
  totalItems?: number;
  items?: GoogleBooksVolumeResource[];
}

export interface GoogleBooksVolume extends BookMetadata {
  source: 'google_books';
  googleBooksId: string;
  externalId: string;
}

export interface SearchGoogleBooksResult {
  totalItems: number;
  startIndex: number;
  items: BookMetadata[];
}

export interface PossibleEditionResult {
  volume: GoogleBooksVolume;
  score: number;
  reasons: string[];
}

export type GoogleBooksLibraryInput = AddBookToLibraryInput;
