/**
 * RHY Batch 2 - Performance Test Suite
 * Comprehensive performance testing for all Batch 2 components
 * Tests load handling, response times, memory usage, and scalability
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import '@testing-library/jest-dom'

// Import performance testing utilities
import { performance, PerformanceObserver } from 'perf_hooks'

// Import Batch 2 services for performance testing
import { OrderProcessingEngine } from '@/services/order_management/OrderProcessingEngine'
import { authService } from '@/services/auth/AuthService'
import { warehouseService } from '@/services/warehouse/WarehouseService'
import { BulkOrderService } from '@/services/orders/BulkOrderService'
import { orderFeaturesService } from '@/services/orders/OrderFeaturesService'
import { HealthCheckService } from '@/services/monitoring/HealthCheckService'

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  ORDER_PROCESSING_MAX_TIME: 2000,    // 2 seconds
  BULK_ORDER_MAX_TIME: 3000,          // 3 seconds
  HEALTH_CHECK_MAX_TIME: 500,         // 500ms
  TEMPLATE_CREATION_MAX_TIME: 1000,   // 1 second
  CONCURRENT_OPERATIONS_MAX_TIME: 5000, // 5 seconds
  MEMORY_LEAK_THRESHOLD: 100 * 1024 * 1024, // 100MB
  MAX_CPU_USAGE_PERCENT: 80,          // 80%
  MIN_THROUGHPUT_OPS_PER_SEC: 10      // 10 operations per second
}

// Test data generators for performance testing
const generateLargeOrderData = (itemCount: number) => ({
  supplierId: 'supplier_perf_test',
  items: Array.from({ length: itemCount }, (_, i) => ({
    productId: `prod_perf_${i}`,
    sku: `PERF-${String(i).padStart(6, '0')}`,
    name: `Performance Test Product ${i}`,
    quantity: Math.floor(Math.random() * 50) + 1,
    unitPrice: 95 + (Math.random() * 150),
    specifications: {
      voltage: '20V',
      capacity: ['6Ah', '9Ah', '15Ah'][i % 3],
      weight: `${(2.5 + Math.random() * 3).toFixed(1)}lbs`,
      dimensions: `${10 + i % 5}x${8 + i % 3}x${6 + i % 2}in`
    }
  })),
  shippingAddress: {
    firstName: 'Performance',
    lastName: 'Test',
    company: `Performance Test Co ${Math.floor(Math.random() * 1000)}`,
    line1: `${Math.floor(Math.random() * 9999)} Performance Blvd`,
    line2: Math.random() > 0.5 ? `Suite ${Math.floor(Math.random() * 500)}` : undefined,
    city: ['Chicago', 'Detroit', 'Milwaukee', 'Cleveland'][Math.floor(Math.random() * 4)],
    state: ['IL', 'MI', 'WI', 'OH'][Math.floor(Math.random() * 4)],
    postalCode: String(Math.floor(Math.random() * 90000) + 10000),
    country: 'US',
    phone: `+1-555-${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
    email: `perf.test.${Math.floor(Math.random() * 10000)}@example.com`,
    isResidential: Math.random() > 0.7
  },
  priority: (['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const)[Math.floor(Math.random() * 4)],
  notes: `Performance test order with ${itemCount} items - ${new Date().toISOString()}`
})

const generateBulkOrderData = (itemCount: number) => ({
  supplierId: 'supplier_bulk_perf_test',
  items: Array.from({ length: itemCount }, (_, i) => ({
    productId: `prod_bulk_perf_${i}`,
    sku: `BULK-PERF-${String(i).padStart(6, '0')}`,
    quantity: Math.floor(Math.random() * 100) + 10,
    unitPrice: 95 + (Math.random() * 150),
    specifications: {
      voltage: '20V',
      capacity: ['6Ah', '9Ah', '15Ah'][i % 3],
      bundleType: ['individual', 'kit', 'bulk'][i % 3]
    },
    customizations: {
      labeling: Math.random() > 0.5 ? 'custom' : 'standard',
      packaging: Math.random() > 0.3 ? 'retail' : 'bulk'
    },
    notes: `Bulk item ${i} - performance testing`
  })),
  priority: (['MEDIUM', 'HIGH', 'URGENT'] as const)[Math.floor(Math.random() * 3)],
  requestedDeliveryDate: new Date(Date.now() + (Math.random() * 30 + 7) * 24 * 60 * 60 * 1000).toISOString(),
  paymentTerms: (['NET_10', 'NET_15', 'NET_30', 'NET_45'] as const)[Math.floor(Math.random() * 4)],
  notes: `Performance test bulk order with ${itemCount} items - ${new Date().toISOString()}`
})

// Performance measurement utilities
class PerformanceMetrics {
  private measurements: Map<string, number[]> = new Map()
  private startTimes: Map<string, number> = new Map()

  startMeasurement(name: string): void {
    this.startTimes.set(name, performance.now())
  }

  endMeasurement(name: string): number {
    const startTime = this.startTimes.get(name)
    if (!startTime) {
      throw new Error(`No start time found for measurement: ${name}`)
    }

    const duration = performance.now() - startTime
    
    if (!this.measurements.has(name)) {
      this.measurements.set(name, [])
    }
    this.measurements.get(name)!.push(duration)

    this.startTimes.delete(name)
    return duration
  }

  getStats(name: string) {
    const measurements = this.measurements.get(name) || []
    if (measurements.length === 0) {
      return null
    }

    const sorted = [...measurements].sort((a, b) => a - b)
    return {
      count: measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      avg: measurements.reduce((sum, val) => sum + val, 0) / measurements.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    }
  }

  reset(): void {
    this.measurements.clear()
    this.startTimes.clear()
  }
}

describe('RHY Batch 2 - Performance Test Suite', () => {
  let metrics: PerformanceMetrics
  let orderProcessingEngine: OrderProcessingEngine
  let bulkOrderService: BulkOrderService
  let healthCheckService: HealthCheckService

  beforeEach(() => {
    jest.clearAllMocks()
    metrics = new PerformanceMetrics()
    orderProcessingEngine = new OrderProcessingEngine(authService, warehouseService)
    bulkOrderService = BulkOrderService.getInstance()
    healthCheckService = HealthCheckService.getInstance()
    
    // Clear performance marks and measures
    performance.clearMarks()
    performance.clearMeasures()
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
  })

  afterEach(() => {
    metrics.reset()
    jest.clearAllTimers()
  })

  describe('Order Processing Performance', () => {
    test('should process single orders within performance threshold', async () => {
      const testCases = [
        { itemCount: 1, description: 'single item order' },
        { itemCount: 5, description: 'small order' },
        { itemCount: 25, description: 'medium order' },
        { itemCount: 100, description: 'large order' }
      ]

      for (const testCase of testCases) {
        metrics.startMeasurement(`order-processing-${testCase.itemCount}`)
        
        const orderData = generateLargeOrderData(testCase.itemCount)
        const result = await orderProcessingEngine.processAdvancedOrder(
          orderData as any,
          { id: 'test-supplier', email: 'test@example.com' } as any,
          { requestId: 'test', ipAddress: '127.0.0.1', userAgent: 'test', timestamp: new Date() } as any
        )
        
        const duration = metrics.endMeasurement(`order-processing-${testCase.itemCount}`)

        expect(result.success).toBe(true)
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.ORDER_PROCESSING_MAX_TIME)
        
        console.log(`Order processing (${testCase.description}): ${duration.toFixed(2)}ms`)
      }

      // Verify no performance degradation across test cases
      const singleItemStats = metrics.getStats('order-processing-1')
      const largeItemStats = metrics.getStats('order-processing-100')
      
      expect(singleItemStats).toBeTruthy()
      expect(largeItemStats).toBeTruthy()
      
      // Large orders should not be more than 10x slower than single item orders
      if (singleItemStats && largeItemStats) {
        expect(largeItemStats.avg).toBeLessThan(singleItemStats.avg * 10)
      }
    })

    test('should handle concurrent order processing efficiently', async () => {
      const concurrentOrderCount = 20
      const itemsPerOrder = 10

      metrics.startMeasurement('concurrent-order-processing')

      const orderPromises = Array.from({ length: concurrentOrderCount }, (_, i) => {
        const orderData = generateLargeOrderData(itemsPerOrder)
        orderData.supplierId = `supplier_concurrent_${i}`
        return orderProcessingEngine.processAdvancedOrder(
          orderData as any,
          { id: `supplier_concurrent_${i}`, email: 'test@example.com' } as any,
          { requestId: 'test', ipAddress: '127.0.0.1', userAgent: 'test', timestamp: new Date() } as any
        )
      })

      const results = await Promise.all(orderPromises)
      const totalDuration = metrics.endMeasurement('concurrent-order-processing')

      expect(results.length).toBe(concurrentOrderCount)
      expect(results.every((result: any) => result.success)).toBe(true)
      expect(totalDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.CONCURRENT_OPERATIONS_MAX_TIME)

      // Calculate throughput
      const throughput = concurrentOrderCount / (totalDuration / 1000)
      expect(throughput).toBeGreaterThan(PERFORMANCE_THRESHOLDS.MIN_THROUGHPUT_OPS_PER_SEC)

      console.log(`Concurrent order processing: ${totalDuration.toFixed(2)}ms, Throughput: ${throughput.toFixed(2)} orders/sec`)
    })

    test('should maintain consistent performance under load', async () => {
      const loadTestRounds = 5
      const ordersPerRound = 10

      for (let round = 0; round < loadTestRounds; round++) {
        metrics.startMeasurement(`load-test-round-${round}`)

        const roundPromises = Array.from({ length: ordersPerRound }, () => {
          const orderData = generateLargeOrderData(Math.floor(Math.random() * 20) + 5)
          return orderProcessingEngine.processAdvancedOrder(
            orderData as any,
            { id: 'test-supplier', email: 'test@example.com' } as any,
            { requestId: 'test', ipAddress: '127.0.0.1', userAgent: 'test', timestamp: new Date() } as any
          )
        })

        const roundResults = await Promise.all(roundPromises)
        const roundDuration = metrics.endMeasurement(`load-test-round-${round}`)

        expect(roundResults.every((result: any) => result.success)).toBe(true)
        expect(roundDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.CONCURRENT_OPERATIONS_MAX_TIME)

        console.log(`Load test round ${round + 1}: ${roundDuration.toFixed(2)}ms`)
      }

      // Verify performance consistency across rounds
      const roundStats = Array.from({ length: loadTestRounds }, (_, i) => 
        metrics.getStats(`load-test-round-${i}`)
      ).filter(Boolean)

      const avgTimes = roundStats.map(stats => stats!.avg)
      const maxVariation = Math.max(...avgTimes) - Math.min(...avgTimes)
      const avgTime = avgTimes.reduce((sum, time) => sum + time, 0) / avgTimes.length

      // Performance should not vary by more than 50% across rounds
      expect(maxVariation).toBeLessThan(avgTime * 0.5)
    })
  })

  describe('Bulk Order Performance', () => {
    test('should process bulk orders within performance threshold', async () => {
      const testCases = [
        { itemCount: 10, description: 'small bulk order' },
        { itemCount: 50, description: 'medium bulk order' },
        { itemCount: 200, description: 'large bulk order' },
        { itemCount: 500, description: 'extra large bulk order' }
      ]

      for (const testCase of testCases) {
        metrics.startMeasurement(`bulk-order-${testCase.itemCount}`)
        
        const bulkOrderData = generateBulkOrderData(testCase.itemCount)
        const result = await bulkOrderService.processBulkOrder(
          bulkOrderData as any,
          { id: 'test-supplier', email: 'test@example.com' } as any,
          { requestId: 'test', ipAddress: '127.0.0.1', userAgent: 'test', timestamp: new Date() } as any
        )
        
        const duration = metrics.endMeasurement(`bulk-order-${testCase.itemCount}`)

        expect(result.success).toBe(true)
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_ORDER_MAX_TIME)
        
        console.log(`Bulk order processing (${testCase.description}): ${duration.toFixed(2)}ms`)
      }
    })

    test('should handle bulk order operations efficiently', async () => {
      // Create multiple bulk orders
      metrics.startMeasurement('bulk-order-operations')

      const bulkOrderPromises = Array.from({ length: 5 }, (_, i) => {
        const bulkOrderData = generateBulkOrderData(50 + i * 10)
        return bulkOrderService.processBulkOrder(
          bulkOrderData as any,
          { id: 'test-supplier', email: 'test@example.com' } as any,
          { requestId: 'test', ipAddress: '127.0.0.1', userAgent: 'test', timestamp: new Date() } as any
        )
      })

      const bulkOrders = await Promise.all(bulkOrderPromises)
      
      // Process the bulk orders
      const processingPromises = bulkOrders
        .filter((result: any) => result.success && result.bulkOrderId)
        .map((result: any) => bulkOrderService.getBulkOrderStatus(result.bulkOrderId, { id: 'test-supplier', email: 'test@example.com' } as any))

      const processingResults = await Promise.all(processingPromises)
      
      const totalDuration = metrics.endMeasurement('bulk-order-operations')

      expect(bulkOrders.every((result: any) => result.success)).toBe(true)
      expect(processingResults.every((result: any) => result.success)).toBe(true)
      expect(totalDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_ORDER_MAX_TIME * 3)

      console.log(`Bulk order operations: ${totalDuration.toFixed(2)}ms`)
    })
  })

  describe('Order Features Performance', () => {
    test('should create order templates efficiently', async () => {
      const templateCount = 20

      metrics.startMeasurement('template-creation-batch')

      const templatePromises = Array.from({ length: templateCount }, (_, i) => {
        const templateData = {
          supplierId: `supplier_template_${i}`,
          warehouseId: 'warehouse-us-east',
          name: `Performance Test Template ${i}`,
          description: `Template ${i} for performance testing`,
          category: 'performance-test',
          items: Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, j) => ({
            id: `item_template_${i}_${j}`,
            templateId: `template_${i}`,
            productId: `prod_template_${i}_${j}`,
            sku: `TEMPLATE-${i}-${j}`,
            name: `Template Product ${i}-${j}`,
            quantity: Math.floor(Math.random() * 20) + 1,
            unitPrice: 95 + Math.random() * 100,
            specifications: { type: 'battery', voltage: '20V' },
            isOptional: false,
            category: 'battery'
          })),
          settings: {
            autoSchedule: false,
            notifications: true,
            approvalRequired: false,
            allowQuantityModification: true,
            allowItemAddition: false,
            requireApproval: false
          },
          isActive: true,
          isPublic: false,
          isDefault: false,
          usageCount: 0,
          tags: [`performance-${i}`, 'test', 'batch']
        }

        const supplier = { id: `supplier_template_${i}`, email: `perf${i}@test.com`, companyName: 'Performance Test Co', status: 'ACTIVE', tier: 'PREMIUM', warehouseAccess: ['warehouse-us-east'], permissions: ['CREATE_TEMPLATE'] } as any
        const securityContext = {
          requestId: `req_template_${i}`,
          ipAddress: '127.0.0.1',
          userAgent: 'performance-test',
          timestamp: new Date(),
          permissions: ['CREATE_TEMPLATE']
        }

        return orderFeaturesService.createOrderTemplate(templateData, supplier, securityContext)
      })

      const templates = await Promise.all(templatePromises)
      const totalDuration = metrics.endMeasurement('template-creation-batch')

      expect(templates.every((template: any) => template.id)).toBe(true)
      expect(totalDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.TEMPLATE_CREATION_MAX_TIME * templateCount)

      const avgTimePerTemplate = totalDuration / templateCount
      expect(avgTimePerTemplate).toBeLessThan(PERFORMANCE_THRESHOLDS.TEMPLATE_CREATION_MAX_TIME)

      console.log(`Template creation batch: ${totalDuration.toFixed(2)}ms (${avgTimePerTemplate.toFixed(2)}ms per template)`)
    })

    test('should generate reorder suggestions efficiently', async () => {
      const supplierCount = 10

      metrics.startMeasurement('reorder-suggestions-batch')

      const suggestionPromises = Array.from({ length: supplierCount }, (_, i) => {
        return orderFeaturesService.generateSmartReorderSuggestions(
          `supplier_suggestions_${i}`,
          {
            predictiveDays: 30,
            confidenceThreshold: 0.7,
            includeSeasonality: true
          }
        )
      })

      const suggestions = await Promise.all(suggestionPromises)
      const totalDuration = metrics.endMeasurement('reorder-suggestions-batch')

      expect(suggestions.every(result => Array.isArray(result))).toBe(true)
      expect(totalDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.TEMPLATE_CREATION_MAX_TIME * supplierCount)

      console.log(`Reorder suggestions batch: ${totalDuration.toFixed(2)}ms`)
    })

    test('should analyze order patterns efficiently', async () => {
      const analysisCount = 5

      metrics.startMeasurement('order-analysis-batch')

      const analysisPromises = Array.from({ length: analysisCount }, (_, i) => {
        return orderFeaturesService.analyzeOrderPatterns(
          `supplier_analysis_${i}`,
          {
            dateRange: {
              start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
              end: new Date()
            },
            includeReorderSuggestions: true
          }
        )
      })

      const analyses = await Promise.all(analysisPromises)
      const totalDuration = metrics.endMeasurement('order-analysis-batch')

      expect(analyses.every((analysis: any) => analysis.supplierId)).toBe(true)
      expect(totalDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.TEMPLATE_CREATION_MAX_TIME * analysisCount)

      console.log(`Order analysis batch: ${totalDuration.toFixed(2)}ms`)
    })
  })

  describe('Health Check Performance', () => {
    test('should perform health checks within performance threshold', async () => {
      const healthCheckTypes = ['all', 'database', 'auth', 'warehouse', 'orders', 'analytics']

      for (const checkType of healthCheckTypes) {
        metrics.startMeasurement(`health-check-${checkType}`)
        
        const result = checkType === 'all' 
          ? await healthCheckService.getSystemHealth()
          : await healthCheckService.getServiceHealth(checkType)
        
        const duration = metrics.endMeasurement(`health-check-${checkType}`)

        expect(result).toBeDefined()
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.HEALTH_CHECK_MAX_TIME)
        
        console.log(`Health check (${checkType}): ${duration.toFixed(2)}ms`)
      }
    })

    test('should handle multiple concurrent health checks', async () => {
      const concurrentChecks = 20

      metrics.startMeasurement('concurrent-health-checks')

      const healthCheckPromises = Array.from({ length: concurrentChecks }, (_, i) => {
        const checkType = ['all', 'database', 'auth', 'warehouse', 'orders'][i % 5]
        return checkType === 'all'
          ? healthCheckService.getSystemHealth()
          : healthCheckService.getServiceHealth(checkType)
      })

      const results = await Promise.all(healthCheckPromises)
      const totalDuration = metrics.endMeasurement('concurrent-health-checks')

      expect(results.every((result: any) => result !== null)).toBe(true)
      expect(totalDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.HEALTH_CHECK_MAX_TIME * 2)

      const throughput = concurrentChecks / (totalDuration / 1000)
      expect(throughput).toBeGreaterThan(20) // Should handle 20+ health checks per second

      console.log(`Concurrent health checks: ${totalDuration.toFixed(2)}ms, Throughput: ${throughput.toFixed(2)} checks/sec`)
    })
  })

  describe('Memory and Resource Performance', () => {
    test('should not have memory leaks during extended operations', async () => {
      const initialMemory = process.memoryUsage()
      const operationCount = 100

      // Perform many operations to test for memory leaks
      for (let i = 0; i < operationCount; i++) {
        const orderData = generateLargeOrderData(10)
        await orderProcessingEngine.processAdvancedOrder(
          orderData as any,
          { id: 'test-supplier', email: 'test@example.com' } as any,
          { requestId: 'test', ipAddress: '127.0.0.1', userAgent: 'test', timestamp: new Date() } as any
        )

        // Force garbage collection every 20 operations
        if (i % 20 === 0 && global.gc) {
          global.gc()
        }
      }

      // Force final garbage collection
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LEAK_THRESHOLD)

      console.log(`Memory usage after ${operationCount} operations:`)
      console.log(`  Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)
      console.log(`  Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)
      console.log(`  Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
    })

    test('should handle stress testing without degradation', async () => {
      const stressTestDuration = 5000 // 5 seconds
      const operationsPerSecond = 20
      const totalOperations = (stressTestDuration / 1000) * operationsPerSecond

      const startTime = Date.now()
      const operations = []
      let operationCount = 0

      while (Date.now() - startTime < stressTestDuration) {
        const operation = (async () => {
          const orderData = generateLargeOrderData(Math.floor(Math.random() * 10) + 1)
          const result = await orderProcessingEngine.processAdvancedOrder(
            orderData as any,
            { id: 'test-supplier', email: 'test@example.com' } as any,
            { requestId: 'test', ipAddress: '127.0.0.1', userAgent: 'test', timestamp: new Date() } as any
          )
          operationCount++
          return result
        })()

        operations.push(operation)

        // Maintain target operations per second
        await new Promise(resolve => setTimeout(resolve, 1000 / operationsPerSecond))
      }

      const results = await Promise.all(operations)
      const actualDuration = Date.now() - startTime

      expect(results.every((result: any) => result.success)).toBe(true)
      expect(operationCount).toBeGreaterThan(totalOperations * 0.8) // Allow 20% tolerance

      const actualThroughput = operationCount / (actualDuration / 1000)
      expect(actualThroughput).toBeGreaterThan(operationsPerSecond * 0.8)

      console.log(`Stress test: ${operationCount} operations in ${actualDuration}ms`)
      console.log(`Throughput: ${actualThroughput.toFixed(2)} ops/sec`)
    })
  })

  describe('End-to-End Performance', () => {
    test('should complete full workflow within performance budget', async () => {
      metrics.startMeasurement('e2e-workflow')

      // Step 1: Create template
      const templateData = {
        supplierId: 'supplier_e2e_perf',
        warehouseId: 'warehouse-us-east',
        name: 'E2E Performance Template',
        category: 'performance',
        items: Array.from({ length: 5 }, (_, i) => ({
          id: `item_e2e_${i}`,
          templateId: 'template_e2e',
          productId: `prod_e2e_${i}`,
          sku: `E2E-${i}`,
          name: `E2E Product ${i}`,
          quantity: 10,
          unitPrice: 95 + i * 10,
          isOptional: false,
          category: 'battery'
        })),
        settings: { autoSchedule: false, notifications: true, approvalRequired: false, allowQuantityModification: true, allowItemAddition: false, requireApproval: false },
        isActive: true,
        isPublic: false,
        isDefault: false,
        usageCount: 0,
        tags: ['e2e', 'performance']
      }

      const supplier = { id: 'supplier_e2e_perf', email: 'e2e@performance.test', companyName: 'E2E Test Company', status: 'ACTIVE', tier: 'PREMIUM', warehouseAccess: ['warehouse-us-east'], permissions: ['CREATE_TEMPLATE', 'CREATE_ORDER'] } as any
      const securityContext = {
        requestId: 'req_e2e_perf',
        ipAddress: '127.0.0.1',
        userAgent: 'e2e-performance-test',
        timestamp: new Date(),
        permissions: ['CREATE_TEMPLATE', 'CREATE_ORDER']
      }

      const template = await orderFeaturesService.createOrderTemplate(templateData, supplier, securityContext)

      // Step 2: Create order from template
      const customizations = {
        quantities: { 'prod_e2e_0': 20, 'prod_e2e_1': 15 },
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        shippingAddress: {
          firstName: 'E2E',
          lastName: 'Performance',
          line1: '123 E2E Test St',
          city: 'Performance City',
          state: 'PC',
          postalCode: '12345',
          country: 'US',
          isResidential: false
        },
        notes: 'E2E performance test order'
      }

      const order = await orderFeaturesService.createOrderFromTemplate(
        template.id,
        customizations,
        { id: supplier.id, email: supplier.email, companyName: 'E2E Test Company', status: 'ACTIVE', tier: 'PREMIUM', warehouseAccess: ['warehouse-us-east'], permissions: ['CREATE_ORDER'] } as any,
        securityContext
      )

      // Step 3: Process order
      const orderData = {
        supplierId: supplier.id,
        items: templateData.items.map(item => ({
          productId: item.productId,
          sku: item.sku,
          quantity: (customizations.quantities as any)[item.productId] || item.quantity,
          unitPrice: item.unitPrice
        })),
        shippingAddress: customizations.shippingAddress,
        templateId: template.id
      }

      const processingResult = await orderProcessingEngine.processAdvancedOrder(
        orderData as any,
        { id: supplier.id, email: supplier.email, companyName: 'E2E Test Company', status: 'ACTIVE', tier: 'PREMIUM', warehouseAccess: ['warehouse-us-east'], permissions: ['CREATE_ORDER'] } as any,
        securityContext
      )

      // Step 4: Health check
      const healthResult = await healthCheckService.getSystemHealth()

      // Step 5: Generate analytics
      const analysis = await orderFeaturesService.analyzeOrderPatterns(supplier.id, {
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date()
        }
      })

      const totalDuration = metrics.endMeasurement('e2e-workflow')

      expect(template.id).toBeDefined()
      expect(order.id).toBeDefined()
      expect(processingResult.success).toBe(true)
      expect(healthResult).toBeDefined()
      expect(analysis.supplierId).toBe(supplier.id)
      expect(totalDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.CONCURRENT_OPERATIONS_MAX_TIME)

      console.log(`E2E workflow: ${totalDuration.toFixed(2)}ms`)
    })
  })
})

export {}