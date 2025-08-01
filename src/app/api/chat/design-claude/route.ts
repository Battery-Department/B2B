import { NextRequest, NextResponse } from 'next/server'
import { claudeProcessor } from '@/lib/claude-client'
import { DesignContext } from '@/types/design'
import ConstructionKnowledgeProcessor from '@/lib/construction-knowledge-base'

// Rate limiting storage (in production, use Redis or database)
const rateLimits = new Map<string, { count: number, resetTime: number }>()
const RATE_LIMIT = 30 // requests per hour  
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip
  return ip || 'anonymous'
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now()
  const userRequests = rateLimits.get(clientId)
  
  if (!userRequests || now > userRequests.resetTime) {
    rateLimits.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return true
  }
  
  if (userRequests.count >= RATE_LIMIT) {
    return false
  }
  
  userRequests.count++
  return true
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { message, context = {} } = await request.json()
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      )
    }

    // Enhanced client identification and rate limiting
    const clientId = getClientId(request)
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait before making another request.',
          usedFallback: true,
          response: "I'm experiencing high demand right now. Please wait a moment and try again."
        },
        { status: 429 }
      )
    }

    // Enhanced context with construction industry knowledge
    const detectedIndustry = ConstructionKnowledgeProcessor.detectIndustry(message)
    const designContext: DesignContext = {
      customerType: context.customerType || detectedIndustry || 'contractor',
      batteryModel: context.batteryModel || '9Ah',
      orderQuantity: context.orderQuantity || 1,
      industryHints: context.industryHints || (detectedIndustry ? [detectedIndustry] : ['construction']),
      conversationHistory: context.conversationHistory || [],
      // Add construction-specific context
      detectedIndustry,
      smartDefaults: ConstructionKnowledgeProcessor.getSmartDefaults(detectedIndustry)
    }

    console.log('Processing enhanced design request:', {
      message: message.substring(0, 100) + '...',
      detectedIndustry,
      clientId: clientId.substring(0, 10) + '...'
    })

    // Process with enhanced Claude client
    const result = await claudeProcessor.processDesignRequest(
      message, 
      designContext, 
      clientId
    )

    const processingTime = Date.now() - startTime

    // Enhanced result with construction optimization metadata
    const enhancedResult = {
      ...result,
      designIntentions: result.intentions, // Legacy compatibility
      appliedChanges: result.intentions?.length || 0,
      processingTimeMs: processingTime,
      detectedIndustry,
      constructionOptimized: true,
      apiVersion: '2.0-construction-enhanced',
      timestamp: new Date().toISOString()
    }

    console.log('Design request completed:', {
      success: true,
      processingTime,
      confidence: result.confidence,
      intentionsCount: result.intentions?.length || 0,
      detectedIndustry,
      usedFallback: result.usedFallback || false
    })

    return NextResponse.json(enhancedResult)

  } catch (error: any) {
    const processingTime = Date.now() - startTime
    console.error('Enhanced design API error:', error)

    // Enhanced error handling with construction industry fallback
    const errorType = error.message?.toLowerCase() || ''
    let fallbackResponse = ''
    let suggestions: string[] = []

    if (errorType.includes('rate limit')) {
      fallbackResponse = "I'm experiencing high demand. Using backup processing for now."
      suggestions = [
        "Try: 'Put COMPANY NAME in bold letters'",
        "Say: 'Add phone number below name'",
        "Ask: 'Make it weatherproof for job sites'"
      ]
    } else if (errorType.includes('api') || errorType.includes('network')) {
      fallbackResponse = "Connection issue detected. I'll use my construction industry knowledge to help."
      suggestions = [
        "Put ABC CONSTRUCTION in bold at top",
        "Add license number LIC #12345", 
        "Make it durable for outdoor use"
      ]
    } else {
      fallbackResponse = "I encountered an issue but I can still help with your battery design."
      suggestions = [
        "Try rephrasing your request",
        "Be specific about company name or text",
        "Mention if it's for outdoor/construction use"
      ]
    }

    // Return enhanced fallback response that still provides value
    return NextResponse.json(
      {
        intentions: [],
        response: fallbackResponse,
        confidence: 0.7,
        suggestions,
        warnings: ['Using backup processing due to technical issue'],
        usedFallback: true,
        error: error.message,
        constructionOptimized: true,
        apiVersion: '2.0-construction-fallback',
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      },
      { status: 200 } // Return 200 to allow frontend to handle gracefully
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Construction-Enhanced AI Battery Design API',
    version: '2.0',
    description: 'AI-powered battery design optimization for construction professionals',
    features: [
      'Industry-specific pattern recognition',
      'Construction worker voice command support', 
      'Smart defaults for electrical, plumbing, roofing contractors',
      'Outdoor durability optimization',
      'Professional compliance suggestions',
      'Files API integration for logos and templates'
    ],
    endpoints: {
      'POST /api/chat/design-claude': {
        description: 'Process natural language design requests',
        parameters: {
          message: 'string (required) - Natural language design description',
          context: 'object (optional) - Customer and industry context'
        },
        example: {
          message: "Put MILLER CONSTRUCTION in bold letters at the top",
          context: {
            customerType: "construction",
            batteryModel: "9Ah", 
            orderQuantity: 25
          }
        }
      }
    },
    rateLimit: `${RATE_LIMIT} requests per hour per IP`,
    constructionIndustries: [
      'General Construction',
      'Electrical Contractors',
      'Plumbing & HVAC', 
      'Roofing',
      'Fleet Management'
    ]
  })
}