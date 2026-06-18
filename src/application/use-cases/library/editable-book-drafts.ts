import type {
  AddBookToLibraryResult,
  AddBookWorkInput,
} from './add-book-to-library';
import { addBookToLibrary } from './add-book-to-library';
import { readModelSnapshot, findAuthorsForWork } from '@/src/application/queries/read-model-store';
import { ValidationError } from '@/src/domain/errors';
import type {
  BookMetadata,
  EditableBookCover,
  EditableBookDraft,
} from '@/src/domain/books';
import {
  deleteDraftBookCover,
  persistSelectedBookCover,
  pickLocalBookCover,
} from '@/src/infrastructure/library/book-cover-storage';

export interface EditableDraftDuplicateMatch {
  workId: string;
  editionId: string;
  libraryBookId: string | null;
  reason: 'external_id' | 'isbn13' | 'isbn10';
}

export interface EditableDraftDuplicateSummary {
  exactEdition: EditableDraftDuplicateMatch | null;
  suggestedLibraryBookIds: string[];
}

export interface AddEditableBookDraftInput {
  draft: EditableBookDraft;
  workMode: 'create' | 'existing';
  existingLibraryBookId: string | null;
  owned: boolean;
  format: 'physical' | 'digital';
  copyLabel: string | null;
  acquiredAt: string | null;
  notes: string | null;
}

export function createManualBookDraft(): EditableBookDraft {
  return {
    source: 'manual',
    externalId: null,
    googleBooksId: null,
    etag: null,
    title: '',
    subtitle: null,
    description: null,
    authors: [''],
    publisher: null,
    publishedDate: null,
    pageCount: null,
    language: null,
    printType: null,
    format: null,
    subjects: [],
    isbn10: null,
    isbn13: null,
    thumbnailUrl: null,
    smallThumbnailUrl: null,
    cover: emptyCover(),
    previewLink: null,
    infoLink: null,
    canonicalVolumeLink: null,
  };
}

export function createDraftFromMetadata(metadata: BookMetadata): EditableBookDraft {
  return {
    source: metadata.source,
    externalId: metadata.externalId,
    googleBooksId: metadata.googleBooksId,
    etag: metadata.etag,
    title: metadata.title,
    subtitle: metadata.subtitle,
    description: metadata.description,
    authors: metadata.authors.length > 0 ? [...metadata.authors] : [''],
    publisher: metadata.publisher,
    publishedDate: metadata.publishedDate,
    pageCount: metadata.pageCount,
    language: metadata.language,
    printType: metadata.printType,
    format: metadata.format,
    subjects: [...metadata.subjects],
    isbn10: metadata.isbn10,
    isbn13: metadata.isbn13,
    thumbnailUrl: metadata.thumbnailUrl,
    smallThumbnailUrl: metadata.smallThumbnailUrl,
    cover: metadata.coverUrl ? {
      kind: 'remote',
      uri: metadata.coverUrl,
      mimeType: null,
      fileName: null,
      fileSize: null,
    } : emptyCover(),
    previewLink: metadata.previewLink,
    infoLink: metadata.infoLink,
    canonicalVolumeLink: metadata.canonicalVolumeLink,
  };
}

export function removeBookCover(): EditableBookCover {
  return emptyCover();
}

export async function selectLocalBookCover(): Promise<EditableBookCover | null> {
  return pickLocalBookCover();
}

export async function discardDraftLocalBookCover(cover: EditableBookCover | null | undefined): Promise<void> {
  await deleteDraftBookCover(cover);
}

export function validateEditableBookDraft(draft: EditableBookDraft): EditableBookDraft {
  const title = normalizeRequiredText(draft.title, 'Book title is required.');
  const authors = normalizeAuthors(draft.authors);

  if (authors.length === 0) {
    throw new ValidationError('At least one author is required.');
  }

  const publishedDate = normalizePublishedDate(draft.publishedDate);
  const pageCount = normalizePageCount(draft.pageCount);
  const isbn10 = normalizeIsbn10(draft.isbn10);
  const isbn13 = normalizeIsbn13(draft.isbn13);

  if (isbn10 && !isValidIsbn10(isbn10)) {
    throw new ValidationError('ISBN-10 is invalid.');
  }

  if (isbn13 && !isValidIsbn13(isbn13)) {
    throw new ValidationError('ISBN-13 is invalid.');
  }

  if (isbn10 && isbn13) {
    const converted = convertIsbn10To13(isbn10);
    if (converted !== isbn13) {
      throw new ValidationError('ISBN-10 and ISBN-13 do not match.');
    }
  }

  return {
    ...draft,
    title,
    subtitle: normalizeOptionalText(draft.subtitle),
    description: normalizeOptionalText(draft.description),
    authors,
    publisher: normalizeOptionalText(draft.publisher),
    publishedDate,
    pageCount,
    language: normalizeOptionalText(draft.language),
    isbn10,
    isbn13,
  };
}

