// Terminal 3: Persistent Cart System
// Advanced cart persistence with conflict resolution and multi-device synchronization

import { EventEmitter } from 'events'
import { auditSystem } from '@/services/audit/audit-system'
import { distributedInventory } from '@/services/inventory/distributed-inventory'

export interface CartItem {
  id: string
  productId: string
  sku: string
  name: string
  description: string
  category: string
  brand: string
  quantity: number
  unitPrice: number
  totalPrice: number
  currency: string
  
  // Product details
  specifications: {
    voltage: string
    capacity: string
    chemistry: string
    compatibility: string[]
  }
  
  // Pricing
  discounts: CartDiscount[]
  appliedPromotions: string[]
  originalPrice: number
  savings: number
  
  // Inventory
  availability: {
    inStock: boolean
    quantity: number
    warehouse: string
    reservationId?: string
    estimatedRestockDate?: Date
  }
  
  // Personalization
  customization?: {
    engraving?: string
    color?: string
    warranty?: string
  }
  
  // Metadata
  addedAt: Date
  lastModified: Date
  source: 'web' | 'mobile' | 'api' | 'import'
  deviceId?: string
  sessionId?: string
}

export interface CartDiscount {
  id: string
  type: 'volume' | 'promotion' | 'loyalty' | 'coupon' | 'contract'
  name: string
  description: string
  amount: number
  percentage?: number
  appliedTo: 'item' | 'subtotal' | 'shipping'
  code?: string
  validUntil?: Date
}

export interface ShoppingCart {
  id: string
  customerId: string
  sessionId?: string
  deviceId?: string
  
  // Items and totals
  items: CartItem[]
  itemCount: number
  subtotal: number
  discountTotal: number
  taxAmount: number
  shippingAmount: number
  grandTotal: number
  currency: string
  
  // Applied benefits
  discounts: CartDiscount[]
  appliedCoupons: string[]
  loyaltyPointsUsed: number
  loyaltyPointsEarned: number
  
  // Customer context
  customer: {
    tier: 'bronze' | 'silver' | 'gold' | 'platinum'
    contractPricing: boolean
    volumeDiscountLevel: number
    taxExempt: boolean
    preferredWarehouse?: string
  }
  
  // Cart state
  status: 'active' | 'abandoned' | 'converted' | 'expired' | 'merged'
  persistenceLevel: 'session' | 'account' | 'device' | 'permanent'
  
  // Timing
  createdAt: Date
  lastModified: Date
  lastAccessedAt: Date
  expiresAt?: Date
  abandonedAt?: Date
  
  // Synchronization
  version: number
  conflictResolution: {
    strategy: 'last_write_wins' | 'merge' | 'manual'
    pendingConflicts: CartConflict[]
  }
  
  // Device tracking
  devices: DeviceSession[]
  
  // Metadata
  metadata: {
    source: string
    campaign?: string
    referrer?: string
    userAgent?: string
    ipAddress?: string
    geolocation?: {
      country: string
      region: string
      city: string
    }
  }
}

export interface CartConflict {
  id: string
  type: 'quantity_mismatch' | 'price_change' | 'availability_change' | 'device_sync'
  description: string
  severity: 'low' | 'medium' | 'high'
  
  conflictData: {
    itemId: string
    field: string
    localValue: any
    remoteValue: any
    serverValue: any
  }
  
  resolution?: {
    strategy: 'keep_local' | 'use_remote' | 'merge' | 'ask_user'
    resolvedValue: any
    resolvedBy: 'system' | 'user'
    resolvedAt: Date
  }
  
  createdAt: Date
}

export interface DeviceSession {
  deviceId: string
  sessionId: string
  userAgent: string
  platform: 'web' | 'mobile' | 'tablet'
  firstAccess: Date
  lastAccess: Date
  syncStatus: 'synced' | 'pending' | 'conflict' | 'offline'
}

export interface CartMetrics {
  totalCarts: number
  activeCarts: number
  abandonedCarts: number
  convertedCarts: number
  averageCartValue: number
  averageItemCount: number
  abandonmentRate: number
  conversionRate: number
  topProducts: ProductMetrics[]
  deviceDistribution: Map<string, number>
  customerSegmentation: Map<string, CartSegmentMetrics>
}

