/**
 * Order Management Types - RHY_053
 * Comprehensive TypeScript definitions for advanced order tracking system
 * Enterprise-grade types for FlexVolt battery operations across 4 global warehouses
 */

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customerType: 'DIRECT' | 'DISTRIBUTOR' | 'FLEET' | 'SERVICE' | 'RETAILER'
  warehouseId: string
  warehouseRegion: 'US' | 'EU' | 'JP' | 'AU'
  status: OrderStatus
  priority: OrderPriority
  items: OrderItem[]
  pricing: OrderPricing
  shipping: ShippingDetails
  payment: PaymentDetails
  tracking: TrackingInfo
  fulfillment: FulfillmentDetails
  compliance: ComplianceInfo
  audit: AuditTrail[]
  createdAt: string
  updatedAt: string
  estimatedDelivery: string
  actualDelivery?: string
  metadata: OrderMetadata
}

export type OrderStatus = 
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'fulfillment'
  | 'picking'
  | 'packing'
  | 'ready_to_ship'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'returned'
  | 'refunded'
  | 'failed'

export type OrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'EXPEDITED'

export interface OrderItem {
  id: string
  productId: string
  productSku: string
  name: string
  description: string
  category: 'FLEXVOLT_6AH' | 'FLEXVOLT_9AH' | 'FLEXVOLT_15AH'
  quantity: number
  unitPrice: number
  totalPrice: number
  discountAmount: number
  weight: number
  dimensions: ProductDimensions
  specifications: FlexVoltSpecs
  inventory: ItemInventoryInfo
  fulfillment: ItemFulfillmentInfo
}

export interface ProductDimensions {
  length: number
  width: number
  height: number
  unit: 'mm' | 'in'
}

export interface FlexVoltSpecs {
  voltage: '20V' | '60V' | '20V/60V MAX'
  capacity: '6Ah' | '9Ah' | '15Ah'
  runtime: string
  compatibility: string[]
  powerClass: 'PROFESSIONAL' | 'HEAVY_DUTY' | 'MAXIMUM_POWER'
  certifications: string[]
}

export interface OrderPricing {
  subtotal: number
  discountAmount: number
  discountPercentage: number
  discountTier: 'CONTRACTOR' | 'PROFESSIONAL' | 'COMMERCIAL' | 'ENTERPRISE'
  taxAmount: number
  taxRate: number
  shippingAmount: number
  handlingFee: number
  total: number
  currency: string
  exchangeRate?: number
  regionalAdjustments: RegionalPricingAdjustment[]
}

export interface RegionalPricingAdjustment {
  type: 'TAX' | 'DUTY' | 'DISCOUNT' | 'SURCHARGE'
  amount: number
  description: string
  regulation: string
}

export interface ShippingDetails {
  method: 'STANDARD' | 'EXPEDITED' | 'OVERNIGHT' | 'FREIGHT'
  carrier: string
  service: string
  trackingNumber?: string
  address: ShippingAddress
  instructions?: string
  signatureRequired: boolean
  insuranceAmount: number
  packaging: PackagingInfo
  estimatedDelivery: string
  guaranteedDelivery?: string
}

export interface ShippingAddress {
  firstName: string
  lastName: string
  company?: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  email?: string
  isResidential: boolean
  accessCodes?: string
  deliveryInstructions?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
}

export interface PackagingInfo {
  type: 'BOX' | 'ENVELOPE' | 'PALLET' | 'CUSTOM'
  weight: number
  dimensions: ProductDimensions
  fragile: boolean
  hazmat: boolean
  specialHandling?: string[]
}

export interface PaymentDetails {
  method: 'CREDIT_CARD' | 'ACH' | 'WIRE' | 'NET_TERMS' | 'PURCHASE_ORDER'
  status: 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED'
  transactionId?: string
  authorizationCode?: string
  last4?: string
  brand?: string
  processedAt?: string
  amount: number
  fees: PaymentFee[]
}

