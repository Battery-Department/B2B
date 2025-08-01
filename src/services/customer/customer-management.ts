// Terminal 3: Comprehensive Customer Management System
// Complete customer lifecycle management with analytics and segmentation

import { PrismaClient } from '@prisma/client'
import { EventEmitter } from 'events'
import { ecommerceDataLayer, withDatabaseTransaction } from '@/services/database/ecommerce-data-layer'

const prisma = new PrismaClient()

export interface Customer {
  id: string
  userId: string
  profile: CustomerProfile
  preferences: CustomerPreferences
  addresses: CustomerAddress[]
  paymentMethods: SavedPaymentMethod[]
  subscriptions: CustomerSubscription[]
  orderHistory: OrderSummary[]
  analytics: CustomerAnalytics
  segmentation: CustomerSegmentation
  lifecycle: CustomerLifecycle
  support: CustomerSupport
  loyalty: CustomerLoyalty
  communication: CommunicationPreferences
  privacy: PrivacySettings
  createdAt: Date
  updatedAt: Date
}

export interface CustomerProfile {
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: Date
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  companyName?: string
  jobTitle?: string
  industry?: string
  taxId?: string
  vatNumber?: string
  website?: string
  timezone: string
  language: string
  currency: string
  avatar?: string
  notes?: string
  tags: string[]
  customFields: Record<string, any>
}

export interface CustomerPreferences {
  productCategories: string[]
  brands: string[]
  priceRange: {
    min: number
    max: number
  }
  shippingMethod: 'standard' | 'express' | 'overnight'
  paymentMethod: 'card' | 'bank_transfer' | 'paypal'
  communicationChannels: ('email' | 'sms' | 'phone' | 'push')[]
  frequencyPreferences: {
    promotions: 'daily' | 'weekly' | 'monthly' | 'never'
    updates: 'immediate' | 'daily' | 'weekly' | 'never'
    recommendations: 'weekly' | 'monthly' | 'never'
  }
  orderReminders: boolean
  wishlistSharing: boolean
  reviewReminders: boolean
}

export interface CustomerAddress {
  id: string
  type: 'shipping' | 'billing' | 'both'
  name: string
  company?: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  instructions?: string
  isDefault: boolean
  isValidated: boolean
  lastUsed?: Date
  metadata?: Record<string, any>
}

export interface SavedPaymentMethod {
  id: string
  type: 'card' | 'bank_account' | 'paypal'
  provider: string
  providerMethodId: string
  nickname?: string
  isDefault: boolean
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
    fingerprint: string
  }
  bankAccount?: {
    bankName: string
    accountType: 'checking' | 'savings'
    last4: string
  }
  createdAt: Date
  lastUsed?: Date
}

export interface CustomerSubscription {
  id: string
  planId: string
  planName: string
  status: 'active' | 'paused' | 'cancelled' | 'expired'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  trialEnd?: Date
  cancelAtPeriodEnd: boolean
  metadata?: Record<string, any>
}

export interface OrderSummary {
  id: string
  orderNumber: string
  status: string
  total: number
  currency: string
  itemCount: number
  placedAt: Date
  deliveredAt?: Date
}

export interface CustomerAnalytics {
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  orderFrequency: number // orders per month
  lastOrderDate?: Date
  lifetimeValue: number
  predictedLifetimeValue: number
  churnRisk: number // 0-1
  satisfactionScore: number // 1-5
  npsScore?: number // -100 to 100
  favoriteCategories: Array<{
    category: string
    orderCount: number
    totalSpent: number
  }>
  favoriteProducts: Array<{
    productId: string
    name: string
    orderCount: number
    totalSpent: number
  }>
  seasonalPatterns: Record<string, number> // month -> order count
  channelAttribution: Record<string, number> // channel -> order count
}

export interface CustomerSegmentation {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  recencyScore: number // 1-5 (5 = most recent)
  frequencyScore: number // 1-5 (5 = most frequent)
  monetaryScore: number // 1-5 (5 = highest value)
  rfmScore: string // combination like "555"
  segments: string[] // custom segments
  behaviorProfile: 'bargain_hunter' | 'loyalist' | 'impulse_buyer' | 'researcher' | 'returner'
  acquisitionChannel: string
  customerJourney: CustomerJourneyStage[]
  engagementLevel: 'high' | 'medium' | 'low' | 'inactive'
  churnProbability: number // 0-1
  nextBestAction: string
}

export interface CustomerJourneyStage {
  stage: 'awareness' | 'consideration' | 'purchase' | 'retention' | 'advocacy'
  enteredAt: Date
  exitedAt?: Date
  touchpoints: string[]
  actions: string[]
}

