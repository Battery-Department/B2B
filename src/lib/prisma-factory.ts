import { PrismaClient } from '@prisma/client';

// Server-side Prisma client factory
class PrismaFactory {
  private static instance: PrismaClient | null = null;
  private static isConnecting = false;

  static async getInstance(): Promise<PrismaClient> {
    if (this.instance) {
      return this.instance;
    }

    if (this.isConnecting) {
      // Wait for connection to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getInstance();
    }

    this.isConnecting = true;

    try {
      this.instance = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL || "file:./prisma/test.db",
          },
        },
        log: process.env.NODE_ENV === 'development' ? ['error'] : [],
        errorFormat: 'minimal',
      });

      await this.instance.$connect();
      this.isConnecting = false;
      
      return this.instance;
    } catch (error) {
      this.isConnecting = false;
      console.error('PrismaFactory connection failed:', error);
      
      // Return a mock client for build-time errors
      return {
        $connect: async () => {},
        $disconnect: async () => {},
        user: { findMany: async () => [], create: async () => ({}) },
        product: { findMany: async () => [], create: async () => ({}) },
        order: { findMany: async () => [], create: async () => ({}) },
        cart: { findMany: async () => [], create: async () => ({}) },
      } as any;
    }
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      try {
        await this.instance.$disconnect();
        this.instance = null;
      } catch (error) {
        console.error('PrismaFactory disconnect failed:', error);
      }
    }
  }
}

export default PrismaFactory;
