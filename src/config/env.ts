export interface GoogleBooksConfig {
  apiKey: string;
  baseUrl: string;
}

export class ApplicationConfigurationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export interface GoogleOAuthConfig {
  androidClientId: string | null;
  iosClientId: string | null;
  webClientId: string | null;
}

function readRequiredEnv(value: string | undefined, name: string): string {
  if (!value || value.trim().length === 0) {
    throw new ApplicationConfigurationError(`${name} is not configured.`);
  }

  return value.trim();
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getGoogleBooksConfig(): GoogleBooksConfig {
  return {
    apiKey: readRequiredEnv(
      process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY,
      'EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY',
    ),
    baseUrl: normalizeBaseUrl(
      readRequiredEnv(
        process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_URL,
        'EXPO_PUBLIC_GOOGLE_BOOKS_API_URL',
      ),
    ),
  };
}

export const env = {
  get googleBooksApiKey(): string {
    return getGoogleBooksConfig().apiKey;
  },
  get googleBooksApiUrl(): string {
    return getGoogleBooksConfig().baseUrl;
  },
  get googleOAuthAndroidClientId(): string | null {
    return process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || null;
  },
  get googleOAuthIosClientId(): string | null {
    return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || null;
  },
  get googleOAuthWebClientId(): string | null {
    return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || null;
  },
};

export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  return {
    androidClientId: env.googleOAuthAndroidClientId,
    iosClientId: env.googleOAuthIosClientId,
    webClientId: env.googleOAuthWebClientId,
  };
}
