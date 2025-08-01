/**
 * RHY_050: Inventory Mobile Interface Types
 * Enterprise-grade mobile inventory management for multi-warehouse FlexVolt operations
 * Integrates with Batch 1 authentication and warehouse systems
 */

import { z } from 'zod';

// ===================================
// CORE MOBILE INVENTORY TYPES
// ===================================

export interface MobileInventoryItem {
  id: string;
  productId: string;
  warehouseId: string;
  sku: string;
  name: string;
  category: 'FLEXVOLT_6AH' | 'FLEXVOLT_9AH' | 'FLEXVOLT_15AH' | 'ACCESSORY';
  barcode?: string;
  qrCode?: string;
  
  // Stock Information
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  
  // Pricing (FlexVolt specific)
  unitPrice: number; // $95, $125, $245
  totalValue: number;
  currency: 'USD' | 'JPY' | 'EUR' | 'AUD';
  
  // Location & Status
  binLocation: string;
  zone: string;
  aisle?: string;
  shelf?: string;
  position?: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' | 'DAMAGED' | 'QUARANTINE';
  
  // Mobile-specific fields
  lastScanned?: Date;
  lastMovement?: Date;
  lastCounted?: Date;
  batteryLevel?: number; // For tracking device battery during mobile operations
  
  // Compliance & Tracking
  complianceRegion: 'US' | 'JP' | 'EU' | 'AU';
  certifications: string[];
  batchNumber?: string;
  serialNumbers?: string[];
  expirationDate?: Date;
  hazardousClassification?: string;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
  createdBy: string;
}

export interface MobileInventoryOperation {
  id: string;
  type: 'SCAN' | 'COUNT' | 'MOVE' | 'ADJUST' | 'RECEIVE' | 'SHIP' | 'CYCLE_COUNT' | 'AUDIT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  
  // User & Session
  userId: string;
  userRole: 'OPERATOR' | 'MANAGER' | 'ADMIN';
  sessionId: string;
  deviceId: string;
  deviceType: 'MOBILE' | 'TABLET' | 'HANDHELD_SCANNER' | 'SMART_GLASSES';
  
  // Warehouse & Location
  warehouseId: string;
  warehouseRegion: 'US' | 'JP' | 'EU' | 'AU';
  sourceLocation?: string;
  targetLocation?: string;
  zone?: string;
  
  // Items involved
  items: Array<{
    productId: string;
    sku: string;
    quantity: number;
    previousQuantity?: number;
    scannedAt?: Date;
    notes?: string;
  }>;
  
  // Operation details
  notes?: string;
  startedAt: Date;
  completedAt?: Date;
  estimatedDuration?: number; // minutes
  actualDuration?: number;
  
  // Geolocation (for mobile tracking)
  geoLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  
  // Offline support
  isOffline: boolean;
  syncStatus: 'SYNCED' | 'PENDING_SYNC' | 'SYNC_FAILED' | 'OFFLINE';
  offlineData?: any;
  
  // Audit & Compliance
  auditTrail: Array<{
    action: string;
    timestamp: Date;
    userId: string;
    details: any;
  }>;
  
  metadata: {
    version: string;
    source: 'MOBILE_APP' | 'TABLET_APP' | 'SCANNER' | 'API';
    connectionType?: 'WIFI' | 'CELLULAR' | 'OFFLINE';
    errorCount?: number;
    lastError?: string;
  };
}

