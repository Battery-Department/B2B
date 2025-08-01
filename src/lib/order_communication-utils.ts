/**
 * RHY Supplier Portal - Order Communication Utilities
 * Utility functions and helpers for order communication system
 * Provides formatting, validation, and helper functions for multi-channel communication
 */

import { format, formatDistance, isToday, isYesterday, parseISO } from 'date-fns'
import { 
  OrderMessage, 
  NotificationPreferences,
  CommunicationMetrics,
  OrderCommunicationThread,
  CommunicationErrorCode 
} from '@/types/order_communication'
import { WAREHOUSES } from '@/config/app'

/**
 * Message formatting utilities
 */
export class MessageFormatter {
  
  /**
   * Format message timestamp for display
   */
  static formatMessageTime(date: Date | string, includeDate: boolean = false): string {
    const messageDate = typeof date === 'string' ? parseISO(date) : date
    
    if (isToday(messageDate)) {
      return format(messageDate, 'h:mm a')
    } else if (isYesterday(messageDate)) {
      return includeDate ? `Yesterday ${format(messageDate, 'h:mm a')}` : 'Yesterday'
    } else {
      return includeDate ? format(messageDate, 'MMM d, h:mm a') : format(messageDate, 'MMM d')
    }
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  static formatRelativeTime(date: Date | string): string {
    const messageDate = typeof date === 'string' ? parseISO(date) : date
    return formatDistance(messageDate, new Date(), { addSuffix: true })
  }

  /**
   * Format message content for different channels
   */
  static formatForChannel(content: string, channel: 'EMAIL' | 'SMS' | 'PUSH'): string {
    switch (channel) {
      case 'SMS':
        // Truncate for SMS (160 characters)
        return content.length > 157 ? content.substring(0, 157) + '...' : content
      
      case 'PUSH':
        // Truncate for push notifications (100 characters)
        return content.length > 97 ? content.substring(0, 97) + '...' : content
      
      case 'EMAIL':
      default:
        return content
    }
  }

  /**
   * Generate message preview text
   */
  static generatePreview(content: string, maxLength: number = 100): string {
    const cleanContent = content.replace(/<[^>]*>/g, '').trim()
    return cleanContent.length > maxLength 
      ? cleanContent.substring(0, maxLength - 3) + '...'
      : cleanContent
  }

  /**
   * Format phone number for display
   */
  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    
    return phone
  }

  /**
   * Format order ID for display
   */
  static formatOrderId(orderId: string): string {
    return orderId.toUpperCase()
  }

  /**
   * Format warehouse name
   */
  static formatWarehouseName(warehouseId: string): string {
    const warehouse = Object.values(WAREHOUSES).find(w => w.id === warehouseId)
    return warehouse ? warehouse.name : warehouseId.toUpperCase()
  }
}

/**
 * Message validation utilities
 */
export class MessageValidator {
  
  private static readonly MAX_MESSAGE_LENGTH = 5000
  private static readonly MAX_SUBJECT_LENGTH = 200
  private static readonly MIN_MESSAGE_LENGTH = 1
  
  /**
   * Validate message content
   */
  static validateMessage(subject: string, content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Subject validation
    if (!subject || subject.trim().length === 0) {
      errors.push('Subject is required')
    } else if (subject.length > this.MAX_SUBJECT_LENGTH) {
      errors.push(`Subject must be ${this.MAX_SUBJECT_LENGTH} characters or less`)
    }
    
    // Content validation
    if (!content || content.trim().length === 0) {
      errors.push('Message content is required')
    } else if (content.length < this.MIN_MESSAGE_LENGTH) {
      errors.push(`Message must be at least ${this.MIN_MESSAGE_LENGTH} character`)
    } else if (content.length > this.MAX_MESSAGE_LENGTH) {
      errors.push(`Message must be ${this.MAX_MESSAGE_LENGTH} characters or less`)
    }
    
    // Check for potentially harmful content
    if (this.containsPotentiallyHarmfulContent(content)) {
      errors.push('Message contains potentially harmful content')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate email address
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate phone number
   */
  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
    return phoneRegex.test(phone)
  }

  /**
   * Check for potentially harmful content
   */
  private static containsPotentiallyHarmfulContent(content: string): boolean {
    const harmfulPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi
    ]
    
    return harmfulPatterns.some(pattern => pattern.test(content))
  }

