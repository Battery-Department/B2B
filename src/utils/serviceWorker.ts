import { useState, useEffect, useCallback } from 'react'

interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void
  onSuccess?: (registration: ServiceWorkerRegistration) => void
  onError?: (error: Error) => void
  enableNotifications?: boolean
  enableBackgroundSync?: boolean
  swUrl?: string
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null
  private config: ServiceWorkerConfig
  private messageCallbacks: Map<string, (data: any) => void> = new Map()
  private offlineQueue: Array<{ url: string; options: RequestInit }> = []

  constructor(config: ServiceWorkerConfig = {}) {
    this.config = {
      swUrl: '/sw.js',
      enableNotifications: true,
      enableBackgroundSync: true,
      ...config
    }

    this.setupEventListeners()
  }

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported')
      return null
    }

    try {
      this.registration = await navigator.serviceWorker.register(this.config.swUrl!)
      
      this.registration.addEventListener('updatefound', () => {
        this.handleUpdateFound()
      })

      if (this.registration.waiting) {
        this.config.onUpdate?.(this.registration)
      }

      if (this.registration.active) {
        this.config.onSuccess?.(this.registration)
      }

      this.setupMessageChannel()
      return this.registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      this.config.onError?.(error as Error)
      return null
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false
    }

    try {
      const success = await this.registration.unregister()
      this.registration = null
      return success
    } catch (error) {
      console.error('Service Worker unregistration failed:', error)
      return false
    }
  }

  async update(): Promise<void> {
    if (!this.registration) {
      return
    }

    try {
      await this.registration.update()
    } catch (error) {
      console.error('Service Worker update failed:', error)
    }
  }

  skipWaiting(): void {
    if (this.registration?.waiting) {
      this.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  postMessage(message: any): void {
    if (this.registration?.active) {
      this.registration.active.postMessage(message)
    }
  }

  onMessage(type: string, callback: (data: any) => void): () => void {
    this.messageCallbacks.set(type, callback)
    
    return () => {
      this.messageCallbacks.delete(type)
    }
  }

  async getCacheStatus(): Promise<any> {
    return new Promise((resolve) => {
      const channel = new MessageChannel()
      
      channel.port1.onmessage = (event) => {
        resolve(event.data)
      }
      
      this.postMessage({
        type: 'GET_CACHE_STATUS'
      })
    })
  }

  async clearCache(): Promise<void> {
    this.postMessage({ type: 'CLEAR_CACHE' })
  }

  async syncOfflineRequests(): Promise<void> {
    this.postMessage({ type: 'SYNC_OFFLINE_REQUESTS' })
  }

  updateCache(url: string, data: any): void {
    this.postMessage({
      type: 'UPDATE_CACHE',
      payload: { url, data }
    })
  }

  private setupEventListeners(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data
        const callback = this.messageCallbacks.get(type)
        
        if (callback) {
          callback(payload)
        }

        this.handleServiceWorkerMessage(type, payload)
      })

      window.addEventListener('online', () => {
        this.handleOnline()
      })

      window.addEventListener('offline', () => {
        this.handleOffline()
      })
    }
  }

  private setupMessageChannel(): void {
    if (!this.registration?.active) return

    this.onMessage('CACHE_UPDATE', (data) => {
      this.dispatchCustomEvent('cache-update', data)
    })

    this.onMessage('SYNC_COMPLETE', (data) => {
      this.dispatchCustomEvent('sync-complete', data)
    })

    this.onMessage('CACHE_CLEARED', () => {
      this.dispatchCustomEvent('cache-cleared')
    })
  }

  private handleUpdateFound(): void {
    if (!this.registration) return

    const newWorker = this.registration.installing
    if (!newWorker) return

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          this.config.onUpdate?.(this.registration!)
        } else {
          this.config.onSuccess?.(this.registration!)
        }
      }
    })
  }

  private handleServiceWorkerMessage(type: string, payload: any): void {
    switch (type) {
      case 'CACHE_UPDATE':
        console.log('Cache updated:', payload)
        break
      case 'SYNC_COMPLETE':
        console.log('Offline sync complete:', payload)
        break
      case 'CACHE_CLEARED':
        console.log('Cache cleared')
        break
    }
  }

  private handleOnline(): void {
    console.log('Application is online')
    this.syncOfflineRequests()
    this.dispatchCustomEvent('online')
  }

  private handleOffline(): void {
    console.log('Application is offline')
    this.dispatchCustomEvent('offline')
  }

  private dispatchCustomEvent(type: string, detail?: any): void {
    window.dispatchEvent(new CustomEvent(`sw-${type}`, { detail }))
  }
}

