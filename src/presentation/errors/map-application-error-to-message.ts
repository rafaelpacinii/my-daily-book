import { describePublicError } from '@/src/application';
import { i18n } from '@/src/localization/i18n';

export interface VisualErrorMessage {
  title: string;
  description: string;
}

export function mapApplicationErrorToMessage(error: unknown): VisualErrorMessage {
  const descriptor = describePublicError(error);

  if (descriptor.category === 'validation') {
    return {
      title: t('bootstrap.validationTitle'),
      description: t('bootstrap.validationDescription'),
    };
  }

  if (descriptor.category === 'database') {
    return {
      title: t('bootstrap.databaseTitle'),
      description: t('bootstrap.databaseDescription'),
    };
  }

  return {
    title: t('bootstrap.genericTitle'),
    description: t('bootstrap.genericDescription'),
  };
}

function t(key: string): string {
  return String(i18n.t(key));
}
