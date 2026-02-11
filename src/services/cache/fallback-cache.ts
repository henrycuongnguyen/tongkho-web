import type { PropertySearchFilters } from '@/services/elasticsearch/types';

/**
 * Cache entry for fallback results
 */
interface CacheEntry {
  results: {
    hits: any[];
    total: number;
    took: number;
  };
  level: 1 | 2 | 3;
  timestamp: number;
}

/**
 * Simple in-memory LRU cache for fallback results
 * Reduces redundant ElasticSearch queries for common zero-result searches
 */
class FallbackCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize = 100;
  private readonly ttlMs = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate cache key from filters
   * Uses deterministic serialization for consistent keys
   */
  private getCacheKey(filters: PropertySearchFilters): string {
    const normalized = {
      t: filters.transactionType,
      p: filters.provinceIds?.sort().join(',') || '',
      d: filters.districtIds?.sort().join(',') || '',
      w: filters.wardIds?.sort().join(',') || '',
      pr: [filters.minPrice || '', filters.maxPrice || ''].join('-'),
      a: [filters.minArea || '', filters.maxArea || ''].join('-'),
      pt: filters.propertyTypes?.sort().join(',') || '',
      b: filters.bedrooms || '',
      ba: filters.bathrooms || '',
    };
    return JSON.stringify(normalized);
  }

  /**
   * Get cached fallback result
   * Returns null if not found or expired
   */
  get(filters: PropertySearchFilters): CacheEntry | null {
    const key = this.getCacheKey(filters);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Set fallback result in cache
   * Evicts oldest entry if at capacity
   */
  set(
    filters: PropertySearchFilters,
    results: { hits: any[]; total: number; took: number },
    level: 1 | 2 | 3
  ): void {
    const key = this.getCacheKey(filters);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      results,
      level,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear entire cache
   * Useful for testing or manual cache invalidation
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * Useful for monitoring cache effectiveness
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttlMs: this.ttlMs,
      hitRate: 0, // TODO: Track hit/miss for hit rate calculation
    };
  }
}

// Export singleton instance
export const fallbackCache = new FallbackCache();
