import { prisma } from '@/lib/prisma'

export interface FlexVoltBattery {
  id: string
  name: string
  sku: string
  price: number
  capacity: string
  voltage: string
  description: string
  features: string[]
  specifications: {
    weight: string
    dimensions: string
    runtime: string
    chargeTime: string
  }
  stock: number
  imageUrl: string
  category: string
}

export class ProductService {
  private static flexVoltProducts: Omit<FlexVoltBattery, 'id' | 'stock'>[] = [
    {
      name: 'FlexVolt 6Ah Battery',
      sku: 'DCB606',
      price: 95,
      capacity: '6Ah',
      voltage: '20V/60V MAX',
      description: 'Compact power solution for light to medium-duty contractor work. Perfect for everyday tools.',
      features: [
        '20V/60V MAX compatibility',
        'LED state of charge display',
        '3-year limited warranty',
        'No memory and virtually no self-discharge',
        'Lightweight at only 2.0 lbs'
      ],
      specifications: {
        weight: '2.0 lbs',
        dimensions: '5.5" x 2.8" x 3.1"',
        runtime: 'Up to 4 hours with standard tools',
        chargeTime: '60 minutes with DCB118 fast charger'
      },
      imageUrl: '/images/flexvolt-6ah.jpg',
      category: 'battery'
    },
    {
      name: 'FlexVolt 9Ah Battery',
      sku: 'DCB609',
      price: 125,
      capacity: '9Ah',
      voltage: '20V/60V MAX',
      description: 'Extended runtime battery for heavy-duty applications. Ideal for high-demand tools and longer work sessions.',
      features: [
        '20V/60V MAX compatibility',
        'LED state of charge display',
        '3-year limited warranty',
        '50% more runtime than 6Ah',
        'Patented technology for maximum runtime'
      ],
      specifications: {
        weight: '2.8 lbs',
        dimensions: '5.5" x 2.8" x 3.7"',
        runtime: 'Up to 6 hours with standard tools',
        chargeTime: '90 minutes with DCB118 fast charger'
      },
      imageUrl: '/images/flexvolt-9ah.jpg',
      category: 'battery'
    },
    {
      name: 'FlexVolt 15Ah Battery',
      sku: 'DCB615',
      price: 245,
      capacity: '15Ah',
      voltage: '20V/60V MAX',
      description: 'Maximum power and runtime for the most demanding contractor applications. Built for all-day performance.',
      features: [
        '20V/60V MAX compatibility',
        'LED state of charge display',
        '3-year limited warranty',
        '2.5x runtime of 6Ah battery',
        'Rubber overmold base for durability',
        'Extreme weather performance (-4°F to 120°F)'
      ],
      specifications: {
        weight: '4.5 lbs',
        dimensions: '5.5" x 2.8" x 5.0"',
        runtime: 'Up to 10 hours with standard tools',
        chargeTime: '150 minutes with DCB118 fast charger'
      },
      imageUrl: '/images/flexvolt-15ah.jpg',
      category: 'battery'
    }
  ]

  async initializeProducts() {
    try {
      // Check if products already exist
      const existingCount = await prisma.product.count()
      if (existingCount > 0) {
        console.log('Products already initialized')
        return
      }

      // Create FlexVolt products
      for (const product of ProductService.flexVoltProducts) {
        await prisma.product.create({
          data: {
            ...product,
            stock: 100, // Initial stock level
            features: JSON.stringify(product.features),
            specifications: JSON.stringify(product.specifications)
          }
        })
      }

      console.log('FlexVolt products initialized successfully')
    } catch (error) {
      console.error('Error initializing products:', error)
    }
  }

  async getAllProducts() {
    const products = await prisma.product.findMany({
      orderBy: { price: 'asc' }
    })

    return products.map(product => ({
      ...product,
      features: JSON.parse(product.features as string),
      specifications: JSON.parse(product.specifications as string)
    }))
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id }
    })

    if (!product) {
      throw new Error('Product not found')
    }

    return {
      ...product,
      features: JSON.parse(product.features as string),
      specifications: JSON.parse(product.specifications as string)
    }
  }

  async getProductBySku(sku: string) {
    const product = await prisma.product.findUnique({
      where: { sku }
    })

    if (!product) {
      throw new Error('Product not found')
    }

    return {
      ...product,
      features: JSON.parse(product.features as string),
      specifications: JSON.parse(product.specifications as string)
    }
  }

  async checkStock(productId: string, quantity: number): Promise<boolean> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true }
    })

    return product ? product.stock >= quantity : false
  }

  async updateStock(productId: string, quantity: number, operation: 'increment' | 'decrement') {
    return prisma.product.update({
      where: { id: productId },
      data: {
        stock: {
          [operation]: quantity
        }
      }
    })
  }

  async getProductsByCategory(category: string) {
    const products = await prisma.product.findMany({
      where: { category },
      orderBy: { price: 'asc' }
    })

    return products.map(product => ({
      ...product,
      features: JSON.parse(product.features as string),
      specifications: JSON.parse(product.specifications as string)
    }))
  }

  // Get products with low stock (less than 20 units)
  async getLowStockProducts() {
    const products = await prisma.product.findMany({
      where: {
        stock: {
          lt: 20
        }
      },
      orderBy: { stock: 'asc' }
    })

    return products.map(product => ({
      ...product,
      features: JSON.parse(product.features as string),
      specifications: JSON.parse(product.specifications as string)
    }))
  }

  // Calculate total inventory value
  async getInventoryValue() {
    const products = await prisma.product.findMany()
    
    return products.reduce((total, product) => {
      return total + (product.price.toNumber() * product.stock)
    }, 0)
  }

  // Get product recommendations based on capacity
  async getRecommendations(currentProductId: string) {
    const currentProduct = await this.getProductById(currentProductId)
    
    // Get other products in the same category
    const recommendations = await prisma.product.findMany({
      where: {
        id: { not: currentProductId },
        category: currentProduct.category
      },
      orderBy: { price: 'asc' }
    })

    return recommendations.map(product => ({
      ...product,
      features: JSON.parse(product.features as string),
      specifications: JSON.parse(product.specifications as string)
    }))
  }
}

// Export singleton instance
export const productService = new ProductService()