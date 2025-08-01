/**
 * RHY Supplier Portal - Order Integration Type Definitions
 * Comprehensive TypeScript types for enterprise order integration
 * Ensures type safety across the entire integration system
 */

// Core order integration types
export interface OrderIntegrationRequest {
  supplierId: string
  warehouseId: string
  items: OrderItem[]
  shippingMethod: ShippingMethod
  paymentMethod: PaymentMethod
  urgency?: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT'
  customerNotes?: string
  metadata?: Record<string, any>
}

export interface OrderItem {
  productId: string
  sku: string
  name: string
  quantity: number
  unitPrice: number
  warehouseLocation: string
  specifications?: ProductSpecifications
  isHazardous?: boolean
}

export interface ProductSpecifications {
  voltage?: string
  capacity?: string
  chemistry?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
    unit: 'cm' | 'in'
  }
}

export interface OrderIntegrationResponse {
  success: boolean
  orderId?: string
  integrationId?: string
  status: OrderStatus
  estimatedDelivery?: Date
  tracking?: TrackingInfo
  pricing?: PricingDetails
  shipping?: ShippingDetails
  payment?: PaymentDetails
  error?: string
  warnings?: string[]
  metadata?: Record<string, any>
}

// Enums
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  CONFIRMED = 'CONFIRMED',
  FULFILLING = 'FULFILLING',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  RETURNED = 'RETURNED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

export enum ShippingMethod {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  OVERNIGHT = 'OVERNIGHT',
  SAME_DAY = 'SAME_DAY',
  PICKUP = 'PICKUP'
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  ACH = 'ACH',
  NET_TERMS = 'NET_TERMS',
  PURCHASE_ORDER = 'PURCHASE_ORDER'
}

// Detailed information types
export interface TrackingInfo {
  carrier: string
  service: string
  trackingNumber: string
  trackingUrl: string
  estimatedDelivery: Date
  currentStatus: string
  lastUpdate: Date
  statusHistory: TrackingEvent[]
  deliveryAttempts?: number
  signedBy?: string
  deliveryLocation?: string
}

export interface TrackingEvent {
  timestamp: Date
  location: string
  status: string
  description: string
  city?: string
  state?: string
  country?: string
  facilityType?: string
}

export interface PricingDetails {
  subtotal: number
  discountPercentage: number
  discountAmount: number
  discountTier: string
  total: number
  currency: string
  itemCount: number
  warehouseFees?: number
  processingFees?: number
  expediteFees?: number
  volumeDiscountApplied: boolean
  supplierTierBenefits?: {
    additionalDiscount: number
    priorityProcessing: boolean
    dedicatedSupport: boolean
  }
}

export interface ShippingDetails {
  method: ShippingMethod
  carrier: string
  service: string
  cost: number
  currency: string
  estimatedDelivery: Date
  transitTime: number
  insurance?: {
    enabled: boolean
    amount: number
    cost: number
  }
  signature?: {
    required: boolean
    type: 'STANDARD' | 'ADULT'
  }
  packaging?: {
    type: string
    count: number
    weight: number
    dimensions: {
      length: number
      width: number
      height: number
      unit: 'cm' | 'in'
    }
  }
}

export interface PaymentDetails {
  method: PaymentMethod
  status: PaymentStatus
  authorizationId?: string
  transactionId?: string
  amount: number
  currency: string
  paymentDate?: Date
  dueDate?: Date
  terms?: string
  invoiceNumber?: string
  fraudScore?: number
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
}

// Integration configuration types
export interface IntegrationConfiguration {
  warehouseIntegrations: Record<string, WarehouseConfig>
  shippingIntegrations: Record<string, ShippingConfig>
  paymentIntegrations: Record<string, PaymentConfig>
  businessRules: BusinessRuleConfig
}

