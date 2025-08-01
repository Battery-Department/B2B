/**
 * RHY_066 Internal Messaging System - Type Definitions
 * Enterprise-grade messaging types for FlexVolt supplier communication
 * Integrates with existing authentication and warehouse systems
 */

import { z } from 'zod'

// Base Message Types
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
export type MessagePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
export type MessageType = 'TEXT' | 'FILE' | 'SYSTEM' | 'WAREHOUSE_ALERT' | 'ORDER_UPDATE'
export type ConversationType = 'DIRECT' | 'GROUP' | 'BROADCAST' | 'WAREHOUSE_CHANNEL'
export type ParticipantRole = 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER'

// Core Message Interface
export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderRole: ParticipantRole
  content: string
  type: MessageType
  priority: MessagePriority
  status: MessageStatus
  metadata: {
    warehouseId?: string
    region?: 'US' | 'EU' | 'JAPAN' | 'AUSTRALIA'
    attachments?: Attachment[]
    mentions?: string[]
    reactions?: Reaction[]
    editHistory?: EditRecord[]
    systemData?: Record<string, any>
  }
  replyToId?: string
  isEdited: boolean
  isDeleted: boolean
  readBy: MessageRead[]
  createdAt: string
  updatedAt: string
}

// Conversation Management
export interface Conversation {
  id: string
  name: string
  description?: string
  type: ConversationType
  isActive: boolean
  participants: Participant[]
  metadata: {
    warehouseId?: string
    region?: 'US' | 'EU' | 'JAPAN' | 'AUSTRALIA'
    tags?: string[]
    customFields?: Record<string, any>
    integrations?: {
      warehouseAlerts: boolean
      orderUpdates: boolean
      inventoryNotifications: boolean
    }
  }
  lastMessage?: Message
  unreadCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

// Participant Management
export interface Participant {
  id: string
  userId: string
  userName: string
  userEmail: string
  role: ParticipantRole
  permissions: ParticipantPermission[]
  joinedAt: string
  lastSeenAt?: string
  isActive: boolean
  notificationSettings: NotificationSettings
}

export interface ParticipantPermission {
  action: 'READ' | 'WRITE' | 'DELETE' | 'ADMIN' | 'INVITE' | 'REMOVE'
  scope: 'MESSAGE' | 'CONVERSATION' | 'PARTICIPANT'
  granted: boolean
}

// Notification System
export interface NotificationSettings {
  enabled: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  warehouseAlerts: boolean
  mentions: boolean
  quietHours: {
    enabled: boolean
    start: string // HH:mm format
    end: string   // HH:mm format
    timezone: string
  }
}

// Message Components
export interface Attachment {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
  thumbnailUrl?: string
  uploadedBy: string
  uploadedAt: string
}

export interface Reaction {
  emoji: string
  userId: string
  userName: string
  createdAt: string
}

export interface EditRecord {
  id: string
  previousContent: string
  newContent: string
  editedBy: string
  editedAt: string
  reason?: string
}

export interface MessageRead {
  userId: string
  userName: string
  readAt: string
}

// Search and Filtering
export interface MessageQuery {
  conversationId?: string
  senderId?: string
  content?: string
  type?: MessageType
  priority?: MessagePriority
  status?: MessageStatus
  warehouseId?: string
  region?: 'US' | 'EU' | 'JAPAN' | 'AUSTRALIA'
  dateFrom?: string
  dateTo?: string
  hasAttachments?: boolean
  isUnread?: boolean
  limit?: number
  offset?: number
  sortBy?: 'createdAt' | 'priority' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface ConversationQuery {
  type?: ConversationType
  warehouseId?: string
  region?: 'US' | 'EU' | 'JAPAN' | 'AUSTRALIA'
  isActive?: boolean
  participantId?: string
  search?: string
  limit?: number
  offset?: number
  sortBy?: 'lastActivity' | 'createdAt' | 'name'
  sortOrder?: 'asc' | 'desc'
}

// Real-time Events
export interface MessageEvent {
  type: 'MESSAGE_SENT' | 'MESSAGE_DELIVERED' | 'MESSAGE_READ' | 'MESSAGE_EDITED' | 'MESSAGE_DELETED'
  conversationId: string
  messageId: string
  userId: string
  data: Partial<Message>
  timestamp: string
}

export interface ConversationEvent {
  type: 'CONVERSATION_CREATED' | 'CONVERSATION_UPDATED' | 'PARTICIPANT_JOINED' | 'PARTICIPANT_LEFT' | 'TYPING_START' | 'TYPING_STOP'
  conversationId: string
  userId: string
  data: Partial<Conversation> | Partial<Participant>
  timestamp: string
}

// API Request/Response Types
export interface SendMessageRequest {
  conversationId: string
  content: string
  type?: MessageType
  priority?: MessagePriority
  replyToId?: string
  attachments?: Omit<Attachment, 'id' | 'uploadedBy' | 'uploadedAt'>[]
  mentions?: string[]
  metadata?: Record<string, any>
}

export interface CreateConversationRequest {
  name: string
  description?: string
  type: ConversationType
  participantIds: string[]
  warehouseId?: string
  region?: 'US' | 'EU' | 'JAPAN' | 'AUSTRALIA'
  metadata?: Record<string, any>
}

export interface UpdateConversationRequest {
  name?: string
  description?: string
  isActive?: boolean
  metadata?: Record<string, any>
}

export interface AddParticipantRequest {
  userId: string
  role: ParticipantRole
  permissions?: ParticipantPermission[]
}

// Response Types
export interface MessagesResponse {
  success: boolean
  data: {
    messages: Message[]
    conversation: Conversation
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }
  performance: {
    responseTime: number
    cached: boolean
  }
}

export interface ConversationsResponse {
  success: boolean
  data: {
    conversations: Conversation[]
    pagination: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
    summary: {
      totalUnread: number
      activeConversations: number
      warehouseBreakdown: Record<string, number>
    }
  }
  performance: {
    responseTime: number
    cached: boolean
  }
}

export interface MessageResponse {
  success: boolean
  data: {
    message: Message
    conversation: Conversation
  }
  performance: {
    responseTime: number
  }
}

export interface ConversationResponse {
  success: boolean
  data: {
    conversation: Conversation
  }
  performance: {
    responseTime: number
  }
}

// Analytics and Reporting
export interface MessageAnalytics {
  conversationId: string
  period: {
    start: string
    end: string
  }
  metrics: {
    totalMessages: number
    uniqueParticipants: number
    averageResponseTime: number
    messagesByType: Record<MessageType, number>
    messagesByPriority: Record<MessagePriority, number>
    peakActivity: {
      hour: number
      messageCount: number
    }
    topParticipants: Array<{
      userId: string
      userName: string
      messageCount: number
    }>
  }
  trends: {
    daily: Array<{
      date: string
      messageCount: number
      participantCount: number
    }>
    hourly: Array<{
      hour: number
      messageCount: number
    }>
  }
}

// Validation Schemas
export const messageSchema = z.object({
  content: z.string().min(1).max(4000),
  type: z.enum(['TEXT', 'FILE', 'SYSTEM', 'WAREHOUSE_ALERT', 'ORDER_UPDATE']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  conversationId: z.string().uuid(),
  replyToId: z.string().uuid().optional(),
  mentions: z.array(z.string().uuid()).optional(),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileSize: z.number().positive(),
    mimeType: z.string(),
    url: z.string().url()
  })).optional()
})

