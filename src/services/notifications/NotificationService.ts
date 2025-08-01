/**
 * RHY Supplier Portal - Enhanced Notification Service
 * Enterprise-grade notification system integrated with Batch 1 foundation
 * Supports real-time notifications, multi-warehouse coordination, and advanced filtering
 */

import { rhyPrisma } from '@/lib/rhy-database'
import { authService } from '@/services/auth/AuthService'
import { eventBus } from '@/services/events/event-bus'
import { SecurityContext } from '@/types/auth'

export interface NotificationOptions {
  supplierId: string
  type: 'WAREHOUSE' | 'ORDER' | 'SYSTEM' | 'SECURITY' | 'PROMOTION'
  title: string
  message: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  channels: ('EMAIL' | 'SMS' | 'PUSH' | 'IN_APP')[]
  warehouseId?: string
  metadata?: Record<string, any>
  expiresAt?: Date
  actionUrl?: string
  requiresAcknowledgment?: boolean
}

export interface NotificationPreferences {
  supplierId: string
  emailEnabled: boolean
  smsEnabled: boolean
  pushEnabled: boolean
  inAppEnabled: boolean
  warehouseAlerts: boolean
  orderUpdates: boolean
  systemNotifications: boolean
  securityAlerts: boolean
  promotionalContent: boolean
  quietHours?: {
    enabled: boolean
    startHour: number
    endHour: number
    timezone: string
  }
}

export interface NotificationFilter {
  supplierId?: string
  type?: string[]
  priority?: string[]
  read?: boolean
  warehouseId?: string
  dateFrom?: Date
  dateTo?: Date
  limit?: number
  offset?: number
}

/**
 * Enhanced Notification Service for RHY Supplier Portal
 * Integrates with existing authentication and warehouse systems
 */
