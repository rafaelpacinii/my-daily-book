import { InvalidDateError } from '../errors';

export type IsoDate = string;

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1) {
    return false;
  }

  return day <= daysInMonth(year, month);
}

export function assertValidIsoDate(value: string, fieldName = 'date'): void {
  if (!isValidIsoDate(value)) {
    throw new InvalidDateError(`${fieldName} must be a valid YYYY-MM-DD date.`);
  }
}

export function compareIsoDates(left: string, right: string): number {
  assertValidIsoDate(left, 'left date');
  assertValidIsoDate(right, 'right date');

  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

export function isFutureDate(value: string, today: string): boolean {
  return compareIsoDates(value, today) > 0;
}

export function isPastDate(value: string, today: string): boolean {
  return compareIsoDates(value, today) < 0;
}

export function isSameDate(left: string, right: string): boolean {
  return compareIsoDates(left, right) === 0;
}

export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function isLeapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

