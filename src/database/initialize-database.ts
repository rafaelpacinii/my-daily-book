import { migrate } from 'drizzle-orm/expo-sqlite/migrator';

import { db, sqlite } from './client';
import migrations from './migrations/migrations';

let initializationPromise: Promise<void> | null = null;

export function initializeDatabase(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = runInitialization().catch((error: unknown) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
}

async function runInitialization(): Promise<void> {
  sqlite.execSync('PRAGMA foreign_keys = OFF;');
  sqlite.execSync('PRAGMA journal_mode = WAL;');

  if (__DEV__) {
    console.log('SQLite foreign_keys before migrate:', sqlite.getFirstSync('PRAGMA foreign_keys;'));
  }

  try {
    await migrate(db, migrations);
  } finally {
    sqlite.execSync('PRAGMA foreign_keys = ON;');

    if (__DEV__) {
      console.log('SQLite foreign_keys after migrate:', sqlite.getFirstSync('PRAGMA foreign_keys;'));
    }
  }
}
