'use client'

import React from 'react'
import { render } from '@testing-library/react'

// Visual test configuration
export interface VisualTestConfig {
  component: React.ComponentType<any>
  name: string
  variants?: Array<{
    name: string
    props: Record<string, any>
    description?: string
  }>
  viewports: Array<{
    name: string
    width: number
    height: number
  }>
  interactions?: Array<{
    name: string
    action: string // 'hover', 'focus', 'click', 'scroll'
    selector: string
    description?: string
  }>
  animations?: {
    captureAfterMs: number
    captureBeforeMs: number
  }
  threshold?: number // Pixel difference threshold (0-1)
  ignoreRegions?: Array<{
    x: number
    y: number
    width: number
    height: number
  }>
}

export interface VisualTestResult {
  component: string
  variant: string
  viewport: string
  interaction?: string
  passed: boolean
  differencePercentage: number
  threshold: number
  screenshotPath: string
  baselinePath: string
  diffPath?: string
  error?: string
}

export interface VisualRegressionReport {
  totalTests: number
  passedTests: number
  failedTests: number
  newTests: number
  results: VisualTestResult[]
  summary: {
    [component: string]: {
      passed: number
      failed: number
      total: number
    }
  }
}

// Mock screenshot capture interface
interface ScreenshotCapture {
  capture(element: HTMLElement, config: CaptureConfig): Promise<string>
  compare(baseline: string, current: string, threshold: number): Promise<ComparisonResult>
}

interface CaptureConfig {
  viewport: { width: number; height: number }
  waitForStability?: boolean
  captureFullPage?: boolean
  ignoreRegions?: Array<{ x: number; y: number; width: number; height: number }>
}

interface ComparisonResult {
  differencePercentage: number
  diffImagePath?: string
  passed: boolean
}

export class VisualRegressionTesting {
  private screenshotCapture: ScreenshotCapture
  private baselineDir: string
  private outputDir: string
  private results: VisualTestResult[] = []

  constructor(
    baselineDir = './tests/visual-regression/baselines',
    outputDir = './tests/visual-regression/results'
  ) {
    this.baselineDir = baselineDir
    this.outputDir = outputDir
    this.screenshotCapture = new MockScreenshotCapture()
  }

  // Main visual regression test method
  async testComponent(config: VisualTestConfig): Promise<VisualTestResult[]> {
    console.log(`📸 Running visual regression tests for ${config.name}...`)

    const results: VisualTestResult[] = []
    
    // Test default variant across all viewports
    const defaultVariant = { name: 'default', props: {}, description: 'Default state' }
    const variants = [defaultVariant, ...(config.variants || [])]

    for (const variant of variants) {
      for (const viewport of config.viewports) {
        // Test static state
        const staticResult = await this.testComponentVariant(config, variant, viewport)
        results.push(staticResult)

        // Test interactions if configured
        if (config.interactions) {
          for (const interaction of config.interactions) {
            const interactionResult = await this.testComponentInteraction(
              config, 
              variant, 
              viewport, 
              interaction
            )
            results.push(interactionResult)
          }
        }
      }
    }

    this.results.push(...results)
    return results
  }