export interface ProductMetrics {
  productId: string
  name: string
  addCount: number
  removeCount: number
  purchaseCount: number
  averageQuantity: number
  conversionRate: number
}

export interface CartSegmentMetrics {
  segment: string
  cartCount: number
  averageValue: number
  conversionRate: number
  topProducts: string[]
}

export interface CartValidationResult {
  valid: boolean
  errors: CartValidationError[]
  warnings: CartValidationWarning[]
  suggestions: CartSuggestion[]
}

export interface CartValidationError {
  type: 'inventory' | 'pricing' | 'business_rule' | 'system'
  itemId?: string
  field: string
  message: string
  code: string
  severity: 'error' | 'warning'
}

export interface CartValidationWarning extends CartValidationError {
  autoResolvable: boolean
  suggestedAction?: string
}

export interface CartSuggestion {
  type: 'upsell' | 'cross_sell' | 'volume_discount' | 'bundle' | 'substitute'
  productId?: string
  title: string
  description: string
  benefit: string
  confidence: number
}

export class PersistentCartError extends Error {
  constructor(
    message: string,
    public code: string,
    public cartId?: string,
    public customerId?: string
  ) {
    super(message)
    this.name = 'PersistentCartError'
  }
}

export class PersistentCartService extends EventEmitter {
  private carts: Map<string, ShoppingCart>
  private cartByCustomer: Map<string, string[]>
  private cartBySession: Map<string, string>
  private cartByDevice: Map<string, string[]>
  private conflictResolver: ConflictResolver
  private inventoryReserver: InventoryReserver
  private priceCalculator: CartPriceCalculator
  private validationEngine: CartValidationEngine
  private syncManager: CartSyncManager
  private persistenceManager: CartPersistenceManager
  private recommendationEngine: CartRecommendationEngine

  constructor() {
    super()
    this.carts = new Map()
    this.cartByCustomer = new Map()
    this.cartBySession = new Map()
    this.cartByDevice = new Map()
    this.conflictResolver = new ConflictResolver()
    this.inventoryReserver = new InventoryReserver()
    this.priceCalculator = new CartPriceCalculator()
    this.validationEngine = new CartValidationEngine()
    this.syncManager = new CartSyncManager()
    this.persistenceManager = new CartPersistenceManager()
    this.recommendationEngine = new CartRecommendationEngine()

    this.startBackgroundProcesses()
  }

  // Create or retrieve cart
  async getOrCreateCart(
    customerId?: string,
    sessionId?: string,
    deviceId?: string,
    options: {
      persistenceLevel?: ShoppingCart['persistenceLevel']
      mergeExisting?: boolean
    } = {}
  ): Promise<ShoppingCart> {
    const startTime = Date.now()

    try {
      let cart: ShoppingCart | undefined

      // Try to find existing cart
      if (customerId) {
        const customerCarts = this.cartByCustomer.get(customerId) || []
        const activeCarts = customerCarts
          .map(cartId => this.carts.get(cartId))
          .filter(c => c && c.status === 'active')

        if (activeCarts.length > 0) {
          cart = activeCarts[0] // Use most recent active cart
        }
      } else if (sessionId) {
        const cartId = this.cartBySession.get(sessionId)
        if (cartId) {
          cart = this.carts.get(cartId)
        }
      } else if (deviceId) {
        const deviceCarts = this.cartByDevice.get(deviceId) || []
        const activeCarts = deviceCarts
          .map(cartId => this.carts.get(cartId))
          .filter(c => c && c.status === 'active')

        if (activeCarts.length > 0) {
          cart = activeCarts[0]
        }
      }

      // Handle cart merging if requested
      if (cart && options.mergeExisting && customerId) {
        const otherCarts = await this.findCartsToMerge(customerId, cart.id)
        if (otherCarts.length > 0) {
          cart = await this.mergeCarts(cart, otherCarts)
        }
      }

      // Create new cart if none found
      if (!cart) {
        cart = await this.createNewCart(customerId, sessionId, deviceId, options)
      }

      // Update access time
      cart.lastAccessedAt = new Date()

      // Sync across devices if customer is logged in
      if (customerId && cart.customerId === customerId) {
        await this.syncManager.syncCartAcrossDevices(cart)
      }

      this.emit('cartAccessed', {
        cartId: cart.id,
        customerId,
        sessionId,
        deviceId,
        accessTime: Date.now() - startTime
      })

      return cart

    } catch (error) {
      console.error('Failed to get or create cart:', error)
      throw new PersistentCartError(
        'Failed to get or create cart',
        'CART_ACCESS_FAILED',
        undefined,
        customerId
      )
    }
  }

