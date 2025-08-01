import { DesignContext, DesignIntention, DesignResult } from '@/types/design'
import { filesClient, EnhancedDesignContext, designFileUtils } from './files-client'
import ConstructionKnowledgeProcessor from './construction-knowledge-base'

// Environment validation
const validateEnvironment = () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not found, using fallback processing')
    return false
  }
  return true
}

// Enhanced error handling and retry logic
interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  retryableErrors: string[]
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableErrors: ['rate_limit_exceeded', 'server_error', 'timeout', 'network_error']
}

// Rate limiting and cache with enhanced error handling
class RequestCache {
  private cache = new Map<string, { result: any, timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  private requestCounts = new Map<string, { count: number, resetTime: number }>()
  private readonly RATE_LIMIT = 30 // requests per minute
  private retryConfig: RetryConfig
  
  constructor(retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG) {
    this.retryConfig = retryConfig
  }
  
  getCachedResult(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.result
    }
    this.cache.delete(key)
    return null
  }
  
  setCachedResult(key: string, result: any) {
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    })
  }
  
  checkRateLimit(clientId: string): boolean {
    const now = Date.now()
    const userRequests = this.requestCounts.get(clientId)
    
    if (!userRequests || now > userRequests.resetTime) {
      this.requestCounts.set(clientId, {
        count: 1,
        resetTime: now + 60000 // Reset in 1 minute
      })
      return true
    }
    
    if (userRequests.count >= this.RATE_LIMIT) {
      return false
    }
    
    userRequests.count++
    return true
  }
  
  // Enhanced error classification and retry logic
  classifyError(error: any): { type: string, isRetryable: boolean, suggestedDelay: number } {
    const errorMessage = error.message?.toLowerCase() || ''
    const statusCode = error.status || 0
    
    // Rate limiting
    if (statusCode === 429 || errorMessage.includes('rate limit')) {
      return {
        type: 'rate_limit_exceeded',
        isRetryable: true,
        suggestedDelay: Math.min(this.retryConfig.maxDelay, 5000)
      }
    }
    
    // Server errors (5xx)
    if (statusCode >= 500 && statusCode < 600) {
      return {
        type: 'server_error',
        isRetryable: true,
        suggestedDelay: this.retryConfig.baseDelay
      }
    }
    
    // Network/timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        type: 'network_error',
        isRetryable: true,
        suggestedDelay: this.retryConfig.baseDelay
      }
    }
    
    // Authentication errors (4xx except 429)
    if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
      return {
        type: 'client_error',
        isRetryable: false,
        suggestedDelay: 0
      }
    }
    
    // Unknown errors - not retryable by default
    return {
      type: 'unknown_error',
      isRetryable: false,
      suggestedDelay: 0
    }
  }
  
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = 'API call'
  ): Promise<T> {
    let lastError: any
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        const errorInfo = this.classifyError(error)
        
        // Don't retry if not retryable or on final attempt
        if (!errorInfo.isRetryable || attempt === this.retryConfig.maxRetries) {
          console.error(`${context} failed after ${attempt + 1} attempts:`, error)
          throw error
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          errorInfo.suggestedDelay * Math.pow(2, attempt),
          this.retryConfig.maxDelay
        )
        
        console.warn(`${context} attempt ${attempt + 1} failed (${errorInfo.type}), retrying in ${delay}ms...`)
        await this.sleep(delay)
      }
    }
    
    throw lastError
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

const cache = new RequestCache()

