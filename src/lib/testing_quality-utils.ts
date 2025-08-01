/**
 * RHY Supplier Portal - Testing Quality Utilities
 * Utility functions for testing quality management and report generation
 */

import { TestSuite, TestResult, QualityReport, PerformanceMetrics } from '@/types/testing_quality'

/**
 * Calculate test execution statistics
 */
export function calculateTestStatistics(testSuites: TestSuite[]): {
  totalSuites: number
  totalTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  passRate: number
  averageExecutionTime: number
  averageCoverage: number
} {
  const totalSuites = testSuites.length
  const allResults = testSuites.flatMap(suite => suite.results)
  const totalTests = allResults.length
  const passedTests = allResults.filter(result => result.status === 'passed').length
  const failedTests = allResults.filter(result => result.status === 'failed').length
  const skippedTests = allResults.filter(result => result.status === 'skipped').length
  const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0
  
  const totalExecutionTime = testSuites.reduce((sum, suite) => sum + suite.executionTime, 0)
  const averageExecutionTime = totalSuites > 0 ? totalExecutionTime / totalSuites : 0
  
  const totalCoverage = testSuites.reduce((sum, suite) => sum + suite.coverage, 0)
  const averageCoverage = totalSuites > 0 ? totalCoverage / totalSuites : 0

  return {
    totalSuites,
    totalTests,
    passedTests,
    failedTests,
    skippedTests,
    passRate,
    averageExecutionTime,
    averageCoverage
  }
}

/**
 * Generate performance insights from test results
 */
export function generatePerformanceInsights(results: TestResult[]): {
  slowestTests: Array<{ testName: string; duration: number }>
  performanceIssues: string[]
  recommendations: string[]
} {
  const performanceResults = results.filter(result => result.performance)
  const slowestTests = performanceResults
    .sort((a, b) => (b.performance?.responseTime || 0) - (a.performance?.responseTime || 0))
    .slice(0, 10)
    .map(result => ({
      testName: result.testName,
      duration: result.performance?.responseTime || 0
    }))

  const performanceIssues: string[] = []
  const recommendations: string[] = []

  // Analyze performance metrics
  performanceResults.forEach(result => {
    const perf = result.performance!
    
    if (perf.responseTime > 1000) {
      performanceIssues.push(`Slow response time in ${result.testName}: ${perf.responseTime}ms`)
      recommendations.push(`Optimize ${result.testName} - consider caching or query optimization`)
    }
    
    if (perf.memoryUsage > 100) {
      performanceIssues.push(`High memory usage in ${result.testName}: ${perf.memoryUsage}MB`)
      recommendations.push(`Review memory management in ${result.testName}`)
    }
    
    if (perf.bundleSize > 1000000) {
      performanceIssues.push(`Large bundle size in ${result.testName}: ${perf.bundleSize} bytes`)
      recommendations.push(`Consider code splitting for ${result.testName}`)
    }
  })

  return {
    slowestTests,
    performanceIssues,
    recommendations
  }
}

/**
 * Identify critical test failures and their patterns
 */
export function analyzeCriticalFailures(testSuites: TestSuite[]): {
  criticalFailures: Array<{
    suiteName: string
    testName: string
    errorMessage: string
    frequency: number
  }>
  failurePatterns: string[]
  impactAssessment: {
    affectedComponents: string[]
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    userImpact: string
  }
} {
  const failedResults = testSuites.flatMap(suite => 
    suite.results
      .filter(result => result.status === 'failed')
      .map(result => ({ ...result, suiteName: suite.name, suitePriority: suite.priority }))
  )

  // Group failures by error patterns
  const errorGroups = new Map<string, any[]>()
  failedResults.forEach(failure => {
    const errorKey = failure.errorMessage?.toLowerCase() || 'unknown'
    if (!errorGroups.has(errorKey)) {
      errorGroups.set(errorKey, [])
    }
    errorGroups.get(errorKey)!.push(failure)
  })

  const criticalFailures = Array.from(errorGroups.entries())
    .map(([errorMessage, failures]) => ({
      suiteName: failures[0].suiteName,
      testName: failures[0].testName,
      errorMessage,
      frequency: failures.length
    }))
    .sort((a, b) => b.frequency - a.frequency)

  // Identify patterns
  const failurePatterns: string[] = []
  if (failedResults.some(f => f.errorMessage?.includes('timeout'))) {
    failurePatterns.push('Network timeout issues detected')
  }
  if (failedResults.some(f => f.errorMessage?.includes('authentication'))) {
    failurePatterns.push('Authentication-related failures')
  }
  if (failedResults.some(f => f.errorMessage?.includes('database'))) {
    failurePatterns.push('Database connection issues')
  }

  // Assess impact
  const criticalSuiteFailures = testSuites.filter(suite => 
    suite.priority === 'critical' && suite.status === 'failed'
  )
  
  const riskLevel = criticalSuiteFailures.length > 0 ? 'critical' :
                   failedResults.length > 10 ? 'high' :
                   failedResults.length > 5 ? 'medium' : 'low'

  const affectedComponents = [...new Set(testSuites
    .filter(suite => suite.status === 'failed')
    .map(suite => suite.category)
  )]

  const userImpact = riskLevel === 'critical' ? 
    'Severe impact on user experience and system functionality' :
    riskLevel === 'high' ?
    'Significant impact on specific user workflows' :
    'Minor impact on user experience'

  return {
    criticalFailures,
    failurePatterns,
    impactAssessment: {
      affectedComponents,
      riskLevel,
      userImpact
    }
  }
}

