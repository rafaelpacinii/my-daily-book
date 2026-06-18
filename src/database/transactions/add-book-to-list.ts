import { db } from '../client';
import { EntityNotFoundError } from '../errors';
import type { BookListItem, NewBookListItem } from '../types';
import { createBookListItem, findBookListById } from '../repositories/book-list-repository';
import { findEditionById } from '../repositories/edition-repository';
import { nowTimestamp, runDatabaseOperation } from '../repositories/shared';
import { findWorkById } from '../repositories/work-repository';

export interface AddBookToListInput extends Omit<NewBookListItem, 'createdAt' | 'updatedAt'> {
  id: string;
}

export function addBookToList(input: AddBookToListInput): BookListItem {
  return runDatabaseOperation(() =>
    db.transaction((tx) => {
      const list = findBookListById(input.bookListId, tx);

      if (!list) {
        throw new EntityNotFoundError('BookList', input.bookListId);
      }

      const work = findWorkById(input.workId, tx);

      if (!work) {
        throw new EntityNotFoundError('Work', input.workId);
      }

      if (input.editionId) {
        const edition = findEditionById(input.editionId, tx);

        if (!edition || edition.workId !== input.workId) {
          throw new EntityNotFoundError('Edition', input.editionId);
        }
      }

      const timestamp = nowTimestamp();

      return createBookListItem({ ...input, createdAt: timestamp, updatedAt: timestamp }, tx);
    }),
  );
}
