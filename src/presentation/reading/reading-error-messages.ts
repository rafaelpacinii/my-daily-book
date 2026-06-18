import { describePublicError } from '@/src/application';
import { i18n } from '@/src/localization/i18n';

type ReadingFallbackKey =
  | 'loadLibrary'
  | 'loadCycle'
  | 'loadLog'
  | 'loadReading'
  | 'loadHistory'
  | 'loadStatistics'
  | 'start'
  | 'saveLog'
  | 'deleteLog'
  | 'complete'
  | 'drop';

export function mapReadingErrorMessage(error: unknown, fallbackKey: ReadingFallbackKey): string {
  if (error instanceof Error) {
    const message = error.message;

    if (message.includes('already has an active reading cycle')) return t('reading.errors.activeCycleExists');
    if (message.includes('can only be added to active cycles')) return t('reading.errors.cycleNotActive');
    if (message.includes('only active reading cycles')) return t('reading.errors.cycleNotActive');
    if (message.includes('discontinuous')) return t('reading.errors.continuityGap');
    if (message.includes('overlap')) return t('reading.errors.overlap');
    if (message.includes('needs at least one log before completion')) return t('reading.errors.completeRequiresLog');
    if (message.includes('before reaching the last page')) return t('reading.errors.completeRequiresLastPage');
  }

  const descriptor = describePublicError(error);

  if (
    descriptor.category === 'validation' ||
    descriptor.category === 'conflict' ||
    descriptor.category === 'database' ||
    descriptor.category === 'unknown' ||
    descriptor.category === 'not_found'
  ) {
    return t(`reading.errors.${fallbackKey}`);
  }

  return t(`reading.errors.${fallbackKey}`);
}

function t(key: string): string {
  return String(i18n.t(key));
}
