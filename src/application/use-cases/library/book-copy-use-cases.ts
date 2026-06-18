import {
  createBookCopy,
  deleteBookCopy,
  findBookCopyById,
  listBookCopiesByLibraryBookId,
  updateBookCopy as updateBookCopyRecord,
} from '@/src/database/repositories/book-copy-repository';
import { findEditionById, findLibraryBookById } from '@/src/database/repositories';
import type { DatabaseTransaction } from '@/src/database/repositories/shared';
import type { BookCopy } from '@/src/database/types';
import type { BookCopyFormat } from '@/src/database/schema';
import { ValidationError } from '@/src/domain/errors';

import {
  assertEditionBelongsToLibraryBook,
  requireEntity,
  resolveUseCaseDependencies,
  runUseCaseTransaction,
  type UseCaseDependencies,
} from '../shared';

export interface AddBookCopyInput {
  libraryBookId: string;
  editionId: string;
  format: BookCopyFormat;
  label?: string | null;
  notes?: string | null;
  acquiredAt?: string | null;
}

export interface UpdateBookCopyInput {
  id: string;
  editionId?: string;
  format?: BookCopyFormat;
  label?: string | null;
  notes?: string | null;
  acquiredAt?: string | null;
}

export function addBookCopy(
  input: AddBookCopyInput,
  dependencies?: UseCaseDependencies,
): BookCopy {
  const { clock, idGenerator } = resolveUseCaseDependencies(dependencies);

  return runUseCaseTransaction((tx) => {
    const libraryBook = requireEntity(
      findLibraryBookById(input.libraryBookId, tx),
      'LibraryBook',
      input.libraryBookId,
    );
    const edition = requireEntity(findEditionById(input.editionId, tx), 'Edition', input.editionId);
    assertEditionBelongsToLibraryBook(edition, libraryBook);
    assertCopyIsUnique(input.libraryBookId, input.editionId, input.format, null, tx);

    const timestamp = clock.now();

    return createBookCopy(
      {
        id: idGenerator.generate(),
        libraryBookId: input.libraryBookId,
        editionId: input.editionId,
        format: input.format,
        label: input.label ?? null,
        notes: input.notes ?? null,
        acquiredAt: input.acquiredAt ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      tx,
    );
  });
}

export function updateBookCopy(input: UpdateBookCopyInput): BookCopy {
  return runUseCaseTransaction((tx) => {
    const existing = requireEntity(findBookCopyById(input.id, tx), 'BookCopy', input.id);
    const libraryBook = requireEntity(
      findLibraryBookById(existing.libraryBookId, tx),
      'LibraryBook',
      existing.libraryBookId,
    );
    const editionId = input.editionId ?? existing.editionId;
    const format = input.format ?? existing.format;
    const edition = requireEntity(findEditionById(editionId, tx), 'Edition', editionId);
    assertEditionBelongsToLibraryBook(edition, libraryBook);
    assertCopyIsUnique(existing.libraryBookId, editionId, format, existing.id, tx);

    return requireEntity(
      updateBookCopyRecord(
        input.id,
        {
          editionId,
          format,
          label: input.label === undefined ? existing.label : input.label,
          notes: input.notes === undefined ? existing.notes : input.notes,
          acquiredAt: input.acquiredAt === undefined ? existing.acquiredAt : input.acquiredAt,
        },
        tx,
      ),
      'BookCopy',
      input.id,
    );
  });
}

export function removeBookCopy(id: string): BookCopy {
  return runUseCaseTransaction((tx) => requireEntity(deleteBookCopy(id, tx), 'BookCopy', id));
}

function assertCopyIsUnique(
  libraryBookId: string,
  editionId: string,
  format: BookCopyFormat,
  currentCopyId: string | null,
  tx: DatabaseTransaction,
): void {
  const duplicate = listBookCopiesByLibraryBookId(libraryBookId, tx).find(
    (copy) =>
      copy.editionId === editionId && copy.format === format && copy.id !== currentCopyId,
  );

  if (duplicate) {
    throw new ValidationError('book copy already exists for this library book, edition and format.');
  }
}