export interface QuickScanResult {
  success: boolean;
  scannedCode: string;
  codeType: 'BARCODE' | 'QR_CODE' | 'RFID' | 'MANUAL_ENTRY';
  item?: MobileInventoryItem;
  suggestions?: MobileInventoryItem[];
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  scanDuration: number; // milliseconds
  confidence: number; // 0-100%
  location?: {
    warehouseId: string;
    zone?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  timestamp: Date;
}

export interface MobileInventoryFilter {
  warehouseId?: string;
  category?: string[];
  status?: string[];
  location?: {
    zone?: string;
    aisle?: string;
    shelf?: string;
  };
  stockLevel?: 'ALL' | 'LOW' | 'OUT' | 'NORMAL' | 'OVERSTOCK';
  priceRange?: {
    min: number;
    max: number;
  };
  lastScanned?: {
    since: Date;
    until?: Date;
  };
  searchTerm?: string;
  sortBy?: 'name' | 'sku' | 'quantity' | 'lastScanned' | 'location' | 'value';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface MobileInventoryBatch {
  id: string;
  operationType: 'BULK_SCAN' | 'CYCLE_COUNT' | 'INVENTORY_AUDIT' | 'STOCK_TAKE';
  status: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED';
  
  // Batch details
  name: string;
  description?: string;
  warehouseId: string;
  zone?: string;
  
  // Progress tracking
  totalItems: number;
  processedItems: number;
  completedItems: number;
  failedItems: number;
  progressPercentage: number;
  
  // User & timing
  assignedTo: string[];
  createdBy: string;
  startedAt: Date;
  completedAt?: Date;
  estimatedCompletionTime?: Date;
  
  // Items in batch
  items: Array<{
    productId: string;
    sku: string;
    expectedQuantity?: number;
    actualQuantity?: number;
    status: 'PENDING' | 'SCANNED' | 'VERIFIED' | 'DISCREPANCY' | 'FAILED';
    scannedAt?: Date;
    scannedBy?: string;
    notes?: string;
    discrepancyReason?: string;
  }>;
  
  // Results summary
  summary?: {
    totalValue: number;
    discrepancies: number;
    accuracyPercentage: number;
    timeToComplete: number;
    averageTimePerItem: number;
  };
  
  // Offline support
  syncStatus: 'SYNCED' | 'PENDING_SYNC' | 'SYNC_FAILED';
  offlineChanges?: number;
}

// ===================================
// MOBILE DEVICE & SESSION TYPES
// ===================================

export interface MobileDeviceInfo {
  deviceId: string;
  deviceType: 'MOBILE' | 'TABLET' | 'HANDHELD_SCANNER';
  platform: 'iOS' | 'Android' | 'Windows';
  osVersion: string;
  appVersion: string;
  batteryLevel: number;
  storageAvailable: number; // MB
  connectionType: 'WIFI' | 'CELLULAR' | 'OFFLINE';
  connectionSpeed?: 'SLOW' | 'MODERATE' | 'FAST';
  gpsEnabled: boolean;
  cameraEnabled: boolean;
  bluetoothEnabled: boolean;
  lastHeartbeat: Date;
  
  // Capabilities
  supportedScanTypes: ('BARCODE' | 'QR_CODE' | 'RFID' | 'OCR')[];
  maxBatchSize: number;
  offlineCapacity: number; // Number of operations that can be stored offline
  
  // Performance metrics
  avgScanTime: number; // milliseconds
  scanAccuracy: number; // percentage
  syncSuccessRate: number; // percentage
}

export interface MobileSession {
  sessionId: string;
  userId: string;
  deviceId: string;
  warehouseId: string;
  startTime: Date;
  endTime?: Date;
  
  // Session activity
  operationsCount: number;
  itemsScanned: number;
  errorsEncountered: number;
  averageOperationTime: number;
  
  // Location tracking
  locations: Array<{
    zone: string;
    timestamp: Date;
    duration: number; // seconds
  }>;
  
  // Performance
  batteryUsage: number; // percentage consumed
  dataUsage: number; // MB
  syncEvents: number;
  offlineTime: number; // minutes spent offline
  