export interface PaymentFee {
  type: 'PROCESSING' | 'GATEWAY' | 'INTERNATIONAL' | 'RISK'
  amount: number
  description: string
}

export interface TrackingInfo {
  trackingNumber?: string
  carrier: string
  service: string
  events: TrackingEvent[]
  currentStatus: TrackingStatus
  currentLocation?: TrackingLocation
  estimatedDelivery: string
  deliveryConfirmation?: DeliveryConfirmation
  lastUpdated: string
  nextUpdate?: string
}

export interface TrackingEvent {
  id: string
  timestamp: string
  status: TrackingStatus
  description: string
  location?: TrackingLocation
  details?: string
  eventCode?: string
  signature?: string
}

export type TrackingStatus = 
  | 'LABEL_CREATED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'ARRIVED_AT_FACILITY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERY_ATTEMPTED'
  | 'DELIVERED'
  | 'EXCEPTION'
  | 'RETURNED'

export interface TrackingLocation {
  name: string
  address: string
  city: string
  state: string
  country: string
  coordinates?: {
    latitude: number
    longitude: number
  }
}

export interface DeliveryConfirmation {
  timestamp: string
  signature?: string
  receivedBy: string
  photo?: string
  notes?: string
}

export interface FulfillmentDetails {
  warehouseId: string
  warehouseName: string
  pickingSlot?: string
  packingStation?: string
  pickingStarted?: string
  pickingCompleted?: string
  packingStarted?: string
  packingCompleted?: string
  readyToShip?: string
  shippedAt?: string
  fulfillmentStaff: FulfillmentStaff[]
  qualityChecks: QualityCheck[]
  specialInstructions?: string[]
}

export interface FulfillmentStaff {
  id: string
  name: string
  role: 'PICKER' | 'PACKER' | 'QUALITY' | 'SUPERVISOR'
  timestamp: string
}

export interface QualityCheck {
  id: string
  type: 'VISUAL' | 'FUNCTIONAL' | 'PACKAGING' | 'DOCUMENTATION'
  status: 'PASSED' | 'FAILED' | 'WARNING'
  inspector: string
  timestamp: string
  notes?: string
  images?: string[]
}

export interface ComplianceInfo {
  region: 'US' | 'EU' | 'JP' | 'AU'
  regulations: ComplianceRegulation[]
  certifications: ComplianceCertification[]
  restrictions?: ComplianceRestriction[]
  documentation: ComplianceDocument[]
}

export interface ComplianceRegulation {
  type: 'OSHA' | 'CE' | 'JIS' | 'AS_NZS' | 'FCC' | 'RoHS'
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING'
  validatedAt?: string
  validator?: string
  notes?: string
}

export interface ComplianceCertification {
  name: string
  number: string
  issuer: string
  issuedAt: string
  expiresAt?: string
  documentUrl?: string
}

export interface ComplianceRestriction {
  type: 'SHIPPING' | 'USAGE' | 'DISPOSAL' | 'STORAGE'
  description: string
  severity: 'WARNING' | 'ERROR' | 'CRITICAL'
  impact: string
}

export interface ComplianceDocument {
  type: 'MSDS' | 'CERTIFICATE' | 'MANIFEST' | 'CUSTOMS' | 'INVOICE'
  name: string
  url: string
  required: boolean
  generated: boolean
  validatedAt?: string
}

export interface AuditTrail {
  id: string
  timestamp: string
  userId: string
  userType: 'CUSTOMER' | 'STAFF' | 'SYSTEM' | 'API'
  action: AuditAction
  entity: string
  entityId: string
  changes: AuditChange[]
  reason?: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
}

export type AuditAction = 
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'APPROVE'
  | 'REJECT'
  | 'CANCEL'
  | 'REFUND'
  | 'SHIP'
  | 'DELIVER'

