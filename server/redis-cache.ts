import { createClient, RedisClientType } from 'redis';

export interface CacheConfig {
  enabled: boolean;
  url: string;
  prefix: string;
  defaultTTL: number; // seconds
}

export interface CacheEntry {
  data: any;
  createdAt: number;
  ttl: number;
}

class RedisCacheManager {
  private client: RedisClientType | null = null;
  private config: CacheConfig;
  private fallbackCache: Map<string, CacheEntry> = new Map();
  private isConnected = false;

  constructor() {
    this.config = {
      enabled: process.env.REDIS_ENABLED === 'true',
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      prefix: process.env.REDIS_PREFIX || 'memopyk:seo:',
      defaultTTL: 600 // 10 minutes
    };

    if (this.config.enabled) {
      this.initializeRedis();
    } else {
      console.log('[CACHE] Redis disabled, using in-memory fallback');
    }
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.client = createClient({
        url: this.config.url,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('[CACHE] Redis reconnection attempts exceeded');
              return false;
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('[CACHE] Redis error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('[CACHE] Redis connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('[CACHE] Redis disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      
      // Test connection
      await this.client.ping();
      console.log('[CACHE] Redis connection established');
      
    } catch (error) {
      console.error('[CACHE] Failed to connect to Redis:', error);
      console.log('[CACHE] Falling back to in-memory cache');
      this.client = null;
      this.isConnected = false;
    }
  }

  private getKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  async get<T = any>(key: string): Promise<T | null> {
    const prefixedKey = this.getKey(key);

    // Try Redis first if available
    if (this.isConnected && this.client) {
      try {
        const result = await this.client.get(prefixedKey);
        if (result) {
          const parsed = JSON.parse(result);
          return parsed as T;
        }
      } catch (error) {
        console.error(`[CACHE] Redis get error for key ${key}:`, error);
        // Fall through to in-memory cache
      }
    }

    // Fallback to in-memory cache
    const entry = this.fallbackCache.get(prefixedKey);
    if (entry) {
      const now = Date.now();
      if (now - entry.createdAt < entry.ttl * 1000) {
        return entry.data as T;
      } else {
        // Expired
        this.fallbackCache.delete(prefixedKey);
      }
    }

    return null;
  }

  async set(key: string, value: any, ttl: number = this.config.defaultTTL): Promise<void> {
    const prefixedKey = this.getKey(key);
    const serialized = JSON.stringify(value);

    // Try Redis first if available
    if (this.isConnected && this.client) {
      try {
        await this.client.setEx(prefixedKey, ttl, serialized);
        return;
      } catch (error) {
        console.error(`[CACHE] Redis set error for key ${key}:`, error);
        // Fall through to in-memory cache
      }
    }

    // Fallback to in-memory cache
    const entry: CacheEntry = {
      data: value,
      createdAt: Date.now(),
      ttl
    };
    this.fallbackCache.set(prefixedKey, entry);

    // Clean up expired entries periodically
    if (Math.random() < 0.1) { // 10% chance
      this.cleanupExpiredEntries();
    }
  }

  async delete(key: string): Promise<void> {
    const prefixedKey = this.getKey(key);

    // Try Redis first if available
    if (this.isConnected && this.client) {
      try {
        await this.client.del(prefixedKey);
      } catch (error) {
        console.error(`[CACHE] Redis delete error for key ${key}:`, error);
      }
    }

    // Also remove from fallback cache
    this.fallbackCache.delete(prefixedKey);
  }

  async deletePattern(pattern: string): Promise<void> {
    const prefixedPattern = this.getKey(pattern);

    // Try Redis first if available
    if (this.isConnected && this.client) {
      try {
        const keys = await this.client.keys(prefixedPattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } catch (error) {
        console.error(`[CACHE] Redis deletePattern error for pattern ${pattern}:`, error);
      }
    }

    // Also remove from fallback cache
    const keysToDelete = Array.from(this.fallbackCache.keys()).filter(k => 
      k.startsWith(this.config.prefix) && 
      k.substring(this.config.prefix.length).includes(pattern.replace('*', ''))
    );
    
    keysToDelete.forEach(k => this.fallbackCache.delete(k));
  }

  async flush(): Promise<void> {
    // Clear Redis cache
    if (this.isConnected && this.client) {
      try {
        const keys = await this.client.keys(`${this.config.prefix}*`);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } catch (error) {
        console.error('[CACHE] Redis flush error:', error);
      }
    }

    // Clear fallback cache
    this.fallbackCache.clear();
    console.log('[CACHE] Cache flushed');
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.fallbackCache.entries()) {
      if (now - entry.createdAt >= entry.ttl * 1000) {
        this.fallbackCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[CACHE] Cleaned up ${cleanedCount} expired entries`);
    }
  }

  getStats(): {
    enabled: boolean;
    redisConnected: boolean;
    fallbackCacheSize: number;
    config: CacheConfig;
  } {
    return {
      enabled: this.config.enabled,
      redisConnected: this.isConnected,
      fallbackCacheSize: this.fallbackCache.size,
      config: this.config
    };
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.disconnect();
        console.log('[CACHE] Redis disconnected');
      } catch (error) {
        console.error('[CACHE] Error disconnecting Redis:', error);
      }
    }
  }
}

export const redisCache = new RedisCacheManager();

// Enhanced SEO cache with Redis backend
export class SEOCache {
  private cache = redisCache;

  async get(page: string, urlSlug: string): Promise<any> {
    const key = `seo:${page}:${urlSlug}`;
    return await this.cache.get(key);
  }

  async set(page: string, urlSlug: string, data: any, ttl = 600): Promise<void> {
    const key = `seo:${page}:${urlSlug}`;
    await this.cache.set(key, data, ttl);
  }

  async invalidate(page: string, urlSlug: string): Promise<void> {
    const key = `seo:${page}:${urlSlug}`;
    await this.cache.delete(key);
  }

  async invalidateAll(): Promise<void> {
    await this.cache.deletePattern('seo:*');
  }

  async invalidatePage(page: string): Promise<void> {
    await this.cache.deletePattern(`seo:${page}:*`);
  }

  // Cache sitemap with 24-hour TTL
  async getSitemap(): Promise<string | null> {
    return await this.cache.get('sitemap:xml');
  }

  async setSitemap(xml: string): Promise<void> {
    await this.cache.set('sitemap:xml', xml, 24 * 60 * 60); // 24 hours
  }

  async invalidateSitemap(): Promise<void> {
    await this.cache.delete('sitemap:xml');
  }

  // Cache robots.txt with 24-hour TTL
  async getRobots(): Promise<string | null> {
    return await this.cache.get('robots:txt');
  }

  async setRobots(txt: string): Promise<void> {
    await this.cache.set('robots:txt', txt, 24 * 60 * 60); // 24 hours
  }

  async invalidateRobots(): Promise<void> {
    await this.cache.delete('robots:txt');
  }

  // Cache SEO settings list with 10-minute TTL
  async getSettings(): Promise<any[] | null> {
    return await this.cache.get('settings:list');
  }

  async setSettings(settings: any[]): Promise<void> {
    await this.cache.set('settings:list', settings, 600); // 10 minutes
  }

  async invalidateSettings(): Promise<void> {
    await this.cache.delete('settings:list');
  }

  getStats() {
    return this.cache.getStats();
  }
}

export const seoCache = new SEOCache();

// Cleanup on process exit
process.on('exit', () => {
  redisCache.disconnect();
});

process.on('SIGINT', async () => {
  await redisCache.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await redisCache.disconnect();
  process.exit(0);
});