  // Add item to cart
  async addItemToCart(
    cartId: string,
    item: {
      productId: string
      sku: string
      quantity: number
      customization?: any
    },
    context: {
      deviceId?: string
      sessionId?: string
      source?: string
    } = {}
  ): Promise<{ success: boolean; cartItem?: CartItem; conflicts?: CartConflict[] }> {
    const startTime = Date.now()

    try {
      const cart = this.carts.get(cartId)
      if (!cart) {
        throw new PersistentCartError(
          'Cart not found',
          'CART_NOT_FOUND',
          cartId
        )
      }

      // Get product information
      const productInfo = await this.getProductInfo(item.productId)
      if (!productInfo) {
        throw new PersistentCartError(
          'Product not found',
          'PRODUCT_NOT_FOUND',
          cartId
        )
      }

      // Check inventory availability
      const availability = await distributedInventory.getInventoryAvailability(
        item.productId,
        item.quantity,
        cart.customer.preferredWarehouse
      )

      if (!availability.available) {
        return {
          success: false,
          conflicts: [{
            id: this.generateConflictId(),
            type: 'availability_change',
            description: `Product ${item.sku} is no longer available in requested quantity`,
            severity: 'high',
            conflictData: {
              itemId: item.productId,
              field: 'quantity',
              localValue: item.quantity,
              remoteValue: 0,
              serverValue: availability.totalAvailable
            },
            createdAt: new Date()
          }]
        }
      }

      // Check for existing item in cart
      const existingItemIndex = cart.items.findIndex(
        cartItem => cartItem.productId === item.productId &&
                    JSON.stringify(cartItem.customization) === JSON.stringify(item.customization)
      )

      let cartItem: CartItem

      if (existingItemIndex >= 0) {
        // Update existing item
        const existingItem = cart.items[existingItemIndex]
        const newQuantity = existingItem.quantity + item.quantity

        // Validate new quantity
        const newAvailability = await distributedInventory.getInventoryAvailability(
          item.productId,
          newQuantity,
          cart.customer.preferredWarehouse
        )

        if (!newAvailability.available) {
          return {
            success: false,
            conflicts: [{
              id: this.generateConflictId(),
              type: 'quantity_mismatch',
              description: `Cannot add ${item.quantity} more units. Only ${newAvailability.totalAvailable - existingItem.quantity} available`,
              severity: 'medium',
              conflictData: {
                itemId: item.productId,
                field: 'quantity',
                localValue: newQuantity,
                remoteValue: existingItem.quantity,
                serverValue: newAvailability.totalAvailable
              },
              createdAt: new Date()
            }]
          }
        }

        existingItem.quantity = newQuantity
        existingItem.lastModified = new Date()
        cartItem = existingItem
      } else {
        // Create new cart item
        cartItem = await this.createCartItem(productInfo, item, availability, context)
        cart.items.push(cartItem)
      }

      // Reserve inventory
      if (cart.customer.tier !== 'bronze') { // Reserve for higher tier customers
        try {
          const reservation = await this.inventoryReserver.reserveInventory(
            item.productId,
            item.quantity,
            cartId,
            cart.customerId,
            15 // 15 minute reservation
          )
          cartItem.availability.reservationId = reservation.id
        } catch (error) {
          console.warn('Failed to reserve inventory:', error)
        }
      }

      // Recalculate cart totals
      await this.recalculateCart(cart)

      // Update cart metadata
      cart.lastModified = new Date()
      cart.version++

      // Add device session if not exists
      await this.addDeviceSession(cart, context)

      // Validate cart
      const validation = await this.validationEngine.validateCart(cart)
      
      // Generate recommendations
      const recommendations = await this.recommendationEngine.generateRecommendations(cart, cartItem)

      this.emit('itemAddedToCart', {
        cartId,
        customerId: cart.customerId,
        productId: item.productId,
        quantity: item.quantity,
        cartValue: cart.grandTotal,
        recommendations: recommendations.length,
        processingTime: Date.now() - startTime
      })

      // Audit log
      await auditSystem.logSecurityEvent({
        type: 'cart_item_added',
        severity: 'info',
        details: {
          cartId,
          customerId: cart.customerId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: cartItem.unitPrice,
          deviceId: context.deviceId,
          source: context.source
        }
      })

      return { success: true, cartItem }

    } catch (error) {
      console.error('Failed to add item to cart:', error)
      throw error
    }
  }

