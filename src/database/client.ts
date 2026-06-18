import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'my-daily-book.db';

export const sqlite = SQLite.openDatabaseSync(DATABASE_NAME);

export const db = drizzle(sqlite, { schema });
