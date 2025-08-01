import { QuizResponse } from '@/types/quiz-v2'

// Analytics events for quiz tracking
export interface QuizAnalyticsEvent {
  eventType: 'quiz_started' | 'quiz_question_answered' | 'quiz_completed' | 'quiz_abandoned' | 'quiz_results_viewed' | 'quiz_to_cart_conversion'
  timestamp: number
  sessionId: string
  userId?: string
  questionId?: string
  response?: any
  timeSpent?: number
  hesitationTime?: number
  abandonedAtQuestion?: string
  completionPercentage?: number
  confidence?: number
  recommendedProducts?: string[]
  conversionValue?: number
  metadata?: Record<string, any>
}

export interface QuizSessionMetrics {
  sessionId: string
  startTime: number
  endTime?: number
  userType?: 'professional' | 'diy'
  totalQuestions: number
  completedQuestions: number
  completionPercentage: number
  totalTimeSpent: number
  averageTimePerQuestion: number
  hesitationPoints: Array<{
    questionId: string
    hesitationTime: number
  }>
  responses: QuizResponse[]
  confidence?: number
  abandonedAt?: string
  converted?: boolean
  conversionValue?: number
}

export interface ConversionFunnelMetrics {
  quizStarted: number
  quizCompleted: number
  resultsViewed: number
  addedToCart: number
  proceedToCheckout: number
  orderCompleted: number
  totalRevenue: number
  averageOrderValue: number
  conversionRates: {
    completionRate: number // completed / started
    viewResultsRate: number // viewed results / completed
    addToCartRate: number // added to cart / viewed results
    checkoutRate: number // proceeded to checkout / added to cart
    purchaseRate: number // completed order / proceeded to checkout
    overallConversionRate: number // completed order / started
  }
}

class QuizAnalyticsService {
  private events: QuizAnalyticsEvent[] = []
  private sessions: Map<string, QuizSessionMetrics> = new Map()
  private currentSession: QuizSessionMetrics | null = null
  private endpoint = '/api/analytics/quiz'
  private batchSize = 10
  private flushInterval = 30000 // 30 seconds

  constructor() {
    this.loadStoredData()
    this.startBatchProcessor()
    this.setupUnloadHandler()
  }

  // Initialize quiz session
  startQuizSession(sessionId: string, userId?: string): void {
    const session: QuizSessionMetrics = {
      sessionId,
      startTime: Date.now(),
      userType: undefined,
      totalQuestions: 0,
      completedQuestions: 0,
      completionPercentage: 0,
      totalTimeSpent: 0,
      averageTimePerQuestion: 0,
      hesitationPoints: [],
      responses: []
    }

    this.sessions.set(sessionId, session)
    this.currentSession = session

    this.trackEvent({
      eventType: 'quiz_started',
      timestamp: Date.now(),
      sessionId,
      userId
    })

    this.saveToStorage()
  }

  // Track question response
  trackQuestionResponse(
    questionId: string,
    response: any,
    timeSpent: number,
    hesitationTime: number = 0
  ): void {
    if (!this.currentSession) return

    const quizResponse: QuizResponse = {
      questionId,
      value: response,
      timestamp: Date.now(),
      responseTime: timeSpent
    }

    this.currentSession.responses.push(quizResponse)
    this.currentSession.completedQuestions++
    this.currentSession.totalTimeSpent += timeSpent

    if (hesitationTime > 0) {
      this.currentSession.hesitationPoints.push({
        questionId,
        hesitationTime
      })
    }

    // Update user type if this is the user type question
    if (questionId === 'user-type') {
      this.currentSession.userType = response as 'professional' | 'diy'
    }

    this.trackEvent({
      eventType: 'quiz_question_answered',
      timestamp: Date.now(),
      sessionId: this.currentSession.sessionId,
      questionId,
      response,
      timeSpent,
      hesitationTime
    })

    this.updateSessionMetrics()
    this.saveToStorage()
  }

  // Complete quiz session
  completeQuiz(
    totalQuestions: number,
    confidence: number,
    recommendedProducts: string[]
  ): void {
    if (!this.currentSession) return

    this.currentSession.endTime = Date.now()
    this.currentSession.totalQuestions = totalQuestions
    this.currentSession.confidence = confidence
    this.currentSession.completionPercentage = 100

    this.updateSessionMetrics()

    this.trackEvent({
      eventType: 'quiz_completed',
      timestamp: Date.now(),
      sessionId: this.currentSession.sessionId,
      completionPercentage: 100,
      confidence,
      recommendedProducts
    })

    this.saveToStorage()
  }

