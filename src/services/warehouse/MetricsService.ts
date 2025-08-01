// RHY Enterprise Metrics Aggregation Service
// High-performance warehouse metrics collection and analysis for FlexVolt operations
// Supports multi-warehouse coordination across US West, Japan, EU, and Australia

import { PrismaClient } from '@prisma/client';
import { performanceMonitor } from '@/lib/performance';
import { MetricsError } from '@/types/warehouse-metrics';

export interface WarehouseMetrics {
  warehouseId: string;
  location: string;
  timeframe: string;
  metrics: {
    ordersProcessed: number;
    orderValue: number;
    avgOrderValue: number;
    processingTime: number;
    accuracyRate: number;
    utilizationRate: number;
    inventoryLevel: number;
    revenue: number;
    costs: number;
    profitMargin: number;
    deliveryPerformance: number;
    customerSatisfaction: number;
  };
  trends: {
    orderGrowth: number;
    revenueGrowth: number;
    efficiencyImprovement: number;
    costReduction: number;
  };
  alerts: Alert[];
  complianceScore: number;
  regionalMetrics: RegionalMetrics;
}

export interface Alert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  type: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  warehouseId: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RegionalMetrics {
  region: 'US_WEST' | 'JAPAN' | 'EU' | 'AUSTRALIA';
  currency: 'USD' | 'JPY' | 'EUR' | 'AUD';
  timezone: string;
  localTime: string;
  businessHours: boolean;
  complianceRequirements: ComplianceRequirement[];
  performanceTargets: PerformanceTarget[];
}

export interface ComplianceRequirement {
  type: 'GDPR' | 'OSHA' | 'JIS' | 'CE' | 'AUSTRALIAN_STANDARDS';
  description: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING';
  lastAudit: Date;
  nextAudit: Date;
}

export interface PerformanceTarget {
  metric: string;
  target: number;
  current: number;
  unit: string;
  status: 'ABOVE_TARGET' | 'ON_TARGET' | 'BELOW_TARGET';
}

export interface AggregatedMetrics {
  globalOverview: GlobalOverview;
  warehouseMetrics: WarehouseMetrics[];
  comparativeAnalysis: ComparativeAnalysis;
  predictiveInsights: PredictiveInsight[];
  alertsSummary: AlertsSummary;
  complianceStatus: ComplianceStatus;
}

export interface GlobalOverview {
  totalRevenue: number;
  totalOrders: number;
  globalPerformanceScore: number;
  topPerformingWarehouse: string;
  underperformingWarehouses: string[];
  crossWarehouseSync: {
    status: 'SYNCHRONIZED' | 'SYNCING' | 'ISSUES';
    lastSync: Date;
    syncTime: number;
  };
  flexVoltMetrics: {
    batteriesSold: number;
    totalCapacity: number;
    averageRuntime: number;
    customerSatisfaction: number;
  };
}

export interface ComparativeAnalysis {
  rankingsByMetric: {
    [metric: string]: Array<{
      warehouseId: string;
      location: string;
      value: number;
      rank: number;
    }>;
  };
  benchmarks: {
    industryAverage: number;
    topQuartile: number;
    companyAverage: number;
  };
  gapAnalysis: {
    [warehouseId: string]: {
      gaps: string[];
      recommendations: string[];
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
    };
  };
}

export interface PredictiveInsight {
  type: 'DEMAND_FORECAST' | 'CAPACITY_PLANNING' | 'MAINTENANCE_SCHEDULE' | 'COST_OPTIMIZATION';
  warehouseId: string;
  prediction: string;
  confidence: number;
  timeframe: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendations: string[];
}

export interface AlertsSummary {
  total: number;
  critical: number;
  warning: number;
  info: number;
  byWarehouse: { [warehouseId: string]: number };
  trending: 'INCREASING' | 'STABLE' | 'DECREASING';
  averageResolutionTime: number;
}

export interface ComplianceStatus {
  overallScore: number;
  byRegion: {
    [region: string]: {
      score: number;
      requirements: ComplianceRequirement[];
      nextAudit: Date;
    };
  };
  riskAreas: string[];
  improvementPlan: string[];
}

