'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { SkeletonCard, SkeletonLine } from '@/components/ui/skeleton'
import MobileDashboard from '@/components/dashboard/mobile/MobileDashboard'
import { useOnlineStatus } from '@/utils/offline'
import { useLocalCart } from '@/hooks/useLocalCart'
import FinancialDashboard from '@/components/dashboard/FinancialDashboard'
import {
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  ShoppingCart,
  Plus,
  Minus,
  Calendar,
  Grid,
  Download,
  RefreshCw,
  Activity,
  Award,
  Bell,
  Truck,
  Star,
  Calculator,
  FileText,
  Search,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Filter,
  Cloud,
  CloudRain,
  Sun,
  CloudSnow,
  Battery,
  Zap,
  DollarSign,
  CheckCircle,
  Circle,
  AlertCircle,
  X,
  BarChart3,
  ShoppingBag,
  Eye,
  History,
  Box,
  MapPin,
  User,
  HelpCircle,
  FileDown,
  CreditCard,
  Plane,
  Ship,
  Info,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Users,
  ChevronLeft,
  Sparkles,
  Edit2,
  Shield
} from 'lucide-react'

// Standardized Design System Colors (Updated to Battery Department Brand)
const colors = {
  // Primary Colors (Battery Department Blue)
  primary: '#006FEE',
  primaryDark: '#0050B3',
  primaryLight: '#2B8FFF',
  
  // Grays
  gray900: '#111827',
  gray700: '#374151',
  gray600: '#6B7280',
  gray500: '#9CA3AF',
  gray400: '#D1D5DB',
  gray300: '#E5E7EB',
  gray200: '#F3F4F6',
  gray100: '#F9FAFB',
  
  // Background
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F9FAFB',
  
  // Status Colors
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  
  // Special
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent'
}

// Typography System
const typography = {
  // Section Headers
  sectionHeader: {
    fontSize: '18px',
    fontWeight: '600',
    color: colors.gray900,
    lineHeight: '28px'
  },
  
  // Card Labels
  cardLabel: {
    fontSize: '12px',
    fontWeight: '400',
    color: colors.gray600,
    lineHeight: '16px'
  },
  
  // Metric Values
  metricValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: colors.gray900,
    lineHeight: '32px'
  },
  
  // Regular Text
  body: {
    fontSize: '14px',
    fontWeight: '400',
    color: colors.gray700,
    lineHeight: '20px'
  },
  
  // Small Text
  small: {
    fontSize: '12px',
    fontWeight: '400',
    color: colors.gray600,
    lineHeight: '16px'
  }
}

// Spacing System (8px grid)
const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '40px'
}

// Standardized Component Styles
const componentStyles = {
  // Cards
  card: {
    backgroundColor: colors.white,
    borderRadius: '8px',
    padding: spacing.md,
    border: `1px solid ${colors.gray300}`,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease'
  },
  
  // Buttons
  button: {
    primary: {
      height: '36px',
      padding: '0 16px',
      backgroundColor: colors.primary,
      color: colors.white,
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm
    },
    secondary: {
      height: '36px',
      padding: '0 16px',
      backgroundColor: colors.white,
      color: colors.gray700,
      border: `1px solid ${colors.gray300}`,
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm
    }
  },
  
  // Inputs
  input: {
    height: '36px',
    padding: '8px 12px',
    backgroundColor: colors.white,
    border: `1px solid ${colors.gray300}`,
    borderRadius: '4px',
    fontSize: '14px',
    color: colors.gray900,
    outline: 'none',
    transition: 'all 0.2s ease'
  },
  
  // Tooltips
  tooltip: {
    backgroundColor: '#1F2937',
    color: colors.white,
    padding: spacing.sm,
    borderRadius: '4px',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    whiteSpace: 'nowrap',
    zIndex: 1000
  }
}

// Toast notification system
const Toast = ({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error' | 'info'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = type === 'success' ? colors.success : type === 'error' ? colors.error : colors.info
  const iconComponent = type === 'success' ? <CheckCircle size={16} /> : type === 'error' ? <AlertCircle size={16} /> : <Info size={16} />

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: colors.white,
      borderRadius: '8px',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      animation: 'slideIn 0.3s ease forwards'
    }}>
      <div style={{ color: bgColor }}>{iconComponent}</div>
      <span style={{ fontSize: '14px', color: colors.gray700 }}>{message}</span>
      <button onClick={onClose} style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>
        <X size={16} color={colors.gray400} />
      </button>
    </div>
  )
}

// Confirmation dialog component with blur effect
const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string 
}) => {
  if (!isOpen) return null

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 999,
        animation: 'fadeIn 0.2s ease'
      }} onClick={onClose} />
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: colors.white,
        borderRadius: '8px',
        padding: spacing.lg,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        minWidth: '320px',
        animation: 'scaleIn 0.2s ease'
      }}>
        <h3 style={{ ...typography.sectionHeader, marginBottom: spacing.sm }}>{title}</h3>
        <p style={{ ...typography.body, marginBottom: spacing.lg }}>{message}</p>
        <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              ...componentStyles.button.secondary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.gray100
              e.currentTarget.style.borderColor = colors.gray400
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.white
              e.currentTarget.style.borderColor = colors.gray300
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            style={{
              ...componentStyles.button.primary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.primaryDark
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </>
  )
}

// Fleet Status Overview Component  
const FleetStatusOverview = () => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      padding: `0 ${spacing.md}`,
      height: '40px',
      borderRight: `1px solid ${colors.gray300}`
    }}>
      <CheckCircle size={14} color={colors.success} />
      <span style={{ ...typography.small, fontWeight: '500', color: colors.success }}>
        Fleet Operational
      </span>
      <span style={{ ...typography.small, color: colors.gray500 }}>
        45 Active
      </span>
    </div>
  )
}