  // Update item quantity
  async updateItemQuantity(
    cartId: string,
    itemId: string,
    newQuantity: number,
    context: {
      deviceId?: string
      reason?: string
    } = {}
  ): Promise<{ success: boolean; conflicts?: CartConflict[] }> {
    try {
      const cart = this.carts.get(cartId)
      if (!cart) {
        throw new PersistentCartError(
          'Cart not found',
          'CART_NOT_FOUND',
          cartId
        )
      }

      const itemIndex = cart.items.findIndex(item => item.id === itemId)
      if (itemIndex === -1) {
        throw new PersistentCartError(
          'Cart item not found',
          'CART_ITEM_NOT_FOUND',
          cartId
        )
      }

      const item = cart.items[itemIndex]

      // Check if removing item completely
      if (newQuantity <= 0) {
        return await this.removeItemFromCart(cartId, itemId, context)
      }

      // Check inventory availability for new quantity
      const availability = await distributedInventory.getInventoryAvailability(
        item.productId,
        newQuantity,
        cart.customer.preferredWarehouse
      )

      if (!availability.available) {
        return {
          success: false,
          conflicts: [{
            id: this.generateConflictId(),
            type: 'availability_change',
            description: `Only ${availability.totalAvailable} units available for ${item.name}`,
            severity: 'medium',
            conflictData: {
              itemId,
              field: 'quantity',
              localValue: newQuantity,
              remoteValue: item.quantity,
              serverValue: availability.totalAvailable
            },
            createdAt: new Date()
          }]
        }
      }

      // Update inventory reservation
      if (item.availability.reservationId) {
        await this.inventoryReserver.updateReservation(
          item.availability.reservationId,
          newQuantity
        )
      }

      // Update item
      const previousQuantity = item.quantity
      item.quantity = newQuantity
      item.totalPrice = item.unitPrice * newQuantity
      item.lastModified = new Date()

      // Recalculate cart
      await this.recalculateCart(cart)

      // Update cart metadata
      cart.lastModified = new Date()
      cart.version++

      this.emit('cartItemUpdated', {
        cartId,
        itemId,
        productId: item.productId,
        previousQuantity,
        newQuantity,
        cartValue: cart.grandTotal
      })

      return { success: true }

    } catch (error) {
      console.error('Failed to update item quantity:', error)
      throw error
    }
  }

  // Remove item from cart
  async removeItemFromCart(
    cartId: string,
    itemId: string,
    context: {
      deviceId?: string
      reason?: string
    } = {}
  ): Promise<{ success: boolean }> {
    try {
      const cart = this.carts.get(cartId)
      if (!cart) {
        throw new PersistentCartError(
          'Cart not found',
          'CART_NOT_FOUND',
          cartId
        )
      }

      const itemIndex = cart.items.findIndex(item => item.id === itemId)
      if (itemIndex === -1) {
        throw new PersistentCartError(
          'Cart item not found',
          'CART_ITEM_NOT_FOUND',
          cartId
        )
      }

      const item = cart.items[itemIndex]

      // Release inventory reservation
      if (item.availability.reservationId) {
        await this.inventoryReserver.releaseReservation(item.availability.reservationId)
      }

      // Remove item
      cart.items.splice(itemIndex, 1)

      // Recalculate cart
      await this.recalculateCart(cart)

      // Update cart metadata
      cart.lastModified = new Date()
      cart.version++

      this.emit('cartItemRemoved', {
        cartId,
        itemId,
        productId: item.productId,
        quantity: item.quantity,
        cartValue: cart.grandTotal,
        reason: context.reason
      })

      return { success: true }

    } catch (error) {
      console.error('Failed to remove item from cart:', error)
      throw error
    }
  }