// Enhanced XML-Tagged System Prompt with Extended Thinking Optimization
const SYSTEM_PROMPT = `<role>
You are an expert AI battery engraving designer specializing in FlexVolt battery customization for contractors and construction professionals. You have extensive knowledge of construction industry requirements, safety standards, and professional branding needs.
</role>

<context>
<industry_expertise>
- Understand contractor business needs (company branding, contact info, licensing)
- Know safety and compliance requirements (OSHA, licensing, insurance)  
- Recognize emergency service patterns (24/7, emergency contact)
- Apply outdoor durability standards for job site equipment
- Use industry-appropriate styling (bold, readable, professional)
</industry_expertise>

<design_parameters>
- primaryText: Main text content (max 20 chars for optimal readability)
- secondaryText: Optional secondary line (max 30 chars)
- fontFamily: Arial Black (construction/bold), Helvetica (professional), Impact (high visibility), Courier New (fleet/technical)
- textAlign: left, center, right
- textSize: 0.08-0.25 (0.18 = construction standard, 0.15 = professional standard)
- textXPosition: -1.5 to 1.5 (0 = center)
- textYPosition: -0.5 to 0.5 (0 = center, -0.3 = top for company names)
- engravingDepth: 0.05-0.15mm (0.05 = indoor, 0.08 = outdoor standard, 0.10+ = heavy duty)
- showSecondaryText: boolean
</design_parameters>

<industry_standards>
1. Construction: Bold, caps, high contrast, deeper engraving (0.08-0.10mm)
2. Electrical: Professional, license numbers prominent, safety compliant
3. Plumbing/HVAC: Service availability emphasis, 24/7 messaging
4. Fleet: Asset tracking focus, ID numbers, scannable format
5. Emergency Services: Contact info prominent, high visibility
</industry_standards>
</context>

<instructions>
<thinking_process>
Use extended reasoning to analyze:
1. Industry type detection from user input
2. Professional requirements and compliance needs
3. Technical constraints and optimization opportunities
4. Safety and durability considerations
5. User experience and practical functionality
6. Industry-specific best practices application
</thinking_process>

<response_format>
Return JSON with:
{
  "intentions": [
    {
      "type": "text|position|style|technical",
      "confidence": 0.0-1.0,
      "parameters": { ... },
      "description": "Human readable explanation",
      "reasoning": "Extended reasoning for industry-optimized choice"
    }
  ],
  "response": "Conversational response tailored to user's industry context",
  "suggestions": ["Industry-appropriate next step suggestions"],
  "warnings": ["Design concerns or compliance considerations"],
  "industry_context": "Detected industry and applied optimizations",
  "compliance_notes": ["Relevant safety/licensing considerations"]
}
</response_format>

<context_awareness>
- Construction workers: "I'll make this bold and durable for job site use"
- Electrical contractors: "I'll ensure your license number is properly displayed"
- Emergency services: "I'll make your 24/7 contact info highly visible"
- Fleet managers: "I'll optimize this for asset tracking and identification"
</context_awareness>
</instructions>

<examples>
<example_1>
Input: "Put MILLER CONSTRUCTION in bold letters at the top"
Output: Bold construction style with primaryText="MILLER CONSTRUCTION", fontFamily="Arial Black", textSize=0.18, engravingDepth=0.08, positioning at top
Reasoning: Construction industry requires high visibility, weather resistance, and professional appearance
</example_1>

<example_2>
Input: "Add our electrical license number"
Output: Professional electrical contractor format with license number, compliance-appropriate styling
Reasoning: Electrical work requires license visibility for code compliance and professional credibility
</example_2>

<example_3>
Input: "Make it weatherproof for outdoor job sites"
Output: Heavy-duty specifications with engravingDepth=0.10+, high-contrast styling for visibility
Reasoning: Outdoor construction environments require deeper engraving and high-contrast design for durability and readability
</example_3>
</examples>`

