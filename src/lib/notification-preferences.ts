/**
 * RHY Supplier Portal - Notification Preferences Utilities
 * Helper functions for managing notification preferences with type safety
 */

import { NotificationPreferences } from '@/services/notifications/NotificationService'

export interface QuietHoursConfig {
  enabled: boolean
  startHour: number
  endHour: number
  timezone: string
}

export interface NotificationChannelConfig {
  email: boolean
  sms: boolean
  push: boolean
  inApp: boolean
}

export interface NotificationTypeConfig {
  warehouseAlerts: boolean
  orderUpdates: boolean
  systemNotifications: boolean
  securityAlerts: boolean
  promotionalContent: boolean
}

/**
 * Default notification preferences for new suppliers
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: Partial<NotificationPreferences> = {
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: true,
  inAppEnabled: true,
  warehouseAlerts: true,
  orderUpdates: true,
  systemNotifications: true,
  securityAlerts: true, // Always enabled for security
  promotionalContent: false,
  quietHours: {
    enabled: false,
    startHour: 22,
    endHour: 8,
    timezone: 'UTC'
  }
}

/**
 * Get notification channel configuration
 */
export function getChannelConfig(preferences: NotificationPreferences): NotificationChannelConfig {
  return {
    email: preferences.emailEnabled,
    sms: preferences.smsEnabled,
    push: preferences.pushEnabled,
    inApp: preferences.inAppEnabled
  }
}

/**
 * Get notification type configuration
 */
export function getTypeConfig(preferences: NotificationPreferences): NotificationTypeConfig {
  return {
    warehouseAlerts: preferences.warehouseAlerts,
    orderUpdates: preferences.orderUpdates,
    systemNotifications: preferences.systemNotifications,
    securityAlerts: preferences.securityAlerts,
    promotionalContent: preferences.promotionalContent
  }
}

/**
 * Check if notifications should be delivered based on type preferences
 */
export function shouldDeliverByType(
  notificationType: string,
  preferences: NotificationPreferences
): boolean {
  switch (notificationType.toUpperCase()) {
    case 'WAREHOUSE':
      return preferences.warehouseAlerts
    case 'ORDER':
      return preferences.orderUpdates
    case 'SYSTEM':
      return preferences.systemNotifications
    case 'SECURITY':
      return true // Security alerts are always delivered
    case 'PROMOTION':
      return preferences.promotionalContent
    default:
      return preferences.systemNotifications
  }
}

/**
 * Filter channels based on preferences
 */
export function filterEnabledChannels(
  channels: string[],
  preferences: NotificationPreferences
): string[] {
  return channels.filter(channel => {
    switch (channel.toUpperCase()) {
      case 'EMAIL':
        return preferences.emailEnabled
      case 'SMS':
        return preferences.smsEnabled
      case 'PUSH':
        return preferences.pushEnabled
      case 'IN_APP':
        return preferences.inAppEnabled
      default:
        return false
    }
  })
}

/**
 * Check if current time is within quiet hours
 */
export function isWithinQuietHours(quietHours: QuietHoursConfig): boolean {
  if (!quietHours.enabled) return false

  const now = new Date()
  const currentHour = now.getHours()
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (quietHours.startHour > quietHours.endHour) {
    return currentHour >= quietHours.startHour || currentHour < quietHours.endHour
  }
  
  // Handle same-day quiet hours (e.g., 12:00 to 14:00)
  return currentHour >= quietHours.startHour && currentHour < quietHours.endHour
}

/**
 * Get next delivery time after quiet hours
 */
export function getNextDeliveryTime(quietHours: QuietHoursConfig): Date {
  if (!quietHours.enabled) return new Date()

  const now = new Date()
  const nextDelivery = new Date(now)
  
  // If currently in quiet hours, schedule for end of quiet hours
  if (isWithinQuietHours(quietHours)) {
    if (quietHours.startHour > quietHours.endHour) {
      // Overnight quiet hours - schedule for today's end hour
      nextDelivery.setHours(quietHours.endHour, 0, 0, 0)
      
      // If we've passed today's end hour, it's tomorrow
      if (now.getHours() >= quietHours.endHour && now.getHours() < quietHours.startHour) {
        nextDelivery.setDate(nextDelivery.getDate() + 1)
      }
    } else {
      // Same-day quiet hours - schedule for today's end hour
      nextDelivery.setHours(quietHours.endHour, 0, 0, 0)
    }
  }
  
  return nextDelivery
}

