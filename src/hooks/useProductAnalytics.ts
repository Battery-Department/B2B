'use client';

import { useState, useEffect, useCallback } from 'react';

interface ProductMetrics {
  productId: string;
  views: number;
  clicks: number;
  addToCarts: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
  clickThroughRate: number;
  averageOrderValue: number;
  returnRate: number;
  customerSatisfaction: number;
  inventoryTurnover: number;
  profitMargin: number;
}

interface CustomerBehaviorData {
  heatmapData: Array<{
    x: number;
    y: number;
    intensity: number;
    action: string;
  }>;
  scrollDepth: number;
  timeOnPage: number;
  bounceRate: number;
  exitRate: number;
}

interface SeasonalTrend {
  period: string;
  sales: number;
  demand: number;
  priceOptimization: number;
  competitorPrice: number;
}

interface AnalyticsFilters {
  timeRange: '7d' | '30d' | '90d' | '1y';
  productIds?: string[];
  segment?: 'residential' | 'commercial' | 'industrial';
  region?: string;
}

interface PerformanceInsight {
  type: 'opportunity' | 'warning' | 'success' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendation?: string;
  data?: any;
}

export function useProductAnalytics(filters: AnalyticsFilters = { timeRange: '30d' }) {
  const [metrics, setMetrics] = useState<ProductMetrics[]>([]);
  const [behaviorData, setBehaviorData] = useState<CustomerBehaviorData | null>(null);
  const [seasonalTrends, setSeasonalTrends] = useState<SeasonalTrend[]>([]);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate mock analytics data based on filters
  const generateMockData = useCallback(() => {
    const products = ['6Ah', '9Ah', '15Ah'];
    const mockMetrics: ProductMetrics[] = products.map(productId => {
      const baseViews = Math.floor(Math.random() * 5000) + 1000;
      const clicks = Math.floor(baseViews * (0.15 + Math.random() * 0.25));
      const addToCarts = Math.floor(clicks * (0.08 + Math.random() * 0.15));
      const purchases = Math.floor(addToCarts * (0.25 + Math.random() * 0.45));
      
      const prices = { '6Ah': 95, '9Ah': 125, '15Ah': 245 };
      const price = prices[productId as keyof typeof prices];
      const revenue = purchases * price;
      
      return {
        productId,
        views: baseViews,
        clicks,
        addToCarts,
        purchases,
        revenue,
        conversionRate: (purchases / baseViews) * 100,
        clickThroughRate: (clicks / baseViews) * 100,
        averageOrderValue: revenue / (purchases || 1),
        returnRate: Math.random() * 5,
        customerSatisfaction: 4.2 + Math.random() * 0.6,
        inventoryTurnover: 3 + Math.random() * 5,
        profitMargin: 25 + Math.random() * 20
      };
    });

    const mockBehaviorData: CustomerBehaviorData = {
      heatmapData: Array.from({ length: 50 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        intensity: Math.random(),
        action: ['click', 'hover', 'scroll'][Math.floor(Math.random() * 3)]
      })),
      scrollDepth: 65 + Math.random() * 25,
      timeOnPage: 120 + Math.random() * 180,
      bounceRate: 25 + Math.random() * 20,
      exitRate: 30 + Math.random() * 15
    };

    const periods = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mockSeasonalTrends: SeasonalTrend[] = periods.map(period => ({
      period,
      sales: 500 + Math.random() * 1500,
      demand: 0.6 + Math.random() * 0.8,
      priceOptimization: 90 + Math.random() * 20,
      competitorPrice: 100 + Math.random() * 50
    }));

    return { mockMetrics, mockBehaviorData, mockSeasonalTrends };
  }, [filters]);

  // Generate insights based on current data
  const generateInsights = useCallback((metricsData: ProductMetrics[]): PerformanceInsight[] => {
    const insights: PerformanceInsight[] = [];

    // Find best and worst performing products
    const sortedByConversion = [...metricsData].sort((a, b) => b.conversionRate - a.conversionRate);
    const bestProduct = sortedByConversion[0];
    const worstProduct = sortedByConversion[sortedByConversion.length - 1];

    if (bestProduct) {
      insights.push({
        type: 'success',
        title: `${bestProduct.productId} is your top performer`,
        description: `Conversion rate of ${bestProduct.conversionRate.toFixed(1)}% is significantly above average`,
        impact: 'high',
        actionable: true,
        recommendation: 'Consider increasing inventory and featuring this product more prominently',
        data: { productId: bestProduct.productId, conversionRate: bestProduct.conversionRate }
      });
    }

    if (worstProduct && worstProduct.conversionRate < 2) {
      insights.push({
        type: 'warning',
        title: `${worstProduct.productId} needs attention`,
        description: `Low conversion rate of ${worstProduct.conversionRate.toFixed(1)}% suggests optimization opportunities`,
        impact: 'high',
        actionable: true,
        recommendation: 'Review product description, pricing, and positioning. Consider A/B testing new approaches',
        data: { productId: worstProduct.productId, conversionRate: worstProduct.conversionRate }
      });
    }

    // Revenue opportunities
    const totalRevenue = metricsData.reduce((sum, m) => sum + m.revenue, 0);
    const avgMargin = metricsData.reduce((sum, m) => sum + m.profitMargin, 0) / metricsData.length;

    if (avgMargin > 35) {
      insights.push({
        type: 'opportunity',
        title: 'Strong profit margins detected',
        description: `Average margin of ${avgMargin.toFixed(1)}% suggests room for competitive pricing strategies`,
        impact: 'medium',
        actionable: true,
        recommendation: 'Consider strategic price reductions to increase volume while maintaining healthy margins'
      });
    }

    // Inventory insights
    const lowTurnover = metricsData.filter(m => m.inventoryTurnover < 2);
    if (lowTurnover.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Slow inventory movement detected',
        description: `${lowTurnover.length} product(s) showing low turnover rates`,
        impact: 'medium',
        actionable: true,
        recommendation: 'Consider promotional campaigns or bundle offers to improve inventory velocity'
      });
    }

    // Customer satisfaction insights
    const lowSatisfaction = metricsData.filter(m => m.customerSatisfaction < 4.0);
    if (lowSatisfaction.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Customer satisfaction concerns',
        description: `${lowSatisfaction.length} product(s) below 4.0 satisfaction threshold`,
        impact: 'high',
        actionable: true,
        recommendation: 'Review customer feedback and quality control processes'
      });
    }

    // Growth trends
    insights.push({
      type: 'trend',
      title: 'Seasonal demand patterns identified',
      description: 'Spring and summer months show 40% higher demand for 6Ah batteries',
      impact: 'medium',
      actionable: true,
      recommendation: 'Adjust inventory planning and marketing spend for seasonal peaks'
    });

    return insights;
  }, []);

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const { mockMetrics, mockBehaviorData, mockSeasonalTrends } = generateMockData();
      
      setMetrics(mockMetrics);
      setBehaviorData(mockBehaviorData);
      setSeasonalTrends(mockSeasonalTrends);
      setInsights(generateInsights(mockMetrics));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      console.error('Analytics loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [generateMockData, generateInsights]);

  // Calculate summary statistics
  const getSummaryStats = useCallback(() => {
    if (metrics.length === 0) return null;

    const totalViews = metrics.reduce((sum, m) => sum + m.views, 0);
    const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue, 0);
    const totalPurchases = metrics.reduce((sum, m) => sum + m.purchases, 0);
    const avgConversion = metrics.reduce((sum, m) => sum + m.conversionRate, 0) / metrics.length;
    const avgSatisfaction = metrics.reduce((sum, m) => sum + m.customerSatisfaction, 0) / metrics.length;

    return {
      totalViews,
      totalRevenue,
      totalPurchases,
      averageConversionRate: avgConversion,
      averageCustomerSatisfaction: avgSatisfaction,
      revenueGrowth: 15.3, // Mock growth rate
      topProduct: metrics.sort((a, b) => b.revenue - a.revenue)[0]?.productId
    };
  }, [metrics]);

  // Get product performance comparison
  const getProductComparison = useCallback(() => {
    return metrics.map(metric => ({
      ...metric,
      performanceScore: (
        metric.conversionRate * 0.3 +
        metric.customerSatisfaction * 20 * 0.25 +
        metric.profitMargin * 0.2 +
        (metric.inventoryTurnover / 8) * 100 * 0.25
      )
    })).sort((a, b) => b.performanceScore - a.performanceScore);
  }, [metrics]);

  // Export analytics data
  const exportData = useCallback((format: 'csv' | 'json' = 'csv') => {
    const data = {
      metrics,
      insights,
      summary: getSummaryStats(),
      exportDate: new Date().toISOString()
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-analytics-${filters.timeRange}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Convert to CSV
      const csvData = [
        ['Product ID', 'Views', 'Clicks', 'Purchases', 'Revenue', 'Conversion Rate', 'Customer Satisfaction'],
        ...metrics.map(m => [
          m.productId,
          m.views.toString(),
          m.clicks.toString(),
          m.purchases.toString(),
          m.revenue.toString(),
          m.conversionRate.toFixed(2),
          m.customerSatisfaction.toFixed(1)
        ])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-analytics-${filters.timeRange}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [metrics, insights, getSummaryStats, filters.timeRange]);

  // Refresh data
  const refresh = useCallback(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Load data on mount and when filters change
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics, filters]);

  return {
    // Data
    metrics,
    behaviorData,
    seasonalTrends,
    insights,
    isLoading,
    error,

    // Computed data
    summaryStats: getSummaryStats(),
    productComparison: getProductComparison(),

    // Actions
    refresh,
    exportData,

    // Filters applied
    currentFilters: filters
  };
}

// Hook for real-time analytics updates
export function useRealTimeAnalytics() {
  const [liveMetrics, setLiveMetrics] = useState({
    activeUsers: 0,
    currentRevenue: 0,
    conversionsToday: 0,
    topProduct: ''
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        activeUsers: Math.floor(Math.random() * 50) + 20,
        currentRevenue: prev.currentRevenue + (Math.random() * 500),
        conversionsToday: prev.conversionsToday + (Math.random() > 0.7 ? 1 : 0),
        topProduct: ['6Ah', '9Ah', '15Ah'][Math.floor(Math.random() * 3)]
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return liveMetrics;
}

// Hook for competitive analysis
export function useCompetitiveAnalysis() {
  const [competitorData, setCompetitorData] = useState([
    { competitor: 'DeWalt Official', price: 249, rating: 4.3, marketShare: 35 },
    { competitor: 'Milwaukee Direct', price: 259, rating: 4.1, marketShare: 28 },
    { competitor: 'Makita Store', price: 239, rating: 4.0, marketShare: 22 },
    { competitor: 'Ryobi Plus', price: 199, rating: 3.8, marketShare: 15 }
  ]);

  const [priceRecommendations, setPriceRecommendations] = useState({
    optimal: 235,
    competitive: 220,
    premium: 255,
    reasoning: 'Based on competitor analysis and demand elasticity'
  });

  return {
    competitorData,
    priceRecommendations,
    marketPosition: 'competitive'
  };
}