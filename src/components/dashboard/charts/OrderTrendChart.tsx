'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Calendar, DollarSign, ShoppingCart } from 'lucide-react'

interface OrderTrendData {
  month: string
  orders: number
  revenue: number
  growth: number
}

interface OrderTrendProps {
  data: OrderTrendData[]
  timeRange: '6m' | '12m' | '24m'
  onTimeRangeChange?: (range: '6m' | '12m' | '24m') => void
  loading?: boolean
}

const OrderTrendChart: React.FC<OrderTrendProps> = ({
  data = [],
  timeRange = '12m',
  onTimeRangeChange,
  loading = false
}) => {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null)
  const [chartDimensions, setChartDimensions] = useState({ width: 800, height: 400 })

  // Calculate chart dimensions and scales
  const padding = { top: 20, right: 60, bottom: 60, left: 60 }
  const chartWidth = chartDimensions.width - padding.left - padding.right
  const chartHeight = chartDimensions.height - padding.top - padding.bottom

  const maxOrders = Math.max(...data.map(d => d.orders), 1)
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)
  const minRevenue = Math.min(...data.map(d => d.revenue), 0)

  // Generate path for orders line
  const ordersPath = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * chartWidth
      const y = chartHeight - (d.orders / maxOrders) * chartHeight
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  // Generate path for revenue line
  const revenuePath = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * chartWidth
      const y = chartHeight - ((d.revenue - minRevenue) / (maxRevenue - minRevenue)) * chartHeight
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  // Generate gradient area for orders
  const ordersAreaPath = `${ordersPath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`

  // Calculate summary stats
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0)
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  const avgGrowth = data.reduce((sum, d) => sum + d.growth, 0) / data.length

  const timeRangeOptions = [
    { value: '6m', label: '6 Months' },
    { value: '12m', label: '12 Months' },
    { value: '24m', label: '2 Years' }
  ]

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #E6F4FF',
        boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#E6F4FF', borderRadius: '12px' }} />
            <div>
              <div style={{ width: '120px', height: '20px', backgroundColor: '#E6F4FF', borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ width: '180px', height: '14px', backgroundColor: '#F3F4F6', borderRadius: '4px' }} />
            </div>
          </div>
          <div style={{ width: '200px', height: '36px', backgroundColor: '#E6F4FF', borderRadius: '8px' }} />
        </div>
        <div style={{ width: '100%', height: '300px', backgroundColor: '#F8FAFC', borderRadius: '12px' }} />
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid #E6F4FF',
      boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#E6F4FF',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={20} color="#006FEE" />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0A051E', marginBottom: '4px' }}>
              Order Trends
            </h3>
            <p style={{ fontSize: '14px', color: '#5B6B7D' }}>
              Track orders and revenue over time
            </p>
          </div>
        </div>
        
        {/* Time Range Selector */}
        <div style={{ display: 'flex', backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '4px' }}>
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onTimeRangeChange?.(option.value as any)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: timeRange === option.value ? '#006FEE' : 'transparent',
                color: timeRange === option.value ? 'white' : '#5B6B7D'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          padding: '16px',
          backgroundColor: '#F8FBFF',
          borderRadius: '12px',
          border: '1px solid #E6F4FF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShoppingCart size={16} color="#006FEE" />
            <span style={{ fontSize: '14px', color: '#5B6B7D', fontWeight: '500' }}>Total Orders</span>
          </div>
          <p style={{ fontSize: '24px', fontWeight: '800', color: '#0A051E' }}>
            {totalOrders.toLocaleString()}
          </p>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#F0FDF4',
          borderRadius: '12px',
          border: '1px solid #D1FAE5'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <DollarSign size={16} color="#10B981" />
            <span style={{ fontSize: '14px', color: '#5B6B7D', fontWeight: '500' }}>Total Revenue</span>
          </div>
          <p style={{ fontSize: '24px', fontWeight: '800', color: '#0A051E' }}>
            ${totalRevenue.toLocaleString()}
          </p>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: avgGrowth >= 0 ? '#F0FDF4' : '#FEF2F2',
          borderRadius: '12px',
          border: `1px solid ${avgGrowth >= 0 ? '#D1FAE5' : '#FECACA'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {avgGrowth >= 0 ? 
              <TrendingUp size={16} color="#10B981" /> : 
              <TrendingDown size={16} color="#EF4444" />
            }
            <span style={{ fontSize: '14px', color: '#5B6B7D', fontWeight: '500' }}>Avg Growth</span>
          </div>
          <p style={{ 
            fontSize: '24px', 
            fontWeight: '800', 
            color: avgGrowth >= 0 ? '#10B981' : '#EF4444' 
          }}>
            {avgGrowth >= 0 ? '+' : ''}{avgGrowth.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div style={{ position: 'relative', width: '100%', height: '400px' }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${chartDimensions.width} ${chartDimensions.height}`}
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="ordersGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#006FEE" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#006FEE" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1="0"
                y1={chartHeight * ratio}
                x2={chartWidth}
                y2={chartHeight * ratio}
                stroke="#F3F4F6"
                strokeWidth="1"
              />
            ))}

            {/* Orders area */}
            <path
              d={ordersAreaPath}
              fill="url(#ordersGradient)"
            />

            {/* Orders line */}
            <path
              d={ordersPath}
              stroke="#006FEE"
              strokeWidth="3"
              fill="none"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 111, 238, 0.2))' }}
            />

            {/* Revenue line */}
            <path
              d={revenuePath}
              stroke="#10B981"
              strokeWidth="3"
              fill="none"
              strokeDasharray="5,5"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.2))' }}
            />

            {/* Data points */}
            {data.map((d, i) => {
              const x = (i / (data.length - 1)) * chartWidth
              const ordersY = chartHeight - (d.orders / maxOrders) * chartHeight
              const revenueY = chartHeight - ((d.revenue - minRevenue) / (maxRevenue - minRevenue)) * chartHeight

              return (
                <g key={i}>
                  {/* Orders point */}
                  <circle
                    cx={x}
                    cy={ordersY}
                    r={selectedPoint === i ? "6" : "4"}
                    fill="#006FEE"
                    stroke="white"
                    strokeWidth="2"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setSelectedPoint(i)}
                    onMouseLeave={() => setSelectedPoint(null)}
                  />
                  
                  {/* Revenue point */}
                  <circle
                    cx={x}
                    cy={revenueY}
                    r={selectedPoint === i ? "6" : "4"}
                    fill="#10B981"
                    stroke="white"
                    strokeWidth="2"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setSelectedPoint(i)}
                    onMouseLeave={() => setSelectedPoint(null)}
                  />
                </g>
              )
            })}

            {/* X-axis labels */}
            {data.map((d, i) => {
              const x = (i / (data.length - 1)) * chartWidth
              return (
                <text
                  key={i}
                  x={x}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#5B6B7D"
                >
                  {d.month}
                </text>
              )
            })}

            {/* Y-axis labels - Orders */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <text
                key={`orders-${ratio}`}
                x="-10"
                y={chartHeight * (1 - ratio) + 4}
                textAnchor="end"
                fontSize="12"
                fill="#006FEE"
              >
                {Math.round(maxOrders * ratio)}
              </text>
            ))}

            {/* Y-axis labels - Revenue */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <text
                key={`revenue-${ratio}`}
                x={chartWidth + 10}
                y={chartHeight * (1 - ratio) + 4}
                textAnchor="start"
                fontSize="12"
                fill="#10B981"
              >
                ${Math.round((minRevenue + (maxRevenue - minRevenue) * ratio) / 1000)}k
              </text>
            ))}
          </g>

          {/* Tooltip */}
          {selectedPoint !== null && (
            <g>
              <rect
                x={padding.left + (selectedPoint / (data.length - 1)) * chartWidth - 60}
                y={padding.top - 80}
                width="120"
                height="70"
                rx="8"
                fill="white"
                stroke="#E6F4FF"
                strokeWidth="1"
                style={{ filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))' }}
              />
              <text
                x={padding.left + (selectedPoint / (data.length - 1)) * chartWidth}
                y={padding.top - 55}
                textAnchor="middle"
                fontSize="14"
                fontWeight="600"
                fill="#0A051E"
              >
                {data[selectedPoint]?.month}
              </text>
              <text
                x={padding.left + (selectedPoint / (data.length - 1)) * chartWidth}
                y={padding.top - 35}
                textAnchor="middle"
                fontSize="12"
                fill="#006FEE"
              >
                {data[selectedPoint]?.orders} orders
              </text>
              <text
                x={padding.left + (selectedPoint / (data.length - 1)) * chartWidth}
                y={padding.top - 20}
                textAnchor="middle"
                fontSize="12"
                fill="#10B981"
              >
                ${data[selectedPoint]?.revenue.toLocaleString()}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        marginTop: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '16px',
            height: '3px',
            backgroundColor: '#006FEE',
            borderRadius: '2px'
          }} />
          <span style={{ fontSize: '14px', color: '#5B6B7D' }}>Orders</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '16px',
            height: '3px',
            backgroundColor: '#10B981',
            borderRadius: '2px',
            background: 'repeating-linear-gradient(to right, #10B981 0px, #10B981 3px, transparent 3px, transparent 6px)'
          }} />
          <span style={{ fontSize: '14px', color: '#5B6B7D' }}>Revenue</span>
        </div>
      </div>
    </div>
  )
}

export default OrderTrendChart