export interface WarehouseConfig {
  warehouseId: string
  name: string
  location: {
    country: string
    region: string
    timezone: string
    currency: string
  }
  systems: {
    wms?: {
      type: string
      version: string
      apiEndpoint: string
      enabled: boolean
    }
    erp?: {
      type: string
      version: string
      apiEndpoint: string
      enabled: boolean
    }
  }
  capabilities: {
    sameDay: boolean
    overnight: boolean
    hazmatHandling: boolean
    customsProcessing: boolean
    coldStorage: boolean
    bulkOrders: boolean
  }
  compliance: {
    certifications: string[]
    regulations: string[]
    auditSchedule: string
  }
  operatingHours: {
    timezone: string
    cutoffTime: string
    processingDays: string[]
    holidays: string[]
  }
}

export interface ShippingConfig {
  carrier: string
  regions: string[]
  services: ServiceConfig[]
  capabilities: {
    tracking: boolean
    insurance: boolean
    signature: boolean
    hazmat: boolean
    international: boolean
  }
  rates: {
    baseRate: number
    weightMultiplier: number
    distanceMultiplier: number
    surcharges: Record<string, number>
  }
}

export interface ServiceConfig {
  name: string
  code: string
  transitTime: number
  cutoffTime: string
  maxWeight: number
  maxDimensions: {
    length: number
    width: number
    height: number
  }
}

export interface PaymentConfig {
  method: PaymentMethod
  enabled: boolean
  regions: string[]
  currencies: string[]
  terms?: {
    net: number
    discount?: {
      percentage: number
      days: number
    }
  }
  limits: {
    min: number
    max: number
    daily: number
    monthly: number
  }
  fees: {
    processing: number
    international: number
    expedite: number
  }
}

export interface BusinessRuleConfig {
  volumeDiscounts: VolumeDiscountTier[]
  supplierTiers: SupplierTierConfig[]
  inventoryRules: InventoryRuleConfig
  shippingRules: ShippingRuleConfig
  paymentRules: PaymentRuleConfig
}

export interface VolumeDiscountTier {
  threshold: number
  discountPercentage: number
  tierName: string
  eligibleCustomerTypes: string[]
  additionalBenefits?: {
    expeditedProcessing: boolean
    waiveFees: string[]
    prioritySupport: boolean
  }
}

export interface SupplierTierConfig {
  tier: string
  requirements: {
    annualVolume?: number
    monthlyOrders?: number
    paymentHistory?: 'EXCELLENT' | 'GOOD' | 'FAIR'
    complianceScore?: number
  }
  benefits: {
    additionalDiscount: number
    priorityProcessing: boolean
    dedicatedSupport: boolean
    extendedTerms: boolean
    waiveFees: string[]
  }
}

export interface InventoryRuleConfig {
  reservationTimeout: number
  backorderPolicy: 'ALLOW' | 'DENY' | 'PARTIAL'
  substitutionPolicy: 'ALLOW' | 'DENY' | 'SIMILAR_ONLY'
  allocationRules: {
    priorityCustomers: string[]
    reservePercentage: number
    maxAllocation: number
  }
}

export interface ShippingRuleConfig {
  defaultMethod: ShippingMethod
  expediteThreshold: number
  freeShippingThreshold: number
  hazmatRestrictions: {
    carriers: string[]
    services: string[]
    additionalFees: number
  }
  internationalRules: {
    documentsRequired: string[]
    customsHandling: boolean
    dutyCalculation: boolean
  }
}

export interface PaymentRuleConfig {
  defaultTerms: string
  creditCheckRequired: boolean
  autoApprovalThreshold: number
  manualReviewThreshold: number
  fraudDetection: {
    enabled: boolean
    scoreThreshold: number
    reviewThreshold: number
  }
}

// API request/response types
export interface OrderIntegrationListRequest {
  supplierId?: string
  warehouseId?: string
  status?: OrderStatus[]
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'status' | 'total'
  sortOrder?: 'asc' | 'desc'
}

