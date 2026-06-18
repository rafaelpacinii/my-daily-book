import { isValidCivilDate } from '@/src/presentation/reading/reading-formatters';

export interface BookListFormState {
  name: string;
  description: string;
}

export interface AddListItemFormState {
  workId: string | null;
  editionId: string | null;
  notes: string;
}

export interface WishlistItemFormState extends AddListItemFormState {
  wishlistPriority: 'low' | 'medium' | 'high';
  desiredFormat: 'physical' | 'digital' | 'any';
  targetPrice: string;
  targetCurrency: string;
}

export interface PurchaseLinkFormState {
  storeName: string;
  url: string;
  price: string;
  currency: string;
  notes: string;
}

export interface MarkAsPurchasedFormState {
  editionId: string | null;
  format: 'physical' | 'digital';
  label: string;
  notes: string;
  acquiredAt: string;
}

export function validateBookListForm(form: BookListFormState) {
  const name = form.name.trim();
  if (!name) return invalid('Name is required.');

  return valid({
    name,
    description: form.description.trim() || null,
  });
}

export function validateAddListItemForm(form: AddListItemFormState) {
  if (!form.workId) return invalid('Select a book.');

  return valid({
    workId: form.workId,
    editionId: form.editionId,
    notes: form.notes.trim() || null,
  });
}

export function validateWishlistItemForm(form: WishlistItemFormState) {
  const base = validateAddListItemForm(form);
  if (!base.valid || !base.input) return base;

  const money = parseMoney(form.targetPrice, form.targetCurrency);
  if (!money.valid) return invalid(money.message);

  return valid({
    ...base.input,
    wishlistPriority: form.wishlistPriority,
    desiredFormat: form.desiredFormat,
    targetPrice: money.price,
    targetCurrency: money.currency,
  });
}

export function validatePurchaseLinkForm(form: PurchaseLinkFormState) {
  const url = form.url.trim();
  if (!url) return invalid('URL is required.');

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return invalid('URL must use http or https.');
    }
  } catch {
    return invalid('URL must be valid.');
  }

  const money = parseMoney(form.price, form.currency);
  if (!money.valid) return invalid(money.message);

  return valid({
    storeName: form.storeName.trim() || null,
    url,
    price: money.price,
    currency: money.currency,
    notes: form.notes.trim() || null,
  });
}

export function validateMarkAsPurchasedForm(form: MarkAsPurchasedFormState) {
  if (!form.editionId) return invalid('Select an edition.');

  const acquiredAt = form.acquiredAt.trim();
  if (acquiredAt && !isValidCivilDate(acquiredAt)) {
    return invalid('Use a valid acquisition date in YYYY-MM-DD format.');
  }

  return valid({
    editionId: form.editionId,
    format: form.format,
    label: form.label.trim() || null,
    notes: form.notes.trim() || null,
    acquiredAt: acquiredAt || null,
  });
}

function parseMoney(priceValue: string, currencyValue: string) {
  const priceText = priceValue.trim();
  const currencyText = currencyValue.trim();
  const price = priceText ? Number(priceText) : null;
  const currency = currencyText || null;

  if (price != null && (!Number.isFinite(price) || price < 0)) {
    return { valid: false as const, message: 'Price cannot be negative.', price: null, currency: null };
  }

  if (currency != null && !/^[A-Z]{3}$/.test(currency)) {
    return { valid: false as const, message: 'Currency must be three uppercase letters.', price: null, currency: null };
  }

  return { valid: true as const, message: null, price, currency };
}

function valid<T>(input: T) {
  return { valid: true as const, message: null, input };
}

function invalid(message: string) {
  return { valid: false as const, message, input: null };
}
