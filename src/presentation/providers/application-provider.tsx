import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import {
  initializeApplication,
  type ApplicationApi,
  type InitializedApplication,
} from '@/src/application';
import {
  applicationReducer,
  initialApplicationState,
  missingApplicationProviderMessage,
  type ApplicationStatus,
} from './application-state';

export type { ApplicationStatus } from './application-state';

export interface ApplicationContextValue {
  api: ApplicationApi | null;
  status: ApplicationStatus;
  initializationError: unknown;
  retry: () => void;
  reload: () => void;
}

export interface ApplicationProviderProps extends PropsWithChildren {
  initializer?: () => Promise<InitializedApplication>;
}

const ApplicationContext = createContext<ApplicationContextValue | null>(null);

export function ApplicationProvider({
  children,
  initializer = initializeApplication,
}: ApplicationProviderProps) {
  const [{ api, status, initializationError }, dispatch] = useReducer(
    applicationReducer,
    initialApplicationState,
  );
  const hasStarted = useRef(false);

  const start = useCallback(() => {
    hasStarted.current = true;
    dispatch({ type: 'start' });

    initializer()
      .then((application) => {
        dispatch({ type: 'success', api: application.api });
      })
      .catch((error: unknown) => {
        if (__DEV__) {
          console.error('Application bootstrap failed.', error);
          if (error instanceof Error && 'cause' in error) {
            console.error('Application bootstrap cause.', error.cause);
          }
        }
        dispatch({ type: 'failure', error });
      });
  }, [initializer]);

  useEffect(() => {
    if (!hasStarted.current) {
      start();
    }
  }, [start]);

  const retry = useCallback(() => {
    hasStarted.current = false;
    start();
  }, [start]);

  const value = useMemo(
    () => ({ api, status, initializationError, retry, reload: retry }),
    [api, status, initializationError, retry],
  );

  return <ApplicationContext.Provider value={value}>{children}</ApplicationContext.Provider>;
}

export function useApplication(): ApplicationContextValue {
  const context = useContext(ApplicationContext);

  if (!context) {
    throw new Error(missingApplicationProviderMessage);
  }

  return context;
}
