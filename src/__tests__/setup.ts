/**
 * Test Setup Configuration
 * Global setup for RHY_066 messaging system tests
 */

import '@testing-library/jest-dom'
import { jest } from '@jest/globals'

// Extend Jest matchers for testing-library/jest-dom
// Note: Most matchers are provided by @testing-library/jest-dom and @types/jest

// Mock console methods to reduce noise in tests (allow console.log for debugging)
global.console = {
  ...console,
  log: console.log,
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error,
}

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.MESSAGING_ENCRYPTION_KEY = 'test_encryption_key_for_messaging_system'
process.env.DATABASE_URL = 'sqlite:memory:test.db'

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1, // OPEN
})) as any

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
}
global.ResizeObserver = MockResizeObserver as any

// Mock IntersectionObserver
class MockIntersectionObserver {
  root: Element | null = null
  rootMargin = '0px'
  thresholds = []
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
}
global.IntersectionObserver = MockIntersectionObserver as any

// Mock DOM methods
Object.defineProperty(global.Element.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true
})

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  },
  writable: true
})

// Mock crypto for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomBytes: (size: number) => Buffer.alloc(size, 0),
    scryptSync: (password: string, salt: string, keylen: number) => Buffer.alloc(keylen, 0),
    createHash: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5')
    })),
    randomUUID: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
    createCipher: () => ({
      setAutoPadding: jest.fn(),
      update: jest.fn().mockReturnValue('encrypted'),
      final: jest.fn().mockReturnValue('data')
    }),
    createDecipher: () => ({
      setAutoPadding: jest.fn(),
      update: jest.fn().mockReturnValue('decrypted'),
      final: jest.fn().mockReturnValue('data')
    }),
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }
  },
})

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000')
}))

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('$2a$12$hashedpassword')),
  compare: jest.fn(() => Promise.resolve(true)),
  genSalt: jest.fn(() => Promise.resolve('$2a$12$salt')),
  hashSync: jest.fn(() => '$2a$12$hashedpassword'),
  compareSync: jest.fn(() => true),
}))

// Mock Node.js crypto module (consolidated with global crypto mock above)
jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto') as any
  return {
    ...actual,
    randomBytes: jest.fn().mockReturnValue(Buffer.from('test-random-bytes')),
    createHash: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5')
    })),
    randomUUID: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
  }
})

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/supplier/messages',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/server
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url: string, init?: RequestInit) => ({
    url,
    method: init?.method || 'GET',
    headers: new Map(Object.entries(init?.headers || {})),
    json: async () => JSON.parse(init?.body as string || '{}'),
    text: async () => init?.body || '',
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((data: any, init?: ResponseInit) => ({
      status: init?.status || 200,
      headers: init?.headers,
      json: async () => data,
    })),
  },
}))

// Mock Prisma with RHY database support
jest.mock('@/lib/prisma', () => ({
  prisma: {
    message: {
      create: jest.fn(() => Promise.resolve({
        id: 'msg_test',
        content: 'test message',
        timestamp: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440000',
        sessionId: 'session_test',
      })),
      findMany: jest.fn(() => Promise.resolve([])),
      findUnique: jest.fn(() => Promise.resolve(null)),
      update: jest.fn(() => Promise.resolve(null)),
      delete: jest.fn(() => Promise.resolve(null)),
      deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
      count: jest.fn(() => Promise.resolve(0)),
    },
    chatSession: {
      create: jest.fn(() => Promise.resolve({
        id: 'session_test',
        title: 'test session',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440000',
        isActive: true,
        metadata: {}
      })),
      findMany: jest.fn(() => Promise.resolve([])),
      findFirst: jest.fn(() => Promise.resolve({
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'test session',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: '550e8400-e29b-41d4-a716-446655440000',
        isActive: true,
        metadata: JSON.stringify({
          type: 'GROUP',
          participants: [],
          warehouseId: '550e8400-e29b-41d4-a716-446655440003',
          region: 'US'
        }),
        messages: []
      })),
      findUnique: jest.fn(() => Promise.resolve(null)),
      update: jest.fn(() => Promise.resolve(null)),
      delete: jest.fn(() => Promise.resolve(null)),
      deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
      count: jest.fn(() => Promise.resolve(0)),
      groupBy: jest.fn(() => Promise.resolve([])),
    },
    notification: {
      create: jest.fn(() => Promise.resolve(null)),
      createMany: jest.fn(() => Promise.resolve({ count: 0 })),
      findMany: jest.fn(() => Promise.resolve([])),
      deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
    },
    $transaction: jest.fn((callback: any) => callback({
      message: {
        create: jest.fn(() => Promise.resolve({
          id: '550e8400-e29b-41d4-a716-446655440000',
          content: 'test message',
          timestamp: new Date(),
          userId: '550e8400-e29b-41d4-a716-446655440000',
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
        })),
      },
      chatSession: {
        create: jest.fn(() => Promise.resolve({
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'test session',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: '550e8400-e29b-41d4-a716-446655440000',
          isActive: true,
          metadata: JSON.stringify({
            type: 'GROUP',
            participants: [],
            warehouseId: '550e8400-e29b-41d4-a716-446655440003',
            region: 'US'
          })
        })),
        update: jest.fn(() => Promise.resolve(null)),
        findFirst: jest.fn(() => Promise.resolve({
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: 'test session',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: '550e8400-e29b-41d4-a716-446655440000',
          isActive: true,
          metadata: JSON.stringify({
            type: 'GROUP',
            participants: [],
            warehouseId: '550e8400-e29b-41d4-a716-446655440003',
            region: 'US'
          }),
          messages: []
        })),
      },
      notification: {
        createMany: jest.fn(() => Promise.resolve({ count: 0 })),
      },
    })),
    $executeRawUnsafe: jest.fn(() => Promise.resolve([])),
    $connect: jest.fn(() => Promise.resolve(undefined)),
    $disconnect: jest.fn(() => Promise.resolve(undefined)),
  },
}))

