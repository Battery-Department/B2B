import { EngraveParameters, DesignResult, ChatMessage } from '@/types/design'

interface AnalyticsEvent {
  event: string
  properties: Record<string, any>
  timestamp: Date
  sessionId: string
  userId?: string
}

interface DesignSession {
  sessionId: string
  startTime: Date
  endTime?: Date
  messageCount: number
  designIterations: number
  finalDesign?: EngraveParameters
  conversionToOrder: boolean
  customerType?: string
  totalProcessingTime: number
}

class DesignAnalytics {
  private events: AnalyticsEvent[] = []
  private sessions: Map<string, DesignSession> = new Map()
  private currentSessionId: string | null = null

  // Initialize or get current session
  startSession(customerType?: string): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    this.sessions.set(sessionId, {
      sessionId,
      startTime: new Date(),
      messageCount: 0,
      designIterations: 0,
      conversionToOrder: false,
      customerType,
      totalProcessingTime: 0
    })
    
    this.currentSessionId = sessionId
    
    this.track('design_session_started', {
      session_id: sessionId,
      customer_type: customerType
    })
    
    return sessionId
  }

  // Track design generation events
  trackDesignRequest(
    userInput: string, 
    result: DesignResult, 
    processingTime: number,
    sessionId?: string
  ) {
    const session = sessionId || this.currentSessionId
    if (!session) return

    // Update session
    const sessionData = this.sessions.get(session)
    if (sessionData) {
      sessionData.messageCount++
      sessionData.designIterations++
      sessionData.totalProcessingTime += processingTime
    }

    this.track('ai_design_generated', {
      session_id: session,
      input_length: userInput.length,
      input_words: userInput.split(' ').length,
      intentions_found: result.intentions.length,
      confidence: result.confidence,
      processing_time_ms: processingTime,
      used_fallback: result.usedFallback || false,
      used_cache: result.cached || false,
      design_complexity: this.calculateDesignComplexity(result.intentions)
    })

    // Track individual intentions
    result.intentions.forEach((intention, index) => {
      this.track('design_intention_applied', {
        session_id: session,
        intention_type: intention.type,
        confidence: intention.confidence,
        parameter_count: Object.keys(intention.parameters).length,
        order_in_response: index
      })
    })
  }

  // Track conversation flow
  trackConversationMessage(
    message: ChatMessage,
    sessionId?: string
  ) {
    const session = sessionId || this.currentSessionId
    if (!session) return

    this.track('conversation_message', {
      session_id: session,
      role: message.role,
      message_length: message.content.length,
      has_suggestions: (message.suggestions?.length || 0) > 0,
      confidence: message.confidence,
      design_applied: message.designApplied || false
    })
  }

  // Track design parameter changes
  trackParameterChange(
    parameter: keyof EngraveParameters,
    oldValue: any,
    newValue: any,
    source: 'ai' | 'manual' | 'voice',
    sessionId?: string
  ) {
    const session = sessionId || this.currentSessionId
    if (!session) return

    this.track('design_parameter_changed', {
      session_id: session,
      parameter,
      old_value: oldValue,
      new_value: newValue,
      source,
      change_magnitude: this.calculateChangeMagnitude(parameter, oldValue, newValue)
    })
  }

  // Track voice usage
  trackVoiceUsage(
    action: 'started' | 'stopped' | 'transcript_generated' | 'error',
    details?: Record<string, any>,
    sessionId?: string
  ) {
    const session = sessionId || this.currentSessionId
    if (!session) return

    this.track('voice_interaction', {
      session_id: session,
      action,
      ...details
    })
  }

  // Track design validation
  trackDesignValidation(
    validation: { isValid: boolean, issues: any[], score: number },
    design: EngraveParameters,
    sessionId?: string
  ) {
    const session = sessionId || this.currentSessionId
    if (!session) return

    this.track('design_validated', {
      session_id: session,
      is_valid: validation.isValid,
      quality_score: validation.score,
      issue_count: validation.issues.length,
      error_count: validation.issues.filter(i => i.type === 'error').length,
      warning_count: validation.issues.filter(i => i.type === 'warning').length,
      design_complexity: this.calculateParameterComplexity(design)
    })
  }

  // Track order conversion
  trackConversionToOrder(
    designData: EngraveParameters,
    orderValue: number,
    sessionId?: string
  ) {
    const session = sessionId || this.currentSessionId
    if (!session) return

    // Update session
    const sessionData = this.sessions.get(session)
    if (sessionData) {
      sessionData.conversionToOrder = true
      sessionData.finalDesign = designData
      sessionData.endTime = new Date()
    }

    this.track('ai_design_converted', {
      session_id: session,
      design_complexity: this.calculateParameterComplexity(designData),
      order_value: orderValue,
      ai_generated: true,
      session_duration_ms: sessionData ? 
        (new Date().getTime() - sessionData.startTime.getTime()) : 0,
      total_iterations: sessionData?.designIterations || 0
    })
  }

  // Track errors and issues
  trackError(
    error: Error | string,
    context: string,
    sessionId?: string
  ) {
    const session = sessionId || this.currentSessionId

    this.track('design_error', {
      session_id: session,
      error_message: typeof error === 'string' ? error : error.message,
      error_context: context,
      error_stack: typeof error === 'object' ? error.stack : undefined
    })
  }

  // Performance monitoring
  trackPerformanceMetric(
    metric: string,
    value: number,
    unit: string = 'ms',
    context?: Record<string, any>
  ) {
    this.track('performance_metric', {
      metric_name: metric,
      value,
      unit,
      ...context
    })
  }

  // Get session analytics
  getSessionAnalytics(sessionId: string) {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const sessionEvents = this.events.filter(e => e.properties.session_id === sessionId)
    
    return {
      session: session,
      totalEvents: sessionEvents.length,
      averageProcessingTime: session.totalProcessingTime / Math.max(session.designIterations, 1),
      conversionRate: session.conversionToOrder ? 1 : 0,
      eventBreakdown: this.groupEventsByType(sessionEvents)
    }
  }

  // Export analytics data (for dashboard or external analytics)
  exportAnalytics(sessionId?: string) {
    if (sessionId) {
      return {
        session: this.sessions.get(sessionId),
        events: this.events.filter(e => e.properties.session_id === sessionId)
      }
    }

    return {
      sessions: Array.from(this.sessions.values()),
      events: this.events,
      summary: this.generateSummary()
    }
  }

  // Private helper methods
  private track(event: string, properties: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: new Date(),
      sessionId: this.currentSessionId || 'unknown'
    }

    this.events.push(analyticsEvent)

    // In a real app, you'd send this to your analytics service
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', analyticsEvent)
    }

    // Optional: Send to external analytics service
    this.sendToExternalAnalytics(analyticsEvent)
  }

  private calculateDesignComplexity(intentions: any[]): 'low' | 'medium' | 'high' {
    const score = intentions.reduce((acc, intention) => {
      return acc + Object.keys(intention.parameters).length
    }, 0)

    if (score <= 3) return 'low'
    if (score <= 6) return 'medium'
    return 'high'
  }

  private calculateParameterComplexity(design: EngraveParameters): number {
    let complexity = 0
    
    // Text complexity
    complexity += design.primaryText.length * 0.1
    if (design.showSecondaryText) complexity += design.secondaryText.length * 0.1
    
    // Position complexity
    complexity += Math.abs(design.textXPosition) + Math.abs(design.textYPosition)
    
    // Style complexity
    if (design.fontFamily !== 'Arial') complexity += 1
    if (design.textAlign !== 'center') complexity += 0.5
    if (design.textSize !== 0.15) complexity += Math.abs(design.textSize - 0.15) * 5
    
    return Math.round(complexity * 10) / 10
  }

  private calculateChangeMagnitude(
    parameter: keyof EngraveParameters, 
    oldValue: any, 
    newValue: any
  ): 'small' | 'medium' | 'large' {
    if (typeof oldValue === 'number' && typeof newValue === 'number') {
      const change = Math.abs(newValue - oldValue)
      
      if (parameter === 'textSize') {
        if (change < 0.02) return 'small'
        if (change < 0.05) return 'medium'
        return 'large'
      }
      
      if (parameter === 'textXPosition' || parameter === 'textYPosition') {
        if (change < 0.2) return 'small'
        if (change < 0.5) return 'medium'
        return 'large'
      }
      
      if (parameter === 'engravingDepth') {
        if (change < 0.01) return 'small'
        if (change < 0.03) return 'medium'
        return 'large'
      }
    }
    
    return oldValue !== newValue ? 'medium' : 'small'
  }

  private groupEventsByType(events: AnalyticsEvent[]) {
    return events.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  private generateSummary() {
    const totalSessions = this.sessions.size
    const totalEvents = this.events.length
    const conversions = Array.from(this.sessions.values())
      .filter(s => s.conversionToOrder).length
    
    return {
      totalSessions,
      totalEvents,
      conversions,
      conversionRate: totalSessions > 0 ? conversions / totalSessions : 0,
      averageSessionLength: this.calculateAverageSessionLength(),
      mostCommonEvents: this.getMostCommonEvents()
    }
  }

  private calculateAverageSessionLength(): number {
    const completedSessions = Array.from(this.sessions.values())
      .filter(s => s.endTime)
    
    if (completedSessions.length === 0) return 0
    
    const totalDuration = completedSessions.reduce((acc, session) => {
      return acc + (session.endTime!.getTime() - session.startTime.getTime())
    }, 0)
    
    return totalDuration / completedSessions.length
  }

  private getMostCommonEvents(): Array<{ event: string, count: number }> {
    const eventCounts = this.groupEventsByType(this.events)
    
    return Object.entries(eventCounts)
      .map(([event, count]) => ({ event, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  private sendToExternalAnalytics(event: AnalyticsEvent) {
    // Integration point for external analytics services
    // e.g., Google Analytics, Mixpanel, Segment, etc.
    
    // Example for Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', event.event, {
        ...event.properties,
        event_timestamp: event.timestamp.getTime()
      })
    }
    
    // Example for custom analytics endpoint
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }).catch(error => {
        console.error('Failed to send analytics event:', error)
      })
    }
  }
}

// Singleton instance
export const designAnalytics = new DesignAnalytics()

// React hook for easy use in components
export const useDesignAnalytics = (sessionId?: string) => {
  const currentSession = sessionId || designAnalytics.startSession()
  
  return {
    sessionId: currentSession,
    trackDesignRequest: (input: string, result: DesignResult, time: number) => 
      designAnalytics.trackDesignRequest(input, result, time, currentSession),
    trackMessage: (message: ChatMessage) => 
      designAnalytics.trackConversationMessage(message, currentSession),
    trackParameterChange: (param: keyof EngraveParameters, old: any, new_val: any, source: 'ai' | 'manual' | 'voice') =>
      designAnalytics.trackParameterChange(param, old, new_val, source, currentSession),
    trackVoice: (action: string, details?: any) =>
      designAnalytics.trackVoiceUsage(action as any, details, currentSession),
    trackError: (error: Error | string, context: string) =>
      designAnalytics.trackError(error, context, currentSession),
    trackConversion: (design: EngraveParameters, value: number) =>
      designAnalytics.trackConversionToOrder(design, value, currentSession)
  }
}