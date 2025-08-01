// Terminal 3 Integration: AI-Powered Pricing Service
// Integrates with Terminal 2's AI pricing engine for dynamic pricing

import { PrismaClient } from '@prisma/client'
import { analyticsService } from './analytics/commerce-analytics'

const prisma = new PrismaClient()

export interface PricingRequest {
  productId: string
  customerId?: string
  quantity: number
  context?: PricingContext
}

export interface PricingContext {
  isRepeatCustomer: boolean
  customerSegment: 'individual' | 'business' | 'enterprise'
  orderHistory: {
    totalOrders: number
    totalSpent: number
    lastOrderDate?: Date
  }
  marketConditions: MarketConditions
  competitorPrices: CompetitorPrice[]
}

export interface MarketConditions {
  demandLevel: 'low' | 'normal' | 'high'
  seasonality: 'off_peak' | 'normal' | 'peak'
  inventoryLevel: number
  inventoryTurnover: number
}

export interface CompetitorPrice {
  competitorId: string
  productId: string
  price: number
  lastUpdated: Date
}

export interface PricingResult {
  productId: string
  basePrice: number
  dynamicPrice: number
  discount: number
  discountPercentage: number
  priceFactors: PriceFactor[]
  expiresAt: Date
  confidenceScore: number
}

export interface PriceFactor {
  factor: string
  impact: number // Price adjustment amount
  weight: number // Importance weight
  description: string
}

export class PricingService {
  // Get dynamic pricing for a product
  async getDynamicPrice(request: PricingRequest): Promise<PricingResult> {
    try {
      // Get base product price
      const product = await prisma.product.findUnique({
        where: { id: request.productId }
      })
      
      if (!product) {
        throw new Error('Product not found')
      }

      // Get or build pricing context
      const context = request.context || await this.buildPricingContext(
        request.productId,
        request.customerId
      )

      // Get AI pricing recommendation from Terminal 2
      const aiPricing = await this.getAIPricingRecommendation({
        productId: request.productId,
        customerId: request.customerId,
        basePrice: product.price,
        quantity: request.quantity,
        marketConditions: context.marketConditions,
        competitorPrices: context.competitorPrices,
        customerSegment: context.customerSegment,
        isRepeatCustomer: context.isRepeatCustomer
      })

      // Apply business rules
      const finalPrice = this.applyBusinessRules(
        product.price,
        aiPricing.recommendedPrice,
        context
      )

      // Calculate price factors
      const priceFactors = this.calculatePriceFactors(
        product.price,
        finalPrice,
        context,
        aiPricing
      )

      const result: PricingResult = {
        productId: request.productId,
        basePrice: product.price,
        dynamicPrice: finalPrice,
        discount: product.price - finalPrice,
        discountPercentage: ((product.price - finalPrice) / product.price) * 100,
        priceFactors,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        confidenceScore: aiPricing.confidence
      }

      // Track pricing decision
      await analyticsService.trackPricingDecision(
        request.productId,
        request.customerId || null,
        finalPrice
      )

      return result
    } catch (error) {
      console.error('Failed to get dynamic price:', error)
      // Fallback to base price
      const product = await prisma.product.findUnique({
        where: { id: request.productId }
      })
      
      return {
        productId: request.productId,
        basePrice: product?.price || 0,
        dynamicPrice: product?.price || 0,
        discount: 0,
        discountPercentage: 0,
        priceFactors: [],
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        confidenceScore: 0
      }
    }
  }

  // Build pricing context
  private async buildPricingContext(
    productId: string,
    customerId?: string
  ): Promise<PricingContext> {
    const [
      customerData,
      marketConditions,
      competitorPrices
    ] = await Promise.all([
      customerId ? this.getCustomerData(customerId) : null,
      this.getMarketConditions(productId),
      this.getCompetitorPrices(productId)
    ])

    return {
      isRepeatCustomer: customerData?.isRepeatCustomer || false,
      customerSegment: customerData?.segment || 'individual',
      orderHistory: customerData?.orderHistory || {
        totalOrders: 0,
        totalSpent: 0
      },
      marketConditions,
      competitorPrices
    }
  }

