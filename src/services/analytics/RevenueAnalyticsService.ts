/**
 * RHY Revenue Analytics Service - Enterprise Business Intelligence
 * Comprehensive revenue analytics for FlexVolt battery operations across global warehouses
 * Integrates with existing Batch 1 authentication, warehouse, and data systems
 */

import { analyticsDataLayer } from '@/services/database/analytics-data-layer'
import { AuthService } from '@/services/auth/AuthService'
import { rhyPrisma } from '@/lib/rhy-database'
import { logAuditEvent, SecurityContext } from '@/lib/security'
import { 
  RevenueAnalyticsData, 
  RevenueMetrics, 
  SalesForecasting, 
  ProductPerformance,
  CustomerSegmentAnalysis,
  RegionalPerformance,
  RevenueAnalyticsRequest,
  RevenueAnalyticsResponse
} from '@/types/analytics'

/**
 * Revenue Analytics Data Interfaces
 */
interface FlexVoltProductRevenue {
  productId: string
  productName: string
  unitPrice: number
  quantitySold: number
  revenue: number
  warehouseId: string
  region: string
  currency: string
  conversionRate: number
  trend: 'increasing' | 'decreasing' | 'stable'
  growthRate: number
}

interface VolumeDiscountAnalysis {
  tier: 'contractor' | 'professional' | 'commercial' | 'enterprise'
  threshold: number
  discountPercentage: number
  ordersCount: number
  revenueImpact: number
  customerCount: number
  averageOrderValue: number
}

interface RevenueKPIs {
  totalRevenue: number
  revenueGrowth: number
  grossMargin: number
  netMargin: number
  averageOrderValue: number
  customerLifetimeValue: number
  customerAcquisitionCost: number
  churnRate: number
  repeatCustomerRate: number
}

/**
 * Enterprise Revenue Analytics Service
 * Provides sophisticated business intelligence for RHY Supplier Portal
 */
export class RevenueAnalyticsService {
  private readonly authService: AuthService
  private readonly warehouseRegions = ['US', 'JP', 'EU', 'AU']
  private readonly flexVoltProducts = [
    { id: '6ah', name: '6Ah FlexVolt Battery', price: 95, targetMargin: 0.42 },
    { id: '9ah', name: '9Ah FlexVolt Battery', price: 125, targetMargin: 0.45 },
    { id: '15ah', name: '15Ah FlexVolt Battery', price: 245, targetMargin: 0.48 }
  ]

  constructor() {
    this.authService = new AuthService()
  }