  // Apply coupon code
  async applyCoupon(
    cartId: string,
    couponCode: string
  ): Promise<{ success: boolean; discount?: CartDiscount; error?: string }> {
    try {
      const cart = this.carts.get(cartId)
      if (!cart) {
        throw new PersistentCartError(
          'Cart not found',
          'CART_NOT_FOUND',
          cartId
        )
      }

      // Check if coupon already applied
      if (cart.appliedCoupons.includes(couponCode)) {
        return { success: false, error: 'Coupon already applied' }
      }

      // Validate coupon (would integrate with promotion engine)
      const couponValidation = await this.validateCoupon(couponCode, cart)
      if (!couponValidation.valid) {
        return { success: false, error: couponValidation.reason }
      }

      // Apply coupon discount
      const discount: CartDiscount = {
        id: this.generateDiscountId(),
        type: 'coupon',
        name: couponValidation.name,
        description: couponValidation.description,
        amount: couponValidation.amount,
        percentage: couponValidation.percentage,
        appliedTo: couponValidation.appliedTo,
        code: couponCode,
        validUntil: couponValidation.validUntil
      }

      cart.discounts.push(discount)
      cart.appliedCoupons.push(couponCode)

      // Recalculate cart
      await this.recalculateCart(cart)

      // Update cart metadata
      cart.lastModified = new Date()
      cart.version++

      this.emit('couponApplied', {
        cartId,
        couponCode,
        discountAmount: discount.amount,
        cartValue: cart.grandTotal
      })

      return { success: true, discount }

    } catch (error) {
      console.error('Failed to apply coupon:', error)
      throw error
    }
  }

  // Merge carts (when user logs in)
  async mergeCarts(primaryCart: ShoppingCart, secondaryCarts: ShoppingCart[]): Promise<ShoppingCart> {
    try {
      for (const secondaryCart of secondaryCarts) {
        for (const item of secondaryCart.items) {
          // Check if item already exists in primary cart
          const existingItemIndex = primaryCart.items.findIndex(
            primaryItem => primaryItem.productId === item.productId &&
                           JSON.stringify(primaryItem.customization) === JSON.stringify(item.customization)
          )

          if (existingItemIndex >= 0) {
            // Merge quantities
            const existingItem = primaryCart.items[existingItemIndex]
            existingItem.quantity += item.quantity
            existingItem.totalPrice = existingItem.unitPrice * existingItem.quantity
            existingItem.lastModified = new Date()
          } else {
            // Add new item
            primaryCart.items.push({
              ...item,
              id: this.generateItemId(),
              addedAt: new Date(),
              lastModified: new Date()
            })
          }
        }

        // Mark secondary cart as merged
        secondaryCart.status = 'merged'
        secondaryCart.lastModified = new Date()
      }

      // Recalculate merged cart
      await this.recalculateCart(primaryCart)

      // Update metadata
      primaryCart.lastModified = new Date()
      primaryCart.version++

      this.emit('cartsMerged', {
        primaryCartId: primaryCart.id,
        mergedCartIds: secondaryCarts.map(c => c.id),
        finalCartValue: primaryCart.grandTotal
      })

      return primaryCart

    } catch (error) {
      console.error('Failed to merge carts:', error)
      throw error
    }
  }

  // Resolve conflicts
  async resolveConflict(
    cartId: string,
    conflictId: string,
    resolution: {
      strategy: 'keep_local' | 'use_remote' | 'merge' | 'manual'
      value?: any
    }
  ): Promise<void> {
    try {
      const cart = this.carts.get(cartId)
      if (!cart) {
        throw new PersistentCartError(
          'Cart not found',
          'CART_NOT_FOUND',
          cartId
        )
      }

      const conflict = cart.conflictResolution.pendingConflicts.find(c => c.id === conflictId)
      if (!conflict) {
        throw new PersistentCartError(
          'Conflict not found',
          'CONFLICT_NOT_FOUND',
          cartId
        )
      }

      // Apply resolution
      const resolvedValue = await this.conflictResolver.resolveConflict(conflict, resolution)

      // Update conflict
      conflict.resolution = {
        strategy: resolution.strategy,
        resolvedValue,
        resolvedBy: 'user',
        resolvedAt: new Date()
      }

      // Remove from pending conflicts
      cart.conflictResolution.pendingConflicts = cart.conflictResolution.pendingConflicts
        .filter(c => c.id !== conflictId)

      // Apply resolution to cart
      await this.applyConflictResolution(cart, conflict)

      this.emit('conflictResolved', {
        cartId,
        conflictId,
        strategy: resolution.strategy,
        resolvedValue
      })

    } catch (error) {
      console.error('Failed to resolve conflict:', error)
      throw error
    }
  }

