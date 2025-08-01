/**
 * RHY_052: Bulk Order Management Types
 * TypeScript definitions for enterprise bulk order system
 */

export interface BulkOrderRequest {
  items: BulkOrderItem[]
  deliveryAddress?: DeliveryAddress
  preferredWarehouses?: string[]
  notes?: string
  requestedDeliveryDate?: Date
  paymentTerms?: 'NET_15' | 'NET_30' | 'NET_60' | 'IMMEDIATE'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
}

export interface BulkOrderItem {
  productId: string
  sku: string
  name: string
  quantity: number
  unitPrice: number
  specifications?: Record<string, any>
  customizations?: Record<string, any>
  notes?: string
}

export interface DeliveryAddress {
  companyName?: string
  contactName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phoneNumber?: string
  deliveryInstructions?: string
}

export interface BulkOrderResponse {
  success: boolean
  bulkOrderId: string
  status?: BulkOrderStatus
  routing?: WarehouseRouting
  pricing?: VolumeDiscountCalculation
  reservations?: Array<{
    warehouseId: string
    productId: string
    quantity: number
    reservationId: string
  }>
  estimatedCompletionTime?: Date
  individualOrders?: string[]
  errors?: string[]
  warnings?: string[]
  processingTime: number
  trackingUrl?: string
}

export type BulkOrderStatus = 
  | 'DRAFT'
  | 'VALIDATING'
  | 'PROCESSING'
  | 'ROUTING'
  | 'RESERVING_INVENTORY'
  | 'CREATING_ORDERS'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export interface BulkOrderValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  estimatedTotal: number
  validatedItems: number
}

export interface BulkOrderProcessingResult {
  bulkOrderId: string
  status: BulkOrderStatus
  totalItems: number
  processedItems: number
  failedItems: number
  individualOrders: string[]
  errors: string[]
  processingTime: number
  completedAt?: Date
}

export interface WarehouseRouting {
  warehouseAllocations: Record<string, BulkOrderItem[]>
  shippingCosts: Record<string, number>
  estimatedDeliveryTimes: Record<string, Date>
  optimizationScore: number
  routingStrategy: 'SINGLE_WAREHOUSE' | 'MULTI_WAREHOUSE_OPTIMAL' | 'FASTEST_DELIVERY' | 'LOWEST_COST'
  totalShippingCost: number
  earliestDelivery: Date
  latestDelivery: Date
  consolidationOpportunities?: Array<{
    warehouseIds: string[]
    potentialSavings: number
    tradeoffs: string[]
  }>
}

export interface VolumeDiscountCalculation {
  subtotal: number
  totalDiscount: number
  discountedSubtotal: number
  shipping: number
  tax: number
  finalTotal: number
  discountTier: FlexVoltPricingTier
  breakdown: {
    volumeDiscount: number
    tierDiscount: number
    seasonalDiscount: number
    flexVoltDiscount: number
    loyaltyDiscount?: number
    contractDiscount?: number
  }
  itemBreakdown: Array<{
    productId: string
    quantity: number
    unitPrice: number
    lineTotal: number
    discountApplied: number
  }>
  taxRate: number
  savings: {
    amount: number
    percentage: number
  }
}

export interface FlexVoltPricingTier {
  tierName: 'Contractor' | 'Professional' | 'Commercial' | 'Enterprise'
  threshold: number
  discountPercentage: number
  eligibleCustomerTypes: string[]
  benefits?: string[]
  requirements?: string[]
}

export interface BulkOrderProgress {
  bulkOrderId: string
  currentStage: BulkOrderStatus
  stages: Array<{
    stage: BulkOrderStatus
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
    startTime?: Date
    endTime?: Date
    details?: string
    errors?: string[]
  }>
  overallProgress: number
  estimatedTimeRemaining?: number
  individualOrderProgress: Array<{
    orderId: string
    warehouseId: string
    status: string
    items: number
    progress: number
  }>
}

export interface BulkOrderSummary {
  bulkOrderId: string
  supplierId: string
  status: BulkOrderStatus
  totalItems: number
  totalQuantity: number
  totalValue: number
  warehousesInvolved: string[]
  createdAt: Date
  updatedAt: Date
  estimatedCompletion?: Date
  actualCompletion?: Date
  individualOrderCount: number
  completedOrderCount: number
  failedOrderCount: number
}

export interface BulkOrderAnalytics {
  orderMetrics: {
    totalBulkOrders: number
    averageOrderSize: number
    averageProcessingTime: number
    successRate: number
    averageDiscount: number
  }
  warehouseUtilization: Record<string, {
    ordersProcessed: number
    itemsShipped: number
    utilizationRate: number
    performanceScore: number
  }>
  supplierInsights: {
    topSuppliers: Array<{
      supplierId: string
      companyName: string
      totalOrders: number
      totalValue: number
      averageOrderSize: number
    }>
    categoryBreakdown: Record<string, {
      orderCount: number
      totalValue: number
      averageDiscount: number
    }>
  }
  trendAnalysis: {
    monthlyVolume: Array<{
      month: string
      orderCount: number
      totalValue: number
      averageSize: number
    }>
    seasonalPatterns: Record<string, number>
    growthMetrics: {
      monthOverMonth: number
      yearOverYear: number
      projectedGrowth: number
    }
  }
}

