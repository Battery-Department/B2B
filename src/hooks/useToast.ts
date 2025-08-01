'use client'

import { useCallback } from 'react'

export interface ToastOptions {
  variant?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  description: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface ToastReturn {
  showToast: (options: ToastOptions) => string
  dismissToast: (id: string) => void
  clearAllToasts: () => void
}

// Global toast event dispatchers
const dispatchToastEvent = (type: string, detail: any) => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(type, { detail })
    window.dispatchEvent(event)
  }
}

export const useToast = (): ToastReturn => {
  const showToast = useCallback((options: ToastOptions): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    dispatchToastEvent('addToast', {
      id,
      ...options,
    })
    
    return id
  }, [])

  const dismissToast = useCallback((id: string) => {
    dispatchToastEvent('removeToast', { id })
  }, [])

  const clearAllToasts = useCallback(() => {
    dispatchToastEvent('clearToasts', {})
  }, [])

  return {
    showToast,
    dismissToast,
    clearAllToasts,
  }
}

// Convenience functions for common toast types
export const toast = {
  success: (description: string, options?: Omit<ToastOptions, 'variant' | 'description'>) => {
    const { showToast } = useToast()
    return showToast({ ...options, variant: 'success', description })
  },
  
  error: (description: string, options?: Omit<ToastOptions, 'variant' | 'description'>) => {
    const { showToast } = useToast()
    return showToast({ ...options, variant: 'error', description })
  },
  
  warning: (description: string, options?: Omit<ToastOptions, 'variant' | 'description'>) => {
    const { showToast } = useToast()
    return showToast({ ...options, variant: 'warning', description })
  },
  
  info: (description: string, options?: Omit<ToastOptions, 'variant' | 'description'>) => {
    const { showToast } = useToast()
    return showToast({ ...options, variant: 'info', description })
  },
}

// Static toast functions that work without hooks (for use in utilities, API calls, etc.)
export const showToast = (options: ToastOptions): string => {
  const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  dispatchToastEvent('addToast', {
    id,
    ...options,
  })
  
  return id
}

export const dismissToast = (id: string) => {
  dispatchToastEvent('removeToast', { id })
}

export const clearAllToasts = () => {
  dispatchToastEvent('clearToasts', {})
}

// Static convenience functions
export const toastSuccess = (description: string, options?: Omit<ToastOptions, 'variant' | 'description'>) => {
  return showToast({ ...options, variant: 'success', description })
}

export const toastError = (description: string, options?: Omit<ToastOptions, 'variant' | 'description'>) => {
  return showToast({ ...options, variant: 'error', description })
}

export const toastWarning = (description: string, options?: Omit<ToastOptions, 'variant' | 'description'>) => {
  return showToast({ ...options, variant: 'warning', description })
}

export const toastInfo = (description: string, options?: Omit<ToastOptions, 'variant' | 'description'>) => {
  return showToast({ ...options, variant: 'info', description })
}