// Enhanced fallback processing with construction industry knowledge
const fallbackProcessor = (userInput: string): DesignResult => {
  const intentions: DesignIntention[] = []
  const lowerMessage = userInput.toLowerCase()
  
  // Detect industry for smart defaults
  const detectedIndustry = ConstructionKnowledgeProcessor.detectIndustry(userInput)
  const smartDefaults = ConstructionKnowledgeProcessor.getSmartDefaults(detectedIndustry)
  
  // Process voice commands first
  const voiceCommand = ConstructionKnowledgeProcessor.processVoiceCommand(userInput)
  if (voiceCommand && voiceCommand.confidence > 0.7) {
    intentions.push({
      type: 'voice_command',
      confidence: voiceCommand.confidence,
      parameters: voiceCommand.parameters,
      description: `Voice command: ${voiceCommand.intent}`,
      reasoning: 'Recognized construction industry voice command'
    })
  }
  
  // Enhanced text content detection with industry context
  const companyNameMatch = lowerMessage.match(/(?:company name|business name|contractor|construction|electric|electrical|plumbing|roofing)\s+(?:is\s+)?(.+?)(?:\s+(?:in|at|with|and|llc|inc|corp)|$)/i)
  const nameMatch = lowerMessage.match(/(?:my name|owner|manager)\s+(?:is\s+)?([a-z\s]+)(?:\s+(?:in|at|with|and)|$)/i)
  const customTextMatch = lowerMessage.match(/(?:put|add|write|engrave)\s+["\']?([^"'\n]+)["\']?/i)
  
  if (companyNameMatch || customTextMatch) {
    const textContent = companyNameMatch?.[1] || customTextMatch?.[1] || 'YOUR COMPANY'
    const processedText = detectedIndustry === 'construction' 
      ? textContent.toUpperCase().trim()
      : textContent.trim()
      
    intentions.push({
      type: 'text',
      confidence: 0.85,
      parameters: {
        primaryText: processedText,
        fontFamily: smartDefaults.fontFamily,
        textSize: smartDefaults.textSize
      },
      description: `Set company text with ${detectedIndustry || 'professional'} styling`,
      reasoning: `Detected ${detectedIndustry || 'professional'} context - applied industry-appropriate formatting`
    })
  }
  
  // Industry-specific positioning
  if (lowerMessage.includes('top') || lowerMessage.includes('upper') || (detectedIndustry && ['construction', 'electrical'].includes(detectedIndustry))) {
    intentions.push({
      type: 'position',
      confidence: 0.8,
      parameters: { textYPosition: detectedIndustry === 'construction' ? -0.25 : -0.3 },
      description: 'Position for professional visibility',
      reasoning: `${detectedIndustry || 'Professional'} standard positioning for company names`
    })
  }
  
  // Enhanced style detection with industry context
  if (lowerMessage.includes('bold') || lowerMessage.includes('thick') || detectedIndustry === 'construction') {
    intentions.push({
      type: 'style',
      confidence: 0.85,
      parameters: {
        textSize: detectedIndustry === 'construction' ? 0.18 : 0.16,
        fontFamily: detectedIndustry === 'construction' ? 'Arial Black' : 'Arial',
        engravingDepth: detectedIndustry === 'construction' ? 0.08 : 0.06
      },
      description: `Apply ${detectedIndustry || 'professional'} bold styling`,
      reasoning: `${detectedIndustry || 'Professional'} industry standard for visibility and durability`
    })
  }
  
  // Outdoor/durability detection
  if (lowerMessage.includes('outdoor') || lowerMessage.includes('jobsite') || lowerMessage.includes('job site') || lowerMessage.includes('weather')) {
    intentions.push({
      type: 'technical',
      confidence: 0.9,
      parameters: {
        engravingDepth: 0.08,
        fontFamily: 'Arial Black',
        textSize: 0.17
      },
      description: 'Apply weather-resistant outdoor specifications',
      reasoning: 'Outdoor use requires deeper engraving and high-visibility styling'
    })
  }
  
  // Professional/business context
  if (lowerMessage.includes('professional') || lowerMessage.includes('business') || detectedIndustry) {
    const industryDefaults = smartDefaults
    intentions.push({
      type: 'style',
      confidence: 0.85,
      parameters: {
        fontFamily: industryDefaults.fontFamily,
        textAlign: industryDefaults.textAlign,
        textSize: industryDefaults.textSize,
        engravingDepth: industryDefaults.engravingDepth
      },
      description: `Apply ${detectedIndustry || 'professional'} industry styling`,
      reasoning: `Optimized for ${detectedIndustry || 'professional'} industry standards and requirements`
    })
  }
  
  // Generate industry-aware response
  let response = ''
  let suggestions: string[] = []
  
  if (intentions.length === 0) {
    const industryExamples = detectedIndustry ? ConstructionKnowledgeProcessor.getIndustryExamples(detectedIndustry) : []
    
    if (detectedIndustry === 'construction') {
      response = "I'll help you create a professional battery design for your construction business! Tell me your company name, phone number, or any text you want engraved. I'll make it bold and durable for job site use."
      suggestions = [
        "Put ABC CONSTRUCTION in bold letters at the top",
        "Add our phone number 555-0123 below the name",
        "Make it weatherproof for outdoor construction sites"
      ]
    } else if (detectedIndustry === 'electrical') {
      response = "I'll design a professional battery label for your electrical business! I can include your company name, license number, and contact information in a code-compliant format."
      suggestions = [
        "Put SPARK ELECTRIC with license number LIC #E12345",
        "Add 24/7 EMERGENCY service number",
        "Make it professional for electrical contractor use"
      ]
    } else {
      response = "I'd love to help customize your FlexVolt battery! Tell me what you want engraved - like your company name, phone number, or any text that identifies your equipment. I'll optimize it for your industry."
      suggestions = [
        "Put my company name in bold letters at the top",
        "Add our phone number below the name", 
        "Make it look professional for business use"
      ]
    }
    
    if (industryExamples.length > 0) {
      suggestions.push(`Try: "${industryExamples[0].split('\n')[0]}"`)
    }
  } else {
    const descriptions = intentions.map(i => i.description)
    const industryNote = detectedIndustry ? ` with ${detectedIndustry} industry optimization` : ''
    
    response = `Perfect! I've updated your battery design${industryNote}: ${descriptions.join(', ')}. You can see the preview showing exactly how it will look when engraved. Want to add anything else?`
    
    if (detectedIndustry === 'construction') {
      suggestions = [
        "Add our phone number for job site contact",
        "Include license or certification number",
        "Make the text bigger for better visibility",
        "Add weather protection with deeper engraving"
      ]
    } else if (detectedIndustry === 'electrical') {
      suggestions = [
        "Add electrical license number",
        "Include emergency contact number",
        "Add NECA or IBEW certification",
        "Make it code-compliant formatting"
      ]
    } else {
      suggestions = [
        "Add phone number or contact details",
        "Adjust text size or position",
        "Try different professional styling",
        "Add industry-specific information"
      ]
    }
  }
  
  // Add warnings for industry-specific considerations
  const warnings: string[] = []
  if (detectedIndustry === 'electrical' && !lowerMessage.includes('license')) {
    warnings.push('Consider adding your electrical license number for compliance')
  }
  if (detectedIndustry === 'construction' && lowerMessage.includes('outdoor') && !intentions.some(i => i.parameters?.engravingDepth >= 0.08)) {
    warnings.push('Outdoor use detected - consider deeper engraving for weather resistance')
  }
  if (lowerMessage.includes('emergency') && !lowerMessage.includes('24') && !lowerMessage.includes('phone')) {
    warnings.push('Emergency services should include contact number')
  }
  
  return {
    intentions,
    response,
    confidence: Math.max(...intentions.map(i => i.confidence), detectedIndustry ? 0.8 : 0.7),
    suggestions,
    warnings,
    cached: false,
    usedFallback: true,
    // Additional metadata for analytics
    detectedIndustry: detectedIndustry || 'general',
    appliedSmartDefaults: !!detectedIndustry,
    voiceCommandUsed: !!voiceCommand
  }
}

// Performance monitoring and analytics
interface PerformanceMetrics {
  requestId: string
  startTime: number
  endTime: number
  responseTime: number
  thinkingTokens: number
  outputTokens: number
  inputTokens: number
  model: string
  success: boolean
  errorType?: string
  industryDetected?: string
  filesProcessed: number
  fallbackUsed: boolean
  cacheHit: boolean
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private readonly MAX_METRICS = 1000
  
  startRequest(requestId: string): number {
    return Date.now()
  }
  
  recordMetrics(data: Partial<PerformanceMetrics>): void {
    const metric: PerformanceMetrics = {
      requestId: data.requestId || `req_${Date.now()}`,
      startTime: data.startTime || Date.now(),
      endTime: data.endTime || Date.now(),
      responseTime: data.responseTime || 0,
      thinkingTokens: data.thinkingTokens || 0,
      outputTokens: data.outputTokens || 0,
      inputTokens: data.inputTokens || 0,
      model: data.model || 'claude-sonnet-4-20250514',
      success: data.success ?? true,
      errorType: data.errorType,
      industryDetected: data.industryDetected,
      filesProcessed: data.filesProcessed || 0,
      fallbackUsed: data.fallbackUsed || false,
      cacheHit: data.cacheHit || false
    }
    
    this.metrics.push(metric)
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.splice(0, this.metrics.length - this.MAX_METRICS)
    }
    
    // Log important metrics for debugging
    console.log('API Performance:', {
      responseTime: metric.responseTime,
      thinkingTokens: metric.thinkingTokens,
      success: metric.success,
      industry: metric.industryDetected,
      fallback: metric.fallbackUsed
    })
  }
  
  getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0
    const sum = this.metrics.reduce((acc, m) => acc + m.responseTime, 0)
    return sum / this.metrics.length
  }
  
  getSuccessRate(): number {
    if (this.metrics.length === 0) return 1
    const successes = this.metrics.filter(m => m.success).length
    return successes / this.metrics.length
  }
  
  getFallbackRate(): number {
    if (this.metrics.length === 0) return 0
    const fallbacks = this.metrics.filter(m => m.fallbackUsed).length
    return fallbacks / this.metrics.length
  }
  
  getMetricsSummary() {
    return {
      totalRequests: this.metrics.length,
      averageResponseTime: Math.round(this.getAverageResponseTime()),
      successRate: Math.round(this.getSuccessRate() * 100),
      fallbackRate: Math.round(this.getFallbackRate() * 100),
      averageThinkingTokens: Math.round(
        this.metrics.reduce((acc, m) => acc + m.thinkingTokens, 0) / (this.metrics.length || 1)
      ),
      industriesDetected: [...new Set(this.metrics.map(m => m.industryDetected).filter(Boolean))],
      recentErrors: this.metrics
        .filter(m => !m.success)
        .slice(-5)
        .map(m => ({ type: m.errorType, time: new Date(m.startTime).toISOString() }))
    }
  }
}

