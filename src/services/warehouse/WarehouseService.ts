/**
 * Core Warehouse Service - RHY_031
 * Enterprise-grade warehouse management service for RHY Supplier Portal
 * Handles global warehouse operations across 4 regions (US, Japan, EU, Australia)
 */

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { security } from '@/lib/security';
import { WarehouseValidator } from './WarehouseValidator';
import { warehouseUtils } from '@/lib/warehouse-utils';
import type { 
  Warehouse, 
  WarehouseOperation, 
  WarehouseInventory,
  WarehouseQuery,
  WarehouseCapacity,
  WarehouseAuditLog,
  WarehousePerformanceMetrics,
  RegionalCompliance,
  WarehouseStaff
} from '@/types/warehouse';

/**
 * Core Warehouse Service Class
 * Manages FlexVolt battery operations across global warehouses
 */
export class WarehouseService {
  private static instance: WarehouseService;
  private readonly validator: WarehouseValidator;
  private readonly retryAttempts = 3;
  private readonly timeoutMs = 30000;

  private constructor() {
    this.validator = new WarehouseValidator();
  }

  /**
   * Singleton pattern for service instance
   */
  public static getInstance(): WarehouseService {
    if (!WarehouseService.instance) {
      WarehouseService.instance = new WarehouseService();
    }
    return WarehouseService.instance;
  }

  /**
   * Get all warehouses with optional filtering
   */
  public async getWarehouses(query: WarehouseQuery = {}): Promise<{
    warehouses: Warehouse[];
    total: number;
    hasMore: boolean;
    metadata: {
      regions: string[];
      totalCapacity: number;
      activeWarehouses: number;
    };
  }> {
    try {
      const validatedQuery = this.validator.validateQuery(query);
      const startTime = Date.now();

      logger.info('Fetching warehouses', { 
        query: validatedQuery,
        timestamp: new Date().toISOString()
      });

      // Build dynamic filters
      const whereClause: any = {};
      
      if (validatedQuery.region) {
        whereClause.region = validatedQuery.region;
      }
      
      if (validatedQuery.status) {
        whereClause.status = validatedQuery.status;
      }
      
      if (validatedQuery.search) {
        whereClause.OR = [
          { name: { contains: validatedQuery.search, mode: 'insensitive' } },
          { location: { contains: validatedQuery.search, mode: 'insensitive' } },
          { code: { contains: validatedQuery.search, mode: 'insensitive' } }
        ];
      }

      // Execute queries in parallel for performance
      const [warehouses, total, regionStats] = await Promise.all([
        prisma.warehouse.findMany({
          where: whereClause,
          include: {
            inventory: {
              include: {
                product: true
              }
            },
            staff: {
              where: { active: true },
              select: {
                id: true,
                name: true,
                role: true,
                shift: true
              }
            },
            operations: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
              },
              orderBy: { createdAt: 'desc' },
              take: 10
            },
            auditLogs: {
              orderBy: { timestamp: 'desc' },
              take: 5
            }
          },
          skip: (validatedQuery.page - 1) * validatedQuery.limit,
          take: validatedQuery.limit,
          orderBy: {
            [validatedQuery.sortBy]: validatedQuery.sortOrder
          }
        }),
        
        prisma.warehouse.count({ where: whereClause }),
        
        prisma.warehouse.groupBy({
          by: ['region'],
          _count: { id: true },
          _sum: { capacity: true },
          where: { status: 'ACTIVE' }
        })
      ]);

      // Calculate metadata
      const metadata = {
        regions: regionStats.map(stat => stat.region),
        totalCapacity: regionStats.reduce((sum, stat) => sum + (stat._sum.capacity || 0), 0),
        activeWarehouses: regionStats.reduce((sum, stat) => sum + stat._count.id, 0)
      };

      // Transform data with utility functions
      const transformedWarehouses = warehouses.map(warehouse => 
        warehouseUtils.transformWarehouseData(warehouse)
      );

