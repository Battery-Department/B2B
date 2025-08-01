// Terminal 3 Integration: Cart Service with Product Intelligence
// Integrates with Terminal 4's product intelligence for smart recommendations

import { prisma } from '@/lib/prisma-safe'
import { pricingService } from './pricing-service'
import { inventoryService } from './inventory-service'

export interface CartItem {
  id: string
  cartId: string
  productId: string
  sku: string
  name: string
  quantity: number
  price: number
  originalPrice: number
  discount: number
  compatibility?: ProductCompatibility
  bundleId?: string
}

export interface Cart {
  id: string
  userId: string
  items: CartItem[]
  subtotal: number
  discount: number
  total: number
  suggestions: ProductSuggestion[]
  warnings: CartWarning[]
  createdAt: Date
  updatedAt: Date
}

export interface ProductCompatibility {
  compatible: boolean
  reason?: string
  requiredProducts?: string[]
  incompatibleProducts?: string[]
}

export interface ProductSuggestion {
  productId: string
  type: 'bundle' | 'accessory' | 'alternative' | 'upsell'
  reason: string
  savings?: number
  relevanceScore: number
}

export interface CartWarning {
  type: 'incompatible' | 'out_of_stock' | 'price_change' | 'low_stock'
  productId?: string
  message: string
  severity: 'info' | 'warning' | 'error'
}

export interface BundleOpportunity {
  bundleId: string
  products: string[]
  totalPrice: number
  bundlePrice: number
  savings: number
  description: string
}

export class IncompatibleProductError extends Error {
  constructor(
    public reason: string,
    public alternatives: ProductSuggestion[]
  ) {
    super(`Product incompatibility: ${reason}`)
  }
}

