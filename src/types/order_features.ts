/**
 * RHY Supplier Portal - Enhanced Order Features Types
 * Enterprise-grade TypeScript definitions for advanced order management
 * Seamless integration with Batch 1 authentication and warehouse systems
 */

import { z } from 'zod'
import { ComplianceRegion } from './warehouse'

// ================================
// CORE ORDER FEATURES TYPES
// ================================

export type UrgencyLevel = 'STANDARD' | 'EXPRESS' | 'PRIORITY' | 'EMERGENCY'
export type ConsolidationPreference = 'INDIVIDUAL' | 'CONSOLIDATED' | 'MIXED'
export type ShippingMethod = 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' | 'FREIGHT'
export type ScheduleInterval = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
export type WorkflowStepType = 'APPROVAL' | 'NOTIFICATION' | 'VALIDATION' | 'PROCESSING' | 'SHIPPING'

// Enhanced Order Template
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
    scheduleInterval?: ScheduleInterval
    nextScheduledDate?: Date
    notifications: boolean
    approvalRequired: boolean
    maxBudget?: number
    costCenter?: string
  }
  tags?: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastUsedAt?: Date
  usageCount: number
}

export interface OrderTemplateItem {
  id: string
  templateId: string
  productId: string
  sku: string
  name: string
  description?: string
  quantity: number
  unitPrice: number
  notes?: string
  isOptional: boolean
  category: string
}

// Order Customization with Regional Compliance
export interface OrderCustomization {
  id: string
  orderId: string
  supplierId: string
  customizations: {
    deliveryInstructions?: string
    packagingRequirements?: string
    labelingRequirements?: string
    qualityRequirements?: string
    urgencyLevel: UrgencyLevel
    consolidationPreference: ConsolidationPreference
    shippingMethod: ShippingMethod
    specialHandling?: string[]
    temperatureRequirements?: {
      min: number
      max: number
      unit: 'C' | 'F'
    }
    insuranceRequired?: boolean
    insuranceValue?: number
  }
  regionalCompliance: {
    region: ComplianceRegion
    certifications: string[]
    customsDocuments: string[]
    hazmatRequirements?: string
    importLicense?: string
    exportLicense?: string
    originCertificate?: boolean
    inspectionRequired?: boolean
  }
  deliveryWindow?: {
    startDate: Date
    endDate: Date
    preferredTime?: string
    businessHoursOnly: boolean
  }
  createdAt: Date
  updatedAt: Date
}

// Order Workflow System
export interface OrderWorkflow {
  id: string
  supplierId: string
  name: string
  description?: string
  steps: OrderWorkflowStep[]
  triggers: {
    orderValue?: {
      min?: number
      max?: number
    }
    productCategories?: string[]
    warehouses?: string[]
    customerTypes?: string[]
    urgencyLevels?: UrgencyLevel[]
    supplierTiers?: string[]
  }
  conditions: {
    businessHoursOnly?: boolean
    excludeHolidays?: boolean
    timeZone?: string
    autoEscalationHours?: number
  }
  isActive: boolean
  version: number
  createdAt: Date
  updatedAt: Date
  lastExecutedAt?: Date
  executionCount: number
}

export interface OrderWorkflowStep {
  id: string
  workflowId: string
  stepNumber: number
  name: string
  description?: string
  type: WorkflowStepType
  config: {
    assignedTo?: string[]
    timeoutHours?: number
    autoApprove?: boolean
    escalationPath?: string[]
    conditions?: {
      field: string
      operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in'
      value: any
    }[]
    notifications?: {
      email?: boolean
      sms?: boolean
      webhook?: string
    }
    parallelExecution?: boolean
  }
  isRequired: boolean
  canSkip: boolean
  retryCount: number
  maxRetries: number
}

// Order Analytics and Insights
export interface OrderAnalytics {
  supplierId: string
  warehouseId?: string
  period: {
    start: Date
    end: Date
    granularity: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  }
  metrics: {
    totalOrders: number
    totalValue: number
    averageOrderValue: number
    orderFulfillmentRate: number
    averageProcessingTime: number
    customizationUsage: number
    templateUsage: {
      [templateId: string]: {
        name: string
        uses: number
        value: number
      }
    }
    workflowEfficiency: {
      [workflowId: string]: {
        name: string
        completionRate: number
        averageTime: number
      }
    }
  }
  trends: {
    orderVolume: Array<{ date: string; count: number; value: number }>
    topProducts: Array<{ productId: string; name: string; quantity: number; value: number }>
    urgencyLevelDistribution: Record<UrgencyLevel, number>
    shippingMethodDistribution: Record<ShippingMethod, number>
    regionalDistribution: Record<ComplianceRegion, number>
  }
  insights: {
    seasonalPatterns?: string[]
    optimizationSuggestions?: string[]
    costSavingOpportunities?: Array<{
      type: string
      description: string
      estimatedSavings: number
    }>
  }
  generatedAt: Date
}

