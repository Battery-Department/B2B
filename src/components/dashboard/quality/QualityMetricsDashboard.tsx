'use client'

import React, { useState, useEffect } from 'react'
import { qualityMetricsService, QualityMetrics, DefectData, TestResult, QualityInsight } from '@/services/analytics/quality-metrics'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, DonutChart } from 'recharts'

interface QualityMetricsDashboardProps {
  className?: string
}

const QualityMetricsDashboard: React.FC<QualityMetricsDashboardProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null)
  const [defects, setDefects] = useState<DefectData[]>([])
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [insights, setInsights] = useState<QualityInsight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setMetrics(qualityMetricsService.getQualityMetrics())
        setDefects(qualityMetricsService.getDefects())
        setTestResults(qualityMetricsService.getTestResults())
        setInsights(qualityMetricsService.getQualityInsights())
        setLoading(false)
      } catch (error) {
        console.error('Failed to load quality metrics:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading || !metrics) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const defectAnalytics = qualityMetricsService.getDefectAnalytics()
  const testAnalytics = qualityMetricsService.getTestAnalytics()

  const qualityTrends = qualityMetricsService.getQualityTrends('testCoverage', 7).map(trend => ({
    date: trend.date.toLocaleDateString(),
    coverage: trend.value,
    target: trend.target
  }))

  const defectsBySeverity = Object.entries(defectAnalytics.defectsBySeverity).map(([severity, count]) => ({
    name: severity,
    value: count,
    color: severity === 'critical' ? '#DC2626' : severity === 'high' ? '#EA580C' : severity === 'medium' ? '#D97706' : '#2563EB'
  }))

  const testResultsByEnvironment = Object.entries(testAnalytics.testsBySuite).map(([suite, count]) => ({
    suite,
    count,
    passRate: testAnalytics.passRate
  }))

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quality Control & Testing</h2>
          <p className="text-gray-600">Terminal 6: Quality assurance metrics and compliance monitoring</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Quality Gate: {metrics.qualityGatesPassed} Passed
        </Badge>
      </div>

      {/* Key Quality Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Test Coverage</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.testCoverage.toFixed(1)}%</p>
              <p className="text-xs text-green-600">Target: 95%</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${metrics.testCoverage >= 95 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Defect Detection</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.defectDetectionRate.toFixed(1)}%</p>
              <p className="text-xs text-green-600">Excellent</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Compliance Score</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.complianceScore.toFixed(1)}%</p>
              <p className="text-xs text-green-600">Industry Leading</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Bugs</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.criticalBugsFound}</p>
              <p className="text-xs text-orange-600">Needs attention</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${metrics.criticalBugsFound <= 2 ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="defects">Defect Tracking</TabsTrigger>
          <TabsTrigger value="testing">Test Results</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="insights">Quality Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality Metrics Overview */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quality Metrics Dashboard</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Automated Tests Passing</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${metrics.automatedTestsPassing}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{metrics.automatedTestsPassing.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Zero Defect Production</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${metrics.zeroDefectProduction}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{metrics.zeroDefectProduction.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Code Quality Score</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${metrics.codeQualityScore}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{metrics.codeQualityScore.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Test Automation Coverage</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-500 h-2 rounded-full" 
                        style={{ width: `${metrics.testAutomationCoverage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{metrics.testAutomationCoverage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Test Coverage Trend */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Test Coverage Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={qualityTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[85, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="coverage" stroke="#3B82F6" strokeWidth={2} name="Coverage" />
                  <Line type="monotone" dataKey="target" stroke="#EF4444" strokeDasharray="5 5" name="Target" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Additional Quality Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm font-medium text-gray-600">Performance Tests</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.performanceTestPassed.toFixed(1)}%</p>
              <p className="text-xs text-green-600">Passed</p>
            </Card>

            <Card className="p-4">
              <p className="text-sm font-medium text-gray-600">Security Tests</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.securityTestsPassed.toFixed(1)}%</p>
              <p className="text-xs text-green-600">Passed</p>
            </Card>

            <Card className="p-4">
              <p className="text-sm font-medium text-gray-600">Execution Time</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.testExecutionTime.toFixed(1)}</p>
              <p className="text-xs text-gray-600">minutes</p>
            </Card>

            <Card className="p-4">
              <p className="text-sm font-medium text-gray-600">Quality Gates</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.qualityGatesPassed}</p>
              <p className="text-xs text-green-600">Passed</p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="defects" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Defects by Severity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Defects by Severity</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={defectsBySeverity}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {defectsBySeverity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Defect Analytics */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Defect Analytics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Defects</span>
                  <span className="font-semibold">{defectAnalytics.totalDefects}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Open Defects</span>
                  <span className="font-semibold text-orange-600">{defectAnalytics.openDefects}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Critical Defects</span>
                  <span className="font-semibold text-red-600">{defectAnalytics.criticalDefects}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Resolution Time</span>
                  <span className="font-semibold">{defectAnalytics.averageResolutionTime.toFixed(1)} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">MTTR</span>
                  <span className="font-semibold">{defectAnalytics.mttr.toFixed(1)} days</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Defects */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Defects</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Severity</th>
                    <th className="text-left p-2">Module</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Found Date</th>
                  </tr>
                </thead>
                <tbody>
                  {defects.slice(0, 10).map((defect) => (
                    <tr key={defect.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-xs">{defect.id}</td>
                      <td className="p-2">
                        <Badge className={getPriorityColor(defect.severity)}>
                          {defect.severity}
                        </Badge>
                      </td>
                      <td className="p-2">{defect.module}</td>
                      <td className="p-2">
                        <Badge variant="outline" className={
                          defect.status === 'resolved' ? 'text-green-600 border-green-600' :
                          defect.status === 'in_progress' ? 'text-blue-600 border-blue-600' :
                          'text-orange-600 border-orange-600'
                        }>
                          {defect.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-2 text-gray-600">{defect.foundDate.toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Results by Suite */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Test Results by Suite</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={testResultsByEnvironment}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="suite" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3B82F6" name="Total Tests" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Test Analytics */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Test Analytics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Tests</span>
                  <span className="font-semibold">{testAnalytics.totalTests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Passed Tests</span>
                  <span className="font-semibold text-green-600">{testAnalytics.passedTests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Failed Tests</span>
                  <span className="font-semibold text-red-600">{testAnalytics.failedTests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pass Rate</span>
                  <span className="font-semibold">{testAnalytics.passRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Execution Time</span>
                  <span className="font-semibold">{testAnalytics.averageExecutionTime.toFixed(1)}s</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Test Results */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Test Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Test ID</th>
                    <th className="text-left p-2">Suite</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Environment</th>
                    <th className="text-left p-2">Execution Time</th>
                    <th className="text-left p-2">Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.slice(0, 10).map((test) => (
                    <tr key={test.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-xs">{test.id}</td>
                      <td className="p-2">{test.testSuite}</td>
                      <td className="p-2">
                        <div className={`w-2 h-2 rounded-full inline-block mr-2 ${getStatusColor(test.status)}`}></div>
                        {test.status}
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">{test.environment}</Badge>
                      </td>
                      <td className="p-2">{test.executionTime.toFixed(1)}s</td>
                      <td className="p-2">{test.coverage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Compliance Reports */}
            {qualityMetricsService.getComplianceReports().map((report, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{report.standard}</h3>
                    <p className="text-sm text-gray-600">Version {report.version}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{report.score.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Compliance Score</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{report.passed}</div>
                    <div className="text-sm text-gray-600">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">{report.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-600">{report.requirements.length}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <div>Last Audit: {report.lastAudit.toLocaleDateString()}</div>
                  <div>Next Audit: {report.nextAudit.toLocaleDateString()}</div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Badge className={getPriorityColor(insight.priority)}>
                      {insight.priority}
                    </Badge>
                    <Badge variant="outline" className={
                      insight.type === 'achievement' ? 'text-green-600 border-green-600' :
                      insight.type === 'risk' ? 'text-red-600 border-red-600' :
                      insight.type === 'improvement' ? 'text-blue-600 border-blue-600' :
                      'text-purple-600 border-purple-600'
                    }>
                      {insight.type}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500">{insight.timestamp.toLocaleDateString()}</span>
                </div>
                
                <h3 className="text-lg font-semibold mb-2">{insight.title}</h3>
                <p className="text-gray-700 mb-4">{insight.description}</p>
                
                {insight.impact && (
                  <div className="flex space-x-4 mb-4 text-sm">
                    {insight.impact.quality && (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-600">Quality Impact:</span>
                        <span className={insight.impact.quality > 0 ? 'text-green-600' : 'text-red-600'}>
                          {insight.impact.quality > 0 ? '+' : ''}{insight.impact.quality}%
                        </span>
                      </div>
                    )}
                    {insight.impact.time && (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-600">Time Impact:</span>
                        <span className={insight.impact.time < 0 ? 'text-green-600' : 'text-red-600'}>
                          {insight.impact.time > 0 ? '+' : ''}{insight.impact.time}%
                        </span>
                      </div>
                    )}
                    {insight.impact.cost && (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-600">Cost Impact:</span>
                        <span className={insight.impact.cost < 0 ? 'text-green-600' : 'text-red-600'}>
                          ${Math.abs(insight.impact.cost).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium mb-2">Recommendations:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {insight.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default QualityMetricsDashboard