  // Get cart metrics
  async getCartMetrics(timeframe: 'day' | 'week' | 'month' = 'month'): Promise<CartMetrics> {
    const now = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const carts = Array.from(this.carts.values())
      .filter(cart => cart.createdAt >= startDate)

    const totalCarts = carts.length
    const activeCarts = carts.filter(cart => cart.status === 'active').length
    const abandonedCarts = carts.filter(cart => cart.status === 'abandoned').length
    const convertedCarts = carts.filter(cart => cart.status === 'converted').length

    const totalValue = carts.reduce((sum, cart) => sum + cart.grandTotal, 0)
    const averageCartValue = totalCarts > 0 ? totalValue / totalCarts : 0

    const totalItems = carts.reduce((sum, cart) => sum + cart.itemCount, 0)
    const averageItemCount = totalCarts > 0 ? totalItems / totalCarts : 0

    const abandonmentRate = totalCarts > 0 ? abandonedCarts / totalCarts : 0
    const conversionRate = totalCarts > 0 ? convertedCarts / totalCarts : 0

    return {
      totalCarts,
      activeCarts,
      abandonedCarts,
      convertedCarts,
      averageCartValue,
      averageItemCount,
      abandonmentRate,
      conversionRate,
      topProducts: [], // Would calculate from cart items
      deviceDistribution: new Map(),
      customerSegmentation: new Map()
    }
  }

  // Private helper methods
  private async createNewCart(
    customerId?: string,
    sessionId?: string,
    deviceId?: string,
    options: any = {}
  ): Promise<ShoppingCart> {
    const cartId = this.generateCartId()
    
    const cart: ShoppingCart = {
      id: cartId,
      customerId: customerId || '',
      sessionId,
      deviceId,
      items: [],
      itemCount: 0,
      subtotal: 0,
      discountTotal: 0,
      taxAmount: 0,
      shippingAmount: 0,
      grandTotal: 0,
      currency: 'USD',
      discounts: [],
      appliedCoupons: [],
      loyaltyPointsUsed: 0,
      loyaltyPointsEarned: 0,
      customer: {
        tier: 'bronze',
        contractPricing: false,
        volumeDiscountLevel: 0,
        taxExempt: false
      },
      status: 'active',
      persistenceLevel: options.persistenceLevel || (customerId ? 'account' : 'session'),
      createdAt: new Date(),
      lastModified: new Date(),
      lastAccessedAt: new Date(),
      version: 1,
      conflictResolution: {
        strategy: 'last_write_wins',
        pendingConflicts: []
      },
      devices: [],
      metadata: {
        source: 'web'
      }
    }

    // Set expiration based on persistence level
    if (cart.persistenceLevel === 'session') {
      cart.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    } else if (cart.persistenceLevel === 'account') {
      cart.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }

    // Store cart
    this.carts.set(cartId, cart)

    // Update indexes
    if (customerId) {
      const customerCarts = this.cartByCustomer.get(customerId) || []
      customerCarts.push(cartId)
      this.cartByCustomer.set(customerId, customerCarts)
    }

    if (sessionId) {
      this.cartBySession.set(sessionId, cartId)
    }

    if (deviceId) {
      const deviceCarts = this.cartByDevice.get(deviceId) || []
      deviceCarts.push(cartId)
      this.cartByDevice.set(deviceId, deviceCarts)
    }

    this.emit('cartCreated', {
      cartId,
      customerId,
      sessionId,
      deviceId,
      persistenceLevel: cart.persistenceLevel
    })

    return cart
  }

