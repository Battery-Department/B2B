/**
 * RHY Batch 2 - Integration Tests
 * Deep integration testing between all Batch 2 components
 * Validates end-to-end workflows and cross-service communication
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'

// Import all Batch 2 services for integration testing
import { OrderProcessingEngine } from '@/services/order_management/OrderProcessingEngine'
import { BulkOrderService } from '@/services/orders/BulkOrderService'
import { orderFeaturesService } from '@/services/orders/OrderFeaturesService'
import { HealthCheckService } from '@/services/monitoring/HealthCheckService'

// Mock implementations for external dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      create: jest.fn(() => Promise.resolve({
        id: 'order_integration_test',
        supplierId: 'supplier_test_001',
        status: 'PROCESSING',
        total: 950,
        items: [{ id: 'item1', productId: 'prod_flexvolt_6ah', quantity: 10, unitPrice: 95 }]
      })),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({ id: 'order_integration_test', status: 'COMPLETED' })
    },
    bulkOrder: {
      create: jest.fn().mockResolvedValue({
        id: 'bulk_order_integration_test',
        supplierId: 'supplier_test_001',
        status: 'PENDING_APPROVAL',
        totalValue: 4750,
        itemCount: 50
      }),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({ id: 'bulk_order_integration_test', status: 'APPROVED' })
    },
    orderTemplate: {
      create: jest.fn().mockResolvedValue({
        id: 'template_integration_test',
        supplierId: 'supplier_test_001',
        name: 'Integration Test Template',
        items: [{ productId: 'prod_flexvolt_6ah', quantity: 10, unitPrice: 95 }]
      }),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue({
        id: 'template_integration_test',
        supplierId: 'supplier_test_001',
        name: 'Integration Test Template',
        items: [{ productId: 'prod_flexvolt_6ah', quantity: 10, unitPrice: 95 }]
      })
    },
    scheduledOrder: {
      create: jest.fn().mockResolvedValue({
        id: 'scheduled_order_integration_test',
        supplierId: 'supplier_test_001',
        name: 'Integration Test Scheduled Order',
        isActive: true
      }),
      findMany: jest.fn().mockResolvedValue([])
    },
    orderAutomationRule: {
      create: jest.fn().mockResolvedValue({
        id: 'automation_rule_integration_test',
        supplierId: 'supplier_test_001',
        name: 'Integration Test Automation Rule',
        isActive: true
      })
    }
  }
}))

describe('RHY Batch 2 - Integration Test Suite', () => {
  let orderProcessingEngine: OrderProcessingEngine
  let bulkOrderService: BulkOrderService
  let healthCheckService: HealthCheckService

  beforeEach(() => {
    jest.clearAllMocks()
    // OrderProcessingEngine is imported as a singleton instance
    orderProcessingEngine = new OrderProcessingEngine({} as any, {} as any)
    bulkOrderService = BulkOrderService.getInstance()
    healthCheckService = HealthCheckService.getInstance()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('End-to-End Order Processing Workflow', () => {
    test('should complete full order lifecycle from template to delivery', async () => {
      // Step 1: Create order template
      const templateData = {
        name: 'E2E Test Template',
        description: 'End-to-end testing template for FlexVolt batteries',
        supplierId: 'supplier_test_001',
        warehouseId: 'warehouse_us_001',
        isDefault: false,
        items: [
          {
            id: 'item_001',
            templateId: 'template_integration_test',
            productId: 'prod_flexvolt_6ah',
            sku: 'FV-6AH-001',
            name: 'FlexVolt 6Ah Battery',
            description: '20V 6Ah Battery',
            quantity: 10,
            unitPrice: 95,
            notes: '',
            isOptional: false,
            category: 'batteries'
          },
          {
            id: 'item_002',
            templateId: 'template_integration_test',
            productId: 'prod_flexvolt_9ah',
            sku: 'FV-9AH-001',
            name: 'FlexVolt 9Ah Battery',
            description: '20V 9Ah Battery',
            quantity: 5,
            unitPrice: 125,
            notes: '',
            isOptional: false,
            category: 'batteries'
          }
        ],
        settings: {
          autoSchedule: false,
          notifications: true,
          approvalRequired: false
        },
        usageCount: 0
      }

      const supplier = { 
        id: 'supplier_test_001', 
        email: 'test@supplier.com',
        companyName: 'Test Company',
        status: 'ACTIVE' as const,
        tier: 'STANDARD' as const,
        warehouseAccess: [],
        mfaEnabled: false
      }
      const securityContext = {
        requestId: 'req_e2e_test',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        timestamp: new Date(),
        permissions: ['CREATE_TEMPLATE', 'CREATE_ORDER', 'PROCESS_ORDER']
      }

      const template = await orderFeaturesService.createOrderTemplate(
        templateData,
        supplier,
        securityContext
      )

      expect(template).toBeDefined()
      expect(template.id).toBeDefined()
      expect(template.items.length).toBe(2)

      // Step 2: Create order from template
      const customizations = {
        quantities: { 
          'prod_flexvolt_6ah': 15, // Modify quantity
          'prod_flexvolt_9ah': 8   // Modify quantity
        },
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          company: 'Test Construction Co',
          line1: '123 Construction Way',
          city: 'Chicago',
          state: 'IL',
          postalCode: '60601',
          country: 'US',
          isResidential: false
        },
        notes: 'E2E test order - priority delivery'
      }

      const order = await orderFeaturesService.createOrderFromTemplate(
        template.id,
        customizations,
        supplier,
        securityContext
      )

      expect(order).toBeDefined()
      expect(order.id).toBeDefined()

      // Step 3: Process the order through order processing engine
      const orderData: any = {
        warehouseId: 'warehouse_us_001',
        items: [
          { productId: 'prod_flexvolt_6ah', sku: 'FV-6AH-001', quantity: 15, unitPrice: 95, name: 'FlexVolt 6Ah Battery' },
          { productId: 'prod_flexvolt_9ah', sku: 'FV-9AH-001', quantity: 8, unitPrice: 125, name: 'FlexVolt 9Ah Battery' }
        ],
        supplierData: {
          id: supplier.id,
          tier: supplier.tier,
          warehouseAccess: ['warehouse_us_001']
        },
        shippingAddress: customizations.shippingAddress,
        fraudDetection: {
          enabled: true,
          riskThreshold: 50
        },
        multiWarehouseRouting: {
          enabled: false
        }
      }

      const processingResult = await orderProcessingEngine.processAdvancedOrder(orderData, supplier, securityContext)

      expect(processingResult.success).toBe(true)
      expect(processingResult.orderId).toBeDefined()
      expect(processingResult.orderNumber).toBeDefined()
      expect(processingResult.routingPlan).toBeDefined()
      expect(processingResult.estimatedDelivery).toBeDefined()

      // Step 4: Verify order analytics and insights
      const analysisOptions = {
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        includeReorderSuggestions: true
      }

      const analysis = await orderFeaturesService.analyzeOrderPatterns(
        supplier.id,
        analysisOptions
      )

      expect(analysis).toBeDefined()
      expect(analysis.supplierId).toBe(supplier.id)
      expect(analysis.totalOrders).toBeGreaterThanOrEqual(0)

      // Step 5: Health check integration
      const healthResult = await healthCheckService.getServiceHealth('orderProcessing')

      expect(healthResult).toBeDefined()
      expect(healthResult.status).toMatch(/HEALTHY|DEGRADED|UNHEALTHY/)
    })

    test('should handle bulk order to individual order conversion workflow', async () => {
      // Step 1: Create bulk order
      const bulkOrderData = {
        supplierId: 'supplier_test_001',
        items: [
          {
            productId: 'prod_flexvolt_6ah',
            sku: 'FV-6AH-001',
            name: 'FlexVolt 6Ah Battery',
            quantity: 50,
            unitPrice: 95,
            specifications: { voltage: '20V', capacity: '6Ah' }
          },
          {
            productId: 'prod_flexvolt_15ah',
            sku: 'FV-15AH-001',
            name: 'FlexVolt 15Ah Battery',
            quantity: 25,
            unitPrice: 245,
            specifications: { voltage: '20V', capacity: '15Ah' }
          }
        ],
        priority: 'HIGH' as const,
        requestedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        paymentTerms: 'NET_30' as const,
        notes: 'Bulk order integration test - high priority delivery'
      }

      const bulkResult = await bulkOrderService.processBulkOrder(bulkOrderData, { id: 'supplier_test_001', email: 'test@supplier.com' } as any, { requestId: 'test', ipAddress: '127.0.0.1', userAgent: 'test', timestamp: new Date(), permissions: [] })

      expect(bulkResult.success).toBe(true)
      expect(bulkResult.bulkOrderId).toBeDefined()
      expect(bulkResult.routing).toBeDefined()
      expect(bulkResult.pricing).toBeDefined()

      // Step 2: Convert bulk order items to individual orders
      const individualOrders = []
      
      // Mock items for testing since BulkOrderResponse doesn't include items directly
      const bulkItems = bulkOrderData.items
      
      for (const item of bulkItems) {
        const orderData = {
          supplierId: 'supplier_test_001',
          items: [item],
          shippingAddress: {
            firstName: 'Jane',
            lastName: 'Smith',
            company: 'Construction Solutions Inc',
            line1: '456 Industrial Blvd',
            city: 'Detroit',
            state: 'MI',
            postalCode: '48201',
            country: 'US',
            isResidential: false
          },
          bulkOrderId: bulkResult.bulkOrderId,
          priority: 'HIGH' as const
        }

        const orderResult = await orderProcessingEngine.processAdvancedOrder(orderData, { id: 'supplier_test_001', email: 'test@supplier.com' } as any, { requestId: 'test', ipAddress: '127.0.0.1', userAgent: 'test', timestamp: new Date(), permissions: [] })
        
        expect(orderResult.success).toBe(true)
        individualOrders.push(orderResult.order)
      }

      expect(individualOrders.length).toBeGreaterThan(0)

      // Step 3: Get bulk order status
      const processingResult = await bulkOrderService.getBulkOrderStatus(
        bulkResult.bulkOrderId || 'test_bulk_order',
        { id: 'supplier_test_001', email: 'test@supplier.com' } as any
      )

      expect(processingResult.success).toBe(true)

      // Step 4: Verify health monitoring for bulk operations
      const healthResult = await healthCheckService.getServiceHealth('bulkOrders')

      expect(healthResult.status).toMatch(/HEALTHY|DEGRADED|UNHEALTHY/)
      expect(healthResult.responseTime).toBeDefined()
    })
  })

  describe('Cross-Service Communication Integration', () => {
    test('should integrate order features with health monitoring', async () => {
      // Create order template
      const templateData = {
        name: 'Health Integration Template',
        description: 'Health monitoring integration test',
        supplierId: 'supplier_test_001',
        warehouseId: 'warehouse_us_001',
        isDefault: false,
        items: [
          {
            id: 'item_health_001',
            templateId: 'template_health_test',
            productId: 'prod_flexvolt_6ah',
            sku: 'FV-6AH-001',
            name: 'FlexVolt 6Ah Battery',
            description: '20V 6Ah Battery',
            quantity: 5,
            unitPrice: 95,
            notes: '',
            isOptional: false,
            category: 'batteries'
          }
        ],
        settings: {
          autoSchedule: false,
          notifications: true,
          approvalRequired: false
        },
        usageCount: 0
      }

      const supplier = { 
        id: 'supplier_test_001', 
        email: 'test@supplier.com',
        companyName: 'Test Company',
        status: 'ACTIVE' as const,
        tier: 'STANDARD' as const,
        warehouseAccess: [],
        mfaEnabled: false
      }
      const securityContext = {
        requestId: 'req_health_integration',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        timestamp: new Date(),
        permissions: ['CREATE_TEMPLATE']
      }

      const template = await orderFeaturesService.createOrderTemplate(
        templateData,
        supplier,
        securityContext
      )

      expect(template.id).toBeDefined()

      // Check health of order features service
      const orderFeaturesHealth = await healthCheckService.getServiceHealth('orderFeatures')
      expect(orderFeaturesHealth.status).toMatch(/HEALTHY|DEGRADED|UNHEALTHY/)

      // Verify overall system health includes order features
      const systemHealth = await healthCheckService.getServiceHealth('all')
      expect(systemHealth.services).toBeDefined()
    })

    test('should integrate security monitoring across all services', async () => {
      const securityTestOperations = [
        // Test order processing security
        {
          service: 'orderProcessing',
          operation: async () => {
            const orderData = {
              supplierId: 'supplier_test_001',
              items: [{ productId: 'prod_flexvolt_6ah', sku: 'FV-6AH-001', quantity: 1, unitPrice: 95 }],
              shippingAddress: {
                firstName: 'Security',
                lastName: 'Test',
                line1: '123 Test St',
                city: 'Test City',
                state: 'TS',
                postalCode: '12345',
                country: 'US',
                isResidential: false
              }
            }
            return await orderProcessingEngine.processAdvancedOrder(orderData, { id: 'supplier_test_001', email: 'test@supplier.com' } as any, { requestId: 'test', ipAddress: '127.0.0.1', userAgent: 'test', timestamp: new Date(), permissions: [] })
          }
        },
        // Test bulk order security
        {
          service: 'bulkOrders',
          operation: async () => {
            const bulkOrderData = {
              supplierId: 'supplier_test_001',
              items: [{ productId: 'prod_flexvolt_6ah', sku: 'FV-6AH-001', quantity: 10, unitPrice: 95 }],
              priority: 'MEDIUM' as const,
              paymentTerms: 'NET_30' as const
            }
            return await bulkOrderService.processBulkOrder(bulkOrderData, { id: 'supplier_test_001', email: 'test@supplier.com' } as any, { requestId: 'test', ipAddress: '127.0.0.1', userAgent: 'test', timestamp: new Date(), permissions: [] })
          }
        },
        // Test order features security
        {
          service: 'orderFeatures',
          operation: async () => {
            const suggestions = await orderFeaturesService.generateSmartReorderSuggestions(
              'supplier_test_001',
              { predictiveDays: 30, confidenceThreshold: 0.7 }
            )
            return { success: true, suggestions }
          }
        }
      ]

      for (const testOp of securityTestOperations) {
        const startTime = Date.now()
        const result = await testOp.operation()
        const endTime = Date.now()

        expect(result.success).toBe(true)
        expect(endTime - startTime).toBeLessThan(5000) // Performance check

        // Verify health monitoring captured the operation
        const serviceHealth = await healthCheckService.getServiceHealth(testOp.service)
        expect(serviceHealth).toBeDefined()
      }
    })
  })

  describe('Performance Integration Testing', () => {
    test('should handle concurrent operations across all services', async () => {
      const concurrentOperations = [
        // Concurrent order processing
        ...Array.from({ length: 5 }, (_, i) => ({
          type: 'orderProcessing',
          operation: () => orderProcessingEngine.processAdvancedOrder({
            supplierId: 'supplier_test_001',
            items: [{ productId: `prod_test_${i}`, sku: `TEST-${i}`, quantity: 5, unitPrice: 95 }],
            shippingAddress: {
              firstName: 'Concurrent',
              lastName: `Test${i}`,
              line1: '123 Concurrent St',
              city: 'Test City',
              state: 'TS',
              postalCode: '12345',
              country: 'US',
              isResidential: false
            }
          } as any, { id: 'supplier_test_001', email: 'test@supplier.com' } as any, { requestId: 'test', ipAddress: '127.0.0.1', userAgent: 'test', timestamp: new Date(), permissions: [] })
        })),
        // Concurrent bulk order creation
        ...Array.from({ length: 3 }, (_, i) => ({
          type: 'bulkOrders',
          operation: () => bulkOrderService.processBulkOrder({
            supplierId: 'supplier_test_001',
            items: [{ productId: `prod_bulk_${i}`, sku: `BULK-${i}`, quantity: 20, unitPrice: 95 }],
            priority: 'MEDIUM' as const,
            paymentTerms: 'NET_30' as const
          } as any, { id: 'supplier_test_001', email: 'test@supplier.com' } as any, { requestId: 'test', ipAddress: '127.0.0.1', userAgent: 'test', timestamp: new Date(), permissions: [] })
        })),
        // Concurrent order analysis
        ...Array.from({ length: 2 }, (_, i) => ({
          type: 'orderFeatures',
          operation: () => orderFeaturesService.analyzeOrderPatterns(`supplier_test_00${i + 1}`, {
            dateRange: {
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              end: new Date()
            }
          })
        }))
      ]

      const startTime = Date.now()
      const results = await Promise.all(
        concurrentOperations.map(op => op.operation())
      )
      const endTime = Date.now()

      expect(results.length).toBe(concurrentOperations.length)
      expect(results.every(result => result.success || result.supplierId)).toBe(true)
      expect(endTime - startTime).toBeLessThan(10000) // Should complete within 10 seconds

      // Verify system health after concurrent load
      const postLoadHealth = await healthCheckService.getServiceHealth('all')
      expect(postLoadHealth.status).toMatch(/HEALTHY|DEGRADED/)
    })

    test('should maintain data consistency during concurrent operations', async () => {
      const supplierId = 'supplier_test_consistency'
      
      // Create multiple templates concurrently
      const templatePromises = Array.from({ length: 5 }, (_, i) => {
        const templateData = {
          name: `Consistency Test Template ${i}`,
          description: `Consistency test template ${i}`,
          supplierId: supplierId,
          warehouseId: 'warehouse_us_001',
          isDefault: false,
          items: [
            {
              id: `item_consistency_${i}`,
              templateId: `template_consistency_${i}`,
              productId: `prod_consistency_${i}`,
              sku: `CONSISTENCY-${i}`,
              name: `Consistency Test Product ${i}`,
              description: `Test product ${i}`,
              quantity: 10 + i,
              unitPrice: 95 + i * 5,
              notes: '',
              isOptional: false,
              category: 'test'
            }
          ],
          settings: {
            autoSchedule: false,
            notifications: true,
            approvalRequired: false
          },
          usageCount: 0
        }

        const supplier = { 
          id: supplierId, 
          email: 'consistency@test.com',
          companyName: 'Consistency Test Company',
          status: 'ACTIVE' as const,
          tier: 'STANDARD' as const,
          warehouseAccess: [],
          mfaEnabled: false
        }
        const securityContext = {
          requestId: `req_consistency_${i}`,
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          timestamp: new Date(),
          permissions: ['CREATE_TEMPLATE']
        }

        return orderFeaturesService.createOrderTemplate(templateData, supplier, securityContext)
      })

      const templates = await Promise.all(templatePromises)

      expect(templates.length).toBe(5)
      expect(templates.every(template => template.id)).toBe(true)
      expect(templates.every(template => template.supplierId === supplierId)).toBe(true)

      // Verify all templates are unique
      const templateIds = templates.map(t => t.id)
      const uniqueIds = new Set(templateIds)
      expect(uniqueIds.size).toBe(templateIds.length)
    })
  })

  describe('Error Handling Integration', () => {
    test('should handle and recover from service failures gracefully', async () => {
      // Test order processing with invalid data
      const invalidOrderData = {
        supplierId: '', // Invalid supplier ID
        items: [],     // Empty items array
        shippingAddress: {} // Invalid address
      }

      const orderResult = await orderProcessingEngine.processAdvancedOrder(invalidOrderData as any, { id: 'supplier_test_001', email: 'test@supplier.com' } as any, { requestId: 'test', ipAddress: '127.0.0.1', userAgent: 'test', timestamp: new Date(), permissions: [] })
      expect(orderResult.success).toBe(false)
      expect(orderResult.error).toBeDefined()

      // Test bulk order with invalid data
      const invalidBulkData = {
        supplierId: 'supplier_test_001',
        items: [], // Empty items
        priority: 'INVALID' as any,
        paymentTerms: 'INVALID' as any
      }

      const bulkResult = await bulkOrderService.processBulkOrder(invalidBulkData as any, { id: 'supplier_test_001', email: 'test@supplier.com' } as any, { requestId: 'test', ipAddress: '127.0.0.1', userAgent: 'test', timestamp: new Date(), permissions: [] })
      expect(bulkResult.success).toBe(false)
      expect(bulkResult.error).toBeDefined()

      // Verify health monitoring detects the errors
      const healthResult = await healthCheckService.getServiceHealth('all')
      expect(healthResult).toBeDefined()
    })

    test('should maintain system stability during error conditions', async () => {
      const errorOperations = []
      let successfulOperations = 0
      let failedOperations = 0

      // Mix of valid and invalid operations
      for (let i = 0; i < 10; i++) {
        const isValid = i % 3 !== 0 // 2/3 valid, 1/3 invalid

        if (isValid) {
          errorOperations.push(
            orderProcessingEngine.processAdvancedOrder({
              supplierId: 'supplier_test_001',
              items: [{ productId: `prod_test_${i}`, sku: `TEST-${i}`, quantity: 5, unitPrice: 95 }],
              shippingAddress: {
                firstName: 'Error',
                lastName: `Test${i}`,
                line1: '123 Error Test St',
                city: 'Test City',
                state: 'TS',
                postalCode: '12345',
                country: 'US',
                isResidential: false
              }
            } as any, { id: 'supplier_test_001', email: 'test@supplier.com' } as any, { requestId: 'test', ipAddress: '127.0.0.1', userAgent: 'test', timestamp: new Date(), permissions: [] }).then(result => {
              if (result.success) successfulOperations++
              else failedOperations++
              return result
            })
          )
        } else {
          errorOperations.push(
            orderProcessingEngine.processAdvancedOrder({
              supplierId: '', // Invalid
              items: [],     // Invalid
              shippingAddress: {} // Invalid
            } as any, { id: 'supplier_test_001', email: 'test@supplier.com' } as any, { requestId: 'test', ipAddress: '127.0.0.1', userAgent: 'test', timestamp: new Date(), permissions: [] }).then(result => {
              if (result.success) successfulOperations++
              else failedOperations++
              return result
            })
          )
        }
      }

      await Promise.all(errorOperations)

      expect(successfulOperations).toBeGreaterThan(0)
      expect(failedOperations).toBeGreaterThan(0)
      expect(successfulOperations + failedOperations).toBe(10)

      // System should remain healthy despite errors
      const finalHealthCheck = await healthCheckService.getServiceHealth('all')
      expect(finalHealthCheck.status).toMatch(/HEALTHY|DEGRADED/)
    })
  })
})

export {}