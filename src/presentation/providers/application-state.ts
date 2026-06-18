import type { ApplicationApi } from '@/src/application';

export type ApplicationStatus = 'idle' | 'initializing' | 'ready' | 'error';

export interface ApplicationState {
  api: ApplicationApi | null;
  status: ApplicationStatus;
  initializationError: unknown;
}

export type ApplicationAction =
  | { type: 'start' }
  | { type: 'success'; api: ApplicationApi }
  | { type: 'failure'; error: unknown };

export const missingApplicationProviderMessage =
  'useApplication must be used within ApplicationProvider.';

export const initialApplicationState: ApplicationState = {
  api: null,
  status: 'idle',
  initializationError: null,
};

export function applicationReducer(
  state: ApplicationState,
  action: ApplicationAction,
): ApplicationState {
  if (action.type === 'start') {
    return {
      ...state,
      status: 'initializing',
      initializationError: null,
    };
  }

  if (action.type === 'success') {
    return {
      api: action.api,
      status: 'ready',
      initializationError: null,
    };
  }

  return {
    api: null,
    status: 'error',
    initializationError: action.error,
  };
}
