/**
 * RHY Supplier Portal - Enhanced Customer Communication Service
 * Enterprise-grade customer support service integrating with Batch 1 foundation
 * Supports real-time chat, ticket management, and multi-warehouse operations
 */

import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { AuthService } from '@/services/auth/AuthService';
import { WarehouseService } from '@/services/warehouse/WarehouseService';
import { RealtimeService } from '@/services/RealtimeService';
import type {
  CustomerCommunication,
  ChatMessage,
  SupportTicket,
  TicketUpdate,
  CustomerSupportAgent,
  CustomerCommunicationQuery,
  SupportMetrics,
  RealTimeNotification,
  CustomerCommunicationListResponse,
  ChatMessagesResponse,
  TicketCreateRequest,
  MessageSendRequest,
  TicketAssignmentRequest,
  CustomerSatisfactionRequest,
  MessageType,
  MessageStatus,
  ChatStatus,
  TicketPriority,
  TicketStatus,
  TicketCategory
} from '@/types/communication';

// Validation schemas
const TicketCreateSchema = z.object({
  customerId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  category: z.nativeEnum(TicketCategory),
  priority: z.nativeEnum(TicketPriority),
  warehouseId: z.string().optional(),
  orderIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional()
});

const MessageSendSchema = z.object({
  communicationId: z.string().min(1),
  content: z.string().min(1).max(4000),
  messageType: z.nativeEnum(MessageType),
  attachments: z.array(z.any()).optional()
});

/**
 * Enhanced Customer Communication Service
 * Provides enterprise-grade customer support functionality
 */
export class CustomerService {
  private static instance: CustomerService;
  private readonly authService: AuthService;
  private readonly warehouseService: WarehouseService;
  private readonly realtimeService: RealtimeService;
  private readonly performanceThresholds = {
    responseTime: 100, // ms
    dbQueryTime: 50,   // ms
    realtimeDelay: 500 // ms
  };

  private constructor() {
    this.authService = AuthService.getInstance();
    this.warehouseService = WarehouseService.getInstance();
    this.realtimeService = new RealtimeService();
  }

  /**
   * Singleton pattern for service instance
   */
  public static getInstance(): CustomerService {
    if (!CustomerService.instance) {
      CustomerService.instance = new CustomerService();
    }
    return CustomerService.instance;
  }