/**
 * Generate quality trends over time
 */
export function calculateQualityTrends(
  historicalReports: QualityReport[],
  timeframe: 'week' | 'month' | 'quarter'
): {
  overallScoreTrend: number[]
  coverageTrend: number[]
  performanceTrend: number[]
  securityTrend: number[]
  accessibilityTrend: number[]
  timestamps: Date[]
  insights: string[]
} {
  const sortedReports = historicalReports.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  
  const overallScoreTrend = sortedReports.map(report => report.overallScore)
  const coverageTrend = sortedReports.map(report => report.testSummary.coverage)
  const performanceTrend = sortedReports.map(report => 
    100 - (report.performance.averageResponseTime / 10) // Normalize to percentage
  )
  const securityTrend = sortedReports.map(report => report.security.securityScore)
  const accessibilityTrend = sortedReports.map(report => report.accessibility.score)
  const timestamps = sortedReports.map(report => report.timestamp)

  // Generate insights
  const insights: string[] = []
  
  if (overallScoreTrend.length >= 2) {
    const latestScore = overallScoreTrend[overallScoreTrend.length - 1]
    const previousScore = overallScoreTrend[overallScoreTrend.length - 2]
    const change = latestScore - previousScore
    
    if (change > 0.5) {
      insights.push(`Quality score improved by ${change.toFixed(1)} points`)
    } else if (change < -0.5) {
      insights.push(`Quality score decreased by ${Math.abs(change).toFixed(1)} points`)
    }
  }

  if (coverageTrend.length >= 2) {
    const latestCoverage = coverageTrend[coverageTrend.length - 1]
    if (latestCoverage < 90) {
      insights.push(`Test coverage below target at ${latestCoverage.toFixed(1)}%`)
    }
  }

  return {
    overallScoreTrend,
    coverageTrend,
    performanceTrend,
    securityTrend,
    accessibilityTrend,
    timestamps,
    insights
  }
}

/**
 * Format test duration for human-readable display
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`
  } else if (milliseconds < 3600000) {
    return `${Math.floor(milliseconds / 60000)}m ${Math.floor((milliseconds % 60000) / 1000)}s`
  } else {
    const hours = Math.floor(milliseconds / 3600000)
    const minutes = Math.floor((milliseconds % 3600000) / 60000)
    return `${hours}h ${minutes}m`
  }
}

/**
 * Calculate test reliability score
 */
export function calculateReliabilityScore(
  testSuites: TestSuite[],
  historicalData?: TestSuite[][]
): {
  score: number
  factors: {
    consistency: number
    flakiness: number
    stability: number
  }
  recommendations: string[]
} {
  const currentPassRate = calculateTestStatistics(testSuites).passRate
  
  // Calculate consistency
  let consistency = currentPassRate
  
  // Calculate flakiness (tests that sometimes pass, sometimes fail)
  let flakiness = 100 // Start with perfect score
  if (historicalData && historicalData.length > 1) {
    const testOutcomes = new Map<string, boolean[]>()
    
    historicalData.forEach(suites => {
      suites.forEach(suite => {
        suite.results.forEach(result => {
          if (!testOutcomes.has(result.testId)) {
            testOutcomes.set(result.testId, [])
          }
          testOutcomes.get(result.testId)!.push(result.status === 'passed')
        })
      })
    })
    
    // Calculate flakiness based on inconsistent results
    let flakyTests = 0
    testOutcomes.forEach(outcomes => {
      const passCount = outcomes.filter(passed => passed).length
      const totalCount = outcomes.length
      if (passCount > 0 && passCount < totalCount) {
        flakyTests++
      }
    })
    
    flakiness = Math.max(0, 100 - (flakyTests / testOutcomes.size) * 100)
  }
  
  // Calculate stability (consistent execution times)
  const executionTimes = testSuites.map(suite => suite.executionTime)
  const avgTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
  const variance = executionTimes.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / executionTimes.length
  const coefficient = Math.sqrt(variance) / avgTime
  const stability = Math.max(0, 100 - coefficient * 100)

  const score = (consistency + flakiness + stability) / 3

  const recommendations: string[] = []
  if (consistency < 90) {
    recommendations.push('Improve test reliability by fixing failing tests')
  }
  if (flakiness < 80) {
    recommendations.push('Address flaky tests that produce inconsistent results')
  }
  if (stability < 80) {
    recommendations.push('Optimize test execution to reduce timing variations')
  }

  return {
    score,
    factors: {
      consistency,
      flakiness,
      stability
    },
    recommendations
  }
}

