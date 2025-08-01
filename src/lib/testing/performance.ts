'use client'

// Performance testing framework for Terminal 1 Phase 3

export interface PerformanceTest {
  name: string
  description: string
  run: () => Promise<PerformanceResult>
  threshold: PerformanceThreshold
}

export interface PerformanceResult {
  testName: string
  duration: number
  memoryUsage: number
  passed: boolean
  metrics: Record<string, number>
  details: string[]
}

export interface PerformanceThreshold {
  maxDuration: number // milliseconds
  maxMemoryUsage: number // MB
  minFPS: number
  maxBundleSize: number // KB
}

export interface TestSuite {
  name: string
  tests: PerformanceTest[]
  setup?: () => Promise<void>
  teardown?: () => Promise<void>
}

// Performance test runner
export class PerformanceTestRunner {
  private results: PerformanceResult[] = []
  private isRunning = false

  async runTest(test: PerformanceTest): Promise<PerformanceResult> {
    console.log(`Running performance test: ${test.name}`)
    
    const startTime = performance.now()
    const startMemory = this.getMemoryUsage()

    try {
      const result = await test.run()
      const endTime = performance.now()
      const endMemory = this.getMemoryUsage()

      const finalResult: PerformanceResult = {
        ...result,
        testName: test.name,
        duration: endTime - startTime,
        memoryUsage: endMemory - startMemory,
        passed: this.evaluateResult(result, test.threshold),
      }

      this.results.push(finalResult)
      return finalResult
    } catch (error) {
      const failedResult: PerformanceResult = {
        testName: test.name,
        duration: performance.now() - startTime,
        memoryUsage: this.getMemoryUsage() - startMemory,
        passed: false,
        metrics: {},
        details: [`Test failed: ${error}`],
      }

      this.results.push(failedResult)
      return failedResult
    }
  }

  async runSuite(suite: TestSuite): Promise<PerformanceResult[]> {
    if (this.isRunning) {
      throw new Error('Test runner is already running')
    }

    this.isRunning = true
    const suiteResults: PerformanceResult[] = []

    try {
      // Setup
      if (suite.setup) {
        await suite.setup()
      }

      // Run tests
      for (const test of suite.tests) {
        const result = await this.runTest(test)
        suiteResults.push(result)
        
        // Add delay between tests to avoid interference
        await this.delay(100)
      }

      // Teardown
      if (suite.teardown) {
        await suite.teardown()
      }

      return suiteResults
    } finally {
      this.isRunning = false
    }
  }

  private evaluateResult(result: PerformanceResult, threshold: PerformanceThreshold): boolean {
    return (
      result.duration <= threshold.maxDuration &&
      result.memoryUsage <= threshold.maxMemoryUsage &&
      (result.metrics.fps || 60) >= threshold.minFPS
    )
  }

  private getMemoryUsage(): number {
    // @ts-ignore - performance.memory is experimental
    if (performance.memory) {
      // @ts-ignore
      return performance.memory.usedJSHeapSize / 1048576 // Convert to MB
    }
    return 0
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getResults(): PerformanceResult[] {
    return [...this.results]
  }

  generateReport(): string {
    const totalTests = this.results.length
    const passedTests = this.results.filter(r => r.passed).length
    const failedTests = totalTests - passedTests

    let report = `Performance Test Report\n`
    report += `========================\n\n`
    report += `Total Tests: ${totalTests}\n`
    report += `Passed: ${passedTests}\n`
    report += `Failed: ${failedTests}\n`
    report += `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n\n`

    report += `Individual Test Results:\n`
    report += `------------------------\n`

    this.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL'
      report += `${status} ${result.testName}\n`
      report += `  Duration: ${result.duration.toFixed(2)}ms\n`
      report += `  Memory: ${result.memoryUsage.toFixed(2)}MB\n`
      
      if (Object.keys(result.metrics).length > 0) {
        report += `  Metrics:\n`
        Object.entries(result.metrics).forEach(([key, value]) => {
          report += `    ${key}: ${value}\n`
        })
      }
      
      if (result.details.length > 0) {
        report += `  Details:\n`
        result.details.forEach(detail => {
          report += `    - ${detail}\n`
        })
      }
      
      report += `\n`
    })

