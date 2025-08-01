'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface ExpandableSectionProps {
  title: string
  children: React.ReactNode
  initiallyExpanded?: boolean
  isDarkMode?: boolean
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  children,
  initiallyExpanded = false,
  isDarkMode = false
}) => {
  const [expanded, setExpanded] = useState(initiallyExpanded)
  
  return (
    <div style={{
      borderRadius: '8px',
      border: `1px solid ${isDarkMode ? '#3d3d3d' : '#e5e7eb'}`,
      margin: '16px 0',
      overflow: 'hidden',
      transition: 'all 0.2s ease'
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          width: '100%',
          backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode ? '#333333' : '#f3f4f6'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode ? '#2d2d2d' : '#f9fafb'
        }}
      >
        <span style={{
          fontWeight: 600,
          color: isDarkMode ? '#ffffff' : '#1a1a1a',
          fontSize: '15px'
        }}>
          {title}
        </span>
        <ChevronDown 
          size={20} 
          style={{
            color: isDarkMode ? '#9ca3af' : '#6b7280',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}
        />
      </button>
      
      <div
        aria-hidden={!expanded}
        style={{
          padding: expanded ? '16px' : '0 16px',
          maxHeight: expanded ? '1000px' : '0',
          opacity: expanded ? 1 : 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff'
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default ExpandableSection