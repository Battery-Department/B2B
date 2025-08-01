import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export interface OptimisticAction {
  id: string
  type: string
  originalData: any
  optimisticData: any
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed' | 'rolled_back'
  retryCount: number
  maxRetries: number
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  onRollback?: () => void
}

export interface OptimisticState {
  actions: Map<string, OptimisticAction>
  isEnabled: boolean
  defaultMaxRetries: number
  defaultTimeout: number
  
  // Actions
  addOptimisticAction: (action: Omit<OptimisticAction, 'id' | 'timestamp' | 'status' | 'retryCount'>) => string
  confirmAction: (actionId: string, serverData?: any) => void
  failAction: (actionId: string, error: any) => void
  rollbackAction: (actionId: string) => void
  retryAction: (actionId: string) => void
  clearAction: (actionId: string) => void
  clearAllActions: () => void
  
  // Utilities
  getAction: (actionId: string) => OptimisticAction | undefined
  getPendingActions: () => OptimisticAction[]
  getFailedActions: () => OptimisticAction[]
  hasOptimisticChanges: () => boolean
  
  // Configuration
  setEnabled: (enabled: boolean) => void
  setDefaultMaxRetries: (retries: number) => void
  setDefaultTimeout: (timeout: number) => void
}

export const useOptimisticStore = create<OptimisticState>()(
  immer((set, get) => ({
    actions: new Map(),
    isEnabled: true,
    defaultMaxRetries: 3,
    defaultTimeout: 10000,
    
    addOptimisticAction: (actionData) => {
      const actionId = `optimistic-${Date.now()}-${Math.random()}`
      
      set((state) => {
        state.actions.set(actionId, {
          ...actionData,
          id: actionId,
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0,
          maxRetries: actionData.maxRetries ?? state.defaultMaxRetries
        })
      })
      
      // Auto-timeout the action
      setTimeout(() => {
        const action = get().getAction(actionId)
        if (action && action.status === 'pending') {
          get().failAction(actionId, new Error('Timeout'))
        }
      }, get().defaultTimeout)
      
      return actionId
    },
    
    confirmAction: (actionId, serverData) => {
      set((state) => {
        const action = state.actions.get(actionId)
        if (action) {
          action.status = 'confirmed'
          action.onSuccess?.(serverData || action.optimisticData)
          state.actions.delete(actionId)
        }
      })
    },
    
    failAction: (actionId, error) => {
      set((state) => {
        const action = state.actions.get(actionId)
        if (action) {
          action.status = 'failed'
          action.onError?.(error)
        }
      })
    },
    
    rollbackAction: (actionId) => {
      set((state) => {
        const action = state.actions.get(actionId)
        if (action) {
          action.status = 'rolled_back'
          action.onRollback?.()
          state.actions.delete(actionId)
        }
      })
    },
    
    retryAction: (actionId) => {
      set((state) => {
        const action = state.actions.get(actionId)
        if (action && action.retryCount < action.maxRetries) {
          action.status = 'pending'
          action.retryCount += 1
          action.timestamp = Date.now()
        }
      })
    },
    
    clearAction: (actionId) => {
      set((state) => {
        state.actions.delete(actionId)
      })
    },
    
    clearAllActions: () => {
      set((state) => {
        state.actions.clear()
      })
    },
    
    getAction: (actionId) => {
      return get().actions.get(actionId)
    },
    
    getPendingActions: () => {
      return Array.from(get().actions.values()).filter(action => action.status === 'pending')
    },
    
    getFailedActions: () => {
      return Array.from(get().actions.values()).filter(action => action.status === 'failed')
    },
    
    hasOptimisticChanges: () => {
      return get().getPendingActions().length > 0
    },
    
    setEnabled: (enabled) => {
      set((state) => {
        state.isEnabled = enabled
      })
    },
    
    setDefaultMaxRetries: (retries) => {
      set((state) => {
        state.defaultMaxRetries = retries
      })
    },
    
    setDefaultTimeout: (timeout) => {
      set((state) => {
        state.defaultTimeout = timeout
      })
    }
  }))
)

// Optimistic update utilities
export class OptimisticUpdateManager {
  private optimisticStore: any
  
  constructor() {
    this.optimisticStore = useOptimisticStore
  }
  
