/**
 * Analytics Reporting Utilities - RHY_061
 * Utility functions for data processing, calculations, and transformations
 */

import { z } from 'zod';
import type { 
  BusinessMetrics, 
  ExecutiveInsight, 
  KPISummary, 
  MetricSummary,
  PredictiveAnalytics,
  WarehouseComparison
} from '@/types/analytics_reporting';

/**
 * Validation schemas for analytics data
 */
export const analyticsSchemas = {
  timeRange: z.string().regex(/^\d+[dwmy]$/, 'Invalid time range format'),
  
  kpiQuery: z.object({
    timeRange: z.string(),
    categories: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional(),
    userId: z.string().optional()
  }),

  dashboardRequest: z.object({
    timeRange: z.string().default('30d'),
    userId: z.string().optional(),
    includeRealTime: z.boolean().default(true),
    includePredictions: z.boolean().default(true)
  })
};

/**
 * Date and time utilities
 */
export class DateUtils {
  /**
   * Parse time range string to date range
   */
  static parseTimeRange(timeRange: string): { start: Date; end: Date } {
    const now = new Date();
    const match = timeRange.match(/^(\d+)([dwmy])$/);
    
    if (!match) {
      throw new Error(`Invalid time range format: ${timeRange}`);
    }

    const [, amount, unit] = match;
    const value = parseInt(amount);
    let start: Date;

    switch (unit) {
      case 'd':
        start = new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
        break;
      case 'w':
        start = new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
        break;
      case 'm':
        start = new Date(now);
        start.setMonth(start.getMonth() - value);
        break;
      case 'y':
        start = new Date(now);
        start.setFullYear(start.getFullYear() - value);
        break;
      default:
        throw new Error(`Unsupported time unit: ${unit}`);
    }

    return { start, end: now };
  }

  /**
   * Format date for display
   */
  static formatDate(date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
    const options: Intl.DateTimeFormatOptions = {
      short: { month: 'short', day: 'numeric' },
      medium: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
    };

    return date.toLocaleDateString('en-US', options[format]);
  }

  /**
   * Get relative time description
   */
  static getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    
    return DateUtils.formatDate(date, 'short');
  }
}

/**
 * Mathematical and statistical utilities
 */
export class MathUtils {
  /**
   * Calculate percentage change
   */
  static calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Number(((current - previous) / previous * 100).toFixed(2));
  }

  /**
   * Calculate percentage of total
   */
  static calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Number((value / total * 100).toFixed(2));
  }

  /**
   * Calculate compound annual growth rate (CAGR)
   */
  static calculateCAGR(beginningValue: number, endingValue: number, periods: number): number {
    if (beginningValue === 0 || periods === 0) return 0;
    return Number((Math.pow(endingValue / beginningValue, 1 / periods) - 1) * 100).toFixed(2) as any;
  }

  /**
   * Calculate moving average
   */
  static calculateMovingAverage(values: number[], window: number): number[] {
    const result: number[] = [];
    
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - window + 1);
      const subset = values.slice(start, i + 1);
      const average = subset.reduce((sum, val) => sum + val, 0) / subset.length;
      result.push(Number(average.toFixed(2)));
    }
    
    return result;
  }

  /**
   * Calculate standard deviation
   */
  static calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Number(Math.sqrt(avgSquaredDiff).toFixed(2));
  }

  /**
   * Detect statistical outliers using IQR method
   */
  static detectOutliers(values: number[]): { outliers: number[]; indices: number[] } {
    if (values.length < 4) return { outliers: [], indices: [] };
    
    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const outliers: number[] = [];
    const indices: number[] = [];
    
    values.forEach((value, index) => {
      if (value < lowerBound || value > upperBound) {
        outliers.push(value);
        indices.push(index);
      }
    });
    
    return { outliers, indices };
  }

  /**
   * Calculate correlation coefficient
   */
  static calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    if (denominator === 0) return 0;
    
    return Number((numerator / denominator).toFixed(3));
  }
}

