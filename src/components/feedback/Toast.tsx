'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export interface ToastProps {
  id: string
  variant?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
  onDismiss?: (id: string) => void
}

const toastVariants = {
  success: {
    bg: '#F0FDF4',
    border: '#BBF7D0',
    icon: '#10B981',
    title: '#14532D',
    text: '#059669',
    progress: '#10B981',
    IconComponent: CheckCircle,
  },
  error: {
    bg: '#FEE2E2',
    border: '#FCA5A5',
    icon: '#EF4444',
    title: '#991B1B',
    text: '#DC2626',
    progress: '#EF4444',
    IconComponent: AlertCircle,
  },
  warning: {
    bg: '#FEF3C7',
    border: '#FDE68A',
    icon: '#F59E0B',
    title: '#92400E',
    text: '#D97706',
    progress: '#F59E0B',
    IconComponent: AlertTriangle,
  },
  info: {
    bg: '#E6F4FF',
    border: '#93C5FD',
    icon: '#006FEE',
    title: '#1E3A8A',
    text: '#1D4ED8',
    progress: '#006FEE',
    IconComponent: Info,
  },
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({
    id,
    variant = 'info',
    title,
    description,
    action,
    duration = 5000,
    onDismiss,
    ...props
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false)
    const [progress, setProgress] = React.useState(100)
    const [isPaused, setIsPaused] = React.useState(false)
    const [startTime, setStartTime] = React.useState(Date.now())
    const [remainingTime, setRemainingTime] = React.useState(duration)
    
    const progressRef = React.useRef<NodeJS.Timeout>()
    const dismissTimeoutRef = React.useRef<NodeJS.Timeout>()
    
    const styles = toastVariants[variant]
    const IconComponent = styles.IconComponent

    React.useEffect(() => {
      // Entrance animation
      setIsVisible(true)
      
      // Start progress bar and auto-dismiss
      startProgress()
      
      return () => {
        if (progressRef.current) clearInterval(progressRef.current)
        if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current)
      }
    }, [])

    const startProgress = () => {
      const start = Date.now()
      setStartTime(start)
      
      progressRef.current = setInterval(() => {
        if (!isPaused) {
          const elapsed = Date.now() - start
          const remaining = Math.max(0, duration - elapsed)
          const progressPercent = (remaining / duration) * 100
          
          setProgress(progressPercent)
          setRemainingTime(remaining)
          
          if (remaining <= 0) {
            handleDismiss()
          }
        }
      }, 16) // ~60fps
    }

    const handleDismiss = () => {
      setIsVisible(false)
      // Wait for exit animation to complete
      setTimeout(() => {
        onDismiss?.(id)
      }, 300)
    }

    const handleMouseEnter = () => {
      setIsPaused(true)
    }

    const handleMouseLeave = () => {
      setIsPaused(false)
      // Restart progress from where we left off
      if (progressRef.current) clearInterval(progressRef.current)
      startProgress()
    }

    // Swipe to dismiss logic for mobile
    const [startX, setStartX] = React.useState(0)
    const [currentX, setCurrentX] = React.useState(0)
    const [isDragging, setIsDragging] = React.useState(false)

    const handleTouchStart = (e: React.TouchEvent) => {
      setStartX(e.touches[0].clientX)
      setIsDragging(true)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging) return
      const deltaX = e.touches[0].clientX - startX
      setCurrentX(deltaX)
    }

    const handleTouchEnd = () => {
      if (Math.abs(currentX) > 100) {
        handleDismiss()
      } else {
        setCurrentX(0)
      }
      setIsDragging(false)
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative max-w-sm w-full rounded-xl shadow-lg pointer-events-auto",
          "transform transition-all duration-300 ease-out",
          isVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-full opacity-0 scale-95"
        )}
        style={{
          backgroundColor: styles.bg,
          borderLeft: `4px solid ${styles.border}`,
          transform: `translateX(${currentX}px) ${isVisible ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.95)'}`,
          opacity: isVisible ? Math.max(0.3, 1 - Math.abs(currentX) / 200) : 0,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        {/* Progress bar */}
        <div
          className="absolute top-0 left-0 h-1 rounded-t-xl transition-all duration-75 ease-linear"
          style={{
            width: `${progress}%`,
            backgroundColor: styles.progress,
          }}
        />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: `${styles.icon}20`,
              }}
            >
              <IconComponent className="w-5 h-5" style={{ color: styles.icon }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {title && (
                <h4
                  className="text-sm font-semibold mb-1"
                  style={{ color: styles.title }}
                >
                  {title}
                </h4>
              )}
              <p
                className="text-sm leading-relaxed"
                style={{ color: styles.text }}
              >
                {description}
              </p>
              
              {action && (
                <button
                  onClick={action.onClick}
                  className="mt-2 text-xs font-medium underline hover:no-underline transition-all duration-200"
                  style={{ color: styles.icon }}
                >
                  {action.label}
                </button>
              )}
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors duration-200"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" style={{ color: styles.text }} />
            </button>
          </div>
        </div>
      </div>
    )
  }
)

Toast.displayName = 'Toast'