export interface OrderIntegrationListResponse {
  success: boolean
  orders: OrderIntegrationSummary[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  aggregations?: {
    totalValue: number
    statusCounts: Record<OrderStatus, number>
    warehouseCounts: Record<string, number>
  }
  error?: string
}

export interface OrderIntegrationSummary {
  orderId: string
  integrationId: string
  supplierId: string
  supplierName: string
  warehouseId: string
  warehouseName: string
  status: OrderStatus
  itemCount: number
  totalValue: number
  currency: string
  createdAt: Date
  updatedAt: Date
  estimatedDelivery?: Date
  trackingNumber?: string
  paymentStatus: PaymentStatus
}

export interface OrderIntegrationStatusRequest {
  orderId: string
  supplierId: string
  includeHistory?: boolean
  includeTracking?: boolean
  includePricing?: boolean
}

export interface OrderIntegrationUpdateRequest {
  orderId: string
  supplierId: string
  updates: {
    shippingMethod?: ShippingMethod
    urgency?: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT'
    customerNotes?: string
    metadata?: Record<string, any>
  }
}

export interface OrderIntegrationCancelRequest {
  orderId: string
  supplierId: string
  reason: string
  refundRequested?: boolean
}

// Error types
export interface OrderIntegrationError {
  code: string
  message: string
  details?: Record<string, any>
  field?: string
  suggestion?: string
}

export interface ValidationError extends OrderIntegrationError {
  code: 'VALIDATION_ERROR'
  field: string
  value?: any
}

export interface BusinessRuleError extends OrderIntegrationError {
  code: 'BUSINESS_RULE_VIOLATION'
  rule: string
  threshold?: number
  current?: number
}

export interface IntegrationError extends OrderIntegrationError {
  code: 'INTEGRATION_ERROR'
  service: string
  endpoint?: string
  httpStatus?: number
}

export interface InventoryError extends OrderIntegrationError {
  code: 'INVENTORY_ERROR'
  sku: string
  requested: number
  available: number
  warehouse: string
}

// Event types for real-time updates
export interface OrderIntegrationEvent {
  eventId: string
  orderId: string
  eventType: string
  eventData: Record<string, any>
  timestamp: Date
  source: string
}

export interface OrderStatusChangeEvent extends OrderIntegrationEvent {
  eventType: 'ORDER_STATUS_CHANGE'
  eventData: {
    previousStatus: OrderStatus
    newStatus: OrderStatus
    reason?: string
    metadata?: Record<string, any>
  }
}

export interface PaymentStatusChangeEvent extends OrderIntegrationEvent {
  eventType: 'PAYMENT_STATUS_CHANGE'
  eventData: {
    previousStatus: PaymentStatus
    newStatus: PaymentStatus
    amount?: number
    transactionId?: string
    metadata?: Record<string, any>
  }
}

export interface ShippingUpdateEvent extends OrderIntegrationEvent {
  eventType: 'SHIPPING_UPDATE'
  eventData: {
    trackingNumber?: string
    location?: string
    status?: string
    estimatedDelivery?: Date
    metadata?: Record<string, any>
  }
}

// Performance monitoring types
export interface OrderIntegrationMetrics {
  processingTime: {
    average: number
    p95: number
    p99: number
  }
  successRate: number
  errorRate: number
  throughput: {
    ordersPerHour: number
    ordersPerDay: number
  }
  warehousePerformance: Record<string, {
    averageProcessingTime: number
    fulfillmentRate: number
    errorRate: number
  }>
  carrierPerformance: Record<string, {
    onTimeDeliveryRate: number
    averageTransitTime: number
    errorRate: number
  }>
  paymentPerformance: Record<string, {
    successRate: number
    averageProcessingTime: number
    fraudRate: number
  }>
}

// Configuration update types
export interface ConfigurationUpdateRequest {
  section: 'warehouse' | 'shipping' | 'payment' | 'business_rules'
  warehouseId?: string
  carrier?: string
  paymentMethod?: string
  configuration: Record<string, any>
  effectiveDate?: Date
  reason?: string
}

export interface ConfigurationUpdateResponse {
  success: boolean
  updateId: string
  effectiveDate: Date
  affectedOrders?: string[]
  rollbackPlan?: string
  error?: string
}