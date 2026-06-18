import { i18n } from '@/src/localization/i18n';

export function getLibraryEmptyStateContent(searching: boolean) {
  return {
    icon: searching ? 'search-outline' : 'library-outline',
    title: searching ? t('library.screen.searchEmptyTitle') : t('library.screen.emptyTitle'),
    description: searching
      ? t('library.screen.searchEmptyDescription')
      : t('library.screen.emptyDescription'),
    actionLabel: searching ? t('library.screen.searchEmptyAction') : t('library.screen.emptyAction'),
  } as const;
}

function t(key: string): string {
  return String(i18n.t(key));
}