  private async createCartItem(
    productInfo: any,
    item: any,
    availability: any,
    context: any
  ): Promise<CartItem> {
    const itemId = this.generateItemId()
    
    return {
      id: itemId,
      productId: item.productId,
      sku: item.sku,
      name: productInfo.name,
      description: productInfo.description,
      category: productInfo.category,
      brand: productInfo.brand,
      quantity: item.quantity,
      unitPrice: productInfo.price,
      totalPrice: productInfo.price * item.quantity,
      currency: 'USD',
      specifications: {
        voltage: productInfo.voltage,
        capacity: productInfo.capacity,
        chemistry: productInfo.chemistry,
        compatibility: productInfo.compatibility
      },
      discounts: [],
      appliedPromotions: [],
      originalPrice: productInfo.originalPrice || productInfo.price,
      savings: 0,
      availability: {
        inStock: availability.available,
        quantity: availability.totalAvailable,
        warehouse: availability.warehouses[0]?.id || 'WH001'
      },
      customization: item.customization,
      addedAt: new Date(),
      lastModified: new Date(),
      source: context.source || 'web',
      deviceId: context.deviceId,
      sessionId: context.sessionId
    }
  }

  private async recalculateCart(cart: ShoppingCart): Promise<void> {
    // Calculate subtotal
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0)
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

    // Apply discounts
    cart.discountTotal = cart.discounts.reduce((sum, discount) => sum + discount.amount, 0)

    // Calculate tax (simplified)
    const taxableAmount = cart.subtotal - cart.discountTotal
    cart.taxAmount = cart.customer.taxExempt ? 0 : taxableAmount * 0.08

    // Calculate shipping (simplified)
    cart.shippingAmount = cart.subtotal > 99 ? 0 : 9.99

    // Calculate grand total
    cart.grandTotal = cart.subtotal - cart.discountTotal + cart.taxAmount + cart.shippingAmount