export class CartService {
  // Add item to cart with intelligent checks
  async addToCart(
    userId: string, 
    productId: string, 
    quantity: number
  ): Promise<Cart> {
    try {
      // Get or create cart
      let cart = await this.getOrCreateCart(userId)

      // Get enhanced product data from Terminal 4
      const product = await this.getEnhancedProduct(productId)

      // Check inventory availability
      const availability = await inventoryService.checkAvailability(productId, quantity)
      if (!availability.available) {
        throw new Error(`Product out of stock. Available: ${availability.quantity}`)
      }

      // Check compatibility with existing cart items
      const compatibility = await this.checkCompatibility(
        cart.items.map(item => item.productId),
        productId
      )

      if (!compatibility.compatible) {
        // Suggest alternatives
        const alternatives = await this.getAlternatives(productId, {
          compatible: cart.items,
          priceRange: product.price * 0.8 // 20% price flexibility
        })

        throw new IncompatibleProductError(compatibility.reason!, alternatives)
      }

      // Check for bundle opportunities
      const bundle = await this.checkBundleOpportunity(cart, product)
      
      if (bundle) {
        return this.addBundle(userId, bundle)
      }

      // Get dynamic pricing
      const pricing = await pricingService.getDynamicPrice(productId, userId, quantity)

      // Add item to cart
      const cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          sku: product.sku,
          name: product.name,
          quantity,
          price: pricing.dynamicPrice,
          originalPrice: pricing.basePrice,
          discount: pricing.discount
        }
      })

      // Update cart and get suggestions
      cart = await this.updateCartTotals(cart.id)
      cart = await this.addProductSuggestions(cart)
      cart = await this.checkCartWarnings(cart)

      return cart
    } catch (error) {
      if (error instanceof IncompatibleProductError) {
        throw error
      }
      console.error('Failed to add to cart:', error)
      throw error
    }
  }

  // Update cart item quantity
  async updateQuantity(
    userId: string,
    itemId: string,
    quantity: number
  ): Promise<Cart> {
    const cart = await this.getCart(userId)
    if (!cart) {
      throw new Error('Cart not found')
    }

    const item = cart.items.find(i => i.id === itemId)
    if (!item) {
      throw new Error('Item not found in cart')
    }

    // Check new quantity availability
    const availability = await inventoryService.checkAvailability(
      item.productId,
      quantity
    )

    if (!availability.available) {
      throw new Error(`Only ${availability.quantity} units available`)
    }

    // Update pricing based on new quantity
    const pricing = await pricingService.getDynamicPrice(
      item.productId,
      userId,
      quantity
    )

    // Update item
    await prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity,
        price: pricing.dynamicPrice,
        discount: pricing.discount
      }
    })

    // Recalculate totals and suggestions
    let updatedCart = await this.updateCartTotals(cart.id)
    updatedCart = await this.addProductSuggestions(updatedCart)
    updatedCart = await this.checkCartWarnings(updatedCart)

    return updatedCart
  }

  // Remove item from cart
  async removeItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getCart(userId)
    if (!cart) {
      throw new Error('Cart not found')
    }

    await prisma.cartItem.delete({
      where: { id: itemId }
    })

    let updatedCart = await this.updateCartTotals(cart.id)
    updatedCart = await this.addProductSuggestions(updatedCart)
    updatedCart = await this.checkCartWarnings(updatedCart)

    return updatedCart
  }

  // Get cart
  async getCart(userId: string): Promise<Cart | null> {
    const cart = await prisma.cart.findFirst({
      where: {
        userId,
        status: 'active'
      },
      include: {
        items: true
      }
    })

    if (!cart) return null

    return this.formatCart(cart)
  }

  // Get or create cart
  private async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.getCart(userId)
    
    if (!cart) {
      const newCart = await prisma.cart.create({
        data: {
          userId,
          status: 'active'
        },
        include: {
          items: true
        }
      })
      
      cart = this.formatCart(newCart)
    }

    return cart
  }

  // Get enhanced product data (Terminal 4 integration)
  private async getEnhancedProduct(productId: string): Promise<any> {
    // In production, would call Terminal 4's product intelligence API
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      throw new Error('Product not found')
    }

    // Simulate enhanced data
    return {
      ...product,
      compatibility: {
        requiredProducts: [],
        incompatibleProducts: [],
        recommendedAccessories: []
      },
      intelligence: {
        popularityScore: 0.85,
        returnRate: 0.02,
        satisfactionScore: 4.8
      }
    }
  }

  // Check product compatibility
  private async checkCompatibility(
    existingProductIds: string[],
    newProductId: string
  ): Promise<ProductCompatibility> {
    // In production, would use Terminal 4's compatibility engine
    // For now, simulate compatibility logic

    // All FlexVolt batteries are compatible with each other
    return {
      compatible: true
    }
  }

  // Get product alternatives
  private async getAlternatives(
    productId: string,
    criteria: any
  ): Promise<ProductSuggestion[]> {
    // In production, would use Terminal 4's recommendation engine
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) return []

    // Get similar products
    const alternatives = await prisma.product.findMany({
      where: {
        id: { not: productId },
        category: product.category,
        price: {
          gte: criteria.priceRange,
          lte: product.price * 1.2
        }
      },
      take: 3
    })

    return alternatives.map(alt => ({
      productId: alt.id,
      type: 'alternative' as const,
      reason: `Similar to ${product.name} with comparable features`,
      savings: product.price - alt.price,
      relevanceScore: 0.8
    }))
  }

  // Check for bundle opportunities
  private async checkBundleOpportunity(
    cart: Cart,
    product: any
  ): Promise<BundleOpportunity | null> {
    // In production, would use Terminal 4's bundling engine
    
    // Simple bundle logic: if cart has 6Ah and adding 9Ah, suggest bundle
    const has6Ah = cart.items.some(item => item.sku === 'FLEX-6AH')
    const adding9Ah = product.sku === 'FLEX-9AH'
    
    if (has6Ah && adding9Ah) {
      return {
        bundleId: 'bundle_6_9',
        products: ['FLEX-6AH', 'FLEX-9AH'],
        totalPrice: 220, // 95 + 125
        bundlePrice: 200, // Bundle discount
        savings: 20,
        description: 'FlexVolt Starter Bundle - 6Ah + 9Ah'
      }
    }

    return null
  }

  // Add bundle to cart
  private async addBundle(userId: string, bundle: BundleOpportunity): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId)

    // Add all bundle items with bundle pricing
    for (const productId of bundle.products) {
      const product = await prisma.product.findUnique({
        where: { sku: productId }
      })

      if (product) {
        // Calculate individual price in bundle
        const bundleItemPrice = bundle.bundlePrice / bundle.products.length

        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: product.id,
            sku: product.sku,
            name: product.name,
            quantity: 1,
            price: bundleItemPrice,
            originalPrice: product.price,
            discount: product.price - bundleItemPrice,
            bundleId: bundle.bundleId
          }
        })
      }
    }

    let updatedCart = await this.updateCartTotals(cart.id)
    updatedCart = await this.addProductSuggestions(updatedCart)
    updatedCart = await this.checkCartWarnings(updatedCart)

    return updatedCart
  }

  // Add product suggestions
  private async addProductSuggestions(cart: Cart): Promise<Cart> {
    const suggestions: ProductSuggestion[] = []

    // Suggest accessories based on cart items
    if (cart.items.length > 0) {
      // Suggest charger if buying batteries
      const hasCharger = cart.items.some(item => 
        item.name.toLowerCase().includes('charger')
      )
      
      if (!hasCharger) {
        const charger = await prisma.product.findFirst({
          where: {
            name: { contains: 'charger', mode: 'insensitive' }
          }
        })

        if (charger) {
          suggestions.push({
            productId: charger.id,
            type: 'accessory',
            reason: 'Complete your setup with a fast charger',
            relevanceScore: 0.9
          })
        }
      }

      // Upsell to higher capacity if only small batteries
      const onlySmallBatteries = cart.items.every(item => 
        item.sku === 'FLEX-6AH'
      )

      if (onlySmallBatteries) {
        const largeBattery = await prisma.product.findFirst({
          where: { sku: 'FLEX-15AH' }
        })

        if (largeBattery) {
          suggestions.push({
            productId: largeBattery.id,
            type: 'upsell',
            reason: 'Upgrade to 15Ah for extended runtime',
            savings: 50, // Bundle savings
            relevanceScore: 0.85
          })
        }
      }
    }

    cart.suggestions = suggestions
    return cart
  }

  // Check cart warnings
  private async checkCartWarnings(cart: Cart): Promise<Cart> {
    const warnings: CartWarning[] = []

    for (const item of cart.items) {
      // Check inventory levels
      const inventory = await inventoryService.getInventoryLevel(item.productId)
      
      if (inventory === 0) {
        warnings.push({
          type: 'out_of_stock',
          productId: item.productId,
          message: `${item.name} is out of stock`,
          severity: 'error'
        })
      } else if (inventory < item.quantity) {
        warnings.push({
          type: 'low_stock',
          productId: item.productId,
          message: `Only ${inventory} units of ${item.name} available`,
          severity: 'warning'
        })
      } else if (inventory < 10) {
        warnings.push({
          type: 'low_stock',
          productId: item.productId,
          message: `Low stock alert: Only ${inventory} units remaining`,
          severity: 'info'
        })
      }

      // Check for price changes
      const currentPrice = await pricingService.getDynamicPrice(
        item.productId,
        cart.userId,
        item.quantity
      )

      if (Math.abs(currentPrice.dynamicPrice - item.price) > 0.01) {
        warnings.push({
          type: 'price_change',
          productId: item.productId,
          message: `Price updated for ${item.name}`,
          severity: 'info'
        })
      }
    }

    cart.warnings = warnings
    return cart
  }

  // Update cart totals
  private async updateCartTotals(cartId: string): Promise<Cart> {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true }
    })

    if (!cart) {
      throw new Error('Cart not found')
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    )
    
    const discount = cart.items.reduce(
      (sum, item) => sum + (item.discount * item.quantity), 
      0
    )

    const updatedCart = await prisma.cart.update({
      where: { id: cartId },
      data: {
        subtotal,
        discount,
        total: subtotal,
        updatedAt: new Date()
      },
      include: { items: true }
    })

    return this.formatCart(updatedCart)
  }

  // Format cart from database
  private formatCart(dbCart: any): Cart {
    return {
      id: dbCart.id,
      userId: dbCart.userId,
      items: dbCart.items.map((item: any) => ({
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.originalPrice,
        discount: item.discount,
        bundleId: item.bundleId
      })),
      subtotal: dbCart.subtotal,
      discount: dbCart.discount,
      total: dbCart.total,
      suggestions: [],
      warnings: [],
      createdAt: dbCart.createdAt,
      updatedAt: dbCart.updatedAt
    }
  }
}

// Singleton instance
export const cartService = new CartService()

export default cartService