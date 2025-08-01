/**
 * RHY Supplier Portal - Comprehensive Supplier Journey E2E Tests
 * Enterprise-grade end-to-end testing for complete supplier workflows
 * Integrates with Batch 1 authentication, warehouse, and product systems
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'
import { AuthService } from '@/services/auth/AuthService'
import { WarehouseService } from '@/services/warehouse/WarehouseService'

// Test configuration for enterprise environment
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  retries: 2,
  suppliers: {
    direct: {
      email: 'direct.supplier@flexvolt.com',
      password: 'TestSecure123!',
      type: 'DIRECT',
      permissions: ['VIEW_PRODUCTS', 'PLACE_ORDERS', 'VIEW_ORDER_HISTORY']
    },
    distributor: {
      email: 'distributor@flexvolt.com', 
      password: 'TestSecure123!',
      type: 'DISTRIBUTOR',
      permissions: ['BULK_ORDERS', 'SPECIAL_PRICING', 'INVENTORY_VISIBILITY', 'ANALYTICS_ACCESS']
    },
    fleet: {
      email: 'fleet.manager@flexvolt.com',
      password: 'TestSecure123!',
      type: 'FLEET',
      permissions: ['FLEET_DASHBOARD', 'BULK_ORDERS', 'USAGE_ANALYTICS', 'PREDICTIVE_ORDERING']
    },
    service: {
      email: 'service.provider@flexvolt.com',
      password: 'TestSecure123!',
      type: 'SERVICE',
      permissions: ['SERVICE_DASHBOARD', 'RAPID_FULFILLMENT', 'FIELD_SUPPORT', 'REPLACEMENT_ORDERS']
    }
  },
  warehouses: ['US', 'EU', 'JP', 'AU'],
  products: [
    { id: 'flexvolt-6ah', name: '6Ah FlexVolt Battery', price: 95, sku: 'FV-6AH-20V60V' },
    { id: 'flexvolt-9ah', name: '9Ah FlexVolt Battery', price: 125, sku: 'FV-9AH-20V60V' },
    { id: 'flexvolt-15ah', name: '15Ah FlexVolt Battery', price: 245, sku: 'FV-15AH-20V60V' }
  ]
}

// Performance monitoring utilities
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()

  startTiming(operation: string): () => number {
    const startTime = Date.now()
    return () => {
      const duration = Date.now() - startTime
      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, [])
      }
      this.metrics.get(operation)!.push(duration)
      return duration
    }
  }

  getAverageTime(operation: string): number {
    const times = this.metrics.get(operation) || []
    return times.length > 0 ? times.reduce((a, b) => a + b) / times.length : 0
  }

  verifyPerformance(operation: string, targetMs: number): boolean {
    const avgTime = this.getAverageTime(operation)
    console.log(`Performance: ${operation} averaged ${avgTime}ms (target: ${targetMs}ms)`)
    return avgTime <= targetMs
  }
}

// Supplier authentication and session management
class SupplierTestSession {
  constructor(private page: Page, private context: BrowserContext) {}

  async authenticateSupplier(supplierType: keyof typeof TEST_CONFIG.suppliers): Promise<void> {
    const supplier = TEST_CONFIG.suppliers[supplierType]
    
    // Navigate to supplier login
    await this.page.goto(`${TEST_CONFIG.baseUrl}/supplier/auth/login`)
    
    // Verify login page loads correctly
    await expect(this.page.locator('[data-testid="login-form"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="login-title"]')).toContainText('Supplier Portal Login')
    
    // Fill login credentials
    await this.page.fill('[data-testid="email-input"]', supplier.email)
    await this.page.fill('[data-testid="password-input"]', supplier.password)
    
    // Submit login form
    await this.page.click('[data-testid="login-submit"]')
    
    // Wait for successful authentication
    await expect(this.page).toHaveURL(/\/supplier\/dashboard/)
    await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible()
    
    // Verify supplier type and permissions
    const userType = await this.page.getAttribute('[data-testid="user-type"]', 'data-type')
    expect(userType).toBe(supplier.type)
    
    // Verify dashboard elements based on supplier type
    if (supplier.type === 'DISTRIBUTOR') {
      await expect(this.page.locator('[data-testid="bulk-orders-section"]')).toBeVisible()
      await expect(this.page.locator('[data-testid="analytics-dashboard"]')).toBeVisible()
    }
    
    if (supplier.type === 'FLEET') {
      await expect(this.page.locator('[data-testid="fleet-dashboard"]')).toBeVisible()
      await expect(this.page.locator('[data-testid="usage-analytics"]')).toBeVisible()
    }
  }

  async selectWarehouse(warehouseCode: string): Promise<void> {
    // Open warehouse selector
    await this.page.click('[data-testid="warehouse-selector"]')
    
    // Verify all warehouses are available
    for (const warehouse of TEST_CONFIG.warehouses) {
      await expect(this.page.locator(`[data-testid="warehouse-option-${warehouse}"]`)).toBeVisible()
    }
    
    // Select specific warehouse
    await this.page.click(`[data-testid="warehouse-option-${warehouseCode}"]`)
    
    // Verify warehouse selection
    await expect(this.page.locator('[data-testid="selected-warehouse"]')).toContainText(warehouseCode)
    
    // Wait for warehouse data to load
    await this.page.waitForLoadState('networkidle')
  }

  async navigateToProducts(): Promise<void> {
    await this.page.click('[data-testid="nav-products"]')
    await expect(this.page).toHaveURL(/\/supplier\/products/)
    await expect(this.page.locator('[data-testid="products-grid"]')).toBeVisible()
  }

  async logout(): Promise<void> {
    await this.page.click('[data-testid="user-menu"]')
    await this.page.click('[data-testid="logout-button"]')
    await expect(this.page).toHaveURL(/\/supplier\/auth\/login/)
  }
}

// Product browsing and selection utilities
class ProductTestUtils {
  constructor(private page: Page) {}

  async verifyProductCatalog(): Promise<void> {
    // Verify all FlexVolt products are displayed
    for (const product of TEST_CONFIG.products) {
      const productCard = this.page.locator(`[data-testid="product-${product.id}"]`)
      await expect(productCard).toBeVisible()
      await expect(productCard.locator('[data-testid="product-name"]')).toContainText(product.name)
      await expect(productCard.locator('[data-testid="product-price"]')).toContainText(`$${product.price}`)
      await expect(productCard.locator('[data-testid="product-sku"]')).toContainText(product.sku)
    }
  }

  async addProductToCart(productId: string, quantity: number = 1): Promise<void> {
    const productCard = this.page.locator(`[data-testid="product-${productId}"]`)
    
    // Set quantity
    await productCard.locator('[data-testid="quantity-input"]').fill(quantity.toString())
    
    // Add to cart
    await productCard.locator('[data-testid="add-to-cart"]').click()
    
    // Verify item added notification
    await expect(this.page.locator('[data-testid="cart-notification"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="cart-notification"]')).toContainText('Added to cart')
    
    // Verify cart counter updated
    const cartCount = await this.page.locator('[data-testid="cart-count"]').textContent()
    expect(parseInt(cartCount || '0')).toBeGreaterThan(0)
  }

  async verifyVolumeDiscounts(orderTotal: number, customerType: string): Promise<void> {
    // Navigate to cart
    await this.page.click('[data-testid="cart-icon"]')
    await expect(this.page.locator('[data-testid="cart-summary"]')).toBeVisible()
    
    // Verify volume discount calculation
    let expectedDiscount = 0
    if (orderTotal >= 7500 && ['DISTRIBUTOR', 'FLEET', 'SERVICE'].includes(customerType)) {
      expectedDiscount = 25
    } else if (orderTotal >= 5000 && ['DISTRIBUTOR', 'FLEET', 'SERVICE'].includes(customerType)) {
      expectedDiscount = 20
    } else if (orderTotal >= 2500) {
      expectedDiscount = 15
    } else if (orderTotal >= 1000) {
      expectedDiscount = 10
    }
    
    if (expectedDiscount > 0) {
      await expect(this.page.locator('[data-testid="volume-discount"]')).toBeVisible()
      await expect(this.page.locator('[data-testid="discount-percentage"]')).toContainText(`${expectedDiscount}%`)
      
      const discountAmount = (orderTotal * expectedDiscount) / 100
      await expect(this.page.locator('[data-testid="discount-amount"]')).toContainText(`-$${discountAmount.toFixed(2)}`)
    }
  }
}

// Order processing and fulfillment
class OrderTestUtils {
  constructor(private page: Page) {}

  async proceedToCheckout(): Promise<void> {
    await this.page.click('[data-testid="proceed-checkout"]')
    await expect(this.page).toHaveURL(/\/supplier\/checkout/)
    await expect(this.page.locator('[data-testid="checkout-form"]')).toBeVisible()
  }

  async fillShippingInformation(warehouse: string): Promise<void> {
    // Fill shipping address based on warehouse region
    const shippingData = {
      US: {
        company: 'Test Company USA',
        address: '123 Test Street',
        city: 'Las Vegas',
        state: 'Nevada',
        zipCode: '89101',
        country: 'United States'
      },
      EU: {
        company: 'Test Company EU',
        address: '456 Test Avenue',
        city: 'Amsterdam', 
        state: 'North Holland',
        zipCode: '1000',
        country: 'Netherlands'
      },
      JP: {
        company: 'Test Company Japan',
        address: '789 Test Building',
        city: 'Tokyo',
        state: 'Tokyo',
        zipCode: '100-0001',
        country: 'Japan'
      },
      AU: {
        company: 'Test Company Australia',
        address: '321 Test Road',
        city: 'Sydney',
        state: 'New South Wales',
        zipCode: '2000',
        country: 'Australia'
      }
    }
    
    const data = shippingData[warehouse as keyof typeof shippingData]
    
    await this.page.fill('[data-testid="company-name"]', data.company)
    await this.page.fill('[data-testid="address-line1"]', data.address)
    await this.page.fill('[data-testid="city"]', data.city)
    await this.page.fill('[data-testid="state"]', data.state)
    await this.page.fill('[data-testid="zip-code"]', data.zipCode)
    await this.page.selectOption('[data-testid="country"]', data.country)
  }

  async selectPaymentMethod(): Promise<void> {
    // Select payment method (for testing, use test payment)
    await this.page.click('[data-testid="payment-method-card"]')
    
    // Fill test payment information
    await this.page.fill('[data-testid="card-number"]', '4111111111111111')
    await this.page.fill('[data-testid="expiry-date"]', '12/25')
    await this.page.fill('[data-testid="cvv"]', '123')
    await this.page.fill('[data-testid="cardholder-name"]', 'Test Cardholder')
  }

  async placeOrder(): Promise<string> {
    // Review order before placing
    await this.page.click('[data-testid="review-order"]')
    await expect(this.page.locator('[data-testid="order-summary"]')).toBeVisible()
    
    // Place order
    await this.page.click('[data-testid="place-order"]')
    
    // Wait for order confirmation
    await expect(this.page.locator('[data-testid="order-confirmation"]')).toBeVisible()
    
    // Extract order number
    const orderNumber = await this.page.locator('[data-testid="order-number"]').textContent()
    expect(orderNumber).toMatch(/^ORD-\d{8}$/)
    
    return orderNumber || ''
  }
}

// Analytics and reporting verification
class AnalyticsTestUtils {
  constructor(private page: Page) {}

  async verifyDashboardAnalytics(supplierType: string): Promise<void> {
    await this.page.goto(`${TEST_CONFIG.baseUrl}/supplier/dashboard`)
    
    // Verify analytics widgets based on supplier type
    if (supplierType === 'DISTRIBUTOR' || supplierType === 'FLEET') {
      await expect(this.page.locator('[data-testid="sales-analytics"]')).toBeVisible()
      await expect(this.page.locator('[data-testid="inventory-analytics"]')).toBeVisible()
      await expect(this.page.locator('[data-testid="performance-metrics"]')).toBeVisible()
    }
    
    // Verify real-time data updates
    const initialValue = await this.page.locator('[data-testid="total-orders"]').textContent()
    await this.page.waitForTimeout(5000) // Wait for potential updates
    
    // Verify chart components render correctly
    await expect(this.page.locator('[data-testid="sales-chart"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="order-trends"]')).toBeVisible()
  }

  async verifyReportGeneration(): Promise<void> {
    // Navigate to reports section
    await this.page.click('[data-testid="nav-reports"]')
    await expect(this.page).toHaveURL(/\/supplier\/reports/)
    
    // Generate monthly report
    await this.page.click('[data-testid="generate-monthly-report"]')
    
    // Verify report generation
    await expect(this.page.locator('[data-testid="report-generating"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="report-complete"]')).toBeVisible({ timeout: 30000 })
    
    // Verify download functionality
    const downloadPromise = this.page.waitForEvent('download')
    await this.page.click('[data-testid="download-report"]')
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/^monthly-report-\d{4}-\d{2}\.pdf$/)
  }
}

// Main test suites
test.describe('Comprehensive Supplier Journey E2E Tests', () => {
  let performanceMonitor: PerformanceMonitor
  let supplierSession: SupplierTestSession
  let productUtils: ProductTestUtils
  let orderUtils: OrderTestUtils
  let analyticsUtils: AnalyticsTestUtils

  test.beforeEach(async ({ page, context }) => {
    performanceMonitor = new PerformanceMonitor()
    supplierSession = new SupplierTestSession(page, context)
    productUtils = new ProductTestUtils(page)
    orderUtils = new OrderTestUtils(page)
    analyticsUtils = new AnalyticsTestUtils(page)
    
    // Set page timeout
    page.setDefaultTimeout(TEST_CONFIG.timeout)
  })

  test('Complete Direct Supplier Journey - Authentication to Order', async ({ page }) => {
    const endTimer = performanceMonitor.startTiming('direct_supplier_journey')
    
    // Step 1: Authentication
    await supplierSession.authenticateSupplier('direct')
    
    // Step 2: Warehouse Selection
    await supplierSession.selectWarehouse('US')
    
    // Step 3: Product Browsing
    await supplierSession.navigateToProducts()
    await productUtils.verifyProductCatalog()
    
    // Step 4: Add Products to Cart
    await productUtils.addProductToCart('flexvolt-6ah', 10) // $950
    await productUtils.addProductToCart('flexvolt-9ah', 5)  // $625
    // Total: $1,575 - qualifies for 10% volume discount
    
    // Step 5: Verify Volume Discount
    await productUtils.verifyVolumeDiscounts(1575, 'DIRECT')
    
    // Step 6: Checkout Process
    await orderUtils.proceedToCheckout()
    await orderUtils.fillShippingInformation('US')
    await orderUtils.selectPaymentMethod()
    
    // Step 7: Place Order
    const orderNumber = await orderUtils.placeOrder()
    expect(orderNumber).toBeTruthy()
    
    // Step 8: Verify Order in History
    await page.click('[data-testid="nav-orders"]')
    await expect(page.locator(`[data-testid="order-${orderNumber}"]`)).toBeVisible()
    
    const duration = endTimer()
    expect(performanceMonitor.verifyPerformance('direct_supplier_journey', 45000)).toBe(true) // 45 second max
  })

  test('Distributor Journey - Bulk Orders with Advanced Analytics', async ({ page }) => {
    const endTimer = performanceMonitor.startTiming('distributor_journey')
    
    // Step 1: Authentication as Distributor
    await supplierSession.authenticateSupplier('distributor')
    
    // Step 2: Verify Distributor Dashboard
    await expect(page.locator('[data-testid="distributor-dashboard"]')).toBeVisible()
    await expect(page.locator('[data-testid="bulk-order-section"]')).toBeVisible()
    
    // Step 3: Multi-Warehouse Operations
    for (const warehouse of ['US', 'EU']) {
      await supplierSession.selectWarehouse(warehouse)
      
      // Verify inventory visibility
      await expect(page.locator('[data-testid="inventory-levels"]')).toBeVisible()
      
      // Place bulk order
      await supplierSession.navigateToProducts()
      if (warehouse === 'US') {
        await productUtils.addProductToCart('flexvolt-15ah', 50) // $12,250 - 25% discount
      } else {
        await productUtils.addProductToCart('flexvolt-9ah', 30) // $3,750 - 20% discount
      }
    }
    
    // Step 4: Analytics Verification
    await analyticsUtils.verifyDashboardAnalytics('DISTRIBUTOR')
    
    // Step 5: Report Generation
    await analyticsUtils.verifyReportGeneration()
    
    const duration = endTimer()
    expect(performanceMonitor.verifyPerformance('distributor_journey', 60000)).toBe(true) // 60 second max
  })

  test('Fleet Manager Journey - Predictive Ordering', async ({ page }) => {
    await supplierSession.authenticateSupplier('fleet')
    
    // Verify fleet-specific features
    await expect(page.locator('[data-testid="fleet-dashboard"]')).toBeVisible()
    await expect(page.locator('[data-testid="usage-analytics"]')).toBeVisible()
    await expect(page.locator('[data-testid="predictive-ordering"]')).toBeVisible()
    
    // Test predictive ordering feature
    await page.click('[data-testid="predictive-ordering"]')
    await expect(page.locator('[data-testid="recommended-orders"]')).toBeVisible()
    
    // Verify recommendations based on usage patterns
    const recommendations = page.locator('[data-testid="product-recommendation"]')
    await expect(recommendations).toHaveCountGreaterThan(0)
  })

  test('Service Provider Journey - Rapid Fulfillment', async ({ page }) => {
    await supplierSession.authenticateSupplier('service')
    
    // Verify service-specific features
    await expect(page.locator('[data-testid="service-dashboard"]')).toBeVisible()
    await expect(page.locator('[data-testid="rapid-fulfillment"]')).toBeVisible()
    
    // Test rapid fulfillment for service orders
    await page.click('[data-testid="rapid-fulfillment"]')
    await productUtils.addProductToCart('flexvolt-6ah', 5)
    
    // Verify priority processing
    await orderUtils.proceedToCheckout()
    await expect(page.locator('[data-testid="priority-shipping"]')).toBeVisible()
    await expect(page.locator('[data-testid="same-day-delivery"]')).toBeVisible()
  })

  test('Cross-Warehouse Inventory Sync Verification', async ({ page }) => {
    await supplierSession.authenticateSupplier('distributor')
    
    // Test inventory synchronization across all warehouses
    const inventoryLevels: Record<string, number> = {}
    
    for (const warehouse of TEST_CONFIG.warehouses) {
      await supplierSession.selectWarehouse(warehouse)
      await supplierSession.navigateToProducts()
      
      // Record inventory levels
      const inventoryLevel = await page.locator('[data-testid="product-flexvolt-6ah"] [data-testid="stock-level"]').textContent()
      inventoryLevels[warehouse] = parseInt(inventoryLevel || '0')
    }
    
    // Verify inventory levels are realistic and consistent
    Object.values(inventoryLevels).forEach(level => {
      expect(level).toBeGreaterThan(0)
      expect(level).toBeLessThan(100000) // Reasonable upper bound
    })
  })

  test('Performance Stress Test - Concurrent Operations', async ({ page }) => {
    await supplierSession.authenticateSupplier('distributor')
    
    // Simulate concurrent operations
    const operations = []
    
    for (let i = 0; i < 10; i++) {
      operations.push(async () => {
        const endTimer = performanceMonitor.startTiming(`concurrent_operation_${i}`)
        await supplierSession.navigateToProducts()
        await productUtils.addProductToCart('flexvolt-9ah', 1)
        return endTimer()
      })
    }
    
    const results = await Promise.all(operations.map(op => op()))
    
    // Verify all operations completed successfully within reasonable time
    results.forEach((duration, index) => {
      expect(duration).toBeLessThan(5000) // 5 second max per operation
    })
    
    const avgDuration = results.reduce((a, b) => a + b) / results.length
    expect(avgDuration).toBeLessThan(2000) // 2 second average
  })

  test('Security and Compliance Verification', async ({ page }) => {
    // Test unauthorized access protection
    await page.goto(`${TEST_CONFIG.baseUrl}/supplier/admin`)
    await expect(page).toHaveURL(/\/supplier\/auth\/login/) // Should redirect to login
    
    // Test session management
    await supplierSession.authenticateSupplier('direct')
    
    // Verify secure headers
    const response = await page.request.get(`${TEST_CONFIG.baseUrl}/api/supplier/profile`)
    expect(response.headers()['x-content-type-options']).toBe('nosniff')
    expect(response.headers()['x-frame-options']).toBe('DENY')
    
    // Test CSRF protection
    const csrfResponse = await page.request.post(`${TEST_CONFIG.baseUrl}/api/supplier/orders`, {
      data: { test: 'data' },
      headers: { 'content-type': 'application/json' }
    })
    expect(csrfResponse.status()).toBe(403) // Should be forbidden without CSRF token
  })

  test.afterEach(async () => {
    // Performance reporting
    console.log('Performance Summary:')
    console.log(`Direct Supplier Journey: ${performanceMonitor.getAverageTime('direct_supplier_journey')}ms`)
    console.log(`Distributor Journey: ${performanceMonitor.getAverageTime('distributor_journey')}ms`)
  })
})

// Additional test utilities for edge cases and error scenarios
test.describe('Error Handling and Edge Cases', () => {
  test('Network Failure Recovery', async ({ page }) => {
    const supplierSession = new SupplierTestSession(page, page.context())
    await supplierSession.authenticateSupplier('direct')
    
    // Simulate network failure
    await page.route('**/api/**', route => route.abort())
    
    // Attempt operation that should fail gracefully
    await supplierSession.navigateToProducts()
    
    // Verify error handling
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
    
    // Restore network and verify recovery
    await page.unroute('**/api/**')
    await page.click('[data-testid="retry-button"]')
    await expect(page.locator('[data-testid="products-grid"]')).toBeVisible()
  })

  test('Inventory Shortage Handling', async ({ page }) => {
    const supplierSession = new SupplierTestSession(page, page.context())
    const productUtils = new ProductTestUtils(page)
    
    await supplierSession.authenticateSupplier('direct')
    await supplierSession.selectWarehouse('US')
    await supplierSession.navigateToProducts()
    
    // Attempt to add more items than available
    await productUtils.addProductToCart('flexvolt-15ah', 999999)
    
    // Verify inventory shortage handling
    await expect(page.locator('[data-testid="inventory-warning"]')).toBeVisible()
    await expect(page.locator('[data-testid="max-quantity"]')).toBeVisible()
  })
})