/**
 * RHY Supplier Portal - Enterprise Support Ticketing Service
 * Comprehensive support ticket management system integrated with Batch 1 foundation
 * Implements enterprise-grade ticket handling, escalation, and resolution tracking
 * Performance target: <100ms response time for standard operations
 */

import { rhyPrisma } from '@/lib/rhy-database'
import { z } from 'zod'
import { 
  logAuthEvent, 
  checkRateLimit, 
  sanitizeInput, 
  validateUUID,
  generateSecureToken 
} from '@/lib/security'
import { withAuth } from '@/lib/middleware'
import { NextRequest } from 'next/server'

// ================================
// VALIDATION SCHEMAS
// ================================

export const CreateTicketSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  category: z.enum([
    'TECHNICAL_SUPPORT',
    'BILLING_INQUIRY', 
    'ORDER_ISSUE',
    'WAREHOUSE_ACCESS',
    'PRODUCT_QUESTION',
    'ACCOUNT_MANAGEMENT',
    'FEATURE_REQUEST',
    'BUG_REPORT',
    'GENERAL_INQUIRY'
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  warehouseId: z.string().optional(),
  orderId: z.string().optional(),
  productId: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string(),
    size: z.number(),
    mimeType: z.string()
  })).max(5).default([])
})

export const UpdateTicketSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  resolution: z.string().max(1000).optional()
})

export const AddCommentSchema = z.object({
  content: z.string().min(1).max(1000),
  isInternal: z.boolean().default(false),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string(),
    size: z.number(),
    mimeType: z.string()
  })).max(3).default([])
})

// ================================
// BUSINESS LOGIC INTERFACES
// ================================

export interface SupportTicket {
  id: string
  ticketNumber: string
  supplierId: string
  title: string
  description: string
  category: string
  priority: string
  status: string
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
}

export interface TicketComment {
  id: string
  ticketId: string
  authorId: string
  authorType: 'SUPPLIER' | 'SUPPORT_AGENT' | 'SYSTEM'
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
// ENTERPRISE TICKETING SERVICE
// ================================

export class TicketingService {
  
