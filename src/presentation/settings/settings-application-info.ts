import Constants from 'expo-constants';

import type { BackupApi } from '@/src/application';
import { i18n } from '@/src/localization/i18n';

import type { ApplicationInfoViewModel } from './settings-types';

export function mapApplicationInfo(api: BackupApi): ApplicationInfoViewModel {
  return {
    appName: Constants.expoConfig?.name ?? 'My Daily Book',
    version: Constants.expoConfig?.version ?? t('settings.application.unavailable'),
    buildNumber: readBuildNumber(),
    databaseSchemaVersion: String(api.constants.databaseSchemaVersion),
    backupFormatVersion: String(api.constants.backupFormatVersion),
    privacyNote: t('settings.application.privacyNote'),
  };
}

function readBuildNumber(): string {
  const iosBuildNumber = Constants.expoConfig?.ios?.buildNumber;
  const androidVersionCode = Constants.expoConfig?.android?.versionCode;

  if (iosBuildNumber) return iosBuildNumber;
  if (androidVersionCode != null) return String(androidVersionCode);
  return t('settings.application.unavailable');
}

function t(key: string): string {
  return String(i18n.t(key));
}
