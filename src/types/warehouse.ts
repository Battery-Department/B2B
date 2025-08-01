// Warehouse Types for RHY Supplier Portal and Mobile Management
// Enterprise-grade warehouse management with multi-region support

import { z } from 'zod'

// Base warehouse information
export interface WarehouseInfo {
  id: string
  name: string
  location: string
  timezone: string
  currency: string
  complianceRegion: 'US' | 'EU' | 'JAPAN' | 'AUSTRALIA'
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
  capacity: number
  currentOccupancy: number
  lastSyncAt: Date
  managerId?: string
}

export interface WarehouseLocation {
  id: string;
  name: string;
  code: string;
  region: 'US_WEST' | 'US_EAST' | 'EU_CENTRAL' | 'JAPAN' | 'AUSTRALIA';
  address: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  capacity: {
    totalSquareFootage: number;
    utilizationPercentage: number;
    maxCapacity: number;
    currentCapacity: number;
  };
  isActive: boolean;
  operatingHours: {
    timezone: string;
    schedule: {
      [key: string]: { // day of week
        open: string;
        close: string;
        isOperating: boolean;
      };
    };
  };
  facilities: {
    dockDoors: number;
    automationLevel: 'MANUAL' | 'SEMI_AUTOMATED' | 'FULLY_AUTOMATED';
    temperatureControlled: boolean;
    securityLevel: 'STANDARD' | 'HIGH' | 'MAXIMUM';
  };
  createdAt: string;
  updatedAt: string;
}

// Legacy inventory item interface (mobile)
export interface InventoryItem {
  id: string;
  productId: string;
  warehouseId: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  reorderPoint: number;
  maxStock: number;
  safetyStock: number;
  binLocation: string;
  zone: string;
  lastMovement: string;
  costPerUnit: number;
  totalValue: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  qualityStatus: 'PASSED' | 'FAILED' | 'PENDING' | 'QUARANTINE';
  expirationDate?: string;
  batchNumber?: string;
  complianceData: {
    region: string;
    certifications: string[];
    customsCode?: string;
    hazardousClassification?: string;
  };
}

// Enhanced inventory item interface for web portal
export interface EnhancedInventoryItem {
  id: string
  sku: string
  name: string
  description?: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unitPrice: number
  totalValue: number
  lastUpdated: Date
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked'
  supplier: string
  location: string
  reservedStock: number
  availableStock: number
  lastRestockDate?: Date
  nextRestockDate?: Date
  turnoverRate: number
  demandTrend: 'increasing' | 'stable' | 'decreasing'
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
    unit: 'cm' | 'in'
  }
  barcode?: string
  images?: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Inventory filters for search and filtering
