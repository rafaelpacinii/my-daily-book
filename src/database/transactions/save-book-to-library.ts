import { db } from '../client';
import { EntityNotFoundError } from '../errors';
import type {
  Author,
  BookCopy,
  Edition,
  LibraryBook,
  NewAuthor,
  NewBookCopy,
  NewEdition,
  NewLibraryBook,
  NewWork,
  Work,
  WorkAuthor,
} from '../types';
import { createAuthor, findAuthorById } from '../repositories/author-repository';
import { createBookCopy } from '../repositories/book-copy-repository';
import { createEdition, findEditionByExternalMetadataId, findEditionById } from '../repositories/edition-repository';
import {
  createLibraryBook,
  findLibraryBookByWorkId,
} from '../repositories/library-book-repository';
import {
  createWork,
  createWorkAuthor,
  findWorkAuthor,
  findWorkById,
} from '../repositories/work-repository';
import type { DatabaseTransaction } from '../repositories/shared';
import { runDatabaseOperation } from '../repositories/shared';

export type SaveBookWorkInput =
  | { kind: 'existing'; id: string }
  | { kind: 'create'; data: NewWork };

export type SaveBookAuthorInput =
  | { kind: 'existing'; id: string; position?: number }
  | { kind: 'create'; data: NewAuthor; position?: number };

export type SaveBookEditionInput =
  | { kind: 'existing'; id: string }
  | { kind: 'create'; data: Omit<NewEdition, 'workId'> };

export interface SaveBookToLibraryInput {
  work: SaveBookWorkInput;
  authors: SaveBookAuthorInput[];
  edition: SaveBookEditionInput;
  libraryBook: Omit<NewLibraryBook, 'workId'>;
  copy?: Omit<NewBookCopy, 'libraryBookId' | 'editionId'>;
}

export interface SaveBookToLibraryResult {
  work: Work;
  authors: Author[];
  workAuthors: WorkAuthor[];
  edition: Edition;
  libraryBook: LibraryBook;
  copy: BookCopy | null;
}

export function saveBookToLibrary(input: SaveBookToLibraryInput): SaveBookToLibraryResult {
  return runDatabaseOperation(() =>
    db.transaction((tx) => {
      const work = persistWork(input.work, tx);
      const authors = input.authors.map((authorInput) => persistAuthor(authorInput, tx));
      const workAuthors = authors.map((author, index) => {
        const existing = findWorkAuthor(work.id, author.id, tx);

        if (existing) {
          return existing;
        }

        return createWorkAuthor(
          {
            workId: work.id,
            authorId: author.id,
            position: input.authors[index]?.position ?? index,
          },
          tx,
        );
      });
      const edition = persistEdition(work.id, input.edition, tx);
      const existingLibraryBook = findLibraryBookByWorkId(work.id, tx);
      const libraryBook =
        existingLibraryBook ?? createLibraryBook({ ...input.libraryBook, workId: work.id }, tx);
      const copy = input.copy
        ? createBookCopy(
            {
              ...input.copy,
              libraryBookId: libraryBook.id,
              editionId: edition.id,
            },
            tx,
          )
        : null;

      return { work, authors, workAuthors, edition, libraryBook, copy };
    }),
  );
}

function persistWork(input: SaveBookWorkInput, tx: DatabaseTransaction): Work {
  if (input.kind === 'create') {
    return createWork(input.data, tx);
  }

  const work = findWorkById(input.id, tx);

  if (!work) {
    throw new EntityNotFoundError('Work', input.id);
  }

  return work;
}

function persistAuthor(
  input: SaveBookAuthorInput,
  tx: DatabaseTransaction,
): Author {
  if (input.kind === 'create') {
    return createAuthor(input.data, tx);
  }

  const author = findAuthorById(input.id, tx);

  if (!author) {
    throw new EntityNotFoundError('Author', input.id);
  }

  return author;
}

function persistEdition(
  workId: string,
  input: SaveBookEditionInput,
  tx: DatabaseTransaction,
): Edition {
  if (input.kind === 'existing') {
    const edition = findEditionById(input.id, tx);

    if (!edition) {
      throw new EntityNotFoundError('Edition', input.id);
    }

    return edition;
  }

  const metadataSource = input.data.metadataSource ?? 'google_books';
  const externalMetadataId = input.data.externalMetadataId ?? input.data.googleBooksId ?? null;

  if (externalMetadataId) {
    const existingEdition = findEditionByExternalMetadataId(metadataSource, externalMetadataId, tx);
    if (existingEdition) {
      return existingEdition;
    }
  }

  return createEdition({ ...input.data, workId }, tx);
}
