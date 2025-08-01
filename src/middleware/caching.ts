// RHY Caching Middleware - Advanced Caching Layer for Performance Optimization
// Batch 2 Enhancement: Multi-layer caching system for optimal performance
// Performance targets: >95% cache hit rate, <10ms cache operations

import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/lib/logger';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  strategy: 'CACHE_FIRST' | 'NETWORK_FIRST' | 'STALE_WHILE_REVALIDATE';
  tags: string[];
  vary: string[];
  maxAge: number;
  sMaxAge: number;
  staleWhileRevalidate: number;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  etag: string;
  compressed: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalOperations: number;
  memoryUsage: number;
  evictions: number;
}

export class CachingMiddleware {
  private readonly logger = new Logger('CachingMiddleware');
  private readonly cache = new Map<string, CacheEntry>();
  private readonly stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalOperations: 0,
    memoryUsage: 0,
    evictions: 0
  };
  
  // Default cache configurations for different resource types
  private readonly defaultConfigs: Record<string, CacheConfig> = {
    'api': {
      ttl: 300, // 5 minutes
      strategy: 'CACHE_FIRST',
      tags: ['api'],
      vary: ['Authorization'],
      maxAge: 300,
      sMaxAge: 600,
      staleWhileRevalidate: 60
    },
    'static': {
      ttl: 86400, // 24 hours
      strategy: 'CACHE_FIRST',
      tags: ['static'],
      vary: [],
      maxAge: 86400,
      sMaxAge: 31536000, // 1 year
      staleWhileRevalidate: 3600
    },
    'dynamic': {
      ttl: 60, // 1 minute
      strategy: 'STALE_WHILE_REVALIDATE',
      tags: ['dynamic'],
      vary: ['Authorization', 'Accept-Language'],
      maxAge: 60,
      sMaxAge: 120,
      staleWhileRevalidate: 30
    },
    'warehouse': {
      ttl: 180, // 3 minutes
      strategy: 'NETWORK_FIRST',
      tags: ['warehouse', 'inventory'],
      vary: ['Authorization'],
      maxAge: 180,
      sMaxAge: 360,
      staleWhileRevalidate: 60
    }
  };

  /**
   * Main caching middleware function
   */
  async handle(request: NextRequest, resourceType: keyof typeof this.defaultConfigs = 'api'): Promise<NextResponse | null> {
    const startTime = Date.now();
    
    try {
      const config = this.defaultConfigs[resourceType];
      const cacheKey = this.generateCacheKey(request, config);
      
      // Check if method is cacheable
      if (!this.isCacheable(request)) {
        return null;
      }
      
      // Try to get cached response
      const cachedEntry = this.get(cacheKey);
      
      if (cachedEntry) {
        // Cache hit
        this.recordHit();
        
        const response = new NextResponse(JSON.stringify(cachedEntry.data), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': this.buildCacheControlHeader(config),
            'ETag': cachedEntry.etag,
            'X-Cache': 'HIT',
            'X-Cache-TTL': (cachedEntry.ttl - (Date.now() - cachedEntry.timestamp) / 1000).toString()
          }
        });
        
        this.logger.info(`Cache hit for ${cacheKey} in ${Date.now() - startTime}ms`);
        return response;
      }
      
      // Cache miss
      this.recordMiss();
      this.logger.info(`Cache miss for ${cacheKey}`);
      
      return null; // Let the request continue to the actual handler
      
    } catch (error) {
      this.logger.error('Caching middleware error:', error);
      return null; // Fail gracefully
    }
  }

  /**
   * Cache a response
   */
  async cacheResponse(
    request: NextRequest,
    response: NextResponse,
    resourceType: keyof typeof this.defaultConfigs = 'api'
  ): Promise<NextResponse> {
    try {
      const config = this.defaultConfigs[resourceType];
      const cacheKey = this.generateCacheKey(request, config);
      
      if (!this.isCacheable(request) || !this.isResponseCacheable(response)) {
        return response;
      }
      
      // Extract response data
      const responseBody = await response.text();
      let data: any;
      
      try {
        data = JSON.parse(responseBody);
      } catch {
        data = responseBody;
      }
      
      // Create cache entry
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        ttl: config.ttl * 1000, // Convert to milliseconds
        tags: config.tags,
        etag: this.generateETag(data),
        compressed: false
      };
      
      // Store in cache
      this.set(cacheKey, entry);
      
      // Create new response with cache headers
      const cachedResponse = new NextResponse(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'Cache-Control': this.buildCacheControlHeader(config),
          'ETag': entry.etag,
          'X-Cache': 'MISS',
          'Last-Modified': new Date().toUTCString()
        }
      });
      
      this.logger.info(`Cached response for ${cacheKey}`);
      return cachedResponse;
      
    } catch (error) {
      this.logger.error('Error caching response:', error);
      return response;
    }
  }

  /**
   * Get cached entry
   */
  get<T = any>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.evictions++;
      return null;
    }
    
    return entry as CacheEntry<T>;
  }

  /**
   * Set cache entry
   */
  set<T = any>(key: string, entry: CacheEntry<T>): void {
    // Check memory limits
    if (this.cache.size > 10000) { // Max 10k entries
      this.evictLeastRecentlyUsed();
    }
    
    this.cache.set(key, entry);
    this.updateMemoryUsage();
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateMemoryUsage();
    }
    return deleted;
  }

  /**
   * Clear cache by tags
   */
  clearByTags(tags: string[]): number {
    let cleared = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        cleared++;
      }
    }
    
    this.updateMemoryUsage();
    this.logger.info(`Cleared ${cleared} cache entries with tags: ${tags.join(', ')}`);
    
    return cleared;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.evictions += this.cache.size;
    this.updateMemoryUsage();
    this.logger.info('Cleared all cache entries');
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(request: NextRequest, config: CacheConfig): string {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const searchParams = url.searchParams.toString();
    
    // Include vary headers in cache key
    const varyValues = config.vary.map(header => 
      request.headers.get(header) || ''
    ).join('|');
    
    const keyParts = [pathname, searchParams, varyValues].filter(Boolean);
    return keyParts.join(':');
  }

  /**
   * Check if request is cacheable
   */
  private isCacheable(request: NextRequest): boolean {
    const method = request.method.toLowerCase();
    const url = new URL(request.url);
    
    // Only cache GET and HEAD requests
    if (!['get', 'head'].includes(method)) {
      return false;
    }
    
    // Don't cache requests with authorization unless specifically configured
    if (request.headers.get('authorization') && !url.pathname.startsWith('/api/public')) {
      return true; // We handle auth in cache key
    }
    
    // Don't cache requests with cache-busting parameters
    if (url.searchParams.has('_t') || url.searchParams.has('nocache')) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if response is cacheable
   */
  private isResponseCacheable(response: NextResponse): boolean {
    const status = response.status;
    
    // Only cache successful responses
    if (status < 200 || status >= 300) {
      return false;
    }
    
    // Check cache-control header
    const cacheControl = response.headers.get('cache-control');
    if (cacheControl && (cacheControl.includes('no-cache') || cacheControl.includes('no-store'))) {
      return false;
    }
    
    return true;
  }

  /**
   * Build Cache-Control header
   */
  private buildCacheControlHeader(config: CacheConfig): string {
    const directives = [];
    
    if (config.maxAge > 0) {
      directives.push(`max-age=${config.maxAge}`);
    }
    
    if (config.sMaxAge > 0) {
      directives.push(`s-maxage=${config.sMaxAge}`);
    }
    
    if (config.staleWhileRevalidate > 0) {
      directives.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
    }
    
    directives.push('public');
    
    return directives.join(', ');
  }

  /**
   * Generate ETag for response data
   */
  private generateETag(data: any): string {
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    const hash = require('crypto').createHash('md5').update(content).digest('hex');
    return `"${hash}"`;
  }

  /**
   * Record cache hit
   */
  private recordHit(): void {
    this.stats.hits++;
    this.stats.totalOperations++;
    this.updateHitRate();
  }

  /**
   * Record cache miss
   */
  private recordMiss(): void {
    this.stats.misses++;
    this.stats.totalOperations++;
    this.updateHitRate();
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    if (this.stats.totalOperations > 0) {
      this.stats.hitRate = (this.stats.hits / this.stats.totalOperations) * 100;
    }
  }

  /**
   * Update memory usage
   */
  private updateMemoryUsage(): void {
    let totalSize = 0;
    
    for (const entry of this.cache.values()) {
      const entrySize = JSON.stringify(entry).length * 2; // Rough estimate in bytes
      totalSize += entrySize;
    }
    
    this.stats.memoryUsage = totalSize;
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastRecentlyUsed(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 10% of entries
    const toRemove = Math.floor(entries.length * 0.1);
    
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
      this.stats.evictions++;
    }
    
    this.logger.info(`Evicted ${toRemove} least recently used cache entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache size
   */
  getSize(): number {
    return this.cache.size;
  }

  /**
   * Warm up cache with common requests
   */
  async warmUp(requests: { path: string; headers?: Record<string, string> }[]): Promise<void> {
    this.logger.info(`Warming up cache with ${requests.length} requests`);
    
    for (const req of requests) {
      try {
        // Create request for cache key generation
        const testRequest = new NextRequest(`http://localhost${req.path}`, {
          headers: req.headers || {}
        });
        
        const cacheKey = this.generateCacheKey(testRequest, this.defaultConfigs.api);
        
        // Pre-populate with cache warm-up data
        this.set(cacheKey, {
          data: { initialized: true, path: req.path },
          timestamp: Date.now(),
          ttl: 60000, // 1 minute
          tags: ['warmup'],
          etag: this.generateETag({ initialized: true }),
          compressed: false
        });
        
      } catch (error) {
        this.logger.error(`Failed to warm up cache for ${req.path}:`, error);
      }
    }
    
    this.logger.info('Cache warm-up completed');
  }
}

// Middleware function for Next.js
export function withCaching(resourceType: keyof CachingMiddleware['defaultConfigs'] = 'api') {
  const cachingMiddleware = new CachingMiddleware();
  
  return async function middleware(request: NextRequest) {
    // Check cache first
    const cachedResponse = await cachingMiddleware.handle(request, resourceType);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Continue to next middleware/handler
    return NextResponse.next();
  };
}

// Export singleton instance
export const cachingMiddleware = new CachingMiddleware();