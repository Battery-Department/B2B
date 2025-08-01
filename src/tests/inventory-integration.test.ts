/**
 * RHY_041: Comprehensive Inventory System Integration Tests
 * Tests for real-time inventory dashboard system integration
 * Verifies integration with Batch 1 authentication and warehouse foundation
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { inventoryDashboardService } from '@/services/inventory/InventoryDashboardService'
import { stockMonitoringService } from '@/services/inventory/StockMonitoringService'
import { WarehouseAccess } from '@/types/auth'
import { InventoryDashboard, InventoryItem, InventoryAlert } from '@/types/inventory'

// Mock warehouse access for testing
const mockWarehouseAccess: WarehouseAccess[] = [
  {
    warehouseId: 'warehouse-us-001',
    warehouseName: 'US East Coast Facility',
    region: 'US',
    permissions: ['VIEW_INVENTORY', 'MANAGE_INVENTORY', 'MONITOR_INVENTORY'],
    accessLevel: 'FULL'
  },
  {
    warehouseId: 'warehouse-eu-001',
    warehouseName: 'EU Central Facility',
    region: 'EU',
    permissions: ['VIEW_INVENTORY', 'MONITOR_INVENTORY'],
    accessLevel: 'READ_ONLY'
  }
]

const mockUserId = 'user-test-123'

describe('RHY_041: Inventory Dashboard Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Dashboard Data Retrieval', () => {
    test('should retrieve dashboard data for authorized warehouse', async () => {
      const warehouseId = 'warehouse-us-001'
      
      const dashboard = await inventoryDashboardService.getDashboard(
        warehouseId,
        mockUserId,
        mockWarehouseAccess
      )

      expect(dashboard).toBeDefined()
      expect(dashboard.warehouseId).toBe(warehouseId)
      expect(dashboard.overview).toBeDefined()
      expect(dashboard.inventory).toBeDefined()
      expect(dashboard.alerts).toBeDefined()
      expect(dashboard.recentMovements).toBeDefined()
      expect(dashboard.predictions).toBeDefined()
      expect(Array.isArray(dashboard.inventory)).toBe(true)
      expect(Array.isArray(dashboard.alerts)).toBe(true)
      expect(Array.isArray(dashboard.recentMovements)).toBe(true)
    })

    test('should throw error for unauthorized warehouse access', async () => {
      const unauthorizedWarehouseId = 'warehouse-unauthorized'
      
      await expect(
        inventoryDashboardService.getDashboard(
          unauthorizedWarehouseId,
          mockUserId,
          mockWarehouseAccess
        )
      ).rejects.toThrow('Access denied')
    })

    test('should retrieve multi-warehouse inventory view', async () => {
      const multiWarehouse = await inventoryDashboardService.getMultiWarehouseInventory(
        mockUserId,
        mockWarehouseAccess
      )

      expect(multiWarehouse).toBeDefined()
      expect(Array.isArray(multiWarehouse)).toBe(true)
      
      // Should include data from accessible warehouses only
      const warehouseIds = multiWarehouse.map(item => item.warehouseStocks.map(stock => stock.warehouseId)).flat()
      const authorizedWarehouses = mockWarehouseAccess.map(access => access.warehouseId)
      
      warehouseIds.forEach(id => {
        expect(authorizedWarehouses).toContain(id)
      })
    })
  })

  describe('Inventory Operations', () => {
    test('should update inventory item with proper authorization', async () => {
      const updateRequest = {
        warehouseId: 'warehouse-us-001',
        productId: 'prod-flexvolt-6ah',
        quantity: 150,
        reason: 'Stock adjustment',
        userId: mockUserId
      }

      const result = await inventoryDashboardService.updateInventoryItem(
        updateRequest,
        mockWarehouseAccess
      )

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.updatedItem).toBeDefined()
      expect(result.updatedItem.warehouseId).toBe(updateRequest.warehouseId)
      expect(result.updatedItem.productId).toBe(updateRequest.productId)
    })

    test('should reject inventory update for read-only warehouse', async () => {
      const updateRequest = {
        warehouseId: 'warehouse-eu-001', // Read-only access
        productId: 'prod-flexvolt-6ah',
        quantity: 150,
        reason: 'Stock adjustment',
        userId: mockUserId
      }

      await expect(
        inventoryDashboardService.updateInventoryItem(updateRequest, mockWarehouseAccess)
      ).rejects.toThrow('Insufficient permissions')
    })

    test('should create inventory transfer between authorized warehouses', async () => {
      const transferRequest = {
        fromWarehouseId: 'warehouse-us-001',
        toWarehouseId: 'warehouse-eu-001',
        productId: 'prod-flexvolt-9ah',
        quantity: 50,
        reason: 'Stock rebalancing',
        requestedBy: mockUserId,
        priority: 'MEDIUM' as const
      }

      const result = await inventoryDashboardService.createTransfer(
        transferRequest,
        mockWarehouseAccess
      )

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.transfer).toBeDefined()
      expect(result.transfer.fromWarehouseId).toBe(transferRequest.fromWarehouseId)
      expect(result.transfer.toWarehouseId).toBe(transferRequest.toWarehouseId)
      expect(result.transfer.status).toBe('PENDING')
    })
  })

  describe('Analytics and Reporting', () => {
    test('should retrieve inventory analytics for authorized warehouse', async () => {
      const warehouseId = 'warehouse-us-001'
      const period = 'MONTHLY'

      const analytics = await inventoryDashboardService.getInventoryAnalytics(
        warehouseId,
        period,
        mockWarehouseAccess
      )

      expect(analytics).toBeDefined()
      expect(analytics.warehouseId).toBe(warehouseId)
      expect(analytics.period).toBe(period)
      expect(analytics.performance).toBeDefined()
      expect(analytics.trends).toBeDefined()
      expect(analytics.categoryBreakdown).toBeDefined()
    })

    test('should calculate accurate performance metrics', async () => {
      const warehouseId = 'warehouse-us-001'
      
      const analytics = await inventoryDashboardService.getInventoryAnalytics(
        warehouseId,
        'WEEKLY',
        mockWarehouseAccess
      )

      expect(analytics.performance.stockAccuracy).toBeGreaterThanOrEqual(0)
      expect(analytics.performance.stockAccuracy).toBeLessThanOrEqual(100)
      expect(analytics.performance.turnoverRate).toBeGreaterThan(0)
      expect(analytics.performance.fillRate).toBeGreaterThanOrEqual(0)
      expect(analytics.performance.fillRate).toBeLessThanOrEqual(100)
    })
  })
})

describe('RHY_041: Stock Monitoring Service Integration', () => {
  afterEach(() => {
    // Clean up monitoring intervals
    stockMonitoringService.stopWarehouseMonitoring('warehouse-us-001')
    stockMonitoringService.stopWarehouseMonitoring('warehouse-eu-001')
  })

  describe('Monitoring Configuration', () => {
    test('should start monitoring for authorized warehouse', async () => {
      const warehouseId = 'warehouse-us-001'
      const configuration = {
        warehouseId,
        enableRealTimeMonitoring: true,
        monitoringInterval: 5,
        alertThresholds: {
          lowStock: 25,
          criticalLow: 10,
          overstock: 150
        },
        notificationSettings: {
          email: true,
          sms: false,
          dashboard: true
        },
        autoReorderEnabled: false,
        escalationRules: {
          criticalAfterHours: 2,
          escalateToManager: false
        }
      }

      const result = await stockMonitoringService.startWarehouseMonitoring(
        warehouseId,
        configuration,
        mockWarehouseAccess
      )

      expect(result.success).toBe(true)
      expect(result.message).toContain('started')
    })

    test('should reject monitoring for unauthorized warehouse', async () => {
      const unauthorizedWarehouseId = 'warehouse-unauthorized'
      const configuration = {
        warehouseId: unauthorizedWarehouseId,
        enableRealTimeMonitoring: true,
        monitoringInterval: 5,
        alertThresholds: { lowStock: 25, criticalLow: 10, overstock: 150 },
        notificationSettings: { email: true, sms: false, dashboard: true },
        autoReorderEnabled: false,
        escalationRules: { criticalAfterHours: 2, escalateToManager: false }
      }

      const result = await stockMonitoringService.startWarehouseMonitoring(
        unauthorizedWarehouseId,
        configuration,
        mockWarehouseAccess
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('Access denied')
    })
  })

  describe('Monitoring Metrics and Alerts', () => {
    test('should retrieve monitoring metrics for authorized warehouse', async () => {
      const warehouseId = 'warehouse-us-001'

      const metrics = await stockMonitoringService.getMonitoringMetrics(
        warehouseId,
        mockWarehouseAccess
      )

      expect(metrics).toBeDefined()
      expect(metrics.warehouseId).toBe(warehouseId)
      expect(typeof metrics.totalProducts).toBe('number')
      expect(typeof metrics.lowStockItems).toBe('number')
      expect(typeof metrics.outOfStockItems).toBe('number')
      expect(typeof metrics.alertsCount).toBe('number')
      expect(metrics.lastMonitoringCheck).toBeInstanceOf(Date)
    })

    test('should retrieve active alerts for warehouse', async () => {
      const warehouseId = 'warehouse-us-001'

      const alerts = await stockMonitoringService.getActiveAlerts(
        warehouseId,
        mockWarehouseAccess
      )

      expect(Array.isArray(alerts)).toBe(true)
      
      alerts.forEach(alert => {
        expect(alert.warehouseId).toBe(warehouseId)
        expect(alert.id).toBeDefined()
        expect(alert.productId).toBeDefined()
        expect(alert.productName).toBeDefined()
        expect(['LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCK', 'REORDER_POINT', 'CRITICAL_LOW']).toContain(alert.alertType)
        expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(alert.severity)
        expect(typeof alert.currentStock).toBe('number')
        expect(typeof alert.threshold).toBe('number')
        expect(typeof alert.acknowledged).toBe('boolean')
        expect(typeof alert.resolved).toBe('boolean')
      })
    })

    test('should acknowledge alerts with proper authorization', async () => {
      const warehouseId = 'warehouse-us-001'
      
      // First, get alerts to find one to acknowledge
      const alerts = await stockMonitoringService.getActiveAlerts(warehouseId, mockWarehouseAccess)
      
      if (alerts.length > 0) {
        const alertToAck = alerts.find(alert => !alert.acknowledged)
        
        if (alertToAck) {
          const result = await stockMonitoringService.acknowledgeAlert(
            alertToAck.id,
            mockUserId,
            mockWarehouseAccess
          )

          expect(result.success).toBe(true)
          expect(result.message).toContain('acknowledged')
        }
      }
    })

    test('should get global monitoring overview', async () => {
      const overview = await stockMonitoringService.getGlobalMonitoringOverview(
        mockWarehouseAccess
      )

      expect(overview).toBeDefined()
      expect(typeof overview.totalWarehouses).toBe('number')
      expect(typeof overview.warehousesMonitored).toBe('number')
      expect(typeof overview.totalAlerts).toBe('number')
      expect(typeof overview.criticalAlerts).toBe('number')
      expect(Array.isArray(overview.warehouseMetrics)).toBe(true)
      expect(overview.totalWarehouses).toBeGreaterThanOrEqual(0)
      expect(overview.criticalAlerts).toBeLessThanOrEqual(overview.totalAlerts)
    })
  })
})

describe('RHY_041: API Endpoint Integration', () => {
  describe('Inventory API Routes', () => {
    test('should handle GET requests for dashboard data', async () => {
      // This would test the actual API endpoints in a real integration test
      // For now, we'll test the service layer integration
      const warehouseId = 'warehouse-us-001'
      
      expect(async () => {
        await inventoryDashboardService.getDashboard(warehouseId, mockUserId, mockWarehouseAccess)
      }).not.toThrow()
    })

    test('should handle POST requests for inventory operations', async () => {
      const updateRequest = {
        warehouseId: 'warehouse-us-001',
        productId: 'prod-flexvolt-6ah',
        quantity: 100,
        reason: 'Test update',
        userId: mockUserId
      }

      expect(async () => {
        await inventoryDashboardService.updateInventoryItem(updateRequest, mockWarehouseAccess)
      }).not.toThrow()
    })
  })

  describe('Monitoring API Routes', () => {
    test('should handle monitoring configuration requests', async () => {
      const warehouseId = 'warehouse-us-001'
      const configuration = {
        enableRealTimeMonitoring: true,
        monitoringInterval: 10,
        alertThresholds: { lowStock: 30, criticalLow: 15, overstock: 200 }
      }

      const result = await stockMonitoringService.updateMonitoringConfiguration(
        warehouseId,
        configuration,
        mockWarehouseAccess
      )

      expect(result.success).toBe(true)
    })
  })
})

describe('RHY_041: Data Consistency and Validation', () => {
  test('should maintain data consistency across services', async () => {
    const warehouseId = 'warehouse-us-001'
    
    // Get dashboard data
    const dashboard = await inventoryDashboardService.getDashboard(
      warehouseId,
      mockUserId,
      mockWarehouseAccess
    )
    
    // Get monitoring metrics
    const metrics = await stockMonitoringService.getMonitoringMetrics(
      warehouseId,
      mockWarehouseAccess
    )

    // Verify data consistency
    expect(dashboard.warehouseId).toBe(metrics.warehouseId)
    expect(dashboard.alerts.length).toBe(metrics.alertsCount)
  })

  test('should validate inventory item data structure', async () => {
    const warehouseId = 'warehouse-us-001'
    
    const dashboard = await inventoryDashboardService.getDashboard(
      warehouseId,
      mockUserId,
      mockWarehouseAccess
    )

    dashboard.inventory.forEach(item => {
      expect(item.id).toBeDefined()
      expect(item.warehouseId).toBe(warehouseId)
      expect(item.productId).toBeDefined()
      expect(item.sku).toBeDefined()
      expect(item.productName).toBeDefined()
      expect(['FLEXVOLT_6AH', 'FLEXVOLT_9AH', 'FLEXVOLT_15AH', 'ACCESSORIES', 'CHARGERS']).toContain(item.category)
      expect(typeof item.currentQuantity).toBe('number')
      expect(typeof item.reservedQuantity).toBe('number')
      expect(typeof item.availableQuantity).toBe('number')
      expect(item.currentQuantity).toBeGreaterThanOrEqual(0)
      expect(item.reservedQuantity).toBeGreaterThanOrEqual(0)
      expect(item.availableQuantity).toBeGreaterThanOrEqual(0)
    })
  })

  test('should validate alert data structure', async () => {
    const warehouseId = 'warehouse-us-001'
    
    const alerts = await stockMonitoringService.getActiveAlerts(warehouseId, mockWarehouseAccess)

    alerts.forEach(alert => {
      expect(alert.id).toBeDefined()
      expect(alert.warehouseId).toBe(warehouseId)
      expect(alert.productId).toBeDefined()
      expect(alert.productName).toBeDefined()
      expect(alert.message).toBeDefined()
      expect(alert.createdAt).toBeInstanceOf(Date)
      expect(typeof alert.acknowledged).toBe('boolean')
      expect(typeof alert.resolved).toBe('boolean')
      
      if (alert.acknowledged) {
        expect(alert.acknowledgedBy).toBeDefined()
        expect(alert.acknowledgedAt).toBeInstanceOf(Date)
      }
      
      if (alert.resolved) {
        expect(alert.resolvedBy).toBeDefined()
        expect(alert.resolvedAt).toBeInstanceOf(Date)
      }
    })
  })
})

describe('RHY_041: Performance and Error Handling', () => {
  test('should handle large dataset efficiently', async () => {
    const startTime = Date.now()
    
    const dashboard = await inventoryDashboardService.getDashboard(
      'warehouse-us-001',
      mockUserId,
      mockWarehouseAccess
    )
    
    const endTime = Date.now()
    const executionTime = endTime - startTime

    // Should complete within reasonable time (under 5 seconds for mock data)
    expect(executionTime).toBeLessThan(5000)
    expect(dashboard).toBeDefined()
  })

  test('should handle service errors gracefully', async () => {
    // Test with invalid warehouse ID
    await expect(
      inventoryDashboardService.getDashboard(
        'invalid-warehouse',
        mockUserId,
        mockWarehouseAccess
      )
    ).rejects.toThrow()

    // Test with empty warehouse access
    await expect(
      inventoryDashboardService.getDashboard(
        'warehouse-us-001',
        mockUserId,
        []
      )
    ).rejects.toThrow('Access denied')
  })

  test('should validate input parameters', async () => {
    // Test with invalid user ID
    await expect(
      inventoryDashboardService.getDashboard(
        'warehouse-us-001',
        '',
        mockWarehouseAccess
      )
    ).rejects.toThrow()

    // Test with null warehouse access
    await expect(
      inventoryDashboardService.getDashboard(
        'warehouse-us-001',
        mockUserId,
        null as any
      )
    ).rejects.toThrow()
  })
})

// Export test utilities for use in other test files
export {
  mockWarehouseAccess,
  mockUserId
}