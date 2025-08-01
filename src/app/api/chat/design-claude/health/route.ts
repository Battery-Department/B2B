import { NextRequest, NextResponse } from 'next/server'
import { claudeProcessor } from '@/lib/claude-client'

// Health check and performance monitoring endpoint
export async function GET(request: NextRequest) {
  try {
    // Get performance metrics
    const metrics = claudeProcessor.getPerformanceMetrics()
    
    // Check API key availability
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY
    const claudeModel = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514'
    
    // Determine health status
    const isHealthy = hasApiKey && metrics.successRate >= 90 && metrics.averageResponseTime < 10000
    
    const healthData = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '2.0-enhanced',
      
      // API Configuration
      configuration: {
        hasApiKey,
        model: claudeModel,
        apiVersion: '2023-06-01',
        filesApiEnabled: true,
        extendedThinkingEnabled: true
      },
      
      // Performance Metrics
      performance: {
        ...metrics,
        status: {
          excellent: metrics.averageResponseTime < 3000 && metrics.successRate >= 98,
          good: metrics.averageResponseTime < 5000 && metrics.successRate >= 95,
          fair: metrics.averageResponseTime < 8000 && metrics.successRate >= 90,
          poor: metrics.averageResponseTime >= 8000 || metrics.successRate < 90
        }
      },
      
      // Feature Status
      features: {
        xmlPromptStructure: 'active',
        constructionIndustryOptimization: 'active',
        extendedThinking: {
          enabled: true,
          budget: '12000-15000 tokens',
          status: 'optimized'
        },
        filesApi: {
          enabled: true,
          supportedTypes: ['images', 'pdfs', 'documents'],
          status: 'ready'
        },
        performanceMonitoring: {
          enabled: true,
          metricsRetention: '1000 requests',
          status: 'active'
        },
        fallbackProcessing: {
          enabled: true,
          constructionKnowledgeBase: 'active',
          status: 'robust'
        }
      },
      
      // System Health Checks
      systemChecks: {
        vercelEnvironment: process.env.VERCEL ? 'production' : 'development',
        environmentVariables: {
          anthropicApiKey: hasApiKey ? 'configured' : 'missing',
          claudeModel: !!process.env.CLAUDE_MODEL ? 'configured' : 'using_default',
          aiFeatures: !!process.env.NEXT_PUBLIC_AI_FEATURES_ENABLED ? 'enabled' : 'default'
        },
        lastDeployment: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'unknown'
      },
      
      // Recommendations
      recommendations: generateRecommendations(metrics, hasApiKey)
    }
    
    return NextResponse.json(healthData, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': isHealthy ? 'healthy' : 'degraded',
        'X-Version': '2.0-enhanced'
      }
    })
    
  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

function generateRecommendations(metrics: any, hasApiKey: boolean): string[] {
  const recommendations: string[] = []
  
  if (!hasApiKey) {
    recommendations.push('Configure ANTHROPIC_API_KEY environment variable')
  }
  
  if (metrics.averageResponseTime > 5000) {
    recommendations.push('Consider optimizing thinking token budget for faster responses')
  }
  
  if (metrics.fallbackRate > 20) {
    recommendations.push('High fallback usage detected - check API connectivity')
  }
  
  if (metrics.successRate < 95) {
    recommendations.push('API success rate below optimal - investigate error patterns')
  }
  
  if (metrics.totalRequests < 10) {
    recommendations.push('Insufficient data for reliable metrics - continue monitoring')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('System operating within optimal parameters')
  }
  
  return recommendations
}

// POST endpoint for testing API connectivity
export async function POST(request: NextRequest) {
  try {
    const { testMessage = 'Put TEST COMPANY in bold letters' } = await request.json()
    
    const startTime = Date.now()
    
    // Test API call with construction industry context
    const testResult = await claudeProcessor.processDesignRequest(
      testMessage,
      {
        customerType: 'construction',
        batteryModel: '9Ah',
        orderQuantity: 1,
        industryHints: ['construction']
      },
      'health_check'
    )
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      responseTime,
      testMessage,
      result: {
        intentions: testResult.intentions?.length || 0,
        confidence: testResult.confidence,
        usedFallback: testResult.usedFallback || false,
        industryDetected: testResult.detectedIndustry || 'unknown',
        thinkingUsed: testResult.thinkingUsed || false
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}