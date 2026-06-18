import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { getGoogleOAuthConfig } from '@/src/config/env';

import {
  GoogleAuthCancelledError,
  GoogleAuthConfigurationError,
  GoogleAuthError,
  GoogleAuthEnvironmentError,
  GoogleAuthRequiredError,
  GoogleAuthTimeoutError,
} from './google-drive-errors';
import {
  GOOGLE_DRIVE_APPDATA_SCOPE,
  type GoogleAuthSession,
  type GoogleDriveConnectionStatus,
} from './google-drive-types';

const SESSION_KEY = 'myDailyBook.googleDrive.session';
const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};
const AUTH_PROMPT_TIMEOUT_MS = 15_000;

let refreshPromise: Promise<GoogleAuthSession> | null = null;

export async function saveAuthSession(session: GoogleAuthSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function readAuthSession(): Promise<GoogleAuthSession | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GoogleAuthSession>;

    if (typeof parsed.accessToken !== 'string') {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : null,
      expiresAt: typeof parsed.expiresAt === 'number' ? parsed.expiresAt : null,
    };
  } catch {
    return null;
  }
}

export async function clearAuthSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function connectGoogleDrive(): Promise<GoogleAuthSession> {
  const clientId = getClientId();
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'mydailybook', path: 'oauth' });

  if (isExpoGoRedirectUri(redirectUri)) {
    throw new GoogleAuthEnvironmentError(
      'Google Drive requires a development or preview build for this environment.',
    );
  }

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    scopes: [GOOGLE_DRIVE_APPDATA_SCOPE],
    usePKCE: true,
    extraParams: { access_type: 'offline', prompt: 'consent' },
  });
  await request.makeAuthUrlAsync(GOOGLE_DISCOVERY);
  const result = await withTimeout(
    request.promptAsync(GOOGLE_DISCOVERY),
    AUTH_PROMPT_TIMEOUT_MS,
    'Google authorization timed out before completing.',
  );

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new GoogleAuthCancelledError('Google authorization was cancelled.');
  }

  if (result.type !== 'success' || typeof result.params.code !== 'string') {
    throw new GoogleAuthError('Google authorization did not return an authorization code.');
  }

  const token = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code: result.params.code,
      redirectUri,
      extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
    },
    GOOGLE_DISCOVERY,
  );
  const session = tokenToSession(token);
  await saveAuthSession(session);

  return session;
}

export async function disconnectGoogleDrive(): Promise<void> {
  const session = await readAuthSession();

  if (session) {
    await AuthSession.revokeAsync(
      { token: session.refreshToken ?? session.accessToken },
      GOOGLE_DISCOVERY,
    ).catch(() => false);
  }

  await clearAuthSession();
}

export async function getGoogleDriveConnectionStatus(): Promise<GoogleDriveConnectionStatus> {
  const session = await readAuthSession();

  return {
    connected: session != null,
    expiresAt: session?.expiresAt ?? null,
  };
}

export async function requireGoogleAccessToken(): Promise<string> {
  const session = await readAuthSession();

  if (!session) {
    throw new GoogleAuthRequiredError('Google Drive authorization is required.');
  }

  if (!session.expiresAt || session.expiresAt > Date.now() + 60_000) {
    return session.accessToken;
  }

  return refreshGoogleAuthSession(session).then((refreshed) => refreshed.accessToken);
}

async function refreshGoogleAuthSession(session: GoogleAuthSession): Promise<GoogleAuthSession> {
  if (!session.refreshToken) {
    await clearAuthSession();
    throw new GoogleAuthRequiredError('Google Drive session cannot be refreshed.');
  }

  refreshPromise ??= AuthSession.refreshAsync(
    {
      clientId: getClientId(),
      refreshToken: session.refreshToken,
      scopes: [GOOGLE_DRIVE_APPDATA_SCOPE],
    },
    GOOGLE_DISCOVERY,
  )
    .then(tokenToSession)
    .then(async (refreshed) => {
      await saveAuthSession({ ...refreshed, refreshToken: refreshed.refreshToken ?? session.refreshToken });
      return { ...refreshed, refreshToken: refreshed.refreshToken ?? session.refreshToken };
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

function tokenToSession(token: AuthSession.TokenResponse): GoogleAuthSession {
  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken ?? null,
    expiresAt: token.expiresIn ? token.issuedAt * 1000 + token.expiresIn * 1000 : null,
  };
}

function getClientId(): string {
  const config = getGoogleOAuthConfig();
  const clientId =
    Platform.OS === 'android'
      ? config.androidClientId
      : Platform.OS === 'ios'
        ? config.iosClientId
        : config.webClientId;

  if (!clientId) {
    throw new GoogleAuthConfigurationError(
      'Google Drive is not configured for this build.',
    );
  }

  return clientId;
}

function isExpoGoRedirectUri(uri: string): boolean {
  return uri.startsWith('exp://') || uri.startsWith('exps://');
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new GoogleAuthTimeoutError(message));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}
