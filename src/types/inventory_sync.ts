/**
 * RHY_047: Inventory Synchronization Types
 * Enterprise-grade TypeScript definitions for inventory synchronization system
 * Supports multi-warehouse operations and real-time data consistency
 */

// Core sync request and response types
export interface InventorySyncRequest {
  warehouseId: string
  products: ProductSyncData[]
  syncType: SyncType
  priority: SyncPriority
  metadata?: Record<string, any>
}

export interface InventorySyncResult {
  syncId: string
  status: SyncStatus
  warehouseRegion: string
  synchronized: number
  failed: number
  pending: number
  averageProductSyncTime: number
  crossWarehouseSyncTime: number
  crossWarehouseStatus: CrossWarehouseSyncStatus['status']
  completedRegions: string[]
  pendingRegions: string[]
  nextSyncWindow: Date
  estimatedCompletion: Date
  failedProducts?: Array<{
    productId: string
    error: string
  }>
  metadata?: Record<string, any>
}

// Bulk synchronization types
export interface BulkSyncRequest {
  warehouses: string[]
  operation: BulkSyncOperation
  includeMetrics: boolean
  maxRetries: number
  requestedBy: string
  metadata?: Record<string, any>
}

export interface BulkSyncResult {
  bulkSyncId: string
  status: SyncStatus
  warehouseResults: WarehouseBulkSyncResult[]
  successful: number
  failed: number
  pending: number
  averageWarehouseSyncTime: number
  crossRegionSyncTime: number
  estimatedCompletion: Date
  nextScheduledSync: Date
}

export interface WarehouseBulkSyncResult {
  warehouseId: string
  status: SyncStatus
  syncedProducts: number
  failedProducts: number
  duration: number
  error?: string
}

// Product sync data structure
export interface ProductSyncData {
  productId: string
  quantity: number
  location?: string
  batchNumber?: string
  expiryDate?: string
  cost?: number
  metadata?: {
    productType?: 'FLEXVOLT_BATTERY' | 'ACCESSORY' | 'TOOL'
    capacity?: '6Ah' | '9Ah' | '15Ah'
    region?: string
    priority?: SyncPriority
    isRushOrder?: boolean
    isComplex?: boolean
    supplierInfo?: {
      supplierId: string
      companyName: string
      tier: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE'
    }
    compliance?: {
      gdpr?: boolean
      osha?: boolean
      jis?: boolean
      ce?: boolean
    }
    [key: string]: any
  }
}

// Inventory item structure
export interface InventoryItem {
  id: string
  productId: string
  warehouseId: string
  quantity: number
  location?: string
  batchNumber?: string
  expiryDate?: Date
  cost?: number
  lastUpdated: Date
  updatedBy: string
  status: InventoryStatus
  metadata?: Record<string, any>
}

// Sync status and configuration types
export type SyncType = 'IMMEDIATE' | 'BATCH' | 'SCHEDULED'
export type SyncPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type SyncStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'CANCELLED'
export type BulkSyncOperation = 'SYNC_ALL' | 'SYNC_CRITICAL' | 'SYNC_DELTA'
export type ConflictResolution = 'LAST_WRITE_WINS' | 'MANUAL' | 'PRIORITY_BASED'
export type InventoryStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' | 'RESERVED'

// Configuration and validation types
export interface SyncConfiguration {
  autoResolveConflicts: boolean
  maxRetryAttempts: number
  timeoutMs: number
  batchSize: number
  conflictResolution: ConflictResolution
  enableCrossWarehouseSync: boolean
  syncInterval: number
  priorityOverrides?: Record<string, SyncPriority>
}

export interface SyncValidationResult {
  isValid: boolean
  validProducts: ProductSyncData[]
  invalidProducts: Array<{
    product: ProductSyncData
    errors: string[]
  }>
  warnings: string[]
  summary: {
    total: number
    valid: number
    invalid: number
    warnings: number
  }
}

