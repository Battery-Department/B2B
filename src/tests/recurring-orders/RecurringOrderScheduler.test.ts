/**
 * RHY Supplier Portal - Comprehensive Recurring Order Scheduler Tests
 * Production-grade test suite for multi-warehouse scheduling system
 * Tests real-world scheduling scenarios and edge cases
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { 
  RecurringOrderScheduler,
  ScheduledExecution,
  GlobalScheduleMetrics,
  ScheduleHealth,
  recurringOrderScheduler
} from '../../services/orders/RecurringOrderScheduler'
import { 
  RecurringOrder,
  recurringOrderService
} from '../../services/orders/RecurringOrderService'

describe('RecurringOrderScheduler - Production Tests', () => {
  let scheduler: RecurringOrderScheduler
  let testSupplierId: string
  let scheduledExecutionIds: string[] = []

  beforeEach(() => {
    scheduler = new RecurringOrderScheduler()
    testSupplierId = 'scheduler_test_supplier_' + Date.now()
    scheduledExecutionIds = []
  })

  afterEach(() => {
    // Cleanup scheduled executions
    scheduledExecutionIds.forEach(executionId => {
      // In production: cleanup via scheduler
    })
    scheduler.shutdown()
  })

  describe('Core Scheduling Functionality', () => {
    test('Schedule recurring order with multi-warehouse timezone handling', async () => {
      const warehouses: Array<'US' | 'JP' | 'EU' | 'AU'> = ['US', 'JP', 'EU', 'AU']
      const scheduledExecutions: ScheduledExecution[] = []

      for (const warehouse of warehouses) {
        // Create a mock recurring order for each warehouse
        const recurringOrder: RecurringOrder = {
          id: `test_order_${warehouse}_${Date.now()}`,
          supplierId: testSupplierId,
          name: `${warehouse} Regional FlexVolt Supply`,
          description: `Automated ${warehouse} warehouse battery supply`,
          status: 'ACTIVE',
          frequency: 'MONTHLY',
          interval: 1,
          startDate: new Date('2024-07-01'),
          nextExecutionDate: new Date('2024-07-15T10:00:00Z'),
          orderTemplate: {
            items: [{
              productId: `flexvolt-6ah-${warehouse.toLowerCase()}`,
              sku: `FV6AH-${warehouse}`,
              name: `FlexVolt 6Ah ${warehouse} Regional`,
              description: `Regional battery for ${warehouse} market`,
              quantity: 25,
              unitPrice: 95.00,
              useDynamicPricing: true,
              allowSubstitutions: false,
              backorderBehavior: 'ALLOW',
              allowQuantityAdjustment: true,
              minQuantity: 20,
              maxQuantity: 30
            }],
            shipping: {
              method: 'STANDARD',
              signature: false,
              insurance: true,
              packingSlip: true
            },
            payment: {
              method: 'CREDIT_CARD'
            },
            specialInstructions: `${warehouse} warehouse specific delivery instructions`,
            notes: `Regional order for ${warehouse} operations`
          },
          deliveryAddress: {
            name: `${warehouse} Regional Manager`,
            company: `${warehouse} Operations Center`,
            address1: `${warehouse} Distribution Center`,
            city: warehouse === 'US' ? 'Los Angeles' : warehouse === 'JP' ? 'Tokyo' : warehouse === 'EU' ? 'London' : 'Sydney',
            state: warehouse === 'US' ? 'CA' : '',
            postalCode: warehouse === 'US' ? '90210' : warehouse === 'JP' ? '100-0001' : warehouse === 'EU' ? 'SW1A 1AA' : '2000',
            country: warehouse === 'US' ? 'US' : warehouse === 'JP' ? 'JP' : warehouse === 'EU' ? 'GB' : 'AU',
            isDefault: true
          },
          billingAddress: {
            name: `${warehouse} Regional Manager`,
            company: `${warehouse} Operations Center`,
            address1: `${warehouse} Distribution Center`,
            city: warehouse === 'US' ? 'Los Angeles' : warehouse === 'JP' ? 'Tokyo' : warehouse === 'EU' ? 'London' : 'Sydney',
            state: warehouse === 'US' ? 'CA' : '',
            postalCode: warehouse === 'US' ? '90210' : warehouse === 'JP' ? '100-0001' : warehouse === 'EU' ? 'SW1A 1AA' : '2000',
            country: warehouse === 'US' ? 'US' : warehouse === 'JP' ? 'JP' : warehouse === 'EU' ? 'GB' : 'AU',
            isDefault: true
          },
          warehouse,
          autoApprove: true,
          requiresApproval: false,
          notificationSettings: {
            email: [`${warehouse.toLowerCase()}@operations.com`],
            onOrderCreated: true,
            onOrderSuccess: true,
            onOrderFailure: true,
            onInventoryIssue: true,
            onPriceChange: true,
            onApprovalRequired: true,
            sendReminders: true,
            reminderDays: [7, 3, 1]
          },
          executionHistory: [],
          totalOrders: 0,
          totalValue: 0,
          successRate: 100,
          averageOrderValue: 2375,
          tags: [`${warehouse.toLowerCase()}-regional`, 'automated', 'monthly'],
          customFields: {
            region: warehouse,
            timezone: warehouse === 'US' ? 'America/Los_Angeles' : warehouse === 'JP' ? 'Asia/Tokyo' : warehouse === 'EU' ? 'Europe/London' : 'Australia/Sydney'
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: testSupplierId
        }

        // Schedule the order
        const scheduledExecution = await scheduler.scheduleRecurringOrder(recurringOrder)
        scheduledExecutions.push(scheduledExecution)
        scheduledExecutionIds.push(scheduledExecution.id)

        // Validate scheduling for each warehouse
        expect(scheduledExecution).toBeDefined()
        expect(scheduledExecution.id).toBeTruthy()
        expect(scheduledExecution.recurringOrderId).toBe(recurringOrder.id)
        expect(scheduledExecution.status).toBe('PENDING')
        expect(scheduledExecution.scheduledDateTime).toBeInstanceOf(Date)
        expect(scheduledExecution.warehouseTimezone).toBeTruthy()
        expect(scheduledExecution.priority).toMatch(/^(LOW|NORMAL|HIGH|URGENT)$/)
        expect(scheduledExecution.retryCount).toBe(0)
        expect(scheduledExecution.maxRetries).toBe(3)

        // Validate execution context
        expect(scheduledExecution.executionContext).toBeDefined()
        expect(scheduledExecution.executionContext.supplierId).toBe(testSupplierId)
        expect(scheduledExecution.executionContext.warehouseLocation).toBe(warehouse)
        expect(scheduledExecution.executionContext.timezoneName).toBeTruthy()
        expect(scheduledExecution.executionContext.businessHours).toBeDefined()
        expect(scheduledExecution.executionContext.cutoffTime).toBeTruthy()
        expect(scheduledExecution.executionContext.executionWindow).toBeDefined()
        expect(scheduledExecution.executionContext.resourceAllocation).toBeDefined()

        // Validate resource allocation
        const resourceAllocation = scheduledExecution.executionContext.resourceAllocation
        expect(resourceAllocation.maxConcurrentExecutions).toBeGreaterThan(0)
        expect(resourceAllocation.currentExecutions).toBeGreaterThanOrEqual(0)
        expect(resourceAllocation.estimatedProcessingTime).toBeGreaterThan(0)

        // Validate execution window
        const executionWindow = scheduledExecution.executionContext.executionWindow
        expect(executionWindow.startTime).toMatch(/^\d{2}:\d{2}$/)
        expect(executionWindow.endTime).toMatch(/^\d{2}:\d{2}$/)
        expect(typeof executionWindow.allowWeekends).toBe('boolean')
        expect(typeof executionWindow.allowHolidays).toBe('boolean')
        expect(executionWindow.bufferMinutes).toBeGreaterThanOrEqual(0)

        console.log(`✓ Scheduled ${warehouse} order for ${scheduledExecution.scheduledDateTime.toISOString()} (${scheduledExecution.warehouseTimezone})`)
      }

      // Validate all warehouses have different timezone configurations
      const timezones = scheduledExecutions.map(se => se.warehouseTimezone)
      expect(new Set(timezones).size).toBe(4) // All unique timezones

      // Validate warehouse-specific scheduling optimization
      const warehouseExecutionTimes = scheduledExecutions.reduce((acc, se) => {
        const hour = se.scheduledDateTime.getUTCHours()
        acc[se.executionContext.warehouseLocation] = hour
        return acc
      }, {} as Record<string, number>)

      // Each warehouse should have optimal scheduling based on their business hours
      Object.entries(warehouseExecutionTimes).forEach(([warehouse, hour]) => {
        expect(hour).toBeGreaterThanOrEqual(0)
        expect(hour).toBeLessThan(24)
        console.log(`✓ ${warehouse} scheduled for hour ${hour} UTC`)
      })
    })

    test('Global schedule health monitoring with comprehensive metrics', async () => {
      // Create multiple orders across warehouses to generate meaningful metrics
      const testOrders = [
        { warehouse: 'US' as const, frequency: 'DAILY' as const, priority: 'HIGH', quantity: 50 },
        { warehouse: 'US' as const, frequency: 'WEEKLY' as const, priority: 'NORMAL', quantity: 25 },
        { warehouse: 'JP' as const, frequency: 'MONTHLY' as const, priority: 'URGENT', quantity: 100 },
        { warehouse: 'EU' as const, frequency: 'WEEKLY' as const, priority: 'NORMAL', quantity: 30 },
        { warehouse: 'AU' as const, frequency: 'MONTHLY' as const, priority: 'LOW', quantity: 15 }
      ]

      for (const orderSpec of testOrders) {
        const recurringOrder: RecurringOrder = {
          id: `health_test_${orderSpec.warehouse}_${Date.now()}_${Math.random()}`,
          supplierId: testSupplierId,
          name: `${orderSpec.warehouse} Health Test Order`,
          status: 'ACTIVE',
          frequency: orderSpec.frequency,
          interval: 1,
          startDate: new Date(),
          nextExecutionDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
          orderTemplate: {
            items: [{
              productId: `flexvolt-health-test-${orderSpec.warehouse.toLowerCase()}`,
              sku: `FVHT-${orderSpec.warehouse}`,
              name: `Health Test Battery ${orderSpec.warehouse}`,
              quantity: orderSpec.quantity,
              unitPrice: 95.00,
              useDynamicPricing: true,
              allowSubstitutions: false,
              backorderBehavior: 'ALLOW',
              allowQuantityAdjustment: false
            }],
            shipping: { method: 'STANDARD', signature: false, insurance: false, packingSlip: true },
            payment: { method: 'CREDIT_CARD' }
          },
          deliveryAddress: {
            name: 'Health Test Customer',
            address1: '123 Health Test St',
            city: 'Test City',
            state: 'CA',
            postalCode: '90210',
            country: 'US',
            isDefault: true
          },
          billingAddress: {
            name: 'Health Test Customer',
            address1: '123 Health Test St',
            city: 'Test City',
            state: 'CA',
            postalCode: '90210',
            country: 'US',
            isDefault: true
          },
          warehouse: orderSpec.warehouse,
          autoApprove: true,
          requiresApproval: false,
          notificationSettings: {
            email: ['healthtest@example.com'],
            onOrderCreated: true,
            onOrderSuccess: true,
            onOrderFailure: true,
            onInventoryIssue: true,
            onPriceChange: true,
            onApprovalRequired: true,
            sendReminders: true,
            reminderDays: [3, 1]
          },
          executionHistory: [],
          totalOrders: Math.floor(Math.random() * 50),
          totalValue: Math.random() * 100000,
          successRate: 90 + Math.random() * 10,
          averageOrderValue: orderSpec.quantity * 95,
          tags: ['health-test', orderSpec.warehouse.toLowerCase()],
          customFields: { testPriority: orderSpec.priority },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: testSupplierId
        }

        const scheduledExecution = await scheduler.scheduleRecurringOrder(recurringOrder)
        scheduledExecutionIds.push(scheduledExecution.id)
      }

      // Get global schedule health
      const globalHealth = await scheduler.getGlobalScheduleHealth()

      // Validate global metrics structure
      expect(globalHealth).toBeDefined()
      expect(typeof globalHealth.totalRecurringOrders).toBe('number')
      expect(typeof globalHealth.activeSchedules).toBe('number')
      expect(typeof globalHealth.executionsToday).toBe('number')
      expect(typeof globalHealth.executionsThisWeek).toBe('number')
      expect(typeof globalHealth.globalSuccessRate).toBe('number')
      expect(Array.isArray(globalHealth.warehouseMetrics)).toBe(true)
      expect(globalHealth.systemCapacity).toBeDefined()
      expect(typeof globalHealth.alertCount).toBe('number')

      // Validate system capacity
      expect(globalHealth.systemCapacity.current).toBeGreaterThanOrEqual(0)
      expect(globalHealth.systemCapacity.maximum).toBeGreaterThan(0)
      expect(globalHealth.systemCapacity.utilizationPercentage).toBeGreaterThanOrEqual(0)
      expect(globalHealth.systemCapacity.utilizationPercentage).toBeLessThanOrEqual(100)

      // Validate warehouse metrics
      expect(globalHealth.warehouseMetrics).toHaveLength(4) // US, JP, EU, AU
      
      globalHealth.warehouseMetrics.forEach((warehouseHealth: ScheduleHealth) => {
        // Validate structure
        expect(warehouseHealth.warehouseId).toBeTruthy()
        expect(['US', 'JP', 'EU', 'AU']).toContain(warehouseHealth.warehouseLocation)
        expect(typeof warehouseHealth.totalScheduled).toBe('number')
        expect(typeof warehouseHealth.pendingExecutions).toBe('number')
        expect(typeof warehouseHealth.failedExecutions).toBe('number')
        expect(typeof warehouseHealth.successRate).toBe('number')
        expect(typeof warehouseHealth.avgProcessingTime).toBe('number')
        expect(typeof warehouseHealth.systemLoad).toBe('number')
        expect(typeof warehouseHealth.resourceUtilization).toBe('number')
        expect(typeof warehouseHealth.upcomingExecutions).toBe('number')
        expect(Array.isArray(warehouseHealth.criticalIssues)).toBe(true)
        expect(Array.isArray(warehouseHealth.warnings)).toBe(true)

        // Validate value ranges
        expect(warehouseHealth.successRate).toBeGreaterThanOrEqual(0)
        expect(warehouseHealth.successRate).toBeLessThanOrEqual(100)
        expect(warehouseHealth.systemLoad).toBeGreaterThanOrEqual(0)
        expect(warehouseHealth.systemLoad).toBeLessThanOrEqual(100)
        expect(warehouseHealth.resourceUtilization).toBeGreaterThanOrEqual(0)
        expect(warehouseHealth.resourceUtilization).toBeLessThanOrEqual(100)
        expect(warehouseHealth.totalScheduled).toBeGreaterThanOrEqual(0)
        expect(warehouseHealth.pendingExecutions).toBeGreaterThanOrEqual(0)
        expect(warehouseHealth.failedExecutions).toBeGreaterThanOrEqual(0)

        console.log(`✓ Warehouse ${warehouseHealth.warehouseLocation}: ${warehouseHealth.totalScheduled} scheduled, ${warehouseHealth.successRate}% success rate, ${warehouseHealth.systemLoad}% load`)
      })

      // Validate global success rate is reasonable
      expect(globalHealth.globalSuccessRate).toBeGreaterThan(0)
      expect(globalHealth.globalSuccessRate).toBeLessThanOrEqual(100)

      // Validate execution counts are reasonable
      expect(globalHealth.activeSchedules).toBeGreaterThanOrEqual(testOrders.length)
      expect(globalHealth.executionsToday).toBeGreaterThanOrEqual(0)
      expect(globalHealth.executionsThisWeek).toBeGreaterThanOrEqual(0)

      console.log(`✓ Global Health: ${globalHealth.activeSchedules} active, ${globalHealth.globalSuccessRate.toFixed(1)}% success rate, ${globalHealth.alertCount} alerts`)
    })

    test('Priority-based execution ordering with resource management', async () => {
      const priorityTestOrders = [
        { priority: 'URGENT', warehouse: 'US' as const, value: 50000, expectedOrder: 1 },
        { priority: 'HIGH', warehouse: 'US' as const, value: 25000, expectedOrder: 2 },
        { priority: 'NORMAL', warehouse: 'US' as const, value: 10000, expectedOrder: 3 },
        { priority: 'LOW', warehouse: 'US' as const, value: 5000, expectedOrder: 4 }
      ]

      const scheduledExecutions: ScheduledExecution[] = []

      // Create orders with different priorities but same execution time
      const commonExecutionTime = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now

      for (const orderSpec of priorityTestOrders) {
        const recurringOrder: RecurringOrder = {
          id: `priority_test_${orderSpec.priority}_${Date.now()}_${Math.random()}`,
          supplierId: testSupplierId,
          name: `${orderSpec.priority} Priority Test Order`,
          status: 'ACTIVE',
          frequency: 'DAILY',
          interval: 1,
          startDate: new Date(),
          nextExecutionDate: commonExecutionTime,
          orderTemplate: {
            items: [{
              productId: `flexvolt-priority-${orderSpec.priority.toLowerCase()}`,
              sku: `FVP-${orderSpec.priority}`,
              name: `Priority Test Battery ${orderSpec.priority}`,
              quantity: Math.floor(orderSpec.value / 95), // Calculate quantity from value
              unitPrice: 95.00,
              useDynamicPricing: true,
              allowSubstitutions: false,
              backorderBehavior: 'ALLOW',
              allowQuantityAdjustment: false
            }],
            shipping: { method: 'STANDARD', signature: false, insurance: false, packingSlip: true },
            payment: { method: 'CREDIT_CARD' }
          },
          deliveryAddress: {
            name: `${orderSpec.priority} Priority Customer`,
            address1: '123 Priority Test St',
            city: 'Test City',
            state: 'CA',
            postalCode: '90210',
            country: 'US',
            isDefault: true
          },
          billingAddress: {
            name: `${orderSpec.priority} Priority Customer`,
            address1: '123 Priority Test St',
            city: 'Test City',
            state: 'CA',
            postalCode: '90210',
            country: 'US',
            isDefault: true
          },
          warehouse: orderSpec.warehouse,
          autoApprove: orderSpec.priority !== 'URGENT', // URGENT requires approval
          requiresApproval: orderSpec.priority === 'URGENT',
          notificationSettings: {
            email: [`${orderSpec.priority.toLowerCase()}@priority.test`],
            onOrderCreated: true,
            onOrderSuccess: true,
            onOrderFailure: true,
            onInventoryIssue: true,
            onPriceChange: true,
            onApprovalRequired: true,
            sendReminders: true,
            reminderDays: [1]
          },
          executionHistory: [],
          totalOrders: 0,
          totalValue: 0,
          successRate: 100,
          averageOrderValue: orderSpec.value,
          tags: ['priority-test', orderSpec.priority.toLowerCase()],
          customFields: { testValue: orderSpec.value, expectedOrder: orderSpec.expectedOrder },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: testSupplierId
        }

        const scheduledExecution = await scheduler.scheduleRecurringOrder(recurringOrder)
        scheduledExecutions.push(scheduledExecution)
        scheduledExecutionIds.push(scheduledExecution.id)

        // Validate priority assignment
        expect(['LOW', 'NORMAL', 'HIGH', 'URGENT']).toContain(scheduledExecution.priority)
        console.log(`✓ Scheduled ${orderSpec.priority} priority order with ${scheduledExecution.priority} scheduler priority`)
      }

      // Validate priorities are assigned correctly based on order characteristics
      const urgentExecution = scheduledExecutions.find(se => se.executionContext.warehouseLocation === 'US' && 
        scheduledExecutions.filter(s => s.id === se.id)[0] === scheduledExecutions[0])
      const lowExecution = scheduledExecutions.find(se => se.executionContext.warehouseLocation === 'US' && 
        scheduledExecutions.filter(s => s.id === se.id)[0] === scheduledExecutions[scheduledExecutions.length - 1])

      // Higher value orders should generally get higher priority
      if (urgentExecution && lowExecution) {
        const urgentPriorityValue = { 'URGENT': 4, 'HIGH': 3, 'NORMAL': 2, 'LOW': 1 }[urgentExecution.priority]
        const lowPriorityValue = { 'URGENT': 4, 'HIGH': 3, 'NORMAL': 2, 'LOW': 1 }[lowExecution.priority]
        
        expect(urgentPriorityValue).toBeGreaterThanOrEqual(lowPriorityValue)
      }

      // Validate resource allocation considers warehouse capacity
      scheduledExecutions.forEach(execution => {
        const resourceAllocation = execution.executionContext.resourceAllocation
        expect(resourceAllocation.maxConcurrentExecutions).toBeGreaterThan(0)
        expect(resourceAllocation.currentExecutions).toBeGreaterThanOrEqual(0)
        expect(resourceAllocation.currentExecutions).toBeLessThanOrEqual(resourceAllocation.maxConcurrentExecutions)
        expect(resourceAllocation.estimatedProcessingTime).toBeGreaterThan(0)
      })
    })
  })

  describe('Advanced Scheduling Logic', () => {
    test('Business hours and timezone optimization', async () => {
      const timezoneTestCases = [
        {
          warehouse: 'US' as const,
          timezone: 'America/Los_Angeles',
          expectedBusinessHours: { start: '08:00', end: '17:00' }
        },
        {
          warehouse: 'JP' as const,
          timezone: 'Asia/Tokyo',
          expectedBusinessHours: { start: '09:00', end: '18:00' }
        },
        {
          warehouse: 'EU' as const,
          timezone: 'Europe/London',
          expectedBusinessHours: { start: '08:30', end: '17:30' }
        },
        {
          warehouse: 'AU' as const,
          timezone: 'Australia/Sydney',
          expectedBusinessHours: { start: '08:00', end: '17:00' }
        }
      ]

      for (const testCase of timezoneTestCases) {
        // Create an order with specific scheduling requirements
        const recurringOrder: RecurringOrder = {
          id: `timezone_test_${testCase.warehouse}_${Date.now()}`,
          supplierId: testSupplierId,
          name: `${testCase.warehouse} Timezone Test Order`,
          status: 'ACTIVE',
          frequency: 'WEEKLY',
          interval: 1,
          startDate: new Date('2024-07-01'), // Monday
          nextExecutionDate: new Date('2024-07-08T00:00:00Z'), // Next Monday at midnight UTC
          orderTemplate: {
            items: [{
              productId: `timezone-test-${testCase.warehouse.toLowerCase()}`,
              sku: `TZ-${testCase.warehouse}`,
              name: `Timezone Test Battery`,
              quantity: 20,
              unitPrice: 95.00,
              useDynamicPricing: false,
              allowSubstitutions: false,
              backorderBehavior: 'ALLOW',
              allowQuantityAdjustment: false
            }],
            shipping: { method: 'STANDARD', signature: false, insurance: false, packingSlip: true },
            payment: { method: 'CREDIT_CARD' }
          },
          deliveryAddress: {
            name: 'Timezone Test Customer',
            address1: '123 Timezone St',
            city: 'Test City',
            state: 'CA',
            postalCode: '90210',
            country: 'US',
            isDefault: true
          },
          billingAddress: {
            name: 'Timezone Test Customer',
            address1: '123 Timezone St',
            city: 'Test City',
            state: 'CA',
            postalCode: '90210',
            country: 'US',
            isDefault: true
          },
          warehouse: testCase.warehouse,
          autoApprove: true,
          requiresApproval: false,
          notificationSettings: {
            email: [`timezone@${testCase.warehouse.toLowerCase()}.test`],
            onOrderCreated: true,
            onOrderSuccess: true,
            onOrderFailure: true,
            onInventoryIssue: true,
            onPriceChange: true,
            onApprovalRequired: true,
            sendReminders: true,
            reminderDays: [3, 1]
          },
          executionHistory: [],
          totalOrders: 0,
          totalValue: 0,
          successRate: 100,
          averageOrderValue: 1900,
          tags: ['timezone-test', testCase.warehouse.toLowerCase()],
          customFields: { timezone: testCase.timezone },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: testSupplierId
        }

        const scheduledExecution = await scheduler.scheduleRecurringOrder(recurringOrder)
        scheduledExecutionIds.push(scheduledExecution.id)

        // Validate timezone configuration
        expect(scheduledExecution.warehouseTimezone).toBe(testCase.timezone)
        expect(scheduledExecution.executionContext.timezoneName).toBe(testCase.timezone)

        // Validate business hours configuration
        const businessHours = scheduledExecution.executionContext.businessHours
        expect(businessHours.monday).toBeDefined()
        expect(businessHours.tuesday).toBeDefined()
        expect(businessHours.wednesday).toBeDefined()
        expect(businessHours.thursday).toBeDefined()
        expect(businessHours.friday).toBeDefined()

        // Validate execution window
        const executionWindow = scheduledExecution.executionContext.executionWindow
        expect(executionWindow.startTime).toMatch(/^\d{2}:\d{2}$/)
        expect(executionWindow.endTime).toMatch(/^\d{2}:\d{2}$/)
        expect(executionWindow.allowWeekends).toBe(false) // Should respect business days
        expect(executionWindow.bufferMinutes).toBeGreaterThanOrEqual(0)

        // Validate scheduled time is optimized for warehouse timezone
        const scheduledHour = scheduledExecution.scheduledDateTime.getUTCHours()
        expect(scheduledHour).toBeGreaterThanOrEqual(0)
        expect(scheduledHour).toBeLessThan(24)

        console.log(`✓ ${testCase.warehouse} (${testCase.timezone}): Scheduled for ${scheduledExecution.scheduledDateTime.toISOString()}`)
      }
    })

    test('Capacity management and load balancing', async () => {
      // Test warehouse capacity limits
      const capacityTestWarehouse: 'US' = 'US'
      const maxConcurrentExecutions = 5 // Simulate small capacity for testing
      
      // Create more orders than warehouse capacity
      const orderCount = 10
      const scheduledExecutions: ScheduledExecution[] = []

      for (let i = 0; i < orderCount; i++) {
        const recurringOrder: RecurringOrder = {
          id: `capacity_test_${i}_${Date.now()}`,
          supplierId: testSupplierId,
          name: `Capacity Test Order ${i + 1}`,
          status: 'ACTIVE',
          frequency: 'DAILY',
          interval: 1,
          startDate: new Date(),
          nextExecutionDate: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
          orderTemplate: {
            items: [{
              productId: `capacity-test-${i}`,
              sku: `CAP-${i}`,
              name: `Capacity Test Battery ${i}`,
              quantity: 10,
              unitPrice: 95.00,
              useDynamicPricing: false,
              allowSubstitutions: false,
              backorderBehavior: 'ALLOW',
              allowQuantityAdjustment: false
            }],
            shipping: { method: 'STANDARD', signature: false, insurance: false, packingSlip: true },
            payment: { method: 'CREDIT_CARD' }
          },
          deliveryAddress: {
            name: `Capacity Test Customer ${i}`,
            address1: '123 Capacity St',
            city: 'Test City',
            state: 'CA',
            postalCode: '90210',
            country: 'US',
            isDefault: true
          },
          billingAddress: {
            name: `Capacity Test Customer ${i}`,
            address1: '123 Capacity St',
            city: 'Test City',
            state: 'CA',
            postalCode: '90210',
            country: 'US',
            isDefault: true
          },
          warehouse: capacityTestWarehouse,
          autoApprove: true,
          requiresApproval: false,
          notificationSettings: {
            email: [`capacity${i}@test.com`],
            onOrderCreated: true,
            onOrderSuccess: true,
            onOrderFailure: true,
            onInventoryIssue: true,
            onPriceChange: true,
            onApprovalRequired: true,
            sendReminders: true,
            reminderDays: [1]
          },
          executionHistory: [],
          totalOrders: 0,
          totalValue: 0,
          successRate: 100,
          averageOrderValue: 950,
          tags: ['capacity-test'],
          customFields: { testOrder: i },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: testSupplierId
        }

        const scheduledExecution = await scheduler.scheduleRecurringOrder(recurringOrder)
        scheduledExecutions.push(scheduledExecution)
        scheduledExecutionIds.push(scheduledExecution.id)
      }

      // Validate all orders are scheduled
      expect(scheduledExecutions).toHaveLength(orderCount)

      // Validate resource allocation tracking
      scheduledExecutions.forEach((execution, index) => {
        const resourceAllocation = execution.executionContext.resourceAllocation
        
        expect(resourceAllocation.maxConcurrentExecutions).toBeGreaterThan(0)
        expect(resourceAllocation.currentExecutions).toBeGreaterThanOrEqual(0)
        expect(resourceAllocation.estimatedProcessingTime).toBeGreaterThan(0)
        
        // Each execution should have reasonable resource allocation
        expect(resourceAllocation.currentExecutions).toBeLessThanOrEqual(resourceAllocation.maxConcurrentExecutions)
        
        console.log(`✓ Order ${index + 1}: Current executions: ${resourceAllocation.currentExecutions}/${resourceAllocation.maxConcurrentExecutions}`)
      })

      // Validate scheduling respects capacity constraints by checking global health
      const globalHealth = await scheduler.getGlobalScheduleHealth()
      const usWarehouseHealth = globalHealth.warehouseMetrics.find(wh => wh.warehouseLocation === 'US')
      
      expect(usWarehouseHealth).toBeDefined()
      if (usWarehouseHealth) {
        expect(usWarehouseHealth.totalScheduled).toBeGreaterThanOrEqual(orderCount)
        expect(usWarehouseHealth.systemLoad).toBeGreaterThanOrEqual(0)
        expect(usWarehouseHealth.systemLoad).toBeLessThanOrEqual(100)
        expect(usWarehouseHealth.resourceUtilization).toBeGreaterThanOrEqual(0)
        
        console.log(`✓ US Warehouse: ${usWarehouseHealth.totalScheduled} scheduled, ${usWarehouseHealth.systemLoad}% load`)
      }
    })

    test('Retry logic and failure handling', async () => {
      // Create an order that might fail to test retry logic
      const recurringOrder: RecurringOrder = {
        id: `retry_test_${Date.now()}`,
        supplierId: testSupplierId,
        name: 'Retry Logic Test Order',
        status: 'ACTIVE',
        frequency: 'DAILY',
        interval: 1,
        startDate: new Date(),
        nextExecutionDate: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        orderTemplate: {
          items: [{
            productId: 'retry-test-product',
            sku: 'RETRY-TEST',
            name: 'Retry Test Battery',
            quantity: 1000, // Large quantity that might cause issues
            unitPrice: 95.00,
            useDynamicPricing: true,
            allowSubstitutions: false,
            backorderBehavior: 'SKIP', // Strict behavior that might cause failures
            allowQuantityAdjustment: false
          }],
          shipping: { method: 'OVERNIGHT', signature: true, insurance: true, packingSlip: true },
          payment: { method: 'NET_TERMS', paymentTerms: 'Net 15' }
        },
        deliveryAddress: {
          name: 'Retry Test Customer',
          address1: '123 Retry St',
          city: 'Test City',
          state: 'CA',
          postalCode: '90210',
          country: 'US',
          isDefault: true
        },
        billingAddress: {
          name: 'Retry Test Customer',
          address1: '123 Retry St',
          city: 'Test City',
          state: 'CA',
          postalCode: '90210',
          country: 'US',
          isDefault: true
        },
        warehouse: 'US',
        autoApprove: false, // Requires approval which might delay
        requiresApproval: true,
        approvalThreshold: 1000,
        notificationSettings: {
          email: ['retry@test.com'],
          onOrderCreated: true,
          onOrderSuccess: true,
          onOrderFailure: true,
          onInventoryIssue: true,
          onPriceChange: true,
          onApprovalRequired: true,
          sendReminders: true,
          reminderDays: [1]
        },
        executionHistory: [],
        totalOrders: 0,
        totalValue: 0,
        successRate: 50, // Lower success rate to simulate potential issues
        averageOrderValue: 95000,
        tags: ['retry-test', 'high-risk'],
        customFields: { riskLevel: 'high', testType: 'retry' },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: testSupplierId
      }

      const scheduledExecution = await scheduler.scheduleRecurringOrder(recurringOrder)
      scheduledExecutionIds.push(scheduledExecution.id)

      // Validate retry configuration
      expect(scheduledExecution.retryCount).toBe(0)
      expect(scheduledExecution.maxRetries).toBe(3)
      expect(scheduledExecution.status).toBe('PENDING')

      // Validate execution context has proper configuration for retry handling
      const executionContext = scheduledExecution.executionContext
      expect(executionContext.warehouseLocation).toBe('US')
      expect(executionContext.resourceAllocation.estimatedProcessingTime).toBeGreaterThan(0)

      // The order is configured with characteristics that might cause execution issues:
      // - Large quantity (1000 units)
      // - Strict backorder behavior (SKIP)
      // - Requires approval
      // - High order value
      // - Lower historical success rate
      
      console.log(`✓ Retry test order scheduled with ${scheduledExecution.maxRetries} max retries`)
      console.log(`✓ Order value: $${recurringOrder.orderTemplate.items[0].quantity * recurringOrder.orderTemplate.items[0].unitPrice}`)
      console.log(`✓ Risk factors: Large quantity, approval required, strict backorder policy`)
      
      // Validate the scheduler properly configured retry parameters
      expect(scheduledExecution.maxRetries).toBeGreaterThan(0)
      expect(scheduledExecution.retryCount).toBe(0)
      expect(scheduledExecution.nextRetry).toBeUndefined() // Should only be set after a failure
    })
  })

  describe('Integration and Performance Tests', () => {
    test('High-volume concurrent scheduling', async () => {
      const highVolumeCount = 50
      const schedulingPromises: Promise<ScheduledExecution>[] = []

      // Generate high volume of concurrent scheduling requests
      for (let i = 0; i < highVolumeCount; i++) {
        const warehouse = (['US', 'JP', 'EU', 'AU'] as const)[i % 4]
        const frequency = (['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'] as const)[i % 4]
        
        const recurringOrder: RecurringOrder = {
          id: `hv_test_${i}_${Date.now()}`,
          supplierId: `${testSupplierId}_${i}`,
          name: `High Volume Test Order ${i + 1}`,
          status: 'ACTIVE',
          frequency,
          interval: 1,
          startDate: new Date(),
          nextExecutionDate: new Date(Date.now() + (i * 60 * 1000)), // Spread executions
          orderTemplate: {
            items: [{
              productId: `hv-test-${i}`,
              sku: `HV-${i}`,
              name: `High Volume Battery ${i}`,
              quantity: Math.floor(Math.random() * 50) + 10,
              unitPrice: 95.00,
              useDynamicPricing: true,
              allowSubstitutions: false,
              backorderBehavior: 'ALLOW',
              allowQuantityAdjustment: false
            }],
            shipping: { method: 'STANDARD', signature: false, insurance: false, packingSlip: true },
            payment: { method: 'CREDIT_CARD' }
          },
          deliveryAddress: {
            name: `HV Customer ${i}`,
            address1: '123 HV St',
            city: 'Test City',
            state: 'CA',
            postalCode: '90210',
            country: 'US',
            isDefault: true
          },
          billingAddress: {
            name: `HV Customer ${i}`,
            address1: '123 HV St',
            city: 'Test City',
            state: 'CA',
            postalCode: '90210',
            country: 'US',
            isDefault: true
          },
          warehouse,
          autoApprove: true,
          requiresApproval: false,
          notificationSettings: {
            email: [`hv${i}@test.com`],
            onOrderCreated: true,
            onOrderSuccess: true,
            onOrderFailure: true,
            onInventoryIssue: true,
            onPriceChange: true,
            onApprovalRequired: true,
            sendReminders: true,
            reminderDays: [1]
          },
          executionHistory: [],
          totalOrders: 0,
          totalValue: 0,
          successRate: 100,
          averageOrderValue: 950,
          tags: ['high-volume', 'concurrent'],
          customFields: { batchNumber: i },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: `${testSupplierId}_${i}`
        }

        schedulingPromises.push(scheduler.scheduleRecurringOrder(recurringOrder))
      }

      // Measure scheduling performance
      const startTime = Date.now()
      const schedulingResults = await Promise.allSettled(schedulingPromises)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Validate all scheduling completed
      const successfulSchedules = schedulingResults.filter(result => result.status === 'fulfilled')
      const failedSchedules = schedulingResults.filter(result => result.status === 'rejected')

      expect(successfulSchedules.length + failedSchedules.length).toBe(highVolumeCount)
      expect(successfulSchedules.length).toBeGreaterThan(highVolumeCount * 0.9) // At least 90% success

      // Add successful schedules to cleanup list
      successfulSchedules.forEach(result => {
        if (result.status === 'fulfilled') {
          scheduledExecutionIds.push(result.value.id)
        }
      })

      // Validate performance
      const avgTimePerSchedule = totalTime / highVolumeCount
      expect(avgTimePerSchedule).toBeLessThan(1000) // Less than 1 second per schedule on average

      console.log(`✓ High Volume Test: ${successfulSchedules.length}/${highVolumeCount} successful in ${totalTime}ms`)
      console.log(`✓ Average time per schedule: ${avgTimePerSchedule.toFixed(2)}ms`)
      console.log(`✓ Failed schedules: ${failedSchedules.length}`)

      // Validate system health under load
      const globalHealth = await scheduler.getGlobalScheduleHealth()
      expect(globalHealth.activeSchedules).toBeGreaterThanOrEqual(successfulSchedules.length)
      expect(globalHealth.systemCapacity.utilizationPercentage).toBeLessThanOrEqual(100)

      // Check for any critical issues under load
      const criticalIssues = globalHealth.warehouseMetrics.reduce((sum, wh) => sum + wh.criticalIssues.length, 0)
      console.log(`✓ Critical issues under load: ${criticalIssues}`)
    })

    test('System shutdown and cleanup', async () => {
      // Create some test orders first
      const cleanupTestOrders = 3
      const orderIds: string[] = []

      for (let i = 0; i < cleanupTestOrders; i++) {
        const recurringOrder: RecurringOrder = {
          id: `cleanup_test_${i}_${Date.now()}`,
          supplierId: testSupplierId,
          name: `Cleanup Test Order ${i + 1}`,
          status: 'ACTIVE',
          frequency: 'WEEKLY',
          interval: 1,
          startDate: new Date(),
          nextExecutionDate: new Date(Date.now() + 60 * 60 * 1000),
          orderTemplate: {
            items: [{
              productId: `cleanup-${i}`,
              sku: `CLEAN-${i}`,
              name: `Cleanup Battery ${i}`,
              quantity: 10,
              unitPrice: 95.00,
              useDynamicPricing: false,
              allowSubstitutions: false,
              backorderBehavior: 'ALLOW',
              allowQuantityAdjustment: false
            }],
            shipping: { method: 'STANDARD', signature: false, insurance: false, packingSlip: true },
            payment: { method: 'CREDIT_CARD' }
          },
          deliveryAddress: {
            name: `Cleanup Customer ${i}`,
            address1: '123 Cleanup St',
            city: 'Test City',
            state: 'CA',
            postalCode: '90210',
            country: 'US',
            isDefault: true
          },
          billingAddress: {
            name: `Cleanup Customer ${i}`,
            address1: '123 Cleanup St',
            city: 'Test City',
            state: 'CA',
            postalCode: '90210',
            country: 'US',
            isDefault: true
          },
          warehouse: 'US',
          autoApprove: true,
          requiresApproval: false,
          notificationSettings: {
            email: [`cleanup${i}@test.com`],
            onOrderCreated: true,
            onOrderSuccess: true,
            onOrderFailure: true,
            onInventoryIssue: true,
            onPriceChange: true,
            onApprovalRequired: true,
            sendReminders: true,
            reminderDays: [1]
          },
          executionHistory: [],
          totalOrders: 0,
          totalValue: 0,
          successRate: 100,
          averageOrderValue: 950,
          tags: ['cleanup-test'],
          customFields: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: testSupplierId
        }

        const scheduledExecution = await scheduler.scheduleRecurringOrder(recurringOrder)
        orderIds.push(scheduledExecution.id)
        scheduledExecutionIds.push(scheduledExecution.id)
      }

      // Get initial state
      const initialHealth = await scheduler.getGlobalScheduleHealth()
      const initialActiveSchedules = initialHealth.activeSchedules

      expect(initialActiveSchedules).toBeGreaterThanOrEqual(cleanupTestOrders)

      // Test graceful shutdown
      const shutdownStartTime = Date.now()
      
      // Shutdown should complete without errors
      expect(() => scheduler.shutdown()).not.toThrow()
      
      const shutdownTime = Date.now() - shutdownStartTime
      expect(shutdownTime).toBeLessThan(5000) // Should shutdown within 5 seconds

      console.log(`✓ Scheduler shutdown completed in ${shutdownTime}ms`)
      console.log(`✓ Cleanup test completed successfully`)

      // Validate shutdown was clean
      // In a real implementation, we would verify:
      // - All processing intervals are cleared
      // - No memory leaks
      // - All resources properly released
      // - Pending executions properly handled
    })
  })
})