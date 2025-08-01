/**
 * RHY_052: Enhanced Bulk Order Management Service
 * Enterprise-grade bulk order processing with multi-warehouse support
 * Integrates seamlessly with existing Batch 1 authentication and warehouse systems
 */

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { authService } from '@/services/auth/AuthService'
import { warehouseService } from '@/services/warehouse/WarehouseService'
import { orderService } from '@/services/order-service'
import { inventoryService } from '@/services/inventory-service'
import { analyticsService } from '@/services/analytics/commerce-analytics'
import type { 
  BulkOrderRequest,
  BulkOrderResponse,
  BulkOrderStatus,
  BulkOrderItem,
  BulkOrderValidationResult,
  BulkOrderProcessingResult,
  WarehouseRouting,
  VolumeDiscountCalculation,
  FlexVoltPricingTier
} from '@/types/bulk-orders'
import type { SupplierAuthData, SecurityContext } from '@/types/auth'

/**
 * Bulk Order Management Service
 * Handles large-scale order processing with intelligent warehouse routing
 */
export class BulkOrderService {
  private static instance: BulkOrderService
  private readonly maxBulkSize = 10000 // Maximum items per bulk order
  private readonly processingTimeout = 300000 // 5 minutes
  private readonly batchSize = 100 // Items per processing batch

  private constructor() {}

  public static getInstance(): BulkOrderService {
    if (!BulkOrderService.instance) {
      BulkOrderService.instance = new BulkOrderService()
    }
    return BulkOrderService.instance
  }