let swManager: ServiceWorkerManager | null = null

export function initializeServiceWorker(config: ServiceWorkerConfig = {}): ServiceWorkerManager {
  if (!swManager) {
    swManager = new ServiceWorkerManager(config)
  }
  return swManager
}

export function getServiceWorkerManager(): ServiceWorkerManager | null {
  return swManager
}

export async function registerServiceWorker(config: ServiceWorkerConfig = {}): Promise<ServiceWorkerRegistration | null> {
  const manager = initializeServiceWorker(config)
  return manager.register()
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if (!swManager) {
    return false
  }
  return swManager.unregister()
}

export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    const manager = getServiceWorkerManager()
    if (!manager) return

    const unsubscribeOnline = manager.onMessage('online', () => {
      setIsOnline(true)
    })

    const unsubscribeOffline = manager.onMessage('offline', () => {
      setIsOnline(false)
    })

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      unsubscribeOnline()
      unsubscribeOffline()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const updateServiceWorker = useCallback(() => {
    const manager = getServiceWorkerManager()
    if (manager) {
      manager.skipWaiting()
      window.location.reload()
    }
  }, [])

  const clearCache = useCallback(async () => {
    const manager = getServiceWorkerManager()
    if (manager) {
      await manager.clearCache()
    }
  }, [])

  const syncOfflineRequests = useCallback(async () => {
    const manager = getServiceWorkerManager()
    if (manager) {
      await manager.syncOfflineRequests()
    }
  }, [])

  return {
    isOnline,
    updateAvailable,
    registration,
    updateServiceWorker,
    clearCache,
    syncOfflineRequests
  }
}

export function useOfflineQueue() {
  const [queueSize, setQueueSize] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const manager = getServiceWorkerManager()
    if (!manager) return

    const handleSyncStart = () => setIsSyncing(true)
    const handleSyncComplete = (data: any) => {
      setIsSyncing(false)
      setQueueSize(0)
      console.log('Sync results:', data.results)
    }

    const unsubscribeSyncStart = manager.onMessage('SYNC_START', handleSyncStart)
    const unsubscribeSyncComplete = manager.onMessage('SYNC_COMPLETE', handleSyncComplete)

    return () => {
      unsubscribeSyncStart()
      unsubscribeSyncComplete()
    }
  }, [])

  return {
    queueSize,
    isSyncing
  }
}

export function useCacheStatus() {
  const [cacheStatus, setCacheStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const refreshCacheStatus = useCallback(async () => {
    const manager = getServiceWorkerManager()
    if (!manager) return

    setLoading(true)
    try {
      const status = await manager.getCacheStatus()
      setCacheStatus(status)
    } catch (error) {
      console.error('Failed to get cache status:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshCacheStatus()
  }, [refreshCacheStatus])

  return {
    cacheStatus,
    loading,
    refreshCacheStatus
  }
}

export const serviceWorkerConfig: ServiceWorkerConfig = {
  onUpdate: (registration) => {
    console.log('SW: Update available')
    window.dispatchEvent(new CustomEvent('sw-update-available', { detail: registration }))
  },
  onSuccess: (registration) => {
    console.log('SW: Successfully registered')
    window.dispatchEvent(new CustomEvent('sw-registered', { detail: registration }))
  },
  onError: (error) => {
    console.error('SW: Registration failed', error)
    window.dispatchEvent(new CustomEvent('sw-error', { detail: error }))
  },
  enableNotifications: true,
  enableBackgroundSync: true
}