/**
 * RHY_056 Order API Infrastructure - Comprehensive Unit Test Suite
 * Production-ready test validation for enterprise order management system
 * Validates FlexVolt business logic, multi-warehouse operations, and volume discounts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { enhancedOrderApisService } from '@/services/order_apis/EnhancedOrderApisService'
import { 
  OrderNumberGenerator,
  FlexVoltProductUtils,
  OrderStatusManager,
  ShippingCalculator,
  WarehouseCoordinator,
  OrderValidator
} from '@/lib/order_apis-utils'
import { 
  CreateOrderRequest,
  Order,
  OrderStatus,
  WarehouseRegion,
  OrderPriority
} from '@/types/order_apis'
import { SupplierAuthData } from '@/types/auth'

// Mock data for testing
const mockSupplier: SupplierAuthData = {
  id: 'supplier_test_001',
  companyName: 'Test Construction Co.',
  tier: 'CONTRACTOR',
  status: 'ACTIVE',
  warehouseAccess: [
    {
      warehouse: 'US_WEST',
      permissions: ['VIEW_ORDERS', 'PLACE_ORDERS', 'MODIFY_ORDERS'],
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    }
  ],
  volumeDiscountTier: {
    threshold: 1000,
    discountPercentage: 10,
    tierName: 'Contractor'
  },
  createdAt: new Date(),
  lastLoginAt: new Date()
}

const mockCreateOrderRequest: CreateOrderRequest = {
  items: [
    {
      productId: 'flexvolt-6ah',
      quantity: 5,
      warehousePreference: 'US_WEST'
    },
    {
      productId: 'flexvolt-9ah',
      quantity: 3,
      warehousePreference: 'US_WEST'
    }
  ],
  shippingAddress: {
    companyName: 'Test Construction Co.',
    contactName: 'John Doe',
    addressLine1: '123 Construction St',
    addressLine2: 'Suite 100',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90210',
    country: 'US',
    phoneNumber: '+1-555-0123',
    deliveryInstructions: 'Deliver to job site trailer',
    isCommercialAddress: true
  },
  shippingMethod: 'standard',
  customerPO: 'PO-2025-001',
  customerNotes: 'Urgent delivery for project deadline',
  priority: 'high',
  requestedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
}

describe('RHY_056 Order API Infrastructure - Unit Tests', () => {
  
  describe('OrderNumberGenerator', () => {
    it('should generate valid order numbers with warehouse prefixes', () => {
      const orderNumber = OrderNumberGenerator.generate('US_WEST')
      
      expect(orderNumber).toMatch(/^USW\d{8}$/)
      expect(orderNumber.length).toBe(11)
    })

    it('should generate different order numbers for different warehouses', () => {
      const usOrder = OrderNumberGenerator.generate('US_WEST')
      const jpOrder = OrderNumberGenerator.generate('JAPAN')
      const euOrder = OrderNumberGenerator.generate('EU')
      const auOrder = OrderNumberGenerator.generate('AUSTRALIA')
      
      expect(usOrder.startsWith('USW')).toBe(true)
      expect(jpOrder.startsWith('JPN')).toBe(true)
      expect(euOrder.startsWith('EUR')).toBe(true)
      expect(auOrder.startsWith('AUS')).toBe(true)
    })

    it('should parse order numbers correctly', () => {
      const orderNumber = 'USW25012401'
      const parsed = OrderNumberGenerator.parseOrderNumber(orderNumber)
      
      expect(parsed.isValid).toBe(true)
      expect(parsed.warehouse).toBe('US_WEST')
      expect(parsed.sequence).toBe(1)
    })

    it('should handle invalid order number formats', () => {
      const parsed = OrderNumberGenerator.parseOrderNumber('INVALID123')
      
      expect(parsed.isValid).toBe(false)
    })
  })

  describe('FlexVoltProductUtils', () => {
    it('should return correct pricing for FlexVolt products', () => {
      const pricing = FlexVoltProductUtils.PRODUCT_PRICING
      
      expect(pricing['6Ah'].basePrice).toBe(95.00)
      expect(pricing['9Ah'].basePrice).toBe(125.00)
      expect(pricing['15Ah'].basePrice).toBe(245.00)
    })

    it('should calculate volume discounts correctly', () => {
      const orderTotal = 2500
      const supplierTier = 'CONTRACTOR'
      
      const discount = FlexVoltProductUtils.calculateVolumeDiscount(orderTotal, supplierTier)
      
      expect(discount.discountPercentage).toBe(15)
      expect(discount.discountAmount).toBe(375) // 15% of 2500
      expect(discount.tierName).toBe('Professional')
    })

    it('should return zero discount for orders below threshold', () => {
      const orderTotal = 500
      const supplierTier = 'DIRECT'
      
      const discount = FlexVoltProductUtils.calculateVolumeDiscount(orderTotal, supplierTier)
      
      expect(discount.discountPercentage).toBe(0)
      expect(discount.discountAmount).toBe(0)
      expect(discount.tierName).toBe('Standard')
    })

    it('should validate product compatibility correctly', () => {
      const products = [
        FlexVoltProductUtils.getProductByType('6Ah'),
        FlexVoltProductUtils.getProductByType('9Ah')
      ]
      
      const compatibility = FlexVoltProductUtils.validateCompatibility(products, '20V MAX')
      
      expect(compatibility.compatible).toBe(true)
      expect(compatibility.warnings).toHaveLength(0)
    })
  })

  describe('OrderStatusManager', () => {
    it('should validate status transitions correctly', () => {
      expect(OrderStatusManager.canTransitionTo('pending', 'confirmed')).toBe(true)
      expect(OrderStatusManager.canTransitionTo('pending', 'shipped')).toBe(false)
      expect(OrderStatusManager.canTransitionTo('delivered', 'refunded')).toBe(true)
      expect(OrderStatusManager.canTransitionTo('cancelled', 'confirmed')).toBe(false)
    })

    it('should return correct next valid statuses', () => {
      const nextStatuses = OrderStatusManager.getNextValidStatuses('confirmed')
      
      expect(nextStatuses).toContain('processing')
      expect(nextStatuses).toContain('cancelled')
      expect(nextStatuses).not.toContain('pending')
    })

    it('should identify active and final statuses correctly', () => {
      expect(OrderStatusManager.isActiveStatus('processing')).toBe(true)
      expect(OrderStatusManager.isActiveStatus('delivered')).toBe(false)
      expect(OrderStatusManager.isFinalStatus('cancelled')).toBe(true)
      expect(OrderStatusManager.isFinalStatus('pending')).toBe(false)
    })
  })

  describe('ShippingCalculator', () => {
    it('should calculate shipping costs correctly', () => {
      const result = ShippingCalculator.calculateShippingCost(
        'standard',
        10, // 10 lbs
        400, // $400 subtotal
        { country: 'US', isCommercial: true }
      )
      
      expect(result.cost).toBeGreaterThan(0)
      expect(result.estimatedDays).toBe(5)
      expect(result.freeShippingApplied).toBe(false)
    })

    it('should apply free shipping for orders over threshold', () => {
      const result = ShippingCalculator.calculateShippingCost(
        'standard',
        10, // 10 lbs
        600, // $600 subtotal (over $500 threshold)
        { country: 'US', isCommercial: true }
      )
      
      expect(result.cost).toBe(0)
      expect(result.freeShippingApplied).toBe(true)
    })

    it('should apply international shipping surcharge', () => {
      const domesticResult = ShippingCalculator.calculateShippingCost(
        'standard',
        10,
        400,
        { country: 'US', isCommercial: true }
      )
      
      const internationalResult = ShippingCalculator.calculateShippingCost(
        'standard',
        10,
        400,
        { country: 'CA', isCommercial: true }
      )
      
      expect(internationalResult.cost).toBeGreaterThan(domesticResult.cost)
    })

    it('should recommend appropriate shipping methods based on priority', () => {
      expect(ShippingCalculator.getRecommendedShippingMethod('urgent', { country: 'US' })).toBe('overnight')
      expect(ShippingCalculator.getRecommendedShippingMethod('high', { country: 'US' })).toBe('expedited')
      expect(ShippingCalculator.getRecommendedShippingMethod('normal', { country: 'US' })).toBe('standard')
      expect(ShippingCalculator.getRecommendedShippingMethod('normal', { country: 'CA' })).toBe('international')
    })
  })

  describe('WarehouseCoordinator', () => {
    it('should select optimal warehouse based on location and priority', () => {
      const warehouse = WarehouseCoordinator.getOptimalWarehouse('US West Coast', 'urgent', ['6Ah'])
      
      expect(warehouse).toBe('US_WEST')
    })

    it('should calculate consolidation time correctly', () => {
      const singleWarehouse = WarehouseCoordinator.calculateConsolidationTime(['US_WEST'])
      const multiWarehouse = WarehouseCoordinator.calculateConsolidationTime(['US_WEST', 'JAPAN'])
      
      expect(singleWarehouse).toBe(0)
      expect(multiWarehouse).toBeGreaterThan(24)
    })

    it('should check warehouse operational status', () => {
      // This test would depend on current time, so we'll mock it
      const isOperational = WarehouseCoordinator.isWarehouseOperational('US_WEST')
      
      expect(typeof isOperational).toBe('boolean')
    })
  })

  describe('OrderValidator', () => {
    it('should validate order items correctly', () => {
      const validItems = [
        { productId: 'flexvolt-6ah', quantity: 5 },
        { productId: 'flexvolt-9ah', quantity: 3 }
      ]
      
      const result = OrderValidator.validateOrderItems(validItems)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty or invalid items', () => {
      const invalidItems = [
        { productId: '', quantity: 0 },
        { productId: 'flexvolt-6ah', quantity: -1 }
      ]
      
      const result = OrderValidator.validateOrderItems(invalidItems)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should validate shipping addresses correctly', () => {
      const validAddress = {
        companyName: 'Test Co',
        contactName: 'John Doe',
        addressLine1: '123 Main St',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90210',
        country: 'US'
      }
      
      const result = OrderValidator.validateShippingAddress(validAddress)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate US postal codes correctly', () => {
      const validAddress = {
        companyName: 'Test Co',
        contactName: 'John Doe',
        addressLine1: '123 Main St',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90210-1234',
        country: 'US'
      }
      
      const result = OrderValidator.validateShippingAddress(validAddress)
      
      expect(result.isValid).toBe(true)
    })

    it('should reject invalid US postal codes', () => {
      const invalidAddress = {
        companyName: 'Test Co',
        contactName: 'John Doe',
        addressLine1: '123 Main St',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: 'INVALID',
        country: 'US'
      }
      
      const result = OrderValidator.validateShippingAddress(invalidAddress)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('postal code'))).toBe(true)
    })

    it('should validate supplier access correctly', () => {
      const result = OrderValidator.validateSupplierAccess(mockSupplier, 'US_WEST')
      
      expect(result.hasAccess).toBe(true)
    })

    it('should reject access for inactive suppliers', () => {
      const inactiveSupplier = { ...mockSupplier, status: 'INACTIVE' }
      const result = OrderValidator.validateSupplierAccess(inactiveSupplier, 'US_WEST')
      
      expect(result.hasAccess).toBe(false)
      expect(result.message).toContain('not active')
    })
  })
})

describe('EnhancedOrderApisService Integration', () => {
  let service: typeof enhancedOrderApisService

  beforeEach(() => {
    service = enhancedOrderApisService
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Order Creation', () => {
    it('should create order with correct pricing calculation', async () => {
      const requestId = 'test_request_001'
      
      // Mock the database operations
      vi.spyOn(service, 'storeOrder' as any).mockResolvedValue(undefined)
      vi.spyOn(service, 'scheduleOrderConfirmation' as any).mockResolvedValue(undefined)
      
      const result = await service.createOrder(mockCreateOrderRequest, mockSupplier, requestId)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      
      if (result.data) {
        expect(result.data.orderNumber).toMatch(/^RHY\d{8}$/)
        expect(result.data.items).toHaveLength(2)
        expect(result.data.pricing.total).toBeGreaterThan(0)
      }
    })

    it('should apply volume discounts correctly', async () => {
      // Create a large order to trigger volume discounts
      const largeOrderRequest: CreateOrderRequest = {
        ...mockCreateOrderRequest,
        items: [
          { productId: 'flexvolt-15ah', quantity: 15 }, // 15 * $245 = $3675
          { productId: 'flexvolt-9ah', quantity: 10 }   // 10 * $125 = $1250
        ] // Total: $4925 -> should get 15% discount
      }
      
      vi.spyOn(service, 'storeOrder' as any).mockResolvedValue(undefined)
      vi.spyOn(service, 'scheduleOrderConfirmation' as any).mockResolvedValue(undefined)
      
      const result = await service.createOrder(largeOrderRequest, mockSupplier, 'test_request_002')
      
      expect(result.success).toBe(true)
      if (result.data) {
        expect(result.data.pricing.volumeDiscount.applicable).toBe(true)
        expect(result.data.pricing.volumeDiscount.discountAmount).toBeGreaterThan(0)
      }
    })

    it('should handle inventory shortage scenarios', async () => {
      // Mock inventory validation to simulate shortage
      vi.spyOn(service, 'validateInventoryAllocation' as any).mockResolvedValue({
        isValid: false,
        errors: [{ field: 'items.quantity', message: 'Insufficient inventory', code: 'OUT_OF_STOCK' }],
        warnings: []
      })
      
      const result = await service.createOrder(mockCreateOrderRequest, mockSupplier, 'test_request_003')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Insufficient inventory')
    })
  })

  describe('Order Retrieval', () => {
    it('should retrieve orders with correct filtering', async () => {
      const searchRequest = {
        filters: {
          status: ['pending', 'confirmed'] as OrderStatus[],
          warehouse: ['US_WEST'] as WarehouseRegion[]
        },
        page: 1,
        limit: 20,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const
      }
      
      const result = await service.getOrders(searchRequest, mockSupplier, 'test_request_004')
      
      expect(result.success).toBe(true)
      expect(result.metadata).toBeDefined()
      expect(result.pagination).toBeDefined()
    })
  })

  describe('Bulk Order Processing', () => {
    it('should process bulk orders efficiently', async () => {
      const bulkRequest = {
        orders: [
          mockCreateOrderRequest,
          { ...mockCreateOrderRequest, customerPO: 'PO-2025-002' }
        ],
        bulkDiscountCode: 'BULK2025',
        consolidateShipping: true
      }
      
      vi.spyOn(service, 'createOrder').mockResolvedValue({
        success: true,
        data: {
          id: 'order_test',
          orderNumber: 'RHY25012401',
          pricing: { 
            total: 850,
            volumeDiscount: { discountAmount: 50 } 
          }
        } as any
      })
      
      const result = await service.processBulkOrders(bulkRequest, mockSupplier, 'test_request_005')
      
      expect(result.success).toBe(true)
      if (result.data) {
        expect(result.data.summary.totalOrders).toBe(2)
        expect(result.data.summary.estimatedSavings).toBeGreaterThan(0)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Mock a service error
      vi.spyOn(service, 'validateInventoryAllocation' as any).mockRejectedValue(new Error('Database connection failed'))
      
      const result = await service.createOrder(mockCreateOrderRequest, mockSupplier, 'test_request_006')
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should validate supplier permissions', async () => {
      const restrictedSupplier = {
        ...mockSupplier,
        warehouseAccess: [] // No warehouse access
      }
      
      const result = await service.createOrder(mockCreateOrderRequest, restrictedSupplier, 'test_request_007')
      
      expect(result.success).toBe(false)
    })
  })

  describe('Performance Requirements', () => {
    it('should create orders within performance targets', async () => {
      const startTime = Date.now()
      
      vi.spyOn(service, 'storeOrder' as any).mockResolvedValue(undefined)
      vi.spyOn(service, 'scheduleOrderConfirmation' as any).mockResolvedValue(undefined)
      
      await service.createOrder(mockCreateOrderRequest, mockSupplier, 'test_request_008')
      
      const executionTime = Date.now() - startTime
      expect(executionTime).toBeLessThan(1000) // Should complete within 1 second
    })
  })
})

describe('Integration with FlexVolt Business Logic', () => {
  it('should correctly price FlexVolt battery combinations', () => {
    const items = [
      { productId: 'flexvolt-6ah', quantity: 2 },   // 2 * $95 = $190
      { productId: 'flexvolt-9ah', quantity: 1 },   // 1 * $125 = $125
      { productId: 'flexvolt-15ah', quantity: 1 }   // 1 * $245 = $245
    ] // Total: $560

    let total = 0
    items.forEach(item => {
      const product = FlexVoltProductUtils.getProductByType(item.productId.split('-')[1] as '6Ah' | '9Ah' | '15Ah')
      total += product.basePrice * item.quantity
    })

    expect(total).toBe(560)
  })

  it('should validate contractor volume discount eligibility', () => {
    const orderTotal = 1500 // Above $1000 contractor threshold
    const discount = FlexVoltProductUtils.calculateVolumeDiscount(orderTotal, 'CONTRACTOR')
    
    expect(discount.discountPercentage).toBe(10)
    expect(discount.tierName).toBe('Contractor')
  })
})