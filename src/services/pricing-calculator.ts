import { DEFAULT_TAX_CONFIG, calculateTax } from '@/config/tax'

export interface CartItem {
  id: string
  productId: string
  quantity: number
  price: number
  name?: string
}

export interface VolumeDiscount {
  minAmount: number
  percentage: number
  label: string
}

export interface CartTotals {
  subtotal: number
  volumeDiscount: VolumeDiscount | null
  discountAmount: number
  tax: number
  shipping: number
  total: number
}

export interface NextDiscountTier {
  tier: VolumeDiscount
  amountNeeded: number
  additionalSavings: number
}

export class PricingCalculator {
  private static readonly VOLUME_DISCOUNTS: VolumeDiscount[] = [
    { minAmount: 1000, percentage: 0.10, label: '10% off orders $1,000+' },
    { minAmount: 2500, percentage: 0.15, label: '15% off orders $2,500+' },
    { minAmount: 5000, percentage: 0.20, label: '20% off orders $5,000+' },
  ]

  private static readonly TAX_RATE = DEFAULT_TAX_CONFIG.rate // Use centralized tax config
  private static readonly FREE_SHIPPING_MIN = 500
  private static readonly SHIPPING_COST = 25

  /**
   * Calculate the volume discount for a given subtotal
   */
  calculateVolumeDiscount(subtotal: number): VolumeDiscount | null {
    // Find the highest applicable discount tier
    for (let i = PricingCalculator.VOLUME_DISCOUNTS.length - 1; i >= 0; i--) {
      const discount = PricingCalculator.VOLUME_DISCOUNTS[i]
      if (subtotal >= discount.minAmount) {
        return discount
      }
    }
    return null
  }

  /**
   * Calculate all totals for a cart
   */
  calculateCartTotal(items: CartItem[]): CartTotals {
    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Get volume discount
    const volumeDiscount = this.calculateVolumeDiscount(subtotal)
    const discountAmount = volumeDiscount ? subtotal * volumeDiscount.percentage : 0

    // Calculate tax on discounted amount
    const taxableAmount = subtotal - discountAmount
    // Use centralized tax calculation
    const tax = calculateTax(taxableAmount)

    // Calculate shipping
    const shipping = subtotal >= PricingCalculator.FREE_SHIPPING_MIN ? 0 : PricingCalculator.SHIPPING_COST

    // Calculate total
    const total = taxableAmount + tax + shipping

    return {
      subtotal,
      volumeDiscount,
      discountAmount,
      tax,
      shipping,
      total,
    }
  }

  /**
   * Get the next discount tier and amount needed to reach it
   */
  getNextDiscountTier(currentSubtotal: number): NextDiscountTier | null {
    const currentDiscount = this.calculateVolumeDiscount(currentSubtotal)
    const currentDiscountPercentage = currentDiscount?.percentage || 0

    // Find next tier
    for (const tier of PricingCalculator.VOLUME_DISCOUNTS) {
      if (tier.percentage > currentDiscountPercentage) {
        const amountNeeded = tier.minAmount - currentSubtotal
        const additionalSavings = tier.minAmount * tier.percentage - (currentSubtotal * currentDiscountPercentage)
        
        return {
          tier,
          amountNeeded,
          additionalSavings,
        }
      }
    }

    return null
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  /**
   * Calculate savings percentage
   */
  calculateSavingsPercentage(original: number, discounted: number): number {
    if (original === 0) return 0
    return Math.round(((original - discounted) / original) * 100)
  }

  /**
   * Check if cart qualifies for free shipping
   */
  qualifiesForFreeShipping(subtotal: number): boolean {
    return subtotal >= PricingCalculator.FREE_SHIPPING_MIN
  }

  /**
   * Get amount needed for free shipping
   */
  getAmountForFreeShipping(subtotal: number): number {
    if (this.qualifiesForFreeShipping(subtotal)) return 0
    return PricingCalculator.FREE_SHIPPING_MIN - subtotal
  }

  /**
   * Get all discount tiers for display
   */
  getAllDiscountTiers(): VolumeDiscount[] {
    return [...PricingCalculator.VOLUME_DISCOUNTS]
  }
}