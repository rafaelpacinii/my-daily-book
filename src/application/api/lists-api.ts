import * as queries from '@/src/application/queries/lists';
import {
  addBookToList,
  createBookList,
  deleteBookList,
  removeBookFromList,
  reorderBookListItems,
  updateBookList,
} from '@/src/application/use-cases/lists';
import {
  addPurchaseLink,
  removePurchaseLink,
  updatePurchaseLink,
} from '@/src/application/use-cases/links';
import {
  addWishlistItem,
  getOrCreateWishlist,
  markWishlistItemAsPurchased,
  updateWishlistItem,
} from '@/src/application/use-cases/wishlist';

export const listsApi = {
  listLists: queries.listBookLists,
  getListDetails: queries.getBookListDetails,
  getItemDetails: queries.getBookListItemDetails,
  getWishlist: queries.getWishlist,
  createList: createBookList,
  updateList: updateBookList,
  deleteList: deleteBookList,
  addItem: addBookToList,
  removeItem: removeBookFromList,
  reorderItems: reorderBookListItems,
  getOrCreateWishlist,
  addWishlistItem,
  updateWishlistItem,
  markWishlistItemAsPurchased,
  addPurchaseLink,
  updatePurchaseLink,
  removePurchaseLink,
};

export type ListsApi = typeof listsApi;
