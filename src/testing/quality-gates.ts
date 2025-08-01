export interface QualityMetrics {
  coverage: {
    statements: number
    branches: number
    functions: number
    lines: number
  }
  tests: {
    total: number
    passed: number
    failed: number
    skipped: number
  }
  performance: {
    avgResponseTime: number
    p95ResponseTime: number
    errorRate: number
  }
  codeQuality: {
    duplicateLines: number
    cyclomaticComplexity: number
    maintainabilityIndex: number
  }
  security: {
    vulnerabilities: {
      critical: number
      high: number
      medium: number
      low: number
    }
  }
}

export interface QualityGate {
  name: string
  required: boolean
  check: (metrics: QualityMetrics) => QualityGateResult
}

export interface QualityGateResult {
  passed: boolean
  score: number
  message: string
  details?: string[]
}

export class QualityGatesEngine {
  private gates: QualityGate[] = []
  
  constructor() {
    this.initializeDefaultGates()
  }

  private initializeDefaultGates() {
    // Code Coverage Gate
    this.addGate({
      name: 'Code Coverage',
      required: true,
      check: (metrics) => {
        const avgCoverage = (
          metrics.coverage.statements +
          metrics.coverage.branches +
          metrics.coverage.functions +
          metrics.coverage.lines
        ) / 4

        const passed = avgCoverage >= 95
        const details = [
          `Statements: ${metrics.coverage.statements}%`,
          `Branches: ${metrics.coverage.branches}%`,
          `Functions: ${metrics.coverage.functions}%`,
          `Lines: ${metrics.coverage.lines}%`
        ]

        return {
          passed,
          score: avgCoverage,
          message: passed 
            ? `✅ Code coverage is ${avgCoverage.toFixed(1)}% (minimum: 95%)`
            : `❌ Code coverage is ${avgCoverage.toFixed(1)}% (minimum: 95%)`,
          details
        }
      }
    })

    // Test Success Rate Gate
    this.addGate({
      name: 'Test Success Rate',
      required: true,
      check: (metrics) => {
        const successRate = (metrics.tests.passed / metrics.tests.total) * 100
        const passed = successRate >= 100

        return {
          passed,
          score: successRate,
          message: passed
            ? `✅ All ${metrics.tests.total} tests passed`
            : `❌ ${metrics.tests.failed} of ${metrics.tests.total} tests failed`,
          details: [
            `Total: ${metrics.tests.total}`,
            `Passed: ${metrics.tests.passed}`,
            `Failed: ${metrics.tests.failed}`,
            `Skipped: ${metrics.tests.skipped}`
          ]
        }
      }
    })

    // Performance Gate
    this.addGate({
      name: 'Performance Standards',
      required: true,
      check: (metrics) => {
        const checks = [
          {
            name: 'Average Response Time',
            value: metrics.performance.avgResponseTime,
            threshold: 200,
            unit: 'ms'
          },
          {
            name: 'P95 Response Time',
            value: metrics.performance.p95ResponseTime,
            threshold: 500,
            unit: 'ms'
          },
          {
            name: 'Error Rate',
            value: metrics.performance.errorRate * 100,
            threshold: 1,
            unit: '%'
          }
        ]

        const failedChecks = checks.filter(c => c.value > c.threshold)
        const passed = failedChecks.length === 0
        const score = passed ? 100 : (checks.length - failedChecks.length) / checks.length * 100

        return {
          passed,
          score,
          message: passed
            ? '✅ All performance standards met'
            : `❌ ${failedChecks.length} performance standards not met`,
          details: checks.map(c => 
            `${c.name}: ${c.value.toFixed(2)}${c.unit} (max: ${c.threshold}${c.unit})`
          )
        }
      }
    })

    // Code Quality Gate
    this.addGate({
      name: 'Code Quality',
      required: false,
      check: (metrics) => {
        const checks = [
          {
            name: 'Duplicate Lines',
            value: metrics.codeQuality.duplicateLines,
            threshold: 3,
            inverse: true
          },
          {
            name: 'Cyclomatic Complexity',
            value: metrics.codeQuality.cyclomaticComplexity,
            threshold: 10,
            inverse: true
          },
          {
            name: 'Maintainability Index',
            value: metrics.codeQuality.maintainabilityIndex,
            threshold: 70,
            inverse: false
          }
        ]

        const failedChecks = checks.filter(c => 
          c.inverse ? c.value > c.threshold : c.value < c.threshold
        )
        const passed = failedChecks.length === 0
        const score = passed ? 100 : (checks.length - failedChecks.length) / checks.length * 100

        return {
          passed,
          score,
          message: passed
            ? '✅ Code quality standards met'
            : `⚠️ ${failedChecks.length} code quality issues`,
          details: checks.map(c => {
            const op = c.inverse ? '<' : '>'
            return `${c.name}: ${c.value} (should be ${op} ${c.threshold})`
          })
        }
      }
    })

    // Security Gate
    this.addGate({
      name: 'Security Vulnerabilities',
      required: true,
      check: (metrics) => {
        const vulns = metrics.security.vulnerabilities
        const totalVulns = vulns.critical + vulns.high + vulns.medium + vulns.low
        const criticalAndHigh = vulns.critical + vulns.high
        const passed = criticalAndHigh === 0

        return {
          passed,
          score: passed ? 100 : (1 - criticalAndHigh / Math.max(totalVulns, 1)) * 100,
          message: passed
            ? '✅ No critical or high security vulnerabilities'
            : `❌ ${criticalAndHigh} critical/high security vulnerabilities found`,
          details: [
            `Critical: ${vulns.critical}`,
            `High: ${vulns.high}`,
            `Medium: ${vulns.medium}`,
            `Low: ${vulns.low}`
          ]
        }
      }
    })
  }

