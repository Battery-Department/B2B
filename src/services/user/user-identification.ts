import { PrismaClient } from '@/generated/prisma'
import { pushToDataLayer, setUserProperties } from '@/components/GoogleTagManager'
import crypto from 'crypto'

const prisma = new PrismaClient()

export class UserIdentificationService {
  // Generate anonymous user ID
  generateAnonymousId(): string {
    return `anon_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
  }

  // Hash email for privacy-compliant tracking
  hashEmail(email: string): string {
    return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
  }

  // Identify user and merge anonymous data
  async identifyUser(data: {
    userId?: string
    email?: string
    anonymousId?: string
    sessionId: string
    properties?: Record<string, any>
  }) {
    try {
      let user
      
      // Find or create user
      if (data.userId) {
        user = await prisma.user.findUnique({
          where: { id: data.userId },
          include: { customer: true }
        })
      } else if (data.email) {
        user = await prisma.user.findUnique({
          where: { email: data.email },
          include: { customer: true }
        })
        
        if (!user) {
          // Create new user
          user = await prisma.user.create({
            data: {
              email: data.email,
              name: data.properties?.name
            },
            include: { customer: true }
          })
        }
      }

      if (user) {
        // Merge anonymous session data
        if (data.anonymousId) {
          await this.mergeAnonymousData(data.anonymousId, user.id)
        }

        // Update analytics session
        await prisma.analyticsSession.updateMany({
          where: { id: data.sessionId },
          data: { userId: user.id }
        })

        // Set user properties in Google Analytics
        const userProperties = {
          user_id: user.id,
          user_email_hash: this.hashEmail(user.email || ''),
          user_type: user.customer ? 'customer' : 'prospect',
          customer_since: user.createdAt.toISOString(),
          ...data.properties
        }

        // Client-side tracking
        if (typeof window !== 'undefined') {
          setUserProperties(userProperties)
          
          // Set User ID for cross-device tracking
          if (window.gtag) {
            window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
              user_id: user.id
            })
          }
        }

        // Calculate customer metrics
        const customerMetrics = await this.calculateCustomerMetrics(user.id)
        
        return {
          userId: user.id,
          email: user.email,
          isNewUser: !user.customer,
          metrics: customerMetrics
        }
      }

      return null
    } catch (error) {
      console.error('Error identifying user:', error)
      return null
    }
  }

  // Merge anonymous data with identified user
  private async mergeAnonymousData(anonymousId: string, userId: string) {
    try {
      // Update carts
      await prisma.cart.updateMany({
        where: { 
          sessionId: anonymousId,
          userId: null
        },
        data: { userId }
      })

      // Update analytics events
      await prisma.analyticsEvent.updateMany({
        where: {
          sessionId: anonymousId,
          userId: null
        },
        data: { userId }
      })

      // Update analytics sessions
      await prisma.analyticsSession.updateMany({
        where: {
          visitorId: anonymousId,
          userId: null
        },
        data: { userId }
      })
    } catch (error) {
      console.error('Error merging anonymous data:', error)
    }
  }

  // Calculate customer lifetime metrics
  async calculateCustomerMetrics(userId: string) {
    try {
      const customer = await prisma.customer.findFirst({
        where: { userId },
        include: {
          orders: {
            where: { paymentStatus: 'paid' }
          }
        }
      })

      if (!customer) {
        return {
          lifetimeValue: 0,
          orderCount: 0,
          averageOrderValue: 0,
          lastOrderDate: null
        }
      }

      const lifetimeValue = customer.orders.reduce((sum, order) => sum + order.total, 0)
      const orderCount = customer.orders.length
      const averageOrderValue = orderCount > 0 ? lifetimeValue / orderCount : 0
      const lastOrderDate = customer.orders.length > 0 
        ? customer.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
        : null

      return {
        lifetimeValue,
        orderCount,
        averageOrderValue,
        lastOrderDate
      }
    } catch (error) {
      console.error('Error calculating customer metrics:', error)
      return {
        lifetimeValue: 0,
        orderCount: 0,
        averageOrderValue: 0,
        lastOrderDate: null
      }
    }
  }

  // Track user consent preferences
  async updateConsentPreferences(userId: string, preferences: {
    analytics: boolean
    marketing: boolean
    functional: boolean
  }) {
    try {
      // Store consent preferences
      await prisma.user.update({
        where: { id: userId },
        data: {
          // Add consent fields to User model if needed
        }
      })

      // Update Google consent mode
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: preferences.analytics ? 'granted' : 'denied',
          ad_storage: preferences.marketing ? 'granted' : 'denied',
          functionality_storage: preferences.functional ? 'granted' : 'denied'
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Error updating consent:', error)
      return { success: false }
    }
  }

  // Create audiences for remarketing
  async createAudience(criteria: {
    name: string
    description: string
    conditions: any
  }) {
    // This would integrate with Google Ads API
    // For now, we'll track audience membership locally
    
    try {
      // Example: High-value customers
      if (criteria.name === 'high_value_customers') {
        const customers = await prisma.customer.findMany({
          where: {
            orders: {
              some: {
                total: { gte: 1000 }
              }
            }
          },
          include: { user: true }
        })

        // Tag users for this audience
        for (const customer of customers) {
          if (customer.user) {
            await this.tagUserForAudience(customer.user.id, criteria.name)
          }
        }
      }

      return { success: true, audienceSize: 0 }
    } catch (error) {
      console.error('Error creating audience:', error)
      return { success: false }
    }
  }

  // Tag user for specific audience
  private async tagUserForAudience(userId: string, audienceName: string) {
    // In production, this would sync with Google Ads Customer Match
    console.log(`User ${userId} added to audience: ${audienceName}`)
  }
}

export const userIdentification = new UserIdentificationService()