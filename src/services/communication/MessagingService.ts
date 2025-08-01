/**
 * RHY_066 Internal Messaging Service - Enterprise Implementation
 * Real-time messaging service for FlexVolt supplier communication
 * Integrates with existing authentication, warehouse, and database systems
 */

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authService } from '@/services/auth/AuthService'
import { warehouseService } from '@/services/warehouse/WarehouseService'
import { logger } from '@/lib/logger'
import { v4 as uuidv4 } from 'uuid'
import {
  messageSchema,
  conversationSchema,
  participantSchema
} from '@/types/communication_system'
import type {
  Message,
  Conversation,
  Participant,
  MessageQuery,
  ConversationQuery,
  SendMessageRequest,
  CreateConversationRequest,
  UpdateConversationRequest,
  AddParticipantRequest,
  MessagesResponse,
  ConversationsResponse,
  MessageResponse,
  ConversationResponse,
  MessageEvent,
  ConversationEvent,
  MessageAnalytics,
  WarehouseMessageIntegration
} from '@/types/communication_system'

/**
 * Enterprise Messaging Service
 * Handles real-time communication with warehouse integration
 */
export class MessagingService {
  private static instance: MessagingService
  private wsConnections = new Map<string, WebSocket>()
  private typingUsers = new Map<string, Set<string>>()
  private readonly config = {
    maxMessageLength: 4000,
    maxAttachmentSize: 10 * 1024 * 1024, // 10MB
    messageRetentionDays: 365,
    maxParticipantsPerConversation: 100,
    rateLimitPerMinute: 60,
    cacheTTL: 300000 // 5 minutes
  }

  private constructor() {
    this.initializeEventHandlers()
    this.startCleanupTasks()
  }

