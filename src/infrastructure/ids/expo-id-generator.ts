import * as Crypto from 'expo-crypto';

import { createIdGenerator } from '@/src/domain/shared';

export const expoCryptoIdGenerator = createIdGenerator(Crypto.randomUUID);