export interface AuditChange {
  field: string
  oldValue: any
  newValue: any
  changeType: 'ADDED' | 'MODIFIED' | 'REMOVED'
}

export interface OrderMetadata {
  source: 'WEB' | 'MOBILE' | 'API' | 'PHONE' | 'EMAIL'
  channel: 'DIRECT' | 'DISTRIBUTOR' | 'MARKETPLACE' | 'B2B_PORTAL'
  campaign?: string
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  customerNotes?: string
  internalNotes?: string
  tags: string[]
  customFields: Record<string, any>
  integrationData?: IntegrationData
}

export interface IntegrationData {
  erpOrderId?: string
  crmContactId?: string
  accountingReference?: string
  externalReferences: Record<string, string>
}

export interface ItemInventoryInfo {
  warehouseStock: number
  reservedQuantity: number
  availableQuantity: number
  backorderQuantity?: number
  allocationStatus: 'ALLOCATED' | 'PARTIALLY_ALLOCATED' | 'BACKORDER' | 'OUT_OF_STOCK'
  allocationTimestamp?: string
  expectedRestockDate?: string
}

export interface ItemFulfillmentInfo {
  status: 'PENDING' | 'PICKING' | 'PICKED' | 'PACKING' | 'PACKED' | 'SHIPPED'
  location?: string
  picker?: string
  packer?: string
  pickingTimestamp?: string
  packingTimestamp?: string
  serialNumbers?: string[]
  batchNumbers?: string[]
  expirationDates?: string[]
}

// Order Query and Filter Types
export interface OrderQuery {
  page?: number
  limit?: number
  search?: string
  status?: OrderStatus[]
  customerType?: string[]
  warehouseRegion?: string[]
  priority?: OrderPriority[]
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
  sortBy?: OrderSortField
  sortOrder?: 'ASC' | 'DESC'
  includeAudit?: boolean
  includeTracking?: boolean
}

export type OrderSortField = 
  | 'createdAt'
  | 'updatedAt'
  | 'orderNumber'
  | 'total'
  | 'status'
  | 'estimatedDelivery'
  | 'priority'

