import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  validateReadingGoalBooksForm,
  validateReadingGoalForm,
} from '../goals-validation';

describe('reading goal validation', () => {
  it('trims valid goal data for creation and editing', () => {
    const result = validateReadingGoalForm({
      name: '  Summer stack  ',
      description: '  Before vacation  ',
      startDate: '2026-06-01',
      targetDate: '2026-06-30',
    });

    assert.equal(result.valid, true);
    assert.deepEqual(result.input, {
      name: 'Summer stack',
      description: 'Before vacation',
      startDate: '2026-06-01',
      targetDate: '2026-06-30',
    });
  });

  it('requires a name and valid chronological civil dates', () => {
    assert.equal(validateReadingGoalForm({
      name: '',
      description: '',
      startDate: '2026-06-01',
      targetDate: '2026-06-30',
    }).valid, false);

    assert.equal(validateReadingGoalForm({
      name: 'Goal',
      description: '',
      startDate: '2026-02-30',
      targetDate: '2026-06-30',
    }).valid, false);

    assert.equal(validateReadingGoalForm({
      name: 'Goal',
      description: '',
      startDate: '2026-07-01',
      targetDate: '2026-06-30',
    }).valid, false);
  });

  it('accepts multiple books and rejects duplicated selections', () => {
    const valid = validateReadingGoalBooksForm({ selectedBookIds: ['book-1', 'book-2'] });
    assert.equal(valid.valid, true);
    assert.deepEqual(valid.input?.bookIds, ['book-1', 'book-2']);

    assert.equal(validateReadingGoalBooksForm({ selectedBookIds: ['book-1', 'book-1'] }).valid, false);
  });

  it('allows empty book selection while surfacing the recommendation', () => {
    const result = validateReadingGoalBooksForm({ selectedBookIds: [] });

    assert.equal(result.valid, true);
    assert.equal(result.input?.recommendedMessage, 'A goal works best with at least one book.');
  });
});

