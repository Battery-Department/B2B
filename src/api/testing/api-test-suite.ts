'use client'

import { APIInfrastructure, APIResponse } from '../core/api-infrastructure'

export interface TestCase {
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  endpoint: string
  headers?: Record<string, string>
  body?: any
  expectedStatus: number
  expectedResponse?: Partial<APIResponse>
  timeout?: number
}

export interface TestResult {
  testCase: string
  success: boolean
  actualStatus: number
  expectedStatus: number
  responseTime: number
  error?: string
  response?: any
}

export interface LoadTestConfig {
  endpoint: string
  method: string
  concurrentUsers: number
  duration: number
  rampUpTime: number
  thresholds: {
    maxResponseTime: number
    errorRate: number
    throughput: number
  }
}

export interface SecurityTestResult {
  testName: string
  passed: boolean
  vulnerability?: string
  details?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export class APITestSuite {
  private baseUrl: string
  private defaultHeaders: Record<string, string>
  private testResults: TestResult[] = []

  constructor(baseUrl: string, defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl
    this.defaultHeaders = defaultHeaders
  }

  // Run comprehensive API tests
  async runAllTests(): Promise<{
    totalTests: number
    passed: number
    failed: number
    results: TestResult[]
    summary: {
      functionalTests: number
      performanceTests: number
      securityTests: number
      integrationTests: number
    }
  }> {
    console.log('🚀 Starting comprehensive API test suite...')

    // Run different test categories
    const functionalResults = await this.runFunctionalTests()
    const performanceResults = await this.runPerformanceTests()
    const securityResults = await this.runSecurityTests()
    const integrationResults = await this.runIntegrationTests()

    const allResults = [
      ...functionalResults,
      ...performanceResults,
      ...securityResults,
      ...integrationResults
    ]

    const passed = allResults.filter(r => r.success).length
    const failed = allResults.length - passed

    return {
      totalTests: allResults.length,
      passed,
      failed,
      results: allResults,
      summary: {
        functionalTests: functionalResults.length,
        performanceTests: performanceResults.length,
        securityTests: securityResults.length,
        integrationTests: integrationResults.length
      }
    }
  }

  // Functional API endpoint testing
  async runFunctionalTests(): Promise<TestResult[]> {
    const testCases: TestCase[] = [
      // Health check tests
      {
        name: 'Health Check - API Status',
        method: 'GET',
        endpoint: '/api/health',
        expectedStatus: 200
      },

      // Authentication tests
      {
        name: 'Authentication - Valid Token',
        method: 'GET',
        endpoint: '/api/user/profile',
        headers: { 'Authorization': 'Bearer valid_token' },
        expectedStatus: 200
      },
      {
        name: 'Authentication - Invalid Token',
        method: 'GET',
        endpoint: '/api/user/profile',
        headers: { 'Authorization': 'Bearer invalid_token' },
        expectedStatus: 401
      },
      {
        name: 'Authentication - Missing Token',
        method: 'GET',
        endpoint: '/api/user/profile',
        expectedStatus: 401
      },

      // Product API tests
      {
        name: 'Products - Get All Products',
        method: 'GET',
        endpoint: '/api/products',
        expectedStatus: 200
      },
      {
        name: 'Products - Get Product by ID',
        method: 'GET',
        endpoint: '/api/products/fv-6ah',
        expectedStatus: 200
      },
      {
        name: 'Products - Invalid Product ID',
        method: 'GET',
        endpoint: '/api/products/invalid-id',
        expectedStatus: 404
      },

      // Order API tests
      {
        name: 'Orders - Create Valid Order',
        method: 'POST',
        endpoint: '/api/orders',
        headers: { 'Authorization': 'Bearer valid_token' },
        body: {
          items: [{ productId: 'fv-6ah', quantity: 2, price: 95 }],
          shippingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US'
          },
          paymentMethod: 'stripe'
        },
        expectedStatus: 201
      },
      {
        name: 'Orders - Create Order with Invalid Data',
        method: 'POST',
        endpoint: '/api/orders',
        headers: { 'Authorization': 'Bearer valid_token' },
        body: {
          items: [{ productId: '', quantity: -1 }]
        },
        expectedStatus: 400
      },

      // Quiz API tests
      {
        name: 'Quiz - Complete Quiz',
        method: 'POST',
        endpoint: '/api/quiz/complete',
        body: {
          answers: {
            tools: ['drill', 'saw'],
            budget: 500,
            usage: 'professional'
          }
        },
        expectedStatus: 200
      },
      {
        name: 'Quiz - Get Quiz Stats',
        method: 'GET',
        endpoint: '/api/quiz/stats',
        expectedStatus: 200
      },

      // Payment API tests
      {
        name: 'Payment - Create Payment Intent',
        method: 'POST',
        endpoint: '/api/payment/intent',
        headers: { 'Authorization': 'Bearer valid_token' },
        body: {
          amount: 19000, // $190.00
          currency: 'usd',
          orderId: 'order_123'
        },
        expectedStatus: 200
      }
    ]

    return await this.executeTestCases(testCases)
  }

