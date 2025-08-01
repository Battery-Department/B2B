/**
 * RHY Supplier Portal - Order API Types
 * Enterprise-grade TypeScript definitions for order management operations
 * Integrates with existing Batch 1 authentication and warehouse systems
 */

import { SupplierAuthData } from './auth'

// Order Status Types
export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'refunded'

export type PaymentStatus = 
  | 'pending' 
  | 'paid' 
  | 'failed' 
  | 'refunded' 
  | 'partial_refund'

export type OrderPriority = 'low' | 'normal' | 'high' | 'urgent'

// Warehouse and Shipping Types
export type WarehouseRegion = 'US_WEST' | 'JAPAN' | 'EU' | 'AUSTRALIA'

export type ShippingMethod = 
  | 'standard' 
  | 'expedited' 
  | 'overnight' 
  | 'international' 
  | 'freight'

// FlexVolt Product Types
export interface FlexVoltProduct {
  id: string
  sku: string
  name: string
  type: '6Ah' | '9Ah' | '15Ah'
  basePrice: number
  currency: string
  specifications: {
    voltage: '20V/60V MAX'
    capacity: string
    runtime: string
    weight: string
    compatibility: string[]
  }
  warehouse: WarehouseRegion
  stockLevel: number
  reservedQuantity: number
  availableQuantity: number
}

// Order Item Interface
export interface OrderItem {
  id: string
  productId: string
  product: FlexVoltProduct
  quantity: number
  unitPrice: number
  totalPrice: number
  discountApplied?: number
  discountReason?: string
  warehouseAllocation: {
    warehouse: WarehouseRegion
    allocatedQuantity: number
    reservationId?: string
  }[]
}

// Volume Discount Structure
export interface VolumeDiscount {
  threshold: number
  discountPercentage: number
  tierName: 'Contractor' | 'Professional' | 'Commercial' | 'Enterprise'
  eligibleCustomerTypes: string[]
}

// Order Pricing Breakdown
export interface OrderPricing {
  subtotal: number
  volumeDiscount: {
    applicable: boolean
    tier?: VolumeDiscount
    discountAmount: number
    originalAmount: number
  }
  tax: {
    rate: number
    amount: number
    taxId?: string
  }
  shipping: {
    method: ShippingMethod
    cost: number
    estimatedDays: number
  }
  total: number
  currency: string
}

// Shipping Information
export interface ShippingAddress {
  id?: string
  companyName: string
  contactName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phoneNumber?: string
  deliveryInstructions?: string
  isCommercialAddress: boolean
}

// Order Interface
export interface Order {
  id: string
  orderNumber: string
  customerId: string
  supplier: SupplierAuthData
  
  // Order Details
  status: OrderStatus
  priority: OrderPriority
  items: OrderItem[]
  pricing: OrderPricing
  
  // Shipping
  shippingAddress: ShippingAddress
  shippingMethod: ShippingMethod
  trackingNumbers: string[]
  estimatedDelivery?: Date
  actualDelivery?: Date
  
  // Payment
  paymentStatus: PaymentStatus
  paymentMethod?: string
  paymentIntentId?: string
  paidAt?: Date
  
  // Multi-warehouse coordination
  warehouseCoordination: {
    primaryWarehouse: WarehouseRegion
    additionalWarehouses: WarehouseRegion[]
    consolidationRequired: boolean
    estimatedConsolidationTime?: number
  }
  
  // Business metadata
  customerPO?: string
  internalNotes?: string
  customerNotes?: string
  urgencyReason?: string
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  confirmedAt?: Date
  shippedAt?: Date
  deliveredAt?: Date
  cancelledAt?: Date
}

// Create Order Request
export interface CreateOrderRequest {
  items: {
    productId: string
    quantity: number
    warehousePreference?: WarehouseRegion
  }[]
  shippingAddress: Omit<ShippingAddress, 'id'>
  shippingMethod: ShippingMethod
  customerPO?: string
  customerNotes?: string
  priority?: OrderPriority
  requestedDeliveryDate?: Date
}

// Update Order Request
export interface UpdateOrderRequest {
  items?: {
    productId: string
    quantity: number
  }[]
  shippingAddress?: Partial<ShippingAddress>
  shippingMethod?: ShippingMethod
  priority?: OrderPriority
  customerNotes?: string
  internalNotes?: string
}

// Bulk Order Operations
export interface BulkOrderRequest {
  orders: CreateOrderRequest[]
  consolidateShipping?: boolean
  bulkDiscountCode?: string
  customerPO?: string
  requestedDeliveryDate?: Date
}

export interface BulkOrderResponse {
  success: boolean
  orders: {
    success: boolean
    order?: Order
    error?: string
    originalIndex: number
  }[]
  summary: {
    totalOrders: number
    successfulOrders: number
    failedOrders: number
    totalValue: number
    estimatedSavings: number
  }
}

// Recurring Order Configuration
export interface RecurringOrderConfig {
  id: string
  orderId: string
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually'
  interval: number
  nextOrderDate: Date
  endDate?: Date
  maxOrders?: number
  isActive: boolean
  items: {
    productId: string
    quantity: number
    allowSubstitutions: boolean
  }[]
  shippingAddress: ShippingAddress
  shippingMethod: ShippingMethod
  autoApprove: boolean
  createdAt: Date
  updatedAt: Date
}

