// Terminal 3: Advanced Inventory Management System
// Real-time inventory tracking with multi-warehouse support and automated reordering

import { PrismaClient } from '@prisma/client'
import { EventEmitter } from 'events'
import { ecommerceDataLayer, withDatabaseTransaction } from './ecommerce-data-layer'

const prisma = new PrismaClient()

export interface WarehouseLocation {
  id: string
  name: string
  code: string
  address: {
    line1: string
    line2?: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  coordinates: {
    latitude: number
    longitude: number
  }
  isPrimary: boolean
  isActive: boolean
  capacity: number
  currentUtilization: number
  operatingHours: {
    [day: string]: {
      open: string
      close: string
    }
  }
  transitTimes: Map<string, number> // destination -> days
  shippingCosts: Map<string, number> // destination -> cost
}

export interface InventoryItem {
  id: string
  productId: string
  warehouseId: string
  location: string // bin location within warehouse
  quantity: number
  reservedQuantity: number
  availableQuantity: number
  committedQuantity: number
  inTransitQuantity: number
  damageQuantity: number
  reorderLevel: number
  reorderQuantity: number
  maxStockLevel: number
  minStockLevel: number
  leadTimeDays: number
  lastRestocked: Date
  lastCounted: Date
  lastMovement: Date
  batchNumbers: string[]
  serialNumbers: string[]
  expirationDates: Date[]
  cost: number
  supplier: string
  status: InventoryStatus
}

export type InventoryStatus = 'available' | 'reserved' | 'committed' | 'in_transit' | 'damaged' | 'quarantine' | 'discontinued'

export interface StockMovement {
  id: string
  productId: string
  warehouseId: string
  type: MovementType
  quantity: number
  fromLocation?: string
  toLocation?: string
  reason: string
  reference: string // order ID, adjustment ID, etc.
  batchNumber?: string
  serialNumbers?: string[]
  userId: string
  timestamp: Date
  cost?: number
  notes?: string
}

export type MovementType = 'receipt' | 'shipment' | 'transfer' | 'adjustment' | 'cycle_count' | 'damage' | 'return'

export interface InventoryAlert {
  id: string
  type: AlertType
  severity: 'low' | 'medium' | 'high' | 'critical'
  productId: string
  warehouseId: string
  message: string
  threshold: number
  currentValue: number
  actionRequired: string
  notified: boolean
  acknowledged: boolean
  resolvedAt?: Date
  createdAt: Date
}

export type AlertType = 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring' | 'expired' | 'damaged' | 'slow_moving' | 'reorder_point'

export interface ReorderRecommendation {
  productId: string
  warehouseId: string
  currentStock: number
  reorderLevel: number
  recommendedQuantity: number
  urgencyScore: number
  estimatedStockoutDate: Date
  leadTime: number
  costImpact: number
  supplier: string
  reason: string
}

export interface InventoryForecast {
  productId: string
  warehouseId: string
  period: 'daily' | 'weekly' | 'monthly'
  forecast: {
    date: Date
    demandForecast: number
    stockLevel: number
    stockoutRisk: number
    reorderRecommended: boolean
  }[]
  accuracy: number
  confidence: number
  factors: string[]
}

export interface CycleCountPlan {
  id: string
  warehouseId: string
  type: 'full' | 'partial' | 'abc' | 'random'
  scheduledDate: Date
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  products: string[]
  assignedTo: string[]
  priority: number
  estimatedDuration: number
  actualDuration?: number
  discrepancies: CycleCountDiscrepancy[]
}

export interface CycleCountDiscrepancy {
  productId: string
  location: string
  systemQuantity: number
  actualQuantity: number
  variance: number
  variancePercentage: number
  cost: number
  reason?: string
  adjustmentRequired: boolean
}

export class InventoryManagement extends EventEmitter {
  private warehouses: Map<string, WarehouseLocation>
  private alertThresholds: Map<string, any>
  private reorderRules: Map<string, any>
  private demandForecasts: Map<string, InventoryForecast>
  private autoReorderEnabled: boolean
  private realTimeSync: boolean

