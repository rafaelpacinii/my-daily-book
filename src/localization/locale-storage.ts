import * as FileSystem from 'expo-file-system/legacy';

import { isSupportedLocale, type LocalePreferenceStore, type SupportedLocale } from './locale-types';

const LOCALE_FILE_URI = `${FileSystem.documentDirectory ?? ''}preferences/locale.json`;

let memoryLocale: SupportedLocale | null = null;

export const localePreferenceStore: LocalePreferenceStore = {
  async getLocale() {
    if (canUseWebStorage()) {
      return normalizeLocale(globalThis.localStorage.getItem('myDailyBook.locale'));
    }

    if (!FileSystem.documentDirectory) return memoryLocale;

    try {
      const info = await FileSystem.getInfoAsync(LOCALE_FILE_URI);
      if (!info.exists) return null;

      const raw = await FileSystem.readAsStringAsync(LOCALE_FILE_URI, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const parsed = JSON.parse(raw) as Partial<{ locale: unknown }>;

      return normalizeLocale(parsed.locale);
    } catch {
      return null;
    }
  },

  async setLocale(locale) {
    memoryLocale = locale;

    if (canUseWebStorage()) {
      globalThis.localStorage.setItem('myDailyBook.locale', locale);
      return;
    }

    if (!FileSystem.documentDirectory) return;

    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}preferences/`, {
      intermediates: true,
    });
    await FileSystem.writeAsStringAsync(LOCALE_FILE_URI, JSON.stringify({ locale }), {
      encoding: FileSystem.EncodingType.UTF8,
    });
  },

  async clearLocale() {
    memoryLocale = null;

    if (canUseWebStorage()) {
      globalThis.localStorage.removeItem('myDailyBook.locale');
      return;
    }

    if (!FileSystem.documentDirectory) return;

    const info = await FileSystem.getInfoAsync(LOCALE_FILE_URI);
    if (info.exists) {
      await FileSystem.deleteAsync(LOCALE_FILE_URI, { idempotent: true });
    }
  },
};

function normalizeLocale(value: unknown): SupportedLocale | null {
  return isSupportedLocale(value) ? value : null;
}

function canUseWebStorage(): boolean {
  try {
    return typeof globalThis.localStorage !== 'undefined';
  } catch {
    return false;
  }
}
