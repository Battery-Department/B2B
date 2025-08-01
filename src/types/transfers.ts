/**
 * RHY Supplier Portal - Transfer Management Types
 * Enterprise-grade TypeScript definitions for warehouse transfer operations
 * Supports global warehouse operations: US West, Japan, EU, Australia
 */

import { z } from 'zod'

// Warehouse Regions
export type WarehouseRegion = 'US_WEST' | 'JAPAN' | 'EU' | 'AUSTRALIA'

// Transfer Status
export type TransferStatus = 
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'CANCELLED'
  | 'REJECTED'

// Transfer Priority
export type TransferPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

// Product Transfer Item
export interface TransferItem {
  id: string
  productId: string
  productSku: string
  productName: string
  requestedQuantity: number
  approvedQuantity?: number
  receivedQuantity?: number
  unitPrice: number
  totalValue: number
  notes?: string
}

// Transfer Request
export interface Transfer {
  id: string
  transferNumber: string
  status: TransferStatus
  priority: TransferPriority
  sourceWarehouse: WarehouseRegion
  destinationWarehouse: WarehouseRegion
  requestedBy: string
  requestedDate: Date
  approvedBy?: string
  approvedDate?: Date
  shippedDate?: Date
  expectedDeliveryDate?: Date
  receivedDate?: Date
  items: TransferItem[]
  totalValue: number
  shippingCost?: number
  trackingNumber?: string
  notes?: string
  rejectionReason?: string
  complianceDocuments?: string[]
  customsDeclaration?: string
  estimatedTransitTime?: number
  actualTransitTime?: number
  createdAt: Date
  updatedAt: Date
}

// Transfer Creation Request
export interface CreateTransferRequest {
  sourceWarehouse: WarehouseRegion
  destinationWarehouse: WarehouseRegion
  priority: TransferPriority
  expectedDeliveryDate?: Date
  items: {
    productId: string
    requestedQuantity: number
    notes?: string
  }[]
  notes?: string
}

// Transfer Update Request
export interface UpdateTransferRequest {
  priority?: TransferPriority
  expectedDeliveryDate?: Date
  items?: {
    id: string
    requestedQuantity?: number
    notes?: string
  }[]
  notes?: string
}

// Transfer Approval Request
export interface ApproveTransferRequest {
  transferId: string
  items: {
    id: string
    approvedQuantity: number
  }[]
  notes?: string
}

// Transfer Status Update
export interface UpdateTransferStatusRequest {
  transferId: string
  status: TransferStatus
  notes?: string
  trackingNumber?: string
  shippedDate?: Date
  receivedDate?: Date
  complianceDocuments?: string[]
  customsDeclaration?: string
}

// Transfer Filters
export interface TransferFilters {
  status?: TransferStatus[]
  priority?: TransferPriority[]
  sourceWarehouse?: WarehouseRegion[]
  destinationWarehouse?: WarehouseRegion[]
  dateFrom?: Date
  dateTo?: Date
  transferNumber?: string
  requestedBy?: string
}

// Transfer Analytics
export interface TransferAnalytics {
  totalTransfers: number
  pendingTransfers: number
  inTransitTransfers: number
  completedTransfers: number
  totalValue: number
  averageTransitTime: number
  onTimeDeliveryRate: number
  topRoutes: {
    route: string
    count: number
    averageTime: number
  }[]
  monthlyTrends: {
    month: string
    transfers: number
    value: number
  }[]
}

// API Response Types
export interface TransferResponse {
  success: boolean
  transfer?: Transfer
  error?: string
}

export interface TransfersListResponse {
  success: boolean
  transfers: Transfer[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  error?: string
}

export interface TransferAnalyticsResponse {
  success: boolean
  analytics?: TransferAnalytics
  error?: string
}

// Validation Schemas
export const WarehouseRegionSchema = z.enum(['US_WEST', 'JAPAN', 'EU', 'AUSTRALIA'])

export const TransferStatusSchema = z.enum([
  'DRAFT',
  'PENDING_APPROVAL', 
  'APPROVED',
  'IN_TRANSIT',
  'RECEIVED',
  'CANCELLED',
  'REJECTED'
])

export const TransferPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

export const TransferItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  requestedQuantity: z.number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(10000, 'Quantity cannot exceed 10,000'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
})