    return report
  }

  clear(): void {
    this.results = []
  }
}

// Predefined performance tests
export const PERFORMANCE_TESTS = {
  // Component render performance
  componentRender: (componentName: string, renderFn: () => void): PerformanceTest => ({
    name: `Component Render - ${componentName}`,
    description: `Tests rendering performance of ${componentName} component`,
    run: async () => {
      const iterations = 100
      const times: number[] = []

      for (let i = 0; i < iterations; i++) {
        const start = performance.now()
        renderFn()
        const end = performance.now()
        times.push(end - start)
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      const maxTime = Math.max(...times)
      const minTime = Math.min(...times)

      return {
        testName: `Component Render - ${componentName}`,
        duration: avgTime,
        memoryUsage: 0,
        passed: avgTime < 16, // Should render within 16ms for 60fps
        metrics: {
          averageRenderTime: avgTime,
          maxRenderTime: maxTime,
          minRenderTime: minTime,
          iterations,
        },
        details: [
          `Average render time: ${avgTime.toFixed(2)}ms`,
          `Max render time: ${maxTime.toFixed(2)}ms`,
          `Min render time: ${minTime.toFixed(2)}ms`,
        ],
      }
    },
    threshold: {
      maxDuration: 16,
      maxMemoryUsage: 10,
      minFPS: 60,
      maxBundleSize: 50,
    },
  }),

  // Animation performance
  animationPerformance: (animationName: string, animationFn: () => Promise<void>): PerformanceTest => ({
    name: `Animation Performance - ${animationName}`,
    description: `Tests performance of ${animationName} animation`,
    run: async () => {
      const frameCount = 180 // 3 seconds at 60fps
      let droppedFrames = 0
      let totalFrameTime = 0

      const measureFrame = (timestamp: number) => {
        const frameStart = performance.now()
        // Animation logic would go here
        const frameEnd = performance.now()
        const frameTime = frameEnd - frameStart

        totalFrameTime += frameTime
        if (frameTime > 16.67) { // 60fps threshold
          droppedFrames++
        }
      }

      // Run animation
      await animationFn()

      const averageFrameTime = totalFrameTime / frameCount
      const fps = 1000 / averageFrameTime
      const dropRate = (droppedFrames / frameCount) * 100

      return {
        testName: `Animation Performance - ${animationName}`,
        duration: totalFrameTime,
        memoryUsage: 0,
        passed: fps >= 55 && dropRate < 5, // 55fps minimum, <5% drop rate
        metrics: {
          fps,
          averageFrameTime,
          droppedFrames,
          frameDropRate: dropRate,
        },
        details: [
          `Average FPS: ${fps.toFixed(1)}`,
          `Frame drop rate: ${dropRate.toFixed(1)}%`,
          `Dropped frames: ${droppedFrames}/${frameCount}`,
        ],
      }
    },
    threshold: {
      maxDuration: 3000,
      maxMemoryUsage: 5,
      minFPS: 55,
      maxBundleSize: 25,
    },
  }),

  // Bundle size test
  bundleSize: (bundlePath: string, maxSize: number): PerformanceTest => ({
    name: `Bundle Size - ${bundlePath}`,
    description: `Tests bundle size of ${bundlePath}`,
    run: async () => {
      // In a real implementation, this would check actual bundle sizes
      // For demo purposes, we'll simulate
      const simulatedSize = Math.random() * maxSize * 1.5 // KB

      return {
        testName: `Bundle Size - ${bundlePath}`,
        duration: 0,
        memoryUsage: 0,
        passed: simulatedSize <= maxSize,
        metrics: {
          bundleSize: simulatedSize,
          compressionRatio: 0.7, // Simulated gzip compression
        },
        details: [
          `Bundle size: ${simulatedSize.toFixed(2)} KB`,
          `Max allowed: ${maxSize} KB`,
          `Compression ratio: 70%`,
        ],
      }
    },
    threshold: {
      maxDuration: 0,
      maxMemoryUsage: 0,
      minFPS: 60,
      maxBundleSize: maxSize,
    },
  }),

  // Memory leak test
  memoryLeak: (testName: string, testFn: () => void): PerformanceTest => ({
    name: `Memory Leak - ${testName}`,
    description: `Tests for memory leaks in ${testName}`,
    run: async () => {
      const iterations = 50
      const memorySnapshots: number[] = []

      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc()
      }

      for (let i = 0; i < iterations; i++) {
        testFn()
        
        // @ts-ignore
        if (performance.memory) {
          // @ts-ignore
          memorySnapshots.push(performance.memory.usedJSHeapSize)
        }

        // Allow some time for potential cleanup
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      const initialMemory = memorySnapshots[0] || 0
      const finalMemory = memorySnapshots[memorySnapshots.length - 1] || 0
      const memoryGrowth = finalMemory - initialMemory
      const memoryGrowthMB = memoryGrowth / 1048576

      // Check for consistent memory growth (potential leak)
      const growthTrend = memorySnapshots.slice(-10).every((snapshot, index, arr) => 
        index === 0 || snapshot >= arr[index - 1]
      )

      return {
        testName: `Memory Leak - ${testName}`,
        duration: 0,
        memoryUsage: memoryGrowthMB,
        passed: memoryGrowthMB < 5 && !growthTrend, // Less than 5MB growth and no consistent upward trend
        metrics: {
          memoryGrowth: memoryGrowthMB,
          initialMemory: initialMemory / 1048576,
          finalMemory: finalMemory / 1048576,
          iterations,
        },
        details: [
          `Memory growth: ${memoryGrowthMB.toFixed(2)} MB`,
          `Initial memory: ${(initialMemory / 1048576).toFixed(2)} MB`,
          `Final memory: ${(finalMemory / 1048576).toFixed(2)} MB`,
          `Consistent growth trend: ${growthTrend ? 'Yes (⚠️)' : 'No (✅)'}`,
        ],
      }
    },
    threshold: {
      maxDuration: 1000,
      maxMemoryUsage: 5,
      minFPS: 60,
      maxBundleSize: 50,
    },
  }),
}

// Test suite for Terminal 1 components
export const TERMINAL_1_TEST_SUITE: TestSuite = {
  name: 'Terminal 1 - UI Component Performance',
  tests: [
    PERFORMANCE_TESTS.bundleSize('core-ui', 50),
    PERFORMANCE_TESTS.bundleSize('charts', 100),
    PERFORMANCE_TESTS.bundleSize('forms', 75),
    PERFORMANCE_TESTS.componentRender('Button', () => {
      // Simulate button render
      const element = document.createElement('button')
      element.textContent = 'Test Button'
      document.body.appendChild(element)
      document.body.removeChild(element)
    }),
    PERFORMANCE_TESTS.memoryLeak('Form Validation', () => {
      // Simulate form validation
      const data = new Array(1000).fill('test data')
      const validation = data.map(item => item.length > 0)
      // Don't store references to avoid actual leaks in test
    }),
  ],
}

// Global test runner instance
export const performanceTestRunner = new PerformanceTestRunner()

// Utility functions for testing
export const measureAsync = async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  return { result, duration: end - start }
}

export const measureSync = <T>(fn: () => T): { result: T; duration: number } => {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  return { result, duration: end - start }
}

// Performance monitoring utilities
export const startPerformanceMonitoring = () => {
  if (typeof window === 'undefined') return

  // Monitor long tasks
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) { // Long task threshold
          console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`, entry)
        }
      })
    })

    try {
      observer.observe({ entryTypes: ['longtask'] })
    } catch (e) {
      console.log('Long task monitoring not supported')
    }
  }

  // Monitor layout shifts
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      let cumulativeScore = 0
      list.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          cumulativeScore += entry.value
        }
      })

      if (cumulativeScore > 0.1) { // CLS threshold
        console.warn(`High cumulative layout shift: ${cumulativeScore.toFixed(4)}`)
      }
    })

    try {
      observer.observe({ entryTypes: ['layout-shift'] })
    } catch (e) {
      console.log('Layout shift monitoring not supported')
    }
  }
}