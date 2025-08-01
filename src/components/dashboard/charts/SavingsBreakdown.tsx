'use client'

import React, { useState } from 'react'
import { Gift, TrendingDown, Calendar, Award, DollarSign } from 'lucide-react'

interface SavingsData {
  category: string
  amount: number
  percentage: number
  color: string
  icon: React.ReactNode
  description: string
}

interface SavingsBreakdownProps {
  data: SavingsData[]
  totalSavings: number
  totalMSRP: number
  loading?: boolean
}

const SavingsBreakdown: React.FC<SavingsBreakdownProps> = ({
  data = [],
  totalSavings,
  totalMSRP,
  loading = false
}) => {
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null)
  
  // Chart dimensions
  const size = 280
  const strokeWidth = 40
  const radius = (size - strokeWidth) / 2
  const center = size / 2
  
  // Calculate circumference and segments
  const circumference = 2 * Math.PI * radius
  let cumulativePercentage = 0

  const defaultData: SavingsData[] = [
    {
      category: 'Volume Discounts',
      amount: 2450,
      percentage: 45,
      color: '#006FEE',
      icon: <Award size={20} color="#006FEE" />,
      description: 'Bulk order savings'
    },
    {
      category: 'Quiz Recommendations',
      amount: 1680,
      percentage: 31,
      color: '#10B981',
      icon: <TrendingDown size={20} color="#10B981" />,
      description: 'AI-optimized selections'
    },
    {
      category: 'Seasonal Promotions',
      amount: 890,
      percentage: 16,
      color: '#F59E0B',
      icon: <Calendar size={20} color="#F59E0B" />,
      description: 'Limited-time offers'
    },
    {
      category: 'Loyalty Benefits',
      amount: 430,
      percentage: 8,
      color: '#8B5CF6',
      icon: <Gift size={20} color="#8B5CF6" />,
      description: 'Gold tier rewards'
    }
  ]

  const chartData = data.length > 0 ? data : defaultData
  const displayTotalSavings = totalSavings || chartData.reduce((sum, item) => sum + item.amount, 0)
  const displayTotalMSRP = totalMSRP || displayTotalSavings * 2.5

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #E6F4FF',
        boxShadow: '0 4px 12px rgba(0, 111, 238, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#E6F4FF', borderRadius: '12px' }} />
          <div>
            <div style={{ width: '150px', height: '20px', backgroundColor: '#E6F4FF', borderRadius: '4px', marginBottom: '8px' }} />
            <div style={{ width: '200px', height: '14px', backgroundColor: '#F3F4F6', borderRadius: '4px' }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ width: '280px', height: '280px', backgroundColor: '#F8FAFC', borderRadius: '50%' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '16px', height: '16px', backgroundColor: '#E6F4FF', borderRadius: '50%' }} />
              <div style={{ width: '120px', height: '16px', backgroundColor: '#F3F4F6', borderRadius: '4px' }} />
              <div style={{ width: '60px', height: '16px', backgroundColor: '#F3F4F6', borderRadius: '4px' }} />
            </div>
          ))}
        </div>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          backgroundColor: '#E6F9F0',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <DollarSign size={20} color="#10B981" />
        </div>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0A051E', marginBottom: '4px' }}>
            Savings Breakdown
          </h3>
          <p style={{ fontSize: '14px', color: '#5B6B7D' }}>
            Your total savings compared to MSRP
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '16px',
          backgroundColor: '#F0FDF4',
          borderRadius: '12px',
          border: '1px solid #D1FAE5'
        }}>
          <p style={{ fontSize: '14px', color: '#5B6B7D', marginBottom: '4px' }}>Total Saved</p>
          <p style={{ fontSize: '24px', fontWeight: '800', color: '#10B981' }}>
            ${displayTotalSavings.toLocaleString()}
          </p>
        </div>
        
        <div style={{
          textAlign: 'center',
          padding: '16px',
          backgroundColor: '#F8FBFF',
          borderRadius: '12px',
          border: '1px solid #E6F4FF'
        }}>
          <p style={{ fontSize: '14px', color: '#5B6B7D', marginBottom: '4px' }}>You Paid</p>
          <p style={{ fontSize: '24px', fontWeight: '800', color: '#006FEE' }}>
            ${(displayTotalMSRP - displayTotalSavings).toLocaleString()}
          </p>
        </div>
        
        <div style={{
          textAlign: 'center',
          padding: '16px',
          backgroundColor: '#FEF3C7',
          borderRadius: '12px',
          border: '1px solid #FDE68A'
        }}>
          <p style={{ fontSize: '14px', color: '#5B6B7D', marginBottom: '4px' }}>Savings Rate</p>
          <p style={{ fontSize: '24px', fontWeight: '800', color: '#F59E0B' }}>
            {Math.round((displayTotalSavings / displayTotalMSRP) * 100)}%
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
        {/* Donut Chart */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            {/* Background circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#F3F4F6"
              strokeWidth={strokeWidth}
            />
            
            {/* Data segments */}
            {chartData.map((item, index) => {
              const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`
              const strokeDashoffset = -cumulativePercentage * circumference / 100
              const currentCumulative = cumulativePercentage
              cumulativePercentage += item.percentage

              return (
                <circle
                  key={index}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={selectedSegment === index ? strokeWidth + 8 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    filter: selectedSegment === index ? 
                      'drop-shadow(0 4px 12px rgba(0, 111, 238, 0.3))' : 
                      'none'
                  }}
                  onMouseEnter={() => setSelectedSegment(index)}
                  onMouseLeave={() => setSelectedSegment(null)}
                />
              )
            })}
          </svg>
          
          {/* Center content */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '32px', fontWeight: '800', color: '#0A051E', marginBottom: '4px' }}>
              ${displayTotalSavings.toLocaleString()}
            </p>
            <p style={{ fontSize: '14px', color: '#5B6B7D' }}>
              Total Saved
            </p>
          </div>
        </div>

        {/* Legend */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {chartData.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #F3F4F6',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backgroundColor: selectedSegment === index ? `${item.color}10` : 'white',
                  borderColor: selectedSegment === index ? item.color : '#F3F4F6',
                  transform: selectedSegment === index ? 'translateY(-2px)' : 'translateY(0)',
                  boxShadow: selectedSegment === index ? 
                    `0 4px 12px ${item.color}20` : 
                    '0 2px 4px rgba(0, 0, 0, 0.02)'
                }}
                onMouseEnter={() => setSelectedSegment(index)}
                onMouseLeave={() => setSelectedSegment(null)}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: `${item.color}15`,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {item.icon}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#0A051E' }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: item.color }}>
                      ${item.amount.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#5B6B7D' }}>
                      {item.description}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#5B6B7D' }}>
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional insights */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#F8FBFF',
            borderRadius: '12px',
            border: '1px solid #E6F4FF'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <TrendingDown size={16} color="#10B981" />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#0A051E' }}>
                Smart Savings Tip
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#5B6B7D', lineHeight: '1.5' }}>
              {selectedSegment !== null ? (
                `${chartData[selectedSegment].category} contributed ${chartData[selectedSegment].percentage}% of your total savings. ${
                  chartData[selectedSegment].category === 'Volume Discounts' ? 
                    'Consider larger orders to maximize volume discounts.' :
                  chartData[selectedSegment].category === 'Quiz Recommendations' ?
                    'Our AI recommendations saved you significant money on optimized selections.' :
                  chartData[selectedSegment].category === 'Seasonal Promotions' ?
                    'Watch for seasonal promotions to boost your savings.' :
                    'Your Gold tier membership provides exclusive discounts.'
                }`
              ) : (
                'You\'re saving an average of ' + Math.round((displayTotalSavings / displayTotalMSRP) * 100) + 
                '% compared to MSRP. Increase order volumes or use our quiz recommendations to save even more.'
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SavingsBreakdown