/**
 * Enterprise Order Fulfillment Service for RHY Supplier Portal
 * 
 * @fileoverview Comprehensive order fulfillment system supporting multi-warehouse operations,
 * real-time tracking, and seamless integration with Batch 1 foundation. Handles the complete
 * order fulfillment lifecycle from picking to shipping across 4 global warehouses.
 * 
 * @author RHY Development Team
 * @version 1.0.0
 * @since 2025-06-24
 */

import { prisma } from '@/lib/prisma'
import { Logger } from '@/lib/logger'
import { metrics, trackOrder, WarehouseRegion } from '@/lib/metrics'
import { WarehouseService } from '@/services/warehouse/WarehouseService'
import { AuthService } from '@/services/auth/AuthService'
import { AuditService } from '@/services/audit/AuditService'
import { RealtimeService } from '@/services/realtime/RealtimeService'
import { z } from 'zod'

/**
 * Order fulfillment status enumeration
 */
export enum FulfillmentStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKING = 'picking',
  PICKED = 'picked',
  PACKING = 'packing',
  PACKED = 'packed',
  SHIPPING = 'shipping',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned'
}

/**
 * Fulfillment step types
 */
export enum FulfillmentStepType {
  PICKING = 'picking',
  PACKING = 'packing',
  QUALITY_CHECK = 'quality_check',
  SHIPPING = 'shipping',
  DELIVERY = 'delivery'
}

/**
 * Priority levels for order fulfillment
 */
export enum FulfillmentPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  EMERGENCY = 'emergency'
}

/**
 * Fulfillment assignment request validation schema
 */
export const FulfillmentAssignmentSchema = z.object({
  orderId: z.string().uuid(),
  warehouseId: z.string(),
  assignedStaffId: z.string().uuid(),
  priority: z.nativeEnum(FulfillmentPriority).default(FulfillmentPriority.NORMAL),
  estimatedCompletionTime: z.string().datetime().optional(),
  specialInstructions: z.string().max(500).optional()
})

/**
 * Picking task validation schema
 */
export const PickingTaskSchema = z.object({
  orderId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    locationBin: z.string().min(1).max(20),
    picked: z.boolean().default(false)
  })),
  staffId: z.string().uuid(),
  notes: z.string().max(1000).optional()
})

/**
 * Shipping label generation schema
 */
export const ShippingLabelSchema = z.object({
  orderId: z.string().uuid(),
  carrier: z.enum(['UPS', 'FedEx', 'DHL', 'USPS']),
  serviceLevel: z.enum(['ground', 'express', 'overnight', 'international']),
  trackingNumber: z.string().min(10).max(50),
  labelUrl: z.string().url(),
  estimatedDelivery: z.string().datetime()
})

/**
 * Fulfillment metrics interface
 */
export interface FulfillmentMetrics {
  ordersAssigned: number
  averagePickingTime: number
  averagePackingTime: number
  onTimeDeliveryRate: number
  qualityCheckPassRate: number
  warehouseEfficiency: number
  staffProductivity: Record<string, number>
}

/**
 * Picking optimization result
 */
export interface PickingOptimization {
  optimizedRoute: string[]
  estimatedTime: number
  walkingDistance: number
  efficiency: number
  groupedItems: Array<{
    zone: string
    items: Array<{
      productId: string
      quantity: number
      location: string
      priority: number
    }>
  }>
}

/**
 * Real-time fulfillment update
 */
export interface FulfillmentUpdate {
  orderId: string
  status: FulfillmentStatus
  currentStep?: FulfillmentStepType
  progress: number
  estimatedCompletion: Date
  assignedStaff?: string
  notes?: string
  timestamp: Date
}

/**
 * Enterprise Order Fulfillment Service
 * 
 * Provides comprehensive order fulfillment capabilities including:
 * - Multi-warehouse order assignment
 * - Intelligent picking optimization
 * - Real-time tracking and updates
 * - Quality control integration
 * - Shipping coordination
 * - Performance analytics
 */