export interface InventoryFilters {
  category?: string
  stockLevel?: 'all' | 'low' | 'out' | 'adequate' | 'overstocked'
  priceRange?: [number, number]
  searchTerm?: string
  supplier?: string[]
  location?: string[]
  demandTrend?: string[]
  lastUpdated?: 'today' | 'week' | 'month' | 'all'
  warehouseId?: string
  sortBy?: keyof EnhancedInventoryItem
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Stock movement tracking
export interface StockMovement {
  id: string
  itemId: string
  warehouseId: string
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT' | 'DAMAGED' | 'RETURNED'
  quantity: number
  previousStock: number
  newStock: number
  reason?: string
  referenceId?: string // Order ID, Transfer ID, etc.
  userId: string
  userRole: string
  timestamp: Date
  notes?: string
  approvedBy?: string
  approvedAt?: Date
}

// Inventory metrics and analytics
export interface InventoryMetrics {
  totalProducts: number
  totalValue: number
  lowStockItems: number
  outOfStockItems: number
  overstockedItems: number
  averageTurnover: number
  topCategories: Array<{
    category: string
    items: number
    value: number
    percentage: number
  }>
  topSuppliers: Array<{
    supplier: string
    items: number
    value: number
    percentage: number
  }>
  stockMovements: {
    today: number
    thisWeek: number
    thisMonth: number
  }
  lastUpdated: Date
}

// Stock alert configuration
export interface StockAlert {
  id: string
  warehouseId: string
  itemId?: string
  category?: string
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' | 'EXPIRY' | 'MOVEMENT'
  threshold?: number
  isActive: boolean
  recipients: string[]
  lastTriggered?: Date
  createdAt: Date
  updatedAt: Date
}

// Restock suggestion
export interface RestockSuggestion {
  itemId: string
  item: Pick<EnhancedInventoryItem, 'sku' | 'name' | 'category' | 'currentStock' | 'minStock'>
  suggestedQuantity: number
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  estimatedCost: number
  estimatedDelivery?: Date
  supplier: string
  reason: string
  projectedStockoutDate?: Date
  confidence: number // 0-100%
}

export interface AutomationTask {
  id: string;
  warehouseId: string;
  type: 'PICKING' | 'PACKING' | 'SORTING' | 'RECEIVING' | 'SHIPPING' | 'INVENTORY_COUNT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'QUEUED' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  assignedTo: {
    type: 'ROBOT' | 'HUMAN' | 'HYBRID';
    workerId: string;
    workerName: string;
  };
  productIds: string[];
  sourceLocation: string;
  targetLocation: string;
  quantity: number;
  estimatedDuration: number; // in minutes
  actualDuration?: number;
  createdAt: string;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  errorDetails?: {
    code: string;
    message: string;
    resolution: string;
  };
}

// Error Types
export class WarehouseServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'WarehouseServiceError';
  }
}

export class WarehouseConnectionError extends WarehouseServiceError {
  constructor(message: string, details?: any) {
    super(message, 'CONNECTION_ERROR', 0, details);
    this.name = 'WarehouseConnectionError';
  }
}

export class WarehouseValidationError extends WarehouseServiceError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'WarehouseValidationError';
  }
}

export class WarehouseAuthenticationError extends WarehouseServiceError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
    this.name = 'WarehouseAuthenticationError';
  }
}

export class WarehouseNotFoundError extends WarehouseServiceError {
  constructor(message: string, details?: any) {
    super(message, 'NOT_FOUND', 404, details);
    this.name = 'WarehouseNotFoundError';
  }
}

// Zod Validation Schemas
export const warehouseInfoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  location: z.string().min(1).max(200),
  timezone: z.string(),
  currency: z.string().length(3),
  complianceRegion: z.enum(['US', 'EU', 'JAPAN', 'AUSTRALIA']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']),
  capacity: z.number().positive(),
  currentOccupancy: z.number().min(0),
  lastSyncAt: z.date(),
  managerId: z.string().optional(),
})

export const enhancedInventoryItemSchema = z.object({
  id: z.string().min(1),
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(100),
  currentStock: z.number().min(0),
  minStock: z.number().min(0),
  maxStock: z.number().positive(),
  unitPrice: z.number().positive(),
  totalValue: z.number().min(0),
  lastUpdated: z.date(),
  status: z.enum(['in_stock', 'low_stock', 'out_of_stock', 'overstocked']),
  supplier: z.string().min(1).max(100),
  location: z.string().min(1).max(100),
  reservedStock: z.number().min(0),
  availableStock: z.number().min(0),
  lastRestockDate: z.date().optional(),
  nextRestockDate: z.date().optional(),
  turnoverRate: z.number().min(0),
  demandTrend: z.enum(['increasing', 'stable', 'decreasing']),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.enum(['cm', 'in']),
  }).optional(),
  barcode: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  notes: z.string().max(500).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const inventoryFiltersSchema = z.object({
  category: z.string().optional(),
  stockLevel: z.enum(['all', 'low', 'out', 'adequate', 'overstocked']).optional(),
  priceRange: z.tuple([z.number().min(0), z.number().positive()]).optional(),
  searchTerm: z.string().max(100).optional(),
  supplier: z.array(z.string()).optional(),
  location: z.array(z.string()).optional(),
  demandTrend: z.array(z.string()).optional(),
  lastUpdated: z.enum(['today', 'week', 'month', 'all']).optional(),
  warehouseId: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().positive().optional(),
  limit: z.number().positive().max(100).optional(),
})

