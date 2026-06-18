export class BrasilApiError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class BrasilApiInvalidIsbnError extends BrasilApiError {}

export class BrasilApiBookNotFoundError extends BrasilApiError {}

export class BrasilApiNetworkError extends BrasilApiError {}

export class BrasilApiAbortError extends BrasilApiNetworkError {}

export class BrasilApiInvalidResponseError extends BrasilApiError {}

export class BrasilApiHttpError extends BrasilApiError {
  constructor(
    message: string,
    public readonly status: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export class BrasilApiRateLimitError extends BrasilApiHttpError {}

export class BrasilApiUnavailableError extends BrasilApiHttpError {}
