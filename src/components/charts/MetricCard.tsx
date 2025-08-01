'use client'

import React from 'react'
import { useAnimation } from '@/hooks/useAnimation'
import { colors } from '@/lib/constants/theme'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  icon?: React.ReactNode
  color?: string
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = colors.primary.DEFAULT,
  size = 'md',
  animated = true,
  className = '',
}) => {
  const { style: containerStyle } = useAnimation('slideInUp', { delay: 100 })
  
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
  
  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }
  
  const valueSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  const getTrendIcon = () => {
    if (!trend) return null
    
    if (trend.value > 0) {
      return <TrendingUp className="w-4 h-4" />
    } else if (trend.value < 0) {
      return <TrendingDown className="w-4 h-4" />
    } else {
      return <Minus className="w-4 h-4" />
    }
  }

  const getTrendColor = () => {
    if (!trend) return ''
    
    if (trend.isPositive !== undefined) {
      return trend.isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'
    }
    
    // Default: positive numbers are green, negative are red
    if (trend.value > 0) return 'text-[#10B981]'
    if (trend.value < 0) return 'text-[#EF4444]'
    return 'text-[#64748B]'
  }

  return (
    <div
      className={`bg-white rounded-xl border-2 border-[#E6F4FF] hover:border-[#006FEE] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${sizeClasses[size]} ${className}`}
      style={animated ? containerStyle : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-[#64748B] ${titleSizes[size]} mb-1`}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-[#94A3B8]">
              {subtitle}
            </p>
          )}
        </div>
        
        {icon && (
          <div
            className="p-2 rounded-lg"
            style={{
              backgroundColor: `${color}15`,
              color: color,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-4">
        <div className={`font-bold text-[#0A051E] ${valueSizes[size]} leading-none`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </div>

      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-semibold">
              {Math.abs(trend.value)}%
            </span>
          </div>
          <span className="text-sm text-[#64748B]">
            {trend.label}
          </span>
        </div>
      )}

      {/* Animated background effect */}
      {animated && (
        <div
          className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 hover:opacity-5 pointer-events-none"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  )
}