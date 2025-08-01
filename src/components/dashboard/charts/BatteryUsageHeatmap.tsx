'use client'

import React, { useState } from 'react'
import { Battery, Clock, Zap, AlertTriangle, Calendar, TrendingUp } from 'lucide-react'

interface UsageData {
  day: string
  hour: number
  intensity: number // 0-1 scale
  batteryCount: number
  avgRuntime: number
}

interface BatteryUsageHeatmapProps {
  data: UsageData[]
  loading?: boolean
  timeRange?: 'week' | 'month'
  onTimeRangeChange?: (range: 'week' | 'month') => void
}

const BatteryUsageHeatmap: React.FC<BatteryUsageHeatmapProps> = ({
  data = [],
  loading = false,
  timeRange = 'week',
  onTimeRangeChange
}) => {
  const [selectedCell, setSelectedCell] = useState<{ day: string; hour: number } | null>(null)
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
  // Generate sample data if none provided
  const generateSampleData = (): UsageData[] => {
    const sampleData: UsageData[] = []
    days.forEach((day, dayIndex) => {
      hours.forEach((hour) => {
        // Simulate realistic construction work patterns
        let intensity = 0
        const isWeekday = dayIndex < 5
        const isWorkHours = hour >= 6 && hour <= 18
        
        if (isWeekday && isWorkHours) {
          // Peak hours: 8-12, 13-17
          if ((hour >= 8 && hour <= 12) || (hour >= 13 && hour <= 17)) {
            intensity = 0.7 + Math.random() * 0.3
          } else if (hour >= 6 && hour <= 8 || hour >= 17 && hour <= 18) {
            intensity = 0.3 + Math.random() * 0.4
          }
        } else if (!isWeekday && isWorkHours) {
          // Weekend work (lighter)
          intensity = Math.random() * 0.4
        }
        
        sampleData.push({
          day,
          hour,
          intensity,
          batteryCount: Math.floor(intensity * 50) + Math.floor(Math.random() * 10),
          avgRuntime: 2 + intensity * 6 + Math.random() * 2
        })
      })
    })
    return sampleData
  }
  
  const chartData = data.length > 0 ? data : generateSampleData()
  
  // Find selected cell data
  const selectedData = selectedCell ? 
    chartData.find(d => d.day === selectedCell.day && d.hour === selectedCell.hour) : null
  
  // Calculate insights
  const peakUsageTime = chartData.reduce((max, current) => 
    current.intensity > max.intensity ? current : max
  )
  
  const avgDailyUsage = days.map(day => {
    const dayData = chartData.filter(d => d.day === day)
    const totalIntensity = dayData.reduce((sum, d) => sum + d.intensity, 0)
    return { day, intensity: totalIntensity / dayData.length }
  })
  
  const getIntensityColor = (intensity: number): string => {
    if (intensity === 0) return '#F8FAFC'
    if (intensity < 0.2) return '#E6F4FF'
    if (intensity < 0.4) return '#BFDBFE'
    if (intensity < 0.6) return '#93C5FD'
    if (intensity < 0.8) return '#3B82F6'
    return '#1D4ED8'
  }

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
              <div style={{ width: '140px', height: '20px', backgroundColor: '#E6F4FF', borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ width: '180px', height: '14px', backgroundColor: '#F3F4F6', borderRadius: '4px' }} />
            </div>
          </div>
          <div style={{ width: '150px', height: '36px', backgroundColor: '#E6F4FF', borderRadius: '8px' }} />
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
            backgroundColor: '#FEF3C7',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Battery size={20} color="#F59E0B" />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0A051E', marginBottom: '4px' }}>
              Battery Usage Patterns
            </h3>
            <p style={{ fontSize: '14px', color: '#5B6B7D' }}>
              Track usage intensity across time and schedule maintenance
            </p>
          </div>
        </div>
        
        {/* Time Range Selector */}
        <div style={{ display: 'flex', backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '4px' }}>
          {[
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' }
          ].map((option) => (
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
                backgroundColor: timeRange === option.value ? '#F59E0B' : 'transparent',
                color: timeRange === option.value ? 'white' : '#5B6B7D'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          padding: '16px',
          backgroundColor: '#FEF3C7',
          borderRadius: '12px',
          border: '1px solid #FDE68A'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Zap size={16} color="#F59E0B" />
            <span style={{ fontSize: '14px', color: '#5B6B7D', fontWeight: '500' }}>Peak Usage</span>
          </div>
          <p style={{ fontSize: '20px', fontWeight: '800', color: '#0A051E', marginBottom: '2px' }}>
            {peakUsageTime.day} {peakUsageTime.hour}:00
          </p>
          <p style={{ fontSize: '12px', color: '#5B6B7D' }}>
            {peakUsageTime.batteryCount} batteries active
          </p>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#F0F9FF',
          borderRadius: '12px',
          border: '1px solid #E0F2FE'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Clock size={16} color="#0284C7" />
            <span style={{ fontSize: '14px', color: '#5B6B7D', fontWeight: '500' }}>Avg Runtime</span>
          </div>
          <p style={{ fontSize: '20px', fontWeight: '800', color: '#0A051E', marginBottom: '2px' }}>
            {(chartData.reduce((sum, d) => sum + d.avgRuntime, 0) / chartData.length).toFixed(1)}h
          </p>
          <p style={{ fontSize: '12px', color: '#5B6B7D' }}>
            Per battery session
          </p>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#F0FDF4',
          borderRadius: '12px',
          border: '1px solid #D1FAE5'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <TrendingUp size={16} color="#10B981" />
            <span style={{ fontSize: '14px', color: '#5B6B7D', fontWeight: '500' }}>Efficiency</span>
          </div>
          <p style={{ fontSize: '20px', fontWeight: '800', color: '#10B981', marginBottom: '2px' }}>
            94%
          </p>
          <p style={{ fontSize: '12px', color: '#5B6B7D' }}>
            Optimal usage rate
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px' }}>
        {/* Heatmap */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#0A051E' }}>
                Usage Intensity Heatmap
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#5B6B7D' }}>Low</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity, i) => (
                    <div
                      key={i}
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: getIntensityColor(intensity),
                        borderRadius: '2px'
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: '12px', color: '#5B6B7D' }}>High</span>
              </div>
            </div>
          </div>

          {/* Time labels */}
          <div style={{ display: 'flex', marginBottom: '8px' }}>
            <div style={{ width: '40px' }}></div>
            {[0, 6, 12, 18].map((hour) => (
              <div
                key={hour}
                style={{
                  flex: '1',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#5B6B7D',
                  fontWeight: '500'
                }}
              >
                {hour}:00
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {days.map((day) => (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#5B6B7D',
                  textAlign: 'right'
                }}>
                  {day}
                </div>
                <div style={{ display: 'flex', gap: '1px', flex: 1 }}>
                  {hours.map((hour) => {
                    const cellData = chartData.find(d => d.day === day && d.hour === hour)
                    const intensity = cellData?.intensity || 0
                    const isSelected = selectedCell?.day === day && selectedCell?.hour === hour
                    
                    return (
                      <div
                        key={`${day}-${hour}`}
                        style={{
                          flex: 1,
                          height: '20px',
                          backgroundColor: getIntensityColor(intensity),
                          cursor: 'pointer',
                          borderRadius: '2px',
                          border: isSelected ? '2px solid #006FEE' : '1px solid transparent',
                          transition: 'all 0.2s ease',
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                        }}
                        onMouseEnter={() => setSelectedCell({ day, hour })}
                        onMouseLeave={() => setSelectedCell(null)}
                        title={`${day} ${hour}:00 - ${Math.round(intensity * 100)}% intensity`}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side panel */}
        <div style={{ width: '280px' }}>
          {/* Selected cell details */}
          {selectedData && (
            <div style={{
              padding: '20px',
              backgroundColor: '#F8FBFF',
              borderRadius: '12px',
              border: '1px solid #E6F4FF',
              marginBottom: '24px'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0A051E', marginBottom: '12px' }}>
                {selectedData.day} {selectedData.hour}:00
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#5B6B7D' }}>Intensity:</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#0A051E' }}>
                    {Math.round(selectedData.intensity * 100)}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#5B6B7D' }}>Active Batteries:</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#0A051E' }}>
                    {selectedData.batteryCount}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#5B6B7D' }}>Avg Runtime:</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#0A051E' }}>
                    {selectedData.avgRuntime.toFixed(1)}h
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Daily averages */}
          <div style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #F3F4F6'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0A051E', marginBottom: '12px' }}>
              Daily Averages
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {avgDailyUsage.map((dayData) => (
                <div key={dayData.day} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', width: '30px', color: '#5B6B7D' }}>
                    {dayData.day}
                  </span>
                  <div style={{ flex: 1, height: '8px', backgroundColor: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${dayData.intensity * 100}%`,
                        height: '100%',
                        backgroundColor: getIntensityColor(dayData.intensity),
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '12px', width: '30px', textAlign: 'right', color: '#5B6B7D' }}>
                    {Math.round(dayData.intensity * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance recommendations */}
          <div style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: '#FEF2F2',
            borderRadius: '12px',
            border: '1px solid #FECACA'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertTriangle size={16} color="#EF4444" />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#0A051E' }}>
                Maintenance Alert
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#5B6B7D', lineHeight: '1.5' }}>
              High usage detected during peak hours. Consider rotating battery sets to extend lifespan and ensure optimal performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BatteryUsageHeatmap