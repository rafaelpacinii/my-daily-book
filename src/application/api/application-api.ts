import { backupApi, type BackupApi } from './backup-api';
import { goalsApi, type GoalsApi } from './goals-api';
import { googleBooksApi, type GoogleBooksApi } from './google-books-api';
import { libraryApi, type LibraryApi } from './library-api';
import { listsApi, type ListsApi } from './lists-api';
import { readingApi, type ReadingApi } from './reading-api';
import { statisticsApi, type StatisticsApi } from './statistics-api';

export interface ApplicationApi {
  library: LibraryApi;
  reading: ReadingApi;
  lists: ListsApi;
  goals: GoalsApi;
  statistics: StatisticsApi;
  googleBooks: GoogleBooksApi;
  backup: BackupApi;
}

export function createApplicationApi(): ApplicationApi {
  return {
    library: libraryApi,
    reading: readingApi,
    lists: listsApi,
    goals: goalsApi,
    statistics: statisticsApi,
    googleBooks: googleBooksApi,
    backup: backupApi,
  };
}