  constructor() {
    super()
    this.warehouses = new Map()
    this.alertThresholds = new Map()
    this.reorderRules = new Map()
    this.demandForecasts = new Map()
    this.autoReorderEnabled = true
    this.realTimeSync = true

    this.initializeWarehouses()
    this.setupAlertThresholds()
    this.setupReorderRules()
    this.startRealTimeMonitoring()
  }

  // Initialize warehouse configurations
  private initializeWarehouses(): void {
    const primaryWarehouse: WarehouseLocation = {
      id: 'WH001',
      name: 'Primary Distribution Center',
      code: 'PDC',
      address: {
        line1: '1234 Industrial Blvd',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75201',
        country: 'US'
      },
      coordinates: {
        latitude: 32.7767,
        longitude: -96.7970
      },
      isPrimary: true,
      isActive: true,
      capacity: 100000,
      currentUtilization: 0,
      operatingHours: {
        'monday': { open: '08:00', close: '17:00' },
        'tuesday': { open: '08:00', close: '17:00' },
        'wednesday': { open: '08:00', close: '17:00' },
        'thursday': { open: '08:00', close: '17:00' },
        'friday': { open: '08:00', close: '17:00' }
      },
      transitTimes: new Map([
        ['TX', 1], ['OK', 2], ['AR', 2], ['LA', 2], ['NM', 3]
      ]),
      shippingCosts: new Map([
        ['TX', 5], ['OK', 8], ['AR', 8], ['LA', 10], ['NM', 12]
      ])
    }

    this.warehouses.set(primaryWarehouse.id, primaryWarehouse)
  }

  // Setup alert thresholds
  private setupAlertThresholds(): void {
    this.alertThresholds.set('default', {
      lowStock: 0.2, // 20% of reorder level
      outOfStock: 0,
      overstock: 2.0, // 200% of max level
      expiringSoon: 30, // 30 days
      slowMoving: 90 // 90 days without movement
    })
  }

  // Setup reorder rules
  private setupReorderRules(): void {
    this.reorderRules.set('default', {
      method: 'min_max', // min_max, economic_order_quantity, just_in_time
      safetyStock: 0.1, // 10% safety stock
      leadTimeBuffer: 3, // extra days
      seasonalityFactor: 1.0,
      supplierReliability: 0.95
    })
  }

  // Start real-time monitoring
  private startRealTimeMonitoring(): void {
    // Monitor inventory levels every minute
    setInterval(async () => {
      await this.checkInventoryLevels()
      await this.checkAlerts()
      await this.processReorderRecommendations()
    }, 60000)

    // Update forecasts every hour
    setInterval(async () => {
      await this.updateDemandForecasts()
    }, 3600000)

    // Process cycle counts daily
    setInterval(async () => {
      await this.processCycleCounts()
    }, 86400000)
  }

  // Get real-time inventory for a product
  async getInventoryAvailability(
    productId: string,
    quantity: number,
    warehouseId?: string
  ): Promise<{
    available: boolean
    totalAvailable: number
    warehouses: Array<{
      warehouseId: string
      available: number
      reserved: number
      estimatedDelivery: Date
      shippingCost: number
    }>
    alternatives: Array<{
      productId: string
      name: string
      available: number
      compatibility: number
    }>
  }> {
    try {
      const whereClause: any = { productId }
      if (warehouseId) {
        whereClause.location = warehouseId
      }

      const inventoryItems = await prisma.inventory.findMany({
        where: whereClause,
        include: {
          product: true
        }
      })

      const totalAvailable = inventoryItems.reduce(
        (sum, item) => sum + (item.quantity - item.reservedQuantity),
        0
      )

      const warehouseDetails = inventoryItems.map(item => {
        const warehouse = this.warehouses.get(item.location)
        return {
          warehouseId: item.location,
          available: item.quantity - item.reservedQuantity,
          reserved: item.reservedQuantity,
          estimatedDelivery: this.calculateDeliveryDate(item.location),
          shippingCost: warehouse?.shippingCosts.get('default') || 0
        }
      })

      // Find alternatives if insufficient stock
      const alternatives = totalAvailable < quantity
        ? await this.findAlternativeProducts(productId, quantity - totalAvailable)
        : []

      return {
        available: totalAvailable >= quantity,
        totalAvailable,
        warehouses: warehouseDetails,
        alternatives
      }
    } catch (error) {
      console.error('Failed to get inventory availability:', error)
      throw error
    }
  }