// Warehouse and regional types
export interface WarehouseRegion {
  timezone: string
  currency: string
  workingHours: {
    start: number
    end: number
  }
}

export interface CrossWarehouseSyncStatus {
  status: 'NOT_REQUIRED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED'
  completedRegions: string[]
  pendingRegions: string[]
  crossWarehouseSyncTime: number
}

// Status and monitoring types
export interface SyncStatus {
  syncId: string
  status: SyncStatus
  warehouse: {
    id: string
    name: string
    region: string
    code: string
    status: string
  }
  progress: number
  productCount: number
  syncedProducts: number
  failedProducts: number
  syncType: SyncType
  priority: SyncPriority
  startedAt: Date
  completedAt?: Date
  duration?: number
  crossWarehouseStatus?: CrossWarehouseSyncStatus['status']
  errorMessage?: string
  results?: {
    successful: any[]
    failed: any[]
    crossWarehouse: CrossWarehouseSyncStatus
  }
  metadata?: Record<string, any>
}

export interface WarehouseSyncStatus {
  warehouseId: string
  warehouse: {
    id: string
    name: string
    region: string
    code: string
    status: string
  }
  activeSyncs: number
  lastSyncAt?: Date
  lastSyncStatus: SyncStatus['status'] | 'NONE'
  recentSyncs: Array<{
    id: string
    status: SyncStatus['status']
    syncType: SyncType
    priority: SyncPriority
    productCount: number
    syncedProducts: number
    failedProducts: number
    startedAt: Date
    completedAt?: Date
    duration?: number
    crossWarehouseStatus?: CrossWarehouseSyncStatus['status']
  }>
  metrics?: SyncMetrics
}

export interface GlobalSyncStatus {
  totalWarehouses: number
  warehouseStatuses: WarehouseSyncStatus[]
  totalActiveSyncs: number
  recentActivity: Array<{
    id: string
    warehouseId: string
    warehouse: {
      id: string
      name: string
      region: string
      code: string
    }
    status: SyncStatus['status']
    syncType: SyncType
    priority: SyncPriority
    productCount: number
    syncedProducts: number
    failedProducts: number
    startedAt: Date
    completedAt?: Date
    duration?: number
  }>
  globalMetrics?: SyncMetrics
}

// Metrics and analytics types
export interface SyncMetrics {
  totalSyncs: number
  averageDuration: number
  totalProductsSynced: number
  totalProductsFailed: number
  successRate: number
  period: string
}

export interface SyncPerformanceMetrics {
  averageSyncTime: number
  successRate: number
  throughput: number // products per hour
}

export interface SyncTrends {
  syncFrequency: 'INCREASING' | 'STABLE' | 'DECREASING'
  errorRate: 'IMPROVING' | 'STABLE' | 'DEGRADING'
  peakHours: number[]
}

export interface SyncInsights {
  performance: SyncPerformanceMetrics
  trends: SyncTrends
  recommendations: string[]
  alerts: Array<{
    severity: 'INFO' | 'WARNING' | 'CRITICAL'
    message: string
  }>
}

// Advanced sync operation types
export interface SyncBatch {
  batchId: string
  products: ProductSyncData[]
  priority: SyncPriority
  estimatedDuration: number
  region?: string
}

export interface SyncConflict {
  productId: string
  warehouseId: string
  localData: InventoryItem
  remoteData: InventoryItem
  conflictType: 'QUANTITY_MISMATCH' | 'LOCATION_CONFLICT' | 'METADATA_CONFLICT' | 'TIMESTAMP_CONFLICT'
  resolution: {
    strategy: ConflictResolution
    resolved: InventoryItem
    reason: string
    requiresManualReview: boolean
  }
}

export interface CrossWarehouseSyncOrder {
  warehouseId: string
  region: string
  priority: number
  syncWindow: 'IMMEDIATE' | 'BUSINESS_HOURS' | 'OFF_HOURS'
  estimatedDelay: number
}

