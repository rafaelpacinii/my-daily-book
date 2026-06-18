import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { BackupApi, BackupFile } from '@/src/application';
import { i18n } from '@/src/localization/i18n';
import type { ThemeMode } from '@/src/theme';

import { runDriveConnectAction } from './settings-drive-actions';
import { mapApplicationInfo } from './settings-application-info';
import {
  mapBackupSummary,
  mapDriveBackup,
  mapDriveConnectionState,
  mapDriveStatusLabel,
  mapLocalBackup,
  mapRestoreResult,
  mapSettingsError,
  type DriveConnectionStatusResult,
} from './settings-mappers';
import type {
  BackupSummaryViewModel,
  DriveBackupViewModel,
  LocalBackupViewModel,
  SettingsViewModel,
} from './settings-types';

export interface UseSettingsScreenInput {
  backupApi: BackupApi;
  appearance: {
    mode: ThemeMode;
    resolvedMode: 'light' | 'dark';
    setMode: (mode: ThemeMode) => Promise<void>;
  };
  reloadApplication: () => void;
}

export function useSettingsScreen({
  backupApi,
  appearance,
  reloadApplication,
}: UseSettingsScreenInput) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localBackups, setLocalBackups] = useState<LocalBackupViewModel[]>([]);
  const [driveBackups, setDriveBackups] = useState<DriveBackupViewModel[]>([]);
  const [driveStatus, setDriveStatus] = useState<DriveConnectionStatusResult | null>(null);
  const [driveTransient, setDriveTransient] = useState<'connecting' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingBackup, setPendingBackup] = useState<BackupFile | null>(null);
  const [pendingSummary, setPendingSummary] = useState<BackupSummaryViewModel | null>(null);
  const submittingRef = useRef(false);

  const load = useCallback((mode: 'initial' | 'refresh') => {
    setError(null);
    if (mode === 'refresh') setRefreshing(true);
    else setStatus('loading');

    Promise.all([
      backupApi.listLocalBackups(),
      backupApi.getGoogleDriveConnectionStatus(),
    ])
      .then(async ([local, drive]) => {
        setLocalBackups(local.map(mapLocalBackup));
        setDriveStatus(drive);
        if (drive.connected) {
          const remote = await backupApi.listDriveBackups();
          setDriveBackups(remote.items.map(mapDriveBackup));
        } else {
          setDriveBackups([]);
        }
        setStatus('success');
      })
      .catch((nextError: unknown) => {
        setError(mapSettingsError(nextError));
        setStatus('error');
      })
      .finally(() => setRefreshing(false));
  }, [backupApi]);

  useEffect(() => load('initial'), [load]);

  const runAction = useCallback(async (action: () => Promise<void>) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await action();
    } catch (nextError) {
      setError(mapSettingsError(nextError));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, []);

  const setAppearanceMode = useCallback((mode: ThemeMode) => runAction(async () => {
    await appearance.setMode(mode);
    setMessage(t('settings.appearance.updated', { mode: t(`settings.appearance.${mode}`) }));
  }), [appearance, runAction]);

  const createLocalBackup = useCallback(() => runAction(async () => {
    const metadata = await backupApi.exportBackupFile();
    setMessage(t('settings.backup.created', { name: metadata.name }));
    load('refresh');
  }), [backupApi, load, runAction]);

  const shareLocalBackup = useCallback((uri: string) => runAction(async () => {
    await backupApi.shareLocalBackup(uri);
    setMessage(t('settings.backup.shared'));
  }), [backupApi, runAction]);

  const deleteLocalBackup = useCallback((uri: string) => runAction(async () => {
    await backupApi.deleteLocalBackup(uri);
    setMessage(t('settings.backup.deletedLocal'));
    load('refresh');
  }), [backupApi, load, runAction]);

  const importLocalBackup = useCallback(() => runAction(async () => {
    const picked = await backupApi.pickBackupFile();
    if (picked.cancelled || !picked.uri) {
      setMessage(t('settings.backup.importCancelled'));
      return;
    }

    const backup = await backupApi.importBackupFile({ uri: picked.uri });
    setPendingBackup(backup);
    setPendingSummary(mapBackupSummary(backup, t('settings.backup.importedReadyTitle')));
    setMessage(t('settings.backup.validated'));
  }), [backupApi, runAction]);

  const restorePendingBackup = useCallback(() => runAction(async () => {
    if (!pendingBackup) return;
    const result = await backupApi.restoreBackup({
      backup: pendingBackup,
      strategy: 'replace',
      createSafetyBackup: true,
    });
    setPendingBackup(null);
    setPendingSummary(null);
    setMessage(mapRestoreResult(result));
    reloadApplication();
  }), [backupApi, pendingBackup, reloadApplication, runAction]);

  const connectDrive = useCallback(() => runAction(async () => {
    await runDriveConnectAction({
      connect: () => backupApi.connectGoogleDrive(),
      setDriveTransient,
      setMessage,
      refresh: () => load('refresh'),
      successMessage: t('settings.drive.connectedMessage'),
    });
  }), [backupApi, load, runAction]);

  const disconnectDrive = useCallback(() => runAction(async () => {
    await backupApi.disconnectGoogleDrive();
    setDriveBackups([]);
    setMessage(t('settings.drive.disconnectedMessage'));
    load('refresh');
  }), [backupApi, load, runAction]);

  const uploadDriveBackup = useCallback(() => runAction(async () => {
    const local = await backupApi.exportBackupFile();
    await backupApi.uploadBackupToDrive({ localBackupUri: local.uri });
    setMessage(t('settings.drive.uploaded'));
    load('refresh');
  }), [backupApi, load, runAction]);

  const refreshDriveBackups = useCallback(() => runAction(async () => {
    const remote = await backupApi.listDriveBackups();
    setDriveBackups(remote.items.map(mapDriveBackup));
    setMessage(t('settings.drive.refreshed'));
  }), [backupApi, runAction]);

  const downloadDriveBackup = useCallback((fileId: string) => runAction(async () => {
    const backup = await backupApi.downloadDriveBackup({ fileId });
    setPendingBackup(backup);
    setPendingSummary(mapBackupSummary(backup, t('settings.backup.driveReadyTitle')));
    setMessage(t('settings.drive.downloaded'));
  }), [backupApi, runAction]);

  const deleteDriveBackup = useCallback((fileId: string) => runAction(async () => {
    await backupApi.deleteDriveBackup({ fileId });
    setMessage(t('settings.drive.deleted'));
    load('refresh');
  }), [backupApi, load, runAction]);

  const viewModel: SettingsViewModel = useMemo(() => {
    const driveState = mapDriveConnectionState(driveStatus, driveTransient, error);

    return {
      appearance: {
        selectedMode: appearance.mode,
        resolvedMode: appearance.resolvedMode,
      },
      localBackups,
      drive: {
        state: driveState,
        statusLabel: mapDriveStatusLabel(driveState),
        expiresAtLabel: driveStatus?.expiresAt ? new Intl.DateTimeFormat(i18n.language, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(driveStatus.expiresAt)) : null,
        backups: driveBackups,
      },
      application: mapApplicationInfo(backupApi),
    };
  }, [appearance.mode, appearance.resolvedMode, backupApi, driveBackups, driveStatus, driveTransient, error, localBackups]);

  return {
    status,
    refreshing,
    submitting,
    error,
    message,
    viewModel,
    pendingSummary,
    retry: () => load('initial'),
    refresh: () => load('refresh'),
    setAppearanceMode,
    createLocalBackup,
    shareLocalBackup,
    deleteLocalBackup,
    importLocalBackup,
    restorePendingBackup,
    connectDrive,
    disconnectDrive,
    uploadDriveBackup,
    refreshDriveBackups,
    downloadDriveBackup,
    deleteDriveBackup,
  };
}

function t(key: string, options?: Record<string, unknown>): string {
  return String(i18n.t(key, options));
}