export const stockMovementSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
  warehouseId: z.string().min(1),
  type: z.enum(['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT', 'DAMAGED', 'RETURNED']),
  quantity: z.number(),
  previousStock: z.number().min(0),
  newStock: z.number().min(0),
  reason: z.string().max(200).optional(),
  referenceId: z.string().optional(),
  userId: z.string().min(1),
  userRole: z.string().min(1),
  timestamp: z.date(),
  notes: z.string().max(500).optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.date().optional(),
})

export const stockAlertSchema = z.object({
  id: z.string().min(1),
  warehouseId: z.string().min(1),
  itemId: z.string().optional(),
  category: z.string().optional(),
  alertType: z.enum(['LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCK', 'EXPIRY', 'MOVEMENT']),
  threshold: z.number().positive().optional(),
  isActive: z.boolean(),
  recipients: z.array(z.string().email()),
  lastTriggered: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const restockSuggestionSchema = z.object({
  itemId: z.string().min(1),
  item: z.object({
    sku: z.string(),
    name: z.string(),
    category: z.string(),
    currentStock: z.number(),
    minStock: z.number(),
  }),
  suggestedQuantity: z.number().positive(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  estimatedCost: z.number().positive(),
  estimatedDelivery: z.date().optional(),
  supplier: z.string().min(1),
  reason: z.string().min(1).max(200),
  projectedStockoutDate: z.date().optional(),
  confidence: z.number().min(0).max(100),
})

// Utility functions for type validation and transformation
export const validateInventoryItem = (data: unknown): EnhancedInventoryItem => {
  return enhancedInventoryItemSchema.parse(data)
}

export const validateInventoryFilters = (data: unknown): InventoryFilters => {
  return inventoryFiltersSchema.parse(data)
}

export const validateStockMovement = (data: unknown): StockMovement => {
  return stockMovementSchema.parse(data)
}

export const validateWarehouseInfo = (data: unknown): WarehouseInfo => {
  return warehouseInfoSchema.parse(data)
}

export const validateStockAlert = (data: unknown): StockAlert => {
  return stockAlertSchema.parse(data)
}

export const validateRestockSuggestion = (data: unknown): RestockSuggestion => {
  return restockSuggestionSchema.parse(data)
}

// Type guards for runtime type checking
export const isEnhancedInventoryItem = (value: unknown): value is EnhancedInventoryItem => {
  try {
    enhancedInventoryItemSchema.parse(value)
    return true
  } catch {
    return false
  }
}

export const isInventoryFilters = (value: unknown): value is InventoryFilters => {
  try {
    inventoryFiltersSchema.parse(value)
    return true
  } catch {
    return false
  }
}

export const isStockMovement = (value: unknown): value is StockMovement => {
  try {
    stockMovementSchema.parse(value)
    return true
  } catch {
    return false
  }
}

// Helper functions for inventory calculations
export const calculateStockStatus = (
  currentStock: number,
  minStock: number,
  maxStock: number
): EnhancedInventoryItem['status'] => {
  if (currentStock === 0) return 'out_of_stock'
  if (currentStock <= minStock) return 'low_stock'
  if (currentStock >= maxStock) return 'overstocked'
  return 'in_stock'
}

export const calculateTotalValue = (unitPrice: number, currentStock: number): number => {
  return unitPrice * currentStock
}

export const calculateAvailableStock = (
  currentStock: number,
  reservedStock: number
): number => {
  return Math.max(0, currentStock - reservedStock)
}

export const formatStockLevel = (
  current: number,
  min: number,
  max: number
): string => {
  const percentage = ((current - min) / (max - min)) * 100
  return `${current} (${Math.round(percentage)}%)`
}

// Constants for inventory management
export const STOCK_THRESHOLDS = {
  CRITICAL: 0.1, // 10% of min stock
  LOW: 0.5, // 50% of min stock
  ADEQUATE: 1.0, // At min stock level
  HIGH: 1.5, // 150% of min stock
} as const

export const TURNOVER_CATEGORIES = {
  SLOW: 0.5,
  MODERATE: 2.0,
  FAST: 4.0,
  VERY_FAST: 8.0,
} as const

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 25,
  maxLimit: 100,
} as const

// === COMPREHENSIVE WAREHOUSE MANAGEMENT INTERFACES ===
// Enterprise-grade types for RHY_026 Core Warehouse CRUD Operations

// Core Warehouse Types
export type WarehouseStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'EMERGENCY_SHUTDOWN';
export type Currency = 'USD' | 'JPY' | 'EUR' | 'AUD';
export type Language = 'en' | 'ja' | 'de' | 'fr' | 'es';
export type ComplianceRegion = 'US' | 'EU' | 'JAPAN' | 'AUSTRALIA';
export type UserRole = 'VIEWER' | 'OPERATOR' | 'MANAGER' | 'ADMIN';
export type WarehouseType = 'DISTRIBUTION' | 'FULFILLMENT' | 'MANUFACTURING' | 'TRANSIT';
export type AutomationLevel = 'MANUAL' | 'SEMI_AUTOMATED' | 'FULLY_AUTOMATED';

// Comprehensive Warehouse Interface
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  type: WarehouseType;
  status: WarehouseStatus;
  region: ComplianceRegion;
  
  // Location Details
  address: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  // Configuration
  timezone: string;
  currency: Currency;
  language: Language;
  
  // Capacity and Metrics
  capacity: {
    totalSquareFootage: number;
    utilizationPercentage: number;
    maxCapacity: number;
    currentCapacity: number;
    reservedCapacity: number;
    availableCapacity: number;
  };
  
  // Operational Details
  operatingHours: {
    timezone: string;
    schedule: {
      [key: string]: {
        open: string;
        close: string;
        isOperating: boolean;
        breaks?: Array<{
          start: string;
          end: string;
          type: 'LUNCH' | 'MAINTENANCE' | 'SHIFT_CHANGE';
        }>;
      };
    };
    holidaySchedule?: {
      [date: string]: {
        isHoliday: boolean;
        name?: string;
        hours?: { open: string; close: string };
      };
    };
  };
  
  // Facilities and Equipment
  facilities: {
    dockDoors: number;
    automationLevel: AutomationLevel;
    temperatureControlled: boolean;
    securityLevel: 'STANDARD' | 'HIGH' | 'MAXIMUM';
    hasRailAccess: boolean;
    hasTruckAccess: boolean;
    maxVehicleSize: string;
    equipmentList: Array<{
      id: string;
      type: string;
      status: 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE';
      lastMaintenance: string;
    }>;
  };
  
  // Regional Compliance
  compliance: {
    region: ComplianceRegion;
    certifications: string[];
    regulations: string[];
    lastAudit: string;
    nextAudit: string;
    complianceScore: number;
    requirements: {
      environmental: string[];
      safety: string[];
      quality: string[];
    };
  };
  
  // Performance Metrics
  metrics: {
    efficiency: number;
    accuracy: number;
    throughput: number;
    costPerUnit: number;
    errorRate: number;
    customerSatisfaction: number;
    slaCompliance: number;
    lastCalculated: string;
  };
  
  // Contacts and Management
  contacts: {
    managerId?: string;
    managerName?: string;
    managerEmail?: string;
    supervisors: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>;
    emergencyContact: {
      name: string;
      phone: string;
      email: string;
    };
  };
  
  // System Fields
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  version: number;
}

// Warehouse with Real-time Data
export interface WarehouseWithMetrics extends Warehouse {
  realtimeData: {
    currentOrders: number;
    pendingShipments: number;
    activeAlerts: number;
    staffOnDuty: number;
    equipmentStatus: {
      operational: number;
      maintenance: number;
      offline: number;
    };
    weatherConditions?: {
      temperature: number;
      humidity: number;
      conditions: string;
      lastUpdated: string;
    };
  };
  
  // Performance Trends
  trends: {
    efficiency: Array<{ date: string; value: number }>;
    throughput: Array<{ date: string; value: number }>;
    costs: Array<{ date: string; value: number }>;
    period: '24h' | '7d' | '30d' | '90d';
  };
}

// Warehouse Summary for List Views
export interface WarehouseSummary {
  id: string;
  name: string;
  code: string;
  region: ComplianceRegion;
  status: WarehouseStatus;
  utilizationPercentage: number;
  currentOrders: number;
  activeAlerts: number;
  efficiency: number;
  lastUpdated: string;
}

// API Request/Response Types
export interface CreateWarehouseRequest {
  name: string;
  code: string;
  type: WarehouseType;
  region: ComplianceRegion;
  address: Warehouse['address'];
  timezone: string;
  currency: Currency;
  language: Language;
  capacity: Omit<Warehouse['capacity'], 'utilizationPercentage' | 'availableCapacity'>;
  operatingHours: Warehouse['operatingHours'];
  facilities: Warehouse['facilities'];
  contacts: Warehouse['contacts'];
}

export interface UpdateWarehouseRequest {
  name?: string;
  status?: WarehouseStatus;
  address?: Partial<Warehouse['address']>;
  capacity?: Partial<Warehouse['capacity']>;
  operatingHours?: Partial<Warehouse['operatingHours']>;
  facilities?: Partial<Warehouse['facilities']>;
  contacts?: Partial<Warehouse['contacts']>;
}

export interface WarehouseStatusUpdate {
  status: WarehouseStatus;
  reason?: string;
  scheduledDowntime?: {
    start: string;
    end: string;
    reason: string;
  };
  maintenanceNotes?: string;
}

// Warehouse Filters and Queries
export interface WarehouseFilters {
  region?: ComplianceRegion[];
  status?: WarehouseStatus[];
  type?: WarehouseType[];
  minCapacity?: number;
  maxCapacity?: number;
  minEfficiency?: number;
  automationLevel?: AutomationLevel[];
  hasAlerts?: boolean;
  searchTerm?: string;
  sortBy?: keyof Warehouse;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Regional Analytics
export interface RegionalWarehouseData {
  region: ComplianceRegion;
  warehouses: WarehouseSummary[];
  totalWarehouses: number;
  activeWarehouses: number;
  totalCapacity: number;
  averageUtilization: number;
  totalOrders: number;
  totalAlerts: number;
  complianceScore: number;
  regionalMetrics: {
    efficiency: number;
    accuracy: number;
    throughput: number;
    costPerUnit: number;
  };
  trends: {
    utilizationTrend: Array<{ date: string; value: number }>;
    ordersTrend: Array<{ date: string; value: number }>;
    efficiencyTrend: Array<{ date: string; value: number }>;
  };
}

// Cross-Regional Summary
export interface GlobalWarehouseSummary {
  totalWarehouses: number;
  activeWarehouses: number;
  totalCapacity: number;
  averageUtilization: number;
  totalOrders: number;
  totalAlerts: number;
  regions: RegionalWarehouseData[];
  topPerformingWarehouses: WarehouseSummary[];
  alertSummary: {
    critical: number;
    warning: number;
    info: number;
  };
  complianceOverview: {
    [key in ComplianceRegion]: {
      score: number;
      lastAudit: string;
      nextAudit: string;
    };
  };
}

// Alert System
export interface WarehouseAlert {
  id: string;
  warehouseId: string;
  type: 'CAPACITY' | 'EQUIPMENT' | 'COMPLIANCE' | 'SECURITY' | 'PERFORMANCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  details?: any;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  actions: Array<{
    type: 'ACKNOWLEDGE' | 'ESCALATE' | 'RESOLVE' | 'SNOOZE';
    timestamp: string;
    userId: string;
    notes?: string;
  }>;
}

// Audit Trail
export interface WarehouseAuditLog {
  id: string;
  warehouseId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'ACCESS' | 'EXPORT';
  details: {
    field?: string;
    oldValue?: any;
    newValue?: any;
    reason?: string;
  };
  userId: string;
  userRole: UserRole;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  sessionId?: string;
}

// Enhanced Validation Schemas for Warehouse Management
export const warehouseStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'EMERGENCY_SHUTDOWN']);
export const complianceRegionSchema = z.enum(['US', 'EU', 'JAPAN', 'AUSTRALIA']);
export const currencySchema = z.enum(['USD', 'JPY', 'EUR', 'AUD']);
export const languageSchema = z.enum(['en', 'ja', 'de', 'fr', 'es']);
export const userRoleSchema = z.enum(['VIEWER', 'OPERATOR', 'MANAGER', 'ADMIN']);
export const warehouseTypeSchema = z.enum(['DISTRIBUTION', 'FULFILLMENT', 'MANUFACTURING', 'TRANSIT']);
export const automationLevelSchema = z.enum(['MANUAL', 'SEMI_AUTOMATED', 'FULLY_AUTOMATED']);