// Mock RHY Prisma specifically
jest.mock('@/lib/rhy-database', () => ({
  rhyPrisma: {
    rHYSupplier: {
      findUnique: jest.fn(() => Promise.resolve({
        id: 'supplier-123',
        email: 'test@supplier.com',
        contactName: 'Test Supplier',
        companyName: 'Test Company',
        warehouseAccess: [{ id: 'warehouse-123', region: 'US' }]
      })),
      findMany: jest.fn(() => Promise.resolve([])),
      create: jest.fn(() => Promise.resolve(null)),
      update: jest.fn(() => Promise.resolve(null)),
      delete: jest.fn(() => Promise.resolve(null)),
    },
    rHYMeeting: {
      findMany: jest.fn(() => Promise.resolve([])),
      findUnique: jest.fn(() => Promise.resolve(null)),
      create: jest.fn(() => Promise.resolve(null)),
      update: jest.fn(() => Promise.resolve(null)),
      delete: jest.fn(() => Promise.resolve(null)),
    },
    rHYPasswordResetToken: {
      create: jest.fn(() => Promise.resolve(null)),
      findFirst: jest.fn(() => Promise.resolve(null)),
      update: jest.fn(() => Promise.resolve(null)),
      delete: jest.fn(() => Promise.resolve(null)),
      deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
    },
    rHYPasswordHistory: {
      create: jest.fn(() => Promise.resolve(null)),
      findMany: jest.fn(() => Promise.resolve([])),
      deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
    },
    rHYSession: {
      deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
    },
    $transaction: jest.fn((callback: any) => callback({
      rHYSupplier: {
        findUnique: jest.fn(() => Promise.resolve({
          id: 'supplier-123',
          email: 'test@supplier.com',
          contactName: 'Test Supplier',
          companyName: 'Test Company',
        }))
      }
    })),
    $executeRawUnsafe: jest.fn(() => Promise.resolve([])),
    $connect: jest.fn(() => Promise.resolve(undefined)),
    $disconnect: jest.fn(() => Promise.resolve(undefined)),
  },
}))

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

// Mock auth service
jest.mock('@/services/auth/AuthService', () => ({
  authService: {
    extractSessionFromRequest: jest.fn(() => Promise.resolve({
      valid: true,
      supplier: {
        id: 'supplier_test_001',
        email: 'test@supplier.com',
        contactName: 'Test Supplier',
        companyName: 'Test Company',
      },
    })),
  },
}))

// Mock warehouse service
jest.mock('@/services/warehouse/WarehouseService', () => ({
  warehouseService: {
    getWarehouseById: jest.fn(() => Promise.resolve({
      id: 'warehouse_test',
      name: 'Test Warehouse',
      region: 'US',
    })),
  },
}))

// Global test timeout - use global jest from node_modules
globalThis.setTimeout = globalThis.setTimeout || setTimeout

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks()
  jest.clearAllTimers()
})

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

export {}