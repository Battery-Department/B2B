/**
 * Settings Service
 * Handles all user preferences and settings management
 */

export interface UserProfile {
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  title: string
  userId?: string
}

export interface NotificationSettings {
  orderUpdates: boolean
  promotions: boolean
  newsletter: boolean
  sms: boolean
  emailFrequency: 'instant' | 'daily' | 'weekly'
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
  lastPasswordChange: string
  sessionTimeout: number // minutes
  loginNotifications: boolean
}

export interface BillingSettings {
  defaultPaymentMethod: string
  autoPayEnabled: boolean
  invoiceDelivery: 'email' | 'mail' | 'both'
  billingEmail: string
}

export interface ShippingSettings {
  defaultAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  preferredCarrier: 'ups' | 'fedex' | 'usps'
  deliveryInstructions: string
  signatureRequired: boolean
}

export interface UserSettings {
  profile: UserProfile
  notifications: NotificationSettings
  security: SecuritySettings
  billing: BillingSettings
  shipping: ShippingSettings
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
    timezone: string
    currency: string
  }
}

export class SettingsService {
  private static readonly STORAGE_KEY = 'userSettings'

  /**
   * Get all user settings
   */
  static async getUserSettings(userId?: string): Promise<UserSettings> {
    try {
      // In a real app, this would fetch from API
      const storedSettings = localStorage.getItem(this.STORAGE_KEY)
      if (storedSettings) {
        return JSON.parse(storedSettings)
      }
      
      // Return default settings
      return this.getDefaultSettings()
    } catch (error) {
      console.error('Error loading settings:', error)
      return this.getDefaultSettings()
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const settings = await this.getUserSettings()
      settings.profile = { ...settings.profile, ...profile }
      
      // In a real app, this would POST to API
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings))
      
      // Simulate API call
      await this.simulateApiCall()
      
      return settings.profile
    } catch (error) {
      console.error('Error updating profile:', error)
      throw new Error('Failed to update profile')
    }
  }

  /**
   * Update notification settings
   */
  static async updateNotifications(notifications: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const settings = await this.getUserSettings()
      settings.notifications = { ...settings.notifications, ...notifications }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings))
      await this.simulateApiCall()
      
      return settings.notifications
    } catch (error) {
      console.error('Error updating notifications:', error)
      throw new Error('Failed to update notification settings')
    }
  }

  /**
   * Update security settings
   */
  static async updateSecurity(security: Partial<SecuritySettings>): Promise<SecuritySettings> {
    try {
      const settings = await this.getUserSettings()
      settings.security = { ...settings.security, ...security }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings))
      await this.simulateApiCall()
      
      return settings.security
    } catch (error) {
      console.error('Error updating security:', error)
      throw new Error('Failed to update security settings')
    }
  }

  /**
   * Change password
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Validate current password (in real app, this would verify with API)
      if (!currentPassword || currentPassword.length < 8) {
        throw new Error('Invalid current password')
      }
      
      // Validate new password
      if (!this.validatePassword(newPassword)) {
        throw new Error('New password does not meet requirements')
      }
      
      // Update last password change date
      const settings = await this.getUserSettings()
      settings.security.lastPasswordChange = new Date().toISOString()
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings))
      await this.simulateApiCall()
    } catch (error) {
      console.error('Error changing password:', error)
      throw error
    }
  }

  /**
   * Update billing settings
   */
  static async updateBilling(billing: Partial<BillingSettings>): Promise<BillingSettings> {
    try {
      const settings = await this.getUserSettings()
      settings.billing = { ...settings.billing, ...billing }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings))
      await this.simulateApiCall()
      
      return settings.billing
    } catch (error) {
      console.error('Error updating billing:', error)
      throw new Error('Failed to update billing settings')
    }
  }

  /**
   * Update shipping settings
   */
  static async updateShipping(shipping: Partial<ShippingSettings>): Promise<ShippingSettings> {
    try {
      const settings = await this.getUserSettings()
      settings.shipping = { ...settings.shipping, ...shipping }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings))
      await this.simulateApiCall()
      
      return settings.shipping
    } catch (error) {
      console.error('Error updating shipping:', error)
      throw new Error('Failed to update shipping settings')
    }
  }

  /**
   * Enable two-factor authentication
   */
  static async enableTwoFactor(): Promise<{ qrCode: string; secret: string }> {
    try {
      await this.simulateApiCall()
      
      // In real app, generate actual QR code and secret
      return {
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        secret: 'JBSWY3DPEHPK3PXP'
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error)
      throw new Error('Failed to enable two-factor authentication')
    }
  }

  /**
   * Verify two-factor code
   */
  static async verifyTwoFactor(code: string): Promise<boolean> {
    try {
      await this.simulateApiCall()
      
      // In real app, verify with backend
      if (code.length === 6 && /^\d+$/.test(code)) {
        const settings = await this.getUserSettings()
        settings.security.twoFactorEnabled = true
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings))
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error verifying 2FA:', error)
      throw new Error('Failed to verify two-factor code')
    }
  }

  /**
   * Validate password strength
   */
  private static validatePassword(password: string): boolean {
    // At least 8 characters, one uppercase, one lowercase, one number
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
    return regex.test(password)
  }

  /**
   * Get default settings
   */
  private static getDefaultSettings(): UserSettings {
    return {
      profile: {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@company.com',
        phone: '(555) 123-4567',
        company: 'Smith Construction Co.',
        title: 'Operations Manager'
      },
      notifications: {
        orderUpdates: true,
        promotions: false,
        newsletter: true,
        sms: false,
        emailFrequency: 'instant'
      },
      security: {
        twoFactorEnabled: false,
        lastPasswordChange: new Date().toISOString(),
        sessionTimeout: 30,
        loginNotifications: true
      },
      billing: {
        defaultPaymentMethod: 'card',
        autoPayEnabled: false,
        invoiceDelivery: 'email',
        billingEmail: 'billing@company.com'
      },
      shipping: {
        defaultAddress: {
          street: '123 Main St',
          city: 'Denver',
          state: 'CO',
          zipCode: '80202',
          country: 'USA'
        },
        preferredCarrier: 'ups',
        deliveryInstructions: '',
        signatureRequired: false
      },
      preferences: {
        theme: 'light',
        language: 'en-US',
        timezone: 'America/Denver',
        currency: 'USD'
      }
    }
  }

  /**
   * Simulate API call delay
   */
  private static async simulateApiCall(delay: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delay))
  }
}