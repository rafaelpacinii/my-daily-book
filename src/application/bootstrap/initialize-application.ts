import { getGoogleBooksConfig } from '@/src/config/env';
import type { ApplicationApi } from '../api';
import { ApplicationInitializationError } from './application-initialization-error';

export interface InitializedApplication {
  api: ApplicationApi;
}

export interface InitializeApplicationDependencies {
  initializeDatabase?: () => Promise<void>;
  validateConfig?: () => void;
  createApi?: () => ApplicationApi | Promise<ApplicationApi>;
}

let initializedApplication: InitializedApplication | null = null;
let initializationPromise: Promise<InitializedApplication> | null = null;

export function initializeApplication(
  dependencies: InitializeApplicationDependencies = {},
): Promise<InitializedApplication> {
  if (initializedApplication) {
    return Promise.resolve(initializedApplication);
  }

  if (!initializationPromise) {
    initializationPromise = runInitialization(dependencies)
      .then((application) => {
        initializedApplication = application;
        return application;
      })
      .catch((error: unknown) => {
        initializationPromise = null;
        throw new ApplicationInitializationError('Application initialization failed.', {
          cause: error,
        });
      });
  }

  return initializationPromise;
}

export function resetApplicationInitializationForTests(): void {
  initializedApplication = null;
  initializationPromise = null;
}

async function runInitialization(
  dependencies: InitializeApplicationDependencies,
): Promise<InitializedApplication> {
  const initDatabase = dependencies.initializeDatabase ?? defaultInitializeDatabase;
  const validateConfig = dependencies.validateConfig ?? validateEssentialConfig;
  const createApi = dependencies.createApi ?? defaultCreateApplicationApi;

  validateConfig();
  await initDatabase();

  return { api: await createApi() };
}

function validateEssentialConfig(): void {
  getGoogleBooksConfig();
}

async function defaultInitializeDatabase(): Promise<void> {
  const database = await import('@/src/database/initialize-database');
  await database.initializeDatabase();
}

async function defaultCreateApplicationApi(): Promise<ApplicationApi> {
  const api = await import('../api');
  return api.createApplicationApi();
}
