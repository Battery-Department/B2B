import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SeedData {
  users: any[]
  products: any[]
  customers: any[]
  orders: any[]
  userBehavior: any[]
  productMetrics: any[]
  quizSessions: any[]
}

export class DatabaseSeeder {
  async seedDatabase(): Promise<void> {
    console.log('🌱 Starting database seeding...')

    try {
      // Clear existing data
      await this.clearData()

      // Seed in order of dependencies
      await this.seedUsers()
      await this.seedProducts()
      await this.seedCustomers()
      await this.seedProductMetrics()
      await this.seedUserBehavior()
      await this.seedOrders()
      await this.seedQuizData()
      await this.seedAnalyticsData()

      console.log('✅ Database seeding completed successfully!')
    } catch (error) {
      console.error('❌ Database seeding failed:', error)
      throw error
    }
  }

  private async clearData(): Promise<void> {
    console.log('🧹 Clearing existing data...')

    // Clear in reverse dependency order
    await prisma.userBehavior.deleteMany()
    await prisma.productMetrics.deleteMany()
    await prisma.userPurchaseHistory.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.product.deleteMany()
    await prisma.user.deleteMany()
    await prisma.quizResponse.deleteMany()
    await prisma.quizSession.deleteMany()
  }

  private async seedUsers(): Promise<void> {
    console.log('👥 Seeding users...')

    const users = [
      {
        id: 'user-1',
        email: 'john.contractor@example.com',
        name: 'John Smith',
        role: 'customer'
      },
      {
        id: 'user-2',
        email: 'sarah.diy@example.com',
        name: 'Sarah Johnson',
        role: 'customer'
      },
      {
        id: 'user-3',
        email: 'mike.pro@example.com',
        name: 'Mike Professional',
        role: 'customer'
      },
      {
        id: 'user-4',
        email: 'lisa.builder@example.com',
        name: 'Lisa Builder',
        role: 'customer'
      },
      {
        id: 'user-5',
        email: 'david.tech@example.com',
        name: 'David Tech',
        role: 'customer'
      }
    ]

    for (const user of users) {
      await prisma.user.create({ data: user })
    }

    console.log(`✅ Created ${users.length} users`)
  }

  private async seedProducts(): Promise<void> {
    console.log('🔋 Seeding products...')

    const products = [
      {
        id: 'flexvolt-6ah',
        sku: 'FV-6AH-001',
        name: 'FlexVolt 20V/60V MAX 6.0Ah Battery',
        description: 'Professional-grade FlexVolt battery with extended runtime and fast charging capability.',
        category: 'battery',
        basePrice: 149.00,
        currency: 'USD',
        specifications: {
          voltage: '20V/60V',
          capacity: '6.0Ah',
          weight: '1.4 lbs',
          chargingTime: '60 minutes',
          chemistry: 'Li-Ion',
          compatibility: ['DCD771', 'DCS391', 'DCV100']
        },
        images: [
          '/images/products/flexvolt-6ah-main.jpg',
          '/images/products/flexvolt-6ah-side.jpg'
        ],
        isActive: true
      },
      {
        id: 'flexvolt-9ah',
        sku: 'FV-9AH-001',
        name: 'FlexVolt 20V/60V MAX 9.0Ah Battery',
        description: 'Maximum runtime FlexVolt battery for demanding professional applications.',
        category: 'battery',
        basePrice: 239.00,
        currency: 'USD',
        specifications: {
          voltage: '20V/60V',
          capacity: '9.0Ah',
          weight: '2.0 lbs',
          chargingTime: '90 minutes',
          chemistry: 'Li-Ion',
          compatibility: ['DCD771', 'DCS391', 'DCV100', 'DCS575']
        },
        images: [
          '/images/products/flexvolt-9ah-main.jpg',
          '/images/products/flexvolt-9ah-side.jpg'
        ],
        isActive: true
      },
      {
        id: 'flexvolt-15ah',
        sku: 'FV-15AH-001',
        name: 'FlexVolt 20V/60V MAX 15.0Ah Battery',
        description: 'Ultimate runtime FlexVolt battery for the most demanding applications.',
        category: 'battery',
        basePrice: 359.00,
        currency: 'USD',
        specifications: {
          voltage: '20V/60V',
          capacity: '15.0Ah',
          weight: '3.1 lbs',
          chargingTime: '120 minutes',
          chemistry: 'Li-Ion',
          compatibility: ['DCV100', 'DCS575', 'DCS573', 'DCG414']
        },
        images: [
          '/images/products/flexvolt-15ah-main.jpg',
          '/images/products/flexvolt-15ah-side.jpg'
        ],
        isActive: true
      },
      {
        id: 'charger-fast',
        sku: 'CHG-FAST-001',
        name: 'FlexVolt Fast Charger',
        description: 'Rapid charging station for all FlexVolt batteries.',
        category: 'accessory',
        basePrice: 85.00,
        currency: 'USD',
        specifications: {
          chargingSpeed: 'Fast (60min for 6Ah)',
          compatibility: 'All FlexVolt batteries',
          inputVoltage: '120V AC',
          weight: '2.5 lbs'
        },
        images: [
          '/images/products/charger-fast-main.jpg'
        ],
        isActive: true
      },
      {
        id: 'battery-pack-combo',
        sku: 'FV-COMBO-001',
        name: 'FlexVolt Battery 3-Pack Combo',
        description: 'Professional starter pack with 6Ah, 9Ah, and fast charger.',
        category: 'bundle',
        basePrice: 388.00,
        currency: 'USD',
        specifications: {
          includes: ['6Ah Battery', '9Ah Battery', 'Fast Charger'],
          savings: '$15 vs individual purchase',
          warranty: '3 years'
        },
        images: [
          '/images/products/battery-pack-combo.jpg'
        ],
        isActive: true
      }
    ]

    for (const product of products) {
      await prisma.product.create({ data: product })
    }

    console.log(`✅ Created ${products.length} products`)
  }