  /**
   * Sanitize message content
   */
  static sanitizeContent(content: string): string {
    return content
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .trim()
  }
}

/**
 * Communication priority utilities
 */
export class PriorityManager {
  
  private static readonly PRIORITY_LEVELS = {
    LOW: 1,
    NORMAL: 2,
    HIGH: 3,
    URGENT: 4,
    CRITICAL: 5
  }

  /**
   * Determine message priority based on content
   */
  static determinePriority(subject: string, content: string, messageType: string): 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL' {
    const text = (subject + ' ' + content).toLowerCase()
    
    // Critical keywords
    if (this.containsKeywords(text, ['critical', 'emergency', 'urgent', 'immediate', 'asap', 'broken', 'failed', 'error'])) {
      return 'CRITICAL'
    }
    
    // Urgent keywords
    if (this.containsKeywords(text, ['rush', 'expedite', 'priority', 'important', 'delay', 'problem'])) {
      return 'URGENT'
    }
    
    // High priority keywords
    if (this.containsKeywords(text, ['question', 'issue', 'concern', 'help', 'support'])) {
      return 'HIGH'
    }
    
    // Message type based priority
    if (messageType === 'ALERT') return 'HIGH'
    if (messageType === 'NOTIFICATION') return 'NORMAL'
    if (messageType === 'UPDATE') return 'NORMAL'
    
    return 'NORMAL'
  }

  /**
   * Get priority score for sorting
   */
  static getPriorityScore(priority: string): number {
    return this.PRIORITY_LEVELS[priority as keyof typeof this.PRIORITY_LEVELS] || 2
  }

  /**
   * Get priority color class
   */
  static getPriorityColor(priority: string): string {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'URGENT': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'HIGH': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'NORMAL': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  /**
   * Get priority icon
   */
  static getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'CRITICAL': return '🔴'
      case 'URGENT': return '🟠'
      case 'HIGH': return '🟡'
      case 'NORMAL': return '🔵'
      case 'LOW': return '⚪'
      default: return '🔵'
    }
  }

  private static containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword))
  }
}

/**
 * Thread management utilities
 */
export class ThreadManager {
  
  /**
   * Group messages by thread
   */
  static groupMessagesByThread(messages: OrderMessage[]): Map<string, OrderMessage[]> {
    const threads = new Map<string, OrderMessage[]>()
    
    messages.forEach(message => {
      const threadKey = this.generateThreadKey(message)
      
      if (!threads.has(threadKey)) {
        threads.set(threadKey, [])
      }
      
      threads.get(threadKey)!.push(message)
    })
    
    // Sort messages within each thread by date
    threads.forEach(threadMessages => {
      threadMessages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
    })
    
    return threads
  }

  /**
   * Generate thread key for grouping
   */
  static generateThreadKey(message: OrderMessage): string {
    // Group by order ID and subject (removing "Re:" prefixes)
    const cleanSubject = message.subject.replace(/^(re:|fwd:)\s*/i, '').trim()
    return `${message.orderId}_${cleanSubject.toLowerCase().replace(/\s+/g, '_')}`
  }

  /**
   * Calculate thread metrics
   */
  static calculateThreadMetrics(messages: OrderMessage[]): {
    messageCount: number
    participantCount: number
    responseTime: number
    lastActivity: Date
  } {
    const participants = new Set(messages.map(m => m.senderId))
    const sortedMessages = messages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
    
    // Calculate average response time
    let totalResponseTime = 0
    let responseCount = 0
    
    for (let i = 1; i < sortedMessages.length; i++) {
      const prevMessage = sortedMessages[i - 1]
      const currentMessage = sortedMessages[i]
      
      if (prevMessage.senderId !== currentMessage.senderId) {
        const responseTime = new Date(currentMessage.sentAt).getTime() - new Date(prevMessage.sentAt).getTime()
        totalResponseTime += responseTime
        responseCount++
      }
    }
    
    const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0
    
    return {
      messageCount: messages.length,
      participantCount: participants.size,
      responseTime: Math.round(averageResponseTime / (1000 * 60)), // Convert to minutes
      lastActivity: sortedMessages[sortedMessages.length - 1].sentAt
    }
  }
}

/**
 * Analytics utilities
 */
export class AnalyticsHelper {
  
