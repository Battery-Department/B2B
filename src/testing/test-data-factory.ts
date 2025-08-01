import { db } from '@/lib/db'
import { faker } from '@faker-js/faker'
import { hash } from 'bcryptjs'

export interface TestUser {
  id: string
  email: string
  name: string
  password: string
  role: 'customer' | 'admin'
  preferences?: Record<string, any>
}

export interface TestProduct {
  id: string
  name: string
  price: number
  msrp: number
  stock: number
  features: string[]
  description?: string
}

export interface TestOrder {
  id: string
  userId: string
  items: {
    productId: string
    quantity: number
    price: number
  }[]
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered'
}

export class TestDataFactory {
  private static instance: TestDataFactory
  private testDataPrefix = 'test_'
  
  static getInstance(): TestDataFactory {
    if (!TestDataFactory.instance) {
      TestDataFactory.instance = new TestDataFactory()
    }
    return TestDataFactory.instance
  }

  async seedTestData() {
    console.log('🌱 Seeding test data...')
    
    // Create consistent test data
    const users = await this.createTestUsers(100)
    const products = await this.createTestProducts(50)
    const orders = await this.createTestOrders(users, products, 500)
    
    // Create test scenarios
    await this.createEdgeCaseScenarios()
    await this.createPerformanceTestData()
    
    console.log('✅ Test data seeded successfully')
    
    return {
      users,
      products,
      orders,
      summary: {
        totalUsers: users.length,
        totalProducts: products.length,
        totalOrders: orders.length
      }
    }
  }