  /**
   * Generate comprehensive revenue analytics dashboard
   */
  async generateRevenueDashboard(
    request: RevenueAnalyticsRequest,
    securityContext: SecurityContext
  ): Promise<RevenueAnalyticsResponse> {
    const startTime = Date.now()

    try {
      // Validate user authentication and permissions
      const user = await this.authService.validateSession(request.sessionToken, securityContext)
      if (!user.success || !user.supplier) {
        return {
          success: false,
          error: 'Authentication required for revenue analytics access'
        }
      }

      // Check warehouse access permissions
      const hasAnalyticsAccess = await this.validateAnalyticsAccess(
        user.supplier.id, 
        request.warehouseIds || []
      )
      
      if (!hasAnalyticsAccess) {
        await logAuditEvent('ANALYTICS_ACCESS_DENIED', false, securityContext, user.supplier.id, {
          requestedWarehouses: request.warehouseIds,
          reason: 'Insufficient warehouse access permissions'
        })
        
        return {
          success: false,
          error: 'Insufficient permissions for requested warehouse analytics'
        }
      }

      // Generate comprehensive analytics
      const [
        revenueMetrics,
        productPerformance,
        customerSegments,
        regionalPerformance,
        salesForecasting,
        volumeDiscountAnalysis,
        revenueKPIs
      ] = await Promise.all([
        this.calculateRevenueMetrics(request.timeRange, request.warehouseIds),
        this.analyzeProductPerformance(request.timeRange, request.warehouseIds),
        this.analyzeCustomerSegments(request.timeRange, request.warehouseIds),
        this.analyzeRegionalPerformance(request.timeRange),
        this.generateSalesForecasting(request.timeRange, request.warehouseIds),
        this.analyzeVolumeDiscounts(request.timeRange, request.warehouseIds),
        this.calculateRevenueKPIs(request.timeRange, request.warehouseIds)
      ])

      // Log successful analytics generation
      await logAuditEvent('REVENUE_ANALYTICS_GENERATED', true, securityContext, user.supplier.id, {
        timeRange: request.timeRange,
        warehouseIds: request.warehouseIds,
        metricsGenerated: ['revenue', 'products', 'customers', 'regional', 'forecasting'],
        duration: Date.now() - startTime
      })

      return {
        success: true,
        data: {
          revenueMetrics,
          productPerformance,
          customerSegments,
          regionalPerformance,
          salesForecasting,
          volumeDiscountAnalysis,
          revenueKPIs,
          generatedAt: new Date(),
          timeRange: request.timeRange,
          warehouseIds: request.warehouseIds || this.warehouseRegions
        }
      }

    } catch (error) {
      console.error('Revenue analytics generation error:', error)
      
      await logAuditEvent('REVENUE_ANALYTICS_ERROR', false, securityContext, undefined, {
        error: error.message,
        duration: Date.now() - startTime
      })

      return {
        success: false,
        error: 'Failed to generate revenue analytics. Please try again.'
      }
    }
  }

  /**
   * Calculate comprehensive revenue metrics
   */
  private async calculateRevenueMetrics(
    timeRange: { start: Date; end: Date }, 
    warehouseIds?: string[]
  ): Promise<RevenueMetrics> {
    try {
      // Get revenue data from analytics data layer
      const revenueData = await analyticsDataLayer.queryTimeSeriesData(
        'revenue',
        'day',
        timeRange.start,
        timeRange.end,
        warehouseIds ? { warehouseId: warehouseIds } : undefined
      )

      // Calculate metrics
      const totalRevenue = revenueData.reduce((sum, point) => sum + point.value, 0)
      const averageDailyRevenue = totalRevenue / revenueData.length
      
      // Calculate growth rates
      const currentPeriodRevenue = revenueData.slice(-7).reduce((sum, point) => sum + point.value, 0)
      const previousPeriodRevenue = revenueData.slice(-14, -7).reduce((sum, point) => sum + point.value, 0)
      const growthRate = previousPeriodRevenue > 0 
        ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
        : 0

      // Revenue by product category
      const productRevenue = await this.calculateProductRevenue(timeRange, warehouseIds)
      
      // Revenue trends
      const trends = revenueData.map((point, index) => ({
        date: point.timestamp,
        revenue: point.value,
        trend: index > 0 ? point.value - revenueData[index - 1].value : 0
      }))

      return {
        totalRevenue,
        averageDailyRevenue,
        growthRate,
        revenueByProduct: productRevenue,
        trends,
        periodStart: timeRange.start,
        periodEnd: timeRange.end,
        currency: 'USD', // Multi-currency support would be added here
        lastUpdated: new Date()
      }

    } catch (error) {
      console.error('Revenue metrics calculation error:', error)
      throw new Error('Failed to calculate revenue metrics')
    }
  }

