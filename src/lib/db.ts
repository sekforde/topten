import type { TopTenList } from '@/types';
import Redis from 'ioredis';

// Conditional KV import based on environment
const USE_LOCAL_KV = process.env.USE_LOCAL_KV === 'true';
const REDIS_URL = process.env.REDIS_URL;

type KVStore = {
  get: <T = unknown>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown) => Promise<unknown>;
  del: (key: string) => Promise<number | void>;
};

let kvStore: KVStore | null = null;

// Redis wrapper to match KVStore interface
function createRedisStore(redis: Redis): KVStore {
  return {
    async get<T = unknown>(key: string): Promise<T | null> {
      const value = await redis.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    },
    async set(key: string, value: unknown): Promise<void> {
      await redis.set(key, JSON.stringify(value));
    },
    async del(key: string): Promise<number> {
      return await redis.del(key);
    },
  };
}

async function getKVStore(): Promise<KVStore> {
  if (kvStore) {
    return kvStore;
  }

  if (USE_LOCAL_KV) {
    console.log('[DB] Using local KV store');
    const { getLocalKV } = await import('./local-kv');
    kvStore = getLocalKV();
  } else if (REDIS_URL) {
    console.log('[DB] Using Redis store');
    const redis = new Redis(REDIS_URL);
    kvStore = createRedisStore(redis);
  } else {
    console.log('[DB] Using Vercel KV store');
    const { kv } = await import('@vercel/kv');
    kvStore = kv;
  }

  return kvStore;
}

const LIST_PREFIX = 'list:';
const USER_LISTS_PREFIX = 'user_lists:';
const ALL_LISTS_KEY = 'all_lists';

export async function saveList(list: TopTenList): Promise<void> {
  const kv = await getKVStore();
  await kv.set(`${LIST_PREFIX}${list.id}`, list);
  
  // Track list ID in global list
  const allLists = await getAllListIds();
  if (!allLists.includes(list.id)) {
    await kv.set(ALL_LISTS_KEY, [...allLists, list.id]);
  }
}

export async function getList(listId: string): Promise<TopTenList | null> {
  const kv = await getKVStore();
  const list = await kv.get<TopTenList>(`${LIST_PREFIX}${listId}`);
  return list;
}

export async function getAllListIds(): Promise<string[]> {
  const kv = await getKVStore();
  const listIds = await kv.get<string[]>(ALL_LISTS_KEY);
  return listIds || [];
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
  
  // Remove from global list
  const allLists = await getAllListIds();
  const filtered = allLists.filter(id => id !== listId);
  await kv.set(ALL_LISTS_KEY, filtered);
}