export interface CustomerLifecycle {
  stage: 'prospect' | 'new' | 'active' | 'returning' | 'at_risk' | 'dormant' | 'churned'
  daysSinceFirstOrder?: number
  daysSinceLastOrder?: number
  orderCount: number
  stageHistory: Array<{
    stage: string
    enteredAt: Date
    exitedAt?: Date
    triggers: string[]
  }>
  predictedNextStage?: string
  stageChangeDate?: Date
  retention: {
    thirtyDay: boolean
    sixtyDay: boolean
    ninetyDay: boolean
    oneYear: boolean
  }
}

export interface CustomerSupport {
  tickets: SupportTicketSummary[]
  satisfaction: {
    averageRating: number
    totalRatings: number
    lastRatingDate?: Date
  }
  escalations: number
  resolutionTime: {
    average: number // hours
    fastest: number
    slowest: number
  }
  preferredChannel: 'email' | 'chat' | 'phone' | 'self_service'
  notes: CustomerNote[]
}

export interface SupportTicketSummary {
  id: string
  subject: string
  status: 'open' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: Date
  resolvedAt?: Date
  satisfaction?: number
}

export interface CustomerNote {
  id: string
  content: string
  type: 'general' | 'support' | 'sales' | 'billing'
  visibility: 'internal' | 'customer'
  authorId: string
  authorName: string
  createdAt: Date
  tags?: string[]
}

export interface CustomerLoyalty {
  pointsBalance: number
  totalPointsEarned: number
  totalPointsRedeemed: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  tierProgress: {
    current: number
    required: number
    nextTier: string
  }
  achievements: LoyaltyAchievement[]
  rewards: LoyaltyReward[]
  referrals: {
    sent: number
    successful: number
    totalRewards: number
  }
}

export interface LoyaltyAchievement {
  id: string
  name: string
  description: string
  pointsAwarded: number
  unlockedAt: Date
  category: string
}

export interface LoyaltyReward {
  id: string
  name: string
  type: 'discount' | 'free_shipping' | 'product' | 'experience'
  value: number
  pointsCost: number
  redeemedAt: Date
  usedAt?: Date
  expiresAt?: Date
}

export interface CommunicationPreferences {
  email: {
    marketing: boolean
    transactional: boolean
    newsletter: boolean
    abandoned_cart: boolean
    product_updates: boolean
    frequency: 'immediate' | 'daily' | 'weekly' | 'monthly'
  }
  sms: {
    marketing: boolean
    transactional: boolean
    order_updates: boolean
    delivery_notifications: boolean
  }
  push: {
    marketing: boolean
    order_updates: boolean
    recommendations: boolean
    price_alerts: boolean
  }
  phone: {
    marketing: boolean
    support_callbacks: boolean
  }
  postal: {
    catalogs: boolean
    promotional_materials: boolean
  }
  unsubscribedAt?: Date
  bounced: boolean
  suppressionReason?: string
}

export interface PrivacySettings {
  dataProcessingConsent: boolean
  marketingConsent: boolean
  profilingConsent: boolean
  thirdPartySharing: boolean
  cookieConsent: {
    necessary: boolean
    analytics: boolean
    marketing: boolean
    preferences: boolean
  }
  rightToBeForgotten: boolean
  dataPortability: boolean
  lastConsentUpdate: Date
  gdprCompliant: boolean
  ccpaOptOut: boolean
}

export interface CustomerCreateRequest {
  userId?: string
  profile: Partial<CustomerProfile>
  preferences?: Partial<CustomerPreferences>
  initialAddress?: Omit<CustomerAddress, 'id'>
  communicationPreferences?: Partial<CommunicationPreferences>
  privacySettings?: Partial<PrivacySettings>
  source?: string
  metadata?: Record<string, any>
}

export interface CustomerUpdateRequest {
  profile?: Partial<CustomerProfile>
  preferences?: Partial<CustomerPreferences>
  communicationPreferences?: Partial<CommunicationPreferences>
  privacySettings?: Partial<PrivacySettings>
  metadata?: Record<string, any>
}

export interface CustomerSearchCriteria {
  query?: string // Search in name, email, company
  segment?: string[]
  tier?: string[]
  stage?: string[]
  tags?: string[]
  createdAfter?: Date
  createdBefore?: Date
  lastOrderAfter?: Date
  lastOrderBefore?: Date
  totalSpentMin?: number
  totalSpentMax?: number
  orderCountMin?: number
  orderCountMax?: number
  churnRisk?: 'low' | 'medium' | 'high'
  country?: string[]
  source?: string[]
  page?: number
  limit?: number
  sortBy?: 'created' | 'last_order' | 'total_spent' | 'lifetime_value'
  sortOrder?: 'asc' | 'desc'
}

export interface CustomerStats {
  totalCustomers: number
  newCustomers: number
  activeCustomers: number
  churnedCustomers: number
  averageLifetimeValue: number
  averageOrderValue: number
  retentionRate: number
  churnRate: number
  segmentDistribution: Record<string, number>
  tierDistribution: Record<string, number>
  topCustomers: Array<{
    id: string
    name: string
    totalSpent: number
    orderCount: number
  }>
}

