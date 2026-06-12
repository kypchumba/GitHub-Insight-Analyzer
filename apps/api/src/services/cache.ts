import { env } from "../env.js";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export class MemoryCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds = env.CACHE_TTL_SECONDS): T {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
    return value;
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds = env.CACHE_TTL_SECONDS): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await factory();
    return this.set(key, fresh, ttlSeconds);
  }

  clear(): void {
    this.store.clear();
  }
}

export const cache = new MemoryCache();

