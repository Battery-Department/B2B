/**
 * RHY Supplier Portal - Enhanced Order Features Service
 * Enterprise-grade order features for FlexVolt battery suppliers
 * Seamless integration with Batch 1 authentication and warehouse systems
 */

import { rhyPrisma } from '@/lib/rhy-database'
import { authService } from '@/services/auth/AuthService'
import { logAuthEvent } from '@/lib/security'
import { SupplierAuthData, SecurityContext } from '@/types/auth'
import { ComplianceRegion } from '@/types/warehouse'
import { v4 as uuidv4 } from 'uuid'

// Enhanced Order Features Types
export interface OrderTemplate {
  id: string
  supplierId: string
  name: string
  description?: string
  warehouseId: string
  isDefault: boolean
  items: OrderTemplateItem[]
  settings: {
    autoSchedule: boolean
    scheduleInterval?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
    nextScheduledDate?: Date
    notifications: boolean
    approvalRequired: boolean
  }
  createdAt: Date
  updatedAt: Date
}

export interface OrderTemplateItem {
  id: string
  templateId: string
  productId: string
  sku: string
  name: string
  quantity: number
  unitPrice: number
  notes?: string
}

export interface OrderCustomization {
  id: string
  orderId: string
  supplierId: string
  customizations: {
    deliveryInstructions?: string
    packagingRequirements?: string
    labelingRequirements?: string
    qualityRequirements?: string
    urgencyLevel: 'STANDARD' | 'EXPRESS' | 'PRIORITY' | 'EMERGENCY'
    consolidationPreference: 'INDIVIDUAL' | 'CONSOLIDATED' | 'MIXED'
    shippingMethod: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' | 'FREIGHT'
  }
  regionalCompliance: {
    region: ComplianceRegion
    certifications: string[]
    customsDocuments: string[]
    hazmatRequirements?: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface OrderWorkflow {
  id: string
  supplierId: string
  name: string
  description?: string
  steps: OrderWorkflowStep[]
  triggers: {
    orderValue?: number
    productCategories?: string[]
    warehouses?: string[]
    customerTypes?: string[]
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface OrderWorkflowStep {
  id: string
  workflowId: string
  stepNumber: number
  name: string
  type: 'APPROVAL' | 'NOTIFICATION' | 'VALIDATION' | 'PROCESSING' | 'SHIPPING'
  config: {
    assignedTo?: string[]
    timeoutHours?: number
    autoApprove?: boolean
    conditions?: any
  }
  isRequired: boolean
}

// API Response Types
export interface EnhancedOrderFeaturesResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: {
    timestamp: string
    requestId: string
    processingTime: number
  }
}

// Enhanced Order Features Service Class
export class EnhancedOrderFeaturesService {
  private readonly logger = console // In production, use proper logger
  private readonly requestId: string

  constructor() {
    this.requestId = uuidv4()
  }

  /**
   * Create a new order template with Batch 1 authentication integration
   */
  async createOrderTemplate(
    supplier: SupplierAuthData,
    templateData: Omit<OrderTemplate, 'id' | 'supplierId' | 'createdAt' | 'updatedAt'>,
    securityContext: SecurityContext
  ): Promise<EnhancedOrderFeaturesResponse<OrderTemplate>> {
    const startTime = Date.now()
    
    try {
      // Validate warehouse access using Batch 1 foundation
      const hasWarehouseAccess = supplier.warehouseAccess.some(access =>
        access.warehouse === templateData.warehouseId &&
        access.permissions.includes('CREATE_ORDERS') &&
        (!access.expiresAt || access.expiresAt > new Date())
      )

      if (!hasWarehouseAccess) {
        await logAuthEvent('ORDER_TEMPLATE_WAREHOUSE_ACCESS_DENIED', false, securityContext, supplier.id, {
          warehouseId: templateData.warehouseId,
          availableWarehouses: supplier.warehouseAccess.map(w => w.warehouse)
        })

        return {
          success: false,
          error: {
            code: 'WAREHOUSE_ACCESS_DENIED',
            message: 'Access denied to specified warehouse'
          }
        }
      }

      // Create template in database
      const template = await rhyPrisma.orderTemplate.create({
        data: {
          id: uuidv4(),
          supplierId: supplier.id,
          name: templateData.name,
          description: templateData.description,
          warehouseId: templateData.warehouseId,
          isDefault: templateData.isDefault,
          settings: templateData.settings,
          items: {
            create: templateData.items.map(item => ({
              id: uuidv4(),
              productId: item.productId,
              sku: item.sku,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              notes: item.notes
            }))
          }
        },
        include: {
          items: true
        }
      })

      // Audit logging
      await logAuthEvent('ORDER_TEMPLATE_CREATED', true, securityContext, supplier.id, {
        templateId: template.id,
        templateName: template.name,
        warehouseId: template.warehouseId,
        itemCount: template.items.length
      })

      const processingTime = Date.now() - startTime
      this.logger.info(`Order template created successfully in ${processingTime}ms`, {
        templateId: template.id,
        supplierId: supplier.id
      })

      return {
        success: true,
        data: {
          ...template,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt
        } as OrderTemplate,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: this.requestId,
          processingTime
        }
      }

    } catch (error) {
      const processingTime = Date.now() - startTime
      
      await logAuthEvent('ORDER_TEMPLATE_CREATE_ERROR', false, securityContext, supplier.id, {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      })

      this.logger.error('Failed to create order template:', error)

      return {
        success: false,
        error: {
          code: 'TEMPLATE_CREATION_FAILED',
          message: 'Failed to create order template',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: this.requestId,
          processingTime
        }
      }
    }
  }

  /**
   * Get order templates for authenticated supplier
   */
  async getOrderTemplates(
    supplier: SupplierAuthData,
    warehouseId?: string,
    securityContext?: SecurityContext
  ): Promise<EnhancedOrderFeaturesResponse<OrderTemplate[]>> {
    const startTime = Date.now()
    
    try {
      // Build query filters based on warehouse access
      const whereClause: any = {
        supplierId: supplier.id
      }

      if (warehouseId) {
        // Validate warehouse access
        const hasWarehouseAccess = supplier.warehouseAccess.some(access =>
          access.warehouse === warehouseId &&
          access.permissions.includes('VIEW_ORDERS') &&
          (!access.expiresAt || access.expiresAt > new Date())
        )

        if (!hasWarehouseAccess) {
          return {
            success: false,
            error: {
              code: 'WAREHOUSE_ACCESS_DENIED',
              message: 'Access denied to specified warehouse'
            }
          }
        }

        whereClause.warehouseId = warehouseId
      } else {
        // Filter by accessible warehouses
        const accessibleWarehouses = supplier.warehouseAccess
          .filter(access => 
            access.permissions.includes('VIEW_ORDERS') &&
            (!access.expiresAt || access.expiresAt > new Date())
          )
          .map(access => access.warehouse)

        whereClause.warehouseId = {
          in: accessibleWarehouses
        }
      }

      const templates = await rhyPrisma.orderTemplate.findMany({
        where: whereClause,
        include: {
          items: true
        },
        orderBy: [
          { isDefault: 'desc' },
          { updatedAt: 'desc' }
        ]
      })

      const processingTime = Date.now() - startTime

      return {
        success: true,
        data: templates as OrderTemplate[],
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: this.requestId,
          processingTime
        }
      }

    } catch (error) {
      const processingTime = Date.now() - startTime
      
      this.logger.error('Failed to get order templates:', error)

      return {
        success: false,
        error: {
          code: 'TEMPLATE_FETCH_FAILED',
          message: 'Failed to retrieve order templates',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: this.requestId,
          processingTime
        }
      }
    }
  }

  /**
   * Create order customization with regional compliance
   */
  async createOrderCustomization(
    supplier: SupplierAuthData,
    orderId: string,
    customizationData: Omit<OrderCustomization, 'id' | 'orderId' | 'supplierId' | 'createdAt' | 'updatedAt'>,
    securityContext: SecurityContext
  ): Promise<EnhancedOrderFeaturesResponse<OrderCustomization>> {
    const startTime = Date.now()
    
    try {
      // Validate order ownership and permissions
      const order = await rhyPrisma.order.findFirst({
        where: {
          id: orderId,
          supplierId: supplier.id
        }
      })

      if (!order) {
        return {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Order not found or access denied'
          }
        }
      }

      // Create customization
      const customization = await rhyPrisma.orderCustomization.create({
        data: {
          id: uuidv4(),
          orderId,
          supplierId: supplier.id,
          customizations: customizationData.customizations,
          regionalCompliance: customizationData.regionalCompliance
        }
      })

      // Audit logging
      await logAuthEvent('ORDER_CUSTOMIZATION_CREATED', true, securityContext, supplier.id, {
        orderId,
        customizationId: customization.id,
        urgencyLevel: customizationData.customizations.urgencyLevel,
        region: customizationData.regionalCompliance.region
      })

      const processingTime = Date.now() - startTime

      return {
        success: true,
        data: {
          ...customization,
          createdAt: customization.createdAt,
          updatedAt: customization.updatedAt
        } as OrderCustomization,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: this.requestId,
          processingTime
        }
      }

    } catch (error) {
      const processingTime = Date.now() - startTime
      
      await logAuthEvent('ORDER_CUSTOMIZATION_ERROR', false, securityContext, supplier.id, {
        orderId,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      })

      this.logger.error('Failed to create order customization:', error)

      return {
        success: false,
        error: {
          code: 'CUSTOMIZATION_FAILED',
          message: 'Failed to create order customization',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: this.requestId,
          processingTime
        }
      }
    }
  }

  /**
   * Calculate FlexVolt pricing with volume discounts (Batch 1 integration)
   */
  async calculateOrderPricing(
    supplier: SupplierAuthData,
    items: Array<{ productId: string; quantity: number; unitPrice: number }>,
    warehouseId: string
  ): Promise<EnhancedOrderFeaturesResponse<{
    subtotal: number
    discountTier: string
    discountPercentage: number
    discountAmount: number
    total: number
    regionalTax?: number
    finalTotal: number
  }>> {
    const startTime = Date.now()
    
    try {
      // Calculate subtotal
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

      // Volume discount calculation based on Batch 1 business logic
      let discountTier = 'Standard'
      let discountPercentage = 0

      if (subtotal >= 7500) {
        discountTier = 'Enterprise'
        discountPercentage = 25
      } else if (subtotal >= 5000) {
        discountTier = 'Commercial'
        discountPercentage = 20
      } else if (subtotal >= 2500) {
        discountTier = 'Professional'
        discountPercentage = 15
      } else if (subtotal >= 1000) {
        discountTier = 'Contractor'
        discountPercentage = 10
      }

      // Apply tier-based discount eligibility
      const tierDiscounts: Record<string, string[]> = {
        'STANDARD': ['Contractor', 'Professional'],
        'PREMIUM': ['Professional', 'Commercial', 'Enterprise'],
        'ENTERPRISE': ['Commercial', 'Enterprise']
      }

      const eligibleTiers = tierDiscounts[supplier.tier] || []
      if (!eligibleTiers.includes(discountTier)) {
        discountPercentage = 0
        discountTier = 'Standard'
      }

      const discountAmount = subtotal * (discountPercentage / 100)
      const total = subtotal - discountAmount

      // Regional tax calculation (simplified)
      const taxRates: Record<string, number> = {
        'US': 0.08,
        'EU': 0.20,
        'JP': 0.10,
        'AU': 0.10
      }

      const warehouseAccess = supplier.warehouseAccess.find(w => w.warehouse === warehouseId)
      const region = warehouseAccess?.warehouse || 'US'
      const taxRate = taxRates[region] || 0.08
      const regionalTax = total * taxRate
      const finalTotal = total + regionalTax

      const processingTime = Date.now() - startTime

      return {
        success: true,
        data: {
          subtotal,
          discountTier,
          discountPercentage,
          discountAmount,
          total,
          regionalTax,
          finalTotal
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: this.requestId,
          processingTime
        }
      }

    } catch (error) {
      const processingTime = Date.now() - startTime
      
      this.logger.error('Failed to calculate order pricing:', error)

      return {
        success: false,
        error: {
          code: 'PRICING_CALCULATION_FAILED',
          message: 'Failed to calculate order pricing',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: this.requestId,
          processingTime
        }
      }
    }
  }

  /**
   * Validate order against warehouse inventory (real-time integration)
   */
  async validateOrderAvailability(
    supplier: SupplierAuthData,
    items: Array<{ productId: string; quantity: number }>,
    warehouseId: string,
    securityContext: SecurityContext
  ): Promise<EnhancedOrderFeaturesResponse<{
    isValid: boolean
    availabilityDetails: Array<{
      productId: string
      requested: number
      available: number
      isAvailable: boolean
      estimatedRestockDate?: Date
    }>
  }>> {
    const startTime = Date.now()
    
    try {
      // Validate warehouse access
      const hasWarehouseAccess = supplier.warehouseAccess.some(access =>
        access.warehouse === warehouseId &&
        access.permissions.includes('VIEW_INVENTORY') &&
        (!access.expiresAt || access.expiresAt > new Date())
      )

      if (!hasWarehouseAccess) {
        return {
          success: false,
          error: {
            code: 'WAREHOUSE_ACCESS_DENIED',
            message: 'Access denied to warehouse inventory'
          }
        }
      }

      // Check inventory availability
      const availabilityDetails = await Promise.all(
        items.map(async (item) => {
          const inventory = await rhyPrisma.inventoryItem.findFirst({
            where: {
              productId: item.productId,
              warehouseId: warehouseId
            }
          })

          const available = inventory?.availableQuantity || 0
          const isAvailable = available >= item.quantity

          return {
            productId: item.productId,
            requested: item.quantity,
            available,
            isAvailable,
            estimatedRestockDate: inventory?.nextRestockDate || undefined
          }
        })
      )

      const isValid = availabilityDetails.every(detail => detail.isAvailable)

      // Audit logging
      await logAuthEvent('ORDER_AVAILABILITY_CHECK', true, securityContext, supplier.id, {
        warehouseId,
        itemCount: items.length,
        isValid,
        unavailableItems: availabilityDetails.filter(d => !d.isAvailable).length
      })

      const processingTime = Date.now() - startTime

      return {
        success: true,
        data: {
          isValid,
          availabilityDetails
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: this.requestId,
          processingTime
        }
      }

    } catch (error) {
      const processingTime = Date.now() - startTime
      
      await logAuthEvent('ORDER_AVAILABILITY_ERROR', false, securityContext, supplier.id, {
        warehouseId,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      })

      this.logger.error('Failed to validate order availability:', error)

      return {
        success: false,
        error: {
          code: 'AVAILABILITY_CHECK_FAILED',
          message: 'Failed to check order availability',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: this.requestId,
          processingTime
        }
      }
    }
  }

  /**
   * Performance monitoring wrapper
   */
  private async trackPerformance<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    try {
      const result = await fn()
      const duration = Date.now() - startTime
      this.logger.info(`EnhancedOrderFeaturesService.${operation} completed in ${duration}ms`)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      this.logger.error(`EnhancedOrderFeaturesService.${operation} failed after ${duration}ms:`, error)
      throw error
    }
  }
}

// Singleton instance
export const enhancedOrderFeaturesService = new EnhancedOrderFeaturesService()