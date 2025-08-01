/**
 * RHY Supplier Portal - Customer Communication System Types
 * Enterprise-grade communication types for FlexVolt battery supplier support
 * Integrates with existing Batch 1 authentication and warehouse systems
 */

import type { User } from '@/types/auth';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
  ORDER_UPDATE = 'ORDER_UPDATE',
  BATTERY_SUPPORT = 'BATTERY_SUPPORT',
  WAREHOUSE_INFO = 'WAREHOUSE_INFO'
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED'
}

export enum ChatStatus {
  ACTIVE = 'ACTIVE',
  QUEUED = 'QUEUED',
  CLOSED = 'CLOSED',
  TRANSFERRED = 'TRANSFERRED',
  ESCALATED = 'ESCALATED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL'
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_CUSTOMER = 'WAITING_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum TicketCategory {
  PRODUCT_INQUIRY = 'PRODUCT_INQUIRY',
  ORDER_SUPPORT = 'ORDER_SUPPORT',
  TECHNICAL_ISSUE = 'TECHNICAL_ISSUE',
  BILLING_QUESTION = 'BILLING_QUESTION',
  SHIPPING_INQUIRY = 'SHIPPING_INQUIRY',
  WARRANTY_CLAIM = 'WARRANTY_CLAIM',
  BULK_ORDERING = 'BULK_ORDERING',
  WAREHOUSE_QUESTION = 'WAREHOUSE_QUESTION'
}

export interface CustomerCommunication {
  id: string;
  customerId: string;
  supplierId: string;
  warehouseId?: string;
  subject: string;
  status: ChatStatus;
  priority: TicketPriority;
  category: TicketCategory;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  lastMessageAt?: Date;
  assignedAgentId?: string;
  metadata: {
    customerType: string;
    orderIds?: string[];
    productIds?: string[];
    estimatedValue?: number;
    customerSatisfaction?: number;
    tags?: string[];
  };
}

export interface ChatMessage {
  id: string;
  communicationId: string;
  senderId: string;
  senderType: 'CUSTOMER' | 'SUPPLIER' | 'AGENT' | 'SYSTEM';
  content: string;
  messageType: MessageType;
  status: MessageStatus;
  timestamp: Date;
  readAt?: Date;
  attachments?: MessageAttachment[];
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: string;
    location?: string;
  };
}

export interface MessageAttachment {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerId: string;
  supplierId: string;
  warehouseId?: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedAgentId?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  estimatedResolutionTime?: Date;
  customerSatisfactionScore?: number;
  tags: string[];
  metadata: {
    orderIds?: string[];
    productIds?: string[];
    batteryModels?: string[];
    warehouseRegions?: string[];
    urgencyReason?: string;
  };
}

export interface TicketUpdate {
  id: string;
  ticketId: string;
  agentId: string;
  updateType: 'STATUS_CHANGE' | 'ASSIGNMENT' | 'PRIORITY_CHANGE' | 'NOTE' | 'RESOLUTION';
  content: string;
  previousValue?: string;
  newValue?: string;
  timestamp: Date;
  isVisibleToCustomer: boolean;
}

export interface CustomerSupportAgent {
  id: string;
  name: string;
  email: string;
  role: 'AGENT' | 'SUPERVISOR' | 'SPECIALIST';
  warehouseIds: string[];
  specializations: TicketCategory[];
  isOnline: boolean;
  isAvailable: boolean;
  currentWorkload: number;
  maxConcurrentChats: number;
  averageResponseTime: number;
  customerSatisfactionRating: number;
  languages: string[];
}

export interface ChatParticipant {
  id: string;
  name: string;
  email?: string;
  role: 'CUSTOMER' | 'SUPPLIER' | 'AGENT';
  isOnline: boolean;
  lastSeen?: Date;
  avatar?: string;
}

export interface CustomerCommunicationQuery {
  page?: number;
  limit?: number;
  status?: ChatStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  warehouseId?: string;
  assignedAgentId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface SupportMetrics {
  totalTickets: number;
  openTickets: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  customerSatisfactionScore: number;
  ticketsByCategory: Record<TicketCategory, number>;
  ticketsByPriority: Record<TicketPriority, number>;
  ticketsByStatus: Record<TicketStatus, number>;
  agentPerformance: {
    agentId: string;
    name: string;
    ticketsHandled: number;
    averageResponseTime: number;
    customerSatisfaction: number;
  }[];
  trends: {
    period: string;
    ticketVolume: number;
    avgResolutionTime: number;
    satisfactionScore: number;
  }[];
}

export interface RealTimeNotification {
  id: string;
  type: 'NEW_MESSAGE' | 'TICKET_UPDATE' | 'ASSIGNMENT' | 'ESCALATION';
  recipientId: string;
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export interface CustomerCommunicationSettings {
  autoAssignment: boolean;
  workingHours: {
    start: string;
    end: string;
    timezone: string;
    workdays: number[];
  };
  escalationRules: {
    priority: TicketPriority;
    timeToEscalate: number; // minutes
    escalateTo: string; // agent role or specific agent ID
  }[];
  autoResponders: {
    enabled: boolean;
    template: string;
    delay: number; // seconds
  };
  chatbotSettings: {
    enabled: boolean;
    fallbackToHuman: boolean;
    knowledgeBase: string[];
  };
}

// API Response Types
export interface CustomerCommunicationListResponse {
  success: boolean;
  data: {
    communications: CustomerCommunication[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
    filters: {
      appliedFilters: CustomerCommunicationQuery;
      availableFilters: {
        categories: TicketCategory[];
        statuses: ChatStatus[];
        priorities: TicketPriority[];
        warehouses: { id: string; name: string }[];
        agents: { id: string; name: string }[];
      };
    };
  };
  meta: {
    requestId: string;
    timestamp: string;
    duration: string;
  };
}

export interface ChatMessagesResponse {
  success: boolean;
  data: {
    messages: ChatMessage[];
    participants: ChatParticipant[];
    communication: CustomerCommunication;
    hasMore: boolean;
    nextCursor?: string;
  };
  meta: {
    requestId: string;
    timestamp: string;
    duration: string;
  };
}

export interface TicketCreateRequest {
  customerId: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  warehouseId?: string;
  orderIds?: string[];
  productIds?: string[];
  attachments?: File[];
}

export interface MessageSendRequest {
  communicationId: string;
  content: string;
  messageType: MessageType;
  attachments?: File[];
}

export interface TicketAssignmentRequest {
  ticketId: string;
  agentId: string;
  reason?: string;
}

export interface CustomerSatisfactionRequest {
  communicationId: string;
  rating: number; // 1-5
  feedback?: string;
  categories?: string[];
}

// Error Types
export interface CommunicationError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface CommunicationValidationError {
  field: string;
  message: string;
  code: string;
}