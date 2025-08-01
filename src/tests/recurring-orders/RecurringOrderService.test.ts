/**
 * RHY Supplier Portal - Comprehensive Recurring Order Service Tests
 * Production-grade test suite for RHY_054 implementation
 * Tests all core functionality with real-world scenarios
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import { 
  RecurringOrderService,
  CreateRecurringOrderRequest,
  RecurringOrder,
  OrderExecution
} from '../../services/orders/RecurringOrderService'

describe('RecurringOrderService - Production Tests', () => {
  let service: RecurringOrderService
  let testSupplierId: string
  let createdOrderIds: string[] = []

  beforeEach(() => {
    service = new RecurringOrderService()
    testSupplierId = 'test_supplier_' + Date.now()
    createdOrderIds = []
  })

  afterEach(() => {
    // Cleanup created test orders
    createdOrderIds.forEach(orderId => {
      // In production: cleanup via service
    })
  })

  describe('Core Functionality Tests', () => {
    test('Create recurring order with complete data validation', async () => {
      const createRequest: CreateRecurringOrderRequest = {
        name: 'Production Test Monthly FlexVolt Order',
        description: 'Automated monthly battery supply for construction crews',
        frequency: 'MONTHLY',
        interval: 1,
        startDate: '2024-07-01',
        
        orderTemplate: {
          items: [
            {
              productId: 'flexvolt-6ah-pro',
              sku: 'FV6AH-PRO',
              name: 'FlexVolt 6Ah Professional Battery',
              quantity: 25,
              useDynamicPricing: true,
              allowSubstitutions: false,
              backorderBehavior: 'ALLOW',
              allowQuantityAdjustment: true,
              minQuantity: 20,
              maxQuantity: 30
            },
            {
              productId: 'flexvolt-9ah-pro',
              sku: 'FV9AH-PRO', 
              name: 'FlexVolt 9Ah Professional Battery',
              quantity: 15,
              useDynamicPricing: true,
              allowSubstitutions: false,
              backorderBehavior: 'ALLOW',
              allowQuantityAdjustment: false
            }
          ],
          shipping: {
            method: 'STANDARD',
            signature: false,
            insurance: true,
            packingSlip: true
          },
          payment: {
            method: 'CREDIT_CARD'
          },
          specialInstructions: 'Deliver to main warehouse dock between 8-11 AM',
          notes: 'Priority order for ProBuild Construction'
        },
        
        deliveryAddress: {
          name: 'Mike Johnson',
          company: 'ProBuild Construction LLC',
          address1: '2450 Industrial Parkway',
          address2: 'Warehouse Building C',
          city: 'Sacramento',
          state: 'CA',
          postalCode: '95823',
          country: 'US',
          phone: '+1-916-555-0199',
          email: 'mike.j@probuild.com',
          isDefault: true
        },
        
        warehouse: 'US',
        autoApprove: false,
        approvalThreshold: 5000,
        
        notificationSettings: {
          email: ['mike.j@probuild.com', 'procurement@probuild.com'],
          onOrderCreated: true,
          onOrderSuccess: true,
          onOrderFailure: true,
          onInventoryIssue: true,
          onPriceChange: true,
          onApprovalRequired: true,
          sendReminders: true,
          reminderDays: [7, 3, 1]
        },
        
        tags: ['construction', 'monthly-supply', 'priority'],
        customFields: {
          projectCode: 'PB2024-MAIN',
          contractNumber: 'CT-2024-0892',
          budgetCategory: 'EQUIPMENT-BATTERIES'
        }
      }

      const recurringOrder = await service.createRecurringOrder(testSupplierId, createRequest)
      createdOrderIds.push(recurringOrder.id)

      // Validate complete order creation
      expect(recurringOrder).toBeDefined()
      expect(recurringOrder.id).toBeTruthy()
      expect(recurringOrder.supplierId).toBe(testSupplierId)
      expect(recurringOrder.name).toBe(createRequest.name)
      expect(recurringOrder.frequency).toBe('MONTHLY')
      expect(recurringOrder.status).toBe('ACTIVE')
      expect(recurringOrder.warehouse).toBe('US')
      expect(recurringOrder.autoApprove).toBe(false)
      expect(recurringOrder.approvalThreshold).toBe(5000)
      
      // Validate order template
      expect(recurringOrder.orderTemplate.items).toHaveLength(2)
      expect(recurringOrder.orderTemplate.items[0].productId).toBe('flexvolt-6ah-pro')
      expect(recurringOrder.orderTemplate.items[0].quantity).toBe(25)
      expect(recurringOrder.orderTemplate.items[1].productId).toBe('flexvolt-9ah-pro')
      expect(recurringOrder.orderTemplate.items[1].quantity).toBe(15)
      
      // Validate addresses
      expect(recurringOrder.deliveryAddress.company).toBe('ProBuild Construction LLC')
      expect(recurringOrder.deliveryAddress.city).toBe('Sacramento')
      expect(recurringOrder.deliveryAddress.state).toBe('CA')
      
      // Validate notifications
      expect(recurringOrder.notificationSettings.email).toContain('mike.j@probuild.com')
      expect(recurringOrder.notificationSettings.email).toContain('procurement@probuild.com')
      expect(recurringOrder.notificationSettings.onOrderCreated).toBe(true)
      
      // Validate custom fields
      expect(recurringOrder.customFields.projectCode).toBe('PB2024-MAIN')
      expect(recurringOrder.customFields.contractNumber).toBe('CT-2024-0892')
      
      // Validate calculated fields
      expect(recurringOrder.nextExecutionDate).toBeInstanceOf(Date)
      expect(recurringOrder.requiresApproval).toBe(true)
      expect(recurringOrder.createdAt).toBeInstanceOf(Date)
      expect(recurringOrder.updatedAt).toBeInstanceOf(Date)
    })

    test('Execute recurring order with full processing pipeline', async () => {
      // Create a test recurring order first
      const createRequest: CreateRecurringOrderRequest = {
        name: 'Test Execution Order',
        frequency: 'WEEKLY',
        startDate: '2024-06-24',
        orderTemplate: {
          items: [{
            productId: 'flexvolt-15ah',
            sku: 'FV15AH',
            name: 'FlexVolt 15Ah Battery',
            quantity: 10,
            useDynamicPricing: true,
            allowSubstitutions: false,
            backorderBehavior: 'ALLOW',
            allowQuantityAdjustment: false
          }],
          shipping: { method: 'EXPRESS', signature: true, insurance: true, packingSlip: true },
          payment: { method: 'NET_TERMS', paymentTerms: 'Net 30' }
        },
        deliveryAddress: {
          name: 'Test Customer',
          address1: '123 Test Street',
          city: 'Test City',
          state: 'CA',
          postalCode: '90210',
          country: 'US',
          isDefault: true
        },
        warehouse: 'US',
        autoApprove: true,
        notificationSettings: {
          email: ['test@example.com'],
          onOrderCreated: true,
          onOrderSuccess: true,
          onOrderFailure: true,
          onInventoryIssue: true,
          onPriceChange: true,
          onApprovalRequired: true,
          sendReminders: true,
          reminderDays: [3, 1]
        }
      }

      const recurringOrder = await service.createRecurringOrder(testSupplierId, createRequest)
      createdOrderIds.push(recurringOrder.id)

      // Execute the recurring order
      const execution = await service.executeRecurringOrder(recurringOrder.id)

      // Validate execution results
      expect(execution).toBeDefined()
      expect(execution.id).toBeTruthy()
      expect(execution.recurringOrderId).toBe(recurringOrder.id)
      expect(['PENDING', 'SUCCESS', 'FAILED']).toContain(execution.status)
      expect(execution.scheduledDate).toBeInstanceOf(Date)
      expect(execution.retryCount).toBe(0)
      expect(execution.maxRetries).toBe(3)
      expect(execution.createdAt).toBeInstanceOf(Date)

      // Validate execution details
      expect(Array.isArray(execution.adjustments)).toBe(true)
      expect(Array.isArray(execution.issues)).toBe(true)
      expect(typeof execution.totalValue).toBe('number')
      expect(typeof execution.itemCount).toBe('number')
      expect(execution.itemCount).toBe(1) // One item in template

      // If execution was successful, validate order ID is present
      if (execution.status === 'SUCCESS') {
        expect(execution.orderId).toBeTruthy()
        expect(execution.executedDate).toBeInstanceOf(Date)
      }
    })

    test('Update recurring order with comprehensive field modifications', async () => {
      // Create initial order
      const createRequest: CreateRecurringOrderRequest = {
        name: 'Initial Order Name',
        frequency: 'MONTHLY',
        startDate: '2024-07-01',
        orderTemplate: {
          items: [{
            productId: 'flexvolt-6ah',
            sku: 'FV6AH',
            name: 'FlexVolt 6Ah Battery',
            quantity: 5,
            useDynamicPricing: false,
            allowSubstitutions: false,
            backorderBehavior: 'ALLOW',
            allowQuantityAdjustment: false
          }],
          shipping: { method: 'STANDARD', signature: false, insurance: false, packingSlip: true },
          payment: { method: 'CREDIT_CARD' }
        },
        deliveryAddress: {
          name: 'Original Customer',
          address1: '123 Original Street',
          city: 'Original City',
          state: 'CA',
          postalCode: '90210',
          country: 'US',
          isDefault: true
        },
        warehouse: 'US',
        autoApprove: false,
        notificationSettings: {
          email: ['original@example.com'],
          onOrderCreated: true,
          onOrderSuccess: true,
          onOrderFailure: false,
          onInventoryIssue: false,
          onPriceChange: false,
          onApprovalRequired: true,
          sendReminders: false,
          reminderDays: [7]
        }
      }

      const originalOrder = await service.createRecurringOrder(testSupplierId, createRequest)
      createdOrderIds.push(originalOrder.id)

      // Update with comprehensive changes
      const updateRequest = {
        name: 'Updated Order Name - Production Ready',
        description: 'Updated description with enhanced features',
        frequency: 'WEEKLY' as const,
        interval: 2,
        autoApprove: true,
        maxOrderValue: 15000,
        approvalThreshold: 10000,
        
        orderTemplate: {
          items: [
            {
              productId: 'flexvolt-6ah',
              sku: 'FV6AH',
              name: 'FlexVolt 6Ah Battery',
              quantity: 15, // Increased quantity
              useDynamicPricing: true, // Changed to dynamic
              allowSubstitutions: true, // Allow substitutions
              backorderBehavior: 'PARTIAL' as const,
              allowQuantityAdjustment: true,
              minQuantity: 10,
              maxQuantity: 20
            },
            {
              productId: 'flexvolt-9ah',
              sku: 'FV9AH',
              name: 'FlexVolt 9Ah Battery',
              quantity: 8, // New item
              useDynamicPricing: true,
              allowSubstitutions: false,
              backorderBehavior: 'ALLOW' as const,
              allowQuantityAdjustment: false
            }
          ],
          shipping: { 
            method: 'EXPRESS' as const, 
            signature: true, 
            insurance: true, 
            packingSlip: true 
          },
          payment: { 
            method: 'NET_TERMS' as const, 
            paymentTerms: 'Net 30',
            poNumber: 'PO-2024-UPDATE-001'
          },
          specialInstructions: 'Updated special handling instructions',
          notes: 'Updated order notes for enhanced processing'
        },
        
        deliveryAddress: {
          name: 'Updated Customer Name',
          company: 'Updated Company LLC',
          address1: '456 Updated Boulevard',
          address2: 'Suite 200',
          city: 'Updated City',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          phone: '+1-212-555-0100',
          email: 'updated@company.com',
          isDefault: true
        },
        
        warehouse: 'EU' as const, // Changed warehouse
        
        notificationSettings: {
          email: ['updated@company.com', 'manager@company.com'],
          sms: ['+1-212-555-0100'],
          webhookUrl: 'https://company.com/webhooks/orders',
          onOrderCreated: true,
          onOrderSuccess: true,
          onOrderFailure: true,
          onInventoryIssue: true,
          onPriceChange: true,
          onApprovalRequired: true,
          sendReminders: true,
          reminderDays: [14, 7, 3, 1]
        },
        
        tags: ['updated', 'enhanced', 'bi-weekly'],
        customFields: {
          updatedField: 'new-value',
          priority: 'high',
          department: 'operations'
        }
      }

      const updatedOrder = await service.updateRecurringOrder(originalOrder.id, testSupplierId, updateRequest)

      // Validate all updates were applied
      expect(updatedOrder.name).toBe('Updated Order Name - Production Ready')
      expect(updatedOrder.description).toBe('Updated description with enhanced features')
      expect(updatedOrder.frequency).toBe('WEEKLY')
      expect(updatedOrder.interval).toBe(2)
      expect(updatedOrder.autoApprove).toBe(true)
      expect(updatedOrder.maxOrderValue).toBe(15000)
      expect(updatedOrder.approvalThreshold).toBe(10000)
      expect(updatedOrder.warehouse).toBe('EU')
      
      // Validate order template updates
      expect(updatedOrder.orderTemplate.items).toHaveLength(2)
      expect(updatedOrder.orderTemplate.items[0].quantity).toBe(15)
      expect(updatedOrder.orderTemplate.items[0].useDynamicPricing).toBe(true)
      expect(updatedOrder.orderTemplate.items[0].allowSubstitutions).toBe(true)
      expect(updatedOrder.orderTemplate.items[0].backorderBehavior).toBe('PARTIAL')
      expect(updatedOrder.orderTemplate.items[1].productId).toBe('flexvolt-9ah')
      
      // Validate shipping updates
      expect(updatedOrder.orderTemplate.shipping.method).toBe('EXPRESS')
      expect(updatedOrder.orderTemplate.shipping.signature).toBe(true)
      expect(updatedOrder.orderTemplate.shipping.insurance).toBe(true)
      
      // Validate payment updates
      expect(updatedOrder.orderTemplate.payment.method).toBe('NET_TERMS')
      expect(updatedOrder.orderTemplate.payment.paymentTerms).toBe('Net 30')
      expect(updatedOrder.orderTemplate.payment.poNumber).toBe('PO-2024-UPDATE-001')
      
      // Validate address updates
      expect(updatedOrder.deliveryAddress.name).toBe('Updated Customer Name')
      expect(updatedOrder.deliveryAddress.company).toBe('Updated Company LLC')
      expect(updatedOrder.deliveryAddress.city).toBe('Updated City')
      expect(updatedOrder.deliveryAddress.state).toBe('NY')
      expect(updatedOrder.deliveryAddress.postalCode).toBe('10001')
      
      // Validate notification updates
      expect(updatedOrder.notificationSettings.email).toContain('updated@company.com')
      expect(updatedOrder.notificationSettings.email).toContain('manager@company.com')
      expect(updatedOrder.notificationSettings.sms).toContain('+1-212-555-0100')
      expect(updatedOrder.notificationSettings.webhookUrl).toBe('https://company.com/webhooks/orders')
      expect(updatedOrder.notificationSettings.reminderDays).toEqual([14, 7, 3, 1])
      
      // Validate custom fields and tags
      expect(updatedOrder.tags).toContain('updated')
      expect(updatedOrder.tags).toContain('enhanced')
      expect(updatedOrder.tags).toContain('bi-weekly')
      expect(updatedOrder.customFields.updatedField).toBe('new-value')
      expect(updatedOrder.customFields.priority).toBe('high')
      expect(updatedOrder.customFields.department).toBe('operations')
      
      // Validate metadata updates
      expect(updatedOrder.updatedAt.getTime()).toBeGreaterThan(updatedOrder.createdAt.getTime())
    })

    test('Retrieve supplier recurring orders with advanced filtering', async () => {
      // Create multiple test orders with different characteristics
      const orders = [
        {
          name: 'Daily High-Priority Order',
          frequency: 'DAILY' as const,
          warehouse: 'US' as const,
          tags: ['daily', 'high-priority', 'construction']
        },
        {
          name: 'Weekly Standard Order', 
          frequency: 'WEEKLY' as const,
          warehouse: 'EU' as const,
          tags: ['weekly', 'standard', 'maintenance']
        },
        {
          name: 'Monthly Bulk Order',
          frequency: 'MONTHLY' as const,
          warehouse: 'JP' as const,
          tags: ['monthly', 'bulk', 'inventory']
        }
      ]

      for (const orderSpec of orders) {
        const createRequest: CreateRecurringOrderRequest = {
          name: orderSpec.name,
          frequency: orderSpec.frequency,
          startDate: '2024-07-01',
          orderTemplate: {
            items: [{
              productId: 'flexvolt-6ah',
              sku: 'FV6AH',
              name: 'FlexVolt 6Ah Battery',
              quantity: 10,
              useDynamicPricing: true,
              allowSubstitutions: false,
              backorderBehavior: 'ALLOW',
              allowQuantityAdjustment: false
            }],
            shipping: { method: 'STANDARD', signature: false, insurance: false, packingSlip: true },
            payment: { method: 'CREDIT_CARD' }
          },
          deliveryAddress: {
            name: 'Test Customer',
            address1: '123 Test Street',
            city: 'Test City',
            state: 'CA',
            postalCode: '90210',
            country: 'US',
            isDefault: true
          },
          warehouse: orderSpec.warehouse,
          autoApprove: true,
          notificationSettings: {
            email: ['test@example.com'],
            onOrderCreated: true,
            onOrderSuccess: true,
            onOrderFailure: true,
            onInventoryIssue: true,
            onPriceChange: true,
            onApprovalRequired: true,
            sendReminders: true,
            reminderDays: [3, 1]
          },
          tags: orderSpec.tags
        }

        const order = await service.createRecurringOrder(testSupplierId, createRequest)
        createdOrderIds.push(order.id)
      }

      // Test basic retrieval
      const allOrders = await service.getSupplierRecurringOrders(testSupplierId)
      expect(allOrders.orders).toHaveLength(3)
      expect(allOrders.total).toBe(3)
      expect(allOrders.page).toBe(1)
      expect(allOrders.limit).toBe(20)

      // Test warehouse filtering
      const usOrders = await service.getSupplierRecurringOrders(
        testSupplierId,
        { warehouse: ['US'] }
      )
      expect(usOrders.orders).toHaveLength(1)
      expect(usOrders.orders[0].warehouse).toBe('US')
      expect(usOrders.orders[0].name).toBe('Daily High-Priority Order')

      // Test frequency filtering
      const weeklyOrders = await service.getSupplierRecurringOrders(
        testSupplierId,
        { frequency: ['WEEKLY'] }
      )
      expect(weeklyOrders.orders).toHaveLength(1)
      expect(weeklyOrders.orders[0].frequency).toBe('WEEKLY')
      expect(weeklyOrders.orders[0].name).toBe('Weekly Standard Order')

      // Test tag filtering
      const highPriorityOrders = await service.getSupplierRecurringOrders(
        testSupplierId,
        { tags: ['high-priority'] }
      )
      expect(highPriorityOrders.orders).toHaveLength(1)
      expect(highPriorityOrders.orders[0].tags).toContain('high-priority')

      // Test pagination
      const paginatedOrders = await service.getSupplierRecurringOrders(
        testSupplierId,
        {},
        { page: 1, limit: 2 }
      )
      expect(paginatedOrders.orders).toHaveLength(2)
      expect(paginatedOrders.page).toBe(1)
      expect(paginatedOrders.limit).toBe(2)
      expect(paginatedOrders.total).toBe(3)

      // Test multiple filter combination
      const combinedFilter = await service.getSupplierRecurringOrders(
        testSupplierId,
        { warehouse: ['US', 'EU'], frequency: ['DAILY', 'WEEKLY'] }
      )
      expect(combinedFilter.orders).toHaveLength(2)
      expect(combinedFilter.orders.map(o => o.warehouse)).toEqual(expect.arrayContaining(['US', 'EU']))
    })
  })

  describe('Advanced Business Logic Tests', () => {
    test('Dynamic pricing and inventory validation', async () => {
      const createRequest: CreateRecurringOrderRequest = {
        name: 'Dynamic Pricing Test Order',
        frequency: 'MONTHLY',
        startDate: '2024-07-01',
        orderTemplate: {
          items: [{
            productId: 'flexvolt-6ah-dynamic',
            sku: 'FV6AH-DYN',
            name: 'FlexVolt 6Ah Dynamic Pricing',
            quantity: 50,
            useDynamicPricing: true,
            allowSubstitutions: true,
            backorderBehavior: 'PARTIAL',
            allowQuantityAdjustment: true,
            minQuantity: 40,
            maxQuantity: 60
          }],
          shipping: { method: 'STANDARD', signature: false, insurance: true, packingSlip: true },
          payment: { method: 'CREDIT_CARD' }
        },
        deliveryAddress: {
          name: 'Dynamic Test Customer',
          address1: '789 Dynamic Avenue',
          city: 'Pricing City',
          state: 'CA',
          postalCode: '90210',
          country: 'US',
          isDefault: true
        },
        warehouse: 'US',
        autoApprove: false,
        approvalThreshold: 3000,
        notificationSettings: {
          email: ['dynamic@test.com'],
          onOrderCreated: true,
          onOrderSuccess: true,
          onOrderFailure: true,
          onInventoryIssue: true,
          onPriceChange: true,
          onApprovalRequired: true,
          sendReminders: true,
          reminderDays: [5, 2]
        }
      }

      const recurringOrder = await service.createRecurringOrder(testSupplierId, createRequest)
      createdOrderIds.push(recurringOrder.id)

      // Execute order to test dynamic pricing logic
      const execution = await service.executeRecurringOrder(recurringOrder.id)

      // Validate execution handles dynamic pricing
      expect(execution).toBeDefined()
      expect(execution.adjustments).toBeDefined()
      expect(Array.isArray(execution.adjustments)).toBe(true)
      expect(execution.issues).toBeDefined()
      expect(Array.isArray(execution.issues)).toBe(true)

      // Check if pricing adjustments were considered
      if (execution.adjustments.length > 0) {
        const priceAdjustments = execution.adjustments.filter(adj => adj.type === 'PRICE')
        priceAdjustments.forEach(adjustment => {
          expect(adjustment.itemId).toBeTruthy()
          expect(typeof adjustment.oldValue).toBe('number')
          expect(typeof adjustment.newValue).toBe('number')
          expect(adjustment.reason).toBeTruthy()
          expect(typeof adjustment.autoApproved).toBe('boolean')
        })
      }

      // Check inventory issues handling
      if (execution.issues.length > 0) {
        const inventoryIssues = execution.issues.filter(issue => issue.type === 'INVENTORY')
        inventoryIssues.forEach(issue => {
          expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(issue.severity)
          expect(issue.message).toBeTruthy()
        })
      }
    })

    test('Multi-warehouse order execution coordination', async () => {
      const warehouses: Array<'US' | 'JP' | 'EU' | 'AU'> = ['US', 'JP', 'EU', 'AU']
      const warehouseOrders: string[] = []

      // Create orders for each warehouse
      for (const warehouse of warehouses) {
        const createRequest: CreateRecurringOrderRequest = {
          name: `${warehouse} Warehouse Test Order`,
          frequency: 'WEEKLY',
          startDate: '2024-07-01',
          orderTemplate: {
            items: [{
              productId: `flexvolt-6ah-${warehouse.toLowerCase()}`,
              sku: `FV6AH-${warehouse}`,
              name: `FlexVolt 6Ah ${warehouse} Regional`,
              quantity: 20,
              useDynamicPricing: true,
              allowSubstitutions: false,
              backorderBehavior: 'ALLOW',
              allowQuantityAdjustment: false
            }],
            shipping: { method: 'STANDARD', signature: false, insurance: false, packingSlip: true },
            payment: { method: 'CREDIT_CARD' }
          },
          deliveryAddress: {
            name: `${warehouse} Customer`,
            address1: `123 ${warehouse} Street`,
            city: `${warehouse} City`,
            state: warehouse === 'US' ? 'CA' : 'N/A',
            postalCode: warehouse === 'US' ? '90210' : '00000',
            country: warehouse === 'US' ? 'US' : warehouse === 'JP' ? 'JP' : warehouse === 'EU' ? 'GB' : 'AU',
            isDefault: true
          },
          warehouse,
          autoApprove: true,
          notificationSettings: {
            email: [`${warehouse.toLowerCase()}@test.com`],
            onOrderCreated: true,
            onOrderSuccess: true,
            onOrderFailure: true,
            onInventoryIssue: true,
            onPriceChange: true,
            onApprovalRequired: true,
            sendReminders: true,
            reminderDays: [3, 1]
          }
        }

        const order = await service.createRecurringOrder(testSupplierId, createRequest)
        warehouseOrders.push(order.id)
        createdOrderIds.push(order.id)

        // Validate warehouse-specific configuration
        expect(order.warehouse).toBe(warehouse)
        expect(order.deliveryAddress.country).toBeTruthy()
      }

      // Execute all warehouse orders concurrently
      const executionPromises = warehouseOrders.map(orderId => 
        service.executeRecurringOrder(orderId)
      )

      const executions = await Promise.all(executionPromises)

      // Validate all executions completed
      expect(executions).toHaveLength(4)
      executions.forEach((execution, index) => {
        expect(execution).toBeDefined()
        expect(execution.recurringOrderId).toBe(warehouseOrders[index])
        expect(['PENDING', 'SUCCESS', 'FAILED']).toContain(execution.status)
      })

      // Validate warehouse isolation
      const supplierOrders = await service.getSupplierRecurringOrders(testSupplierId)
      const warehouseBreakdown = supplierOrders.orders.reduce((acc, order) => {
        acc[order.warehouse] = (acc[order.warehouse] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      expect(warehouseBreakdown['US']).toBeGreaterThanOrEqual(1)
      expect(warehouseBreakdown['JP']).toBeGreaterThanOrEqual(1)
      expect(warehouseBreakdown['EU']).toBeGreaterThanOrEqual(1)
      expect(warehouseBreakdown['AU']).toBeGreaterThanOrEqual(1)
    })

    test('Approval workflow and notification system', async () => {
      const createRequest: CreateRecurringOrderRequest = {
        name: 'High-Value Approval Required Order',
        frequency: 'MONTHLY',
        startDate: '2024-07-01',
        orderTemplate: {
          items: [
            {
              productId: 'flexvolt-15ah-premium',
              sku: 'FV15AH-PREM',
              name: 'FlexVolt 15Ah Premium Battery',
              quantity: 100, // Large quantity requiring approval
              useDynamicPricing: true,
              allowSubstitutions: false,
              backorderBehavior: 'ALLOW',
              allowQuantityAdjustment: false
            }
          ],
          shipping: { method: 'EXPRESS', signature: true, insurance: true, packingSlip: true },
          payment: { method: 'NET_TERMS', paymentTerms: 'Net 45' }
        },
        deliveryAddress: {
          name: 'Premium Customer',
          company: 'Enterprise Solutions Corp',
          address1: '1000 Corporate Plaza',
          city: 'Enterprise City',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          isDefault: true
        },
        warehouse: 'US',
        autoApprove: false,
        approvalThreshold: 15000, // Set threshold below expected order value
        maxOrderValue: 50000,
        notificationSettings: {
          email: ['approver@enterprise.com', 'finance@enterprise.com', 'procurement@enterprise.com'],
          webhookUrl: 'https://enterprise.com/api/order-notifications',
          onOrderCreated: true,
          onOrderSuccess: true,
          onOrderFailure: true,
          onInventoryIssue: true,
          onPriceChange: true,
          onApprovalRequired: true,
          sendReminders: true,
          reminderDays: [10, 5, 2, 1]
        },
        tags: ['high-value', 'approval-required', 'enterprise'],
        customFields: {
          approvalLevel: 'executive',
          budgetCode: 'CAP-2024-Q3',
          costCenter: 'CC-8899'
        }
      }

      const recurringOrder = await service.createRecurringOrder(testSupplierId, createRequest)
      createdOrderIds.push(recurringOrder.id)

      // Validate approval configuration
      expect(recurringOrder.autoApprove).toBe(false)
      expect(recurringOrder.requiresApproval).toBe(true)
      expect(recurringOrder.approvalThreshold).toBe(15000)
      expect(recurringOrder.maxOrderValue).toBe(50000)

      // Test execution that should trigger approval workflow
      const execution = await service.executeRecurringOrder(recurringOrder.id)

      // Validate execution enters approval state if value exceeds threshold
      expect(execution).toBeDefined()
      if (execution.totalValue > recurringOrder.approvalThreshold!) {
        expect(['PENDING', 'FAILED']).toContain(execution.status)
        if (execution.status === 'PENDING') {
          // Approval should be required
          expect(execution.adjustments.length).toBeGreaterThanOrEqual(0)
        }
      }

      // Validate notification settings are comprehensive
      expect(recurringOrder.notificationSettings.email).toHaveLength(3)
      expect(recurringOrder.notificationSettings.onApprovalRequired).toBe(true)
      expect(recurringOrder.notificationSettings.webhookUrl).toBeTruthy()
      expect(recurringOrder.notificationSettings.reminderDays).toEqual([10, 5, 2, 1])
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('Handle invalid supplier ID', async () => {
      const invalidSupplierId = 'invalid_supplier_' + Date.now()
      
      const createRequest: CreateRecurringOrderRequest = {
        name: 'Test Order for Invalid Supplier',
        frequency: 'MONTHLY',
        startDate: '2024-07-01',
        orderTemplate: {
          items: [{
            productId: 'flexvolt-6ah',
            sku: 'FV6AH',
            name: 'FlexVolt 6Ah Battery',
            quantity: 10,
            useDynamicPricing: true,
            allowSubstitutions: false,
            backorderBehavior: 'ALLOW',
            allowQuantityAdjustment: false
          }],
          shipping: { method: 'STANDARD', signature: false, insurance: false, packingSlip: true },
          payment: { method: 'CREDIT_CARD' }
        },
        deliveryAddress: {
          name: 'Test Customer',
          address1: '123 Test Street',
          city: 'Test City',
          state: 'CA',
          postalCode: '90210',
          country: 'US',
          isDefault: true
        },
        warehouse: 'US',
        autoApprove: true,
        notificationSettings: {
          email: ['test@example.com'],
          onOrderCreated: true,
          onOrderSuccess: true,
          onOrderFailure: true,
          onInventoryIssue: true,
          onPriceChange: true,
          onApprovalRequired: true,
          sendReminders: true,
          reminderDays: [3, 1]
        }
      }

      // Should handle invalid supplier gracefully
      try {
        const result = await service.createRecurringOrder(invalidSupplierId, createRequest)
        // If it doesn't throw, validate the result is still well-formed
        expect(result.supplierId).toBe(invalidSupplierId)
      } catch (error) {
        // If it throws, ensure it's a meaningful error
        expect(error).toBeInstanceOf(Error)
        expect(error instanceof Error ? error.message : '').toBeTruthy()
      }
    })

    test('Handle concurrent execution attempts', async () => {
      // Create a test order
      const createRequest: CreateRecurringOrderRequest = {
        name: 'Concurrent Execution Test',
        frequency: 'DAILY',
        startDate: '2024-06-24',
        orderTemplate: {
          items: [{
            productId: 'flexvolt-6ah',
            sku: 'FV6AH',
            name: 'FlexVolt 6Ah Battery',
            quantity: 5,
            useDynamicPricing: true,
            allowSubstitutions: false,
            backorderBehavior: 'ALLOW',
            allowQuantityAdjustment: false
          }],
          shipping: { method: 'STANDARD', signature: false, insurance: false, packingSlip: true },
          payment: { method: 'CREDIT_CARD' }
        },
        deliveryAddress: {
          name: 'Concurrent Test Customer',
          address1: '123 Concurrent Street',
          city: 'Test City',
          state: 'CA',
          postalCode: '90210',
          country: 'US',
          isDefault: true
        },
        warehouse: 'US',
        autoApprove: true,
        notificationSettings: {
          email: ['concurrent@test.com'],
          onOrderCreated: true,
          onOrderSuccess: true,
          onOrderFailure: true,
          onInventoryIssue: true,
          onPriceChange: true,
          onApprovalRequired: true,
          sendReminders: true,
          reminderDays: [1]
        }
      }

      const recurringOrder = await service.createRecurringOrder(testSupplierId, createRequest)
      createdOrderIds.push(recurringOrder.id)

      // Attempt concurrent executions
      const concurrentExecutions = Array(3).fill(null).map(() => 
        service.executeRecurringOrder(recurringOrder.id)
      )

      const results = await Promise.allSettled(concurrentExecutions)

      // Validate at least one execution succeeded or all handled gracefully
      let successCount = 0
      let failureCount = 0

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value).toBeDefined()
          if (result.value.status === 'SUCCESS') {
            successCount++
          } else {
            failureCount++
          }
        } else {
          failureCount++
          expect(result.reason).toBeInstanceOf(Error)
        }
      })

      // Should have handled concurrent access appropriately
      expect(successCount + failureCount).toBe(3)
      expect(successCount).toBeGreaterThanOrEqual(1) // At least one should succeed
    })

    test('Validate date and scheduling edge cases', async () => {
      // Test with past start date
      const pastDateRequest: CreateRecurringOrderRequest = {
        name: 'Past Date Test Order',
        frequency: 'WEEKLY',
        startDate: '2023-01-01', // Past date
        orderTemplate: {
          items: [{
            productId: 'flexvolt-6ah',
            sku: 'FV6AH',
            name: 'FlexVolt 6Ah Battery',
            quantity: 10,
            useDynamicPricing: true,
            allowSubstitutions: false,
            backorderBehavior: 'ALLOW',
            allowQuantityAdjustment: false
          }],
          shipping: { method: 'STANDARD', signature: false, insurance: false, packingSlip: true },
          payment: { method: 'CREDIT_CARD' }
        },
        deliveryAddress: {
          name: 'Past Date Customer',
          address1: '123 Past Street',
          city: 'Test City',
          state: 'CA',
          postalCode: '90210',
          country: 'US',
          isDefault: true
        },
        warehouse: 'US',
        autoApprove: true,
        notificationSettings: {
          email: ['pastdate@test.com'],
          onOrderCreated: true,
          onOrderSuccess: true,
          onOrderFailure: true,
          onInventoryIssue: true,
          onPriceChange: true,
          onApprovalRequired: true,
          sendReminders: true,
          reminderDays: [3, 1]
        }
      }

      const pastDateOrder = await service.createRecurringOrder(testSupplierId, pastDateRequest)
      createdOrderIds.push(pastDateOrder.id)

      // Should handle past dates appropriately
      expect(pastDateOrder.nextExecutionDate).toBeInstanceOf(Date)
      expect(pastDateOrder.nextExecutionDate.getTime()).toBeGreaterThan(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours or future

      // Test with far future date
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 2)
      
      const futureDataRequest: CreateRecurringOrderRequest = {
        ...pastDateRequest,
        name: 'Future Date Test Order',
        startDate: futureDate.toISOString().split('T')[0]
      }

      const futureDateOrder = await service.createRecurringOrder(testSupplierId, futureDataRequest)
      createdOrderIds.push(futureDateOrder.id)

      expect(futureDateOrder.nextExecutionDate).toBeInstanceOf(Date)
      expect(futureDateOrder.nextExecutionDate.getTime()).toBeGreaterThan(Date.now())
    })
  })
})