export const conversationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['DIRECT', 'GROUP', 'BROADCAST', 'WAREHOUSE_CHANNEL']),
  participantIds: z.array(z.string().uuid()).min(1),
  warehouseId: z.string().uuid().optional(),
  region: z.enum(['US', 'EU', 'JAPAN', 'AUSTRALIA']).optional()
})

export const participantSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER']),
  permissions: z.array(z.object({
    action: z.enum(['READ', 'WRITE', 'DELETE', 'ADMIN', 'INVITE', 'REMOVE']),
    scope: z.enum(['MESSAGE', 'CONVERSATION', 'PARTICIPANT']),
    granted: z.boolean()
  })).optional()
})

// Error Types
export interface MessagingError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
}

// Webhook Events
export interface WebhookEvent {
  id: string
  type: string
  data: Message | Conversation | Participant
  timestamp: string
  retry: number
}

// Utility Types
export type MessageWithConversation = Message & {
  conversation: Pick<Conversation, 'id' | 'name' | 'type' | 'metadata'>
}

export type ConversationSummary = Pick<Conversation, 'id' | 'name' | 'type' | 'lastMessage' | 'unreadCount' | 'updatedAt'>

export type ParticipantSummary = Pick<Participant, 'id' | 'userId' | 'userName' | 'role' | 'lastSeenAt'>

// Integration Types for Warehouse System
export interface WarehouseMessageIntegration {
  warehouseId: string
  region: 'US' | 'EU' | 'JAPAN' | 'AUSTRALIA'
  alertTypes: {
    inventoryLow: boolean
    capacityHigh: boolean
    operationsFailed: boolean
    complianceIssues: boolean
    staffNotifications: boolean
  }
  escalationRules: {
    urgentToManagement: boolean
    failureToSupport: boolean
    complianceToLegal: boolean
  }
  automatedResponses: {
    acknowledgeAlerts: boolean
    statusUpdates: boolean
    scheduledReports: boolean
  }
}

export type { } from './warehouse'