import { Page, Browser, chromium } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

export interface VisualTestConfig {
  baseUrl: string
  screenshotDir: string
  thresholdPercent: number
  viewport: {
    width: number
    height: number
  }
  browsers: string[]
  devices?: string[]
}

export interface VisualTestResult {
  story: string
  browser: string
  device?: string
  passed: boolean
  difference?: number
  diffImagePath?: string
  actualImagePath: string
  expectedImagePath: string
  error?: string
}

export interface StoryTestCase {
  title: string
  name: string
  url: string
  waitForSelector?: string
  actions?: Array<{
    type: 'click' | 'hover' | 'focus' | 'type'
    selector: string
    text?: string
  }>
  hideElements?: string[]
  clip?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export class VisualRegressionTester {
  private config: VisualTestConfig
  private browser?: Browser
  private results: VisualTestResult[] = []

  constructor(config: VisualTestConfig) {
    this.config = config
  }

  async setup(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--disable-web-security', '--disable-dev-shm-usage']
    })
  }

  async teardown(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
    }
  }

  async testStory(testCase: StoryTestCase): Promise<VisualTestResult[]> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call setup() first.')
    }

    const results: VisualTestResult[] = []

    for (const browserName of this.config.browsers) {
      const context = await this.browser.newContext({
        viewport: this.config.viewport
      })

      const page = await context.newPage()

      try {
        // Navigate to story
        await page.goto(`${this.config.baseUrl}${testCase.url}`)

        // Wait for story to load
        if (testCase.waitForSelector) {
          await page.waitForSelector(testCase.waitForSelector)
        } else {
          await page.waitForLoadState('networkidle')
        }

        // Perform actions
        if (testCase.actions) {
          for (const action of testCase.actions) {
            switch (action.type) {
              case 'click':
                await page.click(action.selector)
                break
              case 'hover':
                await page.hover(action.selector)
                break
              case 'focus':
                await page.focus(action.selector)
                break
              case 'type':
                if (action.text) {
                  await page.type(action.selector, action.text)
                }
                break
            }
          }
        }

        // Hide dynamic elements
        if (testCase.hideElements) {
          for (const selector of testCase.hideElements) {
            await page.addStyleTag({
              content: `${selector} { visibility: hidden !important; }`
            })
          }
        }

        // Disable animations
        await page.addStyleTag({
          content: `
            *, *::before, *::after {
              animation-delay: -1ms !important;
              animation-duration: 1ms !important;
              animation-iteration-count: 1 !important;
              background-attachment: initial !important;
              scroll-behavior: auto !important;
              transition-delay: 0s !important;
              transition-duration: 0s !important;
            }
          `
        })

        // Wait for animations to complete
        await page.waitForTimeout(100)

        // Take screenshot
        const actualImagePath = this.getImagePath(testCase, browserName, 'actual')
        await page.screenshot({
          path: actualImagePath,
          clip: testCase.clip
        })

        // Compare with baseline
        const result = await this.compareImages(testCase, browserName, actualImagePath)
        results.push(result)

      } catch (error) {
        results.push({
          story: `${testCase.title}/${testCase.name}`,
          browser: browserName,
          passed: false,
          actualImagePath: '',
          expectedImagePath: '',
          error: error instanceof Error ? error.message : String(error)
        })
      } finally {
        await context.close()
      }
    }

    this.results.push(...results)
    return results
  }

  async testMultipleStories(testCases: StoryTestCase[]): Promise<VisualTestResult[]> {
    const allResults: VisualTestResult[] = []

    for (const testCase of testCases) {
      const results = await this.testStory(testCase)
      allResults.push(...results)
    }

    return allResults
  }

  private async compareImages(
    testCase: StoryTestCase,
    browser: string,
    actualImagePath: string
  ): Promise<VisualTestResult> {
    const expectedImagePath = this.getImagePath(testCase, browser, 'expected')
    const diffImagePath = this.getImagePath(testCase, browser, 'diff')
    const storyName = `${testCase.title}/${testCase.name}`

    // Check if baseline exists
    if (!fs.existsSync(expectedImagePath)) {
      // Create baseline from actual
      fs.copyFileSync(actualImagePath, expectedImagePath)
      return {
        story: storyName,
        browser,
        passed: true,
        actualImagePath,
        expectedImagePath,
        difference: 0
      }
    }

    try {
      const actualImage = PNG.sync.read(fs.readFileSync(actualImagePath))
      const expectedImage = PNG.sync.read(fs.readFileSync(expectedImagePath))

      const { width, height } = actualImage
      const diff = new PNG({ width, height })

      const pixelDifference = pixelmatch(
        expectedImage.data,
        actualImage.data,
        diff.data,
        width,
        height,
        {
          threshold: 0.1,
          includeAA: false
        }
      )

      const totalPixels = width * height
      const differencePercent = (pixelDifference / totalPixels) * 100

      if (differencePercent > this.config.thresholdPercent) {
        // Save diff image
        fs.writeFileSync(diffImagePath, PNG.sync.write(diff))
      }

      return {
        story: storyName,
        browser,
        passed: differencePercent <= this.config.thresholdPercent,
        difference: differencePercent,
        diffImagePath: differencePercent > this.config.thresholdPercent ? diffImagePath : undefined,
        actualImagePath,
        expectedImagePath
      }
    } catch (error) {
      return {
        story: storyName,
        browser,
        passed: false,
        actualImagePath,
        expectedImagePath,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private getImagePath(testCase: StoryTestCase, browser: string, type: 'actual' | 'expected' | 'diff'): string {
    const sanitizedTitle = testCase.title.replace(/[^a-zA-Z0-9]/g, '-')
    const sanitizedName = testCase.name.replace(/[^a-zA-Z0-9]/g, '-')
    const filename = `${sanitizedTitle}--${sanitizedName}--${browser}--${type}.png`
    return path.join(this.config.screenshotDir, filename)
  }

  generateReport(): string {
    const totalTests = this.results.length
    const passedTests = this.results.filter(r => r.passed).length
    const failedTests = totalTests - passedTests

    let report = `Visual Regression Test Report\n`
    report += `=====================================\n\n`
    report += `Total Tests: ${totalTests}\n`
    report += `Passed: ${passedTests}\n`
    report += `Failed: ${failedTests}\n`
    report += `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n\n`

    if (failedTests > 0) {
      report += `Failed Tests:\n`
      report += `=============\n\n`

      this.results.filter(r => !r.passed).forEach(result => {
        report += `Story: ${result.story}\n`
        report += `Browser: ${result.browser}\n`
        if (result.difference !== undefined) {
          report += `Difference: ${result.difference.toFixed(2)}%\n`
        }
        if (result.error) {
          report += `Error: ${result.error}\n`
        }
        if (result.diffImagePath) {
          report += `Diff Image: ${result.diffImagePath}\n`
        }
        report += `Actual: ${result.actualImagePath}\n`
        report += `Expected: ${result.expectedImagePath}\n\n`
      })
    }

    return report
  }

  async updateBaselines(storyFilter?: string): Promise<void> {
    const filteredResults = storyFilter 
      ? this.results.filter(r => r.story.includes(storyFilter))
      : this.results

    for (const result of filteredResults) {
      if (fs.existsSync(result.actualImagePath)) {
        fs.copyFileSync(result.actualImagePath, result.expectedImagePath)
        console.log(`Updated baseline for ${result.story} (${result.browser})`)
      }
    }
  }

  getFailedTests(): VisualTestResult[] {
    return this.results.filter(r => !r.passed)
  }

  exportResults(format: 'json' | 'html' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify({
        summary: {
          total: this.results.length,
          passed: this.results.filter(r => r.passed).length,
          failed: this.results.filter(r => !r.passed).length,
          timestamp: new Date().toISOString()
        },
        results: this.results
      }, null, 2)
    }

    // HTML format
    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Visual Regression Test Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .test-result { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
            .passed { border-left: 5px solid #28a745; }
            .failed { border-left: 5px solid #dc3545; }
            .images { display: flex; gap: 10px; margin-top: 10px; }
            .images img { max-width: 300px; border: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <h1>Visual Regression Test Report</h1>
          <div class="summary">
            <h2>Summary</h2>
            <p>Total Tests: ${this.results.length}</p>
            <p>Passed: ${this.results.filter(r => r.passed).length}</p>
            <p>Failed: ${this.results.filter(r => !r.passed).length}</p>
          </div>
    `

    this.results.forEach(result => {
      html += `
        <div class="test-result ${result.passed ? 'passed' : 'failed'}">
          <h3>${result.story} (${result.browser})</h3>
          <p>Status: ${result.passed ? 'PASSED' : 'FAILED'}</p>
          ${result.difference !== undefined ? `<p>Difference: ${result.difference.toFixed(2)}%</p>` : ''}
          ${result.error ? `<p>Error: ${result.error}</p>` : ''}
          <div class="images">
            <div>
              <p>Expected</p>
              <img src="${result.expectedImagePath}" alt="Expected" />
            </div>
            <div>
              <p>Actual</p>
              <img src="${result.actualImagePath}" alt="Actual" />
            </div>
            ${result.diffImagePath ? `
              <div>
                <p>Difference</p>
                <img src="${result.diffImagePath}" alt="Difference" />
              </div>
            ` : ''}
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
}

// Utility function to create test cases from Storybook
export function createStorybookTestCases(
  stories: Array<{ title: string; name: string; id: string }>
): StoryTestCase[] {
  return stories.map(story => ({
    title: story.title,
    name: story.name,
    url: `/iframe.html?id=${story.id}&viewMode=story`,
    waitForSelector: '[data-story-rendered="true"]',
    hideElements: [
      '[data-testid="loading-spinner"]',
      '[data-testid="timestamp"]',
      '.animate-pulse',
      '.animate-spin'
    ]
  }))
}

// Default configuration
export const defaultVisualTestConfig: VisualTestConfig = {
  baseUrl: 'http://localhost:6006',
  screenshotDir: './screenshots',
  thresholdPercent: 0.1,
  viewport: {
    width: 1200,
    height: 800
  },
  browsers: ['chromium']
}