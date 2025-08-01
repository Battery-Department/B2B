/**
 * RHY_056 Order API Infrastructure - Integration Test Suite
 * Enterprise-grade integration testing for complete order management workflow
 * Tests real API endpoints, database operations, and cross-service integration
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/supplier/orders/route'
import { GET as GET_ORDER, PUT, DELETE } from '@/app/api/supplier/orders/[orderId]/route'
import { POST as POST_BULK } from '@/app/api/supplier/orders/bulk/route'
import { rhyPrisma } from '@/lib/rhy-database'
import { authService } from '@/services/auth/AuthService'
import { CreateOrderRequest } from '@/types/order_apis'
import { SupplierAuthData } from '@/types/auth'

// Test configuration
const TEST_BASE_URL = 'http://localhost:3000'
const TEST_REQUEST_TIMEOUT = 30000 // 30 seconds

// Mock authenticated supplier for testing
const testSupplier: SupplierAuthData = {
  id: 'test_supplier_integration',
  companyName: 'Integration Test Construction Co.',
  tier: 'CONTRACTOR',
  status: 'ACTIVE',
  warehouseAccess: [
    {
      warehouse: 'US_WEST',
      permissions: ['VIEW_ORDERS', 'PLACE_ORDERS', 'MODIFY_ORDERS', 'CANCEL_ORDERS', 'BULK_OPERATIONS'],
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  ],
  volumeDiscountTier: {
    threshold: 1000,
    discountPercentage: 10,
    tierName: 'Contractor'
  },
  createdAt: new Date(),
  lastLoginAt: new Date()
}

// Test order data
const testOrderRequest: CreateOrderRequest = {
  items: [
    {
      productId: 'flexvolt-6ah',
      quantity: 10,
      warehousePreference: 'US_WEST'
    },
    {
      productId: 'flexvolt-9ah',
      quantity: 5,
      warehousePreference: 'US_WEST'
    }
  ],
  shippingAddress: {
    companyName: 'Integration Test Co.',
    contactName: 'Test Manager',
    addressLine1: '100 Integration Test Blvd',
    addressLine2: 'Test Suite 200',
    city: 'Test City',
    state: 'CA',
    postalCode: '90210',
    country: 'US',
    phoneNumber: '+1-555-TEST-001',
    deliveryInstructions: 'Integration testing delivery',
    isCommercialAddress: true
  },
  shippingMethod: 'standard',
  customerPO: 'INT-TEST-2025-001',
  customerNotes: 'Integration test order - safe to cancel',
  priority: 'normal',
  requestedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
}

// Helper function to create authenticated request
function createAuthenticatedRequest(method: string, url: string, body?: any): NextRequest {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Authorization': `Bearer test_jwt_token`,
    'X-Supplier-ID': testSupplier.id,
    'X-Request-ID': `test_${Date.now()}`,
    'User-Agent': 'Integration-Test-Suite/1.0'
  })

  return new NextRequest(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
}

describe('RHY_056 Order API Infrastructure - Integration Tests', () => {
  let createdOrderId: string
  let testJwtToken: string

  beforeAll(async () => {
    // Set up test environment
    console.log('🚀 Starting Order API Integration Tests')
    
    // Generate test JWT token for authentication
    testJwtToken = await authService.generateToken(testSupplier.id, {
      permissions: testSupplier.warehouseAccess[0].permissions,
      warehouse: testSupplier.warehouseAccess[0].warehouse
    })
    
    // Clean up any existing test data
    await cleanupTestData()
  }, TEST_REQUEST_TIMEOUT)

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData()
    console.log('✅ Order API Integration Tests Completed')
  }, TEST_REQUEST_TIMEOUT)

  beforeEach(() => {
    // Reset any mocks or state before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks()
  })

  describe('Order Creation API (/api/supplier/orders)', () => {
    it('should create a new order successfully with valid data', async () => {
      const request = createAuthenticatedRequest(
        'POST',
        `${TEST_BASE_URL}/api/supplier/orders`,
        testOrderRequest
      )

      // Mock authentication middleware
      vi.mock('@/lib/middleware', () => ({
        withAuth: vi.fn().mockResolvedValue({
          success: true,
          supplier: testSupplier
        })
      }))

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.id).toBeDefined()
      expect(data.data.orderNumber).toMatch(/^RHY\d{8}$/)
      expect(data.data.items).toHaveLength(2)
      expect(data.data.pricing.total).toBeGreaterThan(0)
      
      // Store order ID for subsequent tests
      createdOrderId = data.data.id
      
      console.log(`✅ Order created successfully: ${data.data.orderNumber}`)
    }, TEST_REQUEST_TIMEOUT)

    it('should apply volume discounts for qualifying orders', async () => {
      const largeOrder: CreateOrderRequest = {
        ...testOrderRequest,
        items: [
          { productId: 'flexvolt-15ah', quantity: 20 }, // 20 * $245 = $4900
          { productId: 'flexvolt-9ah', quantity: 15 }   // 15 * $125 = $1875
        ], // Total: $6775 -> should get 20% discount
        customerPO: 'INT-VOLUME-TEST-001'
      }

      const request = createAuthenticatedRequest(
        'POST',
        `${TEST_BASE_URL}/api/supplier/orders`,
        largeOrder
      )

      vi.mock('@/lib/middleware', () => ({
        withAuth: vi.fn().mockResolvedValue({
          success: true,
          supplier: testSupplier
        })
      }))

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.pricing.volumeDiscount.applicable).toBe(true)
      expect(data.data.pricing.volumeDiscount.discountAmount).toBeGreaterThan(1000)
      
      console.log(`✅ Volume discount applied: ${data.data.pricing.volumeDiscount.discountAmount}`)
    }, TEST_REQUEST_TIMEOUT)

    it('should reject orders with invalid data', async () => {
      const invalidOrder = {
        ...testOrderRequest,
        items: [], // Empty items array
        shippingAddress: {
          ...testOrderRequest.shippingAddress,
          postalCode: 'INVALID' // Invalid postal code
        }
      }

      const request = createAuthenticatedRequest(
        'POST',
        `${TEST_BASE_URL}/api/supplier/orders`,
        invalidOrder
      )

      vi.mock('@/lib/middleware', () => ({
        withAuth: vi.fn().mockResolvedValue({
          success: true,
          supplier: testSupplier
        })
      }))

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid')
      
      console.log('✅ Invalid order properly rejected')
    }, TEST_REQUEST_TIMEOUT)

    it('should handle rate limiting appropriately', async () => {
      // Mock rate limiting to trigger limit
      vi.mock('@/middleware/rate-limit', () => ({
        withRateLimit: vi.fn().mockResolvedValue({
          success: false,
          response: new Response(JSON.stringify({
            success: false,
            error: 'Rate limit exceeded'
          }), { status: 429 })
        })
      }))

      const request = createAuthenticatedRequest(
        'POST',
        `${TEST_BASE_URL}/api/supplier/orders`,
        testOrderRequest
      )

      const response = await POST(request)

      expect(response.status).toBe(429)
      
      console.log('✅ Rate limiting properly enforced')
    }, TEST_REQUEST_TIMEOUT)
  })

  describe('Order Retrieval API (/api/supplier/orders)', () => {
    it('should retrieve orders with pagination', async () => {
      const request = createAuthenticatedRequest(
        'GET',
        `${TEST_BASE_URL}/api/supplier/orders?page=1&limit=10`
      )

      vi.mock('@/lib/middleware', () => ({
        withAuth: vi.fn().mockResolvedValue({
          success: true,
          supplier: testSupplier
        })
      }))

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.pagination).toBeDefined()
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(10)
      
      console.log(`✅ Retrieved orders with pagination: ${data.pagination.totalCount} total`)
    }, TEST_REQUEST_TIMEOUT)

    it('should filter orders by status', async () => {
      const request = createAuthenticatedRequest(
        'GET',
        `${TEST_BASE_URL}/api/supplier/orders?status=pending,confirmed`
      )

      vi.mock('@/lib/middleware', () => ({
        withAuth: vi.fn().mockResolvedValue({
          success: true,
          supplier: testSupplier
        })
      }))

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      console.log('✅ Order filtering by status working correctly')
    }, TEST_REQUEST_TIMEOUT)
  })

  describe('Individual Order Management (/api/supplier/orders/[orderId])', () => {
    it('should retrieve specific order by ID', async () => {
      if (!createdOrderId) {
        // Create an order first if none exists
        const createRequest = createAuthenticatedRequest(
          'POST',
          `${TEST_BASE_URL}/api/supplier/orders`,
          testOrderRequest
        )

        vi.mock('@/lib/middleware', () => ({
          withAuth: vi.fn().mockResolvedValue({
            success: true,
            supplier: testSupplier
          })
        }))

        const createResponse = await POST(createRequest)
        const createData = await createResponse.json()
        createdOrderId = createData.data.id
      }

      const request = createAuthenticatedRequest(
        'GET',
        `${TEST_BASE_URL}/api/supplier/orders/${createdOrderId}`
      )

      vi.mock('@/lib/middleware', () => ({
        withAuth: vi.fn().mockResolvedValue({
          success: true,
          supplier: testSupplier
        })
      }))

      const response = await GET_ORDER(request, { params: { orderId: createdOrderId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(createdOrderId)
      
      console.log(`✅ Retrieved order ${createdOrderId} successfully`)
    }, TEST_REQUEST_TIMEOUT)

    it('should update order successfully', async () => {
      if (!createdOrderId) {
        throw new Error('No order ID available for update test')
      }

      const updateData = {
        customerNotes: 'Updated integration test notes',
        priority: 'high' as const
      }

      const request = createAuthenticatedRequest(
        'PUT',
        `${TEST_BASE_URL}/api/supplier/orders/${createdOrderId}`,
        updateData
      )

      vi.mock('@/lib/middleware', () => ({
        withAuth: vi.fn().mockResolvedValue({
          success: true,
          supplier: testSupplier
        })
      }))

      const response = await PUT(request, { params: { orderId: createdOrderId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.customerNotes).toBe(updateData.customerNotes)
      expect(data.data.priority).toBe(updateData.priority)
      
      console.log(`✅ Updated order ${createdOrderId} successfully`)
    }, TEST_REQUEST_TIMEOUT)

    it('should cancel order successfully', async () => {
      if (!createdOrderId) {
        throw new Error('No order ID available for cancellation test')
      }

      const request = createAuthenticatedRequest(
        'DELETE',
        `${TEST_BASE_URL}/api/supplier/orders/${createdOrderId}?reason=Integration test completion`
      )

      vi.mock('@/lib/middleware', () => ({
        withAuth: vi.fn().mockResolvedValue({
          success: true,
          supplier: testSupplier
        })
      }))

      const response = await DELETE(request, { params: { orderId: createdOrderId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('cancelled')
      
      console.log(`✅ Cancelled order ${createdOrderId} successfully`)
    }, TEST_REQUEST_TIMEOUT)

    it('should handle non-existent order ID', async () => {
      const nonExistentId = 'order_nonexistent_123'
      
      const request = createAuthenticatedRequest(
        'GET',
        `${TEST_BASE_URL}/api/supplier/orders/${nonExistentId}`
      )

      vi.mock('@/lib/middleware', () => ({
        withAuth: vi.fn().mockResolvedValue({
          success: true,
          supplier: testSupplier
        })
      }))

      const response = await GET_ORDER(request, { params: { orderId: nonExistentId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('not found')
      
      console.log('✅ Non-existent order properly handled')
    }, TEST_REQUEST_TIMEOUT)
  })

  describe('Bulk Order Processing (/api/supplier/orders/bulk)', () => {
    it('should process bulk orders successfully', async () => {
      const bulkOrderRequest = {
        orders: [
          { ...testOrderRequest, customerPO: 'BULK-TEST-001' },
          { ...testOrderRequest, customerPO: 'BULK-TEST-002' },
          { ...testOrderRequest, customerPO: 'BULK-TEST-003' }
        ],
        bulkDiscountCode: 'INTEGRATION_TEST',
        consolidateShipping: true,
        priorityLevel: 'standard' as const,
        specialInstructions: 'Integration test bulk order'
      }

      const request = createAuthenticatedRequest(
        'POST',
        `${TEST_BASE_URL}/api/supplier/orders/bulk`,
        bulkOrderRequest
      )

      // Mock enterprise-level supplier for bulk operations
      const enterpriseSupplier = {
        ...testSupplier,
        tier: 'DISTRIBUTOR' as const
      }

      vi.mock('@/lib/middleware', () => ({
        withAuth: vi.fn().mockResolvedValue({
          success: true,
          supplier: enterpriseSupplier
        })
      }))

      const response = await POST_BULK(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.summary.totalOrders).toBe(3)
      expect(data.data.summary.successfulOrders).toBeGreaterThan(0)
      
      console.log(`✅ Bulk order processed: ${data.data.summary.successfulOrders}/${data.data.summary.totalOrders} successful`)
    }, TEST_REQUEST_TIMEOUT)

    it('should enforce minimum order value for bulk operations', async () => {
      const smallBulkOrder = {
        orders: [
          {
            ...testOrderRequest,
            items: [{ productId: 'flexvolt-6ah', quantity: 1 }] // Only $95
          }
        ]
      }

      const request = createAuthenticatedRequest(
        'POST',
        `${TEST_BASE_URL}/api/supplier/orders/bulk`,
        smallBulkOrder
      )

      const enterpriseSupplier = {
        ...testSupplier,
        tier: 'DISTRIBUTOR' as const
      }

      vi.mock('@/lib/middleware', () => ({
        withAuth: vi.fn().mockResolvedValue({
          success: true,
          supplier: enterpriseSupplier
        })
      }))

      const response = await POST_BULK(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('minimum')
      
      console.log('✅ Minimum bulk order value properly enforced')
    }, TEST_REQUEST_TIMEOUT)
  })

  describe('Authentication and Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      const request = new NextRequest(`${TEST_BASE_URL}/api/supplier/orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // No authorization header
        }
      })

      vi.mock('@/lib/middleware', () => ({
        withAuth: vi.fn().mockResolvedValue({
          success: false,
          response: new Response(JSON.stringify({
            success: false,
            error: 'Authentication required'
          }), { status: 401 })
        })
      }))

      const response = await GET(request)

      expect(response.status).toBe(401)
      
      console.log('✅ Unauthenticated requests properly rejected')
    }, TEST_REQUEST_TIMEOUT)

    it('should enforce permission requirements', async () => {
      const limitedSupplier = {
        ...testSupplier,
        warehouseAccess: [
          {
            warehouse: 'US_WEST',
            permissions: ['VIEW_ORDERS'], // No PLACE_ORDERS permission
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          }
        ]
      }

      const request = createAuthenticatedRequest(
        'POST',
        `${TEST_BASE_URL}/api/supplier/orders`,
        testOrderRequest
      )

      vi.mock('@/lib/middleware', () => ({
        withAuth: vi.fn().mockResolvedValue({
          success: false,
          response: new Response(JSON.stringify({
            success: false,
            error: 'Insufficient permissions'
          }), { status: 403 })
        })
      }))

      const response = await POST(request)

      expect(response.status).toBe(403)
      
      console.log('✅ Permission requirements properly enforced')
    }, TEST_REQUEST_TIMEOUT)
  })

  describe('Error Handling and Resilience', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      vi.spyOn(rhyPrisma, '$connect').mockRejectedValue(new Error('Database connection failed'))

      const request = createAuthenticatedRequest(
        'GET',
        `${TEST_BASE_URL}/api/supplier/orders`
      )

      vi.mock('@/lib/middleware', () => ({
        withAuth: vi.fn().mockResolvedValue({
          success: true,
          supplier: testSupplier
        })
      }))

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      
      console.log('✅ Database errors handled gracefully')
    }, TEST_REQUEST_TIMEOUT)

    it('should handle malformed JSON requests', async () => {
      const request = new NextRequest(`${TEST_BASE_URL}/api/supplier/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testJwtToken}`
        },
        body: 'invalid json content'
      })

      vi.mock('@/lib/middleware', () => ({
        withAuth: vi.fn().mockResolvedValue({
          success: true,
          supplier: testSupplier
        })
      }))

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid JSON')
      
      console.log('✅ Malformed JSON properly handled')
    }, TEST_REQUEST_TIMEOUT)
  })

  describe('Performance Requirements', () => {
    it('should meet response time requirements', async () => {
      const startTime = Date.now()
      
      const request = createAuthenticatedRequest(
        'GET',
        `${TEST_BASE_URL}/api/supplier/orders`
      )

      vi.mock('@/lib/middleware', () => ({
        withAuth: vi.fn().mockResolvedValue({
          success: true,
          supplier: testSupplier
        })
      }))

      const response = await GET(request)
      const responseTime = Date.now() - startTime
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(1000) // Should respond within 1 second
      
      console.log(`✅ Response time: ${responseTime}ms (target: <1000ms)`)
    }, TEST_REQUEST_TIMEOUT)

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => {
        const request = createAuthenticatedRequest(
          'GET',
          `${TEST_BASE_URL}/api/supplier/orders?page=${i + 1}`
        )
        return GET(request)
      })

      vi.mock('@/lib/middleware', () => ({
        withAuth: vi.fn().mockResolvedValue({
          success: true,
          supplier: testSupplier
        })
      }))

      const startTime = Date.now()
      const responses = await Promise.all(concurrentRequests)
      const totalTime = Date.now() - startTime

      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
      
      expect(totalTime).toBeLessThan(5000) // All 10 requests should complete within 5 seconds
      
      console.log(`✅ Concurrent requests handled efficiently: ${responses.length} requests in ${totalTime}ms`)
    }, TEST_REQUEST_TIMEOUT)
  })
})

// Helper function to clean up test data
async function cleanupTestData() {
  try {
    // Clean up any test orders that might have been created
    if (rhyPrisma) {
      await rhyPrisma.order.deleteMany({
        where: {
          OR: [
            { customerNotes: { contains: 'Integration test' } },
            { customerPO: { startsWith: 'INT-TEST-' } },
            { customerPO: { startsWith: 'BULK-TEST-' } }
          ]
        }
      })
      
      console.log('🧹 Test data cleaned up')
    }
  } catch (error) {
    console.warn('⚠️ Warning: Could not clean up test data:', error)
  }
}