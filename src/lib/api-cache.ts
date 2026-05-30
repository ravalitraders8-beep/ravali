import { CACHE_TAGS } from "./cache-tags";

interface CacheEntry<T> {
  data: T;
  expires: number;
  tags: (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS][];
}

type CacheListener = (tags: (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS][]) => void;

const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();
const listeners = new Set<CacheListener>();

type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

const channel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("ravali-api-cache")
    : null;

if (channel) {
  channel.onmessage = (event: MessageEvent<{ type: string; tags: CacheTag[] }>) => {
    if (event.data?.type === "invalidate") {
      invalidateByTags(event.data.tags, false);
    }
  };
}

function notify(tags: CacheTag[]) {
  listeners.forEach((fn) => fn(tags));
}

export function subscribeCache(listener: CacheListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function invalidateByTags(tags: CacheTag[], broadcast = true) {
  if (tags.length === 0) {
    store.clear();
  } else {
    const tagSet = new Set(tags);
    for (const [key, entry] of store.entries()) {
      if (entry.tags.some((t) => tagSet.has(t))) {
        store.delete(key);
      }
    }
  }
  notify(tags);
  if (broadcast) {
    channel?.postMessage({ type: "invalidate", tags });
  }
}

export function invalidateKey(key: string) {
  store.delete(key);
  notify([]);
}

export function invalidateAll(broadcast = true) {
  store.clear();
  notify([]);
  if (broadcast) {
    channel?.postMessage({ type: "invalidate", tags: [] });
  }
}

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl: number; tags?: CacheTag[]; force?: boolean }
): Promise<T> {
  const now = Date.now();
  const tags = options.tags ?? [];

  if (!options.force) {
    const hit = store.get(key);
    if (hit && hit.expires > now) {
      return hit.data as T;
    }
    const pending = inflight.get(key);
    if (pending) return pending as Promise<T>;
  } else {
    store.delete(key);
  }

  const promise = fetcher()
    .then((data) => {
      store.set(key, { data, expires: Date.now() + options.ttl, tags });
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise);
  return promise as Promise<T>;
}

export function syncAfterMutation() {
  invalidateByTags([CACHE_TAGS.ADMIN, CACHE_TAGS.CONTRACTOR, CACHE_TAGS.PUBLIC]);
}
