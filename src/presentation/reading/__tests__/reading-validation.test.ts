import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  validateCompleteReadingForm,
  validateDropReadingForm,
} from '../cycle/reading-cycle-validation';
import {
  createInitialReadingLogForm,
  validateReadingLogForm,
} from '../log/reading-log-validation';
import {
  createInitialStartReadingForm,
  validateStartReadingForm,
} from '../start/start-reading-validation';

describe('reading form validation', () => {
  it('requires a book, edition and non-future start date', () => {
    const empty = createInitialStartReadingForm('2026-06-15');
    assert.equal(validateStartReadingForm(empty, '2026-06-15').valid, false);

    const valid = validateStartReadingForm({
      ...empty,
      libraryBookId: 'book-1',
      editionId: 'edition-1',
    }, '2026-06-15');
    assert.equal(valid.valid, true);

    const future = validateStartReadingForm({
      ...empty,
      libraryBookId: 'book-1',
      editionId: 'edition-1',
      startedAt: '2026-06-16',
    }, '2026-06-15');
    assert.equal(future.valid, false);
  });

  it('builds log defaults from the previous end page', () => {
    const form = createInitialReadingLogForm({
      today: '2026-06-15',
      previousEndPage: 53,
    });

    assert.equal(form.readingDate, '2026-06-15');
    assert.equal(form.startPage, '54');
    assert.equal(form.endPage, '');
  });

  it('validates inclusive page ranges and optional duration', () => {
    const valid = validateReadingLogForm({
      readingDate: '2026-06-15',
      startPage: '1',
      endPage: '53',
      durationHours: '1',
      durationMinutes: '5',
      notes: '  good session  ',
    }, { pageCount: 120, today: '2026-06-15' });

    assert.equal(valid.valid, true);
    assert.deepEqual(valid.input, {
      readingDate: '2026-06-15',
      startPage: 1,
      endPage: 53,
      durationSeconds: 3900,
      notes: 'good session',
    });

    assert.equal(validateReadingLogForm({
      readingDate: '2026-06-15',
      startPage: '54',
      endPage: '53',
      durationHours: '',
      durationMinutes: '',
      notes: '',
    }, { pageCount: 120, today: '2026-06-15' }).valid, false);
  });

  it('normalizes zero duration to an absent duration', () => {
    const valid = validateReadingLogForm({
      readingDate: '2026-06-15',
      startPage: '1',
      endPage: '1',
      durationHours: '0',
      durationMinutes: '0',
      notes: '',
    }, { today: '2026-06-15' });

    assert.equal(valid.valid, true);
    assert.equal(valid.input?.durationSeconds, null);
  });

  it('loads edit form values from an existing log', () => {
    const form = createInitialReadingLogForm({
      log: {
        readingDate: '2026-06-14',
        startPage: 12,
        endPage: 24,
        durationSeconds: 4500,
        notes: 'Previous note',
      },
    });

    assert.deepEqual(form, {
      readingDate: '2026-06-14',
      startPage: '12',
      endPage: '24',
      durationHours: '1',
      durationMinutes: '15',
      notes: 'Previous note',
    });
  });

  it('validates completion rating as an optional whole number from one to five', () => {
    assert.equal(validateCompleteReadingForm({
      finishedAt: '2026-06-15',
      rating: '',
      notes: '',
    }, '2026-06-15').valid, true);

    assert.equal(validateCompleteReadingForm({
      finishedAt: '2026-06-15',
      rating: '6',
      notes: '',
    }, '2026-06-15').valid, false);
  });

  it('validates drop dates and trims drop notes', () => {
    const valid = validateDropReadingForm({
      droppedAt: '2026-06-15',
      notes: '  pause for later  ',
    }, '2026-06-15');

    assert.equal(valid.valid, true);
    assert.equal(valid.notes, 'pause for later');

    assert.equal(validateDropReadingForm({
      droppedAt: '2026-06-16',
      notes: '',
    }, '2026-06-15').valid, false);
  });
});
