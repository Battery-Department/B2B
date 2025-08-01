/**
 * Mock Services for Testing Cycle 1
 * Provides realistic service implementations for comprehensive testing
 */

import { CreateOrderRequest, Order, OrderStatus, WarehouseRegion } from '@/types/order_apis'
import { SupplierAuthData } from '@/types/auth'

export const mockEnhancedOrderApisService = {
  createOrder: async (
    orderRequest: CreateOrderRequest,
    supplier: SupplierAuthData,
    requestId: string
  ): Promise<{ success: boolean; data?: Order; error?: string }> => {
    try {
      // Calculate totals
      const itemTotal = orderRequest.items.reduce((total, item) => {
        const prices = {
          'flexvolt-6ah': 95,
          'flexvolt-9ah': 125,
          'flexvolt-15ah': 245
        }
        return total + (prices[item.productId as keyof typeof prices] || 0) * item.quantity
      }, 0)

      // Apply volume discount based on supplier tier
      let discountPercentage = 0
      if (supplier.tier === 'CONTRACTOR' && itemTotal >= 1000) discountPercentage = 10
      else if (supplier.tier === 'DISTRIBUTOR' && itemTotal >= 5000) discountPercentage = 25
      else if (supplier.tier === 'FLEET' && itemTotal >= 2500) discountPercentage = 20

      const discountAmount = (itemTotal * discountPercentage) / 100
      const finalTotal = itemTotal - discountAmount

      const mockOrder: Order = {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderNumber: `RHY${Date.now().toString().slice(-8)}`,
        supplier: {
          id: supplier.id,
          companyName: supplier.companyName,
          tier: supplier.tier
        },
        items: orderRequest.items.map(item => ({
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: (() => {
            const pricing = {
              'flexvolt-6ah': 95,
              'flexvolt-9ah': 125,
              'flexvolt-15ah': 245
            }
            return pricing[item.productId as keyof typeof pricing] || 0
          })(),
          totalPrice: (() => {
            const pricing = {
              'flexvolt-6ah': 95,
              'flexvolt-9ah': 125,
              'flexvolt-15ah': 245
            }
            return (pricing[item.productId as keyof typeof pricing] || 0) * item.quantity
          })(),
          warehouseAllocation: {
            warehouse: item.warehousePreference || 'US_WEST',
            allocatedQuantity: item.quantity,
            reservationId: `res_${Date.now()}`
          }
        })),
        shippingAddress: orderRequest.shippingAddress,
        shippingMethod: orderRequest.shippingMethod,
        pricing: {
          subtotal: itemTotal,
          volumeDiscount: {
            applicable: discountPercentage > 0,
            discountPercentage,
            discountAmount,
            tierName: supplier.tier === 'CONTRACTOR' ? 'Contractor' : 
                     supplier.tier === 'DISTRIBUTOR' ? 'Enterprise' : 'Commercial'
          },
          shipping: {
            cost: itemTotal > 500 ? 0 : 25, // Free shipping over $500
            method: orderRequest.shippingMethod,
            estimatedDays: orderRequest.shippingMethod === 'expedited' ? 3 : 5
          },
          tax: finalTotal * 0.08, // 8% tax
          total: finalTotal + (itemTotal > 500 ? 0 : 25) + (finalTotal * 0.08)
        },
        warehouseCoordination: {
          primaryWarehouse: orderRequest.items[0]?.warehousePreference || 'US_WEST',
          allocations: orderRequest.items.map(item => ({
            warehouse: item.warehousePreference || 'US_WEST',
            productId: item.productId,
            quantity: item.quantity,
            status: 'allocated' as const
          }))
        },
        status: 'pending' as OrderStatus,
        customerPO: orderRequest.customerPO,
        customerNotes: orderRequest.customerNotes,
        priority: orderRequest.priority,
        requestedDeliveryDate: orderRequest.requestedDeliveryDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        tracking: {
          orderPlaced: new Date(),
          estimatedShipping: new Date(Date.now() + 24 * 60 * 60 * 1000),
          estimatedDelivery: new Date(Date.now() + (orderRequest.shippingMethod === 'expedited' ? 3 : 5) * 24 * 60 * 60 * 1000)
        }
      }

      return { success: true, data: mockOrder }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }
}

export const mockOrderUtils = {
  OrderNumberGenerator: {
    generate: (warehouse: WarehouseRegion): string => {
      const timestamp = Date.now()
      const random = Math.random().toString(36).substr(2, 5)
      return `RHY${timestamp.toString().slice(-6)}${random}`
    }
  },
  
  FlexVoltProductUtils: {
    PRODUCT_PRICING: {
      '6Ah': { basePrice: 95.00 },
      '9Ah': { basePrice: 125.00 },
      '15Ah': { basePrice: 245.00 }
    },
    
    calculateVolumeDiscount: (orderTotal: number, tier: string) => {
      let discountPercentage = 0
      let tierName = ''
      
      if (tier === 'CONTRACTOR' && orderTotal >= 1000) {
        discountPercentage = 10
        tierName = 'Contractor'
      } else if (tier === 'DISTRIBUTOR' && orderTotal >= 5000) {
        discountPercentage = 25
        tierName = 'Enterprise'
      } else if (tier === 'FLEET' && orderTotal >= 2500) {
        discountPercentage = 20
        tierName = 'Commercial'
      }
      
      return {
        discountPercentage,
        tierName,
        discountAmount: (orderTotal * discountPercentage) / 100
      }
    },
    
    getProductByType: (type: string) => ({
      type,
      basePrice: {
        '6Ah': 95,
        '9Ah': 125,
        '15Ah': 245
      }[type] || 0,
      specifications: {
        voltage: '20V/60V MAX',
        capacity: type,
        weight: {
          '6Ah': 1.4,
          '9Ah': 1.8,
          '15Ah': 2.6
        }[type] || 1.0
      }
    }),
    
    validateCompatibility: (products: any[], platform: string) => ({
      compatible: platform === '20V MAX',
      warnings: platform !== '20V MAX' ? ['Platform compatibility issue'] : []
    })
  },
  
  ShippingCalculator: {
    calculateShippingCost: (
      method: string,
      weight: number,
      orderValue: number,
      destination: { country: string; isCommercial?: boolean }
    ) => {
      const freeShippingApplied = orderValue >= 500
      const baseCost = freeShippingApplied ? 0 : (method === 'expedited' ? 35 : 25)
      // For contractor test: $1890 should not qualify for free shipping
      const actualCost = orderValue < 500 ? baseCost : 0
      
      return {
        cost: actualCost,
        method,
        estimatedDays: method === 'expedited' ? 3 : 5,
        freeShippingApplied
      }
    }
  },
  
  WarehouseCoordinator: {
    getOptimalWarehouse: (location: string, urgency: string, products: string[]): WarehouseRegion => {
      if (location.includes('Japan')) return 'JAPAN'
      if (location.includes('EU') || location.includes('Europe')) return 'EU'
      if (location.includes('Australia')) return 'AUSTRALIA'
      return 'US_WEST'
    }
  }
}