  // Generic optimistic update function
  async performOptimisticUpdate<T>(
    optimisticData: T,
    originalData: T,
    serverAction: () => Promise<T>,
    options: {
      type: string
      onSuccess?: (data: T) => void
      onError?: (error: any) => void
      onRollback?: () => void
      maxRetries?: number
    }
  ): Promise<T> {
    const { isEnabled, addOptimisticAction, confirmAction, failAction, rollbackAction } = this.optimisticStore.getState()
    
    if (!isEnabled) {
      // If optimistic updates are disabled, just perform the server action
      return serverAction()
    }
    
    // Add optimistic action
    const actionId = addOptimisticAction({
      type: options.type,
      originalData,
      optimisticData,
      maxRetries: options.maxRetries || 3,
      onSuccess: options.onSuccess,
      onError: options.onError,
      onRollback: options.onRollback
    })
    
    try {
      // Perform server action
      const serverData = await serverAction()
      
      // Confirm the optimistic update
      confirmAction(actionId, serverData)
      
      return serverData
    } catch (error) {
      // Handle failure
      failAction(actionId, error)
      
      // Decide whether to rollback or retry
      const action = this.optimisticStore.getState().getAction(actionId)
      if (action && action.retryCount < action.maxRetries) {
        // Retry the action
        const { retryAction } = this.optimisticStore.getState()
        retryAction(actionId)
        
        // Retry after a delay
        await new Promise(resolve => setTimeout(resolve, 1000 * (action.retryCount + 1)))
        return this.performOptimisticUpdate(optimisticData, originalData, serverAction, options)
      } else {
        // Rollback the optimistic update
        rollbackAction(actionId)
        throw error
      }
    }
  }
}

// Hook for optimistic updates
export function useOptimisticUpdates() {
  const optimisticStore = useOptimisticStore()
  const manager = React.useMemo(() => new OptimisticUpdateManager(), [])
  
  const performUpdate = React.useCallback(
    <T>(
      optimisticData: T,
      originalData: T,
      serverAction: () => Promise<T>,
      options: {
        type: string
        onSuccess?: (data: T) => void
        onError?: (error: any) => void
        onRollback?: () => void
        maxRetries?: number
      }
    ) => {
      return manager.performOptimisticUpdate(optimisticData, originalData, serverAction, options)
    },
    [manager]
  )
  
  return {
    performUpdate,
    ...optimisticStore
  }
}

// Specific optimistic update hooks for different data types

