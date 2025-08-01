'use client'

import React from 'react'
import { useAnimation, useStaggeredChildren } from '@/hooks/useAnimation'
import { colors } from '@/lib/constants/theme'

export interface BarChartData {
  label: string
  value: number
  color?: string
  target?: number
}

export interface BarChartProps {
  data: BarChartData[]
  title?: string
  subtitle?: string
  height?: number
  showValues?: boolean
  showTargets?: boolean
  animated?: boolean
  className?: string
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  subtitle,
  height = 300,
  showValues = true,
  showTargets = false,
  animated = true,
  className = '',
}) => {
  const { style: containerStyle } = useAnimation('fadeIn', { delay: 200 })
  const { getChildStyle } = useStaggeredChildren(data.length, 100)
  
  const maxValue = Math.max(...data.map(d => Math.max(d.value, d.target || 0)))
  const chartHeight = height - 60 // Account for labels and padding

  return (
    <div 
      className={`bg-white rounded-xl border-2 border-[#E6F4FF] p-6 ${className}`}
      style={animated ? containerStyle : undefined}
    >
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-6">
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

      {/* Chart */}
      <div className="relative">
        <div 
          className="flex items-end justify-between gap-3"
          style={{ height: chartHeight }}
        >
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight
            const targetHeight = item.target ? (item.target / maxValue) * chartHeight : 0
            const barColor = item.color || colors.primary.DEFAULT

            return (
              <div
                key={item.label}
                className="flex-1 flex flex-col items-center relative"
                style={animated ? getChildStyle(index) : undefined}
              >
                {/* Target line */}
                {showTargets && item.target && (
                  <div
                    className="absolute w-full border-t-2 border-dashed border-[#F59E0B] z-10"
                    style={{
                      bottom: targetHeight,
                      opacity: 0.7,
                    }}
                  >
                    <span 
                      className="absolute -top-6 right-0 text-xs font-medium text-[#F59E0B]"
                    >
                      {item.target}
                    </span>
                  </div>
                )}

                {/* Bar */}
                <div
                  className="w-full rounded-t-lg transition-all duration-700 ease-out relative group"
                  style={{
                    height: animated ? barHeight : barHeight,
                    backgroundColor: barColor,
                    background: `linear-gradient(to top, ${barColor}, ${barColor}dd)`,
                    boxShadow: `0 4px 12px ${barColor}30`,
                    animation: animated ? `growUp 0.8s ease-out ${index * 100}ms both` : 'none',
                  }}
                >
                  {/* Value label */}
                  {showValues && (
                    <div 
                      className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-semibold text-[#0A051E] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      {item.value.toLocaleString()}
                    </div>
                  )}

                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-200 rounded-t-lg" />
                </div>

                {/* Label */}
                <div className="mt-3 text-center">
                  <span className="text-sm font-medium text-[#374151] block">
                    {item.label}
                  </span>
                  {showValues && (
                    <span className="text-xs text-[#64748B] mt-1 block">
                      {item.value.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes growUp {
          from {
            height: 0;
            opacity: 0;
          }
          to {
            height: ${chartHeight}px;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}