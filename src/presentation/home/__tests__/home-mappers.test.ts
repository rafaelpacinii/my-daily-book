import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type {
  DailyReadingSummary,
  LibraryBookSummary,
  LibraryOverview,
  ReadingGoalDetails,
  ReadingStreak,
} from '@/src/application';
import { createHomeViewModel } from '@/src/presentation/home/home-mappers';

describe('home mappers', () => {
  it('maps empty public data to an empty Home view model', () => {
    const viewModel = createHomeViewModel({
      libraryOverview: overview(),
      currentlyReading: [],
      todaySummary: dailySummary(),
      streak: streak(),
      activeGoals: [],
      today: '2026-06-14',
    });

    assert.equal(viewModel.libraryOverview.total, 0);
    assert.equal(viewModel.todaySummary.logCount, 0);
    assert.equal(viewModel.currentlyReading.length, 0);
    assert.equal(viewModel.streak.current, 0);
    assert.equal(viewModel.activeGoals.length, 0);
  });

  it('maps currently reading books, active goals and deadline labels', () => {
    const viewModel = createHomeViewModel({
      libraryOverview: overview({ total: 4, reading: 1, owned: 3 }),
      currentlyReading: [currentlyReadingBook({ coverUrl: 'https://example.com/cover.jpg' })],
      todaySummary: dailySummary({ pagesRead: 42, durationSeconds: 4500, logCount: 2, booksRead: 1 }),
      streak: streak({ currentStreak: 2, longestStreak: 5 }),
      activeGoals: [
        goal({ id: 'later', targetDate: '2026-06-26' }),
        goal({ id: 'overdue', targetDate: '2026-06-11' }),
      ],
      today: '2026-06-14',
    });

    assert.equal(viewModel.libraryOverview.reading, 1);
    assert.equal(viewModel.currentlyReading[0]?.title, 'Mapped Book');
    assert.equal(viewModel.currentlyReading[0]?.coverUrl, 'https://example.com/cover.jpg');
    assert.equal(viewModel.currentlyReading[0]?.currentPage, 120);
    assert.equal(viewModel.currentlyReading[0]?.pageCount, 300);
    assert.equal(viewModel.todaySummary.pagesRead, 42);
    assert.equal(viewModel.streak.longest, 5);
    assert.equal(viewModel.activeGoals[0]?.id, 'overdue');
    assert.equal(viewModel.activeGoals[0]?.dueLabel, 'Overdue by 3 days');
    assert.equal(viewModel.activeGoals[1]?.dueLabel, 'Due in 12 days');
  });

  it('normalizes supported cover urls and drops invalid ones for the Home view', () => {
    const viewModel = createHomeViewModel({
      libraryOverview: overview(),
      currentlyReading: [
        currentlyReadingBook({ coverUrl: 'http://example.com/cover.jpg' }),
        currentlyReadingBook({ coverUrl: 'file:///covers/local-cover.jpg' }),
        currentlyReadingBook({ coverUrl: 'https://' }),
      ],
      todaySummary: dailySummary(),
      streak: streak(),
      activeGoals: [],
      today: '2026-06-14',
    });

    assert.equal(viewModel.currentlyReading[0]?.coverUrl, 'https://example.com/cover.jpg');
    assert.equal(viewModel.currentlyReading[1]?.coverUrl, 'file:///covers/local-cover.jpg');
    assert.equal(viewModel.currentlyReading[2]?.coverUrl, null);
  });
});

function overview(input: Partial<LibraryOverview> = {}): LibraryOverview {
  return {
    total: 0,
    toRead: 0,
    reading: 0,
    read: 0,
    dropped: 0,
    owned: 0,
    notOwned: 0,
    physicalCopies: 0,
    digitalCopies: 0,
    ...input,
  };
}

function dailySummary(input: Partial<DailyReadingSummary> = {}): DailyReadingSummary {
  return {
    readingDate: '2026-06-14',
    pagesRead: 0,
    durationSeconds: 0,
    logCount: 0,
    booksRead: 0,
    logs: [],
    ...input,
  };
}

function streak(input: Partial<ReadingStreak> = {}): ReadingStreak {
  return {
    currentStreak: 0,
    longestStreak: 0,
    latestReadingDate: null,
    ...input,
  };
}

function currentlyReadingBook(
  input: Partial<LibraryBookSummary> = {},
): LibraryBookSummary {
  return {
    libraryBook: { id: 'book-1', status: 'reading', workId: 'work-1' },
    work: { id: 'work-1', title: 'Mapped Book' },
    authors: [{ id: 'author-1', name: 'Author Name' }],
    copies: [{ format: 'digital' }],
    activeReadingCycle: { lastReadAt: '2026-06-14' },
    latestReadingCycle: null,
    currentPage: 120,
    pageCount: 300,
    progressPercentage: 40,
    coverUrl: null,
    ...input,
  } as unknown as LibraryBookSummary;
}

function goal(input: { id: string; targetDate: string }): ReadingGoalDetails {
  return {
    goal: {
      id: input.id,
      name: `Goal ${input.id}`,
      targetDate: input.targetDate,
      status: 'active',
    },
    items: [],
    totalBooks: 4,
    completedBooks: 1,
    pendingBooks: 3,
    progressPercentage: 25,
    daysRemaining: null,
    isOverdue: false,
    isCompletedWithinDeadline: false,
  } as unknown as ReadingGoalDetails;
}
