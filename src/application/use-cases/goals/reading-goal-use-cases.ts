import {
  createReadingGoalItem,
  createReadingGoalRecord,
  deleteReadingGoalItem,
  findReadingGoalById,
  findReadingGoalItemById,
  findReadingGoalWithItems,
  listReadingGoalItems,
  listReadingGoals as listReadingGoalRecords,
  updateReadingGoal as updateReadingGoalRecord,
  updateReadingGoalItem,
} from '@/src/database/repositories/reading-goal-repository';
import type { DatabaseTransaction } from '@/src/database/repositories/shared';
import { findLibraryBookById } from '@/src/database/repositories/library-book-repository';
import { listReadingCyclesByLibraryBookId } from '@/src/database/repositories/reading-cycle-repository';
import type { ReadingGoal, ReadingGoalItem } from '@/src/database/types';
import {
  assertNoDuplicateGoalBooks,
  determineReadingGoalStatus,
  validateReadingGoalDates,
  validateReadingGoalName,
} from '@/src/domain/goals';
import { ReadingGoalNotFoundError } from '@/src/domain/errors';

import {
  hasCompletedCycleInDateRange,
  requireEntity,
  resolveUseCaseDependencies,
  runUseCaseTransaction,
  type UseCaseDependencies,
} from '../shared';

export interface CreateReadingGoalItemInput {
  libraryBookId: string;
  position?: number | null;
}

export interface CreateReadingGoalInput {
  name: string;
  description?: string | null;
  startDate: string;
  targetDate: string;
  items?: CreateReadingGoalItemInput[];
}

export interface UpdateReadingGoalInput {
  id: string;
  name?: string;
  description?: string | null;
  startDate?: string;
  targetDate?: string;
}

export interface ReadingGoalResult {
  readingGoal: ReadingGoal;
  items: ReadingGoalItem[];
}

export interface AddBookToReadingGoalInput {
  readingGoalId: string;
  libraryBookId: string;
  position?: number | null;
}

