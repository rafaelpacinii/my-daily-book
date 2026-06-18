import * as queries from '@/src/application/queries/goals';
import {
  addBookToReadingGoal,
  cancelReadingGoal,
  completeReadingGoalItem,
  createReadingGoal,
  recalculateReadingGoal,
  removeBookFromReadingGoal,
  updateReadingGoal,
} from '@/src/application/use-cases/goals';

export const goalsApi = {
  listGoals: queries.listReadingGoals,
  getGoalDetails: queries.getReadingGoalDetails,
  getActiveGoals: queries.getActiveReadingGoals,
  createGoal: createReadingGoal,
  updateGoal: updateReadingGoal,
  cancelGoal: cancelReadingGoal,
  addBook: addBookToReadingGoal,
  removeBook: removeBookFromReadingGoal,
  completeItem: completeReadingGoalItem,
  recalculateGoal: recalculateReadingGoal,
};

export type GoalsApi = typeof goalsApi;

