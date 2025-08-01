'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'primary' | 'white'
  fullScreen?: boolean
  label?: string
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({
    className,
    size = 'md',
    variant = 'default',
    fullScreen = false,
    label,
    ...props
  }, ref) => {
    const spinner = (
      <div className="flex flex-col items-center justify-center gap-3">
        <svg
          className={cn(
            "animate-spin",
            sizeMap[size],
            variant === 'primary' && "text-[#006FEE]",
            variant === 'white' && "text-white",
            variant === 'default' && "text-[#64748B]"
          )}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {label && (
          <p className={cn(
            "text-sm font-medium animate-fade-in",
            variant === 'white' ? 'text-white' : 'text-[#64748B]'
          )}>
            {label}
          </p>
        )}
      </div>
    )

    if (fullScreen) {
      return (
        <div
          ref={ref}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center",
            "bg-white/80 backdrop-blur-sm",
            className
          )}
          {...props}
        >
          {spinner}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        {spinner}
      </div>
    )
  }
)

LoadingSpinner.displayName = 'LoadingSpinner'

// Loading dots animation component
export const LoadingDots: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-[#006FEE] animate-bounce"
          style={{
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
    </div>
  )
}

// Loading skeleton text
export const LoadingText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className 
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gradient-to-r from-[#F1F5F9] via-[#E5E7EB] to-[#F1F5F9] rounded animate-pulse"
          style={{
            width: `${100 - (i * 20)}%`,
          }}
        />
      ))}
    </div>
  )
}

export { LoadingSpinner }