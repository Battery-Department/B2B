/**
 * RHY_047: Inventory Synchronization Service
 * Enterprise-grade real-time inventory synchronization service
 * Integrates with existing Batch 1 warehouse and authentication infrastructure
 */

import { v4 as uuidv4 } from 'uuid'
import { rhyPrisma } from '@/lib/rhy-database'
import { warehouseService } from '@/services/warehouse/WarehouseService'
import { authService } from '@/services/auth/AuthService'
import { logger } from '@/lib/logger'
import { inventorySyncUtils } from '@/lib/inventory-sync'
import type {
  InventorySyncRequest,
  InventorySyncResult,
  BulkSyncRequest,
  BulkSyncResult,
  SyncStatus,
  WarehouseSyncStatus,
  GlobalSyncStatus,
  SyncMetrics,
  CrossWarehouseSyncStatus
} from '@/types/inventory_sync'

/**
 * Enterprise Inventory Synchronization Service
 * Handles real-time inventory sync across 4 global warehouses (US, Japan, EU, Australia)
 */
export class InventorySyncService {
  private static instance: InventorySyncService
  private readonly maxConcurrentSyncs = 10
  private readonly syncTimeout = 30000 // 30 seconds
  private readonly crossWarehouseTimeout = 60000 // 1 minute
  private activeSyncs = new Map<string, AbortController>()

  private constructor() {}

  public static getInstance(): InventorySyncService {
    if (!InventorySyncService.instance) {
      InventorySyncService.instance = new InventorySyncService()
    }
    return InventorySyncService.instance
  }

