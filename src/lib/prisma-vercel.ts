/**
 * Prisma client optimized for Vercel deployment
 */

import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING
      }
    }
  })
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

// Vercel-specific optimizations
export async function withPrisma<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  try {
    return await operation(prisma)
  } catch (error) {
    console.error('Prisma operation failed:', error)
    throw error
  } finally {
    // In serverless, we don't disconnect to reuse connections
    if (process.env.NODE_ENV === 'development') {
      // await prisma.$disconnect()
    }
  }
}

// Edge-compatible database queries
export const db = {
  // User operations
  user: {
    async findById(id: string) {
      return withPrisma(async (prisma) => 
        prisma.user.findUnique({ where: { id } })
      )
    },
    
    async findByEmail(email: string) {
      return withPrisma(async (prisma) => 
        prisma.user.findUnique({ where: { email } })
      )
    },
    
    async create(data: any) {
      return withPrisma(async (prisma) => 
        prisma.user.create({ data })
      )
    },
    
    async update(id: string, data: any) {
      return withPrisma(async (prisma) => 
        prisma.user.update({ where: { id }, data })
      )
    }
  },
  
  // Product operations
  product: {
    async findAll(options?: { skip?: number; take?: number }) {
      return withPrisma(async (prisma) => 
        prisma.product.findMany({
          skip: options?.skip,
          take: options?.take,
          orderBy: { createdAt: 'desc' }
        })
      )
    },
    
    async findById(id: string) {
      return withPrisma(async (prisma) => 
        prisma.product.findUnique({ where: { id } })
      )
    },
    
    async create(data: any) {
      return withPrisma(async (prisma) => 
        prisma.product.create({ data })
      )
    },
    
    async update(id: string, data: any) {
      return withPrisma(async (prisma) => 
        prisma.product.update({ where: { id }, data })
      )
    },
    
    async delete(id: string) {
      return withPrisma(async (prisma) => 
        prisma.product.delete({ where: { id } })
      )
    }
  },
  
  // Order operations
  order: {
    async create(data: any) {
      return withPrisma(async (prisma) => 
        prisma.order.create({ 
          data,
          include: { 
            items: true,
            customer: true 
          }
        })
      )
    },
    
    async findByUser(userId: string) {
      return withPrisma(async (prisma) => 
        prisma.order.findMany({
          where: { userId },
          include: { items: true },
          orderBy: { createdAt: 'desc' }
        })
      )
    },
    
    async findById(id: string) {
      return withPrisma(async (prisma) => 
        prisma.order.findUnique({
          where: { id },
          include: { 
            items: { include: { product: true } },
            customer: true 
          }
        })
      )
    },
    
    async updateStatus(id: string, status: string) {
      return withPrisma(async (prisma) => 
        prisma.order.update({
          where: { id },
          data: { status }
        })
      )
    }
  },
  
  // Analytics operations
  analytics: {
    async recordEvent(data: any) {
      return withPrisma(async (prisma) => 
        prisma.analyticsEvent.create({ data })
      )
    },
    
    async getEvents(filters: any) {
      return withPrisma(async (prisma) => 
        prisma.analyticsEvent.findMany({
          where: filters,
          orderBy: { createdAt: 'desc' },
          take: 1000
        })
      )
    },
    
    async getDashboardStats() {
      return withPrisma(async (prisma) => {
        const [
          totalUsers,
          totalOrders,
          totalRevenue,
          todayOrders
        ] = await Promise.all([
          prisma.user.count(),
          prisma.order.count(),
          prisma.order.aggregate({
            _sum: { total: true }
          }),
          prisma.order.count({
            where: {
              createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0))
              }
            }
          })
        ])
        
        return {
          totalUsers,
          totalOrders,
          totalRevenue: totalRevenue._sum.total || 0,
          todayOrders
        }
      })
    }
  }
}

// Export default client
export default prisma