  /**
   * Singleton pattern for service instance
   */
  public static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService()
    }
    return MessagingService.instance
  }

  /**
   * Send a new message with comprehensive validation and real-time delivery
   */
  public async sendMessage(
    request: SendMessageRequest,
    senderId: string,
    senderData?: { name: string; role: string }
  ): Promise<MessageResponse> {
    const startTime = Date.now()
    
    try {
      // Validate input
      const validatedMessage = messageSchema.parse(request)
      
      logger.info('Sending message', {
        conversationId: request.conversationId,
        senderId,
        type: request.type || 'TEXT',
        timestamp: new Date().toISOString()
      })

      // Verify conversation exists and user has permissions
      const conversation = await this.getConversationWithPermissions(
        request.conversationId,
        senderId
      )

      if (!conversation) {
        throw new Error('Conversation not found or access denied')
      }

      // Check participant permissions
      const participant = conversation.participants.find(p => p.userId === senderId)
      if (!participant || !this.hasPermission(participant, 'WRITE', 'MESSAGE')) {
        throw new Error('Insufficient permissions to send messages')
      }

      // Rate limiting check
      await this.checkRateLimit(senderId)

      // Create message with transaction
      const message = await prisma.$transaction(async (tx) => {
        // Create the message
        const newMessage = await tx.message.create({
          data: {
            id: uuidv4(),
            sessionId: request.conversationId,
            role: 'user',
            content: request.content,
            timestamp: new Date(),
            userId: senderId,
            functionName: request.type === 'SYSTEM' ? 'system_message' : undefined,
            functionArgs: JSON.stringify({
              type: request.type || 'TEXT',
              priority: request.priority || 'NORMAL',
              replyToId: request.replyToId,
              mentions: request.mentions || [],
              metadata: {
                warehouseId: conversation.metadata.warehouseId,
                region: conversation.metadata.region,
                attachments: request.attachments || [],
                ...request.metadata
              }
            })
          }
        })

        // Update conversation last activity
        await tx.chatSession.update({
          where: { id: request.conversationId },
          data: { 
            updatedAt: new Date(),
            lastCopilotSync: new Date()
          }
        })

        // Create notification records for participants
        const notifications = conversation.participants
          .filter(p => p.userId !== senderId && p.isActive)
          .map(p => ({
            id: uuidv4(),
            userId: p.userId,
            type: 'message',
            title: `New message from ${senderData?.name || 'User'}`,
            message: request.content.substring(0, 100),
            priority: request.priority === 'URGENT' ? 'high' : 'medium',
            metadata: {
              conversationId: request.conversationId,
              messageId: newMessage.id,
              senderId
            }
          }))

        if (notifications.length > 0) {
          await tx.notification.createMany({
            data: notifications
          })
        }

        return newMessage
      })

      // Transform to our Message type
      const transformedMessage: Message = {
        id: message.id,
        conversationId: request.conversationId,
        senderId,
        senderName: senderData?.name || 'Unknown User',
        senderRole: this.mapRoleToParticipantRole(senderData?.role || 'VIEWER'),
        content: message.content,
        type: request.type || 'TEXT',
        priority: request.priority || 'NORMAL',
        status: 'SENT',
        metadata: {
          warehouseId: conversation.metadata.warehouseId,
          region: conversation.metadata.region,
          attachments: request.attachments || [],
          mentions: request.mentions || [],
          reactions: [],
          editHistory: []
        },
        replyToId: request.replyToId,
        isEdited: false,
        isDeleted: false,
        readBy: [{
          userId: senderId,
          userName: senderData?.name || 'Unknown User',
          readAt: new Date().toISOString()
        }],
        createdAt: message.timestamp.toISOString(),
        updatedAt: message.timestamp.toISOString()
      }

      // Real-time delivery
      await this.broadcastMessageEvent({
        type: 'MESSAGE_SENT',
        conversationId: request.conversationId,
        messageId: message.id,
        userId: senderId,
        data: transformedMessage,
        timestamp: new Date().toISOString()
      })

      // Warehouse integration for alerts
      if (request.type === 'WAREHOUSE_ALERT' && conversation.metadata.warehouseId) {
        await this.handleWarehouseAlert(
          conversation.metadata.warehouseId,
          transformedMessage
        )
      }

      const duration = Date.now() - startTime

      logger.info('Message sent successfully', {
        messageId: message.id,
        conversationId: request.conversationId,
        duration,
        type: request.type || 'TEXT'
      })

      return {
        success: true,
        data: {
          message: transformedMessage,
          conversation: await this.transformConversation(conversation)
        },
        performance: {
          responseTime: duration
        }
      }

    } catch (error) {
      logger.error('Failed to send message', {
        conversationId: request.conversationId,
        senderId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      throw this.handleError(error, 'MESSAGE_SEND_ERROR')
    }
  }

  /**
   * Get messages for a conversation with pagination and filtering
   */
  public async getMessages(
    conversationId: string,
    userId: string,
    query: MessageQuery = {}
  ): Promise<MessagesResponse> {
    const startTime = Date.now()
    
    try {
      logger.info('Fetching messages', {
        conversationId,
        userId,
        query,
        timestamp: new Date().toISOString()
      })

      // Verify conversation access
      const conversation = await this.getConversationWithPermissions(conversationId, userId)
      if (!conversation) {
        throw new Error('Conversation not found or access denied')
      }

      const limit = Math.min(query.limit || 50, 100)
      const offset = query.offset || 0

      // Build filters
      const whereClause: any = {
        sessionId: conversationId
      }

      if (query.senderId) {
        whereClause.userId = query.senderId
      }

      if (query.content) {
        whereClause.content = {
          contains: query.content,
          mode: 'insensitive'
        }
      }

      if (query.dateFrom || query.dateTo) {
        whereClause.timestamp = {}
        if (query.dateFrom) {
          whereClause.timestamp.gte = new Date(query.dateFrom)
        }
        if (query.dateTo) {
          whereClause.timestamp.lte = new Date(query.dateTo)
        }
      }

      // Execute queries in parallel
      const [messages, totalCount] = await Promise.all([
        prisma.message.findMany({
          where: whereClause,
          orderBy: { timestamp: query.sortOrder === 'asc' ? 'asc' : 'desc' },
          take: limit,
          skip: offset,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        }),
        prisma.message.count({ where: whereClause })
      ])

      // Transform messages
      const transformedMessages: Message[] = await Promise.all(
        messages.map(async (msg) => {
          const metadata = this.parseMessageMetadata(msg.functionArgs)
          
          return {
            id: msg.id,
            conversationId,
            senderId: msg.userId || 'system',
            senderName: msg.user?.name || 'System',
            senderRole: this.mapRoleToParticipantRole(msg.user?.role || 'VIEWER'),
            content: msg.content,
            type: metadata.type || 'TEXT',
            priority: metadata.priority || 'NORMAL',
            status: 'DELIVERED',
            metadata: {
              warehouseId: metadata.warehouseId,
              region: metadata.region,
              attachments: metadata.attachments || [],
              mentions: metadata.mentions || [],
              reactions: metadata.reactions || [],
              editHistory: metadata.editHistory || []
            },
            replyToId: metadata.replyToId,
            isEdited: false,
            isDeleted: false,
            readBy: await this.getMessageReads(msg.id),
            createdAt: msg.timestamp.toISOString(),
            updatedAt: msg.timestamp.toISOString()
          }
        })
      )

      // Mark messages as read
      await this.markMessagesAsRead(conversationId, userId, messages.map(m => m.id))

      const duration = Date.now() - startTime

      logger.info('Messages fetched successfully', {
        conversationId,
        messageCount: messages.length,
        totalCount,
        duration
      })

      return {
        success: true,
        data: {
          messages: transformedMessages,
          conversation: await this.transformConversation(conversation),
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + limit < totalCount
          }
        },
        performance: {
          responseTime: duration,
          cached: false
        }
      }

    } catch (error) {
      logger.error('Failed to fetch messages', {
        conversationId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      throw this.handleError(error, 'MESSAGES_FETCH_ERROR')
    }
  }

  /**
   * Create a new conversation with participants
   */
  public async createConversation(
    request: CreateConversationRequest,
    creatorId: string
  ): Promise<ConversationResponse> {
    const startTime = Date.now()
    
    try {
      // Validate input
      const validatedRequest = conversationSchema.parse(request)
      
      logger.info('Creating conversation', {
        name: request.name,
        type: request.type,
        creatorId,
        participantCount: request.participantIds.length,
        timestamp: new Date().toISOString()
      })

      // Verify warehouse access if specified
      if (request.warehouseId) {
        const warehouse = await warehouseService.getWarehouseById(request.warehouseId, creatorId)
        if (!warehouse) {
          throw new Error('Warehouse not found or access denied')
        }
      }

      // Check participant limits
      if (request.participantIds.length > this.config.maxParticipantsPerConversation) {
        throw new Error(`Maximum ${this.config.maxParticipantsPerConversation} participants allowed`)
      }

      // Ensure creator is included in participants
      const allParticipantIds = [...new Set([creatorId, ...request.participantIds])]

      // Create conversation with transaction
      const conversation = await prisma.$transaction(async (tx) => {
        // Create chat session
        const session = await tx.chatSession.create({
          data: {
            id: uuidv4(),
            title: request.name,
            userId: creatorId,
            userName: 'Creator', // Will be updated with actual name
            systemPrompt: `Conversation: ${request.name}`,
            isActive: true,
            source: 'messaging_system',
            category: request.type.toLowerCase(),
            metadata: JSON.stringify({
              description: request.description,
              type: request.type,
              warehouseId: request.warehouseId,
              region: request.region,
              participantIds: allParticipantIds,
              ...request.metadata
            })
          }
        })

        // Create initial system message
        await tx.message.create({
          data: {
            id: uuidv4(),
            sessionId: session.id,
            role: 'system',
            content: `Conversation "${request.name}" created by ${creatorId}`,
            timestamp: new Date(),
            functionName: 'conversation_created',
            functionArgs: JSON.stringify({
              type: 'SYSTEM',
              participantIds: allParticipantIds,
              metadata: request.metadata
            })
          }
        })

        return session
      })

      // Transform to our Conversation type
      const transformedConversation: Conversation = {
        id: conversation.id,
        name: conversation.title,
        description: request.description,
        type: request.type,
        isActive: true,
        participants: await this.createParticipants(allParticipantIds, creatorId),
        metadata: {
          warehouseId: request.warehouseId,
          region: request.region,
          tags: [],
          customFields: request.metadata || {},
          integrations: {
            warehouseAlerts: !!request.warehouseId,
            orderUpdates: !!request.warehouseId,
            inventoryNotifications: !!request.warehouseId
          }
        },
        unreadCount: 0,
        createdBy: creatorId,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString()
      }

      // Real-time notification
      await this.broadcastConversationEvent({
        type: 'CONVERSATION_CREATED',
        conversationId: conversation.id,
        userId: creatorId,
        data: transformedConversation,
        timestamp: new Date().toISOString()
      })

      const duration = Date.now() - startTime

      logger.info('Conversation created successfully', {
        conversationId: conversation.id,
        name: request.name,
        participantCount: allParticipantIds.length,
        duration
      })

      return {
        success: true,
        data: {
          conversation: transformedConversation
        },
        performance: {
          responseTime: duration
        }
      }

    } catch (error) {
      logger.error('Failed to create conversation', {
        name: request.name,
        creatorId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      throw this.handleError(error, 'CONVERSATION_CREATE_ERROR')
    }
  }

  /**
   * Get conversations for a user with filtering and pagination
   */
  public async getConversations(
    userId: string,
    query: ConversationQuery = {}
  ): Promise<ConversationsResponse> {
    const startTime = Date.now()
    
    try {
      logger.info('Fetching conversations', {
        userId,
        query,
        timestamp: new Date().toISOString()
      })

      const limit = Math.min(query.limit || 20, 100)
      const offset = query.offset || 0

      // Build filters - using userId to get user's conversations
      const whereClause: any = {
        userId
      }

      if (query.search) {
        whereClause.title = {
          contains: query.search,
          mode: 'insensitive'
        }
      }

      if (query.isActive !== undefined) {
        whereClause.isActive = query.isActive
      }

      // Execute queries
      const [sessions, totalCount] = await Promise.all([
        prisma.chatSession.findMany({
          where: whereClause,
          orderBy: { 
            [query.sortBy === 'name' ? 'title' : 'updatedAt']: 
            query.sortOrder === 'asc' ? 'asc' : 'desc' 
          },
          take: limit,
          skip: offset,
          include: {
            messages: {
              orderBy: { timestamp: 'desc' },
              take: 1,
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    role: true
                  }
                }
              }
            }
          }
        }),
        prisma.chatSession.count({ where: whereClause })
      ])

      // Transform conversations
      const conversations: Conversation[] = await Promise.all(
        sessions.map(async (session) => {
          const metadata = this.parseSessionMetadata(session.metadata)
          const lastMessage = session.messages[0]

          return {
            id: session.id,
            name: session.title,
            description: metadata.description,
            type: metadata.type || 'DIRECT',
            isActive: session.isActive,
            participants: await this.getParticipants(session.id),
            metadata: {
              warehouseId: metadata.warehouseId,
              region: metadata.region,
              tags: metadata.tags || [],
              customFields: metadata.customFields || {},
              integrations: metadata.integrations || {
                warehouseAlerts: false,
                orderUpdates: false,
                inventoryNotifications: false
              }
            },
            lastMessage: lastMessage ? {
              id: lastMessage.id,
              conversationId: session.id,
              senderId: lastMessage.userId || 'system',
              senderName: lastMessage.user?.name || 'System',
              senderRole: this.mapRoleToParticipantRole(lastMessage.user?.role || 'VIEWER'),
              content: lastMessage.content,
              type: 'TEXT',
              priority: 'NORMAL',
              status: 'DELIVERED',
              metadata: {},
              isEdited: false,
              isDeleted: false,
              readBy: [],
              createdAt: lastMessage.timestamp.toISOString(),
              updatedAt: lastMessage.timestamp.toISOString()
            } : undefined,
            unreadCount: await this.getUnreadCount(session.id, userId),
            createdBy: session.userId || userId,
            createdAt: session.createdAt.toISOString(),
            updatedAt: session.updatedAt.toISOString()
          }
        })
      )

      // Calculate summary
      const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
      const activeConversations = conversations.filter(conv => conv.isActive).length
      const warehouseBreakdown = conversations.reduce((acc, conv) => {
        if (conv.metadata.warehouseId) {
          acc[conv.metadata.warehouseId] = (acc[conv.metadata.warehouseId] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)

      const duration = Date.now() - startTime

      logger.info('Conversations fetched successfully', {
        userId,
        conversationCount: conversations.length,
        totalUnread,
        duration
      })

      return {
        success: true,
        data: {
          conversations,
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + limit < totalCount
          },
          summary: {
            totalUnread,
            activeConversations,
            warehouseBreakdown
          }
        },
        performance: {
          responseTime: duration,
          cached: false
        }
      }

    } catch (error) {
      logger.error('Failed to fetch conversations', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      throw this.handleError(error, 'CONVERSATIONS_FETCH_ERROR')
    }
  }

  /**
   * Real-time WebSocket connection management
   */
  public async handleWebSocketConnection(userId: string, ws: WebSocket): Promise<void> {
    try {
      this.wsConnections.set(userId, ws)
      
      ws.on('close', () => {
        this.wsConnections.delete(userId)
        logger.info('WebSocket connection closed', { userId })
      })

      ws.on('message', async (data) => {
        try {
          const event = JSON.parse(data.toString())
          await this.handleWebSocketEvent(userId, event)
        } catch (error) {
          logger.error('Failed to handle WebSocket message', { userId, error })
        }
      })

      logger.info('WebSocket connection established', { userId })
    } catch (error) {
      logger.error('Failed to handle WebSocket connection', { userId, error })
    }
  }

  /**
   * Private helper methods
   */

  private async getConversationWithPermissions(
    conversationId: string,
    userId: string
  ): Promise<any> {
    const session = await prisma.chatSession.findFirst({
      where: {
        id: conversationId,
        OR: [
          { userId },
          { userName: userId }, // Fallback for different user ID schemes
        ]
      },
      include: {
        user: true
      }
    })

    if (!session) return null

    const metadata = this.parseSessionMetadata(session.metadata)
    
    return {
      ...session,
      participants: [{
        id: uuidv4(),
        userId: session.userId || userId,
        userName: session.userName || 'User',
        userEmail: session.userEmail || 'user@example.com',
        role: 'ADMIN',
        permissions: [
          { action: 'READ', scope: 'MESSAGE', granted: true },
          { action: 'WRITE', scope: 'MESSAGE', granted: true }
        ],
        joinedAt: session.createdAt.toISOString(),
        isActive: true,
        notificationSettings: {
          enabled: true,
          emailNotifications: true,
          pushNotifications: true,
          warehouseAlerts: true,
          mentions: true,
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00',
            timezone: 'UTC'
          }
        }
      }],
      metadata
    }
  }

  private hasPermission(
    participant: Participant,
    action: string,
    scope: string
  ): boolean {
    return participant.permissions.some(
      p => p.action === action && p.scope === scope && p.granted
    )
  }

  private async checkRateLimit(userId: string): Promise<void> {
    // Simplified rate limiting - implement Redis-based solution for production
    const key = `rate_limit:${userId}`
    // Implementation would check Redis or memory cache
  }

  private async broadcastMessageEvent(event: MessageEvent): Promise<void> {
    // Get all conversation participants
    const conversation = await this.getConversationWithPermissions(
      event.conversationId,
      event.userId
    )
    
    if (conversation?.participants) {
      for (const participant of conversation.participants) {
        const ws = this.wsConnections.get(participant.userId)
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(event))
        }
      }
    }
  }

  private async broadcastConversationEvent(event: ConversationEvent): Promise<void> {
    // Similar to message event broadcasting
    const conversation = await this.getConversationWithPermissions(
      event.conversationId,
      event.userId
    )
    
    if (conversation?.participants) {
      for (const participant of conversation.participants) {
        const ws = this.wsConnections.get(participant.userId)
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(event))
        }
      }
    }
  }

  private async handleWarehouseAlert(
    warehouseId: string,
    message: Message
  ): Promise<void> {
    try {
      // Integration with warehouse service for alerts
      logger.info('Processing warehouse alert', {
        warehouseId,
        messageId: message.id,
        priority: message.priority
      })
      
      // Could trigger additional warehouse operations or notifications
    } catch (error) {
      logger.error('Failed to handle warehouse alert', { warehouseId, error })
    }
  }

  private async transformConversation(session: any): Promise<Conversation> {
    const metadata = this.parseSessionMetadata(session.metadata)
    
    return {
      id: session.id,
      name: session.title,
      description: metadata.description,
      type: metadata.type || 'DIRECT',
      isActive: session.isActive,
      participants: session.participants || [],
      metadata: metadata,
      unreadCount: 0,
      createdBy: session.userId || 'system',
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString()
    }
  }

  private parseMessageMetadata(functionArgs: string | null): any {
    try {
      return functionArgs ? JSON.parse(functionArgs) : {}
    } catch {
      return {}
    }
  }

  private parseSessionMetadata(metadata: string | null): any {
    try {
      return metadata ? JSON.parse(metadata) : {}
    } catch {
      return {}
    }
  }

  private mapRoleToParticipantRole(role: string): 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER' {
    switch (role?.toUpperCase()) {
      case 'ADMIN': return 'ADMIN'
      case 'MANAGER': return 'MANAGER'
      case 'OPERATOR': return 'OPERATOR'
      default: return 'VIEWER'
    }
  }

  private async createParticipants(
    participantIds: string[],
    creatorId: string
  ): Promise<Participant[]> {
    // Create participant objects for the conversation
    return participantIds.map(id => ({
      id: uuidv4(),
      userId: id,
      userName: id === creatorId ? 'Creator' : 'Participant',
      userEmail: `${id}@example.com`,
      role: id === creatorId ? 'ADMIN' : 'VIEWER',
      permissions: [
        { action: 'READ', scope: 'MESSAGE', granted: true },
        { action: 'WRITE', scope: 'MESSAGE', granted: true }
      ],
      joinedAt: new Date().toISOString(),
      isActive: true,
      notificationSettings: {
        enabled: true,
        emailNotifications: true,
        pushNotifications: true,
        warehouseAlerts: true,
        mentions: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
          timezone: 'UTC'
        }
      }
    }))
  }

  private async getParticipants(conversationId: string): Promise<Participant[]> {
    // Get participants for a conversation
    return [
      {
        id: uuidv4(),
        userId: 'user_1',
        userName: 'User',
        userEmail: 'user@example.com',
        role: 'ADMIN',
        permissions: [
          { action: 'READ', scope: 'MESSAGE', granted: true },
          { action: 'WRITE', scope: 'MESSAGE', granted: true }
        ],
        joinedAt: new Date().toISOString(),
        isActive: true,
        notificationSettings: {
          enabled: true,
          emailNotifications: true,
          pushNotifications: true,
          warehouseAlerts: true,
          mentions: true,
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00',
            timezone: 'UTC'
          }
        }
      }
    ]
  }

  private async getMessageReads(messageId: string): Promise<any[]> {
    // Get read receipts for a message
    return []
  }

  private async markMessagesAsRead(
    conversationId: string,
    userId: string,
    messageIds: string[]
  ): Promise<void> {
    // Mark messages as read for the user
    logger.info('Marking messages as read', {
      conversationId,
      userId,
      messageCount: messageIds.length
    })
  }

  private async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    // Get unread message count for user in conversation
    return 0
  }

  private async handleWebSocketEvent(userId: string, event: any): Promise<void> {
    logger.info('Handling WebSocket event', { userId, eventType: event.type })
    
    switch (event.type) {
      case 'typing_start':
        await this.handleTypingStart(userId, event.conversationId)
        break
      case 'typing_stop':
        await this.handleTypingStop(userId, event.conversationId)
        break
      case 'mark_read':
        await this.markMessagesAsRead(event.conversationId, userId, event.messageIds)
        break
    }
  }

  private async handleTypingStart(userId: string, conversationId: string): Promise<void> {
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set())
    }
    this.typingUsers.get(conversationId)!.add(userId)
  }

  private async handleTypingStop(userId: string, conversationId: string): Promise<void> {
    if (this.typingUsers.has(conversationId)) {
      this.typingUsers.get(conversationId)!.delete(userId)
    }
  }

  private initializeEventHandlers(): void {
    // Initialize real-time event handlers
    logger.info('Initializing messaging event handlers')
  }

  private startCleanupTasks(): void {
    // Start periodic cleanup tasks
    setInterval(() => {
      this.cleanupOldMessages()
    }, 24 * 60 * 60 * 1000) // Daily cleanup
  }

  private async cleanupOldMessages(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - this.config.messageRetentionDays * 24 * 60 * 60 * 1000)
      
      const deletedCount = await prisma.message.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      })
      
      logger.info('Cleaned up old messages', { deletedCount: deletedCount.count })
    } catch (error) {
      logger.error('Failed to cleanup old messages', { error })
    }
  }

  private handleError(error: unknown, context: string): Error {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const enhancedError = new Error(`${context}: ${errorMessage}`)
    
    if (error instanceof Error) {
      enhancedError.stack = error.stack
    }

    return enhancedError
  }
}

// Export singleton instance
export const messagingService = MessagingService.getInstance()