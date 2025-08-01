import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar,
  ScatterChart, Scatter, FunnelChart, Funnel, LabelList
} from 'recharts'
import {
  Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock,
  Shield, Zap, Users, Code, TestTube, Activity, Award, Eye, Bug,
  Gauge, BarChart3, PieChart as PieChartIcon, TrendingUpIcon,
  RefreshCw, Download, Settings, Filter, Calendar
} from 'lucide-react'

interface QualityMetric {
  name: string
  current: number
  target: number
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  unit: string
  status: 'excellent' | 'good' | 'warning' | 'critical'
  description: string
}

interface TestingSummary {
  totalTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  flakyTests: number
  passRate: number
  coverage: {
    overall: number
    unit: number
    integration: number
    e2e: number
  }
  duration: {
    total: number
    average: number
    fastest: number
    slowest: number
  }
  trends: {
    passRate: number
    coverage: number
    duration: number
    flakiness: number
  }
}

interface QualityInsight {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
  automatable: boolean
  category: 'testing' | 'security' | 'performance' | 'maintainability'
}

interface DefectMetrics {
  production: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
  }
  prevented: {
    total: number
    byPhase: {
      development: number
      testing: number
      staging: number
    }
  }
  escapeRate: number
  meanTimeToDetection: number
  meanTimeToResolution: number
  preventionEffectiveness: number
}