  private async seedCustomers(): Promise<void> {
    console.log('🏢 Seeding customers...')

    const customers = [
      {
        id: 'customer-1',
        userId: 'user-1',
        companyName: 'Smith Construction LLC',
        billingAddress: {
          street: '123 Construction Ave',
          city: 'Denver',
          state: 'CO',
          zip: '80202',
          country: 'US'
        },
        phoneNumber: '555-0101'
      },
      {
        id: 'customer-2',
        userId: 'user-2',
        companyName: null,
        billingAddress: {
          street: '456 Residential St',
          city: 'Austin',
          state: 'TX',
          zip: '73301',
          country: 'US'
        },
        phoneNumber: '555-0102'
      },
      {
        id: 'customer-3',
        userId: 'user-3',
        companyName: 'Pro Tools & Equipment',
        billingAddress: {
          street: '789 Industrial Blvd',
          city: 'Chicago',
          state: 'IL',
          zip: '60601',
          country: 'US'
        },
        phoneNumber: '555-0103'
      },
      {
        id: 'customer-4',
        userId: 'user-4',
        companyName: 'Builder Corp',
        billingAddress: {
          street: '321 Builder Lane',
          city: 'Phoenix',
          state: 'AZ',
          zip: '85001',
          country: 'US'
        },
        phoneNumber: '555-0104'
      },
      {
        id: 'customer-5',
        userId: 'user-5',
        companyName: null,
        billingAddress: {
          street: '654 Tech Street',
          city: 'Seattle',
          state: 'WA',
          zip: '98101',
          country: 'US'
        },
        phoneNumber: '555-0105'
      }
    ]

    for (const customer of customers) {
      await prisma.customer.create({ data: customer })
    }

    console.log(`✅ Created ${customers.length} customers`)
  }

  private async seedProductMetrics(): Promise<void> {
    console.log('📊 Seeding product metrics...')

    const productMetrics = [
      {
        productId: 'flexvolt-6ah',
        views: 2847,
        clicks: 456,
        addToCarts: 89,
        purchases: 34,
        revenue: 3230.00
      },
      {
        productId: 'flexvolt-9ah',
        views: 1923,
        clicks: 312,
        addToCarts: 67,
        purchases: 28,
        revenue: 3500.00
      },
      {
        productId: 'flexvolt-15ah',
        views: 1156,
        clicks: 198,
        addToCarts: 45,
        purchases: 18,
        revenue: 4410.00
      },
      {
        productId: 'charger-fast',
        views: 1674,
        clicks: 234,
        addToCarts: 56,
        purchases: 23,
        revenue: 3427.00
      },
      {
        productId: 'battery-pack-combo',
        views: 892,
        clicks: 167,
        addToCarts: 34,
        purchases: 15,
        revenue: 4425.00
      }
    ]

    for (const metrics of productMetrics) {
      await prisma.productMetrics.create({ data: metrics })
    }

    console.log(`✅ Created ${productMetrics.length} product metric records`)
  }