/**
 * Validate notification preferences
 */
export function validatePreferences(preferences: Partial<NotificationPreferences>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Security alerts must always be enabled
  if (preferences.securityAlerts === false) {
    errors.push('Security alerts cannot be disabled')
  }

  // At least one channel must be enabled
  const channels = [
    preferences.emailEnabled,
    preferences.smsEnabled,
    preferences.pushEnabled,
    preferences.inAppEnabled
  ]
  
  if (!channels.some(channel => channel === true)) {
    errors.push('At least one notification channel must be enabled')
  }

  // Validate quiet hours
  if (preferences.quietHours?.enabled) {
    const { startHour, endHour } = preferences.quietHours
    
    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
      errors.push('Quiet hours must be between 0 and 23')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Merge preferences with defaults
 */
export function mergeWithDefaults(
  preferences: Partial<NotificationPreferences>,
  supplierId: string
): NotificationPreferences {
  return {
    supplierId,
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...preferences,
    // Ensure security alerts are always enabled
    securityAlerts: true
  } as NotificationPreferences
}

/**
 * Convert preferences to storage format
 */
export function toStorageFormat(preferences: NotificationPreferences): any {
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
    quietHours: preferences.quietHours || DEFAULT_NOTIFICATION_PREFERENCES.quietHours
  }
}

/**
 * Convert from storage format to preferences
 */
export function fromStorageFormat(data: any): NotificationPreferences {
  return {
    supplierId: data.supplierId,
    emailEnabled: data.emailEnabled ?? true,
    smsEnabled: data.smsEnabled ?? false,
    pushEnabled: data.pushEnabled ?? true,
    inAppEnabled: data.inAppEnabled ?? true,
    warehouseAlerts: data.warehouseAlerts ?? true,
    orderUpdates: data.orderUpdates ?? true,
    systemNotifications: data.systemNotifications ?? true,
    securityAlerts: data.securityAlerts ?? true, // Always true
    promotionalContent: data.promotionalContent ?? false,
    quietHours: data.quietHours || DEFAULT_NOTIFICATION_PREFERENCES.quietHours
  }
}

/**
 * Get priority weight for notification ordering
 */
export function getPriorityWeight(priority: string): number {
  switch (priority.toUpperCase()) {
    case 'CRITICAL': return 4
    case 'HIGH': return 3
    case 'MEDIUM': return 2
    case 'LOW': return 1
    default: return 2
  }
}

/**
 * Format notification for display
 */
export function formatNotificationTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffMs < 60000) { // Less than 1 minute
    return 'Just now'
  } else if (diffMs < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diffMs / 60000)
    return `${minutes}m ago`
  } else if (diffHours < 24) { // Less than 1 day
    return `${diffHours}h ago`
  } else if (diffDays < 7) { // Less than 1 week
    return `${diffDays}d ago`
  } else {
    return date.toLocaleDateString()
  }
}

/**
 * Get notification type display name
 */
export function getNotificationTypeDisplayName(type: string): string {
  switch (type.toUpperCase()) {
    case 'WAREHOUSE': return 'Warehouse Alert'
    case 'ORDER': return 'Order Update'
    case 'SYSTEM': return 'System Notification'
    case 'SECURITY': return 'Security Alert'
    case 'PROMOTION': return 'Promotional Content'
    default: return 'Notification'
  }
}

/**
 * Get priority display name
 */
export function getPriorityDisplayName(priority: string): string {
  switch (priority.toUpperCase()) {
    case 'CRITICAL': return 'Critical'
    case 'HIGH': return 'High'
    case 'MEDIUM': return 'Medium'
    case 'LOW': return 'Low'
    default: return 'Medium'
  }
}