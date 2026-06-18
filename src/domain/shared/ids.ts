export interface IdGenerator {
  generate(): string;
}

export type RandomUuid = () => string;

export function createIdGenerator(randomUuid: RandomUuid): IdGenerator {
  return {
    generate(): string {
      return randomUuid();
    },
  };
}
