/**
 * Notification Manager
 * Unified notification system for the Lithi ecosystem
 */

import { prisma } from '@/lib/prisma'
import { eventBus, EventTypes } from '@/services/events/event-bus'
import { lithiGateway } from '@/services/api-gateway'

interface NotificationOptions {
  userId: string
  type: 'order' | 'message' | 'system' | 'promotion'
  title: string
  message: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  channels?: ('email' | 'sms' | 'push' | 'in-app')[]
  metadata?: Record<string, any>
  expiresIn?: number // milliseconds
  orderId?: string
  sessionId?: string
}

interface NotificationTemplate {
  id: string
  name: string
  type: string
  subject: string
  body: string
  variables: string[]
}

export class NotificationManager {
  private templates: Map<string, NotificationTemplate> = new Map()
  private notificationQueue: { options: NotificationOptions; id: string }[] = []
  private isProcessing = false

  constructor() {
    this.initializeTemplates()
    this.startProcessing()
  }

  private initializeTemplates(): void {
    // Order notifications
    this.templates.set('order_created', {
      id: 'order_created',
      name: 'Order Created',
      type: 'order',
      subject: 'Order {{orderNumber}} Confirmed',
      body: 'Thank you for your order {{customerName}}! Your order {{orderNumber}} has been confirmed and will be processed shortly.',
      variables: ['orderNumber', 'customerName']
    })

    this.templates.set('order_shipped', {
      id: 'order_shipped',
      name: 'Order Shipped',
      type: 'order',
      subject: 'Your Order {{orderNumber}} Has Shipped',
      body: 'Good news! Your order {{orderNumber}} has been shipped. Track your package: {{trackingLink}}',
      variables: ['orderNumber', 'trackingLink']
    })

    // System notifications
    this.templates.set('system_maintenance', {
      id: 'system_maintenance',
      name: 'System Maintenance',
      type: 'system',
      subject: 'Scheduled Maintenance',
      body: 'We will be performing scheduled maintenance on {{date}} from {{startTime}} to {{endTime}}.',
      variables: ['date', 'startTime', 'endTime']
    })

    // Chat notifications
    this.templates.set('new_message', {
      id: 'new_message',
      name: 'New Message',
      type: 'message',
      subject: 'New message from {{senderName}}',
      body: '{{senderName}} sent you a message: "{{messagePreview}}"',
      variables: ['senderName', 'messagePreview']
    })
  }

  // Send notification
  async sendNotification(options: NotificationOptions): Promise<string> {
    try {
      // Set defaults
      const notification = {
        ...options,
        priority: options.priority || 'normal',
        channels: options.channels || ['in-app'],
        status: 'pending',
        createdAt: new Date(),
        expiresAt: options.expiresIn 
          ? new Date(Date.now() + options.expiresIn)
          : undefined
      }

      // Create notification in database
      const created = await prisma.notification.create({
        data: {
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          channel: notification.channels?.[0] || 'in-app',
          metadata: {
            status: notification.status,
            orderId: notification.orderId,
            sessionId: notification.sessionId,
            expiresAt: notification.expiresAt,
            ...notification.metadata
          }
        }
      })

      // Add to processing queue
      this.notificationQueue.push({ options: notification, id: created.id })

      // Emit event
      eventBus.publish(EventTypes.NOTIFICATION_SENT, {
        notificationId: created.id,
        userId: notification.userId,
        type: notification.type,
        channels: notification.channels
      })

      return created.id
    } catch (error) {
      console.error('Failed to send notification:', error)
      throw error
    }
  }

  // Send templated notification
  async sendTemplatedNotification(
    templateId: string,
    userId: string,
    variables: Record<string, string>,
    options: Partial<NotificationOptions> = {}
  ): Promise<string> {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    // Replace variables in template
    let subject = template.subject
    let body = template.body

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      subject = subject.replace(regex, value)
      body = body.replace(regex, value)
    }