  /**
   * Calculate communication metrics
   */
  static calculateCommunicationMetrics(messages: OrderMessage[]): CommunicationMetrics {
    const now = new Date()
    const orderId = messages[0]?.orderId || ''
    const warehouseId = messages[0]?.metadata?.warehouseId || ''
    
    // Response time calculations
    const responseTimes: number[] = []
    const sortedMessages = messages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
    
    for (let i = 1; i < sortedMessages.length; i++) {
      const prevMessage = sortedMessages[i - 1]
      const currentMessage = sortedMessages[i]
      
      if (prevMessage.senderId !== currentMessage.senderId) {
        const responseTime = new Date(currentMessage.sentAt).getTime() - new Date(prevMessage.sentAt).getTime()
        responseTimes.push(responseTime / (1000 * 60)) // Convert to minutes
      }
    }
    
    // Channel distribution
    const channelCounts = messages.reduce((acc, message) => {
      // This would be derived from message metadata in a real implementation
      acc.inApp++
      return acc
    }, { email: 0, sms: 0, push: 0, inApp: messages.length })
    
    // Priority distribution
    const priorityCounts = messages.reduce((acc, message) => {
      acc[message.priority.toLowerCase()]++
      return acc
    }, { low: 0, normal: 0, high: 0, urgent: 0, critical: 0 })
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0
    
    const medianResponseTime = responseTimes.length > 0
      ? this.calculateMedian(responseTimes)
      : 0
    
    const p95ResponseTime = responseTimes.length > 0
      ? this.calculatePercentile(responseTimes, 0.95)
      : 0
    
    return {
      orderId,
      warehouseId,
      totalMessages: messages.length,
      responseTime: {
        average: Math.round(averageResponseTime),
        median: Math.round(medianResponseTime),
        p95: Math.round(p95ResponseTime)
      },
      resolutionTime: Math.round(averageResponseTime * 2), // Simplified calculation
      escalationRate: this.calculateEscalationRate(messages),
      customerSatisfaction: 4.5, // This would come from actual satisfaction data
      communicationChannels: channelCounts,
      messagesByPriority: priorityCounts,
      calculatedAt: now
    }
  }

  /**
   * Calculate escalation rate
   */
  private static calculateEscalationRate(messages: OrderMessage[]): number {
    const escalatedMessages = messages.filter(m => m.messageType === 'ESCALATION')
    return messages.length > 0 ? (escalatedMessages.length / messages.length) * 100 : 0
  }

