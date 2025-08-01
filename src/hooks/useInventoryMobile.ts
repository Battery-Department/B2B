/**
 * RHY_050: Use Inventory Mobile Hook
 * Enterprise-grade React hook for mobile inventory management
 * Provides state management, real-time sync, and offline capabilities
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MobileInventoryItem,
  MobileInventoryOperation,
  MobileInventoryFilter,
  MobileInventoryBatch,
  MobileDeviceInfo,
  QuickScanResult,
  ScanItemRequest,
  UpdateInventoryRequest,
  MobileInventoryResponse,
  MobileInventoryError,
  ScanError,
  SyncError,
  OfflineError
} from '@/types/inventory_mobile';
import { enhancedInventoryMobileService } from '@/services/inventory_mobile/EnhancedInventoryMobileService';
import { createBarcodeScanner, BarcodeScanner } from '@/lib/barcode-scanner';

// ===================================
// HOOK STATE INTERFACES
// ===================================

export interface InventoryMobileState {
  // Inventory data
  items: MobileInventoryItem[];
  currentItem: MobileInventoryItem | null;
  total: number;
  hasMore: boolean;
  
  // Loading states
  isLoading: boolean;
  isScanning: boolean;
  isSyncing: boolean;
  isUpdating: boolean;
  
  // Filters and pagination
  filters: MobileInventoryFilter;
  page: number;
  limit: number;
  
  // Batch operations
  currentBatch: MobileInventoryBatch | null;
  batchProgress: number;
  
  // Scanner state
  scannerCapabilities: any;
  lastScanResult: QuickScanResult | null;
  
  // Offline state
  isOffline: boolean;
  pendingSyncCount: number;
  lastSyncTime: Date | null;
  
  // Aggregations
  aggregations: {
    totalValue: number;
    categoryBreakdown: Record<string, number>;
    statusBreakdown: Record<string, number>;
    lowStockCount: number;
  };
  
  // Error state
  error: string | null;
  lastError: MobileInventoryError | null;
}

export interface InventoryMobileActions {
  // Data operations
  loadInventory: (filters?: MobileInventoryFilter) => Promise<void>;
  refreshInventory: () => Promise<void>;
  loadMore: () => Promise<void>;
  
  // Item operations
  scanItem: (request: ScanItemRequest) => Promise<QuickScanResult>;
  updateItems: (request: UpdateInventoryRequest) => Promise<void>;
  selectItem: (item: MobileInventoryItem | null) => void;
  
  // Search and filtering
  setFilters: (filters: Partial<MobileInventoryFilter>) => void;
  clearFilters: () => void;
  searchItems: (searchTerm: string) => Promise<void>;
  
  // Batch operations
  startBatch: (operationType: string, name: string, items?: any[]) => Promise<void>;
  completeBatch: () => Promise<void>;
  cancelBatch: () => void;
  
  // Scanner operations
  startScanner: () => Promise<void>;
  stopScanner: () => void;
  toggleFlashlight: () => Promise<void>;
  
  // Sync operations
  syncOfflineData: () => Promise<void>;
  enableOfflineMode: () => void;
  disableOfflineMode: () => void;
  
  // Error handling
  clearError: () => void;
  retryLastOperation: () => Promise<void>;
}

// ===================================
// MAIN HOOK IMPLEMENTATION
// ===================================

export function useInventoryMobile(
  warehouseId?: string,
  userId?: string
): InventoryMobileState & InventoryMobileActions {
  
  // Core state
  const [state, setState] = useState<InventoryMobileState>({
    items: [],
    currentItem: null,
    total: 0,
    hasMore: false,
    
    isLoading: false,
    isScanning: false,
    isSyncing: false,
    isUpdating: false,
    
    filters: {},
    page: 1,
    limit: 25,
    
    currentBatch: null,
    batchProgress: 0,
    
    scannerCapabilities: null,
    lastScanResult: null,
    
    isOffline: false,
    pendingSyncCount: 0,
    lastSyncTime: null,
    
    aggregations: {
      totalValue: 0,
      categoryBreakdown: {},
      statusBreakdown: {},
      lowStockCount: 0
    },
    
    error: null,
    lastError: null
  });
  
  // Refs for cleanup and persistence
  const scannerRef = useRef<BarcodeScanner | null>(null);
  const lastOperationRef = useRef<(() => Promise<void>) | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ===================================
  // INITIALIZATION AND CLEANUP
  // ===================================

  useEffect(() => {
    initializeHook();
    return cleanup;
  }, [warehouseId, userId]);

  const initializeHook = useCallback(async () => {
    try {
      // Initialize barcode scanner
      scannerRef.current = createBarcodeScanner({
        enableSound: true,
        enableVibration: true,
        scanTimeout: 10000
      });
      
      await scannerRef.current.initialize();
      
      setState(prev => ({
        ...prev,
        scannerCapabilities: scannerRef.current?.getCapabilities()
      }));

      // Set up offline detection
      setupOfflineDetection();
      
      // Set up automatic sync
      setupAutoSync();
      
      // Load initial inventory if warehouse and user are provided
      if (warehouseId && userId) {
        await loadInventory();
      }
      
    } catch (error) {
      console.error('Failed to initialize inventory mobile hook', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to initialize mobile inventory',
        lastError: error instanceof MobileInventoryError ? error : 
                  new MobileInventoryError('Initialization failed', 'INIT_ERROR')
      }));
    }
  }, [warehouseId, userId]);

  const cleanup = useCallback(() => {
    // Stop scanner
    if (scannerRef.current) {
      scannerRef.current.stopScan();
    }
    
    // Clear intervals and timeouts
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, []);

  // ===================================
  // DATA OPERATIONS
  // ===================================

  const loadInventory = useCallback(async (filters?: MobileInventoryFilter) => {
    if (!userId) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }));
      return;
    }

    lastOperationRef.current = () => loadInventory(filters);
    
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      ...(filters && { filters, page: 1 })
    }));

    try {
      const response = await enhancedInventoryMobileService.getMobileInventory(
        { ...state.filters, ...filters, warehouseId },
        userId,
        warehouseId
      );

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          items: response.data!.items,
          total: response.data!.total,
          hasMore: response.data!.hasMore,
          aggregations: response.data!.aggregations,
          isLoading: false,
          lastSyncTime: new Date()
        }));
      } else {
        throw new MobileInventoryError('Failed to load inventory', 'LOAD_ERROR');
      }

    } catch (error) {
      handleError(error as Error, 'Failed to load inventory');
    }
  }, [userId, warehouseId, state.filters]);

  const refreshInventory = useCallback(async () => {
    await loadInventory(state.filters);
  }, [loadInventory, state.filters]);

  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.isLoading || !userId) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await enhancedInventoryMobileService.getMobileInventory(
        { 
          ...state.filters, 
          warehouseId,
          offset: state.items.length,
          limit: state.limit 
        },
        userId,
        warehouseId
      );

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          items: [...prev.items, ...response.data!.items],
          hasMore: response.data!.hasMore,
          isLoading: false
        }));
      }

    } catch (error) {
      handleError(error as Error, 'Failed to load more items');
    }
  }, [state.hasMore, state.isLoading, state.filters, state.items.length, state.limit, userId, warehouseId]);

  // ===================================
  // ITEM OPERATIONS
  // ===================================

  const scanItem = useCallback(async (request: ScanItemRequest): Promise<QuickScanResult> => {
    if (!userId) {
      throw new ScanError('User not authenticated');
    }

    lastOperationRef.current = () => scanItem(request);
    
    setState(prev => ({ ...prev, isScanning: true, error: null }));

    try {
      const deviceInfo: MobileDeviceInfo = {
        deviceId: 'mobile_device_001', // Would get from device
        deviceType: 'MOBILE',
        platform: 'iOS', // Would detect actual platform
        osVersion: '16.0',
        appVersion: '1.0.0',
        batteryLevel: 85, // Would get from device
        storageAvailable: 1024,
        connectionType: state.isOffline ? 'OFFLINE' : 'WIFI',
        gpsEnabled: true,
        cameraEnabled: true,
        bluetoothEnabled: true,
        lastHeartbeat: new Date(),
        supportedScanTypes: ['BARCODE', 'QR_CODE'],
        maxBatchSize: 100,
        offlineCapacity: 500,
        avgScanTime: 2000,
        scanAccuracy: 95,
        syncSuccessRate: 98
      };

      const response = await enhancedInventoryMobileService.scanItem(
        request,
        userId,
        deviceInfo
      );

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          lastScanResult: response.data!,
          isScanning: false,
          currentItem: response.data!.item || null
        }));
        
        return response.data;
      } else {
        throw new ScanError('Scan failed');
      }

    } catch (error) {
      setState(prev => ({ ...prev, isScanning: false }));
      handleError(error as Error, 'Failed to scan item');
      throw error;
    }
  }, [userId, state.isOffline]);

  const updateItems = useCallback(async (request: UpdateInventoryRequest) => {
    if (!userId) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }));
      return;
    }

    lastOperationRef.current = () => updateItems(request);
    
    setState(prev => ({ ...prev, isUpdating: true, error: null }));

    try {
      const deviceInfo: MobileDeviceInfo = {
        deviceId: 'mobile_device_001',
        deviceType: 'MOBILE',
        platform: 'iOS',
        osVersion: '16.0',
        appVersion: '1.0.0',
        batteryLevel: 85,
        storageAvailable: 1024,
        connectionType: state.isOffline ? 'OFFLINE' : 'WIFI',
        gpsEnabled: true,
        cameraEnabled: true,
        bluetoothEnabled: true,
        lastHeartbeat: new Date(),
        supportedScanTypes: ['BARCODE', 'QR_CODE'],
        maxBatchSize: 100,
        offlineCapacity: 500,
        avgScanTime: 2000,
        scanAccuracy: 95,
        syncSuccessRate: 98
      };

      const response = await enhancedInventoryMobileService.updateInventory(
        request,
        userId,
        deviceInfo
      );

      if (response.success && response.data) {
        // Update items in state
        setState(prev => {
          const updatedItems = prev.items.map(item => {
            const updatedItem = response.data!.updated.find(u => u.id === item.id);
            return updatedItem || item;
          });
          
          return {
            ...prev,
            items: updatedItems,
            isUpdating: false,
            lastSyncTime: new Date()
          };
        });

        // Show success message for failed items
        if (response.data.failed.length > 0) {
          console.warn('Some items failed to update', response.data.failed);
        }

      } else {
        throw new MobileInventoryError('Update failed', 'UPDATE_ERROR');
      }

    } catch (error) {
      handleError(error as Error, 'Failed to update items');
    }
  }, [userId, state.isOffline]);

  const selectItem = useCallback((item: MobileInventoryItem | null) => {
    setState(prev => ({ ...prev, currentItem: item }));
  }, []);

  // ===================================
  // SEARCH AND FILTERING
  // ===================================

  const setFilters = useCallback((filters: Partial<MobileInventoryFilter>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      page: 1
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {},
      page: 1
    }));
  }, []);

  const searchItems = useCallback(async (searchTerm: string) => {
    await loadInventory({ ...state.filters, searchTerm });
  }, [loadInventory, state.filters]);

  // ===================================
  // BATCH OPERATIONS
  // ===================================

  const startBatch = useCallback(async (
    operationType: string, 
    name: string, 
    items?: any[]
  ) => {
    if (!userId || !warehouseId) {
      setState(prev => ({ ...prev, error: 'Missing required parameters' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const deviceInfo: MobileDeviceInfo = {
        deviceId: 'mobile_device_001',
        deviceType: 'MOBILE',
        platform: 'iOS',
        osVersion: '16.0',
        appVersion: '1.0.0',
        batteryLevel: 85,
        storageAvailable: 1024,
        connectionType: state.isOffline ? 'OFFLINE' : 'WIFI',
        gpsEnabled: true,
        cameraEnabled: true,
        bluetoothEnabled: true,
        lastHeartbeat: new Date(),
        supportedScanTypes: ['BARCODE', 'QR_CODE'],
        maxBatchSize: 100,
        offlineCapacity: 500,
        avgScanTime: 2000,
        scanAccuracy: 95,
        syncSuccessRate: 98
      };

      const response = await enhancedInventoryMobileService.startBatchOperation(
        {
          operationType: operationType as any,
          name,
          warehouseId,
          items
        },
        userId,
        deviceInfo
      );

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          currentBatch: response.data!,
          batchProgress: 0,
          isLoading: false
        }));
      } else {
        throw new MobileInventoryError('Failed to start batch', 'BATCH_ERROR');
      }

    } catch (error) {
      handleError(error as Error, 'Failed to start batch operation');
    }
  }, [userId, warehouseId, state.isOffline]);

  const completeBatch = useCallback(async () => {
    if (!state.currentBatch) return;

    setState(prev => ({
      ...prev,
      currentBatch: null,
      batchProgress: 0
    }));

    // Refresh inventory after batch completion
    await refreshInventory();
  }, [state.currentBatch, refreshInventory]);

  const cancelBatch = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentBatch: null,
      batchProgress: 0
    }));
  }, []);

  // ===================================
  // SCANNER OPERATIONS
  // ===================================

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) {
      throw new ScanError('Scanner not initialized');
    }

    setState(prev => ({ ...prev, isScanning: true, error: null }));

    try {
      await scannerRef.current.startScan(
        (result) => {
          setState(prev => ({
            ...prev,
            lastScanResult: result,
            isScanning: false
          }));
        },
        (error) => {
          setState(prev => ({
            ...prev,
            isScanning: false,
            error: error.message
          }));
        },
        { single: true }
      );

    } catch (error) {
      setState(prev => ({ ...prev, isScanning: false }));
      handleError(error as Error, 'Failed to start scanner');
    }
  }, []);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stopScan();
    }
    setState(prev => ({ ...prev, isScanning: false }));
  }, []);

  const toggleFlashlight = useCallback(async () => {
    if (!scannerRef.current) return;

    try {
      await scannerRef.current.toggleFlashlight();
    } catch (error) {
      console.warn('Failed to toggle flashlight', error);
    }
  }, []);

  // ===================================
  // SYNC OPERATIONS
  // ===================================

  const syncOfflineData = useCallback(async () => {
    if (!userId) return;

    setState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      const response = await enhancedInventoryMobileService.syncOfflineOperations(
        'mobile_device_001',
        userId
      );

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          isSyncing: false,
          pendingSyncCount: 0,
          lastSyncTime: new Date()
        }));

        // Refresh inventory after sync
        await refreshInventory();

        if (response.data.failed > 0) {
          console.warn('Some operations failed to sync', response.data.errors);
        }
      }

    } catch (error) {
      handleError(error as Error, 'Failed to sync offline data');
    }
  }, [userId, refreshInventory]);

  const enableOfflineMode = useCallback(() => {
    setState(prev => ({ ...prev, isOffline: true }));
  }, []);

  const disableOfflineMode = useCallback(() => {
    setState(prev => ({ ...prev, isOffline: false }));
    // Trigger sync when going back online
    syncOfflineData();
  }, [syncOfflineData]);

  // ===================================
  // ERROR HANDLING
  // ===================================

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, lastError: null }));
  }, []);

  const retryLastOperation = useCallback(async () => {
    if (lastOperationRef.current) {
      try {
        await lastOperationRef.current();
      } catch (error) {
        console.error('Retry failed', error);
      }
    }
  }, []);

  const handleError = useCallback((error: Error, context: string) => {
    console.error(`${context}:`, error);
    
    setState(prev => ({
      ...prev,
      isLoading: false,
      isScanning: false,
      isSyncing: false,
      isUpdating: false,
      error: error.message,
      lastError: error instanceof MobileInventoryError ? error : 
                new MobileInventoryError(context, 'HOOK_ERROR', 500, error)
    }));

    // Auto-retry for network errors
    if (error instanceof SyncError || error instanceof OfflineError) {
      retryTimeoutRef.current = setTimeout(() => {
        retryLastOperation();
      }, 5000);
    }
  }, [retryLastOperation]);

  // ===================================
  // UTILITY FUNCTIONS
  // ===================================

  const setupOfflineDetection = useCallback(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }));
      syncOfflineData();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineData]);

  const setupAutoSync = useCallback(() => {
    // Auto-sync every 5 minutes when online
    syncIntervalRef.current = setInterval(() => {
      if (!state.isOffline && state.pendingSyncCount > 0) {
        syncOfflineData();
      }
    }, 5 * 60 * 1000);
  }, [state.isOffline, state.pendingSyncCount, syncOfflineData]);

  // ===================================
  // RETURN HOOK STATE AND ACTIONS
  // ===================================

  return {
    // State
    ...state,
    
    // Actions
    loadInventory,
    refreshInventory,
    loadMore,
    
    scanItem,
    updateItems,
    selectItem,
    
    setFilters,
    clearFilters,
    searchItems,
    
    startBatch,
    completeBatch,
    cancelBatch,
    
    startScanner,
    stopScanner,
    toggleFlashlight,
    
    syncOfflineData,
    enableOfflineMode,
    disableOfflineMode,
    
    clearError,
    retryLastOperation
  };
}

// ===================================
// HELPER HOOKS
// ===================================

/**
 * Hook for quick barcode scanning without full inventory management
 */