export interface OrderQueryResult {
  orders: Order[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  metadata: OrderQueryMetadata
}

export interface OrderQueryMetadata {
  statusBreakdown: Record<OrderStatus, number>
  totalValue: number
  averageOrderValue: number
  regionBreakdown: Record<string, number>
  fulfillmentMetrics: FulfillmentMetrics
}

export interface FulfillmentMetrics {
  averageProcessingTime: number
  averageFulfillmentTime: number
  onTimeDeliveryRate: number
  qualityScore: number
  customerSatisfactionScore: number
}

// Order Modification Types
export interface OrderModification {
  type: OrderModificationType
  items?: OrderItemModification[]
  shipping?: Partial<ShippingDetails>
  payment?: Partial<PaymentDetails>
  priority?: OrderPriority
  metadata?: Partial<OrderMetadata>
  reason: string
  requestedBy: string
  requestedAt: string
  approvalRequired: boolean
  approvedBy?: string
  approvedAt?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED'
}

export type OrderModificationType = 
  | 'ADD_ITEM'
  | 'REMOVE_ITEM'
  | 'UPDATE_QUANTITY'
  | 'UPDATE_SHIPPING'
  | 'UPDATE_PAYMENT'
  | 'CHANGE_PRIORITY'
  | 'APPLY_DISCOUNT'
  | 'CANCEL_ORDER'

export interface OrderItemModification {
  itemId?: string
  productId?: string
  quantity?: number
  action: 'ADD' | 'REMOVE' | 'UPDATE'
}

// Real-time update types
export interface OrderUpdate {
  orderId: string
  updateType: OrderUpdateType
  data: any
  timestamp: string
  source: 'WAREHOUSE' | 'CARRIER' | 'PAYMENT' | 'SYSTEM' | 'USER'
}

export type OrderUpdateType = 
  | 'STATUS_CHANGE'
  | 'TRACKING_UPDATE'
  | 'PAYMENT_UPDATE'
  | 'FULFILLMENT_UPDATE'
  | 'SHIPPING_UPDATE'
  | 'DELIVERY_UPDATE'

// Order Analytics Types
export interface OrderAnalytics {
  period: 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'
  metrics: OrderMetrics
  trends: OrderTrend[]
  breakdown: OrderBreakdown
  performance: PerformanceMetrics
}

export interface OrderMetrics {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  orderGrowthRate: number
  revenueGrowthRate: number
  customerRetentionRate: number
}

export interface OrderTrend {
  date: string
  orders: number
  revenue: number
  averageOrderValue: number
}

export interface OrderBreakdown {
  byStatus: Record<OrderStatus, number>
  byRegion: Record<string, number>
  byCustomerType: Record<string, number>
  byProduct: Record<string, number>
}

export interface PerformanceMetrics {
  fulfillmentAccuracy: number
  onTimeDeliveryRate: number
  orderProcessingTime: number
  customerSatisfaction: number
  returnRate: number
  refundRate: number
}

// Error and Response Types
export interface OrderError {
  code: string
  message: string
  details?: any
  timestamp: string
  requestId: string
}

export interface OrderResponse<T = any> {
  success: boolean
  data?: T
  error?: OrderError
  metadata?: {
    requestId: string
    timestamp: string
    version: string
  }
}

// API Response Types
export interface CreateOrderRequest {
  customerId: string
  items: Omit<OrderItem, 'id' | 'totalPrice' | 'inventory' | 'fulfillment'>[]
  shipping: Omit<ShippingDetails, 'trackingNumber' | 'estimatedDelivery'>
  payment: Omit<PaymentDetails, 'status' | 'transactionId' | 'processedAt'>
  metadata?: Partial<OrderMetadata>
  priorityRequest?: OrderPriority
}

export interface UpdateOrderRequest {
  orderId: string
  modifications: OrderModification[]
}

export interface TrackOrderRequest {
  orderId: string
  includeEvents?: boolean
  includeLocation?: boolean
}

export interface OrderSearchRequest extends OrderQuery {
  // Additional search-specific fields
}

// Webhook and Event Types
export interface OrderWebhookEvent {
  id: string
  type: string
  orderId: string
  data: any
  timestamp: string
  version: string
}

// Export utility type for order status transitions
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  'draft': ['pending', 'cancelled'],
  'pending': ['confirmed', 'cancelled'],
  'confirmed': ['processing', 'cancelled'],
  'processing': ['fulfillment', 'cancelled'],
  'fulfillment': ['picking', 'cancelled'],
  'picking': ['packing', 'cancelled'],
  'packing': ['ready_to_ship', 'cancelled'],
  'ready_to_ship': ['shipped', 'cancelled'],
  'shipped': ['in_transit', 'cancelled'],
  'in_transit': ['out_for_delivery', 'cancelled'],
  'out_for_delivery': ['delivered', 'cancelled'],
  'delivered': ['completed', 'returned'],
  'completed': ['returned'],
  'cancelled': [],
  'returned': ['refunded'],
  'refunded': [],
  'failed': ['cancelled']
};

// ================================
// BATCH 2: ADVANCED ORDER PROCESSING ENGINE TYPES (RHY_051)
// ================================

/**
 * Advanced Order Processing Engine - Enterprise-grade order processing
 * Seamlessly integrates with Batch 1 authentication and warehouse systems
 */

export interface AdvancedOrderProcessingRequest {
  warehouseId: string
  items: AdvancedOrderItem[]
  supplierData: {
    id: string
    tier: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE'
    warehouseAccess: string[]
  }
  shippingAddress: ShippingAddress
  billingAddress?: ShippingAddress
  paymentMethodId?: string
  specialInstructions?: string
  urgencyLevel?: 'STANDARD' | 'EXPRESS' | 'PRIORITY' | 'EMERGENCY'
  fraudDetection: {
    enabled: boolean
    riskThreshold: number
  }
  multiWarehouseRouting: {
    enabled: boolean
    maxWarehouses: number
    preferredRegions: string[]
  }
}

