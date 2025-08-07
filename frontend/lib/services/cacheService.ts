/**
 * Cache Service for Netlify Deployment
 * Handles caching with Netlify Edge Functions and local storage fallback
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private static instance: CacheService;
  private memoryCache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Netlify Edge Function cache first
      const edgeCache = await this.getFromEdgeCache<T>(key);
      if (edgeCache) {
        console.log(`Cache hit (edge): ${key}`);
        return edgeCache;
      }

      // Try memory cache
      const memoryCache = this.getFromMemoryCache<T>(key);
      if (memoryCache) {
        console.log(`Cache hit (memory): ${key}`);
        return memoryCache;
      }

      // Try localStorage as fallback
      const localCache = this.getFromLocalStorage<T>(key);
      if (localCache) {
        console.log(`Cache hit (local): ${key}`);
        return localCache;
      }

      return null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<boolean> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      // Set in memory cache
      this.memoryCache.set(key, entry);

      // Set in localStorage
      this.setInLocalStorage(key, entry);

      // Try to set in edge cache (non-blocking)
      this.setInEdgeCache(key, entry).catch(error => {
        console.warn(`Edge cache set failed for ${key}:`, error);
      });

      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<boolean> {
    try {
      // Remove from memory cache
      this.memoryCache.delete(key);

      // Remove from localStorage
      localStorage.removeItem(`cache_${key}`);

      // Try to delete from edge cache (non-blocking)
      this.deleteFromEdgeCache(key).catch(error => {
        console.warn(`Edge cache delete failed for ${key}:`, error);
      });

      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all cache entries matching a pattern
   */
  async clearPattern(pattern: string): Promise<number> {
    try {
      let deletedCount = 0;

      // Clear from memory cache
      for (const key of this.memoryCache.keys()) {
        if (key.includes(pattern)) {
          this.memoryCache.delete(key);
          deletedCount++;
        }
      }

      // Clear from localStorage
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('cache_') && key.includes(pattern)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => localStorage.removeItem(key));
      deletedCount += keysToDelete.length;

      // Try to clear from edge cache (non-blocking)
      this.clearPatternFromEdgeCache(pattern).catch(error => {
        console.warn(`Edge cache clear pattern failed for ${pattern}:`, error);
      });

      return deletedCount;
    } catch (error) {
      console.error(`Cache clear pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Get from Netlify Edge Function cache
   */
  private async getFromEdgeCache<T>(key: string): Promise<T | null> {
    try {
      const response = await fetch(`/api/cache/${encodeURIComponent(key)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const entry: CacheEntry<T> = await response.json();
        if (!this.isExpired(entry)) {
          return entry.data;
        }
      }

      return null;
    } catch (error) {
      // Edge function not available, fall back to other methods
      return null;
    }
  }

  /**
   * Set in Netlify Edge Function cache
   */
  private async setInEdgeCache<T>(key: string, entry: CacheEntry<T>): Promise<boolean> {
    try {
      const response = await fetch(`/api/cache/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete from Netlify Edge Function cache
   */
  private async deleteFromEdgeCache(key: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/cache/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear pattern from Netlify Edge Function cache
   */
  private async clearPatternFromEdgeCache(pattern: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/cache/clear/${encodeURIComponent(pattern)}`, {
        method: 'DELETE',
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get from memory cache
   */
  private getFromMemoryCache<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (entry && !this.isExpired(entry)) {
      return entry.data;
    }
    if (entry) {
      this.memoryCache.delete(key);
    }
    return null;
  }

  /**
   * Get from localStorage
   */
  private getFromLocalStorage<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (!this.isExpired(entry)) {
          return entry.data;
        }
        localStorage.removeItem(`cache_${key}`);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Set in localStorage
   */
  private setInLocalStorage<T>(key: string, entry: CacheEntry<T>): void {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn(`localStorage set failed for ${key}:`, error);
    }
  }

  /**
   * Generate cache key from function arguments
   */
  generateKey(prefix: string, ...args: any[]): string {
    const keyParts = [prefix, ...args.map(arg => String(arg))];
    const keyString = keyParts.join('|');
    
    // Create hash for consistent key length
    let hash = 0;
    for (let i = 0; i < keyString.length; i++) {
      const char = keyString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `${prefix}_${Math.abs(hash).toString(36)}`;
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();

// Cache categories for easy management
export const CacheCategories = {
  WORKFLOW_STATUS: 'workflow_status',
  USER_PROFILE: 'user_profile',
  SIMULATION_RESULTS: 'simulation_results',
  MARKET_DATA: 'market_data',
  AI_EXPLANATIONS: 'ai_explanations',
  PLaid_DATA: 'plaid_data',
  CHASE_DATA: 'chase_data',
} as const;

// Decorator for caching function results
export function cached<T extends (...args: any[]) => Promise<any>>(
  prefix: string,
  ttl: number = 5 * 60 * 1000
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = cacheService.generateKey(prefix, ...args);
      
      // Try to get from cache
      const cachedResult = await cacheService.get(key);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // Execute function and cache result
      const result = await originalMethod.apply(this, args);
      await cacheService.set(key, result, ttl);
      
      return result;
    };

    return descriptor;
  };
}
