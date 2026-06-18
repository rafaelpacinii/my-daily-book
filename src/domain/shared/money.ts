import { ValidationError } from '../errors';

const ISO_4217_PATTERN = /^[A-Z]{3}$/;

export function validateOptionalMoney(price?: number | null, currency?: string | null): void {
  if (price != null && price < 0) {
    throw new ValidationError('price must be greater than or equal to zero.');
  }

  if (currency != null && !ISO_4217_PATTERN.test(currency)) {
    throw new ValidationError('currency must be an uppercase ISO 4217 code.');
  }
}

export function isValidCurrencyCode(currency: string): boolean {
  return ISO_4217_PATTERN.test(currency);
}

