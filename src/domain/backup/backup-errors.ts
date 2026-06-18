export class BackupError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class BackupSerializationError extends BackupError {}

export class BackupValidationError extends BackupError {}

export class BackupChecksumError extends BackupValidationError {}

export class UnsupportedBackupVersionError extends BackupValidationError {}

export class BackupFileNotFoundError extends BackupError {}

export class BackupRestoreError extends BackupError {}

export class BackupConflictError extends BackupError {}