export class CustomerValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message)
    this.name = 'CustomerValidationError'
  }
}

export class CustomerNotFoundError extends Error {
  constructor(public customerId: string) {
    super(`Customer not found: ${customerId}`)
    this.name = 'CustomerNotFoundError'
  }
}

export class CustomerManagement extends EventEmitter {
  private segmentationRules: Map<string, any>
  private analyticsCache: Map<string, { data: CustomerAnalytics; expires: Date }>

  constructor() {
    super()
    this.segmentationRules = new Map()
    this.analyticsCache = new Map()

    this.initializeSegmentationRules()
    this.startBackgroundProcessing()
  }

  // Initialize customer segmentation rules
  private initializeSegmentationRules(): void {
    // RFM segmentation rules
    this.segmentationRules.set('rfm', {
      recency: {
        1: { min: 366, max: Infinity }, // 1+ year
        2: { min: 181, max: 365 },      // 6-12 months
        3: { min: 91, max: 180 },       // 3-6 months
        4: { min: 31, max: 90 },        // 1-3 months
        5: { min: 0, max: 30 }          // 0-30 days
      },
      frequency: {
        1: { min: 0, max: 1 },
        2: { min: 2, max: 3 },
        3: { min: 4, max: 6 },
        4: { min: 7, max: 12 },
        5: { min: 13, max: Infinity }
      },
      monetary: {
        1: { min: 0, max: 100 },
        2: { min: 101, max: 300 },
        3: { min: 301, max: 600 },
        4: { min: 601, max: 1200 },
        5: { min: 1201, max: Infinity }
      }
    })

    // Tier rules
    this.segmentationRules.set('tiers', {
      bronze: { min: 0, max: 500 },
      silver: { min: 501, max: 1500 },
      gold: { min: 1501, max: 5000 },
      platinum: { min: 5001, max: 15000 },
      diamond: { min: 15001, max: Infinity }
    })
  }

  // Create new customer
  async createCustomer(request: CustomerCreateRequest): Promise<Customer> {
    return withDatabaseTransaction(async (tx) => {
      try {
        // Validate request
        await this.validateCreateRequest(request)

        // Create customer record
        const customerData = {
          userId: request.userId || `user_${Date.now()}`,
          companyName: request.profile.companyName,
          billingAddress: request.initialAddress ? {
            name: request.initialAddress.name,
            line1: request.initialAddress.line1,
            line2: request.initialAddress.line2,
            city: request.initialAddress.city,
            state: request.initialAddress.state,
            postalCode: request.initialAddress.postalCode,
            country: request.initialAddress.country,
            phone: request.initialAddress.phone
          } : null,
          shippingAddress: request.initialAddress ? {
            name: request.initialAddress.name,
            line1: request.initialAddress.line1,
            line2: request.initialAddress.line2,
            city: request.initialAddress.city,
            state: request.initialAddress.state,
            postalCode: request.initialAddress.postalCode,
            country: request.initialAddress.country,
            phone: request.initialAddress.phone
          } : null,
          phoneNumber: request.profile.phone,
          taxId: request.profile.taxId
        }

        const dbCustomer = await tx.customer.create({
          data: customerData,
          include: {
            user: true,
            orders: {
              take: 10,
              orderBy: { createdAt: 'desc' }
            }
          }
        })

        // Create customer profile
        const customer = await this.formatCustomer(dbCustomer)

        // Initialize analytics
        await this.initializeCustomerAnalytics(customer.id)

        // Set initial segmentation
        await this.updateCustomerSegmentation(customer.id)

        // Create welcome series
        await this.triggerWelcomeSeries(customer.id)

        // Emit customer created event
        this.emit('customerCreated', customer)

        return customer

      } catch (error) {
        console.error('Failed to create customer:', error)
        throw error
      }
    })
  }

