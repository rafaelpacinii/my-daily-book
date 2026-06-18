import type { BookMetadata } from '@/src/domain/books';

export interface BrasilApiIsbnDimensions {
  width?: number | null;
  height?: number | null;
  unit?: string | null;
}

export interface BrasilApiIsbnResponse {
  isbn: string;
  title: string;
  subtitle?: string | null;
  authors?: string[] | null;
  publisher?: string | null;
  synopsis?: string | null;
  dimensions?: BrasilApiIsbnDimensions | null;
  year?: number | null;
  format?: string | null;
  page_count?: number | null;
  subjects?: string[] | null;
  location?: string | null;
  retail_price?: number | null;
  cover_url?: string | null;
  provider?: string | null;
}

export type BrasilApiBookMetadata = BookMetadata & {
  source: 'brasil_api';
  googleBooksId: null;
};
