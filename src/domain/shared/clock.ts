import { getTodayIsoDate } from './date';

export interface Clock {
  today(): string;
  now(): number;
}

export const systemClock: Clock = {
  today: getTodayIsoDate,
  now: Date.now,
};

