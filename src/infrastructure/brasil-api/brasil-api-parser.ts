import { BrasilApiInvalidResponseError } from './brasil-api-errors';
import type { BrasilApiIsbnResponse } from './brasil-api-types';

export function parseBrasilApiIsbnResponse(data: unknown): BrasilApiIsbnResponse {
  if (!isRecord(data)) {
    throw new BrasilApiInvalidResponseError('BrasilAPI ISBN response must be an object.');
  }

  const isbn = readRequiredString(data.isbn, 'isbn');
  const title = readRequiredString(data.title, 'title');

  return {
    isbn,
    title,
    subtitle: readOptionalNullableString(data.subtitle),
    authors: readOptionalNullableStringArray(data.authors),
    publisher: readOptionalNullableString(data.publisher),
    synopsis: readOptionalNullableString(data.synopsis),
    dimensions: parseDimensions(data.dimensions),
    year: readOptionalNullableNumber(data.year),
    format: readOptionalNullableString(data.format),
    page_count: readOptionalNullableNumber(data.page_count),
    subjects: readOptionalNullableStringArray(data.subjects),
    location: readOptionalNullableString(data.location),
    retail_price: readOptionalNullableNumber(data.retail_price),
    cover_url: readOptionalNullableString(data.cover_url),
    provider: readOptionalNullableString(data.provider),
  };
}

function parseDimensions(value: unknown): BrasilApiIsbnResponse['dimensions'] {
  if (value == null) return null;
  if (!isRecord(value)) return null;

  return {
    width: readOptionalNullableNumber(value.width),
    height: readOptionalNullableNumber(value.height),
    unit: readOptionalNullableString(value.unit),
  };
}

function readRequiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BrasilApiInvalidResponseError(`BrasilAPI ISBN ${field} is required.`);
  }

  return value;
}

function readOptionalNullableString(value: unknown): string | null | undefined {
  return value == null || typeof value === 'string' ? value : undefined;
}

function readOptionalNullableNumber(value: unknown): number | null | undefined {
  return value == null || typeof value === 'number' ? value : undefined;
}

function readOptionalNullableStringArray(value: unknown): string[] | null | undefined {
  if (value == null) return value;
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