  /**
   * Create a new support ticket with comprehensive validation and business logic
   */
  async createTicket(
    supplierId: string,
    data: z.infer<typeof CreateTicketSchema>,
    request?: NextRequest
  ): Promise<{ success: boolean; ticket?: SupportTicket; error?: string }> {
    const startTime = Date.now()
    
    try {
      // Validate input data
      const validatedData = CreateTicketSchema.parse(data)
      
      // Rate limiting check - 5 tickets per hour per supplier
      const rateLimitKey = `ticket_create:${supplierId}`
      const rateLimitInfo = checkRateLimit(rateLimitKey, 60 * 60 * 1000, 5)
      
      if (rateLimitInfo.remaining <= 0) {
        await logAuthEvent('TICKET_CREATE_RATE_LIMITED', false, {
          ipAddress: request?.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request?.headers.get('user-agent') || 'unknown',
          timestamp: new Date()
        }, supplierId, {
          resetTime: rateLimitInfo.resetTime
        })
        
        return {
          success: false,
          error: 'Too many tickets created. Please wait before creating another ticket.'
        }
      }

      // Verify supplier exists and is active
      const supplier = await rhyPrisma.rHYSupplier.findUnique({
        where: { id: supplierId },
        include: { warehouseAccess: true }
      })

      if (!supplier || supplier.status !== 'ACTIVE') {
        return {
          success: false,
          error: 'Supplier not found or inactive'
        }
      }

      // Validate warehouse access if warehouseId provided
      if (validatedData.warehouseId) {
        const hasAccess = supplier.warehouseAccess.some(access => 
          access.warehouse === validatedData.warehouseId &&
          (!access.expiresAt || access.expiresAt > new Date())
        )
        
        if (!hasAccess) {
          return {
            success: false,
            error: 'Access denied to specified warehouse'
          }
        }
      }

      // Generate unique ticket number
      const ticketNumber = await this.generateTicketNumber()
      
      // Determine initial priority based on category and supplier tier
      const adjustedPriority = this.calculatePriority(
        validatedData.priority,
        validatedData.category,
        supplier.tier
      )

      // Create ticket with transaction
      const ticket = await rhyPrisma.$transaction(async (tx) => {
        const newTicket = await tx.supportTicket.create({
          data: {
            ticketNumber,
            supplierId,
            title: sanitizeInput(validatedData.title),
            description: sanitizeInput(validatedData.description),
            category: validatedData.category,
            priority: adjustedPriority,
            status: 'OPEN',
            warehouseId: validatedData.warehouseId,
            orderId: validatedData.orderId,
            productId: validatedData.productId,
            escalationLevel: 0,
            lastActivityAt: new Date(),
            metadata: {
              sourceIP: request?.headers.get('x-forwarded-for') || 'unknown',
              userAgent: request?.headers.get('user-agent') || 'unknown',
              creationContext: {
                supplierTier: supplier.tier,
                warehouseAccess: supplier.warehouseAccess.length,
                hasOrderReference: !!validatedData.orderId,
                hasProductReference: !!validatedData.productId
              }
            }
          }
        })

        // Create attachments if provided
        if (validatedData.attachments.length > 0) {
          await tx.ticketAttachment.createMany({
            data: validatedData.attachments.map(attachment => ({
              ticketId: newTicket.id,
              filename: attachment.filename,
              originalFilename: attachment.filename,
              url: attachment.url,
              size: attachment.size,
              mimeType: attachment.mimeType,
              uploadedBy: supplierId,
              uploadedAt: new Date()
            }))
          })
        }

        // Create initial system comment
        await tx.ticketComment.create({
          data: {
            ticketId: newTicket.id,
            authorId: 'SYSTEM',
            authorType: 'SYSTEM',
            content: `Ticket created by ${supplier.companyName} (${supplier.email})`,
            isInternal: true,
            createdAt: new Date()
          }
        })

        return newTicket
      })

      // Auto-assign based on category and warehouse
      await this.autoAssignTicket(ticket.id, validatedData.category, validatedData.warehouseId)

      // Send notifications
      await this.sendTicketNotifications(ticket.id, 'CREATED')

      const responseTime = Date.now() - startTime

      await logAuthEvent('TICKET_CREATE_SUCCESS', true, {
        ipAddress: request?.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request?.headers.get('user-agent') || 'unknown',
        timestamp: new Date()
      }, supplierId, {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        category: validatedData.category,
        priority: adjustedPriority,
        responseTime
      })

      return {
        success: true,
        ticket: await this.getTicketById(ticket.id, supplierId)
      }

    } catch (error) {
      await logAuthEvent('TICKET_CREATE_ERROR', false, {
        ipAddress: request?.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request?.headers.get('user-agent') || 'unknown',
        timestamp: new Date()
      }, supplierId, {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      })

      console.error('Create ticket error:', error)
      
      return {
        success: false,
        error: 'Failed to create ticket. Please try again.'
      }
    }
  }

  /**
   * Get tickets for a supplier with filtering and pagination
   */
  async getTickets(
    supplierId: string,
    filters: {
      status?: string[]
      category?: string[]
      priority?: string[]
      warehouseId?: string
      page?: number
      limit?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      search?: string
    } = {}
  ): Promise<{
    success: boolean
    tickets?: SupportTicket[]
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    error?: string
  }> {
    try {
      const page = Math.max(1, filters.page || 1)
      const limit = Math.min(50, Math.max(1, filters.limit || 20))
      const offset = (page - 1) * limit

      // Build where clause
      const where: any = {
        supplierId,
        ...(filters.status && { status: { in: filters.status } }),
        ...(filters.category && { category: { in: filters.category } }),
        ...(filters.priority && { priority: { in: filters.priority } }),
        ...(filters.warehouseId && { warehouseId: filters.warehouseId }),
        ...(filters.search && {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
            { ticketNumber: { contains: filters.search, mode: 'insensitive' } }
          ]
        })
      }

      // Build order by
      const orderBy: any = {}
      if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortOrder || 'desc'
      } else {
        orderBy.lastActivityAt = 'desc'
      }

