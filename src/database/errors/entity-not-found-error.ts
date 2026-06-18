import { DatabaseError } from './database-error';

export class EntityNotFoundError extends DatabaseError {
  readonly entityName: string;

  constructor(entityName: string, id: string, options?: { cause?: unknown }) {
    super(`${entityName} was not found for id ${id}.`, options);
    this.name = 'EntityNotFoundError';
    this.entityName = entityName;
  }
}
