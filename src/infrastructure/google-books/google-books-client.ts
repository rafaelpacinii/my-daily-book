import type { GoogleBooksConfig } from '@/src/config/env';
import { getGoogleBooksConfig } from '@/src/config/env';

import {
  GoogleBooksAbortError,
  GoogleBooksHttpError,
  GoogleBooksInvalidResponseError,
  GoogleBooksNetworkError,
  GoogleBooksRateLimitError,
  GoogleBooksVolumeNotFoundError,
} from './google-books-errors';
import {
  parseGoogleBooksVolumeResponse,
  parseGoogleBooksVolumesResponse,
} from './google-books-mappers';
import type { GoogleBooksVolumeResource, GoogleBooksVolumesResponse } from './google-books-types';

export interface GoogleBooksSearchVolumesRequest {
  query: string;
  startIndex?: number;
  maxResults?: number;
  language?: string;
  orderBy?: 'relevance' | 'newest';
  printType?: 'all' | 'books' | 'magazines';
  signal?: AbortSignal;
}

export interface GoogleBooksClientOptions {
  config?: GoogleBooksConfig;
  fetchFn?: typeof fetch;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export class GoogleBooksClient {
  private readonly config: GoogleBooksConfig;
  private readonly fetchFn: typeof fetch;
  private readonly retryAttempts: number;
  private readonly retryDelayMs: number;

  constructor(options: GoogleBooksClientOptions = {}) {
    this.config = options.config ?? getGoogleBooksConfig();
    this.fetchFn = options.fetchFn ?? fetch;
    this.retryAttempts = options.retryAttempts ?? 0;
    this.retryDelayMs = options.retryDelayMs ?? 150;
  }

  async searchVolumes(request: GoogleBooksSearchVolumesRequest): Promise<GoogleBooksVolumesResponse> {
    const params = new URLSearchParams({
      q: request.query,
      key: this.config.apiKey,
    });

    if (request.startIndex != null) {
      params.set('startIndex', String(request.startIndex));
    }

    if (request.maxResults != null) {
      params.set('maxResults', String(request.maxResults));
    }

    if (request.language) {
      params.set('langRestrict', request.language);
    }

    if (request.orderBy) {
      params.set('orderBy', request.orderBy);
    }

    if (request.printType) {
      params.set('printType', request.printType);
    }

    return this.requestVolumes('/volumes', params, request.signal);
  }

  async getVolumeById(volumeId: string, signal?: AbortSignal): Promise<GoogleBooksVolumeResource> {
    return this.requestVolume(`/volumes/${encodeURIComponent(volumeId)}`, new URLSearchParams(), signal);
  }

  async findVolumesByIsbn(isbn: string, signal?: AbortSignal): Promise<GoogleBooksVolumesResponse> {
    return this.searchVolumes({ query: `isbn:${isbn}`, signal });
  }

  private async requestVolumes(
    path: string,
    params: URLSearchParams,
    signal?: AbortSignal,
  ): Promise<GoogleBooksVolumesResponse> {
    const data = await this.requestJson(path, params, signal);

    return parseGoogleBooksVolumesResponse(data);
  }

  private async requestVolume(
    path: string,
    params: URLSearchParams,
    signal?: AbortSignal,
  ): Promise<GoogleBooksVolumeResource> {
    const data = await this.requestJson(path, params, signal);

    return parseGoogleBooksVolumeResponse(data);
  }

  private async requestJson(
    path: string,
    params: URLSearchParams,
    signal?: AbortSignal,
  ): Promise<unknown> {
    params.set('key', this.config.apiKey);

    const url = `${this.config.baseUrl}${path}?${params.toString()}`;
    let attempt = 0;

    while (true) {
      try {
        const response = await this.fetchFn(url, { signal });

        if (!response.ok) {
          throw createHttpError(response.status, path);
        }

        try {
          return await response.json();
        } catch (error) {
          throw new GoogleBooksInvalidResponseError('Google Books returned invalid JSON.', {
            cause: error,
          });
        }
      } catch (error) {
        if (isAbortError(error)) {
          throw new GoogleBooksAbortError('Google Books request was aborted.', { cause: error });
        }

        if (shouldRetry(error, attempt, this.retryAttempts)) {
          await delay(this.retryDelayMs * (attempt + 1), signal);
          attempt += 1;
          continue;
        }

        if (error instanceof GoogleBooksHttpError || error instanceof GoogleBooksInvalidResponseError) {
          throw error;
        }

        throw new GoogleBooksNetworkError('Google Books network request failed.', { cause: error });
      }
    }
  }
}

function createHttpError(status: number, path: string): GoogleBooksHttpError {
  if (status === 404) {
    return new GoogleBooksVolumeNotFoundError(path);
  }

  if (status === 429) {
    return new GoogleBooksRateLimitError('Google Books rate limit was exceeded.', status);
  }

  if (status === 400) {
    return new GoogleBooksHttpError('Google Books rejected the request.', status);
  }

  if (status === 403) {
    return new GoogleBooksHttpError('Google Books access was denied.', status);
  }

  if (status >= 500) {
    return new GoogleBooksHttpError('Google Books service is unavailable.', status);
  }

  return new GoogleBooksHttpError('Google Books request failed.', status);
}

function shouldRetry(error: unknown, attempt: number, retryAttempts: number): boolean {
  if (attempt >= retryAttempts || !(error instanceof GoogleBooksHttpError)) {
    return false;
  }

  return [429, 500, 502, 503, 504].includes(error.status);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'));
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}
