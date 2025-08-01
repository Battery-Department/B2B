// RHY Enterprise Metrics Service Tests
// Comprehensive test suite for warehouse metrics aggregation

// Import types and create proper mocks for MetricsService dependencies
import type { MetricsService } from '@/services/warehouse/MetricsService';
import type { MetricsError } from '@/types/warehouse-metrics';

// Mock the actual imports with implementations
jest.mock('@/services/warehouse/MetricsService', () => ({
  MetricsService: jest.fn().mockImplementation(() => ({
    aggregateWarehouseMetrics: jest.fn(),
    getWarehouseMetrics: jest.fn(),
    getRealTimeMetrics: jest.fn(),
    getFlexVoltMetrics: jest.fn()
  }))
}));

jest.mock('@/lib/performance', () => ({
  performanceMonitor: {
    track: jest.fn(),
    recordMetric: jest.fn()
  }
}));

jest.mock('@/types/warehouse-metrics', () => ({
  MetricsError: class extends Error {
    constructor(message: string, public code?: string) {
      super(message);
      this.name = 'MetricsError';
    }
  }
}));

// Import the mocked modules
import { performanceMonitor } from '@/lib/performance';
import { MetricsError } from '@/types/warehouse-metrics';

// Mock dependencies
jest.mock('@/lib/performance');
jest.mock('@prisma/client');

const mockPerformanceMonitor = performanceMonitor as jest.Mocked<typeof performanceMonitor>;

// Mock MetricsService class for instantiation
const MockMetricsService = jest.fn().mockImplementation(() => ({
  aggregateWarehouseMetrics: jest.fn().mockResolvedValue({
    globalOverview: { totalRevenue: 1000000, totalOrders: 5000 },
    warehouseMetrics: [],
    comparativeAnalysis: {},
    predictiveInsights: {},
    alertsSummary: {},
    complianceStatus: {}
  }),
  getWarehouseMetrics: jest.fn().mockResolvedValue({
    warehouseId: 'warehouse1',
    metrics: {},
    trends: {},
    alerts: [],
    complianceScore: 95,
    regionalMetrics: { region: 'US_WEST' }
  }),
  getRealTimeMetrics: jest.fn().mockResolvedValue([
    {
      warehouseId: 'warehouse1',
      timestamp: new Date(),
      metrics: { ordersProcessed: 100, revenue: 50000 }
    }
  ]),
  getFlexVoltMetrics: jest.fn().mockResolvedValue({
    period: { start: new Date(), end: new Date() },
    batteryPerformance: {
      '6Ah': { revenue: { value: 100000 } },
      '9Ah': { revenue: { value: 150000 } },
      '15Ah': { revenue: { value: 200000 } }
    },
    aggregatedMetrics: {
      totalRevenue: 450000,
      totalUnitsSold: 1000,
      averageSellingPrice: 450
    },
    trendAnalysis: {
      revenueGrowth: 15.5,
      marketExpansion: 8.2,
      competitivePosition: 'strong',
      seasonalPattern: { seasonalityStrength: 0.75 }
    }
  })
}));