  // Reserve inventory for an order
  async reserveInventory(
    productId: string,
    quantity: number,
    orderId: string,
    warehouseId?: string
  ): Promise<{
    success: boolean
    reservations: Array<{
      warehouseId: string
      quantity: number
      reservationId: string
    }>
  }> {
    return withDatabaseTransaction(async (tx) => {
      try {
        const availableInventory = await tx.inventory.findMany({
          where: {
            productId,
            location: warehouseId || undefined,
            availableQuantity: { gt: 0 }
          },
          orderBy: [
            { location: warehouseId ? 'asc' : 'desc' }, // Prefer specified warehouse
            { quantity: 'desc' } // Use highest quantity first
          ]
        })

        let remainingQuantity = quantity
        const reservations: Array<{
          warehouseId: string
          quantity: number
          reservationId: string
        }> = []

        for (const item of availableInventory) {
          if (remainingQuantity <= 0) break

          const availableQty = item.quantity - item.reservedQuantity
          const reserveQty = Math.min(remainingQuantity, availableQty)

          if (reserveQty > 0) {
            // Update inventory reservation
            await tx.inventory.update({
              where: { id: item.id },
              data: {
                reservedQuantity: item.reservedQuantity + reserveQty,
                availableQuantity: item.availableQuantity - reserveQty
              }
            })

            // Create stock movement record
            const movementId = await this.createStockMovement({
              productId,
              warehouseId: item.location,
              type: 'adjustment',
              quantity: -reserveQty,
              reason: `Reserved for order ${orderId}`,
              reference: orderId,
              userId: 'system',
              timestamp: new Date()
            }, tx)

            reservations.push({
              warehouseId: item.location,
              quantity: reserveQty,
              reservationId: movementId
            })

            remainingQuantity -= reserveQty
          }
        }

        if (remainingQuantity > 0) {
          throw new Error(`Insufficient inventory. Still need ${remainingQuantity} units`)
        }

        // Emit inventory reserved event
        this.emit('inventoryReserved', {
          productId,
          quantity,
          orderId,
          reservations
        })

        return {
          success: true,
          reservations
        }
      } catch (error) {
        console.error('Failed to reserve inventory:', error)
        throw error
      }
    })
  }

  // Release reserved inventory
  async releaseReservation(
    productId: string,
    quantity: number,
    orderId: string,
    warehouseId?: string
  ): Promise<void> {
    return withDatabaseTransaction(async (tx) => {
      try {
        const reservedInventory = await tx.inventory.findMany({
          where: {
            productId,
            location: warehouseId || undefined,
            reservedQuantity: { gt: 0 }
          }
        })

        let remainingQuantity = quantity

        for (const item of reservedInventory) {
          if (remainingQuantity <= 0) break

          const releaseQty = Math.min(remainingQuantity, item.reservedQuantity)

          if (releaseQty > 0) {
            await tx.inventory.update({
              where: { id: item.id },
              data: {
                reservedQuantity: item.reservedQuantity - releaseQty,
                availableQuantity: item.availableQuantity + releaseQty
              }
            })

            // Create stock movement record
            await this.createStockMovement({
              productId,
              warehouseId: item.location,
              type: 'adjustment',
              quantity: releaseQty,
              reason: `Released from order ${orderId}`,
              reference: orderId,
              userId: 'system',
              timestamp: new Date()
            }, tx)

            remainingQuantity -= releaseQty
          }
        }

        // Emit inventory released event
        this.emit('inventoryReleased', {
          productId,
          quantity: quantity - remainingQuantity,
          orderId
        })
      } catch (error) {
        console.error('Failed to release reservation:', error)
        throw error
      }
    })
  }