// Battery optimistic updates
export function useBatteryOptimisticUpdates() {
  const { performUpdate } = useOptimisticUpdates()
  
  const updateBatteryOptimistically = React.useCallback(
    (batteryId: string, updates: any, serverUpdate: () => Promise<any>) => {
      // Get current battery data (would come from your state management)
      const originalBattery = {} // Get from state
      const optimisticBattery = { ...originalBattery, ...updates, updatedAt: new Date().toISOString() }
      
      return performUpdate(
        optimisticBattery,
        originalBattery,
        serverUpdate,
        {
          type: 'UPDATE_BATTERY',
          onSuccess: (serverData) => {
            // Update battery in state with server data
            console.log('Battery updated successfully:', serverData)
          },
          onError: (error) => {
            // Show error notification
            console.error('Failed to update battery:', error)
          },
          onRollback: () => {
            // Revert battery to original state
            console.log('Rolling back battery update')
          }
        }
      )
    },
    [performUpdate]
  )
  
  const addBatteryOptimistically = React.useCallback(
    (batteryData: any, serverAdd: () => Promise<any>) => {
      const tempId = `temp-${Date.now()}`
      const optimisticBattery = { 
        ...batteryData, 
        id: tempId, 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      return performUpdate(
        optimisticBattery,
        null,
        serverAdd,
        {
          type: 'ADD_BATTERY',
          onSuccess: (serverData) => {
            // Replace temporary battery with server data
            console.log('Battery added successfully:', serverData)
          },
          onError: (error) => {
            console.error('Failed to add battery:', error)
          },
          onRollback: () => {
            // Remove temporary battery
            console.log('Rolling back battery addition')
          }
        }
      )
    },
    [performUpdate]
  )
  
  const deleteBatteryOptimistically = React.useCallback(
    (batteryId: string, serverDelete: () => Promise<any>) => {
      const originalBattery = {} // Get from state
      
      return performUpdate(
        null,
        originalBattery,
        serverDelete,
        {
          type: 'DELETE_BATTERY',
          onSuccess: () => {
            console.log('Battery deleted successfully')
          },
          onError: (error) => {
            console.error('Failed to delete battery:', error)
          },
          onRollback: () => {
            // Restore the battery
            console.log('Rolling back battery deletion')
          }
        }
      )
    },
    [performUpdate]
  )
  
  return {
    updateBatteryOptimistically,
    addBatteryOptimistically,
    deleteBatteryOptimistically
  }
}

// Cart optimistic updates
export function useCartOptimisticUpdates() {
  const { performUpdate } = useOptimisticUpdates()
  
  const addToCartOptimistically = React.useCallback(
    (item: any, serverAdd: () => Promise<any>) => {
      const originalCart = {} // Get from cart state
      const optimisticCart = {
        ...originalCart,
        items: [...(originalCart as any).items, item],
        lastUpdated: new Date().toISOString()
      }
      
      return performUpdate(
        optimisticCart,
        originalCart,
        serverAdd,
        {
          type: 'ADD_TO_CART',
          onSuccess: (serverData) => {
            console.log('Item added to cart successfully:', serverData)
          },
          onError: (error) => {
            console.error('Failed to add item to cart:', error)
            // Show user-friendly error message
          },
          onRollback: () => {
            console.log('Rolling back cart addition')
          }
        }
      )
    },
    [performUpdate]
  )
  
  const updateCartItemOptimistically = React.useCallback(
    (itemId: string, updates: any, serverUpdate: () => Promise<any>) => {
      const originalCart = {} // Get from cart state
      const optimisticCart = {
        ...originalCart,
        items: (originalCart as any).items.map((item: any) =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
        lastUpdated: new Date().toISOString()
      }
      
      return performUpdate(
        optimisticCart,
        originalCart,
        serverUpdate,
        {
          type: 'UPDATE_CART_ITEM',
          onSuccess: (serverData) => {
            console.log('Cart item updated successfully:', serverData)
          },
          onError: (error) => {
            console.error('Failed to update cart item:', error)
          },
          onRollback: () => {
            console.log('Rolling back cart item update')
          }
        }
      )
    },
    [performUpdate]
  )
  
  const removeFromCartOptimistically = React.useCallback(
    (itemId: string, serverRemove: () => Promise<any>) => {
      const originalCart = {} // Get from cart state
      const optimisticCart = {
        ...originalCart,
        items: (originalCart as any).items.filter((item: any) => item.id !== itemId),
        lastUpdated: new Date().toISOString()
      }
      
      return performUpdate(
        optimisticCart,
        originalCart,
        serverRemove,
        {
          type: 'REMOVE_FROM_CART',
          onSuccess: () => {
            console.log('Item removed from cart successfully')
          },
          onError: (error) => {
            console.error('Failed to remove item from cart:', error)
          },
          onRollback: () => {
            console.log('Rolling back cart item removal')
          }
        }
      )
    },
    [performUpdate]
  )
  
  return {
    addToCartOptimistically,
    updateCartItemOptimistically,
    removeFromCartOptimistically
  }
}

// Optimistic update status component
export const OptimisticUpdateStatus: React.FC = () => {
  const { getPendingActions, getFailedActions, hasOptimisticChanges } = useOptimisticUpdates()
  
  const pendingActions = getPendingActions()
  const failedActions = getFailedActions()
  const hasChanges = hasOptimisticChanges()
  
  if (!hasChanges && failedActions.length === 0) {
    return null
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 max-w-sm">
      {pendingActions.length > 0 && (
        <div className="flex items-center space-x-2 text-blue-600 mb-2">
          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span className="text-sm">
            {pendingActions.length} change{pendingActions.length > 1 ? 's' : ''} syncing...
          </span>
        </div>
      )}
      
      {failedActions.length > 0 && (
        <div className="text-red-600 text-sm">
          {failedActions.length} change{failedActions.length > 1 ? 's' : ''} failed to sync
        </div>
      )}
    </div>
  )
}