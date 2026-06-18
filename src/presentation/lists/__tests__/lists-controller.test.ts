import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ApplicationApi, BookListDetails } from '@/src/application';

import { loadListsHomeViewModel } from '../lists-home-loader';

describe('lists home loader', () => {
  it('loads wishlist and custom lists through the public lists API', async () => {
    const api = createApi();
    const viewModel = await loadListsHomeViewModel(api);

    assert.deepEqual(calls, [
      'getOrCreateWishlist',
      'listLists',
      'getListDetails:wishlist-1',
      'getListDetails:list-1',
    ]);
    assert.equal(viewModel.wishlist.itemCount, 0);
    assert.equal(viewModel.customLists.length, 1);
    assert.equal(viewModel.customLists[0]?.name, 'Favorites');
  });

  it('propagates list loading errors for retry state', async () => {
    const error = new Error('boom');
    const api = createApi({
      listLists: () => {
        throw error;
      },
    });

    await assert.rejects(() => loadListsHomeViewModel(api), error);
  });

  it('treats missing custom lists as a successful empty state', async () => {
    const api = createApi({
      listLists: () => {
        calls.push('listLists');
        return [details('wishlist-1', 'Wishlist', 'wishlist').list];
      },
    });

    const viewModel = await loadListsHomeViewModel(api);

    assert.equal(viewModel.customLists.length, 0);
    assert.equal(viewModel.wishlist.itemCount, 0);
  });

  it('falls back to an empty wishlist details model when wishlist details fail', async () => {
    const api = createApi({
      getListDetails: (id: string) => {
        calls.push(`getListDetails:${id}`);
        if (id === 'wishlist-1') {
          throw new Error('wishlist detail error');
        }

        return details('list-1', 'Favorites', 'custom');
      },
    });

    const viewModel = await loadListsHomeViewModel(api);

    assert.equal(viewModel.wishlist.id, 'wishlist-1');
    assert.equal(viewModel.wishlist.items.length, 0);
    assert.equal(viewModel.customLists.length, 1);
  });
});

let calls: string[] = [];

function createApi(overrides: Partial<ApplicationApi['lists']> = {}): ApplicationApi {
  calls = [];
  const lists = {
    getOrCreateWishlist: () => {
      calls.push('getOrCreateWishlist');
      return details('wishlist-1', 'Wishlist', 'wishlist').list;
    },
    listLists: () => {
      calls.push('listLists');
      return [
        details('wishlist-1', 'Wishlist', 'wishlist').list,
        details('list-1', 'Favorites', 'custom').list,
      ];
    },
    getListDetails: (id: string) => {
      calls.push(`getListDetails:${id}`);
      return id === 'list-1'
        ? details('list-1', 'Favorites', 'custom')
        : details('wishlist-1', 'Wishlist', 'wishlist');
    },
    ...overrides,
  } as unknown as ApplicationApi['lists'];

  return { lists } as unknown as ApplicationApi;
}

function details(id: string, name: string, type: 'custom' | 'wishlist'): BookListDetails {
  return {
    list: {
      id,
      name,
      description: null,
      type,
      createdAt: 1,
      updatedAt: 1,
    },
    items: [],
  };
}
