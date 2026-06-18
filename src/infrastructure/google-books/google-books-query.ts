import { GoogleBooksInvalidQueryError } from './google-books-errors';

export interface GoogleBooksQueryInput {
  text?: string;
  title?: string;
  author?: string;
  publisher?: string;
  isbn?: string;
}

export function buildGoogleBooksQuery(input: GoogleBooksQueryInput): string {
  const parts = [
    normalizeQueryPart(input.text),
    prefixedQueryPart('intitle', input.title),
    prefixedQueryPart('inauthor', input.author),
    prefixedQueryPart('inpublisher', input.publisher),
    prefixedQueryPart('isbn', input.isbn),
  ].filter((part) => part.length > 0);

  if (parts.length === 0) {
    throw new GoogleBooksInvalidQueryError('Google Books query requires at least one criterion.');
  }

  return parts.join(' ');
}

export function normalizeQueryText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeQueryPart(value?: string): string {
  return value ? normalizeQueryText(value) : '';
}

function prefixedQueryPart(prefix: string, value?: string): string {
  const normalized = normalizeQueryPart(value);

  return normalized ? `${prefix}:${normalized}` : '';
}

