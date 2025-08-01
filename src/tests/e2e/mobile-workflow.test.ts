/**
 * RHY Supplier Portal - Mobile Workflow E2E Tests  
 * Comprehensive mobile-first testing for responsive design and touch interactions
 * Tests FlexVolt battery management workflows on mobile devices and tablets
 */

import { test, expect, Page, BrowserContext, devices } from '@playwright/test'

// Mobile device configurations for testing
const MOBILE_DEVICES = {
  'iPhone_13': {
    ...devices['iPhone 13'],
    name: 'iPhone 13',
    category: 'mobile',
    viewport: { width: 390, height: 844 }
  },
  'iPhone_13_Pro_Max': {
    ...devices['iPhone 13 Pro Max'],
    name: 'iPhone 13 Pro Max', 
    category: 'mobile',
    viewport: { width: 428, height: 926 }
  },
  'Samsung_Galaxy_S21': {
    ...devices['Galaxy S8'],
    name: 'Samsung Galaxy S21',
    category: 'mobile',
    viewport: { width: 384, height: 854 }
  },
  'iPad_Air': {
    ...devices['iPad'],
    name: 'iPad Air',
    category: 'tablet', 
    viewport: { width: 820, height: 1180 }
  },
  'iPad_Mini': {
    name: 'iPad Mini',
    category: 'tablet',
    viewport: { width: 768, height: 1024 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  },
  'Android_Tablet': {
    name: 'Android Tablet',
    category: 'tablet',
    viewport: { width: 800, height: 1280 },
    userAgent: 'Mozilla/5.0 (Linux; Android 11; Tab A7 Lite) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Safari/537.36',
    deviceScaleFactor: 1.5,
    isMobile: true,
    hasTouch: true
  }
}

// Mobile performance and interaction standards
const MOBILE_STANDARDS = {
  performance: {
    pageLoad: 3000, // ms - mobile networks are slower
    apiResponse: 200, // ms - account for mobile latency
    touchResponse: 100, // ms - touch feedback
    scrollPerformance: 60, // fps
    animationDuration: 300 // ms
  },
  accessibility: {
    minTouchTarget: 44, // px - minimum touch target size
    textContrast: 4.5, // ratio for WCAG AA
    fontSize: {
      min: 16, // px - minimum readable font size
      preferred: 18 // px - preferred font size
    }
  },
  layout: {
    maxContentWidth: '100vw',
    gutterSpace: 16, // px - minimum edge spacing
    stackSpacing: 16, // px - vertical spacing between elements
    cardPadding: 20 // px - internal card padding
  }
}

// Touch interaction and gesture testing utilities
class MobileTouchManager {
  constructor(private page: Page) {}

  async performSwipeGesture(
    element: string, 
    direction: 'left' | 'right' | 'up' | 'down',
    distance: number = 200
  ): Promise<void> {
    const locator = this.page.locator(element)
    const box = await locator.boundingBox()
    
    if (!box) throw new Error(`Element ${element} not found`)
    
    const startX = box.x + box.width / 2
    const startY = box.y + box.height / 2
    
    let endX = startX
    let endY = startY
    
    switch (direction) {
      case 'left': endX = startX - distance; break
      case 'right': endX = startX + distance; break
      case 'up': endY = startY - distance; break
      case 'down': endY = startY + distance; break
    }
    
    await this.page.touchscreen.tap(startX, startY)
    await this.page.mouse.move(startX, startY)
    await this.page.mouse.down()
    await this.page.mouse.move(endX, endY)
    await this.page.mouse.up()
  }

  async performPinchZoom(element: string, scale: number): Promise<void> {
    const locator = this.page.locator(element)
    const box = await locator.boundingBox()
    
    if (!box) throw new Error(`Element ${element} not found`)
    
    const centerX = box.x + box.width / 2
    const centerY = box.y + box.height / 2
    
    // Simulate pinch gesture (simplified for testing)
    await this.page.touchscreen.tap(centerX - 50, centerY)
    await this.page.touchscreen.tap(centerX + 50, centerY)
  }

  async performLongPress(element: string, duration: number = 1000): Promise<void> {
    const locator = this.page.locator(element)
    const box = await locator.boundingBox()
    
    if (!box) throw new Error(`Element ${element} not found`)
    
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    
    await this.page.touchscreen.tap(x, y)
    await this.page.waitForTimeout(duration)
  }

  async verifyTouchTargetSize(element: string): Promise<boolean> {
    const locator = this.page.locator(element)
    const box = await locator.boundingBox()
    
    if (!box) return false
    
    return box.width >= MOBILE_STANDARDS.accessibility.minTouchTarget && 
           box.height >= MOBILE_STANDARDS.accessibility.minTouchTarget
  }
}

// Mobile navigation and responsive layout testing
class MobileNavigationManager {
  constructor(private page: Page, private touchManager: MobileTouchManager) {}

  async authenticateMobileUser(userType: 'DIRECT' | 'DISTRIBUTOR' | 'FLEET' | 'SERVICE'): Promise<void> {
    const credentials = {
      DIRECT: { email: 'mobile.direct@flexvolt.com', password: 'MobileTest123!' },
      DISTRIBUTOR: { email: 'mobile.distributor@flexvolt.com', password: 'MobileTest123!' },
      FLEET: { email: 'mobile.fleet@flexvolt.com', password: 'MobileTest123!' },
      SERVICE: { email: 'mobile.service@flexvolt.com', password: 'MobileTest123!' }
    }

    const creds = credentials[userType]
    
    await this.page.goto('/supplier/auth/login')
    
    // Verify mobile login form layout
    await expect(this.page.locator('[data-testid="mobile-login-form"]')).toBeVisible()
    
    // Test form field accessibility on mobile
    await expect(this.page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(this.touchManager.verifyTouchTargetSize('[data-testid="email-input"]')).resolves.toBe(true)
    
    // Fill credentials with mobile keyboard simulation
    await this.page.fill('[data-testid="email-input"]', creds.email)
    await this.page.fill('[data-testid="password-input"]', creds.password)
    
    // Verify submit button is accessible
    await expect(this.touchManager.verifyTouchTargetSize('[data-testid="login-submit"]')).resolves.toBe(true)
    await this.page.click('[data-testid="login-submit"]')
    
    // Wait for mobile dashboard to load
    await expect(this.page).toHaveURL(/\/supplier\/dashboard/)
    await expect(this.page.locator('[data-testid="mobile-dashboard"]')).toBeVisible()
  }

  async testMobileNavigation(): Promise<void> {
    // Test hamburger menu functionality
    await this.page.click('[data-testid="mobile-menu-toggle"]')
    await expect(this.page.locator('[data-testid="mobile-navigation-drawer"]')).toBeVisible()
    
    // Test navigation items
    const navItems = ['products', 'orders', 'warehouse', 'account']
    
    for (const item of navItems) {
      const navElement = `[data-testid="mobile-nav-${item}"]`
      await expect(this.page.locator(navElement)).toBeVisible()
      await expect(this.touchManager.verifyTouchTargetSize(navElement)).resolves.toBe(true)
      
      // Test navigation
      await this.page.click(navElement)
      await expect(this.page).toHaveURL(new RegExp(`/supplier/${item}`))
      
      // Return to dashboard for next test
      await this.page.click('[data-testid="mobile-menu-toggle"]')
      await this.page.click('[data-testid="mobile-nav-dashboard"]')
    }
  }

  async testBottomTabNavigation(): Promise<void> {
    // Verify bottom tab navigation for key functions
    await expect(this.page.locator('[data-testid="mobile-bottom-tabs"]')).toBeVisible()
    
    const bottomTabs = ['home', 'products', 'cart', 'orders', 'account']
    
    for (const tab of bottomTabs) {
      const tabElement = `[data-testid="bottom-tab-${tab}"]`
      await expect(this.page.locator(tabElement)).toBeVisible()
      await expect(this.touchManager.verifyTouchTargetSize(tabElement)).resolves.toBe(true)
      
      await this.page.click(tabElement)
      await expect(this.page.locator(`[data-testid="${tab}-page"]`)).toBeVisible()
    }
  }

  async testMobilePullToRefresh(): Promise<void> {
    // Navigate to a data-heavy page
    await this.page.click('[data-testid="mobile-nav-products"]')
    await expect(this.page.locator('[data-testid="products-grid"]')).toBeVisible()
    
    // Perform pull-to-refresh gesture
    await this.touchManager.performSwipeGesture('[data-testid="products-container"]', 'down', 150)
    
    // Verify refresh indicator
    await expect(this.page.locator('[data-testid="refresh-indicator"]')).toBeVisible()
    await expect(this.page.locator('[data-testid="refresh-indicator"]')).not.toBeVisible({ timeout: 5000 })
  }
}

// Mobile product browsing and shopping cart management
class MobileShoppingManager {
  constructor(private page: Page, private touchManager: MobileTouchManager) {}

  async testMobileProductBrowsing(): Promise<void> {
    await this.page.click('[data-testid="mobile-nav-products"]')
    await expect(this.page.locator('[data-testid="mobile-products-grid"]')).toBeVisible()
    
    // Verify mobile product card layout
    const productCards = await this.page.locator('[data-testid^="mobile-product-"]').count()
    expect(productCards).toBeGreaterThan(0)
    
    // Test product card interactions
    const firstProduct = this.page.locator('[data-testid^="mobile-product-"]').first()
    await expect(firstProduct).toBeVisible()
    
    // Verify touch targets
    await expect(this.touchManager.verifyTouchTargetSize('[data-testid="mobile-add-to-cart"]')).resolves.toBe(true)
    
    // Test product details modal
    await firstProduct.click()
    await expect(this.page.locator('[data-testid="mobile-product-modal"]')).toBeVisible()
    
    // Test modal interactions
    await this.page.fill('[data-testid="mobile-quantity-input"]', '5')
    await this.page.click('[data-testid="mobile-add-to-cart"]')
    
    // Verify cart notification
    await expect(this.page.locator('[data-testid="mobile-cart-notification"]')).toBeVisible()
    
    // Close modal
    await this.page.click('[data-testid="mobile-modal-close"]')
    await expect(this.page.locator('[data-testid="mobile-product-modal"]')).not.toBeVisible()
  }

  async testMobileCartManagement(): Promise<void> {
    // Navigate to cart
    await this.page.click('[data-testid="bottom-tab-cart"]')
    await expect(this.page.locator('[data-testid="mobile-cart-container"]')).toBeVisible()
    
    // Test cart item management
    const cartItems = await this.page.locator('[data-testid^="mobile-cart-item-"]').count()
    
    if (cartItems > 0) {
      const firstItem = this.page.locator('[data-testid^="mobile-cart-item-"]').first()
      
      // Test quantity adjustment
      await firstItem.locator('[data-testid="mobile-quantity-increase"]').click()
      await expect(firstItem.locator('[data-testid="mobile-item-quantity"]')).not.toHaveValue('5')
      
      // Test item removal
      await this.touchManager.performSwipeGesture('[data-testid^="mobile-cart-item-"]', 'left', 100)
      await expect(this.page.locator('[data-testid="mobile-delete-item"]')).toBeVisible()
    }
    
    // Test checkout button
    await expect(this.touchManager.verifyTouchTargetSize('[data-testid="mobile-checkout-button"]')).resolves.toBe(true)
  }

  async testMobileCheckoutProcess(): Promise<void> {
    await this.page.click('[data-testid="mobile-checkout-button"]')
    await expect(this.page.locator('[data-testid="mobile-checkout-container"]')).toBeVisible()
    
    // Test mobile form completion
    await this.page.fill('[data-testid="mobile-company-name"]', 'Mobile Test Company')
    await this.page.fill('[data-testid="mobile-address"]', '123 Mobile Test St')
    await this.page.fill('[data-testid="mobile-city"]', 'Mobile City')
    
    // Test mobile dropdown interaction
    await this.page.click('[data-testid="mobile-state-select"]')
    await expect(this.page.locator('[data-testid="mobile-state-dropdown"]')).toBeVisible()
    await this.page.click('[data-testid="mobile-state-option-CA"]')
    
    // Test payment method selection on mobile
    await this.page.click('[data-testid="mobile-payment-card"]')
    await expect(this.page.locator('[data-testid="mobile-card-form"]')).toBeVisible()
    
    // Fill mobile payment form with appropriate keyboard types
    await this.page.fill('[data-testid="mobile-card-number"]', '4111111111111111')
    await this.page.fill('[data-testid="mobile-expiry"]', '12/25')
    await this.page.fill('[data-testid="mobile-cvv"]', '123')
  }
}

// Mobile warehouse and order management
class MobileWarehouseManager {
  constructor(private page: Page, private touchManager: MobileTouchManager) {}

  async testMobileWarehouseInterface(): Promise<void> {
    await this.page.click('[data-testid="mobile-nav-warehouse"]')
    await expect(this.page.locator('[data-testid="mobile-warehouse-dashboard"]')).toBeVisible()
    
    // Test warehouse selection on mobile
    await this.page.click('[data-testid="mobile-warehouse-selector"]')
    await expect(this.page.locator('[data-testid="mobile-warehouse-list"]')).toBeVisible()
    
    // Test warehouse cards
    const warehouseCards = ['US', 'EU', 'JP', 'AU']
    
    for (const warehouse of warehouseCards) {
      const warehouseCard = `[data-testid="mobile-warehouse-${warehouse}"]`
      await expect(this.page.locator(warehouseCard)).toBeVisible()
      await expect(this.touchManager.verifyTouchTargetSize(warehouseCard)).resolves.toBe(true)
    }
    
    // Select US warehouse
    await this.page.click('[data-testid="mobile-warehouse-US"]')
    await expect(this.page.locator('[data-testid="mobile-warehouse-details"]')).toBeVisible()
  }

  async testMobileInventoryView(): Promise<void> {
    await this.page.click('[data-testid="mobile-inventory-tab"]')
    await expect(this.page.locator('[data-testid="mobile-inventory-grid"]')).toBeVisible()
    
    // Test mobile inventory cards
    const inventoryItems = await this.page.locator('[data-testid^="mobile-inventory-"]').count()
    expect(inventoryItems).toBeGreaterThan(0)
    
    // Test inventory search on mobile
    await this.page.fill('[data-testid="mobile-inventory-search"]', 'flexvolt')
    await expect(this.page.locator('[data-testid="mobile-search-results"]')).toBeVisible()
    
    // Test inventory item details
    const firstInventoryItem = this.page.locator('[data-testid^="mobile-inventory-"]').first()
    await firstInventoryItem.click()
    await expect(this.page.locator('[data-testid="mobile-inventory-modal"]')).toBeVisible()
  }

  async testMobileOrderTracking(): Promise<void> {
    await this.page.click('[data-testid="bottom-tab-orders"]')
    await expect(this.page.locator('[data-testid="mobile-orders-container"]')).toBeVisible()
    
    // Test order status filters
    await this.page.click('[data-testid="mobile-filter-button"]')
    await expect(this.page.locator('[data-testid="mobile-filter-sheet"]')).toBeVisible()
    
    // Test filter options
    await this.page.click('[data-testid="mobile-filter-pending"]')
    await this.page.click('[data-testid="mobile-apply-filters"]')
    
    // Test order details view
    const orderCards = await this.page.locator('[data-testid^="mobile-order-"]').count()
    
    if (orderCards > 0) {
      const firstOrder = this.page.locator('[data-testid^="mobile-order-"]').first()
      await firstOrder.click()
      await expect(this.page.locator('[data-testid="mobile-order-details"]')).toBeVisible()
      
      // Test order actions
      await expect(this.page.locator('[data-testid="mobile-track-order"]')).toBeVisible()
      await expect(this.touchManager.verifyTouchTargetSize('[data-testid="mobile-track-order"]')).resolves.toBe(true)
    }
  }
}

// Mobile performance and accessibility testing
class MobilePerformanceManager {
  constructor(private page: Page) {}

  async measurePageLoadPerformance(pageName: string): Promise<{
    loadTime: number,
    firstContentfulPaint: number,
    largestContentfulPaint: number
  }> {
    const startTime = Date.now()
    
    await this.page.goto(`/supplier/${pageName}`)
    await this.page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Get performance metrics
    const performanceMetrics = await this.page.evaluate(() => {
      const perfEntries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paintEntries = performance.getEntriesByType('paint')
      
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
      const lcp = paintEntries.find(entry => entry.name === 'largest-contentful-paint')?.startTime || 0
      
      return {
        firstContentfulPaint: fcp,
        largestContentfulPaint: lcp
      }
    })
    
    return {
      loadTime,
      firstContentfulPaint: performanceMetrics.firstContentfulPaint,
      largestContentfulPaint: performanceMetrics.largestContentfulPaint
    }
  }

  async testScrollPerformance(): Promise<boolean> {
    // Test smooth scrolling on long pages
    await this.page.goto('/supplier/products')
    
    const scrollStart = Date.now()
    await this.page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    })
    
    await this.page.waitForFunction(() => window.scrollY > 0)
    const scrollDuration = Date.now() - scrollStart
    
    return scrollDuration < 1000 // Should complete smoothly within 1 second
  }

  async verifyMobileAccessibility(): Promise<{
    touchTargets: boolean,
    textContrast: boolean,
    fontSize: boolean
  }> {
    // Check touch target sizes
    const buttons = await this.page.locator('button, a, input[type="button"], input[type="submit"]').all()
    const touchTargetsValid = await Promise.all(
      buttons.map(async button => {
        const box = await button.boundingBox()
        return box ? (box.width >= 44 && box.height >= 44) : false
      })
    )
    
    // Check font sizes
    const textElements = await this.page.locator('p, span, div, h1, h2, h3, h4, h5, h6').all()
    const fontSizesValid = await Promise.all(
      textElements.map(async element => {
        const fontSize = await element.evaluate(el => {
          return parseInt(window.getComputedStyle(el).fontSize)
        })
        return fontSize >= MOBILE_STANDARDS.accessibility.fontSize.min
      })
    )
    
    return {
      touchTargets: touchTargetsValid.every(valid => valid),
      textContrast: true, // Simplified for demo - would need contrast calculation
      fontSize: fontSizesValid.every(valid => valid)
    }
  }
}

