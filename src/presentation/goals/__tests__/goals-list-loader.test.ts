import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ApplicationApi, ReadingGoalDetails } from '@/src/application';

import { loadReadingGoalsListViewModel } from '../goals-list-loader';

describe('reading goals list loader', () => {
  it('loads empty goals through the public goals API', async () => {
    const viewModel = await loadReadingGoalsListViewModel(createApi([]));

    assert.deepEqual(viewModel, { active: [], completed: [], cancelled: [] });
    assert.deepEqual(calls, ['listGoals']);
  });

  it('splits active, completed and cancelled goals', async () => {
    const viewModel = await loadReadingGoalsListViewModel(createApi([
      goalDetails('active-1', 'Active goal', 'active'),
      goalDetails('completed-1', 'Completed goal', 'completed'),
      goalDetails('cancelled-1', 'Cancelled goal', 'cancelled'),
    ]));

    assert.equal(viewModel.active[0]?.name, 'Active goal');
    assert.equal(viewModel.completed[0]?.dueLabel, 'Completed after deadline');
    assert.equal(viewModel.cancelled[0]?.dueLabel, 'Cancelled');
  });

  it('propagates loading errors for retry state', async () => {
    const error = new Error('boom');
    const api = createApi([], () => {
      throw error;
    });

    await assert.rejects(() => loadReadingGoalsListViewModel(api), error);
  });
});

let calls: string[] = [];

function createApi(
  items: ReadingGoalDetails[],
  listGoals?: ApplicationApi['goals']['listGoals'],
): ApplicationApi {
  calls = [];
  const goals = {
    listGoals: listGoals ?? (() => {
      calls.push('listGoals');
      return {
        items,
        total: items.length,
        limit: 200,
        offset: 0,
        hasMore: false,
      };
    }),
  } as unknown as ApplicationApi['goals'];

  return { goals } as unknown as ApplicationApi;
}

function goalDetails(
  id: string,
  name: string,
  status: ReadingGoalDetails['goal']['status'],
): ReadingGoalDetails {
  return {
    goal: {
      id,
      name,
      description: null,
      startDate: '2026-06-01',
      targetDate: '2026-06-30',
      status,
      completedAt: status === 'completed' ? '2026-07-01' : null,
      createdAt: 1,
      updatedAt: 1,
    },
    items: [],
    totalBooks: 0,
    completedBooks: 0,
    pendingBooks: 0,
    progressPercentage: 0,
    daysRemaining: status === 'active' ? -3 : null,
    isOverdue: status === 'active',
    isCompletedWithinDeadline: false,
  } as ReadingGoalDetails;
}