    // Calculate loyalty points
    cart.loyaltyPointsEarned = Math.floor(cart.grandTotal * 0.01) // 1 point per dollar
  }

  private async addDeviceSession(cart: ShoppingCart, context: any): Promise<void> {
    if (!context.deviceId) return

    const existingDevice = cart.devices.find(d => d.deviceId === context.deviceId)
    if (existingDevice) {
      existingDevice.lastAccess = new Date()
      if (context.sessionId) {
        existingDevice.sessionId = context.sessionId
      }
    } else {
      cart.devices.push({
        deviceId: context.deviceId,
        sessionId: context.sessionId || '',
        userAgent: '',
        platform: 'web',
        firstAccess: new Date(),
        lastAccess: new Date(),
        syncStatus: 'synced'
      })
    }
  }

  private async findCartsToMerge(customerId: string, excludeCartId: string): Promise<ShoppingCart[]> {
    const customerCarts = this.cartByCustomer.get(customerId) || []
    return customerCarts
      .map(cartId => this.carts.get(cartId))
      .filter(cart => cart && cart.id !== excludeCartId && cart.status === 'active') as ShoppingCart[]
  }

  private async getProductInfo(productId: string): Promise<any> {
    // Would integrate with product catalog
    const products: Record<string, any> = {
      'FLEXVOLT_6AH': {
        name: 'FlexVolt 20V MAX 6.0Ah Battery Pack',
        description: 'High-performance lithium-ion battery with FlexVolt technology',
        category: 'Batteries',
        brand: 'DeWalt',
        price: 95.00,
        originalPrice: 95.00,
        voltage: '20V MAX',
        capacity: '6.0Ah',
        chemistry: 'Lithium-Ion',
        compatibility: ['20V MAX', '60V MAX']
      },
      'FLEXVOLT_9AH': {
        name: 'FlexVolt 20V MAX 9.0Ah Battery Pack',
        description: 'Extended runtime lithium-ion battery with FlexVolt technology',
        category: 'Batteries',
        brand: 'DeWalt',
        price: 125.00,
        originalPrice: 125.00,
        voltage: '20V MAX',
        capacity: '9.0Ah',
        chemistry: 'Lithium-Ion',
        compatibility: ['20V MAX', '60V MAX']
      }
    }
    return products[productId]
  }

  private async validateCoupon(code: string, cart: ShoppingCart): Promise<any> {
    // Would integrate with promotion engine
    const coupons: Record<string, any> = {
      'SAVE10': {
        valid: true,
        name: '10% Off',
        description: '10% off your order',
        amount: cart.subtotal * 0.1,
        percentage: 10,
        appliedTo: 'subtotal',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    }
    return coupons[code] || { valid: false, reason: 'Invalid coupon code' }
  }

  private async applyConflictResolution(cart: ShoppingCart, conflict: CartConflict): Promise<void> {
    // Apply the resolved value to the cart
    console.log(`Applying conflict resolution for ${conflict.id}`)
  }

  // ID generators
  private generateCartId(): string {
    return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateItemId(): string {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateDiscountId(): string {
    return `discount_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Background processes
  private startBackgroundProcesses(): void {
    // Clean up expired carts every hour
    setInterval(() => {
      this.cleanupExpiredCarts()
    }, 3600000)

    // Check for abandoned carts every 30 minutes
    setInterval(() => {
      this.checkAbandonedCarts()
    }, 1800000)

    // Sync carts across devices every 5 minutes
    setInterval(() => {
      this.syncCartsAcrossDevices()
    }, 300000)

    // Release expired inventory reservations every 10 minutes
    setInterval(() => {
      this.releaseExpiredReservations()
    }, 600000)
  }

  private cleanupExpiredCarts(): void {
    const now = new Date()
    for (const [cartId, cart] of this.carts) {
      if (cart.expiresAt && cart.expiresAt < now && cart.status === 'active') {
        cart.status = 'expired'
        cart.lastModified = now
        this.emit('cartExpired', { cartId, customerId: cart.customerId })
      }
    }
  }

  private checkAbandonedCarts(): void {
    const now = new Date()
    const abandonmentThreshold = 30 * 60 * 1000 // 30 minutes

    for (const [cartId, cart] of this.carts) {
      if (cart.status === 'active' && 
          cart.items.length > 0 &&
          !cart.abandonedAt &&
          (now.getTime() - cart.lastAccessedAt.getTime()) > abandonmentThreshold) {
        cart.status = 'abandoned'
        cart.abandonedAt = now
        cart.lastModified = now
        this.emit('cartAbandoned', { 
          cartId, 
          customerId: cart.customerId,
          cartValue: cart.grandTotal,
          itemCount: cart.itemCount
        })
      }
    }
  }

  private async syncCartsAcrossDevices(): Promise<void> {
    // Would implement cross-device synchronization
  }

  private async releaseExpiredReservations(): Promise<void> {
    // Would release expired inventory reservations
  }

  // Public API methods
  getCart(cartId: string): ShoppingCart | undefined {
    return this.carts.get(cartId)
  }

  getCustomerCarts(customerId: string): ShoppingCart[] {
    const cartIds = this.cartByCustomer.get(customerId) || []
    return cartIds.map(id => this.carts.get(id)).filter(Boolean) as ShoppingCart[]
  }

  getActiveCarts(): ShoppingCart[] {
    return Array.from(this.carts.values()).filter(cart => cart.status === 'active')
  }
}

// Supporting classes (simplified implementations)
class ConflictResolver {
  async resolveConflict(conflict: CartConflict, resolution: any): Promise<any> {
    switch (resolution.strategy) {
      case 'keep_local':
        return conflict.conflictData.localValue
      case 'use_remote':
        return conflict.conflictData.remoteValue
      case 'manual':
        return resolution.value
      default:
        return conflict.conflictData.serverValue
    }
  }
}

class InventoryReserver {
  async reserveInventory(productId: string, quantity: number, cartId: string, customerId: string, minutes: number): Promise<any> {
    return { id: `res_${Date.now()}`, expiresAt: new Date(Date.now() + minutes * 60 * 1000) }
  }

  async updateReservation(reservationId: string, newQuantity: number): Promise<void> {
    console.log(`Updating reservation ${reservationId} to ${newQuantity}`)
  }

  async releaseReservation(reservationId: string): Promise<void> {
    console.log(`Releasing reservation ${reservationId}`)
  }
}

class CartPriceCalculator {
  // Would implement sophisticated pricing logic
}

class CartValidationEngine {
  async validateCart(cart: ShoppingCart): Promise<CartValidationResult> {
    return {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }
  }
}

class CartSyncManager {
  async syncCartAcrossDevices(cart: ShoppingCart): Promise<void> {
    console.log(`Syncing cart ${cart.id} across devices`)
  }
}

class CartPersistenceManager {
  // Would implement database persistence
}

class CartRecommendationEngine {
  async generateRecommendations(cart: ShoppingCart, item: CartItem): Promise<CartSuggestion[]> {
    return []
  }
}

// Singleton instance
export const persistentCartService = new PersistentCartService()

export default persistentCartService