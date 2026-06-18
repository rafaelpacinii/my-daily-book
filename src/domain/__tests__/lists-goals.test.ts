import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DuplicateListItemError,
  InvalidGoalDateError,
  InvalidWishlistItemError,
  ValidationError,
  assertNoDuplicateGoalBooks,
  assertSingleWishlist,
  assertUniqueBookListItem,
  determineReadingGoalStatus,
  normalizePurchaseLinkUrl,
  validatePurchaseLink,
  validateReadingGoalDates,
  validateWishlistItem,
} from '@/src/domain';

describe('list, wishlist, link and goal rules', () => {
  it('enforces one wishlist and duplicate list item checks', () => {
    assert.doesNotThrow(() => assertSingleWishlist(0));
    assert.throws(() => assertSingleWishlist(1), InvalidWishlistItemError);
    assert.throws(() => assertUniqueBookListItem(true), DuplicateListItemError);
  });

  it('validates wishlist ownership and money fields', () => {
    assert.throws(
      () =>
        validateWishlistItem({
          hasSpecificEdition: false,
          ownsWork: true,
          ownsEdition: false,
          targetPrice: null,
          targetCurrency: null,
        }),
      InvalidWishlistItemError,
    );
    assert.throws(
      () =>
        validateWishlistItem({
          hasSpecificEdition: true,
          ownsWork: false,
          ownsEdition: false,
          targetPrice: -1,
          targetCurrency: 'BRL',
        }),
      ValidationError,
    );
  });

  it('validates purchase links without accessing the URL', () => {
    assert.equal(normalizePurchaseLinkUrl(' https://example.com/book '), 'https://example.com/book');
    assert.doesNotThrow(() => validatePurchaseLink('https://example.com/book', 10, 'BRL'));
    assert.throws(() => validatePurchaseLink('ftp://example.com/book'), ValidationError);
    assert.throws(() => validatePurchaseLink('https://example.com/book', -1, 'BRL'), ValidationError);
    assert.throws(() => validatePurchaseLink('https://example.com/book', 1, 'brl'), ValidationError);
  });

  it('validates reading goal dates and duplicate books', () => {
    assert.doesNotThrow(() => validateReadingGoalDates('2026-01-01', '2026-12-31'));
    assert.throws(() => validateReadingGoalDates('2026-12-31', '2026-01-01'), InvalidGoalDateError);
    assert.throws(() => assertNoDuplicateGoalBooks(['a', 'a']), ValidationError);
  });

  it('determines goal status without changing cancelled goals automatically', () => {
    assert.equal(determineReadingGoalStatus([null], 'active'), 'active');
    assert.equal(determineReadingGoalStatus(['2026-06-14'], 'active'), 'completed');
    assert.equal(determineReadingGoalStatus(['2026-06-14'], 'cancelled'), 'cancelled');
  });
});