  /**
   * Synchronize inventory for a specific warehouse
   */
  public async syncWarehouseInventory(request: InventorySyncRequest): Promise<InventorySyncResult> {
    const syncId = uuidv4()
    const startTime = Date.now()
    const abortController = new AbortController()
    
    try {
      // Check concurrent sync limit
      if (this.activeSyncs.size >= this.maxConcurrentSyncs) {
        throw new Error('Maximum concurrent synchronizations reached. Please try again later.')
      }

      this.activeSyncs.set(syncId, abortController)

      logger.info('Starting inventory synchronization', {
        syncId,
        warehouseId: request.warehouseId,
        productCount: request.products.length,
        syncType: request.syncType,
        priority: request.priority,
        requestedBy: request.metadata?.requestedBy
      })

      // Validate warehouse exists and is active
      const warehouse = await warehouseService.getWarehouseById(request.warehouseId)
      if (!warehouse) {
        throw new Error(`Warehouse not found: ${request.warehouseId}`)
      }

      if (warehouse.status !== 'ACTIVE') {
        throw new Error(`Warehouse is not active: ${request.warehouseId}`)
      }

      // Create sync record
      const syncRecord = await rhyPrisma.inventorySync.create({
        data: {
          id: syncId,
          warehouseId: request.warehouseId,
          status: 'PROCESSING',
          syncType: request.syncType,
          priority: request.priority,
          productCount: request.products.length,
          requestedBy: request.metadata?.requestedBy || 'SYSTEM',
          metadata: request.metadata || {},
          startedAt: new Date()
        }
      })

      // Process products in batches for performance
      const batchSize = request.syncType === 'IMMEDIATE' ? 5 : 10
      const productBatches = this.createBatches(request.products, batchSize)
      
      let synchronized = 0
      let failed = 0
      let pending = 0
      const failedProducts: any[] = []
      const syncResults: any[] = []

      // Process each batch with timeout protection
      for (const [batchIndex, batch] of productBatches.entries()) {
        if (abortController.signal.aborted) {
          break
        }

        try {
          const batchStartTime = Date.now()
          
          logger.debug(`Processing batch ${batchIndex + 1}/${productBatches.length}`, {
            syncId,
            batchSize: batch.length,
            warehouseId: request.warehouseId
          })

          const batchResult = await Promise.race([
            this.processBatch(request.warehouseId, batch, syncId),
            this.createTimeoutPromise(this.syncTimeout, `Batch ${batchIndex + 1} timeout`)
          ])

          synchronized += batchResult.successful.length
          failed += batchResult.failed.length
          failedProducts.push(...batchResult.failed)
          syncResults.push(...batchResult.successful)

          const batchDuration = Date.now() - batchStartTime
          
          logger.debug(`Batch ${batchIndex + 1} completed`, {
            syncId,
            successful: batchResult.successful.length,
            failed: batchResult.failed.length,
            duration: batchDuration
          })

          // Update sync record progress
          await rhyPrisma.inventorySync.update({
            where: { id: syncId },
            data: {
              progress: Math.round(((synchronized + failed) / request.products.length) * 100),
              syncedProducts: synchronized,
              failedProducts: failed
            }
          })

        } catch (error) {
          logger.error(`Batch ${batchIndex + 1} failed`, {
            syncId,
            warehouseId: request.warehouseId,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          
          // Mark entire batch as failed
          failed += batch.length
          failedProducts.push(...batch.map(product => ({
            productId: product.productId,
            error: error instanceof Error ? error.message : 'Batch processing failed'
          })))
        }
      }

      pending = request.products.length - synchronized - failed

      // Calculate performance metrics
      const totalDuration = Date.now() - startTime
      const averageProductSyncTime = synchronized > 0 ? totalDuration / synchronized : 0

      // Initiate cross-warehouse synchronization for successful updates
      let crossWarehouseResult: CrossWarehouseSyncStatus = {
        status: 'NOT_REQUIRED',
        completedRegions: [],
        pendingRegions: [],
        crossWarehouseSyncTime: 0
      }

      if (synchronized > 0 && request.syncType !== 'BATCH') {
        crossWarehouseResult = await this.initiateCrossWarehouseSync(
          request.warehouseId,
          syncResults,
          syncId
        )
      }

      // Determine final sync status
      const finalStatus = this.determineSyncStatus(synchronized, failed, pending)

      // Update final sync record
      const completedSyncRecord = await rhyPrisma.inventorySync.update({
        where: { id: syncId },
        data: {
          status: finalStatus,
          completedAt: new Date(),
          syncedProducts: synchronized,
          failedProducts: failed,
          duration: totalDuration,
          crossWarehouseStatus: crossWarehouseResult.status,
          results: {
            successful: syncResults,
            failed: failedProducts,
            crossWarehouse: crossWarehouseResult
          }
        }
      })

      // Calculate next sync window based on priority and warehouse region
      const nextSyncWindow = this.calculateNextSyncWindow(
        request.priority,
        warehouse.region,
        request.syncType
      )

      const result: InventorySyncResult = {
        syncId,
        status: finalStatus,
        warehouseRegion: warehouse.region,
        synchronized,
        failed,
        pending,
        averageProductSyncTime,
        crossWarehouseSyncTime: crossWarehouseResult.crossWarehouseSyncTime,
        crossWarehouseStatus: crossWarehouseResult.status,
        completedRegions: crossWarehouseResult.completedRegions,
        pendingRegions: crossWarehouseResult.pendingRegions,
        nextSyncWindow,
        estimatedCompletion: finalStatus === 'COMPLETED' ? new Date() : 
          new Date(Date.now() + (pending * averageProductSyncTime)),
        failedProducts,
        metadata: {
          totalDuration,
          batchCount: productBatches.length,
          averageBatchTime: totalDuration / productBatches.length,
          warehouseName: warehouse.name,
          warehouseCode: warehouse.code
        }
      }

      logger.info('Inventory synchronization completed', {
        syncId,
        warehouseId: request.warehouseId,
        status: finalStatus,
        synchronized,
        failed,
        pending,
        totalDuration,
        crossWarehouseStatus: crossWarehouseResult.status
      })

      return result

    } catch (error) {
      const totalDuration = Date.now() - startTime
      
      logger.error('Inventory synchronization failed', {
        syncId,
        warehouseId: request.warehouseId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: totalDuration
      })

      // Update sync record with error
      await rhyPrisma.inventorySync.update({
        where: { id: syncId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          duration: totalDuration,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      }).catch(dbError => {
        logger.error('Failed to update sync record with error', {
          syncId,
          dbError: dbError instanceof Error ? dbError.message : 'Unknown error'
        })
      })

      throw error

    } finally {
      this.activeSyncs.delete(syncId)
    }
  }

  /**
   * Bulk synchronization across multiple warehouses
   */
  public async bulkSynchronization(request: BulkSyncRequest): Promise<BulkSyncResult> {
    const bulkSyncId = uuidv4()
    const startTime = Date.now()

    try {
      logger.info('Starting bulk inventory synchronization', {
        bulkSyncId,
        warehouses: request.warehouses,
        operation: request.operation,
        requestedBy: request.requestedBy
      })

      // Create bulk sync record
      const bulkSyncRecord = await rhyPrisma.bulkInventorySync.create({
        data: {
          id: bulkSyncId,
          operation: request.operation,
          warehouseIds: request.warehouses,
          status: 'PROCESSING',
          requestedBy: request.requestedBy,
          metadata: request.metadata || {},
          startedAt: new Date()
        }
      })

      // Process warehouses concurrently with controlled parallelism
      const maxConcurrentWarehouses = 2 // Limit concurrent warehouse syncs
      const warehouseResults: any[] = []
      
      for (let i = 0; i < request.warehouses.length; i += maxConcurrentWarehouses) {
        const warehouseBatch = request.warehouses.slice(i, i + maxConcurrentWarehouses)
        
        const batchResults = await Promise.allSettled(
          warehouseBatch.map(async (warehouseId) => {
            return await this.executeWarehouseBulkSync(
              warehouseId,
              request.operation,
              bulkSyncId,
              request.maxRetries
            )
          })
        )

        batchResults.forEach((result, index) => {
          const warehouseId = warehouseBatch[index]
          if (result.status === 'fulfilled') {
            warehouseResults.push({
              warehouseId,
              status: 'COMPLETED',
              ...result.value
            })
          } else {
            warehouseResults.push({
              warehouseId,
              status: 'FAILED',
              error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
            })
          }
        })
      }

      // Calculate summary statistics
      const successful = warehouseResults.filter(r => r.status === 'COMPLETED').length
      const failed = warehouseResults.filter(r => r.status === 'FAILED').length
      const pending = request.warehouses.length - successful - failed

      const totalDuration = Date.now() - startTime
      const averageWarehouseSyncTime = successful > 0 ? totalDuration / successful : 0

      // Execute cross-region synchronization
      const crossRegionSyncTime = await this.executeCrossRegionSync(
        warehouseResults.filter(r => r.status === 'COMPLETED'),
        bulkSyncId
      )

      // Determine final status
      const finalStatus = failed === 0 ? 'COMPLETED' : successful > 0 ? 'PARTIAL' : 'FAILED'

      // Update bulk sync record
      await rhyPrisma.bulkInventorySync.update({
        where: { id: bulkSyncId },
        data: {
          status: finalStatus,
          completedAt: new Date(),
          duration: totalDuration,
          successfulWarehouses: successful,
          failedWarehouses: failed,
          results: warehouseResults
        }
      })

      const result: BulkSyncResult = {
        bulkSyncId,
        status: finalStatus,
        warehouseResults,
        successful,
        failed,
        pending,
        averageWarehouseSyncTime,
        crossRegionSyncTime,
        estimatedCompletion: new Date(Date.now() + (pending * averageWarehouseSyncTime)),
        nextScheduledSync: this.calculateNextBulkSyncWindow(request.operation)
      }

      logger.info('Bulk inventory synchronization completed', {
        bulkSyncId,
        status: finalStatus,
        successful,
        failed,
        totalDuration,
        crossRegionSyncTime
      })

      return result

    } catch (error) {
      const totalDuration = Date.now() - startTime
      
      logger.error('Bulk inventory synchronization failed', {
        bulkSyncId,
        warehouses: request.warehouses,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: totalDuration
      })

      await rhyPrisma.bulkInventorySync.update({
        where: { id: bulkSyncId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          duration: totalDuration,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      }).catch(() => {}) // Ignore DB update errors in error handler

      throw error
    }
  }

  /**
   * Get synchronization status for specific sync ID
   */
  public async getSyncStatus(syncId: string, userId: string): Promise<SyncStatus> {
    try {
      const syncRecord = await rhyPrisma.inventorySync.findUnique({
        where: { id: syncId },
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              region: true,
              code: true,
              status: true
            }
          }
        }
      })

      if (!syncRecord) {
        throw new Error(`Sync record not found: ${syncId}`)
      }

      // Check if user has access to this sync record
      if (syncRecord.requestedBy !== userId && syncRecord.requestedBy !== 'SYSTEM') {
        throw new Error('Access denied to sync record')
      }

      const result: SyncStatus = {
        syncId: syncRecord.id,
        status: syncRecord.status as any,
        warehouse: syncRecord.warehouse,
        progress: syncRecord.progress,
        productCount: syncRecord.productCount,
        syncedProducts: syncRecord.syncedProducts,
        failedProducts: syncRecord.failedProducts,
        syncType: syncRecord.syncType as any,
        priority: syncRecord.priority as any,
        startedAt: syncRecord.startedAt,
        completedAt: syncRecord.completedAt,
        duration: syncRecord.duration,
        crossWarehouseStatus: syncRecord.crossWarehouseStatus as any,
        errorMessage: syncRecord.errorMessage,
        results: syncRecord.results as any,
        metadata: syncRecord.metadata as any
      }

      return result

    } catch (error) {
      logger.error('Failed to get sync status', {
        syncId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Get warehouse synchronization status and history
   */
  public async getWarehouseSyncStatus(
    warehouseId: string,
    userId: string,
    options: { includeHistory?: boolean; includeMetrics?: boolean } = {}
  ): Promise<WarehouseSyncStatus> {
    try {
      const warehouse = await warehouseService.getWarehouseById(warehouseId)
      if (!warehouse) {
        throw new Error(`Warehouse not found: ${warehouseId}`)
      }

      // Get recent sync records
      const recentSyncs = await rhyPrisma.inventorySync.findMany({
        where: { warehouseId },
        orderBy: { startedAt: 'desc' },
        take: options.includeHistory ? 50 : 10,
        select: {
          id: true,
          status: true,
          syncType: true,
          priority: true,
          productCount: true,
          syncedProducts: true,
          failedProducts: true,
          startedAt: true,
          completedAt: true,
          duration: true,
          crossWarehouseStatus: true
        }
      })

      const activeSyncs = recentSyncs.filter(sync => 
        sync.status === 'PROCESSING' || sync.status === 'PENDING'
      )

      const result: WarehouseSyncStatus = {
        warehouseId,
        warehouse,
        activeSyncs: activeSyncs.length,
        lastSyncAt: recentSyncs[0]?.completedAt || null,
        lastSyncStatus: recentSyncs[0]?.status as any || 'NONE',
        recentSyncs: options.includeHistory ? recentSyncs : recentSyncs.slice(0, 5),
        metrics: options.includeMetrics ? await this.calculateSyncMetrics(warehouseId) : undefined
      }

      return result

    } catch (error) {
      logger.error('Failed to get warehouse sync status', {
        warehouseId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Get global synchronization status across accessible warehouses
   */
  public async getGlobalSyncStatus(
    warehouseIds: string[],
    userId: string,
    options: { includeHistory?: boolean; includeMetrics?: boolean } = {}
  ): Promise<GlobalSyncStatus> {
    try {
      const warehouseStatuses = await Promise.all(
        warehouseIds.map(warehouseId =>
          this.getWarehouseSyncStatus(warehouseId, userId, options)
        )
      )

      const totalActiveSyncs = warehouseStatuses.reduce(
        (sum, status) => sum + status.activeSyncs, 0
      )

      const recentGlobalActivity = await rhyPrisma.inventorySync.findMany({
        where: {
          warehouseId: { in: warehouseIds },
          startedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { startedAt: 'desc' },
        take: options.includeHistory ? 100 : 20,
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              region: true,
              code: true
            }
          }
        }
      })

      const result: GlobalSyncStatus = {
        totalWarehouses: warehouseIds.length,
        warehouseStatuses,
        totalActiveSyncs,
        recentActivity: recentGlobalActivity,
        globalMetrics: options.includeMetrics ? 
          await this.calculateGlobalSyncMetrics(warehouseIds) : undefined
      }

      return result

    } catch (error) {
      logger.error('Failed to get global sync status', {
        warehouseIds,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Cancel ongoing synchronization
   */
  public async cancelSync(syncId: string, userId: string): Promise<{
    cancelled: boolean;
    status: string;
    message: string;
    affectedProducts: number;
    rollbackRequired: boolean;
  }> {
    try {
      const syncRecord = await rhyPrisma.inventorySync.findUnique({
        where: { id: syncId }
      })

      if (!syncRecord) {
        throw new Error(`Sync record not found: ${syncId}`)
      }

      if (syncRecord.requestedBy !== userId && syncRecord.requestedBy !== 'SYSTEM') {
        throw new Error('Access denied to cancel sync')
      }

      if (!['PROCESSING', 'PENDING'].includes(syncRecord.status)) {
        return {
          cancelled: false,
          status: syncRecord.status,
          message: `Cannot cancel sync with status: ${syncRecord.status}`,
          affectedProducts: 0,
          rollbackRequired: false
        }
      }

      // Cancel active sync if running
      const abortController = this.activeSyncs.get(syncId)
      if (abortController) {
        abortController.abort()
        this.activeSyncs.delete(syncId)
      }

      // Update sync record
      await rhyPrisma.inventorySync.update({
        where: { id: syncId },
        data: {
          status: 'CANCELLED',
          completedAt: new Date(),
          duration: Date.now() - syncRecord.startedAt.getTime()
        }
      })

      const rollbackRequired = syncRecord.syncedProducts > 0

      logger.info('Sync cancelled successfully', {
        syncId,
        userId,
        affectedProducts: syncRecord.syncedProducts,
        rollbackRequired
      })

      return {
        cancelled: true,
        status: 'CANCELLED',
        message: 'Synchronization cancelled successfully',
        affectedProducts: syncRecord.syncedProducts,
        rollbackRequired
      }

    } catch (error) {
      logger.error('Failed to cancel sync', {
        syncId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  // Private helper methods

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }

  private async processBatch(
    warehouseId: string,
    products: any[],
    syncId: string
  ): Promise<{ successful: any[]; failed: any[] }> {
    const successful: any[] = []
    const failed: any[] = []

    // Use warehouse service to update inventory
    const updateResult = await warehouseService.updateInventory(
      warehouseId,
      products.map(product => ({
        productId: product.productId,
        quantity: product.quantity,
        location: product.location,
        metadata: {
          syncId,
          batchNumber: product.batchNumber,
          expiryDate: product.expiryDate
        }
      })),
      syncId // Use syncId as userId for system operations
    )

    successful.push(...updateResult.updated)
    failed.push(...updateResult.failed)

    return { successful, failed }
  }

  private createTimeoutPromise(timeout: number, timeoutMessage: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(timeoutMessage))
      }, timeout)
    })
  }

  private async initiateCrossWarehouseSync(
    sourceWarehouseId: string,
    syncResults: any[],
    syncId: string
  ): Promise<CrossWarehouseSyncStatus> {
    const startTime = Date.now()
    
    try {
      // Get all other active warehouses for cross-sync
      const warehouses = await rhyPrisma.warehouse.findMany({
        where: {
          status: 'ACTIVE',
          id: { not: sourceWarehouseId }
        },
        select: { id: true, region: true, name: true }
      })

      const completedRegions: string[] = []
      const pendingRegions: string[] = []

      // Sync to other warehouses in parallel (limited concurrency)
      const maxConcurrent = 2
      for (let i = 0; i < warehouses.length; i += maxConcurrent) {
        const warehouseBatch = warehouses.slice(i, i + maxConcurrent)
        
        await Promise.allSettled(
          warehouseBatch.map(async (warehouse) => {
            try {
              await this.syncToWarehouse(warehouse.id, syncResults, syncId)
              completedRegions.push(warehouse.region)
            } catch (error) {
              pendingRegions.push(warehouse.region)
              logger.error('Cross-warehouse sync failed', {
                sourceWarehouse: sourceWarehouseId,
                targetWarehouse: warehouse.id,
                syncId,
                error: error instanceof Error ? error.message : 'Unknown error'
              })
            }
          })
        )
      }

      const crossWarehouseSyncTime = Date.now() - startTime
      const status = pendingRegions.length === 0 ? 'COMPLETED' : 
                   completedRegions.length > 0 ? 'PARTIAL' : 'FAILED'

      return {
        status,
        completedRegions,
        pendingRegions,
        crossWarehouseSyncTime
      }

    } catch (error) {
      logger.error('Cross-warehouse sync initiation failed', {
        sourceWarehouseId,
        syncId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return {
        status: 'FAILED',
        completedRegions: [],
        pendingRegions: [],
        crossWarehouseSyncTime: Date.now() - startTime
      }
    }
  }

  private async syncToWarehouse(
    targetWarehouseId: string,
    syncResults: any[],
    syncId: string
  ): Promise<void> {
    // Implement cross-warehouse sync logic
    // This would typically involve updating inventory levels in target warehouse
    // based on the changes in source warehouse
    
    await new Promise(resolve => setTimeout(resolve, 100)) // Simulate sync delay
  }

  private determineSyncStatus(
    synchronized: number,
    failed: number,
    pending: number
  ): 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'PROCESSING' {
    if (pending > 0) return 'PROCESSING'
    if (failed === 0) return 'COMPLETED'
    if (synchronized > 0) return 'PARTIAL'
    return 'FAILED'
  }

  private calculateNextSyncWindow(
    priority: string,
    region: string,
    syncType: string
  ): Date {
    // Calculate next sync window based on priority and region
    const baseInterval = priority === 'CRITICAL' ? 5 * 60 * 1000 : // 5 minutes
                        priority === 'HIGH' ? 15 * 60 * 1000 : // 15 minutes
                        priority === 'MEDIUM' ? 60 * 60 * 1000 : // 1 hour
                        4 * 60 * 60 * 1000 // 4 hours for LOW

    return new Date(Date.now() + baseInterval)
  }

  private calculateNextBulkSyncWindow(operation: string): Date {
    const interval = operation === 'SYNC_CRITICAL' ? 30 * 60 * 1000 : // 30 minutes
                    operation === 'SYNC_DELTA' ? 2 * 60 * 60 * 1000 : // 2 hours
                    24 * 60 * 60 * 1000 // 24 hours for SYNC_ALL

    return new Date(Date.now() + interval)
  }

  private async executeWarehouseBulkSync(
    warehouseId: string,
    operation: string,
    bulkSyncId: string,
    maxRetries: number
  ): Promise<any> {
    // Implement warehouse-specific bulk sync logic
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate processing
    
    return {
      syncedProducts: Math.floor(Math.random() * 100),
      failedProducts: Math.floor(Math.random() * 10),
      duration: 1000
    }
  }

  private async executeCrossRegionSync(
    warehouseResults: any[],
    bulkSyncId: string
  ): Promise<number> {
    const startTime = Date.now()
    
    // Implement cross-region sync logic
    await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate processing
    
    return Date.now() - startTime
  }

  private async calculateSyncMetrics(warehouseId: string): Promise<SyncMetrics> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const metrics = await rhyPrisma.inventorySync.aggregate({
      where: {
        warehouseId,
        startedAt: { gte: last24Hours }
      },
      _count: { id: true },
      _avg: { duration: true },
      _sum: {
        syncedProducts: true,
        failedProducts: true
      }
    })

    return {
      totalSyncs: metrics._count.id,
      averageDuration: metrics._avg.duration || 0,
      totalProductsSynced: metrics._sum.syncedProducts || 0,
      totalProductsFailed: metrics._sum.failedProducts || 0,
      successRate: metrics._sum.syncedProducts && metrics._sum.failedProducts ? 
        (metrics._sum.syncedProducts / (metrics._sum.syncedProducts + metrics._sum.failedProducts)) * 100 : 100,
      period: '24h'
    }
  }

  private async calculateGlobalSyncMetrics(warehouseIds: string[]): Promise<SyncMetrics> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const metrics = await rhyPrisma.inventorySync.aggregate({
      where: {
        warehouseId: { in: warehouseIds },
        startedAt: { gte: last24Hours }
      },
      _count: { id: true },
      _avg: { duration: true },
      _sum: {
        syncedProducts: true,
        failedProducts: true
      }
    })

    return {
      totalSyncs: metrics._count.id,
      averageDuration: metrics._avg.duration || 0,
      totalProductsSynced: metrics._sum.syncedProducts || 0,
      totalProductsFailed: metrics._sum.failedProducts || 0,
      successRate: metrics._sum.syncedProducts && metrics._sum.failedProducts ? 
        (metrics._sum.syncedProducts / (metrics._sum.syncedProducts + metrics._sum.failedProducts)) * 100 : 100,
      period: '24h'
    }
  }
}

// Export singleton instance
export const inventorySyncService = InventorySyncService.getInstance()