export function findPotentialBookDuplicates(draft: EditableBookDraft): EditableDraftDuplicateSummary {
  const normalizedDraft = validateEditableBookDraft(draft);
  const snapshot = readModelSnapshot();

  const exactEdition = findExactEditionMatch(snapshot, normalizedDraft);
  const normalizedTitle = normalizeComparableText(normalizedDraft.title);
  const normalizedAuthors = normalizedDraft.authors.map(normalizeComparableText);

  const suggestedLibraryBookIds = snapshot.libraryBooks
    .filter((libraryBook) => {
      const work = snapshot.works.find((item) => item.id === libraryBook.workId);
      if (!work || normalizeComparableText(work.title) !== normalizedTitle) return false;

      const workAuthors = findAuthorsForWork(snapshot, work.id).map((author) => normalizeComparableText(author.name));
      return workAuthors.length === normalizedAuthors.length
        && workAuthors.every((author, index) => author === normalizedAuthors[index]);
    })
    .map((libraryBook) => libraryBook.id);

  return {
    exactEdition,
    suggestedLibraryBookIds,
  };
}

export async function addEditableBookDraftToLibrary(
  input: AddEditableBookDraftInput,
): Promise<AddBookToLibraryResult> {
  const draft = validateEditableBookDraft(input.draft);
  const duplicates = findPotentialBookDuplicates(draft);
  const exactEdition = duplicates.exactEdition;
  const libraryBookId = input.existingLibraryBookId?.trim() ? input.existingLibraryBookId : null;

  if (input.workMode === 'existing' && !libraryBookId && !exactEdition) {
    throw new ValidationError('Choose an existing work.');
  }

  const persistedCover = await persistSelectedBookCover(draft.cover);
  const editionInput = exactEdition
    ? { kind: 'existing' as const, id: exactEdition.editionId }
    : {
        kind: 'create' as const,
        data: {
          googleBooksId: draft.googleBooksId,
          metadataSource: draft.source,
          externalMetadataId: draft.externalId,
          googleBooksEtag: draft.etag,
          title: draft.title,
          subtitle: draft.subtitle,
          description: draft.description,
          publisher: draft.publisher,
          publishedDate: draft.publishedDate,
          pageCount: draft.pageCount,
          language: draft.language,
          printType: draft.printType,
          isbn10: draft.isbn10,
          isbn13: draft.isbn13,
          thumbnailUrl: persistedCover.kind === 'none' ? null : draft.thumbnailUrl,
          smallThumbnailUrl: persistedCover.kind === 'none' ? null : draft.smallThumbnailUrl,
          coverSource: persistedCover.kind === 'local' ? 'local' : persistedCover.kind === 'remote' ? 'remote' : 'none',
          coverMimeType: persistedCover.kind === 'local' ? persistedCover.mimeType : null,
          coverFileName: persistedCover.kind === 'local' ? persistedCover.fileName : null,
          coverUrl: persistedCover.kind === 'none' ? null : persistedCover.uri,
          previewLink: draft.previewLink,
          infoLink: draft.infoLink,
          canonicalVolumeLink: draft.canonicalVolumeLink,
          metadataFetchedAt: Date.now(),
        },
      };

  const workInput = exactEdition
    ? { kind: 'existing' as const, id: exactEdition.workId }
    : input.workMode === 'existing'
      ? resolveExistingWorkInput(libraryBookId)
      : createWorkInput(draft);

  return addBookToLibrary({
    work: workInput,
    authors: workInput.kind === 'create'
      ? draft.authors.map((name, index) => ({
          kind: 'create' as const,
          data: { name },
          position: index,
        }))
      : [],
    edition: editionInput,
    copy: input.owned
      ? {
          format: input.format,
          label: input.copyLabel,
          acquiredAt: input.acquiredAt,
          notes: input.notes,
        }
      : undefined,
  });
}

function resolveExistingWorkInput(libraryBookId: string | null): AddBookWorkInput {
  const snapshot = readModelSnapshot();
  const libraryBook = snapshot.libraryBooks.find((item) => item.id === libraryBookId);

  if (!libraryBook) {
    throw new ValidationError('Choose an existing work.');
  }

  return { kind: 'existing', id: libraryBook.workId };
}

function createWorkInput(draft: EditableBookDraft): AddBookWorkInput {
  return {
    kind: 'create',
    data: {
      title: draft.title,
      originalTitle: null,
      description: draft.description,
      originalLanguage: draft.language,
      firstPublishedDate: draft.publishedDate,
    },
  };
}

