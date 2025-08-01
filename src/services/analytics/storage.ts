/**
 * Analytics Storage Service
 * Efficient data storage using Prisma with batching and retention
 */

import { PrismaClient } from '@prisma/client';
import { AnalyticsEvent } from './enhanced-analytics';
import { DATA_POINTS, DataPointCategory } from './data-points';
import { EventEmitter } from 'events';

const prisma = new PrismaClient();

export interface StorageOptions {
  batchSize?: number;
  batchInterval?: number;
  retentionDays?: number;
  compressionEnabled?: boolean;
}

export interface StoredEvent {
  id: string;
  sessionId: string;
  userId?: string;
  eventName: string;
  eventCategory: string;
  eventData: any;
  dataPoints: any;
  context: any;
  timestamp: Date;
  createdAt: Date;
}

export interface QueryOptions {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  sessionId?: string;
  eventNames?: string[];
  eventCategories?: string[];
  dataPointFilters?: Array<{
    dataPoint: string;
    operator: 'equals' | 'contains' | 'greater' | 'less';
    value: any;
  }>;
  limit?: number;
  offset?: number;
  orderBy?: 'timestamp' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

export interface AggregateQuery {
  metric: 'count' | 'sum' | 'avg' | 'min' | 'max';
  field?: string;
  groupBy?: string[];
  having?: Record<string, any>;
}

export class AnalyticsStorage extends EventEmitter {
  private eventBatch: AnalyticsEvent[] = [];
  private batchTimer?: NodeJS.Timeout;
  private options: Required<StorageOptions>;
  private isProcessing: boolean = false;

  constructor(options: StorageOptions = {}) {
    super();
    this.options = {
      batchSize: options.batchSize || 1000,
      batchInterval: options.batchInterval || 10000, // 10 seconds
      retentionDays: options.retentionDays || 365, // 1 year
      compressionEnabled: options.compressionEnabled !== false
    };

    this.startBatchProcessing();
    this.scheduleRetentionCleanup();
  }

  /**
   * Store an analytics event
   */
  public async storeEvent(event: AnalyticsEvent): Promise<void> {
    this.eventBatch.push(event);

    if (this.eventBatch.length >= this.options.batchSize) {
      await this.processBatch();
    }
  }

  /**
   * Store multiple events
   */
  public async storeEvents(events: AnalyticsEvent[]): Promise<void> {
    this.eventBatch.push(...events);

    if (this.eventBatch.length >= this.options.batchSize) {
      await this.processBatch();
    }
  }