// Real-time Order Tracking
export interface OrderTrackingEvent {
  id: string
  orderId: string
  supplierId: string
  warehouseId: string
  eventType: 'CREATED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'DELAYED'
  status: string
  description: string
  location?: {
    address: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  estimatedDelivery?: Date
  actualDelivery?: Date
  carrierInfo?: {
    carrier: string
    trackingNumber: string
    service: string
  }
  metadata?: any
  timestamp: Date
  userId?: string
}

// Order Smart Suggestions
export interface OrderSuggestion {
  id: string
  supplierId: string
  type: 'REORDER' | 'OPTIMIZATION' | 'SEASONAL' | 'BUNDLE' | 'ALTERNATIVE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  title: string
  description: string
  reasoning: string
  suggestedItems: Array<{
    productId: string
    sku: string
    name: string
    suggestedQuantity: number
    currentPrice: number
    confidence: number
  }>
  estimatedSavings?: number
  validUntil: Date
  isDismissed: boolean
  isAccepted: boolean
  createdAt: Date
  metadata?: {
    basedOnOrders?: string[]
    seasonalFactor?: number
    inventoryLevel?: string
    marketTrends?: any
  }
}

// ================================
// API REQUEST/RESPONSE TYPES
// ================================

export interface CreateOrderTemplateRequest {
  name: string
  description?: string
  warehouseId: string
  isDefault?: boolean
  items: Omit<OrderTemplateItem, 'id' | 'templateId'>[]
  settings: OrderTemplate['settings']
  tags?: string[]
}

export interface UpdateOrderTemplateRequest {
  name?: string
  description?: string
  isDefault?: boolean
  items?: Omit<OrderTemplateItem, 'id' | 'templateId'>[]
  settings?: Partial<OrderTemplate['settings']>
  tags?: string[]
  isActive?: boolean
}

export interface CreateOrderCustomizationRequest {
  orderId: string
  customizations: OrderCustomization['customizations']
  regionalCompliance: OrderCustomization['regionalCompliance']
  deliveryWindow?: OrderCustomization['deliveryWindow']
}

export interface CreateOrderWorkflowRequest {
  name: string
  description?: string
  steps: Omit<OrderWorkflowStep, 'id' | 'workflowId'>[]
  triggers: OrderWorkflow['triggers']
  conditions?: OrderWorkflow['conditions']
}

export interface OrderPricingRequest {
  items: Array<{
    productId: string
    sku: string
    quantity: number
    unitPrice: number
  }>
  warehouseId: string
  customizations?: {
    urgencyLevel?: UrgencyLevel
    shippingMethod?: ShippingMethod
    insuranceRequired?: boolean
  }
}

export interface OrderPricingResponse {
  subtotal: number
  discountTier: string
  discountPercentage: number
  discountAmount: number
  shippingCost: number
  insuranceCost?: number
  taxes: {
    regional: number
    customs?: number
    total: number
  }
  total: number
  breakdown: Array<{
    type: string
    description: string
    amount: number
  }>
  validUntil: Date
}

export interface OrderAvailabilityRequest {
  items: Array<{
    productId: string
    quantity: number
  }>
  warehouseId: string
  requestedDeliveryDate?: Date
}

export interface OrderAvailabilityResponse {
  isValid: boolean
  availability: Array<{
    productId: string
    sku: string
    name: string
    requested: number
    available: number
    reserved: number
    isAvailable: boolean
    estimatedRestockDate?: Date
    alternativeProducts?: Array<{
      productId: string
      sku: string
      name: string
      available: number
      compatibilityScore: number
    }>
  }>
  alternatives?: {
    warehouseId: string
    warehouseName: string
    availability: OrderAvailabilityResponse['availability']
    additionalShippingTime: number
    additionalCost: number
  }[]
  recommendedDeliveryDate?: Date
}

// ================================
// VALIDATION SCHEMAS
// ================================

export const urgencyLevelSchema = z.enum(['STANDARD', 'EXPRESS', 'PRIORITY', 'EMERGENCY'])
export const consolidationPreferenceSchema = z.enum(['INDIVIDUAL', 'CONSOLIDATED', 'MIXED'])
export const shippingMethodSchema = z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT', 'FREIGHT'])
export const scheduleIntervalSchema = z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY'])
export const workflowStepTypeSchema = z.enum(['APPROVAL', 'NOTIFICATION', 'VALIDATION', 'PROCESSING', 'SHIPPING'])

export const orderTemplateItemSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  notes: z.string().max(500).optional(),
  isOptional: z.boolean().default(false),
  category: z.string().min(1)
})

