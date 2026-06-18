export type BookMetadataSource = 'google_books' | 'brasil_api' | 'manual';

export type EditableBookCover =
  | {
      kind: 'remote';
      uri: string;
      mimeType: null;
      fileName: null;
      fileSize: null;
    }
  | {
      kind: 'local';
      uri: string;
      mimeType: string;
      fileName: string;
      fileSize: number;
      persisted: boolean;
    }
  | {
      kind: 'none';
      uri: null;
      mimeType: null;
      fileName: null;
      fileSize: null;
    };

export interface EditableBookDraft {
  source: BookMetadataSource;
  externalId: string | null;
  googleBooksId: string | null;
  etag: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  authors: string[];
  publisher: string | null;
  publishedDate: string | null;
  pageCount: number | null;
  language: string | null;
  printType: string | null;
  format: string | null;
  subjects: string[];
  isbn10: string | null;
  isbn13: string | null;
  thumbnailUrl: string | null;
  smallThumbnailUrl: string | null;
  cover: EditableBookCover;
  previewLink: string | null;
  infoLink: string | null;
  canonicalVolumeLink: string | null;
}

export interface BookMetadata {
  source: Exclude<BookMetadataSource, 'manual'>;
  externalId: string;
  googleBooksId: string | null;
  etag: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  authors: string[];
  publisher: string | null;
  publishedDate: string | null;
  pageCount: number | null;
  language: string | null;
  printType: string | null;
  format: string | null;
  subjects: string[];
  isbn10: string | null;
  isbn13: string | null;
  thumbnailUrl: string | null;
  smallThumbnailUrl: string | null;
  coverUrl: string | null;
  previewLink: string | null;
  infoLink: string | null;
  canonicalVolumeLink: string | null;
}
