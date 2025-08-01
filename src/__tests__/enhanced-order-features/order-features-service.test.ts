/**
 * RHY Supplier Portal - Enhanced Order Features Service Tests
 * Comprehensive test suite for enterprise-grade order management features
 * Tests Batch 1 authentication integration and FlexVolt battery operations
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { enhancedOrderFeaturesService } from '@/services/orders/EnhancedOrderFeaturesService'
import { rhyPrisma } from '@/lib/rhy-database'
import { SupplierAuthData, SecurityContext } from '@/types/auth'
import { 
  CreateOrderTemplateRequest,
  CreateOrderCustomizationRequest,
  OrderTemplate,
  OrderTemplateItem,
  OrderCustomization,
  UrgencyLevel,
  ConsolidationPreference,
  ShippingMethod
} from '@/types/order_features'
import { ComplianceRegion } from '@/types/warehouse'

// Mock the database
jest.mock('@/lib/rhy-database', () => ({
  rhyPrisma: {
    orderTemplate: {
      create: jest.fn() as jest.MockedFunction<any>,
      findMany: jest.fn() as jest.MockedFunction<any>,
      findUnique: jest.fn() as jest.MockedFunction<any>,
      findFirst: jest.fn() as jest.MockedFunction<any>
    },
    orderCustomization: {
      create: jest.fn() as jest.MockedFunction<any>
    },
    order: {
      findFirst: jest.fn() as jest.MockedFunction<any>
    },
    inventoryItem: {
      findFirst: jest.fn() as jest.MockedFunction<any>
    }
  }
}))

// Mock security functions
jest.mock('@/lib/security', () => ({
  logAuthEvent: jest.fn() as jest.MockedFunction<any>
}))

describe('Enhanced Order Features Service', () => {
  let mockSupplier: SupplierAuthData
  let mockSecurityContext: SecurityContext

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSupplier = {
      id: 'supplier-123',
      email: 'contractor@flexvolt.com',
      companyName: 'FlexVolt Contractors LLC',
      contactName: 'John Smith',
      phoneNumber: '+1-555-0123',
      status: 'ACTIVE',
      tier: 'PREMIUM',
      warehouseAccess: [
        {
          warehouse: 'US' as const,
          role: 'OPERATOR' as const,
          permissions: ['CREATE_ORDERS', 'VIEW_ORDERS', 'VIEW_INVENTORY', 'VIEW_PRICING'],
          grantedAt: new Date('2024-01-01'),
          expiresAt: new Date('2025-01-01')
        }
      ],
      mfaEnabled: true,
      lastLoginAt: new Date(),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    }

    mockSecurityContext = {
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: new Date(),
      deviceFingerprint: 'test-device-fingerprint'
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Order Template Management', () => {
    test('should create FlexVolt battery order template successfully', async () => {
      const templateData: Omit<OrderTemplate, 'id' | 'supplierId' | 'createdAt' | 'updatedAt'> = {
        name: 'FlexVolt 6Ah Standard Kit',
        description: 'Standard contractor kit with 6Ah batteries',
        warehouseId: 'US',
        isDefault: false,
        items: [
          {
            productId: 'flexvolt-6ah-001',
            sku: 'FV-6AH-001',
            name: 'FlexVolt 6Ah Battery',
            description: '20V/60V MAX FlexVolt 6Ah Battery',
            quantity: 2,
            unitPrice: 95.00,
            notes: 'Standard contractor battery',
            isOptional: false,
            category: 'Battery'
          },
          {
            productId: 'charger-fast-001',
            sku: 'CH-FAST-001',
            name: 'Fast Charger',
            description: 'FlexVolt Fast Charger',
            quantity: 1,
            unitPrice: 149.00,
            notes: 'Rapid charging capability',
            isOptional: false,
            category: 'Charger'
          }
        ],
        settings: {
          autoSchedule: true,
          scheduleInterval: 'MONTHLY',
          nextScheduledDate: new Date('2024-07-01'),
          notifications: true,
          approvalRequired: false,
          maxBudget: 500,
          costCenter: 'TOOLS-001'
        },
        tags: ['contractor', 'standard', 'flexvolt'],
        isActive: true
      }

      const mockCreatedTemplate = {
        id: 'template-123',
        supplierId: mockSupplier.id,
        ...templateData,
        items: templateData.items.map((item: any, index: number) => ({
          id: `item-${index + 1}`,
          templateId: 'template-123',
          ...item
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      ;(rhyPrisma.orderTemplate.create as jest.Mock).mockResolvedValue(mockCreatedTemplate)

      const result = await enhancedOrderFeaturesService.createOrderTemplate(
        mockSupplier,
        templateData,
        mockSecurityContext
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.name).toBe('FlexVolt 6Ah Standard Kit')
      expect(result.data!.items).toHaveLength(2)
      expect(result.data!.items[0].sku).toBe('FV-6AH-001')
      expect(rhyPrisma.orderTemplate.create).toHaveBeenCalledTimes(1)
    })

    test('should reject template creation without warehouse access', async () => {
      const supplierWithoutAccess = {
        ...mockSupplier,
        warehouseAccess: [
          {
            warehouse: 'EU' as const,
            role: 'VIEWER' as const,
            permissions: ['VIEW_ORDERS'],
            grantedAt: new Date('2024-01-01'),
            expiresAt: new Date('2025-01-01')
          }
        ]
      }

      const templateData: Omit<OrderTemplate, 'id' | 'supplierId' | 'createdAt' | 'updatedAt'> = {
        name: 'Test Template',
        warehouseId: 'US',
        items: [],
        settings: {
          autoSchedule: false,
          notifications: false,
          approvalRequired: false
        },
        isActive: true
      }

      const result = await enhancedOrderFeaturesService.createOrderTemplate(
        supplierWithoutAccess,
        templateData,
        mockSecurityContext
      )

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('WAREHOUSE_ACCESS_DENIED')
    })

    test('should retrieve templates with warehouse filtering', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          supplierId: mockSupplier.id,
          name: 'FlexVolt Pro Kit',
          warehouseId: 'US',
          items: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'template-2',
          supplierId: mockSupplier.id,
          name: 'FlexVolt Basic Kit',
          warehouseId: 'US',
          items: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      ;(rhyPrisma.orderTemplate.findMany as jest.Mock).mockResolvedValue(mockTemplates)

      const result = await enhancedOrderFeaturesService.getOrderTemplates(
        mockSupplier,
        'US',
        mockSecurityContext
      )

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data![0].name).toBe('FlexVolt Pro Kit')
    })
  })

  describe('Order Customization', () => {
    test('should create order customization with regional compliance', async () => {
      const orderId = 'order-123'
      const customizationData: Omit<CreateOrderCustomizationRequest, 'orderId'> = {
        customizations: {
          deliveryInstructions: 'Deliver to construction site office',
          packagingRequirements: 'Protective packaging for outdoor storage',
          labelingRequirements: 'Include project code on all labels',
          qualityRequirements: 'Pre-deployment testing required',
          urgencyLevel: 'EXPRESS' as UrgencyLevel,
          consolidationPreference: 'CONSOLIDATED' as ConsolidationPreference,
          shippingMethod: 'EXPRESS' as ShippingMethod,
          specialHandling: ['fragile', 'temperature_sensitive'],
          temperatureRequirements: {
            min: 0,
            max: 40,
            unit: 'C' as const
          },
          insuranceRequired: true,
          insuranceValue: 1500
        },
        regionalCompliance: {
          region: 'US' as ComplianceRegion,
          certifications: ['UL', 'FCC', 'OSHA'],
          customsDocuments: ['commercial_invoice', 'packing_list'],
          hazmatRequirements: 'UN3480 lithium battery packaging',
          importLicense: 'LIC-US-2024-001',
          originCertificate: true,
          inspectionRequired: false
        },
        deliveryWindow: {
          startDate: new Date('2024-07-15'),
          endDate: new Date('2024-07-17'),
          preferredTime: '08:00-12:00',
          businessHoursOnly: true
        }
      }

      const mockOrder = {
        id: orderId,
        supplierId: mockSupplier.id,
        orderNumber: 'ORD-2024-001',
        status: 'PENDING'
      }

      const mockCustomization = {
        id: 'customization-123',
        orderId,
        supplierId: mockSupplier.id,
        ...customizationData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      ;(rhyPrisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder)
      ;(rhyPrisma.orderCustomization.create as jest.Mock).mockResolvedValue(mockCustomization)

      const result = await enhancedOrderFeaturesService.createOrderCustomization(
        mockSupplier,
        orderId,
        customizationData,
        mockSecurityContext
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.customizations.urgencyLevel).toBe('EXPRESS')
      expect(result.data!.regionalCompliance.region).toBe('US')
      expect(result.data!.regionalCompliance.certifications).toContain('UL')
    })

    test('should reject customization for non-existent order', async () => {
      const orderId = 'non-existent-order'
      const customizationData: Omit<CreateOrderCustomizationRequest, 'orderId'> = {
        customizations: {
          urgencyLevel: 'STANDARD' as UrgencyLevel,
          consolidationPreference: 'INDIVIDUAL' as ConsolidationPreference,
          shippingMethod: 'STANDARD' as ShippingMethod
        },
        regionalCompliance: {
          region: 'US' as ComplianceRegion,
          certifications: [],
          customsDocuments: []
        }
      }

      ;(rhyPrisma.order.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await enhancedOrderFeaturesService.createOrderCustomization(
        mockSupplier,
        orderId,
        customizationData,
        mockSecurityContext
      )

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('ORDER_NOT_FOUND')
    })
  })

  describe('Order Pricing Calculations', () => {
    test('should calculate FlexVolt pricing with volume discounts', async () => {
      const items = [
        {
          productId: 'flexvolt-6ah-001',
          quantity: 4,
          unitPrice: 95.00
        },
        {
          productId: 'flexvolt-9ah-001',
          quantity: 2,
          unitPrice: 125.00
        },
        {
          productId: 'charger-fast-001',
          quantity: 1,
          unitPrice: 149.00
        }
      ]

      const warehouseId = 'US'
      const expectedSubtotal = (4 * 95) + (2 * 125) + (1 * 149) // $879
      
      const result = await enhancedOrderFeaturesService.calculateOrderPricing(
        mockSupplier,
        items,
        warehouseId
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.subtotal).toBe(expectedSubtotal)
      expect(result.data!.discountPercentage).toBe(0) // Below $1000 threshold
      expect(result.data!.discountTier).toBe('Standard')
      expect(result.data!.finalTotal).toBeGreaterThan(expectedSubtotal) // Including tax
    })

    test('should apply contractor discount for orders over $1000', async () => {
      const items = [
        {
          productId: 'flexvolt-15ah-001',
          quantity: 5,
          unitPrice: 245.00
        }
      ]

      const warehouseId = 'US'
      const expectedSubtotal = 5 * 245 // $1,225
      
      const result = await enhancedOrderFeaturesService.calculateOrderPricing(
        mockSupplier,
        items,
        warehouseId
      )

      expect(result.success).toBe(true)
      expect(result.data!.subtotal).toBe(expectedSubtotal)
      expect(result.data!.discountPercentage).toBe(10) // PREMIUM tier gets contractor discount
      expect(result.data!.discountTier).toBe('Contractor')
      expect(result.data!.discountAmount).toBe(122.5) // 10% of $1,225
    })

    test('should calculate regional tax correctly', async () => {
      const items = [
        {
          productId: 'flexvolt-6ah-001',
          quantity: 1,
          unitPrice: 95.00
        }
      ]

      const result = await enhancedOrderFeaturesService.calculateOrderPricing(
        mockSupplier,
        items,
        'US'
      )

      expect(result.success).toBe(true)
      expect(result.data!.regionalTax).toBeGreaterThan(0)
      expect(result.data!.finalTotal).toBeGreaterThan(result.data!.total)
    })
  })

  describe('Inventory Availability Validation', () => {
    test('should validate FlexVolt battery availability', async () => {
      const items = [
        {
          productId: 'flexvolt-6ah-001',
          quantity: 2
        },
        {
          productId: 'flexvolt-9ah-001',
          quantity: 1
        }
      ]

      const mockInventoryItems = [
        {
          productId: 'flexvolt-6ah-001',
          warehouseId: 'US',
          availableQuantity: 50,
          nextRestockDate: null
        },
        {
          productId: 'flexvolt-9ah-001',
          warehouseId: 'US',
          availableQuantity: 25,
          nextRestockDate: null
        }
      ]

      ;(rhyPrisma.inventoryItem.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockInventoryItems[0])
        .mockResolvedValueOnce(mockInventoryItems[1])

      const result = await enhancedOrderFeaturesService.validateOrderAvailability(
        mockSupplier,
        items,
        'US',
        mockSecurityContext
      )

      expect(result.success).toBe(true)
      expect(result.data!.isValid).toBe(true)
      expect(result.data!.availabilityDetails).toHaveLength(2)
      expect(result.data!.availabilityDetails[0].isAvailable).toBe(true)
      expect(result.data!.availabilityDetails[1].isAvailable).toBe(true)
    })

    test('should detect insufficient inventory', async () => {
      const items = [
        {
          productId: 'flexvolt-15ah-001',
          quantity: 10
        }
      ]

      const mockInventoryItem = {
        productId: 'flexvolt-15ah-001',
        warehouseId: 'US',
        availableQuantity: 5,
        nextRestockDate: new Date('2024-07-30')
      }

      ;(rhyPrisma.inventoryItem.findFirst as jest.Mock).mockResolvedValue(mockInventoryItem)

      const result = await enhancedOrderFeaturesService.validateOrderAvailability(
        mockSupplier,
        items,
        'US',
        mockSecurityContext
      )

      expect(result.success).toBe(true)
      expect(result.data!.isValid).toBe(false)
      expect(result.data!.availabilityDetails[0].isAvailable).toBe(false)
      expect(result.data!.availabilityDetails[0].requested).toBe(10)
      expect(result.data!.availabilityDetails[0].available).toBe(5)
      expect(result.data!.availabilityDetails[0].estimatedRestockDate).toBeDefined()
    })

    test('should reject availability check without warehouse access', async () => {
      const supplierWithoutInventoryAccess = {
        ...mockSupplier,
        warehouseAccess: [
          {
            warehouse: 'US' as const,
            role: 'VIEWER' as const,
            permissions: ['VIEW_ORDERS'], // Missing VIEW_INVENTORY
            grantedAt: new Date('2024-01-01'),
            expiresAt: new Date('2025-01-01')
          }
        ]
      }

      const items = [
        {
          productId: 'flexvolt-6ah-001',
          quantity: 1
        }
      ]

      const result = await enhancedOrderFeaturesService.validateOrderAvailability(
        supplierWithoutInventoryAccess,
        items,
        'US',
        mockSecurityContext
      )

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('WAREHOUSE_ACCESS_DENIED')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle database connection errors gracefully', async () => {
      const templateData: Omit<OrderTemplate, 'id' | 'supplierId' | 'createdAt' | 'updatedAt'> = {
        name: 'Test Template',
        warehouseId: 'US',
        items: [],
        settings: {
          autoSchedule: false,
          notifications: false,
          approvalRequired: false
        },
        isActive: true
      }

      ;(rhyPrisma.orderTemplate.create as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const result = await enhancedOrderFeaturesService.createOrderTemplate(
        mockSupplier,
        templateData,
        mockSecurityContext
      )

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('TEMPLATE_CREATION_FAILED')
      expect(result.error?.message).toBe('Failed to create order template')
    })

    test('should handle empty item arrays in pricing calculation', async () => {
      const result = await enhancedOrderFeaturesService.calculateOrderPricing(
        mockSupplier,
        [],
        'US'
      )

      expect(result.success).toBe(true)
      expect(result.data!.subtotal).toBe(0)
      expect(result.data!.total).toBe(0)
      expect(result.data!.finalTotal).toBeGreaterThanOrEqual(0) // Tax might still apply
    })

    test('should validate supplier tier discount eligibility', async () => {
      const standardTierSupplier = {
        ...mockSupplier,
        tier: 'STANDARD' as const
      }

      const items = [
        {
          productId: 'flexvolt-15ah-001',
          quantity: 20,
          unitPrice: 245.00
        }
      ]

      const result = await enhancedOrderFeaturesService.calculateOrderPricing(
        standardTierSupplier,
        items,
        'US'
      )

      expect(result.success).toBe(true)
      // STANDARD tier should get limited discount options
      expect(result.data!.discountPercentage).toBeLessThanOrEqual(15)
    })
  })

  describe('Performance and Scalability', () => {
    test('should handle large template item arrays efficiently', async () => {
      const largeItemArray = Array.from({ length: 50 }, (_, index) => ({
        productId: `product-${index + 1}`,
        sku: `SKU-${index + 1}`,
        name: `FlexVolt Battery ${index + 1}`,
        description: `Test battery product ${index + 1}`,
        quantity: Math.floor(Math.random() * 10) + 1,
        unitPrice: 95 + (index * 5),
        notes: `Test item ${index + 1}`,
        isOptional: index % 5 === 0,
        category: 'Battery'
      }))

      const templateData: Omit<OrderTemplate, 'id' | 'supplierId' | 'createdAt' | 'updatedAt'> = {
        name: 'Large Template Test',
        warehouseId: 'US',
        items: largeItemArray,
        settings: {
          autoSchedule: false,
          notifications: false,
          approvalRequired: false
        },
        isActive: true
      }

      const mockCreatedTemplate = {
        id: 'large-template-123',
        supplierId: mockSupplier.id,
        ...templateData,
        items: largeItemArray.map((item, index) => ({
          id: `item-${index + 1}`,
          templateId: 'large-template-123',
          ...item
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      ;(rhyPrisma.orderTemplate.create as jest.Mock).mockResolvedValue(mockCreatedTemplate)

      const startTime = Date.now()
      const result = await enhancedOrderFeaturesService.createOrderTemplate(
        mockSupplier,
        templateData,
        mockSecurityContext
      )
      const executionTime = Date.now() - startTime

      expect(result.success).toBe(true)
      expect(result.data!.items).toHaveLength(50)
      expect(executionTime).toBeLessThan(1000) // Should complete within 1 second
    })

    test('should provide processing time metadata', async () => {
      const items = [
        {
          productId: 'flexvolt-6ah-001',
          quantity: 1,
          unitPrice: 95.00
        }
      ]

      const result = await enhancedOrderFeaturesService.calculateOrderPricing(
        mockSupplier,
        items,
        'US'
      )

      expect(result.success).toBe(true)
      expect(result.metadata).toBeDefined()
      expect(result.metadata!.processingTime).toBeGreaterThanOrEqual(0)
      expect(result.metadata!.timestamp).toBeDefined()
      expect(result.metadata!.requestId).toBeDefined()
    })
  })
})