const performanceMonitor = new PerformanceMonitor()

// Production Claude API client with enhanced monitoring
export class ClaudeDesignProcessor {
  private hasValidApiKey: boolean
  
  constructor() {
    this.hasValidApiKey = validateEnvironment()
  }
  
  getPerformanceMetrics() {
    return performanceMonitor.getMetricsSummary()
  }
  
  async processDesignRequest(
    userInput: string, 
    context: DesignContext,
    clientId: string = 'anonymous'
  ): Promise<DesignResult> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = performanceMonitor.startRequest(requestId)
    const detectedIndustry = ConstructionKnowledgeProcessor.detectIndustry(userInput)
    
    // Check rate limiting
    if (!cache.checkRateLimit(clientId)) {
      performanceMonitor.recordMetrics({
        requestId,
        startTime,
        endTime: Date.now(),
        responseTime: Date.now() - startTime,
        success: false,
        errorType: 'rate_limit_exceeded',
        industryDetected: detectedIndustry,
        fallbackUsed: false
      })
      throw new Error('Rate limit exceeded. Please wait before making another request.')
    }
    
    // Check cache first
    const cacheKey = `${userInput.toLowerCase()}-${JSON.stringify(context)}`
    const cachedResult = cache.getCachedResult(cacheKey)
    if (cachedResult) {
      performanceMonitor.recordMetrics({
        requestId,
        startTime,
        endTime: Date.now(),
        responseTime: Date.now() - startTime,
        success: true,
        industryDetected: detectedIndustry,
        cacheHit: true,
        fallbackUsed: false
      })
      return { ...cachedResult, cached: true }
    }
    
