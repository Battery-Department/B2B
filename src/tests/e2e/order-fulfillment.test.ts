/**
 * RHY Supplier Portal - Order Fulfillment E2E Tests
 * Comprehensive testing for FlexVolt battery order processing and fulfillment
 * Tests complete order lifecycle from placement to delivery across global warehouses
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'
import { OrderService } from '@/services/order/OrderService'
import { PaymentService } from '@/services/payment/PaymentService'
import { ShippingService } from '@/services/shipping/ShippingService'

// Order fulfillment test configuration
const ORDER_CONFIG = {
  flexvoltProducts: {
    'flexvolt-6ah': {
      id: 'flexvolt-6ah',
      name: '6Ah FlexVolt Battery',
      sku: 'FV-6AH-20V60V',
      price: 95.00,
      weight: 2.5, // kg
      dimensions: { length: 15, width: 10, height: 8 }, // cm
      category: 'Professional Grade',
      compatibility: '20V/60V MAX',
      targetMarket: 'Daily use contractors'
    },
    'flexvolt-9ah': {
      id: 'flexvolt-9ah',
      name: '9Ah FlexVolt Battery',
      sku: 'FV-9AH-20V60V',
      price: 125.00,
      weight: 3.2, // kg
      dimensions: { length: 18, width: 10, height: 8 }, // cm
      category: 'Extended Runtime',
      compatibility: '20V/60V MAX',
      targetMarket: 'Heavy-duty contractors'
    },
    'flexvolt-15ah': {
      id: 'flexvolt-15ah',
      name: '15Ah FlexVolt Battery',
      sku: 'FV-15AH-20V60V',
      price: 245.00,
      weight: 4.8, // kg
      dimensions: { length: 22, width: 12, height: 10 }, // cm
      category: 'Maximum Power',
      compatibility: '20V/60V MAX',
      targetMarket: 'Industrial operations'
    }
  },
  volumeDiscounts: [
    { threshold: 1000, percentage: 10, tier: 'Contractor', eligibleTypes: ['DIRECT', 'CONTRACTOR'] },
    { threshold: 2500, percentage: 15, tier: 'Professional', eligibleTypes: ['DIRECT', 'CONTRACTOR', 'DISTRIBUTOR'] },
    { threshold: 5000, percentage: 20, tier: 'Commercial', eligibleTypes: ['DISTRIBUTOR', 'FLEET', 'SERVICE'] },
    { threshold: 7500, percentage: 25, tier: 'Enterprise', eligibleTypes: ['FLEET', 'SERVICE', 'DISTRIBUTOR'] }
  ],
  shippingMethods: {
    STANDARD: { name: 'Standard Shipping', timeframe: '5-7 business days', cost: 15.00 },
    EXPEDITED: { name: 'Expedited Shipping', timeframe: '2-3 business days', cost: 35.00 },
    OVERNIGHT: { name: 'Overnight Delivery', timeframe: 'Next business day', cost: 65.00 },
    SAME_DAY: { name: 'Same Day Delivery', timeframe: 'Same day', cost: 125.00 }
  },
  paymentMethods: ['CREDIT_CARD', 'PURCHASE_ORDER', 'NET_30', 'WIRE_TRANSFER'],
  orderStatuses: ['PENDING', 'CONFIRMED', 'PROCESSING', 'PICKING', 'PACKING', 'SHIPPED', 'DELIVERED', 'COMPLETED'],
  performanceTargets: {
    orderPlacement: 5000, // ms
    paymentProcessing: 10000, // ms
    orderConfirmation: 2000, // ms
    shippingCalculation: 1000, // ms
    fulfillmentStart: 30000 // ms
  }
}

// Order fulfillment performance monitoring
class OrderPerformanceMonitor {
  private orderMetrics: Map<string, {
    placementTime: number,
    confirmationTime: number,
    fulfillmentTime: number,
    errors: string[]
  }> = new Map()

  startOrderTracking(orderId: string): {
    recordPlacement: () => void,
    recordConfirmation: () => void,
    recordFulfillment: () => void,
    recordError: (error: string) => void,
    getMetrics: () => any
  } {
    const startTime = Date.now()
    this.orderMetrics.set(orderId, {
      placementTime: 0,
      confirmationTime: 0,
      fulfillmentTime: 0,
      errors: []
    })

    return {
      recordPlacement: () => {
        const metrics = this.orderMetrics.get(orderId)!
        metrics.placementTime = Date.now() - startTime
      },
      recordConfirmation: () => {
        const metrics = this.orderMetrics.get(orderId)!
        metrics.confirmationTime = Date.now() - startTime
      },
      recordFulfillment: () => {
        const metrics = this.orderMetrics.get(orderId)!
        metrics.fulfillmentTime = Date.now() - startTime
      },
      recordError: (error: string) => {
        const metrics = this.orderMetrics.get(orderId)!
        metrics.errors.push(error)
      },
      getMetrics: () => this.orderMetrics.get(orderId)
    }
  }

  generatePerformanceReport(): {
    avgPlacementTime: number,
    avgConfirmationTime: number,
    avgFulfillmentTime: number,
    errorRate: number,
    totalOrders: number
  } {
    const metrics = Array.from(this.orderMetrics.values())
    
    if (metrics.length === 0) {
      return { avgPlacementTime: 0, avgConfirmationTime: 0, avgFulfillmentTime: 0, errorRate: 0, totalOrders: 0 }
    }

    return {
      avgPlacementTime: metrics.reduce((sum, m) => sum + m.placementTime, 0) / metrics.length,
      avgConfirmationTime: metrics.reduce((sum, m) => sum + m.confirmationTime, 0) / metrics.length,
      avgFulfillmentTime: metrics.reduce((sum, m) => sum + m.fulfillmentTime, 0) / metrics.length,
      errorRate: (metrics.reduce((sum, m) => sum + m.errors.length, 0) / metrics.length) * 100,
      totalOrders: metrics.length
    }
  }
}

// Order placement and management utilities
class OrderTestManager {
  constructor(private page: Page, private performanceMonitor: OrderPerformanceMonitor) {}

  async authenticateCustomer(customerType: 'DIRECT' | 'DISTRIBUTOR' | 'FLEET' | 'SERVICE'): Promise<void> {
    const credentials = {
      DIRECT: { email: 'direct.customer@flexvolt.com', password: 'TestSecure123!' },
      DISTRIBUTOR: { email: 'distributor@flexvolt.com', password: 'TestSecure123!' },
      FLEET: { email: 'fleet.manager@flexvolt.com', password: 'TestSecure123!' },
      SERVICE: { email: 'service.provider@flexvolt.com', password: 'TestSecure123!' }
    }

    const creds = credentials[customerType]
    
    await this.page.goto('/supplier/auth/login')
    await this.page.fill('[data-testid="email-input"]', creds.email)
    await this.page.fill('[data-testid="password-input"]', creds.password)
    await this.page.click('[data-testid="login-submit"]')
    
    await expect(this.page).toHaveURL(/\/supplier\/dashboard/)
    await expect(this.page.locator('[data-testid="user-type"]')).toContainText(customerType)
  }

  async selectWarehouseForOrdering(warehouseCode: string): Promise<void> {
    await this.page.click('[data-testid="warehouse-selector"]')
    await this.page.click(`[data-testid="warehouse-option-${warehouseCode}"]`)
    await expect(this.page.locator('[data-testid="selected-warehouse"]')).toContainText(warehouseCode)
  }

  async createFlexVoltOrder(products: { productId: string, quantity: number }[], customerType: string): Promise<{
    orderId: string,
    orderTotal: number,
    discountApplied: number
  }> {
    // Navigate to products
    await this.page.click('[data-testid="nav-products"]')
    await expect(this.page.locator('[data-testid="products-grid"]')).toBeVisible()

    let orderTotal = 0
    
    // Add products to cart
    for (const { productId, quantity } of products) {
      const product = ORDER_CONFIG.flexvoltProducts[productId as keyof typeof ORDER_CONFIG.flexvoltProducts]
      const productCard = this.page.locator(`[data-testid="product-${productId}"]`)
      
      // Verify product information
      await expect(productCard.locator('[data-testid="product-name"]')).toContainText(product.name)
      await expect(productCard.locator('[data-testid="product-price"]')).toContainText(`$${product.price}`)
      await expect(productCard.locator('[data-testid="product-sku"]')).toContainText(product.sku)
      
      // Set quantity and add to cart
      await productCard.locator('[data-testid="quantity-input"]').fill(quantity.toString())
      await productCard.locator('[data-testid="add-to-cart"]').click()
      
      orderTotal += product.price * quantity
      
      // Verify cart notification
      await expect(this.page.locator('[data-testid="cart-notification"]')).toBeVisible()
    }

    // Navigate to cart
    await this.page.click('[data-testid="cart-icon"]')
    await expect(this.page.locator('[data-testid="cart-summary"]')).toBeVisible()

    // Verify cart contents
    for (const { productId, quantity } of products) {
      const cartItem = this.page.locator(`[data-testid="cart-item-${productId}"]`)
      await expect(cartItem).toBeVisible()
      await expect(cartItem.locator('[data-testid="item-quantity"]')).toHaveValue(quantity.toString())
    }

    // Calculate and verify volume discount
    const applicableDiscount = ORDER_CONFIG.volumeDiscounts
      .filter(discount => orderTotal >= discount.threshold && discount.eligibleTypes.includes(customerType))
      .sort((a, b) => b.threshold - a.threshold)[0]

    let discountApplied = 0
    if (applicableDiscount) {
      discountApplied = applicableDiscount.percentage
      const discountAmount = (orderTotal * discountApplied) / 100
      
      await expect(this.page.locator('[data-testid="volume-discount"]')).toBeVisible()
      await expect(this.page.locator('[data-testid="discount-percentage"]')).toContainText(`${discountApplied}%`)
      await expect(this.page.locator('[data-testid="discount-amount"]')).toContainText(`-$${discountAmount.toFixed(2)}`)
    }

    // Proceed to checkout
    await this.page.click('[data-testid="proceed-checkout"]')
    await expect(this.page).toHaveURL(/\/supplier\/checkout/)

    // Extract order ID from checkout page
    const orderIdElement = await this.page.locator('[data-testid="draft-order-id"]').textContent()
    const orderId = orderIdElement || `ORD-${Date.now()}`

    return { orderId, orderTotal, discountApplied }
  }

  async completeShippingInformation(warehouseCode: string): Promise<void> {
    const shippingAddresses = {
      US: {
        company: 'FlexVolt Test Company USA',
        address1: '123 Construction Blvd',
        address2: 'Suite 100',
        city: 'Las Vegas',
        state: 'Nevada',
        zipCode: '89101',
        country: 'United States',
        phone: '+1-555-123-4567'
      },
      EU: {
        company: 'FlexVolt Test Company EU',
        address1: '456 Industrial Ave',
        address2: 'Floor 2',
        city: 'Amsterdam',
        state: 'North Holland',
        zipCode: '1000 AA',
        country: 'Netherlands',
        phone: '+31-20-123-4567'
      },
      JP: {
        company: 'FlexVolt Test Company Japan',
        address1: '789 Business District',
        address2: 'Building 3F',
        city: 'Tokyo',
        state: 'Tokyo',
        zipCode: '100-0001',
        country: 'Japan',
        phone: '+81-3-1234-5678'
      },
      AU: {
        company: 'FlexVolt Test Company Australia',
        address1: '321 Trade Centre',
        address2: 'Unit 5',
        city: 'Sydney',
        state: 'New South Wales',
        zipCode: '2000',
        country: 'Australia',
        phone: '+61-2-1234-5678'
      }
    }

    const address = shippingAddresses[warehouseCode as keyof typeof shippingAddresses]
    
    await this.page.fill('[data-testid="company-name"]', address.company)
    await this.page.fill('[data-testid="address-line1"]', address.address1)
    await this.page.fill('[data-testid="address-line2"]', address.address2)
    await this.page.fill('[data-testid="city"]', address.city)
    await this.page.fill('[data-testid="state"]', address.state)
    await this.page.fill('[data-testid="zip-code"]', address.zipCode)
    await this.page.selectOption('[data-testid="country"]', address.country)
    await this.page.fill('[data-testid="phone"]', address.phone)
  }

  async selectShippingMethod(method: keyof typeof ORDER_CONFIG.shippingMethods): Promise<number> {
    const shippingOption = ORDER_CONFIG.shippingMethods[method]
    
    await this.page.click(`[data-testid="shipping-method-${method}"]`)
    
    // Verify shipping details
    await expect(this.page.locator('[data-testid="selected-shipping-name"]')).toContainText(shippingOption.name)
    await expect(this.page.locator('[data-testid="selected-shipping-timeframe"]')).toContainText(shippingOption.timeframe)
    await expect(this.page.locator('[data-testid="selected-shipping-cost"]')).toContainText(`$${shippingOption.cost}`)
    
    return shippingOption.cost
  }

  async processPayment(method: 'CREDIT_CARD' | 'PURCHASE_ORDER' | 'NET_30'): Promise<void> {
    await this.page.click(`[data-testid="payment-method-${method}"]`)
    
    if (method === 'CREDIT_CARD') {
      // Fill credit card information
      await this.page.fill('[data-testid="card-number"]', '4111111111111111')
      await this.page.fill('[data-testid="expiry-date"]', '12/25')
      await this.page.fill('[data-testid="cvv"]', '123')
      await this.page.fill('[data-testid="cardholder-name"]', 'Test Cardholder')
      await this.page.fill('[data-testid="billing-zip"]', '89101')
    } else if (method === 'PURCHASE_ORDER') {
      await this.page.fill('[data-testid="po-number"]', `PO-${Date.now()}`)
      await this.page.fill('[data-testid="po-reference"]', 'FlexVolt Battery Order')
    }
    // NET_30 requires no additional information
  }

  async placeOrder(): Promise<string> {
    // Review order summary before placing
    await this.page.click('[data-testid="review-order"]')
    await expect(this.page.locator('[data-testid="order-review-summary"]')).toBeVisible()
    
    // Verify order details one final time
    await expect(this.page.locator('[data-testid="order-subtotal"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="order-tax"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="order-shipping"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="order-total"]')).toBeVisible()
    
    // Place the order
    await this.page.click('[data-testid="place-order"]')
    
    // Wait for order confirmation
    await expect(this.page.locator('[data-testid="order-confirmation"]')).toBeVisible()
    
    // Extract and return order number
    const orderNumber = await this.page.locator('[data-testid="order-number"]').textContent()
    expect(orderNumber).toMatch(/^ORD-\d{8}$/)
    
    return orderNumber || ''
  }
}

// Order tracking and fulfillment verification
class FulfillmentTestManager {
  constructor(private page: Page) {}

  async trackOrderProgress(orderNumber: string): Promise<string[]> {
    // Navigate to order tracking
    await this.page.goto('/supplier/orders')
    await this.page.fill('[data-testid="order-search"]', orderNumber)
    await this.page.click('[data-testid="search-orders"]')
    
    // Click on the order to view details
    await this.page.click(`[data-testid="order-${orderNumber}"]`)
    await expect(this.page.locator('[data-testid="order-details"]')).toBeVisible()
    
    // Get order status history
    const statusHistory = []
    const statusElements = await this.page.locator('[data-testid^="status-"]').all()
    
    for (const element of statusElements) {
      const status = await element.getAttribute('data-testid')
      const isActive = await element.locator('[data-testid="status-active"]').isVisible()
      if (isActive) {
        statusHistory.push(status?.replace('status-', '') || '')
      }
    }
    
    return statusHistory
  }

  async verifyOrderFulfillmentSteps(orderNumber: string): Promise<void> {
    // Check that order goes through proper fulfillment workflow
    await this.page.goto(`/supplier/orders/${orderNumber}`)
    
    // Verify order details
    await expect(this.page.locator('[data-testid="order-number"]')).toContainText(orderNumber)
    await expect(this.page.locator('[data-testid="order-status"]')).toBeVisible()
    
    // Verify fulfillment timeline
    await expect(this.page.locator('[data-testid="fulfillment-timeline"]')).toBeVisible()
    
    // Check for expected statuses
    const expectedStatuses = ['CONFIRMED', 'PROCESSING', 'PICKING', 'PACKING']
    for (const status of expectedStatuses) {
      await expect(this.page.locator(`[data-testid="timeline-${status}"]`)).toBeVisible()
    }
  }

  async verifyShippingInformation(orderNumber: string): Promise<void> {
    await this.page.goto(`/supplier/orders/${orderNumber}`)
    
    // Verify shipping details
    await expect(this.page.locator('[data-testid="shipping-address"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="shipping-method"]')).toBeVisible()
    
    // Check for tracking information once shipped
    const orderStatus = await this.page.locator('[data-testid="current-status"]').textContent()
    
    if (orderStatus === 'SHIPPED') {
      await expect(this.page.locator('[data-testid="tracking-number"]')).toBeVisible()
      await expect(this.page.locator('[data-testid="carrier-info"]')).toBeVisible()
      
      const trackingNumber = await this.page.locator('[data-testid="tracking-number"]').textContent()
      expect(trackingNumber).toMatch(/^[A-Z0-9]{10,}$/)
    }
  }

  async verifyInventoryImpact(products: { productId: string, quantity: number }[], warehouseCode: string): Promise<void> {
    // Navigate to warehouse inventory
    await this.page.goto('/supplier/warehouse/inventory')
    await this.page.click('[data-testid="warehouse-selector"]')
    await this.page.click(`[data-testid="warehouse-option-${warehouseCode}"]`)
    
    // Check that inventory levels decreased appropriately
    for (const { productId, quantity } of products) {
      const inventoryCard = this.page.locator(`[data-testid="inventory-${productId}"]`)
      await expect(inventoryCard).toBeVisible()
      
      // Verify inventory movement was recorded
      await inventoryCard.click()
      await expect(this.page.locator('[data-testid="inventory-history"]')).toBeVisible()
      
      // Look for order fulfillment record
      await expect(this.page.locator('[data-testid="movement-type-ORDER_FULFILLMENT"]')).toBeVisible()
    }
  }
}

// Main order fulfillment test suites
test.describe('Comprehensive Order Fulfillment E2E Tests', () => {
  let performanceMonitor: OrderPerformanceMonitor
  let orderManager: OrderTestManager
  let fulfillmentManager: FulfillmentTestManager

  test.beforeEach(async ({ page }) => {
    performanceMonitor = new OrderPerformanceMonitor()
    orderManager = new OrderTestManager(page, performanceMonitor)
    fulfillmentManager = new FulfillmentTestManager(page)
    
    page.setDefaultTimeout(30000)
  })

  test('Complete Direct Customer Order - 6Ah FlexVolt Batteries', async ({ page }) => {
    await orderManager.authenticateCustomer('DIRECT')
    await orderManager.selectWarehouseForOrdering('US')
    
    const products = [{ productId: 'flexvolt-6ah', quantity: 12 }] // $1,140 - 10% discount
    const { orderId, orderTotal, discountApplied } = await orderManager.createFlexVoltOrder(products, 'DIRECT')
    
    const orderTracker = performanceMonitor.startOrderTracking(orderId)
    orderTracker.recordPlacement()
    
    // Complete shipping information
    await orderManager.completeShippingInformation('US')
    
    // Select shipping method
    const shippingCost = await orderManager.selectShippingMethod('STANDARD')
    
    // Process payment
    await orderManager.processPayment('CREDIT_CARD')
    
    // Place order
    const orderNumber = await orderManager.placeOrder()
    orderTracker.recordConfirmation()
    
    // Verify order confirmation details
    await expect(page.locator('[data-testid="order-confirmation-total"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-confirmation-items"]')).toContainText('12')
    await expect(page.locator('[data-testid="order-confirmation-discount"]')).toContainText('10%')
    
    // Verify order in system
    await fulfillmentManager.verifyOrderFulfillmentSteps(orderNumber)
    
    const metrics = orderTracker.getMetrics()
    expect(metrics.placementTime).toBeLessThan(ORDER_CONFIG.performanceTargets.orderPlacement)
    expect(metrics.confirmationTime).toBeLessThan(ORDER_CONFIG.performanceTargets.orderConfirmation)
  })

  test('Distributor Bulk Order - Mixed FlexVolt Products', async ({ page }) => {
    await orderManager.authenticateCustomer('DISTRIBUTOR')
    await orderManager.selectWarehouseForOrdering('EU')
    
    const products = [
      { productId: 'flexvolt-6ah', quantity: 25 }, // $2,375
      { productId: 'flexvolt-9ah', quantity: 15 }, // $1,875  
      { productId: 'flexvolt-15ah', quantity: 8 }   // $1,960
    ] // Total: $6,210 - 20% discount
    
    const { orderId, orderTotal, discountApplied } = await orderManager.createFlexVoltOrder(products, 'DISTRIBUTOR')
    
    expect(orderTotal).toBe(6210)
    expect(discountApplied).toBe(20)
    
    const orderTracker = performanceMonitor.startOrderTracking(orderId)
    orderTracker.recordPlacement()
    
    // Complete shipping to EU address
    await orderManager.completeShippingInformation('EU')
    
    // Select expedited shipping for bulk order
    await orderManager.selectShippingMethod('EXPEDITED')
    
    // Use purchase order payment
    await orderManager.processPayment('PURCHASE_ORDER')
    
    const orderNumber = await orderManager.placeOrder()
    orderTracker.recordConfirmation()
    
    // Verify bulk order handling
    await expect(page.locator('[data-testid="bulk-order-notification"]')).toBeVisible()
    await expect(page.locator('[data-testid="priority-processing"]')).toBeVisible()
    
    // Track fulfillment progress
    await fulfillmentManager.verifyOrderFulfillmentSteps(orderNumber)
    await fulfillmentManager.verifyInventoryImpact(products, 'EU')
  })

  test('Fleet Manager Enterprise Order - Maximum Discount Tier', async ({ page }) => {
    await orderManager.authenticateCustomer('FLEET')
    await orderManager.selectWarehouseForOrdering('US')
    
    const products = [
      { productId: 'flexvolt-15ah', quantity: 35 } // $8,575 - 25% discount
    ]
    
    const { orderId, orderTotal, discountApplied } = await orderManager.createFlexVoltOrder(products, 'FLEET')
    
    expect(orderTotal).toBe(8575)
    expect(discountApplied).toBe(25) // Enterprise tier discount
    
    // Verify fleet-specific features
    await expect(page.locator('[data-testid="fleet-order-benefits"]')).toBeVisible()
    await expect(page.locator('[data-testid="volume-pricing-info"]')).toBeVisible()
    
    await orderManager.completeShippingInformation('US')
    await orderManager.selectShippingMethod('SAME_DAY') // Fleet priority shipping
    await orderManager.processPayment('NET_30') // Fleet payment terms
    
    const orderNumber = await orderManager.placeOrder()
    
    // Verify enterprise order handling
    await expect(page.locator('[data-testid="enterprise-order-confirmation"]')).toBeVisible()
    await expect(page.locator('[data-testid="account-manager-assigned"]')).toBeVisible()
  })

  test('Service Provider Rapid Fulfillment Order', async ({ page }) => {
    await orderManager.authenticateCustomer('SERVICE')
    await orderManager.selectWarehouseForOrdering('AU')
    
    const products = [
      { productId: 'flexvolt-6ah', quantity: 8 },   // $760
      { productId: 'flexvolt-9ah', quantity: 6 }    // $750
    ] // Total: $1,510 - 10% discount
    
    const { orderId } = await orderManager.createFlexVoltOrder(products, 'SERVICE')
    
    // Verify service provider features
    await expect(page.locator('[data-testid="rapid-fulfillment-option"]')).toBeVisible()
    await expect(page.locator('[data-testid="field-support-contact"]')).toBeVisible()
    
    await orderManager.completeShippingInformation('AU')
    await orderManager.selectShippingMethod('OVERNIGHT')
    await orderManager.processPayment('CREDIT_CARD')
    
    const orderNumber = await orderManager.placeOrder()
    
    // Verify rapid fulfillment processing
    await expect(page.locator('[data-testid="rapid-fulfillment-confirmed"]')).toBeVisible()
    await expect(page.locator('[data-testid="priority-warehouse-notification"]')).toBeVisible()
  })

  test('Cross-Warehouse Order Routing and Fulfillment', async ({ page }) => {
    await orderManager.authenticateCustomer('DISTRIBUTOR')
    
    // Test order routing based on inventory availability
    const warehouses = ['US', 'EU', 'JP', 'AU']
    const orderResults = []
    
    for (const warehouse of warehouses) {
      await orderManager.selectWarehouseForOrdering(warehouse)
      
      const products = [{ productId: 'flexvolt-9ah', quantity: 5 }]
      const { orderId } = await orderManager.createFlexVoltOrder(products, 'DISTRIBUTOR')
      
      await orderManager.completeShippingInformation(warehouse)
      await orderManager.selectShippingMethod('STANDARD')
      await orderManager.processPayment('PURCHASE_ORDER')
      
      const orderNumber = await orderManager.placeOrder()
      orderResults.push({ warehouse, orderNumber })
      
      // Verify regional compliance and processing
      await fulfillmentManager.verifyOrderFulfillmentSteps(orderNumber)
    }
    
    // Verify all orders were processed correctly
    expect(orderResults).toHaveLength(4)
    orderResults.forEach(result => {
      expect(result.orderNumber).toMatch(/^ORD-\d{8}$/)
    })
  })

  test('Order Modification and Cancellation Workflow', async ({ page }) => {
    await orderManager.authenticateCustomer('DIRECT')
    await orderManager.selectWarehouseForOrdering('US')
    
    const products = [{ productId: 'flexvolt-6ah', quantity: 5 }]
    const { orderId } = await orderManager.createFlexVoltOrder(products, 'DIRECT')
    
    await orderManager.completeShippingInformation('US')
    await orderManager.selectShippingMethod('STANDARD')
    await orderManager.processPayment('CREDIT_CARD')
    
    const orderNumber = await orderManager.placeOrder()
    
    // Attempt to modify order (should be possible within time window)
    await page.goto(`/supplier/orders/${orderNumber}`)
    
    const orderStatus = await page.locator('[data-testid="current-status"]').textContent()
    
    if (orderStatus === 'CONFIRMED' || orderStatus === 'PENDING') {
      // Test order modification
      await page.click('[data-testid="modify-order"]')
      await expect(page.locator('[data-testid="modification-form"]')).toBeVisible()
      
      // Increase quantity
      await page.fill('[data-testid="modify-quantity-flexvolt-6ah"]', '7')
      await page.click('[data-testid="submit-modification"]')
      
      await expect(page.locator('[data-testid="modification-confirmed"]')).toBeVisible()
      
      // Test order cancellation
      await page.click('[data-testid="cancel-order"]')
      await page.fill('[data-testid="cancellation-reason"]', 'Test cancellation')
      await page.click('[data-testid="confirm-cancellation"]')
      
      await expect(page.locator('[data-testid="order-cancelled"]')).toBeVisible()
      await expect(page.locator('[data-testid="refund-processing"]')).toBeVisible()
    }
  })

  test('Payment Processing and Financial Integration', async ({ page }) => {
    await orderManager.authenticateCustomer('DISTRIBUTOR')
    await orderManager.selectWarehouseForOrdering('EU')
    
    const products = [{ productId: 'flexvolt-15ah', quantity: 10 }] // $2,450
    const { orderId } = await orderManager.createFlexVoltOrder(products, 'DISTRIBUTOR')
    
    // Test different payment methods
    const paymentMethods: Array<'CREDIT_CARD' | 'PURCHASE_ORDER' | 'NET_30'> = ['CREDIT_CARD', 'PURCHASE_ORDER', 'NET_30']
    
    for (const paymentMethod of paymentMethods) {
      // Reset to payment step
      await page.goto('/supplier/checkout')
      
      await orderManager.processPayment(paymentMethod)
      
      // Verify payment method selection
      await expect(page.locator(`[data-testid="selected-payment-${paymentMethod}"]`)).toBeVisible()
      
      if (paymentMethod === 'CREDIT_CARD') {
        await expect(page.locator('[data-testid="payment-secure-notice"]')).toBeVisible()
      } else if (paymentMethod === 'NET_30') {
        await expect(page.locator('[data-testid="credit-terms-notice"]')).toBeVisible()
      }
    }
  })

  test('Order Fulfillment Performance and Load Testing', async ({ page }) => {
    await orderManager.authenticateCustomer('DISTRIBUTOR')
    
    // Create multiple concurrent orders to test performance
    const concurrentOrders = []
    
    for (let i = 0; i < 5; i++) {
      concurrentOrders.push(async () => {
        const warehouseCode = ['US', 'EU', 'JP', 'AU'][i % 4]
        await orderManager.selectWarehouseForOrdering(warehouseCode)
        
        const products = [{ productId: 'flexvolt-6ah', quantity: 3 }]
        const { orderId } = await orderManager.createFlexVoltOrder(products, 'DISTRIBUTOR')
        
        const orderTracker = performanceMonitor.startOrderTracking(`${orderId}-${i}`)
        orderTracker.recordPlacement()
        
        await orderManager.completeShippingInformation(warehouseCode)
        await orderManager.selectShippingMethod('STANDARD')
        await orderManager.processPayment('PURCHASE_ORDER')
        
        const orderNumber = await orderManager.placeOrder()
        orderTracker.recordConfirmation()
        
        return orderNumber
      })
    }
    
    const startTime = Date.now()
    const orderNumbers = await Promise.all(concurrentOrders.map(fn => fn()))
    const totalTime = Date.now() - startTime
    
    // Verify all orders completed successfully
    expect(orderNumbers).toHaveLength(5)
    orderNumbers.forEach(orderNumber => {
      expect(orderNumber).toMatch(/^ORD-\d{8}$/)
    })
    
    // Verify performance targets
    expect(totalTime).toBeLessThan(30000) // 30 seconds for 5 concurrent orders
    
    const performanceReport = performanceMonitor.generatePerformanceReport()
    expect(performanceReport.avgPlacementTime).toBeLessThan(ORDER_CONFIG.performanceTargets.orderPlacement)
    expect(performanceReport.avgConfirmationTime).toBeLessThan(ORDER_CONFIG.performanceTargets.orderConfirmation)
    expect(performanceReport.errorRate).toBeLessThan(5) // Less than 5% error rate
  })

  test.afterEach(async () => {
    // Generate performance report
    const report = performanceMonitor.generatePerformanceReport()
    
    if (report.totalOrders > 0) {
      console.log('\n=== Order Fulfillment Performance Report ===')
      console.log(`Total Orders: ${report.totalOrders}`)
      console.log(`Avg Placement Time: ${report.avgPlacementTime.toFixed(2)}ms`)
      console.log(`Avg Confirmation Time: ${report.avgConfirmationTime.toFixed(2)}ms`)
      console.log(`Avg Fulfillment Time: ${report.avgFulfillmentTime.toFixed(2)}ms`)
      console.log(`Error Rate: ${report.errorRate.toFixed(2)}%`)
      console.log('============================================\n')
    }
  })
})