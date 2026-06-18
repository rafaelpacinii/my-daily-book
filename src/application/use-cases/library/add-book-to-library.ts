import { findLibraryBookById, updateLibraryBook as updateLibraryBookRecord } from '@/src/database/repositories';
import { deleteLibraryBook } from '@/src/database/repositories/library-book-repository';
import { listReadingCyclesByLibraryBookId } from '@/src/database/repositories/reading-cycle-repository';
import { saveBookToLibrary } from '@/src/database/transactions';
import type {
  Author,
  BookCopy,
  Edition,
  LibraryBook,
  NewAuthor,
  NewBookCopy,
  NewEdition,
  NewWork,
  Work,
  WorkAuthor,
} from '@/src/database/types';

import { resolveUseCaseDependencies, type UseCaseDependencies } from '../shared';
import { requireEntity, runUseCaseTransaction } from '../shared';
import { ValidationError } from '@/src/domain/errors';

export type AddBookWorkInput =
  | { kind: 'existing'; id: string }
  | { kind: 'create'; data: Omit<NewWork, 'id' | 'createdAt' | 'updatedAt'> };

export type AddBookAuthorInput =
  | { kind: 'existing'; id: string; position?: number }
  | { kind: 'create'; data: Omit<NewAuthor, 'id' | 'createdAt' | 'updatedAt'>; position?: number };

export type AddBookEditionInput =
  | { kind: 'existing'; id: string }
  | { kind: 'create'; data: Omit<NewEdition, 'id' | 'workId' | 'createdAt' | 'updatedAt'> };

export interface AddBookToLibraryInput {
  work: AddBookWorkInput;
  authors: AddBookAuthorInput[];
  edition: AddBookEditionInput;
  copy?: Omit<NewBookCopy, 'id' | 'libraryBookId' | 'editionId' | 'createdAt' | 'updatedAt'>;
}

export interface AddBookToLibraryResult {
  work: Work;
  authors: Author[];
  workAuthors: WorkAuthor[];
  edition: Edition;
  libraryBook: LibraryBook;
  copy: BookCopy | null;
}

export function addBookToLibrary(
  input: AddBookToLibraryInput,
  dependencies?: UseCaseDependencies,
): AddBookToLibraryResult {
  const { clock, idGenerator } = resolveUseCaseDependencies(dependencies);
  const timestamp = clock.now();

  return saveBookToLibrary({
    work:
      input.work.kind === 'existing'
        ? input.work
        : {
            kind: 'create',
            data: {
              ...input.work.data,
              id: idGenerator.generate(),
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          },
    authors: input.authors.map((author) =>
      author.kind === 'existing'
        ? author
        : {
            kind: 'create',
            data: {
              id: idGenerator.generate(),
              name: author.data.name,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
            position: author.position,
          },
    ),
    edition:
      input.edition.kind === 'existing'
        ? input.edition
        : {
            kind: 'create',
            data: {
              ...input.edition.data,
              id: idGenerator.generate(),
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          },
    libraryBook: {
      id: idGenerator.generate(),
      status: 'to_read',
      rating: null,
      notes: null,
      addedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    copy: input.copy
      ? {
          ...input.copy,
          id: idGenerator.generate(),
          createdAt: timestamp,
          updatedAt: timestamp,
        }
      : undefined,
  });
}

export interface UpdateLibraryBookMetadataInput {
  id: string;
  rating?: number | null;
  notes?: string | null;
}

export function updateLibraryBookMetadata(input: UpdateLibraryBookMetadataInput): LibraryBook {
  return runUseCaseTransaction((tx) => {
    const existing = requireEntity(findLibraryBookById(input.id, tx), 'LibraryBook', input.id);

    return requireEntity(
      updateLibraryBookRecord(
        input.id,
        {
          rating: input.rating === undefined ? existing.rating : input.rating,
          notes: input.notes === undefined ? existing.notes : input.notes,
        },
        tx,
      ),
      'LibraryBook',
      input.id,
    );
  });
}

export function removeBookFromLibrary(libraryBookId: string): LibraryBook {
  return runUseCaseTransaction((tx) => {
    const cycles = listReadingCyclesByLibraryBookId(libraryBookId, tx);

    if (cycles.length > 0) {
      throw new ValidationError('library book cannot be removed when it has reading history.');
    }

    return requireEntity(deleteLibraryBook(libraryBookId, tx), 'LibraryBook', libraryBookId);
  });
}