  private async seedUserBehavior(): Promise<void> {
    console.log('🎯 Seeding user behavior data...')

    const behaviors = []
    const userIds = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5']
    const events = ['page_view', 'click', 'search', 'add_to_cart', 'purchase', 'quiz_response']
    const pages = ['/customer/products', '/customer/quiz', '/customer/cart', '/customer/checkout']

    // Generate realistic behavior data for last 30 days
    for (let day = 0; day < 30; day++) {
      const date = new Date()
      date.setDate(date.getDate() - day)

      for (const userId of userIds) {
        // Each user has 3-8 events per day on average
        const eventsPerDay = Math.floor(Math.random() * 6) + 3

        for (let i = 0; i < eventsPerDay; i++) {
          const timestamp = new Date(date)
          timestamp.setHours(Math.floor(Math.random() * 16) + 8) // 8 AM to 11 PM
          timestamp.setMinutes(Math.floor(Math.random() * 60))

          const event = events[Math.floor(Math.random() * events.length)]
          const page = pages[Math.floor(Math.random() * pages.length)]

          behaviors.push({
            userId,
            sessionId: `session-${userId}-${day}-${i}`,
            timestamp,
            event,
            data: {
              event_data: this.generateEventData(event),
              value: Math.random() * 100
            },
            context: {
              page,
              userAgent: 'Mozilla/5.0 (compatible)',
              device: Math.random() > 0.7 ? 'mobile' : 'desktop'
            }
          })
        }
      }
    }

    // Insert in batches to avoid memory issues
    const batchSize = 100
    for (let i = 0; i < behaviors.length; i += batchSize) {
      const batch = behaviors.slice(i, i + batchSize)
      await prisma.userBehavior.createMany({ data: batch })
    }

    console.log(`✅ Created ${behaviors.length} user behavior records`)
  }

  private async seedOrders(): Promise<void> {
    console.log('🛒 Seeding orders...')

    const orders = [
      {
        id: 'order-1',
        orderNumber: 'ORD-001',
        customerId: 'customer-1',
        status: 'delivered',
        subtotal: 537.00,
        tax: 42.96,
        shipping: 15.00,
        total: 594.96,
        currency: 'USD',
        paymentStatus: 'paid',
        paidAt: new Date('2024-11-15'),
        shippedAt: new Date('2024-11-16'),
        deliveredAt: new Date('2024-11-18')
      },
      {
        id: 'order-2',
        orderNumber: 'ORD-002',
        customerId: 'customer-2',
        status: 'shipped',
        subtotal: 149.00,
        tax: 11.92,
        shipping: 12.00,
        total: 172.92,
        currency: 'USD',
        paymentStatus: 'paid',
        paidAt: new Date('2024-11-20'),
        shippedAt: new Date('2024-11-21')
      },
      {
        id: 'order-3',
        orderNumber: 'ORD-003',
        customerId: 'customer-3',
        status: 'processing',
        subtotal: 590.00,
        tax: 47.20,
        shipping: 20.00,
        total: 657.20,
        currency: 'USD',
        paymentStatus: 'paid',
        paidAt: new Date('2024-11-22')
      }
    ]

    for (const order of orders) {
      await prisma.order.create({ data: order })
    }

    // Create order items
    const orderItems = [
      // Order 1 items
      {
        orderId: 'order-1',
        productId: 'flexvolt-6ah',
        quantity: 2,
        unitPrice: 149.00,
        totalPrice: 298.00
      },
      {
        orderId: 'order-1',
        productId: 'flexvolt-9ah',
        quantity: 1,
        unitPrice: 239.00,
        totalPrice: 239.00
      },
      {
        orderId: 'order-1',
        productId: 'charger-fast',
        quantity: 1,
        unitPrice: 85.00,
        totalPrice: 85.00
      },
      // Order 2 items
      {
        orderId: 'order-2',
        productId: 'flexvolt-6ah',
        quantity: 1,
        unitPrice: 149.00,
        totalPrice: 149.00
      },
      // Order 3 items
      {
        orderId: 'order-3',
        productId: 'battery-pack-combo',
        quantity: 2,
        unitPrice: 388.00,
        totalPrice: 776.00
      }
    ]

    for (const item of orderItems) {
      await prisma.orderItem.create({ data: item })
    }

    // Create purchase history records
    for (const item of orderItems) {
      const order = orders.find(o => o.id === item.orderId)
      if (order) {
        await prisma.userPurchaseHistory.create({
          data: {
            userId: order.customerId.replace('customer-', 'user-'),
            productId: item.productId,
            quantity: item.quantity,
            price: item.unitPrice,
            timestamp: order.paidAt || new Date()
          }
        })
      }
    }

    console.log(`✅ Created ${orders.length} orders with ${orderItems.length} items`)
  }

