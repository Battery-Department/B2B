'use client'

import React, { useState, useEffect } from 'react'
import { 
  getBundleAnalytics, 
  validateBundleSize, 
  generateOptimizationReport,
  DEFAULT_OPTIMIZATION_CONFIG,
  type OptimizationConfig 
} from '../../utils/bundleOptimization'

interface BundleAnalyzerProps {
  showInDevelopment?: boolean
  config?: Partial<OptimizationConfig>
}

export const BundleAnalyzer: React.FC<BundleAnalyzerProps> = ({ 
  showInDevelopment = true,
  config = {}
}) => {
  const [analytics, setAnalytics] = useState(getBundleAnalytics())
  const [isVisible, setIsVisible] = useState(false)
  const optimizationConfig = { ...DEFAULT_OPTIMIZATION_CONFIG, ...config }

  // Only show in development unless explicitly configured
  const shouldShow = process.env.NODE_ENV === 'development' ? showInDevelopment : true

  useEffect(() => {
    if (!shouldShow) return

    // Update analytics every 5 seconds
    const interval = setInterval(() => {
      setAnalytics(getBundleAnalytics())
    }, 5000)

    return () => clearInterval(interval)
  }, [shouldShow])

  if (!shouldShow) return null

  const validation = validateBundleSize(optimizationConfig)
  const report = generateOptimizationReport(optimizationConfig)

  const formatSize = (bytes: number) => {
    const kb = bytes / 1024
    return kb < 1024 ? `${kb.toFixed(2)} KB` : `${(kb / 1024).toFixed(2)} MB`
  }

  const formatTime = (ms: number) => `${ms.toFixed(2)}ms`

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Toggle Bundle Analyzer"
      >
        📊
      </button>

      {/* Analytics panel */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Bundle Analyzer</h3>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Bundle size validation */}
            <div className={`p-3 rounded-lg ${validation.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Bundle Size</span>
                <span className={`text-sm font-bold ${validation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {formatSize(validation.currentSize * 1024)} / {formatSize(validation.maxSize * 1024)}
                </span>
              </div>
              {!validation.isValid && (
                <p className="text-xs text-red-600 mt-1">
                  Exceeds target by {formatSize((validation.currentSize - validation.maxSize) * 1024)}
                </p>
              )}
            </div>

            {/* Performance metrics */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Performance</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-gray-500">Avg Load Time</div>
                  <div className="font-semibold">{formatTime(analytics.averageLoadTime)}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-gray-500">Total Components</div>
                  <div className="font-semibold">{analytics.largestComponents.length}</div>
                </div>
              </div>
            </div>

            {/* Largest components */}
            {analytics.largestComponents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Largest Components</h4>
                <div className="space-y-1">
                  {analytics.largestComponents.slice(0, 3).map((component) => (
                    <div key={component.name} className="flex justify-between text-xs">
                      <span className="text-gray-600 truncate">{component.name}</span>
                      <span className="font-mono">{formatSize(component.size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slowest components */}
            {analytics.slowestComponents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Slowest Loading</h4>
                <div className="space-y-1">
                  {analytics.slowestComponents.slice(0, 3).map((component) => (
                    <div key={component.name} className="flex justify-between text-xs">
                      <span className="text-gray-600 truncate">{component.name}</span>
                      <span className="font-mono">{formatTime(component.time)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {validation.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h4>
                <div className="space-y-1">
                  {validation.recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="text-xs text-gray-600 bg-yellow-50 p-2 rounded">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export report button */}
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(report, null, 2)], { 
                  type: 'application/json' 
                })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `bundle-report-${Date.now()}.json`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="w-full text-xs bg-blue-600 text-white py-2 px-3 rounded hover:bg-blue-700 transition-colors"
            >
              Export Report
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// Hook for component-level optimization monitoring
export const useComponentOptimization = (componentName: string) => {
  const [renderCount, setRenderCount] = useState(0)
  const [lastRenderTime, setLastRenderTime] = useState<number | null>(null)

  useEffect(() => {
    const startTime = performance.now()
    setRenderCount(prev => prev + 1)

    return () => {
      const renderTime = performance.now() - startTime
      setLastRenderTime(renderTime)

      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.warn(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`)
      }
    }
  })

  return {
    renderCount,
    lastRenderTime,
    isSlowRender: lastRenderTime !== null && lastRenderTime > 16,
  }
}

// Development-only performance overlay
export const PerformanceOverlay: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (process.env.NODE_ENV !== 'development') {
    return <>{children}</>
  }

  return (
    <>
      {children}
      <BundleAnalyzer />
    </>
  )
}