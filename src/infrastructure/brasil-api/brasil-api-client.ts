import { normalizeIsbn } from '@/src/infrastructure/google-books';

import {
  BrasilApiAbortError,
  BrasilApiBookNotFoundError,
  BrasilApiError,
  BrasilApiHttpError,
  BrasilApiInvalidIsbnError,
  BrasilApiInvalidResponseError,
  BrasilApiNetworkError,
  BrasilApiRateLimitError,
  BrasilApiUnavailableError,
} from './brasil-api-errors';
import { parseBrasilApiIsbnResponse } from './brasil-api-parser';
import type { BrasilApiIsbnResponse } from './brasil-api-types';

export const BRASIL_API_BASE_URL = 'https://brasilapi.com.br/api';

export interface BrasilApiClientOptions {
  baseUrl?: string;
  fetchFn?: typeof fetch;
}

export class BrasilApiClient {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: BrasilApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? BRASIL_API_BASE_URL).replace(/\/+$/, '');
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async getBookByIsbn(isbnInput: string, signal?: AbortSignal): Promise<BrasilApiIsbnResponse> {
    const isbn = normalizeIsbn(isbnInput);

    if (!isbn) {
      throw new BrasilApiInvalidIsbnError('BrasilAPI ISBN query is invalid.');
    }

    try {
      const response = await this.fetchFn(`${this.baseUrl}/isbn/v1/${encodeURIComponent(isbn)}`, {
        signal,
      });

      if (!response.ok) {
        throw createHttpError(response.status);
      }

      try {
        return parseBrasilApiIsbnResponse(await response.json());
      } catch (error) {
        if (error instanceof BrasilApiInvalidResponseError) throw error;
        throw new BrasilApiInvalidResponseError('BrasilAPI returned invalid JSON.', { cause: error });
      }
    } catch (error) {
      if (isAbortError(error)) {
        throw new BrasilApiAbortError('BrasilAPI request was aborted.', { cause: error });
      }

      if (error instanceof BrasilApiError) {
        throw error;
      }

      throw new BrasilApiNetworkError('BrasilAPI network request failed.', { cause: error });
    }
  }
}

function createHttpError(status: number): Error {
  if (status === 400) return new BrasilApiInvalidIsbnError('BrasilAPI rejected the ISBN.');
  if (status === 404) return new BrasilApiBookNotFoundError('BrasilAPI did not find this ISBN.');
  if (status === 429) return new BrasilApiRateLimitError('BrasilAPI rate limit was exceeded.', status);
  if (status >= 500) return new BrasilApiUnavailableError('BrasilAPI is unavailable.', status);

  return new BrasilApiHttpError('BrasilAPI request failed.', status);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