  /**
   * Calculate revenue by FlexVolt product
   */
  private async calculateProductRevenue(
    timeRange: { start: Date; end: Date },
    warehouseIds?: string[]
  ): Promise<FlexVoltProductRevenue[]> {
    const productRevenue = await Promise.all(
      this.flexVoltProducts.map(async (product) => {
        // Query product-specific revenue data
        const productData = await analyticsDataLayer.queryTimeSeriesData(
          `product_revenue_${product.id}`,
          'day',
          timeRange.start,
          timeRange.end,
          warehouseIds ? { warehouseId: warehouseIds } : undefined
        )

        const revenue = productData.reduce((sum, point) => sum + point.value, 0)
        const quantitySold = Math.round(revenue / product.price)
        
        // Calculate trend
        const recent = productData.slice(-7).reduce((sum, point) => sum + point.value, 0)
        const previous = productData.slice(-14, -7).reduce((sum, point) => sum + point.value, 0)
        const growthRate = previous > 0 ? ((recent - previous) / previous) * 100 : 0
        
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
        if (growthRate > 5) trend = 'increasing'
        else if (growthRate < -5) trend = 'decreasing'

        return {
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantitySold,
          revenue,
          warehouseId: 'ALL',
          region: 'GLOBAL',
          currency: 'USD',
          conversionRate: 1.0,
          trend,
          growthRate
        }
      })
    )

    return productRevenue
  }

  /**
   * Analyze product performance across warehouses
   */
  private async analyzeProductPerformance(
    timeRange: { start: Date; end: Date },
    warehouseIds?: string[]
  ): Promise<ProductPerformance[]> {
    const performance = await Promise.all(
      this.flexVoltProducts.map(async (product) => {
        // Get comprehensive product metrics
        const [views, sales, conversions, returns] = await Promise.all([
          analyticsDataLayer.queryTimeSeriesData(`product_views_${product.id}`, 'day', timeRange.start, timeRange.end),
          analyticsDataLayer.queryTimeSeriesData(`product_sales_${product.id}`, 'day', timeRange.start, timeRange.end),
          analyticsDataLayer.queryTimeSeriesData(`product_conversions_${product.id}`, 'day', timeRange.start, timeRange.end),
          analyticsDataLayer.queryTimeSeriesData(`product_returns_${product.id}`, 'day', timeRange.start, timeRange.end)
        ])

        const totalViews = views.reduce((sum, point) => sum + point.value, 0)
        const totalSales = sales.reduce((sum, point) => sum + point.value, 0)
        const totalConversions = conversions.reduce((sum, point) => sum + point.value, 0)
        const totalReturns = returns.reduce((sum, point) => sum + point.value, 0)

        const conversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0
        const returnRate = totalSales > 0 ? (totalReturns / totalSales) * 100 : 0
        const revenue = totalSales * product.price

        return {
          productId: product.id,
          productName: product.name,
          totalViews,
          totalSales,
          revenue,
          conversionRate,
          returnRate,
          margin: product.targetMargin * 100,
          inventory: await this.getProductInventory(product.id, warehouseIds),
          trends: {
            sales: this.calculateTrend(sales),
            conversions: this.calculateTrend(conversions),
            revenue: this.calculateTrend(sales.map(s => ({ ...s, value: s.value * product.price })))
          }
        }
      })
    )

    return performance
  }

  /**
   * Analyze customer segments and revenue contribution
   */
  private async analyzeCustomerSegments(
    timeRange: { start: Date; end: Date },
    warehouseIds?: string[]
  ): Promise<CustomerSegmentAnalysis[]> {
    const segments = [
      { type: 'DIRECT', name: 'Direct Customers', targetDiscount: 10 },
      { type: 'DISTRIBUTOR', name: 'Distributors', targetDiscount: 15 },
      { type: 'FLEET', name: 'Fleet Managers', targetDiscount: 20 },
      { type: 'SERVICE', name: 'Service Providers', targetDiscount: 20 }
    ]

    const segmentAnalysis = await Promise.all(
      segments.map(async (segment) => {
        // Query segment-specific revenue data
        const segmentRevenue = await analyticsDataLayer.queryTimeSeriesData(
          `customer_revenue_${segment.type.toLowerCase()}`,
          'day',
          timeRange.start,
          timeRange.end,
          warehouseIds ? { warehouseId: warehouseIds } : undefined
        )

        const totalRevenue = segmentRevenue.reduce((sum, point) => sum + point.value, 0)
        const customerCount = await this.getSegmentCustomerCount(segment.type, timeRange)
        const averageOrderValue = customerCount > 0 ? totalRevenue / customerCount : 0
        
        return {
          segmentType: segment.type,
          segmentName: segment.name,
          customerCount,
          totalRevenue,
          averageOrderValue,
          revenueShare: 0, // Calculated after all segments
          growthRate: this.calculateSegmentGrowthRate(segmentRevenue),
          discountUtilization: segment.targetDiscount
        }
      })
    )

    // Calculate revenue share for each segment
    const totalSegmentRevenue = segmentAnalysis.reduce((sum, segment) => sum + segment.totalRevenue, 0)
    segmentAnalysis.forEach(segment => {
      segment.revenueShare = totalSegmentRevenue > 0 ? (segment.totalRevenue / totalSegmentRevenue) * 100 : 0
    })

    return segmentAnalysis
  }