/**
 * Generate quality improvement recommendations
 */
export function generateQualityRecommendations(
  qualityReport: QualityReport,
  testSuites: TestSuite[]
): {
  priority: 'high' | 'medium' | 'low'
  category: string
  recommendation: string
  impact: string
  effort: 'low' | 'medium' | 'high'
}[] {
  const recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    category: string
    recommendation: string
    impact: string
    effort: 'low' | 'medium' | 'high'
  }> = []

  // Coverage recommendations
  if (qualityReport.testSummary.coverage < 90) {
    recommendations.push({
      priority: 'high',
      category: 'Coverage',
      recommendation: 'Increase test coverage to meet 90% threshold',
      impact: 'Improved code quality and bug detection',
      effort: 'medium'
    })
  }

  // Performance recommendations
  if (qualityReport.performance.averageResponseTime > 200) {
    recommendations.push({
      priority: 'high',
      category: 'Performance',
      recommendation: 'Optimize API response times',
      impact: 'Better user experience and system responsiveness',
      effort: 'high'
    })
  }

  // Security recommendations
  if (qualityReport.security.vulnerabilities > 0) {
    recommendations.push({
      priority: 'high',
      category: 'Security',
      recommendation: 'Address identified security vulnerabilities',
      impact: 'Reduced security risks and compliance issues',
      effort: 'high'
    })
  }

  // Accessibility recommendations
  if (qualityReport.accessibility.violations > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'Accessibility',
      recommendation: 'Fix accessibility violations for WCAG compliance',
      impact: 'Improved accessibility for all users',
      effort: 'medium'
    })
  }

  // Test reliability recommendations
  const failedSuites = testSuites.filter(suite => suite.status === 'failed')
  if (failedSuites.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'Reliability',
      recommendation: 'Fix failing test suites to improve reliability',
      impact: 'More stable and trustworthy test results',
      effort: 'medium'
    })
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}

/**
 * Export test results to different formats
 */
export function exportTestResults(
  testSuites: TestSuite[],
  format: 'json' | 'csv' | 'xml'
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(testSuites, null, 2)
    
    case 'csv':
      const csvHeaders = 'Suite Name,Test Name,Status,Duration,Category,Priority\n'
      const csvRows = testSuites.flatMap(suite =>
        suite.results.map(result =>
          `"${suite.name}","${result.testName}","${result.status}",${result.duration},"${suite.category}","${suite.priority}"`
        )
      ).join('\n')
      return csvHeaders + csvRows
    
    case 'xml':
      const xmlContent = testSuites.map(suite => {
        const testCases = suite.results.map(result =>
          `    <testcase name="${result.testName}" status="${result.status}" time="${result.duration / 1000}" />`
        ).join('\n')
        
        return `  <testsuite name="${suite.name}" tests="${suite.results.length}" time="${suite.executionTime / 1000}">\n${testCases}\n  </testsuite>`
      }).join('\n')
      
      return `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n${xmlContent}\n</testsuites>`
    
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

/**
 * Validate test result data integrity
 */
export function validateTestResults(testSuites: TestSuite[]): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  testSuites.forEach((suite, suiteIndex) => {
    // Validate suite structure
    if (!suite.id || !suite.name) {
      errors.push(`Suite ${suiteIndex}: Missing required fields (id or name)`)
    }

    if (!['unit', 'integration', 'e2e', 'performance', 'security', 'accessibility'].includes(suite.category)) {
      errors.push(`Suite ${suite.name}: Invalid category "${suite.category}"`)
    }

    if (suite.coverage < 0 || suite.coverage > 100) {
      errors.push(`Suite ${suite.name}: Invalid coverage value ${suite.coverage}`)
    }

    // Validate test results
    suite.results.forEach((result, resultIndex) => {
      if (!result.testId || !result.testName) {
        errors.push(`Suite ${suite.name}, Test ${resultIndex}: Missing required fields`)
      }

      if (!['passed', 'failed', 'skipped'].includes(result.status)) {
        errors.push(`Suite ${suite.name}, Test ${result.testName}: Invalid status "${result.status}"`)
      }

      if (result.duration < 0) {
        errors.push(`Suite ${suite.name}, Test ${result.testName}: Invalid duration ${result.duration}`)
      }

      // Warnings
      if (result.duration > 10000) {
        warnings.push(`Suite ${suite.name}, Test ${result.testName}: Long execution time (${result.duration}ms)`)
      }
    })

    // Performance validation
    if (suite.executionTime > 300000) { // 5 minutes
      warnings.push(`Suite ${suite.name}: Very long execution time (${formatDuration(suite.executionTime)})`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}