// Main mobile workflow test suites
for (const [deviceName, deviceConfig] of Object.entries(MOBILE_DEVICES)) {
  test.describe(`Mobile Workflow Tests - ${deviceName}`, () => {
    let touchManager: MobileTouchManager
    let navigationManager: MobileNavigationManager
    let shoppingManager: MobileShoppingManager
    let warehouseManager: MobileWarehouseManager
    let performanceManager: MobilePerformanceManager

    test.beforeEach(async ({ browser }) => {
      const context = await browser.newContext(deviceConfig)
      const page = await context.newPage()
      
      touchManager = new MobileTouchManager(page)
      navigationManager = new MobileNavigationManager(page, touchManager)
      shoppingManager = new MobileShoppingManager(page, touchManager)
      warehouseManager = new MobileWarehouseManager(page, touchManager)
      performanceManager = new MobilePerformanceManager(page)
      
      // Set mobile-specific timeouts
      page.setDefaultTimeout(MOBILE_STANDARDS.performance.pageLoad)
    })

    test(`Authentication and Navigation - ${deviceName}`, async ({ page }) => {
      await navigationManager.authenticateMobileUser('DIRECT')
      await navigationManager.testMobileNavigation()
      
      if (deviceConfig.category === 'mobile') {
        await navigationManager.testBottomTabNavigation()
      }
      
      await navigationManager.testMobilePullToRefresh()
    })

    test(`Product Browsing and Shopping - ${deviceName}`, async ({ page }) => {
      await navigationManager.authenticateMobileUser('DISTRIBUTOR')
      await shoppingManager.testMobileProductBrowsing()
      await shoppingManager.testMobileCartManagement()
      await shoppingManager.testMobileCheckoutProcess()
    })

    test(`Warehouse Management - ${deviceName}`, async ({ page }) => {
      await navigationManager.authenticateMobileUser('FLEET')
      await warehouseManager.testMobileWarehouseInterface()
      await warehouseManager.testMobileInventoryView()
      await warehouseManager.testMobileOrderTracking()
    })

    test(`Performance and Accessibility - ${deviceName}`, async ({ page }) => {
      await navigationManager.authenticateMobileUser('DIRECT')
      
      // Test page load performance
      const dashboardPerf = await performanceManager.measurePageLoadPerformance('dashboard')
      expect(dashboardPerf.loadTime).toBeLessThan(MOBILE_STANDARDS.performance.pageLoad)
      
      const productsPerf = await performanceManager.measurePageLoadPerformance('products')
      expect(productsPerf.loadTime).toBeLessThan(MOBILE_STANDARDS.performance.pageLoad)
      
      // Test scroll performance
      const scrollPerformanceGood = await performanceManager.testScrollPerformance()
      expect(scrollPerformanceGood).toBe(true)
      
      // Test accessibility standards
      const accessibilityResults = await performanceManager.verifyMobileAccessibility()
      expect(accessibilityResults.touchTargets).toBe(true)
      expect(accessibilityResults.fontSize).toBe(true)
    })

    test(`Touch Gestures and Interactions - ${deviceName}`, async ({ page }) => {
      await navigationManager.authenticateMobileUser('SERVICE')
      
      // Test swipe gestures on product carousel
      await page.click('[data-testid="mobile-nav-products"]')
      await expect(page.locator('[data-testid="mobile-product-carousel"]')).toBeVisible()
      
      await touchManager.performSwipeGesture('[data-testid="mobile-product-carousel"]', 'left', 200)
      await expect(page.locator('[data-testid="carousel-next-item"]')).toBeVisible()
      
      // Test long press for context menus
      await touchManager.performLongPress('[data-testid="mobile-product-card"]', 800)
      await expect(page.locator('[data-testid="mobile-context-menu"]')).toBeVisible()
      
      // Test pinch zoom on product images
      await page.click('[data-testid="mobile-product-image"]')
      await touchManager.performPinchZoom('[data-testid="mobile-product-image"]', 2)
    })

    test(`Offline Functionality - ${deviceName}`, async ({ page }) => {
      await navigationManager.authenticateMobileUser('DISTRIBUTOR')
      
      // Test offline mode
      await page.context().setOffline(true)
      
      // Should show offline indicator
      await expect(page.locator('[data-testid="mobile-offline-indicator"]')).toBeVisible()
      
      // Should still allow viewing cached content
      await page.click('[data-testid="mobile-nav-orders"]')
      await expect(page.locator('[data-testid="mobile-cached-orders"]')).toBeVisible()
      
      // Restore online mode
      await page.context().setOffline(false)
      await expect(page.locator('[data-testid="mobile-offline-indicator"]')).not.toBeVisible()
    })

    if (deviceConfig.category === 'tablet') {
      test(`Tablet-Specific Features - ${deviceName}`, async ({ page }) => {
        await navigationManager.authenticateMobileUser('FLEET')
        
        // Test split-screen layout on tablets
        await expect(page.locator('[data-testid="tablet-split-layout"]')).toBeVisible()
        
        // Test tablet-specific navigation
        await expect(page.locator('[data-testid="tablet-sidebar"]')).toBeVisible()
        await expect(page.locator('[data-testid="tablet-main-content"]')).toBeVisible()
        
        // Test tablet grid layouts
        await page.click('[data-testid="mobile-nav-products"]')
        const productColumns = await page.locator('[data-testid="tablet-product-grid"]').evaluate(el => {
          return window.getComputedStyle(el).gridTemplateColumns.split(' ').length
        })
        expect(productColumns).toBeGreaterThan(2) // Should use more columns on tablet
      })
    }

    test(`Cross-Device Data Synchronization - ${deviceName}`, async ({ page }) => {
      await navigationManager.authenticateMobileUser('DISTRIBUTOR')
      
      // Add item to cart on mobile
      await shoppingManager.testMobileProductBrowsing()
      
      // Verify cart syncs across sessions
      const cartCount = await page.locator('[data-testid="mobile-cart-count"]').textContent()
      expect(parseInt(cartCount || '0')).toBeGreaterThan(0)
      
      // Test bookmark/favorites sync
      await page.click('[data-testid="mobile-favorite-product"]')
      await expect(page.locator('[data-testid="mobile-favorites-added"]')).toBeVisible()
    })

    test.afterEach(async ({ page }) => {
      // Log mobile-specific performance metrics
      const metrics = await page.evaluate(() => ({
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        devicePixelRatio: window.devicePixelRatio,
        connection: (navigator as any).connection?.effectiveType || 'unknown'
      }))
      
      console.log(`${deviceName} Metrics:`, metrics)
    })
  })
}

