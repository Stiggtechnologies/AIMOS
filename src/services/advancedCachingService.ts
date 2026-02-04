interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
}

class AdvancedCachingService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };
  private maxSize: number = 100;
  private defaultTTL: number = 5 * 60 * 1000;

  constructor(maxSize?: number, defaultTTL?: number) {
    if (maxSize) this.maxSize = maxSize;
    if (defaultTTL) this.defaultTTL = defaultTTL;

    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hits++;

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccessed: now
    });
  }

  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    });

    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0
    };
  }

  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }

  warmUp(entries: Array<{ key: string; fetcher: () => Promise<any>; ttl?: number }>): void {
    Promise.all(
      entries.map(async ({ key, fetcher, ttl }) => {
        try {
          const data = await fetcher();
          this.set(key, data, ttl);
        } catch (error) {
          console.error(`Failed to warm up cache for key: ${key}`, error);
        }
      })
    );
  }
}

export const advancedCachingService = new AdvancedCachingService(200, 10 * 60 * 1000);

export const cacheKeys = {
  researchSources: 'research:sources',
  researchPriorities: 'research:priorities',
  activePilots: 'pilots:active',
  recentPapers: (limit: number) => `papers:recent:${limit}`,
  synthesis: (id: string) => `synthesis:${id}`,
  translation: (id: string) => `translation:${id}`,
  contradictions: 'contradictions:unresolved',
  dashboardMetrics: 'dashboard:metrics',
  clinicMetrics: (clinicId: string) => `clinic:${clinicId}:metrics`,
  evidenceDigest: (month: string) => `digest:${month}`
};
