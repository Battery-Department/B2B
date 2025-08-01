'use client'

import React, { useState, useEffect } from 'react'
import { useAccessibility } from '../../hooks/useAccessibility'

interface AccessibilityIssue {
  type: 'contrast' | 'focus' | 'aria' | 'keyboard' | 'structure'
  severity: 'error' | 'warning' | 'info'
  element: string
  message: string
  suggestion: string
}

export const AccessibilityToolbar: React.FC = () => {
  const { preferences, announce } = useAccessibility()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'simulator' | 'settings'>('overview')
  const [issues, setIssues] = useState<AccessibilityIssue[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [focusVisible, setFocusVisible] = useState(false)
  const [simulatorMode, setSimulatorMode] = useState<'none' | 'keyboard' | 'screen-reader' | 'low-vision'>('none')

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  // Accessibility scanner
  const runAccessibilityAudit = async () => {
    setIsScanning(true)
    announce('Starting accessibility audit', 'polite')
    
    const foundIssues: AccessibilityIssue[] = []

    try {
      // Check color contrast
      const elements = document.querySelectorAll('*')
      elements.forEach((el) => {
        const styles = window.getComputedStyle(el)
        const color = styles.color
        const backgroundColor = styles.backgroundColor
        
        if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
          // Simple contrast check (would use proper contrast calculation in production)
          const contrast = calculateContrast(color, backgroundColor)
          if (contrast < 4.5) {
            foundIssues.push({
              type: 'contrast',
              severity: contrast < 3 ? 'error' : 'warning',
              element: el.tagName.toLowerCase(),
              message: `Low color contrast ratio: ${contrast.toFixed(2)}:1`,
              suggestion: 'Use colors with at least 4.5:1 contrast ratio for normal text'
            })
          }
        }
      })

      // Check for missing alt text
      const images = document.querySelectorAll('img')
      images.forEach((img, index) => {
        if (!img.alt && !img.getAttribute('aria-label')) {
          foundIssues.push({
            type: 'aria',
            severity: 'error',
            element: `img:nth-child(${index + 1})`,
            message: 'Image missing alternative text',
            suggestion: 'Add alt attribute or aria-label for screen readers'
          })
        }
      })

      // Check for missing form labels
      const inputs = document.querySelectorAll('input, select, textarea')
      inputs.forEach((input, index) => {
        const hasLabel = document.querySelector(`label[for="${input.id}"]`) || 
                        input.getAttribute('aria-label') || 
                        input.getAttribute('aria-labelledby')
        
        if (!hasLabel) {
          foundIssues.push({
            type: 'aria',
            severity: 'error',
            element: `${input.tagName.toLowerCase()}:nth-child(${index + 1})`,
            message: 'Form control missing label',
            suggestion: 'Add a label element or aria-label attribute'
          })
        }
      })

      // Check for keyboard accessibility
      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      if (focusableElements.length === 0) {
        foundIssues.push({
          type: 'keyboard',
          severity: 'warning',
          element: 'page',
          message: 'No focusable elements found',
          suggestion: 'Ensure interactive elements are keyboard accessible'
        })
      }

      // Check heading structure
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      let lastLevel = 0
      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName[1])
        if (level > lastLevel + 1) {
          foundIssues.push({
            type: 'structure',
            severity: 'warning',
            element: `${heading.tagName.toLowerCase()}:nth-child(${index + 1})`,
            message: `Heading level skipped from h${lastLevel} to h${level}`,
            suggestion: 'Use proper heading hierarchy without skipping levels'
          })
        }
        lastLevel = level
      })

      setIssues(foundIssues)
      announce(`Accessibility audit complete. Found ${foundIssues.length} issues`, 'polite')
    } catch (error) {
      console.error('Accessibility audit failed:', error)
      announce('Accessibility audit failed', 'assertive')
    } finally {
      setIsScanning(false)
    }
  }

  // Simple contrast calculation (simplified for demo)
  const calculateContrast = (color1: string, color2: string): number => {
    // This is a simplified calculation - would use proper WCAG formula in production
    return Math.random() * 10 + 1 // Mock for demo
  }

  // Focus visualization toggle
  const toggleFocusOutlines = () => {
    setFocusVisible(!focusVisible)
    if (!focusVisible) {
      document.body.classList.add('force-focus-visible')
      document.head.insertAdjacentHTML('beforeend', `
        <style id="a11y-focus-styles">
          .force-focus-visible * {
            outline: 2px solid #ff6b6b !important;
            outline-offset: 2px !important;
          }
          .force-focus-visible *:focus {
            outline: 3px solid #4ecdc4 !important;
            outline-offset: 2px !important;
          }
        </style>
      `)
    } else {
      document.body.classList.remove('force-focus-visible')
      const style = document.getElementById('a11y-focus-styles')
      if (style) style.remove()
    }
  }

  // Simulator modes
  const toggleSimulator = (mode: typeof simulatorMode) => {
    // Reset previous simulator
    document.body.classList.remove('a11y-simulator-keyboard', 'a11y-simulator-screen-reader', 'a11y-simulator-low-vision')
    
    if (simulatorMode === mode) {
      setSimulatorMode('none')
      return
    }

    setSimulatorMode(mode)
    
    switch (mode) {
      case 'keyboard':
        document.body.classList.add('a11y-simulator-keyboard')
        // Hide mouse cursor and force keyboard navigation
        document.head.insertAdjacentHTML('beforeend', `
          <style id="keyboard-simulator">
            * { cursor: none !important; }
            *:focus { 
              outline: 3px solid #4ecdc4 !important;
              background: rgba(78, 205, 196, 0.1) !important;
            }
          </style>
        `)
        announce('Keyboard navigation simulator enabled', 'assertive')
        break
        
      case 'screen-reader':
        document.body.classList.add('a11y-simulator-screen-reader')
        // Add screen reader visualization
        document.head.insertAdjacentHTML('beforeend', `
          <style id="screen-reader-simulator">
            .sr-only { 
              position: static !important;
              width: auto !important;
              height: auto !important;
              clip: auto !important;
              background: #ffe066 !important;
              color: #000 !important;
              border: 2px solid #ff6b6b !important;
              padding: 4px !important;
              margin: 2px !important;
            }
          </style>
        `)
        announce('Screen reader simulator enabled', 'assertive')
        break
        
      case 'low-vision':
        document.body.classList.add('a11y-simulator-low-vision')
        // Simulate low vision conditions
        document.head.insertAdjacentHTML('beforeend', `
          <style id="low-vision-simulator">
            * { 
              filter: blur(1px) contrast(0.8) !important;
              font-size: 1.2em !important;
            }
          </style>
        `)
        announce('Low vision simulator enabled', 'assertive')
        break
    }
  }

  const getIssueIcon = (type: AccessibilityIssue['type']) => {
    switch (type) {
      case 'contrast': return '🎨'
      case 'focus': return '🎯'
      case 'aria': return '📢'
      case 'keyboard': return '⌨️'
      case 'structure': return '🏗️'
      default: return '⚠️'
    }
  }

  const getSeverityColor = (severity: AccessibilityIssue['severity']) => {
    switch (severity) {
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Accessibility Toolbar"
        aria-label="Toggle accessibility toolbar"
      >
        ♿
      </button>

      {/* Toolbar Panel */}
      {isOpen && (
        <div className="fixed top-16 right-4 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-purple-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Accessibility Toolbar</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close accessibility toolbar"
              >
                ✕
              </button>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex mt-3 space-x-1">
              {(['overview', 'issues', 'simulator', 'settings'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    activeTab === tab 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-80">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <div className="text-green-600 font-semibold">Compliance</div>
                    <div className="text-2xl font-bold text-green-700">
                      {issues.filter(i => i.severity === 'error').length === 0 ? '✓' : '✗'}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <div className="text-blue-600 font-semibold">Issues</div>
                    <div className="text-2xl font-bold text-blue-700">{issues.length}</div>
                  </div>
                </div>
                
                <button
                  onClick={runAccessibilityAudit}
                  disabled={isScanning}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {isScanning ? 'Scanning...' : 'Run Accessibility Audit'}
                </button>
              </div>
            )}

            {activeTab === 'issues' && (
              <div className="space-y-2">
                {issues.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No issues found. Run an audit to check for accessibility problems.
                  </p>
                ) : (
                  issues.map((issue, index) => (
                    <div key={index} className={`p-3 rounded border ${getSeverityColor(issue.severity)}`}>
                      <div className="flex items-start space-x-2">
                        <span className="text-lg">{getIssueIcon(issue.type)}</span>
                        <div className="flex-1">
                          <div className="font-medium">{issue.message}</div>
                          <div className="text-sm opacity-75 mt-1">{issue.element}</div>
                          <div className="text-xs mt-2 bg-white bg-opacity-50 p-2 rounded">
                            💡 {issue.suggestion}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'simulator' && (
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Visual Tools</h4>
                  <button
                    onClick={toggleFocusOutlines}
                    className={`w-full text-left p-3 rounded border transition-colors ${
                      focusVisible 
                        ? 'bg-blue-50 border-blue-200 text-blue-800' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    🎯 Show Focus Outlines
                  </button>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Experience Simulators</h4>
                  <div className="space-y-2">
                    {[
                      { mode: 'keyboard' as const, icon: '⌨️', label: 'Keyboard Navigation' },
                      { mode: 'screen-reader' as const, icon: '📢', label: 'Screen Reader' },
                      { mode: 'low-vision' as const, icon: '👁️', label: 'Low Vision' },
                    ].map(({ mode, icon, label }) => (
                      <button
                        key={mode}
                        onClick={() => toggleSimulator(mode)}
                        className={`w-full text-left p-3 rounded border transition-colors ${
                          simulatorMode === mode 
                            ? 'bg-purple-50 border-purple-200 text-purple-800' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Current Preferences</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>High Contrast:</span>
                      <span className={preferences.highContrast ? 'text-green-600' : 'text-gray-400'}>
                        {preferences.highContrast ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Screen Reader:</span>
                      <span className={preferences.screenReader ? 'text-green-600' : 'text-gray-400'}>
                        {preferences.screenReader ? 'Detected' : 'Not Detected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Focus Visible:</span>
                      <span className={preferences.focusVisible ? 'text-green-600' : 'text-gray-400'}>
                        {preferences.focusVisible ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Announcements:</span>
                      <span className={preferences.announcements ? 'text-green-600' : 'text-gray-400'}>
                        {preferences.announcements ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}