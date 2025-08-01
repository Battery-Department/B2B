// RHY Enterprise Analytics Engine Tests
// Comprehensive test suite for analytics processing and ML insights

import { AnalyticsEngine } from '@/services/warehouse/AnalyticsEngine';
import { performanceMonitor } from '@/lib/performance';
import { AnalyticsQuery, AnalyticsResult } from '@/types/analytics';

// Mock dependencies
jest.mock('@/lib/performance');
jest.mock('@prisma/client');

const mockPerformanceMonitor = performanceMonitor as jest.Mocked<typeof performanceMonitor>;

describe('AnalyticsEngine', () => {
  let analyticsEngine: AnalyticsEngine;
  
  beforeEach(() => {
    jest.clearAllMocks();
    analyticsEngine = new AnalyticsEngine();
    mockPerformanceMonitor.track = jest.fn();
  });

  describe('executeQuery', () => {
    const mockQuery: AnalyticsQuery = {
      id: 'test-query-1',
      name: 'Test Warehouse Performance',
      type: 'BATCH',
      dataSource: 'warehouse_metrics',
      query: {
        select: ['revenue', 'orders', 'efficiency'],
        from: 'warehouse_metrics',
        where: [
          {
            field: 'date',
            operator: 'BETWEEN',
            value: ['2024-01-01', '2024-01-31']
          }
        ],
        groupBy: ['warehouse_id'],
        orderBy: [{ field: 'revenue', direction: 'DESC' }],
        limit: 100
      },
      parameters: [],
      caching: {
        enabled: true,
        ttl: 3600,
        invalidationRules: []
      }
    };

    it('should execute batch query successfully', async () => {
      const result = await analyticsEngine.executeQuery(mockQuery);

      expect(result).toBeDefined();
      expect(result.queryId).toBe(mockQuery.id);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.executionTime).toBeGreaterThan(0);
      expect(result.statistics).toBeDefined();
      expect(result.insights).toBeDefined();

      expect(mockPerformanceMonitor.track).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'executeQuery',
          queryType: 'BATCH',
          success: true
        })
      );
    });

    it('should handle realtime queries', async () => {
      const realtimeQuery = { ...mockQuery, type: 'REALTIME' as const };
      
      const result = await analyticsEngine.executeQuery(realtimeQuery);

      expect(result).toBeDefined();
      expect(result.metadata.executionTime).toBeLessThan(50); // Realtime should be fast
    });

    it('should handle streaming queries', async () => {
      const streamingQuery = { ...mockQuery, type: 'STREAMING' as const };
      
      const result = await analyticsEngine.executeQuery(streamingQuery);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it('should use cache when enabled', async () => {
      // First execution
      await analyticsEngine.executeQuery(mockQuery);
      
      // Second execution should use cache
      const result = await analyticsEngine.executeQuery(mockQuery);

      expect(result.metadata.cacheHit).toBe(true);
    });

    it('should handle query errors gracefully', async () => {
      const invalidQuery = {
        ...mockQuery,
        query: {
          ...mockQuery.query,
          from: 'nonexistent_table'
        }
      };

      await expect(analyticsEngine.executeQuery(invalidQuery)).rejects.toThrow();

      expect(mockPerformanceMonitor.track).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String)
        })
      );
    });
  });

  describe('getFlexVoltAnalytics', () => {
    const timeRange = {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    };

    it('should return comprehensive FlexVolt analytics', async () => {
      const result = await analyticsEngine.getFlexVoltAnalytics(timeRange);

      expect(result).toBeDefined();
      expect(result.batteryPerformance).toBeDefined();
      expect(Array.isArray(result.batteryPerformance)).toBe(true);
      expect(result.runtimeAnalysis).toBeDefined();
      expect(result.compatibilityMetrics).toBeDefined();
      expect(result.marketInsights).toBeDefined();

      // Verify battery performance includes all models
      const models = result.batteryPerformance.map(bp => bp.model);
      expect(models).toContain('6Ah');
      expect(models).toContain('9Ah');
      expect(models).toContain('15Ah');
    });

    it('should calculate runtime analysis correctly', async () => {
      const result = await analyticsEngine.getFlexVoltAnalytics(timeRange);

      expect(result.runtimeAnalysis.averageRuntime).toBeGreaterThan(0);
      expect(result.runtimeAnalysis.runtimeDistribution).toBeDefined();
      expect(Array.isArray(result.runtimeAnalysis.runtimeDistribution)).toBe(true);
      expect(result.runtimeAnalysis.factorsAffectingRuntime).toBeDefined();

      // Verify runtime distribution percentages sum to 100
      const totalPercentage = result.runtimeAnalysis.runtimeDistribution
        .reduce((sum, dist) => sum + dist.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 1);
    });

    it('should provide compatibility metrics', async () => {
      const result = await analyticsEngine.getFlexVoltAnalytics(timeRange);

      expect(result.compatibilityMetrics.toolCompatibility).toBeDefined();
      expect(Array.isArray(result.compatibilityMetrics.toolCompatibility)).toBe(true);
      expect(result.compatibilityMetrics.crossCompatibilityIndex).toBeGreaterThanOrEqual(0);
      expect(result.compatibilityMetrics.crossCompatibilityIndex).toBeLessThanOrEqual(1);
    });

    it('should include market insights', async () => {
      const result = await analyticsEngine.getFlexVoltAnalytics(timeRange);

      expect(result.marketInsights.totalMarketSize).toBeGreaterThan(0);
      expect(result.marketInsights.marketGrowthRate).toBeDefined();
      expect(result.marketInsights.competitorAnalysis).toBeDefined();
      expect(Array.isArray(result.marketInsights.competitorAnalysis)).toBe(true);
      expect(result.marketInsights.customerSegments).toBeDefined();
    });
  });

  describe('generatePredictiveInsights', () => {
    const mockMetrics = [
      {
        warehouseId: 'warehouse1',
        metrics: {
          revenue: 100000,
          orders: 500,
          efficiency: 85
        },
        trends: {
          revenueGrowth: 0.15,
          orderGrowth: 0.12
        }
      }
    ];

    it('should generate demand forecasts', async () => {
      const insights = await analyticsEngine.generatePredictiveInsights(mockMetrics);

      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);

      const demandForecast = insights.find(i => i.type === 'demand_forecast');
      expect(demandForecast).toBeDefined();
      expect(demandForecast?.confidence).toBeGreaterThan(0);
      expect(demandForecast?.confidence).toBeLessThanOrEqual(1);
    });

    it('should identify optimization opportunities', async () => {
      const insights = await analyticsEngine.generatePredictiveInsights(mockMetrics);

      const optimization = insights.find(i => i.type === 'optimization_opportunity');
      expect(optimization).toBeDefined();
      expect(optimization?.impact).toMatch(/^(LOW|MEDIUM|HIGH)$/);
    });

    it('should detect risk factors', async () => {
      const riskMetrics = [
        {
          ...mockMetrics[0],
          metrics: {
            ...mockMetrics[0].metrics,
            efficiency: 45 // Low efficiency should trigger risk
          }
        }
      ];

      const insights = await analyticsEngine.generatePredictiveInsights(riskMetrics);

      const riskInsight = insights.find(i => i.type === 'risk_factor');
      expect(riskInsight).toBeDefined();
      expect(riskInsight?.impact).toBe('HIGH');
    });
  });

  describe('processRealTimeData', () => {
    it('should process streaming data efficiently', async () => {
      const mockStreamData = {
        timestamp: new Date(),
        warehouseId: 'warehouse1',
        metrics: {
          ordersPerHour: 50,
          revenuePerHour: 5000,
          alertsActive: 2
        }
      };

      const startTime = performance.now();
      const result = await analyticsEngine.processRealTimeData(mockStreamData);
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10); // Should be very fast
    });

    it('should detect anomalies in real-time data', async () => {
      const anomalousData = {
        timestamp: new Date(),
        warehouseId: 'warehouse1',
        metrics: {
          ordersPerHour: 500, // Unusually high
          revenuePerHour: 50000,
          alertsActive: 0
        }
      };

      const result = await analyticsEngine.processRealTimeData(anomalousData);

      expect(result.anomalies).toBeDefined();
      expect(result.anomalies.length).toBeGreaterThan(0);
    });
  });

  describe('getBatchAnalytics', () => {
    const config = {
      batchSize: 1000,
      processingInterval: 60000,
      retentionPeriod: 86400000
    };

    it('should process batch data within time limits', async () => {
      const startTime = performance.now();
      const result = await analyticsEngine.getBatchAnalytics(config);
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(result.processedRecords).toBeGreaterThanOrEqual(0);
      expect(result.processingTime).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Within 1 second
    });

    it('should handle large batch sizes', async () => {
      const largeBatchConfig = { ...config, batchSize: 10000 };
      
      const result = await analyticsEngine.getBatchAnalytics(largeBatchConfig);

      expect(result.processedRecords).toBeLessThanOrEqual(largeBatchConfig.batchSize);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Statistical Analysis', () => {
    it('should calculate descriptive statistics', async () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const stats = await analyticsEngine.calculateDescriptiveStats(data, 'test_metric');

      expect(stats.mean).toBe(5.5);
      expect(stats.median).toBe(5.5);
      expect(stats.standardDeviation).toBeGreaterThan(0);
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(10);
      expect(stats.count).toBe(10);
    });

    it('should detect outliers', async () => {
      const dataWithOutliers = [1, 2, 3, 4, 5, 100]; // 100 is outlier
      const outliers = await analyticsEngine.detectOutliers(dataWithOutliers);

      expect(outliers).toBeDefined();
      expect(outliers.length).toBeGreaterThan(0);
      expect(outliers).toContain(100);
    });

    it('should perform correlation analysis', async () => {
      const dataset1 = [1, 2, 3, 4, 5];
      const dataset2 = [2, 4, 6, 8, 10]; // Perfect positive correlation

      const correlation = await analyticsEngine.calculateCorrelation(dataset1, dataset2);

      expect(correlation).toBeCloseTo(1, 2); // Should be close to 1
    });
  });

  describe('Machine Learning Integration', () => {
    it('should make predictions using trained models', async () => {
      const features = {
        warehouse_size: 10000,
        location_score: 8.5,
        staff_count: 25,
        seasonal_factor: 1.2
      };

      const prediction = await analyticsEngine.predict('demand_model', features);

      expect(prediction).toBeDefined();
      expect(prediction.value).toBeGreaterThan(0);
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
    });

    it('should cluster warehouses by performance', async () => {
      const warehouseData = [
        { id: 'wh1', revenue: 100000, efficiency: 85, satisfaction: 4.5 },
        { id: 'wh2', revenue: 150000, efficiency: 90, satisfaction: 4.8 },
        { id: 'wh3', revenue: 80000, efficiency: 75, satisfaction: 4.2 }
      ];

      const clusters = await analyticsEngine.clusterWarehouses(warehouseData);

      expect(clusters).toBeDefined();
      expect(Array.isArray(clusters)).toBe(true);
      expect(clusters.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimization', () => {
    it('should handle concurrent query execution', async () => {
      const queries = Array(5).fill(null).map((_, i) => ({
        ...mockQuery,
        id: `concurrent-query-${i}`
      }));

      const startTime = performance.now();
      const results = await Promise.all(
        queries.map(query => analyticsEngine.executeQuery(query))
      );
      const endTime = performance.now();

      expect(results).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(500); // Should handle concurrency well
      
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
      });
    });

    it('should optimize query execution plans', async () => {
      const complexQuery = {
        ...mockQuery,
        query: {
          ...mockQuery.query,
          where: [
            { field: 'date', operator: 'BETWEEN', value: ['2024-01-01', '2024-12-31'] },
            { field: 'warehouse_id', operator: 'IN', value: ['wh1', 'wh2', 'wh3'] },
            { field: 'revenue', operator: 'GREATER_THAN', value: 10000 }
          ],
          groupBy: ['warehouse_id', 'date'],
          orderBy: [
            { field: 'revenue', direction: 'DESC' },
            { field: 'date', direction: 'ASC' }
          ]
        }
      };

      const result = await analyticsEngine.executeQuery(complexQuery);

      expect(result).toBeDefined();
      expect(result.metadata.executionTime).toBeLessThan(200); // Should be optimized
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should gracefully handle database timeouts', async () => {
      // Mock timeout scenario
      jest.spyOn(analyticsEngine as any, 'executeRawQuery').mockRejectedValue(
        new Error('Query timeout')
      );

      await expect(analyticsEngine.executeQuery(mockQuery)).rejects.toThrow();

      expect(mockPerformanceMonitor.track).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Query timeout'
        })
      );
    });

    it('should retry failed operations', async () => {
      let callCount = 0;
      jest.spyOn(analyticsEngine as any, 'executeRawQuery').mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve([]);
      });

      const result = await analyticsEngine.executeQuery(mockQuery);

      expect(result).toBeDefined();
      expect(callCount).toBe(3); // Should have retried twice
    });

    it('should handle memory pressure gracefully', async () => {
      const largeDataQuery = {
        ...mockQuery,
        query: {
          ...mockQuery.query,
          limit: 1000000 // Very large limit
        }
      };

      // Should not crash or timeout
      await expect(analyticsEngine.executeQuery(largeDataQuery)).resolves.toBeDefined();
    });
  });
});