export default function QualityMetricsExcellence() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'testing' | 'security' | 'performance'>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [metrics, setMetrics] = useState<QualityMetric[]>([])
  const [testingSummary, setTestingSummary] = useState<TestingSummary | null>(null)
  const [insights, setInsights] = useState<QualityInsight[]>([])
  const [defectMetrics, setDefectMetrics] = useState<DefectMetrics | null>(null)

  useEffect(() => {
    loadQualityMetrics()
  }, [timeRange, selectedCategory])

  const loadQualityMetrics = async () => {
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock data - in real implementation, this would come from APIs
    setMetrics([
      {
        name: 'Overall Quality Score',
        current: 94.2,
        target: 95,
        trend: 'up',
        trendValue: 2.3,
        unit: '%',
        status: 'good',
        description: 'Composite quality score based on all metrics'
      },
      {
        name: 'Test Coverage',
        current: 92.8,
        target: 90,
        trend: 'up',
        trendValue: 1.5,
        unit: '%',
        status: 'excellent',
        description: 'Percentage of code covered by automated tests'
      },
      {
        name: 'Test Pass Rate',
        current: 98.7,
        target: 95,
        trend: 'stable',
        trendValue: 0.1,
        unit: '%',
        status: 'excellent',
        description: 'Percentage of tests passing consistently'
      },
      {
        name: 'Defect Escape Rate',
        current: 0.8,
        target: 1.0,
        trend: 'down',
        trendValue: -0.3,
        unit: '%',
        status: 'excellent',
        description: 'Percentage of defects reaching production'
      },
      {
        name: 'Security Score',
        current: 96.5,
        target: 95,
        trend: 'up',
        trendValue: 1.2,
        unit: '%',
        status: 'excellent',
        description: 'Security posture based on vulnerability scans'
      },
      {
        name: 'Performance Score',
        current: 89.3,
        target: 85,
        trend: 'up',
        trendValue: 3.1,
        unit: '%',
        status: 'good',
        description: 'Performance benchmarks and SLA compliance'
      }
    ])

    setTestingSummary({
      totalTests: 2847,
      passedTests: 2809,
      failedTests: 23,
      skippedTests: 15,
      flakyTests: 8,
      passRate: 98.7,
      coverage: {
        overall: 92.8,
        unit: 95.2,
        integration: 89.4,
        e2e: 87.6
      },
      duration: {
        total: 1247000, // 20m 47s
        average: 438,
        fastest: 12,
        slowest: 15420
      },
      trends: {
        passRate: 1.2,
        coverage: 2.1,
        duration: -5.3,
        flakiness: -12.5
      }
    })

    setDefectMetrics({
      production: {
        total: 12,
        critical: 0,
        high: 2,
        medium: 6,
        low: 4
      },
      prevented: {
        total: 156,
        byPhase: {
          development: 89,
          testing: 52,
          staging: 15
        }
      },
      escapeRate: 0.8,
      meanTimeToDetection: 4.2,
      meanTimeToResolution: 18.5,
      preventionEffectiveness: 92.9
    })

    setInsights([
      {
        id: '1',
        type: 'success',
        title: 'Excellent Test Coverage',
        description: 'Test coverage has improved by 2.1% this week, exceeding the 90% target',
        impact: 'high',
        recommendation: 'Continue current testing practices and consider increasing target to 95%',
        automatable: false,
        category: 'testing'
      },
      {
        id: '2',
        type: 'warning',
        title: 'Performance Regression Detected',
        description: 'Response time P95 has increased by 15% in the last 24 hours',
        impact: 'medium',
        recommendation: 'Investigate recent deployments and optimize slow endpoints',
        automatable: true,
        category: 'performance'
      },
      {
        id: '3',
        type: 'info',
        title: 'Test Execution Optimization',
        description: 'Test suite duration reduced by 5.3% through parallel execution improvements',
        impact: 'medium',
        recommendation: 'Apply similar optimizations to integration test suite',
        automatable: true,
        category: 'testing'
      },
      {
        id: '4',
        type: 'success',
        title: 'Zero Critical Vulnerabilities',
        description: 'Security scans show no critical or high-severity vulnerabilities',
        impact: 'high',
        recommendation: 'Maintain current security practices and review medium-severity findings',
        automatable: false,
        category: 'security'
      }
    ])

    setIsLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200'
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'stable': return <Activity className="h-4 w-4 text-gray-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'error': return <Bug className="h-5 w-5 text-red-600" />
      case 'info': return <Eye className="h-5 w-5 text-blue-600" />
      default: return <Eye className="h-5 w-5 text-gray-600" />
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  // Chart data
  const qualityTrendData = [
    { date: '2024-01-01', quality: 91.2, coverage: 89.1, performance: 87.3, security: 94.1 },
    { date: '2024-01-02', quality: 91.8, coverage: 89.7, performance: 88.1, security: 94.5 },
    { date: '2024-01-03', quality: 92.1, coverage: 90.2, performance: 88.8, security: 95.2 },
    { date: '2024-01-04', quality: 92.9, coverage: 91.1, performance: 89.2, security: 95.8 },
    { date: '2024-01-05', quality: 93.4, coverage: 91.8, performance: 89.7, security: 96.1 },
    { date: '2024-01-06', quality: 93.8, coverage: 92.3, performance: 89.1, security: 96.3 },
    { date: '2024-01-07', quality: 94.2, coverage: 92.8, performance: 89.3, security: 96.5 }
  ]

  const defectDistributionData = [
    { name: 'Prevented in Dev', value: 89, fill: '#10b981' },
    { name: 'Prevented in Testing', value: 52, fill: '#3b82f6' },
    { name: 'Prevented in Staging', value: 15, fill: '#f59e0b' },
    { name: 'Escaped to Production', value: 12, fill: '#ef4444' }
  ]

  const testTypeDistributionData = [
    { name: 'Unit Tests', value: 1523, coverage: 95.2, fill: '#10b981' },
    { name: 'Integration Tests', value: 892, coverage: 89.4, fill: '#3b82f6' },
    { name: 'E2E Tests', value: 324, coverage: 87.6, fill: '#f59e0b' },
    { name: 'Performance Tests', value: 108, coverage: 92.1, fill: '#8b5cf6' }
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Award className="h-8 w-8 text-blue-600" />
            Quality Metrics Excellence
          </h1>
          <p className="text-gray-600 mt-1">
            Industry-leading quality assurance dashboard with real-time insights
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(['24h', '7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Categories</option>
            <option value="testing">Testing</option>
            <option value="security">Security</option>
            <option value="performance">Performance</option>
          </select>
          
          <Button 
            onClick={loadQualityMetrics} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.name}
              </CardTitle>
              <Badge variant="outline" className={getStatusColor(metric.status)}>
                {metric.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">
                {metric.current.toFixed(1)}{metric.unit}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mb-2">
                {getTrendIcon(metric.trend)}
                <span className="ml-1">
                  {metric.trendValue > 0 ? '+' : ''}{metric.trendValue.toFixed(1)}{metric.unit}
                </span>
                <span className="ml-1">vs target: {metric.target}{metric.unit}</span>
              </div>
              <p className="text-xs text-gray-600">
                {metric.description}
              </p>
              
              {/* Progress bar */}
              <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    metric.status === 'excellent' ? 'bg-green-600' :
                    metric.status === 'good' ? 'bg-blue-600' :
                    metric.status === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.min(100, (metric.current / metric.target) * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5" />
              Quality Metrics Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={qualityTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[80, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="quality" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Overall Quality" 
                />
                <Line 
                  type="monotone" 
                  dataKey="coverage" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Test Coverage" 
                />
                <Line 
                  type="monotone" 
                  dataKey="performance" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Performance" 
                />
                <Line 
                  type="monotone" 
                  dataKey="security" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Security" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Defect Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Defect Prevention Effectiveness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={defectDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {defectDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Prevention Rate:</span>
                <span className="font-medium text-green-600">
                  {defectMetrics?.preventionEffectiveness.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Escape Rate:</span>
                <span className="font-medium">
                  {defectMetrics?.escapeRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={testTypeDistributionData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              {testTypeDistributionData.map((test, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{test.name}:</span>
                  <span className="font-medium">{test.coverage}% coverage</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Testing Summary */}
      {testingSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Testing Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Test Execution Stats */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Test Execution</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Tests:</span>
                    <span className="font-medium">{testingSummary.totalTests.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Passed:</span>
                    <span className="font-medium text-green-600">{testingSummary.passedTests.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Failed:</span>
                    <span className="font-medium text-red-600">{testingSummary.failedTests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Flaky:</span>
                    <span className="font-medium text-yellow-600">{testingSummary.flakyTests}</span>
                  </div>
                </div>
              </div>

              {/* Coverage Stats */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Test Coverage</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Overall:</span>
                    <span className="font-medium">{testingSummary.coverage.overall}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Unit:</span>
                    <span className="font-medium">{testingSummary.coverage.unit}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Integration:</span>
                    <span className="font-medium">{testingSummary.coverage.integration}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">E2E:</span>
                    <span className="font-medium">{testingSummary.coverage.e2e}%</span>
                  </div>
                </div>
              </div>

              {/* Duration Stats */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Execution Time</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="font-medium">{formatDuration(testingSummary.duration.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average:</span>
                    <span className="font-medium">{testingSummary.duration.average}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Fastest:</span>
                    <span className="font-medium text-green-600">{testingSummary.duration.fastest}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Slowest:</span>
                    <span className="font-medium text-red-600">{formatDuration(testingSummary.duration.slowest)}</span>
                  </div>
                </div>
              </div>

              {/* Trends */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Trends (7d)</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pass Rate:</span>
                    <div className="flex items-center">
                      {testingSummary.trends.passRate > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                      )}
                      <span className="font-medium text-sm">
                        {testingSummary.trends.passRate > 0 ? '+' : ''}{testingSummary.trends.passRate}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Coverage:</span>
                    <div className="flex items-center">
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                      <span className="font-medium text-sm">+{testingSummary.trends.coverage}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <div className="flex items-center">
                      <TrendingDown className="h-3 w-3 text-green-600 mr-1" />
                      <span className="font-medium text-sm">{testingSummary.trends.duration}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Flakiness:</span>
                    <div className="flex items-center">
                      <TrendingDown className="h-3 w-3 text-green-600 mr-1" />
                      <span className="font-medium text-sm">{testingSummary.trends.flakiness}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quality Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Quality Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.id} className="flex items-start gap-4 p-4 rounded-lg border">
                <div className="flex-shrink-0">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900">{insight.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {insight.category}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        insight.impact === 'critical' ? 'border-red-200 text-red-600' :
                        insight.impact === 'high' ? 'border-orange-200 text-orange-600' :
                        insight.impact === 'medium' ? 'border-yellow-200 text-yellow-600' :
                        'border-blue-200 text-blue-600'
                      }`}
                    >
                      {insight.impact} impact
                    </Badge>
                    {insight.automatable && (
                      <Badge variant="outline" className="text-xs border-green-200 text-green-600">
                        Automatable
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                  <p className="text-sm text-gray-800 font-medium">
                    💡 {insight.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <TestTube className="h-6 w-6" />
              <span className="text-sm font-medium">Run Full Test Suite</span>
              <span className="text-xs text-gray-600">Execute all automated tests</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Shield className="h-6 w-6" />
              <span className="text-sm font-medium">Security Scan</span>
              <span className="text-xs text-gray-600">Run vulnerability assessment</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Gauge className="h-6 w-6" />
              <span className="text-sm font-medium">Performance Benchmark</span>
              <span className="text-xs text-gray-600">Execute performance tests</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Code className="h-6 w-6" />
              <span className="text-sm font-medium">Code Quality Scan</span>
              <span className="text-xs text-gray-600">Analyze code quality metrics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}