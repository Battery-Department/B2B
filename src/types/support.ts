/**
 * RHY Supplier Portal - Support System Type Definitions
 * Comprehensive type definitions for enterprise support ticketing system
 * Integrates with existing Batch 1 authentication and warehouse systems
 */

// ================================
// CORE SUPPORT TYPES
// ================================

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type TicketCategory = 
  | 'TECHNICAL_SUPPORT'
  | 'BILLING_INQUIRY' 
  | 'ORDER_ISSUE'
  | 'WAREHOUSE_ACCESS'
  | 'PRODUCT_QUESTION'
  | 'ACCOUNT_MANAGEMENT'
  | 'FEATURE_REQUEST'
  | 'BUG_REPORT'
  | 'GENERAL_INQUIRY'

export type CommentAuthorType = 'SUPPLIER' | 'SUPPORT_AGENT' | 'SYSTEM'

// ================================
// BUSINESS ENTITIES
// ================================

export interface SupportTicket {
  id: string
  ticketNumber: string
  supplierId: string
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  warehouseId?: string
  orderId?: string
  productId?: string
  assignedTo?: string
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  closedAt?: Date
  resolution?: string
  escalationLevel: number
  lastActivityAt: Date
  comments: TicketComment[]
  attachments: TicketAttachment[]
  metrics: TicketMetrics
  supplier?: {
    companyName: string
    email: string
    tier: string
  }
}

export interface TicketComment {
  id: string
  ticketId: string
  authorId: string
  authorType: CommentAuthorType
  authorName?: string
  content: string
  isInternal: boolean
  createdAt: Date
  attachments: TicketAttachment[]
}

export interface TicketAttachment {
  id: string
  ticketId?: string
  commentId?: string
  filename: string
  originalFilename: string
  url: string
  size: number
  mimeType: string
  uploadedBy: string
  uploadedAt: Date
}

export interface TicketMetrics {
  responseTime?: number // Time to first response in minutes
  resolutionTime?: number // Time to resolution in minutes
  satisfactionRating?: number // 1-5 rating
  escalationCount: number
  commentCount: number
  attachmentCount: number
}

// ================================
// API REQUEST/RESPONSE TYPES
// ================================

export interface CreateTicketRequest {
  title: string
  description: string
  category: TicketCategory
  priority?: TicketPriority
  warehouseId?: string
  orderId?: string
  productId?: string
  attachments?: {
    filename: string
    url: string
    size: number
    mimeType: string
  }[]
}

export interface CreateTicketResponse {
  success: boolean
  ticket?: SupportTicket
  error?: string
}

export interface UpdateTicketRequest {
  title?: string
  description?: string
  priority?: TicketPriority
  status?: TicketStatus
  resolution?: string
}

export interface UpdateTicketResponse {
  success: boolean
  ticket?: SupportTicket
  error?: string
}

export interface AddCommentRequest {
  content: string
  isInternal?: boolean
  attachments?: {
    filename: string
    url: string
    size: number
    mimeType: string
  }[]
}

export interface AddCommentResponse {
  success: boolean
  comment?: TicketComment
  error?: string
}