  async createTestUsers(count: number): Promise<TestUser[]> {
    const users: TestUser[] = []
    
    // Create specific test users
    const specificUsers = [
      {
        id: `${this.testDataPrefix}admin`,
        email: 'admin@test.com',
        name: 'Test Admin',
        password: await hash('admin123', 10),
        role: 'admin' as const
      },
      {
        id: `${this.testDataPrefix}customer`,
        email: 'customer@test.com',
        name: 'Test Customer',
        password: await hash('customer123', 10),
        role: 'customer' as const
      },
      {
        id: `${this.testDataPrefix}vip`,
        email: 'vip@test.com',
        name: 'VIP Customer',
        password: await hash('vip123', 10),
        role: 'customer' as const,
        preferences: { tier: 'vip', discount: 0.2 }
      }
    ]
    
    users.push(...specificUsers)
    
    // Create random test users
    for (let i = specificUsers.length; i < count; i++) {
      const user: TestUser = {
        id: `${this.testDataPrefix}user_${i}`,
        email: faker.internet.email(),
        name: faker.person.fullName(),
        password: await hash('password123', 10),
        role: 'customer',
        preferences: {
          toolType: faker.helpers.arrayElement(['light-duty', 'heavy-duty', 'mixed']),
          usageFrequency: faker.helpers.arrayElement(['daily', 'weekly', 'monthly']),
          preferredBrand: faker.helpers.arrayElement(['FlexVolt', 'Any', 'Premium'])
        }
      }
      users.push(user)
    }
    
    // Insert into database
    await db.user.createMany({
      data: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        password: u.password,
        role: u.role,
        preferences: u.preferences || {}
      })),
      skipDuplicates: true
    })
    
    return users
  }

  async createTestProducts(count: number): Promise<TestProduct[]> {
    const products: TestProduct[] = []
    
    // Core FlexVolt products
    const coreProducts = [
      {
        id: `${this.testDataPrefix}6Ah`,
        name: 'FlexVolt 6Ah Battery',
        price: 95,
        msrp: 169,
        stock: 1000,
        features: ['20V/60V MAX', 'Compact Design', 'LED Fuel Gauge'],
        description: 'Compact power solution for light to medium-duty tasks'
      },
      {
        id: `${this.testDataPrefix}9Ah`,
        name: 'FlexVolt 9Ah Battery',
        price: 125,
        msrp: 249,
        stock: 800,
        features: ['20V/60V MAX', 'Extended Runtime', 'Weather Resistant'],
        description: 'Balanced power and runtime for professional contractors'
      },
      {
        id: `${this.testDataPrefix}15Ah`,
        name: 'FlexVolt 15Ah Battery',
        price: 245,
        msrp: 399,
        stock: 500,
        features: ['20V/60V MAX', 'Maximum Runtime', 'Dual Fans', 'Heavy-Duty'],
        description: 'Maximum power and runtime for the most demanding applications'
      }
    ]
    
    products.push(...coreProducts)
    
    // Generate variations and accessories
    const variations = ['Standard', 'Pro', 'Max', 'Contractor Pack', 'Bundle']
    const accessories = ['Charger', 'Case', 'Adapter', 'Mount', 'Cable']
    
    for (let i = coreProducts.length; i < count; i++) {
      const isAccessory = i >= count * 0.7 // 30% accessories
      
      const product: TestProduct = isAccessory ? {
        id: `${this.testDataPrefix}accessory_${i}`,
        name: `FlexVolt ${faker.helpers.arrayElement(accessories)}`,
        price: faker.number.int({ min: 15, max: 99 }),
        msrp: faker.number.int({ min: 25, max: 149 }),
        stock: faker.number.int({ min: 100, max: 2000 }),
        features: [
          faker.helpers.arrayElement(['Universal Compatibility', 'Fast Charging', 'Durable Construction']),
          faker.helpers.arrayElement(['LED Indicators', 'Weather Resistant', 'Portable Design'])
        ]
      } : {
        id: `${this.testDataPrefix}battery_${i}`,
        name: `FlexVolt ${faker.number.int({ min: 3, max: 20 })}Ah ${faker.helpers.arrayElement(variations)}`,
        price: faker.number.int({ min: 75, max: 350 }),
        msrp: faker.number.int({ min: 125, max: 499 }),
        stock: faker.number.int({ min: 50, max: 1500 }),
        features: [
          '20V/60V MAX',
          faker.helpers.arrayElement(['LED Fuel Gauge', 'Digital Display', 'Status Indicators']),
          faker.helpers.arrayElement(['Weather Resistant', 'Impact Resistant', 'Shock Absorbing']),
          faker.helpers.arrayElement(['Fast Charge', 'Extended Runtime', 'High Output'])
        ]
      }
      
      products.push(product)
    }
    
    // Insert into database
    await db.product.createMany({
      data: products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        msrp: p.msrp,
        stock: p.stock,
        features: p.features,
        description: p.description || faker.commerce.productDescription()
      })),
      skipDuplicates: true
    })
    
    return products
  }

  async createTestOrders(
    users: TestUser[], 
    products: TestProduct[], 
    count: number
  ): Promise<TestOrder[]> {
    const orders: TestOrder[] = []
    
    for (let i = 0; i < count; i++) {
      const user = faker.helpers.arrayElement(users)
      const itemCount = faker.number.int({ min: 1, max: 5 })
      const items = []
      let total = 0
      
      for (let j = 0; j < itemCount; j++) {
        const product = faker.helpers.arrayElement(products)
        const quantity = faker.number.int({ min: 1, max: 10 })
        const price = product.price
        
        items.push({
          productId: product.id,
          quantity,
          price
        })
        
        total += price * quantity
      }
      
      // Apply volume discounts
      if (total >= 5000) total *= 0.8
      else if (total >= 2500) total *= 0.85
      else if (total >= 1000) total *= 0.9
      
      const order: TestOrder = {
        id: `${this.testDataPrefix}order_${i}`,
        userId: user.id,
        items,
        total,
        status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered'])
      }
      
      orders.push(order)
    }
    
    // Insert into database
    for (const order of orders) {
      await db.order.create({
        data: {
          id: order.id,
          userId: order.userId,
          total: order.total,
          status: order.status,
          items: {
            create: order.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        }
      })
    }
    
    return orders
  }

  async createEdgeCaseScenarios() {
    // Out of stock product
    await db.product.create({
      data: {
        id: `${this.testDataPrefix}out_of_stock`,
        name: 'FlexVolt Limited Edition',
        price: 299,
        msrp: 499,
        stock: 0,
        features: ['Limited Edition', 'Collector Item']
      }
    })
    
    // High-price product
    await db.product.create({
      data: {
        id: `${this.testDataPrefix}premium`,
        name: 'FlexVolt 30Ah Premium Pack',
        price: 999,
        msrp: 1499,
        stock: 10,
        features: ['30Ah Capacity', 'Premium Package', 'Professional Grade']
      }
    })
    
    // User with many orders
    const heavyUser = await db.user.create({
      data: {
        id: `${this.testDataPrefix}heavy_user`,
        email: 'heavy@test.com',
        name: 'Heavy User',
        password: await hash('heavy123', 10)
      }
    })
    
    // Create 100 orders for heavy user
    for (let i = 0; i < 100; i++) {
      await db.order.create({
        data: {
          userId: heavyUser.id,
          total: faker.number.float({ min: 50, max: 500 }),
          status: 'delivered',
          items: {
            create: [{
              productId: `${this.testDataPrefix}6Ah`,
              quantity: faker.number.int({ min: 1, max: 5 }),
              price: 95
            }]
          }
        }
      })
    }
    
    // User with abandoned cart
    await db.cart.create({
      data: {
        userId: `${this.testDataPrefix}customer`,
        items: {
          create: [
            {
              productId: `${this.testDataPrefix}9Ah`,
              quantity: 2
            },
            {
              productId: `${this.testDataPrefix}15Ah`,
              quantity: 1
            }
          ]
        }
      }
    })
  }

  async createPerformanceTestData() {
    // Create bulk products for performance testing
    const bulkProducts = []
    for (let i = 0; i < 1000; i++) {
      bulkProducts.push({
        id: `${this.testDataPrefix}perf_product_${i}`,
        name: `Performance Test Product ${i}`,
        price: faker.number.int({ min: 50, max: 300 }),
        msrp: faker.number.int({ min: 100, max: 500 }),
        stock: faker.number.int({ min: 0, max: 1000 }),
        features: ['Test Feature 1', 'Test Feature 2']
      })
    }
    
    await db.product.createMany({
      data: bulkProducts,
      skipDuplicates: true
    })
    
    // Create bulk users for load testing
    const bulkUsers = []
    for (let i = 0; i < 1000; i++) {
      bulkUsers.push({
        id: `${this.testDataPrefix}load_user_${i}`,
        email: `loadtest${i}@test.com`,
        name: `Load Test User ${i}`,
        password: await hash('loadtest123', 10)
      })
    }
    
    await db.user.createMany({
      data: bulkUsers,
      skipDuplicates: true
    })
  }

  async cleanupTestData() {
    console.log('🧹 Cleaning up test data...')
    
    // Delete in correct order to handle foreign key constraints
    await db.orderItem.deleteMany({
      where: { order: { id: { startsWith: this.testDataPrefix } } }
    })
    
    await db.order.deleteMany({
      where: { id: { startsWith: this.testDataPrefix } }
    })
    
    await db.cartItem.deleteMany({
      where: { cart: { userId: { startsWith: this.testDataPrefix } } }
    })
    
    await db.cart.deleteMany({
      where: { userId: { startsWith: this.testDataPrefix } }
    })
    
    await db.review.deleteMany({
      where: { 
        OR: [
          { userId: { startsWith: this.testDataPrefix } },
          { productId: { startsWith: this.testDataPrefix } }
        ]
      }
    })
    
    await db.product.deleteMany({
      where: { id: { startsWith: this.testDataPrefix } }
    })
    
    await db.user.deleteMany({
      where: { id: { startsWith: this.testDataPrefix } }
    })
    
    console.log('✅ Test data cleaned up successfully')
  }

  // Helper methods for tests
  async getTestUser(type: 'admin' | 'customer' | 'vip' = 'customer') {
    return await db.user.findUnique({
      where: { id: `${this.testDataPrefix}${type}` }
    })
  }

  async getTestProduct(type: '6Ah' | '9Ah' | '15Ah' = '9Ah') {
    return await db.product.findUnique({
      where: { id: `${this.testDataPrefix}${type}` }
    })
  }

  async createTestOrder(userId?: string, items?: any[]) {
    const user = userId || `${this.testDataPrefix}customer`
    const orderItems = items || [{
      productId: `${this.testDataPrefix}9Ah`,
      quantity: 1,
      price: 125
    }]
    
    return await db.order.create({
      data: {
        userId: user,
        total: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'pending',
        items: {
          create: orderItems
        }
      },
      include: {
        items: true,
        user: true
      }
    })
  }

  generateMockData(type: string, count: number = 1) {
    const generators = {
      user: () => ({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        role: 'customer' as const
      }),
      product: () => ({
        id: faker.string.uuid(),
        name: `FlexVolt ${faker.number.int({ min: 3, max: 20 })}Ah Battery`,
        price: faker.number.int({ min: 75, max: 350 }),
        stock: faker.number.int({ min: 0, max: 1000 }),
        features: ['20V/60V MAX', 'LED Fuel Gauge']
      }),
      order: () => ({
        id: faker.string.uuid(),
        userId: faker.string.uuid(),
        total: faker.number.float({ min: 50, max: 1000 }),
        status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered'])
      })
    }
    
    const generator = generators[type as keyof typeof generators]
    if (!generator) throw new Error(`Unknown data type: ${type}`)
    
    return count === 1 ? generator() : Array(count).fill(null).map(() => generator())
  }
}

// Export singleton instance
export const testDataFactory = TestDataFactory.getInstance()