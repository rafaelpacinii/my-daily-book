import { db } from '../client';
import type { BookList, NewBookList } from '../types';
import { createBookListRecord } from '../repositories/book-list-repository';
import { nowTimestamp, runDatabaseOperation } from '../repositories/shared';

export interface CreateBookListInput extends Omit<NewBookList, 'createdAt' | 'updatedAt'> {
  id: string;
}

export function createBookList(input: CreateBookListInput): BookList {
  return runDatabaseOperation(() =>
    db.transaction((tx) => {
      const timestamp = nowTimestamp();

      return createBookListRecord({ ...input, createdAt: timestamp, updatedAt: timestamp }, tx);
    }),
  );
}