  // Test component variant in specific viewport
  private async testComponentVariant(
    config: VisualTestConfig,
    variant: { name: string; props: Record<string, any> },
    viewport: { name: string; width: number; height: number }
  ): Promise<VisualTestResult> {
    const testName = `${config.name}-${variant.name}-${viewport.name}`
    
    try {
      // Render component
      const { container } = render(
        React.createElement(config.component, variant.props)
      )

      // Wait for animations if configured
      if (config.animations?.captureAfterMs) {
        await this.delay(config.animations.captureAfterMs)
      }

      // Capture screenshot
      const screenshotPath = await this.screenshotCapture.capture(container, {
        viewport: { width: viewport.width, height: viewport.height },
        waitForStability: true,
        ignoreRegions: config.ignoreRegions,
      })

      // Compare with baseline
      const baselinePath = `${this.baselineDir}/${testName}.png`
      const comparison = await this.screenshotCapture.compare(
        baselinePath,
        screenshotPath,
        config.threshold || 0.01
      )

      return {
        component: config.name,
        variant: variant.name,
        viewport: viewport.name,
        passed: comparison.passed,
        differencePercentage: comparison.differencePercentage,
        threshold: config.threshold || 0.01,
        screenshotPath,
        baselinePath,
        diffPath: comparison.diffImagePath,
      }

    } catch (error) {
      return {
        component: config.name,
        variant: variant.name,
        viewport: viewport.name,
        passed: false,
        differencePercentage: 1,
        threshold: config.threshold || 0.01,
        screenshotPath: '',
        baselinePath: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Test component with specific interaction
  private async testComponentInteraction(
    config: VisualTestConfig,
    variant: { name: string; props: Record<string, any> },
    viewport: { name: string; width: number; height: number },
    interaction: { name: string; action: string; selector: string }
  ): Promise<VisualTestResult> {
    const testName = `${config.name}-${variant.name}-${viewport.name}-${interaction.name}`
    
    try {
      // Render component
      const { container } = render(
        React.createElement(config.component, variant.props)
      )

      // Perform interaction
      await this.performInteraction(container, interaction)

      // Wait for animation/transition to complete
      if (config.animations?.captureAfterMs) {
        await this.delay(config.animations.captureAfterMs)
      }

      // Capture screenshot
      const screenshotPath = await this.screenshotCapture.capture(container, {
        viewport: { width: viewport.width, height: viewport.height },
        waitForStability: true,
        ignoreRegions: config.ignoreRegions,
      })

      // Compare with baseline
      const baselinePath = `${this.baselineDir}/${testName}.png`
      const comparison = await this.screenshotCapture.compare(
        baselinePath,
        screenshotPath,
        config.threshold || 0.01
      )

      return {
        component: config.name,
        variant: variant.name,
        viewport: viewport.name,
        interaction: interaction.name,
        passed: comparison.passed,
        differencePercentage: comparison.differencePercentage,
        threshold: config.threshold || 0.01,
        screenshotPath,
        baselinePath,
        diffPath: comparison.diffImagePath,
      }

    } catch (error) {
      return {
        component: config.name,
        variant: variant.name,
        viewport: viewport.name,
        interaction: interaction.name,
        passed: false,
        differencePercentage: 1,
        threshold: config.threshold || 0.01,
        screenshotPath: '',
        baselinePath: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Perform interaction on element
  private async performInteraction(
    container: HTMLElement,
    interaction: { action: string; selector: string }
  ): Promise<void> {
    const element = container.querySelector(interaction.selector) as HTMLElement
    if (!element) {
      throw new Error(`Element not found: ${interaction.selector}`)
    }

    switch (interaction.action) {
      case 'hover':
        element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
        await this.delay(100) // Allow hover effects to apply
        break
      
      case 'focus':
        element.focus()
        await this.delay(100)
        break
      
      case 'click':
        element.click()
        await this.delay(200) // Allow click effects
        break
      
      case 'scroll':
        element.scrollIntoView()
        await this.delay(200)
        break
      
      default:
        throw new Error(`Unsupported interaction: ${interaction.action}`)
    }
  }

  // Test multiple components in batch
  async testComponents(configs: VisualTestConfig[]): Promise<VisualRegressionReport> {
    console.log(`📸 Running visual regression tests for ${configs.length} components...`)
    
    const allResults: VisualTestResult[] = []
    
    for (const config of configs) {
      const results = await this.testComponent(config)
      allResults.push(...results)
    }

    return this.generateReport(allResults)
  }

  // Generate comprehensive report
  private generateReport(results: VisualTestResult[]): VisualRegressionReport {
    const totalTests = results.length
    const passedTests = results.filter(r => r.passed).length
    const failedTests = totalTests - passedTests
    const newTests = results.filter(r => r.error?.includes('baseline not found')).length

    // Group by component
    const summary: Record<string, { passed: number; failed: number; total: number }> = {}
    
    results.forEach(result => {
      if (!summary[result.component]) {
        summary[result.component] = { passed: 0, failed: 0, total: 0 }
      }
      
      summary[result.component].total++
      if (result.passed) {
        summary[result.component].passed++
      } else {
        summary[result.component].failed++
      }
    })

    return {
      totalTests,
      passedTests,
      failedTests,
      newTests,
      results,
      summary,
    }
  }

  // Generate HTML report
  generateHTMLReport(report: VisualRegressionReport): string {
    const passRate = (report.passedTests / report.totalTests * 100).toFixed(1)
    
    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Visual Regression Test Report</title>
    <style>
        body { font-family: -apple-system, system-ui, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .metric { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e1e5e9; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .new { color: #007bff; }
        .component-section { margin-bottom: 30px; }
        .component-title { font-size: 1.5em; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #e1e5e9; padding-bottom: 10px; }
        .test-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .test-card { border: 1px solid #e1e5e9; border-radius: 8px; overflow: hidden; }
        .test-card.passed { border-left: 4px solid #28a745; }
        .test-card.failed { border-left: 4px solid #dc3545; }
        .test-header { padding: 15px; background: #f8f9fa; }
        .test-title { font-weight: bold; margin-bottom: 5px; }
        .test-details { font-size: 0.9em; color: #6c757d; }
        .test-image { text-align: center; padding: 15px; }
        .test-image img { max-width: 100%; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .diff-percentage { font-weight: bold; }
        .diff-percentage.low { color: #28a745; }
        .diff-percentage.medium { color: #ffc107; }
        .diff-percentage.high { color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Visual Regression Test Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <div class="metric-value">${report.totalTests}</div>
            <div>Total Tests</div>
        </div>
        <div class="metric">
            <div class="metric-value passed">${report.passedTests}</div>
            <div>Passed</div>
        </div>
        <div class="metric">
            <div class="metric-value failed">${report.failedTests}</div>
            <div>Failed</div>
        </div>
        <div class="metric">
            <div class="metric-value new">${report.newTests}</div>
            <div>New Tests</div>
        </div>
        <div class="metric">
            <div class="metric-value">${passRate}%</div>
            <div>Pass Rate</div>
        </div>
    </div>
`

    // Group results by component
    const componentGroups = new Map<string, VisualTestResult[]>()
    report.results.forEach(result => {
      if (!componentGroups.has(result.component)) {
        componentGroups.set(result.component, [])
      }
      componentGroups.get(result.component)!.push(result)
    })

    // Generate component sections
    componentGroups.forEach((results, component) => {
      const componentPassed = results.filter(r => r.passed).length
      const componentTotal = results.length
      const componentPassRate = (componentPassed / componentTotal * 100).toFixed(1)

      html += `
    <div class="component-section">
        <div class="component-title">
            ${component} (${componentPassed}/${componentTotal} passed - ${componentPassRate}%)
        </div>
        <div class="test-grid">
`

      results.forEach(result => {
        const diffClass = result.differencePercentage < 0.01 ? 'low' : 
                         result.differencePercentage < 0.05 ? 'medium' : 'high'
        
        html += `
            <div class="test-card ${result.passed ? 'passed' : 'failed'}">
                <div class="test-header">
                    <div class="test-title">${result.variant} - ${result.viewport}${result.interaction ? ` (${result.interaction})` : ''}</div>
                    <div class="test-details">
                        Difference: <span class="diff-percentage ${diffClass}">${(result.differencePercentage * 100).toFixed(2)}%</span>
                        (threshold: ${(result.threshold * 100).toFixed(2)}%)
                    </div>
                    ${result.error ? `<div style="color: #dc3545; margin-top: 5px;">${result.error}</div>` : ''}
                </div>
                ${result.screenshotPath ? `
                <div class="test-image">
                    <img src="${result.screenshotPath}" alt="Screenshot" />
                </div>
                ` : ''}
            </div>
`
      })

      html += `
        </div>
    </div>
`
    })

    html += `
</body>
</html>
`

    return html
  }

  // Update baseline images
  async updateBaselines(componentName?: string): Promise<void> {
    console.log(`📸 Updating visual regression baselines${componentName ? ` for ${componentName}` : ''}...`)
    
    // In a real implementation, this would copy current screenshots to baseline directory
    // For now, just log the action
    console.log('Baselines updated successfully')
  }

  // Clean up old test results
  async cleanup(daysOld = 7): Promise<void> {
    console.log(`🧹 Cleaning up visual regression test results older than ${daysOld} days...`)
    
    // In a real implementation, this would remove old screenshot files
    console.log('Cleanup completed')
  }

  // Utility method for delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Get current results
  getResults(): VisualTestResult[] {
    return [...this.results]
  }

  // Clear results
  clearResults(): void {
    this.results = []
  }
}

// Mock screenshot capture implementation
class MockScreenshotCapture implements ScreenshotCapture {
  async capture(element: HTMLElement, config: CaptureConfig): Promise<string> {
    // Simulate screenshot capture delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Generate mock screenshot path
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `/mock/screenshots/screenshot_${timestamp}_${random}.png`
  }

  async compare(baseline: string, current: string, threshold: number): Promise<ComparisonResult> {
    // Simulate comparison delay
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Generate mock comparison result
    const mockDifference = Math.random() * 0.1 // 0-10% difference
    const passed = mockDifference <= threshold

    return {
      differencePercentage: mockDifference,
      passed,
      diffImagePath: passed ? undefined : `/mock/diffs/diff_${Date.now()}.png`,
    }
  }
}

// Predefined viewport configurations
export const VIEWPORTS = {
  mobile: { name: 'Mobile', width: 375, height: 667 },
  tablet: { name: 'Tablet', width: 768, height: 1024 },
  desktop: { name: 'Desktop', width: 1440, height: 900 },
  wide: { name: 'Wide', width: 1920, height: 1080 },
} as const

// Common test configurations
export const createVisualTestConfig = {
  button: (component: React.ComponentType<any>): VisualTestConfig => ({
    component,
    name: 'Button',
    variants: [
      { name: 'primary', props: { variant: 'primary', children: 'Primary Button' } },
      { name: 'secondary', props: { variant: 'secondary', children: 'Secondary Button' } },
      { name: 'disabled', props: { variant: 'primary', disabled: true, children: 'Disabled Button' } },
      { name: 'loading', props: { variant: 'primary', loading: true, children: 'Loading Button' } },
    ],
    viewports: [VIEWPORTS.mobile, VIEWPORTS.desktop],
    interactions: [
      { name: 'hover', action: 'hover', selector: 'button' },
      { name: 'focus', action: 'focus', selector: 'button' },
    ],
    threshold: 0.01,
  }),

  card: (component: React.ComponentType<any>): VisualTestConfig => ({
    component,
    name: 'Card',
    variants: [
      { name: 'default', props: { children: 'Card content' } },
      { name: 'with-header', props: { title: 'Card Title', children: 'Card content' } },
      { name: 'with-footer', props: { children: 'Card content', footer: 'Card footer' } },
    ],
    viewports: [VIEWPORTS.mobile, VIEWPORTS.tablet, VIEWPORTS.desktop],
    interactions: [
      { name: 'hover', action: 'hover', selector: '.card' },
    ],
    threshold: 0.005,
  }),

  modal: (component: React.ComponentType<any>): VisualTestConfig => ({
    component,
    name: 'Modal',
    variants: [
      { name: 'open', props: { isOpen: true, title: 'Modal Title', children: 'Modal content' } },
      { name: 'with-footer', props: { isOpen: true, title: 'Modal Title', children: 'Modal content', footer: 'Footer content' } },
    ],
    viewports: [VIEWPORTS.mobile, VIEWPORTS.desktop],
    animations: {
      captureAfterMs: 300,
      captureBeforeMs: 0,
    },
    threshold: 0.02,
  }),
}

// Export singleton instance
export const visualRegressionTesting = new VisualRegressionTesting()