export function createReadingGoal(
  input: CreateReadingGoalInput,
  dependencies?: UseCaseDependencies,
): ReadingGoalResult {
  const { clock, idGenerator } = resolveUseCaseDependencies(dependencies);
  validateReadingGoalName(input.name);
  validateReadingGoalDates(input.startDate, input.targetDate);
  assertNoDuplicateGoalBooks((input.items ?? []).map((item) => item.libraryBookId));

  return runUseCaseTransaction((tx) => {
    for (const item of input.items ?? []) {
      requireEntity(findLibraryBookById(item.libraryBookId, tx), 'LibraryBook', item.libraryBookId);
    }

    const timestamp = clock.now();
    const readingGoal = createReadingGoalRecord(
      {
        id: idGenerator.generate(),
        name: input.name.trim(),
        description: input.description ?? null,
        startDate: input.startDate,
        targetDate: input.targetDate,
        status: 'active',
        completedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      tx,
    );
    const items = (input.items ?? []).map((item) =>
      createReadingGoalItem(
        {
          id: idGenerator.generate(),
          readingGoalId: readingGoal.id,
          libraryBookId: item.libraryBookId,
          position: item.position ?? null,
          completedAt: null,
          addedAt: timestamp,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        tx,
      ),
    );

    return { readingGoal, items };
  });
}

export function updateReadingGoal(
  input: UpdateReadingGoalInput,
): ReadingGoalResult {
  return runUseCaseTransaction((tx) => {
    const existing = requireEntity(findReadingGoalById(input.id, tx), 'ReadingGoal', input.id);
    const name = input.name === undefined ? existing.name : input.name.trim();
    const startDate = input.startDate ?? existing.startDate;
    const targetDate = input.targetDate ?? existing.targetDate;
    validateReadingGoalName(name);
    validateReadingGoalDates(startDate, targetDate);

    const readingGoal = requireEntity(
      updateReadingGoalRecord(
        input.id,
        {
          name,
          description: input.description === undefined ? existing.description : input.description,
          startDate,
          targetDate,
        },
        tx,
      ),
      'ReadingGoal',
      input.id,
    );

    return recalculateReadingGoalInTransaction(readingGoal.id, tx, null);
  });
}

export function cancelReadingGoal(id: string): ReadingGoal {
  return runUseCaseTransaction((tx) => {
    requireEntity(findReadingGoalById(id, tx), 'ReadingGoal', id);

    return requireEntity(
      updateReadingGoalRecord(id, { status: 'cancelled', completedAt: null }, tx),
      'ReadingGoal',
      id,
    );
  });
}

export function addBookToReadingGoal(
  input: AddBookToReadingGoalInput,
  dependencies?: UseCaseDependencies,
): ReadingGoalResult {
  const { clock, idGenerator } = resolveUseCaseDependencies(dependencies);

  return runUseCaseTransaction((tx) => {
    const goalWithItems = findReadingGoalWithItems(input.readingGoalId, tx);

    if (!goalWithItems) {
      throw new ReadingGoalNotFoundError('reading goal was not found.');
    }

    requireEntity(findLibraryBookById(input.libraryBookId, tx), 'LibraryBook', input.libraryBookId);
    assertNoDuplicateGoalBooks([
      ...goalWithItems.items.map(({ item }) => item.libraryBookId),
      input.libraryBookId,
    ]);

    const timestamp = clock.now();
    createReadingGoalItem(
      {
        id: idGenerator.generate(),
        readingGoalId: input.readingGoalId,
        libraryBookId: input.libraryBookId,
        position: input.position ?? null,
        completedAt: null,
        addedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      tx,
    );

    return recalculateReadingGoalInTransaction(input.readingGoalId, tx, clock.today());
  });
}

export function removeBookFromReadingGoal(itemId: string, dependencies?: UseCaseDependencies): ReadingGoalResult {
  const { clock } = resolveUseCaseDependencies(dependencies);

  return runUseCaseTransaction((tx) => {
    const item = requireEntity(findReadingGoalItemById(itemId, tx), 'ReadingGoalItem', itemId);
    deleteReadingGoalItem(itemId, tx);

    return recalculateReadingGoalInTransaction(item.readingGoalId, tx, clock.today());
  });
}

export function completeReadingGoalItem(
  itemId: string,
  completedAt: string,
  dependencies?: UseCaseDependencies,
): ReadingGoalResult {
  const { clock } = resolveUseCaseDependencies(dependencies);

  return runUseCaseTransaction((tx) => {
    const item = requireEntity(findReadingGoalItemById(itemId, tx), 'ReadingGoalItem', itemId);
    const goal = requireEntity(findReadingGoalById(item.readingGoalId, tx), 'ReadingGoal', item.readingGoalId);
    validateReadingGoalDates(goal.startDate, goal.targetDate);
    updateReadingGoalItem(item.id, { completedAt }, tx);

    return recalculateReadingGoalInTransaction(goal.id, tx, clock.today());
  });
}

export function recalculateReadingGoal(
  id: string,
  dependencies?: UseCaseDependencies,
): ReadingGoalResult {
  const { clock } = resolveUseCaseDependencies(dependencies);

  return runUseCaseTransaction((tx) => recalculateReadingGoalInTransaction(id, tx, clock.today()));
}

export function recalculateReadingGoalsForLibraryBookInTransaction(
  libraryBookId: string,
  tx: DatabaseTransaction,
  completedAtWhenAllDone: string | null,
): ReadingGoalResult[] {
  return listReadingGoalRecords({ limit: 200 }, tx)
    .filter((goal) =>
      listReadingGoalItems(goal.id, tx).some((item) => item.libraryBookId === libraryBookId),
    )
    .map((goal) => recalculateReadingGoalInTransaction(goal.id, tx, completedAtWhenAllDone));
}

export function recalculateReadingGoalInTransaction(
  id: string,
  tx: DatabaseTransaction,
  completedAtWhenAllDone: string | null,
): ReadingGoalResult {
  const goal = requireEntity(findReadingGoalById(id, tx), 'ReadingGoal', id);

  if (goal.status === 'cancelled') {
    return { readingGoal: goal, items: listReadingGoalItems(goal.id, tx) };
  }

  const items = listReadingGoalItems(goal.id, tx);

  if (items.length === 0) {
    const activeGoal = requireEntity(
      updateReadingGoalRecord(goal.id, { status: 'active', completedAt: null }, tx),
      'ReadingGoal',
      goal.id,
    );

    return { readingGoal: activeGoal, items };
  }

  const recalculatedItems = items.map((item) => {
    const cycles = listReadingCyclesByLibraryBookId(item.libraryBookId, tx);
    const completedAt =
      hasCompletedCycleInDateRange(cycles, goal.startDate, goal.targetDate) ?? item.completedAt;

    if (completedAt !== item.completedAt) {
      return requireEntity(
        updateReadingGoalItem(item.id, { completedAt }, tx),
        'ReadingGoalItem',
        item.id,
      );
    }

    return item;
  });
  const nextStatus = determineReadingGoalStatus(
    recalculatedItems.map((item) => item.completedAt),
    goal.status,
  );
  const readingGoal = requireEntity(
    updateReadingGoalRecord(
      goal.id,
      {
        status: nextStatus,
        completedAt:
          nextStatus === 'completed'
            ? (goal.completedAt ?? completedAtWhenAllDone)
            : null,
      },
      tx,
    ),
    'ReadingGoal',
    goal.id,
  );

  return { readingGoal, items: recalculatedItems };
}