export const CreateTransferSchema = z.object({
  sourceWarehouse: WarehouseRegionSchema,
  destinationWarehouse: WarehouseRegionSchema,
  priority: TransferPrioritySchema,
  expectedDeliveryDate: z.date().optional(),
  items: z.array(TransferItemSchema)
    .min(1, 'At least one item is required')
    .max(100, 'Cannot exceed 100 items per transfer'),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional()
}).refine(
  (data) => data.sourceWarehouse !== data.destinationWarehouse,
  {
    message: 'Source and destination warehouses must be different',
    path: ['destinationWarehouse']
  }
)

export const UpdateTransferSchema = z.object({
  priority: TransferPrioritySchema.optional(),
  expectedDeliveryDate: z.date().optional(),
  items: z.array(z.object({
    id: z.string().min(1),
    requestedQuantity: z.number().int().min(1).max(10000).optional(),
    notes: z.string().max(500).optional()
  })).optional(),
  notes: z.string().max(1000).optional()
})

export const ApproveTransferSchema = z.object({
  transferId: z.string().min(1, 'Transfer ID is required'),
  items: z.array(z.object({
    id: z.string().min(1, 'Item ID is required'),
    approvedQuantity: z.number()
      .int('Approved quantity must be a whole number')
      .min(0, 'Approved quantity cannot be negative')
      .max(10000, 'Approved quantity cannot exceed 10,000')
  })).min(1, 'At least one item must be approved'),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional()
})

export const UpdateTransferStatusSchema = z.object({
  transferId: z.string().min(1, 'Transfer ID is required'),
  status: TransferStatusSchema,
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  trackingNumber: z.string().max(100, 'Tracking number cannot exceed 100 characters').optional(),
  shippedDate: z.date().optional(),
  receivedDate: z.date().optional(),
  complianceDocuments: z.array(z.string()).optional(),
  customsDeclaration: z.string().max(500, 'Customs declaration cannot exceed 500 characters').optional()
})

export const TransferFiltersSchema = z.object({
  status: z.array(TransferStatusSchema).optional(),
  priority: z.array(TransferPrioritySchema).optional(),
  sourceWarehouse: z.array(WarehouseRegionSchema).optional(),
  destinationWarehouse: z.array(WarehouseRegionSchema).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  transferNumber: z.string().max(50).optional(),
  requestedBy: z.string().max(100).optional()
})

// Utility Types
export type TransferFormData = z.infer<typeof CreateTransferSchema>
export type TransferUpdateData = z.infer<typeof UpdateTransferSchema>
export type TransferApprovalData = z.infer<typeof ApproveTransferSchema>
export type TransferStatusUpdateData = z.infer<typeof UpdateTransferStatusSchema>
export type TransferFilterData = z.infer<typeof TransferFiltersSchema>

// Constants
export const WAREHOUSE_REGIONS: Record<WarehouseRegion, { name: string; timezone: string; currency: string }> = {
  US_WEST: {
    name: 'US West (Los Angeles)',
    timezone: 'America/Los_Angeles',
    currency: 'USD'
  },
  JAPAN: {
    name: 'Japan (Tokyo)',
    timezone: 'Asia/Tokyo',
    currency: 'JPY'
  },
  EU: {
    name: 'EU (Berlin)',
    timezone: 'Europe/Berlin',
    currency: 'EUR'
  },
  AUSTRALIA: {
    name: 'Australia (Sydney)',
    timezone: 'Australia/Sydney',
    currency: 'AUD'
  }
}

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  IN_TRANSIT: 'In Transit',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected'
}

export const TRANSFER_PRIORITY_LABELS: Record<TransferPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent'
}

export const TRANSFER_STATUS_COLORS: Record<TransferStatus, string> = {
  DRAFT: '#6B7280',
  PENDING_APPROVAL: '#F59E0B',
  APPROVED: '#10B981',
  IN_TRANSIT: '#006FEE',
  RECEIVED: '#10B981',
  CANCELLED: '#9CA3AF',
  REJECTED: '#EF4444'
}

export const TRANSFER_PRIORITY_COLORS: Record<TransferPriority, string> = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
  URGENT: '#DC2626'
}