// Create Warehouse Validation Schema
export const createWarehouseSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(20),
  type: warehouseTypeSchema,
  region: complianceRegionSchema,
  address: z.object({
    street: z.string().min(5).max(200),
    city: z.string().min(2).max(100),
    state: z.string().min(2).max(100).optional(),
    country: z.string().min(2).max(100),
    postalCode: z.string().min(3).max(20),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    }).optional()
  }),
  timezone: z.string(),
  currency: currencySchema,
  language: languageSchema,
  capacity: z.object({
    totalSquareFootage: z.number().positive(),
    maxCapacity: z.number().positive(),
    currentCapacity: z.number().min(0),
    reservedCapacity: z.number().min(0)
  }),
  operatingHours: z.object({
    timezone: z.string(),
    schedule: z.record(z.object({
      open: z.string(),
      close: z.string(),
      isOperating: z.boolean()
    }))
  }),
  facilities: z.object({
    dockDoors: z.number().min(0),
    automationLevel: automationLevelSchema,
    temperatureControlled: z.boolean(),
    securityLevel: z.enum(['STANDARD', 'HIGH', 'MAXIMUM']),
    hasRailAccess: z.boolean(),
    hasTruckAccess: z.boolean(),
    maxVehicleSize: z.string(),
    equipmentList: z.array(z.object({
      id: z.string(),
      type: z.string(),
      status: z.enum(['ACTIVE', 'MAINTENANCE', 'OFFLINE']),
      lastMaintenance: z.string()
    }))
  }),
  contacts: z.object({
    managerId: z.string().optional(),
    managerName: z.string().optional(),
    managerEmail: z.string().email().optional(),
    supervisors: z.array(z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
      role: z.string()
    })),
    emergencyContact: z.object({
      name: z.string(),
      phone: z.string(),
      email: z.string().email()
    })
  })
});

