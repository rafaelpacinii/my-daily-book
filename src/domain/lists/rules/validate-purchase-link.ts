import { ValidationError } from '../../errors';
import { validateOptionalMoney } from '../../shared';

export function normalizePurchaseLinkUrl(url: string): string {
  return url.trim();
}

export function validatePurchaseLink(url: string, price?: number | null, currency?: string | null): void {
  const normalizedUrl = normalizePurchaseLinkUrl(url);

  if (normalizedUrl.length === 0) {
    throw new ValidationError('purchase link URL is required.');
  }

  try {
    const parsedUrl = new URL(normalizedUrl);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new ValidationError('purchase link URL must use http or https.');
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new ValidationError('purchase link URL must be valid.', { cause: error });
  }

  validateOptionalMoney(price, currency);
}