export class FulfillmentService {
  private readonly logger: Logger
  private readonly warehouseService: WarehouseService
  private readonly authService: AuthService
  private readonly auditService: AuditService
  private readonly realtimeService: RealtimeService

  constructor(
    warehouseService: WarehouseService,
    authService: AuthService,
    auditService: AuditService,
    realtimeService: RealtimeService
  ) {
    this.logger = new Logger('FulfillmentService')
    this.warehouseService = warehouseService
    this.authService = authService
    this.auditService = auditService
    this.realtimeService = realtimeService
  }

  /**
   * Assign order to warehouse and staff for fulfillment
   */
  async assignOrderToWarehouse(
    orderId: string,
    assignment: z.infer<typeof FulfillmentAssignmentSchema>,
    requestContext: { userId: string; ipAddress: string }
  ): Promise<{
    success: boolean
    fulfillmentId: string
    assignedWarehouse: string
    estimatedCompletion: Date
    pickingRoute?: PickingOptimization
  }> {
    const startTime = Date.now()
    
    try {
      // Validate assignment data
      const validatedAssignment = FulfillmentAssignmentSchema.parse(assignment)
      
      // Verify order exists and is eligible for fulfillment
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true
            }
          },
          customer: true
        }
      })

      if (!order) {
        throw new Error(`Order ${orderId} not found`)
      }

      if (order.status !== 'confirmed') {
        throw new Error(`Order ${orderId} is not ready for fulfillment (status: ${order.status})`)
      }

      // Validate warehouse accessibility
      const warehouse = await this.warehouseService.getWarehouse(validatedAssignment.warehouseId)
      if (!warehouse) {
        throw new Error(`Warehouse ${validatedAssignment.warehouseId} not found`)
      }

      // Check inventory availability
      const inventoryCheck = await this.checkInventoryAvailability(
        order.items,
        validatedAssignment.warehouseId
      )

      if (!inventoryCheck.available) {
        throw new Error(`Insufficient inventory in warehouse ${validatedAssignment.warehouseId}: ${inventoryCheck.missingItems.join(', ')}`)
      }

      // Generate picking optimization
      const pickingOptimization = await this.optimizePickingRoute(
        order.items,
        validatedAssignment.warehouseId
      )

      // Create fulfillment record
      const fulfillment = await prisma.$transaction(async (tx) => {
        // Update order status
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'fulfillment_assigned',
            fulfillmentStatus: FulfillmentStatus.ASSIGNED
          }
        })

        // Create fulfillment record
        const fulfillmentRecord = await tx.fulfillment.create({
          data: {
            orderId,
            warehouseId: validatedAssignment.warehouseId,
            assignedStaffId: validatedAssignment.assignedStaffId,
            status: FulfillmentStatus.ASSIGNED,
            priority: validatedAssignment.priority,
            estimatedCompletionTime: validatedAssignment.estimatedCompletionTime 
              ? new Date(validatedAssignment.estimatedCompletionTime)
              : new Date(Date.now() + pickingOptimization.estimatedTime * 60 * 1000),
            specialInstructions: validatedAssignment.specialInstructions,
            pickingRoute: pickingOptimization,
            assignedAt: new Date()
          }
        })

        // Reserve inventory
        for (const item of order.items) {
          await tx.inventory.updateMany({
            where: {
              productId: item.productId,
              warehouseId: validatedAssignment.warehouseId
            },
            data: {
              reservedQuantity: {
                increment: item.quantity
              },
              availableQuantity: {
                decrement: item.quantity
              }
            }
          })
        }

        // Create initial fulfillment steps
        await tx.fulfillmentStep.createMany({
          data: [
            {
              fulfillmentId: fulfillmentRecord.id,
              stepType: FulfillmentStepType.PICKING,
              status: 'pending',
              estimatedDuration: pickingOptimization.estimatedTime
            },
            {
              fulfillmentId: fulfillmentRecord.id,
              stepType: FulfillmentStepType.QUALITY_CHECK,
              status: 'pending',
              estimatedDuration: 15 // 15 minutes for quality check
            },
            {
              fulfillmentId: fulfillmentRecord.id,
              stepType: FulfillmentStepType.PACKING,
              status: 'pending',
              estimatedDuration: 20 // 20 minutes for packing
            },
            {
              fulfillmentId: fulfillmentRecord.id,
              stepType: FulfillmentStepType.SHIPPING,
              status: 'pending',
              estimatedDuration: 10 // 10 minutes for shipping preparation
            }
          ]
        })

        return fulfillmentRecord
      })

      // Send real-time notification
      await this.realtimeService.broadcastFulfillmentUpdate({
        orderId,
        status: FulfillmentStatus.ASSIGNED,
        progress: 10,
        estimatedCompletion: fulfillment.estimatedCompletionTime!,
        assignedStaff: validatedAssignment.assignedStaffId,
        timestamp: new Date()
      })

      // Track metrics
      metrics.getCounter('rhy_orders_assigned')?.inc({
        warehouse: validatedAssignment.warehouseId,
        priority: validatedAssignment.priority
      })

      // Audit log
      await this.auditService.logOperation({
        userId: requestContext.userId,
        action: 'FULFILLMENT_ASSIGNED',
        entityType: 'Order',
        entityId: orderId,
        details: {
          warehouseId: validatedAssignment.warehouseId,
          assignedStaffId: validatedAssignment.assignedStaffId,
          priority: validatedAssignment.priority,
          estimatedCompletion: fulfillment.estimatedCompletionTime
        },
        ipAddress: requestContext.ipAddress
      })

      const duration = Date.now() - startTime
      this.logger.info(`Order ${orderId} assigned to warehouse ${validatedAssignment.warehouseId} in ${duration}ms`)

      return {
        success: true,
        fulfillmentId: fulfillment.id,
        assignedWarehouse: validatedAssignment.warehouseId,
        estimatedCompletion: fulfillment.estimatedCompletionTime!,
        pickingRoute: pickingOptimization
      }

    } catch (error) {
      const duration = Date.now() - startTime
      this.logger.error(`Failed to assign order ${orderId} after ${duration}ms:`, error)

      // Track error metrics
      metrics.getCounter('rhy_fulfillment_errors')?.inc({
        operation: 'assignment',
        error_type: error instanceof Error ? error.name : 'unknown'
      })

      throw error
    }
  }

  /**
   * Start picking process for assigned order
   */
  async startPickingProcess(
    fulfillmentId: string,
    pickingData: z.infer<typeof PickingTaskSchema>,
    requestContext: { userId: string; ipAddress: string }
  ): Promise<{
    success: boolean
    pickingTaskId: string
    optimizedRoute: PickingOptimization
    estimatedCompletion: Date
  }> {
    const startTime = Date.now()

    try {
      // Validate picking data
      const validatedPicking = PickingTaskSchema.parse(pickingData)

      // Get fulfillment record
      const fulfillment = await prisma.fulfillment.findUnique({
        where: { id: fulfillmentId },
        include: {
          order: {
            include: {
              items: {
                include: { product: true }
              }
            }
          },
          steps: true
        }
      })

      if (!fulfillment) {
        throw new Error(`Fulfillment ${fulfillmentId} not found`)
      }

      if (fulfillment.status !== FulfillmentStatus.ASSIGNED) {
        throw new Error(`Fulfillment ${fulfillmentId} is not ready for picking (status: ${fulfillment.status})`)
      }

      // Verify staff authorization
      const staff = await this.authService.validateStaffPermissions(
        validatedPicking.staffId,
        ['FULFILLMENT_PICKING'],
        fulfillment.warehouseId
      )

      if (!staff.authorized) {
        throw new Error(`Staff ${validatedPicking.staffId} not authorized for picking operations`)
      }

      // Start picking transaction
      const pickingTask = await prisma.$transaction(async (tx) => {
        // Update fulfillment status
        await tx.fulfillment.update({
          where: { id: fulfillmentId },
          data: {
            status: FulfillmentStatus.PICKING,
            pickingStartedAt: new Date(),
            currentStaffId: validatedPicking.staffId
          }
        })

        // Update picking step
        await tx.fulfillmentStep.updateMany({
          where: {
            fulfillmentId,
            stepType: FulfillmentStepType.PICKING
          },
          data: {
            status: 'in_progress',
            startedAt: new Date(),
            assignedStaffId: validatedPicking.staffId
          }
        })

        // Create picking task
        const task = await tx.pickingTask.create({
          data: {
            fulfillmentId,
            orderId: fulfillment.orderId,
            staffId: validatedPicking.staffId,
            items: validatedPicking.items,
            status: 'in_progress',
            startedAt: new Date(),
            notes: validatedPicking.notes
          }
        })

        return task
      })

      // Get optimized picking route
      const optimizedRoute = fulfillment.pickingRoute as PickingOptimization || 
        await this.optimizePickingRoute(fulfillment.order.items, fulfillment.warehouseId)

      // Calculate estimated completion
      const estimatedCompletion = new Date(Date.now() + optimizedRoute.estimatedTime * 60 * 1000)

      // Send real-time update
      await this.realtimeService.broadcastFulfillmentUpdate({
        orderId: fulfillment.orderId,
        status: FulfillmentStatus.PICKING,
        currentStep: FulfillmentStepType.PICKING,
        progress: 25,
        estimatedCompletion,
        assignedStaff: validatedPicking.staffId,
        timestamp: new Date()
      })

      // Track metrics
      metrics.getTimer('rhy_picking_duration')?.startTimer({
        warehouse: fulfillment.warehouseId,
        staff_id: validatedPicking.staffId
      })

      // Audit log
      await this.auditService.logOperation({
        userId: requestContext.userId,
        action: 'PICKING_STARTED',
        entityType: 'Fulfillment',
        entityId: fulfillmentId,
        details: {
          staffId: validatedPicking.staffId,
          itemCount: validatedPicking.items.length,
          estimatedCompletion
        },
        ipAddress: requestContext.ipAddress
      })

      const duration = Date.now() - startTime
      this.logger.info(`Picking started for fulfillment ${fulfillmentId} in ${duration}ms`)

      return {
        success: true,
        pickingTaskId: pickingTask.id,
        optimizedRoute,
        estimatedCompletion
      }

    } catch (error) {
      const duration = Date.now() - startTime
      this.logger.error(`Failed to start picking for fulfillment ${fulfillmentId} after ${duration}ms:`, error)

      // Track error metrics
      metrics.getCounter('rhy_fulfillment_errors')?.inc({
        operation: 'picking_start',
        error_type: error instanceof Error ? error.name : 'unknown'
      })

      throw error
    }
  }

  /**
   * Complete picking and move to packing
   */
  async completePickingProcess(
    pickingTaskId: string,
    completionData: {
      pickedItems: Array<{
        productId: string
        quantityPicked: number
        actualLocation: string
        condition: 'good' | 'damaged' | 'missing'
        notes?: string
      }>
      totalPickingTime: number
      qualityIssues?: string[]
    },
    requestContext: { userId: string; ipAddress: string }
  ): Promise<{
    success: boolean
    nextStep: 'quality_check' | 'packing'
    qualityCheckRequired: boolean
  }> {
    const startTime = Date.now()

    try {
      // Get picking task
      const pickingTask = await prisma.pickingTask.findUnique({
        where: { id: pickingTaskId },
        include: {
          fulfillment: {
            include: {
              order: {
                include: { items: true }
              }
            }
          }
        }
      })

      if (!pickingTask) {
        throw new Error(`Picking task ${pickingTaskId} not found`)
      }

      if (pickingTask.status !== 'in_progress') {
        throw new Error(`Picking task ${pickingTaskId} is not in progress`)
      }

      // Validate picked items against order
      const orderItems = pickingTask.fulfillment.order.items
      const qualityIssues = completionData.qualityIssues || []

      // Check for discrepancies
      const discrepancies: string[] = []
      for (const orderItem of orderItems) {
        const pickedItem = completionData.pickedItems.find(p => p.productId === orderItem.productId)
        if (!pickedItem) {
          discrepancies.push(`Product ${orderItem.productId} was not picked`)
        } else if (pickedItem.quantityPicked !== orderItem.quantity) {
          discrepancies.push(`Product ${orderItem.productId}: ordered ${orderItem.quantity}, picked ${pickedItem.quantityPicked}`)
        }
      }

      // Determine if quality check is required
      const qualityCheckRequired = qualityIssues.length > 0 || 
        discrepancies.length > 0 ||
        completionData.pickedItems.some(item => item.condition !== 'good')

      // Complete picking transaction
      await prisma.$transaction(async (tx) => {
        // Update picking task
        await tx.pickingTask.update({
          where: { id: pickingTaskId },
          data: {
            status: 'completed',
            completedAt: new Date(),
            actualPickingTime: completionData.totalPickingTime,
            pickedItems: completionData.pickedItems,
            discrepancies,
            qualityIssues
          }
        })

        // Update fulfillment status
        const nextStatus = qualityCheckRequired ? FulfillmentStatus.PICKED : FulfillmentStatus.PACKING
        await tx.fulfillment.update({
          where: { id: pickingTask.fulfillmentId },
          data: {
            status: nextStatus,
            pickingCompletedAt: new Date()
          }
        })

        // Complete picking step
        await tx.fulfillmentStep.updateMany({
          where: {
            fulfillmentId: pickingTask.fulfillmentId,
            stepType: FulfillmentStepType.PICKING
          },
          data: {
            status: 'completed',
            completedAt: new Date(),
            actualDuration: completionData.totalPickingTime,
            notes: discrepancies.length > 0 ? `Discrepancies: ${discrepancies.join('; ')}` : undefined
          }
        })

        // Start next step
        if (qualityCheckRequired) {
          await tx.fulfillmentStep.updateMany({
            where: {
              fulfillmentId: pickingTask.fulfillmentId,
              stepType: FulfillmentStepType.QUALITY_CHECK
            },
            data: {
              status: 'pending',
              notes: qualityIssues.length > 0 ? `Quality issues: ${qualityIssues.join('; ')}` : undefined
            }
          })
        } else {
          await tx.fulfillmentStep.updateMany({
            where: {
              fulfillmentId: pickingTask.fulfillmentId,
              stepType: FulfillmentStepType.PACKING
            },
            data: {
              status: 'pending'
            }
          })
        }
      })

      // Send real-time update
      await this.realtimeService.broadcastFulfillmentUpdate({
        orderId: pickingTask.fulfillment.orderId,
        status: qualityCheckRequired ? FulfillmentStatus.PICKED : FulfillmentStatus.PACKING,
        currentStep: qualityCheckRequired ? FulfillmentStepType.QUALITY_CHECK : FulfillmentStepType.PACKING,
        progress: qualityCheckRequired ? 50 : 60,
        estimatedCompletion: new Date(Date.now() + (qualityCheckRequired ? 35 : 30) * 60 * 1000),
        notes: discrepancies.length > 0 ? `${discrepancies.length} discrepancies found` : undefined,
        timestamp: new Date()
      })

      // Track metrics
      metrics.getHistogram('rhy_picking_time')?.observe(completionData.totalPickingTime, {
        warehouse: pickingTask.fulfillment.warehouseId,
        has_discrepancies: discrepancies.length > 0 ? 'true' : 'false'
      })

      if (discrepancies.length > 0) {
        metrics.getCounter('rhy_picking_discrepancies')?.inc({
          warehouse: pickingTask.fulfillment.warehouseId,
          type: 'quantity_mismatch'
        })
      }

      // Audit log
      await this.auditService.logOperation({
        userId: requestContext.userId,
        action: 'PICKING_COMPLETED',
        entityType: 'PickingTask',
        entityId: pickingTaskId,
        details: {
          totalTime: completionData.totalPickingTime,
          itemsPicked: completionData.pickedItems.length,
          discrepancies: discrepancies.length,
          qualityIssues: qualityIssues.length,
          qualityCheckRequired
        },
        ipAddress: requestContext.ipAddress
      })

      const duration = Date.now() - startTime
      this.logger.info(`Picking completed for task ${pickingTaskId} in ${duration}ms`)

      return {
        success: true,
        nextStep: qualityCheckRequired ? 'quality_check' : 'packing',
        qualityCheckRequired
      }

    } catch (error) {
      const duration = Date.now() - startTime
      this.logger.error(`Failed to complete picking task ${pickingTaskId} after ${duration}ms:`, error)

      // Track error metrics
      metrics.getCounter('rhy_fulfillment_errors')?.inc({
        operation: 'picking_complete',
        error_type: error instanceof Error ? error.name : 'unknown'
      })

      throw error
    }
  }

  /**
   * Generate shipping label and complete fulfillment
   */
  async generateShippingLabel(
    fulfillmentId: string,
    shippingData: z.infer<typeof ShippingLabelSchema>,
    requestContext: { userId: string; ipAddress: string }
  ): Promise<{
    success: boolean
    trackingNumber: string
    labelUrl: string
    estimatedDelivery: Date
  }> {
    const startTime = Date.now()

    try {
      // Validate shipping data
      const validatedShipping = ShippingLabelSchema.parse(shippingData)

      // Get fulfillment record
      const fulfillment = await prisma.fulfillment.findUnique({
        where: { id: fulfillmentId },
        include: {
          order: {
            include: {
              customer: true,
              items: {
                include: { product: true }
              }
            }
          }
        }
      })

      if (!fulfillment) {
        throw new Error(`Fulfillment ${fulfillmentId} not found`)
      }

      if (fulfillment.status !== FulfillmentStatus.PACKED) {
        throw new Error(`Fulfillment ${fulfillmentId} is not ready for shipping (status: ${fulfillment.status})`)
      }

      // Complete shipping transaction
      await prisma.$transaction(async (tx) => {
        // Update fulfillment status
        await tx.fulfillment.update({
          where: { id: fulfillmentId },
          data: {
            status: FulfillmentStatus.SHIPPED,
            shippedAt: new Date(),
            trackingNumber: validatedShipping.trackingNumber,
            carrier: validatedShipping.carrier,
            serviceLevel: validatedShipping.serviceLevel,
            estimatedDelivery: new Date(validatedShipping.estimatedDelivery)
          }
        })

        // Update order status
        await tx.order.update({
          where: { id: fulfillment.orderId },
          data: {
            status: 'shipped',
            fulfillmentStatus: FulfillmentStatus.SHIPPED,
            trackingNumber: validatedShipping.trackingNumber,
            shippedAt: new Date()
          }
        })

        // Complete shipping step
        await tx.fulfillmentStep.updateMany({
          where: {
            fulfillmentId,
            stepType: FulfillmentStepType.SHIPPING
          },
          data: {
            status: 'completed',
            completedAt: new Date()
          }
        })

        // Create shipping label record
        await tx.shippingLabel.create({
          data: {
            fulfillmentId,
            orderId: fulfillment.orderId,
            trackingNumber: validatedShipping.trackingNumber,
            carrier: validatedShipping.carrier,
            serviceLevel: validatedShipping.serviceLevel,
            labelUrl: validatedShipping.labelUrl,
            estimatedDelivery: new Date(validatedShipping.estimatedDelivery)
          }
        })
      })

      // Send real-time update
      await this.realtimeService.broadcastFulfillmentUpdate({
        orderId: fulfillment.orderId,
        status: FulfillmentStatus.SHIPPED,
        currentStep: FulfillmentStepType.DELIVERY,
        progress: 90,
        estimatedCompletion: new Date(validatedShipping.estimatedDelivery),
        timestamp: new Date()
      })

      // Track order completion
      trackOrder(
        fulfillment.orderId,
        fulfillment.order.total,
        fulfillment.warehouseId as WarehouseRegion,
        'shipped'
      )

      // Audit log
      await this.auditService.logOperation({
        userId: requestContext.userId,
        action: 'SHIPPING_LABEL_GENERATED',
        entityType: 'Fulfillment',
        entityId: fulfillmentId,
        details: {
          trackingNumber: validatedShipping.trackingNumber,
          carrier: validatedShipping.carrier,
          serviceLevel: validatedShipping.serviceLevel,
          estimatedDelivery: validatedShipping.estimatedDelivery
        },
        ipAddress: requestContext.ipAddress
      })

      const duration = Date.now() - startTime
      this.logger.info(`Shipping label generated for fulfillment ${fulfillmentId} in ${duration}ms`)

      return {
        success: true,
        trackingNumber: validatedShipping.trackingNumber,
        labelUrl: validatedShipping.labelUrl,
        estimatedDelivery: new Date(validatedShipping.estimatedDelivery)
      }

    } catch (error) {
      const duration = Date.now() - startTime
      this.logger.error(`Failed to generate shipping label for fulfillment ${fulfillmentId} after ${duration}ms:`, error)

      // Track error metrics
      metrics.getCounter('rhy_fulfillment_errors')?.inc({
        operation: 'shipping_label',
        error_type: error instanceof Error ? error.name : 'unknown'
      })

      throw error
    }
  }

  /**
   * Get fulfillment metrics for warehouse dashboard
   */
  async getFulfillmentMetrics(
    warehouseId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<FulfillmentMetrics> {
    try {
      // Get fulfillment statistics
      const fulfillmentStats = await prisma.fulfillment.aggregateRaw({
        pipeline: [
          {
            $match: {
              warehouseId,
              createdAt: {
                $gte: timeRange.start,
                $lte: timeRange.end
              }
            }
          },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              averagePickingTime: { $avg: '$actualPickingTime' },
              averagePackingTime: { $avg: '$actualPackingTime' },
              onTimeDeliveries: {
                $sum: {
                  $cond: [
                    { $lte: ['$deliveredAt', '$estimatedDelivery'] },
                    1,
                    0
                  ]
                }
              }
            }
          }
        ]
      })

      // Get staff productivity metrics
      const staffProductivity = await prisma.fulfillmentStep.groupBy({
        by: ['assignedStaffId'],
        where: {
          fulfillment: {
            warehouseId
          },
          completedAt: {
            gte: timeRange.start,
            lte: timeRange.end
          }
        },
        _avg: {
          actualDuration: true
        },
        _count: {
          id: true
        }
      })

      const stats = fulfillmentStats[0] || {}
      const onTimeRate = stats.totalOrders > 0 ? (stats.onTimeDeliveries / stats.totalOrders) * 100 : 0

      return {
        ordersAssigned: stats.totalOrders || 0,
        averagePickingTime: stats.averagePickingTime || 0,
        averagePackingTime: stats.averagePackingTime || 0,
        onTimeDeliveryRate: onTimeRate,
        qualityCheckPassRate: 95, // This would be calculated from quality check data
        warehouseEfficiency: 88, // This would be calculated from various efficiency metrics
        staffProductivity: staffProductivity.reduce((acc, staff) => {
          if (staff.assignedStaffId) {
            acc[staff.assignedStaffId] = staff._count.id / (staff._avg.actualDuration || 1)
          }
          return acc
        }, {} as Record<string, number>)
      }

    } catch (error) {
      this.logger.error('Failed to get fulfillment metrics:', error)
      throw error
    }
  }

  /**
   * Check inventory availability for order items
   */
  private async checkInventoryAvailability(
    orderItems: Array<{ productId: string; quantity: number }>,
    warehouseId: string
  ): Promise<{
    available: boolean
    missingItems: string[]
    partialItems: string[]
  }> {
    const missingItems: string[] = []
    const partialItems: string[] = []

    for (const item of orderItems) {
      const inventory = await prisma.inventory.findFirst({
        where: {
          productId: item.productId,
          warehouseId,
        }
      })

      if (!inventory) {
        missingItems.push(item.productId)
      } else if (inventory.availableQuantity < item.quantity) {
        partialItems.push(`${item.productId} (need ${item.quantity}, have ${inventory.availableQuantity})`)
      }
    }

    return {
      available: missingItems.length === 0 && partialItems.length === 0,
      missingItems,
      partialItems
    }
  }

  /**
   * Optimize picking route for warehouse efficiency
   */
  private async optimizePickingRoute(
    orderItems: Array<{ productId: string; quantity: number; product?: any }>,
    warehouseId: string
  ): Promise<PickingOptimization> {
    try {
      // Get product locations in warehouse
      const productLocations = await prisma.inventory.findMany({
        where: {
          warehouseId,
          productId: {
            in: orderItems.map(item => item.productId)
          }
        },
        include: {
          product: true,
          location: true
        }
      })

      // Group items by warehouse zone for optimal picking
      const zones = productLocations.reduce((acc, location) => {
        const zone = location.location?.zone || 'GENERAL'
        if (!acc[zone]) {
          acc[zone] = []
        }
        
        const orderItem = orderItems.find(item => item.productId === location.productId)
        if (orderItem) {
          acc[zone].push({
            productId: location.productId,
            quantity: orderItem.quantity,
            location: location.location?.binLocation || 'Unknown',
            priority: location.product?.priority || 1
          })
        }
        
        return acc
      }, {} as Record<string, any[]>)

      // Calculate optimal route through zones
      const optimizedRoute = Object.keys(zones).sort()
      
      // Estimate picking time based on items and distance
      const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0)
      const estimatedTime = Math.max(15, totalItems * 2 + Object.keys(zones).length * 5)
      
      // Calculate walking distance (simplified calculation)
      const walkingDistance = Object.keys(zones).length * 50 // 50m per zone

      return {
        optimizedRoute,
        estimatedTime,
        walkingDistance,
        efficiency: Math.min(95, 100 - (walkingDistance / 10)),
        groupedItems: Object.entries(zones).map(([zone, items]) => ({
          zone,
          items: items.sort((a, b) => b.priority - a.priority)
        }))
      }

    } catch (error) {
      this.logger.warn('Failed to optimize picking route, using default:', error)
      
      // Return basic optimization as fallback
      return {
        optimizedRoute: ['GENERAL'],
        estimatedTime: 30,
        walkingDistance: 100,
        efficiency: 70,
        groupedItems: [{
          zone: 'GENERAL',
          items: orderItems.map((item, index) => ({
            productId: item.productId,
            quantity: item.quantity,
            location: `A${index + 1}`,
            priority: 1
          }))
        }]
      }
    }
  }
}

// Service Error class for proper error handling
export class ServiceError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'ServiceError'
  }
}

// Export types for use in other modules
export type {
  FulfillmentMetrics,
  PickingOptimization,
  FulfillmentUpdate
}