/**
 * Formatting utilities
 */
export class FormatUtils {
  /**
   * Format currency values
   */
  static formatCurrency(value: number, currency: string = 'USD', locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  /**
   * Format large numbers with abbreviations
   */
  static formatNumber(value: number, decimals: number = 1): string {
    const abbreviations = [
      { value: 1e12, suffix: 'T' },
      { value: 1e9, suffix: 'B' },
      { value: 1e6, suffix: 'M' },
      { value: 1e3, suffix: 'K' }
    ];

    for (const { value: threshold, suffix } of abbreviations) {
      if (Math.abs(value) >= threshold) {
        return (value / threshold).toFixed(decimals) + suffix;
      }
    }

    return value.toFixed(decimals);
  }

  /**
   * Format percentage values
   */
  static formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  /**
   * Format time duration
   */
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Format metric values with appropriate units
   */
  static formatMetric(value: number, unit: string): string {
    switch (unit) {
      case 'USD':
      case 'EUR':
      case 'JPY':
      case 'AUD':
        return FormatUtils.formatCurrency(value, unit);
      case '%':
        return FormatUtils.formatPercentage(value);
      case 'ms':
        return FormatUtils.formatDuration(value);
      default:
        return `${FormatUtils.formatNumber(value)} ${unit}`;
    }
  }
}

/**
 * Color utilities for charts and visualizations
 */
export class ColorUtils {
  private static readonly LITHI_COLORS = {
    primary: '#006FEE',
    secondary: '#0050B3',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  };

  /**
   * Get color palette for charts
   */
  static getChartColors(count: number): string[] {
    const baseColors = [
      ColorUtils.LITHI_COLORS.primary,
      ColorUtils.LITHI_COLORS.success,
      ColorUtils.LITHI_COLORS.warning,
      ColorUtils.LITHI_COLORS.info,
      ColorUtils.LITHI_COLORS.error,
      ColorUtils.LITHI_COLORS.secondary
    ];

    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }

    // Generate additional colors by varying saturation and lightness
    const colors = [...baseColors];
    while (colors.length < count) {
      const baseColor = baseColors[colors.length % baseColors.length];
      const variation = ColorUtils.adjustColor(baseColor, 
        (colors.length - baseColors.length) * 0.1);
      colors.push(variation);
    }

    return colors;
  }

  /**
   * Get color based on value and thresholds
   */
  static getValueColor(value: number, thresholds: { good: number; warning: number }): string {
    if (value >= thresholds.good) return ColorUtils.LITHI_COLORS.success;
    if (value >= thresholds.warning) return ColorUtils.LITHI_COLORS.warning;
    return ColorUtils.LITHI_COLORS.error;
  }

  /**
   * Get trend color
   */
  static getTrendColor(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up': return ColorUtils.LITHI_COLORS.success;
      case 'down': return ColorUtils.LITHI_COLORS.error;
      case 'stable': return ColorUtils.LITHI_COLORS.info;
      default: return ColorUtils.LITHI_COLORS.primary;
    }
  }

  /**
   * Adjust color brightness
   */
  private static adjustColor(hex: string, amount: number): string {
    const clamp = (val: number) => Math.min(255, Math.max(0, val));
    const fill = (str: string) => ('00' + str).slice(-2);
    
    const color = hex.replace('#', '');
    const num = parseInt(color, 16);
    const red = clamp((num >> 16) + amount * 255);
    const green = clamp(((num >> 8) & 0x00FF) + amount * 255);
    const blue = clamp((num & 0x0000FF) + amount * 255);
    
    return '#' + fill(red.toString(16)) + fill(green.toString(16)) + fill(blue.toString(16));
  }
}

/**
 * Data transformation utilities
 */
export class DataUtils {
  /**
   * Transform raw data to chart format
   */
  static transformForChart(
    data: Array<{ date: Date; value: number }>,
    format: 'line' | 'bar' | 'area' = 'line'
  ) {
    return data.map(item => ({
      x: DateUtils.formatDate(item.date, 'short'),
      y: item.value,
      date: item.date.toISOString()
    }));
  }

