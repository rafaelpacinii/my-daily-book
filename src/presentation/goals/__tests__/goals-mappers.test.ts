import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ReadingGoalDetails } from '@/src/application';

import { formatCivilDate, formatDueLabel } from '../goals-formatters';
import { mapReadingGoalDetails, mapReadingGoalSummary } from '../goals-mappers';

describe('reading goal mappers', () => {
  it('maps active progress, dates and due labels', () => {
    const summary = mapReadingGoalSummary(goalDetails({
      status: 'active',
      completedBooks: 1,
      totalBooks: 2,
      pendingBooks: 1,
      progressPercentage: 50,
      daysRemaining: 5,
      isOverdue: false,
    }));

    assert.equal(summary.progressLabel, '1 of 2 books completed');
    assert.equal(summary.dueLabel, 'Due in 5 days');
    assert.equal(summary.startDateLabel, 'June 1, 2026');
    assert.equal(summary.targetDateLabel, 'June 30, 2026');
  });

  it('maps completed on-time and late goals', () => {
    const onTime = mapReadingGoalSummary(goalDetails({
      status: 'completed',
      completedAt: '2026-06-20',
      isCompletedWithinDeadline: true,
    }));
    const late = mapReadingGoalSummary(goalDetails({
      status: 'completed',
      completedAt: '2026-07-01',
      isCompletedWithinDeadline: false,
    }));

    assert.equal(onTime.dueLabel, 'Completed on time');
    assert.equal(late.dueLabel, 'Completed after deadline');
  });

  it('maps cancelled goals and item completion states', () => {
    const details = mapReadingGoalDetails(goalDetails({
      status: 'cancelled',
      items: [
        itemDetails('item-1', 'book-1', 'Done book', '2026-06-10'),
        itemDetails('item-2', 'book-2', 'Late book', '2026-07-02'),
        itemDetails('item-3', 'book-3', 'Pending book', null),
      ],
    }));

    assert.equal(details.dueLabel, 'Cancelled');
    assert.equal(details.items[0]?.completedStateLabel, 'Completed');
    assert.equal(details.items[1]?.completedStateLabel, 'Completed after deadline');
    assert.equal(details.items[2]?.completedStateLabel, 'Pending');
  });

  it('formats civil date labels and due states without UTC parsing', () => {
    assert.equal(formatCivilDate('2026-06-14'), 'June 14, 2026');
    assert.equal(formatDueLabel(0, false), 'Due today');
    assert.equal(formatDueLabel(1, false), 'Due in 1 day');
    assert.equal(formatDueLabel(2, false), 'Due in 2 days');
    assert.equal(formatDueLabel(-1, true), 'Overdue by 1 day');
    assert.equal(formatDueLabel(-2, true), 'Overdue by 2 days');
  });
});

function goalDetails(overrides: Partial<ReadingGoalDetails> & {
  status?: ReadingGoalDetails['goal']['status'];
  completedAt?: string | null;
} = {}): ReadingGoalDetails {
  return {
    goal: {
      id: 'goal-1',
      name: 'June goal',
      description: 'Read the stack',
      startDate: '2026-06-01',
      targetDate: '2026-06-30',
      status: overrides.status ?? 'active',
      completedAt: overrides.completedAt ?? null,
      createdAt: 1,
      updatedAt: 1,
    },
    items: overrides.items ?? [itemDetails('item-1', 'book-1', 'Done book', '2026-06-10')],
    totalBooks: overrides.totalBooks ?? 1,
    completedBooks: overrides.completedBooks ?? 1,
    pendingBooks: overrides.pendingBooks ?? 0,
    progressPercentage: overrides.progressPercentage ?? 100,
    daysRemaining: overrides.daysRemaining ?? null,
    isOverdue: overrides.isOverdue ?? false,
    isCompletedWithinDeadline: overrides.isCompletedWithinDeadline ?? false,
  } as ReadingGoalDetails;
}

function itemDetails(
  itemId: string,
  libraryBookId: string,
  title: string,
  completedAt: string | null,
): ReadingGoalDetails['items'][number] {
  return {
    item: {
      id: itemId,
      readingGoalId: 'goal-1',
      libraryBookId,
      position: 0,
      completedAt,
      addedAt: 1,
      createdAt: 1,
      updatedAt: 1,
    },
    libraryBook: {
      id: libraryBookId,
      workId: `work-${libraryBookId}`,
      status: completedAt ? 'read' : 'to_read',
      rating: null,
      notes: null,
      createdAt: 1,
      updatedAt: 1,
    },
    work: {
      id: `work-${libraryBookId}`,
      title,
      originalTitle: null,
      description: null,
      createdAt: 1,
      updatedAt: 1,
    },
    authors: [{ id: 'author-1', name: 'Author One', createdAt: 1, updatedAt: 1 }],
  } as ReadingGoalDetails['items'][number];
}

