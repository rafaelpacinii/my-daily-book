import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';

import { ValidationError } from '@/src/domain/errors';
import type { EditableBookCover } from '@/src/domain/books';
import type { BackupCoverAsset } from '@/src/domain/backup';

const COVER_DIRECTORY = `${FileSystem.documentDirectory ?? ''}book-covers/`;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
export const MAX_LOCAL_BOOK_COVER_SIZE_BYTES = 5 * 1024 * 1024;

export async function pickLocalBookCover(): Promise<EditableBookCover | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: 'image/*',
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset) {
    throw new ValidationError('No image was selected.');
  }

  const mimeType = normalizeMimeType(asset.mimeType, asset.name);
  const fileSize = await resolveFileSize(asset.uri, asset.size ?? null);
  const fileName = ensureSafeFileName(asset.name, mimeType);

  return {
    kind: 'local',
    uri: asset.uri,
    mimeType,
    fileName,
    fileSize,
    persisted: false,
  };
}

export async function persistSelectedBookCover(cover: EditableBookCover): Promise<EditableBookCover> {
  if (cover.kind !== 'local') return cover;
  if (cover.persisted) return cover;

  await ensureCoverDirectory();
  const extension = extensionFromMimeType(cover.mimeType);
  const uniqueName = `${await Crypto.randomUUID()}.${extension}`;
  const destinationUri = `${COVER_DIRECTORY}${uniqueName}`;

  await FileSystem.copyAsync({
    from: cover.uri,
    to: destinationUri,
  });

  return {
    kind: 'local',
    uri: destinationUri,
    mimeType: cover.mimeType,
    fileName: uniqueName,
    fileSize: cover.fileSize,
    persisted: true,
  };
}

export async function deleteDraftBookCover(cover: EditableBookCover | null | undefined): Promise<void> {
  if (!cover || cover.kind !== 'local' || cover.persisted) return;
  await deleteFileIfExists(cover.uri);
}

export async function deletePersistedBookCover(uri: string | null | undefined): Promise<void> {
  if (!uri || !uri.startsWith(COVER_DIRECTORY)) return;
  await deleteFileIfExists(uri);
}

export async function readPersistedBookCoverForBackup(
  editionId: string,
  uri: string,
  mimeType: string | null,
  fileName: string | null,
): Promise<BackupCoverAsset | null> {
  if (!uri.startsWith(COVER_DIRECTORY)) return null;

  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) return null;

  const normalizedMimeType = normalizeMimeType(mimeType, fileName ?? uri);
  const size = ('size' in info ? info.size : null) ?? 0;
  if (size <= 0 || size > MAX_LOCAL_BOOK_COVER_SIZE_BYTES) {
    throw new ValidationError('Local cover file is invalid for backup.');
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return {
    editionId,
    fileName: ensureSafeFileName(fileName ?? uri.split('/').pop() ?? 'cover', normalizedMimeType),
    mimeType: normalizedMimeType,
    base64,
  };
}

export async function restorePersistedBookCover(asset: BackupCoverAsset): Promise<EditableBookCover> {
  validateBackupCoverAsset(asset);
  await ensureCoverDirectory();

  const extension = extensionFromMimeType(asset.mimeType);
  const uniqueName = `${await Crypto.randomUUID()}.${extension}`;
  const destinationUri = `${COVER_DIRECTORY}${uniqueName}`;

  await FileSystem.writeAsStringAsync(destinationUri, asset.base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const info = await FileSystem.getInfoAsync(destinationUri);

  return {
    kind: 'local',
    uri: destinationUri,
    mimeType: asset.mimeType,
    fileName: uniqueName,
    fileSize: ('size' in info ? info.size : null) ?? 0,
    persisted: true,
  };
}

export function isSupportedBookCoverUri(uri: string | null): boolean {
  if (!uri) return false;
  return uri.startsWith('https://') || uri.startsWith('http://') || uri.startsWith('file://') || uri.startsWith('content://');
}

function validateBackupCoverAsset(asset: BackupCoverAsset): void {
  if (asset.editionId.trim().length === 0) {
    throw new ValidationError('Backup cover asset editionId is required.');
  }

  normalizeMimeType(asset.mimeType, asset.fileName);
  if (asset.base64.trim().length === 0) {
    throw new ValidationError('Backup cover asset content is required.');
  }
}

async function ensureCoverDirectory(): Promise<void> {
  if (!FileSystem.documentDirectory) {
    throw new ValidationError('Local file storage is unavailable.');
  }

  await FileSystem.makeDirectoryAsync(COVER_DIRECTORY, { intermediates: true });
}

async function resolveFileSize(uri: string, knownSize: number | null): Promise<number> {
  if (knownSize != null) {
    validateFileSize(knownSize);
    return knownSize;
  }

  const info = await FileSystem.getInfoAsync(uri);
  const size = 'size' in info ? (info.size ?? 0) : 0;
  validateFileSize(size);
  return size;
}

function validateFileSize(size: number): void {
  if (!Number.isFinite(size) || size <= 0 || size > MAX_LOCAL_BOOK_COVER_SIZE_BYTES) {
    throw new ValidationError('Cover image must be smaller than 5 MB.');
  }
}

function normalizeMimeType(mimeType: string | null | undefined, fileName: string): string {
  const normalized = (mimeType ?? inferMimeTypeFromName(fileName) ?? '').toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(normalized)) {
    throw new ValidationError('Only JPEG, PNG, and WebP cover images are supported.');
  }

  const extension = extensionFromName(fileName);
  if (extension && !ALLOWED_EXTENSIONS.has(extension)) {
    throw new ValidationError('Cover image file extension is not supported.');
  }

  return normalized;
}

function ensureSafeFileName(name: string, mimeType: string): string {
  const trimmed = name.trim();
  const extension = extensionFromName(trimmed) ?? `.${extensionFromMimeType(mimeType)}`;

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new ValidationError('Cover image file extension is not supported.');
  }

  return trimmed.length > 0 ? trimmed : `cover${extension}`;
}

function inferMimeTypeFromName(fileName: string): string | null {
  const extension = extensionFromName(fileName);
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  return null;
}

function extensionFromName(fileName: string): string | null {
  const match = /\.([a-z0-9]+)$/i.exec(fileName);
  return match ? `.${match[1].toLowerCase()}` : null;
}

function extensionFromMimeType(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

async function deleteFileIfExists(uri: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}