  /**
   * Calculate median from array of numbers
   */
  private static calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2
    } else {
      return sorted[middle]
    }
  }

  /**
   * Calculate percentile from array of numbers
   */
  private static calculatePercentile(numbers: number[], percentile: number): number {
    const sorted = [...numbers].sort((a, b) => a - b)
    const index = Math.ceil(sorted.length * percentile) - 1
    return sorted[Math.max(0, index)]
  }

  /**
   * Generate time series data for trends
   */
  static generateTimeSeriesData(
    messages: OrderMessage[], 
    interval: 'hour' | 'day' | 'week' = 'day'
  ): Array<{ timestamp: Date; value: number }> {
    const timeMap = new Map<string, number>()
    
    messages.forEach(message => {
      const key = this.getTimeKey(message.sentAt, interval)
      timeMap.set(key, (timeMap.get(key) || 0) + 1)
    })
    
    return Array.from(timeMap.entries())
      .map(([key, value]) => ({
        timestamp: new Date(key),
        value
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  private static getTimeKey(date: Date, interval: 'hour' | 'day' | 'week'): string {
    switch (interval) {
      case 'hour':
        return format(date, 'yyyy-MM-dd HH:00:00')
      case 'week':
        // Get Monday of the week
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay() + 1)
        return format(weekStart, 'yyyy-MM-dd')
      case 'day':
      default:
        return format(date, 'yyyy-MM-dd')
    }
  }
}

/**
 * Error handling utilities
 */
export class ErrorHandler {
  
  /**
   * Format error message for user display
   */
  static formatErrorMessage(code: CommunicationErrorCode, details?: any): string {
    switch (code) {
      case 'INVALID_ORDER':
        return 'The specified order could not be found.'
      case 'INVALID_USER':
        return 'User authentication failed. Please log in again.'
      case 'PERMISSION_DENIED':
        return 'You do not have permission to perform this action.'
      case 'MESSAGE_TOO_LARGE':
        return 'Message is too large. Please reduce the content size.'
      case 'RATE_LIMIT_EXCEEDED':
        return 'Too many messages sent. Please wait before sending another message.'
      case 'TEMPLATE_NOT_FOUND':
        return 'The requested message template could not be found.'
      case 'DELIVERY_FAILED':
        return 'Message delivery failed. Please try again.'
      case 'VALIDATION_ERROR':
        return details?.message || 'Invalid input provided.'
      case 'SYSTEM_ERROR':
      default:
        return 'A system error occurred. Please try again later.'
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(code: CommunicationErrorCode): boolean {
    const retryableCodes: CommunicationErrorCode[] = [
      'DELIVERY_FAILED',
      'SYSTEM_ERROR',
      'RATE_LIMIT_EXCEEDED'
    ]
    
    return retryableCodes.includes(code)
  }

  /**
   * Get suggested retry delay in milliseconds
   */
  static getRetryDelay(code: CommunicationErrorCode, attemptNumber: number): number {
    const baseDelay = 1000 // 1 second
    const maxDelay = 30000 // 30 seconds
    
    let multiplier = 1
    
    switch (code) {
      case 'RATE_LIMIT_EXCEEDED':
        multiplier = 5
        break
      case 'DELIVERY_FAILED':
        multiplier = 2
        break
      case 'SYSTEM_ERROR':
      default:
        multiplier = 1.5
        break
    }
    
    const delay = Math.min(baseDelay * Math.pow(multiplier, attemptNumber), maxDelay)
    return Math.round(delay)
  }
}

/**
 * Notification preference utilities
 */
export class NotificationHelper {
  
  /**
   * Check if user should receive notification based on preferences
   */
  static shouldReceiveNotification(
    preferences: NotificationPreferences,
    messageType: string,
    priority: string,
    channel: 'EMAIL' | 'SMS' | 'PUSH'
  ): boolean {
    // Check quiet hours
    if (this.isInQuietHours(preferences)) {
      // Only allow critical messages during quiet hours
      if (priority !== 'CRITICAL' && priority !== 'URGENT') {
        return false
      }
    }
    
    // Check channel-specific preferences
    switch (channel) {
      case 'EMAIL':
        return preferences.email.orderUpdates || 
               (priority === 'URGENT' || priority === 'CRITICAL')
      
      case 'SMS':
        return preferences.sms.urgentAlerts && 
               (priority === 'URGENT' || priority === 'CRITICAL')
      
      case 'PUSH':
        return preferences.push.realTimeUpdates
      
      default:
        return false
    }
  }

  /**
   * Check if current time is within user's quiet hours
   */
  private static isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) {
      return false
    }
    
    const now = new Date()
    const currentHour = now.getHours()
    const startHour = parseInt(preferences.quietHours.startTime.split(':')[0])
    const endHour = parseInt(preferences.quietHours.endTime.split(':')[0])
    
    if (startHour <= endHour) {
      // Same day quiet hours (e.g., 22:00 to 06:00 next day)
      return currentHour >= startHour && currentHour < endHour
    } else {
      // Overnight quiet hours (e.g., 22:00 to 06:00 next day)
      return currentHour >= startHour || currentHour < endHour
    }
  }

  /**
   * Get optimal delivery time based on preferences
   */
  static getOptimalDeliveryTime(preferences: NotificationPreferences): Date | null {
    if (preferences.frequency === 'IMMEDIATE') {
      return new Date()
    }
    
    const now = new Date()
    
    // If in quiet hours, schedule for end of quiet hours
    if (this.isInQuietHours(preferences)) {
      const deliveryTime = new Date(now)
      const endHour = parseInt(preferences.quietHours.endTime.split(':')[0])
      const endMinute = parseInt(preferences.quietHours.endTime.split(':')[1])
      
      deliveryTime.setHours(endHour, endMinute, 0, 0)
      
      // If end time is tomorrow
      if (deliveryTime <= now) {
        deliveryTime.setDate(deliveryTime.getDate() + 1)
      }
      
      return deliveryTime
    }
    
    return new Date()
  }
}

export {
  MessageFormatter,
  MessageValidator,
  PriorityManager,
  ThreadManager,
  AnalyticsHelper,
  ErrorHandler,
  NotificationHelper
}