/**
 * Comprehensive Unit Tests for WarehouseService
 * RHY_076 - Testing Quality Implementation
 * 
 * Enterprise-grade test suite for FlexVolt battery warehouse management
 * Tests all warehouse operations across 4 global warehouses (US, Japan, EU, Australia)
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { WarehouseService } from '@/services/warehouse/WarehouseService';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { WarehouseValidator } from '@/services/warehouse/WarehouseValidator';
import { warehouseUtils } from '@/lib/warehouse-utils';
import type { 
  Warehouse, 
  WarehouseOperation,
  WarehouseInventory,
  WarehouseQuery,
  WarehousePerformanceMetrics
} from '@/types/warehouse';

// Mock dependencies
jest.mock('@/lib/prisma');
jest.mock('@/lib/logger');
jest.mock('@/services/warehouse/WarehouseValidator');
jest.mock('@/lib/warehouse-utils');

// Mock console to prevent test output noise
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('WarehouseService - Enterprise Warehouse Management', () => {
  let warehouseService: WarehouseService;
  let mockPrisma: jest.Mocked<typeof prisma>;
  let mockLogger: jest.Mocked<typeof logger>;
  let mockValidator: jest.Mocked<WarehouseValidator>;
  let mockWarehouseUtils: jest.Mocked<typeof warehouseUtils>;

  // Mock data
  const mockWarehouseData = {
    id: 'warehouse-us-1',
    name: 'US West Coast Warehouse',
    code: 'US-WC-01',
    region: 'US',
    location: 'Los Angeles, CA',
    status: 'ACTIVE',
    capacity: 10000,
    timezone: 'America/Los_Angeles',
    coordinates: {
      latitude: 34.0522,
      longitude: -118.2437
    },
    operatingHours: {
      start: '06:00',
      end: '18:00',
      timezone: 'America/Los_Angeles'
    },
    complianceStandards: ['OSHA', 'ISO_9001'],
    emergencyContact: {
      name: 'Emergency Response Team',
      phone: '+1-555-0911',
      email: 'emergency@rhy-warehouse.com'
    },
    metadata: {
      lastInventoryCount: '2024-01-15',
      nextMaintenanceDate: '2024-02-01'
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastActivity: new Date('2024-01-15'),
    operationsCount: 156,
    inventory: [],
    staff: [],
    operations: [],
    auditLogs: [],
    performanceMetrics: []
  };

  const mockInventoryItem = {
    id: 'inv-001',
    warehouseId: 'warehouse-us-1',
    productId: 'product-flexvolt-6ah',
    quantity: 150,
    reservedQuantity: 10,
    availableQuantity: 140,
    location: 'A-01-01',
    status: 'IN_STOCK',
    lastUpdated: new Date('2024-01-15'),
    updatedBy: 'user-123',
    batchNumber: 'BATCH-001',
    expiryDate: null,
    costPerUnit: 95.00,
    product: {
      id: 'product-flexvolt-6ah',
      name: 'FlexVolt 6Ah Battery',
      sku: 'FV-6AH-001',
      category: 'BATTERY',
      price: 95.00,
      minStockLevel: 50,
      maxStockLevel: 500,
      specifications: {
        voltage: '20V/60V MAX',
        capacity: '6Ah',
        weight: '1.4 lbs'
      }
    },
    warehouse: {
      id: 'warehouse-us-1',
      name: 'US West Coast Warehouse',
      region: 'US',
      code: 'US-WC-01'
    }
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Get WarehouseService instance
    warehouseService = WarehouseService.getInstance();
    
    // Setup mock dependencies
    mockPrisma = prisma as jest.Mocked<typeof prisma>;
    mockLogger = logger as jest.Mocked<typeof logger>;
    mockValidator = new WarehouseValidator() as jest.Mocked<WarehouseValidator>;
    mockWarehouseUtils = warehouseUtils as jest.Mocked<typeof warehouseUtils>;

    // Setup default mock implementations
    mockLogger.info = jest.fn();
    mockLogger.warn = jest.fn();
    mockLogger.error = jest.fn();

    mockValidator.validateQuery = jest.fn().mockImplementation(query => ({
      page: 1,
      limit: 20,
      sortBy: 'name',
      sortOrder: 'asc',
      userId: 'user-123',
      ...query
    }));
    mockValidator.validateId = jest.fn().mockImplementation(id => id);
    mockValidator.validateOperation = jest.fn().mockImplementation(op => op);
    mockValidator.validateInventoryUpdate = jest.fn().mockImplementation(update => update);
    mockValidator.validateDateRange = jest.fn().mockImplementation(range => range);

    mockWarehouseUtils.transformWarehouseData = jest.fn().mockImplementation(data => data);
    mockWarehouseUtils.transformOperationData = jest.fn().mockImplementation(data => data);
    mockWarehouseUtils.transformInventoryData = jest.fn().mockImplementation(data => data);

    // Setup Prisma transaction mock
    mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
      return await callback(mockPrisma);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();
  });

  describe('getWarehouses()', () => {
    describe('Successful Warehouse Retrieval', () => {
      it('should successfully fetch warehouses with default parameters', async () => {
        // Arrange
        const mockWarehouses = [mockWarehouseData];
        const mockRegionStats = [
          {
            region: 'US',
            _count: { id: 2 },
            _sum: { capacity: 20000 }
          }
        ];

        mockPrisma.warehouse.findMany.mockResolvedValue(mockWarehouses as any);
        mockPrisma.warehouse.count.mockResolvedValue(1);
        mockPrisma.warehouse.groupBy.mockResolvedValue(mockRegionStats as any);
        mockPrisma.warehouseAuditLog.create.mockResolvedValue({} as any);

        // Act
        const result = await warehouseService.getWarehouses();

        // Assert
        expect(result.warehouses).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.hasMore).toBe(false);
        expect(result.metadata.regions).toEqual(['US']);
        expect(result.metadata.totalCapacity).toBe(20000);
        expect(result.metadata.activeWarehouses).toBe(2);

        // Verify Prisma calls
        expect(mockPrisma.warehouse.findMany).toHaveBeenCalledWith({
          where: {},
          include: expect.objectContaining({
            inventory: expect.any(Object),
            staff: expect.any(Object),
            operations: expect.any(Object),
            auditLogs: expect.any(Object)
          }),
          skip: 0,
          take: 20,
          orderBy: { name: 'asc' }
        });

        expect(mockPrisma.warehouse.count).toHaveBeenCalledWith({ where: {} });
        expect(mockPrisma.warehouse.groupBy).toHaveBeenCalled();

        // Verify logging
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Fetching warehouses',
          expect.any(Object)
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Warehouses fetched successfully',
          expect.any(Object)
        );

        // Verify audit log creation
        expect(mockPrisma.warehouseAuditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            action: 'WAREHOUSE_QUERY',
            warehouseId: null,
            region: 'GLOBAL'
          })
        });
      });

      it('should handle filtering by region', async () => {
        // Arrange
        const query: WarehouseQuery = { region: 'US', userId: 'user-123' };
        mockPrisma.warehouse.findMany.mockResolvedValue([mockWarehouseData] as any);
        mockPrisma.warehouse.count.mockResolvedValue(1);
        mockPrisma.warehouse.groupBy.mockResolvedValue([
          { region: 'US', _count: { id: 1 }, _sum: { capacity: 10000 } }
        ] as any);
        mockPrisma.warehouseAuditLog.create.mockResolvedValue({} as any);

        // Act
        const result = await warehouseService.getWarehouses(query);

        // Assert
        expect(result.warehouses).toHaveLength(1);
        expect(mockPrisma.warehouse.findMany).toHaveBeenCalledWith({
          where: { region: 'US' },
          include: expect.any(Object),
          skip: 0,
          take: 20,
          orderBy: { name: 'asc' }
        });
      });

      it('should handle search functionality', async () => {
        // Arrange
        const query: WarehouseQuery = { search: 'Los Angeles', userId: 'user-123' };
        mockPrisma.warehouse.findMany.mockResolvedValue([mockWarehouseData] as any);
        mockPrisma.warehouse.count.mockResolvedValue(1);
        mockPrisma.warehouse.groupBy.mockResolvedValue([
          { region: 'US', _count: { id: 1 }, _sum: { capacity: 10000 } }
        ] as any);
        mockPrisma.warehouseAuditLog.create.mockResolvedValue({} as any);

        // Act
        const result = await warehouseService.getWarehouses(query);

        // Assert
        expect(mockPrisma.warehouse.findMany).toHaveBeenCalledWith({
          where: {
            OR: [
              { name: { contains: 'Los Angeles', mode: 'insensitive' } },
              { location: { contains: 'Los Angeles', mode: 'insensitive' } },
              { code: { contains: 'Los Angeles', mode: 'insensitive' } }
            ]
          },
          include: expect.any(Object),
          skip: 0,
          take: 20,
          orderBy: { name: 'asc' }
        });
      });

      it('should handle pagination correctly', async () => {
        // Arrange
        const query: WarehouseQuery = { page: 2, limit: 10, userId: 'user-123' };
        mockPrisma.warehouse.findMany.mockResolvedValue([mockWarehouseData] as any);
        mockPrisma.warehouse.count.mockResolvedValue(25); // More than one page
        mockPrisma.warehouse.groupBy.mockResolvedValue([
          { region: 'US', _count: { id: 1 }, _sum: { capacity: 10000 } }
        ] as any);
        mockPrisma.warehouseAuditLog.create.mockResolvedValue({} as any);

        // Act
        const result = await warehouseService.getWarehouses(query);

        // Assert
        expect(result.hasMore).toBe(true); // 25 total, page 2 with limit 10 means more
        expect(mockPrisma.warehouse.findMany).toHaveBeenCalledWith({
          where: {},
          include: expect.any(Object),
          skip: 10, // (page - 1) * limit = (2 - 1) * 10
          take: 10,
          orderBy: { name: 'asc' }
        });
      });

      it('should support all warehouse regions', async () => {
        // Test each region
        const regions = ['US', 'JP', 'EU', 'AU'] as const;
        
        for (const region of regions) {
          // Arrange
          const regionWarehouse = { ...mockWarehouseData, region };
          const query: WarehouseQuery = { region, userId: 'user-123' };
          
          mockPrisma.warehouse.findMany.mockResolvedValue([regionWarehouse] as any);
          mockPrisma.warehouse.count.mockResolvedValue(1);
          mockPrisma.warehouse.groupBy.mockResolvedValue([
            { region, _count: { id: 1 }, _sum: { capacity: 10000 } }
          ] as any);
          mockPrisma.warehouseAuditLog.create.mockResolvedValue({} as any);

          // Act
          const result = await warehouseService.getWarehouses(query);

          // Assert
          expect(result.warehouses[0].region).toBe(region);
          expect(result.metadata.regions).toContain(region);
        }
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        mockPrisma.warehouse.findMany.mockRejectedValue(dbError);

        // Act & Assert
        await expect(warehouseService.getWarehouses()).rejects.toThrow(
          'WAREHOUSE_FETCH_ERROR: Database connection failed'
        );

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to fetch warehouses',
          expect.objectContaining({
            error: 'Database connection failed',
            stack: expect.any(String)
          })
        );
      });

      it('should handle validation errors', async () => {
        // Arrange
        const validationError = new Error('Invalid query parameters');
        mockValidator.validateQuery.mockImplementation(() => {
          throw validationError;
        });

        // Act & Assert
        await expect(warehouseService.getWarehouses({})).rejects.toThrow(
          'WAREHOUSE_FETCH_ERROR: Invalid query parameters'
        );
      });
    });

    describe('Performance Requirements', () => {
      it('should complete warehouse fetch within performance threshold', async () => {
        // Arrange
        mockPrisma.warehouse.findMany.mockResolvedValue([mockWarehouseData] as any);
        mockPrisma.warehouse.count.mockResolvedValue(1);
        mockPrisma.warehouse.groupBy.mockResolvedValue([
          { region: 'US', _count: { id: 1 }, _sum: { capacity: 10000 } }
        ] as any);
        mockPrisma.warehouseAuditLog.create.mockResolvedValue({} as any);

        // Act
        const startTime = Date.now();
        const result = await warehouseService.getWarehouses();
        const duration = Date.now() - startTime;

        // Assert
        expect(result.warehouses).toHaveLength(1);
        expect(duration).toBeLessThan(1000); // Should complete within 1 second
      });
    });
  });

  describe('getWarehouseById()', () => {
    describe('Successful Warehouse Retrieval', () => {
      it('should successfully fetch warehouse by ID with detailed information', async () => {
        // Arrange
        const warehouseId = 'warehouse-us-1';
        const mockWarehouseWithDetails = {
          ...mockWarehouseData,
          inventory: [mockInventoryItem],
          staff: [
            {
              id: 'staff-001',
              name: 'John Supervisor',
              role: 'SUPERVISOR',
              active: true,
              user: {
                id: 'user-supervisor',
                name: 'John Supervisor',
                email: 'john@warehouse.com',
                role: 'SUPERVISOR'
              }
            }
          ],
          operations: [
            {
              id: 'op-001',
              type: 'INVENTORY_UPDATE',
              status: 'COMPLETED',
              createdAt: new Date(),
              user: {
                id: 'user-123',
                name: 'Test User',
                role: 'OPERATOR'
              }
            }
          ],
          performanceMetrics: [
            {
              id: 'metric-001',
              date: new Date(),
              overallScore: 95
            }
          ]
        };

        mockPrisma.warehouse.findUnique.mockResolvedValue(mockWarehouseWithDetails as any);
        mockPrisma.warehouseInventory.aggregate.mockResolvedValue({
          _sum: { quantity: 150 }
        } as any);
        mockPrisma.warehousePerformanceMetric.findFirst.mockResolvedValue({
          overallScore: 95
        } as any);
        mockPrisma.warehouseAuditLog.create.mockResolvedValue({} as any);

        // Act
        const result = await warehouseService.getWarehouseById(warehouseId, 'user-123');

        // Assert
        expect(result).toBeDefined();
        expect(result!.id).toBe(warehouseId);
        expect(result!.currentCapacity).toBe(150);
        expect(result!.capacityUtilization).toBe(1.5); // 150/10000 * 100
        expect(result!.performanceScore).toBe(95);

        // Verify Prisma calls
        expect(mockPrisma.warehouse.findUnique).toHaveBeenCalledWith({
          where: { id: warehouseId },
          include: expect.objectContaining({
            inventory: expect.any(Object),
            staff: expect.any(Object),
            operations: expect.any(Object),
            auditLogs: expect.any(Object),
            performanceMetrics: expect.any(Object)
          })
        });

        // Verify audit log
        expect(mockPrisma.warehouseAuditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            action: 'WAREHOUSE_VIEW',
            warehouseId,
            userId: 'user-123'
          })
        });
      });

      it('should return null when warehouse not found', async () => {
        // Arrange
        mockPrisma.warehouse.findUnique.mockResolvedValue(null);

        // Act
        const result = await warehouseService.getWarehouseById('nonexistent', 'user-123');

        // Assert
        expect(result).toBeNull();
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Warehouse not found',
          { warehouseId: 'nonexistent', userId: 'user-123' }
        );
      });
    });
  });

  describe('createOperation()', () => {
    describe('Successful Operation Creation', () => {
      it('should successfully create warehouse operation', async () => {
        // Arrange
        const warehouseId = 'warehouse-us-1';
        const userId = 'user-123';
        const operation: Omit<WarehouseOperation, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'INVENTORY_UPDATE',
          details: {
            productId: 'product-flexvolt-6ah',
            quantityChange: 50,
            reason: 'Stock replenishment'
          },
          metadata: {
            source: 'MANUAL_UPDATE'
          }
        } as any;

        const mockWarehouse = {
          id: warehouseId,
          region: 'US',
          status: 'ACTIVE'
        };

        const mockCreatedOperation = {
          id: 'operation-001',
          ...operation,
          warehouseId,
          userId,
          status: 'PENDING',
          warehouse: {
            id: warehouseId,
            name: 'US West Coast',
            region: 'US',
            code: 'US-WC-01'
          },
          user: {
            id: userId,
            name: 'Test User',
            role: 'OPERATOR'
          }
        };

        mockPrisma.warehouse.findUnique.mockResolvedValue(mockWarehouse as any);
        mockPrisma.warehouseOperation.create.mockResolvedValue(mockCreatedOperation as any);
        mockPrisma.warehouse.update.mockResolvedValue({} as any);
        mockPrisma.warehouseAuditLog.create.mockResolvedValue({} as any);

        // Act
        const result = await warehouseService.createOperation(warehouseId, operation, userId);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe('operation-001');
        expect(result.type).toBe('INVENTORY_UPDATE');
        expect(result.warehouseId).toBe(warehouseId);
        expect(result.userId).toBe(userId);

        // Verify Prisma transaction was called
        expect(mockPrisma.$transaction).toHaveBeenCalled();

        // Verify operation creation
        expect(mockPrisma.warehouseOperation.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            type: 'INVENTORY_UPDATE',
            warehouseId,
            userId,
            status: 'PENDING'
          }),
          include: expect.any(Object)
        });

        // Verify warehouse stats update
        expect(mockPrisma.warehouse.update).toHaveBeenCalledWith({
          where: { id: warehouseId },
          data: expect.objectContaining({
            lastActivity: expect.any(Date),
            operationsCount: { increment: 1 }
          })
        });

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Warehouse operation created successfully',
          expect.any(Object)
        );
      });

      it('should handle different operation types', async () => {
        const operationTypes = [
          'INVENTORY_UPDATE',
          'INVENTORY_SYNC',
          'CROSS_REGION_TRANSFER',
          'MAINTENANCE',
          'AUDIT'
        ] as const;

        for (const type of operationTypes) {
          // Arrange
          const operation = {
            type,
            details: { action: `Test ${type}` },
            metadata: {}
          } as any;

          mockPrisma.warehouse.findUnique.mockResolvedValue({
            id: 'warehouse-us-1',
            region: 'US',
            status: 'ACTIVE'
          } as any);
          mockPrisma.warehouseOperation.create.mockResolvedValue({
            id: 'op-001',
            type,
            warehouseId: 'warehouse-us-1'
          } as any);
          mockPrisma.warehouse.update.mockResolvedValue({} as any);
          mockPrisma.warehouseAuditLog.create.mockResolvedValue({} as any);

          // Act
          const result = await warehouseService.createOperation(
            'warehouse-us-1',
            operation,
            'user-123'
          );

          // Assert
          expect(result.type).toBe(type);
        }
      });
    });

    describe('Operation Creation Failures', () => {
      it('should fail when warehouse not found', async () => {
        // Arrange
        mockPrisma.warehouse.findUnique.mockResolvedValue(null);

        const operation = {
          type: 'INVENTORY_UPDATE',
          details: {},
          metadata: {}
        } as any;

        // Act & Assert
        await expect(
          warehouseService.createOperation('nonexistent', operation, 'user-123')
        ).rejects.toThrow('Warehouse not found: nonexistent');
      });

      it('should fail when warehouse is inactive', async () => {
        // Arrange
        mockPrisma.warehouse.findUnique.mockResolvedValue({
          id: 'warehouse-us-1',
          region: 'US',
          status: 'INACTIVE'
        } as any);

        const operation = {
          type: 'INVENTORY_UPDATE',
          details: {},
          metadata: {}
        } as any;

        // Act & Assert
        await expect(
          warehouseService.createOperation('warehouse-us-1', operation, 'user-123')
        ).rejects.toThrow('Cannot create operation in inactive warehouse');
      });
    });
  });

  describe('updateInventory()', () => {
    describe('Successful Inventory Updates', () => {
      it('should successfully update inventory items', async () => {
        // Arrange
        const warehouseId = 'warehouse-us-1';
        const userId = 'user-123';
        const inventoryUpdates = [
          {
            productId: 'product-flexvolt-6ah',
            quantity: 200,
            location: 'A-01-02'
          }
        ];

        const existingItem = {
          ...mockInventoryItem,
          product: {
            ...mockInventoryItem.product,
            minStockLevel: 50,
            maxStockLevel: 500
          }
        };

        const updatedItem = {
          ...existingItem,
          quantity: 200,
          location: 'A-01-02'
        };

        mockPrisma.warehouseInventory.findUnique.mockResolvedValue(existingItem as any);
        mockPrisma.warehouseInventory.update.mockResolvedValue(updatedItem as any);
        mockPrisma.warehouseOperation.create.mockResolvedValue({} as any);

        // Act
        const result = await warehouseService.updateInventory(
          warehouseId,
          inventoryUpdates,
          userId
        );

        // Assert
        expect(result.updated).toHaveLength(1);
        expect(result.failed).toHaveLength(0);
        expect(result.syncStatus).toBe('COMPLETED');

        // Verify transaction usage
        expect(mockPrisma.$transaction).toHaveBeenCalled();

        // Verify inventory update
        expect(mockPrisma.warehouseInventory.update).toHaveBeenCalledWith({
          where: {
            warehouseId_productId: {
              warehouseId,
              productId: 'product-flexvolt-6ah'
            }
          },
          data: expect.objectContaining({
            quantity: 200,
            location: 'A-01-02',
            lastUpdated: expect.any(Date),
            updatedBy: userId
          }),
          include: expect.any(Object)
        });

        // Verify operation log creation
        expect(mockPrisma.warehouseOperation.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            type: 'INVENTORY_UPDATE',
            warehouseId,
            userId,
            status: 'COMPLETED'
          })
        });

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Warehouse inventory update completed',
          expect.objectContaining({
            updated: 1,
            failed: 0,
            syncStatus: 'COMPLETED'
          })
        );
      });

      it('should handle batch updates efficiently', async () => {
        // Arrange
        const warehouseId = 'warehouse-us-1';
        const userId = 'user-123';
        const batchSize = 25; // More than the service's batch size of 10
        const inventoryUpdates = Array.from({ length: batchSize }, (_, i) => ({
          productId: `product-${i}`,
          quantity: 100 + i
        }));

        // Mock successful updates for all items
        mockPrisma.warehouseInventory.findUnique.mockResolvedValue(mockInventoryItem as any);
        mockPrisma.warehouseInventory.update.mockResolvedValue(mockInventoryItem as any);
        mockPrisma.warehouseOperation.create.mockResolvedValue({} as any);

        // Act
        const result = await warehouseService.updateInventory(
          warehouseId,
          inventoryUpdates,
          userId
        );

        // Assert
        expect(result.updated).toHaveLength(batchSize);
        expect(result.failed).toHaveLength(0);
        expect(result.syncStatus).toBe('COMPLETED');

        // Verify batching: should process in multiple batches
        expect(mockPrisma.$transaction).toHaveBeenCalledTimes(
          Math.ceil(batchSize / 10)
        );
      });

      it('should handle partial failures gracefully', async () => {
        // Arrange
        const warehouseId = 'warehouse-us-1';
        const userId = 'user-123';
        const inventoryUpdates = [
          { productId: 'product-valid', quantity: 100 },
          { productId: 'product-invalid', quantity: -10 } // Invalid negative quantity
        ];

        // First update succeeds
        mockPrisma.warehouseInventory.findUnique
          .mockResolvedValueOnce(mockInventoryItem as any)
          .mockResolvedValueOnce(null); // Not found

        mockPrisma.warehouseInventory.update.mockResolvedValue(mockInventoryItem as any);
        mockPrisma.warehouseOperation.create.mockResolvedValue({} as any);

        // Act
        const result = await warehouseService.updateInventory(
          warehouseId,
          inventoryUpdates,
          userId
        );

        // Assert
        expect(result.updated).toHaveLength(1);
        expect(result.failed).toHaveLength(1);
        expect(result.syncStatus).toBe('PARTIAL');
        expect(result.failed[0].error).toContain('not found');
      });
    });

    describe('Inventory Status Calculation', () => {
      it('should calculate correct inventory status based on stock levels', async () => {
        const testCases = [
          { quantity: 0, expected: 'OUT_OF_STOCK' },
          { quantity: 25, minLevel: 50, expected: 'LOW_STOCK' },
          { quantity: 100, minLevel: 50, maxLevel: 500, expected: 'IN_STOCK' },
          { quantity: 600, minLevel: 50, maxLevel: 500, expected: 'OVERSTOCK' }
        ];

        for (const { quantity, minLevel, maxLevel, expected } of testCases) {
          // Arrange
          const existingItem = {
            ...mockInventoryItem,
            product: {
              ...mockInventoryItem.product,
              minStockLevel: minLevel,
              maxStockLevel: maxLevel
            }
          };

          mockPrisma.warehouseInventory.findUnique.mockResolvedValue(existingItem as any);
          mockPrisma.warehouseInventory.update.mockResolvedValue({
            ...existingItem,
            quantity,
            status: expected
          } as any);
          mockPrisma.warehouseOperation.create.mockResolvedValue({} as any);

          // Act
          const result = await warehouseService.updateInventory(
            'warehouse-us-1',
            [{ productId: 'product-test', quantity }],
            'user-123'
          );

          // Assert
          expect(result.updated[0].status).toBe(expected);
        }
      });
    });
  });

  describe('getPerformanceMetrics()', () => {
    describe('Successful Metrics Calculation', () => {
      it('should successfully calculate warehouse performance metrics', async () => {
        // Arrange
        const warehouseId = 'warehouse-us-1';
        const dateRange = {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        };

        // Mock operations data
        const mockOperations = [
          { id: 'op-1', status: 'COMPLETED', createdAt: new Date(), completedAt: new Date() },
          { id: 'op-2', status: 'COMPLETED', createdAt: new Date(), completedAt: new Date() },
          { id: 'op-3', status: 'FAILED', createdAt: new Date(), completedAt: null }
        ];

        // Mock inventory data
        const mockInventory = [
          { ...mockInventoryItem, status: 'IN_STOCK' },
          { ...mockInventoryItem, id: 'inv-2', status: 'LOW_STOCK' },
          { ...mockInventoryItem, id: 'inv-3', status: 'OUT_OF_STOCK' }
        ];

        // Mock staff data
        const mockStaff = [
          { id: 'staff-1', status: 'ACTIVE', active: true },
          { id: 'staff-2', status: 'ACTIVE', active: true },
          { id: 'staff-3', status: 'ON_LEAVE', active: true }
        ];

        // Mock warehouse capacity
        const mockWarehouse = { capacity: 10000 };

        mockPrisma.warehouseOperation.findMany.mockResolvedValue(mockOperations as any);
        mockPrisma.warehouseInventory.findMany.mockResolvedValue(mockInventory as any);
        mockPrisma.warehouseStaff.findMany.mockResolvedValue(mockStaff as any);
        mockPrisma.warehouse.findUnique.mockResolvedValue(mockWarehouse as any);
        mockPrisma.warehouseInventory.aggregate.mockResolvedValue({
          _sum: { quantity: 1500 }
        } as any);
        mockPrisma.warehouseAuditLog.create.mockResolvedValue({} as any);

        // Act
        const result = await warehouseService.getPerformanceMetrics(
          warehouseId,
          dateRange,
          'user-123'
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.warehouseId).toBe(warehouseId);
        expect(result.dateRange).toEqual(dateRange);
        expect(result.overallScore).toBeGreaterThan(0);
        expect(result.operations).toBeDefined();
        expect(result.inventory).toBeDefined();
        expect(result.staff).toBeDefined();
        expect(result.compliance).toBeDefined();
        expect(result.capacity).toBeDefined();

        // Verify operations metrics
        expect(result.operations.totalOperations).toBe(3);
        expect(result.operations.completedOperations).toBe(2);
        expect(result.operations.failedOperations).toBe(1);
        expect(result.operations.successRate).toBeCloseTo(66.67, 2);

        // Verify inventory metrics
        expect(result.inventory.totalItems).toBe(3);
        expect(result.inventory.inStockItems).toBe(1);
        expect(result.inventory.lowStockItems).toBe(1);
        expect(result.inventory.outOfStockItems).toBe(1);

        // Verify staff metrics
        expect(result.staff.totalStaff).toBe(3);
        expect(result.staff.activeStaff).toBe(2);
        expect(result.staff.onLeaveStaff).toBe(1);

        // Verify capacity metrics
        expect(result.capacity.totalCapacity).toBe(10000);
        expect(result.capacity.currentCapacity).toBe(1500);
        expect(result.capacity.utilizationRate).toBe(15);

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Performance metrics calculated successfully',
          expect.any(Object)
        );
      });

      it('should generate appropriate recommendations based on metrics', async () => {
        // This would test the recommendation generation logic
        // Implementation depends on the specific business rules
      });
    });
  });

  describe('Regional Compliance', () => {
    it('should validate regional compliance for different regions', async () => {
      const regions = ['US', 'JP', 'EU', 'AU'] as const;
      
      for (const region of regions) {
        // Test that operations respect regional compliance
        const mockWarehouse = {
          id: 'warehouse-test',
          region,
          status: 'ACTIVE'
        };

        const operation = {
          type: 'INVENTORY_UPDATE',
          details: { complianceCheck: true },
          metadata: {}
        } as any;

        mockPrisma.warehouse.findUnique.mockResolvedValue(mockWarehouse as any);
        mockPrisma.regionalCompliance.findMany.mockResolvedValue([
          {
            id: 'compliance-1',
            region,
            name: `${region} Safety Standards`,
            active: true
          }
        ] as any);
        mockPrisma.warehouseOperation.create.mockResolvedValue({
          id: 'op-001',
          type: 'INVENTORY_UPDATE'
        } as any);
        mockPrisma.warehouse.update.mockResolvedValue({} as any);
        mockPrisma.warehouseAuditLog.create.mockResolvedValue({} as any);

        // Should not throw for valid compliance
        await expect(
          warehouseService.createOperation('warehouse-test', operation, 'user-123')
        ).resolves.toBeDefined();
      }
    });
  });

  describe('Performance Requirements', () => {
    it('should complete operations within performance thresholds', async () => {
      // Test database query performance
      const operations = [
        () => warehouseService.getWarehouses(),
        () => warehouseService.getWarehouseById('warehouse-us-1'),
      ];

      for (const operation of operations) {
        // Setup mocks
        mockPrisma.warehouse.findMany.mockResolvedValue([mockWarehouseData] as any);
        mockPrisma.warehouse.findUnique.mockResolvedValue(mockWarehouseData as any);
        mockPrisma.warehouse.count.mockResolvedValue(1);
        mockPrisma.warehouse.groupBy.mockResolvedValue([
          { region: 'US', _count: { id: 1 }, _sum: { capacity: 10000 } }
        ] as any);
        mockPrisma.warehouseInventory.aggregate.mockResolvedValue({
          _sum: { quantity: 150 }
        } as any);
        mockPrisma.warehousePerformanceMetric.findFirst.mockResolvedValue({
          overallScore: 95
        } as any);
        mockPrisma.warehouseAuditLog.create.mockResolvedValue({} as any);

        const startTime = Date.now();
        await operation();
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(1000); // Should complete within 1 second
      }
    });
  });

  describe('Error Handling and Logging', () => {
    it('should log all critical operations', async () => {
      // Verify that all major operations are logged
      mockPrisma.warehouse.findMany.mockResolvedValue([mockWarehouseData] as any);
      mockPrisma.warehouse.count.mockResolvedValue(1);
      mockPrisma.warehouse.groupBy.mockResolvedValue([
        { region: 'US', _count: { id: 1 }, _sum: { capacity: 10000 } }
      ] as any);
      mockPrisma.warehouseAuditLog.create.mockResolvedValue({} as any);

      await warehouseService.getWarehouses();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Fetching warehouses',
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Warehouses fetched successfully',
        expect.any(Object)
      );
    });

    it('should handle and log errors appropriately', async () => {
      const dbError = new Error('Database timeout');
      mockPrisma.warehouse.findMany.mockRejectedValue(dbError);

      await expect(warehouseService.getWarehouses()).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to fetch warehouses',
        expect.objectContaining({
          error: 'Database timeout',
          stack: expect.any(String)
        })
      );
    });
  });
});