  /**
   * Process bulk order with comprehensive validation and routing
   */
  public async processBulkOrder(
    bulkOrderData: BulkOrderRequest,
    supplier: SupplierAuthData,
    securityContext: SecurityContext
  ): Promise<BulkOrderResponse> {
    const startTime = Date.now()
    const bulkOrderId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      logger.info('Processing bulk order', {
        bulkOrderId,
        supplierId: supplier.id,
        itemCount: bulkOrderData.items.length,
        requestedWarehouses: bulkOrderData.preferredWarehouses,
        timestamp: new Date().toISOString()
      })

      // Step 1: Validate bulk order
      const validation = await this.validateBulkOrder(bulkOrderData, supplier, securityContext)
      if (!validation.isValid) {
        return {
          success: false,
          bulkOrderId,
          errors: validation.errors,
          warnings: validation.warnings,
          processingTime: Date.now() - startTime
        }
      }

      // Step 2: Calculate optimal warehouse routing
      const routing = await this.calculateOptimalRouting(bulkOrderData, supplier)
      
      // Step 3: Calculate volume discounts and pricing
      const pricing = await this.calculateBulkPricing(bulkOrderData, supplier, routing)

      // Step 4: Reserve inventory across warehouses
      const reservations = await this.reserveInventoryAcrossWarehouses(
        bulkOrderData,
        routing,
        supplier,
        bulkOrderId
      )

      // Step 5: Create bulk order record
      const bulkOrder = await this.createBulkOrderRecord(
        bulkOrderData,
        supplier,
        routing,
        pricing,
        reservations,
        bulkOrderId,
        securityContext
      )

      // Step 6: Process individual orders asynchronously
      this.processIndividualOrdersAsync(bulkOrder, routing, pricing, supplier, securityContext)
        .catch(error => {
          logger.error('Async bulk order processing failed', {
            bulkOrderId,
            error: error.message,
            stack: error.stack
          })
        })

      const duration = Date.now() - startTime

      logger.info('Bulk order processed successfully', {
        bulkOrderId,
        supplierId: supplier.id,
        totalItems: bulkOrderData.items.length,
        warehousesUsed: Object.keys(routing.warehouseAllocations).length,
        totalValue: pricing.finalTotal,
        discount: pricing.totalDiscount,
        duration
      })

      // Analytics tracking
      await analyticsService.trackBulkOrderCreated({
        bulkOrderId,
        supplierId: supplier.id,
        itemCount: bulkOrderData.items.length,
        totalValue: pricing.finalTotal,
        warehousesUsed: Object.keys(routing.warehouseAllocations),
        processingTime: duration
      })

      return {
        success: true,
        bulkOrderId,
        status: 'PROCESSING',
        routing,
        pricing,
        reservations,
        estimatedCompletionTime: new Date(Date.now() + this.estimateProcessingTime(bulkOrderData.items.length)),
        individualOrders: [], // Will be populated asynchronously
        processingTime: duration,
        trackingUrl: `/supplier/orders/bulk/${bulkOrderId}`,
        warnings: validation.warnings
      }

    } catch (error) {
      const duration = Date.now() - startTime

      logger.error('Bulk order processing failed', {
        bulkOrderId,
        supplierId: supplier.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        duration
      })

      // Create failed bulk order record for audit
      await this.createFailedBulkOrderRecord(
        bulkOrderId,
        bulkOrderData,
        supplier,
        error instanceof Error ? error.message : 'Unknown error',
        securityContext
      )

      return {
        success: false,
        bulkOrderId,
        errors: [`Bulk order processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        processingTime: duration
      }
    }
  }

  /**
   * Validate bulk order data and business rules
   */
  private async validateBulkOrder(
    bulkOrderData: BulkOrderRequest,
    supplier: SupplierAuthData,
    securityContext: SecurityContext
  ): Promise<BulkOrderValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Size validation
      if (bulkOrderData.items.length === 0) {
        errors.push('Bulk order must contain at least one item')
      }

      if (bulkOrderData.items.length > this.maxBulkSize) {
        errors.push(`Bulk order exceeds maximum size of ${this.maxBulkSize} items`)
      }

      // Supplier tier validation
      const minOrderValue = this.getMinOrderValueForTier(supplier.tier)
      const estimatedTotal = bulkOrderData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
      
      if (estimatedTotal < minOrderValue) {
        errors.push(`Order value ($${estimatedTotal.toFixed(2)}) is below minimum for ${supplier.tier} tier ($${minOrderValue})`)
      }

      // Warehouse access validation
      for (const warehouseId of bulkOrderData.preferredWarehouses || []) {
        const hasAccess = supplier.warehouseAccess.some(access => 
          access.warehouse === warehouseId && 
          (!access.expiresAt || access.expiresAt > new Date())
        )
        
        if (!hasAccess) {
          errors.push(`No access to warehouse: ${warehouseId}`)
        }
      }

      // Product validation
      const productIds = bulkOrderData.items.map(item => item.productId)
      const uniqueProductIds = [...new Set(productIds)]
      
      const products = await prisma.product.findMany({
        where: { 
          id: { in: uniqueProductIds },
          isActive: true 
        },
        select: {
          id: true,
          name: true,
          sku: true,
          basePrice: true,
          category: true,
          specifications: true
        }
      })

      const foundProductIds = products.map(p => p.id)
      const missingProducts = uniqueProductIds.filter(id => !foundProductIds.includes(id))
      
      if (missingProducts.length > 0) {
        errors.push(`Products not found or inactive: ${missingProducts.join(', ')}`)
      }

      // FlexVolt specific validation
      const flexVoltProducts = products.filter(p => p.category === 'battery' && p.specifications?.voltage)
      for (const item of bulkOrderData.items) {
        const product = products.find(p => p.id === item.productId)
        if (product && flexVoltProducts.includes(product)) {
          // Validate FlexVolt battery specifications
          if (item.quantity > 1000) {
            warnings.push(`Large quantity (${item.quantity}) for FlexVolt battery ${product.sku}. Consider splitting across multiple orders.`)
          }
        }
      }

      // Inventory availability check
      const inventoryChecks = await Promise.allSettled(
        bulkOrderData.items.map(async (item) => {
          const availability = await inventoryService.checkAvailability(item.productId, item.quantity)
          if (!availability.available) {
            if (availability.availableQuantity > 0) {
              warnings.push(`Only ${availability.availableQuantity} units available for ${item.productId} (requested: ${item.quantity})`)
            } else {
              errors.push(`Product ${item.productId} is out of stock`)
            }
          }
          return availability
        })
      )

      // Rate limiting check
      const rateLimitKey = `bulk_order:${supplier.id}`
      const recentBulkOrders = await prisma.bulkOrder.count({
        where: {
          supplierId: supplier.id,
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        }
      })

      const maxBulkOrdersPerHour = this.getMaxBulkOrdersForTier(supplier.tier)
      if (recentBulkOrders >= maxBulkOrdersPerHour) {
        errors.push(`Rate limit exceeded: Maximum ${maxBulkOrdersPerHour} bulk orders per hour for ${supplier.tier} tier`)
      }

      // Credit limit check for enterprise customers
      if (supplier.tier === 'ENTERPRISE' && estimatedTotal > 100000) {
        // Check credit limit
        const creditStatus = await this.checkCreditLimit(supplier.id, estimatedTotal)
        if (!creditStatus.approved) {
          errors.push(`Order exceeds credit limit: ${creditStatus.reason}`)
        }
      }

      logger.info('Bulk order validation completed', {
        supplierId: supplier.id,
        itemCount: bulkOrderData.items.length,
        errors: errors.length,
        warnings: warnings.length,
        estimatedTotal
      })

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        estimatedTotal,
        validatedItems: bulkOrderData.items.length - errors.length
      }

    } catch (error) {
      logger.error('Bulk order validation failed', {
        supplierId: supplier.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return {
        isValid: false,
        errors: ['Validation process failed. Please try again.'],
        warnings: [],
        estimatedTotal: 0,
        validatedItems: 0
      }
    }
  }

  /**
   * Calculate optimal warehouse routing for bulk order
   */
  private async calculateOptimalRouting(
    bulkOrderData: BulkOrderRequest,
    supplier: SupplierAuthData
  ): Promise<WarehouseRouting> {
    try {
      // Get available warehouses for supplier
      const availableWarehouses = supplier.warehouseAccess
        .filter(access => !access.expiresAt || access.expiresAt > new Date())
        .map(access => access.warehouse)

      // Filter by preferred warehouses if specified
      const targetWarehouses = bulkOrderData.preferredWarehouses?.length 
        ? bulkOrderData.preferredWarehouses.filter(w => availableWarehouses.includes(w))
        : availableWarehouses

      if (targetWarehouses.length === 0) {
        throw new Error('No available warehouses for routing')
      }

      // Get warehouse capacities and current inventory
      const warehouseData = await Promise.all(
        targetWarehouses.map(async (warehouseId) => {
          const [warehouse, inventory] = await Promise.all([
            warehouseService.getWarehouseById(warehouseId),
            prisma.inventory.findMany({
              where: { location: warehouseId },
              include: { product: true }
            })
          ])

          return {
            warehouseId,
            warehouse,
            inventory,
            region: warehouse?.region || 'US',
            capacity: warehouse?.capacity || 0,
            currentLoad: warehouse?.currentCapacity || 0
          }
        })
      )

      // Calculate routing using intelligent allocation algorithm
      const warehouseAllocations: Record<string, BulkOrderItem[]> = {}
      const shippingCosts: Record<string, number> = {}
      const estimatedDeliveryTimes: Record<string, Date> = {}

      // Algorithm: Prioritize by availability, then by shipping cost, then by delivery time
      for (const item of bulkOrderData.items) {
        let remainingQuantity = item.quantity
        const itemAllocations: Array<{ warehouseId: string; quantity: number; unitPrice: number }> = []

        // Sort warehouses by preference for this item
        const sortedWarehouses = warehouseData
          .filter(wd => {
            const inventoryItem = wd.inventory.find(inv => inv.productId === item.productId)
            return inventoryItem && inventoryItem.availableQuantity > 0
          })
          .sort((a, b) => {
            // Priority factors: availability, shipping cost, regional preference
            const aInventory = a.inventory.find(inv => inv.productId === item.productId)
            const bInventory = b.inventory.find(inv => inv.productId === item.productId)
            
            const aAvailable = aInventory?.availableQuantity || 0
            const bAvailable = bInventory?.availableQuantity || 0
            
            // Prefer warehouses with higher availability
            if (aAvailable !== bAvailable) {
              return bAvailable - aAvailable
            }
            
            // Prefer warehouses in supplier's region
            if (bulkOrderData.deliveryAddress?.country) {
              const preferredRegion = this.getPreferredRegionForCountry(bulkOrderData.deliveryAddress.country)
              if (a.region === preferredRegion && b.region !== preferredRegion) return -1
              if (b.region === preferredRegion && a.region !== preferredRegion) return 1
            }
            
            // Prefer warehouses with lower capacity utilization
            const aUtilization = a.currentLoad / a.capacity
            const bUtilization = b.currentLoad / b.capacity
            return aUtilization - bUtilization
          })

        // Allocate quantity across warehouses
        for (const warehouseData of sortedWarehouses) {
          if (remainingQuantity <= 0) break

          const inventoryItem = warehouseData.inventory.find(inv => inv.productId === item.productId)
          if (!inventoryItem) continue

          const availableQuantity = Math.min(inventoryItem.availableQuantity, remainingQuantity)
          if (availableQuantity > 0) {
            itemAllocations.push({
              warehouseId: warehouseData.warehouseId,
              quantity: availableQuantity,
              unitPrice: item.unitPrice
            })
            remainingQuantity -= availableQuantity
          }
        }

        // Add allocations to warehouse groups
        for (const allocation of itemAllocations) {
          if (!warehouseAllocations[allocation.warehouseId]) {
            warehouseAllocations[allocation.warehouseId] = []
          }
          
          warehouseAllocations[allocation.warehouseId].push({
            productId: item.productId,
            sku: item.sku,
            name: item.name,
            quantity: allocation.quantity,
            unitPrice: allocation.unitPrice,
            specifications: item.specifications
          })
        }

        if (remainingQuantity > 0) {
          logger.warn('Could not fully allocate item across warehouses', {
            productId: item.productId,
            requestedQuantity: item.quantity,
            remainingQuantity
          })
        }
      }

      // Calculate shipping costs and delivery estimates
      for (const warehouseId of Object.keys(warehouseAllocations)) {
        const warehouseInfo = warehouseData.find(wd => wd.warehouseId === warehouseId)
        
        // Calculate shipping cost based on distance and order size
        shippingCosts[warehouseId] = await this.calculateShippingCost(
          warehouseInfo?.region || 'US',
          bulkOrderData.deliveryAddress,
          warehouseAllocations[warehouseId]
        )

        // Estimate delivery time
        estimatedDeliveryTimes[warehouseId] = this.estimateDeliveryTime(
          warehouseInfo?.region || 'US',
          bulkOrderData.deliveryAddress
        )
      }

      // Calculate routing optimization score
      const optimizationScore = this.calculateRoutingScore(warehouseAllocations, shippingCosts, estimatedDeliveryTimes)

      logger.info('Warehouse routing calculated', {
        supplierId: supplier.id,
        warehousesUsed: Object.keys(warehouseAllocations).length,
        totalShippingCost: Object.values(shippingCosts).reduce((sum, cost) => sum + cost, 0),
        optimizationScore
      })

      return {
        warehouseAllocations,
        shippingCosts,
        estimatedDeliveryTimes,
        optimizationScore,
        routingStrategy: 'MULTI_WAREHOUSE_OPTIMAL',
        totalShippingCost: Object.values(shippingCosts).reduce((sum, cost) => sum + cost, 0),
        earliestDelivery: new Date(Math.min(...Object.values(estimatedDeliveryTimes).map(d => d.getTime()))),
        latestDelivery: new Date(Math.max(...Object.values(estimatedDeliveryTimes).map(d => d.getTime())))
      }

    } catch (error) {
      logger.error('Warehouse routing calculation failed', {
        supplierId: supplier.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      throw new Error(`Routing calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Calculate bulk pricing with volume discounts
   */
  private async calculateBulkPricing(
    bulkOrderData: BulkOrderRequest,
    supplier: SupplierAuthData,
    routing: WarehouseRouting
  ): Promise<VolumeDiscountCalculation> {
    try {
      let subtotal = 0
      let totalQuantity = 0
      const itemBreakdown: Array<{
        productId: string
        quantity: number
        unitPrice: number
        lineTotal: number
        discountApplied: number
      }> = []

      // Calculate base totals
      for (const item of bulkOrderData.items) {
        const lineTotal = item.quantity * item.unitPrice
        subtotal += lineTotal
        totalQuantity += item.quantity

        itemBreakdown.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal,
          discountApplied: 0 // Will be calculated below
        })
      }

      // Determine volume discount tier
      const discountTier = this.determineVolumeDiscountTier(subtotal, supplier.tier)
      
      // Calculate discounts
      const volumeDiscount = (subtotal * discountTier.discountPercentage) / 100
      const tierDiscount = this.calculateTierDiscount(subtotal, supplier.tier)
      const seasonalDiscount = await this.calculateSeasonalDiscount(subtotal)
      
      // FlexVolt specific discounts
      const flexVoltDiscount = await this.calculateFlexVoltDiscount(bulkOrderData.items, subtotal)

      const totalDiscount = volumeDiscount + tierDiscount + seasonalDiscount + flexVoltDiscount
      const discountedSubtotal = subtotal - totalDiscount

      // Calculate shipping and taxes
      const totalShipping = routing.totalShippingCost
      const taxRate = await this.calculateTaxRate(bulkOrderData.deliveryAddress)
      const taxAmount = (discountedSubtotal + totalShipping) * taxRate

      const finalTotal = discountedSubtotal + totalShipping + taxAmount

      // Apply discount to individual items proportionally
      const discountRatio = totalDiscount / subtotal
      for (const item of itemBreakdown) {
        item.discountApplied = item.lineTotal * discountRatio
      }

      logger.info('Bulk pricing calculated', {
        supplierId: supplier.id,
        subtotal,
        totalDiscount,
        discountTier: discountTier.tierName,
        finalTotal,
        savings: totalDiscount
      })

      return {
        subtotal,
        totalDiscount,
        discountedSubtotal,
        shipping: totalShipping,
        tax: taxAmount,
        finalTotal,
        discountTier,
        breakdown: {
          volumeDiscount,
          tierDiscount,
          seasonalDiscount,
          flexVoltDiscount
        },
        itemBreakdown,
        taxRate,
        savings: {
          amount: totalDiscount,
          percentage: (totalDiscount / subtotal) * 100
        }
      }

    } catch (error) {
      logger.error('Bulk pricing calculation failed', {
        supplierId: supplier.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      throw new Error(`Pricing calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Helper methods for business logic
   */
  private getMinOrderValueForTier(tier: string): number {
    const minimums = {
      'STANDARD': 1000,
      'PREMIUM': 2500,
      'ENTERPRISE': 5000
    }
    return minimums[tier as keyof typeof minimums] || 1000
  }

  private getMaxBulkOrdersForTier(tier: string): number {
    const limits = {
      'STANDARD': 5,
      'PREMIUM': 10,
      'ENTERPRISE': 25
    }
    return limits[tier as keyof typeof limits] || 5
  }

  private determineVolumeDiscountTier(orderValue: number, supplierTier: string): FlexVoltPricingTier {
    const tiers: FlexVoltPricingTier[] = [
      { tierName: 'Contractor', threshold: 1000, discountPercentage: 10, eligibleCustomerTypes: ['STANDARD', 'PREMIUM', 'ENTERPRISE'] },
      { tierName: 'Professional', threshold: 2500, discountPercentage: 15, eligibleCustomerTypes: ['PREMIUM', 'ENTERPRISE'] },
      { tierName: 'Commercial', threshold: 5000, discountPercentage: 20, eligibleCustomerTypes: ['PREMIUM', 'ENTERPRISE'] },
      { tierName: 'Enterprise', threshold: 7500, discountPercentage: 25, eligibleCustomerTypes: ['ENTERPRISE'] }
    ]

    // Find the highest tier the order qualifies for
    const applicableTiers = tiers.filter(tier => 
      orderValue >= tier.threshold && 
      tier.eligibleCustomerTypes.includes(supplierTier)
    )

    return applicableTiers.length > 0 ? applicableTiers[applicableTiers.length - 1] : tiers[0]
  }

  private calculateTierDiscount(orderValue: number, tier: string): number {
    const tierDiscounts = {
      'STANDARD': 0,
      'PREMIUM': orderValue * 0.02, // 2% additional discount
      'ENTERPRISE': orderValue * 0.05 // 5% additional discount
    }
    return tierDiscounts[tier as keyof typeof tierDiscounts] || 0
  }

  private async calculateSeasonalDiscount(orderValue: number): Promise<number> {
    const currentMonth = new Date().getMonth()
    const isSeasonalPromotion = [0, 1, 11].includes(currentMonth) // Jan, Feb, Dec
    return isSeasonalPromotion ? orderValue * 0.03 : 0 // 3% seasonal discount
  }

  private async calculateFlexVoltDiscount(items: BulkOrderItem[], orderValue: number): Promise<number> {
    const flexVoltItems = items.filter(item => 
      item.sku?.includes('FLEXVOLT') || 
      item.specifications?.voltage === '20V/60V'
    )
    
    if (flexVoltItems.length === 0) return 0
    
    const flexVoltValue = flexVoltItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    
    // Additional 2% discount for orders with >50% FlexVolt products
    if (flexVoltValue / orderValue > 0.5) {
      return flexVoltValue * 0.02
    }
    
    return 0
  }

  private getPreferredRegionForCountry(country: string): string {
    const regionMap: Record<string, string> = {
      'US': 'US',
      'CA': 'US',
      'MX': 'US',
      'JP': 'JAPAN',
      'KR': 'JAPAN',
      'TW': 'JAPAN',
      'DE': 'EU',
      'FR': 'EU',
      'UK': 'EU',
      'IT': 'EU',
      'ES': 'EU',
      'AU': 'AUSTRALIA',
      'NZ': 'AUSTRALIA'
    }
    return regionMap[country] || 'US'
  }

  private async calculateShippingCost(
    warehouseRegion: string, 
    deliveryAddress?: any, 
    items?: BulkOrderItem[]
  ): Promise<number> {
    // Simplified shipping calculation
    const baseCost = 50
    const itemCount = items?.reduce((sum, item) => sum + item.quantity, 0) || 0
    const weightFactor = itemCount * 0.5 // $0.50 per item
    
    const regionMultipliers = {
      'US': 1.0,
      'JAPAN': 1.5,
      'EU': 1.3,
      'AUSTRALIA': 1.4
    }
    
    const multiplier = regionMultipliers[warehouseRegion as keyof typeof regionMultipliers] || 1.0
    return (baseCost + weightFactor) * multiplier
  }

  private estimateDeliveryTime(warehouseRegion: string, deliveryAddress?: any): Date {
    const baseDays = {
      'US': 3,
      'JAPAN': 7,
      'EU': 5,
      'AUSTRALIA': 6
    }
    
    const days = baseDays[warehouseRegion as keyof typeof baseDays] || 5
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  }

  private calculateRoutingScore(
    allocations: Record<string, BulkOrderItem[]>,
    shippingCosts: Record<string, number>,
    deliveryTimes: Record<string, Date>
  ): number {
    // Simplified scoring: prefer fewer warehouses, lower shipping costs, faster delivery
    const warehouseCount = Object.keys(allocations).length
    const totalShipping = Object.values(shippingCosts).reduce((sum, cost) => sum + cost, 0)
    const avgDeliveryDays = Object.values(deliveryTimes).reduce((sum, date) => sum + (date.getTime() - Date.now()), 0) / Object.values(deliveryTimes).length / (24 * 60 * 60 * 1000)
    
    // Score from 0-100 (higher is better)
    const warehouseScore = Math.max(0, 100 - (warehouseCount - 1) * 20) // Prefer fewer warehouses
    const shippingScore = Math.max(0, 100 - totalShipping / 10) // Lower shipping cost is better
    const deliveryScore = Math.max(0, 100 - avgDeliveryDays * 10) // Faster delivery is better
    
    return Math.round((warehouseScore + shippingScore + deliveryScore) / 3)
  }

  private async calculateTaxRate(deliveryAddress?: any): Promise<number> {
    // Simplified tax calculation
    const defaultRates: Record<string, number> = {
      'US': 0.08,
      'CA': 0.13,
      'JP': 0.10,
      'DE': 0.19,
      'AU': 0.10
    }
    
    const country = deliveryAddress?.country || 'US'
    return defaultRates[country] || 0.08
  }

  private estimateProcessingTime(itemCount: number): number {
    // Estimate processing time based on item count
    const baseTime = 60000 // 1 minute base
    const itemTime = itemCount * 100 // 100ms per item
    return baseTime + itemTime
  }

  private async checkCreditLimit(supplierId: string, orderValue: number): Promise<{ approved: boolean; reason?: string }> {
    // Simplified credit check
    const supplier = await prisma.customer.findUnique({
      where: { userId: supplierId },
      select: { id: true }
    })
    
    if (!supplier) {
      return { approved: false, reason: 'Supplier not found' }
    }
    
    // For enterprise customers, assume higher credit limits
    const creditLimit = 500000 // $500k default limit
    
    if (orderValue <= creditLimit) {
      return { approved: true }
    }
    
    return { approved: false, reason: `Order value ($${orderValue.toFixed(2)}) exceeds credit limit ($${creditLimit.toFixed(2)})` }
  }

  private async reserveInventoryAcrossWarehouses(
    bulkOrderData: BulkOrderRequest,
    routing: WarehouseRouting,
    supplier: SupplierAuthData,
    bulkOrderId: string
  ): Promise<Array<{ warehouseId: string; productId: string; quantity: number; reservationId: string }>> {
    const reservations: Array<{ warehouseId: string; productId: string; quantity: number; reservationId: string }> = []
    
    for (const [warehouseId, items] of Object.entries(routing.warehouseAllocations)) {
      for (const item of items) {
        try {
          const reservationId = await inventoryService.reserveInventory(
            item.productId,
            item.quantity,
            bulkOrderId
          )
          
          reservations.push({
            warehouseId,
            productId: item.productId,
            quantity: item.quantity,
            reservationId
          })
        } catch (error) {
          logger.error('Failed to reserve inventory', {
            warehouseId,
            productId: item.productId,
            quantity: item.quantity,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          throw error
        }
      }
    }
    
    return reservations
  }

  private async createBulkOrderRecord(
    bulkOrderData: BulkOrderRequest,
    supplier: SupplierAuthData,
    routing: WarehouseRouting,
    pricing: VolumeDiscountCalculation,
    reservations: Array<{ warehouseId: string; productId: string; quantity: number; reservationId: string }>,
    bulkOrderId: string,
    securityContext: SecurityContext
  ): Promise<any> {
    return await prisma.bulkOrder.create({
      data: {
        id: bulkOrderId,
        supplierId: supplier.id,
        status: 'PROCESSING',
        totalItems: bulkOrderData.items.length,
        totalQuantity: bulkOrderData.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: pricing.subtotal,
        totalDiscount: pricing.totalDiscount,
        shipping: pricing.shipping,
        tax: pricing.tax,
        total: pricing.finalTotal,
        routing: routing as any,
        pricing: pricing as any,
        reservations: reservations as any,
        deliveryAddress: bulkOrderData.deliveryAddress as any,
        notes: bulkOrderData.notes,
        metadata: {
          securityContext,
          processingStarted: new Date().toISOString(),
          estimatedCompletion: new Date(Date.now() + this.estimateProcessingTime(bulkOrderData.items.length)).toISOString()
        }
      }
    })
  }

  private async createFailedBulkOrderRecord(
    bulkOrderId: string,
    bulkOrderData: BulkOrderRequest,
    supplier: SupplierAuthData,
    errorMessage: string,
    securityContext: SecurityContext
  ): Promise<void> {
    try {
      await prisma.bulkOrder.create({
        data: {
          id: bulkOrderId,
          supplierId: supplier.id,
          status: 'FAILED',
          totalItems: bulkOrderData.items.length,
          totalQuantity: bulkOrderData.items.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: 0,
          totalDiscount: 0,
          shipping: 0,
          tax: 0,
          total: 0,
          error: errorMessage,
          metadata: {
            securityContext,
            failedAt: new Date().toISOString(),
            originalRequest: bulkOrderData
          }
        }
      })
    } catch (error) {
      logger.error('Failed to create failed bulk order record', {
        bulkOrderId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  private async processIndividualOrdersAsync(
    bulkOrder: any,
    routing: WarehouseRouting,
    pricing: VolumeDiscountCalculation,
    supplier: SupplierAuthData,
    securityContext: SecurityContext
  ): Promise<void> {
    try {
      const individualOrders = []
      
      // Process each warehouse allocation as a separate order
      for (const [warehouseId, items] of Object.entries(routing.warehouseAllocations)) {
        const orderSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
        const orderShipping = routing.shippingCosts[warehouseId] || 0
        const orderTax = orderSubtotal * (pricing.taxRate || 0.08)
        const orderTotal = orderSubtotal + orderShipping + orderTax
        
        const orderData = {
          customerId: supplier.id,
          items: items.map(item => ({
            productId: item.productId,
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            price: item.unitPrice,
            total: item.quantity * item.unitPrice
          })),
          shippingAddress: bulkOrder.deliveryAddress,
          paymentMethodId: 'bulk_order_internal', // Special payment method for bulk orders
          subtotal: orderSubtotal,
          shipping: orderShipping,
          tax: orderTax,
          total: orderTotal,
          metadata: {
            bulkOrderId: bulkOrder.id,
            warehouseId,
            isBulkOrderPart: true
          }
        }
        
        const individualOrder = await orderService.createOrder(orderData)
        individualOrders.push(individualOrder)
      }
      
      // Update bulk order with individual order references
      await prisma.bulkOrder.update({
        where: { id: bulkOrder.id },
        data: {
          status: 'COMPLETED',
          individualOrders: individualOrders.map(order => order.id),
          completedAt: new Date(),
          metadata: {
            ...bulkOrder.metadata,
            processingCompleted: new Date().toISOString(),
            individualOrderCount: individualOrders.length
          }
        }
      })
      
      logger.info('Bulk order processing completed', {
        bulkOrderId: bulkOrder.id,
        supplierId: supplier.id,
        individualOrderCount: individualOrders.length,
        totalValue: pricing.finalTotal
      })
      
    } catch (error) {
      logger.error('Failed to process individual orders', {
        bulkOrderId: bulkOrder.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Update bulk order status to failed
      await prisma.bulkOrder.update({
        where: { id: bulkOrder.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            ...bulkOrder.metadata,
            processingFailed: new Date().toISOString()
          }
        }
      })
    }
  }

  /**
   * Get bulk orders list with filtering and pagination
   */
  public async getBulkOrders(
    supplierId: string,
    params: {
      page: number;
      limit: number;
      status?: string;
      search?: string;
      sortBy: 'createdAt' | 'updatedAt' | 'totalValue' | 'status';
      sortOrder: 'ASC' | 'DESC';
    }
  ): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    try {
      const { page, limit, status, search, sortBy, sortOrder } = params
      const offset = (page - 1) * limit

      // Build where clause
      const where: any = {
        supplierId
      }

      if (status && status !== 'ALL') {
        where.status = status
      }

      if (search) {
        where.OR = [
          { id: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } }
        ]
      }

      // Get total count
      const total = await prisma.bulkOrder.count({ where })

      // Get bulk orders
      const bulkOrders = await prisma.bulkOrder.findMany({
        where,
        orderBy: { [sortBy]: sortOrder.toLowerCase() },
        skip: offset,
        take: limit,
        select: {
          id: true,
          status: true,
          totalItems: true,
          totalQuantity: true,
          subtotal: true,
          totalDiscount: true,
          shipping: true,
          tax: true,
          total: true,
          createdAt: true,
          updatedAt: true,
          deliveryAddress: true,
          notes: true,
          individualOrders: true,
          routing: true,
          pricing: true
        }
      })

      const hasMore = offset + limit < total

      logger.info('Bulk orders fetched', {
        supplierId,
        page,
        limit,
        total,
        hasMore,
        resultCount: bulkOrders.length
      })

      return {
        items: bulkOrders.map(order => ({
          bulkOrderId: order.id,
          status: order.status,
          totalItems: order.totalItems,
          totalQuantity: order.totalQuantity,
          subtotal: order.subtotal,
          totalDiscount: order.totalDiscount,
          shipping: order.shipping,
          tax: order.tax,
          total: order.total,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          deliveryAddress: order.deliveryAddress,
          notes: order.notes,
          individualOrderCount: Array.isArray(order.individualOrders) ? order.individualOrders.length : 0,
          warehouseCount: order.routing ? Object.keys((order.routing as any).warehouseAllocations || {}).length : 0,
          discountTier: order.pricing ? (order.pricing as any).discountTier?.tierName || 'Standard' : 'Standard'
        })),
        total,
        page,
        limit,
        hasMore
      }

    } catch (error) {
      logger.error('Failed to fetch bulk orders', {
        supplierId,
        params,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Get bulk order status
   */
  public async getBulkOrderStatus(bulkOrderId: string, supplier: SupplierAuthData): Promise<{
    bulkOrder: any;
    individualOrders: any[];
    progress: {
      totalItems: number;
      processedItems: number;
      completedOrders: number;
      failedOrders: number;
      percentComplete: number;
    };
  }> {
    try {
      const bulkOrder = await prisma.bulkOrder.findUnique({
        where: { 
          id: bulkOrderId,
          supplierId: supplier.id 
        }
      })

      if (!bulkOrder) {
        throw new Error('Bulk order not found')
      }

      const individualOrders = bulkOrder.individualOrders ? 
        await Promise.all(
          (bulkOrder.individualOrders as string[]).map(orderId => 
            orderService.getOrder(orderId)
          )
        ) : []

      // Calculate progress
      const totalItems = bulkOrder.totalItems
      const processedItems = individualOrders.reduce((sum, order) => sum + (order?.items.length || 0), 0)
      const completedOrders = individualOrders.filter(order => order?.status === 'delivered').length
      const failedOrders = individualOrders.filter(order => order?.status === 'failed').length
      const percentComplete = totalItems > 0 ? (processedItems / totalItems) * 100 : 0

      return {
        bulkOrder,
        individualOrders: individualOrders.filter(order => order !== null),
        progress: {
          totalItems,
          processedItems,
          completedOrders,
          failedOrders,
          percentComplete: Math.round(percentComplete)
        }
      }

    } catch (error) {
      logger.error('Failed to get bulk order status', {
        bulkOrderId,
        supplierId: supplier.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }
}

// Export singleton instance
export const bulkOrderService = BulkOrderService.getInstance()