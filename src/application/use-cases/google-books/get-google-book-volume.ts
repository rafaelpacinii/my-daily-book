import { GoogleBooksClient, GoogleBooksService } from '@/src/infrastructure/google-books';
import type { GoogleBooksVolume } from '@/src/infrastructure/google-books';

export interface GetGoogleBookVolumeInput {
  volumeId: string;
  signal?: AbortSignal;
}

export async function getGoogleBookVolume(
  input: GetGoogleBookVolumeInput,
  service = new GoogleBooksService(new GoogleBooksClient()),
): Promise<GoogleBooksVolume> {
  return service.getGoogleBookVolume(input);
}