  /**
   * Create new support ticket with comprehensive validation
   */
  public async createTicket(
    request: TicketCreateRequest,
    supplierId: string,
    securityContext: { ipAddress: string; userAgent: string }
  ): Promise<{ success: boolean; data?: SupportTicket; error?: string }> {
    const startTime = Date.now();
    
    try {
      // Validate request
      const validatedRequest = TicketCreateSchema.parse(request);
      
      // Verify customer exists and supplier has access
      const customer = await prisma.user.findUnique({
        where: { id: validatedRequest.customerId },
        include: { customer: true }
      });

      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }

      // Generate unique ticket number
      const ticketNumber = await this.generateTicketNumber();
      
      // Determine priority based on business rules
      const finalPriority = await this.calculateTicketPriority(validatedRequest);
      
      // Create ticket with comprehensive metadata
      const ticket = await prisma.supportTicket.create({
        data: {
          id: uuidv4(),
          ticketNumber,
          customerId: validatedRequest.customerId,
          supplierId,
          warehouseId: validatedRequest.warehouseId,
          title: validatedRequest.title,
          description: validatedRequest.description,
          category: validatedRequest.category,
          priority: finalPriority,
          status: TicketStatus.OPEN,
          tags: this.generateTicketTags(validatedRequest),
          metadata: {
            orderIds: validatedRequest.orderIds || [],
            productIds: validatedRequest.productIds || [],
            batteryModels: await this.identifyBatteryModels(validatedRequest.productIds || []),
            warehouseRegions: validatedRequest.warehouseId ? [validatedRequest.warehouseId] : [],
            urgencyReason: this.determineUrgencyReason(validatedRequest),
            createdBy: supplierId,
            ipAddress: securityContext.ipAddress,
            userAgent: securityContext.userAgent
          }
        }
      });

      // Create initial communication thread
      const communication = await prisma.customerCommunication.create({
        data: {
          id: uuidv4(),
          customerId: validatedRequest.customerId,
          supplierId,
          warehouseId: validatedRequest.warehouseId,
          subject: validatedRequest.title,
          status: ChatStatus.ACTIVE,
          priority: finalPriority,
          category: validatedRequest.category,
          metadata: {
            customerType: customer.role || 'DIRECT',
            orderIds: validatedRequest.orderIds || [],
            productIds: validatedRequest.productIds || [],
            estimatedValue: await this.calculateEstimatedValue(validatedRequest),
            tags: this.generateTicketTags(validatedRequest),
            ticketId: ticket.id
          }
        }
      });

      // Auto-assign agent based on business rules
      const assignedAgent = await this.autoAssignAgent(ticket, communication);
      if (assignedAgent) {
        await this.assignTicketToAgent(ticket.id, assignedAgent.id, 'AUTO_ASSIGNMENT');
      }

      // Send real-time notifications
      await this.sendTicketNotifications(ticket, 'TICKET_CREATED');

      // Log performance metrics
      const duration = Date.now() - startTime;
      logger.info('Ticket created successfully', {
        ticketId: ticket.id,
        ticketNumber,
        duration,
        customerId: validatedRequest.customerId,
        supplierId,
        category: validatedRequest.category,
        priority: finalPriority
      });

      // Audit log the operation
      await this.auditTicketOperation('CREATE', ticket.id, supplierId, {
        request: validatedRequest,
        result: ticket,
        securityContext
      });

      return { 
        success: true, 
        data: ticket as SupportTicket 
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to create ticket', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        supplierId,
        request
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create ticket'
      };
    }
  }

  /**
   * Send message in real-time chat with enterprise validation
   */
  public async sendMessage(
    request: MessageSendRequest,
    senderId: string,
    senderType: 'CUSTOMER' | 'SUPPLIER' | 'AGENT',
    securityContext: { ipAddress: string; userAgent: string }
  ): Promise<{ success: boolean; data?: ChatMessage; error?: string }> {
    const startTime = Date.now();

    try {
      // Validate request
      const validatedRequest = MessageSendSchema.parse(request);

      // Verify communication exists and user has access
      const communication = await prisma.customerCommunication.findUnique({
        where: { id: validatedRequest.communicationId },
        include: {
          customer: true,
          supplier: true
        }
      });

      if (!communication) {
        return { success: false, error: 'Communication not found' };
      }

      // Verify access permissions
      const hasAccess = await this.verifyMessageAccess(communication, senderId, senderType);
      if (!hasAccess) {
        return { success: false, error: 'Access denied' };
      }

      // Create message with metadata
      const message = await prisma.chatMessage.create({
        data: {
          id: uuidv4(),
          communicationId: validatedRequest.communicationId,
          senderId,
          senderType,
          content: validatedRequest.content,
          messageType: validatedRequest.messageType,
          status: MessageStatus.SENT,
          metadata: {
            ipAddress: securityContext.ipAddress,
            userAgent: securityContext.userAgent,
            deviceInfo: this.extractDeviceInfo(securityContext.userAgent),
            location: await this.getLocationFromIP(securityContext.ipAddress)
          }
        }
      });

      // Update communication last message timestamp
      await prisma.customerCommunication.update({
        where: { id: validatedRequest.communicationId },
        data: { 
          lastMessageAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Send real-time message to all participants
      await this.broadcastMessage(message, communication);

      // Update message status to delivered
      await this.updateMessageStatus(message.id, MessageStatus.DELIVERED);

      // Track response times for performance monitoring
      await this.trackResponseTime(communication.id, senderType, startTime);

      const duration = Date.now() - startTime;
      logger.info('Message sent successfully', {
        messageId: message.id,
        communicationId: validatedRequest.communicationId,
        senderId,
        senderType,
        duration
      });

      return {
        success: true,
        data: message as ChatMessage
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to send message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        senderId,
        request
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  }

  /**
   * Get customer communications with advanced filtering and pagination
   */
  public async getCommunications(
    query: CustomerCommunicationQuery,
    supplierId: string
  ): Promise<CustomerCommunicationListResponse> {
    const startTime = Date.now();

    try {
      const page = query.page || 1;
      const limit = Math.min(query.limit || 25, 100); // Max 100 items per page
      const skip = (page - 1) * limit;

      // Build dynamic where clause
      const whereClause: any = {
        supplierId
      };

      if (query.status?.length) {
        whereClause.status = { in: query.status };
      }

      if (query.priority?.length) {
        whereClause.priority = { in: query.priority };
      }

      if (query.category?.length) {
        whereClause.category = { in: query.category };
      }

      if (query.warehouseId) {
        whereClause.warehouseId = query.warehouseId;
      }

      if (query.assignedAgentId) {
        whereClause.assignedAgentId = query.assignedAgentId;
      }

      if (query.dateFrom || query.dateTo) {
        whereClause.createdAt = {};
        if (query.dateFrom) whereClause.createdAt.gte = query.dateFrom;
        if (query.dateTo) whereClause.createdAt.lte = query.dateTo;
      }

      if (query.search) {
        whereClause.OR = [
          { subject: { contains: query.search, mode: 'insensitive' } },
          { customer: { name: { contains: query.search, mode: 'insensitive' } } },
          { customer: { email: { contains: query.search, mode: 'insensitive' } } }
        ];
      }

      // Execute queries in parallel
      const [communications, total] = await Promise.all([
        prisma.customerCommunication.findMany({
          where: whereClause,
          include: {
            customer: {
              select: { id: true, name: true, email: true, role: true }
            },
            supplier: {
              select: { id: true, name: true, email: true }
            },
            assignedAgent: {
              select: { id: true, name: true, email: true, isOnline: true }
            },
            _count: {
              select: { messages: true }
            }
          },
          orderBy: {
            [query.sortBy || 'updatedAt']: query.sortOrder || 'desc'
          },
          skip,
          take: limit
        }),
        prisma.customerCommunication.count({ where: whereClause })
      ]);

      const duration = Date.now() - startTime;
      logger.info('Communications retrieved', {
        count: communications.length,
        total,
        page,
        limit,
        duration,
        supplierId
      });

      return {
        success: true,
        data: {
          communications: communications as CustomerCommunication[],
          pagination: {
            page,
            limit,
            total,
            hasMore: (page * limit) < total
          },
          filters: {
            appliedFilters: query,
            availableFilters: await this.getAvailableFilters(supplierId)
          }
        },
        meta: {
          requestId: uuidv4(),
          timestamp: new Date().toISOString(),
          duration: `${duration}ms`
        }
      };

    } catch (error) {
      logger.error('Failed to get communications', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
        supplierId
      });

      return {
        success: false,
        data: {
          communications: [],
          pagination: { page: 1, limit: 25, total: 0, hasMore: false },
          filters: { appliedFilters: query, availableFilters: {} as any }
        },
        meta: {
          requestId: uuidv4(),
          timestamp: new Date().toISOString(),
          duration: '0ms'
        }
      } as CustomerCommunicationListResponse;
    }
  }

  /**
   * Get chat messages with real-time updates
   */
  public async getChatMessages(
    communicationId: string,
    userId: string,
    cursor?: string,
    limit: number = 50
  ): Promise<ChatMessagesResponse> {
    const startTime = Date.now();

    try {
      // Verify access to communication
      const communication = await prisma.customerCommunication.findUnique({
        where: { id: communicationId },
        include: {
          customer: true,
          supplier: true,
          assignedAgent: true
        }
      });

      if (!communication) {
        throw new Error('Communication not found');
      }

      // Build query for messages
      const whereClause: any = { communicationId };
      if (cursor) {
        whereClause.timestamp = { lt: new Date(cursor) };
      }

      const messages = await prisma.chatMessage.findMany({
        where: whereClause,
        include: {
          attachments: true,
          sender: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        take: limit + 1
      });

      const hasMore = messages.length > limit;
      if (hasMore) messages.pop();

      // Mark messages as read by current user
      await this.markMessagesAsRead(messages.map(m => m.id), userId);

      // Build participants list
      const participants = [
        {
          id: communication.customer.id,
          name: communication.customer.name || 'Customer',
          email: communication.customer.email,
          role: 'CUSTOMER' as const,
          isOnline: await this.isUserOnline(communication.customer.id)
        },
        {
          id: communication.supplier.id,
          name: communication.supplier.name || 'Supplier',
          email: communication.supplier.email,
          role: 'SUPPLIER' as const,
          isOnline: await this.isUserOnline(communication.supplier.id)
        }
      ];

      if (communication.assignedAgent) {
        participants.push({
          id: communication.assignedAgent.id,
          name: communication.assignedAgent.name,
          email: communication.assignedAgent.email,
          role: 'AGENT' as const,
          isOnline: communication.assignedAgent.isOnline
        });
      }

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: {
          messages: messages as ChatMessage[],
          participants,
          communication: communication as CustomerCommunication,
          hasMore,
          nextCursor: hasMore ? messages[messages.length - 1].timestamp.toISOString() : undefined
        },
        meta: {
          requestId: uuidv4(),
          timestamp: new Date().toISOString(),
          duration: `${duration}ms`
        }
      };

    } catch (error) {
      logger.error('Failed to get chat messages', {
        error: error instanceof Error ? error.message : 'Unknown error',
        communicationId,
        userId
      });

      throw error;
    }
  }

  /**
   * Get comprehensive support metrics for dashboard
   */
  public async getSupportMetrics(
    supplierId: string,
    warehouseId?: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<SupportMetrics> {
    const startTime = Date.now();

    try {
      const whereClause: any = { supplierId };
      if (warehouseId) whereClause.warehouseId = warehouseId;
      if (dateRange) {
        whereClause.createdAt = {
          gte: dateRange.from,
          lte: dateRange.to
        };
      }

      // Execute parallel queries for comprehensive metrics
      const [
        totalTickets,
        openTickets,
        avgResponseTime,
        avgResolutionTime,
        satisfactionData,
        categoryBreakdown,
        priorityBreakdown,
        statusBreakdown,
        agentPerformance,
        trends
      ] = await Promise.all([
        prisma.supportTicket.count({ where: whereClause }),
        prisma.supportTicket.count({ 
          where: { ...whereClause, status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] } }
        }),
        this.calculateAverageResponseTime(whereClause),
        this.calculateAverageResolutionTime(whereClause),
        this.calculateCustomerSatisfaction(whereClause),
        this.getTicketBreakdownByCategory(whereClause),
        this.getTicketBreakdownByPriority(whereClause),
        this.getTicketBreakdownByStatus(whereClause),
        this.getAgentPerformanceMetrics(supplierId, warehouseId),
        this.getSupportTrends(whereClause)
      ]);

      const duration = Date.now() - startTime;
      logger.info('Support metrics calculated', {
        duration,
        supplierId,
        warehouseId,
        totalTickets,
        openTickets
      });

      return {
        totalTickets,
        openTickets,
        averageResponseTime: avgResponseTime,
        averageResolutionTime: avgResolutionTime,
        customerSatisfactionScore: satisfactionData.average,
        ticketsByCategory: categoryBreakdown,
        ticketsByPriority: priorityBreakdown,
        ticketsByStatus: statusBreakdown,
        agentPerformance,
        trends
      };

    } catch (error) {
      logger.error('Failed to calculate support metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        supplierId,
        warehouseId
      });

      // Return default metrics on error
      return {
        totalTickets: 0,
        openTickets: 0,
        averageResponseTime: 0,
        averageResolutionTime: 0,
        customerSatisfactionScore: 0,
        ticketsByCategory: {} as Record<TicketCategory, number>,
        ticketsByPriority: {} as Record<TicketPriority, number>,
        ticketsByStatus: {} as Record<TicketStatus, number>,
        agentPerformance: [],
        trends: []
      };
    }
  }

  // Private helper methods

  private async generateTicketNumber(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `RHY-${timestamp}-${random}`;
  }

  private async calculateTicketPriority(request: TicketCreateRequest): Promise<TicketPriority> {
    // Business logic for dynamic priority calculation
    if (request.category === TicketCategory.TECHNICAL_ISSUE && request.orderIds?.length) {
      return TicketPriority.HIGH;
    }
    if (request.category === TicketCategory.BULK_ORDERING) {
      return TicketPriority.MEDIUM;
    }
    return request.priority;
  }

  private generateTicketTags(request: TicketCreateRequest): string[] {
    const tags: string[] = [request.category];
    if (request.orderIds?.length) tags.push('HAS_ORDERS');
    if (request.productIds?.length) tags.push('PRODUCT_SPECIFIC');
    if (request.warehouseId) tags.push('WAREHOUSE_SPECIFIC');
    return tags;
  }

  private async identifyBatteryModels(productIds: string[]): Promise<string[]> {
    if (!productIds.length) return [];
    
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { name: true, category: true }
    });
    
    return products.map(p => p.name);
  }

  private determineUrgencyReason(request: TicketCreateRequest): string {
    if (request.priority === TicketPriority.URGENT || request.priority === TicketPriority.CRITICAL) {
      return `${request.category} marked as ${request.priority}`;
    }
    return '';
  }

  private async calculateEstimatedValue(request: TicketCreateRequest): Promise<number> {
    if (!request.orderIds?.length) return 0;
    
    const orders = await prisma.order.findMany({
      where: { id: { in: request.orderIds } },
      select: { total: true }
    });
    
    return orders.reduce((sum, order) => sum + (order.total || 0), 0);
  }

  private async autoAssignAgent(
    ticket: any, 
    communication: any
  ): Promise<CustomerSupportAgent | null> {
    // Auto-assignment logic based on workload, specialization, and availability
    const availableAgents = await prisma.customerSupportAgent.findMany({
      where: {
        isOnline: true,
        isAvailable: true,
        specializations: { has: ticket.category },
        warehouseIds: ticket.warehouseId ? { has: ticket.warehouseId } : undefined
      },
      orderBy: { currentWorkload: 'asc' }
    });

    return availableAgents[0] as CustomerSupportAgent || null;
  }

  private async assignTicketToAgent(ticketId: string, agentId: string, reason: string): Promise<void> {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assignedAgentId: agentId }
    });

    await prisma.ticketUpdate.create({
      data: {
        id: uuidv4(),
        ticketId,
        agentId,
        updateType: 'ASSIGNMENT',
        content: `Ticket assigned to agent - ${reason}`,
        newValue: agentId,
        timestamp: new Date(),
        isVisibleToCustomer: false
      }
    });
  }

  private async sendTicketNotifications(ticket: any, type: string): Promise<void> {
    // Real-time notification logic
    await this.realtimeService.broadcast('ticket-notification', {
      type,
      ticketId: ticket.id,
      customerId: ticket.customerId,
      supplierId: ticket.supplierId,
      data: ticket
    });
  }

  private async auditTicketOperation(
    operation: string,
    ticketId: string,
    userId: string,
    metadata: any
  ): Promise<void> {
    // Comprehensive audit logging
    logger.info(`Ticket ${operation}`, {
      operation,
      ticketId,
      userId,
      timestamp: new Date().toISOString(),
      metadata
    });
  }

  private async verifyMessageAccess(
    communication: any,
    senderId: string,
    senderType: string
  ): Promise<boolean> {
    switch (senderType) {
      case 'CUSTOMER':
        return communication.customerId === senderId;
      case 'SUPPLIER':
        return communication.supplierId === senderId;
      case 'AGENT':
        return communication.assignedAgentId === senderId;
      default:
        return false;
    }
  }

  private extractDeviceInfo(userAgent: string): string {
    // Extract device information from user agent
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  }

  private async getLocationFromIP(ipAddress: string): Promise<string> {
    // IP geolocation (mock implementation)
    return 'Unknown';
  }

  private async broadcastMessage(message: any, communication: any): Promise<void> {
    await this.realtimeService.broadcast(`chat-${communication.id}`, {
      type: 'NEW_MESSAGE',
      message,
      communicationId: communication.id
    });
  }

  private async updateMessageStatus(messageId: string, status: MessageStatus): Promise<void> {
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { status }
    });
  }

  private async trackResponseTime(
    communicationId: string,
    senderType: string,
    startTime: number
  ): Promise<void> {
    const responseTime = Date.now() - startTime;
    
    // Track performance metrics
    logger.info('Response time tracked', {
      communicationId,
      senderType,
      responseTime
    });
  }

  private async markMessagesAsRead(messageIds: string[], userId: string): Promise<void> {
    await prisma.chatMessage.updateMany({
      where: {
        id: { in: messageIds },
        senderId: { not: userId },
        status: { not: MessageStatus.READ }
      },
      data: {
        status: MessageStatus.READ,
        readAt: new Date()
      }
    });
  }

  private async isUserOnline(userId: string): Promise<boolean> {
    // Check user online status (implementation depends on real-time service)
    return false; // Mock implementation
  }

  private async getAvailableFilters(supplierId: string): Promise<any> {
    // Get available filter options for the UI
    return {
      categories: Object.values(TicketCategory),
      statuses: Object.values(ChatStatus),
      priorities: Object.values(TicketPriority),
      warehouses: [],
      agents: []
    };
  }

  private async calculateAverageResponseTime(whereClause: any): Promise<number> {
    // Calculate average response time for support metrics
    return 0; // Mock implementation
  }

  private async calculateAverageResolutionTime(whereClause: any): Promise<number> {
    // Calculate average resolution time for support metrics
    return 0; // Mock implementation
  }

  private async calculateCustomerSatisfaction(whereClause: any): Promise<{ average: number }> {
    // Calculate customer satisfaction metrics
    return { average: 0 }; // Mock implementation
  }

  private async getTicketBreakdownByCategory(whereClause: any): Promise<Record<TicketCategory, number>> {
    // Get ticket breakdown by category
    return {} as Record<TicketCategory, number>; // Mock implementation
  }

  private async getTicketBreakdownByPriority(whereClause: any): Promise<Record<TicketPriority, number>> {
    // Get ticket breakdown by priority
    return {} as Record<TicketPriority, number>; // Mock implementation
  }

  private async getTicketBreakdownByStatus(whereClause: any): Promise<Record<TicketStatus, number>> {
    // Get ticket breakdown by status
    return {} as Record<TicketStatus, number>; // Mock implementation
  }

  private async getAgentPerformanceMetrics(supplierId: string, warehouseId?: string): Promise<any[]> {
    // Get agent performance metrics
    return []; // Mock implementation
  }

  private async getSupportTrends(whereClause: any): Promise<any[]> {
    // Get support trends data
    return []; // Mock implementation
  }
}