// Sparkline component with consistent alignment
const Sparkline = ({ data, color, size = 'small' }: { data: number[]; color: string; size?: 'small' | 'medium' }) => {
  const width = 120
  const height = 40
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * (height - 8) - 4
    return { x, y, value }
  })

  const pathData = points.reduce((path, point, index) => {
    return path + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`)
  }, '')

  return (
    <div style={{ 
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '40px',
      padding: spacing.sm
    }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3"
            fill={hoveredPoint === index ? color : 'transparent'}
            stroke={hoveredPoint === index ? color : 'transparent'}
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredPoint(index)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}
      </svg>
      {hoveredPoint !== null && (
        <div style={{
          ...componentStyles.tooltip,
          position: 'absolute',
          top: '-32px',
          left: points[hoveredPoint].x - 20
        }}>
          ${points[hoveredPoint].value.toLocaleString()}
        </div>
      )}
    </div>
  )
}

// Simple spending chart for contractors
const SpendingChart = ({ onExport }: { onExport: () => void }) => {
  const [timeFilter, setTimeFilter] = useState('6M')
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  const data = [
    { month: 'Jan', spending: 3200 },
    { month: 'Feb', spending: 2800 },
    { month: 'Mar', spending: 3500 },
    { month: 'Apr', spending: 4200 },
    { month: 'May', spending: 4875 },
    { month: 'Jun', spending: 5100 }
  ]

  const maxSpending = 6000 // Fixed max for consistent scale
  const chartHeight = 160

  return (
    <div style={componentStyles.card}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: spacing.lg
      }}>
        <div>
          <h3 style={typography.sectionHeader}>
            Spending Analytics
          </h3>
          <p style={{ ...typography.small, marginTop: '2px' }}>
            Monthly battery purchases
          </p>
        </div>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            style={{
              ...componentStyles.input,
              width: 'auto',
              cursor: 'pointer'
            }}
          >
            <option value="1M">1 Month</option>
            <option value="3M">3 Months</option>
            <option value="6M">6 Months</option>
            <option value="1Y">1 Year</option>
          </select>
          <button
            onClick={onExport}
            style={componentStyles.button.secondary}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.gray100
              e.currentTarget.style.borderColor = colors.gray400
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.white
              e.currentTarget.style.borderColor = colors.gray300
            }}
          >
            <FileDown size={14} />
            Export
          </button>
        </div>
      </div>

      <div style={{ 
        position: 'relative',
        paddingLeft: spacing.xxl,
        paddingRight: spacing.md,
        paddingBottom: spacing.lg
      }} ref={chartRef}>
        {/* Y-axis labels - positioned outside chart area */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: chartHeight,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '32px',
          textAlign: 'right'
        }}>
          {['$5k', '$4k', '$3k', '$2k', '$1k', '$0'].map((value, index) => (
            <span key={value} style={{ 
              ...typography.small,
              color: colors.gray500,
              lineHeight: '12px'
            }}>
              {value}
            </span>
          ))}
        </div>

        {/* Grid lines with 5% opacity */}
        <div style={{ position: 'absolute', left: spacing.xxl, right: 0, top: 0, height: chartHeight }}>
          {[0, 20, 40, 60, 80, 100].map((percent) => (
            <div
              key={percent}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${percent}%`,
                borderTop: `1px solid rgba(0, 0, 0, 0.05)`
              }}
            />
          ))}
        </div>

        {/* Bars with proper spacing */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-end',
          gap: '4px',
          height: chartHeight,
          position: 'relative',
          zIndex: 1,
          marginLeft: spacing.sm
        }}>
          {data.map((item, index) => {
            const height = (item.spending / maxSpending) * chartHeight
            return (
              <div
                key={item.month}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
                onClick={() => {
                  console.log(`Drill down to ${item.month} spending details`)
                }}
              >
                <div style={{ position: 'relative', width: '100%' }}>
                  <div
                    style={{
                      width: '100%',
                      height: `${height}px`,
                      backgroundColor: hoveredBar === index ? colors.primaryDark : colors.primary,
                      borderRadius: '4px 4px 0 0',
                      transition: 'all 0.3s ease',
                      transform: hoveredBar === index ? 'scaleY(1.02)' : 'scaleY(1)',
                      transformOrigin: 'bottom'
                    }}
                  />
                  {hoveredBar === index && (
                    <div style={{
                      ...componentStyles.tooltip,
                      position: 'absolute',
                      bottom: `${height + 10}px`,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}>
                      ${item.spending.toLocaleString()}
                      <div style={{
                        position: 'absolute',
                        bottom: '-4px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '4px solid transparent',
                        borderRight: '4px solid transparent',
                        borderTop: '4px solid #1F2937'
                      }} />
                    </div>
                  )}
                </div>
                <span style={{ 
                  ...typography.small,
                  marginTop: spacing.sm,
                  color: hoveredBar === index ? colors.primary : colors.gray600,
                  fontWeight: hoveredBar === index ? '600' : '400'
                }}>
                  {item.month}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Custom Engraving Showcase Widget
const CustomEngravingShowcase = ({ onDesignEngraving }: { onDesignEngraving: () => void }) => {
  return (
    <div style={{
      ...componentStyles.card,
      background: `linear-gradient(135deg, ${colors.primary}08, ${colors.primaryLight}06)`,
      border: `2px solid ${colors.primary}20`,
      padding: spacing.lg,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '100px',
        height: '100px',
        background: `radial-gradient(circle, ${colors.primary}10, transparent)`,
        borderRadius: '50%'
      }} />
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg
      }}>
        <div>
          <h3 style={{
            ...typography.sectionHeader,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            marginBottom: '4px'
          }}>
            🎯 Custom FlexVolt Engraving
          </h3>
          <p style={{
            ...typography.small,
            color: colors.gray600,
            margin: 0
          }}>
            Protect your batteries with custom laser engraving
          </p>
        </div>
        <div style={{
          padding: '8px 16px',
          backgroundColor: colors.primary,
          color: colors.white,
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Sparkles size={14} />
          NEW SERVICE
        </div>
      </div>
      
      {/* Features Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: spacing.md,
        marginBottom: spacing.lg
      }}>
        {[
          { icon: Shield, label: '73% Theft Reduction', desc: 'Proven protection' },
          { icon: Zap, label: '0.1mm Precision', desc: 'Laser accuracy' },
          { icon: Clock, label: '7-10 Day Delivery', desc: 'Fast turnaround' }
        ].map((feature, index) => (
          <div key={feature.label} style={{
            textAlign: 'center',
            padding: spacing.sm
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: `${colors.primary}15`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px',
              border: `2px solid ${colors.primary}30`
            }}>
              <feature.icon size={18} color={colors.primary} />
            </div>
            <p style={{
              ...typography.small,
              fontWeight: '600',
              margin: '0 0 4px',
              color: colors.gray900
            }}>
              {feature.label}
            </p>
            <p style={{
              ...typography.small,
              color: colors.gray600,
              margin: 0
            }}>
              {feature.desc}
            </p>
          </div>
        ))}
      </div>
      
      {/* Call to Action */}
      <div style={{
        display: 'flex',
        gap: spacing.md,
        alignItems: 'center'
      }}>
        <button
          onClick={onDesignEngraving}
          style={{
            padding: '12px 24px',
            backgroundColor: colors.primary,
            color: colors.white,
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            transition: 'all 0.2s ease',
            boxShadow: `0 4px 12px ${colors.primary}25`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.primaryDark
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = `0 8px 20px ${colors.primary}35`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary}25`
          }}
        >
          <Grid size={16} />
          Design My Engraving
        </button>
        
        <div style={{
          flex: 1,
          textAlign: 'right'
        }}>
          <p style={{
            ...typography.small,
            color: colors.gray600,
            margin: '0 0 4px'
          }}>
            Starting at $149 per battery
          </p>
          <p style={{
            ...typography.small,
            color: colors.success,
            fontWeight: '600',
            margin: 0
          }}>
            ✓ Volume discounts available
          </p>
        </div>
      </div>
    </div>
  )
}

// Fleet Investment Summary Widget
const FleetInvestmentSummary = () => {
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  
  return (
    <div style={{
      ...componentStyles.card,
      background: `linear-gradient(135deg, ${colors.primary}05, ${colors.success}05)`,
      border: `2px solid ${colors.primary}15`,
      padding: spacing.lg
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg
      }}>
        <div>
          <h3 style={{
            ...typography.sectionHeader,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            marginBottom: '4px'
          }}>
            Fleet Investment Summary
          </h3>
          <p style={{
            ...typography.small,
            color: colors.gray600,
            margin: 0
          }}>
            {currentMonth} performance overview
          </p>
        </div>
        <div style={{
          padding: '6px 12px',
          backgroundColor: `${colors.success}15`,
          color: colors.success,
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <TrendingUp size={12} />
          +15.2% Growth
        </div>
      </div>
      
      {/* Key Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: spacing.lg,
        marginBottom: spacing.lg
      }}>
        {/* Active Fleet Size */}
        <div style={{
          textAlign: 'center',
          padding: spacing.md,
          backgroundColor: `${colors.primary}08`,
          borderRadius: '12px',
          border: `1px solid ${colors.primary}20`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            marginBottom: spacing.sm
          }}>
            <Battery size={20} color={colors.primary} />
            <span style={{
              ...typography.metricValue,
              color: colors.primary,
              fontSize: '32px'
            }}>
              247
            </span>
          </div>
          <p style={{
            ...typography.small,
            fontWeight: '600',
            margin: '0 0 4px',
            color: colors.gray900
          }}>
            Active Fleet Size
          </p>
          <p style={{
            ...typography.small,
            color: colors.gray600,
            margin: 0
          }}>
            Total batteries in operation
          </p>
        </div>
        
        {/* Monthly Investment */}
        <div style={{
          textAlign: 'center',
          padding: spacing.md,
          backgroundColor: `${colors.success}08`,
          borderRadius: '12px',
          border: `1px solid ${colors.success}20`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            marginBottom: spacing.sm
          }}>
            <DollarSign size={20} color={colors.success} />
            <span style={{
              ...typography.metricValue,
              color: colors.success,
              fontSize: '32px'
            }}>
              $5,200
            </span>
          </div>
          <p style={{
            ...typography.small,
            fontWeight: '600',
            margin: '0 0 4px',
            color: colors.gray900
          }}>
            Investment This Month
          </p>
          <p style={{
            ...typography.small,
            color: colors.gray600,
            margin: 0
          }}>
            3 shipments completed
          </p>
        </div>
      </div>
      
      {/* Bottom Row Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.gray50,
        borderRadius: '8px',
        border: `1px solid ${colors.gray200}`
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{
            ...typography.small,
            fontWeight: '600',
            margin: '0 0 4px',
            color: colors.gray900
          }}>
            YTD Fleet Growth
          </p>
          <p style={{
            ...typography.small,
            color: colors.success,
            fontWeight: '600',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}>
            <ArrowUpRight size={12} />
            +15.2%
          </p>
        </div>
        
        <div style={{
          width: '1px',
          height: '40px',
          backgroundColor: colors.gray300
        }} />
        
        <div style={{ textAlign: 'center' }}>
          <p style={{
            ...typography.small,
            fontWeight: '600',
            margin: '0 0 4px',
            color: colors.gray900
          }}>
            Next Scheduled Order
          </p>
          <p style={{
            ...typography.small,
            color: colors.info,
            fontWeight: '600',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}>
            <Calendar size={12} />
            May 28
          </p>
        </div>
        
        <div style={{
          width: '1px',
          height: '40px',
          backgroundColor: colors.gray300
        }} />
        
        <div style={{ textAlign: 'center' }}>
          <p style={{
            ...typography.small,
            fontWeight: '600',
            margin: '0 0 4px',
            color: colors.gray900
          }}>
            Avg Battery Age
          </p>
          <p style={{
            ...typography.small,
            color: colors.gray700,
            fontWeight: '600',
            margin: 0
          }}>
            6.2 months
          </p>
        </div>
      </div>
    </div>
  )
}

// Fleet Health Monitor Widget
const FleetHealthMonitor = () => {
  const healthData = {
    batteriesUnderWarranty: { current: 247, total: 247 },
    averageAge: '6.2 months',
    warrantyExpiring: { count: 12, timeframe: '30 days' },
    batteryHealth: {
      excellent: 198,
      good: 35,
      fair: 12,
      poor: 2
    },
    lastInspection: '3 days ago'
  }
  
  const getHealthColor = (level: string) => {
    switch (level) {
      case 'excellent': return colors.success
      case 'good': return colors.info
      case 'fair': return colors.warning
      case 'poor': return colors.error
      default: return colors.gray500
    }
  }
  
  const warrantyPercentage = (healthData.batteriesUnderWarranty.current / healthData.batteriesUnderWarranty.total) * 100
  
  return (
    <div style={{
      ...componentStyles.card,
      background: `linear-gradient(135deg, ${colors.success}08, ${colors.info}05)`,
      border: `2px solid ${colors.success}15`,
      padding: spacing.lg
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg
      }}>
        <div>
          <h3 style={{
            ...typography.sectionHeader,
            background: `linear-gradient(135deg, ${colors.success}, ${colors.info})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            marginBottom: '4px'
          }}>
            🔋 Fleet Performance Dashboard
          </h3>
          <p style={{
            ...typography.small,
            color: colors.gray600,
            margin: 0
          }}>
            Battery health and warranty monitoring
          </p>
        </div>
        <div style={{
          padding: '6px 12px',
          backgroundColor: warrantyPercentage === 100 ? `${colors.success}15` : `${colors.warning}15`,
          color: warrantyPercentage === 100 ? colors.success : colors.warning,
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <CheckCircle size={12} />
          {warrantyPercentage}% Covered
        </div>
      </div>
      
      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: spacing.md,
        marginBottom: spacing.lg
      }}>
        {/* Warranty Status */}
        <div style={{
          textAlign: 'center',
          padding: spacing.md,
          backgroundColor: `${colors.success}08`,
          borderRadius: '8px',
          border: `1px solid ${colors.success}20`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            marginBottom: spacing.sm
          }}>
            <Shield size={18} color={colors.success} />
            <span style={{
              ...typography.metricValue,
              color: colors.success,
              fontSize: '24px'
            }}>
              {healthData.batteriesUnderWarranty.current}/{healthData.batteriesUnderWarranty.total}
            </span>
          </div>
          <p style={{
            ...typography.small,
            fontWeight: '600',
            margin: 0,
            color: colors.gray900
          }}>
            Under Warranty ✓
          </p>
        </div>
        
        {/* Average Age */}
        <div style={{
          textAlign: 'center',
          padding: spacing.md,
          backgroundColor: `${colors.info}08`,
          borderRadius: '8px',
          border: `1px solid ${colors.info}20`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            marginBottom: spacing.sm
          }}>
            <Clock size={18} color={colors.info} />
            <span style={{
              ...typography.metricValue,
              color: colors.info,
              fontSize: '24px'
            }}>
              {healthData.averageAge}
            </span>
          </div>
          <p style={{
            ...typography.small,
            fontWeight: '600',
            margin: 0,
            color: colors.gray900
          }}>
            Average Battery Age
          </p>
        </div>
        
        {/* Expiring Soon */}
        <div style={{
          textAlign: 'center',
          padding: spacing.md,
          backgroundColor: healthData.warrantyExpiring.count > 0 ? `${colors.warning}08` : `${colors.gray100}`,
          borderRadius: '8px',
          border: `1px solid ${healthData.warrantyExpiring.count > 0 ? colors.warning + '20' : colors.gray200}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            marginBottom: spacing.sm
          }}>
            <AlertCircle size={18} color={healthData.warrantyExpiring.count > 0 ? colors.warning : colors.gray500} />
            <span style={{
              ...typography.metricValue,
              color: healthData.warrantyExpiring.count > 0 ? colors.warning : colors.gray500,
              fontSize: '24px'
            }}>
              {healthData.warrantyExpiring.count}
            </span>
          </div>
          <p style={{
            ...typography.small,
            fontWeight: '600',
            margin: 0,
            color: colors.gray900
          }}>
            Expiring in {healthData.warrantyExpiring.timeframe}
          </p>
        </div>
      </div>
      
      {/* Battery Health Distribution */}
      <div style={{
        marginBottom: spacing.md
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm
        }}>
          <h4 style={{
            ...typography.body,
            fontWeight: '600',
            margin: 0,
            color: colors.gray900
          }}>
            Fleet Health Distribution
          </h4>
          <p style={{
            ...typography.small,
            color: colors.gray600,
            margin: 0
          }}>
            Last inspection: {healthData.lastInspection}
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '2px',
          backgroundColor: colors.gray200,
          borderRadius: '8px',
          overflow: 'hidden',
          height: '8px',
          marginBottom: spacing.sm
        }}>
          {Object.entries(healthData.batteryHealth).map(([level, count]) => {
            const percentage = (count / healthData.batteriesUnderWarranty.total) * 100
            return (
              <div
                key={level}
                style={{
                  width: `${percentage}%`,
                  backgroundColor: getHealthColor(level),
                  height: '100%'
                }}
                title={`${count} batteries - ${level}`}
              />
            )
          })}
        </div>
        
        {/* Legend */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: spacing.sm
        }}>
          {Object.entries(healthData.batteryHealth).map(([level, count]) => (
            <div key={level} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: getHealthColor(level),
                borderRadius: '50%'
              }} />
              <span style={{
                ...typography.small,
                fontWeight: '500'
              }}>
                {level}: {count}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Action Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'center'
      }}>
        <button
          style={{
            padding: '10px 20px',
            backgroundColor: colors.white,
            color: colors.success,
            border: `2px solid ${colors.success}`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.success
            e.currentTarget.style.color = colors.white
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.white
            e.currentTarget.style.color = colors.success
          }}
        >
          <BarChart3 size={16} />
          View Detailed Health Report
        </button>
      </div>
    </div>
  )
}

// Smart Reorder Assistant Widget
const SmartReorderAssistant = () => {
  const reorderData = {
    predictions: [
      {
        batteryType: '6Ah Batteries',
        currentStock: 23,
        usageRate: '2.1 per week',
        reorderIn: 12,
        recommendation: 'Reorder in 12 days',
        confidence: 'high',
        suggestedQuantity: 25,
        urgency: 'medium'
      },
      {
        batteryType: '9Ah Batteries',
        currentStock: 41,
        usageRate: '1.3 per week',
        reorderIn: 24,
        recommendation: 'Stock level good',
        confidence: 'high',
        suggestedQuantity: 0,
        urgency: 'low'
      },
      {
        batteryType: '15Ah Batteries',
        currentStock: 8,
        usageRate: '0.8 per week',
        reorderIn: -3,
        recommendation: 'Consider bulk order (save 20%)',
        confidence: 'medium',
        suggestedQuantity: 30,
        urgency: 'high'
      }
    ],
    totalPotentialSavings: 450,
    autoReorderEnabled: false
  }
  
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return colors.error
      case 'medium': return colors.warning  
      case 'low': return colors.success
      default: return colors.gray500
    }
  }
  
  const getUrgencyBg = (urgency: string) => {
    switch (urgency) {
      case 'high': return colors.errorLight
      case 'medium': return colors.warningLight
      case 'low': return colors.successLight
      default: return colors.gray100
    }
  }
  
  return (
    <div style={{
      ...componentStyles.card,
      background: `linear-gradient(135deg, ${colors.info}08, ${colors.primary}05)`,
      border: `2px solid ${colors.info}20`,
      padding: spacing.lg
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg
      }}>
        <div>
          <h3 style={{
            ...typography.sectionHeader,
            background: `linear-gradient(135deg, ${colors.info}, ${colors.primary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            marginBottom: '4px'
          }}>
            🤖 Intelligent Reorder Suggestions
          </h3>
          <p style={{
            ...typography.small,
            color: colors.gray600,
            margin: 0
          }}>
Smart suggestions for when to reorder batteries
          </p>
        </div>
        <div style={{
          padding: '6px 12px',
          backgroundColor: reorderData.autoReorderEnabled ? `${colors.success}15` : `${colors.warning}15`,
          color: reorderData.autoReorderEnabled ? colors.success : colors.warning,
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {reorderData.autoReorderEnabled ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
          {reorderData.autoReorderEnabled ? 'Auto-Reorder ON' : 'Manual Mode'}
        </div>
      </div>
      
      {/* Predictions */}
      <div style={{
        marginBottom: spacing.lg
      }}>
        <h4 style={{
          ...typography.body,
          fontWeight: '600',
          color: colors.gray900,
          margin: '0 0 12px'
        }}>
          Based on your usage patterns:
        </h4>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm
        }}>
          {reorderData.predictions.map((prediction, index) => (
            <div key={prediction.batteryType} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: spacing.md,
              backgroundColor: colors.white,
              borderRadius: '8px',
              border: `1px solid ${colors.gray200}`,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.primary
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.gray200
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  marginBottom: '4px'
                }}>
                  <span style={{
                    ...typography.body,
                    fontWeight: '600',
                    color: colors.gray900
                  }}>
                    {prediction.batteryType}:
                  </span>
                  <span style={{
                    ...typography.body,
                    color: getUrgencyColor(prediction.urgency),
                    fontWeight: '500'
                  }}>
                    {prediction.recommendation}
                  </span>
                  <span style={{
                    padding: '2px 6px',
                    backgroundColor: getUrgencyBg(prediction.urgency),
                    color: getUrgencyColor(prediction.urgency),
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {prediction.urgency}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  gap: spacing.md
                }}>
                  <span style={{
                    ...typography.small,
                    color: colors.gray600
                  }}>
                    Stock: {prediction.currentStock} units
                  </span>
                  <span style={{
                    ...typography.small,
                    color: colors.gray600
                  }}>
                    Usage: {prediction.usageRate}
                  </span>
                  {prediction.confidence && (
                    <span style={{
                      ...typography.small,
                      color: prediction.confidence === 'high' ? colors.success : colors.warning,
                      fontWeight: '500'
                    }}>
                      {prediction.confidence} confidence
                    </span>
                  )}
                </div>
              </div>
              
              {prediction.suggestedQuantity > 0 && (
                <button
                  style={{
                    padding: '6px 12px',
                    backgroundColor: getUrgencyColor(prediction.urgency),
                    color: colors.white,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <Plus size={12} />
                  Order {prediction.suggestedQuantity}
                </button>
              )}
              
              {prediction.suggestedQuantity === 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: colors.success
                }}>
                  <CheckCircle size={16} />
                  <span style={{
                    ...typography.small,
                    fontWeight: '600'
                  }}>
                    Good
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Savings & Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: `${colors.success}08`,
        borderRadius: '8px',
        border: `1px solid ${colors.success}20`
      }}>
        <div>
          <p style={{
            ...typography.small,
            fontWeight: '600',
            color: colors.success,
            margin: '0 0 4px'
          }}>
            💰 Potential Monthly Savings: ${reorderData.totalPotentialSavings}
          </p>
          <p style={{
            ...typography.small,
            color: colors.gray600,
            margin: 0
          }}>
            Enable auto-reorder to never run low on critical supplies
          </p>
        </div>
        
        <button
          style={{
            padding: '10px 16px',
            backgroundColor: colors.primary,
            color: colors.white,
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.primaryDark
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <RefreshCw size={16} />
          Set up Auto-Reorder
        </button>
      </div>
    </div>
  )
}

// Cost Optimization Center Widget
const CostOptimizationCenter = () => {
  const optimizationData = {
    volumeDiscountProgress: {
      current: 3780,
      nextTier: 5000,
      percentage: 15,
      currentDiscount: 10
    },
    potentialSavings: 450,
    unitsToNextTier: 22,
    bulkEngravingSavings: {
      available: true,
      savingsPerUnit: 5,
      minimumQuantity: 50
    },
    yearToDateSavings: 2340,
    optimizationTips: [
      {
        icon: '💰',
        title: 'Volume Discount Progress',
        description: '78% to next tier',
        action: 'Order 22 more units to unlock 15% discount',
        savings: 450,
        urgency: 'medium'
      },
      {
        icon: '🏷️',
        title: 'Bulk Engraving Available',
        description: 'Save $5/unit',
        action: 'Order 50+ batteries with engraving',
        savings: 250,
        urgency: 'low'
      }
    ]
  }
  
  const progressPercentage = (optimizationData.volumeDiscountProgress.current / optimizationData.volumeDiscountProgress.nextTier) * 100
  
  return (
    <div style={{
      ...componentStyles.card,
      background: `linear-gradient(135deg, ${colors.warning}08, ${colors.success}05)`,
      border: `2px solid ${colors.warning}20`,
      padding: spacing.lg
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg
      }}>
        <div>
          <h3 style={{
            ...typography.sectionHeader,
            background: `linear-gradient(135deg, ${colors.warning}, ${colors.success})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            marginBottom: '4px'
          }}>
            💰 Savings & Optimization
          </h3>
          <p style={{
            ...typography.small,
            color: colors.gray600,
            margin: 0
          }}>
            Get the most value from your batteries
          </p>
        </div>
        <div style={{
          padding: '6px 12px',
          backgroundColor: `${colors.success}15`,
          color: colors.success,
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <TrendingUp size={12} />
          ${optimizationData.yearToDateSavings} YTD Saved
        </div>
      </div>
      
      {/* Volume Discount Progress */}
      <div style={{
        marginBottom: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.white,
        borderRadius: '12px',
        border: `1px solid ${colors.gray200}`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm
        }}>
          <h4 style={{
            ...typography.body,
            fontWeight: '600',
            color: colors.gray900,
            margin: 0
          }}>
            Volume Discount Progress
          </h4>
          <span style={{
            ...typography.small,
            color: colors.success,
            fontWeight: '600'
          }}>
            Currently: {optimizationData.volumeDiscountProgress.currentDiscount}% off
          </span>
        </div>
        
        {/* Progress Bar */}
        <div style={{
          position: 'relative',
          height: '12px',
          backgroundColor: colors.gray200,
          borderRadius: '6px',
          overflow: 'hidden',
          marginBottom: spacing.sm
        }}>
          <div style={{
            width: `${progressPercentage}%`,
            height: '100%',
            background: `linear-gradient(to right, ${colors.warning}, ${colors.success})`,
            borderRadius: '6px',
            transition: 'width 0.5s ease'
          }} />
          <div style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '10px',
            fontWeight: '600',
            color: colors.gray600
          }}>
            {Math.round(progressPercentage)}%
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{
            ...typography.small,
            color: colors.gray600
          }}>
            ${optimizationData.volumeDiscountProgress.current.toLocaleString()} / ${optimizationData.volumeDiscountProgress.nextTier.toLocaleString()}
          </span>
          <span style={{
            ...typography.small,
            color: colors.warning,
            fontWeight: '600'
          }}>
            ${(optimizationData.volumeDiscountProgress.nextTier - optimizationData.volumeDiscountProgress.current).toLocaleString()} to {optimizationData.volumeDiscountProgress.percentage}%
          </span>
        </div>
      </div>
      
      {/* Optimization Tips */}
      <div style={{
        marginBottom: spacing.lg
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm
        }}>
          {optimizationData.optimizationTips.map((tip, index) => {
            const urgencyColor = tip.urgency === 'medium' ? colors.warning : colors.info
            const urgencyBg = tip.urgency === 'medium' ? colors.warningLight : colors.infoLight
            
            return (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                padding: spacing.md,
                backgroundColor: colors.white,
                borderRadius: '8px',
                border: `1px solid ${colors.gray200}`,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = urgencyColor
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.gray200
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              >
                <div style={{
                  fontSize: '24px',
                  marginRight: spacing.md
                }}>
                  {tip.icon}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                    marginBottom: '4px'
                  }}>
                    <span style={{
                      ...typography.body,
                      fontWeight: '600',
                      color: colors.gray900
                    }}>
                      {tip.title}:
                    </span>
                    <span style={{
                      ...typography.body,
                      color: urgencyColor,
                      fontWeight: '500'
                    }}>
                      {tip.description}
                    </span>
                  </div>
                  <p style={{
                    ...typography.small,
                    color: colors.gray600,
                    margin: 0
                  }}>
                    {tip.action}
                  </p>
                </div>
                
                <div style={{
                  textAlign: 'right'
                }}>
                  <p style={{
                    ...typography.small,
                    fontWeight: '600',
                    color: colors.success,
                    margin: '0 0 4px'
                  }}>
                    +${tip.savings}
                  </p>
                  <button style={{
                    padding: '4px 8px',
                    backgroundColor: urgencyBg,
                    color: urgencyColor,
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}>
                    Apply
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Action Button */}
      <div style={{
        textAlign: 'center'
      }}>
        <button
          style={{
            padding: '12px 24px',
            backgroundColor: colors.white,
            color: colors.warning,
            border: `2px solid ${colors.warning}`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing.sm,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.warning
            e.currentTarget.style.color = colors.white
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.white
            e.currentTarget.style.color = colors.warning
          }}
        >
          <BarChart3 size={16} />
          View Savings Strategy
        </button>
      </div>
    </div>
  )
}

// Quick Order Widget with enhanced visual hierarchy
const QuickOrderWidget = ({ cart, updateQuantity, onReorder }: { 
  cart: {[key: string]: number}; 
  updateQuantity: (productId: string, quantity: number) => void;
  onReorder: () => void 
}) => {
  const products = [
    { 
      id: '6Ah', 
      name: '6Ah Battery', 
      price: 149, 
      sku: 'FV-6AH-001',
      image: '/images/6ah-battery.png',
      inStock: true,
      stockLevel: 245
    },
    { 
      id: '9Ah', 
      name: '9Ah Battery', 
      price: 239, 
      sku: 'FV-9AH-001',
      image: '/images/9ah-battery.png',
      inStock: true,
      stockLevel: 189
    },
    { 
      id: '15Ah', 
      name: '15Ah Battery', 
      price: 359, 
      sku: 'FV-15AH-001',
      image: '/images/15ah-battery.png',
      inStock: false,
      stockLevel: 0
    }
  ]

  const handleQuantityChange = (productId: string, delta: number) => {
    const currentQuantity = cart[productId] || 0
    const newQuantity = Math.max(0, currentQuantity + delta)
    updateQuantity(productId, newQuantity)
  }

  const subtotal = products.reduce((sum, product) => {
    return sum + (cart[product.id] * product.price)
  }, 0)

  return (
    <div style={componentStyles.card}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: spacing.md
      }}>
        <h3 style={typography.sectionHeader}>
          Quick Reorder
        </h3>
        <span style={typography.small}>
          Your favorites
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {products.map((product, index) => (
          <div
            key={product.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.md,
              padding: spacing.md,
              backgroundColor: index % 2 === 0 ? colors.transparent : colors.gray100,
              borderBottom: index < products.length - 1 ? `1px solid ${colors.gray300}` : 'none',
              opacity: product.inStock ? 1 : 0.6
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: colors.gray200,
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Battery size={24} color={colors.gray500} />
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    console.log(`Navigate to product: ${product.id}`)
                  }}
                  style={{ 
                    ...typography.body,
                    fontWeight: '600',
                    color: colors.gray900,
                    textDecoration: 'none',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = colors.primary
                    e.currentTarget.style.textDecoration = 'underline'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = colors.gray900
                    e.currentTarget.style.textDecoration = 'none'
                  }}
                >
                  {product.name}
                </a>
                {!product.inStock && (
                  <span style={{
                    fontSize: '11px',
                    color: colors.error,
                    backgroundColor: colors.errorLight,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: '500'
                  }}>
                    Out of Stock
                  </span>
                )}
              </div>
              <div style={{ 
                ...typography.small,
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm
              }}>
                <span>SKU: {product.sku}</span>
                <span>•</span>
                <span>${product.price}.00</span>
                {product.inStock && (
                  <>
                    <span>•</span>
                    <span>{product.stockLevel} in stock</span>
                  </>
                )}
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '2px',
              backgroundColor: colors.white,
              padding: '2px',
              borderRadius: '4px',
              border: `1px solid ${colors.gray300}`
            }}>
              <button
                onClick={() => handleQuantityChange(product.id, -1)}
                disabled={!product.inStock || cart[product.id] === 0}
                style={{
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  borderRadius: '3px',
                  backgroundColor: colors.transparent,
                  color: colors.gray600,
                  cursor: product.inStock && cart[product.id] > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (product.inStock && cart[product.id] > 0) {
                    e.currentTarget.style.backgroundColor = colors.gray100
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.transparent
                }}
              >
                <Minus size={14} />
              </button>
              <span style={{ 
                width: '48px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '600',
                color: colors.gray900,
                backgroundColor: colors.white
              }}>
                {cart[product.id]}
              </span>
              <button
                onClick={() => handleQuantityChange(product.id, 1)}
                disabled={!product.inStock}
                style={{
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  borderRadius: '3px',
                  backgroundColor: product.inStock ? colors.primary : colors.gray200,
                  color: colors.white,
                  cursor: product.inStock ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (product.inStock) {
                    e.currentTarget.style.backgroundColor = colors.primaryDark
                  }
                }}
                onMouseLeave={(e) => {
                  if (product.inStock) {
                    e.currentTarget.style.backgroundColor = colors.primary
                  }
                }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {subtotal > 0 && (
        <div style={{
          padding: spacing.md,
          backgroundColor: colors.gray100,
          borderRadius: '6px',
          marginTop: spacing.md,
          marginBottom: spacing.md,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={typography.body}>Subtotal:</span>
          <span style={{ ...typography.body, fontSize: '16px', fontWeight: '600', color: colors.gray900 }}>
            ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}

      <button
        onClick={onReorder}
        disabled={subtotal === 0}
        style={{
          ...componentStyles.button.primary,
          width: '100%',
          backgroundColor: subtotal > 0 ? colors.primary : colors.gray400,
          cursor: subtotal > 0 ? 'pointer' : 'not-allowed'
        }}
        onMouseEnter={(e) => {
          if (subtotal > 0) {
            e.currentTarget.style.backgroundColor = colors.primaryDark
            e.currentTarget.style.transform = 'translateY(-1px)'
          }
        }}
        onMouseLeave={(e) => {
          if (subtotal > 0) {
            e.currentTarget.style.backgroundColor = colors.primary
            e.currentTarget.style.transform = 'translateY(0)'
          }
        }}
      >
        <ShoppingCart size={16} />
        Reorder Now
      </button>
    </div>
  )
}

// Your Shipments in Motion - Priority-based delivery tracking
const YourShipmentsInMotion = ({ onTrack }: { onTrack: (trackingNumber: string) => void }) => {
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null)
  
  const urgentShipments = {
    arrivingToday: [
      {
        id: 'SHP-001',
        items: '20x 9Ah FlexVolt Batteries - "MIKE\'S TOOLS" Engraved',
        estimatedDelivery: '2:30 PM',
        status: 'out_for_delivery',
        trackingNumber: '1Z999AA1234567890',
        carrier: 'UPS',
        driverLocation: '2.3 miles away'
      }
    ],
    inTransit: [
      {
        id: 'SHP-002',
        items: '15x 6Ah Standard Batteries',
        eta: 'Tomorrow',
        status: 'in_transit',
        trackingNumber: '1Z999AA0987654321',
        carrier: 'FedEx',
        currentLocation: 'Memphis, TN'
      },
      {
        id: 'SHP-003',
        items: '10x 15Ah Heavy Duty + Custom Engraving',
        eta: 'June 2',
        status: 'processing',
        trackingNumber: 'Processing',
        carrier: 'UPS',
        currentLocation: 'Fulfillment Center'
      }
    ],
    recentDeliveries: {
      last7Days: 45,
      lastDelivery: '3x 9Ah Batteries delivered May 26'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return colors.success
      case 'in_transit': return colors.info
      case 'processing': return colors.warning
      default: return colors.gray500
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'delivered': return colors.successLight
      case 'in_transit': return colors.infoLight
      case 'processing': return colors.warningLight
      default: return colors.gray100
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'Delivered'
      case 'in_transit': return 'In Transit'
      case 'processing': return 'Processing'
      default: return status
    }
  }

  const getShippingIcon = (method: string) => {
    switch (method) {
      case 'air': return <Plane size={14} color={colors.gray500} />
      case 'ground': return <Truck size={14} color={colors.gray500} />
      case 'sea': return <Ship size={14} color={colors.gray500} />
      default: return <Truck size={14} color={colors.gray500} />
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedTracking(id)
      setTimeout(() => setCopiedTracking(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const openCarrierTracking = (carrier: string, trackingNumber: string) => {
    const urls: { [key: string]: string } = {
      'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
      'FedEx': `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`,
      'USPS': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`
    }
    window.open(urls[carrier] || '#', '_blank')
  }

  // Combine all shipments for the list view
  const shipments = [
    ...urgentShipments.arrivingToday.map(shipment => ({
      ...shipment,
      orderNumber: shipment.id,
      method: 'ground' // Default shipping method since it's not in the data
    })),
    ...urgentShipments.inTransit.map(shipment => ({
      ...shipment,
      orderNumber: shipment.id,
      method: 'ground' // Default shipping method since it's not in the data
    }))
  ]

  return (
    <div style={componentStyles.card}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: spacing.md
      }}>
        <div>
          <h3 style={{
            ...typography.sectionHeader,
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            marginBottom: '4px'
          }}>
            🚛 Your Shipments in Motion
          </h3>
          <p style={{
            ...typography.small,
            color: colors.gray600,
            margin: 0
          }}>
            Track your battery deliveries
          </p>
        </div>
        <div style={{
          padding: '6px 12px',
          backgroundColor: `${colors.info}15`,
          color: colors.info,
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          {urgentShipments.inTransit.length + 1} Active
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {shipments.map((shipment) => (
          <div
            key={shipment.id}
            style={{
              padding: spacing.md,
              backgroundColor: colors.gray100,
              borderRadius: '8px',
              border: `1px solid ${colors.gray300}`,
              minHeight: '120px',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.primary
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.gray300
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: spacing.md
            }}>
              <div style={{ display: 'flex', gap: spacing.md }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: colors.white,
                  border: `1px solid ${colors.gray300}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Package size={20} color={getStatusColor(shipment.status)} />
                </div>
                <div>
                  <p style={{ ...typography.body, fontWeight: '600', color: colors.gray900 }}>
                    {shipment.orderNumber}
                  </p>
                  <p style={{ ...typography.small, marginTop: '2px' }}>
                    {shipment.items}
                  </p>
                  <div style={{ ...typography.small, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {getShippingIcon(shipment.method)}
                    <span>{shipment.carrier}</span>
                    <span>•</span>
                    <span>Tracking:</span>
                    <a 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        openCarrierTracking(shipment.carrier, shipment.trackingNumber)
                      }}
                      style={{ 
                        color: colors.info,
                        fontFamily: 'monospace',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = 'underline'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = 'none'
                      }}
                    >
                      {shipment.trackingNumber}
                      <ExternalLink size={10} />
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(shipment.trackingNumber, shipment.id)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Copy tracking number"
                    >
                      {copiedTracking === shipment.id ? (
                        <Check size={12} color={colors.success} />
                      ) : (
                        <Copy size={12} color={colors.gray400} />
                      )}
                    </button>
                  </div>
                  {shipment.status === 'in_transit' && shipment.currentLocation && (
                    <p style={{ ...typography.small, color: colors.info, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={10} />
                      Currently in {shipment.currentLocation}
                    </p>
                  )}
                </div>
              </div>
              <span style={{
                padding: '4px 12px',
                backgroundColor: getStatusBg(shipment.status),
                color: getStatusColor(shipment.status),
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {getStatusText(shipment.status)}
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: spacing.sm }}>
              <div style={{
                height: '6px',
                backgroundColor: colors.gray300,
                borderRadius: '3px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  height: '100%',
                  width: `${shipment.progress}%`,
                  backgroundColor: getStatusColor(shipment.status),
                  borderRadius: '3px',
                  transition: 'width 0.5s ease',
                  position: 'relative'
                }}>
                  {shipment.progress < 100 && shipment.progress > 0 && (
                    <div style={{
                      position: 'absolute',
                      right: '-2px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '10px',
                      height: '10px',
                      backgroundColor: getStatusColor(shipment.status),
                      borderRadius: '50%',
                      border: `2px solid ${colors.white}`,
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }} />
                  )}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={typography.small}>
                {shipment.status === 'delivered' ? (
                  <>Delivered: <strong>{shipment.deliveryTime}</strong></>
                ) : (
                  <>ETA: <strong>{shipment.eta}</strong></>
                )}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTrack(shipment.trackingNumber)
                }}
                style={{
                  ...typography.small,
                  color: colors.primary,
                  fontWeight: '500',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.primaryDark
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.primary
                }}
              >
                <MapPin size={12} />
                Track Package
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CustomerDashboardPage() {
  const router = useRouter()
  const isOnline = useOnlineStatus()
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [activeOrderFilter, setActiveOrderFilter] = useState('all')
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([])
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null)
  const [notificationCount, setNotificationCount] = useState(3)
  const ordersPerPage = 10
  
  const [user, setUser] = useState({
    name: 'Mike Johnson',
    email: 'mike@constructionco.com',
    tier: 'Gold Partner',
    tierProgress: 75,
    tierSpend: 3750,
    tierTarget: 5000,
    nextTier: 'Platinum',
    savings: 12456.00,
    lastLogin: '2 hours ago'
  })

  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null)
  
  // Use cart hook for centralized cart management
  const { cart: cartData, addToCart: addItemToCart, updateQuantity, getProductQuantity, loading: cartLoading } = useLocalCart()
  
  // Create a simplified cart object for the QuickOrderWidget
  const cart = {
    '6Ah': getProductQuantity('6Ah'),
    '9Ah': getProductQuantity('9Ah'),
    '15Ah': getProductQuantity('15Ah')
  }

  // Recent searches
  const recentSearches = ['6Ah Battery', 'Order #BD-2405-001', 'Invoice May 2024', '9Ah Battery Pack']
  
  // Helper function to determine Fleet Impact
  const getFleetImpact = (order: typeof recentOrders[0]) => {
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0)
    const hasEngraving = order.hasEngraving || order.items.some(item => item.isEngraved)
    
    if (hasEngraving) {
      return {
        text: `Custom Fleet Expansion`,
        subtext: `+${totalQuantity} engraved units`,
        color: colors.primary
      }
    } else if (totalQuantity >= 25) {
      return {
        text: `Big Battery Order`,
        subtext: `+${totalQuantity} more batteries`,
        color: colors.success
      }
    } else if (totalQuantity >= 10) {
      return {
        text: `Fleet Expansion`,
        subtext: `+${totalQuantity} units added`,
        color: colors.info
      }
    } else {
      return {
        text: `Maintenance Resupply`,
        subtext: `+${totalQuantity} replacement units`,
        color: colors.warning
      }
    }
  }

  // Notifications
  const notifications = [
    { id: 1, title: 'Order Delivered', message: 'Order #BD-2405-001 was delivered', time: '2 hours ago', read: false },
    { id: 2, title: 'Price Alert', message: '15Ah Battery is back in stock', time: '5 hours ago', read: false },
    { id: 3, title: 'Invoice Available', message: 'May 2024 invoice is ready', time: '1 day ago', read: true }
  ]

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || 
                            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Simulate data loading with animations
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 800)
    
    const ordersTimer = setTimeout(() => {
      setOrdersLoading(false)
    }, 1200)
    
    return () => {
      clearTimeout(timer)
      clearTimeout(ordersTimer)
    }
  }, [])

  // Animated counter effect
  useEffect(() => {
    if (!loading) {
      // Animate numbers counting up
      const elements = document.querySelectorAll('.animate-number')
      elements.forEach((el) => {
        const target = parseInt(el.getAttribute('data-target') || '0')
        const duration = 1000
        const increment = target / (duration / 16)
        let current = 0
        
        const counter = setInterval(() => {
          current += increment
          if (current >= target) {
            current = target
            clearInterval(counter)
          }
          el.textContent = Math.floor(current).toLocaleString()
        }, 16)
      })
    }
  }, [loading])

  // Search functionality
  useEffect(() => {
    if (searchQuery.length > 0) {
      // Simulate search suggestions
      const suggestions = [
        ...recentSearches.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase())),
        `Search for "${searchQuery}" in products`,
        `Search for "${searchQuery}" in orders`,
        `Search for "${searchQuery}" in invoices`
      ].slice(0, 5)
      setSearchSuggestions(suggestions)
      setShowSearchSuggestions(true)
    } else {
      setShowSearchSuggestions(false)
    }
  }, [searchQuery])

  // Stats data
  const stats = {
    totalOrders: {
      value: 12,
      change: '+8.0%',
      trend: 'up',
      sparkline: [8, 10, 9, 11, 10, 12],
      previousPeriod: 11,
      tooltip: 'Compared to last month: 11 orders',
      calculation: 'Total orders placed in current month'
    },
    monthlySpend: {
      value: 4875,
      change: '+12.5%',
      trend: 'up',
      sparkline: [3200, 2800, 3500, 4200, 4500, 4875],
      previousPeriod: 4333,
      tooltip: 'Compared to last month: $4,333',
      calculation: 'Sum of all purchases in current month'
    },
    totalBatteries: {
      value: 45,
      change: '+4.7%',
      trend: 'up', 
      sparkline: [38, 40, 42, 43, 44, 45],
      previousPeriod: 43,
      tooltip: 'You have 2 more batteries than last month',
      calculation: 'All batteries you own right now'
    }
  }

  // Recent orders with more details
  const recentOrders = [
    {
      id: 'May Order #1',
      date: 'May 28, 2024',
      items: [
        { name: '9Ah Battery - "MIKE\'S TOOLS" Engraved', quantity: 15, price: 239, isEngraved: true },
        { name: '6Ah Battery', quantity: 20, price: 149 }
      ],
      total: 3775.00,
      status: 'delivered',
      paymentMethod: 'Net 30',
      trackingNumber: '1Z999AA1234567890',
      hasEngraving: true
    },
    {
      id: 'May Order #2',
      date: 'May 26, 2024',
      items: [
        { name: '15Ah Battery - Custom Logo Engraved', quantity: 5, price: 359, isEngraved: true }
      ],
      total: 1225.00,
      status: 'processing',
      paymentMethod: 'Credit Card',
      trackingNumber: 'Pending',
      hasEngraving: true
    },
    {
      id: 'May Order #3',
      date: 'May 24, 2024',
      items: [
        { name: '9Ah Battery', quantity: 15, price: 239 }
      ],
      total: 1875.00,
      status: 'in_transit',
      paymentMethod: 'Net 30',
      trackingNumber: '1Z999AA0987654321'
    },
    {
      id: 'May Order #4',
      date: 'May 22, 2024',
      items: [
        { name: '6Ah Battery', quantity: 25, price: 149 },
        { name: '15Ah Battery', quantity: 3, price: 359 }
      ],
      total: 3110.00,
      status: 'delivered',
      paymentMethod: 'ACH Transfer',
      trackingNumber: '1Z999AA5678901234'
    },
    {
      id: 'May Order #5',
      date: 'May 20, 2024',
      items: [
        { name: '9Ah Battery', quantity: 8, price: 239 }
      ],
      total: 1000.00,
      status: 'delivered',
      paymentMethod: 'Credit Card',
      trackingNumber: '1Z999AA3456789012'
    },
    {
      id: 'May Order #6',
      date: 'May 18, 2024',
      items: [
        { name: '6Ah Battery', quantity: 30, price: 149 }
      ],
      total: 2850.00,
      status: 'processing',
      paymentMethod: 'Net 30',
      trackingNumber: 'Pending'
    },
    {
      id: 'May Order #7',
      date: 'May 16, 2024',
      items: [
        { name: '15Ah Battery', quantity: 10, price: 359 }
      ],
      total: 2450.00,
      status: 'delivered',
      paymentMethod: 'Wire Transfer',
      trackingNumber: '1Z999AA2345678901'
    },
    {
      id: 'May Order #8',
      date: 'May 14, 2024',
      items: [
        { name: '6Ah Battery', quantity: 15, price: 149 },
        { name: '9Ah Battery', quantity: 12, price: 239 }
      ],
      total: 2925.00,
      status: 'delivered',
      paymentMethod: 'Credit Card',
      trackingNumber: '1Z999AA1234567890'
    },
    {
      id: 'May Order #9',
      date: 'May 12, 2024',
      items: [
        { name: '9Ah Battery', quantity: 20, price: 239 }
      ],
      total: 2500.00,
      status: 'delivered',
      paymentMethod: 'Net 30',
      trackingNumber: '1Z999AA9876543210'
    },
    {
      id: 'May Order #10',
      date: 'May 10, 2024',
      items: [
        { name: '15Ah Battery', quantity: 7, price: 359 }
      ],
      total: 1715.00,
      status: 'delivered',
      paymentMethod: 'ACH Transfer',
      trackingNumber: '1Z999AA8765432109'
    },
    {
      id: 'May Order #11',
      date: 'May 8, 2024',
      items: [
        { name: '6Ah Battery', quantity: 40, price: 149 }
      ],
      total: 3800.00,
      status: 'delivered',
      paymentMethod: 'Wire Transfer',
      trackingNumber: '1Z999AA7654321098'
    },
    {
      id: 'May Order #12',
      date: 'May 6, 2024',
      items: [
        { name: '9Ah Battery', quantity: 18, price: 239 },
        { name: '15Ah Battery', quantity: 2, price: 359 }
      ],
      total: 2740.00,
      status: 'delivered',
      paymentMethod: 'Credit Card',
      trackingNumber: '1Z999AA6543210987'
    }
  ]

  // Filter orders based on selected filter
  const filteredOrders = recentOrders.filter(order => {
    if (activeOrderFilter === 'all') return true
    return order.status === activeOrderFilter.toLowerCase().replace(' ', '_')
  })

  // Paginate orders
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  )

  // Toast functions
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  // Handle metric click
  const handleMetricClick = (metric: string) => {
    switch (metric) {
      case 'orders':
        router.push('/customer/orders?filter=active')
        break
      case 'spend':
        // Show spending details
        addToast('Opening spending details...', 'info')
        break
      case 'fleet':
        router.push('/customer/batteries')
        break
    }
  }

  // Handle quick actions
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'reorder':
        router.push('/customer/products')
        break
      case 'track':
        // Focus on delivery tracking
        addToast('Showing your current deliveries...', 'info')
        // Scroll to delivery section
        setTimeout(() => {
          const deliverySection = document.querySelector('[data-section="deliveries"]')
          if (deliverySection) {
            deliverySection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
        break
      case 'help':
        // Trigger help action - could open chat, phone, etc.
        addToast('Need help? Call 1-800-BATTERY or use the chat below', 'info')
        break
      case 'engraving':
        router.push('/customer/engraving')
        break
    }
  }

  // Handle reorder
  const handleReorder = () => {
    const items = Object.entries(cart).filter(([_, qty]) => qty > 0)
    if (items.length > 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Confirm Reorder',
        message: `Add ${items.map(([id, qty]) => `${qty}x ${id}`).join(', ')} to cart?`,
        onConfirm: () => {
          addToast('Items added to cart successfully!', 'success')
          // Reset cart
          setCart({ '6Ah': 0, '9Ah': 0, '15Ah': 0 })
        }
      })
    }
  }

  // Handle order actions
  const handleViewOrder = (orderId: string) => {
    router.push(`/customer/orders/${orderId}`)
  }

  const handleReorderItems = (order: typeof recentOrders[0]) => {
    if (order.items.length > 3) {
      setConfirmDialog({
        isOpen: true,
        title: 'Large Order Confirmation',
        message: `This will add ${order.items.reduce((sum, item) => sum + item.quantity, 0)} items to your cart. Continue?`,
        onConfirm: () => {
          addToast(`Added ${order.items.length} items from order ${order.id} to cart`, 'success')
        }
      })
    } else {
      addToast(`Added items from order ${order.id} to cart`, 'success')
    }
  }

  // Handle export
  const handleExportOrders = () => {
    addToast('Downloading orders as CSV...', 'info')
    // Implement actual CSV export
  }

  const handleExportChart = () => {
    addToast('Downloading your spending report...', 'info')
    // Implement actual CSV export
  }

  const handleDownloadStatement = () => {
    addToast('Downloading account statement...', 'info')
    // In a real app, this would generate and download a PDF statement
    setTimeout(() => {
      addToast('Statement downloaded successfully', 'success')
    }, 1500)
  }

  // Handle tracking
  const handleTrackPackage = (trackingNumber: string) => {
    router.push(`/customer/tracking/${trackingNumber}`)
  }

  // Handle search
  const handleSearch = (query: string) => {
    if (query.includes('order')) {
      router.push(`/customer/orders?search=${encodeURIComponent(query)}`)
    } else if (query.includes('invoice')) {
      router.push(`/customer/invoices?search=${encodeURIComponent(query)}`)
    } else {
      router.push(`/customer/products?search=${encodeURIComponent(query)}`)
    }
    setSearchQuery('')
    setShowSearchSuggestions(false)
  }

  // Mark notification as read
  const markNotificationAsRead = (id: number) => {
    // Update notification status
    setNotificationCount(prev => Math.max(0, prev - 1))
  }

  // Add animations CSS
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scaleIn {
        from {
          transform: translate(-50%, -50%) scale(0.9);
          opacity: 0;
        }
        to {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
      }
      @keyframes progressPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Show mobile dashboard if on mobile
  if (isMobile) {
    return <MobileDashboard />
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: colors.bgSecondary,
      paddingBottom: spacing.xxl
    }}>
      {/* Toast notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Confirmation dialog */}
      {confirmDialog && (
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
        />
      )}

      {/* Enhanced Header */}
      <div style={{
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.gray300}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: `0 ${spacing.lg}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px'
          }}>
            {/* Left section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ 
                  fontSize: '28px', 
                  fontWeight: '700',
                  color: colors.gray900,
                  margin: 0,
                  marginBottom: '6px'
                }}>
                  Your Battery Dashboard
                </h1>
                <p style={{ 
                  fontSize: '16px',
                  color: colors.gray600,
                  margin: 0,
                  fontWeight: '400'
                }}>
                  Hello {user.name} - Here's what you need today
                </p>
              </div>
              
              {/* Search bar with auto-complete */}
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <Search 
                    size={16} 
                    style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: colors.gray400
                    }} 
                  />
                  <input
                    type="text"
                    placeholder="Search products, orders, invoices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery) {
                        handleSearch(searchQuery)
                      }
                    }}
                    style={{
                      ...componentStyles.input,
                      width: '280px',
                      paddingLeft: '36px'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary
                      e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
                      if (!searchQuery && recentSearches.length > 0) {
                        setSearchSuggestions(recentSearches)
                        setShowSearchSuggestions(true)
                      }
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.gray300
                      e.target.style.boxShadow = 'none'
                      setTimeout(() => setShowSearchSuggestions(false), 200)
                    }}
                  />
                </div>
                
                {/* Search suggestions dropdown */}
                {showSearchSuggestions && searchSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: colors.white,
                    border: `1px solid ${colors.gray300}`,
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    zIndex: 200,
                    overflow: 'hidden'
                  }}>
                    {searchSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleSearch(suggestion)}
                        style={{
                          padding: '10px 16px',
                          ...typography.body,
                          cursor: 'pointer',
                          borderBottom: index < searchSuggestions.length - 1 ? `1px solid ${colors.gray200}` : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.sm,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.gray100
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        {suggestion.includes('Search for') ? <Search size={14} color={colors.gray400} /> : <History size={14} color={colors.gray400} />}
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
              {/* Notification bell */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{
                    position: 'relative',
                    padding: spacing.sm,
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.gray100
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <Bell size={18} color={colors.gray600} />
                  {notificationCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '16px',
                      height: '16px',
                      backgroundColor: colors.error,
                      color: colors.white,
                      borderRadius: '50%',
                      fontSize: '10px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {notificationCount}
                    </span>
                  )}
                </button>
                
                {/* Notifications dropdown */}
                {showNotifications && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: spacing.sm,
                    width: '320px',
                    backgroundColor: colors.white,
                    border: `1px solid ${colors.gray300}`,
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    zIndex: 200,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: spacing.md,
                      borderBottom: `1px solid ${colors.gray300}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <h3 style={{ ...typography.body, fontWeight: '600' }}>Notifications</h3>
                      <button
                        onClick={() => {
                          setNotificationCount(0)
                          addToast('All notifications marked as read', 'success')
                        }}
                        style={{
                          ...typography.small,
                          color: colors.primary,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Mark all as read
                      </button>
                    </div>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => {
                          markNotificationAsRead(notification.id)
                          setShowNotifications(false)
                        }}
                        style={{
                          padding: `${spacing.sm} ${spacing.md}`,
                          borderBottom: `1px solid ${colors.gray200}`,
                          cursor: 'pointer',
                          backgroundColor: !notification.read ? colors.infoLight : 'transparent',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.gray100
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = !notification.read ? colors.infoLight : 'transparent'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ ...typography.body, fontWeight: '500' }}>{notification.title}</p>
                            <p style={{ ...typography.small, marginTop: '2px' }}>{notification.message}</p>
                          </div>
                          {!notification.read && (
                            <div style={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: colors.primary,
                              borderRadius: '50%',
                              flexShrink: 0
                            }} />
                          )}
                        </div>
                        <p style={{ ...typography.small, color: colors.gray500, marginTop: '4px' }}>{notification.time}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* User info with tooltip */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: spacing.sm,
                  position: 'relative'
                }}
                onMouseEnter={() => setHoveredCard('userInfo')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.white,
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p style={{ ...typography.body, fontWeight: '600' }}>{user.name}</p>
                  <p style={{ 
                    ...typography.small,
                    color: colors.warning,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Award size={12} />
                    {user.tier}
                  </p>
                </div>
                
                {/* Tooltip */}
                {hoveredCard === 'userInfo' && (
                  <div style={{
                    ...componentStyles.tooltip,
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: spacing.sm,
                    padding: `${spacing.sm} ${spacing.md}`,
                    minWidth: '200px'
                  }}>
                    <p style={{ marginBottom: spacing.sm }}>Gold Partner Benefits:</p>
                    <ul style={{ margin: 0, paddingLeft: spacing.md, fontSize: '12px' }}>
                      <li>10% discount on all orders</li>
                      <li>Priority shipping</li>
                      <li>Dedicated account manager</li>
                      <li>Extended payment terms</li>
                    </ul>
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '20px',
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderBottom: '4px solid #1F2937'
                    }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: `${spacing.sm} ${spacing.lg}`,
          borderTop: `1px solid ${colors.gray300}`
        }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault()
                router.push('/customer')
              }}
              style={{ 
                ...typography.small,
                color: colors.gray500,
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.primary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.gray500
              }}
            >
              Home
            </a>
            <ChevronRight size={14} color={colors.gray400} />
            <span style={{ ...typography.small, color: colors.gray700, fontWeight: '500' }}>Dashboard</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: spacing.lg
      }}>
        {/* Essential Quick Actions - 3 Large Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: spacing.xl,
          marginBottom: spacing.xl
        }}>
          {[
            { 
              icon: ShoppingCart, 
              label: 'Order More Batteries', 
              description: 'Quick reorder your favorites',
              color: colors.primary, 
              action: 'reorder',
              priority: 'high'
            },
            { 
              icon: Truck, 
              label: 'Track Deliveries', 
              description: '2 orders arriving this week',
              color: colors.success, 
              action: 'track',
              priority: 'medium' 
            },
            { 
              icon: HelpCircle, 
              label: 'Get Help', 
              description: 'Call: 1-800-BATTERY',
              color: colors.info, 
              action: 'help',
              priority: 'low'
            }
          ].map((action, index) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.action)}
              style={{
                ...componentStyles.card,
                padding: spacing.xl,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.md,
                cursor: 'pointer',
                height: '160px',
                opacity: 0,
                animation: `fadeInUp 0.4s ease forwards`,
                animationDelay: `${index * 0.15}s`,
                border: `2px solid ${action.priority === 'high' ? action.color : colors.gray300}`,
                backgroundColor: action.priority === 'high' ? `${action.color}08` : colors.white
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = action.color
                e.currentTarget.style.transform = 'translateY(-6px)'
                e.currentTarget.style.boxShadow = `0 12px 24px ${action.color}25`
                e.currentTarget.style.backgroundColor = `${action.color}12`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = action.priority === 'high' ? action.color : colors.gray300
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
                e.currentTarget.style.backgroundColor = action.priority === 'high' ? `${action.color}08` : colors.white
              }}
            >
              <action.icon size={48} color={action.color} strokeWidth={2} />
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ 
                  ...typography.sectionHeader, 
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: '0 0 4px',
                  color: colors.gray900
                }}>
                  {action.label}
                </h3>
                <p style={{ 
                  ...typography.small,
                  fontSize: '14px',
                  color: colors.gray600,
                  margin: 0,
                  fontWeight: '400'
                }}>
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>


        {/* Performance Metrics with fixed sparkline alignment */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: spacing.lg,
          marginBottom: spacing.lg
        }}>
          {[
            {
              icon: Package,
              label: 'Active Shipments',
              value: stats.totalOrders.value,
              displayValue: stats.totalOrders.value.toString(),
              change: stats.totalOrders.change,
              trend: stats.totalOrders.trend,
              sparkline: stats.totalOrders.sparkline,
              color: colors.primary,
              bgColor: `${colors.primary}10`,
              tooltip: stats.totalOrders.tooltip,
              calculation: stats.totalOrders.calculation,
              metric: 'orders'
            },
            {
              icon: DollarSign,
              label: 'Fleet Investment',
              value: stats.monthlySpend.value,
              displayValue: `$${stats.monthlySpend.value.toLocaleString()}`,
              change: stats.monthlySpend.change,
              trend: stats.monthlySpend.trend,
              sparkline: stats.monthlySpend.sparkline,
              color: colors.success,
              bgColor: `${colors.success}10`,
              tooltip: stats.monthlySpend.tooltip,
              calculation: stats.monthlySpend.calculation,
              metric: 'spend'
            },
            {
              icon: Users,
              label: 'Total Batteries',
              value: stats.totalBatteries.value,
              displayValue: `${stats.totalBatteries.value} batteries`,
              change: stats.totalBatteries.change,
              trend: stats.totalBatteries.trend,
              sparkline: stats.totalBatteries.sparkline,
              color: colors.info,
              bgColor: `${colors.info}10`,
              tooltip: stats.totalBatteries.tooltip,
              calculation: stats.totalBatteries.calculation,
              metric: 'batteries'
            }
          ].map((stat, index) => (
            <div
              key={stat.label}
              onClick={() => handleMetricClick(stat.metric)}
              onMouseEnter={() => setHoveredMetric(stat.metric)}
              onMouseLeave={() => setHoveredMetric(null)}
              style={{
                ...componentStyles.card,
                padding: spacing.lg,
                cursor: 'pointer',
                opacity: 0,
                animation: `fadeInUp 0.4s ease forwards`,
                animationDelay: `${(index + 4) * 0.1}s`,
                position: 'relative'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = `0 8px 16px ${stat.color}15`
                e.currentTarget.style.borderColor = stat.color
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                e.currentTarget.style.borderColor = colors.gray300
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: stat.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <stat.icon size={20} color={stat.color} />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    ...typography.small,
                    color: stat.trend === 'up' ? colors.success : colors.error,
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    {stat.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {stat.change}
                  </span>
                </div>
              </div>
              
              <div style={{ marginBottom: spacing.sm }}>
                <p style={typography.cardLabel}>{stat.label}</p>
                <p style={{ ...typography.metricValue, marginTop: '4px' }}>
                  {loading ? (
                    <span className="animate-number" data-target={stat.value}>0</span>
                  ) : (
                    stat.displayValue
                  )}
                </p>
              </div>
              
              <Sparkline data={stat.sparkline} color={stat.color} size="medium" />
              
              {/* Tooltip */}
              {hoveredMetric === stat.metric && (
                <div style={{
                  ...componentStyles.tooltip,
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: spacing.sm,
                  padding: `${spacing.sm} ${spacing.md}`
                }}>
                  <p style={{ marginBottom: '4px' }}>{stat.tooltip}</p>
                  <p style={{ fontSize: '11px', opacity: 0.8 }}>{stat.calculation}</p>
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderTop: '4px solid #1F2937'
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Today's Priority Section */}
        <div style={{
          marginBottom: spacing.xl,
          opacity: 0,
          animation: `fadeInUp 0.4s ease forwards`,
          animationDelay: '0.7s'
        }}>
          <div style={{
            ...componentStyles.card,
            padding: spacing.xl,
            backgroundColor: colors.white,
            border: `2px solid ${colors.primary}20`,
            borderRadius: '16px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: colors.gray900,
              margin: '0 0 24px',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <Star size={28} color={colors.primary} />
              Today's Priorities
            </h2>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.lg
            }}>
              {/* Priority 1: Delivery Alert */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.lg,
                padding: spacing.lg,
                backgroundColor: `${colors.success}08`,
                borderRadius: '12px',
                border: `2px solid ${colors.success}20`
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: colors.success,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Truck size={32} color={colors.white} strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: colors.gray900,
                    margin: '0 0 4px'
                  }}>
                    Delivery at 2:30 PM Today
                  </h3>
                  <p style={{
                    fontSize: '16px',
                    color: colors.gray700,
                    margin: '0 0 12px',
                    fontWeight: '400'
                  }}>
                    20 batteries for Site A
                  </p>
                  <div style={{ display: 'flex', gap: spacing.sm }}>
                    <button style={{
                      padding: '8px 16px',
                      backgroundColor: colors.success,
                      color: colors.white,
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}>
                      Track
                    </button>
                    <button style={{
                      padding: '8px 16px',
                      backgroundColor: colors.white,
                      color: colors.success,
                      border: `2px solid ${colors.success}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}>
                      Prepare Dock
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Priority 2: Low Stock Alert */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.lg,
                padding: spacing.lg,
                backgroundColor: `${colors.warning}08`,
                borderRadius: '12px',
                border: `2px solid ${colors.warning}20`
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: colors.warning,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <AlertCircle size={32} color={colors.white} strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: colors.gray900,
                    margin: '0 0 4px'
                  }}>
                    Running Low
                  </h3>
                  <p style={{
                    fontSize: '16px',
                    color: colors.gray700,
                    margin: '0 0 12px',
                    fontWeight: '400'
                  }}>
                    Only 23 small batteries left
                  </p>
                  <button style={{
                    padding: '8px 16px',
                    backgroundColor: colors.warning,
                    color: colors.white,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                  onClick={() => router.push('/customer/products')}
                  >
                    Order More
                  </button>
                </div>
              </div>
              
              {/* Priority 3: Savings Opportunity */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.lg,
                padding: spacing.lg,
                backgroundColor: `${colors.info}08`,
                borderRadius: '12px',
                border: `2px solid ${colors.info}20`
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: colors.info,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <DollarSign size={32} color={colors.white} strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: colors.gray900,
                    margin: '0 0 4px'
                  }}>
                    Save $450
                  </h3>
                  <p style={{
                    fontSize: '16px',
                    color: colors.gray700,
                    margin: '0 0 12px',
                    fontWeight: '400'
                  }}>
                    Buy 22 more batteries for 15% off
                  </p>
                  <button style={{
                    padding: '8px 16px',
                    backgroundColor: colors.info,
                    color: colors.white,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}>
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Quick Reorder Section */}
        <div style={{
          marginBottom: spacing.xl,
          opacity: 0,
          animation: `fadeInUp 0.4s ease forwards`,
          animationDelay: '0.9s'
        }}>
          <div style={{
            ...componentStyles.card,
            padding: spacing.xl,
            backgroundColor: colors.white,
            border: `2px solid ${colors.gray300}`,
            borderRadius: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.lg
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: colors.gray900,
                margin: 0
              }}>
                Quick Reorder
              </h2>
              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: colors.primary,
                  color: colors.white,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  // Calculate total for selected items
                  const selectedItems = [
                    { name: 'Small (6Ah)', price: 149, qty: 25 },
                    { name: 'Medium (9Ah)', price: 239, qty: 15 }
                  ]
                  const total = selectedItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
                  addToast(`Reordering items - Total: $${total.toLocaleString()}`, 'success')
                }}
              >
                Reorder Last Purchase
              </button>
            </div>
            
            <div style={{
              display: 'grid',
              gap: spacing.md
            }}>
              {[
                { 
                  name: 'Small Batteries (6Ah)', 
                  price: 149, 
                  usual: 25,
                  selected: false 
                },
                { 
                  name: 'Medium Batteries (9Ah)', 
                  price: 239, 
                  usual: 15,
                  selected: true 
                },
                { 
                  name: 'Large Batteries (15Ah)', 
                  price: 359, 
                  usual: 10,
                  selected: false 
                }
              ].map((product, index) => (
                <div key={product.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing.md,
                  backgroundColor: product.selected ? `${colors.primary}08` : colors.gray50,
                  borderRadius: '8px',
                  border: `1px solid ${product.selected ? colors.primary + '30' : colors.gray200}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                    <input 
                      type="checkbox" 
                      defaultChecked={product.selected}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer'
                      }}
                    />
                    <div>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: colors.gray900,
                        margin: '0 0 4px'
                      }}>
                        {product.name}
                      </h4>
                      <p style={{
                        fontSize: '14px',
                        color: colors.gray600,
                        margin: 0
                      }}>
                        ${product.price} each • You usually order {product.usual}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                    <select 
                      defaultValue={product.usual}
                      style={{
                        padding: '8px 12px',
                        border: `1px solid ${colors.gray300}`,
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        backgroundColor: colors.white,
                        cursor: 'pointer',
                        minWidth: '80px'
                      }}
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    <button style={{
                      padding: '8px 16px',
                      backgroundColor: colors.primary,
                      color: colors.white,
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}>
                      Order {product.usual}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{
              marginTop: spacing.lg,
              padding: spacing.md,
              backgroundColor: colors.gray50,
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <button style={{
                padding: '12px 24px',
                backgroundColor: colors.success,
                color: colors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              onClick={() => {
                addToast('Ordering selected batteries...', 'success')
                setTimeout(() => router.push('/customer/checkout'), 1000)
              }}
              >
                Order Selected Items - Total: $2,250.00
              </button>
            </div>
          </div>
        </div>

        {/* Delivery Tracker */}
        <div style={{
          marginBottom: spacing.lg,
          opacity: 0,
          animation: `fadeInUp 0.4s ease forwards`,
          animationDelay: '1.1s'
        }}>
          <YourShipmentsInMotion onTrack={handleTrackPackage} />
        </div>

        {/* Personalized Insights Panel */}
        <div style={{
          marginBottom: spacing.lg,
          opacity: 0,
          animation: `fadeInUp 0.4s ease forwards`,
          animationDelay: '1.15s'
        }}>
          <div style={{
            ...componentStyles.card,
            background: `linear-gradient(135deg, ${colors.primary}05, ${colors.info}03)`,
            border: `2px solid ${colors.primary}15`,
            padding: spacing.lg
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.md,
              marginBottom: spacing.lg
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: `${colors.primary}15`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Activity size={20} color={colors.primary} />
              </div>
              <div>
                <h3 style={{
                  ...typography.sectionHeader,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                  marginBottom: '4px'
                }}>
                  📈 Insights for Your Fleet
                </h3>
                <p style={{
                  ...typography.small,
                  color: colors.gray600,
                  margin: 0
                }}>
                  Smart suggestions based on how you use batteries
                </p>
              </div>
            </div>
            
            <div style={{
              display: 'grid',
              gap: spacing.md
            }}>
              {/* Seasonal Pattern Insight */}
              <div style={{
                display: 'flex',
                alignItems: 'start',
                gap: spacing.md,
                padding: spacing.md,
                backgroundColor: colors.white,
                borderRadius: '8px',
                border: `1px solid ${colors.gray200}`
              }}>
                <div style={{
                  fontSize: '20px',
                  marginTop: '2px'
                }}>
                  🌞
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    ...typography.body,
                    fontWeight: '600',
                    margin: '0 0 4px',
                    color: colors.gray900
                  }}>
                    "Your Site B location orders 40% more in summer months"
                  </p>
                  <p style={{
                    ...typography.small,
                    color: colors.gray600,
                    margin: 0
                  }}>
                    Consider increasing inventory for Site B during May-August to avoid stockouts.
                  </p>
                </div>
                <button style={{
                  padding: '4px 8px',
                  backgroundColor: `${colors.info}15`,
                  color: colors.info,
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  Plan Ahead
                </button>
              </div>
              
              {/* Efficiency Insight */}
              <div style={{
                display: 'flex',
                alignItems: 'start',
                gap: spacing.md,
                padding: spacing.md,
                backgroundColor: colors.white,
                borderRadius: '8px',
                border: `1px solid ${colors.gray200}`
              }}>
                <div style={{
                  fontSize: '20px',
                  marginTop: '2px'
                }}>
                  ⚡
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    ...typography.body,
                    fontWeight: '600',
                    margin: '0 0 4px',
                    color: colors.gray900
                  }}>
                    "Switching to 15Ah batteries could reduce replacements by 30%"
                  </p>
                  <p style={{
                    ...typography.small,
                    color: colors.gray600,
                    margin: 0
                  }}>
                    Higher capacity batteries last longer for your heavy-duty applications.
                  </p>
                </div>
                <button style={{
                  padding: '4px 8px',
                  backgroundColor: `${colors.success}15`,
                  color: colors.success,
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  Upgrade
                </button>
              </div>
              
              {/* Automation Insight */}
              <div style={{
                display: 'flex',
                alignItems: 'start',
                gap: spacing.md,
                padding: spacing.md,
                backgroundColor: colors.white,
                borderRadius: '8px',
                border: `1px solid ${colors.gray200}`
              }}>
                <div style={{
                  fontSize: '20px',
                  marginTop: '2px'
                }}>
                  🤖
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    ...typography.body,
                    fontWeight: '600',
                    margin: '0 0 4px',
                    color: colors.gray900
                  }}>
                    "Enable auto-reorder to never run low on critical supplies"
                  </p>
                  <p style={{
                    ...typography.small,
                    color: colors.gray600,
                    margin: 0
                  }}>
                    Based on your usage, auto-reorder would prevent 95% of potential stockouts.
                  </p>
                </div>
                <button style={{
                  padding: '4px 8px',
                  backgroundColor: `${colors.primary}15`,
                  color: colors.primary,
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  Set Up
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders with improved zebra striping */}
        <div style={{
          ...componentStyles.card,
          padding: spacing.lg,
          opacity: 0,
          animation: `fadeInUp 0.4s ease forwards`,
          animationDelay: '1s'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: spacing.lg
          }}>
            <div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: colors.gray900,
                margin: 0,
                marginBottom: '8px'
              }}>
                Recent Orders
              </h3>
              <p style={{ 
                fontSize: '16px', 
                color: colors.gray600, 
                margin: 0,
                fontWeight: '400'
              }}>
                Your recent battery orders
              </p>
            </div>
            <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
              {/* Filter pills */}
              <div style={{ display: 'flex', gap: spacing.sm }}>
                {['All', 'Processing', 'In Transit', 'Delivered'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setActiveOrderFilter(filter.toLowerCase())
                      setCurrentPage(1)
                    }}
                    style={{
                      padding: '6px 16px',
                      backgroundColor: activeOrderFilter === filter.toLowerCase() ? colors.primary : colors.white,
                      color: activeOrderFilter === filter.toLowerCase() ? colors.white : colors.gray700,
                      border: `1px solid ${activeOrderFilter === filter.toLowerCase() ? colors.primary : colors.gray300}`,
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (activeOrderFilter !== filter.toLowerCase()) {
                        e.currentTarget.style.borderColor = colors.primary
                        e.currentTarget.style.backgroundColor = `${colors.primary}08`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeOrderFilter !== filter.toLowerCase()) {
                        e.currentTarget.style.borderColor = colors.gray300
                        e.currentTarget.style.backgroundColor = colors.white
                      }
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleExportOrders}
                style={componentStyles.button.secondary}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.gray100
                  e.currentTarget.style.borderColor = colors.gray400
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.white
                  e.currentTarget.style.borderColor = colors.gray300
                }}
              >
                <FileDown size={14} />
                Export
              </button>
            </div>
          </div>

          {/* Orders Table with consistent row heights */}
          {ordersLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} height={64} />
              ))}
            </div>
          ) : paginatedOrders.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: colors.gray100,
              borderRadius: '8px',
              border: `1px dashed ${colors.gray400}`
            }}>
              <Package size={48} color={colors.gray400} style={{ marginBottom: spacing.md }} />
              <h4 style={{ ...typography.sectionHeader, marginBottom: spacing.sm }}>
                No orders found
              </h4>
              <p style={{ ...typography.body, marginBottom: spacing.lg }}>
                {activeOrderFilter === 'all' 
                  ? "You haven't placed any orders yet"
                  : `No ${activeOrderFilter} orders found`}
              </p>
              <button
                onClick={() => router.push('/customer/engraving')}
                style={componentStyles.button.primary}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primaryDark
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Design My Battery
              </button>
            </div>
          ) : (
            <>
              {/* Simple List Format */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.lg
              }}>
                <p style={{
                  fontSize: '16px',
                  color: colors.gray600,
                  margin: 0
                }}>
                  Showing your last 3 orders
                </p>
                <button
                  onClick={() => router.push('/customer/orders')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: colors.white,
                    color: colors.primary,
                    border: `1px solid ${colors.primary}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  See All
                </button>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.md
              }}>
                {/* Simple order cards */}
                {paginatedOrders.map((order, index) => {
                  const statusIcon = order.status === 'delivered' ? '✓' :
                                   order.status === 'in_transit' ? '🚚' :
                                   order.status === 'processing' ? '📦' : '⚪';
                  
                  const statusText = order.status === 'delivered' ? `Delivered ${order.dateDelivered || 'Monday'}` :
                                   order.status === 'in_transit' ? `Arriving ${order.estimatedDelivery || 'Tuesday 2:30 PM'}` :
                                   order.status === 'processing' ? `Processing - Ships ${order.estimatedShip || 'Tomorrow'}` : 'Status Unknown';
                  
                  const itemSummary = `${order.totalItems} batteries to ${order.location || 'Site A'}`;
                  
                  return (
                    <div
                      key={order.id}
                      style={{
                        backgroundColor: colors.white,
                        border: `1px solid ${colors.gray200}`,
                        borderRadius: '8px',
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${colors.primary}05`;
                        e.currentTarget.style.borderColor = colors.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.white;
                        e.currentTarget.style.borderColor = colors.gray200;
                      }}
                    >
                      {/* Status Icon */}
                      <div style={{
                        fontSize: '24px',
                        width: '32px',
                        textAlign: 'center',
                        color: order.status === 'delivered' ? colors.success : 
                               order.status === 'in_transit' ? colors.info :
                               order.status === 'processing' ? colors.warning : colors.gray500
                      }}>
                        {statusIcon}
                      </div>
                      
                      {/* Order Details */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: colors.gray900,
                          marginBottom: '4px'
                        }}>
                          {statusText}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: colors.gray600,
                          marginBottom: '8px'
                        }}>
                          {itemSummary}
                        </div>
                        
                        {/* Action Buttons */}
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center'
                        }}>
                          {order.status === 'delivered' && (
                            <>
                              <button style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                backgroundColor: colors.primary,
                                color: colors.white,
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}>
                                Reorder Same
                              </button>
                              <button style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                backgroundColor: 'transparent',
                                color: colors.primary,
                                border: `1px solid ${colors.primary}`,
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}>
                                View Invoice
                              </button>
                            </>
                          )}
                          {order.status === 'in_transit' && (
                            <button style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: colors.info,
                              color: colors.white,
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}>
                              Track Delivery
                            </button>
                          )}
                          {order.status === 'processing' && (
                            <button style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: colors.warning,
                              color: colors.white,
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}>
                              View Details
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Total */}
                      <div style={{
                        textAlign: 'right'
                      }}>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: '700',
                          color: colors.gray900
                        }}>
                          ${order.total.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: spacing.lg,
                  paddingTop: spacing.lg,
                  borderTop: `1px solid ${colors.gray300}`
                }}>
                  <p style={typography.body}>
                    Showing {((currentPage - 1) * ordersPerPage) + 1} to {Math.min(currentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length} orders
                  </p>
                  <div style={{ display: 'flex', gap: spacing.sm }}>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      style={{
                        ...componentStyles.button.secondary,
                        color: currentPage === 1 ? colors.gray400 : colors.gray700,
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: currentPage === 1 ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== 1) {
                          e.currentTarget.style.backgroundColor = colors.gray100
                          e.currentTarget.style.borderColor = colors.gray400
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage !== 1) {
                          e.currentTarget.style.backgroundColor = colors.white
                          e.currentTarget.style.borderColor = colors.gray300
                        }
                      }}
                    >
                      <ChevronLeft size={14} />
                      Previous
                    </button>
                    
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        style={{
                          ...componentStyles.button.secondary,
                          minWidth: '36px',
                          backgroundColor: currentPage === i + 1 ? colors.primary : colors.white,
                          color: currentPage === i + 1 ? colors.white : colors.gray700,
                          borderColor: currentPage === i + 1 ? colors.primary : colors.gray300,
                          fontWeight: currentPage === i + 1 ? '600' : '400'
                        }}
                        onMouseEnter={(e) => {
                          if (currentPage !== i + 1) {
                            e.currentTarget.style.backgroundColor = colors.gray100
                            e.currentTarget.style.borderColor = colors.gray400
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currentPage !== i + 1) {
                            e.currentTarget.style.backgroundColor = colors.white
                            e.currentTarget.style.borderColor = colors.gray300
                          }
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        ...componentStyles.button.secondary,
                        color: currentPage === totalPages ? colors.gray400 : colors.gray700,
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        opacity: currentPage === totalPages ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== totalPages) {
                          e.currentTarget.style.backgroundColor = colors.gray100
                          e.currentTarget.style.borderColor = colors.gray400
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage !== totalPages) {
                          e.currentTarget.style.backgroundColor = colors.white
                          e.currentTarget.style.borderColor = colors.gray300
                        }
                      }}
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}