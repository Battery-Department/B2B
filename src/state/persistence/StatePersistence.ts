import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'

// Storage adapters
export interface StorageAdapter {
  getItem: (key: string) => string | null | Promise<string | null>
  setItem: (key: string, value: string) => void | Promise<void>
  removeItem: (key: string) => void | Promise<void>
}

// Local Storage adapter
export const localStorageAdapter: StorageAdapter = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.warn('Failed to read from localStorage:', error)
      return null
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.warn('Failed to write to localStorage:', error)
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error)
    }
  }
}

// Session Storage adapter
export const sessionStorageAdapter: StorageAdapter = {
  getItem: (key: string) => {
    try {
      return sessionStorage.getItem(key)
    } catch (error) {
      console.warn('Failed to read from sessionStorage:', error)
      return null
    }
  },
  setItem: (key: string, value: string) => {
    try {
      sessionStorage.setItem(key, value)
    } catch (error) {
      console.warn('Failed to write to sessionStorage:', error)
    }
  },
  removeItem: (key: string) => {
    try {
      sessionStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to remove from sessionStorage:', error)
    }
  }
}

// IndexedDB adapter for large data
export class IndexedDBAdapter implements StorageAdapter {
  private dbName: string
  private storeName: string
  private version: number
  private db: IDBDatabase | null = null

