import * as queries from '@/src/application/queries/library';
import {
  addEditableBookDraftToLibrary,
  addBookCopy,
  addBookToLibrary,
  createDraftFromMetadata,
  createManualBookDraft,
  discardDraftLocalBookCover,
  findPotentialBookDuplicates,
  removeBookCover,
  removeBookCopy,
  removeBookFromLibrary,
  selectLocalBookCover,
  updateBookCopy,
  updateLibraryBookMetadata,
  validateEditableBookDraft,
} from '@/src/application/use-cases/library';

export const libraryApi = {
  getOverview: queries.getLibraryOverview,
  listBooks: queries.listLibraryBooks,
  getBookDetails: queries.getLibraryBookDetails,
  listCurrentlyReadingBooks: queries.listCurrentlyReadingBooks,
  listToReadBooks: queries.listToReadBooks,
  listReadBooks: queries.listReadBooks,
  listDroppedBooks: queries.listDroppedBooks,
  createManualBookDraft,
  createDraftFromMetadata,
  validateBookDraft: validateEditableBookDraft,
  findPotentialBookDuplicates,
  addEditableBookDraftToLibrary,
  selectLocalBookCover,
  removeBookCover,
  discardDraftLocalBookCover,
  addBook: addBookToLibrary,
  updateBookMetadata: updateLibraryBookMetadata,
  removeBook: removeBookFromLibrary,
  addCopy: addBookCopy,
  updateCopy: updateBookCopy,
  removeCopy: removeBookCopy,
};

export type LibraryApi = typeof libraryApi;