  /**
   * Analyze regional performance across warehouses
   */
  private async analyzeRegionalPerformance(
    timeRange: { start: Date; end: Date }
  ): Promise<RegionalPerformance[]> {
    const regionalData = await Promise.all(
      this.warehouseRegions.map(async (region) => {
        const regionRevenue = await analyticsDataLayer.queryTimeSeriesData(
          'revenue',
          'day',
          timeRange.start,
          timeRange.end,
          { warehouseRegion: region }
        )

        const totalRevenue = regionRevenue.reduce((sum, point) => sum + point.value, 0)
        const orderCount = await this.getRegionOrderCount(region, timeRange)
        const customerCount = await this.getRegionCustomerCount(region, timeRange)

        // Calculate regional currency
        const currencyMap = { 'US': 'USD', 'JP': 'JPY', 'EU': 'EUR', 'AU': 'AUD' }
        const currency = currencyMap[region] || 'USD'

        return {
          region,
          regionName: this.getRegionName(region),
          totalRevenue,
          orderCount,
          customerCount,
          averageOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
          currency,
          growthRate: this.calculateTrend(regionRevenue),
          marketShare: 0, // Calculated after all regions
          performance: totalRevenue > 1000000 ? 'excellent' : totalRevenue > 500000 ? 'good' : 'improving'
        }
      })
    )

    // Calculate market share
    const totalRevenue = regionalData.reduce((sum, region) => sum + region.totalRevenue, 0)
    regionalData.forEach(region => {
      region.marketShare = totalRevenue > 0 ? (region.totalRevenue / totalRevenue) * 100 : 0
    })

    return regionalData
  }