  isActive: boolean;
  lastActivity: Date;
}

// ===================================
// API REQUEST/RESPONSE TYPES
// ===================================

export interface ScanItemRequest {
  code: string;
  codeType: 'BARCODE' | 'QR_CODE' | 'RFID' | 'MANUAL_ENTRY';
  location?: {
    warehouseId: string;
    zone?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  deviceInfo: Pick<MobileDeviceInfo, 'deviceId' | 'batteryLevel' | 'connectionType'>;
}

export interface UpdateInventoryRequest {
  items: Array<{
    productId: string;
    quantity: number;
    operation: 'SET' | 'ADD' | 'SUBTRACT';
    location?: string;
    notes?: string;
  }>;
  batchId?: string;
  reason: string;
  deviceInfo: Pick<MobileDeviceInfo, 'deviceId' | 'connectionType'>;
}

export interface StartBatchOperationRequest {
  operationType: MobileInventoryBatch['operationType'];
  name: string;
  description?: string;
  warehouseId: string;
  zone?: string;
  items?: Array<{
    productId: string;
    expectedQuantity?: number;
  }>;
}

export interface MobileInventoryResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
    requestId: string;
  };
  metadata: {
    timestamp: Date;
    requestId: string;
    processingTime: number; // milliseconds
    warehouseId?: string;
    version: string;
    rateLimit?: {
      remaining: number;
      resetTime: Date;
    };
  };
}

// ===================================
// VALIDATION SCHEMAS
// ===================================

export const mobileInventoryItemSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  category: z.enum(['FLEXVOLT_6AH', 'FLEXVOLT_9AH', 'FLEXVOLT_15AH', 'ACCESSORY']),
  barcode: z.string().optional(),
  qrCode: z.string().optional(),
  quantity: z.number().min(0),
  availableQuantity: z.number().min(0),
  reservedQuantity: z.number().min(0),
  minStockLevel: z.number().min(0),
  maxStockLevel: z.number().positive(),
  reorderPoint: z.number().min(0),
  unitPrice: z.number().positive(),
  totalValue: z.number().min(0),
  currency: z.enum(['USD', 'JPY', 'EUR', 'AUD']),
  binLocation: z.string().min(1).max(50),
  zone: z.string().min(1).max(50),
  aisle: z.string().max(20).optional(),
  shelf: z.string().max(20).optional(),
  position: z.string().max(20).optional(),
  status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCK', 'DAMAGED', 'QUARANTINE']),
  complianceRegion: z.enum(['US', 'JP', 'EU', 'AU']),
  certifications: z.array(z.string()),
  batchNumber: z.string().optional(),
  serialNumbers: z.array(z.string()).optional(),
  expirationDate: z.date().optional(),
  lastScanned: z.date().optional(),
  lastMovement: z.date().optional(),
  lastCounted: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  updatedBy: z.string().uuid(),
  createdBy: z.string().uuid()
});

export const scanItemRequestSchema = z.object({
  code: z.string().min(1).max(100),
  codeType: z.enum(['BARCODE', 'QR_CODE', 'RFID', 'MANUAL_ENTRY']),
  location: z.object({
    warehouseId: z.string().uuid(),
    zone: z.string().optional(),
    coordinates: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    }).optional()
  }).optional(),
  deviceInfo: z.object({
    deviceId: z.string(),
    batteryLevel: z.number().min(0).max(100),
    connectionType: z.enum(['WIFI', 'CELLULAR', 'OFFLINE'])
  })
});

export const updateInventoryRequestSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().min(0),
    operation: z.enum(['SET', 'ADD', 'SUBTRACT']),
    location: z.string().max(50).optional(),
    notes: z.string().max(500).optional()
  })).min(1).max(100),
  batchId: z.string().uuid().optional(),
  reason: z.string().min(1).max(200),
  deviceInfo: z.object({
    deviceId: z.string(),
    connectionType: z.enum(['WIFI', 'CELLULAR', 'OFFLINE'])
  })
});

export const mobileInventoryFilterSchema = z.object({
  warehouseId: z.string().uuid().optional(),
  category: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  location: z.object({
    zone: z.string().optional(),
    aisle: z.string().optional(),
    shelf: z.string().optional()
  }).optional(),
  stockLevel: z.enum(['ALL', 'LOW', 'OUT', 'NORMAL', 'OVERSTOCK']).optional(),
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().positive()
  }).optional(),
  lastScanned: z.object({
    since: z.date(),
    until: z.date().optional()
  }).optional(),
  searchTerm: z.string().max(100).optional(),
  sortBy: z.enum(['name', 'sku', 'quantity', 'lastScanned', 'location', 'value']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().positive().max(100).optional(),
  offset: z.number().min(0).optional()
});