// Real-time sync monitoring types
export interface SyncProgressUpdate {
  syncId: string
  progress: number
  currentBatch?: number
  totalBatches?: number
  syncedProducts: number
  failedProducts: number
  estimatedCompletion: Date
  currentOperation: string
}

export interface SyncHealthCheck {
  timestamp: Date
  overallHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  activeConnections: number
  queueLength: number
  averageLatency: number
  errorRate: number
  memoryUsage: number
  warnings: string[]
  errors: string[]
}

// Event types for real-time updates
export interface SyncEvent {
  type: 'SYNC_STARTED' | 'SYNC_PROGRESS' | 'SYNC_COMPLETED' | 'SYNC_FAILED' | 'SYNC_CANCELLED'
  syncId: string
  timestamp: Date
  data: any
}

export interface InventoryChangeEvent {
  type: 'INVENTORY_UPDATED' | 'INVENTORY_ADDED' | 'INVENTORY_REMOVED'
  warehouseId: string
  productId: string
  timestamp: Date
  changes: {
    before?: Partial<InventoryItem>
    after?: Partial<InventoryItem>
  }
  metadata?: Record<string, any>
}

// API response types
export interface SyncApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  timestamp: string
}

export interface SyncApiErrorResponse {
  success: false
  error: string
  code: string
  timestamp: string
  details?: Record<string, any>
}

// Database model types for sync operations
export interface SyncRecord {
  id: string
  warehouseId: string
  status: SyncStatus
  syncType: SyncType
  priority: SyncPriority
  productCount: number
  syncedProducts: number
  failedProducts: number
  progress: number
  requestedBy: string
  startedAt: Date
  completedAt?: Date
  duration?: number
  crossWarehouseStatus?: CrossWarehouseSyncStatus['status']
  errorMessage?: string
  results?: Record<string, any>
  metadata: Record<string, any>
}

export interface BulkSyncRecord {
  id: string
  operation: BulkSyncOperation
  warehouseIds: string[]
  status: SyncStatus
  requestedBy: string
  successfulWarehouses?: number
  failedWarehouses?: number
  startedAt: Date
  completedAt?: Date
  duration?: number
  errorMessage?: string
  results?: Record<string, any>
  metadata: Record<string, any>
}

// Enhanced FlexVolt business types
export interface FlexVoltProduct {
  id: string
  sku: string
  name: string
  capacity: '6Ah' | '9Ah' | '15Ah'
  voltage: '20V' | '60V'
  price: number
  category: 'BATTERY' | 'CHARGER' | 'TOOL'
  specifications: {
    runtime: number // hours
    grade: 'PROFESSIONAL' | 'HEAVY_DUTY' | 'INDUSTRIAL'
    compatibility: string[]
    warranty: number // months
  }
  inventory: {
    warehouseId: string
    quantity: number
    minStockLevel: number
    maxStockLevel: number
    reorderPoint: number
    status: InventoryStatus
  }[]
}

export interface VolumeDiscount {
  threshold: number
  discountPercentage: number
  tierName: string
  eligibleCustomerTypes: string[]
}

export interface RegionalComplianceInfo {
  region: string
  standards: string[]
  certifications: string[]
  restrictions: string[]
  dataResidency: boolean
}

// Export utility type helpers
export type SyncRequestPayload = Omit<InventorySyncRequest, 'metadata'> & {
  metadata?: Record<string, any>
}

export type SyncStatusUpdate = Pick<SyncStatus, 'syncId' | 'status' | 'progress' | 'syncedProducts' | 'failedProducts'>

export type WarehouseInventorySnapshot = {
  warehouseId: string
  timestamp: Date
  totalProducts: number
  totalQuantity: number
  lowStockItems: number
  outOfStockItems: number
  overstockItems: number
  valueAtCost: number
  valueAtRetail: number
}