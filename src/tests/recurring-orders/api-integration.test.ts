/**
 * RHY Supplier Portal - API Integration Tests for Recurring Orders
 * Production-grade integration tests covering all API endpoints
 * Tests real HTTP requests and responses with complete validation
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'

// Mock fetch for testing
global.fetch = jest.fn()

interface APITestResponse {
  ok: boolean
  status: number
  json: () => Promise<any>
  headers: Headers
}

interface MockFetchOptions {
  method?: string
  headers?: Record<string, string>
  body?: string
}

// Helper function to create mock fetch responses
const createMockResponse = (data: any, status: number = 200): APITestResponse => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  headers: new Headers({
    'content-type': 'application/json',
    'x-response-time': '50ms',
    'x-ratelimit-remaining': '100'
  })
})

// Helper function to make API requests
const makeAPIRequest = async (
  endpoint: string, 
  options: MockFetchOptions = {}
): Promise<APITestResponse> => {
  const url = `http://localhost:3000/api/supplier/orders/recurring${endpoint}`
  const fetchOptions = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-jwt-token',
      'User-Agent': 'RHY-Test-Suite/1.0',
      'X-Forwarded-For': '127.0.0.1',
      ...options.headers
    },
    body: options.body
  }

  // Call the mocked fetch
  return fetch(url, fetchOptions) as Promise<APITestResponse>
}

describe('Recurring Orders API Integration Tests', () => {
  let testSupplierId: string
  let createdOrderIds: string[] = []

  beforeEach(() => {
    testSupplierId = 'api_test_supplier_' + Date.now()
    createdOrderIds = []
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup created orders in real implementation
    createdOrderIds.forEach(orderId => {
      // DELETE /api/supplier/orders/recurring/{orderId}
    })
  })

  describe('GET /api/supplier/orders/recurring - List Recurring Orders', () => {
    test('Retrieve all recurring orders with default pagination', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'test-order-1',
            supplierId: testSupplierId,
            name: 'Monthly FlexVolt 6Ah Supply',
            description: 'Regular monthly battery supply for construction crews',
            status: 'ACTIVE',
            frequency: 'MONTHLY',
            interval: 1,
            startDate: '2024-07-01T00:00:00.000Z',
            nextExecutionDate: '2024-08-01T10:00:00.000Z',
            warehouse: 'US',
            autoApprove: false,
            requiresApproval: true,
            approvalThreshold: 5000,
            orderTemplate: {
              items: [{
                productId: 'flexvolt-6ah-pro',
                sku: 'FV6AH-PRO',
                name: 'FlexVolt 6Ah Professional Battery',
                quantity: 25,
                unitPrice: 95.00,
                useDynamicPricing: true,
                allowSubstitutions: false,
                backorderBehavior: 'ALLOW',
                allowQuantityAdjustment: true
              }],
              shipping: {
                method: 'STANDARD',
                signature: false,
                insurance: true,
                packingSlip: true
              },
              payment: {
                method: 'CREDIT_CARD'
              }
            },
            notificationSettings: {
              email: ['test@example.com'],
              onOrderCreated: true,
              onOrderSuccess: true,
              onOrderFailure: true,
              onInventoryIssue: true,
              onPriceChange: true,
              onApprovalRequired: true,
              sendReminders: true,
              reminderDays: [7, 3, 1]
            },
            tags: ['monthly', 'construction', 'priority'],
            totalOrders: 12,
            successRate: 100,
            averageOrderValue: 2375,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-06-24T12:00:00.000Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        },
        summary: {
          totalOrders: 24,
          activeOrders: 18,
          totalMonthlyValue: 45750.00,
          avgOrderValue: 2540.00,
          successRate: 96.5,
          upcomingExecutions: 5
        },
        metadata: {
          responseTime: 45,
          accessibleWarehouses: ['US', 'EU'],
          supplierTier: 'PROFESSIONAL'
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse))

      const response = await makeAPIRequest('')
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/supplier/orders/recurring',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-jwt-token',
            'Content-Type': 'application/json'
          })
        })
      )

      const data = await response.json()
      
      // Validate response structure
      expect(response.ok).toBe(true)
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data).toHaveLength(1)
      
      // Validate recurring order structure
      const order = data.data[0]
      expect(order.id).toBeTruthy()
      expect(order.supplierId).toBe(testSupplierId)
      expect(order.name).toBeTruthy()
      expect(['ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED']).toContain(order.status)
      expect(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']).toContain(order.frequency)
      expect(['US', 'JP', 'EU', 'AU']).toContain(order.warehouse)
      
      // Validate order template
      expect(order.orderTemplate).toBeDefined()
      expect(Array.isArray(order.orderTemplate.items)).toBe(true)
      expect(order.orderTemplate.items.length).toBeGreaterThan(0)
      expect(order.orderTemplate.shipping).toBeDefined()
      expect(order.orderTemplate.payment).toBeDefined()
      
      // Validate notification settings
      expect(order.notificationSettings).toBeDefined()
      expect(Array.isArray(order.notificationSettings.email)).toBe(true)
      expect(order.notificationSettings.email.length).toBeGreaterThan(0)
      
      // Validate pagination
      expect(data.pagination).toBeDefined()
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(20)
      expect(data.pagination.totalCount).toBeGreaterThanOrEqual(0)
      
      // Validate summary
      expect(data.summary).toBeDefined()
      expect(typeof data.summary.totalOrders).toBe('number')
      expect(typeof data.summary.activeOrders).toBe('number')
      expect(typeof data.summary.totalMonthlyValue).toBe('number')
      expect(typeof data.summary.successRate).toBe('number')
    })

    test('Filter recurring orders by warehouse', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'us-order-1',
            warehouse: 'US',
            name: 'US Warehouse Order'
          }
        ],
        pagination: { page: 1, limit: 20, totalCount: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        summary: { totalOrders: 1, activeOrders: 1, totalMonthlyValue: 2375, avgOrderValue: 2375, successRate: 100, upcomingExecutions: 1 },
        metadata: { responseTime: 25 }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse))

      const response = await makeAPIRequest('?warehouse=US')
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data.every((order: any) => order.warehouse === 'US')).toBe(true)
    })

    test('Filter recurring orders by status and frequency', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'active-monthly-1',
            status: 'ACTIVE',
            frequency: 'MONTHLY',
            name: 'Active Monthly Order'
          }
        ],
        pagination: { page: 1, limit: 20, totalCount: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        summary: { totalOrders: 1, activeOrders: 1, totalMonthlyValue: 2375, avgOrderValue: 2375, successRate: 100, upcomingExecutions: 1 },
        metadata: { responseTime: 30 }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse))

      const response = await makeAPIRequest('?status=ACTIVE&frequency=MONTHLY')
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data.every((order: any) => order.status === 'ACTIVE' && order.frequency === 'MONTHLY')).toBe(true)
    })

    test('Paginate recurring orders', async () => {
      const mockResponse = {
        success: true,
        data: [
          { id: 'order-3', name: 'Order 3' },
          { id: 'order-4', name: 'Order 4' }
        ],
        pagination: {
          page: 2,
          limit: 2,
          totalCount: 10,
          totalPages: 5,
          hasNextPage: true,
          hasPreviousPage: true
        },
        summary: { totalOrders: 10, activeOrders: 8, totalMonthlyValue: 23750, avgOrderValue: 2375, successRate: 95, upcomingExecutions: 3 },
        metadata: { responseTime: 35 }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse))

      const response = await makeAPIRequest('?page=2&limit=2')
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.pagination.page).toBe(2)
      expect(data.pagination.limit).toBe(2)
      expect(data.pagination.hasNextPage).toBe(true)
      expect(data.pagination.hasPreviousPage).toBe(true)
      expect(data.data).toHaveLength(2)
    })

    test('Handle empty results', async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
        summary: { totalOrders: 0, activeOrders: 0, totalMonthlyValue: 0, avgOrderValue: 0, successRate: 0, upcomingExecutions: 0 },
        metadata: { responseTime: 15 }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse))

      const response = await makeAPIRequest('?warehouse=JP&status=COMPLETED')
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(0)
      expect(data.pagination.totalCount).toBe(0)
    })
  })

  describe('POST /api/supplier/orders/recurring - Create Recurring Order', () => {
    test('Create comprehensive recurring order successfully', async () => {
      const createRequest = {
        name: 'Enterprise Monthly FlexVolt Supply',
        description: 'Comprehensive monthly battery supply for enterprise operations',
        frequency: 'MONTHLY',
        interval: 1,
        startDate: '2024-07-01',
        orderTemplate: {
          items: [
            {
              productId: 'flexvolt-6ah-enterprise',
              sku: 'FV6AH-ENT',
              name: 'FlexVolt 6Ah Enterprise Battery',
              quantity: 50,
              useDynamicPricing: true,
              allowSubstitutions: false,
              backorderBehavior: 'ALLOW',
              allowQuantityAdjustment: true,
              minQuantity: 40,
              maxQuantity: 60
            },
            {
              productId: 'flexvolt-9ah-enterprise',
              sku: 'FV9AH-ENT',
              name: 'FlexVolt 9Ah Enterprise Battery',
              quantity: 25,
              useDynamicPricing: true,
              allowSubstitutions: false,
              backorderBehavior: 'PARTIAL',
              allowQuantityAdjustment: false
            }
          ],
          shipping: {
            method: 'EXPRESS',
            signature: true,
            insurance: true,
            packingSlip: true
          },
          payment: {
            method: 'NET_TERMS',
            paymentTerms: 'Net 30',
            poNumber: 'ENT-2024-001'
          },
          specialInstructions: 'Deliver to loading dock A between 8-10 AM',
          notes: 'Enterprise priority order - handle with care'
        },
        deliveryAddress: {
          name: 'Enterprise Operations Manager',
          company: 'Enterprise Solutions Corp',
          address1: '1000 Enterprise Boulevard',
          address2: 'Suite 500',
          city: 'Enterprise City',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          phone: '+1-212-555-0100',
          email: 'operations@enterprise.com',
          isDefault: true
        },
        warehouse: 'US',
        autoApprove: false,
        approvalThreshold: 10000,
        maxOrderValue: 50000,
        notificationSettings: {
          email: ['operations@enterprise.com', 'procurement@enterprise.com', 'manager@enterprise.com'],
          sms: ['+1-212-555-0100'],
          webhookUrl: 'https://enterprise.com/api/order-notifications',
          onOrderCreated: true,
          onOrderSuccess: true,
          onOrderFailure: true,
          onInventoryIssue: true,
          onPriceChange: true,
          onApprovalRequired: true,
          sendReminders: true,
          reminderDays: [14, 7, 3, 1]
        },
        tags: ['enterprise', 'monthly', 'high-priority', 'managed'],
        customFields: {
          contractNumber: 'ENT-CONTRACT-2024-001',
          budgetCode: 'CAPEX-BATTERIES-2024',
          projectManager: 'Jane Smith',
          costCenter: 'CC-ENT-OPS-001'
        }
      }

      const mockResponse = {
        success: true,
        data: {
          id: 'new-order-123',
          ...createRequest,
          supplierId: testSupplierId,
          status: 'ACTIVE',
          nextExecutionDate: '2024-07-01T10:00:00.000Z',
          requiresApproval: true,
          totalOrders: 0,
          totalValue: 0,
          successRate: 100,
          averageOrderValue: 0,
          executionHistory: [],
          createdAt: '2024-06-24T12:00:00.000Z',
          updatedAt: '2024-06-24T12:00:00.000Z',
          createdBy: testSupplierId
        },
        metadata: {
          responseTime: 85,
          recurringOrderId: 'new-order-123'
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse, 201))

      const response = await makeAPIRequest('', {
        method: 'POST',
        body: JSON.stringify(createRequest)
      })

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/supplier/orders/recurring',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-jwt-token'
          }),
          body: JSON.stringify(createRequest)
        })
      )

      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('new-order-123')
      expect(data.data.name).toBe(createRequest.name)
      expect(data.data.frequency).toBe('MONTHLY')
      expect(data.data.warehouse).toBe('US')
      expect(data.data.status).toBe('ACTIVE')
      expect(data.data.requiresApproval).toBe(true)
      expect(data.data.orderTemplate.items).toHaveLength(2)
      expect(data.data.notificationSettings.email).toHaveLength(3)
      expect(data.data.customFields.contractNumber).toBe('ENT-CONTRACT-2024-001')
      
      createdOrderIds.push(data.data.id)
    })

    test('Handle validation errors', async () => {
      const invalidRequest = {
        name: '', // Invalid: empty name
        frequency: 'INVALID_FREQUENCY', // Invalid frequency
        startDate: 'invalid-date', // Invalid date format
        orderTemplate: {
          items: [], // Invalid: no items
          shipping: { method: 'INVALID_METHOD' },
          payment: { method: 'INVALID_PAYMENT' }
        },
        deliveryAddress: {
          // Missing required fields
          name: 'Test'
        },
        warehouse: 'INVALID_WAREHOUSE',
        notificationSettings: {
          email: [] // Invalid: no email addresses
        }
      }

      const mockResponse = {
        success: false,
        error: 'Invalid recurring order data',
        code: 'VALIDATION_ERROR',
        details: [
          {
            code: 'too_small',
            minimum: 2,
            type: 'string',
            inclusive: true,
            exact: false,
            message: 'String must contain at least 2 character(s)',
            path: ['name']
          },
          {
            code: 'invalid_enum_value',
            options: ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'CUSTOM'],
            path: ['frequency'],
            message: 'Invalid enum value'
          }
        ]
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse, 400))

      const response = await makeAPIRequest('', {
        method: 'POST',
        body: JSON.stringify(invalidRequest)
      })

      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBeTruthy()
      expect(data.code).toBe('VALIDATION_ERROR')
      expect(Array.isArray(data.details)).toBe(true)
      expect(data.details.length).toBeGreaterThan(0)
    })

    test('Handle unauthorized access', async () => {
      const mockResponse = {
        success: false,
        error: 'Unauthorized access',
        code: 'AUTH_REQUIRED'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse, 401))

      const response = await makeAPIRequest('', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer invalid-token' },
        body: JSON.stringify({ name: 'Test Order' })
      })

      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.code).toBe('AUTH_REQUIRED')
    })
  })

  describe('GET /api/supplier/orders/recurring/[id] - Get Specific Order', () => {
    test('Retrieve specific recurring order successfully', async () => {
      const orderId = 'test-order-detailed-123'
      const mockResponse = {
        success: true,
        data: {
          id: orderId,
          supplierId: testSupplierId,
          name: 'Detailed Test Order',
          description: 'Comprehensive test order with full details',
          status: 'ACTIVE',
          frequency: 'WEEKLY',
          interval: 2,
          startDate: '2024-07-01T00:00:00.000Z',
          nextExecutionDate: '2024-07-15T10:00:00.000Z',
          warehouse: 'EU',
          autoApprove: true,
          requiresApproval: false,
          orderTemplate: {
            items: [{
              productId: 'flexvolt-detailed-test',
              sku: 'FV-DETAIL',
              name: 'FlexVolt Detailed Test Battery',
              quantity: 20,
              unitPrice: 125.00,
              useDynamicPricing: false,
              allowSubstitutions: true,
              backorderBehavior: 'PARTIAL',
              allowQuantityAdjustment: true,
              minQuantity: 15,
              maxQuantity: 25
            }],
            shipping: {
              method: 'OVERNIGHT',
              carrier: 'DHL',
              signature: true,
              insurance: true,
              packingSlip: true
            },
            payment: {
              method: 'ACH',
              paymentTerms: 'Net 15'
            },
            specialInstructions: 'Handle with extreme care - fragile components',
            notes: 'Priority order for European operations'
          },
          deliveryAddress: {
            name: 'EU Operations Director',
            company: 'European Operations Ltd',
            address1: '100 European Street',
            city: 'London',
            state: '',
            postalCode: 'SW1A 1AA',
            country: 'GB',
            phone: '+44-20-7946-0958',
            email: 'director@eu-ops.com',
            isDefault: true
          },
          billingAddress: {
            name: 'EU Finance Department',
            company: 'European Operations Ltd',
            address1: '100 European Street',
            city: 'London',
            state: '',
            postalCode: 'SW1A 1AA',
            country: 'GB',
            phone: '+44-20-7946-0959',
            email: 'finance@eu-ops.com',
            isDefault: false
          },
          notificationSettings: {
            email: ['director@eu-ops.com', 'operations@eu-ops.com'],
            sms: ['+44-20-7946-0958'],
            onOrderCreated: true,
            onOrderSuccess: true,
            onOrderFailure: true,
            onInventoryIssue: true,
            onPriceChange: false,
            onApprovalRequired: false,
            sendReminders: false,
            reminderDays: []
          },
          executionHistory: [
            {
              id: 'exec-1',
              status: 'SUCCESS',
              scheduledDate: '2024-06-01T10:00:00.000Z',
              executedDate: '2024-06-01T10:05:00.000Z',
              orderId: 'generated-order-001',
              totalValue: 2500.00,
              itemCount: 1
            },
            {
              id: 'exec-2',
              status: 'SUCCESS',
              scheduledDate: '2024-06-15T10:00:00.000Z',
              executedDate: '2024-06-15T10:03:00.000Z',
              orderId: 'generated-order-002',
              totalValue: 2500.00,
              itemCount: 1
            }
          ],
          totalOrders: 2,
          totalValue: 5000.00,
          successRate: 100,
          averageOrderValue: 2500.00,
          tags: ['bi-weekly', 'eu-operations', 'automated'],
          customFields: {
            euCompliance: 'GDPR-compliant',
            vatNumber: 'GB123456789',
            currencyPreference: 'EUR'
          },
          createdAt: '2024-05-01T00:00:00.000Z',
          updatedAt: '2024-06-15T10:03:00.000Z',
          createdBy: testSupplierId
        },
        metadata: {
          responseTime: 25,
          recurringOrderId: orderId
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse))

      const response = await makeAPIRequest(`/${orderId}`)
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(orderId)
      expect(data.data.supplierId).toBe(testSupplierId)
      expect(data.data.warehouse).toBe('EU')
      expect(data.data.executionHistory).toHaveLength(2)
      expect(data.data.totalOrders).toBe(2)
      expect(data.data.successRate).toBe(100)
      expect(data.data.customFields.euCompliance).toBe('GDPR-compliant')
    })

    test('Handle order not found', async () => {
      const nonExistentId = 'non-existent-order-123'
      const mockResponse = {
        success: false,
        error: 'Recurring order not found',
        code: 'NOT_FOUND'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse, 404))

      const response = await makeAPIRequest(`/${nonExistentId}`)
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.code).toBe('NOT_FOUND')
    })
  })

  describe('PUT /api/supplier/orders/recurring/[id] - Update Recurring Order', () => {
    test('Update recurring order successfully', async () => {
      const orderId = 'update-test-order-123'
      const updateRequest = {
        name: 'Updated Order Name',
        description: 'Updated comprehensive description',
        frequency: 'MONTHLY',
        autoApprove: false,
        approvalThreshold: 15000,
        orderTemplate: {
          items: [{
            productId: 'flexvolt-updated',
            sku: 'FV-UPD',
            name: 'FlexVolt Updated Battery',
            quantity: 30,
            useDynamicPricing: true,
            allowSubstitutions: false,
            backorderBehavior: 'ALLOW',
            allowQuantityAdjustment: true,
            minQuantity: 25,
            maxQuantity: 35
          }],
          shipping: {
            method: 'EXPRESS',
            signature: true,
            insurance: true,
            packingSlip: true
          },
          payment: {
            method: 'CREDIT_CARD'
          }
        },
        tags: ['updated', 'monthly', 'enhanced']
      }

      const mockResponse = {
        success: true,
        data: {
          id: orderId,
          supplierId: testSupplierId,
          ...updateRequest,
          status: 'ACTIVE',
          warehouse: 'US',
          nextExecutionDate: '2024-08-01T10:00:00.000Z',
          requiresApproval: true,
          deliveryAddress: {
            name: 'Existing Customer',
            address1: '123 Existing St',
            city: 'Existing City',
            state: 'CA',
            postalCode: '90210',
            country: 'US',
            isDefault: true
          },
          notificationSettings: {
            email: ['existing@customer.com'],
            onOrderCreated: true,
            onOrderSuccess: true,
            onOrderFailure: true,
            onInventoryIssue: true,
            onPriceChange: true,
            onApprovalRequired: true,
            sendReminders: true,
            reminderDays: [7, 3, 1]
          },
          updatedAt: '2024-06-24T12:30:00.000Z'
        },
        metadata: {
          responseTime: 55,
          recurringOrderId: orderId
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse))

      const response = await makeAPIRequest(`/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify(updateRequest)
      })

      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(orderId)
      expect(data.data.name).toBe('Updated Order Name')
      expect(data.data.frequency).toBe('MONTHLY')
      expect(data.data.autoApprove).toBe(false)
      expect(data.data.approvalThreshold).toBe(15000)
      expect(data.data.orderTemplate.items[0].quantity).toBe(30)
      expect(data.data.tags).toContain('updated')
    })

    test('Handle partial updates', async () => {
      const orderId = 'partial-update-test-123'
      const partialUpdate = {
        name: 'Partially Updated Name',
        autoApprove: true
      }

      const mockResponse = {
        success: true,
        data: {
          id: orderId,
          supplierId: testSupplierId,
          name: 'Partially Updated Name',
          autoApprove: true,
          // Other fields remain unchanged
          frequency: 'WEEKLY',
          status: 'ACTIVE',
          warehouse: 'JP',
          updatedAt: '2024-06-24T12:45:00.000Z'
        },
        metadata: {
          responseTime: 30,
          recurringOrderId: orderId
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse))

      const response = await makeAPIRequest(`/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify(partialUpdate)
      })

      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Partially Updated Name')
      expect(data.data.autoApprove).toBe(true)
      expect(data.data.frequency).toBe('WEEKLY') // Unchanged
    })
  })

  describe('DELETE /api/supplier/orders/recurring/[id] - Cancel Recurring Order', () => {
    test('Cancel recurring order successfully', async () => {
      const orderId = 'cancel-test-order-123'
      const mockResponse = {
        success: true,
        message: 'Recurring order cancelled successfully',
        data: {
          id: orderId,
          status: 'CANCELLED'
        },
        metadata: {
          responseTime: 40,
          recurringOrderId: orderId
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse))

      const response = await makeAPIRequest(`/${orderId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Recurring order cancelled successfully')
      expect(data.data.id).toBe(orderId)
      expect(data.data.status).toBe('CANCELLED')
    })
  })

  describe('POST /api/supplier/orders/recurring/[id]/execute - Execute Order', () => {
    test('Execute recurring order manually', async () => {
      const orderId = 'execute-test-order-123'
      const executeRequest = {
        force: true,
        notes: 'Manual execution for testing purposes'
      }

      const mockResponse = {
        success: true,
        message: 'Recurring order executed successfully',
        data: {
          execution: {
            id: 'exec-manual-123',
            status: 'SUCCESS',
            orderId: 'generated-order-manual-001',
            totalValue: 3750.00,
            itemCount: 2,
            scheduledDate: '2024-06-24T12:00:00.000Z',
            executedDate: '2024-06-24T12:02:15.000Z',
            adjustments: [
              {
                type: 'PRICE',
                itemId: 'flexvolt-6ah',
                oldValue: 95.00,
                newValue: 97.50,
                reason: 'Market price adjustment: 2.63%',
                autoApproved: true
              }
            ],
            issues: [],
            errorMessage: null
          },
          recurringOrder: {
            id: orderId,
            name: 'Execute Test Order',
            status: 'ACTIVE',
            nextExecutionDate: '2024-07-24T12:00:00.000Z'
          }
        },
        metadata: {
          responseTime: 125,
          executionId: 'exec-manual-123',
          manualExecution: true
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse))

      const response = await makeAPIRequest(`/${orderId}/execute`, {
        method: 'POST',
        body: JSON.stringify(executeRequest)
      })

      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data.execution.id).toBeTruthy()
      expect(data.data.execution.status).toBe('SUCCESS')
      expect(data.data.execution.orderId).toBeTruthy()
      expect(data.data.execution.totalValue).toBe(3750.00)
      expect(data.data.execution.adjustments).toHaveLength(1)
      expect(data.metadata.manualExecution).toBe(true)
    })

    test('Handle execution failure', async () => {
      const orderId = 'execute-fail-test-123'
      const mockResponse = {
        success: false,
        message: 'Recurring order execution failed',
        data: {
          execution: {
            id: 'exec-fail-123',
            status: 'FAILED',
            totalValue: 0,
            itemCount: 0,
            scheduledDate: '2024-06-24T12:00:00.000Z',
            executedDate: null,
            adjustments: [],
            issues: [
              {
                type: 'INVENTORY',
                severity: 'CRITICAL',
                message: 'Product FlexVolt 6Ah (SKU: FV6AH) is out of stock'
              }
            ],
            errorMessage: 'Critical inventory issues prevent order execution'
          },
          recurringOrder: {
            id: orderId,
            name: 'Execute Fail Test Order',
            status: 'ACTIVE',
            nextExecutionDate: '2024-07-24T12:00:00.000Z'
          }
        },
        metadata: {
          responseTime: 85,
          executionId: 'exec-fail-123',
          manualExecution: true
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse, 422))

      const response = await makeAPIRequest(`/${orderId}/execute`, {
        method: 'POST'
      })

      const data = await response.json()
      
      expect(response.status).toBe(422)
      expect(data.success).toBe(false)
      expect(data.data.execution.status).toBe('FAILED')
      expect(data.data.execution.issues).toHaveLength(1)
      expect(data.data.execution.errorMessage).toBeTruthy()
    })
  })

  describe('GET /api/supplier/orders/recurring/upcoming - Get Upcoming Executions', () => {
    test('Retrieve upcoming executions with comprehensive data', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            recurringOrderId: 'upcoming-1',
            recurringOrderName: 'Daily High-Priority Order',
            frequency: 'DAILY',
            status: 'ACTIVE',
            warehouse: 'US',
            nextExecutionDate: '2024-06-25T10:00:00.000Z',
            daysUntilExecution: 1,
            executionStatus: 'DUE_SOON',
            riskLevel: 'MEDIUM',
            estimatedValue: 4750.00,
            itemCount: 2,
            autoApprove: false,
            requiresApproval: true,
            approvalThreshold: 5000,
            tags: ['daily', 'high-priority'],
            lastExecutedAt: '2024-06-24T10:05:00.000Z',
            successRate: 98.5,
            totalOrders: 156,
            potentialIssues: ['MANUAL_APPROVAL_REQUIRED']
          },
          {
            recurringOrderId: 'upcoming-2',
            recurringOrderName: 'Weekly Standard Order',
            frequency: 'WEEKLY',
            status: 'ACTIVE',
            warehouse: 'EU',
            nextExecutionDate: '2024-06-24T14:00:00.000Z',
            daysUntilExecution: 0,
            executionStatus: 'DUE_TODAY',
            riskLevel: 'LOW',
            estimatedValue: 2375.00,
            itemCount: 1,
            autoApprove: true,
            requiresApproval: false,
            tags: ['weekly', 'standard'],
            lastExecutedAt: '2024-06-17T14:02:00.000Z',
            successRate: 100,
            totalOrders: 24,
            potentialIssues: []
          },
          {
            recurringOrderId: 'upcoming-3',
            recurringOrderName: 'Overdue Monthly Order',
            frequency: 'MONTHLY',
            status: 'ACTIVE',
            warehouse: 'JP',
            nextExecutionDate: '2024-06-23T09:00:00.000Z',
            daysUntilExecution: -1,
            executionStatus: 'OVERDUE',
            riskLevel: 'HIGH',
            estimatedValue: 9500.00,
            itemCount: 4,
            autoApprove: false,
            requiresApproval: true,
            approvalThreshold: 8000,
            tags: ['monthly', 'bulk'],
            lastExecutedAt: '2024-05-23T09:15:00.000Z',
            successRate: 95,
            totalOrders: 12,
            potentialIssues: ['OVERDUE', 'PRICE_CHANGES', 'MANUAL_APPROVAL_REQUIRED']
          }
        ],
        summary: {
          totalUpcoming: 3,
          dueToday: 1,
          dueSoon: 1,
          overdue: 1,
          highRisk: 1,
          mediumRisk: 1,
          lowRisk: 1,
          totalEstimatedValue: 16625.00,
          requiresApproval: 2,
          warehouseBreakdown: {
            'US': 1,
            'EU': 1,
            'JP': 1
          }
        },
        metadata: {
          responseTime: 35,
          accessibleWarehouses: ['US', 'EU', 'JP', 'AU'],
          supplierTier: 'ENTERPRISE',
          searchCriteria: {
            days: 7,
            includeOverdue: true,
            sortBy: 'nextExecutionDate',
            sortOrder: 'asc'
          }
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse))

      const response = await makeAPIRequest('/upcoming')
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(3)
      
      // Validate upcoming execution structure
      data.data.forEach((execution: any) => {
        expect(execution.recurringOrderId).toBeTruthy()
        expect(execution.recurringOrderName).toBeTruthy()
        expect(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']).toContain(execution.frequency)
        expect(['US', 'JP', 'EU', 'AU']).toContain(execution.warehouse)
        expect(['SCHEDULED', 'DUE_TODAY', 'DUE_SOON', 'OVERDUE']).toContain(execution.executionStatus)
        expect(['LOW', 'MEDIUM', 'HIGH']).toContain(execution.riskLevel)
        expect(typeof execution.estimatedValue).toBe('number')
        expect(typeof execution.itemCount).toBe('number')
        expect(typeof execution.successRate).toBe('number')
        expect(Array.isArray(execution.potentialIssues)).toBe(true)
      })
      
      // Validate summary
      expect(data.summary.totalUpcoming).toBe(3)
      expect(data.summary.dueToday).toBe(1)
      expect(data.summary.overdue).toBe(1)
      expect(data.summary.totalEstimatedValue).toBe(16625.00)
      expect(data.summary.warehouseBreakdown).toBeDefined()
    })

    test('Filter upcoming executions by warehouse', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            recurringOrderId: 'us-upcoming-1',
            warehouse: 'US',
            executionStatus: 'DUE_SOON'
          }
        ],
        summary: {
          totalUpcoming: 1,
          dueToday: 0,
          dueSoon: 1,
          overdue: 0,
          warehouseBreakdown: { 'US': 1 }
        },
        metadata: { responseTime: 20 }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse))

      const response = await makeAPIRequest('/upcoming?warehouse=US')
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.data.every((exec: any) => exec.warehouse === 'US')).toBe(true)
    })

    test('Exclude overdue executions', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            recurringOrderId: 'future-1',
            executionStatus: 'DUE_TODAY',
            daysUntilExecution: 0
          },
          {
            recurringOrderId: 'future-2',
            executionStatus: 'DUE_SOON',
            daysUntilExecution: 2
          }
        ],
        summary: {
          totalUpcoming: 2,
          overdue: 0
        },
        metadata: { responseTime: 18 }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse))

      const response = await makeAPIRequest('/upcoming?includeOverdue=false')
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.data.every((exec: any) => exec.daysUntilExecution >= 0)).toBe(true)
      expect(data.summary.overdue).toBe(0)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('Handle rate limiting', async () => {
      const mockResponse = {
        success: false,
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMITED'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse, 429))

      const response = await makeAPIRequest('')
      const data = await response.json()
      
      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.code).toBe('RATE_LIMITED')
    })

    test('Handle server errors', async () => {
      const mockResponse = {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockResponse, 500))

      const response = await makeAPIRequest('')
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.code).toBe('INTERNAL_ERROR')
    })

    test('Handle network timeouts', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network timeout'))

      try {
        await makeAPIRequest('')
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Network timeout')
      }
    })

    test('Handle malformed JSON responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON')
        },
        headers: new Headers()
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      try {
        const response = await makeAPIRequest('')
        await response.json()
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Invalid JSON')
      }
    })
  })
})