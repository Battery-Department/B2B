'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Layers,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move3D,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react'

interface DataPoint3D {
  x: number
  y: number
  z: number
  value: number
  label: string
  color?: string
  metadata?: Record<string, any>
}

interface Interactive3DChartsProps {
  data?: DataPoint3D[]
  chartType?: '3d-scatter' | '3d-surface' | '3d-bar' | '3d-line'
  width?: number
  height?: number
  onDataPointClick?: (point: DataPoint3D) => void
  autoRotate?: boolean
  showGrid?: boolean
  showLegend?: boolean
}

const Interactive3DCharts: React.FC<Interactive3DChartsProps> = ({
  data = [],
  chartType = '3d-scatter',
  width = 800,
  height = 600,
  onDataPointClick,
  autoRotate = false,
  showGrid = true,
  showLegend = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 })
  const [zoom, setZoom] = useState(1)
  const [isAnimating, setIsAnimating] = useState(autoRotate)
  const [selectedPoint, setSelectedPoint] = useState<DataPoint3D | null>(null)
  const [viewMode, setViewMode] = useState<'3d' | 'top' | 'side' | 'front'>('3d')
  
  // Sample data if none provided
  const defaultData: DataPoint3D[] = [
    { x: 10, y: 20, z: 30, value: 100, label: 'Revenue Q1', color: '#006FEE' },
    { x: 20, y: 35, z: 25, value: 150, label: 'Revenue Q2', color: '#0084FF' },
    { x: 30, y: 45, z: 40, value: 200, label: 'Revenue Q3', color: '#00A3FF' },
    { x: 40, y: 50, z: 35, value: 180, label: 'Revenue Q4', color: '#0066CC' },
    { x: 15, y: 30, z: 20, value: 120, label: 'Customers Q1', color: '#10B981' },
    { x: 25, y: 40, z: 30, value: 170, label: 'Customers Q2', color: '#06D6A0' },
    { x: 35, y: 55, z: 45, value: 220, label: 'Customers Q3', color: '#059669' },
    { x: 45, y: 60, z: 40, value: 190, label: 'Customers Q4', color: '#047857' },
  ]

  const chartData = data.length > 0 ? data : defaultData

  // Animation loop
  useEffect(() => {
    let animationFrame: number
    
    if (isAnimating) {
      const animate = () => {
        setRotation(prev => ({
          ...prev,
          y: (prev.y + 1) % 360
        }))
        animationFrame = requestAnimationFrame(animate)
      }
      animationFrame = requestAnimationFrame(animate)
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isAnimating])

  // Canvas drawing logic (simplified 3D projection)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    // Set canvas size
    canvas.width = width
    canvas.height = height

    // 3D to 2D projection
    const project3D = (x: number, y: number, z: number) => {
      const distance = 1000
      const centerX = width / 2
      const centerY = height / 2
      
      // Apply rotation
      const radX = (rotation.x * Math.PI) / 180
      const radY = (rotation.y * Math.PI) / 180
      const radZ = (rotation.z * Math.PI) / 180
      
      // Rotate around Y axis
      const cosY = Math.cos(radY)
      const sinY = Math.sin(radY)
      const x1 = x * cosY - z * sinY
      const z1 = x * sinY + z * cosY
      
      // Rotate around X axis
      const cosX = Math.cos(radX)
      const sinX = Math.sin(radX)
      const y1 = y * cosX - z1 * sinX
      const z2 = y * sinX + z1 * cosX
      
      // Project to 2D
      const scale = (distance / (distance + z2)) * zoom
      const x2D = centerX + x1 * scale * 5
      const y2D = centerY - y1 * scale * 5
      
      return { x: x2D, y: y2D, scale }
    }

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = 'rgba(0, 111, 238, 0.1)'
      ctx.lineWidth = 1
      
      for (let i = -50; i <= 50; i += 10) {
        // X-axis lines
        const start = project3D(i, 0, -50)
        const end = project3D(i, 0, 50)
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
        
        // Z-axis lines
        const start2 = project3D(-50, 0, i)
        const end2 = project3D(50, 0, i)
        ctx.beginPath()
        ctx.moveTo(start2.x, start2.y)
        ctx.lineTo(end2.x, end2.y)
        ctx.stroke()
      }
    }

    // Draw data points based on chart type
    chartData.forEach((point, index) => {
      const projected = project3D(point.x, point.y, point.z)
      const size = Math.max(5, point.value / 10) * projected.scale
      
      ctx.fillStyle = point.color || '#006FEE'
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      
      switch (chartType) {
        case '3d-scatter':
          ctx.beginPath()
          ctx.arc(projected.x, projected.y, size, 0, 2 * Math.PI)
          ctx.fill()
          ctx.stroke()
          break
          
        case '3d-bar':
          const barHeight = point.value * projected.scale * 2
          ctx.fillRect(projected.x - size/2, projected.y - barHeight, size, barHeight)
          ctx.strokeRect(projected.x - size/2, projected.y - barHeight, size, barHeight)
          break
          
        case '3d-surface':
          // Connect points with lines for surface effect
          if (index > 0) {
            const prevPoint = chartData[index - 1]
            const prevProjected = project3D(prevPoint.x, prevPoint.y, prevPoint.z)
            ctx.beginPath()
            ctx.moveTo(prevProjected.x, prevProjected.y)
            ctx.lineTo(projected.x, projected.y)
            ctx.strokeStyle = point.color || '#006FEE'
            ctx.lineWidth = 3
            ctx.stroke()
          }
          
          ctx.beginPath()
          ctx.arc(projected.x, projected.y, size, 0, 2 * Math.PI)
          ctx.fill()
          break
          
        case '3d-line':
          if (index > 0) {
            const prevPoint = chartData[index - 1]
            const prevProjected = project3D(prevPoint.x, prevPoint.y, prevPoint.z)
            ctx.beginPath()
            ctx.moveTo(prevProjected.x, prevProjected.y)
            ctx.lineTo(projected.x, projected.y)
            ctx.strokeStyle = point.color || '#006FEE'
            ctx.lineWidth = 4
            ctx.stroke()
          }
          
          ctx.beginPath()
          ctx.arc(projected.x, projected.y, size/2, 0, 2 * Math.PI)
          ctx.fill()
          break
      }
      
      // Draw labels
      if (projected.scale > 0.5) {
        ctx.fillStyle = '#0A051E'
        ctx.font = `${Math.max(10, 12 * projected.scale)}px -apple-system, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(point.label, projected.x, projected.y - size - 5)
      }
    })

    // Draw selected point highlight
    if (selectedPoint) {
      const highlighted = project3D(selectedPoint.x, selectedPoint.y, selectedPoint.z)
      ctx.strokeStyle = '#FFB800'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(highlighted.x, highlighted.y, Math.max(10, selectedPoint.value / 10) * highlighted.scale + 5, 0, 2 * Math.PI)
      ctx.stroke()
    }

  }, [chartData, rotation, zoom, chartType, showGrid, selectedPoint, width, height])

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const clickY = event.clientY - rect.top

    // Find closest data point (simplified)
    let closestPoint: DataPoint3D | null = null
    let minDistance = Infinity

    chartData.forEach(point => {
      const distance = 1000
      const centerX = width / 2
      const centerY = height / 2
      
      const radY = (rotation.y * Math.PI) / 180
      const cosY = Math.cos(radY)
      const sinY = Math.sin(radY)
      const x1 = point.x * cosY - point.z * sinY
      const z1 = point.x * sinY + point.z * cosY
      
      const scale = (distance / (distance + z1)) * zoom
      const x2D = centerX + x1 * scale * 5
      const y2D = centerY - point.y * scale * 5
      
      const dist = Math.sqrt((clickX - x2D) ** 2 + (clickY - y2D) ** 2)
      if (dist < minDistance && dist < 30) {
        minDistance = dist
        closestPoint = point
      }
    })

    if (closestPoint) {
      setSelectedPoint(closestPoint)
      onDataPointClick?.(closestPoint)
    }
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid #E6F4FF',
      boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChart3 size={24} color="#006FEE" />
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0A051E', margin: 0 }}>
            Interactive 3D Analytics
          </h3>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Chart Type Selector */}
          <select
            value={chartType}
            onChange={(e) => setViewMode(e.target.value as any)}
            style={{
              padding: '6px 12px',
              border: '2px solid #E6F4FF',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: 'white',
              color: '#0A051E'
            }}
          >
            <option value="3d-scatter">3D Scatter</option>
            <option value="3d-bar">3D Bar</option>
            <option value="3d-surface">3D Surface</option>
            <option value="3d-line">3D Line</option>
          </select>

          {/* Animation Control */}
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            style={{
              padding: '8px',
              backgroundColor: isAnimating ? '#006FEE' : 'white',
              color: isAnimating ? 'white' : '#006FEE',
              border: '2px solid #006FEE',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {isAnimating ? <Pause size={16} /> : <Play size={16} />}
          </button>

          {/* Zoom Controls */}
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))}
            style={{
              padding: '8px',
              backgroundColor: 'white',
              color: '#006FEE',
              border: '2px solid #006FEE',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <ZoomIn size={16} />
          </button>
          
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}
            style={{
              padding: '8px',
              backgroundColor: 'white',
              color: '#006FEE',
              border: '2px solid #006FEE',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <ZoomOut size={16} />
          </button>

          {/* Reset View */}
          <button
            onClick={() => {
              setRotation({ x: 0, y: 0, z: 0 })
              setZoom(1)
              setSelectedPoint(null)
            }}
            style={{
              padding: '8px',
              backgroundColor: 'white',
              color: '#006FEE',
              border: '2px solid #006FEE',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div style={{ 
        display: 'flex', 
        gap: '24px',
        alignItems: 'flex-start'
      }}>
        <div style={{ 
          flex: 1,
          border: '2px solid #E6F4FF',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#F8FBFF'
        }}>
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onClick={handleCanvasClick}
            style={{
              cursor: 'pointer',
              display: 'block',
              width: '100%',
              height: 'auto'
            }}
          />
        </div>

        {/* Control Panel */}
        <div style={{ 
          width: '200px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Rotation Controls */}
          <div style={{
            padding: '16px',
            backgroundColor: '#F8FBFF',
            borderRadius: '12px',
            border: '1px solid #E6F4FF'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0A051E', marginBottom: '12px' }}>
              Rotation
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: '#5B6B7D' }}>X-Axis</label>
              <input
                type="range"
                min="0"
                max="360"
                value={rotation.x}
                onChange={(e) => setRotation(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
              
              <label style={{ fontSize: '12px', color: '#5B6B7D' }}>Y-Axis</label>
              <input
                type="range"
                min="0"
                max="360"
                value={rotation.y}
                onChange={(e) => setRotation(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
              
              <label style={{ fontSize: '12px', color: '#5B6B7D' }}>Z-Axis</label>
              <input
                type="range"
                min="0"
                max="360"
                value={rotation.z}
                onChange={(e) => setRotation(prev => ({ ...prev, z: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Selected Point Info */}
          {selectedPoint && (
            <div style={{
              padding: '16px',
              backgroundColor: '#F0FDF4',
              borderRadius: '12px',
              border: '1px solid #D1FAE5'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0A051E', marginBottom: '8px' }}>
                Selected Point
              </h4>
              <p style={{ fontSize: '12px', color: '#047857', margin: '0 0 4px 0' }}>
                <strong>{selectedPoint.label}</strong>
              </p>
              <p style={{ fontSize: '11px', color: '#059669', margin: '0 0 2px 0' }}>
                X: {selectedPoint.x}, Y: {selectedPoint.y}, Z: {selectedPoint.z}
              </p>
              <p style={{ fontSize: '11px', color: '#059669', margin: '0' }}>
                Value: {selectedPoint.value}
              </p>
            </div>
          )}

          {/* Chart Statistics */}
          <div style={{
            padding: '16px',
            backgroundColor: '#F8FBFF',
            borderRadius: '12px',
            border: '1px solid #E6F4FF'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0A051E', marginBottom: '8px' }}>
              Statistics
            </h4>
            <div style={{ fontSize: '11px', color: '#5B6B7D', lineHeight: '1.4' }}>
              <p style={{ margin: '0 0 4px 0' }}>Data Points: {chartData.length}</p>
              <p style={{ margin: '0 0 4px 0' }}>Zoom: {(zoom * 100).toFixed(0)}%</p>
              <p style={{ margin: '0 0 4px 0' }}>Max Value: {Math.max(...chartData.map(p => p.value))}</p>
              <p style={{ margin: '0' }}>Min Value: {Math.min(...chartData.map(p => p.value))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#F8FBFF',
          borderRadius: '12px',
          border: '1px solid #E6F4FF'
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0A051E', marginBottom: '12px' }}>
            Interactive Controls
          </h4>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            fontSize: '12px',
            color: '#5B6B7D'
          }}>
            <div>• Click points to select and view details</div>
            <div>• Use sliders to manually rotate the chart</div>
            <div>• Zoom in/out with the control buttons</div>
            <div>• Toggle auto-rotation with play/pause</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Interactive3DCharts