export const createOrderTemplateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  warehouseId: z.string().min(1),
  isDefault: z.boolean().default(false),
  items: z.array(orderTemplateItemSchema).min(1).max(100),
  settings: z.object({
    autoSchedule: z.boolean(),
    scheduleInterval: scheduleIntervalSchema.optional(),
    nextScheduledDate: z.date().optional(),
    notifications: z.boolean(),
    approvalRequired: z.boolean(),
    maxBudget: z.number().positive().optional(),
    costCenter: z.string().max(50).optional()
  }),
  tags: z.array(z.string().max(50)).max(20).optional()
})

export const updateOrderTemplateSchema = createOrderTemplateSchema.partial()

export const orderCustomizationSchema = z.object({
  customizations: z.object({
    deliveryInstructions: z.string().max(1000).optional(),
    packagingRequirements: z.string().max(500).optional(),
    labelingRequirements: z.string().max(500).optional(),
    qualityRequirements: z.string().max(500).optional(),
    urgencyLevel: urgencyLevelSchema,
    consolidationPreference: consolidationPreferenceSchema,
    shippingMethod: shippingMethodSchema,
    specialHandling: z.array(z.string()).max(10).optional(),
    temperatureRequirements: z.object({
      min: z.number(),
      max: z.number(),
      unit: z.enum(['C', 'F'])
    }).optional(),
    insuranceRequired: z.boolean().optional(),
    insuranceValue: z.number().positive().optional()
  }),
  regionalCompliance: z.object({
    region: z.enum(['US', 'EU', 'JAPAN', 'AUSTRALIA']),
    certifications: z.array(z.string()).max(20),
    customsDocuments: z.array(z.string()).max(20),
    hazmatRequirements: z.string().max(500).optional(),
    importLicense: z.string().max(100).optional(),
    exportLicense: z.string().max(100).optional(),
    originCertificate: z.boolean().optional(),
    inspectionRequired: z.boolean().optional()
  }),
  deliveryWindow: z.object({
    startDate: z.date(),
    endDate: z.date(),
    preferredTime: z.string().optional(),
    businessHoursOnly: z.boolean()
  }).optional()
})

export const createOrderCustomizationSchema = z.object({
  orderId: z.string().min(1),
  ...orderCustomizationSchema.shape
})

export const orderPricingRequestSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    sku: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().positive()
  })).min(1).max(100),
  warehouseId: z.string().min(1),
  customizations: z.object({
    urgencyLevel: urgencyLevelSchema.optional(),
    shippingMethod: shippingMethodSchema.optional(),
    insuranceRequired: z.boolean().optional()
  }).optional()
})

export const orderAvailabilityRequestSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().positive()
  })).min(1).max(100),
  warehouseId: z.string().min(1),
  requestedDeliveryDate: z.date().optional()
})

// ================================
// UTILITY TYPES
// ================================

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
    cacheHit?: boolean
  }
}

