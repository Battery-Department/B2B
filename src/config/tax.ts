/**
 * Centralized Tax Configuration
 * 
 * This file contains all tax-related configurations to ensure
 * consistency across the entire application.
 */

export interface TaxConfig {
  rate: number
  displayRate: string
  description: string
  region: string
}

export interface RegionalTaxConfig extends TaxConfig {
  currency: string
  baseMultiplier: number
  shippingMultiplier: number
}

// Default tax configuration (Massachusetts)
export const DEFAULT_TAX_CONFIG: TaxConfig = {
  rate: 0.08,
  displayRate: '8%',
  description: 'MA sales tax',
  region: 'Massachusetts'
}

// Regional tax configurations for international orders
export const REGIONAL_TAX_CONFIGS: Record<string, RegionalTaxConfig> = {
  'north-america': {
    rate: 0.08,
    displayRate: '8%',
    description: 'Sales tax',
    region: 'North America',
    currency: 'USD',
    baseMultiplier: 1.0,
    shippingMultiplier: 1.0
  },
  'asia-pacific': {
    rate: 0.10,
    displayRate: '10%',
    description: 'GST/VAT',
    region: 'Asia Pacific',
    currency: 'USD',
    baseMultiplier: 1.05,
    shippingMultiplier: 1.2
  },
  'europe': {
    rate: 0.20,
    displayRate: '20%',
    description: 'VAT',
    region: 'Europe',
    currency: 'EUR',
    baseMultiplier: 1.08,
    shippingMultiplier: 1.15
  },
  'oceania': {
    rate: 0.12,
    displayRate: '12%',
    description: 'GST',
    region: 'Oceania',
    currency: 'AUD',
    baseMultiplier: 1.12,
    shippingMultiplier: 1.3
  }
}

// Tax calculation utilities
export class TaxCalculator {
  /**
   * Calculate tax amount based on subtotal
   * @param subtotal - The subtotal amount (after discounts)
   * @param taxConfig - Tax configuration to use (defaults to DEFAULT_TAX_CONFIG)
   * @returns The calculated tax amount
   */
  static calculateTax(subtotal: number, taxConfig: TaxConfig = DEFAULT_TAX_CONFIG): number {
    return Number((subtotal * taxConfig.rate).toFixed(2))
  }

  /**
   * Calculate tax for a given region
   * @param subtotal - The subtotal amount (after discounts)
   * @param region - The region identifier
   * @returns The calculated tax amount
   */
  static calculateRegionalTax(subtotal: number, region: string): number {
    const config = REGIONAL_TAX_CONFIGS[region] || DEFAULT_TAX_CONFIG
    return this.calculateTax(subtotal, config)
  }

  /**
   * Get tax configuration for a region
   * @param region - The region identifier
   * @returns The tax configuration for the region
   */
  static getTaxConfig(region?: string): TaxConfig | RegionalTaxConfig {
    if (!region || region === 'us' || region === 'massachusetts') {
      return DEFAULT_TAX_CONFIG
    }
    return REGIONAL_TAX_CONFIGS[region] || DEFAULT_TAX_CONFIG
  }

  /**
   * Format tax amount for display
   * @param amount - The tax amount
   * @param currency - The currency code (defaults to USD)
   * @returns Formatted tax amount string
   */
  static formatTaxAmount(amount: number, currency: string = 'USD'): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    return formatter.format(amount)
  }

  /**
   * Calculate total including tax
   * @param subtotal - The subtotal amount
   * @param taxConfig - Tax configuration to use
   * @returns Object with subtotal, tax, and total
   */
  static calculateTotal(subtotal: number, taxConfig: TaxConfig = DEFAULT_TAX_CONFIG) {
    const tax = this.calculateTax(subtotal, taxConfig)
    const total = subtotal + tax
    
    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: tax,
      total: Number(total.toFixed(2)),
      taxRate: taxConfig.rate,
      taxDescription: taxConfig.description
    }
  }
}

// Export convenience functions
export const calculateTax = TaxCalculator.calculateTax
export const calculateRegionalTax = TaxCalculator.calculateRegionalTax
export const getTaxConfig = TaxCalculator.getTaxConfig
export const formatTaxAmount = TaxCalculator.formatTaxAmount
export const calculateTotal = TaxCalculator.calculateTotal