/**
 * RHY_049 - Advanced Inventory Features: Batch Service
 * Enterprise-grade batch processing for inventory operations
 * Integrates with Batch 1 authentication, warehouse, and audit systems
 */

import { z } from 'zod'
import { rhyPrisma } from '@/lib/rhy-database'
import { authService } from '@/services/auth/AuthService'
import { WarehouseService } from '@/services/warehouse/WarehouseService'
import { logger } from '@/lib/logger'

// Types
export interface BatchOperation {
  id: string
  type: 'STOCK_UPDATE' | 'BULK_TRANSFER' | 'PRICE_ADJUSTMENT' | 'STATUS_CHANGE' | 'REORDER_POINT_UPDATE'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  itemsCount: number
  processedCount: number
  successCount: number
  errorCount: number
  createdAt: Date
  completedAt?: Date
  errors: string[]
  warehouseId: string
  userId: string
  metadata: any
}

export interface BatchStockUpdate {
  sku: string
  warehouseId: string
  quantity: number
  operation: 'SET' | 'ADD' | 'SUBTRACT'
  reason: string
}

export interface BatchTransfer {
  sourceWarehouseId: string
  targetWarehouseId: string
  items: Array<{
    sku: string
    quantity: number
  }>
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  reason: string
}

export interface BatchPriceAdjustment {
  warehouseId: string
  adjustments: Array<{
    sku: string
    newPrice: number
    adjustmentType: 'FIXED' | 'PERCENTAGE'
    adjustmentValue: number
    reason: string
  }>
}

// Validation Schemas
const batchStockUpdateSchema = z.object({
  operations: z.array(z.object({
    sku: z.string().min(1),
    warehouseId: z.string().min(1),
    quantity: z.number().min(0),
    operation: z.enum(['SET', 'ADD', 'SUBTRACT']),
    reason: z.string().min(1)
  })).min(1)
})

const batchTransferSchema = z.object({
  sourceWarehouseId: z.string().min(1),
  targetWarehouseId: z.string().min(1),
  items: z.array(z.object({
    sku: z.string().min(1),
    quantity: z.number().min(1)
  })).min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  reason: z.string().min(1)
})

const batchPriceAdjustmentSchema = z.object({
  warehouseId: z.string().min(1),
  adjustments: z.array(z.object({
    sku: z.string().min(1),
    newPrice: z.number().min(0),
    adjustmentType: z.enum(['FIXED', 'PERCENTAGE']),
    adjustmentValue: z.number(),
    reason: z.string().min(1)
  })).min(1)
})

/**
 * BatchService - Handles bulk inventory operations
 */
export class BatchService {
  private static instance: BatchService
  private warehouseService: WarehouseService

  private constructor() {
    this.warehouseService = WarehouseService.getInstance()
  }

  public static getInstance(): BatchService {
    if (!BatchService.instance) {
      BatchService.instance = new BatchService()
    }
    return BatchService.instance
  }

  /**
   * Create batch stock update operation
   */
  async createStockUpdateOperation(
    userId: string,
    operations: BatchStockUpdate[]
  ): Promise<{ success: boolean; operationId?: string; error?: string }> {
    try {
      // Validate input
      const validatedData = batchStockUpdateSchema.parse({ operations })
      
      logger.info('Creating batch stock update operation', {
        userId,
        operationsCount: operations.length
      })

      // Validate user permissions for all warehouses
      const warehouseIds = [...new Set(operations.map(op => op.warehouseId))]
      for (const warehouseId of warehouseIds) {
        const hasAccess = await this.validateWarehouseAccess(userId, warehouseId)
        if (!hasAccess) {
          return {
            success: false,
            error: `Access denied to warehouse: ${warehouseId}`
          }
        }
      }

      // Create operation record
      const operation = await rhyPrisma.batchOperation.create({
        data: {
          type: 'STOCK_UPDATE',
          status: 'PENDING',
          itemsCount: operations.length,
          processedCount: 0,
          successCount: 0,
          errorCount: 0,
          warehouseId: warehouseIds[0], // Primary warehouse
          userId,
          metadata: {
            operations: validatedData.operations,
            warehouseIds
          },
          errors: []
        }
      })

      // Process operations asynchronously
      this.processStockUpdateOperation(operation.id).catch(error => {
        logger.error('Batch stock update failed', { operationId: operation.id, error })
      })

      return {
        success: true,
        operationId: operation.id
      }

    } catch (error) {
      logger.error('Failed to create stock update operation', { error, userId })
      
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
        }
      }