// Order Search and Filtering
export interface OrderFilters {
  status?: OrderStatus[]
  paymentStatus?: PaymentStatus[]
  priority?: OrderPriority[]
  warehouse?: WarehouseRegion[]
  dateRange?: {
    start: Date
    end: Date
    field: 'createdAt' | 'confirmedAt' | 'shippedAt' | 'deliveredAt'
  }
  orderNumberPattern?: string
  customerPO?: string
  totalRange?: {
    min: number
    max: number
  }
  productTypes?: ('6Ah' | '9Ah' | '15Ah')[]
}

export interface OrderSearchRequest {
  filters?: OrderFilters
  sortBy?: 'createdAt' | 'total' | 'priority' | 'status'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Order Analytics
export interface OrderAnalytics {
  orderMetrics: {
    totalOrders: number
    totalValue: number
    averageOrderValue: number
    averageItemsPerOrder: number
  }
  statusBreakdown: Record<OrderStatus, number>
  warehouseDistribution: Record<WarehouseRegion, {
    orders: number
    value: number
    averageProcessingTime: number
  }>
  productPopularity: {
    productId: string
    productName: string
    ordersCount: number
    totalQuantity: number
    revenue: number
  }[]
  volumeDiscountUsage: {
    tier: string
    ordersCount: number
    totalSavings: number
    averageSavings: number
  }[]
  timeBasedTrends: {
    date: string
    orders: number
    value: number
  }[]
}

// API Response Types
export interface OrderApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    timestamp: string
    requestId: string
    warehouse?: WarehouseRegion
    processingTime?: number
  }
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface OrderListResponse extends OrderApiResponse<Order[]> {
  summary?: {
    totalOrders: number
    totalValue: number
    statusCounts: Record<OrderStatus, number>
  }
}

// Order Processing Events
export interface OrderEvent {
  id: string
  orderId: string
  type: 'created' | 'updated' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  description: string
  metadata?: Record<string, any>
  performedBy: {
    type: 'system' | 'user' | 'integration'
    id?: string
    name?: string
  }
  timestamp: Date
}

// Multi-warehouse Transfer
export interface WarehouseTransfer {
  id: string
  fromWarehouse: WarehouseRegion
  toWarehouse: WarehouseRegion
  items: {
    productId: string
    quantity: number
    reservedForOrder?: string
  }[]
  status: 'pending' | 'in_transit' | 'completed' | 'failed'
  estimatedArrival?: Date
  actualArrival?: Date
  trackingNumber?: string
  cost?: number
  reason: 'stock_balancing' | 'order_fulfillment' | 'emergency_restock'
  createdAt: Date
  updatedAt: Date
}

// Payment Processing
export interface PaymentProcessingRequest {
  orderId: string
  paymentMethod: {
    type: 'card' | 'bank_transfer' | 'invoice' | 'credit_account'
    paymentMethodId?: string
    saveForFuture?: boolean
  }
  billing: {
    name: string
    email: string
    address: ShippingAddress
  }
  metadata?: Record<string, string>
}

export interface PaymentProcessingResponse {
  success: boolean
  paymentIntentId?: string
  clientSecret?: string
  requiresAction?: boolean
  actionUrl?: string
  error?: string
  order?: Order
}

// Order Validation
export interface OrderValidationResult {
  isValid: boolean
  errors: {
    field: string
    message: string
    code: string
  }[]
  warnings: {
    field: string
    message: string
    code: string
  }[]
  suggestions?: {
    type: 'substitute_product' | 'alternative_warehouse' | 'shipping_upgrade'
    description: string
    data: any
  }[]
}

// Inventory Allocation
export interface InventoryAllocation {
  productId: string
  requestedQuantity: number
  allocatedQuantity: number
  backorderQuantity: number
  warehouseAllocations: {
    warehouse: WarehouseRegion
    quantity: number
    reservationId: string
    reservationExpiry: Date
  }[]
  totalAvailable: number
  nextRestockDate?: Date
}

// Service Error Types
export class OrderApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message)
    this.name = 'OrderApiError'
  }
}

export class InventoryError extends OrderApiError {
  constructor(message: string, details?: any) {
    super(message, 'INVENTORY_ERROR', 409, details)
    this.name = 'InventoryError'
  }
}

export class PaymentError extends OrderApiError {
  constructor(message: string, details?: any) {
    super(message, 'PAYMENT_ERROR', 402, details)
    this.name = 'PaymentError'
  }
}

export class ValidationError extends OrderApiError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}

export class WarehouseError extends OrderApiError {
  constructor(message: string, details?: any) {
    super(message, 'WAREHOUSE_ERROR', 503, details)
    this.name = 'WarehouseError'
  }
}

// Export all types
export type {
  Order,
  OrderItem,
  OrderPricing,
  CreateOrderRequest,
  UpdateOrderRequest,
  BulkOrderRequest,
  BulkOrderResponse,
  RecurringOrderConfig,
  OrderFilters,
  OrderSearchRequest,
  OrderAnalytics,
  OrderApiResponse,
  OrderListResponse,
  OrderEvent,
  WarehouseTransfer,
  PaymentProcessingRequest,
  PaymentProcessingResponse,
  OrderValidationResult,
  InventoryAllocation,
  ShippingAddress,
  FlexVoltProduct,
  VolumeDiscount
}