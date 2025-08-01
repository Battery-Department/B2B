'use client'

import React from 'react'
import { useAnimation, useStaggeredChildren } from '@/hooks/useAnimation'
import { colors } from '@/lib/constants/theme'

export interface LineChartDataPoint {
  label: string
  value: number
  timestamp?: string
}

export interface LineChartSeries {
  name: string
  data: LineChartDataPoint[]
  color?: string
  strokeWidth?: number
}

export interface LineChartProps {
  series: LineChartSeries[]
  title?: string
  subtitle?: string
  height?: number
  showGrid?: boolean
  showPoints?: boolean
  animated?: boolean
  className?: string
}

export const LineChart: React.FC<LineChartProps> = ({
  series,
  title,
  subtitle,
  height = 300,
  showGrid = true,
  showPoints = true,
  animated = true,
  className = '',
}) => {
  const { style: containerStyle } = useAnimation('fadeIn', { delay: 200 })
  const { getChildStyle } = useStaggeredChildren(series.length, 200)
  
  const allValues = series.flatMap(s => s.data.map(d => d.value))
  const maxValue = Math.max(...allValues)
  const minValue = Math.min(...allValues)
  const valueRange = maxValue - minValue
  
  const chartWidth = 400
  const chartHeight = height - 100
  const padding = 40

  const getY = (value: number) => {
    return chartHeight - ((value - minValue) / valueRange) * chartHeight
  }

  const getX = (index: number, total: number) => {
    return (index / (total - 1)) * chartWidth
  }

  const createPath = (data: LineChartDataPoint[]) => {
    if (data.length === 0) return ''
    
    let path = `M ${getX(0, data.length)} ${getY(data[0].value)}`
    
    for (let i = 1; i < data.length; i++) {
      const x = getX(i, data.length)
      const y = getY(data[i].value)
      path += ` L ${x} ${y}`
    }
    
    return path
  }

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

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        {series.map((s, index) => (
          <div 
            key={s.name} 
            className="flex items-center gap-2"
            style={animated ? getChildStyle(index) : undefined}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: s.color || colors.primary.DEFAULT }}
            />
            <span className="text-sm font-medium text-[#374151]">
              {s.name}
            </span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="relative overflow-hidden">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${chartWidth + padding * 2} ${chartHeight + padding * 2}`}
          className="overflow-visible"
        >
          {/* Grid lines */}
          {showGrid && (
            <g opacity="0.3">
              {/* Horizontal grid lines */}
              {Array.from({ length: 5 }, (_, i) => {
                const y = (i / 4) * chartHeight + padding
                return (
                  <line
                    key={`h-grid-${i}`}
                    x1={padding}
                    y1={y}
                    x2={chartWidth + padding}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                  />
                )
              })}
              
              {/* Vertical grid lines */}
              {series[0]?.data.map((_, i) => {
                const x = getX(i, series[0].data.length) + padding
                return (
                  <line
                    key={`v-grid-${i}`}
                    x1={x}
                    y1={padding}
                    x2={x}
                    y2={chartHeight + padding}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                  />
                )
              })}
            </g>
          )}

          {/* Lines and points */}
          {series.map((s, seriesIndex) => {
            const path = createPath(s.data)
            const lineColor = s.color || colors.primary.DEFAULT
            
            return (
              <g key={s.name} style={animated ? getChildStyle(seriesIndex) : undefined}>
                {/* Line */}
                <path
                  d={path}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={s.strokeWidth || 3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform={`translate(${padding}, ${padding})`}
                  style={{
                    filter: `drop-shadow(0 2px 4px ${lineColor}30)`,
                    strokeDasharray: animated ? '1000' : 'none',
                    strokeDashoffset: animated ? '1000' : '0',
                    animation: animated ? `drawLine 1s ease-out ${seriesIndex * 200}ms forwards` : 'none',
                  }}
                />

                {/* Points */}
                {showPoints && s.data.map((point, pointIndex) => (
                  <circle
                    key={`${s.name}-${pointIndex}`}
                    cx={getX(pointIndex, s.data.length) + padding}
                    cy={getY(point.value) + padding}
                    r="4"
                    fill="white"
                    stroke={lineColor}
                    strokeWidth="3"
                    className="hover:r-6 transition-all duration-200 cursor-pointer"
                    style={{
                      filter: `drop-shadow(0 2px 4px ${lineColor}40)`,
                      opacity: animated ? 0 : 1,
                      animation: animated ? `fadeInPoint 0.3s ease-out ${(seriesIndex * 200) + (pointIndex * 100) + 800}ms forwards` : 'none',
                    }}
                  >
                    <title>{`${s.name}: ${point.value} (${point.label})`}</title>
                  </circle>
                ))}
              </g>
            )
          })}

          {/* Y-axis labels */}
          {Array.from({ length: 5 }, (_, i) => {
            const value = minValue + (valueRange * (4 - i) / 4)
            const y = (i / 4) * chartHeight + padding
            
            return (
              <text
                key={`y-label-${i}`}
                x={padding - 10}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-[#64748B]"
              >
                {Math.round(value).toLocaleString()}
              </text>
            )
          })}

          {/* X-axis labels */}
          {series[0]?.data.map((point, i) => (
            <text
              key={`x-label-${i}`}
              x={getX(i, series[0].data.length) + padding}
              y={chartHeight + padding + 20}
              textAnchor="middle"
              className="text-xs fill-[#64748B]"
            >
              {point.label}
            </text>
          ))}
        </svg>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes fadeInPoint {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}