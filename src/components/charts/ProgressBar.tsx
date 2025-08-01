'use client'

import React from 'react'
import { useAnimation } from '@/hooks/useAnimation'
import { colors } from '@/lib/constants/theme'

export interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  showPercentage?: boolean
  color?: string
  backgroundColor?: string
  height?: number
  animated?: boolean
  striped?: boolean
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showValue = true,
  showPercentage = true,
  color = colors.primary.DEFAULT,
  backgroundColor = '#F3F4F6',
  height = 8,
  animated = true,
  striped = false,
  className = '',
}) => {
  const { style: containerStyle } = useAnimation('fadeIn', { delay: 100 })
  
  const percentage = Math.min((value / max) * 100, 100)
  const isComplete = percentage >= 100

  return (
    <div 
      className={`${className}`}
      style={animated ? containerStyle : undefined}
    >
      {/* Label and value */}
      {(label || showValue || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-[#374151]">
              {label}
            </span>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            {showValue && (
              <span className="font-semibold text-[#0A051E]">
                {value.toLocaleString()}
                {max !== 100 && ` / ${max.toLocaleString()}`}
              </span>
            )}
            {showPercentage && (
              <span className="text-[#64748B]">
                ({percentage.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div
        className="relative overflow-hidden rounded-full"
        style={{
          height: height,
          backgroundColor: backgroundColor,
        }}
      >
        {/* Progress fill */}
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out ${
            striped ? 'bg-stripe' : ''
          }`}
          style={{
            width: animated ? `${percentage}%` : `${percentage}%`,
            backgroundColor: color,
            background: striped 
              ? `repeating-linear-gradient(
                  45deg,
                  ${color},
                  ${color} 10px,
                  ${color}dd 10px,
                  ${color}dd 20px
                )`
              : color,
            boxShadow: `0 2px 4px ${color}30`,
            animation: animated ? `growWidth 1s ease-out` : 'none',
          }}
        />

        {/* Animated stripes */}
        {striped && (
          <div
            className="absolute top-0 left-0 h-full w-full opacity-20"
            style={{
              background: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255,255,255,0.3) 10px,
                rgba(255,255,255,0.3) 20px
              )`,
              animation: 'moveStripes 1s linear infinite',
            }}
          />
        )}

        {/* Glow effect for complete state */}
        {isComplete && (
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              boxShadow: `0 0 8px ${color}60, inset 0 0 8px ${color}30`,
            }}
          />
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes growWidth {
          from {
            width: 0%;
          }
          to {
            width: ${percentage}%;
          }
        }
        
        @keyframes moveStripes {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 40px 0;
          }
        }
      `}</style>
    </div>
  )
}