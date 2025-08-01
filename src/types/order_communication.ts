/**
 * RHY Supplier Portal - Order Communication Types
 * Enterprise-grade order communication system for FlexVolt battery suppliers
 * Supports real-time messaging, notifications, and multi-warehouse communication
 */

import { z } from 'zod'

// ============================================================================
// CORE ORDER COMMUNICATION TYPES
// ============================================================================

export interface OrderMessage {
  id: string
  orderId: string
  senderId: string
  senderType: 'SUPPLIER' | 'CUSTOMER' | 'WAREHOUSE' | 'SYSTEM'
  receiverId?: string
  receiverType: 'SUPPLIER' | 'CUSTOMER' | 'WAREHOUSE' | 'SYSTEM'
  messageType: 'UPDATE' | 'QUERY' | 'NOTIFICATION' | 'ALERT' | 'CONFIRMATION' | 'ESCALATION'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL'
  subject: string
  content: string
  metadata: {
    warehouseId?: string
    orderStatus?: string
    trackingNumber?: string
    estimatedDelivery?: Date
    attachments?: MessageAttachment[]
    templates?: string[]
    automation?: boolean
  }
  status: 'SENT' | 'DELIVERED' | 'READ' | 'REPLIED' | 'ARCHIVED'
  sentAt: Date
  deliveredAt?: Date
  readAt?: Date
  repliedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface MessageAttachment {
  id: string
  filename: string
  size: number
  mimeType: string
  url: string
  uploadedAt: Date
}

export interface OrderCommunicationThread {
  id: string
  orderId: string
  participants: ThreadParticipant[]
  subject: string
  status: 'ACTIVE' | 'RESOLVED' | 'CLOSED' | 'ESCALATED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL'
  messageCount: number
  lastMessageAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface ThreadParticipant {
  id: string
  type: 'SUPPLIER' | 'CUSTOMER' | 'WAREHOUSE' | 'SYSTEM'
  name: string
  email?: string
  role?: string
  permissions: string[]
  joinedAt: Date
  lastReadAt?: Date
}

export interface NotificationPreferences {
  userId: string
  email: {
    orderUpdates: boolean
    deliveryNotifications: boolean
    paymentAlerts: boolean
    systemMessages: boolean
    marketingEmails: boolean
  }
  sms: {
    urgentAlerts: boolean
    deliveryUpdates: boolean
    orderConfirmations: boolean
  }
  push: {
    realTimeUpdates: boolean
    backgroundSync: boolean
    soundEnabled: boolean
  }
  frequency: 'IMMEDIATE' | 'HOURLY' | 'DAILY' | 'WEEKLY'
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
    timezone: string
  }
}

export interface CommunicationTemplate {
  id: string
  name: string
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP'
  category: 'ORDER_UPDATE' | 'DELIVERY' | 'PAYMENT' | 'SYSTEM' | 'MARKETING'
  subject: string
  content: string
  variables: TemplateVariable[]
  conditions: TemplateCondition[]
  warehouseSpecific: boolean
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TemplateVariable {
  name: string
  type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'OBJECT'
  required: boolean
  defaultValue?: string
  description: string
}

export interface TemplateCondition {
  field: string
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN'
  value: string
  action: 'INCLUDE' | 'EXCLUDE' | 'MODIFY'
}

// ============================================================================
// ORDER COMMUNICATION ANALYTICS
// ============================================================================

export interface CommunicationMetrics {
  orderId: string
  warehouseId: string
  totalMessages: number
  responseTime: {
    average: number
    median: number
    p95: number
  }
  resolutionTime: number
  escalationRate: number
  customerSatisfaction?: number
  communicationChannels: {
    email: number
    sms: number
    push: number
    inApp: number
  }
  messagesByPriority: {
    low: number
    normal: number
    high: number
    urgent: number
    critical: number
  }
  calculatedAt: Date
}

export interface CommunicationAnalytics {
  period: {
    start: Date
    end: Date
  }
  warehouse: string
  totalOrders: number
  totalMessages: number
  averageMessagesPerOrder: number
  responseMetrics: {
    averageResponseTime: number
    onTimeResponseRate: number
    escalationRate: number
  }
  channelPerformance: {
    email: {
      deliveryRate: number
      openRate: number
      clickRate: number
    }
    sms: {
      deliveryRate: number
      responseRate: number
    }
    push: {
      deliveryRate: number
      engagementRate: number
    }
  }
  customerSatisfaction: {
    averageRating: number
    responseCount: number
    distribution: Record<number, number>
  }
  trends: {
    messageVolume: TimeSeriesData[]
    responseTime: TimeSeriesData[]
    satisfaction: TimeSeriesData[]
  }
}

export interface TimeSeriesData {
  timestamp: Date
  value: number
  metadata?: Record<string, any>
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface SendMessageRequest {
  orderId: string
  receiverId?: string
  receiverType: 'SUPPLIER' | 'CUSTOMER' | 'WAREHOUSE' | 'SYSTEM'
  messageType: 'UPDATE' | 'QUERY' | 'NOTIFICATION' | 'ALERT' | 'CONFIRMATION' | 'ESCALATION'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL'
  subject: string
  content: string
  attachments?: File[]
  templateId?: string
  templateVariables?: Record<string, any>
  scheduledFor?: Date
}

export interface SendMessageResponse {
  success: boolean
  messageId: string
  threadId: string
  estimatedDelivery: Date
  channels: string[]
  error?: string
}

export interface GetMessagesRequest {
  orderId?: string
  threadId?: string
  senderId?: string
  receiverId?: string
  messageType?: string
  priority?: string
  status?: string
  dateFrom?: Date
  dateTo?: Date
  limit?: number
  offset?: number
  sortBy?: 'sentAt' | 'priority' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface GetMessagesResponse {
  success: boolean
  messages: OrderMessage[]
  threads: OrderCommunicationThread[]
  totalCount: number
  hasMore: boolean
  nextOffset?: number
  error?: string
}

export interface UpdateNotificationPreferencesRequest {
  preferences: Partial<NotificationPreferences>
}

export interface UpdateNotificationPreferencesResponse {
  success: boolean
  preferences: NotificationPreferences
  error?: string
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const SendMessageSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  receiverId: z.string().uuid('Invalid receiver ID').optional(),
  receiverType: z.enum(['SUPPLIER', 'CUSTOMER', 'WAREHOUSE', 'SYSTEM']),
  messageType: z.enum(['UPDATE', 'QUERY', 'NOTIFICATION', 'ALERT', 'CONFIRMATION', 'ESCALATION']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL']),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  templateId: z.string().uuid('Invalid template ID').optional(),
  templateVariables: z.record(z.any()).optional(),
  scheduledFor: z.date().optional()
})

const GetMessagesSchema = z.object({
  orderId: z.string().uuid('Invalid order ID').optional(),
  threadId: z.string().uuid('Invalid thread ID').optional(),
  senderId: z.string().uuid('Invalid sender ID').optional(),
  receiverId: z.string().uuid('Invalid receiver ID').optional(),
  messageType: z.enum(['UPDATE', 'QUERY', 'NOTIFICATION', 'ALERT', 'CONFIRMATION', 'ESCALATION']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
  status: z.enum(['SENT', 'DELIVERED', 'READ', 'REPLIED', 'ARCHIVED']).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['sentAt', 'priority', 'status']).default('sentAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

const NotificationPreferencesSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  email: z.object({
    orderUpdates: z.boolean(),
    deliveryNotifications: z.boolean(),
    paymentAlerts: z.boolean(),
    systemMessages: z.boolean(),
    marketingEmails: z.boolean()
  }),
  sms: z.object({
    urgentAlerts: z.boolean(),
    deliveryUpdates: z.boolean(),
    orderConfirmations: z.boolean()
  }),
  push: z.object({
    realTimeUpdates: z.boolean(),
    backgroundSync: z.boolean(),
    soundEnabled: z.boolean()
  }),
  frequency: z.enum(['IMMEDIATE', 'HOURLY', 'DAILY', 'WEEKLY']),
  quietHours: z.object({
    enabled: z.boolean(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    timezone: z.string()
  })
})

// ============================================================================
// REAL-TIME COMMUNICATION TYPES
// ============================================================================

export interface RealTimeMessage {
  type: 'MESSAGE' | 'STATUS_UPDATE' | 'TYPING' | 'PRESENCE' | 'NOTIFICATION'
  orderId: string
  threadId?: string
  senderId: string
  data: any
  timestamp: Date
}

export interface TypingIndicator {
  threadId: string
  userId: string
  isTyping: boolean
  timestamp: Date
}

export interface PresenceStatus {
  userId: string
  status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE'
  lastSeen: Date
  warehouse?: string
}

export interface WebSocketEvent {
  event: string
  data: any
  timestamp: Date
  userId?: string
  orderId?: string
  threadId?: string
}

// ============================================================================
// ERROR TYPES
// ============================================================================

class OrderCommunicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'OrderCommunicationError'
  }
}

export type CommunicationErrorCode = 
  | 'INVALID_ORDER'
  | 'INVALID_USER'
  | 'PERMISSION_DENIED'
  | 'MESSAGE_TOO_LARGE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'TEMPLATE_NOT_FOUND'
  | 'DELIVERY_FAILED'
  | 'VALIDATION_ERROR'
  | 'SYSTEM_ERROR'

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

export interface OrderCommunicationConfig {
  realTimeEnabled: boolean
  maxMessageSize: number
  maxAttachmentSize: number
  allowedAttachmentTypes: string[]
  rateLimits: {
    messagesPerMinute: number
    messagesPerHour: number
    messagesPerDay: number
  }
  retention: {
    messagesDays: number
    attachmentsDays: number
    analyticsMonths: number
  }
  notifications: {
    emailEnabled: boolean
    smsEnabled: boolean
    pushEnabled: boolean
    webhooksEnabled: boolean
  }
  templates: {
    autoTranslation: boolean
    supportedLanguages: string[]
    defaultLanguage: string
  }
}

export interface ExternalIntegration {
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK' | 'SLACK' | 'TEAMS'
  provider: string
  config: Record<string, any>
  enabled: boolean
  priority: number
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  OrderMessage,
  MessageAttachment,
  OrderCommunicationThread,
  ThreadParticipant,
  NotificationPreferences,
  CommunicationTemplate,
  TemplateVariable,
  TemplateCondition,
  CommunicationMetrics,
  CommunicationAnalytics,
  TimeSeriesData,
  SendMessageRequest,
  SendMessageResponse,
  GetMessagesRequest,
  GetMessagesResponse,
  UpdateNotificationPreferencesRequest,
  UpdateNotificationPreferencesResponse,
  RealTimeMessage,
  TypingIndicator,
  PresenceStatus,
  WebSocketEvent,
  OrderCommunicationConfig,
  ExternalIntegration
}

export {
  SendMessageSchema,
  GetMessagesSchema,
  NotificationPreferencesSchema,
  OrderCommunicationError,
  type CommunicationErrorCode
}