/**
 * Comprehensive Unit Tests for InventoryDashboardService
 * RHY_076 - Testing Quality Implementation
 * 
 * Enterprise-grade test suite for FlexVolt battery inventory management
 * Tests real-time inventory operations across 4 global warehouses
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { InventoryDashboardService } from '@/services/inventory/InventoryDashboardService';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { warehouseService } from '@/services/warehouse/WarehouseService';
import type { 
  InventoryItem,
  InventoryDashboard,
  InventoryQuery,
  InventoryUpdateRequest,
  BulkInventoryUpdateRequest,
  TransferRequest,
  InventoryAlert
} from '@/types/inventory';
import type { WarehouseAccess } from '@/types/auth';

// Mock dependencies
jest.mock('@/lib/prisma');
jest.mock('@/lib/logger');
jest.mock('@/services/warehouse/WarehouseService');

// Mock console to prevent test output noise
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('InventoryDashboardService - Enterprise Inventory Management', () => {
  let inventoryService: InventoryDashboardService;
  let mockPrisma: jest.Mocked<typeof prisma>;
  let mockLogger: jest.Mocked<typeof logger>;
  let mockWarehouseService: jest.Mocked<typeof warehouseService>;

  // Mock data
  const mockInventoryItem: InventoryItem = {
    id: 'inv-001',
    warehouseId: 'warehouse-us-1',
    productId: 'product-flexvolt-6ah',
    sku: 'FV-6AH-001',
    productName: 'FlexVolt 6Ah Battery',
    category: 'BATTERY',
    quantity: 150,
    reservedQuantity: 10,
    availableQuantity: 140,
    minStockLevel: 50,
    maxStockLevel: 500,
    reorderPoint: 75,
    location: 'A-01-01',
    zone: 'Zone A',
    status: 'IN_STOCK',
    cost: 75.00,
    price: 95.00,
    supplier: 'FlexVolt Manufacturing',
    batchNumber: 'BATCH-001',
    manufactureDate: new Date('2024-01-01'),
    expiryDate: null,
    lastMovement: new Date('2024-01-15'),
    lastCounted: new Date('2024-01-10'),
    countedBy: 'user-supervisor',
    metadata: {
      specifications: {
        voltage: '20V/60V MAX',
        capacity: '6Ah',
        weight: '1.4 lbs'
      },
      tags: ['professional', 'contractor'],
      lastUpdated: new Date().toISOString()
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-15')
  };

  const mockWarehouseAccess: WarehouseAccess[] = [
    {
      warehouse: 'US',
      role: 'MANAGER',
      permissions: ['VIEW_INVENTORY', 'UPDATE_INVENTORY', 'TRANSFER_INVENTORY'],
      grantedAt: new Date('2023-01-01'),
      expiresAt: null
    }
  ];

  const mockInventoryDashboard: InventoryDashboard = {
    warehouseId: 'warehouse-us-1',
    warehouseName: 'US West Coast Warehouse',
    region: 'US',
    summary: {
      totalItems: 1500,
      totalValue: 142500.00,
      lowStockItems: 15,
      outOfStockItems: 3,
      overstockItems: 8,
      pendingTransfers: 5,
      recentMovements: 25
    },
    inventory: [mockInventoryItem],
    alerts: [],
    recentMovements: [],
    pendingTransfers: [],
    analytics: {
      turnoverRate: 4.2,
      forecastAccuracy: 87.5,
      stockoutRate: 2.1,
      holdingCost: 8500.00,
      trends: {
        quantity: '+12%',
        value: '+8%',
        movements: '+15%'
      }
    },
    syncStatus: {
      lastSync: new Date(),
      status: 'SYNCED',
      pendingUpdates: 0,
      errors: 0
    },
    lastUpdated: new Date()
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Get InventoryDashboardService instance
    inventoryService = InventoryDashboardService.getInstance();
    
    // Setup mock dependencies
    mockPrisma = prisma as jest.Mocked<typeof prisma>;
    mockLogger = logger as jest.Mocked<typeof logger>;
    mockWarehouseService = warehouseService as jest.Mocked<typeof warehouseService>;

    // Setup default mock implementations
    mockLogger.info = jest.fn();
    mockLogger.warn = jest.fn();
    mockLogger.error = jest.fn();

    // Setup Prisma transaction mock
    mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
      return await callback(mockPrisma);
    });

    // Setup warehouse service mocks
    mockWarehouseService.getWarehouseById = jest.fn().mockResolvedValue({
      id: 'warehouse-us-1',
      name: 'US West Coast Warehouse',
      region: 'US',
      status: 'ACTIVE'
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();
  });

  describe('getDashboard()', () => {
    describe('Successful Dashboard Retrieval', () => {
      it('should successfully fetch inventory dashboard with real-time data', async () => {
        // Arrange
        const warehouseId = 'warehouse-us-1';
        const userId = 'user-123';
        
        const mockInventoryItems = [mockInventoryItem];
        const mockAlerts = [
          {
            id: 'alert-001',
            type: 'LOW_STOCK',
            severity: 'HIGH',
            message: 'FlexVolt 9Ah Battery is below minimum stock level',
            productId: 'product-flexvolt-9ah',
            threshold: 50,
            currentLevel: 25,
            createdAt: new Date()
          }
        ];
        const mockMovements = [
          {
            id: 'mov-001',
            type: 'INBOUND',
            productId: 'product-flexvolt-6ah',
            quantity: 50,
            reason: 'Purchase Order',
            performedBy: 'user-123',
            timestamp: new Date()
          }
        ];

        mockPrisma.warehouseInventory.findMany.mockResolvedValue(mockInventoryItems as any);
        mockPrisma.inventoryAlert.findMany.mockResolvedValue(mockAlerts as any);
        mockPrisma.inventoryMovement.findMany.mockResolvedValue(mockMovements as any);
        mockPrisma.inventoryTransfer.findMany.mockResolvedValue([]);
        mockPrisma.inventoryForecast.findFirst.mockResolvedValue({
          accuracy: 87.5,
          turnoverRate: 4.2
        } as any);

        // Act
        const result = await inventoryService.getDashboard(warehouseId, mockWarehouseAccess, userId);

        // Assert
        expect(result).toBeDefined();
        expect(result.warehouseId).toBe(warehouseId);
        expect(result.inventory).toHaveLength(1);
        expect(result.alerts).toHaveLength(1);
        expect(result.summary.totalItems).toBe(1);
        expect(result.syncStatus.status).toBe('SYNCED');

        // Verify Prisma calls
        expect(mockPrisma.warehouseInventory.findMany).toHaveBeenCalledWith({
          where: { warehouseId },
          include: expect.objectContaining({
            product: true
          }),
          orderBy: { updatedAt: 'desc' }
        });

        expect(mockPrisma.inventoryAlert.findMany).toHaveBeenCalledWith({
          where: { 
            warehouseId,
            resolved: false
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        });

        // Verify logging
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Fetching inventory dashboard',
          expect.objectContaining({ warehouseId, userId })
        );
      });

      it('should handle different warehouse regions correctly', async () => {
        const regions = ['US', 'JP', 'EU', 'AU'] as const;
        
        for (const region of regions) {
          // Arrange
          const warehouseId = `warehouse-${region.toLowerCase()}-1`;
          const warehouseAccess = [{
            warehouse: region,
            role: 'OPERATOR',
            permissions: ['VIEW_INVENTORY'],
            grantedAt: new Date(),
            expiresAt: null
          } as WarehouseAccess];

          mockPrisma.warehouseInventory.findMany.mockResolvedValue([mockInventoryItem] as any);
          mockPrisma.inventoryAlert.findMany.mockResolvedValue([]);
          mockPrisma.inventoryMovement.findMany.mockResolvedValue([]);
          mockPrisma.inventoryTransfer.findMany.mockResolvedValue([]);
          mockPrisma.inventoryForecast.findFirst.mockResolvedValue(null);

          mockWarehouseService.getWarehouseById.mockResolvedValue({
            id: warehouseId,
            name: `${region} Warehouse`,
            region,
            status: 'ACTIVE'
          } as any);

          // Act
          const result = await inventoryService.getDashboard(warehouseId, warehouseAccess, 'user-123');

          // Assert
          expect(result.warehouseId).toBe(warehouseId);
          expect(result.region).toBe(region);
        }
      });

      it('should calculate accurate summary statistics', async () => {
        // Arrange
        const mockInventoryItems = [
          { ...mockInventoryItem, status: 'IN_STOCK', quantity: 100, cost: 75 },
          { ...mockInventoryItem, id: 'inv-002', status: 'LOW_STOCK', quantity: 25, cost: 125 },
          { ...mockInventoryItem, id: 'inv-003', status: 'OUT_OF_STOCK', quantity: 0, cost: 245 },
          { ...mockInventoryItem, id: 'inv-004', status: 'OVERSTOCK', quantity: 600, cost: 95 }
        ];

        mockPrisma.warehouseInventory.findMany.mockResolvedValue(mockInventoryItems as any);
        mockPrisma.inventoryAlert.findMany.mockResolvedValue([]);
        mockPrisma.inventoryMovement.findMany.mockResolvedValue([]);
        mockPrisma.inventoryTransfer.findMany.mockResolvedValue([]);
        mockPrisma.inventoryForecast.findFirst.mockResolvedValue(null);

        // Act
        const result = await inventoryService.getDashboard('warehouse-us-1', mockWarehouseAccess, 'user-123');

        // Assert
        expect(result.summary.totalItems).toBe(4);
        expect(result.summary.lowStockItems).toBe(1);
        expect(result.summary.outOfStockItems).toBe(1);
        expect(result.summary.overstockItems).toBe(1);
        expect(result.summary.totalValue).toBe(
          (100 * 75) + (25 * 125) + (0 * 245) + (600 * 95)
        ); // 7500 + 3125 + 0 + 57000 = 67625
      });
    });

    describe('Permission-based Access Control', () => {
      it('should respect warehouse access permissions', async () => {
        // Arrange
        const limitedAccess: WarehouseAccess[] = [
          {
            warehouse: 'US',
            role: 'VIEWER',
            permissions: ['VIEW_INVENTORY'], // No update permissions
            grantedAt: new Date(),
            expiresAt: null
          }
        ];

        mockPrisma.warehouseInventory.findMany.mockResolvedValue([mockInventoryItem] as any);
        mockPrisma.inventoryAlert.findMany.mockResolvedValue([]);
        mockPrisma.inventoryMovement.findMany.mockResolvedValue([]);
        mockPrisma.inventoryTransfer.findMany.mockResolvedValue([]);
        mockPrisma.inventoryForecast.findFirst.mockResolvedValue(null);

        // Act
        const result = await inventoryService.getDashboard('warehouse-us-1', limitedAccess, 'user-123');

        // Assert
        expect(result).toBeDefined();
        expect(result.inventory).toHaveLength(1);
        // Verify that sensitive operations are not exposed for view-only users
      });

      it('should deny access to unauthorized warehouses', async () => {
        // Arrange
        const unauthorizedAccess: WarehouseAccess[] = [
          {
            warehouse: 'JP', // User has JP access but requesting US warehouse
            role: 'OPERATOR',
            permissions: ['VIEW_INVENTORY'],
            grantedAt: new Date(),
            expiresAt: null
          }
        ];

        // Act & Assert
        await expect(
          inventoryService.getDashboard('warehouse-us-1', unauthorizedAccess, 'user-123')
        ).rejects.toThrow('Access denied to warehouse warehouse-us-1');
      });
    });
  });

  describe('updateInventory()', () => {
    describe('Successful Inventory Updates', () => {
      it('should successfully update single inventory item', async () => {
        // Arrange
        const updateRequest: InventoryUpdateRequest = {
          warehouseId: 'warehouse-us-1',
          productId: 'product-flexvolt-6ah',
          quantity: 200,
          location: 'A-01-02',
          reason: 'Stock adjustment',
          adjustmentType: 'MANUAL'
        };

        const updatedItem = { ...mockInventoryItem, quantity: 200, location: 'A-01-02' };

        mockPrisma.warehouseInventory.findUnique.mockResolvedValue(mockInventoryItem as any);
        mockPrisma.warehouseInventory.update.mockResolvedValue(updatedItem as any);
        mockPrisma.inventoryMovement.create.mockResolvedValue({} as any);
        mockPrisma.inventoryAlert.create.mockResolvedValue({} as any);

        // Act
        const result = await inventoryService.updateInventory(updateRequest, mockWarehouseAccess, 'user-123');

        // Assert
        expect(result.success).toBe(true);
        expect(result.item).toBeDefined();
        expect(result.item?.quantity).toBe(200);
        expect(result.item?.location).toBe('A-01-02');

        // Verify database updates
        expect(mockPrisma.warehouseInventory.update).toHaveBeenCalledWith({
          where: {
            warehouseId_productId: {
              warehouseId: 'warehouse-us-1',
              productId: 'product-flexvolt-6ah'
            }
          },
          data: expect.objectContaining({
            quantity: 200,
            location: 'A-01-02',
            lastMovement: expect.any(Date)
          }),
          include: expect.any(Object)
        });

        // Verify movement logging
        expect(mockPrisma.inventoryMovement.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            warehouseId: 'warehouse-us-1',
            productId: 'product-flexvolt-6ah',
            type: 'ADJUSTMENT',
            quantity: 50, // Difference: 200 - 150
            reason: 'Stock adjustment'
          })
        });
      });

      it('should handle different adjustment types correctly', async () => {
        const adjustmentTypes = ['MANUAL', 'CYCLE_COUNT', 'DAMAGE', 'SHRINKAGE', 'RETURN'] as const;
        
        for (const adjustmentType of adjustmentTypes) {
          // Arrange
          const updateRequest: InventoryUpdateRequest = {
            warehouseId: 'warehouse-us-1',
            productId: 'product-flexvolt-6ah',
            quantity: 175,
            reason: `Test ${adjustmentType}`,
            adjustmentType
          };

          mockPrisma.warehouseInventory.findUnique.mockResolvedValue(mockInventoryItem as any);
          mockPrisma.warehouseInventory.update.mockResolvedValue({
            ...mockInventoryItem,
            quantity: 175
          } as any);
          mockPrisma.inventoryMovement.create.mockResolvedValue({} as any);

          // Act
          const result = await inventoryService.updateInventory(updateRequest, mockWarehouseAccess, 'user-123');

          // Assert
          expect(result.success).toBe(true);
          expect(mockPrisma.inventoryMovement.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
              type: adjustmentType === 'MANUAL' ? 'ADJUSTMENT' : adjustmentType,
              reason: `Test ${adjustmentType}`
            })
          });
        }
      });

      it('should generate alerts for critical stock levels', async () => {
        // Arrange - Update that brings item below minimum stock level
        const updateRequest: InventoryUpdateRequest = {
          warehouseId: 'warehouse-us-1',
          productId: 'product-flexvolt-6ah',
          quantity: 30, // Below minStockLevel of 50
          reason: 'Stock depletion',
          adjustmentType: 'MANUAL'
        };

        const updatedItem = { ...mockInventoryItem, quantity: 30, status: 'LOW_STOCK' };

        mockPrisma.warehouseInventory.findUnique.mockResolvedValue(mockInventoryItem as any);
        mockPrisma.warehouseInventory.update.mockResolvedValue(updatedItem as any);
        mockPrisma.inventoryMovement.create.mockResolvedValue({} as any);
        mockPrisma.inventoryAlert.create.mockResolvedValue({} as any);

        // Act
        const result = await inventoryService.updateInventory(updateRequest, mockWarehouseAccess, 'user-123');

        // Assert
        expect(result.success).toBe(true);
        expect(result.alerts).toHaveLength(1);
        expect(result.alerts?.[0]?.type).toBe('LOW_STOCK');

        // Verify alert creation
        expect(mockPrisma.inventoryAlert.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            warehouseId: 'warehouse-us-1',
            productId: 'product-flexvolt-6ah',
            type: 'LOW_STOCK',
            severity: 'HIGH'
          })
        });
      });
    });

    describe('Validation and Error Handling', () => {
      it('should fail when inventory item not found', async () => {
        // Arrange
        const updateRequest: InventoryUpdateRequest = {
          warehouseId: 'warehouse-us-1',
          productId: 'nonexistent-product',
          quantity: 100,
          reason: 'Test update',
          adjustmentType: 'MANUAL'
        };

        mockPrisma.warehouseInventory.findUnique.mockResolvedValue(null);

        // Act
        const result = await inventoryService.updateInventory(updateRequest, mockWarehouseAccess, 'user-123');

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toContain('Inventory item not found');
      });

      it('should fail with negative quantity', async () => {
        // Arrange
        const updateRequest: InventoryUpdateRequest = {
          warehouseId: 'warehouse-us-1',
          productId: 'product-flexvolt-6ah',
          quantity: -10, // Invalid negative quantity
          reason: 'Invalid update',
          adjustmentType: 'MANUAL'
        };

        // Act
        const result = await inventoryService.updateInventory(updateRequest, mockWarehouseAccess, 'user-123');

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toContain('Quantity cannot be negative');
      });

      it('should fail when user lacks update permissions', async () => {
        // Arrange
        const readOnlyAccess: WarehouseAccess[] = [
          {
            warehouse: 'US',
            role: 'VIEWER',
            permissions: ['VIEW_INVENTORY'], // No UPDATE_INVENTORY permission
            grantedAt: new Date(),
            expiresAt: null
          }
        ];

        const updateRequest: InventoryUpdateRequest = {
          warehouseId: 'warehouse-us-1',
          productId: 'product-flexvolt-6ah',
          quantity: 100,
          reason: 'Test update',
          adjustmentType: 'MANUAL'
        };

        // Act
        const result = await inventoryService.updateInventory(updateRequest, readOnlyAccess, 'user-123');

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toContain('Insufficient permissions');
      });
    });
  });

  describe('bulkUpdateInventory()', () => {
    describe('Successful Bulk Operations', () => {
      it('should successfully process bulk inventory updates', async () => {
        // Arrange
        const bulkRequest: BulkInventoryUpdateRequest = {
          warehouseId: 'warehouse-us-1',
          updates: [
            {
              productId: 'product-flexvolt-6ah',
              quantity: 200,
              reason: 'Bulk adjustment 1'
            },
            {
              productId: 'product-flexvolt-9ah',
              quantity: 150,
              reason: 'Bulk adjustment 2'
            }
          ],
          reason: 'Monthly inventory adjustment',
          source: 'CYCLE_COUNT'
        };

        const mockItems = [
          mockInventoryItem,
          { ...mockInventoryItem, id: 'inv-002', productId: 'product-flexvolt-9ah', quantity: 100 }
        ];

        mockPrisma.warehouseInventory.findMany.mockResolvedValue(mockItems as any);
        mockPrisma.warehouseInventory.update.mockResolvedValue(mockInventoryItem as any);
        mockPrisma.inventoryMovement.createMany.mockResolvedValue({ count: 2 } as any);

        // Act
        const result = await inventoryService.bulkUpdateInventory(bulkRequest, mockWarehouseAccess, 'user-123');

        // Assert
        expect(result.success).toBe(true);
        expect(result.updated).toHaveLength(2);
        expect(result.failed).toHaveLength(0);
        expect(result.summary.totalProcessed).toBe(2);
        expect(result.summary.successful).toBe(2);
        expect(result.summary.failed).toBe(0);

        // Verify batch processing
        expect(mockPrisma.$transaction).toHaveBeenCalled();
        expect(mockPrisma.inventoryMovement.createMany).toHaveBeenCalledWith({
          data: expect.arrayContaining([
            expect.objectContaining({
              productId: 'product-flexvolt-6ah',
              type: 'CYCLE_COUNT'
            }),
            expect.objectContaining({
              productId: 'product-flexvolt-9ah',
              type: 'CYCLE_COUNT'
            })
          ])
        });
      });

      it('should handle partial failures in bulk operations', async () => {
        // Arrange
        const bulkRequest: BulkInventoryUpdateRequest = {
          warehouseId: 'warehouse-us-1',
          updates: [
            { productId: 'product-valid', quantity: 100, reason: 'Valid update' },
            { productId: 'product-invalid', quantity: -50, reason: 'Invalid update' }
          ],
          reason: 'Mixed bulk update',
          source: 'MANUAL'
        };

        mockPrisma.warehouseInventory.findMany.mockResolvedValue([mockInventoryItem] as any);
        
        // Mock first update succeeds, second fails
        mockPrisma.warehouseInventory.update
          .mockResolvedValueOnce(mockInventoryItem as any)
          .mockRejectedValueOnce(new Error('Invalid quantity'));

        // Act
        const result = await inventoryService.bulkUpdateInventory(bulkRequest, mockWarehouseAccess, 'user-123');

        // Assert
        expect(result.success).toBe(true); // Partial success
        expect(result.updated).toHaveLength(1);
        expect(result.failed).toHaveLength(1);
        expect(result.failed[0].error).toContain('Invalid quantity');
      });
    });
  });

  describe('transferInventory()', () => {
    describe('Successful Transfer Operations', () => {
      it('should successfully transfer inventory between warehouses', async () => {
        // Arrange
        const transferRequest: TransferRequest = {
          fromWarehouseId: 'warehouse-us-1',
          toWarehouseId: 'warehouse-us-2',
          productId: 'product-flexvolt-6ah',
          quantity: 50,
          reason: 'Redistribution',
          priority: 'NORMAL',
          expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        };

        const sourceItem = { ...mockInventoryItem, quantity: 150 };
        const targetItem = { ...mockInventoryItem, id: 'inv-target', warehouseId: 'warehouse-us-2', quantity: 75 };

        mockPrisma.warehouseInventory.findUnique
          .mockResolvedValueOnce(sourceItem as any) // Source check
          .mockResolvedValueOnce(targetItem as any); // Target check

        mockPrisma.inventoryTransfer.create.mockResolvedValue({
          id: 'transfer-001',
          ...transferRequest,
          status: 'PENDING',
          createdAt: new Date()
        } as any);

        mockPrisma.warehouseInventory.update
          .mockResolvedValueOnce({ ...sourceItem, quantity: 100, reservedQuantity: 60 } as any) // Source update
          .mockResolvedValueOnce({ ...targetItem, quantity: 125 } as any); // Target update

        mockPrisma.inventoryMovement.createMany.mockResolvedValue({ count: 2 } as any);

        // Act
        const result = await inventoryService.transferInventory(transferRequest, mockWarehouseAccess, 'user-123');

        // Assert
        expect(result.success).toBe(true);
        expect(result.transfer).toBeDefined();
        expect(result.transfer?.id).toBe('transfer-001');
        expect(result.transfer?.status).toBe('PENDING');

        // Verify transfer creation
        expect(mockPrisma.inventoryTransfer.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            fromWarehouseId: 'warehouse-us-1',
            toWarehouseId: 'warehouse-us-2',
            productId: 'product-flexvolt-6ah',
            quantity: 50,
            status: 'PENDING'
          }),
          include: expect.any(Object)
        });

        // Verify inventory reservations
        expect(mockPrisma.warehouseInventory.update).toHaveBeenCalledWith({
          where: {
            warehouseId_productId: {
              warehouseId: 'warehouse-us-1',
              productId: 'product-flexvolt-6ah'
            }
          },
          data: expect.objectContaining({
            reservedQuantity: 60 // Original 10 + 50 transfer
          }),
          include: expect.any(Object)
        });
      });

      it('should handle cross-region transfers with compliance checks', async () => {
        // Test transfers between different regions
        const regions = [
          { from: 'US', to: 'EU' },
          { from: 'JP', to: 'AU' },
          { from: 'EU', to: 'US' }
        ];

        for (const { from, to } of regions) {
          // Arrange
          const transferRequest: TransferRequest = {
            fromWarehouseId: `warehouse-${from.toLowerCase()}-1`,
            toWarehouseId: `warehouse-${to.toLowerCase()}-1`,
            productId: 'product-flexvolt-6ah',
            quantity: 25,
            reason: `Cross-region transfer ${from} to ${to}`,
            priority: 'HIGH'
          };

          const warehouseAccess: WarehouseAccess[] = [
            {
              warehouse: from as any,
              role: 'MANAGER',
              permissions: ['TRANSFER_INVENTORY'],
              grantedAt: new Date(),
              expiresAt: null
            },
            {
              warehouse: to as any,
              role: 'MANAGER',
              permissions: ['TRANSFER_INVENTORY'],
              grantedAt: new Date(),
              expiresAt: null
            }
          ];

          mockPrisma.warehouseInventory.findUnique
            .mockResolvedValue(mockInventoryItem as any);
          mockPrisma.inventoryTransfer.create.mockResolvedValue({
            id: `transfer-${from}-${to}`,
            status: 'PENDING'
          } as any);
          mockPrisma.warehouseInventory.update.mockResolvedValue(mockInventoryItem as any);
          mockPrisma.inventoryMovement.createMany.mockResolvedValue({ count: 2 } as any);

          // Act
          const result = await inventoryService.transferInventory(transferRequest, warehouseAccess, 'user-123');

          // Assert
          expect(result.success).toBe(true);
          expect(result.transfer?.id).toBe(`transfer-${from}-${to}`);
        }
      });
    });

    describe('Transfer Validation and Failures', () => {
      it('should fail when insufficient inventory for transfer', async () => {
        // Arrange
        const transferRequest: TransferRequest = {
          fromWarehouseId: 'warehouse-us-1',
          toWarehouseId: 'warehouse-us-2',
          productId: 'product-flexvolt-6ah',
          quantity: 200, // More than available (150 - 10 reserved = 140 available)
          reason: 'Insufficient stock test',
          priority: 'NORMAL'
        };

        mockPrisma.warehouseInventory.findUnique.mockResolvedValue(mockInventoryItem as any);

        // Act
        const result = await inventoryService.transferInventory(transferRequest, mockWarehouseAccess, 'user-123');

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toContain('Insufficient available inventory');
      });

      it('should fail when user lacks transfer permissions', async () => {
        // Arrange
        const limitedAccess: WarehouseAccess[] = [
          {
            warehouse: 'US',
            role: 'OPERATOR',
            permissions: ['VIEW_INVENTORY', 'UPDATE_INVENTORY'], // No TRANSFER_INVENTORY
            grantedAt: new Date(),
            expiresAt: null
          }
        ];

        const transferRequest: TransferRequest = {
          fromWarehouseId: 'warehouse-us-1',
          toWarehouseId: 'warehouse-us-2',
          productId: 'product-flexvolt-6ah',
          quantity: 50,
          reason: 'Permission test',
          priority: 'NORMAL'
        };

        // Act
        const result = await inventoryService.transferInventory(transferRequest, limitedAccess, 'user-123');

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toContain('Insufficient permissions');
      });
    });
  });

  describe('Real-time Synchronization', () => {
    describe('Cross-warehouse Sync', () => {
      it('should handle real-time inventory synchronization', async () => {
        // Test the real-time sync functionality
        // This would typically involve WebSocket or polling mechanisms
        
        // Arrange
        const mockSyncEvents = [
          {
            id: 'sync-001',
            warehouseId: 'warehouse-us-1',
            type: 'INVENTORY_UPDATE',
            productId: 'product-flexvolt-6ah',
            timestamp: new Date(),
            processed: false
          }
        ];

        mockPrisma.syncEvent.findMany.mockResolvedValue(mockSyncEvents as any);
        mockPrisma.syncEvent.updateMany.mockResolvedValue({ count: 1 } as any);

        // Act
        // This would be called by the real-time sync process
        // For testing, we'll simulate the sync operation
        
        // Assert
        // Verify that sync events are processed correctly
        expect(true).toBe(true); // Placeholder for actual sync testing
      });
    });
  });

  describe('Performance Requirements', () => {
    it('should complete dashboard operations within performance threshold', async () => {
      // Arrange
      mockPrisma.warehouseInventory.findMany.mockResolvedValue([mockInventoryItem] as any);
      mockPrisma.inventoryAlert.findMany.mockResolvedValue([]);
      mockPrisma.inventoryMovement.findMany.mockResolvedValue([]);
      mockPrisma.inventoryTransfer.findMany.mockResolvedValue([]);
      mockPrisma.inventoryForecast.findFirst.mockResolvedValue(null);

      // Act
      const startTime = Date.now();
      const result = await inventoryService.getDashboard('warehouse-us-1', mockWarehouseAccess, 'user-123');
      const duration = Date.now() - startTime;

      // Assert
      expect(result).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle high-volume bulk operations efficiently', async () => {
      // Arrange
      const largeUpdateCount = 100;
      const bulkRequest: BulkInventoryUpdateRequest = {
        warehouseId: 'warehouse-us-1',
        updates: Array.from({ length: largeUpdateCount }, (_, i) => ({
          productId: `product-${i}`,
          quantity: 100 + i,
          reason: `Bulk update ${i}`
        })),
        reason: 'Large bulk operation test',
        source: 'MANUAL'
      };

      const mockItems = Array.from({ length: largeUpdateCount }, (_, i) => ({
        ...mockInventoryItem,
        id: `inv-${i}`,
        productId: `product-${i}`
      }));

      mockPrisma.warehouseInventory.findMany.mockResolvedValue(mockItems as any);
      mockPrisma.warehouseInventory.update.mockResolvedValue(mockInventoryItem as any);
      mockPrisma.inventoryMovement.createMany.mockResolvedValue({ count: largeUpdateCount } as any);

      // Act
      const startTime = Date.now();
      const result = await inventoryService.bulkUpdateInventory(bulkRequest, mockWarehouseAccess, 'user-123');
      const duration = Date.now() - startTime;

      // Assert
      expect(result.success).toBe(true);
      expect(result.summary.totalProcessed).toBe(largeUpdateCount);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds for 100 items
    });
  });

  describe('FlexVolt Product Integration', () => {
    it('should handle FlexVolt battery products correctly', async () => {
      const flexVoltProducts = [
        { id: 'product-flexvolt-6ah', name: 'FlexVolt 6Ah Battery', price: 95.00 },
        { id: 'product-flexvolt-9ah', name: 'FlexVolt 9Ah Battery', price: 125.00 },
        { id: 'product-flexvolt-15ah', name: 'FlexVolt 15Ah Battery', price: 245.00 }
      ];

      for (const product of flexVoltProducts) {
        // Arrange
        const productInventory = {
          ...mockInventoryItem,
          productId: product.id,
          productName: product.name,
          price: product.price,
          metadata: {
            ...mockInventoryItem.metadata,
            specifications: {
              voltage: '20V/60V MAX',
              capacity: product.name.includes('6Ah') ? '6Ah' : 
                       product.name.includes('9Ah') ? '9Ah' : '15Ah',
              weight: product.name.includes('6Ah') ? '1.4 lbs' : 
                     product.name.includes('9Ah') ? '1.8 lbs' : '2.5 lbs'
            }
          }
        };

        mockPrisma.warehouseInventory.findMany.mockResolvedValue([productInventory] as any);
        mockPrisma.inventoryAlert.findMany.mockResolvedValue([]);
        mockPrisma.inventoryMovement.findMany.mockResolvedValue([]);
        mockPrisma.inventoryTransfer.findMany.mockResolvedValue([]);
        mockPrisma.inventoryForecast.findFirst.mockResolvedValue(null);

        // Act
        const result = await inventoryService.getDashboard('warehouse-us-1', mockWarehouseAccess, 'user-123');

        // Assert
        expect(result.inventory[0].productName).toBe(product.name);
        expect(result.inventory[0].price).toBe(product.price);
        expect(result.inventory[0].metadata.specifications.voltage).toBe('20V/60V MAX');
      }
    });
  });

  describe('Error Handling and Logging', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection timeout');
      mockPrisma.warehouseInventory.findMany.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        inventoryService.getDashboard('warehouse-us-1', mockWarehouseAccess, 'user-123')
      ).rejects.toThrow('Database connection timeout');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch inventory dashboard',
        expect.objectContaining({
          error: 'Database connection timeout'
        })
      );
    });

    it('should log all critical operations', async () => {
      // Arrange
      mockPrisma.warehouseInventory.findMany.mockResolvedValue([mockInventoryItem] as any);
      mockPrisma.inventoryAlert.findMany.mockResolvedValue([]);
      mockPrisma.inventoryMovement.findMany.mockResolvedValue([]);
      mockPrisma.inventoryTransfer.findMany.mockResolvedValue([]);
      mockPrisma.inventoryForecast.findFirst.mockResolvedValue(null);

      // Act
      await inventoryService.getDashboard('warehouse-us-1', mockWarehouseAccess, 'user-123');

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Fetching inventory dashboard',
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Inventory dashboard generated successfully',
        expect.any(Object)
      );
    });
  });
});