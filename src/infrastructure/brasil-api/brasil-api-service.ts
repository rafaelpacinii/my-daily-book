import { BrasilApiClient } from './brasil-api-client';
import { mapBrasilApiIsbnToBookMetadata } from './brasil-api-mapper';
import type { BrasilApiBookMetadata } from './brasil-api-types';

export class BrasilApiService {
  constructor(private readonly client: BrasilApiClient) {}

  async findBookByIsbn(input: { isbn: string; signal?: AbortSignal }): Promise<BrasilApiBookMetadata> {
    return mapBrasilApiIsbnToBookMetadata(
      await this.client.getBookByIsbn(input.isbn, input.signal),
    );
  }
}