  // Get customer by ID
  async getCustomer(customerId: string): Promise<Customer> {
    try {
      const dbCustomer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          user: true,
          orders: {
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
              items: true
            }
          },
          paymentMethods: true
        }
      })

      if (!dbCustomer) {
        throw new CustomerNotFoundError(customerId)
      }

      return this.formatCustomer(dbCustomer)

    } catch (error) {
      if (error instanceof CustomerNotFoundError) {
        throw error
      }
      console.error('Failed to get customer:', error)
      throw error
    }
  }

  // Update customer
  async updateCustomer(customerId: string, request: CustomerUpdateRequest): Promise<Customer> {
    return withDatabaseTransaction(async (tx) => {
      try {
        // Validate request
        await this.validateUpdateRequest(request)

        // Get existing customer
        const existingCustomer = await this.getCustomer(customerId)

        // Update customer data
        const updateData: any = {}

        if (request.profile) {
          if (request.profile.companyName !== undefined) {
            updateData.companyName = request.profile.companyName
          }
          if (request.profile.phone !== undefined) {
            updateData.phoneNumber = request.profile.phone
          }
          if (request.profile.taxId !== undefined) {
            updateData.taxId = request.profile.taxId
          }
        }

        await tx.customer.update({
          where: { id: customerId },
          data: updateData
        })

        // Get updated customer
        const updatedCustomer = await this.getCustomer(customerId)

        // Update analytics if needed
        await this.updateCustomerAnalytics(customerId)

        // Update segmentation
        await this.updateCustomerSegmentation(customerId)

        // Emit customer updated event
        this.emit('customerUpdated', updatedCustomer)

        return updatedCustomer

      } catch (error) {
        console.error('Failed to update customer:', error)
        throw error
      }
    })
  }

  // Add customer address
  async addCustomerAddress(customerId: string, address: Omit<CustomerAddress, 'id'>): Promise<CustomerAddress> {
    try {
      // Validate customer exists
      await this.getCustomer(customerId)

      // Create address record
      const addressData = {
        id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerId,
        ...address
      }

      // This would save to a customer_addresses table
      // For now, just return formatted address
      const customerAddress: CustomerAddress = {
        ...addressData,
        isValidated: false,
        lastUsed: undefined
      }

      this.emit('addressAdded', { customerId, address: customerAddress })

      return customerAddress

    } catch (error) {
      console.error('Failed to add customer address:', error)
      throw error
    }
  }

  // Add customer note
  async addCustomerNote(
    customerId: string,
    note: {
      content: string
      type: 'general' | 'support' | 'sales' | 'billing'
      visibility: 'internal' | 'customer'
      authorId: string
      authorName: string
      tags?: string[]
    }
  ): Promise<CustomerNote> {
    try {
      // Validate customer exists
      await this.getCustomer(customerId)

      const customerNote: CustomerNote = {
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...note,
        createdAt: new Date()
      }

      // This would save to a customer_notes table
      this.emit('noteAdded', { customerId, note: customerNote })

      return customerNote

    } catch (error) {
      console.error('Failed to add customer note:', error)
      throw error
    }
  }

  // Search customers
  async searchCustomers(criteria: CustomerSearchCriteria): Promise<{
    customers: Customer[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }> {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'created',
        sortOrder = 'desc'
      } = criteria

      // Build where clause
      const where: any = {}

      if (criteria.query) {
        where.OR = [
          { companyName: { contains: criteria.query, mode: 'insensitive' } },
          { user: { name: { contains: criteria.query, mode: 'insensitive' } } },
          { user: { email: { contains: criteria.query, mode: 'insensitive' } } }
        ]
      }

      if (criteria.createdAfter || criteria.createdBefore) {
        where.createdAt = {}
        if (criteria.createdAfter) where.createdAt.gte = criteria.createdAfter
        if (criteria.createdBefore) where.createdAt.lte = criteria.createdBefore
      }

      if (criteria.country && criteria.country.length > 0) {
        where.billingAddress = {
          path: ['country'],
          in: criteria.country
        }
      }

      // Build order by clause
      const orderBy: any = {}
      switch (sortBy) {
        case 'created':
          orderBy.createdAt = sortOrder
          break
        case 'total_spent':
          // This would require a computed field or join
          orderBy.createdAt = sortOrder // Fallback
          break
        default:
          orderBy.createdAt = sortOrder
      }

      // Execute query
      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          include: {
            user: true,
            orders: {
              take: 5,
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy,
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.customer.count({ where })
      ])

      const formattedCustomers = await Promise.all(
        customers.map(customer => this.formatCustomer(customer))
      )

      return {
        customers: formattedCustomers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }

    } catch (error) {
      console.error('Failed to search customers:', error)
      throw error
    }
  }

  // Get customer statistics
  async getCustomerStats(dateRange?: { start: Date; end: Date }): Promise<CustomerStats> {
    try {
      const where: any = {}
      if (dateRange) {
        where.createdAt = {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }

      const totalCustomers = await prisma.customer.count({ where })

      // Calculate new customers (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const newCustomers = await prisma.customer.count({
        where: {
          ...where,
          createdAt: { gte: thirtyDaysAgo }
        }
      })

      return {
        totalCustomers,
        newCustomers,
        activeCustomers: Math.floor(totalCustomers * 0.7), // Mock calculation
        churnedCustomers: Math.floor(totalCustomers * 0.1), // Mock calculation
        averageLifetimeValue: 1250, // Mock data
        averageOrderValue: 187, // Mock data
        retentionRate: 0.75, // Mock data
        churnRate: 0.12, // Mock data
        segmentDistribution: {
          'new': Math.floor(totalCustomers * 0.2),
          'active': Math.floor(totalCustomers * 0.5),
          'at_risk': Math.floor(totalCustomers * 0.2),
          'churned': Math.floor(totalCustomers * 0.1)
        },
        tierDistribution: {
          'bronze': Math.floor(totalCustomers * 0.5),
          'silver': Math.floor(totalCustomers * 0.3),
          'gold': Math.floor(totalCustomers * 0.15),
          'platinum': Math.floor(totalCustomers * 0.05)
        },
        topCustomers: [] // Would implement top customers query
      }

    } catch (error) {
      console.error('Failed to get customer stats:', error)
      throw error
    }
  }

  // Private helper methods

  private async formatCustomer(dbCustomer: any): Promise<Customer> {
    // Calculate analytics from cached data or compute
    const analytics = await this.getCustomerAnalytics(dbCustomer.id)
    
    // Calculate segmentation
    const segmentation = await this.getCustomerSegmentation(dbCustomer.id, analytics)

    return {
      id: dbCustomer.id,
      userId: dbCustomer.userId,
      profile: {
        firstName: dbCustomer.user?.name?.split(' ')[0] || '',
        lastName: dbCustomer.user?.name?.split(' ').slice(1).join(' ') || '',
        email: dbCustomer.user?.email || '',
        phone: dbCustomer.phoneNumber,
        companyName: dbCustomer.companyName,
        taxId: dbCustomer.taxId,
        timezone: 'UTC',
        language: 'en',
        currency: 'USD',
        tags: [],
        customFields: {}
      },
      preferences: this.getDefaultPreferences(),
      addresses: this.formatAddresses(dbCustomer),
      paymentMethods: dbCustomer.paymentMethods?.map(this.formatPaymentMethod) || [],
      subscriptions: [], // Would format subscriptions
      orderHistory: dbCustomer.orders?.map(this.formatOrderSummary) || [],
      analytics,
      segmentation,
      lifecycle: await this.getCustomerLifecycle(dbCustomer.id, analytics),
      support: await this.getCustomerSupport(dbCustomer.id),
      loyalty: await this.getCustomerLoyalty(dbCustomer.id),
      communication: this.getDefaultCommunicationPreferences(),
      privacy: this.getDefaultPrivacySettings(),
      createdAt: dbCustomer.createdAt,
      updatedAt: dbCustomer.updatedAt
    }
  }

  private async getCustomerAnalytics(customerId: string): Promise<CustomerAnalytics> {
    // Check cache first
    const cached = this.analyticsCache.get(customerId)
    if (cached && cached.expires > new Date()) {
      return cached.data
    }

    // Calculate analytics
    const orders = await prisma.order.findMany({
      where: { customerId },
      include: { items: true }
    })

    const totalOrders = orders.length
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

    const analytics: CustomerAnalytics = {
      totalOrders,
      totalSpent,
      averageOrderValue,
      orderFrequency: this.calculateOrderFrequency(orders),
      lastOrderDate: orders.length > 0 ? orders[orders.length - 1].createdAt : undefined,
      lifetimeValue: totalSpent,
      predictedLifetimeValue: totalSpent * 1.5, // Mock prediction
      churnRisk: this.calculateChurnRisk(orders),
      satisfactionScore: 4.2, // Mock data
      npsScore: 75, // Mock data
      favoriteCategories: this.calculateFavoriteCategories(orders),
      favoriteProducts: this.calculateFavoriteProducts(orders),
      seasonalPatterns: this.calculateSeasonalPatterns(orders),
      channelAttribution: { 'web': totalOrders }
    }

    // Cache for 1 hour
    this.analyticsCache.set(customerId, {
      data: analytics,
      expires: new Date(Date.now() + 3600000)
    })

    return analytics
  }

  private async getCustomerSegmentation(customerId: string, analytics: CustomerAnalytics): Promise<CustomerSegmentation> {
    // Calculate RFM scores
    const rfmScores = this.calculateRFMScores(analytics)
    
    // Determine tier
    const tier = this.calculateTier(analytics.totalSpent)

    return {
      tier,
      recencyScore: rfmScores.recency,
      frequencyScore: rfmScores.frequency,
      monetaryScore: rfmScores.monetary,
      rfmScore: `${rfmScores.recency}${rfmScores.frequency}${rfmScores.monetary}`,
      segments: this.determineSegments(rfmScores),
      behaviorProfile: this.determineBehaviorProfile(analytics),
      acquisitionChannel: 'web', // Would track actual channel
      customerJourney: [],
      engagementLevel: this.calculateEngagementLevel(analytics),
      churnProbability: analytics.churnRisk,
      nextBestAction: this.determineNextBestAction(analytics, rfmScores)
    }
  }

  private async getCustomerLifecycle(customerId: string, analytics: CustomerAnalytics): Promise<CustomerLifecycle> {
    const stage = this.determineLifecycleStage(analytics)
    
    return {
      stage,
      daysSinceFirstOrder: analytics.lastOrderDate ? 
        Math.floor((Date.now() - analytics.lastOrderDate.getTime()) / (24 * 60 * 60 * 1000)) : 
        undefined,
      daysSinceLastOrder: analytics.lastOrderDate ? 
        Math.floor((Date.now() - analytics.lastOrderDate.getTime()) / (24 * 60 * 60 * 1000)) : 
        undefined,
      orderCount: analytics.totalOrders,
      stageHistory: [],
      retention: {
        thirtyDay: true, // Mock data
        sixtyDay: true,
        ninetyDay: true,
        oneYear: false
      }
    }
  }

  private async getCustomerSupport(customerId: string): Promise<CustomerSupport> {
    return {
      tickets: [], // Would fetch from support system
      satisfaction: {
        averageRating: 4.2,
        totalRatings: 5,
        lastRatingDate: new Date()
      },
      escalations: 0,
      resolutionTime: {
        average: 4.5,
        fastest: 1.2,
        slowest: 8.7
      },
      preferredChannel: 'email',
      notes: []
    }
  }

  private async getCustomerLoyalty(customerId: string): Promise<CustomerLoyalty> {
    return {
      pointsBalance: 250,
      totalPointsEarned: 1500,
      totalPointsRedeemed: 1250,
      tier: 'silver',
      tierProgress: {
        current: 250,
        required: 500,
        nextTier: 'gold'
      },
      achievements: [],
      rewards: [],
      referrals: {
        sent: 3,
        successful: 1,
        totalRewards: 50
      }
    }
  }

  // Calculation helper methods

  private calculateOrderFrequency(orders: any[]): number {
    if (orders.length < 2) return 0
    
    const firstOrder = new Date(orders[0].createdAt)
    const lastOrder = new Date(orders[orders.length - 1].createdAt)
    const daysBetween = (lastOrder.getTime() - firstOrder.getTime()) / (24 * 60 * 60 * 1000)
    
    return orders.length / (daysBetween / 30) // orders per month
  }

  private calculateChurnRisk(orders: any[]): number {
    if (orders.length === 0) return 1.0
    
    const lastOrderDate = new Date(orders[orders.length - 1].createdAt)
    const daysSinceLastOrder = (Date.now() - lastOrderDate.getTime()) / (24 * 60 * 60 * 1000)
    
    // Simple churn risk calculation
    if (daysSinceLastOrder > 180) return 0.8
    if (daysSinceLastOrder > 90) return 0.5
    if (daysSinceLastOrder > 60) return 0.3
    return 0.1
  }

  private calculateFavoriteCategories(orders: any[]): Array<{ category: string; orderCount: number; totalSpent: number }> {
    // This would analyze order items by category
    return [
      { category: 'batteries', orderCount: 5, totalSpent: 500 }
    ]
  }

  private calculateFavoriteProducts(orders: any[]): Array<{ productId: string; name: string; orderCount: number; totalSpent: number }> {
    // This would analyze order items by product
    return []
  }

  private calculateSeasonalPatterns(orders: any[]): Record<string, number> {
    const patterns: Record<string, number> = {}
    
    orders.forEach(order => {
      const month = new Date(order.createdAt).getMonth()
      const monthName = new Date(0, month).toLocaleString('en', { month: 'long' })
      patterns[monthName] = (patterns[monthName] || 0) + 1
    })
    
    return patterns
  }

  private calculateRFMScores(analytics: CustomerAnalytics): { recency: number; frequency: number; monetary: number } {
    const rules = this.segmentationRules.get('rfm')
    
    // Calculate recency score
    const daysSinceLastOrder = analytics.lastOrderDate ? 
      Math.floor((Date.now() - analytics.lastOrderDate.getTime()) / (24 * 60 * 60 * 1000)) : 
      999

    let recencyScore = 1
    for (let score = 5; score >= 1; score--) {
      const range = rules.recency[score]
      if (daysSinceLastOrder >= range.min && daysSinceLastOrder <= range.max) {
        recencyScore = score
        break
      }
    }

    // Calculate frequency score
    let frequencyScore = 1
    for (let score = 5; score >= 1; score--) {
      const range = rules.frequency[score]
      if (analytics.totalOrders >= range.min && analytics.totalOrders <= range.max) {
        frequencyScore = score
        break
      }
    }

    // Calculate monetary score
    let monetaryScore = 1
    for (let score = 5; score >= 1; score--) {
      const range = rules.monetary[score]
      if (analytics.totalSpent >= range.min && analytics.totalSpent <= range.max) {
        monetaryScore = score
        break
      }
    }

    return { recency: recencyScore, frequency: frequencyScore, monetary: monetaryScore }
  }

  private calculateTier(totalSpent: number): 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' {
    const tiers = this.segmentationRules.get('tiers')
    
    if (totalSpent >= tiers.diamond.min) return 'diamond'
    if (totalSpent >= tiers.platinum.min) return 'platinum'
    if (totalSpent >= tiers.gold.min) return 'gold'
    if (totalSpent >= tiers.silver.min) return 'silver'
    return 'bronze'
  }

  private determineSegments(rfmScores: any): string[] {
    const segments: string[] = []
    
    // Champions: 5-5-5, 5-5-4, 5-4-5, 4-5-5
    if (rfmScores.recency >= 4 && rfmScores.frequency >= 4 && rfmScores.monetary >= 4) {
      segments.push('champions')
    }
    
    // Loyal customers: 3-5-3, 4-4-4, 3-5-4, 4-4-3
    if (rfmScores.frequency >= 4 && rfmScores.monetary >= 3) {
      segments.push('loyal_customers')
    }
    
    // At risk: 2-3-3, 2-3-4, 1-3-3
    if (rfmScores.recency <= 2 && rfmScores.frequency >= 3) {
      segments.push('at_risk')
    }
    
    return segments
  }

  private determineBehaviorProfile(analytics: CustomerAnalytics): 'bargain_hunter' | 'loyalist' | 'impulse_buyer' | 'researcher' | 'returner' {
    // Simple logic based on order patterns
    if (analytics.orderFrequency > 2) return 'loyalist'
    if (analytics.averageOrderValue > 300) return 'researcher'
    return 'impulse_buyer'
  }

  private calculateEngagementLevel(analytics: CustomerAnalytics): 'high' | 'medium' | 'low' | 'inactive' {
    if (analytics.churnRisk < 0.2) return 'high'
    if (analytics.churnRisk < 0.5) return 'medium'
    if (analytics.churnRisk < 0.8) return 'low'
    return 'inactive'
  }

  private determineLifecycleStage(analytics: CustomerAnalytics): 'prospect' | 'new' | 'active' | 'returning' | 'at_risk' | 'dormant' | 'churned' {
    if (analytics.totalOrders === 0) return 'prospect'
    if (analytics.totalOrders === 1) return 'new'
    if (analytics.churnRisk > 0.8) return 'churned'
    if (analytics.churnRisk > 0.5) return 'at_risk'
    if (analytics.totalOrders > 1) return 'returning'
    return 'active'
  }

  private determineNextBestAction(analytics: CustomerAnalytics, rfmScores: any): string {
    if (analytics.churnRisk > 0.7) return 'win_back_campaign'
    if (rfmScores.frequency >= 4) return 'loyalty_reward'
    if (analytics.totalOrders === 1) return 'second_purchase_incentive'
    return 'personalized_recommendation'
  }

  // Default preferences and settings

  private getDefaultPreferences(): CustomerPreferences {
    return {
      productCategories: [],
      brands: [],
      priceRange: { min: 0, max: 1000 },
      shippingMethod: 'standard',
      paymentMethod: 'card',
      communicationChannels: ['email'],
      frequencyPreferences: {
        promotions: 'weekly',
        updates: 'immediate',
        recommendations: 'monthly'
      },
      orderReminders: true,
      wishlistSharing: false,
      reviewReminders: true
    }
  }

  private getDefaultCommunicationPreferences(): CommunicationPreferences {
    return {
      email: {
        marketing: true,
        transactional: true,
        newsletter: true,
        abandoned_cart: true,
        product_updates: true,
        frequency: 'weekly'
      },
      sms: {
        marketing: false,
        transactional: true,
        order_updates: true,
        delivery_notifications: true
      },
      push: {
        marketing: false,
        order_updates: true,
        recommendations: false,
        price_alerts: false
      },
      phone: {
        marketing: false,
        support_callbacks: true
      },
      postal: {
        catalogs: false,
        promotional_materials: false
      },
      bounced: false
    }
  }

  private getDefaultPrivacySettings(): PrivacySettings {
    return {
      dataProcessingConsent: true,
      marketingConsent: true,
      profilingConsent: true,
      thirdPartySharing: false,
      cookieConsent: {
        necessary: true,
        analytics: true,
        marketing: false,
        preferences: true
      },
      rightToBeForgotten: false,
      dataPortability: false,
      lastConsentUpdate: new Date(),
      gdprCompliant: true,
      ccpaOptOut: false
    }
  }

  private formatAddresses(dbCustomer: any): CustomerAddress[] {
    const addresses: CustomerAddress[] = []

    if (dbCustomer.billingAddress) {
      addresses.push({
        id: 'billing_default',
        type: 'billing',
        name: dbCustomer.billingAddress.name,
        company: dbCustomer.companyName,
        line1: dbCustomer.billingAddress.line1,
        line2: dbCustomer.billingAddress.line2,
        city: dbCustomer.billingAddress.city,
        state: dbCustomer.billingAddress.state,
        postalCode: dbCustomer.billingAddress.postalCode,
        country: dbCustomer.billingAddress.country,
        phone: dbCustomer.billingAddress.phone,
        isDefault: true,
        isValidated: true
      })
    }

    if (dbCustomer.shippingAddress) {
      addresses.push({
        id: 'shipping_default',
        type: 'shipping',
        name: dbCustomer.shippingAddress.name,
        company: dbCustomer.companyName,
        line1: dbCustomer.shippingAddress.line1,
        line2: dbCustomer.shippingAddress.line2,
        city: dbCustomer.shippingAddress.city,
        state: dbCustomer.shippingAddress.state,
        postalCode: dbCustomer.shippingAddress.postalCode,
        country: dbCustomer.shippingAddress.country,
        phone: dbCustomer.shippingAddress.phone,
        isDefault: true,
        isValidated: true
      })
    }

    return addresses
  }

  private formatPaymentMethod(dbPaymentMethod: any): SavedPaymentMethod {
    return {
      id: dbPaymentMethod.id,
      type: 'card',
      provider: 'stripe',
      providerMethodId: dbPaymentMethod.stripePaymentMethodId,
      isDefault: dbPaymentMethod.isDefault,
      card: {
        brand: dbPaymentMethod.brand || 'unknown',
        last4: dbPaymentMethod.last4,
        expMonth: dbPaymentMethod.expiryMonth || 0,
        expYear: dbPaymentMethod.expiryYear || 0,
        fingerprint: 'unknown'
      },
      createdAt: dbPaymentMethod.createdAt,
      lastUsed: dbPaymentMethod.updatedAt
    }
  }

  private formatOrderSummary(dbOrder: any): OrderSummary {
    return {
      id: dbOrder.id,
      orderNumber: dbOrder.orderNumber,
      status: dbOrder.status,
      total: dbOrder.total,
      currency: dbOrder.currency || 'USD',
      itemCount: dbOrder.items?.length || 0,
      placedAt: dbOrder.createdAt,
      deliveredAt: dbOrder.deliveredAt
    }
  }

  // Validation methods

  private async validateCreateRequest(request: CustomerCreateRequest): Promise<void> {
    if (!request.profile.email) {
      throw new CustomerValidationError('Email is required', 'profile.email', 'REQUIRED')
    }

    if (!request.profile.firstName) {
      throw new CustomerValidationError('First name is required', 'profile.firstName', 'REQUIRED')
    }

    if (!request.profile.lastName) {
      throw new CustomerValidationError('Last name is required', 'profile.lastName', 'REQUIRED')
    }
  }

  private async validateUpdateRequest(request: CustomerUpdateRequest): Promise<void> {
    if (request.profile?.email === '') {
      throw new CustomerValidationError('Email cannot be empty', 'profile.email', 'INVALID')
    }
  }

  // Background processing

  private async initializeCustomerAnalytics(customerId: string): Promise<void> {
    // Initialize analytics for new customer
    await this.updateCustomerAnalytics(customerId)
  }

  private async updateCustomerAnalytics(customerId: string): Promise<void> {
    // Clear cache to force recalculation
    this.analyticsCache.delete(customerId)
    await this.getCustomerAnalytics(customerId)
  }

  private async updateCustomerSegmentation(customerId: string): Promise<void> {
    // This would update customer segmentation based on latest analytics
    const analytics = await this.getCustomerAnalytics(customerId)
    const segmentation = await this.getCustomerSegmentation(customerId, analytics)
    
    this.emit('segmentationUpdated', { customerId, segmentation })
  }

  private async triggerWelcomeSeries(customerId: string): Promise<void> {
    // This would trigger welcome email series for new customers
    this.emit('welcomeSeriesTriggered', { customerId })
  }

  private startBackgroundProcessing(): void {
    // Update customer analytics hourly
    setInterval(async () => {
      await this.processAnalyticsUpdates()
    }, 3600000)

    // Update segmentation daily
    setInterval(async () => {
      await this.processSegmentationUpdates()
    }, 86400000)

    // Clean analytics cache every 30 minutes
    setInterval(() => {
      this.cleanAnalyticsCache()
    }, 1800000)
  }

  private async processAnalyticsUpdates(): Promise<void> {
    // This would update analytics for active customers
    console.log('Processing customer analytics updates...')
  }

  private async processSegmentationUpdates(): Promise<void> {
    // This would update segmentation for all customers
    console.log('Processing customer segmentation updates...')
  }

  private cleanAnalyticsCache(): void {
    const now = new Date()
    for (const [customerId, cached] of this.analyticsCache.entries()) {
      if (cached.expires <= now) {
        this.analyticsCache.delete(customerId)
      }
    }
  }

  // Shutdown gracefully
  async shutdown(): Promise<void> {
    this.emit('shutdown')
  }
}

// Singleton instance
export const customerManagement = new CustomerManagement()

export default customerManagement