  constructor(dbName = 'battery-dashboard', storeName = 'state', version = 1) {
    this.dbName = dbName
    this.storeName = storeName
    this.version = version
  }

  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }
    })
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      
      return new Promise((resolve, reject) => {
        const request = store.get(key)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result || null)
      })
    } catch (error) {
      console.warn('Failed to read from IndexedDB:', error)
      return null
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      return new Promise((resolve, reject) => {
        const request = store.put(value, key)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      console.warn('Failed to write to IndexedDB:', error)
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      return new Promise((resolve, reject) => {
        const request = store.delete(key)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      console.warn('Failed to remove from IndexedDB:', error)
    }
  }
}

// Persistence configuration
export interface PersistenceConfig<T> {
  name: string
  storage?: StorageAdapter
  partialize?: (state: T) => Partial<T>
  merge?: (persistedState: Partial<T>, currentState: T) => T
  skipHydration?: boolean
  version?: number
  migrate?: (persistedState: any, version: number) => T
  onRehydrateStorage?: (state: T) => ((state?: T, error?: Error) => void) | void
}

// Enhanced persist middleware with better error handling and migration
export function enhancedPersist<T>(
  config: PersistenceConfig<T>
) {
  return persist<T>(
    (set, get, api) => api,
    {
      name: config.name,
      storage: {
        getItem: async (name: string) => {
          const adapter = config.storage || localStorageAdapter
          const value = await adapter.getItem(name)
          return value ? JSON.parse(value) : null
        },
        setItem: async (name: string, value: any) => {
          const adapter = config.storage || localStorageAdapter
          await adapter.setItem(name, JSON.stringify(value))
        },
        removeItem: async (name: string) => {
          const adapter = config.storage || localStorageAdapter
          await adapter.removeItem(name)
        }
      },
      partialize: config.partialize,
      merge: config.merge,
      skipHydration: config.skipHydration,
      version: config.version || 0,
      migrate: config.migrate,
      onRehydrateStorage: config.onRehydrateStorage
    }
  )
}

// State synchronization across tabs
export interface TabSyncState {
  lastSyncAt: number
  syncKey: string
  
  // Actions
  broadcastUpdate: (data: any) => void
  setupTabSync: (callback: (data: any) => void) => () => void
}

export const useTabSyncStore = create<TabSyncState>()(
  subscribeWithSelector((set, get) => ({
    lastSyncAt: Date.now(),
    syncKey: 'battery-dashboard-sync',
    
    broadcastUpdate: (data) => {
      const state = get()
      const message = {
        type: 'STATE_UPDATE',
        data,
        timestamp: Date.now(),
        tabId: window.name || 'unknown'
      }
      
      try {
        localStorage.setItem(state.syncKey, JSON.stringify(message))
        // Remove immediately to trigger storage event
        localStorage.removeItem(state.syncKey)
      } catch (error) {
        console.warn('Failed to broadcast tab sync:', error)
      }
      
      set({ lastSyncAt: Date.now() })
    },
    
    setupTabSync: (callback) => {
      const handleStorageChange = (event: StorageEvent) => {
        const state = get()
        
        if (event.key === state.syncKey && event.newValue) {
          try {
            const message = JSON.parse(event.newValue)
            if (message.type === 'STATE_UPDATE' && message.tabId !== window.name) {
              callback(message.data)
              set({ lastSyncAt: message.timestamp })
            }
          } catch (error) {
            console.warn('Failed to parse tab sync message:', error)
          }
        }
      }
      
      window.addEventListener('storage', handleStorageChange)
      
      return () => {
        window.removeEventListener('storage', handleStorageChange)
      }
    }
  }))
)

// State migration utilities
export class StateMigration {
  private migrations: Map<number, (state: any) => any> = new Map()
  
  addMigration(version: number, migration: (state: any) => any) {
    this.migrations.set(version, migration)
  }
  
  migrate(persistedState: any, fromVersion: number, toVersion: number) {
    let state = persistedState
    
    for (let version = fromVersion + 1; version <= toVersion; version++) {
      const migration = this.migrations.get(version)
      if (migration) {
        try {
          state = migration(state)
          console.log(`Migrated state from version ${version - 1} to ${version}`)
        } catch (error) {
          console.error(`Failed to migrate state to version ${version}:`, error)
          // Return null to trigger fresh state initialization
          return null
        }
      }
    }
    
    return state
  }
}

// Battery store migrations
const batteryStoreMigrations = new StateMigration()

// Version 1: Add new filter fields
batteryStoreMigrations.addMigration(1, (state) => ({
  ...state,
  filters: {
    ...state.filters,
    availability: state.filters.availability || [],
    rating: state.filters.rating || null
  }
}))

// Version 2: Update battery structure
batteryStoreMigrations.addMigration(2, (state) => ({
  ...state,
  batteries: state.batteries.map((battery: any) => ({
    ...battery,
    specifications: {
      ...battery.specifications,
      // Add new required fields with defaults
      temperature: battery.specifications.temperature || { min: -20, max: 60 },
      dimensions: battery.specifications.dimensions || { length: 0, width: 0, height: 0 }
    }
  }))
}))

// Hydration manager
export interface HydrationState {
  isHydrated: boolean
  hydrationError: Error | null
  pendingHydrations: Set<string>
  
  // Actions
  setHydrated: (key: string) => void
  setHydrationError: (key: string, error: Error) => void
  clearHydrationError: () => void
  waitForHydration: (keys?: string[]) => Promise<void>
}

export const useHydrationStore = create<HydrationState>()(
  subscribeWithSelector((set, get) => ({
    isHydrated: false,
    hydrationError: null,
    pendingHydrations: new Set(),
    
    setHydrated: (key) => {
      set((state) => {
        const newPending = new Set(state.pendingHydrations)
        newPending.delete(key)
        
        return {
          pendingHydrations: newPending,
          isHydrated: newPending.size === 0
        }
      })
    },
    
    setHydrationError: (key, error) => {
      set((state) => {
        const newPending = new Set(state.pendingHydrations)
        newPending.delete(key)
        
        return {
          pendingHydrations: newPending,
          hydrationError: error,
          isHydrated: newPending.size === 0
        }
      })
    },
    
    clearHydrationError: () => {
      set({ hydrationError: null })
    },
    
    waitForHydration: async (keys) => {
      const state = get()
      
      if (state.isHydrated) return
      
      return new Promise((resolve, reject) => {
        const checkHydration = () => {
          const currentState = get()
          
          if (currentState.hydrationError) {
            reject(currentState.hydrationError)
            return
          }
          
          const targetKeys = keys ? new Set(keys) : null
          const isReady = targetKeys 
            ? !Array.from(targetKeys).some(key => currentState.pendingHydrations.has(key))
            : currentState.isHydrated
          
          if (isReady) {
            resolve()
          }
        }
        
        // Check immediately
        checkHydration()
        
        // Subscribe to changes
        const unsubscribe = useHydrationStore.subscribe(checkHydration)
        
        // Timeout after 10 seconds
        setTimeout(() => {
          unsubscribe()
          reject(new Error('Hydration timeout'))
        }, 10000)
      })
    }
  }))
)

// Persistence hooks
export function usePersistenceStatus() {
  const { isHydrated, hydrationError, pendingHydrations } = useHydrationStore()
  
  return {
    isHydrated,
    hydrationError,
    isHydrating: pendingHydrations.size > 0,
    pendingCount: pendingHydrations.size
  }
}

export function useTabSync<T>(
  key: string,
  selector: (state: any) => T,
  store: any
) {
  const { broadcastUpdate, setupTabSync } = useTabSyncStore()
  
  React.useEffect(() => {
    // Setup listener for tab sync
    const cleanup = setupTabSync((data) => {
      if (data.key === key) {
        // Update the store with synced data
        store.setState(data.state)
      }
    })
    
    // Subscribe to store changes and broadcast them
    const unsubscribe = store.subscribe((state: any) => {
      const selectedState = selector(state)
      broadcastUpdate({
        key,
        state: selectedState
      })
    })
    
    return () => {
      cleanup()
      unsubscribe()
    }
  }, [key, selector, store, broadcastUpdate, setupTabSync])
}

// Storage cleanup utilities
export class StorageCleanup {
  static cleanupExpiredItems(storage: StorageAdapter, maxAge: number) {
    // Implementation would iterate through storage items
    // and remove expired ones based on timestamp
    console.log('Cleaning up expired storage items')
  }
  
  static compactStorage(storage: StorageAdapter) {
    // Implementation would optimize storage usage
    console.log('Compacting storage')
  }
  
  static getStorageUsage(): Promise<{ used: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return navigator.storage.estimate().then(estimate => ({
        used: estimate.usage || 0,
        available: estimate.quota || 0
      }))
    }
    
    return Promise.resolve({ used: 0, available: 0 })
  }
}

// Persistence provider component
export const PersistenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setHydrated, setHydrationError } = useHydrationStore()
  
  React.useEffect(() => {
    // Mark initial hydration as complete
    // In a real app, you'd wait for all stores to hydrate
    setTimeout(() => {
      setHydrated('initial')
    }, 100)
    
    // Setup storage cleanup
    const cleanup = setInterval(() => {
      StorageCleanup.cleanupExpiredItems(localStorageAdapter, 7 * 24 * 60 * 60 * 1000) // 7 days
    }, 60 * 60 * 1000) // Every hour
    
    return () => {
      clearInterval(cleanup)
    }
  }, [setHydrated])
  
  return <>{children}</>
}