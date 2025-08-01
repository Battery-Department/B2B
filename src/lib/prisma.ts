// Use Vercel-optimized Prisma client
export * from './prisma-vercel'
import prismaVercel from './prisma-vercel'

const prisma = prismaVercel

export { prisma }
export default prisma

// Graceful connection handling
export async function connectPrisma() {
  try {
    await prisma.$connect()
    return prisma
  } catch (error) {
    console.error('Prisma connection failed:', error)
    throw error
  }
}

export async function disconnectPrisma() {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('Prisma disconnection failed:', error)
  }
}