  // Process shipment and update inventory
  async processShipment(
    productId: string,
    quantity: number,
    warehouseId: string,
    orderId: string
  ): Promise<void> {
    return withDatabaseTransaction(async (tx) => {
      try {
        const inventory = await tx.inventory.findFirst({
          where: {
            productId,
            location: warehouseId
          }
        })

        if (!inventory) {
          throw new Error(`Inventory not found for product ${productId} at warehouse ${warehouseId}`)
        }

        // Update inventory quantities
        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: inventory.quantity - quantity,
            reservedQuantity: Math.max(0, inventory.reservedQuantity - quantity),
            availableQuantity: Math.max(0, inventory.availableQuantity - Math.max(0, quantity - inventory.reservedQuantity))
          }
        })

        // Create stock movement record
        await this.createStockMovement({
          productId,
          warehouseId,
          type: 'shipment',
          quantity: -quantity,
          reason: `Shipped for order ${orderId}`,
          reference: orderId,
          userId: 'system',
          timestamp: new Date()
        }, tx)

        // Check for reorder alerts
        await this.checkReorderRequired(productId, warehouseId)

        // Emit shipment processed event
        this.emit('shipmentProcessed', {
          productId,
          quantity,
          warehouseId,
          orderId
        })
      } catch (error) {
        console.error('Failed to process shipment:', error)
        throw error
      }
    })
  }

  // Receive stock into warehouse
  async receiveStock(
    productId: string,
    quantity: number,
    warehouseId: string,
    batchNumber?: string,
    serialNumbers?: string[],
    cost?: number
  ): Promise<void> {
    return withDatabaseTransaction(async (tx) => {
      try {
        const inventory = await tx.inventory.findFirst({
          where: {
            productId,
            location: warehouseId
          }
        })

        if (inventory) {
          // Update existing inventory
          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: inventory.quantity + quantity,
              availableQuantity: inventory.availableQuantity + quantity,
              lastRestocked: new Date()
            }
          })
        } else {
          // Create new inventory record
          await tx.inventory.create({
            data: {
              productId,
              location: warehouseId,
              quantity,
              availableQuantity: quantity,
              reservedQuantity: 0,
              reorderPoint: 10,
              reorderQuantity: 50,
              lastRestocked: new Date()
            }
          })
        }

        // Create stock movement record
        await this.createStockMovement({
          productId,
          warehouseId,
          type: 'receipt',
          quantity,
          reason: 'Stock received',
          reference: `RCP-${Date.now()}`,
          batchNumber,
          serialNumbers,
          userId: 'system',
          timestamp: new Date(),
          cost
        }, tx)

        // Emit stock received event
        this.emit('stockReceived', {
          productId,
          quantity,
          warehouseId,
          batchNumber,
          serialNumbers
        })
      } catch (error) {
        console.error('Failed to receive stock:', error)
        throw error
      }
    })
  }

  // Create stock movement record
  private async createStockMovement(
    movement: Omit<StockMovement, 'id'>,
    tx?: any
  ): Promise<string> {
    const movementData = {
      id: `MOV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...movement
    }

    // Here you would save to a stock_movements table
    // For now, just return the ID
    return movementData.id
  }

  // Check inventory levels and generate alerts
  private async checkInventoryLevels(): Promise<void> {
    try {
      const inventoryItems = await prisma.inventory.findMany({
        include: {
          product: true
        }
      })

      for (const item of inventoryItems) {
        await this.checkItemAlerts(item)
      }
    } catch (error) {
      console.error('Failed to check inventory levels:', error)
    }
  }

  // Check alerts for a specific inventory item
  private async checkItemAlerts(item: any): Promise<void> {
    const thresholds = this.alertThresholds.get('default')
    const availableQty = item.quantity - item.reservedQuantity

    // Low stock alert
    if (availableQty <= item.reorderPoint * thresholds.lowStock) {
      await this.createAlert({
        type: 'low_stock',
        severity: availableQty === 0 ? 'critical' : 'high',
        productId: item.productId,
        warehouseId: item.location,
        message: `Low stock: ${availableQty} units remaining`,
        threshold: item.reorderPoint,
        currentValue: availableQty,
        actionRequired: 'Reorder immediately'
      })
    }

    // Out of stock alert
    if (availableQty === 0) {
      await this.createAlert({
        type: 'out_of_stock',
        severity: 'critical',
        productId: item.productId,
        warehouseId: item.location,
        message: 'Product is out of stock',
        threshold: 0,
        currentValue: 0,
        actionRequired: 'Emergency reorder required'
      })
    }
  }

  // Create inventory alert
  private async createAlert(alert: Omit<InventoryAlert, 'id' | 'notified' | 'acknowledged' | 'createdAt'>): Promise<void> {
    const alertData: InventoryAlert = {
      id: `ALT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...alert,
      notified: false,
      acknowledged: false,
      createdAt: new Date()
    }

    // Here you would save to an alerts table
    // For now, just emit the event
    this.emit('inventoryAlert', alertData)
  }

  // Check for reorder requirements
  private async checkReorderRequired(productId: string, warehouseId: string): Promise<void> {
    try {
      const inventory = await prisma.inventory.findFirst({
        where: {
          productId,
          location: warehouseId
        },
        include: {
          product: true
        }
      })

      if (!inventory) return

      const availableQty = inventory.quantity - inventory.reservedQuantity

      if (availableQty <= inventory.reorderPoint && this.autoReorderEnabled) {
        const recommendation = await this.generateReorderRecommendation(inventory)
        
        this.emit('reorderRecommendation', recommendation)

        // Auto-create purchase order if configured
        // await this.createPurchaseOrder(recommendation)
      }
    } catch (error) {
      console.error('Failed to check reorder requirement:', error)
    }
  }

  // Generate reorder recommendation
  private async generateReorderRecommendation(inventory: any): Promise<ReorderRecommendation> {
    const forecast = this.demandForecasts.get(`${inventory.productId}-${inventory.location}`)
    const leadTime = 7 // Default lead time in days
    const safetyStock = Math.ceil(inventory.reorderQuantity * 0.1)

    return {
      productId: inventory.productId,
      warehouseId: inventory.location,
      currentStock: inventory.quantity - inventory.reservedQuantity,
      reorderLevel: inventory.reorderPoint,
      recommendedQuantity: inventory.reorderQuantity + safetyStock,
      urgencyScore: this.calculateUrgencyScore(inventory),
      estimatedStockoutDate: this.estimateStockoutDate(inventory, forecast),
      leadTime,
      costImpact: inventory.reorderQuantity * (inventory.product?.basePrice || 0),
      supplier: 'Primary Supplier',
      reason: 'Below reorder point'
    }
  }

  // Calculate urgency score for reorder
  private calculateUrgencyScore(inventory: any): number {
    const availableQty = inventory.quantity - inventory.reservedQuantity
    const reorderRatio = availableQty / inventory.reorderPoint
    
    // Higher urgency for lower stock levels
    return Math.max(0, 1 - reorderRatio)
  }

  // Estimate stockout date
  private estimateStockoutDate(inventory: any, forecast?: InventoryForecast): Date {
    const availableQty = inventory.quantity - inventory.reservedQuantity
    const avgDailyDemand = 2 // Default daily demand
    
    const daysUntilStockout = Math.max(1, Math.floor(availableQty / avgDailyDemand))
    
    const stockoutDate = new Date()
    stockoutDate.setDate(stockoutDate.getDate() + daysUntilStockout)
    
    return stockoutDate
  }

  // Calculate delivery date for a warehouse
  private calculateDeliveryDate(warehouseId: string, destinationState?: string): Date {
    const warehouse = this.warehouses.get(warehouseId)
    const transitDays = warehouse?.transitTimes.get(destinationState || 'default') || 3
    
    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + transitDays)
    
    return deliveryDate
  }

  // Find alternative products
  private async findAlternativeProducts(
    productId: string,
    requiredQuantity: number
  ): Promise<Array<{
    productId: string
    name: string
    available: number
    compatibility: number
  }>> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      if (!product) return []

      // Find similar products in same category
      const alternatives = await prisma.product.findMany({
        where: {
          category: product.category,
          id: { not: productId },
          isActive: true
        },
        include: {
          inventoryItems: true
        },
        take: 5
      })

      return alternatives.map(alt => ({
        productId: alt.id,
        name: alt.name,
        available: alt.inventoryItems.reduce(
          (sum, inv) => sum + (inv.quantity - inv.reservedQuantity),
          0
        ),
        compatibility: this.calculateCompatibility(product, alt)
      })).filter(alt => alt.available > 0)
    } catch (error) {
      console.error('Failed to find alternatives:', error)
      return []
    }
  }

  // Calculate product compatibility score
  private calculateCompatibility(product1: any, product2: any): number {
    // This would use product specifications to calculate compatibility
    // For now, return a mock score based on category
    return product1.category === product2.category ? 0.8 : 0.3
  }

  // Update demand forecasts
  private async updateDemandForecasts(): Promise<void> {
    // This would integrate with ML models to forecast demand
    // For now, just update with mock data
    console.log('Updating demand forecasts...')
  }

  // Process cycle counts
  private async processCycleCounts(): Promise<void> {
    // This would handle scheduled cycle counting
    console.log('Processing cycle counts...')
  }

  // Check alerts and send notifications
  private async checkAlerts(): Promise<void> {
    // This would check for triggered alerts and send notifications
    console.log('Checking alerts...')
  }

  // Process reorder recommendations
  private async processReorderRecommendations(): Promise<void> {
    // This would process and act on reorder recommendations
    console.log('Processing reorder recommendations...')
  }

  // Get inventory metrics for dashboard
  async getInventoryMetrics(): Promise<{
    totalProducts: number
    totalValue: number
    lowStockItems: number
    outOfStockItems: number
    turnoverRate: number
    fillRate: number
    accuracy: number
  }> {
    try {
      const inventory = await prisma.inventory.findMany({
        include: {
          product: true
        }
      })

      const totalProducts = inventory.length
      const totalValue = inventory.reduce(
        (sum, item) => sum + (item.quantity * (item.product?.basePrice || 0)),
        0
      )
      const lowStockItems = inventory.filter(
        item => (item.quantity - item.reservedQuantity) <= item.reorderPoint
      ).length
      const outOfStockItems = inventory.filter(
        item => (item.quantity - item.reservedQuantity) === 0
      ).length

      return {
        totalProducts,
        totalValue,
        lowStockItems,
        outOfStockItems,
        turnoverRate: 4.2, // Mock data
        fillRate: 0.96, // Mock data
        accuracy: 0.99 // Mock data
      }
    } catch (error) {
      console.error('Failed to get inventory metrics:', error)
      throw error
    }
  }

  // Shutdown gracefully
  async shutdown(): Promise<void> {
    // Stop monitoring intervals
    // Clean up resources
    this.emit('shutdown')
  }
}

// Singleton instance
export const inventoryManagement = new InventoryManagement()

export default inventoryManagement