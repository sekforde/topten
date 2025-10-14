import type { TopTenList } from '@/types';

// Conditional KV import based on environment
const USE_LOCAL_KV = process.env.USE_LOCAL_KV === 'true';

type KVStore = {
  get: <T = unknown>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown) => Promise<unknown>;
  del: (key: string) => Promise<number | void>;
};

let kvStore: KVStore | null = null;

async function getKVStore(): Promise<KVStore> {
  if (kvStore) {
    return kvStore;
  }

  if (USE_LOCAL_KV) {
    console.log('[DB] Using local KV store');
    const { getLocalKV } = await import('./local-kv');
    kvStore = getLocalKV();
  } else {
    console.log('[DB] Using Vercel KV store');
    const { kv } = await import('@vercel/kv');
    kvStore = kv;
  }

  return kvStore;
}

const LIST_PREFIX = 'list:';
const USER_LISTS_PREFIX = 'user_lists:';

export async function saveList(list: TopTenList): Promise<void> {
  const kv = await getKVStore();
  await kv.set(`${LIST_PREFIX}${list.id}`, list);
}

export async function getList(listId: string): Promise<TopTenList | null> {
  const kv = await getKVStore();
  const list = await kv.get<TopTenList>(`${LIST_PREFIX}${listId}`);
  return list;
}

export async function getUserLists(userIdentifier: string): Promise<string[]> {
  const kv = await getKVStore();
  const listIds = await kv.get<string[]>(`${USER_LISTS_PREFIX}${userIdentifier}`);
  return listIds || [];
}

export async function addUserToList(userIdentifier: string, listId: string): Promise<void> {
  const currentLists = await getUserLists(userIdentifier);
  if (!currentLists.includes(listId)) {
    const kv = await getKVStore();
    await kv.set(`${USER_LISTS_PREFIX}${userIdentifier}`, [...currentLists, listId]);
  }
}

export async function deleteList(listId: string): Promise<void> {
  const kv = await getKVStore();
  await kv.del(`${LIST_PREFIX}${listId}`);
}

