import * as FileSystem from 'expo-file-system/legacy';

import type { AppearancePreferenceStore, ThemeMode } from '@/src/theme';

const PREFERENCE_FILE_URI = `${FileSystem.documentDirectory ?? ''}preferences/appearance.json`;
const VALID_PREFERENCES = new Set<ThemeMode>(['system', 'light', 'dark']);

let memoryPreference: ThemeMode = 'system';

export const appearancePreferenceStore: AppearancePreferenceStore = {
  async getPreference() {
    if (canUseWebStorage()) {
      return normalizePreference(globalThis.localStorage.getItem('myDailyBook.appearance'));
    }

    if (!FileSystem.documentDirectory) {
      return memoryPreference;
    }

    try {
      const info = await FileSystem.getInfoAsync(PREFERENCE_FILE_URI);
      if (!info.exists) return 'system';

      const raw = await FileSystem.readAsStringAsync(PREFERENCE_FILE_URI, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const parsed = JSON.parse(raw) as Partial<{ preference: string }>;

      return normalizePreference(parsed.preference);
    } catch {
      return 'system';
    }
  },

  async setPreference(preference) {
    memoryPreference = preference;

    if (canUseWebStorage()) {
      globalThis.localStorage.setItem('myDailyBook.appearance', preference);
      return;
    }

    if (!FileSystem.documentDirectory) return;

    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}preferences/`, {
      intermediates: true,
    });
    await FileSystem.writeAsStringAsync(
      PREFERENCE_FILE_URI,
      JSON.stringify({ preference }),
      { encoding: FileSystem.EncodingType.UTF8 },
    );
  },

  async clearPreference() {
    memoryPreference = 'system';

    if (canUseWebStorage()) {
      globalThis.localStorage.removeItem('myDailyBook.appearance');
      return;
    }

    if (!FileSystem.documentDirectory) return;

    const info = await FileSystem.getInfoAsync(PREFERENCE_FILE_URI);
    if (info.exists) {
      await FileSystem.deleteAsync(PREFERENCE_FILE_URI, { idempotent: true });
    }
  },
};

function normalizePreference(value: unknown): ThemeMode {
  return typeof value === 'string' && VALID_PREFERENCES.has(value as ThemeMode)
    ? (value as ThemeMode)
    : 'system';
}

function canUseWebStorage(): boolean {
  try {
    return typeof globalThis.localStorage !== 'undefined';
  } catch {
    return false;
  }
}
