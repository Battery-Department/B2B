'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { Toast, ToastProps } from './Toast'

export interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  maxToasts?: number
}

const positionStyles = {
  'top-right': {
    top: '1rem',
    right: '1rem',
    flexDirection: 'column' as const,
  },
  'top-left': {
    top: '1rem',
    left: '1rem',
    flexDirection: 'column' as const,
  },
  'bottom-right': {
    bottom: '1rem',
    right: '1rem',
    flexDirection: 'column-reverse' as const,
  },
  'bottom-left': {
    bottom: '1rem',
    left: '1rem',
    flexDirection: 'column-reverse' as const,
  },
  'top-center': {
    top: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    flexDirection: 'column' as const,
  },
  'bottom-center': {
    bottom: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    flexDirection: 'column-reverse' as const,
  },
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-right',
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Listen for toast events
  React.useEffect(() => {
    const handleAddToast = (event: CustomEvent<ToastProps>) => {
      const newToast = { ...event.detail, id: event.detail.id || Date.now().toString() }
      
      setToasts(current => {
        // Remove oldest toast if we exceed maxToasts
        let updatedToasts = current
        if (current.length >= maxToasts) {
          updatedToasts = current.slice(-(maxToasts - 1))
        }
        
        return [...updatedToasts, newToast]
      })
    }

    const handleRemoveToast = (event: CustomEvent<{ id: string }>) => {
      setToasts(current => current.filter(toast => toast.id !== event.detail.id))
    }

    const handleClearToasts = () => {
      setToasts([])
    }

    // Add event listeners
    window.addEventListener('addToast', handleAddToast as EventListener)
    window.addEventListener('removeToast', handleRemoveToast as EventListener)
    window.addEventListener('clearToasts', handleClearToasts as EventListener)

    return () => {
      window.removeEventListener('addToast', handleAddToast as EventListener)
      window.removeEventListener('removeToast', handleRemoveToast as EventListener)
      window.removeEventListener('clearToasts', handleClearToasts as EventListener)
    }
  }, [maxToasts])

  const handleDismiss = (id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id))
  }

  if (!mounted) return null

  const container = (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        ...positionStyles[position],
        display: 'flex',
        gap: '0.75rem',
      }}
    >
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            transform: `translateY(${position.includes('bottom') ? 
              -index * 8 : index * 8}px) scale(${1 - index * 0.05})`,
            zIndex: 1000 - index,
            opacity: Math.max(0.4, 1 - index * 0.2),
            transition: 'all 0.3s ease-out',
          }}
        >
          <Toast
            {...toast}
            onDismiss={handleDismiss}
          />
        </div>
      ))}
    </div>
  )

  return createPortal(container, document.body)
}