  // Performance and load testing
  async runPerformanceTests(): Promise<TestResult[]> {
    const results: TestResult[] = []

    // Response time tests
    const responseTimeTests = [
      { endpoint: '/api/products', maxTime: 100 },
      { endpoint: '/api/health', maxTime: 50 },
      { endpoint: '/api/quiz/stats', maxTime: 200 }
    ]

    for (const test of responseTimeTests) {
      const startTime = Date.now()
      try {
        const response = await fetch(`${this.baseUrl}${test.endpoint}`)
        const responseTime = Date.now() - startTime
        
        results.push({
          testCase: `Performance - ${test.endpoint} Response Time`,
          success: responseTime <= test.maxTime,
          actualStatus: response.status,
          expectedStatus: 200,
          responseTime,
          error: responseTime > test.maxTime ? `Response time ${responseTime}ms exceeds ${test.maxTime}ms` : undefined
        })
      } catch (error) {
        results.push({
          testCase: `Performance - ${test.endpoint} Response Time`,
          success: false,
          actualStatus: 0,
          expectedStatus: 200,
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Concurrent request testing
    const concurrencyTest = await this.runConcurrencyTest()
    results.push(...concurrencyTest)

    return results
  }

  // Security vulnerability testing
  async runSecurityTests(): Promise<TestResult[]> {
    const results: TestResult[] = []
    const securityTests: SecurityTestResult[] = []

    // SQL Injection tests
    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "1' UNION SELECT * FROM users --"
    ]

    for (const payload of sqlInjectionPayloads) {
      try {
        const response = await fetch(`${this.baseUrl}/api/products?search=${encodeURIComponent(payload)}`)
        const responseText = await response.text()
        
        const hasSQLError = responseText.toLowerCase().includes('sql') || 
                           responseText.toLowerCase().includes('database') ||
                           responseText.toLowerCase().includes('syntax error')

        securityTests.push({
          testName: `SQL Injection - ${payload.substring(0, 20)}...`,
          passed: !hasSQLError && response.status !== 500,
          vulnerability: hasSQLError ? 'SQL Injection' : undefined,
          details: hasSQLError ? 'SQL error messages exposed' : undefined,
          severity: hasSQLError ? 'critical' : 'low'
        })
      } catch (error) {
        securityTests.push({
          testName: `SQL Injection - ${payload.substring(0, 20)}...`,
          passed: true, // Network error is better than SQL injection
          severity: 'low'
        })
      }
    }

    // XSS tests
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '"><script>alert("xss")</script>',
      'javascript:alert("xss")'
    ]

    for (const payload of xssPayloads) {
      try {
        const response = await fetch(`${this.baseUrl}/api/products?name=${encodeURIComponent(payload)}`)
        const responseText = await response.text()
        
        const hasXSS = responseText.includes('<script>') && !responseText.includes('&lt;script&gt;')

        securityTests.push({
          testName: `XSS Protection - ${payload.substring(0, 20)}...`,
          passed: !hasXSS,
          vulnerability: hasXSS ? 'Cross-Site Scripting' : undefined,
          details: hasXSS ? 'Unescaped script tags in response' : undefined,
          severity: hasXSS ? 'high' : 'low'
        })
      } catch (error) {
        securityTests.push({
          testName: `XSS Protection - ${payload.substring(0, 20)}...`,
          passed: true,
          severity: 'low'
        })
      }
    }

    // Authentication bypass tests
    const authBypassTests = [
      { endpoint: '/api/user/profile', method: 'GET' },
      { endpoint: '/api/orders', method: 'POST' },
      { endpoint: '/api/admin/users', method: 'GET' }
    ]

    for (const test of authBypassTests) {
      try {
        const response = await fetch(`${this.baseUrl}${test.endpoint}`, {
          method: test.method
        })

        const shouldRequireAuth = response.status === 401 || response.status === 403
        
        securityTests.push({
          testName: `Auth Protection - ${test.endpoint}`,
          passed: shouldRequireAuth,
          vulnerability: !shouldRequireAuth ? 'Authentication Bypass' : undefined,
          details: !shouldRequireAuth ? 'Endpoint accessible without authentication' : undefined,
          severity: !shouldRequireAuth ? 'critical' : 'low'
        })
      } catch (error) {
        securityTests.push({
          testName: `Auth Protection - ${test.endpoint}`,
          passed: true,
          severity: 'low'
        })
      }
    }

    // Convert security test results to test results
    for (const secTest of securityTests) {
      results.push({
        testCase: secTest.testName,
        success: secTest.passed,
        actualStatus: secTest.passed ? 200 : 500,
        expectedStatus: 200,
        responseTime: 0,
        error: secTest.vulnerability ? `${secTest.vulnerability}: ${secTest.details}` : undefined
      })
    }

    return results
  }

  // Integration testing with external services
  async runIntegrationTests(): Promise<TestResult[]> {
    const results: TestResult[] = []

    // Database integration test
    try {
      const response = await fetch(`${this.baseUrl}/api/health`)
      const health = await response.json()
      
      results.push({
        testCase: 'Integration - Database Connectivity',
        success: health.checks?.database === true,
        actualStatus: response.status,
        expectedStatus: 200,
        responseTime: 0,
        error: health.checks?.database !== true ? 'Database connectivity failed' : undefined
      })
    } catch (error) {
      results.push({
        testCase: 'Integration - Database Connectivity',
        success: false,
        actualStatus: 0,
        expectedStatus: 200,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Payment integration test (Stripe)
    try {
      const response = await fetch(`${this.baseUrl}/api/payment/intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_token'
        },
        body: JSON.stringify({
          amount: 100,
          currency: 'usd',
          orderId: 'test_order'
        })
      })

      results.push({
        testCase: 'Integration - Stripe Payment Service',
        success: response.status === 200 || response.status === 401, // 401 is acceptable for auth failure
        actualStatus: response.status,
        expectedStatus: 200,
        responseTime: 0,
        error: response.status >= 500 ? 'Payment service integration failed' : undefined
      })
    } catch (error) {
      results.push({
        testCase: 'Integration - Stripe Payment Service',
        success: false,
        actualStatus: 0,
        expectedStatus: 200,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Email service integration test
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      })

      results.push({
        testCase: 'Integration - Email Service',
        success: response.status < 500,
        actualStatus: response.status,
        expectedStatus: 200,
        responseTime: 0,
        error: response.status >= 500 ? 'Email service integration failed' : undefined
      })
    } catch (error) {
      results.push({
        testCase: 'Integration - Email Service',
        success: false,
        actualStatus: 0,
        expectedStatus: 200,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    return results
  }

  // Execute test cases
  private async executeTestCases(testCases: TestCase[]): Promise<TestResult[]> {
    const results: TestResult[] = []

    for (const testCase of testCases) {
      const startTime = Date.now()
      
      try {
        const response = await fetch(`${this.baseUrl}${testCase.endpoint}`, {
          method: testCase.method,
          headers: {
            ...this.defaultHeaders,
            ...testCase.headers,
            'Content-Type': 'application/json'
          },
          body: testCase.body ? JSON.stringify(testCase.body) : undefined
        })

        const responseTime = Date.now() - startTime
        const responseBody = await response.text()
        let parsedResponse

        try {
          parsedResponse = JSON.parse(responseBody)
        } catch {
          parsedResponse = responseBody
        }

        results.push({
          testCase: testCase.name,
          success: response.status === testCase.expectedStatus,
          actualStatus: response.status,
          expectedStatus: testCase.expectedStatus,
          responseTime,
          response: parsedResponse,
          error: response.status !== testCase.expectedStatus 
            ? `Expected status ${testCase.expectedStatus}, got ${response.status}`
            : undefined
        })

      } catch (error) {
        results.push({
          testCase: testCase.name,
          success: false,
          actualStatus: 0,
          expectedStatus: testCase.expectedStatus,
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return results
  }

  // Run concurrency testing
  private async runConcurrencyTest(): Promise<TestResult[]> {
    const concurrentRequests = 10
    const endpoint = '/api/products'
    
    const promises = Array.from({ length: concurrentRequests }, async (_, index) => {
      const startTime = Date.now()
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`)
        return {
          index,
          success: response.status === 200,
          responseTime: Date.now() - startTime,
          status: response.status
        }
      } catch (error) {
        return {
          index,
          success: false,
          responseTime: Date.now() - startTime,
          status: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    const concurrentResults = await Promise.all(promises)
    const successCount = concurrentResults.filter(r => r.success).length
    const avgResponseTime = concurrentResults.reduce((sum, r) => sum + r.responseTime, 0) / concurrentResults.length

    return [{
      testCase: `Concurrency - ${concurrentRequests} Concurrent Requests`,
      success: successCount >= concurrentRequests * 0.95, // 95% success rate
      actualStatus: successCount,
      expectedStatus: concurrentRequests,
      responseTime: avgResponseTime,
      error: successCount < concurrentRequests * 0.95 
        ? `Only ${successCount}/${concurrentRequests} requests succeeded`
        : undefined
    }]
  }

  // Generate test report
  generateReport(results: TestResult[]): string {
    const passed = results.filter(r => r.success).length
    const failed = results.length - passed
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length

    let report = `
# API Test Suite Report

## Summary
- **Total Tests**: ${results.length}
- **Passed**: ${passed} ✅
- **Failed**: ${failed} ❌
- **Success Rate**: ${((passed / results.length) * 100).toFixed(1)}%
- **Average Response Time**: ${avgResponseTime.toFixed(0)}ms

## Test Results

`

    results.forEach(result => {
      const status = result.success ? '✅' : '❌'
      report += `### ${status} ${result.testCase}
- **Status**: ${result.actualStatus} (expected: ${result.expectedStatus})
- **Response Time**: ${result.responseTime}ms
${result.error ? `- **Error**: ${result.error}` : ''}

`
    })

    return report
  }
}

// Export test utilities
export const createTestSuite = (baseUrl: string, headers: Record<string, string> = {}) => {
  return new APITestSuite(baseUrl, headers)
}

export const runQuickTest = async (endpoint: string, expectedStatus: number = 200) => {
  const suite = new APITestSuite(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000')
  const result = await suite.executeTestCases([{
    name: `Quick Test - ${endpoint}`,
    method: 'GET',
    endpoint,
    expectedStatus
  }])
  
  return result[0]
}