  private async seedQuizData(): Promise<void> {
    console.log('📝 Seeding quiz data...')

    const quizSessions = [
      {
        sessionId: 'quiz-session-1',
        quizId: 'battery-finder-v2',
        status: 'completed',
        userName: 'John Smith',
        email: 'john.contractor@example.com',
        userType: 'professional',
        selectedBrand: 'dewalt',
        userSegment: 'contractor',
        crewSize: 5,
        leadQualityScore: 0.85,
        completionRate: 1.0
      },
      {
        sessionId: 'quiz-session-2',
        quizId: 'battery-finder-v2',
        status: 'completed',
        userName: 'Sarah Johnson',
        email: 'sarah.diy@example.com',
        userType: 'personal',
        selectedBrand: 'dewalt',
        leadQualityScore: 0.62,
        completionRate: 1.0
      },
      {
        sessionId: 'quiz-session-3',
        quizId: 'battery-finder-v2',
        status: 'abandoned',
        userName: 'Mike Professional',
        userType: 'professional',
        selectedBrand: 'milwaukee',
        userSegment: 'electrician',
        completionRate: 0.6
      }
    ]

    for (const session of quizSessions) {
      await prisma.quizSession.create({ data: session })
    }

    // Create quiz responses
    const responses = [
      {
        sessionId: 'quiz-session-1',
        questionId: 'user-type',
        questionType: 'single-choice',
        responseValue: 'professional',
        responseTime: 3500
      },
      {
        sessionId: 'quiz-session-1',
        questionId: 'trade',
        questionType: 'single-choice',
        responseValue: 'contractor',
        responseTime: 2800
      },
      {
        sessionId: 'quiz-session-1',
        questionId: 'crew-size',
        questionType: 'single-choice',
        responseValue: '3-10',
        responseTime: 4200
      },
      {
        sessionId: 'quiz-session-2',
        questionId: 'user-type',
        questionType: 'single-choice',
        responseValue: 'personal',
        responseTime: 2100
      },
      {
        sessionId: 'quiz-session-2',
        questionId: 'usage',
        questionType: 'single-choice',
        responseValue: 'weekend-projects',
        responseTime: 3600
      }
    ]

    for (const response of responses) {
      await prisma.quizResponse.create({ data: response })
    }

    console.log(`✅ Created ${quizSessions.length} quiz sessions with ${responses.length} responses`)
  }

  private async seedAnalyticsData(): Promise<void> {
    console.log('📈 Seeding analytics data...')

    // Create user sessions
    const sessions = []
    const userIds = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5']

    for (let day = 0; day < 30; day++) {
      const date = new Date()
      date.setDate(date.getDate() - day)

      for (const userId of userIds) {
        const sessionStart = new Date(date)
        sessionStart.setHours(Math.floor(Math.random() * 16) + 8)
        
        const sessionEnd = new Date(sessionStart)
        sessionEnd.setMinutes(sessionStart.getMinutes() + Math.floor(Math.random() * 45) + 5)

        sessions.push({
          sessionId: `analytics-session-${userId}-${day}`,
          userId,
          startTime: sessionStart,
          lastActivity: sessionEnd,
          eventCount: Math.floor(Math.random() * 20) + 5,
          device: Math.random() > 0.7 ? 'mobile' : 'desktop'
        })
      }
    }

    for (const session of sessions) {
      await prisma.userSession.create({ data: session })
    }

    console.log(`✅ Created ${sessions.length} user sessions for analytics`)
  }

  private generateEventData(event: string): any {
    switch (event) {
      case 'page_view':
        return {
          page_title: 'Battery Products',
          time_on_page: Math.floor(Math.random() * 180) + 30
        }
      case 'click':
        return {
          element: 'product-card',
          position: Math.floor(Math.random() * 10) + 1
        }
      case 'search':
        return {
          query: ['dewalt battery', 'flexvolt', '20v battery'][Math.floor(Math.random() * 3)],
          results_count: Math.floor(Math.random() * 50) + 10
        }
      case 'add_to_cart':
        return {
          product_id: ['flexvolt-6ah', 'flexvolt-9ah', 'flexvolt-15ah'][Math.floor(Math.random() * 3)],
          quantity: Math.floor(Math.random() * 3) + 1
        }
      case 'purchase':
        return {
          order_value: Math.floor(Math.random() * 500) + 100,
          items_count: Math.floor(Math.random() * 5) + 1
        }
      case 'quiz_response':
        return {
          question_id: ['user-type', 'trade', 'usage'][Math.floor(Math.random() * 3)],
          response: 'professional'
        }
      default:
        return {}
    }
  }

  async seedProductInventory(): Promise<void> {
    console.log('📦 Seeding product inventory...')

    const inventory = [
      { productId: 'flexvolt-6ah', quantity: 150, reservedQuantity: 15 },
      { productId: 'flexvolt-9ah', quantity: 120, reservedQuantity: 8 },
      { productId: 'flexvolt-15ah', quantity: 75, reservedQuantity: 5 },
      { productId: 'charger-fast', quantity: 200, reservedQuantity: 12 },
      { productId: 'battery-pack-combo', quantity: 50, reservedQuantity: 3 }
    ]

    for (const item of inventory) {
      await prisma.productInventory.create({ data: item })
    }

    console.log(`✅ Created ${inventory.length} inventory records`)
  }
}

export const databaseSeeder = new DatabaseSeeder()