    return this.sendNotification({
      userId,
      type: template.type as any,
      title: subject,
      message: body,
      ...options
    })
  }

  // Process notification queue
  private async startProcessing(): Promise<void> {
    if (this.isProcessing) return
    
    this.isProcessing = true
    
    setInterval(async () => {
      if (this.notificationQueue.length > 0) {
        await this.processQueue()
      }
    }, 1000) // Process every second
  }

  private async processQueue(): Promise<void> {
    const batch = this.notificationQueue.splice(0, 10) // Process up to 10 at a time
    
    await Promise.allSettled(
      batch.map(item => this.deliverNotification(item.options, item.id))
    )
  }

  // Deliver notification through channels
  private async deliverNotification(notification: NotificationOptions, notificationId: string): Promise<void> {
    const deliveryPromises = []

    for (const channel of notification.channels!) {
      switch (channel) {
        case 'email':
          deliveryPromises.push(this.sendEmail(notification))
          break
        case 'sms':
          deliveryPromises.push(this.sendSMS(notification))
          break
        case 'push':
          deliveryPromises.push(this.sendPushNotification(notification))
          break
        case 'in-app':
          deliveryPromises.push(this.sendInAppNotification(notification, notificationId))
          break
      }
    }

    const results = await Promise.allSettled(deliveryPromises)
    
    // Update notification status
    const allSuccessful = results.every(r => r.status === 'fulfilled')
    
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        metadata: {
          status: allSuccessful ? 'sent' : 'failed',
          sentAt: allSuccessful ? new Date() : undefined
        }
      }
    })
  }

  // Email delivery
  private async sendEmail(notification: NotificationOptions): Promise<void> {
    try {
      // Integration with email service (SendGrid, SES, etc.)
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: notification.userId, // Would need to lookup email
          subject: notification.title,
          body: notification.message,
          priority: notification.priority
        })
      })

      if (!response.ok) {
        throw new Error('Email delivery failed')
      }
    } catch (error) {
      console.error('Email delivery error:', error)
      throw error
    }
  }

  // SMS delivery
  private async sendSMS(notification: NotificationOptions): Promise<void> {
    try {
      // Integration with SMS service (Twilio, etc.)
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: notification.userId, // Would need to lookup phone
          message: `${notification.title}: ${notification.message}`
        })
      })

      if (!response.ok) {
        throw new Error('SMS delivery failed')
      }
    } catch (error) {
      console.error('SMS delivery error:', error)
      throw error
    }
  }

  // Push notification delivery
  private async sendPushNotification(notification: NotificationOptions): Promise<void> {
    try {
      // Send to connected WebSocket clients
      eventBus.publish('push_notification', {
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        data: notification.metadata
      })

      // Also send to service workers if available
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification(notification.title, {
          body: notification.message,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          data: notification.metadata
        })
      }
    } catch (error) {
      console.error('Push notification error:', error)
      throw error
    }
  }

  // In-app notification delivery
  private async sendInAppNotification(notification: NotificationOptions, notificationId: string): Promise<void> {
    // Emit event for UI components to handle
    eventBus.publish('in_app_notification', {
      userId: notification.userId,
      id: notificationId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      metadata: notification.metadata
    })
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.update({
      where: { 
        id: notificationId,
        userId: userId
      },
      data: {
        read: true,
        readAt: new Date()
      }
    })

    eventBus.publish(EventTypes.NOTIFICATION_READ, {
      notificationId,
      userId
    })
  }

  // Dismiss notification
  async dismissNotification(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.update({
      where: { 
        id: notificationId,
        userId: userId
      },
      data: {
        metadata: {
          status: 'dismissed',
          dismissedAt: new Date()
        }
      }
    })

    eventBus.publish(EventTypes.NOTIFICATION_DISMISSED, {
      notificationId,
      userId
    })
  }

  // Get user notifications
  async getUserNotifications(
    userId: string,
    options: {
      status?: string
      type?: string
      limit?: number
      offset?: number
    } = {}
  ): Promise<any[]> {
    const where: any = { userId }
    
    if (options.status) {
      where.status = options.status
    }
    
    if (options.type) {
      where.type = options.type
    }

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 20,
      skip: options.offset || 0
    })
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        read: false
      }
    })
  }

  // Broadcast notification to multiple users
  async broadcastNotification(
    userIds: string[],
    options: Omit<NotificationOptions, 'userId'>
  ): Promise<string[]> {
    const promises = userIds.map(userId =>
      this.sendNotification({ ...options, userId })
    )
    
    return Promise.all(promises)
  }

  // Schedule notification
  async scheduleNotification(
    options: NotificationOptions & { sendAt: Date }
  ): Promise<string> {
    // Store scheduled notification
    const scheduled = await prisma.notification.create({
      data: {
        userId: options.userId,
        type: options.type,
        title: options.title,
        message: options.message,
        priority: options.priority || 'normal',
        channel: options.channels?.[0] || 'in-app',
        metadata: {
          ...options.metadata,
          status: 'scheduled',
          scheduledFor: options.sendAt,
          orderId: options.orderId,
          sessionId: options.sessionId
        }
      }
    })

    // Set timeout to send notification
    const delay = options.sendAt.getTime() - Date.now()
    if (delay > 0) {
      setTimeout(() => {
        this.sendNotification(options)
      }, delay)
    }

    return scheduled.id
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager()

// Notification helpers
export const sendOrderNotification = (
  userId: string,
  orderData: {
    orderNumber: string
    status: string
    trackingNumber?: string
  }
) => {
  const templates: Record<string, string> = {
    created: 'order_created',
    shipped: 'order_shipped',
    delivered: 'order_delivered',
    cancelled: 'order_cancelled'
  }

  const templateId = templates[orderData.status]
  if (!templateId) return

  return notificationManager.sendTemplatedNotification(
    templateId,
    userId,
    orderData,
    {
      channels: ['email', 'push'],
      priority: 'normal',
      orderId: orderData.orderNumber
    }
  )
}