export interface AdvancedOrderItem {
  productId: string
  sku: string
  name: string
  category: 'flexvolt-6ah' | 'flexvolt-9ah' | 'flexvolt-15ah'
  quantity: number
  unitPrice: number
  notes?: string
}

export interface OrderProcessingResult {
  success: boolean
  orderId?: string
  orderNumber?: string
  totalAmount: number
  discountTier: 'Standard' | 'Contractor' | 'Professional' | 'Commercial' | 'Enterprise'
  discountAmount: number
  finalAmount: number
  estimatedDelivery: Date
  trackingInfo?: TrackingInfo[]
  routingPlan: OrderRoutingDecision[]
  fraudScore: number
  requiresManualReview: boolean
  error?: OrderProcessingError
  processingTime: number
}

export interface OrderRoutingDecision {
  warehouseId: string
  warehouseName: string
  region: 'US' | 'JP' | 'EU' | 'AU'
  allocationPercentage: number
  routingReason: string
  estimatedCost: number
  deliveryTimeHours: number
  riskFactors: string[]
  shippingMethod: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' | 'FREIGHT'
}

export interface OrderProcessingError {
  code: 'INSUFFICIENT_INVENTORY' | 'PAYMENT_FAILED' | 'FRAUD_DETECTED' | 'WAREHOUSE_UNAVAILABLE' | 'COMPLIANCE_FAILURE' | 'SYSTEM_ERROR'
  message: string
  details?: any
  retryable: boolean
  suggestedAction?: string
}

export interface FraudAnalysisResult {
  score: number // 0.0 to 1.0
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  factors: FraudRiskFactor[]
  requiresManualReview: boolean
  blockedReasons?: string[]
}

export interface FraudRiskFactor {
  type: 'IP_REPUTATION' | 'ORDER_VELOCITY' | 'AMOUNT_THRESHOLD' | 'SHIPPING_MISMATCH' | 'PAYMENT_HISTORY'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  description: string
  confidence: number
}

export interface DynamicPricingCalculation {
  originalSubtotal: number
  volumeDiscount: {
    tier: 'Standard' | 'Contractor' | 'Professional' | 'Commercial' | 'Enterprise'
    percentage: number
    amount: number
    eligibleReason: string
    nextTierThreshold?: number
    nextTierSavings?: number
  }
  regionalAdjustments: {
    region: 'US' | 'JP' | 'EU' | 'AU'
    taxRate: number
    taxAmount: number
    currencyConversion?: {
      fromCurrency: string
      toCurrency: string
      rate: number
      amount: number
    }
  }
  loyaltyDiscount?: {
    percentage: number
    amount: number
    loyaltyLevel: string
  }
  finalTotal: number
  breakdown: PricingBreakdownItem[]
}

export interface PricingBreakdownItem {
  description: string
  amount: number
  type: 'PRODUCT' | 'DISCOUNT' | 'TAX' | 'SHIPPING' | 'FEE'
  isNegative: boolean
}

export interface OrderFulfillmentPlan {
  fulfillmentId: string
  strategy: 'SINGLE_WAREHOUSE' | 'MULTI_WAREHOUSE' | 'DROP_SHIP' | 'CROSS_DOCK'
  warehouses: FulfillmentWarehouse[]
  estimatedCompletionTime: Date
  consolidationPoints?: ConsolidationPoint[]
  specialHandling?: SpecialHandlingRequirement[]
}

export interface FulfillmentWarehouse {
  warehouseId: string
  region: 'US' | 'JP' | 'EU' | 'AU'
  items: FulfillmentItem[]
  estimatedProcessingTime: number
  estimatedShipDate: Date
  carrier: string
  trackingNumber?: string
}