export interface BulkOrderNotification {
  bulkOrderId: string
  type: 'STATUS_UPDATE' | 'COMPLETION' | 'ERROR' | 'DELAY' | 'SHIPMENT'
  title: string
  message: string
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
  timestamp: Date
  actionRequired: boolean
  actionUrl?: string
  metadata?: Record<string, any>
}

export interface BulkOrderExport {
  format: 'CSV' | 'XLSX' | 'PDF' | 'JSON'
  filters: {
    dateRange?: { start: Date; end: Date }
    status?: BulkOrderStatus[]
    suppliers?: string[]
    warehouses?: string[]
    minValue?: number
    maxValue?: number
  }
  includeDetails: boolean
  includeAnalytics: boolean
  groupBy?: 'SUPPLIER' | 'WAREHOUSE' | 'STATUS' | 'DATE'
}

export interface BulkOrderImport {
  format: 'CSV' | 'XLSX' | 'JSON'
  mapping: Record<string, string>
  validation: {
    validateProducts: boolean
    validateInventory: boolean
    validatePricing: boolean
    allowPartialImport: boolean
  }
  defaultValues?: Partial<BulkOrderRequest>
}

export interface BulkOrderTemplate {
  id: string
  name: string
  description?: string
  supplierId: string
  items: BulkOrderItem[]
  defaultDeliveryAddress?: DeliveryAddress
  preferredWarehouses?: string[]
  paymentTerms?: string
  notes?: string
  isPublic: boolean
  usageCount: number
  lastUsed?: Date
  createdAt: Date
  updatedAt: Date
}

export interface BulkOrderSchedule {
  id: string
  bulkOrderId?: string
  templateId?: string
  supplierId: string
  schedule: {
    frequency: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
    interval?: number
    dayOfWeek?: number
    dayOfMonth?: number
    time?: string
    timezone?: string
  }
  nextRun: Date
  lastRun?: Date
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED'
  failureCount: number
  maxFailures: number
  createdAt: Date
  updatedAt: Date
}

export interface BulkOrderApproval {
  bulkOrderId: string
  requiredApprovals: Array<{
    level: 'MANAGER' | 'FINANCE' | 'EXECUTIVE'
    threshold: number
    approvers: string[]
    required: boolean
  }>
  currentApprovals: Array<{
    level: string
    approverId: string
    approverName: string
    approved: boolean
    approvedAt?: Date
    comments?: string
    conditions?: string[]
  }>
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  autoApproval: boolean
  approvalDeadline?: Date
  escalationRules?: Array<{
    condition: string
    action: string
    delay: number
  }>
}

export interface BulkOrderContractPricing {
  supplierId: string
  contractId: string
  effectiveDate: Date
  expirationDate?: Date
  pricingRules: Array<{
    productCategory?: string
    productIds?: string[]
    minimumQuantity?: number
    maximumQuantity?: number
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'TIERED'
    discountValue: number
    conditions?: string[]
  }>
  paymentTerms: {
    terms: string
    discountForEarlyPayment?: number
    penaltyForLatePayment?: number
  }
  deliveryTerms: {
    freeShippingThreshold?: number
    expeditedShippingDiscount?: number
    warehousePriorities?: string[]
  }
  isActive: boolean
  metadata?: Record<string, any>
}

export interface BulkOrderRiskAssessment {
  bulkOrderId: string
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  riskFactors: Array<{
    factor: string
    impact: number
    probability: number
    score: number
    mitigation?: string
  }>
  recommendations: Array<{
    action: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    estimatedImpact: string
    timeToImplement: string
  }>
  complianceChecks: Array<{
    regulation: string
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW'
    details?: string
    requiredActions?: string[]
  }>
  creditCheck: {
    creditScore: number
    creditLimit: number
    currentExposure: number
    recommendation: 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'REJECT'
    conditions?: string[]
  }
  assessedAt: Date
  assessedBy: string
  validUntil: Date
}

// Utility types for API responses
export interface BulkOrderAPIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  warnings?: string[]
  metadata?: {
    timestamp: string
    requestId: string
    processingTime: number
    version: string
  }
}

export interface PaginatedBulkOrderResponse<T = any> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  nextPage?: number
  filters?: Record<string, any>
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

// Event types for real-time updates
export interface BulkOrderEvent {
  eventId: string
  bulkOrderId: string
  eventType: 'CREATED' | 'UPDATED' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'SHIPPED'
  timestamp: Date
  data: Record<string, any>
  supplierId: string
  warehouseId?: string
  metadata?: Record<string, any>
}

// Configuration types
export interface BulkOrderConfiguration {
  maxItemsPerOrder: number
  maxOrdersPerHour: Record<string, number> // By supplier tier
  defaultProcessingTimeout: number
  requireApprovalThreshold: Record<string, number> // By supplier tier
  autoApprovalRules: Array<{
    condition: string
    threshold: number
    supplierTiers: string[]
  }>
  warehouseRoutingPreferences: Record<string, {
    preferLocalWarehouse: boolean
    consolidationThreshold: number
    expeditedShippingThreshold: number
  }>
  notificationPreferences: {
    statusUpdates: boolean
    completionNotifications: boolean
    errorAlerts: boolean
    performanceReports: boolean
  }
  integrationSettings: {
    erpSyncEnabled: boolean
    accountingSystemSync: boolean
    shippingProviderIntegration: boolean
    inventorySystemSync: boolean
  }
}