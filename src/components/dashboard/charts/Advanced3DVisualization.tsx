'use client'

import React, { useState, useEffect } from 'react'
import { 
  Box, 
  BarChart3, 
  TrendingUp, 
  Globe, 
  Layers,
  Activity,
  Eye,
  Settings,
  Download,
  Share,
  Maximize
} from 'lucide-react'
import Interactive3DCharts from './Interactive3DCharts'

interface VisualizationData {
  id: string
  title: string
  description: string
  chartType: '3d-scatter' | '3d-surface' | '3d-bar' | '3d-line'
  data: Array<{
    x: number
    y: number
    z: number
    value: number
    label: string
    color?: string
    category?: string
  }>
  insights: string[]
  kpis: Array<{
    label: string
    value: string
    change: string
    trend: 'up' | 'down' | 'stable'
  }>
}

interface Advanced3DVisualizationProps {
  onExport?: (chartId: string, format: string) => void
  onShare?: (chartId: string) => void
}

const Advanced3DVisualization: React.FC<Advanced3DVisualizationProps> = ({
  onExport,
  onShare
}) => {
  const [activeVisualization, setActiveVisualization] = useState<string>('revenue-analysis')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [autoRotateAll, setAutoRotateAll] = useState(false)

  // Sample visualization data
  const visualizations: VisualizationData[] = [
    {
      id: 'revenue-analysis',
      title: 'Revenue Performance Analysis',
      description: 'Multi-dimensional view of revenue trends across time, geography, and product segments',
      chartType: '3d-surface',
      data: [
        { x: 1, y: 100000, z: 10, value: 150, label: 'Q1 North', color: '#006FEE', category: 'North' },
        { x: 2, y: 120000, z: 15, value: 180, label: 'Q2 North', color: '#0084FF', category: 'North' },
        { x: 3, y: 140000, z: 12, value: 220, label: 'Q3 North', color: '#00A3FF', category: 'North' },
        { x: 4, y: 160000, z: 18, value: 250, label: 'Q4 North', color: '#0066CC', category: 'North' },
        { x: 1, y: 80000, z: 8, value: 120, label: 'Q1 South', color: '#10B981', category: 'South' },
        { x: 2, y: 95000, z: 11, value: 145, label: 'Q2 South', color: '#06D6A0', category: 'South' },
        { x: 3, y: 110000, z: 14, value: 175, label: 'Q3 South', color: '#059669', category: 'South' },
        { x: 4, y: 125000, z: 16, value: 200, label: 'Q4 South', color: '#047857', category: 'South' },
        { x: 1, y: 90000, z: 12, value: 135, label: 'Q1 East', color: '#F59E0B', category: 'East' },
        { x: 2, y: 105000, z: 14, value: 160, label: 'Q2 East', color: '#FBBF24', category: 'East' },
        { x: 3, y: 115000, z: 13, value: 185, label: 'Q3 East', color: '#F59E0B', category: 'East' },
        { x: 4, y: 135000, z: 17, value: 210, label: 'Q4 East', color: '#D97706', category: 'East' },
      ],
      insights: [
        'Northern region shows consistent growth with 67% YoY increase',
        'Q4 performance exceeded targets across all regions',
        'Eastern region demonstrates strong momentum in H2',
        'Geographic expansion opportunities in underperforming areas'
      ],
      kpis: [
        { label: 'Total Revenue', value: '$2.1M', change: '+23.5%', trend: 'up' },
        { label: 'Growth Rate', value: '18.2%', change: '+3.1%', trend: 'up' },
        { label: 'Regional Variance', value: '12.4%', change: '-2.8%', trend: 'down' }
      ]
    },
    {
      id: 'customer-behavior',
      title: 'Customer Behavior Patterns',
      description: '3D analysis of customer engagement, retention, and lifetime value metrics',
      chartType: '3d-scatter',
      data: [
        { x: 85, y: 15600, z: 24, value: 180, label: 'Enterprise A', color: '#8B5CF6', category: 'Enterprise' },
        { x: 92, y: 18200, z: 30, value: 220, label: 'Enterprise B', color: '#A78BFA', category: 'Enterprise' },
        { x: 78, y: 12800, z: 18, value: 150, label: 'Enterprise C', color: '#7C3AED', category: 'Enterprise' },
        { x: 65, y: 8500, z: 12, value: 120, label: 'SMB A', color: '#EF4444', category: 'SMB' },
        { x: 72, y: 9200, z: 15, value: 140, label: 'SMB B', color: '#F87171', category: 'SMB' },
        { x: 58, y: 6800, z: 8, value: 100, label: 'SMB C', color: '#DC2626', category: 'SMB' },
        { x: 45, y: 3200, z: 6, value: 80, label: 'Startup A', color: '#10B981', category: 'Startup' },
        { x: 52, y: 4100, z: 9, value: 95, label: 'Startup B', color: '#34D399', category: 'Startup' },
        { x: 38, y: 2800, z: 4, value: 70, label: 'Startup C', color: '#059669', category: 'Startup' },
      ],
      insights: [
        'Enterprise customers show highest engagement and LTV correlation',
        'SMB segment has untapped potential for engagement improvement',
        'Startup segment requires different retention strategies',
        'Engagement score above 70% strongly predicts higher LTV'
      ],
      kpis: [
        { label: 'Avg Engagement', value: '68.5%', change: '+5.2%', trend: 'up' },
        { label: 'Customer LTV', value: '$12,400', change: '+8.7%', trend: 'up' },
        { label: 'Retention Rate', value: '87.3%', change: '+1.9%', trend: 'up' }
      ]
    },
    {
      id: 'market-opportunities',
      title: 'Market Opportunity Mapping',
      description: 'Strategic visualization of market size, competition intensity, and growth potential',
      chartType: '3d-bar',
      data: [
        { x: 25, y: 180000, z: 35, value: 200, label: 'Construction', color: '#F59E0B', category: 'High Growth' },
        { x: 40, y: 220000, z: 28, value: 180, label: 'Manufacturing', color: '#10B981', category: 'Stable' },
        { x: 15, y: 85000, z: 45, value: 150, label: 'Agriculture', color: '#EF4444', category: 'Emerging' },
        { x: 60, y: 350000, z: 55, value: 120, label: 'Transportation', color: '#8B5CF6', category: 'Saturated' },
        { x: 20, y: 95000, z: 25, value: 190, label: 'Renewable Energy', color: '#06D6A0', category: 'High Growth' },
        { x: 35, y: 160000, z: 40, value: 140, label: 'Marine', color: '#F97316', category: 'Niche' },
        { x: 30, y: 140000, z: 20, value: 170, label: 'Emergency Services', color: '#3B82F6', category: 'Stable' },
        { x: 12, y: 55000, z: 15, value: 210, label: 'Remote Operations', color: '#EC4899', category: 'Emerging' },
      ],
      insights: [
        'Construction and renewable energy show highest growth potential',
        'Transportation market is saturated but high-value',
        'Emerging segments offer low competition with growth upside',
        'Remote operations present untapped opportunities'
      ],
      kpis: [
        { label: 'Market Size', value: '$1.2B', change: '+15.3%', trend: 'up' },
        { label: 'Opportunity Score', value: '7.8/10', change: '+0.4', trend: 'up' },
        { label: 'Competition Index', value: '3.2/5', change: '-0.2', trend: 'down' }
      ]
    },
    {
      id: 'predictive-trends',
      title: 'Predictive Trend Analysis',
      description: 'Forward-looking visualization of predicted market movements and business outcomes',
      chartType: '3d-line',
      data: [
        { x: 1, y: 100, z: 50, value: 160, label: 'Current', color: '#006FEE', category: 'Baseline' },
        { x: 3, y: 115, z: 55, value: 180, label: '3M Forecast', color: '#0084FF', category: 'Optimistic' },
        { x: 6, y: 135, z: 62, value: 220, label: '6M Forecast', color: '#00A3FF', category: 'Optimistic' },
        { x: 12, y: 180, z: 75, value: 280, label: '12M Forecast', color: '#0066CC', category: 'Optimistic' },
        { x: 3, y: 105, z: 48, value: 170, label: '3M Conservative', color: '#10B981', category: 'Conservative' },
        { x: 6, y: 120, z: 52, value: 200, label: '6M Conservative', color: '#059669', category: 'Conservative' },
        { x: 12, y: 150, z: 65, value: 240, label: '12M Conservative', color: '#047857', category: 'Conservative' },
        { x: 3, y: 95, z: 45, value: 150, label: '3M Pessimistic', color: '#EF4444', category: 'Pessimistic' },
        { x: 6, y: 100, z: 48, value: 170, label: '6M Pessimistic', color: '#DC2626', category: 'Pessimistic' },
        { x: 12, y: 125, z: 55, value: 200, label: '12M Pessimistic', color: '#B91C1C', category: 'Pessimistic' },
      ],
      insights: [
        'All scenarios predict positive growth trajectory',
        'Optimistic scenario shows 75% growth potential by Q4',
        'Conservative estimates still maintain healthy 50% growth',
        'Risk factors could limit growth to 25% in worst case'
      ],
      kpis: [
        { label: 'Growth Probability', value: '78%', change: '+5%', trend: 'up' },
        { label: 'Forecast Accuracy', value: '91.2%', change: '+2.1%', trend: 'up' },
        { label: 'Risk Factor', value: '2.3/5', change: '-0.3', trend: 'down' }
      ]
    }
  ]

  const activeViz = visualizations.find(v => v.id === activeVisualization) || visualizations[0]

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      border: '1px solid #E6F4FF',
      boxShadow: '0 8px 24px rgba(0, 111, 238, 0.08)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: '32px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Box size={28} color="#006FEE" />
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0A051E', margin: 0 }}>
              Advanced 3D Analytics Suite
            </h2>
          </div>
          <p style={{ fontSize: '16px', color: '#5B6B7D', margin: 0 }}>
            Interactive multi-dimensional data visualization and analysis platform
          </p>
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setAutoRotateAll(!autoRotateAll)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: autoRotateAll ? '#006FEE' : 'white',
              color: autoRotateAll ? 'white' : '#006FEE',
              border: '2px solid #006FEE',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Activity size={16} />
            Auto Rotate
          </button>

          <button
            onClick={() => onExport?.(activeVisualization, 'png')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: 'white',
              color: '#006FEE',
              border: '2px solid #006FEE',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Download size={16} />
            Export
          </button>

          <button
            onClick={() => onShare?.(activeVisualization)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: 'white',
              color: '#006FEE',
              border: '2px solid #006FEE',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Share size={16} />
            Share
          </button>
        </div>
      </div>

      {/* Visualization Selector */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {visualizations.map((viz) => (
          <div
            key={viz.id}
            onClick={() => setActiveVisualization(viz.id)}
            style={{
              padding: '20px',
              borderRadius: '12px',
              border: activeVisualization === viz.id ? '2px solid #006FEE' : '2px solid #E6F4FF',
              backgroundColor: activeVisualization === viz.id ? '#F8FBFF' : 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: activeVisualization === viz.id ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: activeVisualization === viz.id 
                ? '0 8px 24px rgba(0, 111, 238, 0.12)' 
                : '0 2px 8px rgba(0, 111, 238, 0.04)'
            }}
            onMouseEnter={(e) => {
              if (activeVisualization !== viz.id) {
                e.currentTarget.style.borderColor = '#006FEE'
                e.currentTarget.style.backgroundColor = '#F8FBFF'
              }
            }}
            onMouseLeave={(e) => {
              if (activeVisualization !== viz.id) {
                e.currentTarget.style.borderColor = '#E6F4FF'
                e.currentTarget.style.backgroundColor = 'white'
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              {viz.chartType === '3d-scatter' && <Globe size={16} color="#006FEE" />}
              {viz.chartType === '3d-surface' && <Layers size={16} color="#006FEE" />}
              {viz.chartType === '3d-bar' && <BarChart3 size={16} color="#006FEE" />}
              {viz.chartType === '3d-line' && <TrendingUp size={16} color="#006FEE" />}
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0A051E', margin: 0 }}>
                {viz.title}
              </h4>
            </div>
            <p style={{ fontSize: '13px', color: '#5B6B7D', lineHeight: '1.4', margin: 0 }}>
              {viz.description}
            </p>
          </div>
        ))}
      </div>

      {/* Main Visualization */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: '32px',
        marginBottom: '32px'
      }}>
        {/* 3D Chart */}
        <div>
          <Interactive3DCharts
            data={activeViz.data}
            chartType={activeViz.chartType}
            width={800}
            height={500}
            autoRotate={autoRotateAll}
            showGrid={true}
            showLegend={false}
            onDataPointClick={(point) => {
              console.log('Selected point:', point)
            }}
          />
        </div>

        {/* Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* KPIs */}
          <div style={{
            padding: '20px',
            backgroundColor: '#F8FBFF',
            borderRadius: '12px',
            border: '1px solid #E6F4FF'
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0A051E', marginBottom: '16px' }}>
              Key Metrics
            </h4>
            {activeViz.kpis.map((kpi, index) => (
              <div key={index} style={{ marginBottom: index < activeViz.kpis.length - 1 ? '12px' : '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#5B6B7D' }}>{kpi.label}</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: kpi.trend === 'up' ? '#10B981' : kpi.trend === 'down' ? '#EF4444' : '#6B7280'
                  }}>
                    {kpi.change}
                  </span>
                </div>
                <p style={{ fontSize: '18px', fontWeight: '800', color: '#0A051E', margin: 0 }}>
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>

          {/* Insights */}
          <div style={{
            padding: '20px',
            backgroundColor: '#F0FDF4',
            borderRadius: '12px',
            border: '1px solid #D1FAE5'
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0A051E', marginBottom: '16px' }}>
              AI Insights
            </h4>
            {activeViz.insights.map((insight, index) => (
              <div key={index} style={{
                display: 'flex',
                gap: '8px',
                marginBottom: index < activeViz.insights.length - 1 ? '12px' : '0'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: '#10B981',
                  borderRadius: '50%',
                  marginTop: '6px',
                  flexShrink: 0
                }} />
                <p style={{ fontSize: '13px', color: '#047857', lineHeight: '1.4', margin: 0 }}>
                  {insight}
                </p>
              </div>
            ))}
          </div>

          {/* Chart Controls */}
          <div style={{
            padding: '20px',
            backgroundColor: '#FEF3C7',
            borderRadius: '12px',
            border: '1px solid #FDE68A'
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0A051E', marginBottom: '16px' }}>
              Quick Actions
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'white',
                color: '#D97706',
                border: '1px solid #FDE68A',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                🔍 Drill Down Analysis
              </button>
              <button style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'white',
                color: '#D97706',
                border: '1px solid #FDE68A',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                📊 Compare Scenarios
              </button>
              <button style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'white',
                color: '#D97706',
                border: '1px solid #FDE68A',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                📈 Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Summary */}
      <div style={{
        padding: '24px',
        backgroundColor: 'linear-gradient(135deg, #F8FAFC 0%, #E6F4FF 100%)',
        borderRadius: '12px',
        border: '1px solid #E6F4FF'
      }}>
        <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#0A051E', marginBottom: '16px' }}>
          Visualization Summary
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '24px', fontWeight: '800', color: '#006FEE', margin: '0 0 4px 0' }}>
              {activeViz.data.length}
            </p>
            <p style={{ fontSize: '14px', color: '#5B6B7D', margin: 0 }}>Data Points</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '24px', fontWeight: '800', color: '#10B981', margin: '0 0 4px 0' }}>
              {Math.max(...activeViz.data.map(d => d.value))}
            </p>
            <p style={{ fontSize: '14px', color: '#5B6B7D', margin: 0 }}>Peak Value</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '24px', fontWeight: '800', color: '#F59E0B', margin: '0 0 4px 0' }}>
              {new Set(activeViz.data.map(d => d.category)).size}
            </p>
            <p style={{ fontSize: '14px', color: '#5B6B7D', margin: 0 }}>Categories</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '24px', fontWeight: '800', color: '#8B5CF6', margin: '0 0 4px 0' }}>
              {activeViz.chartType.replace('-', ' ').replace('3d', '3D')}
            </p>
            <p style={{ fontSize: '14px', color: '#5B6B7D', margin: 0 }}>Chart Type</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Advanced3DVisualization