export interface GetTicketsRequest {
  status?: TicketStatus[]
  category?: TicketCategory[]
  priority?: TicketPriority[]
  warehouseId?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface GetTicketsResponse {
  success: boolean
  tickets?: SupportTicket[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: string
}

export interface GetTicketResponse {
  success: boolean
  ticket?: SupportTicket
  error?: string
}

// ================================
// ANALYTICS & DASHBOARD TYPES
// ================================

export interface TicketAnalytics {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  averageResolutionTime: number // in hours
  averageResponseTime: number // in hours
  satisfactionScore: number // 1-5 average
  ticketsByCategory: Record<TicketCategory, number>
  ticketsByPriority: Record<TicketPriority, number>
  ticketsByStatus: Record<TicketStatus, number>
  monthlyTrends: {
    month: string
    created: number
    resolved: number
    avgResolutionTime: number
  }[]
  escalationRate: number // percentage
  firstContactResolutionRate: number // percentage
}

export interface DashboardMetrics {
  myTickets: {
    open: number
    inProgress: number
    awaitingResponse: number
    recentlyResolved: number
  }
  recentActivity: {
    type: 'ticket_created' | 'comment_added' | 'status_changed' | 'ticket_resolved'
    ticketId: string
    ticketNumber: string
    message: string
    timestamp: Date
  }[]
  quickStats: {
    averageResponseTime: string
    resolutionRate: number
    satisfactionScore: number
  }
}

// ================================
// FILTER & SEARCH TYPES
// ================================

export interface TicketFilters {
  status: TicketStatus[]
  category: TicketCategory[]
  priority: TicketPriority[]
  warehouseId?: string
  dateRange?: {
    start: Date
    end: Date
  }
  assignedTo?: string
  hasAttachments?: boolean
}

export interface TicketSortOptions {
  field: 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'lastActivityAt'
  direction: 'asc' | 'desc'
}

export interface TicketSearchResults {
  tickets: SupportTicket[]
  total: number
  facets: {
    categories: Record<TicketCategory, number>
    priorities: Record<TicketPriority, number>
    statuses: Record<TicketStatus, number>
    warehouses: Record<string, number>
  }
}

// ================================
// NOTIFICATION TYPES
// ================================

export interface TicketNotification {
  id: string
  ticketId: string
  ticketNumber: string
  type: 'status_change' | 'new_comment' | 'escalation' | 'resolution'
  message: string
  read: boolean
  createdAt: Date
  actionUrl?: string
}

export interface NotificationPreferences {
  emailNotifications: {
    newTicketResponse: boolean
    statusChanges: boolean
    escalations: boolean
    resolutions: boolean
  }
  inAppNotifications: {
    newTicketResponse: boolean
    statusChanges: boolean
    escalations: boolean
    resolutions: boolean
  }
}

// ================================
// INTEGRATION TYPES
// ================================

export interface WarehouseTicketContext {
  warehouseId: string
  warehouseName: string
  region: string
  relatedSystems: string[]
  commonIssues: string[]
}

export interface OrderTicketContext {
  orderId: string
  orderNumber: string
  orderStatus: string
  items: {
    productId: string
    productName: string
    quantity: number
  }[]
  totalValue: number
  orderDate: Date
}

export interface ProductTicketContext {
  productId: string
  productName: string
  sku: string
  category: string
  specifications: Record<string, any>
  relatedDocuments: string[]
}

// ================================
// ESCALATION TYPES
// ================================

export interface EscalationRule {
  id: string
  name: string
  description: string
  triggers: {
    timeThreshold?: number // minutes
    priorityLevel?: TicketPriority
    categoryMatch?: TicketCategory[]
    supplierTier?: string[]
    keywordMatch?: string[]
  }
  actions: {
    escalateToLevel: number
    notifyAgents: string[]
    changePriority?: TicketPriority
    autoAssignTo?: string
  }
  isActive: boolean
}

export interface EscalationHistory {
  id: string
  ticketId: string
  fromLevel: number
  toLevel: number
  reason: string
  escalatedBy: string
  escalatedAt: Date
  resolvedAt?: Date
  notes?: string
}

// ================================
// REPORTING TYPES
// ================================

export interface TicketReport {
  id: string
  name: string
  description: string
  type: 'summary' | 'detailed' | 'analytics' | 'sla'
  parameters: {
    dateRange: { start: Date; end: Date }
    filters: TicketFilters
    groupBy: string[]
    metrics: string[]
  }
  data: any
  generatedAt: Date
  generatedBy: string
}

export interface SLAMetrics {
  responseTimeSLA: {
    target: number // minutes
    achieved: number // percentage
    breaches: number
  }
  resolutionTimeSLA: {
    target: number // hours
    achieved: number // percentage
    breaches: number
  }
  firstContactResolution: {
    target: number // percentage
    achieved: number // percentage
  }
  customerSatisfaction: {
    target: number // score out of 5
    achieved: number // average score
    responses: number
  }
}

// ================================
// UI COMPONENT TYPES
// ================================

export interface TicketListViewProps {
  tickets: SupportTicket[]
  loading: boolean
  error?: string
  filters: TicketFilters
  sortOptions: TicketSortOptions
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onFilterChange: (filters: TicketFilters) => void
  onSortChange: (sort: TicketSortOptions) => void
  onPageChange: (page: number) => void
  onTicketSelect: (ticket: SupportTicket) => void
}

export interface TicketDetailViewProps {
  ticket: SupportTicket
  loading: boolean
  error?: string
  onAddComment: (comment: AddCommentRequest) => Promise<void>
  onUpdateTicket: (update: UpdateTicketRequest) => Promise<void>
  onClose: () => void
}

export interface CreateTicketFormProps {
  onSubmit: (ticket: CreateTicketRequest) => Promise<void>
  onCancel: () => void
  loading: boolean
  error?: string
  initialData?: Partial<CreateTicketRequest>
}

// ================================
// ERROR TYPES
// ================================

export interface TicketError {
  code: string
  message: string
  field?: string
  details?: Record<string, any>
}

export interface TicketValidationError extends TicketError {
  field: string
  invalidValue: any
  expectedFormat?: string
}

export interface TicketPermissionError extends TicketError {
  requiredPermissions: string[]
  userPermissions: string[]
  resourceId: string
}

// ================================
// UTILITY TYPES
// ================================

export type TicketFieldUpdate<T extends keyof SupportTicket> = {
  field: T
  value: SupportTicket[T]
  previousValue: SupportTicket[T]
  updatedBy: string
  updatedAt: Date
}

export type TicketStatusTransition = {
  from: TicketStatus
  to: TicketStatus
  allowedRoles: CommentAuthorType[]
  requiredFields?: (keyof SupportTicket)[]
  validationRules?: string[]
}

export type TicketPermissionLevel = 'READ' | 'COMMENT' | 'UPDATE' | 'CLOSE' | 'DELETE'

export interface TicketPermissions {
  canRead: boolean
  canComment: boolean
  canUpdate: boolean
  canClose: boolean
  canDelete: boolean
  canEscalate: boolean
  canAssign: boolean
  canViewInternal: boolean
}