  // Get customer data for pricing
  private async getCustomerData(customerId: string): Promise<{
    isRepeatCustomer: boolean
    segment: 'individual' | 'business' | 'enterprise'
    orderHistory: {
      totalOrders: number
      totalSpent: number
      lastOrderDate?: Date
    }
  } | null> {
    const orders = await prisma.order.findMany({
      where: {
        customerId,
        status: { in: ['paid', 'shipped', 'delivered'] }
      },
      select: {
        total: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (orders.length === 0) {
      return null
    }

    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
    
    // Determine customer segment
    let segment: 'individual' | 'business' | 'enterprise' = 'individual'
    if (totalSpent > 50000 || orders.length > 20) {
      segment = 'enterprise'
    } else if (totalSpent > 10000 || orders.length > 5) {
      segment = 'business'
    }

    return {
      isRepeatCustomer: orders.length > 1,
      segment,
      orderHistory: {
        totalOrders: orders.length,
        totalSpent,
        lastOrderDate: orders[0]?.createdAt
      }
    }
  }

  // Get current market conditions
  private async getMarketConditions(productId: string): Promise<MarketConditions> {
    // Get inventory level
    const inventory = await prisma.inventory.findMany({
      where: { productId }
    })
    
    const totalInventory = inventory.reduce(
      (sum, inv) => sum + (inv.available - inv.reserved), 
      0
    )

    // Get recent order velocity
    const recentOrders = await prisma.orderItem.count({
      where: {
        productId,
        order: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }
    })

    // Determine demand level
    let demandLevel: 'low' | 'normal' | 'high' = 'normal'
    if (recentOrders > 100) demandLevel = 'high'
    else if (recentOrders < 20) demandLevel = 'low'

    // Determine seasonality (simplified)
    const month = new Date().getMonth()
    let seasonality: 'off_peak' | 'normal' | 'peak' = 'normal'
    if ([11, 0, 1].includes(month)) seasonality = 'peak' // Nov, Dec, Jan
    else if ([6, 7, 8].includes(month)) seasonality = 'off_peak' // Jun, Jul, Aug

    return {
      demandLevel,
      seasonality,
      inventoryLevel: totalInventory,
      inventoryTurnover: totalInventory > 0 ? recentOrders / totalInventory : 0
    }
  }

  // Get competitor prices
  private async getCompetitorPrices(productId: string): Promise<CompetitorPrice[]> {
    // In production, would fetch from competitor price monitoring service
    // For now, return mock data
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { price: true, name: true }
    })

    if (!product) return []

    // Simulate competitor prices within 10% range
    return [
      {
        competitorId: 'competitor_1',
        productId,
        price: product.price * 1.05,
        lastUpdated: new Date()
      },
      {
        competitorId: 'competitor_2',
        productId,
        price: product.price * 0.98,
        lastUpdated: new Date()
      },
      {
        competitorId: 'competitor_3',
        productId,
        price: product.price * 1.02,
        lastUpdated: new Date()
      }
    ]
  }

  // Get AI pricing recommendation (Terminal 2 integration)
  private async getAIPricingRecommendation(data: {
    productId: string
    customerId?: string
    basePrice: number
    quantity: number
    marketConditions: MarketConditions
    competitorPrices: CompetitorPrice[]
    customerSegment: string
    isRepeatCustomer: boolean
  }): Promise<{
    recommendedPrice: number
    confidence: number
    factors: Array<{ name: string; impact: number }>
  }> {
    // In production, would call Terminal 2's AI pricing API
    // For now, simulate AI pricing logic

    let price = data.basePrice
    let confidence = 0.85
    const factors: Array<{ name: string; impact: number }> = []

    // Market demand adjustment
    if (data.marketConditions.demandLevel === 'high') {
      const adjustment = price * 0.05 // 5% increase
      price += adjustment
      factors.push({ name: 'High Demand', impact: adjustment })
    } else if (data.marketConditions.demandLevel === 'low') {
      const adjustment = price * -0.08 // 8% decrease
      price += adjustment
      factors.push({ name: 'Low Demand', impact: adjustment })
    }

    // Inventory level adjustment
    if (data.marketConditions.inventoryLevel < 50) {
      const adjustment = price * 0.03 // 3% increase for low inventory
      price += adjustment
      factors.push({ name: 'Low Inventory', impact: adjustment })
    } else if (data.marketConditions.inventoryLevel > 500) {
      const adjustment = price * -0.05 // 5% decrease for high inventory
      price += adjustment
      factors.push({ name: 'High Inventory', impact: adjustment })
    }

    // Customer segment pricing
    if (data.customerSegment === 'enterprise') {
      const adjustment = price * -0.15 // 15% enterprise discount
      price += adjustment
      factors.push({ name: 'Enterprise Discount', impact: adjustment })
      confidence = 0.95
    } else if (data.customerSegment === 'business') {
      const adjustment = price * -0.10 // 10% business discount
      price += adjustment
      factors.push({ name: 'Business Discount', impact: adjustment })
      confidence = 0.90
    }

    // Repeat customer discount
    if (data.isRepeatCustomer && data.customerSegment === 'individual') {
      const adjustment = price * -0.05 // 5% loyalty discount
      price += adjustment
      factors.push({ name: 'Loyalty Discount', impact: adjustment })
    }

    // Quantity-based pricing
    if (data.quantity >= 10) {
      const adjustment = price * -0.10 // 10% bulk discount
      price += adjustment
      factors.push({ name: 'Bulk Discount', impact: adjustment })
    } else if (data.quantity >= 5) {
      const adjustment = price * -0.05 // 5% quantity discount
      price += adjustment
      factors.push({ name: 'Quantity Discount', impact: adjustment })
    }

    // Competitive pricing adjustment
    const avgCompetitorPrice = data.competitorPrices.reduce(
      (sum, cp) => sum + cp.price, 0
    ) / data.competitorPrices.length

    if (price > avgCompetitorPrice * 1.1) {
      const adjustment = -(price - avgCompetitorPrice)
      price += adjustment
      factors.push({ name: 'Competitive Adjustment', impact: adjustment })
      confidence = 0.75
    }

    // Seasonality
    if (data.marketConditions.seasonality === 'peak') {
      const adjustment = price * 0.05 // 5% peak season increase
      price += adjustment
      factors.push({ name: 'Peak Season', impact: adjustment })
    } else if (data.marketConditions.seasonality === 'off_peak') {
      const adjustment = price * -0.10 // 10% off-peak discount
      price += adjustment
      factors.push({ name: 'Off-Peak Discount', impact: adjustment })
    }

    return {
      recommendedPrice: Math.max(price, data.basePrice * 0.7), // Never go below 30% margin
      confidence,
      factors
    }
  }

  // Apply business rules to AI pricing
  private applyBusinessRules(
    basePrice: number,
    aiPrice: number,
    context: PricingContext
  ): number {
    let finalPrice = aiPrice

    // Rule 1: Never go below 30% margin
    const minPrice = basePrice * 0.7
    if (finalPrice < minPrice) {
      finalPrice = minPrice
    }

    // Rule 2: Maximum discount for new customers is 10%
    if (!context.isRepeatCustomer) {
      const maxDiscount = basePrice * 0.9
      if (finalPrice < maxDiscount) {
        finalPrice = maxDiscount
      }
    }

    // Rule 3: Enterprise customers get at least 10% off
    if (context.customerSegment === 'enterprise') {
      const maxPrice = basePrice * 0.9
      if (finalPrice > maxPrice) {
        finalPrice = maxPrice
      }
    }

    // Rule 4: Round to nearest $5
    finalPrice = Math.round(finalPrice / 5) * 5

    return finalPrice
  }

  // Calculate price factors for transparency
  private calculatePriceFactors(
    basePrice: number,
    finalPrice: number,
    context: PricingContext,
    aiRecommendation: any
  ): PriceFactor[] {
    const factors: PriceFactor[] = []

    // Add AI factors
    aiRecommendation.factors.forEach((factor: any) => {
      factors.push({
        factor: factor.name,
        impact: factor.impact,
        weight: Math.abs(factor.impact) / basePrice,
        description: `${factor.name} adjustment`
      })
    })

    // Add business rule adjustments if any
    const totalAIAdjustment = aiRecommendation.recommendedPrice - basePrice
    const businessRuleAdjustment = finalPrice - aiRecommendation.recommendedPrice

    if (Math.abs(businessRuleAdjustment) > 0.01) {
      factors.push({
        factor: 'Business Rules',
        impact: businessRuleAdjustment,
        weight: Math.abs(businessRuleAdjustment) / basePrice,
        description: 'Policy and margin protection adjustments'
      })
    }

    return factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
  }

  // Get bulk pricing tiers
  async getBulkPricingTiers(productId: string): Promise<{
    tiers: Array<{
      minQuantity: number
      maxQuantity: number
      unitPrice: number
      totalSavings: number
    }>
  }> {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      throw new Error('Product not found')
    }

    const basePrice = product.price

    return {
      tiers: [
        {
          minQuantity: 1,
          maxQuantity: 4,
          unitPrice: basePrice,
          totalSavings: 0
        },
        {
          minQuantity: 5,
          maxQuantity: 9,
          unitPrice: basePrice * 0.95,
          totalSavings: basePrice * 0.05 * 5
        },
        {
          minQuantity: 10,
          maxQuantity: 19,
          unitPrice: basePrice * 0.90,
          totalSavings: basePrice * 0.10 * 10
        },
        {
          minQuantity: 20,
          maxQuantity: 999999,
          unitPrice: basePrice * 0.85,
          totalSavings: basePrice * 0.15 * 20
        }
      ]
    }
  }
}

// Singleton instance
export const pricingService = new PricingService()

// Helper function for getting dynamic price
export async function getDynamicPrice(
  productId: string,
  customerId?: string,
  quantity: number = 1
): Promise<PricingResult> {
  return pricingService.getDynamicPrice({
    productId,
    customerId,
    quantity
  })
}

export default pricingService