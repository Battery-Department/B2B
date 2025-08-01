'use client'

import React from 'react'
import { useAnimation, useStaggeredChildren } from '@/hooks/useAnimation'
import { colors } from '@/lib/constants/theme'

export interface DonutChartData {
  label: string
  value: number
  color?: string
  percentage?: number
}

export interface DonutChartProps {
  data: DonutChartData[]
  title?: string
  subtitle?: string
  size?: number
  strokeWidth?: number
  showLabels?: boolean
  showPercentages?: boolean
  animated?: boolean
  centerContent?: React.ReactNode
  className?: string
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  title,
  subtitle,
  size = 200,
  strokeWidth = 20,
  showLabels = true,
  showPercentages = true,
  animated = true,
  centerContent,
  className = '',
}) => {
  const { style: containerStyle } = useAnimation('fadeIn', { delay: 200 })
  const { getChildStyle } = useStaggeredChildren(data.length, 150)
  
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  
  // Calculate percentages and cumulative values
  const processedData = data.map((item, index) => {
    const percentage = (item.value / total) * 100
    const strokeDasharray = (percentage / 100) * circumference
    const strokeOffset = data
      .slice(0, index)
      .reduce((acc, prev) => acc + ((prev.value / total) * circumference), 0)
    
    return {
      ...item,
      percentage,
      strokeDasharray,
      strokeOffset,
      color: item.color || getDefaultColor(index),
    }
  })

  function getDefaultColor(index: number): string {
    const defaultColors = [
      colors.primary.DEFAULT,
      colors.success.DEFAULT,
      colors.warning.DEFAULT,
      colors.error.DEFAULT,
      colors.info.DEFAULT,
      '#8B5CF6',
      '#F59E0B',
      '#EF4444',
    ]
    return defaultColors[index % defaultColors.length]
  }

  return (
    <div 
      className={`bg-white rounded-xl border-2 border-[#E6F4FF] p-6 ${className}`}
      style={animated ? containerStyle : undefined}
    >
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-6 text-center">
          {title && (
            <h3 className="text-lg font-bold text-[#0A051E] mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-[#64748B]">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Chart */}
        <div className="relative flex-shrink-0">
          <svg
            width={size}
            height={size}
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#F3F4F6"
              strokeWidth={strokeWidth}
            />

            {/* Data segments */}
            {processedData.map((item, index) => (
              <circle
                key={item.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${item.strokeDasharray} ${circumference - item.strokeDasharray}`}
                strokeDashoffset={-item.strokeOffset}
                className="transition-all duration-300 hover:stroke-[22] cursor-pointer"
                style={{
                  filter: `drop-shadow(0 2px 4px ${item.color}30)`,
                  strokeDasharray: animated 
                    ? `0 ${circumference}` 
                    : `${item.strokeDasharray} ${circumference - item.strokeDasharray}`,
                  animation: animated 
                    ? `drawSegment 1s ease-out ${index * 150}ms forwards` 
                    : 'none',
                }}
              >
                <title>{`${item.label}: ${item.value} (${item.percentage.toFixed(1)}%)`}</title>
              </circle>
            ))}
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            {centerContent || (
              <div className="text-center">
                <div className="text-2xl font-bold text-[#0A051E]">
                  {total.toLocaleString()}
                </div>
                <div className="text-sm text-[#64748B]">
                  Total
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        {showLabels && (
          <div className="flex-1 min-w-0">
            <div className="space-y-3">
              {processedData.map((item, index) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-[#F8FAFC] transition-colors duration-200 cursor-pointer"
                  style={animated ? getChildStyle(index) : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-[#374151] truncate">
                      {item.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-right flex-shrink-0">
                    <span className="text-sm font-semibold text-[#0A051E]">
                      {item.value.toLocaleString()}
                    </span>
                    {showPercentages && (
                      <span className="text-xs text-[#64748B] min-w-[3ch]">
                        {item.percentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes drawSegment {
          from {
            stroke-dasharray: 0 ${circumference};
          }
          to {
            stroke-dasharray: ${processedData.map(item => item.strokeDasharray).join(', ')} ${circumference};
          }
        }
      `}</style>
    </div>
  )
}