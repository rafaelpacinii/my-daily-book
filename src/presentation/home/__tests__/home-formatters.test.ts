import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  calculateCivilDaysBetween,
  formatCivilDate,
  formatDuration,
  formatGoalDueLabel,
  getGreetingForHour,
  pluralize,
} from '@/src/presentation/home/home-formatters';

describe('home formatters', () => {
  it('formats local greetings by hour', () => {
    assert.equal(getGreetingForHour(8), 'Good morning');
    assert.equal(getGreetingForHour(14), 'Good afternoon');
    assert.equal(getGreetingForHour(20), 'Good evening');
    assert.equal(getGreetingForHour(8, 'pt-BR'), 'Bom dia');
    assert.equal(getGreetingForHour(14, 'pt-BR'), 'Boa tarde');
    assert.equal(getGreetingForHour(20, 'pt-BR'), 'Boa noite');
  });

  it('formats durations without external libraries', () => {
    assert.equal(formatDuration(-30), '0 min');
    assert.equal(formatDuration(Number.NaN), '0 min');
    assert.equal(formatDuration(0), '0 min');
    assert.equal(formatDuration(45), '< 1 min');
    assert.equal(formatDuration(600), '10 min');
    assert.equal(formatDuration(3600), '1h');
    assert.equal(formatDuration(4500), '1h 15min');
  });

  it('pluralizes units', () => {
    assert.equal(pluralize(1, 'day'), '1 day');
    assert.equal(pluralize(2, 'day'), '2 days');
  });

  it('formats civil dates without UTC date parsing', () => {
    assert.equal(formatCivilDate('2026-06-14'), 'June 14, 2026');
    assert.equal(formatCivilDate('2026-06-14', 'pt-BR'), '14 de junho de 2026');
    assert.equal(formatCivilDate('2026-02-31'), '2026-02-31');
  });

  it('formats goal deadlines', () => {
    assert.equal(formatGoalDueLabel(12, false), 'Due in 12 days');
    assert.equal(formatGoalDueLabel(0, false), 'Due today');
    assert.equal(formatGoalDueLabel(-3, false), 'Overdue by 3 days');
    assert.equal(formatGoalDueLabel(4, true), 'Completed');
  });

  it('calculates civil day distance', () => {
    assert.equal(calculateCivilDaysBetween('2026-06-14', '2026-06-14'), 0);
    assert.equal(calculateCivilDaysBetween('2026-06-14', '2026-06-26'), 12);
    assert.equal(calculateCivilDaysBetween('2026-06-14', '2026-06-11'), -3);
  });
});
