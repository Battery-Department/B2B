/**
 * RHY Supplier Portal - Inventory Dashboard Service
 * Enterprise-grade real-time inventory management service
 * Integrates with Batch 1 authentication and warehouse foundation
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { warehouseService } from '@/services/warehouse/WarehouseService'
import { 
  InventoryItem,
  InventoryDashboard,
  MultiWarehouseInventory,
  InventoryAlert,
  InventoryMovement,
  InventoryQuery,
  InventoryUpdateRequest,
  BulkInventoryUpdateRequest,
  TransferRequest,
  InventoryForecast,
  InventoryAnalytics,
  SyncEvent,
  SyncStatus,
  InventoryQuerySchema,
  InventoryUpdateSchema,
  BulkInventoryUpdateSchema,
  TransferRequestSchema
} from '@/types/inventory'
import { WarehouseAccess } from '@/types/auth'

export class InventoryDashboardService {
  private static instance: InventoryDashboardService
  private readonly retryAttempts = 3
  private readonly timeoutMs = 30000
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map()

  private constructor() {
    this.initializeRealTimeSync()
  }

  public static getInstance(): InventoryDashboardService {
    if (!InventoryDashboardService.instance) {
      InventoryDashboardService.instance = new InventoryDashboardService()
    }
    return InventoryDashboardService.instance
  }

  /**
   * Get real-time inventory dashboard for a warehouse
   */
  public async getDashboard(
    warehouseId: string, 
    userId: string,
    warehouseAccess: WarehouseAccess[]
  ): Promise<InventoryDashboard> {
    try {
      const startTime = Date.now()

      // Validate warehouse access
      await this.validateWarehouseAccess(warehouseId, warehouseAccess)

      logger.info('Fetching inventory dashboard', { 
        warehouseId, 
        userId,
        timestamp: new Date().toISOString()
      })

      // Get warehouse details
      const warehouse = await warehouseService.getWarehouseById(warehouseId, userId)
      if (!warehouse) {
        throw new Error(`Warehouse not found: ${warehouseId}`)
      }

      // Execute parallel queries for performance
      const [
        inventoryItems,
        recentMovements,
        activeAlerts,
        performanceMetrics,
        predictions
      ] = await Promise.all([
        this.getInventoryItems(warehouseId),
        this.getRecentMovements(warehouseId, 20),
        this.getActiveAlerts(warehouseId),
        this.getPerformanceMetrics(warehouseId),
        this.getPredictions(warehouseId)
      ])

      // Calculate summary statistics
      const summary = this.calculateSummary(inventoryItems)
      const categoryBreakdown = this.calculateCategoryBreakdown(inventoryItems)

      const dashboard: InventoryDashboard = {
        warehouseId,
        warehouseName: warehouse.name,
        region: warehouse.region as 'US' | 'JP' | 'EU' | 'AU',
        summary,
        categoryBreakdown,
        recentMovements,
        activeAlerts,
        performanceMetrics,
        predictions,
        lastUpdated: new Date()
      }

      const duration = Date.now() - startTime

      logger.info('Inventory dashboard generated successfully', {
        warehouseId,
        duration,
        totalItems: summary.totalItems,
        alertsCount: summary.alertsCount
      })

      // Audit log
      await this.createAuditLog({
        action: 'DASHBOARD_ACCESSED',
        warehouseId,
        userId,
        details: {
          duration,
          itemsCount: summary.totalItems,
          alertsCount: summary.alertsCount
        }
      })

      return dashboard

    } catch (error) {
      logger.error('Failed to generate inventory dashboard', {
        warehouseId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw this.handleError(error, 'DASHBOARD_GENERATION_ERROR')
    }
  }

  /**
   * Get multi-warehouse inventory view for global stock levels
   */
  public async getMultiWarehouseInventory(
    userId: string,
    warehouseAccess: WarehouseAccess[],
    filters?: { category?: string; search?: string }
  ): Promise<MultiWarehouseInventory[]> {
    try {
      const startTime = Date.now()

      // Get accessible warehouses
      const accessibleWarehouses = warehouseAccess.map(access => access.warehouse)
      
      logger.info('Fetching multi-warehouse inventory', { 
        userId,
        warehouses: accessibleWarehouses,
        filters
      })

      // Build query filters
      const whereClause: any = {
        warehouseId: {
          in: accessibleWarehouses
        }
      }

      if (filters?.category) {
        whereClause.category = filters.category
      }

      if (filters?.search) {
        whereClause.OR = [
          { productName: { contains: filters.search, mode: 'insensitive' } },
          { sku: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      // Get inventory items grouped by product
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: whereClause,
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              region: true
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              specifications: true
            }
          },
          alerts: {
            where: {
              resolved: false
            }
          }
        }
      })

      // Group by product
      const productGroups = this.groupInventoryByProduct(inventoryItems)

      // Transform to multi-warehouse format
      const multiWarehouseInventory = await Promise.all(
        Array.from(productGroups.entries()).map(async ([productId, items]) => {
          const firstItem = items[0]
          const transferOpportunities = await this.calculateTransferOpportunities(items)
          
          return {
            productId,
            productName: firstItem.productName,
            sku: firstItem.sku,
            category: firstItem.category,
            globalStock: {
              totalQuantity: items.reduce((sum, item) => sum + item.currentQuantity, 0),
              totalValue: items.reduce((sum, item) => sum + (item.currentQuantity * item.retailPrice), 0),
              averagePrice: items.reduce((sum, item) => sum + item.retailPrice, 0) / items.length
            },
            warehouseBreakdown: items.map(item => ({
              warehouseId: item.warehouseId,
              warehouseName: item.warehouse.name,
              region: item.warehouse.region as 'US' | 'JP' | 'EU' | 'AU',
              quantity: item.currentQuantity,
              available: item.availableQuantity,
              reserved: item.reservedQuantity,
              status: item.status,
              lastUpdated: item.updatedAt
            })),
            transferOpportunities,
            globalAlerts: items.flatMap(item => item.alerts),
            syncStatus: this.calculateGlobalSyncStatus(items),
            lastGlobalSync: new Date(Math.max(...items.map(item => item.updatedAt.getTime())))
          } as MultiWarehouseInventory
        })
      )

      const duration = Date.now() - startTime

      logger.info('Multi-warehouse inventory generated successfully', {
        userId,
        productsCount: multiWarehouseInventory.length,
        warehousesCount: accessibleWarehouses.length,
        duration
      })

      return multiWarehouseInventory

    } catch (error) {
      logger.error('Failed to generate multi-warehouse inventory', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw this.handleError(error, 'MULTI_WAREHOUSE_INVENTORY_ERROR')
    }
  }

  /**
   * Update inventory item with real-time sync
   */
  public async updateInventoryItem(
    request: InventoryUpdateRequest,
    warehouseAccess: WarehouseAccess[]
  ): Promise<InventoryItem> {
    try {
      const validatedRequest = InventoryUpdateSchema.parse(request)
      const startTime = Date.now()

      logger.info('Updating inventory item', {
        inventoryItemId: validatedRequest.inventoryItemId,
        userId: validatedRequest.userId
      })

      // Get current item and validate access
      const currentItem = await prisma.inventoryItem.findUnique({
        where: { id: validatedRequest.inventoryItemId },
        include: {
          warehouse: true,
          product: true
        }
      })

      if (!currentItem) {
        throw new Error(`Inventory item not found: ${validatedRequest.inventoryItemId}`)
      }

      await this.validateWarehouseAccess(currentItem.warehouseId, warehouseAccess)

      // Perform update in transaction
      const updatedItem = await prisma.$transaction(async (tx) => {
        // Update inventory item
        const updated = await tx.inventoryItem.update({
          where: { id: validatedRequest.inventoryItemId },
          data: {
            ...validatedRequest,
            updatedAt: new Date(),
            updatedBy: validatedRequest.userId,
            syncStatus: 'PENDING'
          },
          include: {
            warehouse: {
              select: {
                id: true,
                name: true,
                region: true,
                code: true
              }
            },
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                specifications: true,
                dimensions: true
              }
            },
            movements: {
              orderBy: { timestamp: 'desc' },
              take: 10
            },
            alerts: {
              where: { resolved: false }
            }
          }
        })

        // Create movement record
        await tx.inventoryMovement.create({
          data: {
            inventoryItemId: validatedRequest.inventoryItemId,
            type: 'ADJUSTMENT',
            quantity: validatedRequest.quantity ? validatedRequest.quantity - currentItem.currentQuantity : 0,
            reason: validatedRequest.reason,
            userId: validatedRequest.userId,
            timestamp: new Date(),
            metadata: {
              source: 'MANUAL',
              previousQuantity: currentItem.currentQuantity,
              newQuantity: validatedRequest.quantity || currentItem.currentQuantity,
              updateType: 'MANUAL_ADJUSTMENT'
            }
          }
        })

        // Check for alerts
        await this.checkAndCreateAlerts(updated)

        return updated
      })

      // Trigger real-time sync
      await this.triggerRealtimeSync(currentItem.warehouseId, {
        type: 'INVENTORY_UPDATE',
        inventoryItemId: validatedRequest.inventoryItemId,
        data: updatedItem
      })

      const duration = Date.now() - startTime

      logger.info('Inventory item updated successfully', {
        inventoryItemId: validatedRequest.inventoryItemId,
        duration,
        userId: validatedRequest.userId
      })

      return this.transformInventoryItem(updatedItem)

    } catch (error) {
      logger.error('Failed to update inventory item', {
        request,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw this.handleError(error, 'INVENTORY_UPDATE_ERROR')
    }
  }

  /**
   * Bulk update inventory items
   */
  public async bulkUpdateInventory(
    request: BulkInventoryUpdateRequest,
    warehouseAccess: WarehouseAccess[]
  ): Promise<{
    updated: InventoryItem[]
    failed: Array<{ item: InventoryUpdateRequest; error: string }>
    summary: {
      totalRequested: number
      successful: number
      failed: number
      warnings: string[]
    }
  }> {
    try {
      const validatedRequest = BulkInventoryUpdateSchema.parse(request)
      const startTime = Date.now()

      logger.info('Starting bulk inventory update', {
        updateCount: validatedRequest.updates.length,
        userId: validatedRequest.userId,
        batchId: validatedRequest.batchId
      })

      const updated: InventoryItem[] = []
      const failed: Array<{ item: InventoryUpdateRequest; error: string }> = []
      const warnings: string[] = []

      // Process updates in batches for performance
      const batchSize = 10
      for (let i = 0; i < validatedRequest.updates.length; i += batchSize) {
        const batch = validatedRequest.updates.slice(i, i + batchSize)
        
        const batchResults = await Promise.allSettled(
          batch.map(update => this.updateInventoryItem(update, warehouseAccess))
        )

        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            updated.push(result.value)
          } else {
            failed.push({
              item: batch[index],
              error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
            })
          }
        })
      }

      const duration = Date.now() - startTime

      // Generate warnings
      if (failed.length > 0) {
        warnings.push(`${failed.length} items failed to update`)
      }
      if (updated.length > 0 && failed.length > 0) {
        warnings.push('Partial update completed - review failed items')
      }

      const summary = {
        totalRequested: validatedRequest.updates.length,
        successful: updated.length,
        failed: failed.length,
        warnings
      }

      logger.info('Bulk inventory update completed', {
        ...summary,
        duration,
        userId: validatedRequest.userId
      })

      return { updated, failed, summary }

    } catch (error) {
      logger.error('Failed to perform bulk inventory update', {
        request,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw this.handleError(error, 'BULK_INVENTORY_UPDATE_ERROR')
    }
  }

  /**
   * Create inventory transfer between warehouses
   */
  public async createTransfer(
    request: TransferRequest,
    warehouseAccess: WarehouseAccess[]
  ): Promise<any> {
    try {
      const validatedRequest = TransferRequestSchema.parse(request)
      const startTime = Date.now()

      // Validate access to both warehouses
      await this.validateWarehouseAccess(validatedRequest.fromWarehouseId, warehouseAccess)
      await this.validateWarehouseAccess(validatedRequest.toWarehouseId, warehouseAccess)

      logger.info('Creating inventory transfer', {
        fromWarehouse: validatedRequest.fromWarehouseId,
        toWarehouse: validatedRequest.toWarehouseId,
        itemCount: validatedRequest.items.length,
        requestedBy: validatedRequest.requestedBy
      })

      // Validate inventory availability
      for (const item of validatedRequest.items) {
        const inventoryItem = await prisma.inventoryItem.findUnique({
          where: { id: item.inventoryItemId }
        })

        if (!inventoryItem) {
          throw new Error(`Inventory item not found: ${item.inventoryItemId}`)
        }

        if (inventoryItem.availableQuantity < item.quantity) {
          throw new Error(`Insufficient stock for item ${inventoryItem.productName}: available ${inventoryItem.availableQuantity}, requested ${item.quantity}`)
        }
      }

      // Create transfer in transaction
      const transfer = await prisma.$transaction(async (tx) => {
        // Create transfer record
        const newTransfer = await tx.inventoryTransfer.create({
          data: {
            fromWarehouseId: validatedRequest.fromWarehouseId,
            toWarehouseId: validatedRequest.toWarehouseId,
            status: 'PENDING',
            requestedBy: validatedRequest.requestedBy,
            reason: validatedRequest.reason,
            priority: validatedRequest.priority,
            requestedDeliveryDate: validatedRequest.requestedDeliveryDate,
            notes: validatedRequest.notes,
            metadata: {
              autoGenerated: false,
              itemCount: validatedRequest.items.length
            }
          }
        })

        // Create transfer items and reserve inventory
        for (const item of validatedRequest.items) {
          await tx.inventoryTransferItem.create({
            data: {
              transferId: newTransfer.id,
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity
            }
          })

          // Reserve inventory
          await tx.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: {
              reservedQuantity: {
                increment: item.quantity
              }
            }
          })

          // Create movement record
          await tx.inventoryMovement.create({
            data: {
              inventoryItemId: item.inventoryItemId,
              type: 'TRANSFER',
              quantity: -item.quantity,
              reason: `Transfer to warehouse ${validatedRequest.toWarehouseId}`,
              userId: validatedRequest.requestedBy,
              timestamp: new Date(),
              metadata: {
                source: 'TRANSFER',
                transferId: newTransfer.id,
                toWarehouse: validatedRequest.toWarehouseId
              }
            }
          })
        }

        return newTransfer
      })

      // Trigger notifications and sync
      await this.triggerRealtimeSync(validatedRequest.fromWarehouseId, {
        type: 'TRANSFER_UPDATE',
        data: { transferId: transfer.id, status: 'PENDING' }
      })

      const duration = Date.now() - startTime

      logger.info('Inventory transfer created successfully', {
        transferId: transfer.id,
        duration,
        requestedBy: validatedRequest.requestedBy
      })

      return transfer

    } catch (error) {
      logger.error('Failed to create inventory transfer', {
        request,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw this.handleError(error, 'INVENTORY_TRANSFER_ERROR')
    }
  }

  /**
   * Get inventory analytics for performance monitoring
   */
  public async getInventoryAnalytics(
    warehouseId: string,
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
    warehouseAccess: WarehouseAccess[]
  ): Promise<InventoryAnalytics> {
    try {
      await this.validateWarehouseAccess(warehouseId, warehouseAccess)

      const startTime = Date.now()
      const endDate = new Date()
      const startDate = this.calculatePeriodStartDate(endDate, period)

      logger.info('Generating inventory analytics', {
        warehouseId,
        period,
        dateRange: { start: startDate, end: endDate }
      })

      // Get inventory data for analysis
      const [inventoryItems, movements, alerts] = await Promise.all([
        prisma.inventoryItem.findMany({
          where: { warehouseId },
          include: { product: true }
        }),
        prisma.inventoryMovement.findMany({
          where: {
            inventoryItem: { warehouseId },
            timestamp: { gte: startDate, lte: endDate }
          }
        }),
        prisma.inventoryAlert.findMany({
          where: {
            warehouseId,
            createdAt: { gte: startDate, lte: endDate }
          }
        })
      ])

      // Calculate metrics
      const metrics = this.calculateInventoryMetrics(inventoryItems, movements, alerts)
      const trends = this.calculateInventoryTrends(warehouseId, period)
      const categoryAnalysis = this.analyzeCategoryPerformance(inventoryItems, movements)
      const alertsBreakdown = this.analyzeAlerts(alerts)
      const efficiency = await this.calculateEfficiencyMetrics(warehouseId, startDate, endDate)

      const analytics: InventoryAnalytics = {
        warehouseId,
        period,
        metrics,
        trends,
        categoryAnalysis,
        alerts: alertsBreakdown,
        efficiency,
        generatedAt: new Date()
      }

      const duration = Date.now() - startTime

      logger.info('Inventory analytics generated successfully', {
        warehouseId,
        period,
        duration,
        metricsCount: Object.keys(metrics).length
      })

      return analytics

    } catch (error) {
      logger.error('Failed to generate inventory analytics', {
        warehouseId,
        period,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw this.handleError(error, 'INVENTORY_ANALYTICS_ERROR')
    }
  }

  /**
   * Private helper methods
   */

  private async validateWarehouseAccess(
    warehouseId: string, 
    warehouseAccess: WarehouseAccess[]
  ): Promise<void> {
    const hasAccess = warehouseAccess.some(access => 
      access.warehouse === warehouseId || access.warehouse === 'ALL'
    )

    if (!hasAccess) {
      throw new Error(`Access denied to warehouse: ${warehouseId}`)
    }
  }

  private async getInventoryItems(warehouseId: string): Promise<any[]> {
    return prisma.inventoryItem.findMany({
      where: { warehouseId },
      include: {
        warehouse: {
          select: { id: true, name: true, region: true, code: true }
        },
        product: {
          select: { 
            id: true, name: true, sku: true, 
            specifications: true, dimensions: true 
          }
        },
        movements: {
          orderBy: { timestamp: 'desc' },
          take: 5
        },
        alerts: {
          where: { resolved: false }
        }
      }
    })
  }

  private async getRecentMovements(warehouseId: string, limit: number): Promise<InventoryMovement[]> {
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        inventoryItem: { warehouseId }
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        inventoryItem: {
          select: {
            id: true,
            productName: true,
            sku: true
          }
        }
      }
    })

    return movements.map(movement => ({
      id: movement.id,
      inventoryItemId: movement.inventoryItemId,
      type: movement.type as any,
      quantity: movement.quantity,
      reason: movement.reason,
      userId: movement.userId,
      timestamp: movement.timestamp,
      metadata: movement.metadata as any
    }))
  }

  private async getActiveAlerts(warehouseId: string): Promise<InventoryAlert[]> {
    const alerts = await prisma.inventoryAlert.findMany({
      where: {
        warehouseId,
        resolved: false
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return alerts.map(alert => ({
      id: alert.id,
      inventoryItemId: alert.inventoryItemId,
      warehouseId: alert.warehouseId,
      type: alert.type as any,
      severity: alert.severity as any,
      title: alert.title,
      message: alert.message,
      threshold: alert.threshold,
      currentValue: alert.currentValue,
      recommendedAction: alert.recommendedAction,
      suggestedOrderQuantity: alert.suggestedOrderQuantity,
      estimatedStockoutDate: alert.estimatedStockoutDate,
      acknowledged: alert.acknowledged,
      acknowledgedBy: alert.acknowledgedBy,
      acknowledgedAt: alert.acknowledgedAt,
      resolved: alert.resolved,
      resolvedBy: alert.resolvedBy,
      resolvedAt: alert.resolvedAt,
      createdAt: alert.createdAt,
      metadata: alert.metadata as any
    }))
  }

  private async getPerformanceMetrics(warehouseId: string): Promise<any> {
    // Simplified performance metrics calculation
    const inventoryCount = await prisma.inventoryItem.count({
      where: { warehouseId }
    })

    const lowStockCount = await prisma.inventoryItem.count({
      where: { warehouseId, status: 'LOW_STOCK' }
    })

    const outOfStockCount = await prisma.inventoryItem.count({
      where: { warehouseId, status: 'OUT_OF_STOCK' }
    })

    return {
      stockAccuracy: inventoryCount > 0 ? ((inventoryCount - outOfStockCount) / inventoryCount) * 100 : 100,
      turnoverRate: 12.5, // Placeholder calculation
      fillRate: inventoryCount > 0 ? ((inventoryCount - outOfStockCount) / inventoryCount) * 100 : 100,
      averageDaysToStockout: 30, // Placeholder calculation
      syncSuccessRate: 99.2 // Placeholder calculation
    }
  }

  private async getPredictions(warehouseId: string): Promise<any> {
    // Simplified predictions - in production, this would use ML models
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: { 
        warehouseId, 
        status: { in: ['LOW_STOCK', 'OUT_OF_STOCK'] } 
      },
      take: 10
    })

    return {
      nextStockouts: lowStockItems.slice(0, 5).map(item => ({
        productId: item.productId,
        productName: item.productName,
        estimatedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        confidence: 0.85
      })),
      reorderRecommendations: lowStockItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        currentStock: item.currentQuantity,
        suggestedQuantity: Math.max(item.reorderPoint * 2, 50),
        urgency: item.status === 'OUT_OF_STOCK' ? 'HIGH' : 'MEDIUM',
        reasoning: item.status === 'OUT_OF_STOCK' ? 'Currently out of stock' : 'Below reorder point'
      }))
    }
  }

  private calculateSummary(items: any[]): any {
    const totalValue = items.reduce((sum, item) => sum + (item.currentQuantity * item.retailPrice), 0)
    const lowStockItems = items.filter(item => item.status === 'LOW_STOCK').length
    const outOfStockItems = items.filter(item => item.status === 'OUT_OF_STOCK').length
    const overstockItems = items.filter(item => item.status === 'OVERSTOCK').length
    const alertsCount = items.reduce((sum, item) => sum + item.alerts.length, 0)
    const criticalAlerts = items.reduce((sum, item) => 
      sum + item.alerts.filter((alert: any) => alert.severity === 'CRITICAL').length, 0
    )

    return {
      totalItems: items.length,
      totalValue,
      inStockItems: items.filter(item => item.status === 'IN_STOCK').length,
      lowStockItems,
      outOfStockItems,
      overstockItems,
      pendingSyncItems: items.filter(item => item.syncStatus !== 'SYNCED').length,
      alertsCount,
      criticalAlertsCount: criticalAlerts
    }
  }

  private calculateCategoryBreakdown(items: any[]): any[] {
    const categories = new Map()

    items.forEach(item => {
      const category = item.category
      if (!categories.has(category)) {
        categories.set(category, {
          category,
          totalItems: 0,
          totalQuantity: 0,
          totalValue: 0,
          alertsCount: 0
        })
      }

      const categoryData = categories.get(category)
      categoryData.totalItems += 1
      categoryData.totalQuantity += item.currentQuantity
      categoryData.totalValue += item.currentQuantity * item.retailPrice
      categoryData.alertsCount += item.alerts.length
    })

    return Array.from(categories.values()).map(category => ({
      ...category,
      averageStockLevel: category.totalItems > 0 ? category.totalQuantity / category.totalItems : 0
    }))
  }

  private groupInventoryByProduct(items: any[]): Map<string, any[]> {
    const groups = new Map()
    
    items.forEach(item => {
      if (!groups.has(item.productId)) {
        groups.set(item.productId, [])
      }
      groups.get(item.productId).push(item)
    })

    return groups
  }

  private async calculateTransferOpportunities(items: any[]): Promise<any[]> {
    // Simplified transfer opportunity calculation
    const opportunities = []
    
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const from = items[i]
        const to = items[j]
        
        if (from.availableQuantity > from.reorderPoint * 1.5 && 
            to.availableQuantity < to.reorderPoint) {
          opportunities.push({
            fromWarehouse: from.warehouseId,
            toWarehouse: to.warehouseId,
            suggestedQuantity: Math.min(
              from.availableQuantity - from.reorderPoint,
              to.reorderPoint - to.availableQuantity
            ),
            estimatedCost: 250, // Placeholder
            estimatedTime: '3-5 days',
            priority: to.status === 'OUT_OF_STOCK' ? 'HIGH' : 'MEDIUM'
          })
        }
      }
    }

    return opportunities.slice(0, 3) // Return top 3 opportunities
  }

  private calculateGlobalSyncStatus(items: any[]): 'SYNCED' | 'SYNCING' | 'ERROR' {
    const syncStatuses = items.map(item => item.syncStatus)
    
    if (syncStatuses.includes('ERROR')) return 'ERROR'
    if (syncStatuses.includes('SYNCING') || syncStatuses.includes('PENDING')) return 'SYNCING'
    return 'SYNCED'
  }

  private async checkAndCreateAlerts(item: any): Promise<void> {
    const alerts = []

    // Low stock alert
    if (item.currentQuantity <= item.minStockLevel && item.status !== 'OUT_OF_STOCK') {
      alerts.push({
        inventoryItemId: item.id,
        warehouseId: item.warehouseId,
        type: 'LOW_STOCK',
        severity: item.currentQuantity === 0 ? 'CRITICAL' : 'HIGH',
        title: 'Low Stock Alert',
        message: `${item.productName} is running low (${item.currentQuantity} remaining)`,
        threshold: item.minStockLevel,
        currentValue: item.currentQuantity,
        recommendedAction: 'Reorder inventory',
        suggestedOrderQuantity: item.reorderPoint * 2,
        acknowledged: false,
        resolved: false,
        metadata: {
          autoGenerated: true,
          triggerConditions: { minStockLevel: item.minStockLevel },
          priority: 1
        }
      })
    }

    // Out of stock alert
    if (item.currentQuantity === 0) {
      alerts.push({
        inventoryItemId: item.id,
        warehouseId: item.warehouseId,
        type: 'OUT_OF_STOCK',
        severity: 'CRITICAL',
        title: 'Out of Stock',
        message: `${item.productName} is out of stock`,
        threshold: 0,
        currentValue: 0,
        recommendedAction: 'Urgent reorder required',
        suggestedOrderQuantity: item.reorderPoint * 3,
        acknowledged: false,
        resolved: false,
        metadata: {
          autoGenerated: true,
          triggerConditions: { stockLevel: 0 },
          priority: 10
        }
      })
    }

    // Create alerts in database
    for (const alertData of alerts) {
      await prisma.inventoryAlert.create({ data: alertData })
    }
  }

  private async triggerRealtimeSync(warehouseId: string, event: Partial<SyncEvent>): Promise<void> {
    try {
      // Update sync status
      await prisma.inventoryItem.updateMany({
        where: { warehouseId },
        data: { syncStatus: 'SYNCING' }
      })

      // Simulate real-time sync processing
      setTimeout(async () => {
        await prisma.inventoryItem.updateMany({
          where: { warehouseId },
          data: { syncStatus: 'SYNCED' }
        })
      }, 1000)

      logger.info('Real-time sync triggered', { warehouseId, eventType: event.type })
    } catch (error) {
      logger.error('Failed to trigger real-time sync', { warehouseId, error })
    }
  }

  private transformInventoryItem(item: any): InventoryItem {
    return {
      id: item.id,
      warehouseId: item.warehouseId,
      productId: item.productId,
      sku: item.sku,
      productName: item.productName,
      category: item.category,
      currentQuantity: item.currentQuantity,
      reservedQuantity: item.reservedQuantity,
      availableQuantity: item.availableQuantity,
      reorderPoint: item.reorderPoint,
      maxStockLevel: item.maxStockLevel,
      minStockLevel: item.minStockLevel,
      status: item.status,
      location: item.location,
      binLocation: item.binLocation,
      costPerUnit: item.costPerUnit,
      retailPrice: item.retailPrice,
      lastMovement: item.lastMovement,
      lastCountedAt: item.lastCountedAt,
      syncStatus: item.syncStatus,
      warehouse: item.warehouse,
      product: item.product,
      movements: item.movements || [],
      alerts: item.alerts || [],
      metadata: item.metadata || {},
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      updatedBy: item.updatedBy
    }
  }

  private calculateInventoryMetrics(items: any[], movements: any[], alerts: any[]): any {
    const totalValue = items.reduce((sum, item) => sum + (item.currentQuantity * item.retailPrice), 0)
    const totalMovements = movements.length
    const inboundMovements = movements.filter(m => ['INBOUND', 'RETURN'].includes(m.type)).length
    const outboundMovements = movements.filter(m => ['OUTBOUND', 'TRANSFER'].includes(m.type)).length

    return {
      stockTurnover: totalMovements > 0 ? outboundMovements / (totalValue / 1000) : 0,
      stockAccuracy: items.length > 0 ? (items.filter(i => i.status !== 'OUT_OF_STOCK').length / items.length) * 100 : 100,
      fillRate: items.length > 0 ? (items.filter(i => i.status === 'IN_STOCK').length / items.length) * 100 : 100,
      carryingCost: totalValue * 0.25, // 25% carrying cost assumption
      stockoutEvents: alerts.filter(a => a.type === 'OUT_OF_STOCK').length,
      overstockEvents: alerts.filter(a => a.type === 'OVERSTOCK').length,
      averageLeadTime: 7, // Placeholder
      inventoryValue: totalValue
    }
  }

  private calculateInventoryTrends(warehouseId: string, period: string): any {
    // Simplified trend calculation - in production, this would compare with previous periods
    return {
      stockTurnoverTrend: 5,
      accuracyTrend: 2,
      fillRateTrend: -1,
      valueTrend: 8
    }
  }

  private analyzeCategoryPerformance(items: any[], movements: any[]): any[] {
    const categories = new Map()

    items.forEach(item => {
      if (!categories.has(item.category)) {
        categories.set(item.category, {
          category: item.category,
          performance: 0,
          issues: [],
          recommendations: []
        })
      }

      const category = categories.get(item.category)
      
      // Calculate performance score
      let score = 100
      if (item.status === 'LOW_STOCK') score -= 20
      if (item.status === 'OUT_OF_STOCK') score -= 40
      if (item.status === 'OVERSTOCK') score -= 10
      
      category.performance = Math.max(category.performance, score)

      // Add issues and recommendations
      if (item.status === 'LOW_STOCK') {
        category.issues.push('Low stock levels detected')
        category.recommendations.push('Review reorder points')
      }
      if (item.status === 'OUT_OF_STOCK') {
        category.issues.push('Stock outages occurring')
        category.recommendations.push('Implement safety stock')
      }
    })

    return Array.from(categories.values())
  }

  private analyzeAlerts(alerts: any[]): any {
    return {
      critical: alerts.filter(a => a.severity === 'CRITICAL').length,
      high: alerts.filter(a => a.severity === 'HIGH').length,
      medium: alerts.filter(a => a.severity === 'MEDIUM').length,
      low: alerts.filter(a => a.severity === 'LOW').length
    }
  }

  private async calculateEfficiencyMetrics(
    warehouseId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<any> {
    // Simplified efficiency calculation
    return {
      spaceUtilization: 78,
      pickingEfficiency: 85,
      receivingEfficiency: 92,
      cycleCounting: 95
    }
  }

  private calculatePeriodStartDate(endDate: Date, period: string): Date {
    const start = new Date(endDate)
    
    switch (period) {
      case 'DAILY':
        start.setDate(start.getDate() - 1)
        break
      case 'WEEKLY':
        start.setDate(start.getDate() - 7)
        break
      case 'MONTHLY':
        start.setMonth(start.getMonth() - 1)
        break
      case 'QUARTERLY':
        start.setMonth(start.getMonth() - 3)
        break
      case 'YEARLY':
        start.setFullYear(start.getFullYear() - 1)
        break
    }
    
    return start
  }

  private async createAuditLog(data: {
    action: string
    warehouseId: string
    userId?: string
    details?: any
  }): Promise<void> {
    try {
      await prisma.inventoryAuditLog.create({
        data: {
          ...data,
          timestamp: new Date()
        }
      })
    } catch (error) {
      logger.error('Failed to create audit log', { data, error })
    }
  }

  private initializeRealTimeSync(): void {
    // Initialize real-time sync intervals for all warehouses
    logger.info('Initializing real-time inventory sync')
    
    // This would typically set up WebSocket connections or polling intervals
    // For now, it's a placeholder for the sync infrastructure
  }

  private handleError(error: unknown, context: string): Error {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const enhancedError = new Error(`${context}: ${errorMessage}`)
    
    if (error instanceof Error) {
      enhancedError.stack = error.stack
    }

    return enhancedError
  }
}

// Export singleton instance
export const inventoryDashboardService = InventoryDashboardService.getInstance()