export function useQuickScan() {
  const [scanner, setScanner] = useState<BarcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<QuickScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initScanner = async () => {
      try {
        const newScanner = createBarcodeScanner();
        await newScanner.initialize();
        setScanner(newScanner);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Scanner initialization failed');
      }
    };

    initScanner();

    return () => {
      if (scanner) {
        scanner.stopScan();
      }
    };
  }, []);

  const startScan = useCallback(async () => {
    if (!scanner) {
      setError('Scanner not initialized');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      await scanner.startScan(
        (result) => {
          setLastResult(result);
          setIsScanning(false);
        },
        (err) => {
          setError(err.message);
          setIsScanning(false);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
      setIsScanning(false);
    }
  }, [scanner]);

  const stopScan = useCallback(() => {
    if (scanner) {
      scanner.stopScan();
    }
    setIsScanning(false);
  }, [scanner]);

  return {
    isScanning,
    lastResult,
    error,
    startScan,
    stopScan,
    clearError: () => setError(null)
  };
}

/**
 * Hook for managing offline inventory operations
 */
export function useOfflineInventory() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addPendingOperation = useCallback((operation: any) => {
    setPendingOperations(prev => [...prev, operation]);
  }, []);

  const clearPendingOperations = useCallback(() => {
    setPendingOperations([]);
  }, []);

  const syncOperations = useCallback(async () => {
    if (pendingOperations.length === 0) return;

    setSyncStatus('syncing');
    
    try {
      // Sync operations with service
      // Implementation would depend on specific sync requirements
      
      clearPendingOperations();
      setSyncStatus('idle');
    } catch (error) {
      setSyncStatus('error');
      console.error('Sync failed', error);
    }
  }, [pendingOperations, clearPendingOperations]);

  return {
    isOffline,
    pendingOperations,
    syncStatus,
    addPendingOperation,
    clearPendingOperations,
    syncOperations
  };
}