// Cross-device compatibility testing
test.describe('Cross-Device Compatibility Tests', () => {
  test('Responsive Breakpoint Testing', async ({ browser }) => {
    const breakpoints = [
      { width: 320, height: 568, name: 'Small Mobile' },
      { width: 375, height: 667, name: 'Medium Mobile' },
      { width: 414, height: 896, name: 'Large Mobile' },
      { width: 768, height: 1024, name: 'Tablet Portrait' },
      { width: 1024, height: 768, name: 'Tablet Landscape' }
    ]
    
    for (const breakpoint of breakpoints) {
      const context = await browser.newContext({
        viewport: { width: breakpoint.width, height: breakpoint.height }
      })
      const page = await context.newPage()
      
      await page.goto('/supplier/auth/login')
      
      // Verify layout adapts correctly
      await expect(page.locator('[data-testid="responsive-container"]')).toBeVisible()
      
      const containerWidth = await page.locator('[data-testid="responsive-container"]').evaluate(el => el.offsetWidth)
      expect(containerWidth).toBeLessThanOrEqual(breakpoint.width)
      
      await context.close()
    }
  })

  test('Progressive Web App Features', async ({ page }) => {
    // Test PWA manifest
    const manifestResponse = await page.request.get('/manifest.json')
    expect(manifestResponse.status()).toBe(200)
    
    const manifest = await manifestResponse.json()
    expect(manifest.name).toBe('RHY Supplier Portal')
    expect(manifest.short_name).toBe('RHY Portal')
    expect(manifest.display).toBe('standalone')
    
    // Test service worker
    await page.goto('/supplier/dashboard')
    const serviceWorkerRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator
    })
    expect(serviceWorkerRegistered).toBe(true)
  })
})