      // Get tickets and total count
      const [tickets, total] = await Promise.all([
        rhyPrisma.supportTicket.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit,
          include: {
            comments: {
              where: { isInternal: false },
              orderBy: { createdAt: 'desc' },
              take: 3,
              include: { attachments: true }
            },
            attachments: true,
            _count: {
              select: {
                comments: { where: { isInternal: false } }
              }
            }
          }
        }),
        rhyPrisma.supportTicket.count({ where })
      ])

      // Transform to business objects
      const transformedTickets: SupportTicket[] = tickets.map(ticket => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        supplierId: ticket.supplierId,
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        warehouseId: ticket.warehouseId || undefined,
        orderId: ticket.orderId || undefined,
        productId: ticket.productId || undefined,
        assignedTo: ticket.assignedTo || undefined,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        resolvedAt: ticket.resolvedAt || undefined,
        closedAt: ticket.closedAt || undefined,
        resolution: ticket.resolution || undefined,
        escalationLevel: ticket.escalationLevel,
        lastActivityAt: ticket.lastActivityAt,
        comments: ticket.comments.map(comment => ({
          id: comment.id,
          ticketId: comment.ticketId,
          authorId: comment.authorId,
          authorType: comment.authorType as any,
          content: comment.content,
          isInternal: comment.isInternal,
          createdAt: comment.createdAt,
          attachments: comment.attachments.map(att => ({
            id: att.id,
            commentId: att.commentId || undefined,
            filename: att.filename,
            originalFilename: att.originalFilename,
            url: att.url,
            size: att.size,
            mimeType: att.mimeType,
            uploadedBy: att.uploadedBy,
            uploadedAt: att.uploadedAt
          }))
        })),
        attachments: ticket.attachments.map(att => ({
          id: att.id,
          ticketId: att.ticketId || undefined,
          filename: att.filename,
          originalFilename: att.originalFilename,
          url: att.url,
          size: att.size,
          mimeType: att.mimeType,
          uploadedBy: att.uploadedBy,
          uploadedAt: att.uploadedAt
        })),
        metrics: {
          escalationCount: ticket.escalationLevel,
          commentCount: ticket._count.comments,
          attachmentCount: ticket.attachments.length
        }
      }))

      return {
        success: true,
        tickets: transformedTickets,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }

    } catch (error) {
      console.error('Get tickets error:', error)
      
      return {
        success: false,
        error: 'Failed to retrieve tickets'
      }
    }
  }

  /**
   * Get a specific ticket by ID with access validation
   */
  async getTicketById(
    ticketId: string,
    supplierId: string
  ): Promise<SupportTicket | null> {
    try {
      if (!validateUUID(ticketId)) {
        return null
      }

      const ticket = await rhyPrisma.supportTicket.findFirst({
        where: {
          id: ticketId,
          supplierId // Ensure supplier can only access their own tickets
        },
        include: {
          comments: {
            where: { isInternal: false },
            orderBy: { createdAt: 'asc' },
            include: { attachments: true }
          },
          attachments: true
        }
      })

      if (!ticket) {
        return null
      }

      return {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        supplierId: ticket.supplierId,
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        warehouseId: ticket.warehouseId || undefined,
        orderId: ticket.orderId || undefined,
        productId: ticket.productId || undefined,
        assignedTo: ticket.assignedTo || undefined,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        resolvedAt: ticket.resolvedAt || undefined,
        closedAt: ticket.closedAt || undefined,
        resolution: ticket.resolution || undefined,
        escalationLevel: ticket.escalationLevel,
        lastActivityAt: ticket.lastActivityAt,
        comments: ticket.comments.map(comment => ({
          id: comment.id,
          ticketId: comment.ticketId,
          authorId: comment.authorId,
          authorType: comment.authorType as any,
          content: comment.content,
          isInternal: comment.isInternal,
          createdAt: comment.createdAt,
          attachments: comment.attachments.map(att => ({
            id: att.id,
            commentId: att.commentId || undefined,
            filename: att.filename,
            originalFilename: att.originalFilename,
            url: att.url,
            size: att.size,
            mimeType: att.mimeType,
            uploadedBy: att.uploadedBy,
            uploadedAt: att.uploadedAt
          }))
        })),
        attachments: ticket.attachments.map(att => ({
          id: att.id,
          ticketId: att.ticketId || undefined,
          filename: att.filename,
          originalFilename: att.originalFilename,
          url: att.url,
          size: att.size,
          mimeType: att.mimeType,
          uploadedBy: att.uploadedBy,
          uploadedAt: att.uploadedAt
        })),
        metrics: {
          escalationCount: ticket.escalationLevel,
          commentCount: ticket.comments.length,
          attachmentCount: ticket.attachments.length
        }
      }

    } catch (error) {
      console.error('Get ticket by ID error:', error)
      return null
    }
  }

  /**
   * Add a comment to a ticket
   */
  async addComment(
    ticketId: string,
    supplierId: string,
    data: z.infer<typeof AddCommentSchema>
  ): Promise<{ success: boolean; comment?: TicketComment; error?: string }> {
    try {
      const validatedData = AddCommentSchema.parse(data)

      // Verify ticket exists and supplier has access
      const ticket = await this.getTicketById(ticketId, supplierId)
      if (!ticket) {
        return {
          success: false,
          error: 'Ticket not found or access denied'
        }
      }

      // Don't allow comments on closed tickets
      if (ticket.status === 'CLOSED') {
        return {
          success: false,
          error: 'Cannot add comments to closed tickets'
        }
      }

      // Create comment with transaction
      const comment = await rhyPrisma.$transaction(async (tx) => {
        const newComment = await tx.ticketComment.create({
          data: {
            ticketId,
            authorId: supplierId,
            authorType: 'SUPPLIER',
            content: sanitizeInput(validatedData.content),
            isInternal: validatedData.isInternal,
            createdAt: new Date()
          },
          include: { attachments: true }
        })

        // Create attachments if provided
        if (validatedData.attachments.length > 0) {
          await tx.ticketAttachment.createMany({
            data: validatedData.attachments.map(attachment => ({
              commentId: newComment.id,
              filename: attachment.filename,
              originalFilename: attachment.filename,
              url: attachment.url,
              size: attachment.size,
              mimeType: attachment.mimeType,
              uploadedBy: supplierId,
              uploadedAt: new Date()
            }))
          })
        }

        // Update ticket last activity
        await tx.supportTicket.update({
          where: { id: ticketId },
          data: { lastActivityAt: new Date() }
        })

        return newComment
      })

      // Send notifications
      await this.sendTicketNotifications(ticketId, 'COMMENT_ADDED')

      return {
        success: true,
        comment: {
          id: comment.id,
          ticketId: comment.ticketId,
          authorId: comment.authorId,
          authorType: comment.authorType as any,
          content: comment.content,
          isInternal: comment.isInternal,
          createdAt: comment.createdAt,
          attachments: comment.attachments.map(att => ({
            id: att.id,
            commentId: att.commentId || undefined,
            filename: att.filename,
            originalFilename: att.originalFilename,
            url: att.url,
            size: att.size,
            mimeType: att.mimeType,
            uploadedBy: att.uploadedBy,
            uploadedAt: att.uploadedAt
          }))
        }
      }

    } catch (error) {
      console.error('Add comment error:', error)
      
      return {
        success: false,
        error: 'Failed to add comment'
      }
    }
  }

  // Private helper methods

  private async generateTicketNumber(): Promise<string> {
    const today = new Date()
    const year = today.getFullYear()
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const day = today.getDate().toString().padStart(2, '0')
    
    // Count tickets created today
    const todayStart = new Date(year, today.getMonth(), today.getDate())
    const todayEnd = new Date(year, today.getMonth(), today.getDate() + 1)
    
    const todayCount = await rhyPrisma.supportTicket.count({
      where: {
        createdAt: {
          gte: todayStart,
          lt: todayEnd
        }
      }
    })

    const sequence = (todayCount + 1).toString().padStart(4, '0')
    
    return `RHY-${year}${month}${day}-${sequence}`
  }

  private calculatePriority(
    requestedPriority: string,
    category: string,
    supplierTier: string
  ): string {
    // Priority adjustment based on category
    const categoryPriorityMap: Record<string, number> = {
      'BILLING_INQUIRY': 3,
      'ORDER_ISSUE': 4,
      'WAREHOUSE_ACCESS': 4,
      'TECHNICAL_SUPPORT': 2,
      'PRODUCT_QUESTION': 1,
      'ACCOUNT_MANAGEMENT': 3,
      'FEATURE_REQUEST': 1,
      'BUG_REPORT': 3,
      'GENERAL_INQUIRY': 1
    }

    // Tier adjustment
    const tierMultiplier: Record<string, number> = {
      'STANDARD': 1,
      'PREMIUM': 1.2,
      'ENTERPRISE': 1.5
    }

    const basePriority = {
      'LOW': 1,
      'MEDIUM': 2,
      'HIGH': 3,
      'URGENT': 4
    }[requestedPriority] || 2

    const categoryBoost = categoryPriorityMap[category] || 1
    const tierBoost = tierMultiplier[supplierTier] || 1
    
    const finalScore = basePriority + (categoryBoost * tierBoost)

    if (finalScore >= 6) return 'URGENT'
    if (finalScore >= 4) return 'HIGH'
    if (finalScore >= 2.5) return 'MEDIUM'
    return 'LOW'
  }

  private async autoAssignTicket(
    ticketId: string,
    category: string,
    warehouseId?: string
  ): Promise<void> {
    try {
      // This would integrate with your agent assignment system
      // For now, we'll use a simple category-based assignment
      const categoryAssignments: Record<string, string> = {
        'TECHNICAL_SUPPORT': 'tech-team',
        'BILLING_INQUIRY': 'billing-team',
        'ORDER_ISSUE': 'order-team',
        'WAREHOUSE_ACCESS': 'security-team',
        'PRODUCT_QUESTION': 'product-team',
        'ACCOUNT_MANAGEMENT': 'account-team',
        'FEATURE_REQUEST': 'product-team',
        'BUG_REPORT': 'tech-team',
        'GENERAL_INQUIRY': 'general-support'
      }

      const assignedTeam = categoryAssignments[category] || 'general-support'

      await rhyPrisma.supportTicket.update({
        where: { id: ticketId },
        data: { assignedTo: assignedTeam }
      })

    } catch (error) {
      console.error('Auto assign ticket error:', error)
      // Don't throw - assignment failure shouldn't break ticket creation
    }
  }

  private async sendTicketNotifications(
    ticketId: string,
    eventType: 'CREATED' | 'UPDATED' | 'COMMENT_ADDED' | 'RESOLVED'
  ): Promise<void> {
    try {
      // This would integrate with your notification system
      // For now, we'll log the notification
      console.log(`Ticket notification: ${eventType} for ticket ${ticketId}`)
      
      // Could integrate with email service, Slack, etc.
      
    } catch (error) {
      console.error('Send notification error:', error)
      // Don't throw - notification failure shouldn't break operations
    }
  }
}

// Singleton instance
export const ticketingService = new TicketingService()