  // Track quiz abandonment
  abandonQuiz(questionId: string, completionPercentage: number): void {
    if (!this.currentSession) return

    this.currentSession.endTime = Date.now()
    this.currentSession.abandonedAt = questionId
    this.currentSession.completionPercentage = completionPercentage

    this.updateSessionMetrics()

    this.trackEvent({
      eventType: 'quiz_abandoned',
      timestamp: Date.now(),
      sessionId: this.currentSession.sessionId,
      abandonedAtQuestion: questionId,
      completionPercentage
    })

    this.saveToStorage()
  }

  // Track results page view
  trackResultsViewed(): void {
    if (!this.currentSession) return

    this.trackEvent({
      eventType: 'quiz_results_viewed',
      timestamp: Date.now(),
      sessionId: this.currentSession.sessionId
    })
  }

  // Track conversion to cart
  trackQuizToCartConversion(
    products: Array<{ id: string; quantity: number; price: number }>,
    totalValue: number
  ): void {
    if (!this.currentSession) return

    this.currentSession.converted = true
    this.currentSession.conversionValue = totalValue

    this.trackEvent({
      eventType: 'quiz_to_cart_conversion',
      timestamp: Date.now(),
      sessionId: this.currentSession.sessionId,
      conversionValue: totalValue,
      metadata: { products }
    })

    this.saveToStorage()
  }

  // Get session metrics
  getSessionMetrics(sessionId?: string): QuizSessionMetrics | null {
    if (sessionId) {
      return this.sessions.get(sessionId) || null
    }
    return this.currentSession
  }

