import type { AppearancePreferenceStore, ThemeMode } from '@/src/theme';

export function createMemoryAppearancePreferenceStore(
  initialPreference: ThemeMode = 'system',
): AppearancePreferenceStore {
  let preference = initialPreference;

  return {
    async getPreference() {
      return preference;
    },
    async setPreference(nextPreference) {
      preference = nextPreference;
    },
    async clearPreference() {
      preference = 'system';
    },
  };
}
