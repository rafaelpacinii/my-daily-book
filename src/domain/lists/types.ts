import type { DesiredBookFormat, WishlistPriority } from '@/src/database/schema';

export interface WishlistItemRulesInput {
  priority?: WishlistPriority | null;
  desiredFormat?: DesiredBookFormat | null;
  targetPrice?: number | null;
  targetCurrency?: string | null;
  ownsWork: boolean;
  ownsEdition: boolean;
  hasSpecificEdition: boolean;
}

