export class GoogleBooksError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class GoogleBooksConfigurationError extends GoogleBooksError {}

export class GoogleBooksNetworkError extends GoogleBooksError {}

export class GoogleBooksAbortError extends GoogleBooksNetworkError {}

export class GoogleBooksHttpError extends GoogleBooksError {
  constructor(
    message: string,
    public readonly status: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export class GoogleBooksInvalidResponseError extends GoogleBooksError {}

export class GoogleBooksVolumeNotFoundError extends GoogleBooksHttpError {
  constructor(volumeId: string, options?: ErrorOptions) {
    super(`Google Books volume was not found: ${volumeId}.`, 404, options);
  }
}

export class GoogleBooksInvalidQueryError extends GoogleBooksError {}

export class GoogleBooksRateLimitError extends GoogleBooksHttpError {}

