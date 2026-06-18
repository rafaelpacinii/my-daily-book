import { DuplicateListItemError, InvalidWishlistItemError, ValidationError } from '../../errors';
import { validateOptionalMoney } from '../../shared';
import type { WishlistItemRulesInput } from '../types';

export function validateBookListName(name: string): void {
  if (name.trim().length === 0) {
    throw new ValidationError('book list name is required.');
  }
}

export function validateBookListPosition(position?: number | null): void {
  if (position != null && position < 0) {
    throw new ValidationError('book list item position cannot be negative.');
  }
}

export function assertUniqueBookListItem(exists: boolean): void {
  if (exists) {
    throw new DuplicateListItemError('book list already contains this work and edition.');
  }
}

export function assertSingleWishlist(existingWishlistCount: number): void {
  if (existingWishlistCount > 0) {
    throw new InvalidWishlistItemError('only one wishlist can exist.');
  }
}

export function validateWishlistItem(input: WishlistItemRulesInput): void {
  if (input.hasSpecificEdition ? input.ownsEdition : input.ownsWork) {
    throw new InvalidWishlistItemError('wishlist items must not already be owned.');
  }

  validateOptionalMoney(input.targetPrice, input.targetCurrency);
}