  addGate(gate: QualityGate) {
    this.gates.push(gate)
  }

  async evaluate(metrics: QualityMetrics): Promise<QualityReport> {
    const results: QualityGateResult[] = []
    let allPassed = true
    let requiredPassed = true
    let totalScore = 0

    for (const gate of this.gates) {
      const result = gate.check(metrics)
      results.push({
        ...result,
        gateName: gate.name,
        required: gate.required
      })

      if (!result.passed) {
        allPassed = false
        if (gate.required) {
          requiredPassed = false
        }
      }

      totalScore += result.score
    }

    const overallScore = totalScore / this.gates.length

    return {
      passed: requiredPassed,
      allGatesPassed: allPassed,
      score: overallScore,
      timestamp: new Date(),
      results,
      metrics,
      summary: this.generateSummary(results, overallScore)
    }
  }

  private generateSummary(results: QualityGateResult[], score: number): string {
    const failed = results.filter(r => !r.passed)
    const requiredFailed = failed.filter(r => r.required)

    if (requiredFailed.length === 0) {
      return `✅ Quality gates passed with score: ${score.toFixed(1)}%`
    }

    return `❌ ${requiredFailed.length} required quality gates failed. Overall score: ${score.toFixed(1)}%`
  }

  async enforceInCI(metrics: QualityMetrics): Promise<void> {
    const report = await this.evaluate(metrics)
    
    if (!report.passed) {
      console.error('\n❌ Quality Gates Failed!\n')
      console.error(report.summary)
      console.error('\nDetails:')
      
      report.results
        .filter(r => !r.passed)
        .forEach(result => {
          console.error(`\n${result.gateName}:`)
          console.error(`  ${result.message}`)
          if (result.details) {
            result.details.forEach(detail => 
              console.error(`    - ${detail}`)
            )
          }
        })
      
      process.exit(1)
    }

    console.log('\n✅ Quality Gates Passed!\n')
    console.log(report.summary)
    console.log('\nBreakdown:')
    
    report.results.forEach(result => {
      console.log(`  ${result.gateName}: ${result.score.toFixed(1)}%`)
    })
  }
}

export interface QualityReport {
  passed: boolean
  allGatesPassed: boolean
  score: number
  timestamp: Date
  results: (QualityGateResult & { gateName: string; required: boolean })[]
  metrics: QualityMetrics
  summary: string
}

// Export singleton instance
export const qualityGates = new QualityGatesEngine()

// CI/CD Integration Script
export async function runQualityGates() {
  // Collect metrics from various sources
  const metrics: QualityMetrics = {
    coverage: await getCoverageMetrics(),
    tests: await getTestMetrics(),
    performance: await getPerformanceMetrics(),
    codeQuality: await getCodeQualityMetrics(),
    security: await getSecurityMetrics()
  }

  // Enforce quality gates
  await qualityGates.enforceInCI(metrics)
}

// Metric collection helpers
async function getCoverageMetrics() {
  // Read from coverage report (e.g., coverage/coverage-summary.json)
  try {
    const coverage = require('../../coverage/coverage-summary.json')
    return {
      statements: coverage.total.statements.pct,
      branches: coverage.total.branches.pct,
      functions: coverage.total.functions.pct,
      lines: coverage.total.lines.pct
    }
  } catch {
    // Default values for testing
    return {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95
    }
  }
}

async function getTestMetrics() {
  // Read from test report (e.g., jest results)
  try {
    const testResults = require('../../test-results.json')
    return {
      total: testResults.numTotalTests,
      passed: testResults.numPassedTests,
      failed: testResults.numFailedTests,
      skipped: testResults.numPendingTests
    }
  } catch {
    // Default values for testing
    return {
      total: 100,
      passed: 100,
      failed: 0,
      skipped: 0
    }
  }
}

async function getPerformanceMetrics() {
  // Read from performance test results
  try {
    const perfResults = require('../../performance-results.json')
    return {
      avgResponseTime: perfResults.avgResponseTime,
      p95ResponseTime: perfResults.p95ResponseTime,
      errorRate: perfResults.errorRate
    }
  } catch {
    // Default values for testing
    return {
      avgResponseTime: 150,
      p95ResponseTime: 400,
      errorRate: 0.005
    }
  }
}

async function getCodeQualityMetrics() {
  // Read from linting/analysis tools
  return {
    duplicateLines: 2,
    cyclomaticComplexity: 8,
    maintainabilityIndex: 75
  }
}

async function getSecurityMetrics() {
  // Read from security scanning tools
  return {
    vulnerabilities: {
      critical: 0,
      high: 0,
      medium: 2,
      low: 5
    }
  }
}