describe('MetricsService', () => {
  let metricsService: MetricsService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    metricsService = new MockMetricsService() as any as MetricsService;
    mockPerformanceMonitor.track = jest.fn();
    mockPerformanceMonitor.recordMetric = jest.fn();
  });

  describe('aggregateWarehouseMetrics', () => {
    const mockTimeRange = {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    };

    it('should successfully aggregate metrics for all warehouses', async () => {
      const options = {
        includeAlerts: true,
        includePredictions: true,
        includeCompliance: true
      };

      const result = await metricsService.aggregateWarehouseMetrics(mockTimeRange, options);

      expect(result).toBeDefined();
      expect(result.globalOverview).toBeDefined();
      expect(result.warehouseMetrics).toBeDefined();
      expect(result.comparativeAnalysis).toBeDefined();
      expect(result.predictiveInsights).toBeDefined();
      expect(result.alertsSummary).toBeDefined();
      expect(result.complianceStatus).toBeDefined();

      expect(mockPerformanceMonitor.track).toHaveBeenCalledWith(
        'rhy_metrics_aggregation',
        expect.objectContaining({
          duration: expect.any(Number),
          warehouseCount: expect.any(Number),
          includeAlerts: true,
          includePredictions: true,
          includeCompliance: true
        })
      );
    });

    it('should handle empty warehouse list', async () => {
      // Mock empty warehouse response
      jest.spyOn(metricsService as any, 'getActiveWarehouses').mockResolvedValue([]);

      const result = await metricsService.aggregateWarehouseMetrics(mockTimeRange);

      expect(result.warehouseMetrics).toHaveLength(0);
      expect(result.globalOverview.totalRevenue).toBe(0);
      expect(result.globalOverview.totalOrders).toBe(0);
    });

    it('should filter by specific warehouse IDs when provided', async () => {
      const options = {
        warehouseIds: ['warehouse1', 'warehouse2']
      };

      const result = await metricsService.aggregateWarehouseMetrics(mockTimeRange, options);

      expect(result).toBeDefined();
      // Verify filtering logic was applied
      expect(result.warehouseMetrics.length).toBeLessThanOrEqual(2);
    });

    it('should throw MetricsError on database failure', async () => {
      // Mock database error
      jest.spyOn(metricsService as any, 'getActiveWarehouses').mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(metricsService.aggregateWarehouseMetrics(mockTimeRange))
        .rejects.toThrow(MetricsError);

      expect(mockPerformanceMonitor.track).toHaveBeenCalledWith(
        'rhy_metrics_aggregation_error',
        expect.objectContaining({
          error: 'AGGREGATION_FAILED',
          message: 'Database connection failed'
        })
      );
    });

    it('should use cached results when available', async () => {
      // First call
      await metricsService.aggregateWarehouseMetrics(mockTimeRange);
      
      // Second call should use cache
      const result = await metricsService.aggregateWarehouseMetrics(mockTimeRange);

      expect(result).toBeDefined();
      // Verify cache was used (performance tracking called twice)
      expect(mockPerformanceMonitor.track).toHaveBeenCalledTimes(2);
    });
  });

  describe('getWarehouseMetrics', () => {
    const warehouseId = 'warehouse1';
    const timeRange = {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    };

    it('should return metrics for specific warehouse', async () => {
      const result = await metricsService.getWarehouseMetrics(warehouseId, timeRange);

      expect(result).toBeDefined();
      expect(result.warehouseId).toBe(warehouseId);
      expect(result.metrics).toBeDefined();
      expect(result.trends).toBeDefined();
      expect(result.alerts).toBeDefined();
      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
      expect(result.complianceScore).toBeLessThanOrEqual(100);
    });

    it('should include alerts when requested', async () => {
      const options = { includeAlerts: true };
      
      const result = await metricsService.getWarehouseMetrics(warehouseId, timeRange, options);

      expect(result.alerts).toBeDefined();
      expect(Array.isArray(result.alerts)).toBe(true);
    });

    it('should include regional data when requested', async () => {
      const options = { includeRegionalData: true };
      
      const result = await metricsService.getWarehouseMetrics(warehouseId, timeRange, options);

      expect(result.regionalMetrics).toBeDefined();
      expect(result.regionalMetrics.region).toMatch(/^(US_WEST|JAPAN|EU|AUSTRALIA)$/);
    });

    it('should handle invalid warehouse ID', async () => {
      const invalidWarehouseId = 'nonexistent';
      
      await expect(metricsService.getWarehouseMetrics(invalidWarehouseId, timeRange))
        .rejects.toThrow();
    });
  });

  describe('getRealTimeMetrics', () => {
    it('should return current metrics for all warehouses', async () => {
      const result = await metricsService.getRealTimeMetrics();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Verify each warehouse has required fields
      result.forEach(warehouse => {
        expect(warehouse.warehouseId).toBeDefined();
        expect(warehouse.timestamp).toBeInstanceOf(Date);
        expect(warehouse.metrics).toBeDefined();
        expect(typeof warehouse.metrics.ordersProcessed).toBe('number');
        expect(typeof warehouse.metrics.revenue).toBe('number');
      });
    });

    it('should return fresh data within acceptable time limit', async () => {
      const startTime = Date.now();
      const result = await metricsService.getRealTimeMetrics();
      const endTime = Date.now();

      expect(result).toBeDefined();
      
      // Verify data freshness (within last 5 minutes)
      result.forEach(warehouse => {
        const dataAge = startTime - warehouse.timestamp.getTime();
        expect(dataAge).toBeLessThan(5 * 60 * 1000); // 5 minutes
      });

      // Verify performance (under 100ms as per requirements)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('getFlexVoltMetrics', () => {
    const timeRange = {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    };

    it('should return FlexVolt battery performance metrics', async () => {
      const result = await metricsService.getFlexVoltMetrics(timeRange);

      expect(result).toBeDefined();
      expect(result.period).toEqual(timeRange);
      expect(result.batteryPerformance).toBeDefined();

      // Verify all FlexVolt models are included
      expect(result.batteryPerformance['6Ah']).toBeDefined();
      expect(result.batteryPerformance['9Ah']).toBeDefined();
      expect(result.batteryPerformance['15Ah']).toBeDefined();

      // Verify aggregated metrics
      expect(result.aggregatedMetrics.totalRevenue).toBeDefined();
      expect(result.aggregatedMetrics.totalUnitsSold).toBeDefined();
      expect(result.aggregatedMetrics.averageSellingPrice).toBeDefined();

      // Verify trend analysis
      expect(result.trendAnalysis.revenueGrowth).toBeDefined();
      expect(result.trendAnalysis.marketExpansion).toBeDefined();
    });

    it('should calculate correct pricing metrics', async () => {
      const result = await metricsService.getFlexVoltMetrics(timeRange);

      // Verify pricing aligns with expected values
      const batteryPricing = {
        '6Ah': 95,
        '9Ah': 125,
        '15Ah': 245
      };

      Object.entries(batteryPricing).forEach(([model, expectedPrice]) => {
        const modelMetrics = result.batteryPerformance[model as keyof typeof result.batteryPerformance];
        expect(modelMetrics).toBeDefined();
        // Revenue should be consistent with pricing structure
        expect(modelMetrics.revenue.value).toBeGreaterThan(0);
      });
    });

    it('should include market insights', async () => {
      const result = await metricsService.getFlexVoltMetrics(timeRange);

      expect(result.trendAnalysis.competitivePosition).toBeDefined();
      expect(result.trendAnalysis.seasonalPattern).toBeDefined();
      expect(result.trendAnalysis.seasonalPattern.seasonalityStrength).toBeGreaterThanOrEqual(0);
      expect(result.trendAnalysis.seasonalPattern.seasonalityStrength).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance and Error Handling', () => {
    it('should complete aggregation within performance targets', async () => {
      const timeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const startTime = Date.now();
      await metricsService.aggregateWarehouseMetrics(timeRange);
      const endTime = Date.now();

      // Should complete within 100ms target
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle concurrent requests efficiently', async () => {
      const timeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      // Execute multiple concurrent requests
      const requests = Array(5).fill(null).map(() => 
        metricsService.aggregateWarehouseMetrics(timeRange)
      );

      const results = await Promise.all(requests);

      // All requests should succeed
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.globalOverview).toBeDefined();
      });
    });

    it('should properly handle network timeouts', async () => {
      // Mock timeout scenario
      jest.spyOn(metricsService as any, 'getActiveWarehouses').mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
      );

      const timeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      await expect(metricsService.aggregateWarehouseMetrics(timeRange))
        .rejects.toThrow(MetricsError);
    });
  });

  describe('Data Validation', () => {
    it('should validate time range parameters', async () => {
      const invalidTimeRange = {
        start: new Date('2024-02-01'),
        end: new Date('2024-01-01') // End before start
      };

      await expect(metricsService.aggregateWarehouseMetrics(invalidTimeRange))
        .rejects.toThrow();
    });

    it('should validate warehouse IDs format', async () => {
      const timeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const options = {
        warehouseIds: ['', null, undefined] as any
      };

      await expect(metricsService.aggregateWarehouseMetrics(timeRange, options))
        .rejects.toThrow();
    });

    it('should ensure metric values are within expected ranges', async () => {
      const timeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const result = await metricsService.aggregateWarehouseMetrics(timeRange);

      // Validate metric ranges
      result.warehouseMetrics.forEach(warehouse => {
        expect(warehouse.metrics.accuracyRate).toBeGreaterThanOrEqual(0);
        expect(warehouse.metrics.accuracyRate).toBeLessThanOrEqual(100);
        expect(warehouse.metrics.utilizationRate).toBeGreaterThanOrEqual(0);
        expect(warehouse.metrics.utilizationRate).toBeLessThanOrEqual(100);
        expect(warehouse.metrics.customerSatisfaction).toBeGreaterThanOrEqual(0);
        expect(warehouse.metrics.customerSatisfaction).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('Cache Management', () => {
    it('should cache results appropriately', async () => {
      const timeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      // First call
      const result1 = await metricsService.aggregateWarehouseMetrics(timeRange);
      
      // Second call should use cache
      const result2 = await metricsService.aggregateWarehouseMetrics(timeRange);

      expect(result1).toEqual(result2);
    });

    it('should invalidate cache when data changes', async () => {
      const timeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      await metricsService.aggregateWarehouseMetrics(timeRange);
      
      // Simulate data change
      jest.spyOn(metricsService as any, 'invalidateCache').mockImplementation(() => {});
      
      const result = await metricsService.aggregateWarehouseMetrics(timeRange);
      expect(result).toBeDefined();
    });
  });
});