// Update Warehouse Validation Schema
export const updateWarehouseSchema = createWarehouseSchema.partial();

// Warehouse Status Update Schema
export const warehouseStatusUpdateSchema = z.object({
  status: warehouseStatusSchema,
  reason: z.string().optional(),
  scheduledDowntime: z.object({
    start: z.string(),
    end: z.string(),
    reason: z.string()
  }).optional(),
  maintenanceNotes: z.string().optional()
});

// Warehouse Filters Schema
export const warehouseFiltersSchema = z.object({
  region: z.array(complianceRegionSchema).optional(),
  status: z.array(warehouseStatusSchema).optional(),
  type: z.array(warehouseTypeSchema).optional(),
  minCapacity: z.number().positive().optional(),
  maxCapacity: z.number().positive().optional(),
  minEfficiency: z.number().min(0).max(100).optional(),
  automationLevel: z.array(automationLevelSchema).optional(),
  hasAlerts: z.boolean().optional(),
  searchTerm: z.string().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().positive().optional(),
  limit: z.number().positive().max(100).optional()
});

// Utility Functions
export const warehouseUtils = {
  // Calculate utilization percentage
  calculateUtilization: (current: number, max: number): number => {
    return Math.round((current / max) * 100);
  },
  
  // Calculate available capacity
  calculateAvailableCapacity: (max: number, current: number, reserved: number): number => {
    return Math.max(0, max - current - reserved);
  },
  
  // Get compliance requirements by region
  getComplianceRequirements: (region: ComplianceRegion) => {
    const requirements = {
      US: {
        environmental: ['EPA', 'OSHA'],
        safety: ['OSHA', 'DOT'],
        quality: ['ISO 9001', 'GMP']
      },
      EU: {
        environmental: ['GDPR', 'REACH', 'RoHS'],
        safety: ['CE', 'ATEX'],
        quality: ['ISO 9001', 'ISO 14001']
      },
      JAPAN: {
        environmental: ['JIS', 'Industrial Safety'],
        safety: ['JIS', 'Fire Service Act'],
        quality: ['JIS Q 9001', 'JQA']
      },
      AUSTRALIA: {
        environmental: ['EPA', 'Work Health Safety'],
        safety: ['AS/NZS', 'WHS'],
        quality: ['AS/NZS ISO 9001']
      }
    };
    return requirements[region];
  },
  
  // Validate warehouse code format
  validateWarehouseCode: (code: string, region: ComplianceRegion): boolean => {
    const patterns = {
      US: /^US[A-Z]{2}\d{3}$/,
      EU: /^EU[A-Z]{2}\d{3}$/,
      JAPAN: /^JP[A-Z]{2}\d{3}$/,
      AUSTRALIA: /^AU[A-Z]{2}\d{3}$/
    };
    return patterns[region].test(code);
  },
  
  // Get default currency by region
  getDefaultCurrency: (region: ComplianceRegion): Currency => {
    const currencies = {
      US: 'USD' as Currency,
      EU: 'EUR' as Currency,
      JAPAN: 'JPY' as Currency,
      AUSTRALIA: 'AUD' as Currency
    };
    return currencies[region];
  },
  
  // Get default language by region
  getDefaultLanguage: (region: ComplianceRegion): Language => {
    const languages = {
      US: 'en' as Language,
      EU: 'en' as Language,
      JAPAN: 'ja' as Language,
      AUSTRALIA: 'en' as Language
    };
    return languages[region];
  },
  
  // Calculate health score
  calculateHealthScore: (metrics: Warehouse['metrics']): number => {
    const weights = {
      efficiency: 0.25,
      accuracy: 0.25,
      slaCompliance: 0.20,
      customerSatisfaction: 0.15,
      errorRate: -0.15 // negative weight for error rate
    };
    
    return Math.round(
      metrics.efficiency * weights.efficiency +
      metrics.accuracy * weights.accuracy +
      metrics.slaCompliance * weights.slaCompliance +
      metrics.customerSatisfaction * weights.customerSatisfaction +
      (100 - metrics.errorRate) * Math.abs(weights.errorRate)
    );
  }
};

// Validation helper functions
export const validateCreateWarehouse = (data: unknown): CreateWarehouseRequest => {
  return createWarehouseSchema.parse(data);
};

export const validateUpdateWarehouse = (data: unknown): UpdateWarehouseRequest => {
  return updateWarehouseSchema.parse(data);
};

export const validateWarehouseStatusUpdate = (data: unknown): WarehouseStatusUpdate => {
  return warehouseStatusUpdateSchema.parse(data);
};

export const validateWarehouseFilters = (data: unknown): WarehouseFilters => {
  return warehouseFiltersSchema.parse(data);
};

// Type guards
export const isWarehouse = (value: unknown): value is Warehouse => {
  try {
    // Basic validation - you might want to create a full schema
    return typeof value === 'object' && value !== null && 'id' in value && 'name' in value;
  } catch {
    return false;
  }
};

export const isWarehouseStatus = (value: unknown): value is WarehouseStatus => {
  return typeof value === 'string' && ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'EMERGENCY_SHUTDOWN'].includes(value);
};

export const isComplianceRegion = (value: unknown): value is ComplianceRegion => {
  return typeof value === 'string' && ['US', 'EU', 'JAPAN', 'AUSTRALIA'].includes(value);
};