    // Use fallback if no API key
    if (!this.hasValidApiKey) {
      console.log('Using fallback processing - no API key available')
      const result = fallbackProcessor(userInput)
      cache.setCachedResult(cacheKey, result)
      
      performanceMonitor.recordMetrics({
        requestId,
        startTime,
        endTime: Date.now(),
        responseTime: Date.now() - startTime,
        success: true,
        errorType: 'no_api_key',
        industryDetected: detectedIndustry,
        fallbackUsed: true
      })
      
      return result
    }
    
    try {
      // Call Claude API
      const result = await this.callClaudeAPI(userInput, context, requestId, startTime, detectedIndustry)
      
      // Cache successful result
      cache.setCachedResult(cacheKey, result)
      
      return result
    } catch (error) {
      const errorInfo = cache.classifyError(error)
      
      // Record failed API call metrics
      performanceMonitor.recordMetrics({
        requestId,
        startTime,
        endTime: Date.now(),
        responseTime: Date.now() - startTime,
        success: false,
        errorType: errorInfo.type,
        industryDetected: detectedIndustry,
        fallbackUsed: true
      })
      
      // Enhanced error logging with classification
      console.error(`Claude API error (${errorInfo.type}), falling back to pattern processing:`, {
        error: error.message,
        type: errorInfo.type,
        isRetryable: errorInfo.isRetryable,
        userInput: userInput.slice(0, 100) // Log first 100 chars for debugging
      })
      
      // Fallback to pattern-based processing with enhanced messaging
      const fallbackResult = fallbackProcessor(userInput)
      
      // Customize fallback message based on error type
      let fallbackMessage = "I'm running on backup processing right now, but I can still help! "
      
      if (errorInfo.type === 'rate_limit_exceeded') {
        fallbackMessage = "I'm experiencing high demand right now, so I'm using backup processing. "
      } else if (errorInfo.type === 'server_error') {
        fallbackMessage = "The AI service is temporarily unavailable, but I can still assist with basic processing. "
      } else if (errorInfo.type === 'client_error') {
        fallbackMessage = "There's a configuration issue, but I can still help with pattern-based design. "
      } else if ((error as any).isRefusal) {
        fallbackMessage = "I couldn't process that specific request, but let me help you with an alternative approach. "
      }
      
      return {
        ...fallbackResult,
        response: fallbackMessage + fallbackResult.response,
        confidence: Math.max(fallbackResult.confidence - 0.2, 0.5),
        usedFallback: true,
        warnings: [
          ...(fallbackResult.warnings || []),
          `Using backup processing (${errorInfo.type}). Full AI features temporarily unavailable.`
        ]
      }
    }
  }

  // Enhanced design processing with Files API support
  async processEnhancedDesignRequest(
    userInput: string,
    context: EnhancedDesignContext,
    clientId: string = 'anonymous'
  ): Promise<DesignResult> {
    // Check rate limiting
    if (!cache.checkRateLimit(clientId)) {
      throw new Error('Rate limit exceeded. Please wait before making another request.')
    }

    // Use enhanced API call with file attachments
    if (!this.hasValidApiKey) {
      console.log('Using fallback processing - no API key available')
      const result = fallbackProcessor(userInput)
      return result
    }

    try {
      const result = await this.callEnhancedClaudeAPI(userInput, context)
      return result
    } catch (error) {
      const errorInfo = cache.classifyError(error)
      
      // Enhanced error logging for Files API
      console.error(`Enhanced Claude API error (${errorInfo.type}) with Files API, falling back:`, {
        error: error.message,
        type: errorInfo.type,
        isRetryable: errorInfo.isRetryable,
        hasFiles: !!(context.templateFiles?.length || context.logoFiles?.length || context.referenceFiles?.length),
        userInput: userInput.slice(0, 100)
      })
      
      const fallbackResult = fallbackProcessor(userInput)
      
      // Enhanced fallback messaging for Files API failures
      let fallbackMessage = "I'm running on backup processing without file analysis. "
      
      if (errorInfo.type === 'rate_limit_exceeded') {
        fallbackMessage = "High demand prevented file analysis, using backup processing. "
      } else if (errorInfo.type === 'server_error') {
        fallbackMessage = "File processing service unavailable, using backup text-only analysis. "
      } else if ((error as any).isRefusal) {
        fallbackMessage = "Content couldn't be analyzed with files, trying alternative approach. "
      }
      
      return {
        ...fallbackResult,
        response: fallbackMessage + fallbackResult.response,
        confidence: Math.max(fallbackResult.confidence - 0.3, 0.4),
        usedFallback: true,
        warnings: [
          ...(fallbackResult.warnings || []),
          `Files API unavailable (${errorInfo.type}). Using text-only processing.`
        ]
      }
    }
  }
  
  private async callClaudeAPI(
    userInput: string, 
    context: DesignContext, 
    requestId: string,
    startTime: number,
    detectedIndustry: string | null
  ): Promise<DesignResult> {
    const prompt = this.generateContextualPrompt(userInput, context)
    
    // Use enhanced retry logic for API calls
    return cache.executeWithRetry(async () => {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
          max_tokens: 3000,
          system: SYSTEM_PROMPT,
          thinking: {
            type: 'enabled',
            budget_tokens: 12000  // Increased for complex construction design reasoning
          },
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          // Enhanced API features for better responses
          temperature: 0.1,  // Lower temperature for more consistent technical responses
          top_p: 0.9,
          metadata: {
            user_id: 'battery_designer',
            request_type: 'construction_design'
          }
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const error = new Error(`Claude API error: ${response.status} ${response.statusText}`)
        ;(error as any).status = response.status
        ;(error as any).details = errorData
        throw error
      }
      
      const data = await response.json()
      
      // Handle refusal stop reasons (new in Claude 4)
      if (data.stop_reason === 'refusal') {
        const refusalError = new Error('Request declined for safety reasons. Please try rephrasing your design request.')
        ;(refusalError as any).isRefusal = true
        throw refusalError
      }
      
      // Extract text content, handling thinking blocks
      let textContent = ''
      if (data.content && Array.isArray(data.content)) {
        const textBlocks = data.content.filter(block => block.type === 'text')
        textContent = textBlocks.map(block => block.text).join(' ')
      }
      
      // Record successful API call metrics
      const endTime = Date.now()
      performanceMonitor.recordMetrics({
        requestId,
        startTime,
        endTime,
        responseTime: endTime - startTime,
        thinkingTokens: data.usage?.thinking_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
        inputTokens: data.usage?.input_tokens || 0,
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        success: true,
        industryDetected: detectedIndustry,
        fallbackUsed: false
      })
      
      // Add timing information to response data
      const responseData = { ...data, _startTime: startTime }
      return this.parseClaudeResponse(textContent, responseData)
    }, 'Claude API call')
  }

  // Enhanced API call with Files API support
  private async callEnhancedClaudeAPI(userInput: string, context: EnhancedDesignContext): Promise<DesignResult> {
    const messages = designFileUtils.createEnhancedPrompt(userInput, context)
    const startTime = Date.now()
    
    // Use enhanced retry logic for API calls with Files API
    return cache.executeWithRetry(async () => {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'files-api-2025-04-14'  // Required for Files API
        },
        body: JSON.stringify({
          model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
          max_tokens: 4000,  // Increased for complex file analysis
          system: this.generateEnhancedSystemPrompt(),
          thinking: {
            type: 'enabled',
            budget_tokens: 15000  // Enhanced thinking budget for multi-modal analysis
          },
          messages,
          // Optimized settings for file analysis
          temperature: 0.05,  // Very low for precise technical analysis
          top_p: 0.85,
          metadata: {
            user_id: 'battery_designer_enhanced',
            request_type: 'multimodal_construction_design',
            files_included: true
          }
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const error = new Error(`Enhanced Claude API error: ${response.status} ${response.statusText}`)
        ;(error as any).status = response.status
        ;(error as any).details = errorData
        throw error
      }
      
      const data = await response.json()
      
      // Handle refusal stop reasons
      if (data.stop_reason === 'refusal') {
        const refusalError = new Error('Request declined for safety reasons. Please try rephrasing your design request.')
        ;(refusalError as any).isRefusal = true
        throw refusalError
      }
      
      // Extract text content, handling thinking blocks and file analysis
      let textContent = ''
      if (data.content && Array.isArray(data.content)) {
        const textBlocks = data.content.filter(block => block.type === 'text')
        textContent = textBlocks.map(block => block.text).join(' ')
      }
      
      // Add timing information to response data
      const responseData = { ...data, _startTime: startTime }
      return this.parseClaudeResponse(textContent, responseData)
    }, 'Enhanced Claude API call with Files API')
  }

  private generateEnhancedSystemPrompt(): string {
    return `<role>
You are an expert AI battery design assistant with advanced multi-modal capabilities, specializing in FlexVolt battery customization for construction professionals. You have access to uploaded files including templates, logos, and reference images.
</role>

<capabilities>
<file_analysis>
- Analyze uploaded design templates and extract professional design patterns
- Integrate company logos into battery designs with brand consistency
- Use reference images to understand customer style preferences and industry standards
- Extract color schemes, typography, and layout patterns from visual assets
- Provide detailed technical specifications optimized for laser engraving
</file_analysis>

<industry_optimization>
- Consider construction industry-specific requirements and regulations
- Apply OSHA compliance and safety standards to design decisions
- Optimize for outdoor durability and job site visibility
- Integrate professional licensing and certification requirements
- Apply industry-appropriate styling (construction bold, electrical professional, etc.)
</industry_optimization>
</capabilities>

<technical_requirements>
- All text must be readable at battery scale (maximum 30 characters per line)
- Engraving depth optimization: 0.05mm (indoor) to 0.12mm (heavy-duty outdoor)
- Position coordinates: X(-1.5 to 1.5), Y(-0.5 to 0.5) where (0,0) is center
- Font recommendations: Arial Black (construction), Helvetica (professional), Impact (high visibility), Courier New (fleet/technical)
- Contrast optimization: darker engraving on lighter battery surfaces for maximum readability
- Weather resistance: deeper engraving and high-contrast styling for outdoor use
</technical_requirements>

<instructions>
<thinking_process>
When files are provided, use extended reasoning to:
1. Analyze templates for design patterns, constraints, and professional standards
2. Extract key visual elements from logos (colors, typography, symbols) for seamless integration
3. Understand aesthetic preferences and industry context from reference images
4. Apply construction industry best practices and compliance requirements
5. Optimize technical specifications for durability and professional appearance
6. Suggest improvements based on professional design principles and industry standards
</thinking_process>

<response_format>
Always provide JSON response with:
{
  "intentions": [...],
  "response": "Industry-tailored conversational response",
  "confidence": 0.0-1.0,
  "suggestions": ["Professional next steps"],
  "warnings": ["Safety/compliance considerations"],
  "file_analysis": "Summary of uploaded file insights",
  "industry_context": "Detected industry and applied optimizations",
  "technical_specs": "Engraving specifications and rationale"
}
</response_format>
</instructions>

<file_integration_examples>
<logo_integration>
Input: Company logo upload + "Put our company name with logo"
Process: Extract logo colors, identify company name, position logo appropriately, ensure brand consistency
Output: Integrated design with logo placement, matching typography, brand-consistent styling
</logo_integration>

<template_analysis>
Input: Design template PDF + "Use this template style"
Process: Analyze layout patterns, extract typography choices, identify positioning standards
Output: Template-consistent design with professional layout and styling
</template_analysis>

<reference_matching>
Input: Reference image + "Make it look like this style"
Process: Analyze visual style, identify key design elements, adapt for battery constraints
Output: Style-matched design optimized for laser engraving and industry requirements
</reference_matching>
</file_integration_examples>`
  }
  
  private generateContextualPrompt(userInput: string, context: DesignContext): string {
    // Detect industry from user input and context
    const detectedIndustry = ConstructionKnowledgeProcessor.detectIndustry(userInput)
    const industryContext = detectedIndustry || context.customerType || 'professional'
    
    // Get smart defaults for this industry
    const smartDefaults = ConstructionKnowledgeProcessor.getSmartDefaults(detectedIndustry)
    
    // Generate enhanced prompt with construction knowledge
    const contextPrompt = ConstructionKnowledgeProcessor.generateContextPrompt(userInput, detectedIndustry)
    
    return `${contextPrompt}

CUSTOMER CONTEXT:
- Type: ${context.customerType || industryContext}
- Battery: ${context.batteryModel || 'FlexVolt'} 
- Quantity: ${context.orderQuantity || 1} units
- Industry hints: ${context.industryHints?.join(', ') || 'construction professional'}
- Detected industry: ${detectedIndustry || 'general professional'}

SMART DEFAULTS FOR THIS INDUSTRY:
- Font: ${smartDefaults.fontFamily}
- Size: ${smartDefaults.textSize}
- Depth: ${smartDefaults.engravingDepth}mm
- Position: ${smartDefaults.textAlign} aligned

CURRENT REQUEST: "${userInput}"

Please analyze this request with your construction industry expertise and provide design intentions with technical parameters optimized for this professional context. Focus on practical, durable results that work well for job site use.`
  }
  
  private parseClaudeResponse(responseText: string, fullResponse?: any): DesignResult {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(responseText)
      
      // Extract Claude 4 usage information
      const usage = fullResponse?.usage || {}
      const thinkingUsed = usage.thinking_tokens > 0
      
      // Extract files analyzed for enhanced context
      const filesAnalyzed = fullResponse?.content
        ?.filter((block: any) => block.type === 'document' || block.type === 'image')
        ?.map((block: any) => block.source?.file_id) || []
      
      return {
        intentions: parsed.intentions || [],
        response: parsed.response || 'Design updated successfully!',
        confidence: parsed.confidence || 0.8,
        suggestions: parsed.suggestions || [],
        warnings: parsed.warnings || [],
        // Claude 4 enhancements
        thinkingUsed,
        thinkingTokens: usage.thinking_tokens || 0,
        filesAnalyzed,
        enhancedProcessing: true,
        stopReason: fullResponse?.stop_reason || 'end_turn',
        modelVersion: 'claude-sonnet-4-20250514',
        processingTimeMs: Date.now() - (fullResponse?._startTime || Date.now()),
        // Construction industry enhancements
        detectedIndustry: parsed.detectedIndustry,
        appliedSmartDefaults: parsed.appliedSmartDefaults,
        constructionOptimized: true
      }
    } catch (error) {
      // If not valid JSON, treat as plain text response with construction fallback
      console.warn('Could not parse Claude response as JSON, using construction-enhanced fallback')
      
      // Try to extract basic information and apply construction knowledge
      const fallbackResult = fallbackProcessor(responseText)
      
      return {
        intentions: fallbackResult.intentions,
        response: responseText || 'I processed your request with construction industry knowledge.',
        confidence: Math.max(fallbackResult.confidence, 0.6),
        suggestions: fallbackResult.suggestions || [
          "Try: 'Put COMPANY NAME in bold letters'",
          "Add: 'Include phone number below name'",
          "Say: 'Make it weatherproof for outdoor use'"
        ],
        warnings: [...(fallbackResult.warnings || []), 'Response parsing failed - using construction industry fallback'],
        // Claude 4 enhancements
        thinkingUsed: false,
        thinkingTokens: 0,
        enhancedProcessing: false,
        stopReason: 'end_turn',
        modelVersion: 'claude-sonnet-4-20250514',
        // Construction fallback applied
        detectedIndustry: fallbackResult.detectedIndustry || 'construction',
        appliedSmartDefaults: fallbackResult.appliedSmartDefaults || true,
        constructionOptimized: true,
        usedFallback: true
      }
    }
  }
}

// Singleton instance
export const claudeProcessor = new ClaudeDesignProcessor()