export class NotificationService {
  /**
   * Send notification with comprehensive filtering and delivery options
   */
  async sendNotification(
    options: NotificationOptions,
    securityContext: SecurityContext
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      // Validate supplier access
      const supplierSession = await authService.validateSession(
        securityContext.authToken || '',
        securityContext
      )

      if (!supplierSession.valid || !supplierSession.supplier) {
        return {
          success: false,
          error: 'Invalid supplier session'
        }
      }

      // Check warehouse access if warehouse-specific notification
      if (options.warehouseId) {
        const hasWarehouseAccess = supplierSession.supplier.warehouseAccess.some(
          access => access.warehouse === options.warehouseId
        )

        if (!hasWarehouseAccess) {
          return {
            success: false,
            error: 'Access denied to specified warehouse'
          }
        }
      }

      // Get supplier notification preferences
      const preferences = await this.getNotificationPreferences(options.supplierId)

      // Filter channels based on preferences
      const enabledChannels = this.filterChannelsByPreferences(options.channels, preferences)

      if (enabledChannels.length === 0) {
        return {
          success: false,
          error: 'All notification channels disabled for this supplier'
        }
      }

      // Check quiet hours
      if (preferences.quietHours?.enabled && this.isQuietHours(preferences.quietHours)) {
        // Only send critical notifications during quiet hours
        if (options.priority !== 'CRITICAL') {
          // Schedule for later delivery
          return this.scheduleNotification(options, preferences.quietHours)
        }
      }

      // Create notification record
      const notification = await rhyPrisma.rHYNotification.create({
        data: {
          supplierId: options.supplierId,
          type: options.type,
          title: options.title,
          message: options.message,
          priority: options.priority,
          channels: enabledChannels,
          warehouseId: options.warehouseId,
          metadata: options.metadata || {},
          expiresAt: options.expiresAt,
          actionUrl: options.actionUrl,
          requiresAcknowledgment: options.requiresAcknowledgment || false,
          status: 'PENDING',
          deliveryAttempts: 0
        }
      })

      // Deliver through enabled channels
      const deliveryResults = await Promise.allSettled([
        ...enabledChannels.map(channel => this.deliverNotification(notification.id, channel))
      ])

      // Update notification status based on delivery results
      const successfulDeliveries = deliveryResults.filter(r => r.status === 'fulfilled')
      const status = successfulDeliveries.length > 0 ? 'DELIVERED' : 'FAILED'

      await rhyPrisma.rHYNotification.update({
        where: { id: notification.id },
        data: {
          status,
          deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
          deliveryAttempts: 1,
          deliveryResults: deliveryResults.map((result, index) => ({
            channel: enabledChannels[index],
            success: result.status === 'fulfilled',
            error: result.status === 'rejected' ? result.reason : undefined
          }))
        }
      })

      // Emit real-time event for immediate UI updates
      eventBus.emit('notification:sent', {
        notificationId: notification.id,
        supplierId: options.supplierId,
        type: options.type,
        priority: options.priority,
        warehouseId: options.warehouseId
      })

      return {
        success: true,
        notificationId: notification.id
      }

    } catch (error) {
      console.error('Failed to send notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get supplier notifications with advanced filtering
   */
  async getSupplierNotifications(
    filter: NotificationFilter,
    securityContext: SecurityContext
  ): Promise<{ notifications: any[]; total: number; unreadCount: number }> {
    try {
      // Validate supplier access
      const supplierSession = await authService.validateSession(
        securityContext.authToken || '',
        securityContext
      )

      if (!supplierSession.valid || !supplierSession.supplier) {
        throw new Error('Invalid supplier session')
      }

      const supplierId = filter.supplierId || supplierSession.supplier.id

      // Build query conditions
      const where: any = { supplierId }

      if (filter.type && filter.type.length > 0) {
        where.type = { in: filter.type }
      }

      if (filter.priority && filter.priority.length > 0) {
        where.priority = { in: filter.priority }
      }

      if (filter.read !== undefined) {
        where.read = filter.read
      }

      if (filter.warehouseId) {
        where.warehouseId = filter.warehouseId
      }

      if (filter.dateFrom || filter.dateTo) {
        where.createdAt = {}
        if (filter.dateFrom) where.createdAt.gte = filter.dateFrom
        if (filter.dateTo) where.createdAt.lte = filter.dateTo
      }

      // Get notifications with pagination
      const [notifications, total, unreadCount] = await Promise.all([
        rhyPrisma.rHYNotification.findMany({
          where,
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ],
          take: filter.limit || 20,
          skip: filter.offset || 0,
          include: {
            supplier: {
              select: {
                companyName: true,
                email: true
              }
            },
            warehouse: {
              select: {
                name: true,
                region: true
              }
            }
          }
        }),
        rhyPrisma.rHYNotification.count({ where }),
        rhyPrisma.rHYNotification.count({
          where: { ...where, read: false }
        })
      ])

      return {
        notifications: notifications.map(notification => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          read: notification.read,
          readAt: notification.readAt,
          acknowledged: notification.acknowledged,
          acknowledgedAt: notification.acknowledgedAt,
          warehouseId: notification.warehouseId,
          warehouse: notification.warehouse,
          actionUrl: notification.actionUrl,
          requiresAcknowledgment: notification.requiresAcknowledgment,
          metadata: notification.metadata,
          createdAt: notification.createdAt,
          expiresAt: notification.expiresAt
        })),
        total,
        unreadCount
      }

    } catch (error) {
      console.error('Failed to get notifications:', error)
      throw error
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    notificationId: string,
    supplierId: string,
    securityContext: SecurityContext
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate access
      const notification = await rhyPrisma.rHYNotification.findFirst({
        where: {
          id: notificationId,
          supplierId
        }
      })

      if (!notification) {
        return { success: false, error: 'Notification not found' }
      }

      await rhyPrisma.rHYNotification.update({
        where: { id: notificationId },
        data: {
          read: true,
          readAt: new Date()
        }
      })

      // Emit real-time event
      eventBus.emit('notification:read', {
        notificationId,
        supplierId
      })

      return { success: true }

    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Acknowledge notification (for critical notifications requiring acknowledgment)
   */
  async acknowledgeNotification(
    notificationId: string,
    supplierId: string,
    securityContext: SecurityContext
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const notification = await rhyPrisma.rHYNotification.findFirst({
        where: {
          id: notificationId,
          supplierId,
          requiresAcknowledgment: true
        }
      })

      if (!notification) {
        return { success: false, error: 'Notification not found or does not require acknowledgment' }
      }

      await rhyPrisma.rHYNotification.update({
        where: { id: notificationId },
        data: {
          acknowledged: true,
          acknowledgedAt: new Date(),
          read: true,
          readAt: notification.readAt || new Date()
        }
      })

      // Emit real-time event
      eventBus.emit('notification:acknowledged', {
        notificationId,
        supplierId
      })

      return { success: true }

    } catch (error) {
      console.error('Failed to acknowledge notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get or create notification preferences for supplier
   */
  async getNotificationPreferences(supplierId: string): Promise<NotificationPreferences> {
    try {
      let preferences = await rhyPrisma.rHYNotificationPreferences.findUnique({
        where: { supplierId }
      })

      if (!preferences) {
        // Create default preferences
        preferences = await rhyPrisma.rHYNotificationPreferences.create({
          data: {
            supplierId,
            emailEnabled: true,
            smsEnabled: false,
            pushEnabled: true,
            inAppEnabled: true,
            warehouseAlerts: true,
            orderUpdates: true,
            systemNotifications: true,
            securityAlerts: true,
            promotionalContent: false,
            quietHours: {
              enabled: false,
              startHour: 22,
              endHour: 8,
              timezone: 'UTC'
            }
          }
        })
      }

      return {
        supplierId: preferences.supplierId,
        emailEnabled: preferences.emailEnabled,
        smsEnabled: preferences.smsEnabled,
        pushEnabled: preferences.pushEnabled,
        inAppEnabled: preferences.inAppEnabled,
        warehouseAlerts: preferences.warehouseAlerts,
        orderUpdates: preferences.orderUpdates,
        systemNotifications: preferences.systemNotifications,
        securityAlerts: preferences.securityAlerts,
        promotionalContent: preferences.promotionalContent,
        quietHours: preferences.quietHours as any
      }

    } catch (error) {
      console.error('Failed to get notification preferences:', error)
      throw error
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    supplierId: string,
    updates: Partial<NotificationPreferences>,
    securityContext: SecurityContext
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await rhyPrisma.rHYNotificationPreferences.upsert({
        where: { supplierId },
        create: {
          supplierId,
          emailEnabled: updates.emailEnabled ?? true,
          smsEnabled: updates.smsEnabled ?? false,
          pushEnabled: updates.pushEnabled ?? true,
          inAppEnabled: updates.inAppEnabled ?? true,
          warehouseAlerts: updates.warehouseAlerts ?? true,
          orderUpdates: updates.orderUpdates ?? true,
          systemNotifications: updates.systemNotifications ?? true,
          securityAlerts: updates.securityAlerts ?? true,
          promotionalContent: updates.promotionalContent ?? false,
          quietHours: updates.quietHours || {
            enabled: false,
            startHour: 22,
            endHour: 8,
            timezone: 'UTC'
          }
        },
        update: {
          ...updates,
          updatedAt: new Date()
        }
      })

      return { success: true }

    } catch (error) {
      console.error('Failed to update notification preferences:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get notification statistics for analytics
   */
  async getNotificationStats(
    supplierId: string,
    timeRange: { from: Date; to: Date }
  ): Promise<{
    totalSent: number
    totalRead: number
    readRate: number
    byType: Record<string, number>
    byPriority: Record<string, number>
    byWarehouse: Record<string, number>
  }> {
    try {
      const where = {
        supplierId,
        createdAt: {
          gte: timeRange.from,
          lte: timeRange.to
        }
      }

      const [total, read, byType, byPriority, byWarehouse] = await Promise.all([
        rhyPrisma.rHYNotification.count({ where }),
        rhyPrisma.rHYNotification.count({ where: { ...where, read: true } }),
        rhyPrisma.rHYNotification.groupBy({
          by: ['type'],
          where,
          _count: true
        }),
        rhyPrisma.rHYNotification.groupBy({
          by: ['priority'],
          where,
          _count: true
        }),
        rhyPrisma.rHYNotification.groupBy({
          by: ['warehouseId'],
          where: { ...where, warehouseId: { not: null } },
          _count: true
        })
      ])

      return {
        totalSent: total,
        totalRead: read,
        readRate: total > 0 ? (read / total) * 100 : 0,
        byType: Object.fromEntries(byType.map(item => [item.type, item._count])),
        byPriority: Object.fromEntries(byPriority.map(item => [item.priority, item._count])),
        byWarehouse: Object.fromEntries(byWarehouse.map(item => [item.warehouseId || 'global', item._count]))
      }

    } catch (error) {
      console.error('Failed to get notification stats:', error)
      throw error
    }
  }

  // Private helper methods

  private filterChannelsByPreferences(
    channels: string[],
    preferences: NotificationPreferences
  ): string[] {
    return channels.filter(channel => {
      switch (channel) {
        case 'EMAIL': return preferences.emailEnabled
        case 'SMS': return preferences.smsEnabled
        case 'PUSH': return preferences.pushEnabled
        case 'IN_APP': return preferences.inAppEnabled
        default: return false
      }
    })
  }

  private isQuietHours(quietHours: NonNullable<NotificationPreferences['quietHours']>): boolean {
    if (!quietHours.enabled) return false

    const now = new Date()
    const currentHour = now.getHours()
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (quietHours.startHour > quietHours.endHour) {
      return currentHour >= quietHours.startHour || currentHour < quietHours.endHour
    }
    
    return currentHour >= quietHours.startHour && currentHour < quietHours.endHour
  }

  private async scheduleNotification(
    options: NotificationOptions,
    quietHours: NonNullable<NotificationPreferences['quietHours']>
  ): Promise<{ success: boolean; notificationId?: string }> {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(quietHours.endHour, 0, 0, 0)

    const scheduledNotification = await rhyPrisma.rHYNotification.create({
      data: {
        supplierId: options.supplierId,
        type: options.type,
        title: options.title,
        message: options.message,
        priority: options.priority,
        channels: options.channels,
        warehouseId: options.warehouseId,
        metadata: options.metadata || {},
        expiresAt: options.expiresAt,
        actionUrl: options.actionUrl,
        requiresAcknowledgment: options.requiresAcknowledgment || false,
        status: 'SCHEDULED',
        scheduledFor: tomorrow,
        deliveryAttempts: 0
      }
    })

    return {
      success: true,
      notificationId: scheduledNotification.id
    }
  }

  private async deliverNotification(notificationId: string, channel: string): Promise<void> {
    // Implement actual delivery logic based on channel
    switch (channel) {
      case 'EMAIL':
        // Integration with email service
        break
      case 'SMS':
        // Integration with SMS service
        break
      case 'PUSH':
        // Real-time push notification
        eventBus.emit('notification:push', { notificationId })
        break
      case 'IN_APP':
        // Real-time in-app notification
        eventBus.emit('notification:in-app', { notificationId })
        break
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()