export class MetricsService {
  private prisma: PrismaClient;
  private cache: Map<string, { data: any; timestamp: Date }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.prisma = new PrismaClient();
    this.startCacheCleanup();
  }

  /**
   * Aggregate metrics across all warehouses
   */
  async aggregateWarehouseMetrics(timeRange: {
    start: Date;
    end: Date;
  }, options?: {
    includeAlerts?: boolean;
    includePredictions?: boolean;
    includeCompliance?: boolean;
    warehouseIds?: string[];
  }): Promise<AggregatedMetrics> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey('aggregate', timeRange, options);
    
    try {
      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        performanceMonitor.track('rhy_metrics_cache_hit', {
          duration: Date.now() - startTime,
          cacheKey
        });
        return cached;
      }

      // Get warehouse metrics in parallel
      const warehouses = await this.getActiveWarehouses(options?.warehouseIds);
      const metricsPromises = warehouses.map(warehouse => 
        this.getWarehouseMetrics(warehouse.id, timeRange, {
          includeAlerts: options?.includeAlerts,
          includeRegionalData: true
        })
      );

      const warehouseMetrics = await Promise.all(metricsPromises);

      // Calculate global overview
      const globalOverview = await this.calculateGlobalOverview(warehouseMetrics, timeRange);

      // Perform comparative analysis
      const comparativeAnalysis = this.performComparativeAnalysis(warehouseMetrics);

      // Generate predictive insights
      const predictiveInsights = options?.includePredictions 
        ? await this.generatePredictiveInsights(warehouseMetrics) 
        : [];

      // Aggregate alerts
      const alertsSummary = options?.includeAlerts 
        ? this.aggregateAlerts(warehouseMetrics) 
        : this.getEmptyAlertsSummary();

      // Check compliance status
      const complianceStatus = options?.includeCompliance 
        ? await this.assessComplianceStatus(warehouses) 
        : this.getEmptyComplianceStatus();

      const aggregatedMetrics: AggregatedMetrics = {
        globalOverview,
        warehouseMetrics,
        comparativeAnalysis,
        predictiveInsights,
        alertsSummary,
        complianceStatus
      };

      // Cache results
      this.setCache(cacheKey, aggregatedMetrics);

      // Record performance metrics
      performanceMonitor.track('rhy_metrics_aggregation', {
        duration: Date.now() - startTime,
        warehouseCount: warehouses.length,
        includeAlerts: options?.includeAlerts,
        includePredictions: options?.includePredictions,
        includeCompliance: options?.includeCompliance
      });

      return aggregatedMetrics;

    } catch (error) {
      const metricsError: MetricsError = {
        code: 'AGGREGATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown aggregation error',
        details: { timeRange, options },
        timestamp: new Date(),
        source: 'DATABASE',
        severity: 'HIGH',
        resolved: false
      };

      console.error('Error aggregating warehouse metrics:', metricsError);
      
      performanceMonitor.track('rhy_metrics_aggregation_error', {
        duration: Date.now() - startTime,
        error: metricsError.code,
        message: metricsError.message
      });

      throw metricsError;
    }
  }

  /**
   * Get metrics for a specific warehouse
   */
  async getWarehouseMetrics(warehouseId: string, timeRange: {
    start: Date;
    end: Date;
  }, options?: {
    includeAlerts?: boolean;
    includeRegionalData?: boolean;
  }): Promise<WarehouseMetrics> {
    const startTime = Date.now();
    
    try {
      // Get warehouse info
      const warehouse = await this.prisma.rHYWarehouse.findUnique({
        where: { id: warehouseId },
        include: {
          metrics: {
            where: {
              date: {
                gte: timeRange.start,
                lte: timeRange.end
              }
            },
            orderBy: { date: 'desc' }
          },
          alerts: options?.includeAlerts ? {
            where: {
              createdAt: {
                gte: timeRange.start,
                lte: timeRange.end
              }
            },
            orderBy: { createdAt: 'desc' }
          } : false
        }
      });

      if (!warehouse) {
        throw new Error(`Warehouse ${warehouseId} not found`);
      }

      // Calculate aggregated metrics
      const metrics = this.calculateWarehouseMetrics(warehouse.metrics);
      const trends = this.calculateTrends(warehouse.metrics);
      const alerts = this.formatAlerts(warehouse.alerts || []);
      const complianceScore = await this.calculateComplianceScore(warehouse);
      const regionalMetrics = options?.includeRegionalData 
        ? await this.getRegionalMetrics(warehouse.location as any) 
        : this.getDefaultRegionalMetrics();

      const warehouseMetrics: WarehouseMetrics = {
        warehouseId: warehouse.id,
        location: warehouse.location as string,
        timeframe: `${timeRange.start.toISOString()} - ${timeRange.end.toISOString()}`,
        metrics,
        trends,
        alerts,
        complianceScore,
        regionalMetrics
      };

      performanceMonitor.track('rhy_warehouse_metrics', {
        duration: Date.now() - startTime,
        warehouseId,
        metricsCount: warehouse.metrics.length,
        alertsCount: alerts.length
      });

      return warehouseMetrics;

    } catch (error) {
      console.error(`Error getting warehouse metrics for ${warehouseId}:`, error);
      performanceMonitor.track('rhy_warehouse_metrics_error', {
        duration: Date.now() - startTime,
        warehouseId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get real-time metrics for all warehouses
   */
  async getRealTimeMetrics(): Promise<{
    timestamp: Date;
    warehouses: Array<{
      id: string;
      location: string;
      status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
      currentMetrics: {
        ordersInProgress: number;
        staffOnDuty: number;
        utilizationRate: number;
        alertsActive: number;
      };
      lastUpdate: Date;
    }>;
    globalStatus: {
      totalOrdersInProgress: number;
      warehousesOnline: number;
      totalStaff: number;
      globalUtilization: number;
      criticalAlerts: number;
    };
  }> {
    const startTime = Date.now();
    
    try {
      const warehouses = await this.getActiveWarehouses();
      const now = new Date();
      
      const warehouseStatuses = await Promise.all(
        warehouses.map(async (warehouse) => {
          const status = await this.getWarehouseOnlineStatus(warehouse.id);
          const currentMetrics = await this.getCurrentMetrics(warehouse.id);
          
          return {
            id: warehouse.id,
            location: warehouse.location as string,
            status: status as 'ONLINE' | 'OFFLINE' | 'MAINTENANCE',
            currentMetrics,
            lastUpdate: warehouse.updatedAt
          };
        })
      );

      // Calculate global status
      const globalStatus = {
        totalOrdersInProgress: warehouseStatuses.reduce(
          (sum, w) => sum + w.currentMetrics.ordersInProgress, 0
        ),
        warehousesOnline: warehouseStatuses.filter(w => w.status === 'ONLINE').length,
        totalStaff: warehouseStatuses.reduce(
          (sum, w) => sum + w.currentMetrics.staffOnDuty, 0
        ),
        globalUtilization: warehouseStatuses.reduce(
          (sum, w) => sum + w.currentMetrics.utilizationRate, 0
        ) / warehouseStatuses.length,
        criticalAlerts: warehouseStatuses.reduce(
          (sum, w) => sum + w.currentMetrics.alertsActive, 0
        )
      };

      performanceMonitor.track('rhy_real_time_metrics', {
        duration: Date.now() - startTime,
        warehouseCount: warehouses.length
      });

      return {
        timestamp: now,
        warehouses: warehouseStatuses,
        globalStatus
      };

    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(timeRange: {
    start: Date;
    end: Date;
  }, format: 'JSON' | 'CSV' | 'PDF' = 'JSON'): Promise<{
    reportId: string;
    generatedAt: Date;
    timeRange: { start: Date; end: Date };
    format: string;
    data: any;
    downloadUrl?: string;
  }> {
    const startTime = Date.now();
    const reportId = `perf-report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Get aggregated metrics
      const metrics = await this.aggregateWarehouseMetrics(timeRange, {
        includeAlerts: true,
        includePredictions: true,
        includeCompliance: true
      });

      // Generate report data based on format
      let reportData: any;
      let downloadUrl: string | undefined;

      switch (format) {
        case 'JSON':
          reportData = this.formatJSONReport(metrics);
          break;
        case 'CSV':
          reportData = this.formatCSVReport(metrics);
          downloadUrl = await this.saveReportFile(reportId, reportData, 'csv');
          break;
        case 'PDF':
          reportData = await this.formatPDFReport(metrics);
          downloadUrl = await this.saveReportFile(reportId, reportData, 'pdf');
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Record audit log
      await this.recordAuditLog({
        userId: 'system',
        userType: 'SYSTEM',
        action: 'PERFORMANCE_REPORT_GENERATED',
        resource: 'performance_report',
        resourceId: reportId,
        metadata: {
          timeRange,
          format,
          warehouseCount: metrics.warehouseMetrics.length
        }
      });

      performanceMonitor.track('rhy_performance_report', {
        duration: Date.now() - startTime,
        reportId,
        format,
        warehouseCount: metrics.warehouseMetrics.length
      });

      return {
        reportId,
        generatedAt: new Date(),
        timeRange,
        format,
        data: reportData,
        downloadUrl
      };

    } catch (error) {
      console.error('Error generating performance report:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getActiveWarehouses(warehouseIds?: string[]): Promise<any[]> {
    const whereClause: any = { status: 'ACTIVE' };
    
    if (warehouseIds && warehouseIds.length > 0) {
      whereClause.id = { in: warehouseIds };
    }

    return await this.prisma.rHYWarehouse.findMany({
      where: whereClause,
      select: {
        id: true,
        location: true,
        name: true,
        timezone: true,
        status: true,
        updatedAt: true
      }
    });
  }

  private calculateWarehouseMetrics(metricsData: any[]): WarehouseMetrics['metrics'] {
    if (!metricsData || metricsData.length === 0) {
      return this.getDefaultMetrics();
    }

    const latest = metricsData[0];
    const avgMetrics = this.calculateAverageMetrics(metricsData);

    return {
      ordersProcessed: latest.ordersProcessed || 0,
      orderValue: Number(latest.ordersValue) || 0,
      avgOrderValue: Number(latest.avgOrderValue) || 0,
      processingTime: latest.avgProcessingTime || 0,
      accuracyRate: latest.accuracyRate || 0,
      utilizationRate: latest.utilizationRate || 0,
      inventoryLevel: latest.inventoryLevel || 0,
      revenue: Number(latest.revenue) || 0,
      costs: Number(latest.costs) || 0,
      profitMargin: latest.profitMargin || 0,
      deliveryPerformance: latest.onTimeDeliveryRate || 0,
      customerSatisfaction: avgMetrics.customerSatisfaction || 85
    };
  }

  private calculateTrends(metricsData: any[]): WarehouseMetrics['trends'] {
    if (!metricsData || metricsData.length < 2) {
      return {
        orderGrowth: 0,
        revenueGrowth: 0,
        efficiencyImprovement: 0,
        costReduction: 0
      };
    }

    const recent = metricsData.slice(0, Math.ceil(metricsData.length / 2));
    const older = metricsData.slice(Math.ceil(metricsData.length / 2));

    const recentAvg = this.calculateAverageMetrics(recent);
    const olderAvg = this.calculateAverageMetrics(older);

    return {
      orderGrowth: this.calculateGrowthRate(olderAvg.ordersProcessed, recentAvg.ordersProcessed),
      revenueGrowth: this.calculateGrowthRate(Number(olderAvg.revenue), Number(recentAvg.revenue)),
      efficiencyImprovement: this.calculateGrowthRate(olderAvg.utilizationRate, recentAvg.utilizationRate),
      costReduction: this.calculateGrowthRate(Number(recentAvg.costs), Number(olderAvg.costs)) * -1
    };
  }

  private formatAlerts(alertsData: any[]): Alert[] {
    return alertsData.map(alert => ({
      id: alert.id,
      severity: alert.severity as Alert['severity'],
      type: alert.alertType,
      message: alert.message,
      timestamp: alert.createdAt,
      resolved: alert.isResolved,
      warehouseId: alert.warehouseId,
      impact: alert.impact as Alert['impact'] || 'MEDIUM'
    }));
  }

  private async calculateComplianceScore(warehouse: any): Promise<number> {
    // Mock compliance calculation based on warehouse location
    const baseScore = 85;
    const locationBonus = this.getLocationComplianceBonus(warehouse.location);
    return Math.min(100, baseScore + locationBonus);
  }

  private async getRegionalMetrics(location: string): Promise<RegionalMetrics> {
    const regionMapping: { [key: string]: RegionalMetrics } = {
      'US_WEST': {
        region: 'US_WEST',
        currency: 'USD',
        timezone: 'America/Los_Angeles',
        localTime: new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
        businessHours: this.isBusinessHours('America/Los_Angeles'),
        complianceRequirements: [
          {
            type: 'OSHA',
            description: 'Occupational Safety and Health Administration compliance',
            status: 'COMPLIANT',
            lastAudit: new Date('2024-11-15'),
            nextAudit: new Date('2025-05-15')
          }
        ],
        performanceTargets: [
          {
            metric: 'Order Processing Time',
            target: 2.0,
            current: 1.8,
            unit: 'hours',
            status: 'ABOVE_TARGET'
          }
        ]
      },
      'JAPAN': {
        region: 'JAPAN',
        currency: 'JPY',
        timezone: 'Asia/Tokyo',
        localTime: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        businessHours: this.isBusinessHours('Asia/Tokyo'),
        complianceRequirements: [
          {
            type: 'JIS',
            description: 'Japanese Industrial Standards compliance',
            status: 'COMPLIANT',
            lastAudit: new Date('2024-10-20'),
            nextAudit: new Date('2025-04-20')
          }
        ],
        performanceTargets: [
          {
            metric: 'Quality Score',
            target: 98.0,
            current: 97.5,
            unit: 'percentage',
            status: 'ON_TARGET'
          }
        ]
      },
      'EU': {
        region: 'EU',
        currency: 'EUR',
        timezone: 'Europe/Berlin',
        localTime: new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }),
        businessHours: this.isBusinessHours('Europe/Berlin'),
        complianceRequirements: [
          {
            type: 'GDPR',
            description: 'General Data Protection Regulation compliance',
            status: 'COMPLIANT',
            lastAudit: new Date('2024-12-01'),
            nextAudit: new Date('2025-06-01')
          },
          {
            type: 'CE',
            description: 'Conformité Européenne marking compliance',
            status: 'COMPLIANT',
            lastAudit: new Date('2024-11-10'),
            nextAudit: new Date('2025-05-10')
          }
        ],
        performanceTargets: [
          {
            metric: 'Environmental Score',
            target: 90.0,
            current: 88.5,
            unit: 'percentage',
            status: 'BELOW_TARGET'
          }
        ]
      },
      'AUSTRALIA': {
        region: 'AUSTRALIA',
        currency: 'AUD',
        timezone: 'Australia/Sydney',
        localTime: new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }),
        businessHours: this.isBusinessHours('Australia/Sydney'),
        complianceRequirements: [
          {
            type: 'AUSTRALIAN_STANDARDS',
            description: 'Australian Standards compliance',
            status: 'COMPLIANT',
            lastAudit: new Date('2024-11-25'),
            nextAudit: new Date('2025-05-25')
          }
        ],
        performanceTargets: [
          {
            metric: 'Customer Satisfaction',
            target: 4.5,
            current: 4.3,
            unit: 'out of 5',
            status: 'BELOW_TARGET'
          }
        ]
      }
    };

    return regionMapping[location] || this.getDefaultRegionalMetrics();
  }

  private async calculateGlobalOverview(warehouseMetrics: WarehouseMetrics[], timeRange: { start: Date; end: Date }): Promise<GlobalOverview> {
    const totalRevenue = warehouseMetrics.reduce((sum, w) => sum + w.metrics.revenue, 0);
    const totalOrders = warehouseMetrics.reduce((sum, w) => sum + w.metrics.ordersProcessed, 0);
    
    // Calculate global performance score
    const avgPerformanceScore = warehouseMetrics.reduce((sum, w) => {
      const score = (w.metrics.utilizationRate + w.metrics.accuracyRate + w.metrics.deliveryPerformance) / 3;
      return sum + score;
    }, 0) / warehouseMetrics.length;

    // Find top performing warehouse
    const topPerformer = warehouseMetrics.reduce((best, current) => {
      const currentScore = (current.metrics.utilizationRate + current.metrics.accuracyRate + current.metrics.deliveryPerformance) / 3;
      const bestScore = (best.metrics.utilizationRate + best.metrics.accuracyRate + best.metrics.deliveryPerformance) / 3;
      return currentScore > bestScore ? current : best;
    }, warehouseMetrics[0]);

    // Identify underperforming warehouses
    const performanceThreshold = avgPerformanceScore * 0.85;
    const underperformingWarehouses = warehouseMetrics
      .filter(w => {
        const score = (w.metrics.utilizationRate + w.metrics.accuracyRate + w.metrics.deliveryPerformance) / 3;
        return score < performanceThreshold;
      })
      .map(w => w.location);

    return {
      totalRevenue,
      totalOrders,
      globalPerformanceScore: avgPerformanceScore,
      topPerformingWarehouse: topPerformer?.location || 'N/A',
      underperformingWarehouses,
      crossWarehouseSync: {
        status: 'SYNCHRONIZED',
        lastSync: new Date(),
        syncTime: 28 // seconds
      },
      flexVoltMetrics: {
        batteriesSold: totalOrders * 1.2, // Estimate based on order data
        totalCapacity: totalOrders * 8.5, // Average capacity in Ah
        averageRuntime: 3.5, // hours
        customerSatisfaction: warehouseMetrics.reduce((sum, w) => sum + w.metrics.customerSatisfaction, 0) / warehouseMetrics.length
      }
    };
  }

  private performComparativeAnalysis(warehouseMetrics: WarehouseMetrics[]): ComparativeAnalysis {
    const metrics = ['revenue', 'ordersProcessed', 'utilizationRate', 'accuracyRate', 'deliveryPerformance'];
    const rankingsByMetric: ComparativeAnalysis['rankingsByMetric'] = {};

    // Create rankings for each metric
    metrics.forEach(metric => {
      const sorted = warehouseMetrics
        .map(w => ({
          warehouseId: w.warehouseId,
          location: w.location,
          value: this.getMetricValue(w.metrics, metric)
        }))
        .sort((a, b) => b.value - a.value)
        .map((item, index) => ({
          ...item,
          rank: index + 1
        }));

      rankingsByMetric[metric] = sorted;
    });

    // Calculate benchmarks
    const revenues = warehouseMetrics.map(w => w.metrics.revenue);
    const benchmarks = {
      industryAverage: 125000, // Mock industry average
      topQuartile: Math.max(...revenues),
      companyAverage: revenues.reduce((sum, r) => sum + r, 0) / revenues.length
    };

    // Generate gap analysis
    const gapAnalysis: ComparativeAnalysis['gapAnalysis'] = {};
    warehouseMetrics.forEach(warehouse => {
      const gaps: string[] = [];
      const recommendations: string[] = [];
      let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

      // Analyze performance gaps
      if (warehouse.metrics.utilizationRate < 80) {
        gaps.push('Low utilization rate');
        recommendations.push('Optimize staff scheduling and workflow processes');
        priority = 'HIGH';
      }

      if (warehouse.metrics.accuracyRate < 95) {
        gaps.push('Accuracy below target');
        recommendations.push('Implement quality control measures');
        if (priority !== 'HIGH') priority = 'MEDIUM';
      }

      gapAnalysis[warehouse.warehouseId] = { gaps, recommendations, priority };
    });

    return {
      rankingsByMetric,
      benchmarks,
      gapAnalysis
    };
  }

  private async generatePredictiveInsights(warehouseMetrics: WarehouseMetrics[]): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];

    // Generate insights for each warehouse
    for (const warehouse of warehouseMetrics) {
      // Demand forecast
      if (warehouse.trends.orderGrowth > 15) {
        insights.push({
          type: 'DEMAND_FORECAST',
          warehouseId: warehouse.warehouseId,
          prediction: `Expected 25% increase in FlexVolt battery demand over next quarter`,
          confidence: 0.85,
          timeframe: '3 months',
          impact: 'HIGH',
          recommendations: [
            'Increase inventory levels for 6Ah and 9Ah batteries',
            'Consider adding weekend shifts',
            'Expand storage capacity'
          ]
        });
      }

      // Capacity planning
      if (warehouse.metrics.utilizationRate > 90) {
        insights.push({
          type: 'CAPACITY_PLANNING',
          warehouseId: warehouse.warehouseId,
          prediction: `Warehouse approaching capacity limit`,
          confidence: 0.92,
          timeframe: '6 weeks',
          impact: 'HIGH',
          recommendations: [
            'Plan facility expansion',
            'Optimize layout for higher throughput',
            'Consider automation investments'
          ]
        });
      }

      // Cost optimization
      if (warehouse.metrics.profitMargin < 15) {
        insights.push({
          type: 'COST_OPTIMIZATION',
          warehouseId: warehouse.warehouseId,
          prediction: `Opportunity to reduce operational costs by 12%`,
          confidence: 0.78,
          timeframe: '4 months',
          impact: 'MEDIUM',
          recommendations: [
            'Implement energy-efficient lighting',
            'Optimize delivery routes',
            'Negotiate better supplier contracts'
          ]
        });
      }
    }

    return insights;
  }

  private aggregateAlerts(warehouseMetrics: WarehouseMetrics[]): AlertsSummary {
    const allAlerts = warehouseMetrics.flatMap(w => w.alerts);
    
    return {
      total: allAlerts.length,
      critical: allAlerts.filter(a => a.severity === 'CRITICAL').length,
      warning: allAlerts.filter(a => a.severity === 'WARNING').length,
      info: allAlerts.filter(a => a.severity === 'INFO').length,
      byWarehouse: warehouseMetrics.reduce((acc, w) => {
        acc[w.warehouseId] = w.alerts.length;
        return acc;
      }, {} as { [key: string]: number }),
      trending: 'STABLE',
      averageResolutionTime: 4.2 // hours
    };
  }

  private async assessComplianceStatus(warehouses: any[]): Promise<ComplianceStatus> {
    const overallScore = 92.5;
    const byRegion: ComplianceStatus['byRegion'] = {};

    // Group warehouses by region and calculate compliance
    const regionGroups = this.groupWarehousesByRegion(warehouses);
    
    for (const [region, warehouseList] of Object.entries(regionGroups)) {
      const regionalMetrics = await this.getRegionalMetrics(region);
      
      byRegion[region] = {
        score: 90 + Math.random() * 10, // Mock calculation
        requirements: regionalMetrics.complianceRequirements,
        nextAudit: regionalMetrics.complianceRequirements[0]?.nextAudit || new Date()
      };
    }

    return {
      overallScore,
      byRegion,
      riskAreas: ['Environmental compliance in EU region', 'Safety training updates'],
      improvementPlan: [
        'Schedule environmental compliance review',
        'Update safety training materials',
        'Implement automated compliance monitoring'
      ]
    };
  }

  // Utility methods

  private getMetricValue(metrics: WarehouseMetrics['metrics'], metricName: string): number {
    switch (metricName) {
      case 'revenue': return metrics.revenue;
      case 'ordersProcessed': return metrics.ordersProcessed;
      case 'utilizationRate': return metrics.utilizationRate;
      case 'accuracyRate': return metrics.accuracyRate;
      case 'deliveryPerformance': return metrics.deliveryPerformance;
      default: return 0;
    }
  }

  private calculateGrowthRate(oldValue: number, newValue: number): number {
    if (oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  private calculateAverageMetrics(metricsData: any[]): any {
    if (metricsData.length === 0) return this.getDefaultMetrics();

    const sums = metricsData.reduce((acc, metric) => {
      acc.ordersProcessed += metric.ordersProcessed || 0;
      acc.revenue += Number(metric.revenue) || 0;
      acc.utilizationRate += metric.utilizationRate || 0;
      acc.accuracyRate += metric.accuracyRate || 0;
      acc.costs += Number(metric.costs) || 0;
      acc.customerSatisfaction += 85; // Mock value
      return acc;
    }, {
      ordersProcessed: 0,
      revenue: 0,
      utilizationRate: 0,
      accuracyRate: 0,
      costs: 0,
      customerSatisfaction: 0
    });

    const count = metricsData.length;
    return {
      ordersProcessed: sums.ordersProcessed / count,
      revenue: sums.revenue / count,
      utilizationRate: sums.utilizationRate / count,
      accuracyRate: sums.accuracyRate / count,
      costs: sums.costs / count,
      customerSatisfaction: sums.customerSatisfaction / count
    };
  }

  private getDefaultMetrics(): WarehouseMetrics['metrics'] {
    return {
      ordersProcessed: 0,
      orderValue: 0,
      avgOrderValue: 0,
      processingTime: 0,
      accuracyRate: 0,
      utilizationRate: 0,
      inventoryLevel: 0,
      revenue: 0,
      costs: 0,
      profitMargin: 0,
      deliveryPerformance: 0,
      customerSatisfaction: 85
    };
  }

  private getDefaultRegionalMetrics(): RegionalMetrics {
    return {
      region: 'US_WEST',
      currency: 'USD',
      timezone: 'America/Los_Angeles',
      localTime: new Date().toLocaleString(),
      businessHours: true,
      complianceRequirements: [],
      performanceTargets: []
    };
  }

  private getEmptyAlertsSummary(): AlertsSummary {
    return {
      total: 0,
      critical: 0,
      warning: 0,
      info: 0,
      byWarehouse: {},
      trending: 'STABLE',
      averageResolutionTime: 0
    };
  }

  private getEmptyComplianceStatus(): ComplianceStatus {
    return {
      overallScore: 0,
      byRegion: {},
      riskAreas: [],
      improvementPlan: []
    };
  }

  private isBusinessHours(timezone: string): boolean {
    const now = new Date();
    const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const hour = localTime.getHours();
    return hour >= 8 && hour < 18; // 8 AM to 6 PM
  }

  private getLocationComplianceBonus(location: string): number {
    const bonuses: { [key: string]: number } = {
      'US_WEST': 5,
      'JAPAN': 8,
      'EU': 7,
      'AUSTRALIA': 6
    };
    return bonuses[location] || 0;
  }

  private groupWarehousesByRegion(warehouses: any[]): { [region: string]: any[] } {
    return warehouses.reduce((groups, warehouse) => {
      const region = warehouse.location;
      if (!groups[region]) groups[region] = [];
      groups[region].push(warehouse);
      return groups;
    }, {});
  }

  private async getWarehouseOnlineStatus(warehouseId: string): Promise<string> {
    // Mock online status check
    return Math.random() > 0.1 ? 'ONLINE' : 'OFFLINE';
  }

  private async getCurrentMetrics(warehouseId: string): Promise<{
    ordersInProgress: number;
    staffOnDuty: number;
    utilizationRate: number;
    alertsActive: number;
  }> {
    // Mock current metrics
    return {
      ordersInProgress: Math.floor(Math.random() * 50) + 10,
      staffOnDuty: Math.floor(Math.random() * 20) + 5,
      utilizationRate: Math.floor(Math.random() * 30) + 70,
      alertsActive: Math.floor(Math.random() * 5)
    };
  }

  private formatJSONReport(metrics: AggregatedMetrics): any {
    return {
      summary: metrics.globalOverview,
      warehouses: metrics.warehouseMetrics,
      analysis: metrics.comparativeAnalysis,
      insights: metrics.predictiveInsights,
      alerts: metrics.alertsSummary,
      compliance: metrics.complianceStatus
    };
  }

  private formatCSVReport(metrics: AggregatedMetrics): string {
    // Simple CSV format for warehouse metrics
    const headers = ['Warehouse,Location,Revenue,Orders,Utilization,Accuracy,Performance'];
    const rows = metrics.warehouseMetrics.map(w => 
      `${w.warehouseId},${w.location},${w.metrics.revenue},${w.metrics.ordersProcessed},${w.metrics.utilizationRate},${w.metrics.accuracyRate},${w.metrics.deliveryPerformance}`
    );
    return [headers, ...rows].join('\n');
  }

  private async formatPDFReport(metrics: AggregatedMetrics): Promise<Buffer> {
    // Mock PDF generation - would use a PDF library in production
    const reportContent = JSON.stringify(this.formatJSONReport(metrics), null, 2);
    return Buffer.from(reportContent, 'utf-8');
  }

  private async saveReportFile(reportId: string, data: any, extension: string): Promise<string> {
    // Mock file saving - would use cloud storage in production
    return `https://reports.rhy.com/${reportId}.${extension}`;
  }

  private generateCacheKey(operation: string, timeRange: { start: Date; end: Date }, options?: any): string {
    const optionsHash = options ? JSON.stringify(options) : '';
    return `${operation}_${timeRange.start.getTime()}_${timeRange.end.getTime()}_${Buffer.from(optionsHash).toString('base64')}`;
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp.getTime()) < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: new Date() });
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp.getTime() > this.cacheTimeout) {
          this.cache.delete(key);
        }
      }
    }, this.cacheTimeout);
  }

  private async recordAuditLog(params: {
    userId: string;
    userType: 'SUPPLIER' | 'ADMIN' | 'SYSTEM';
    action: string;
    resource: string;
    resourceId?: string;
    warehouse?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await this.prisma.rHYAuditLog.create({
        data: {
          userId: params.userId,
          userType: params.userType,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          warehouse: params.warehouse as any,
          metadata: params.metadata
        }
      });
    } catch (error) {
      console.error('Error recording audit log:', error);
      // Don't throw - audit logging should not break main flow
    }
  }
}

// Export singleton instance
export const metricsService = new MetricsService();