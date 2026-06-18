import type { ApplicationApi } from '@/src/application';

import { mapBookListDetails, mapBookListSummary } from './lists-mappers';
import type { ListsHomeViewModel } from './lists-types';

export async function loadListsHomeViewModel(api: ApplicationApi): Promise<ListsHomeViewModel> {
  const wishlist = await Promise.resolve(api.lists.getOrCreateWishlist());
  const lists = await Promise.resolve(api.lists.listLists());
  const wishlistDetails = await Promise.resolve()
    .then(() => api.lists.getListDetails(wishlist.id))
    .catch(() => ({
      list: wishlist,
      items: [],
    }));
  const customDetailsResults = await Promise.allSettled(
    lists
      .filter((list) => list.type === 'custom')
      .map((list) => Promise.resolve().then(() => api.lists.getListDetails(list.id))),
  );
  const customDetails = customDetailsResults
    .filter(
      (
        result,
      ): result is PromiseFulfilledResult<Awaited<ReturnType<ApplicationApi['lists']['getListDetails']>>> =>
        result.status === 'fulfilled',
    )
    .map((result) => result.value);

  return {
    wishlist: mapBookListDetails(wishlistDetails),
    customLists: customDetails
      .map((details) => mapBookListSummary(details.list, details.items.length))
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
}