// ===================================
// UTILITY FUNCTIONS
// ===================================

export const mobileInventoryUtils = {
  // Calculate stock status based on levels
  calculateStockStatus: (
    quantity: number,
    minLevel: number,
    maxLevel: number
  ): MobileInventoryItem['status'] => {
    if (quantity === 0) return 'OUT_OF_STOCK';
    if (quantity <= minLevel) return 'LOW_STOCK';
    if (quantity >= maxLevel) return 'OVERSTOCK';
    return 'IN_STOCK';
  },

  // Get FlexVolt pricing by category
  getFlexVoltPrice: (category: MobileInventoryItem['category']): number => {
    const prices = {
      FLEXVOLT_6AH: 95,
      FLEXVOLT_9AH: 125,
      FLEXVOLT_15AH: 245,
      ACCESSORY: 0 // Variable pricing
    };
    return prices[category];
  },

  // Calculate total value
  calculateTotalValue: (unitPrice: number, quantity: number): number => {
    return parseFloat((unitPrice * quantity).toFixed(2));
  },

  // Generate mobile-friendly location string
  formatLocation: (item: Pick<MobileInventoryItem, 'zone' | 'aisle' | 'shelf' | 'position'>): string => {
    const parts = [item.zone];
    if (item.aisle) parts.push(item.aisle);
    if (item.shelf) parts.push(item.shelf);
    if (item.position) parts.push(item.position);
    return parts.join('-');
  },

  // Validate scan code format
  validateScanCode: (code: string, type: QuickScanResult['codeType']): boolean => {
    const patterns = {
      BARCODE: /^[0-9]{8,14}$/, // UPC/EAN format
      QR_CODE: /^[A-Z0-9\-]+$/, // Alphanumeric QR codes
      RFID: /^[A-F0-9]{16,32}$/, // Hex RFID tags
      MANUAL_ENTRY: /^.{1,50}$/ // Any manual entry up to 50 chars
    };
    return patterns[type].test(code);
  },

  // Generate batch operation ID
  generateBatchId: (warehouseId: string, operationType: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${warehouseId.substring(0, 8)}-${operationType}-${timestamp}-${random}`.toUpperCase();
  },

  // Check if device supports offline operations
  supportsOfflineMode: (device: MobileDeviceInfo): boolean => {
    return device.offlineCapacity > 0 && device.storageAvailable > 100; // At least 100MB free
  },

  // Calculate sync priority based on operation type
  getSyncPriority: (operation: MobileInventoryOperation): number => {
    const priorities = {
      AUDIT: 1, // Highest priority
      ADJUST: 2,
      RECEIVE: 3,
      SHIP: 3,
      MOVE: 4,
      COUNT: 5,
      CYCLE_COUNT: 6,
      SCAN: 7 // Lowest priority
    };
    return priorities[operation.type] || 5;
  }
};

// ===================================
// ERROR TYPES
// ===================================

export class MobileInventoryError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'MobileInventoryError';
  }
}

export class ScanError extends MobileInventoryError {
  constructor(message: string, details?: any) {
    super(message, 'SCAN_ERROR', 400, details);
    this.name = 'ScanError';
  }
}

export class SyncError extends MobileInventoryError {
  constructor(message: string, details?: any) {
    super(message, 'SYNC_ERROR', 502, details);
    this.name = 'SyncError';
  }
}

export class OfflineError extends MobileInventoryError {
  constructor(message: string, details?: any) {
    super(message, 'OFFLINE_ERROR', 503, details);
    this.name = 'OfflineError';
  }
}

// ===================================
// EXPORT ALL TYPES
// ===================================

export type {
  MobileInventoryItem,
  MobileInventoryOperation,
  QuickScanResult,
  MobileInventoryFilter,
  MobileInventoryBatch,
  MobileDeviceInfo,
  MobileSession,
  ScanItemRequest,
  UpdateInventoryRequest,
  StartBatchOperationRequest,
  MobileInventoryResponse
};

// Validation exports
export {
  mobileInventoryItemSchema,
  scanItemRequestSchema,
  updateInventoryRequestSchema,
  mobileInventoryFilterSchema
};