export interface FulfillmentItem {
  productId: string
  quantity: number
  allocatedQuantity: number
  backorderQuantity?: number
  estimatedAvailabilityDate?: Date
}

export interface ConsolidationPoint {
  location: string
  estimatedArrival: Date
  estimatedDeparture: Date
  consolidatedItems: string[]
}

export interface SpecialHandlingRequirement {
  type: 'FRAGILE' | 'HAZMAT' | 'TEMPERATURE_CONTROLLED' | 'SIGNATURE_REQUIRED'
  description: string
  additionalCost?: number
  compliance: ComplianceRequirement[]
}

export interface ComplianceRequirement {
  regulation: 'OSHA' | 'DOT' | 'IATA' | 'UN' | 'CE' | 'JIS'
  requirement: string
  status: 'PENDING' | 'APPROVED' | 'FAILED'
  documentation?: string[]
}

export interface RealTimeInventoryCheck {
  warehouseId: string
  productId: string
  availableQuantity: number
  reservedQuantity: number
  incomingQuantity: number
  nextRestockDate?: Date
  allocationStrategy: 'FIFO' | 'LIFO' | 'NEAREST' | 'CHEAPEST'
  lastUpdated: Date
}

export interface PaymentProcessingRequest {
  paymentMethodId: string
  amount: number
  currency: string
  orderId: string
  customerId: string
  fraudChecks: {
    enabled: boolean
    riskThreshold: number
    verificationMethods: ('3DS' | 'AVS' | 'CVV')[]
  }
  merchantData: {
    descriptor: string
    categoryCode: string
    submerchantId?: string
  }
}

export interface PaymentProcessingResult {
  success: boolean
  transactionId?: string
  authorizationCode?: string
  status: 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REQUIRES_ACTION'
  paymentMethod: {
    type: string
    last4?: string
    brand?: string
    expiryMonth?: number
    expiryYear?: number
  }
  riskAssessment: {
    score: number
    outcome: 'APPROVE' | 'REVIEW' | 'DECLINE'
    reasons?: string[]
  }
  fees: {
    processingFee: number
    gatewayFee: number
    totalFees: number
  }
  error?: {
    code: string
    message: string
    declineCode?: string
    details?: any
  }
}

export interface OrderPerformanceMetrics {
  processingTime: number
  apiResponseTime: number
  databaseQueryTime: number
  warehouseResponseTime: number
  paymentProcessingTime: number
  fraudCheckTime: number
  totalOrderTime: number
  bottlenecks: PerformanceBottleneck[]
  recommendations: PerformanceRecommendation[]
}

