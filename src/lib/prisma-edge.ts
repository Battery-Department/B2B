import { PrismaClient } from '@prisma/client';

// Edge runtime compatible Prisma client
let prismaEdge: PrismaClient | undefined;

export function getPrismaEdge(): PrismaClient {
  if (!prismaEdge) {
    prismaEdge = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || "file:./prisma/test.db",
        },
      },
      log: ['error'],
      errorFormat: 'minimal',
    });
  }
  return prismaEdge;
}

export async function withPrismaEdge<T>(
  operation: (client: PrismaClient) => Promise<T>
): Promise<T> {
  const client = getPrismaEdge();
  try {
    return await operation(client);
  } catch (error) {
    console.error('Prisma edge operation failed:', error);
    throw error;
  }
}