export interface OrderFeaturesPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface OrderFeaturesFilters {
  warehouseId?: string
  isActive?: boolean
  tags?: string[]
  createdAfter?: Date
  createdBefore?: Date
  lastUsedAfter?: Date
  usageCountMin?: number
  searchTerm?: string
  sortBy?: keyof OrderTemplate
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// ================================
// TYPE GUARDS AND VALIDATION
// ================================

export const validateCreateOrderTemplate = (data: unknown): CreateOrderTemplateRequest => {
  return createOrderTemplateSchema.parse(data)
}

export const validateUpdateOrderTemplate = (data: unknown): UpdateOrderTemplateRequest => {
  return updateOrderTemplateSchema.parse(data)
}

export const validateCreateOrderCustomization = (data: unknown): CreateOrderCustomizationRequest => {
  return createOrderCustomizationSchema.parse(data)
}

export const validateOrderPricingRequest = (data: unknown): OrderPricingRequest => {
  return orderPricingRequestSchema.parse(data)
}

export const validateOrderAvailabilityRequest = (data: unknown): OrderAvailabilityRequest => {
  return orderAvailabilityRequestSchema.parse(data)
}

// Type guards
export const isOrderTemplate = (value: unknown): value is OrderTemplate => {
  try {
    return typeof value === 'object' && 
           value !== null && 
           'id' in value && 
           'supplierId' in value && 
           'name' in value && 
           'items' in value
  } catch {
    return false
  }
}

export const isOrderCustomization = (value: unknown): value is OrderCustomization => {
  try {
    return typeof value === 'object' && 
           value !== null && 
           'id' in value && 
           'orderId' in value && 
           'customizations' in value
  } catch {
    return false
  }
}

export const isUrgencyLevel = (value: unknown): value is UrgencyLevel => {
  return typeof value === 'string' && 
         ['STANDARD', 'EXPRESS', 'PRIORITY', 'EMERGENCY'].includes(value)
}

export const isShippingMethod = (value: unknown): value is ShippingMethod => {
  return typeof value === 'string' && 
         ['STANDARD', 'EXPRESS', 'OVERNIGHT', 'FREIGHT'].includes(value)
}

// ================================
// HELPER FUNCTIONS
// ================================

export const orderFeaturesUtils = {
  // Calculate template usage statistics
  calculateTemplateUsage: (template: OrderTemplate): {
    usageFrequency: 'LOW' | 'MEDIUM' | 'HIGH'
    lastUsedDays: number
    averageOrderValue?: number
  } => {
    const lastUsedDays = template.lastUsedAt 
      ? Math.floor((Date.now() - template.lastUsedAt.getTime()) / (1000 * 60 * 60 * 24))
      : -1

    let usageFrequency: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
    if (template.usageCount > 50) usageFrequency = 'HIGH'
    else if (template.usageCount > 10) usageFrequency = 'MEDIUM'

    return {
      usageFrequency,
      lastUsedDays,
      averageOrderValue: template.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    }
  },

  // Calculate urgency level upgrade cost
  calculateUrgencyUpgradeCost: (
    baseShippingCost: number, 
    fromLevel: UrgencyLevel, 
    toLevel: UrgencyLevel
  ): number => {
    const upgradeCosts = {
      'STANDARD': { 'EXPRESS': 0.5, 'PRIORITY': 1.0, 'EMERGENCY': 2.0 },
      'EXPRESS': { 'PRIORITY': 0.5, 'EMERGENCY': 1.5 },
      'PRIORITY': { 'EMERGENCY': 1.0 }
    }

    const multiplier = upgradeCosts[fromLevel]?.[toLevel] || 0
    return baseShippingCost * multiplier
  },

  // Generate order workflow recommendations
  generateWorkflowRecommendations: (
    orderValue: number,
    urgencyLevel: UrgencyLevel,
    supplierTier: string
  ): string[] => {
    const recommendations = []

    if (orderValue > 10000) {
      recommendations.push('Require manager approval for high-value orders')
    }

    if (urgencyLevel === 'EMERGENCY') {
      recommendations.push('Enable 24/7 processing for emergency orders')
    }

    if (supplierTier === 'ENTERPRISE') {
      recommendations.push('Apply expedited processing for enterprise customers')
    }

    return recommendations
  },

  // Calculate delivery window optimization
  optimizeDeliveryWindow: (
    requestedDate: Date,
    warehouseCapacity: number,
    urgencyLevel: UrgencyLevel
  ): {
    optimizedStartDate: Date
    optimizedEndDate: Date
    confidenceScore: number
    reasons: string[]
  } => {
    const reasons = []
    let adjustmentDays = 0

    if (urgencyLevel === 'STANDARD' && warehouseCapacity > 0.8) {
      adjustmentDays = 2
      reasons.push('High warehouse capacity utilization')
    }

    if (urgencyLevel === 'EMERGENCY') {
      adjustmentDays = -1
      reasons.push('Emergency priority processing')
    }

    const optimizedStartDate = new Date(requestedDate.getTime() + (adjustmentDays * 24 * 60 * 60 * 1000))
    const optimizedEndDate = new Date(optimizedStartDate.getTime() + (2 * 24 * 60 * 60 * 1000))

    return {
      optimizedStartDate,
      optimizedEndDate,
      confidenceScore: Math.max(0.7, 1 - (Math.abs(adjustmentDays) * 0.1)),
      reasons
    }
  }
}

// ================================
// CONSTANTS
// ================================

export const ORDER_FEATURES_CONSTANTS = {
  MAX_TEMPLATE_ITEMS: 100,
  MAX_TEMPLATES_PER_SUPPLIER: 50,
  MAX_WORKFLOW_STEPS: 20,
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
  CACHE_TTL_SECONDS: 300,
  PRICING_VALID_HOURS: 24,
  AVAILABILITY_CACHE_MINUTES: 5,
  MAX_BULK_OPERATIONS: 1000
} as const