export interface PerformanceBottleneck {
  component: string
  duration: number
  percentage: number
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface PerformanceRecommendation {
  type: 'OPTIMIZATION' | 'SCALING' | 'CONFIGURATION'
  component: string
  suggestion: string
  expectedImprovement: number
  effort: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface OrderAnalyticsData {
  orderId: string
  customerBehavior: {
    sessionDuration: number
    pageViews: number
    cartAbandonment: boolean
    productViewed: string[]
    timeToDecision: number
  }
  businessMetrics: {
    customerLifetimeValue: number
    profitMargin: number
    costToAcquire: number
    returnProbability: number
  }
  warehouseMetrics: {
    utilizationRate: number
    fulfillmentAccuracy: number
    processingEfficiency: number
  }
  qualityScores: {
    orderAccuracy: number
    deliveryPerformance: number
    customerSatisfaction: number
  }
}

export interface OrderWorkflowStep {
  id: string
  name: string
  type: 'VALIDATION' | 'FRAUD_CHECK' | 'INVENTORY' | 'PAYMENT' | 'ROUTING' | 'FULFILLMENT'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED'
  startTime?: Date
  completionTime?: Date
  duration?: number
  dependencies: string[]
  outputs?: any
  errors?: WorkflowError[]
}

export interface WorkflowError {
  code: string
  message: string
  severity: 'WARNING' | 'ERROR' | 'CRITICAL'
  retryable: boolean
  retryCount?: number
  maxRetries?: number
}

export interface OrderSearchFilters {
  orderNumbers?: string[]
  supplierIds?: string[]
  warehouseIds?: string[]
  statuses?: OrderStatus[]
  fraudScoreRange?: { min: number; max: number }
  amountRange?: { min: number; max: number }
  dateRange?: { start: Date; end: Date }
  discountTiers?: string[]
  customerTypes?: string[]
  urgencyLevels?: string[]
  hasIssues?: boolean
  requiresReview?: boolean
}

export interface OrderBatchProcessingRequest {
  orders: AdvancedOrderProcessingRequest[]
  options: {
    maxConcurrency: number
    continueOnError: boolean
    validateOnly: boolean
    enableRollback: boolean
    timeoutMs: number
  }
}

export interface OrderBatchProcessingResult {
  batchId: string
  totalOrders: number
  processedOrders: number
  successfulOrders: number
  failedOrders: number
  results: OrderProcessingResult[]
  summary: {
    totalAmount: number
    totalDiscounts: number
    averageProcessingTime: number
    warehouseDistribution: Record<string, number>
    errorBreakdown: Record<string, number>
  }
  performance: {
    startTime: Date
    endTime: Date
    totalDuration: number
    averageOrderTime: number
    bottlenecks: string[]
  }
}

export interface OrderOptimizationSuggestion {
  type: 'INVENTORY' | 'ROUTING' | 'PRICING' | 'FULFILLMENT' | 'SHIPPING'
  title: string
  description: string
  impact: 'LOW' | 'MEDIUM' | 'HIGH'
  effort: 'LOW' | 'MEDIUM' | 'HIGH'
  estimatedSavings?: number
  estimatedTimeReduction?: number
  applicableOrders: string[]
  implementation: {
    steps: string[]
    timeline: string
    resources: string[]
  }
}

// Export validation schemas for runtime validation
export const ORDER_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'EXPEDITED'] as const;
export const CUSTOMER_TYPES = ['DIRECT', 'DISTRIBUTOR', 'FLEET', 'SERVICE', 'RETAILER'] as const;
export const WAREHOUSE_REGIONS = ['US', 'EU', 'JP', 'AU'] as const;
export const FLEXVOLT_CATEGORIES = ['FLEXVOLT_6AH', 'FLEXVOLT_9AH', 'FLEXVOLT_15AH'] as const;

// Advanced order processing constants
export const FRAUD_RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const DISCOUNT_TIERS = ['Standard', 'Contractor', 'Professional', 'Commercial', 'Enterprise'] as const;
export const FULFILLMENT_STRATEGIES = ['SINGLE_WAREHOUSE', 'MULTI_WAREHOUSE', 'DROP_SHIP', 'CROSS_DOCK'] as const;
export const URGENCY_LEVELS = ['STANDARD', 'EXPRESS', 'PRIORITY', 'EMERGENCY'] as const;

// Volume discount thresholds (matching Batch 1 business logic)
export const VOLUME_DISCOUNT_THRESHOLDS = {
  CONTRACTOR: 1000,   // 10% discount
  PROFESSIONAL: 2500, // 15% discount  
  COMMERCIAL: 5000,   // 20% discount
  ENTERPRISE: 7500    // 25% discount
} as const;

// FlexVolt product pricing (matching Batch 1 business logic)
export const FLEXVOLT_PRICING = {
  'flexvolt-6ah': { price: 95, name: '6Ah FlexVolt Battery' },
  'flexvolt-9ah': { price: 125, name: '9Ah FlexVolt Battery' },
  'flexvolt-15ah': { price: 245, name: '15Ah FlexVolt Battery' }
} as const;