function findExactEditionMatch(
  snapshot: ReturnType<typeof readModelSnapshot>,
  draft: EditableBookDraft,
): EditableDraftDuplicateMatch | null {
  if (draft.source !== 'manual' && draft.externalId) {
    const byExternal = snapshot.editions.find((edition) =>
      edition.metadataSource === draft.source && edition.externalMetadataId === draft.externalId,
    );
    if (byExternal) {
      return mapEditionDuplicate(snapshot, byExternal.id, 'external_id');
    }
  }

  if (draft.isbn13) {
    const byIsbn13 = snapshot.editions.filter((edition) => edition.isbn13 === draft.isbn13);
    if (byIsbn13.length === 1) {
      return mapEditionDuplicate(snapshot, byIsbn13[0].id, 'isbn13');
    }
  }

  if (draft.isbn10) {
    const byIsbn10 = snapshot.editions.filter((edition) => edition.isbn10 === draft.isbn10);
    if (byIsbn10.length === 1) {
      return mapEditionDuplicate(snapshot, byIsbn10[0].id, 'isbn10');
    }
  }

  return null;
}

function mapEditionDuplicate(
  snapshot: ReturnType<typeof readModelSnapshot>,
  editionId: string,
  reason: EditableDraftDuplicateMatch['reason'],
): EditableDraftDuplicateMatch {
  const edition = snapshot.editions.find((item) => item.id === editionId);
  if (!edition) {
    throw new ValidationError('Edition duplicate lookup failed.');
  }

  const libraryBook = snapshot.bookCopies.find((copy) => copy.editionId === editionId)
    ? snapshot.libraryBooks.find((item) => item.workId === edition.workId) ?? null
    : snapshot.libraryBooks.find((item) => item.workId === edition.workId) ?? null;

  return {
    workId: edition.workId,
    editionId,
    libraryBookId: libraryBook?.id ?? null,
    reason,
  };
}

function normalizeRequiredText(value: string, message: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new ValidationError(message);
  }
  return trimmed;
}

function normalizeOptionalText(value: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeAuthors(authors: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const author of authors) {
    const trimmed = author.trim();
    if (trimmed.length === 0 || seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

function normalizePageCount(value: number | null): number | null {
  if (value == null) return null;
  if (!Number.isInteger(value) || value <= 0) {
    throw new ValidationError('Page count must be a positive integer.');
  }
  return value;
}

function normalizePublishedDate(value: string | null): string | null {
  const normalized = normalizeOptionalText(value);
  if (!normalized) return null;

  if (!/^\d{4}(-\d{2})?(-\d{2})?$/.test(normalized)) {
    throw new ValidationError('Published date must use YYYY-MM-DD, YYYY-MM, or YYYY.');
  }

  return normalized;
}

function normalizeIsbn10(value: string | null): string | null {
  const normalized = normalizeIsbn(value);
  if (!normalized) return null;
  if (normalized.length !== 10) {
    throw new ValidationError('ISBN-10 must have 10 characters.');
  }
  return normalized;
}

function normalizeIsbn13(value: string | null): string | null {
  const normalized = normalizeIsbn(value);
  if (!normalized) return null;
  if (normalized.length !== 13) {
    throw new ValidationError('ISBN-13 must have 13 digits.');
  }
  return normalized;
}

function normalizeIsbn(value: string | null): string | null {
  const normalized = normalizeOptionalText(value)?.replace(/[\s-]/g, '').toUpperCase() ?? null;
  return normalized && normalized.length > 0 ? normalized : null;
}

function isValidIsbn10(value: string): boolean {
  if (!/^\d{9}[\dX]$/.test(value)) return false;

  let sum = 0;
  for (let index = 0; index < 10; index += 1) {
    const char = value[index];
    const digit = char === 'X' ? 10 : Number(char);
    sum += digit * (10 - index);
  }

  return sum % 11 === 0;
}

function isValidIsbn13(value: string): boolean {
  if (!/^\d{13}$/.test(value)) return false;

  let sum = 0;
  for (let index = 0; index < 12; index += 1) {
    sum += Number(value[index]) * (index % 2 === 0 ? 1 : 3);
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === Number(value[12]);
}

function convertIsbn10To13(value: string): string {
  const base = `978${value.slice(0, 9)}`;
  let sum = 0;
  for (let index = 0; index < base.length; index += 1) {
    sum += Number(base[index]) * (index % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${base}${checkDigit}`;
}

function normalizeComparableText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function emptyCover(): EditableBookCover {
  return {
    kind: 'none',
    uri: null,
    mimeType: null,
    fileName: null,
    fileSize: null,
  };
}