  // Get conversion funnel metrics
  async getConversionFunnelMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<ConversionFunnelMetrics> {
    try {
      const response = await fetch(`${this.endpoint}/funnel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate })
      })

      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.warn('Failed to fetch conversion funnel metrics:', error)
    }

    // Fallback: calculate from local data
    return this.calculateLocalFunnelMetrics()
  }

  // Get quiz performance insights
  async getQuizInsights(): Promise<{
    mostCommonAbandonment: string
    averageCompletionTime: number
    conversionRateByUserType: Record<string, number>
    hesitationPoints: Array<{ questionId: string; avgHesitation: number }>
  }> {
    const sessions = Array.from(this.sessions.values())
    
    // Most common abandonment point
    const abandonmentCounts = sessions
      .filter(s => s.abandonedAt)
      .reduce((acc, s) => {
        acc[s.abandonedAt!] = (acc[s.abandonedAt!] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const mostCommonAbandonment = Object.entries(abandonmentCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'

    // Average completion time
    const completedSessions = sessions.filter(s => s.completionPercentage === 100)
    const averageCompletionTime = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + s.totalTimeSpent, 0) / completedSessions.length
      : 0

    // Conversion rate by user type
    const conversionRateByUserType: Record<string, number> = {}
    const userTypes = ['professional', 'diy'] as const
    
    userTypes.forEach(userType => {
      const userSessions = sessions.filter(s => s.userType === userType)
      const convertedSessions = userSessions.filter(s => s.converted)
      conversionRateByUserType[userType] = userSessions.length > 0
        ? (convertedSessions.length / userSessions.length) * 100
        : 0
    })

    // Hesitation points analysis
    const hesitationData: Record<string, number[]> = {}
    sessions.forEach(session => {
      session.hesitationPoints.forEach(point => {
        if (!hesitationData[point.questionId]) {
          hesitationData[point.questionId] = []
        }
        hesitationData[point.questionId].push(point.hesitationTime)
      })
    })

    const hesitationPoints = Object.entries(hesitationData)
      .map(([questionId, times]) => ({
        questionId,
        avgHesitation: times.reduce((sum, time) => sum + time, 0) / times.length
      }))
      .sort((a, b) => b.avgHesitation - a.avgHesitation)

    return {
      mostCommonAbandonment,
      averageCompletionTime,
      conversionRateByUserType,
      hesitationPoints
    }
  }

  // Private methods
  private trackEvent(event: QuizAnalyticsEvent): void {
    this.events.push(event)
    
    if (this.events.length >= this.batchSize) {
      this.flushEvents()
    }
  }

  private updateSessionMetrics(): void {
    if (!this.currentSession) return

    const session = this.currentSession
    session.completionPercentage = session.totalQuestions > 0
      ? (session.completedQuestions / session.totalQuestions) * 100
      : 0

    session.averageTimePerQuestion = session.completedQuestions > 0
      ? session.totalTimeSpent / session.completedQuestions
      : 0
  }

  private async flushEvents(): Promise<void> {
    if (this.events.length === 0) return

    const eventsToSend = [...this.events]
    this.events = []

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSend })
      })
    } catch (error) {
      console.warn('Failed to send analytics events:', error)
      // Add events back to queue for retry
      this.events.unshift(...eventsToSend)
    }
  }

  private startBatchProcessor(): void {
    setInterval(() => {
      this.flushEvents()
    }, this.flushInterval)
  }

  private setupUnloadHandler(): void {
    if (typeof window === 'undefined') return

    const handleUnload = () => {
      this.flushEvents()
      this.saveToStorage()
    }

    window.addEventListener('beforeunload', handleUnload)
    window.addEventListener('pagehide', handleUnload)
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('quiz-analytics-sessions', JSON.stringify(Array.from(this.sessions.entries())))
      localStorage.setItem('quiz-analytics-events', JSON.stringify(this.events))
    } catch (error) {
      console.warn('Failed to save analytics to storage:', error)
    }
  }

  private loadStoredData(): void {
    try {
      const storedSessions = localStorage.getItem('quiz-analytics-sessions')
      if (storedSessions) {
        const entries = JSON.parse(storedSessions)
        this.sessions = new Map(entries)
      }

      const storedEvents = localStorage.getItem('quiz-analytics-events')
      if (storedEvents) {
        this.events = JSON.parse(storedEvents)
      }
    } catch (error) {
      console.warn('Failed to load analytics from storage:', error)
    }
  }

  private calculateLocalFunnelMetrics(): ConversionFunnelMetrics {
    const sessions = Array.from(this.sessions.values())
    
    const started = sessions.length
    const completed = sessions.filter(s => s.completionPercentage === 100).length
    const resultsViewed = this.events.filter(e => e.eventType === 'quiz_results_viewed').length
    const addedToCart = sessions.filter(s => s.converted).length
    const totalRevenue = sessions.reduce((sum, s) => sum + (s.conversionValue || 0), 0)

    return {
      quizStarted: started,
      quizCompleted: completed,
      resultsViewed,
      addedToCart,
      proceedToCheckout: 0, // Would need to track this separately
      orderCompleted: 0, // Would need to track this separately
      totalRevenue,
      averageOrderValue: addedToCart > 0 ? totalRevenue / addedToCart : 0,
      conversionRates: {
        completionRate: started > 0 ? (completed / started) * 100 : 0,
        viewResultsRate: completed > 0 ? (resultsViewed / completed) * 100 : 0,
        addToCartRate: resultsViewed > 0 ? (addedToCart / resultsViewed) * 100 : 0,
        checkoutRate: 0,
        purchaseRate: 0,
        overallConversionRate: started > 0 ? (addedToCart / started) * 100 : 0
      }
    }
  }
}

// Create singleton instance
export const quizAnalytics = new QuizAnalyticsService()

// React hook for quiz analytics
export function useQuizAnalytics() {
  return {
    startSession: (sessionId: string, userId?: string) => 
      quizAnalytics.startQuizSession(sessionId, userId),
    
    trackResponse: (questionId: string, response: any, timeSpent: number, hesitationTime?: number) =>
      quizAnalytics.trackQuestionResponse(questionId, response, timeSpent, hesitationTime),
    
    completeQuiz: (totalQuestions: number, confidence: number, recommendedProducts: string[]) =>
      quizAnalytics.completeQuiz(totalQuestions, confidence, recommendedProducts),
    
    abandonQuiz: (questionId: string, completionPercentage: number) =>
      quizAnalytics.abandonQuiz(questionId, completionPercentage),
    
    trackResultsViewed: () => quizAnalytics.trackResultsViewed(),
    
    trackConversion: (products: any[], totalValue: number) =>
      quizAnalytics.trackQuizToCartConversion(products, totalValue),
    
    getSessionMetrics: (sessionId?: string) => 
      quizAnalytics.getSessionMetrics(sessionId),
    
    getFunnelMetrics: (startDate?: Date, endDate?: Date) =>
      quizAnalytics.getConversionFunnelMetrics(startDate, endDate),
    
    getInsights: () => quizAnalytics.getQuizInsights()
  }
}

export default quizAnalytics