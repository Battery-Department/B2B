'use client'

import React, { useState, useEffect } from 'react'
import { Brain } from 'lucide-react'

interface Stage {
  title: string
  content: string
}

interface ThinkingModeProps {
  stages: Stage[]
  onComplete: () => void
  isDarkMode?: boolean
}

const ThinkingMode: React.FC<ThinkingModeProps> = ({
  stages,
  onComplete,
  isDarkMode = false
}) => {
  const [currentStage, setCurrentStage] = useState(0)
  const [stageProgress, setStageProgress] = useState(0)
  const [displayedContent, setDisplayedContent] = useState('')
  
  useEffect(() => {
    if (currentStage >= stages.length) {
      onComplete()
      return
    }
    
    const currentStageContent = stages[currentStage].content
    const totalChars = currentStageContent.length
    let charIndex = 0
    
    const interval = setInterval(() => {
      charIndex += 1 + Math.floor(Math.random() * 3) // Variable speed
      
      if (charIndex >= totalChars) {
        clearInterval(interval)
        setStageProgress(100)
        setDisplayedContent(currentStageContent)
        
        setTimeout(() => {
          setCurrentStage(prev => prev + 1)
          setStageProgress(0)
          setDisplayedContent('')
        }, 500)
      } else {
        setStageProgress(Math.min((charIndex / totalChars) * 100, 99))
        setDisplayedContent(currentStageContent.substring(0, charIndex))
      }
    }, 50)
    
    return () => clearInterval(interval)
  }, [currentStage, stages, onComplete])
  
  if (currentStage >= stages.length) {
    return null
  }
  
  return (
    <div style={{
      backgroundColor: isDarkMode ? '#1e1e1e' : '#f9fafb',
      borderRadius: '8px',
      padding: '16px',
      margin: '16px 0',
      border: `1px solid ${isDarkMode ? '#3d3d3d' : '#e5e7eb'}`
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px',
        gap: '12px'
      }}>
        <Brain 
          size={20} 
          style={{
            color: '#0b6e99',
            animation: 'pulse 2s ease-in-out infinite'
          }}
        />
        <span style={{
          fontWeight: 600,
          color: isDarkMode ? '#ffffff' : '#1a1a1a',
          fontSize: '15px'
        }}>
          Thinking: {stages[currentStage].title}
        </span>
        <span style={{
          marginLeft: 'auto',
          color: isDarkMode ? '#9ca3af' : '#6b7280',
          fontSize: '13px'
        }}>
          {Math.round(stageProgress)}%
        </span>
      </div>
      
      <div style={{
        backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
          borderRadius: '2px',
          marginBottom: '12px',
          overflow: 'hidden'
        }}>
          <div 
            style={{
              width: `${stageProgress}%`,
              height: '100%',
              backgroundColor: '#0b6e99',
              borderRadius: '2px',
              transition: 'width 0.1s ease'
            }}
          />
        </div>
        
        <div style={{
          fontSize: '14px',
          color: isDarkMode ? '#d1d5db' : '#374151',
          lineHeight: '1.6',
          fontFamily: 'Menlo, Monaco, Consolas, monospace'
        }}>
          {displayedContent}
          <span style={{
            opacity: 0.5,
            animation: 'blink 1s ease-in-out infinite'
          }}>|</span>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'center'
      }}>
        {stages.map((stage, index) => (
          <div
            key={index}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: index < currentStage 
                ? '#10b981'
                : index === currentStage 
                ? '#0b6e99' 
                : (isDarkMode ? '#374151' : '#e5e7eb'),
              color: index <= currentStage ? '#ffffff' : (isDarkMode ? '#9ca3af' : '#6b7280'),
              transition: 'all 0.3s ease'
            }}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ThinkingMode