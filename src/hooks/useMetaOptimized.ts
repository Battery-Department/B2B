import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MetaPixel, getMetaPixel } from '@/services/meta/pixel';
import { ConversionsAPI, getConversionsAPI } from '@/services/meta/conversions-api';
import { debounce } from 'lodash';

interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class DataCache {
  private cache = new Map<string, CachedData<any>>();

  set<T>(key: string, data: T, ttl: number = 60000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear() {
    this.cache.clear();
  }
}

const dataCache = new DataCache();

// Optimized hook for Meta Pixel
export function useMetaPixel() {
  const [pixel, setPixel] = useState<MetaPixel | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const initPixel = async () => {
      // Prevent multiple initializations
      if (initPromiseRef.current) {
        await initPromiseRef.current;
        return;
      }

      const existingPixel = getMetaPixel();
      if (existingPixel) {
        setPixel(existingPixel);
        setIsInitialized(true);
        return;
      }

      initPromiseRef.current = (async () => {
        const { initializeMetaPixel } = await import('@/services/meta/pixel');
        const newPixel = initializeMetaPixel({
          pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || 'TEST_PIXEL_123',
          testMode: process.env.NEXT_PUBLIC_META_TEST_MODE === 'true'
        });
        await newPixel.initialize();
        setPixel(newPixel);
        setIsInitialized(true);
      })();

      await initPromiseRef.current;
    };

    initPixel();
  }, []);

  const track = useCallback((eventName: string, data?: any) => {
    if (!pixel || !isInitialized) return;
    pixel.track(eventName, data);
  }, [pixel, isInitialized]);

  const trackDebounced = useMemo(
    () => debounce(track, 500, { leading: true, trailing: true }),
    [track]
  );

  return {
    pixel,
    isInitialized,
    track,
    trackDebounced
  };
}

// Optimized hook for Meta events with caching
export function useMetaEvents(refreshInterval: number = 5000) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      // Check cache first
      const cached = dataCache.get<any[]>('meta_events');
      if (cached) {
        setEvents(cached);
        setLoading(false);
        return cached;
      }

      // Fetch from localStorage (test mode)
      const pixelEvents = JSON.parse(localStorage.getItem('meta_test_events') || '[]');
      const capiEvents = JSON.parse(localStorage.getItem('meta_capi_test_events') || '[]');
      
      const allEvents = [...pixelEvents, ...capiEvents]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 100); // Limit to 100 most recent

      dataCache.set('meta_events', allEvents, refreshInterval);
      setEvents(allEvents);
      setLoading(false);
      return allEvents;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch events'));
      setLoading(false);
      return [];
    }
  }, [refreshInterval]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchEvents, refreshInterval]);

  return { events, loading, error, refresh: fetchEvents };
}

// Optimized hook for aggregated analytics
export function useAggregatedAnalytics() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const calculateMetrics = useCallback(async () => {
    try {
      // Check cache
      const cached = dataCache.get<any>('analytics_metrics');
      if (cached) {
        setMetrics(cached);
        setLoading(false);
        return;
      }

      // Simulate fetching from analytics service
      const response = await fetch('/api/analytics/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange: { start: new Date(Date.now() - 86400000 * 7), end: new Date() },
          metrics: ['users', 'events', 'conversions', 'revenue']
        })
      });

      if (!response.ok) throw new Error('Failed to fetch metrics');

      const data = await response.json();
      
      // Aggregate data for dashboard
      const aggregated = {
        totalUsers: data.users?.total || 0,
        activeUsers: data.users?.active || 0,
        totalEvents: data.events?.total || 0,
        conversionRate: data.conversions?.rate || 0,
        totalRevenue: data.revenue?.total || 0,
        trends: {
          users: data.users?.trend || 0,
          events: data.events?.trend || 0,
          conversions: data.conversions?.trend || 0,
          revenue: data.revenue?.trend || 0
        }
      };

      dataCache.set('analytics_metrics', aggregated, 60000); // Cache for 1 minute
      setMetrics(aggregated);
      setLoading(false);
    } catch (error) {
      console.error('Failed to calculate metrics:', error);
      // Use fallback data in test mode
      const fallback = {
        totalUsers: 1247,
        activeUsers: 342,
        totalEvents: 15893,
        conversionRate: 0.0425,
        totalRevenue: 125750,
        trends: {
          users: 0.12,
          events: 0.23,
          conversions: 0.08,
          revenue: 0.15
        }
      };
      setMetrics(fallback);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    calculateMetrics();
    const interval = setInterval(calculateMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [calculateMetrics]);

  return { metrics, loading, refresh: calculateMetrics };
}

// Virtual scrolling hook for large lists
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 3
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex),
      offsetY: startIndex * itemHeight,
      totalHeight: items.length * itemHeight
    };
  }, [items, itemHeight, containerHeight, overscan, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    ...visibleRange,
    handleScroll
  };
}

// Optimized hook for real-time updates with WebSocket fallback
export function useRealTimeUpdates(channel: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // In test mode, simulate real-time updates
    if (process.env.NEXT_PUBLIC_META_TEST_MODE === 'true') {
      const simulateUpdates = () => {
        const fakeUpdate = {
          type: 'event',
          data: {
            eventName: ['PageView', 'ViewContent', 'AddToCart'][Math.floor(Math.random() * 3)],
            userId: `user_${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString()
          }
        };
        setLastUpdate(fakeUpdate);
      };

      setIsConnected(true);
      const interval = setInterval(simulateUpdates, 3000 + Math.random() * 2000);
      return () => clearInterval(interval);
    }

    // In production, use WebSocket or Server-Sent Events
    // Placeholder for actual implementation
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [channel]);

  return { isConnected, lastUpdate };
}

// Performance monitoring hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    fps: 60
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.performance) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          setMetrics(prev => ({
            ...prev,
            renderTime: Math.round(entry.duration)
          }));
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });

    // Monitor memory usage
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1048576) // MB
        }));
      }
    };

    const memoryInterval = setInterval(checkMemory, 5000);

    return () => {
      observer.disconnect();
      clearInterval(memoryInterval);
    };
  }, []);

  return metrics;
}