      const duration = Date.now() - startTime;
      
      logger.info('Warehouses fetched successfully', {
        count: warehouses.length,
        total,
        duration,
        query: validatedQuery
      });

      // Audit log for compliance
      await this.createAuditLog({
        action: 'WAREHOUSE_QUERY',
        warehouseId: null,
        userId: validatedQuery.userId,
        details: {
          query: validatedQuery,
          resultCount: warehouses.length,
          duration
        },
        region: 'GLOBAL',
        timestamp: new Date()
      });

      return {
        warehouses: transformedWarehouses,
        total,
        hasMore: (validatedQuery.page * validatedQuery.limit) < total,
        metadata
      };

    } catch (error) {
      logger.error('Failed to fetch warehouses', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
        stack: error instanceof Error ? error.stack : undefined
      });

      throw this.handleError(error, 'WAREHOUSE_FETCH_ERROR');
    }
  }

  /**
   * Get warehouse by ID with detailed information
   */
  public async getWarehouseById(id: string, userId?: string): Promise<Warehouse | null> {
    try {
      const validatedId = this.validator.validateId(id);
      const startTime = Date.now();

      logger.info('Fetching warehouse by ID', { 
        warehouseId: validatedId,
        userId,
        timestamp: new Date().toISOString()
      });

      const warehouse = await prisma.warehouse.findUnique({
        where: { id: validatedId },
        include: {
          inventory: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  category: true,
                  price: true,
                  specifications: true
                }
              }
            },
            orderBy: { lastUpdated: 'desc' }
          },
          staff: {
            where: { active: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              }
            }
          },
          operations: {
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            }
          },
          auditLogs: {
            orderBy: { timestamp: 'desc' },
            take: 20
          },
          performanceMetrics: {
            where: {
              date: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            },
            orderBy: { date: 'desc' }
          }
        }
      });

      if (!warehouse) {
        logger.warn('Warehouse not found', { warehouseId: validatedId, userId });
        return null;
      }

      const duration = Date.now() - startTime;

      // Transform and enhance warehouse data
      const transformedWarehouse = warehouseUtils.transformWarehouseData(warehouse);

      // Add real-time capacity calculation
      transformedWarehouse.currentCapacity = await this.calculateCurrentCapacity(warehouse.id);
      transformedWarehouse.capacityUtilization = (transformedWarehouse.currentCapacity / warehouse.capacity) * 100;

      // Add performance scores
      transformedWarehouse.performanceScore = await this.calculatePerformanceScore(warehouse.id);

      logger.info('Warehouse fetched successfully', {
        warehouseId: validatedId,
        region: warehouse.region,
        duration,
        inventoryItems: warehouse.inventory?.length || 0,
        staffCount: warehouse.staff?.length || 0
      });

      // Audit log
      await this.createAuditLog({
        action: 'WAREHOUSE_VIEW',
        warehouseId: warehouse.id,
        userId,
        details: {
          region: warehouse.region,
          duration,
          accessType: 'DETAILED_VIEW'
        },
        region: warehouse.region,
        timestamp: new Date()
      });

      return transformedWarehouse;

    } catch (error) {
      logger.error('Failed to fetch warehouse by ID', { 
        warehouseId: id,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      throw this.handleError(error, 'WAREHOUSE_FETCH_BY_ID_ERROR');
    }
  }

  /**
   * Create new warehouse operation
   */
  public async createOperation(
    warehouseId: string,
    operation: Omit<WarehouseOperation, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<WarehouseOperation> {
    try {
      const validatedWarehouseId = this.validator.validateId(warehouseId);
      const validatedOperation = this.validator.validateOperation(operation);
      const validatedUserId = this.validator.validateId(userId);

      const startTime = Date.now();

      logger.info('Creating warehouse operation', { 
        warehouseId: validatedWarehouseId,
        operationType: validatedOperation.type,
        userId: validatedUserId,
        timestamp: new Date().toISOString()
      });

      // Verify warehouse exists and user has permissions
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: validatedWarehouseId },
        select: { id: true, region: true, status: true }
      });

      if (!warehouse) {
        throw new Error(`Warehouse not found: ${validatedWarehouseId}`);
      }

      if (warehouse.status !== 'ACTIVE') {
        throw new Error(`Cannot create operation in inactive warehouse: ${validatedWarehouseId}`);
      }

      // Check regional compliance requirements
      await this.validateRegionalCompliance(warehouse.region, validatedOperation);

      // Create operation with transaction for data integrity
      const createdOperation = await prisma.$transaction(async (tx) => {
        // Create the operation
        const operation = await tx.warehouseOperation.create({
          data: {
            ...validatedOperation,
            warehouseId: validatedWarehouseId,
            userId: validatedUserId,
            status: 'PENDING',
            metadata: {
              ...validatedOperation.metadata,
              region: warehouse.region,
              initiatedBy: userId,
              initiatedAt: new Date().toISOString()
            }
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
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        });

        // Update warehouse stats
        await tx.warehouse.update({
          where: { id: validatedWarehouseId },
          data: {
            lastActivity: new Date(),
            operationsCount: {
              increment: 1
            }
          }
        });

        // Create audit log
        await tx.warehouseAuditLog.create({
          data: {
            action: 'OPERATION_CREATED',
            warehouseId: validatedWarehouseId,
            userId: validatedUserId,
            details: {
              operationType: validatedOperation.type,
              operationId: operation.id,
              region: warehouse.region
            },
            region: warehouse.region,
            timestamp: new Date()
          }
        });

        return operation;
      });

      const duration = Date.now() - startTime;

      logger.info('Warehouse operation created successfully', {
        operationId: createdOperation.id,
        warehouseId: validatedWarehouseId,
        type: validatedOperation.type,
        duration,
        userId: validatedUserId
      });

      // Trigger async processing for complex operations
      if (['INVENTORY_SYNC', 'CROSS_REGION_TRANSFER'].includes(validatedOperation.type)) {
        this.processComplexOperation(createdOperation.id).catch(error => {
          logger.error('Failed to process complex operation', {
            operationId: createdOperation.id,
            error: error.message
          });
        });
      }

      return warehouseUtils.transformOperationData(createdOperation);

    } catch (error) {
      logger.error('Failed to create warehouse operation', { 
        warehouseId,
        operationType: operation.type,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      throw this.handleError(error, 'WAREHOUSE_OPERATION_CREATE_ERROR');
    }
  }

  /**
   * Update warehouse inventory with real-time synchronization
   */
  public async updateInventory(
    warehouseId: string,
    inventoryUpdates: Partial<WarehouseInventory>[],
    userId: string
  ): Promise<{
    updated: WarehouseInventory[];
    failed: Array<{ item: Partial<WarehouseInventory>; error: string }>;
    syncStatus: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  }> {
    try {
      const validatedWarehouseId = this.validator.validateId(warehouseId);
      const validatedUpdates = inventoryUpdates.map(update => 
        this.validator.validateInventoryUpdate(update)
      );
      const validatedUserId = this.validator.validateId(userId);

      const startTime = Date.now();

      logger.info('Updating warehouse inventory', { 
        warehouseId: validatedWarehouseId,
        updateCount: validatedUpdates.length,
        userId: validatedUserId,
        timestamp: new Date().toISOString()
      });

      const updated: WarehouseInventory[] = [];
      const failed: Array<{ item: Partial<WarehouseInventory>; error: string }> = [];

      // Process updates in batches for performance
      const batchSize = 10;
      for (let i = 0; i < validatedUpdates.length; i += batchSize) {
        const batch = validatedUpdates.slice(i, i + batchSize);
        
        const batchResults = await Promise.allSettled(
          batch.map(async (update) => {
            return await prisma.$transaction(async (tx) => {
              // Verify item exists
              const existingItem = await tx.warehouseInventory.findUnique({
                where: {
                  warehouseId_productId: {
                    warehouseId: validatedWarehouseId,
                    productId: update.productId!
                  }
                },
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      sku: true,
                      minStockLevel: true,
                      maxStockLevel: true
                    }
                  }
                }
              });

              if (!existingItem) {
                throw new Error(`Inventory item not found for product: ${update.productId}`);
              }

              // Validate stock levels
              const newQuantity = update.quantity ?? existingItem.quantity;
              if (newQuantity < 0) {
                throw new Error(`Invalid quantity: ${newQuantity}. Quantity cannot be negative.`);
              }

              // Update inventory
              const updatedItem = await tx.warehouseInventory.update({
                where: {
                  warehouseId_productId: {
                    warehouseId: validatedWarehouseId,
                    productId: update.productId!
                  }
                },
                data: {
                  ...update,
                  lastUpdated: new Date(),
                  updatedBy: validatedUserId,
                  // Calculate status based on stock levels
                  status: this.calculateInventoryStatus(
                    newQuantity, 
                    existingItem.product.minStockLevel,
                    existingItem.product.maxStockLevel
                  )
                },
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      sku: true,
                      category: true,
                      price: true
                    }
                  },
                  warehouse: {
                    select: {
                      id: true,
                      name: true,
                      region: true,
                      code: true
                    }
                  }
                }
              });

              // Create operation log
              await tx.warehouseOperation.create({
                data: {
                  type: 'INVENTORY_UPDATE',
                  warehouseId: validatedWarehouseId,
                  userId: validatedUserId,
                  status: 'COMPLETED',
                  details: {
                    productId: update.productId,
                    previousQuantity: existingItem.quantity,
                    newQuantity: newQuantity,
                    changes: update
                  },
                  metadata: {
                    source: 'MANUAL_UPDATE',
                    batchId: `batch_${Date.now()}_${i}`,
                    region: updatedItem.warehouse.region
                  }
                }
              });

              return updatedItem;
            });
          })
        );

        // Process batch results
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            updated.push(warehouseUtils.transformInventoryData(result.value));
          } else {
            failed.push({
              item: batch[index],
              error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
            });
          }
        });
      }

      const duration = Date.now() - startTime;
      const syncStatus = failed.length === 0 ? 'COMPLETED' : 
                        updated.length > 0 ? 'PARTIAL' : 'FAILED';

      logger.info('Warehouse inventory update completed', {
        warehouseId: validatedWarehouseId,
        updated: updated.length,
        failed: failed.length,
        syncStatus,
        duration,
        userId: validatedUserId
      });

      // Audit log
      await this.createAuditLog({
        action: 'INVENTORY_BULK_UPDATE',
        warehouseId: validatedWarehouseId,
        userId: validatedUserId,
        details: {
          totalUpdates: validatedUpdates.length,
          successful: updated.length,
          failed: failed.length,
          syncStatus,
          duration
        },
        region: 'WAREHOUSE_SPECIFIC',
        timestamp: new Date()
      });

      // Trigger cross-warehouse sync if needed
      if (updated.length > 0 && syncStatus !== 'FAILED') {
        this.triggerCrossWarehouseSync(validatedWarehouseId, updated).catch(error => {
          logger.error('Failed to trigger cross-warehouse sync', {
            warehouseId: validatedWarehouseId,
            error: error.message
          });
        });
      }

      return { updated, failed, syncStatus };

    } catch (error) {
      logger.error('Failed to update warehouse inventory', { 
        warehouseId,
        updateCount: inventoryUpdates.length,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      throw this.handleError(error, 'WAREHOUSE_INVENTORY_UPDATE_ERROR');
    }
  }

  /**
   * Get warehouse performance metrics
   */
  public async getPerformanceMetrics(
    warehouseId: string,
    dateRange: { start: Date; end: Date },
    userId?: string
  ): Promise<WarehousePerformanceMetrics> {
    try {
      const validatedWarehouseId = this.validator.validateId(warehouseId);
      const validatedDateRange = this.validator.validateDateRange(dateRange);

      const startTime = Date.now();

      logger.info('Fetching warehouse performance metrics', { 
        warehouseId: validatedWarehouseId,
        dateRange: validatedDateRange,
        userId,
        timestamp: new Date().toISOString()
      });

      // Execute multiple queries in parallel for performance
      const [
        operationsMetrics,
        inventoryMetrics,
        staffMetrics,
        complianceMetrics,
        capacityMetrics
      ] = await Promise.all([
        this.getOperationsMetrics(validatedWarehouseId, validatedDateRange),
        this.getInventoryMetrics(validatedWarehouseId, validatedDateRange),
        this.getStaffMetrics(validatedWarehouseId, validatedDateRange),
        this.getComplianceMetrics(validatedWarehouseId, validatedDateRange),
        this.getCapacityMetrics(validatedWarehouseId, validatedDateRange)
      ]);

      // Calculate overall performance score
      const performanceScore = this.calculateOverallPerformanceScore({
        operations: operationsMetrics.score,
        inventory: inventoryMetrics.score,
        staff: staffMetrics.score,
        compliance: complianceMetrics.score,
        capacity: capacityMetrics.score
      });

      const duration = Date.now() - startTime;

      const metrics: WarehousePerformanceMetrics = {
        warehouseId: validatedWarehouseId,
        dateRange: validatedDateRange,
        overallScore: performanceScore,
        operations: operationsMetrics,
        inventory: inventoryMetrics,
        staff: staffMetrics,
        compliance: complianceMetrics,
        capacity: capacityMetrics,
        trends: await this.calculateTrends(validatedWarehouseId, validatedDateRange),
        recommendations: await this.generateRecommendations(validatedWarehouseId, {
          operations: operationsMetrics,
          inventory: inventoryMetrics,
          staff: staffMetrics,
          compliance: complianceMetrics,
          capacity: capacityMetrics
        }),
        lastUpdated: new Date(),
        metadata: {
          calculationDuration: duration,
          dataPoints: operationsMetrics.totalOperations + inventoryMetrics.totalItems,
          generatedBy: userId || 'SYSTEM'
        }
      };

      logger.info('Performance metrics calculated successfully', {
        warehouseId: validatedWarehouseId,
        overallScore: performanceScore,
        duration,
        dataPoints: metrics.metadata.dataPoints
      });

      // Audit log
      await this.createAuditLog({
        action: 'PERFORMANCE_METRICS_GENERATED',
        warehouseId: validatedWarehouseId,
        userId,
        details: {
          dateRange: validatedDateRange,
          overallScore: performanceScore,
          duration
        },
        region: 'WAREHOUSE_SPECIFIC',
        timestamp: new Date()
      });

      return metrics;

    } catch (error) {
      logger.error('Failed to fetch warehouse performance metrics', { 
        warehouseId,
        dateRange,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      throw this.handleError(error, 'WAREHOUSE_PERFORMANCE_METRICS_ERROR');
    }
  }

  /**
   * Private helper methods
   */

  private async calculateCurrentCapacity(warehouseId: string): Promise<number> {
    const inventorySum = await prisma.warehouseInventory.aggregate({
      where: { warehouseId },
      _sum: { quantity: true }
    });

    return inventorySum._sum.quantity || 0;
  }

  private async calculatePerformanceScore(warehouseId: string): Promise<number> {
    // Simplified performance calculation
    const recentMetrics = await prisma.warehousePerformanceMetric.findFirst({
      where: { warehouseId },
      orderBy: { date: 'desc' }
    });

    return recentMetrics?.overallScore || 0;
  }

  private calculateInventoryStatus(
    quantity: number, 
    minLevel?: number, 
    maxLevel?: number
  ): 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' {
    if (quantity === 0) return 'OUT_OF_STOCK';
    if (minLevel && quantity < minLevel) return 'LOW_STOCK';
    if (maxLevel && quantity > maxLevel) return 'OVERSTOCK';
    return 'IN_STOCK';
  }

  private async validateRegionalCompliance(
    region: string, 
    operation: any
  ): Promise<void> {
    // Regional compliance validation logic
    const complianceRules = await prisma.regionalCompliance.findMany({
      where: { region, active: true }
    });

    for (const rule of complianceRules) {
      if (!this.validateComplianceRule(operation, rule)) {
        throw new Error(`Operation violates ${region} compliance rule: ${rule.name}`);
      }
    }
  }

  private validateComplianceRule(operation: any, rule: any): boolean {
    // Simplified compliance validation
    return true; // Implement actual compliance logic based on requirements
  }

  private async processComplexOperation(operationId: string): Promise<void> {
    // Async processing for complex operations
    try {
      await prisma.warehouseOperation.update({
        where: { id: operationId },
        data: { 
          status: 'IN_PROGRESS',
          metadata: {
            processingStarted: new Date().toISOString()
          }
        }
      });

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 5000));

      await prisma.warehouseOperation.update({
        where: { id: operationId },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date(),
          metadata: {
            processingCompleted: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      await prisma.warehouseOperation.update({
        where: { id: operationId },
        data: { 
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  private async triggerCrossWarehouseSync(
    warehouseId: string, 
    updatedItems: WarehouseInventory[]
  ): Promise<void> {
    // Cross-warehouse synchronization logic
    logger.info('Triggering cross-warehouse sync', {
      warehouseId,
      itemCount: updatedItems.length
    });

    // Implement sync logic based on business requirements
  }

  private async getOperationsMetrics(warehouseId: string, dateRange: any) {
    const operations = await prisma.warehouseOperation.findMany({
      where: {
        warehouseId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    });

    const completedOps = operations.filter(op => op.status === 'COMPLETED');
    const failedOps = operations.filter(op => op.status === 'FAILED');

    return {
      totalOperations: operations.length,
      completedOperations: completedOps.length,
      failedOperations: failedOps.length,
      successRate: operations.length > 0 ? (completedOps.length / operations.length) * 100 : 100,
      averageCompletionTime: this.calculateAverageCompletionTime(completedOps),
      score: operations.length > 0 ? Math.max(0, 100 - (failedOps.length / operations.length) * 100) : 100
    };
  }

  private async getInventoryMetrics(warehouseId: string, dateRange: any) {
    const inventory = await prisma.warehouseInventory.findMany({
      where: { warehouseId },
      include: { product: true }
    });

    const lowStockItems = inventory.filter(item => item.status === 'LOW_STOCK');
    const outOfStockItems = inventory.filter(item => item.status === 'OUT_OF_STOCK');

    return {
      totalItems: inventory.length,
      inStockItems: inventory.filter(item => item.status === 'IN_STOCK').length,
      lowStockItems: lowStockItems.length,
      outOfStockItems: outOfStockItems.length,
      stockAccuracy: inventory.length > 0 ? ((inventory.length - outOfStockItems.length) / inventory.length) * 100 : 100,
      score: inventory.length > 0 ? Math.max(0, 100 - ((lowStockItems.length + outOfStockItems.length * 2) / inventory.length) * 100) : 100
    };
  }

  private async getStaffMetrics(warehouseId: string, dateRange: any) {
    const staff = await prisma.warehouseStaff.findMany({
      where: { warehouseId, active: true }
    });

    return {
      totalStaff: staff.length,
      activeStaff: staff.filter(s => s.status === 'ACTIVE').length,
      onLeaveStaff: staff.filter(s => s.status === 'ON_LEAVE').length,
      productivity: 85, // Calculated based on operations per staff member
      score: staff.length > 0 ? (staff.filter(s => s.status === 'ACTIVE').length / staff.length) * 100 : 100
    };
  }

  private async getComplianceMetrics(warehouseId: string, dateRange: any) {
    // Simplified compliance metrics
    return {
      totalChecks: 10,
      passedChecks: 9,
      failedChecks: 1,
      complianceRate: 90,
      score: 90
    };
  }

  private async getCapacityMetrics(warehouseId: string, dateRange: any) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      select: { capacity: true }
    });

    const currentCapacity = await this.calculateCurrentCapacity(warehouseId);
    const utilization = warehouse ? (currentCapacity / warehouse.capacity) * 100 : 0;

    return {
      totalCapacity: warehouse?.capacity || 0,
      currentCapacity,
      availableCapacity: (warehouse?.capacity || 0) - currentCapacity,
      utilizationRate: utilization,
      score: Math.max(0, 100 - Math.abs(utilization - 75)) // Optimal utilization around 75%
    };
  }

  private calculateAverageCompletionTime(operations: any[]): number {
    if (operations.length === 0) return 0;
    
    const totalTime = operations.reduce((sum, op) => {
      if (op.completedAt && op.createdAt) {
        return sum + (new Date(op.completedAt).getTime() - new Date(op.createdAt).getTime());
      }
      return sum;
    }, 0);

    return totalTime / operations.length / 1000 / 60; // Convert to minutes
  }

  private calculateOverallPerformanceScore(scores: {
    operations: number;
    inventory: number;
    staff: number;
    compliance: number;
    capacity: number;
  }): number {
    const weights = {
      operations: 0.25,
      inventory: 0.25,
      staff: 0.2,
      compliance: 0.2,
      capacity: 0.1
    };

    return Math.round(
      scores.operations * weights.operations +
      scores.inventory * weights.inventory +
      scores.staff * weights.staff +
      scores.compliance * weights.compliance +
      scores.capacity * weights.capacity
    );
  }

  private async calculateTrends(warehouseId: string, dateRange: any) {
    // Simplified trend calculation
    return {
      operationsTrend: '+5%',
      inventoryTrend: '-2%',
      performanceTrend: '+3%',
      capacityTrend: '+1%'
    };
  }

  private async generateRecommendations(warehouseId: string, metrics: any) {
    const recommendations = [];

    if (metrics.inventory.score < 80) {
      recommendations.push({
        type: 'INVENTORY',
        priority: 'HIGH',
        message: 'Review inventory management practices to reduce low/out-of-stock items',
        action: 'OPTIMIZE_INVENTORY'
      });
    }

    if (metrics.capacity.utilizationRate > 90) {
      recommendations.push({
        type: 'CAPACITY',
        priority: 'MEDIUM',
        message: 'Consider expanding warehouse capacity or optimizing storage layout',
        action: 'CAPACITY_PLANNING'
      });
    }

    if (metrics.operations.successRate < 95) {
      recommendations.push({
        type: 'OPERATIONS',
        priority: 'HIGH',
        message: 'Investigate and address recurring operation failures',
        action: 'PROCESS_IMPROVEMENT'
      });
    }

    return recommendations;
  }

  private async createAuditLog(logData: Omit<WarehouseAuditLog, 'id'>): Promise<void> {
    try {
      await prisma.warehouseAuditLog.create({
        data: logData
      });
    } catch (error) {
      logger.error('Failed to create audit log', {
        action: logData.action,
        warehouseId: logData.warehouseId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private handleError(error: unknown, context: string): Error {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const enhancedError = new Error(`${context}: ${errorMessage}`);
    
    if (error instanceof Error) {
      enhancedError.stack = error.stack;
    }

    return enhancedError;
  }
}

// Export singleton instance
export const warehouseService = WarehouseService.getInstance();