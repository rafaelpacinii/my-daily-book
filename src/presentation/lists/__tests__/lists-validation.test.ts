import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  validateAddListItemForm,
  validateBookListForm,
  validateMarkAsPurchasedForm,
  validatePurchaseLinkForm,
  validateWishlistItemForm,
} from '../lists-validation';

describe('lists and wishlist validation', () => {
  it('trims custom list fields and requires a name', () => {
    assert.equal(validateBookListForm({ name: '', description: '' }).valid, false);

    const result = validateBookListForm({ name: '  Summer  ', description: '  Travel reads  ' });
    assert.equal(result.valid, true);
    assert.deepEqual(result.input, { name: 'Summer', description: 'Travel reads' });
  });

  it('requires a selected local book for list items', () => {
    assert.equal(validateAddListItemForm({ workId: null, editionId: null, notes: '' }).valid, false);

    const result = validateAddListItemForm({ workId: 'book-1', editionId: null, notes: '  maybe  ' });
    assert.equal(result.valid, true);
    assert.deepEqual(result.input, { workId: 'book-1', editionId: null, notes: 'maybe' });
  });

  it('validates wishlist priority, desired format, price and currency', () => {
    const result = validateWishlistItemForm({
      workId: 'book-1',
      editionId: 'edition-1',
      notes: '',
      wishlistPriority: 'high',
      desiredFormat: 'digital',
      targetPrice: '12.5',
      targetCurrency: 'USD',
    });

    assert.equal(result.valid, true);
    assert.equal(result.input?.wishlistPriority, 'high');
    assert.equal(result.input?.desiredFormat, 'digital');
    assert.equal(result.input?.targetPrice, 12.5);
    assert.equal(validateWishlistItemForm({
      workId: 'book-1',
      editionId: null,
      notes: '',
      wishlistPriority: 'medium',
      desiredFormat: 'any',
      targetPrice: '-1',
      targetCurrency: 'USD',
    }).valid, false);
  });

  it('accepts only safe purchase link URLs and valid money', () => {
    assert.equal(validatePurchaseLinkForm({
      storeName: '',
      url: 'ftp://example.com',
      price: '',
      currency: '',
      notes: '',
    }).valid, false);

    const result = validatePurchaseLinkForm({
      storeName: '  Store  ',
      url: 'https://example.com/book',
      price: '10',
      currency: 'BRL',
      notes: '  promo  ',
    });

    assert.equal(result.valid, true);
    assert.deepEqual(result.input, {
      storeName: 'Store',
      url: 'https://example.com/book',
      price: 10,
      currency: 'BRL',
      notes: 'promo',
    });
  });

  it('requires an edition and validates optional acquisition date for purchase', () => {
    assert.equal(validateMarkAsPurchasedForm({
      editionId: null,
      format: 'physical',
      label: '',
      notes: '',
      acquiredAt: '',
    }).valid, false);

    assert.equal(validateMarkAsPurchasedForm({
      editionId: 'edition-1',
      format: 'digital',
      label: '  Kindle  ',
      notes: '',
      acquiredAt: '2026-06-15',
    }).valid, true);
  });
});
