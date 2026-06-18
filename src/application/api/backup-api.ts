import * as backupUseCases from '@/src/application/use-cases/backup';
import {
  CURRENT_BACKUP_FORMAT_VERSION,
  CURRENT_DATABASE_SCHEMA_VERSION,
} from '@/src/domain/backup';

export const backupApi = {
  createLocalBackup: backupUseCases.createLocalBackup,
  exportBackupFile: backupUseCases.exportBackupFile,
  importBackupFile: backupUseCases.importBackupFile,
  validateBackupFile: backupUseCases.validateBackupFile,
  restoreBackup: backupUseCases.restoreBackup,
  listLocalBackups: backupUseCases.listLocalBackups,
  deleteLocalBackup: backupUseCases.deleteLocalBackup,
  shareLocalBackup: backupUseCases.shareLocalBackup,
  pickBackupFile: backupUseCases.pickBackupFile,
  connectGoogleDrive: backupUseCases.connectGoogleDrive,
  disconnectGoogleDrive: backupUseCases.disconnectGoogleDrive,
  getGoogleDriveConnectionStatus: backupUseCases.getGoogleDriveConnectionStatus,
  uploadBackupToDrive: backupUseCases.uploadBackupToDrive,
  listDriveBackups: backupUseCases.listDriveBackups,
  downloadDriveBackup: backupUseCases.downloadDriveBackup,
  downloadDriveBackupToLocalFile: backupUseCases.downloadDriveBackupToLocalFile,
  deleteDriveBackup: backupUseCases.deleteDriveBackup,
  restoreDriveBackup: backupUseCases.restoreDriveBackup,
  constants: {
    backupFormatVersion: CURRENT_BACKUP_FORMAT_VERSION,
    databaseSchemaVersion: CURRENT_DATABASE_SCHEMA_VERSION,
  },
};

export type BackupApi = typeof backupApi;
