import { Request, Response, NextFunction } from 'express';

// Simple in-memory cache for SEO settings
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class SEOCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 10 * 60 * 1000; // 10 minutes in milliseconds

  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Invalidate all SEO-related cache entries
  invalidateAll(): void {
    for (const [key] of this.cache) {
      if (key.startsWith('seo:')) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      memoryUsage: JSON.stringify([...this.cache]).length
    };
  }
}

export const seoCache = new SEOCache();

// Rate limiting for testing endpoints
class RateLimiter {
  private requests = new Map<string, number[]>();
  private windowMs = 60 * 1000; // 1 minute
  private maxRequests = 10; // 10 requests per minute

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    this.requests.set(identifier, validRequests);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    return true;
  }
}

export const rateLimiter = new RateLimiter();

// Middleware for caching SEO responses
export function seoResponseCache(ttl?: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const cacheKey = `seo:${req.method}:${req.originalUrl}`;

    // Check if we have cached data
    const cachedData = seoCache.get(cacheKey);
    if (cachedData && req.method === 'GET') {
      res.set('X-Cache', 'HIT');
      res.set('Cache-Control', 'public, max-age=600');
      return res.send(cachedData);
    }

    // Override res.send to cache the response
    res.send = function(data: any) {
      if (res.statusCode === 200 && req.method === 'GET') {
        seoCache.set(cacheKey, data, ttl);
        res.set('X-Cache', 'MISS');
      }
      res.set('Cache-Control', 'public, max-age=600');
      return originalSend.call(this, data);
    };

    next();
  };
}

// Middleware to invalidate cache on mutations
export function seoInvalidateCache(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;

  res.send = function(data: any) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
        seoCache.invalidateAll();
        console.log('[SEO Cache] Invalidated all entries due to mutation');
      }
    }
    return originalSend.call(this, data);
  };

  next();
}

// Rate limiting middleware for testing endpoints
export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const identifier = req.ip || 'unknown';
  
  if (!rateLimiter.isAllowed(identifier)) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: 60
    });
  }
  
  next();
}