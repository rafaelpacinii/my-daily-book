export class GoogleAuthError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class GoogleAuthCancelledError extends GoogleAuthError {}

export class GoogleAuthRequiredError extends GoogleAuthError {}

export class GoogleAuthConfigurationError extends GoogleAuthError {}

export class GoogleAuthEnvironmentError extends GoogleAuthError {}

export class GoogleAuthTimeoutError extends GoogleAuthError {}

export class GoogleDriveError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class GoogleDriveNetworkError extends GoogleDriveError {}

export class GoogleDriveAbortError extends GoogleDriveNetworkError {}

export class GoogleDriveHttpError extends GoogleDriveError {
  constructor(
    message: string,
    public readonly status: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export class GoogleDriveQuotaError extends GoogleDriveHttpError {}

export class GoogleDriveFileNotFoundError extends GoogleDriveHttpError {}

export class GoogleDriveInvalidResponseError extends GoogleDriveHttpError {}
