/**
 * RHY Supplier Portal - Warehouse Operations E2E Tests
 * Comprehensive testing for multi-warehouse operations, automation, and logistics
 * Tests global FlexVolt battery supply chain across 4 warehouse regions
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'
import { WarehouseService } from '@/services/warehouse/WarehouseService'
import { RoboticsService } from '@/services/automation/RoboticsService'
import { SortingSystemService } from '@/services/automation/SortingSystemService'

// Warehouse test configuration
const WAREHOUSE_CONFIG = {
  regions: {
    US: {
      code: 'US',
      name: 'US West Coast',
      location: 'Nevada Distribution Center',
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      compliance: ['OSHA'],
      operatingHours: { start: '06:00', end: '18:00' },
      capacity: { maxOrders: 10000, maxRobots: 50 },
      specialization: 'High-volume contractor orders'
    },
    EU: {
      code: 'EU',
      name: 'European Hub',
      location: 'Netherlands Distribution Center',
      timezone: 'Europe/Amsterdam',
      currency: 'EUR',
      compliance: ['CE', 'GDPR'],
      operatingHours: { start: '08:00', end: '17:00' },
      capacity: { maxOrders: 8000, maxRobots: 40 },
      specialization: 'Cross-border logistics'
    },
    JP: {
      code: 'JP', 
      name: 'Japan Distribution',
      location: 'Tokyo Distribution Center',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      compliance: ['JIS'],
      operatingHours: { start: '09:00', end: '18:00' },
      capacity: { maxOrders: 6000, maxRobots: 35 },
      specialization: 'Precision logistics'
    },
    AU: {
      code: 'AU',
      name: 'Australia/Oceania',
      location: 'Sydney Distribution Center', 
      timezone: 'Australia/Sydney',
      currency: 'AUD',
      compliance: ['Australian Standards'],
      operatingHours: { start: '08:00', end: '17:00' },
      capacity: { maxOrders: 4000, maxRobots: 25 },
      specialization: 'Remote delivery'
    }
  },
  performance: {
    apiResponse: 100, // ms
    warehouseSync: 1000, // ms
    robotResponse: 50, // ms
    sortingThroughput: 1000 // items/hour
  },
  automation: {
    robotTypes: ['AGV', 'PICKER', 'SORTER', 'TRANSPORTER'],
    robotCommands: ['START', 'STOP', 'PAUSE', 'RESUME', 'EMERGENCY_STOP', 'HOME', 'MOVE', 'PICK', 'PLACE', 'CHARGE'],
    sortingMethods: ['DESTINATION', 'PRODUCT_TYPE', 'PRIORITY', 'SIZE', 'CUSTOMER']
  }
}

// Performance monitoring for warehouse operations
class WarehousePerformanceMonitor {
  private metrics: Map<string, { times: number[], errors: number }> = new Map()

  startOperation(operation: string): () => { duration: number, success: boolean } {
    const startTime = Date.now()
    
    return (success: boolean = true) => {
      const duration = Date.now() - startTime
      
      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, { times: [], errors: 0 })
      }
      
      const metric = this.metrics.get(operation)!
      metric.times.push(duration)
      if (!success) metric.errors++
      
      return { duration, success }
    }
  }

  getPerformanceReport(operation: string): { avgTime: number, p95Time: number, errorRate: number } {
    const metric = this.metrics.get(operation)
    if (!metric || metric.times.length === 0) {
      return { avgTime: 0, p95Time: 0, errorRate: 0 }
    }
    
    const sortedTimes = [...metric.times].sort((a, b) => a - b)
    const avgTime = metric.times.reduce((a, b) => a + b) / metric.times.length
    const p95Index = Math.floor(sortedTimes.length * 0.95)
    const p95Time = sortedTimes[p95Index] || 0
    const errorRate = (metric.errors / metric.times.length) * 100
    
    return { avgTime, p95Time, errorRate }
  }

  verifyPerformanceTargets(operation: string, targets: { maxAvgTime?: number, maxP95Time?: number, maxErrorRate?: number }): boolean {
    const report = this.getPerformanceReport(operation)
    
    let passed = true
    if (targets.maxAvgTime && report.avgTime > targets.maxAvgTime) passed = false
    if (targets.maxP95Time && report.p95Time > targets.maxP95Time) passed = false
    if (targets.maxErrorRate && report.errorRate > targets.maxErrorRate) passed = false
    
    console.log(`Performance ${operation}:`, report, passed ? 'PASSED' : 'FAILED')
    return passed
  }
}

// Warehouse management utilities
class WarehouseTestManager {
  constructor(private page: Page, private performanceMonitor: WarehousePerformanceMonitor) {}

  async authenticateWarehouseManager(): Promise<void> {
    // Authenticate as warehouse manager with full permissions
    await this.page.goto('/supplier/auth/login')
    await this.page.fill('[data-testid="email-input"]', 'warehouse.manager@flexvolt.com')
    await this.page.fill('[data-testid="password-input"]', 'WarehouseSecure123!')
    await this.page.click('[data-testid="login-submit"]')
    
    await expect(this.page).toHaveURL(/\/supplier\/dashboard/)
    await expect(this.page.locator('[data-testid="warehouse-manager-dashboard"]')).toBeVisible()
  }

  async navigateToWarehouseOperations(): Promise<void> {
    await this.page.click('[data-testid="nav-warehouse"]')
    await expect(this.page).toHaveURL(/\/supplier\/warehouse/)
    await expect(this.page.locator('[data-testid="warehouse-operations-dashboard"]')).toBeVisible()
  }

  async selectWarehouse(warehouseCode: string): Promise<void> {
    const endOperation = this.performanceMonitor.startOperation('warehouse_selection')
    
    try {
      await this.page.click('[data-testid="warehouse-selector"]')
      await this.page.click(`[data-testid="warehouse-option-${warehouseCode}"]`)
      
      // Wait for warehouse data to load
      await this.page.waitForLoadState('networkidle')
      await expect(this.page.locator('[data-testid="selected-warehouse"]')).toContainText(warehouseCode)
      
      // Verify warehouse-specific information loads
      const warehouse = WAREHOUSE_CONFIG.regions[warehouseCode as keyof typeof WAREHOUSE_CONFIG.regions]
      await expect(this.page.locator('[data-testid="warehouse-name"]')).toContainText(warehouse.name)
      await expect(this.page.locator('[data-testid="warehouse-location"]')).toContainText(warehouse.location)
      
      endOperation(true)
    } catch (error) {
      endOperation(false)
      throw error
    }
  }

  async verifyWarehouseStatus(warehouseCode: string): Promise<void> {
    const warehouse = WAREHOUSE_CONFIG.regions[warehouseCode as keyof typeof WAREHOUSE_CONFIG.regions]
    
    // Verify operational status
    await expect(this.page.locator('[data-testid="warehouse-status"]')).toContainText('OPERATIONAL')
    
    // Verify capacity information
    await expect(this.page.locator('[data-testid="current-orders"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="max-capacity"]')).toContainText(warehouse.capacity.maxOrders.toString())
    
    // Verify compliance indicators
    for (const compliance of warehouse.compliance) {
      await expect(this.page.locator(`[data-testid="compliance-${compliance}"]`)).toBeVisible()
    }
    
    // Verify operating hours
    await expect(this.page.locator('[data-testid="operating-hours"]')).toBeVisible()
  }

  async testWarehouseSynchronization(): Promise<void> {
    const endOperation = this.performanceMonitor.startOperation('warehouse_sync')
    
    try {
      // Trigger cross-warehouse synchronization
      await this.page.click('[data-testid="sync-warehouses"]')
      
      // Monitor sync progress
      await expect(this.page.locator('[data-testid="sync-in-progress"]')).toBeVisible()
      
      // Wait for sync completion
      await expect(this.page.locator('[data-testid="sync-complete"]')).toBeVisible({ timeout: 30000 })
      
      // Verify all warehouses show synced status
      for (const warehouseCode of Object.keys(WAREHOUSE_CONFIG.regions)) {
        await expect(this.page.locator(`[data-testid="warehouse-${warehouseCode}-sync-status"]`)).toContainText('SYNCED')
      }
      
      endOperation(true)
    } catch (error) {
      endOperation(false)
      throw error
    }
  }
}

// Automation testing utilities
class AutomationTestManager {
  constructor(private page: Page, private performanceMonitor: WarehousePerformanceMonitor) {}

  async navigateToAutomationDashboard(): Promise<void> {
    await this.page.click('[data-testid="nav-automation"]')
    await expect(this.page).toHaveURL(/\/supplier\/warehouse\/automation/)
    await expect(this.page.locator('[data-testid="automation-dashboard"]')).toBeVisible()
  }

  async verifyRoboticsSystem(warehouseCode: string): Promise<void> {
    const endOperation = this.performanceMonitor.startOperation('robotics_verification')
    
    try {
      // Verify robotics overview
      await expect(this.page.locator('[data-testid="robotics-overview"]')).toBeVisible()
      
      // Check robot fleet status
      const robotCards = this.page.locator('[data-testid^="robot-card-"]')
      const robotCount = await robotCards.count()
      
      const warehouse = WAREHOUSE_CONFIG.regions[warehouseCode as keyof typeof WAREHOUSE_CONFIG.regions]
      expect(robotCount).toBeLessThanOrEqual(warehouse.capacity.maxRobots)
      
      // Verify robot types
      for (const robotType of WAREHOUSE_CONFIG.automation.robotTypes) {
        const robotsOfType = this.page.locator(`[data-testid="robot-type-${robotType}"]`)
        if (await robotsOfType.count() > 0) {
          await expect(robotsOfType.first()).toBeVisible()
        }
      }
      
      // Test robot command interface
      if (robotCount > 0) {
        const firstRobot = robotCards.first()
        await firstRobot.click()
        
        // Verify robot control panel
        await expect(this.page.locator('[data-testid="robot-control-panel"]')).toBeVisible()
        
        // Test robot commands
        for (const command of ['START', 'PAUSE', 'STOP']) {
          const commandButton = this.page.locator(`[data-testid="robot-command-${command}"]`)
          if (await commandButton.isVisible()) {
            await commandButton.click()
            await expect(this.page.locator('[data-testid="command-sent"]')).toBeVisible()
          }
        }
      }
      
      endOperation(true)
    } catch (error) {
      endOperation(false)
      throw error
    }
  }

  async verifySortingSystem(warehouseCode: string): Promise<void> {
    const endOperation = this.performanceMonitor.startOperation('sorting_verification')
    
    try {
      // Navigate to sorting system
      await this.page.click('[data-testid="sorting-system-tab"]')
      await expect(this.page.locator('[data-testid="sorting-dashboard"]')).toBeVisible()
      
      // Verify sorting system status
      await expect(this.page.locator('[data-testid="sorting-status"]')).toBeVisible()
      
      // Check conveyor lines
      const conveyorLines = this.page.locator('[data-testid^="conveyor-line-"]')
      const lineCount = await conveyorLines.count()
      expect(lineCount).toBeGreaterThan(0)
      
      // Verify throughput metrics
      await expect(this.page.locator('[data-testid="throughput-metric"]')).toBeVisible()
      const throughputText = await this.page.locator('[data-testid="throughput-value"]').textContent()
      const throughput = parseInt(throughputText || '0')
      expect(throughput).toBeGreaterThanOrEqual(0)
      expect(throughput).toBeLessThanOrEqual(WAREHOUSE_CONFIG.performance.sortingThroughput * 2) // Allow 2x buffer
      
      // Test sorting method selection
      for (const method of WAREHOUSE_CONFIG.automation.sortingMethods) {
        const methodOption = this.page.locator(`[data-testid="sorting-method-${method}"]`)
        if (await methodOption.isVisible()) {
          await methodOption.click()
          await expect(this.page.locator('[data-testid="sorting-method-selected"]')).toContainText(method)
        }
      }
      
      endOperation(true)
    } catch (error) {
      endOperation(false)
      throw error
    }
  }

  async testAutomationPerformance(): Promise<void> {
    const endOperation = this.performanceMonitor.startOperation('automation_performance')
    
    try {
      // Start performance monitoring
      await this.page.click('[data-testid="start-performance-test"]')
      
      // Monitor real-time metrics
      const metricsUpdates = []
      for (let i = 0; i < 10; i++) {
        await this.page.waitForTimeout(1000)
        const timestamp = Date.now()
        const efficiency = await this.page.locator('[data-testid="system-efficiency"]').textContent()
        const throughput = await this.page.locator('[data-testid="current-throughput"]').textContent()
        
        metricsUpdates.push({
          timestamp,
          efficiency: parseFloat(efficiency || '0'),
          throughput: parseInt(throughput || '0')
        })
      }
      
      // Verify metrics are updating
      expect(metricsUpdates.length).toBe(10)
      
      // Verify reasonable efficiency values
      metricsUpdates.forEach(update => {
        expect(update.efficiency).toBeGreaterThan(0)
        expect(update.efficiency).toBeLessThanOrEqual(100)
        expect(update.throughput).toBeGreaterThanOrEqual(0)
      })
      
      endOperation(true)
    } catch (error) {
      endOperation(false)
      throw error
    }
  }
}

// Inventory management testing
class InventoryTestManager {
  constructor(private page: Page, private performanceMonitor: WarehousePerformanceMonitor) {}

  async navigateToInventory(): Promise<void> {
    await this.page.click('[data-testid="nav-inventory"]')
    await expect(this.page).toHaveURL(/\/supplier\/warehouse\/inventory/)
    await expect(this.page.locator('[data-testid="inventory-dashboard"]')).toBeVisible()
  }

  async verifyInventoryLevels(warehouseCode: string): Promise<void> {
    const endOperation = this.performanceMonitor.startOperation('inventory_verification')
    
    try {
      // Verify FlexVolt product inventory
      const products = ['flexvolt-6ah', 'flexvolt-9ah', 'flexvolt-15ah']
      
      for (const productId of products) {
        const inventoryCard = this.page.locator(`[data-testid="inventory-${productId}"]`)
        await expect(inventoryCard).toBeVisible()
        
        // Verify stock levels
        const stockLevel = await inventoryCard.locator('[data-testid="stock-level"]').textContent()
        const stock = parseInt(stockLevel || '0')
        expect(stock).toBeGreaterThanOrEqual(0)
        
        // Verify reorder points
        const reorderPoint = await inventoryCard.locator('[data-testid="reorder-point"]').textContent()
        const reorder = parseInt(reorderPoint || '0')
        expect(reorder).toBeGreaterThan(0)
        
        // Check inventory status
        const status = await inventoryCard.locator('[data-testid="inventory-status"]').textContent()
        expect(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'REORDER_PENDING']).toContain(status)
      }
      
      endOperation(true)
    } catch (error) {
      endOperation(false)
      throw error
    }
  }

  async testInventoryMovements(): Promise<void> {
    const endOperation = this.performanceMonitor.startOperation('inventory_movements')
    
    try {
      // Test inventory adjustment
      await this.page.click('[data-testid="inventory-adjustment"]')
      await this.page.fill('[data-testid="product-search"]', 'flexvolt-6ah')
      await this.page.click('[data-testid="search-result-flexvolt-6ah"]')
      
      // Record adjustment
      await this.page.fill('[data-testid="adjustment-quantity"]', '50')
      await this.page.selectOption('[data-testid="adjustment-reason"]', 'RECEIVED')
      await this.page.fill('[data-testid="adjustment-notes"]', 'Test inventory adjustment')
      await this.page.click('[data-testid="submit-adjustment"]')
      
      // Verify adjustment recorded
      await expect(this.page.locator('[data-testid="adjustment-success"]')).toBeVisible()
      
      // Check inventory history
      await this.page.click('[data-testid="inventory-history"]')
      await expect(this.page.locator('[data-testid="recent-adjustment"]')).toContainText('Test inventory adjustment')
      
      endOperation(true)
    } catch (error) {
      endOperation(false)
      throw error
    }
  }

  async testCrossWarehouseTransfer(): Promise<void> {
    const endOperation = this.performanceMonitor.startOperation('cross_warehouse_transfer')
    
    try {
      // Initiate transfer between warehouses
      await this.page.click('[data-testid="initiate-transfer"]')
      
      // Select source and destination warehouses
      await this.page.selectOption('[data-testid="source-warehouse"]', 'US')
      await this.page.selectOption('[data-testid="destination-warehouse"]', 'EU')
      
      // Select product and quantity
      await this.page.fill('[data-testid="transfer-product-search"]', 'flexvolt-9ah')
      await this.page.click('[data-testid="transfer-search-result-flexvolt-9ah"]')
      await this.page.fill('[data-testid="transfer-quantity"]', '25')
      
      // Add transfer reason and notes
      await this.page.selectOption('[data-testid="transfer-reason"]', 'STOCK_REBALANCING')
      await this.page.fill('[data-testid="transfer-notes"]', 'Test cross-warehouse transfer')
      
      // Submit transfer request
      await this.page.click('[data-testid="submit-transfer"]')
      
      // Verify transfer initiated
      await expect(this.page.locator('[data-testid="transfer-initiated"]')).toBeVisible()
      
      // Check transfer status
      const transferId = await this.page.locator('[data-testid="transfer-id"]').textContent()
      expect(transferId).toMatch(/^TRF-\d{8}$/)
      
      // Verify transfer appears in both warehouse histories
      await this.page.goto('/supplier/warehouse/inventory?warehouse=US')
      await this.page.click('[data-testid="transfer-history"]')
      await expect(this.page.locator(`[data-testid="transfer-${transferId}"]`)).toBeVisible()
      
      endOperation(true)
    } catch (error) {
      endOperation(false)
      throw error
    }
  }
}

// Main warehouse operations test suites
test.describe('Comprehensive Warehouse Operations E2E Tests', () => {
  let performanceMonitor: WarehousePerformanceMonitor
  let warehouseManager: WarehouseTestManager
  let automationManager: AutomationTestManager
  let inventoryManager: InventoryTestManager

  test.beforeEach(async ({ page }) => {
    performanceMonitor = new WarehousePerformanceMonitor()
    warehouseManager = new WarehouseTestManager(page, performanceMonitor)
    automationManager = new AutomationTestManager(page, performanceMonitor)
    inventoryManager = new InventoryTestManager(page, performanceMonitor)
    
    page.setDefaultTimeout(30000)
    await warehouseManager.authenticateWarehouseManager()
  })

  test('Multi-Warehouse Operations - All 4 Regions', async ({ page }) => {
    await warehouseManager.navigateToWarehouseOperations()
    
    // Test operations across all warehouse regions
    for (const warehouseCode of Object.keys(WAREHOUSE_CONFIG.regions)) {
      console.log(`Testing warehouse: ${warehouseCode}`)
      
      await warehouseManager.selectWarehouse(warehouseCode)
      await warehouseManager.verifyWarehouseStatus(warehouseCode)
      
      // Verify warehouse-specific features
      const warehouse = WAREHOUSE_CONFIG.regions[warehouseCode as keyof typeof WAREHOUSE_CONFIG.regions]
      await expect(page.locator('[data-testid="warehouse-specialization"]')).toContainText(warehouse.specialization)
      await expect(page.locator('[data-testid="warehouse-currency"]')).toContainText(warehouse.currency)
    }
    
    // Test cross-warehouse synchronization
    await warehouseManager.testWarehouseSynchronization()
    
    // Verify performance targets
    expect(performanceMonitor.verifyPerformanceTargets('warehouse_selection', {
      maxAvgTime: 2000,
      maxP95Time: 5000,
      maxErrorRate: 1
    })).toBe(true)
    
    expect(performanceMonitor.verifyPerformanceTargets('warehouse_sync', {
      maxAvgTime: 5000,
      maxP95Time: 10000,
      maxErrorRate: 2
    })).toBe(true)
  })

  test('Robotics System - Complete Automation Testing', async ({ page }) => {
    await warehouseManager.navigateToWarehouseOperations()
    await automationManager.navigateToAutomationDashboard()
    
    // Test robotics across multiple warehouses
    for (const warehouseCode of ['US', 'EU']) {
      await warehouseManager.selectWarehouse(warehouseCode)
      await automationManager.verifyRoboticsSystem(warehouseCode)
    }
    
    // Performance testing
    await automationManager.testAutomationPerformance()
    
    // Verify robotics performance targets
    expect(performanceMonitor.verifyPerformanceTargets('robotics_verification', {
      maxAvgTime: 3000,
      maxP95Time: 8000,
      maxErrorRate: 1
    })).toBe(true)
  })

  test('Sorting System - Throughput and Quality Testing', async ({ page }) => {
    await warehouseManager.navigateToWarehouseOperations()
    await automationManager.navigateToAutomationDashboard()
    
    // Test sorting system across warehouses
    for (const warehouseCode of ['US', 'JP']) {
      await warehouseManager.selectWarehouse(warehouseCode)
      await automationManager.verifySortingSystem(warehouseCode)
    }
    
    // Verify sorting performance targets
    expect(performanceMonitor.verifyPerformanceTargets('sorting_verification', {
      maxAvgTime: 2000,
      maxP95Time: 5000,
      maxErrorRate: 0.5
    })).toBe(true)
  })

  test('Inventory Management - Multi-Warehouse Coordination', async ({ page }) => {
    await warehouseManager.navigateToWarehouseOperations()
    await inventoryManager.navigateToInventory()
    
    // Test inventory management across warehouses
    for (const warehouseCode of Object.keys(WAREHOUSE_CONFIG.regions)) {
      await warehouseManager.selectWarehouse(warehouseCode)
      await inventoryManager.verifyInventoryLevels(warehouseCode)
    }
    
    // Test inventory movements
    await warehouseManager.selectWarehouse('US')
    await inventoryManager.testInventoryMovements()
    
    // Test cross-warehouse transfers
    await inventoryManager.testCrossWarehouseTransfer()
    
    // Verify inventory performance targets
    expect(performanceMonitor.verifyPerformanceTargets('inventory_verification', {
      maxAvgTime: 1500,
      maxP95Time: 3000,
      maxErrorRate: 1
    })).toBe(true)
    
    expect(performanceMonitor.verifyPerformanceTargets('cross_warehouse_transfer', {
      maxAvgTime: 8000,
      maxP95Time: 15000,
      maxErrorRate: 2
    })).toBe(true)
  })

  test('Compliance and Regional Requirements', async ({ page }) => {
    await warehouseManager.navigateToWarehouseOperations()
    
    // Test compliance features for each region
    const complianceTests = {
      US: async () => {
        await expect(page.locator('[data-testid="osha-compliance"]')).toBeVisible()
        await expect(page.locator('[data-testid="safety-protocols"]')).toBeVisible()
      },
      EU: async () => {
        await expect(page.locator('[data-testid="ce-marking"]')).toBeVisible()
        await expect(page.locator('[data-testid="gdpr-compliance"]')).toBeVisible()
      },
      JP: async () => {
        await expect(page.locator('[data-testid="jis-standards"]')).toBeVisible()
        await expect(page.locator('[data-testid="precision-logistics"]')).toBeVisible()
      },
      AU: async () => {
        await expect(page.locator('[data-testid="australian-standards"]')).toBeVisible()
        await expect(page.locator('[data-testid="remote-delivery"]')).toBeVisible()
      }
    }
    
    for (const [warehouseCode, testFn] of Object.entries(complianceTests)) {
      await warehouseManager.selectWarehouse(warehouseCode)
      await testFn()
    }
  })

  test('Performance Stress Testing - Concurrent Operations', async ({ page }) => {
    await warehouseManager.navigateToWarehouseOperations()
    
    // Simulate concurrent warehouse operations
    const operations = []
    
    for (let i = 0; i < 5; i++) {
      operations.push(async () => {
        const warehouseCode = Object.keys(WAREHOUSE_CONFIG.regions)[i % 4]
        await warehouseManager.selectWarehouse(warehouseCode)
        await warehouseManager.verifyWarehouseStatus(warehouseCode)
      })
    }
    
    const startTime = Date.now()
    await Promise.all(operations)
    const totalTime = Date.now() - startTime
    
    // Verify concurrent operations complete within reasonable time
    expect(totalTime).toBeLessThan(15000) // 15 seconds for 5 concurrent operations
  })

  test('Error Recovery and Failover Testing', async ({ page }) => {
    await warehouseManager.navigateToWarehouseOperations()
    await warehouseManager.selectWarehouse('US')
    
    // Simulate network issues
    await page.route('**/api/warehouse/status', route => route.abort())
    
    // Attempt operation that should fail gracefully
    await page.click('[data-testid="refresh-status"]')
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
    
    // Restore network and verify recovery
    await page.unroute('**/api/warehouse/status')
    await page.click('[data-testid="retry-button"]')
    await expect(page.locator('[data-testid="warehouse-status"]')).toBeVisible()
  })

  test.afterEach(async () => {
    // Generate performance report
    console.log('\n=== Warehouse Operations Performance Report ===')
    const operations = ['warehouse_selection', 'warehouse_sync', 'robotics_verification', 'sorting_verification', 'inventory_verification', 'cross_warehouse_transfer']
    
    operations.forEach(operation => {
      const report = performanceMonitor.getPerformanceReport(operation)
      if (report.avgTime > 0) {
        console.log(`${operation}: ${report.avgTime.toFixed(2)}ms avg, ${report.p95Time.toFixed(2)}ms P95, ${report.errorRate.toFixed(2)}% errors`)
      }
    })
    console.log('================================================\n')
  })
})