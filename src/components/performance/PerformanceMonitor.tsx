import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  Clock, 
  Zap, 
  Eye, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Gauge,
  MonitorSpeaker,
  HardDrive,
  Wifi
} from 'lucide-react'
import usePerformance from '@/hooks/usePerformance'
import { performanceMonitor, trackBundleSize } from '@/utils/performance'

interface PerformanceMetric {
  name: string
  value: number | null
  unit: string
  threshold: {
    good: number
    poor: number
  }
  icon: React.ReactNode
  description: string
}

interface PerformanceGrade {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  color: string
}

export default function PerformanceMonitor() {
  const { getMetrics, getPerformanceGrade, measureResourceTiming } = usePerformance()
  const [metrics, setMetrics] = useState(getMetrics())
  const [grade, setGrade] = useState<PerformanceGrade>({ score: 0, grade: 'F', color: '#ef4444' })
  const [bundleStats, setBundleStats] = useState<any>(null)
  const [systemMetrics, setSystemMetrics] = useState<any>({})
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Core Web Vitals configuration
  const webVitals: PerformanceMetric[] = [
    {
      name: 'First Contentful Paint',
      value: metrics.fcp,
      unit: 'ms',
      threshold: { good: 1800, poor: 3000 },
      icon: <Eye className="h-4 w-4" />,
      description: 'Time until first content appears'
    },
    {
      name: 'Largest Contentful Paint',
      value: metrics.lcp,
      unit: 'ms',
      threshold: { good: 2500, poor: 4000 },
      icon: <MonitorSpeaker className="h-4 w-4" />,
      description: 'Time until largest content loads'
    },
    {
      name: 'First Input Delay',
      value: metrics.fid,
      unit: 'ms',
      threshold: { good: 100, poor: 300 },
      icon: <Zap className="h-4 w-4" />,
      description: 'Response time to first interaction'
    },
    {
      name: 'Cumulative Layout Shift',
      value: metrics.cls,
      unit: '',
      threshold: { good: 0.1, poor: 0.25 },
      icon: <Activity className="h-4 w-4" />,
      description: 'Visual stability of the page'
    },
    {
      name: 'Time to First Byte',
      value: metrics.ttfb,
      unit: 'ms',
      threshold: { good: 800, poor: 1800 },
      icon: <Wifi className="h-4 w-4" />,
      description: 'Server response time'
    }
  ]

  const getMetricStatus = (metric: PerformanceMetric) => {
    if (metric.value === null) return 'unknown'
    if (metric.value <= metric.threshold.good) return 'good'
    if (metric.value <= metric.threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200'
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'poor': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4" />
      case 'needs-improvement': return <AlertTriangle className="h-4 w-4" />
      case 'poor': return <TrendingDown className="h-4 w-4" />
      default: return <Minus className="h-4 w-4" />
    }
  }

  const refreshMetrics = async () => {
    setIsRefreshing(true)
    
    try {
      // Get updated metrics
      const newMetrics = getMetrics()
      setMetrics(newMetrics)
      
      // Get performance grade
      const newGrade = getPerformanceGrade()
      setGrade({
        ...newGrade,
        color: newGrade.grade === 'A' ? '#10b981' :
               newGrade.grade === 'B' ? '#3b82f6' :
               newGrade.grade === 'C' ? '#f59e0b' :
               newGrade.grade === 'D' ? '#ef4444' : '#7c2d12'
      })
      
      // Get bundle stats
      const bundle = await trackBundleSize()
      setBundleStats(bundle)
      
      // Get system metrics
      const system = performanceMonitor.getMetrics()
      setSystemMetrics(system)
      
      // Measure resources
      measureResourceTiming()
      
    } catch (error) {
      console.error('Failed to refresh metrics:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    refreshMetrics()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Monitor</h1>
          <p className="text-gray-600 mt-1">
            Real-time performance metrics and optimization insights
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Overall Grade */}
          <div className="text-center">
            <div 
              className="text-4xl font-bold mb-1"
              style={{ color: grade.color }}
            >
              {grade.grade}
            </div>
            <div className="text-sm text-gray-600">
              Score: {grade.score}
            </div>
          </div>
          
          <Button 
            onClick={refreshMetrics} 
            disabled={isRefreshing}
            variant="outline"
          >
            {isRefreshing ? (
              <Activity className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TrendingUp className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {webVitals.map((metric) => {
          const status = getMetricStatus(metric)
          const statusColor = getStatusColor(status)
          
          return (
            <Card key={metric.name} className="relative">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {metric.icon}
                  <Badge variant="outline" className={statusColor}>
                    {getStatusIcon(status)}
                    <span className="ml-1 capitalize">
                      {status.replace('-', ' ')}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metric.value !== null ? (
                    <>
                      {metric.value.toFixed(metric.name === 'Cumulative Layout Shift' ? 3 : 0)}
                      <span className="text-sm font-normal text-gray-500 ml-1">
                        {metric.unit}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {metric.description}
                </p>
                
                {/* Threshold indicators */}
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className="text-green-600">
                    Good: ≤ {metric.threshold.good}{metric.unit}
                  </span>
                  <span className="text-red-600">
                    Poor: &gt; {metric.threshold.poor}{metric.unit}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {systemMetrics.memoryUsed ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Used Heap Size</span>
                  <span className="font-mono">
                    {(systemMetrics.memoryUsed.current / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Heap Size</span>
                  <span className="font-mono">
                    {(systemMetrics.memoryTotal?.current / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Heap Size Limit</span>
                  <span className="font-mono">
                    {(systemMetrics.memoryLimit?.current / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
                
                {/* Memory usage bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(systemMetrics.memoryUsed.current / systemMetrics.memoryLimit?.current) * 100}%` 
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Memory metrics not available</div>
            )}
          </CardContent>
        </Card>

        {/* Bundle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Bundle Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bundleStats ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Size</span>
                  <span className="font-mono">
                    {(bundleStats.totalSize / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Gzipped Size</span>
                  <span className="font-mono">
                    {(bundleStats.gzippedSize / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Chunks</span>
                  <span className="font-mono">
                    {bundleStats.chunks?.length || 0}
                  </span>
                </div>
                
                {/* Size indicator */}
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={bundleStats.totalSize > 200000 ? "destructive" : 
                            bundleStats.totalSize > 100000 ? "secondary" : "default"}
                  >
                    {bundleStats.totalSize > 200000 ? 'Large' : 
                     bundleStats.totalSize > 100000 ? 'Medium' : 'Small'}
                  </Badge>
                  <span className="text-xs text-gray-600">
                    Target: &lt; 200KB
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Bundle stats not available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Performance Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {webVitals.map((metric) => {
              const status = getMetricStatus(metric)
              if (status === 'good' || metric.value === null) return null
              
              return (
                <div key={metric.name} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-800">
                      Optimize {metric.name}
                    </div>
                    <div className="text-sm text-yellow-700 mt-1">
                      Current: {metric.value?.toFixed(metric.name === 'Cumulative Layout Shift' ? 3 : 0)}{metric.unit}, 
                      Target: ≤ {metric.threshold.good}{metric.unit}
                    </div>
                    <div className="text-sm text-yellow-600 mt-2">
                      {getRecommendation(metric.name)}
                    </div>
                  </div>
                </div>
              )
            })}
            
            {webVitals.every(metric => getMetricStatus(metric) === 'good' || metric.value === null) && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="text-green-800">
                  All performance metrics are within recommended thresholds!
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-600">
            Performance chart would be implemented here with a charting library like Chart.js or Recharts
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getRecommendation(metricName: string): string {
  switch (metricName) {
    case 'First Contentful Paint':
      return 'Optimize server response times, minimize render-blocking resources, and preload critical assets.'
    case 'Largest Contentful Paint':
      return 'Optimize images, preload hero images, and eliminate render-blocking JavaScript.'
    case 'First Input Delay':
      return 'Minimize JavaScript execution time, break up long tasks, and use web workers for heavy computations.'
    case 'Cumulative Layout Shift':
      return 'Include size attributes on images and videos, avoid inserting content above existing content.'
    case 'Time to First Byte':
      return 'Optimize server configuration, use CDN, and implement caching strategies.'
    default:
      return 'Review performance best practices for this metric.'
  }
}