      return {
        success: false,
        error: 'Failed to create batch operation'
      }
    }
  }

  /**
   * Create batch transfer operation
   */
  async createTransferOperation(
    userId: string,
    transfer: BatchTransfer
  ): Promise<{ success: boolean; operationId?: string; error?: string }> {
    try {
      // Validate input
      const validatedData = batchTransferSchema.parse(transfer)
      
      logger.info('Creating batch transfer operation', {
        userId,
        sourceWarehouse: transfer.sourceWarehouseId,
        targetWarehouse: transfer.targetWarehouseId,
        itemsCount: transfer.items.length
      })

      // Validate warehouse access
      const hasSourceAccess = await this.validateWarehouseAccess(userId, transfer.sourceWarehouseId)
      const hasTargetAccess = await this.validateWarehouseAccess(userId, transfer.targetWarehouseId)
      
      if (!hasSourceAccess || !hasTargetAccess) {
        return {
          success: false,
          error: 'Access denied to one or more warehouses'
        }
      }

      // Validate that warehouses are different
      if (transfer.sourceWarehouseId === transfer.targetWarehouseId) {
        return {
          success: false,
          error: 'Source and target warehouses must be different'
        }
      }

      // Create operation record
      const operation = await rhyPrisma.batchOperation.create({
        data: {
          type: 'BULK_TRANSFER',
          status: 'PENDING',
          itemsCount: transfer.items.length,
          processedCount: 0,
          successCount: 0,
          errorCount: 0,
          warehouseId: transfer.sourceWarehouseId,
          userId,
          metadata: validatedData,
          errors: []
        }
      })

      // Process transfer asynchronously
      this.processTransferOperation(operation.id).catch(error => {
        logger.error('Batch transfer failed', { operationId: operation.id, error })
      })

      return {
        success: true,
        operationId: operation.id
      }

    } catch (error) {
      logger.error('Failed to create transfer operation', { error, userId })
      
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
        }
      }

      return {
        success: false,
        error: 'Failed to create batch operation'
      }
    }
  }

  /**
   * Create batch price adjustment operation
   */
  async createPriceAdjustmentOperation(
    userId: string,
    adjustment: BatchPriceAdjustment
  ): Promise<{ success: boolean; operationId?: string; error?: string }> {
    try {
      // Validate input
      const validatedData = batchPriceAdjustmentSchema.parse(adjustment)
      
      logger.info('Creating batch price adjustment operation', {
        userId,
        warehouseId: adjustment.warehouseId,
        adjustmentsCount: adjustment.adjustments.length
      })

      // Validate warehouse access
      const hasAccess = await this.validateWarehouseAccess(userId, adjustment.warehouseId)
      if (!hasAccess) {
        return {
          success: false,
          error: `Access denied to warehouse: ${adjustment.warehouseId}`
        }
      }

      // Create operation record
      const operation = await rhyPrisma.batchOperation.create({
        data: {
          type: 'PRICE_ADJUSTMENT',
          status: 'PENDING',
          itemsCount: adjustment.adjustments.length,
          processedCount: 0,
          successCount: 0,
          errorCount: 0,
          warehouseId: adjustment.warehouseId,
          userId,
          metadata: validatedData,
          errors: []
        }
      })

      // Process adjustments asynchronously
      this.processPriceAdjustmentOperation(operation.id).catch(error => {
        logger.error('Batch price adjustment failed', { operationId: operation.id, error })
      })

      return {
        success: true,
        operationId: operation.id
      }

    } catch (error) {
      logger.error('Failed to create price adjustment operation', { error, userId })
      
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
        }
      }

      return {
        success: false,
        error: 'Failed to create batch operation'
      }
    }
  }

  /**
   * Get operation status
   */
  async getOperation(operationId: string): Promise<BatchOperation | null> {
    try {
      const operation = await rhyPrisma.batchOperation.findUnique({
        where: { id: operationId }
      })

      if (!operation) return null

      return {
        id: operation.id,
        type: operation.type as BatchOperation['type'],
        status: operation.status as BatchOperation['status'],
        itemsCount: operation.itemsCount,
        processedCount: operation.processedCount,
        successCount: operation.successCount,
        errorCount: operation.errorCount,
        createdAt: operation.createdAt,
        completedAt: operation.completedAt || undefined,
        errors: operation.errors as string[],
        warehouseId: operation.warehouseId,
        userId: operation.userId,
        metadata: operation.metadata
      }

    } catch (error) {
      logger.error('Failed to get operation', { operationId, error })
      return null
    }
  }

  /**
   * Get recent operations for user
   */
  async getRecentOperations(
    userId: string,
    limit: number = 10
  ): Promise<BatchOperation[]> {
    try {
      const operations = await rhyPrisma.batchOperation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return operations.map(op => ({
        id: op.id,
        type: op.type as BatchOperation['type'],
        status: op.status as BatchOperation['status'],
        itemsCount: op.itemsCount,
        processedCount: op.processedCount,
        successCount: op.successCount,
        errorCount: op.errorCount,
        createdAt: op.createdAt,
        completedAt: op.completedAt || undefined,
        errors: op.errors as string[],
        warehouseId: op.warehouseId,
        userId: op.userId,
        metadata: op.metadata
      }))

    } catch (error) {
      logger.error('Failed to get recent operations', { userId, error })
      return []
    }
  }

  /**
   * Cancel operation
   */
  async cancelOperation(operationId: string, userId: string): Promise<boolean> {
    try {
      const operation = await rhyPrisma.batchOperation.findUnique({
        where: { id: operationId }
      })

      if (!operation || operation.userId !== userId) {
        return false
      }

      if (operation.status === 'COMPLETED' || operation.status === 'FAILED') {
        return false // Cannot cancel completed operations
      }

      await rhyPrisma.batchOperation.update({
        where: { id: operationId },
        data: {
          status: 'CANCELLED',
          completedAt: new Date()
        }
      })

      logger.info('Operation cancelled', { operationId, userId })
      return true

    } catch (error) {
      logger.error('Failed to cancel operation', { operationId, userId, error })
      return false
    }
  }

  // Private helper methods

  private async validateWarehouseAccess(userId: string, warehouseId: string): Promise<boolean> {
    try {
      // Check if user has access to warehouse through Batch 1 auth system
      const user = await rhyPrisma.rHYSupplier.findUnique({
        where: { id: userId },
        include: {
          warehouseAccess: {
            where: { warehouse: warehouseId }
          }
        }
      })

      return user?.warehouseAccess.length > 0
    } catch (error) {
      logger.error('Failed to validate warehouse access', { userId, warehouseId, error })
      return false
    }
  }

  private async processStockUpdateOperation(operationId: string): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Update status to processing
      await rhyPrisma.batchOperation.update({
        where: { id: operationId },
        data: { status: 'PROCESSING' }
      })

      const operation = await rhyPrisma.batchOperation.findUnique({
        where: { id: operationId }
      })

      if (!operation || operation.status === 'CANCELLED') {
        return
      }

      const operations = operation.metadata.operations as BatchStockUpdate[]
      const errors: string[] = []
      let successCount = 0
      let processedCount = 0

      for (const stockUpdate of operations) {
        try {
          processedCount++

          // Update inventory
          await this.updateInventoryStock(stockUpdate)
          
          // Create audit log
          await this.createStockMovementAudit(stockUpdate, operation.userId)
          
          successCount++

          // Update progress
          await rhyPrisma.batchOperation.update({
            where: { id: operationId },
            data: {
              processedCount,
              successCount
            }
          })

        } catch (error) {
          const errorMessage = `SKU ${stockUpdate.sku}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMessage)
          
          logger.error('Stock update failed', {
            operationId,
            sku: stockUpdate.sku,
            error
          })
        }
      }

      // Mark as completed
      await rhyPrisma.batchOperation.update({
        where: { id: operationId },
        data: {
          status: errors.length === operations.length ? 'FAILED' : 'COMPLETED',
          processedCount,
          successCount,
          errorCount: errors.length,
          errors,
          completedAt: new Date()
        }
      })

      logger.info('Batch stock update completed', {
        operationId,
        duration: Date.now() - startTime,
        successCount,
        errorCount: errors.length
      })

    } catch (error) {
      logger.error('Batch stock update operation failed', { operationId, error })
      
      await rhyPrisma.batchOperation.update({
        where: { id: operationId },
        data: {
          status: 'FAILED',
          errors: ['Operation failed due to system error'],
          completedAt: new Date()
        }
      })
    }
  }

  private async processTransferOperation(operationId: string): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Update status to processing
      await rhyPrisma.batchOperation.update({
        where: { id: operationId },
        data: { status: 'PROCESSING' }
      })

      const operation = await rhyPrisma.batchOperation.findUnique({
        where: { id: operationId }
      })

      if (!operation || operation.status === 'CANCELLED') {
        return
      }

      const transfer = operation.metadata as BatchTransfer
      const errors: string[] = []
      let successCount = 0
      let processedCount = 0

      for (const item of transfer.items) {
        try {
          processedCount++

          // Validate source inventory
          const sourceInventory = await rhyPrisma.inventory.findFirst({
            where: {
              sku: item.sku,
              warehouseId: transfer.sourceWarehouseId
            }
          })

          if (!sourceInventory || sourceInventory.quantity < item.quantity) {
            throw new Error(`Insufficient stock: ${sourceInventory?.quantity || 0} available, ${item.quantity} requested`)
          }

          // Execute transfer in transaction
          await rhyPrisma.$transaction(async (tx) => {
            // Decrease source inventory
            await tx.inventory.update({
              where: { id: sourceInventory.id },
              data: { quantity: sourceInventory.quantity - item.quantity }
            })

            // Increase target inventory (or create if doesn't exist)
            await tx.inventory.upsert({
              where: {
                sku_warehouseId: {
                  sku: item.sku,
                  warehouseId: transfer.targetWarehouseId
                }
              },
              update: {
                quantity: { increment: item.quantity }
              },
              create: {
                sku: item.sku,
                warehouseId: transfer.targetWarehouseId,
                quantity: item.quantity,
                name: sourceInventory.name,
                category: sourceInventory.category,
                unitPrice: sourceInventory.unitPrice
              }
            })

            // Create transfer record
            await tx.inventoryTransfer.create({
              data: {
                sourceWarehouseId: transfer.sourceWarehouseId,
                targetWarehouseId: transfer.targetWarehouseId,
                sku: item.sku,
                quantity: item.quantity,
                status: 'COMPLETED',
                priority: transfer.priority,
                reason: transfer.reason,
                userId: operation.userId,
                batchOperationId: operationId
              }
            })
          })

          successCount++

          // Update progress
          await rhyPrisma.batchOperation.update({
            where: { id: operationId },
            data: {
              processedCount,
              successCount
            }
          })

        } catch (error) {
          const errorMessage = `SKU ${item.sku}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMessage)
          
          logger.error('Transfer failed', {
            operationId,
            sku: item.sku,
            error
          })
        }
      }

      // Mark as completed
      await rhyPrisma.batchOperation.update({
        where: { id: operationId },
        data: {
          status: errors.length === transfer.items.length ? 'FAILED' : 'COMPLETED',
          processedCount,
          successCount,
          errorCount: errors.length,
          errors,
          completedAt: new Date()
        }
      })

      logger.info('Batch transfer completed', {
        operationId,
        duration: Date.now() - startTime,
        successCount,
        errorCount: errors.length
      })

    } catch (error) {
      logger.error('Batch transfer operation failed', { operationId, error })
      
      await rhyPrisma.batchOperation.update({
        where: { id: operationId },
        data: {
          status: 'FAILED',
          errors: ['Operation failed due to system error'],
          completedAt: new Date()
        }
      })
    }
  }

  private async processPriceAdjustmentOperation(operationId: string): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Update status to processing
      await rhyPrisma.batchOperation.update({
        where: { id: operationId },
        data: { status: 'PROCESSING' }
      })

      const operation = await rhyPrisma.batchOperation.findUnique({
        where: { id: operationId }
      })

      if (!operation || operation.status === 'CANCELLED') {
        return
      }

      const adjustment = operation.metadata as BatchPriceAdjustment
      const errors: string[] = []
      let successCount = 0
      let processedCount = 0

      for (const priceAdj of adjustment.adjustments) {
        try {
          processedCount++

          // Find inventory item
          const inventory = await rhyPrisma.inventory.findFirst({
            where: {
              sku: priceAdj.sku,
              warehouseId: adjustment.warehouseId
            }
          })

          if (!inventory) {
            throw new Error('Inventory item not found')
          }

          const oldPrice = inventory.unitPrice
          const newPrice = priceAdj.adjustmentType === 'FIXED' 
            ? priceAdj.newPrice
            : oldPrice * (1 + priceAdj.adjustmentValue / 100)

          if (newPrice < 0) {
            throw new Error('Price cannot be negative')
          }

          // Update price
          await rhyPrisma.inventory.update({
            where: { id: inventory.id },
            data: { unitPrice: newPrice }
          })

          // Create price history record
          await rhyPrisma.priceHistory.create({
            data: {
              inventoryId: inventory.id,
              oldPrice,
              newPrice,
              reason: priceAdj.reason,
              adjustmentType: priceAdj.adjustmentType,
              adjustmentValue: priceAdj.adjustmentValue,
              userId: operation.userId,
              batchOperationId: operationId
            }
          })

          successCount++

          // Update progress
          await rhyPrisma.batchOperation.update({
            where: { id: operationId },
            data: {
              processedCount,
              successCount
            }
          })

        } catch (error) {
          const errorMessage = `SKU ${priceAdj.sku}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMessage)
          
          logger.error('Price adjustment failed', {
            operationId,
            sku: priceAdj.sku,
            error
          })
        }
      }

      // Mark as completed
      await rhyPrisma.batchOperation.update({
        where: { id: operationId },
        data: {
          status: errors.length === adjustment.adjustments.length ? 'FAILED' : 'COMPLETED',
          processedCount,
          successCount,
          errorCount: errors.length,
          errors,
          completedAt: new Date()
        }
      })

      logger.info('Batch price adjustment completed', {
        operationId,
        duration: Date.now() - startTime,
        successCount,
        errorCount: errors.length
      })

    } catch (error) {
      logger.error('Batch price adjustment operation failed', { operationId, error })
      
      await rhyPrisma.batchOperation.update({
        where: { id: operationId },
        data: {
          status: 'FAILED',
          errors: ['Operation failed due to system error'],
          completedAt: new Date()
        }
      })
    }
  }

  private async updateInventoryStock(stockUpdate: BatchStockUpdate): Promise<void> {
    const inventory = await rhyPrisma.inventory.findFirst({
      where: {
        sku: stockUpdate.sku,
        warehouseId: stockUpdate.warehouseId
      }
    })

    if (!inventory) {
      throw new Error('Inventory item not found')
    }

    let newQuantity: number

    switch (stockUpdate.operation) {
      case 'SET':
        newQuantity = stockUpdate.quantity
        break
      case 'ADD':
        newQuantity = inventory.quantity + stockUpdate.quantity
        break
      case 'SUBTRACT':
        newQuantity = Math.max(0, inventory.quantity - stockUpdate.quantity)
        break
    }

    await rhyPrisma.inventory.update({
      where: { id: inventory.id },
      data: { quantity: newQuantity }
    })
  }

  private async createStockMovementAudit(
    stockUpdate: BatchStockUpdate,
    userId: string
  ): Promise<void> {
    await rhyPrisma.stockMovement.create({
      data: {
        sku: stockUpdate.sku,
        warehouseId: stockUpdate.warehouseId,
        type: stockUpdate.operation === 'SET' ? 'ADJUSTMENT' : 
              stockUpdate.operation === 'ADD' ? 'IN' : 'OUT',
        quantity: stockUpdate.quantity,
        reason: stockUpdate.reason,
        userId,
        timestamp: new Date()
      }
    })
  }
}

// Export singleton instance
export const batchService = BatchService.getInstance()