  /**
   * Query stored events
   */
  public async queryEvents(options: QueryOptions): Promise<StoredEvent[]> {
    try {
      const where: any = {};

      // Date range filter
      if (options.startDate || options.endDate) {
        where.timestamp = {};
        if (options.startDate) {
          where.timestamp.gte = options.startDate;
        }
        if (options.endDate) {
          where.timestamp.lte = options.endDate;
        }
      }

      // User and session filters
      if (options.userId) {
        where.userId = options.userId;
      }
      if (options.sessionId) {
        where.sessionId = options.sessionId;
      }

      // Event filters
      if (options.eventNames && options.eventNames.length > 0) {
        where.eventName = { in: options.eventNames };
      }
      if (options.eventCategories && options.eventCategories.length > 0) {
        where.eventCategory = { in: options.eventCategories };
      }

      // Execute query
      const events = await prisma.analyticsEvent.findMany({
        where,
        take: options.limit,
        skip: options.offset,
        orderBy: {
          [options.orderBy || 'timestamp']: options.orderDirection || 'desc'
        }
      });

      // Apply data point filters in memory (since they're in JSON)
      if (options.dataPointFilters && options.dataPointFilters.length > 0) {
        return events.filter(event => {
          const dataPoints = this.decompressData(event.dataPoints);
          
          return options.dataPointFilters!.every(filter => {
            const value = dataPoints[filter.dataPoint];
            return this.checkCondition(value, filter.operator, filter.value);
          });
        });
      }

      return events.map(event => ({
        ...event,
        eventData: this.decompressData(event.eventData),
        dataPoints: this.decompressData(event.dataPoints),
        context: this.decompressData(event.context)
      }));
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Aggregate data
   */
  public async aggregate(
    query: AggregateQuery,
    options: QueryOptions = {}
  ): Promise<any[]> {
    try {
      // For complex aggregations, we'll use raw SQL
      let sql = `
        SELECT 
      `;

      // Add groupBy fields
      if (query.groupBy && query.groupBy.length > 0) {
        sql += query.groupBy.map(field => `${field}`).join(', ') + ', ';
      }

      // Add aggregate function
      switch (query.metric) {
        case 'count':
          sql += `COUNT(*) as value`;
          break;
        case 'sum':
          sql += `SUM(CAST(json_extract(eventData, '$.${query.field}') AS REAL)) as value`;
          break;
        case 'avg':
          sql += `AVG(CAST(json_extract(eventData, '$.${query.field}') AS REAL)) as value`;
          break;
        case 'min':
          sql += `MIN(CAST(json_extract(eventData, '$.${query.field}') AS REAL)) as value`;
          break;
        case 'max':
          sql += `MAX(CAST(json_extract(eventData, '$.${query.field}') AS REAL)) as value`;
          break;
      }

      sql += ` FROM AnalyticsEvent WHERE 1=1`;

      // Add WHERE conditions
      const params: any[] = [];
      
      if (options.startDate) {
        sql += ` AND timestamp >= ?`;
        params.push(options.startDate.toISOString());
      }
      if (options.endDate) {
        sql += ` AND timestamp <= ?`;
        params.push(options.endDate.toISOString());
      }
      if (options.userId) {
        sql += ` AND userId = ?`;
        params.push(options.userId);
      }
      if (options.sessionId) {
        sql += ` AND sessionId = ?`;
        params.push(options.sessionId);
      }
      if (options.eventNames && options.eventNames.length > 0) {
        sql += ` AND eventName IN (${options.eventNames.map(() => '?').join(',')})`;
        params.push(...options.eventNames);
      }

      // Add GROUP BY
      if (query.groupBy && query.groupBy.length > 0) {
        sql += ` GROUP BY ${query.groupBy.join(', ')}`;
      }

      // Add HAVING
      if (query.having) {
        const havingConditions = Object.entries(query.having)
          .map(([field, value]) => `${field} = ?`);
        sql += ` HAVING ${havingConditions.join(' AND ')}`;
        params.push(...Object.values(query.having));
      }

      // Execute query
      const result = await prisma.$queryRawUnsafe(sql, ...params);
      return result as any[];
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  public async getStats(): Promise<{
    totalEvents: number;
    uniqueUsers: number;
    uniqueSessions: number;
    dateRange: { oldest: Date; newest: Date };
    topEvents: Array<{ eventName: string; count: number }>;
    storageSize: number;
  }> {
    try {
      const [
        totalEvents,
        uniqueUsers,
        uniqueSessions,
        dateRange,
        topEvents
      ] = await Promise.all([
        prisma.analyticsEvent.count(),
        prisma.analyticsEvent.groupBy({
          by: ['userId'],
          where: { userId: { not: null } },
          _count: true
        }).then(r => r.length),
        prisma.analyticsEvent.groupBy({
          by: ['sessionId'],
          _count: true
        }).then(r => r.length),
        prisma.analyticsEvent.aggregate({
          _min: { timestamp: true },
          _max: { timestamp: true }
        }),
        prisma.analyticsEvent.groupBy({
          by: ['eventName'],
          _count: { eventName: true },
          orderBy: { _count: { eventName: 'desc' } },
          take: 10
        })
      ]);

      // Estimate storage size (simplified)
      const avgEventSize = 1024; // 1KB average per event
      const storageSize = totalEvents * avgEventSize;

      return {
        totalEvents,
        uniqueUsers,
        uniqueSessions,
        dateRange: {
          oldest: dateRange._min.timestamp || new Date(),
          newest: dateRange._max.timestamp || new Date()
        },
        topEvents: topEvents.map(e => ({
          eventName: e.eventName,
          count: e._count.eventName
        })),
        storageSize
      };
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Optimize storage
   */
  public async optimize(): Promise<{
    deletedEvents: number;
    compressedEvents: number;
    freedSpace: number;
  }> {
    try {
      // Delete old events based on retention policy
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - this.options.retentionDays);

      const deleted = await prisma.analyticsEvent.deleteMany({
        where: {
          timestamp: {
            lt: retentionDate
          }
        }
      });

      // In a real implementation, you would also:
      // 1. Compress older events
      // 2. Archive to cheaper storage
      // 3. Create summary tables for faster queries

      this.emit('optimize:complete', {
        deletedEvents: deleted.count,
        compressedEvents: 0,
        freedSpace: deleted.count * 1024 // Estimated
      });

      return {
        deletedEvents: deleted.count,
        compressedEvents: 0,
        freedSpace: deleted.count * 1024
      };
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Export data
   */
  public async exportData(
    options: QueryOptions,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const events = await this.queryEvents(options);

      if (format === 'json') {
        return JSON.stringify(events, null, 2);
      } else {
        // CSV export
        if (events.length === 0) return '';

        const headers = Object.keys(events[0]);
        const csvRows = [headers.join(',')];

        for (const event of events) {
          const values = headers.map(header => {
            const value = event[header as keyof StoredEvent];
            if (typeof value === 'object') {
              return JSON.stringify(value);
            }
            return value?.toString() || '';
          });
          csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
      }
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // Private methods

  private startBatchProcessing(): void {
    this.batchTimer = setInterval(() => {
      if (this.eventBatch.length > 0) {
        this.processBatch();
      }
    }, this.options.batchInterval);
  }

  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.eventBatch.length === 0) return;

    this.isProcessing = true;
    const batch = this.eventBatch.splice(0, this.options.batchSize);

    try {
      const records = batch.map(event => ({
        id: event.id,
        sessionId: event.sessionId,
        userId: event.userId,
        eventName: event.eventName,
        eventCategory: event.eventCategory,
        eventData: this.compressData(event.eventData),
        dataPoints: this.compressData(event.dataPoints),
        context: this.compressData(event.context),
        timestamp: event.timestamp
      }));

      await prisma.analyticsEvent.createMany({
        data: records,
        skipDuplicates: true
      });

      this.emit('batch:stored', {
        count: records.length,
        timestamp: new Date()
      });
    } catch (error) {
      // Re-queue failed events
      this.eventBatch.unshift(...batch);
      this.emit('batch:error', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private scheduleRetentionCleanup(): void {
    // Run cleanup daily
    setInterval(() => {
      this.optimize();
    }, 24 * 60 * 60 * 1000);
  }

  private compressData(data: any): any {
    if (!this.options.compressionEnabled) {
      return data;
    }

    // Simple compression by removing null/undefined values
    if (typeof data === 'object' && data !== null) {
      const compressed: any = Array.isArray(data) ? [] : {};
      
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) {
          compressed[key] = this.compressData(value);
        }
      }
      
      return compressed;
    }
    
    return data;
  }

  private decompressData(data: any): any {
    // In a real implementation, you would decompress the data
    return data;
  }

  private checkCondition(value: any, operator: string, targetValue: any): boolean {
    switch (operator) {
      case 'equals':
        return value === targetValue;
      case 'contains':
        return String(value).includes(targetValue);
      case 'greater':
        return Number(value) > Number(targetValue);
      case 'less':
        return Number(value) < Number(targetValue);
      default:
        return false;
    }
  }

  public async destroy(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    // Process remaining events
    if (this.eventBatch.length > 0) {
      await this.processBatch();
    }

    await prisma.$disconnect();
    this.removeAllListeners();
  }
}

// Create singleton instance
export const analyticsStorage = new AnalyticsStorage();

// Export types
export type { AnalyticsStorage };