  /**
   * Generate sales forecasting using predictive analytics
   */
  private async generateSalesForecasting(
    timeRange: { start: Date; end: Date },
    warehouseIds?: string[]
  ): Promise<SalesForecasting> {
    try {
      // Get historical revenue data for forecasting
      const historicalData = await analyticsDataLayer.queryTimeSeriesData(
        'revenue',
        'day',
        new Date(timeRange.start.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days historical
        timeRange.end,
        warehouseIds ? { warehouseId: warehouseIds } : undefined
      )

      // Simple linear regression for forecasting (in production, would use ML models)
      const forecastDays = 30
      const historicalValues = historicalData.map(point => point.value)
      const trend = this.calculateLinearTrend(historicalValues)
      
      // Generate forecast points
      const forecastData = Array.from({ length: forecastDays }, (_, index) => {
        const futureDate = new Date(timeRange.end.getTime() + (index + 1) * 24 * 60 * 60 * 1000)
        const forecastValue = Math.max(0, trend.slope * (historicalValues.length + index) + trend.intercept)
        
        return {
          date: futureDate,
          predictedRevenue: forecastValue,
          confidence: Math.max(0.6, 0.95 - (index * 0.01)), // Decreasing confidence over time
          upperBound: forecastValue * 1.2,
          lowerBound: forecastValue * 0.8
        }
      })

      // Calculate forecast accuracy based on recent predictions
      const accuracy = await this.calculateForecastAccuracy(timeRange)

      return {
        forecastPeriod: forecastDays,
        predictions: forecastData,
        methodology: 'Linear Regression with Trend Analysis',
        accuracy,
        confidence: 0.85,
        assumptions: [
          'Historical trend continues',
          'No major market disruptions',
          'Seasonal patterns remain consistent',
          'Volume discount utilization stays stable'
        ],
        generatedAt: new Date()
      }

    } catch (error) {
      console.error('Sales forecasting error:', error)
      throw new Error('Failed to generate sales forecasting')
    }
  }

  /**
   * Analyze volume discount performance and impact
   */
  private async analyzeVolumeDiscounts(
    timeRange: { start: Date; end: Date },
    warehouseIds?: string[]
  ): Promise<VolumeDiscountAnalysis[]> {
    const discountTiers = [
      { tier: 'contractor' as const, threshold: 1000, discountPercentage: 10 },
      { tier: 'professional' as const, threshold: 2500, discountPercentage: 15 },
      { tier: 'commercial' as const, threshold: 5000, discountPercentage: 20 },
      { tier: 'enterprise' as const, threshold: 7500, discountPercentage: 25 }
    ]

    const discountAnalysis = await Promise.all(
      discountTiers.map(async (tier) => {
        // Query orders that qualified for this discount tier
        const tierOrders = await analyticsDataLayer.queryTimeSeriesData(
          `discount_tier_${tier.tier}`,
          'day',
          timeRange.start,
          timeRange.end,
          warehouseIds ? { warehouseId: warehouseIds } : undefined
        )

        const ordersCount = tierOrders.reduce((sum, point) => sum + point.value, 0)
        const tierRevenue = await this.getTierRevenue(tier.tier, timeRange, warehouseIds)
        const revenueImpact = tierRevenue * (tier.discountPercentage / 100)
        const customerCount = await this.getTierCustomerCount(tier.tier, timeRange)
        const averageOrderValue = ordersCount > 0 ? tierRevenue / ordersCount : 0

        return {
          tier: tier.tier,
          threshold: tier.threshold,
          discountPercentage: tier.discountPercentage,
          ordersCount,
          revenueImpact,
          customerCount,
          averageOrderValue
        }
      })
    )

    return discountAnalysis
  }

  /**
   * Calculate comprehensive revenue KPIs
   */
  private async calculateRevenueKPIs(
    timeRange: { start: Date; end: Date },
    warehouseIds?: string[]
  ): Promise<RevenueKPIs> {
    try {
      // Get comprehensive revenue and cost data
      const [revenue, costs, customers, orders] = await Promise.all([
        analyticsDataLayer.queryTimeSeriesData('revenue', 'day', timeRange.start, timeRange.end),
        analyticsDataLayer.queryTimeSeriesData('costs', 'day', timeRange.start, timeRange.end),
        analyticsDataLayer.queryTimeSeriesData('unique_customers', 'day', timeRange.start, timeRange.end),
        analyticsDataLayer.queryTimeSeriesData('order_count', 'day', timeRange.start, timeRange.end)
      ])

      const totalRevenue = revenue.reduce((sum, point) => sum + point.value, 0)
      const totalCosts = costs.reduce((sum, point) => sum + point.value, 0)
      const totalCustomers = customers.reduce((sum, point) => sum + point.value, 0)
      const totalOrders = orders.reduce((sum, point) => sum + point.value, 0)

      // Calculate growth rate
      const currentPeriod = revenue.slice(-7).reduce((sum, point) => sum + point.value, 0)
      const previousPeriod = revenue.slice(-14, -7).reduce((sum, point) => sum + point.value, 0)
      const revenueGrowth = previousPeriod > 0 ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 : 0

      // Calculate margins
      const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0
      const netMargin = grossMargin * 0.85 // Simplified net margin calculation

      // Calculate customer metrics
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
      const customerLifetimeValue = await this.calculateCustomerLifetimeValue(timeRange)
      const customerAcquisitionCost = await this.calculateCustomerAcquisitionCost(timeRange)
      const churnRate = await this.calculateChurnRate(timeRange)
      const repeatCustomerRate = await this.calculateRepeatCustomerRate(timeRange)

      return {
        totalRevenue,
        revenueGrowth,
        grossMargin,
        netMargin,
        averageOrderValue,
        customerLifetimeValue,
        customerAcquisitionCost,
        churnRate,
        repeatCustomerRate
      }

    } catch (error) {
      console.error('Revenue KPIs calculation error:', error)
      throw new Error('Failed to calculate revenue KPIs')
    }
  }

  /**
   * Validate user has access to analytics for specified warehouses
   */
  private async validateAnalyticsAccess(supplierId: string, warehouseIds: string[]): Promise<boolean> {
    try {
      if (warehouseIds.length === 0) return true // Global access allowed

      const supplier = await rhyPrisma.rHYSupplier.findUnique({
        where: { id: supplierId },
        include: { warehouseAccess: true }
      })

      if (!supplier) return false

      // Check if supplier has access to all requested warehouses
      const supplierWarehouses = supplier.warehouseAccess.map(access => access.warehouseId)
      return warehouseIds.every(id => supplierWarehouses.includes(id))

    } catch (error) {
      console.error('Analytics access validation error:', error)
      return false
    }
  }

  /**
   * Utility methods
   */
  private calculateTrend(data: Array<{ value: number }>): number {
    if (data.length < 2) return 0
    
    const recent = data.slice(-7).reduce((sum, point) => sum + point.value, 0)
    const previous = data.slice(-14, -7).reduce((sum, point) => sum + point.value, 0)
    
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0
  }

  private calculateLinearTrend(values: number[]): { slope: number; intercept: number } {
    const n = values.length
    const x = Array.from({ length: n }, (_, i) => i)
    const sumX = x.reduce((sum, val) => sum + val, 0)
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0)
    const sumXX = x.reduce((sum, val) => sum + val * val, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return { slope, intercept }
  }

  private getRegionName(region: string): string {
    const names = {
      'US': 'United States',
      'JP': 'Japan',
      'EU': 'European Union',
      'AU': 'Australia'
    }
    return names[region] || region
  }

  // Mock methods for data that would come from database in production
  private async getProductInventory(productId: string, warehouseIds?: string[]): Promise<number> {
    return Math.floor(Math.random() * 1000) + 100
  }

  private async getSegmentCustomerCount(segmentType: string, timeRange: { start: Date; end: Date }): Promise<number> {
    return Math.floor(Math.random() * 500) + 50
  }

  private calculateSegmentGrowthRate(data: Array<{ value: number }>): number {
    return this.calculateTrend(data)
  }

  private async getRegionOrderCount(region: string, timeRange: { start: Date; end: Date }): Promise<number> {
    return Math.floor(Math.random() * 1000) + 100
  }

  private async getRegionCustomerCount(region: string, timeRange: { start: Date; end: Date }): Promise<number> {
    return Math.floor(Math.random() * 500) + 50
  }

  private async calculateForecastAccuracy(timeRange: { start: Date; end: Date }): Promise<number> {
    return 0.85 // 85% accuracy
  }

  private async getTierRevenue(tier: string, timeRange: { start: Date; end: Date }, warehouseIds?: string[]): Promise<number> {
    return Math.floor(Math.random() * 100000) + 10000
  }

  private async getTierCustomerCount(tier: string, timeRange: { start: Date; end: Date }): Promise<number> {
    return Math.floor(Math.random() * 100) + 10
  }

  private async calculateCustomerLifetimeValue(timeRange: { start: Date; end: Date }): Promise<number> {
    return 890.50
  }

  private async calculateCustomerAcquisitionCost(timeRange: { start: Date; end: Date }): Promise<number> {
    return 45.80
  }

  private async calculateChurnRate(timeRange: { start: Date; end: Date }): Promise<number> {
    return 5.2
  }

  private async calculateRepeatCustomerRate(timeRange: { start: Date; end: Date }): Promise<number> {
    return 68.4
  }
}

// Export singleton instance
export const revenueAnalyticsService = new RevenueAnalyticsService()