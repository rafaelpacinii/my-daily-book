import type { BackupData } from '@/src/domain/backup';

export type DigestFunction = (value: string) => Promise<string>;

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(sortForJson(value));
}

export function calculateBackupChecksumWithDigest(
  data: BackupData,
  digest: DigestFunction,
): Promise<string> {
  return digest(canonicalStringify(data));
}

function sortForJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortForJson);
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter((key) => value[key] !== undefined)
        .map((key) => [key, sortForJson(value[key])]),
    );
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