  /**
   * Group data by time period
   */
  static groupByPeriod(
    data: Array<{ date: Date; value: number }>,
    period: 'day' | 'week' | 'month'
  ) {
    const groups = new Map<string, number[]>();
    
    data.forEach(item => {
      let key: string;
      const date = new Date(item.date);
      
      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item.value);
    });
    
    return Array.from(groups.entries()).map(([key, values]) => ({
      period: key,
      total: values.reduce((sum, val) => sum + val, 0),
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    }));
  }

  /**
   * Calculate data quality score
   */
  static calculateDataQuality(data: any[]): number {
    if (data.length === 0) return 0;
    
    let nullCount = 0;
    let outlierCount = 0;
    const values: number[] = [];
    
    data.forEach(item => {
      if (item == null || item === undefined) {
        nullCount++;
      } else if (typeof item === 'number') {
        values.push(item);
      }
    });
    
    if (values.length > 0) {
      const { outliers } = MathUtils.detectOutliers(values);
      outlierCount = outliers.length;
    }
    
    const completeness = (data.length - nullCount) / data.length;
    const consistency = values.length > 0 ? (values.length - outlierCount) / values.length : 1;
    
    return Number((completeness * 0.7 + consistency * 0.3).toFixed(3));
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceUtils {
  private static readonly timers = new Map<string, number>();

  /**
   * Start performance timer
   */
  static startTimer(name: string): void {
    PerformanceUtils.timers.set(name, Date.now());
  }

  /**
   * End performance timer and return duration
   */
  static endTimer(name: string): number {
    const start = PerformanceUtils.timers.get(name);
    if (!start) {
      throw new Error(`Timer '${name}' not found`);
    }
    
    const duration = Date.now() - start;
    PerformanceUtils.timers.delete(name);
    return duration;
  }

  /**
   * Measure async function performance
   */
  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    PerformanceUtils.startTimer(name);
    const result = await fn();
    const duration = PerformanceUtils.endTimer(name);
    return { result, duration };
  }

  /**
   * Create performance benchmark
   */
  static createBenchmark() {
    const marks: Array<{ name: string; timestamp: number }> = [];
    
    return {
      mark: (name: string) => {
        marks.push({ name, timestamp: Date.now() });
      },
      
      measure: (startMark: string, endMark: string): number => {
        const start = marks.find(m => m.name === startMark);
        const end = marks.find(m => m.name === endMark);
        
        if (!start || !end) {
          throw new Error('Mark not found');
        }
        
        return end.timestamp - start.timestamp;
      },
      
      getReport: () => {
        return marks.map((mark, index) => {
          if (index === 0) {
            return { name: mark.name, duration: 0 };
          }
          
          return {
            name: mark.name,
            duration: mark.timestamp - marks[index - 1].timestamp
          };
        });
      }
    };
  }
}

/**
 * Cache utilities
 */
export class CacheUtils {
  private static readonly cache = new Map<string, { data: any; expires: number }>();

  /**
   * Set cache with expiration
   */
  static set(key: string, data: any, ttlMs: number): void {
    CacheUtils.cache.set(key, {
      data,
      expires: Date.now() + ttlMs
    });
  }

  /**
   * Get cached data
   */
  static get<T>(key: string): T | null {
    const entry = CacheUtils.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      CacheUtils.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Clear cache
   */
  static clear(pattern?: string): void {
    if (!pattern) {
      CacheUtils.cache.clear();
      return;
    }
    
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    
    CacheUtils.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => CacheUtils.cache.delete(key));
  }

  /**
   * Generate cache key
   */
  static generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `${prefix}:${sortedParams}`;
  }
}

/**
 * Export utility functions
 */
export const analyticsUtils = {
  DateUtils,
  MathUtils,
  FormatUtils,
  ColorUtils,
  DataUtils,
  PerformanceUtils,
  CacheUtils,
  schemas: analyticsSchemas
};