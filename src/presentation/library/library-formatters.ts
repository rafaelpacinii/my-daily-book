import { i18n } from '@/src/localization/i18n';

export function formatLibraryStatus(status: 'all' | 'to_read' | 'reading' | 'read' | 'dropped'): string {
  if (status === 'all') return t('library.formatters.all');
  if (status === 'to_read') return t('library.formatters.toRead');
  if (status === 'reading') return t('library.formatters.reading');
  if (status === 'read') return t('library.formatters.read');
  return t('library.formatters.dropped');
}

export function formatBookFormat(format: 'physical' | 'digital'): string {
  if (format === 'physical') return t('library.formatters.physical');
  return t('library.formatters.digital');
}

export function formatAuthors(authors: string[]): string {
  return authors.length > 0 ? authors.join(', ') : t('library.formatters.unknownAuthor');
}

export function formatCopyCount(count: number): string {
  if (count === 0) return t('library.formatters.noCopies');
  return t('library.formatters.copy', { count });
}

export function formatPageCount(pageCount: number | null): string | null {
  if (pageCount == null) return null;
  return t('library.formatters.page', { count: pageCount });
}

export function formatDuration(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  if (safeSeconds === 0) return t('library.formatters.zeroMinutes');
  if (safeSeconds < 60) return t('library.formatters.lessThanMinute');

  const totalMinutes = Math.floor(safeSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

export function normalizeHttpsUrl(url: string | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'file:' || parsed.protocol === 'content:') {
      return parsed.toString();
    }

    return parsed.protocol === 'http:' ? parsed.toString().replace(/^http:/, 'https:') : null;
  } catch {
    return null;
  }
}

export function isHttpUrl(url: string | null): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function trimOptional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isValidCivilDate(value: string): boolean {
  if (value.trim().length === 0) return true;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;

  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= maxDay;
}

function t(key: string, options?: Record<string, unknown>): string {
  return String(i18n.t(key, options));
}
