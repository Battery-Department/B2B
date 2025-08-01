import { QuizResponse, QuizQuestion } from '@/types/quiz-v2'

interface QuizMetrics {
  completionRate: number
  averageTimeSpent: number
  dropOffPoints: Record<string, number>
  conversionRate: number
  bounceRate: number
}

interface OptimizationSuggestion {
  type: 'question_order' | 'question_skip' | 'content_change' | 'flow_modification'
  priority: 'high' | 'medium' | 'low'
  description: string
  expectedImpact: number
  implementation: any
}

interface UserProfile {
  segment: 'professional' | 'diy' | 'fleet_manager'
  experienceLevel: 'beginner' | 'intermediate' | 'expert'
  deviceType: 'mobile' | 'tablet' | 'desktop'
  previousQuizzes: number
  averageOrderValue?: number
}

export class QuizOptimizationEngine {
  private metricsCache = new Map<string, QuizMetrics>()
  private optimizationRules = new Map<string, OptimizationSuggestion[]>()

  async analyzeQuizPerformance(timeRange: string = '7d'): Promise<{
    metrics: QuizMetrics
    suggestions: OptimizationSuggestion[]
    trends: Record<string, number>
  }> {
    // Get performance data from analytics
    const metrics = await this.getPerformanceMetrics(timeRange)
    
    // Identify optimization opportunities
    const suggestions = await this.generateOptimizationSuggestions(metrics)
    
    // Calculate trends
    const trends = await this.calculateTrends(timeRange)

    return { metrics, suggestions, trends }
  }

  async optimizeQuestionFlow(userProfile?: UserProfile, sessionData?: any[]): Promise<{
    optimizedOrder: string[]
    skippedQuestions: string[]
    personalizations: Record<string, any>
  }> {
    const baseQuestions = [
      'work-type',
      'team-size', 
      'experience-level',
      'tool-preferences',
      'budget-range',
      'priority-features'
    ]

    // Apply user-specific optimizations
    let optimizedOrder = [...baseQuestions]
    let skippedQuestions: string[] = []
    let personalizations: Record<string, any> = {}

    if (userProfile) {
      // Professional contractors get streamlined flow
      if (userProfile.segment === 'professional') {
        optimizedOrder = ['work-type', 'team-size', 'tool-preferences', 'budget-range']
        skippedQuestions = ['experience-level'] // Skip basic questions
        personalizations['work-type'] = {
          focusOptions: ['commercial', 'industrial'],
          hideOptions: ['hobby', 'diy']
        }
      }

      // Fleet managers get specialized flow
      if (userProfile.segment === 'fleet_manager') {
        optimizedOrder = ['fleet-size', 'budget-range', 'tool-preferences', 'management-features']
        personalizations['budget-range'] = {
          showVolumeDiscounts: true,
          emphasizeROI: true
        }
      }

      // Mobile users get shorter flow
      if (userProfile.deviceType === 'mobile') {
        optimizedOrder = optimizedOrder.slice(0, 4) // Limit to 4 questions
        personalizations['layout'] = { compact: true }
      }

      // Returning users get faster flow
      if (userProfile.previousQuizzes > 0) {
        skippedQuestions.push('experience-level')
        personalizations['skipIntros'] = true
      }
    }

    return { optimizedOrder, skippedQuestions, personalizations }
  }

  async getNextQuestion(
    sessionId: string, 
    currentAnswers: QuizResponse[],
    userProfile?: UserProfile
  ): Promise<{
    nextQuestionId: string | null
    confidence: number
    skipRecommendation?: boolean
    adaptiveContent?: any
  }> {
    const answeredQuestions = currentAnswers.map(r => r.questionId)
    const { optimizedOrder, skippedQuestions } = await this.optimizeQuestionFlow(userProfile)
    
    // Find next unanswered question
    const nextQuestionId = optimizedOrder.find(qId => 
      !answeredQuestions.includes(qId) && !skippedQuestions.includes(qId)
    )

    if (!nextQuestionId) {
      return { nextQuestionId: null, confidence: 1.0 }
    }

    // Calculate confidence based on answer patterns
    const confidence = this.calculateAnswerConfidence(currentAnswers)
    
    // Check if we can skip based on high confidence
    const skipRecommendation = confidence > 0.9 && currentAnswers.length >= 3

    // Generate adaptive content
    const adaptiveContent = await this.generateAdaptiveContent(nextQuestionId, currentAnswers, userProfile)

    return {
      nextQuestionId,
      confidence,
      skipRecommendation,
      adaptiveContent
    }
  }

  async predictDropOffRisk(
    sessionId: string,
    currentAnswers: QuizResponse[],
    timeSpent: number
  ): Promise<{
    riskLevel: 'low' | 'medium' | 'high'
    probability: number
    interventions: string[]
  }> {
    // Analyze patterns that indicate drop-off risk
    const factors = {
      timeSpentRatio: timeSpent / (currentAnswers.length * 15), // Expected 15s per question
      questionProgress: currentAnswers.length / 6, // Assuming 6 total questions
      answerSpeed: currentAnswers.length > 0 ? timeSpent / currentAnswers.length : 0,
      skipPattern: this.analyzeSkipPattern(currentAnswers)
    }

    // Calculate risk probability using weighted factors
    let probability = 0
    
    // Slow progress indicates potential abandonment
    if (factors.timeSpentRatio > 2) probability += 0.3
    
    // Very fast answers might indicate low engagement
    if (factors.answerSpeed < 5) probability += 0.2
    
    // Stalling at certain questions
    if (factors.questionProgress < 0.5 && timeSpent > 60) probability += 0.4
    
    // Pattern of indecisive behavior
    if (factors.skipPattern) probability += 0.3

    const riskLevel = probability > 0.7 ? 'high' : probability > 0.4 ? 'medium' : 'low'
    
    // Generate intervention recommendations
    const interventions = this.generateInterventions(riskLevel, factors)

    return { riskLevel, probability, interventions }
  }

  private async getPerformanceMetrics(timeRange: string): Promise<QuizMetrics> {
    // In real implementation, this would query analytics database
    // For now, return mock data with realistic patterns
    return {
      completionRate: 87.3,
      averageTimeSpent: 124, // seconds
      dropOffPoints: {
        'work-type': 5.2,
        'team-size': 8.1,
        'tool-preferences': 15.6, // Highest drop-off
        'budget-range': 12.3,
        'priority-features': 7.8
      },
      conversionRate: 64.5,
      bounceRate: 12.7
    }
  }

  private async generateOptimizationSuggestions(metrics: QuizMetrics): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = []

    // High drop-off point optimization
    const highestDropOff = Object.entries(metrics.dropOffPoints)
      .sort(([,a], [,b]) => b - a)[0]

    if (highestDropOff && highestDropOff[1] > 10) {
      suggestions.push({
        type: 'content_change',
        priority: 'high',
        description: `Simplify ${highestDropOff[0]} question - currently has ${highestDropOff[1]}% drop-off rate`,
        expectedImpact: 8.5,
        implementation: {
          questionId: highestDropOff[0],
          changes: {
            reduceOptions: true,
            addHelpText: true,
            improveVisuals: true
          }
        }
      })
    }

    // Completion rate optimization
    if (metrics.completionRate < 90) {
      suggestions.push({
        type: 'question_order',
        priority: 'high',
        description: 'Reorder questions to put engaging questions first',
        expectedImpact: 12.3,
        implementation: {
          newOrder: ['work-type', 'tool-preferences', 'team-size', 'budget-range'],
          reasoning: 'Move tool preferences earlier to increase engagement'
        }
      })
    }

    // Mobile optimization
    suggestions.push({
      type: 'flow_modification',
      priority: 'medium',
      description: 'Create mobile-optimized shorter flow',
      expectedImpact: 6.7,
      implementation: {
        mobileFlow: ['work-type', 'budget-range', 'tool-preferences'],
        adaptiveUI: true
      }
    })

    return suggestions
  }

  private async calculateTrends(timeRange: string): Promise<Record<string, number>> {
    // Mock trend data showing improvement over time
    return {
      completionRate: 2.3, // +2.3% vs previous period
      conversionRate: 5.1,
      averageTimeSpent: -8.2, // -8.2 seconds (good - faster completion)
      dropOffRate: -15.4 // -15.4% drop-off (good - fewer drop-offs)
    }
  }

  private calculateAnswerConfidence(answers: QuizResponse[]): number {
    if (answers.length === 0) return 0

    // Calculate confidence based on answer patterns
    let confidence = 0.5 // Base confidence

    // Clear answer patterns increase confidence
    const hasConsistentSegment = this.detectUserSegment(answers)
    if (hasConsistentSegment) confidence += 0.3

    // Quick, decisive answers increase confidence
    const avgTimeSpent = answers.reduce((sum, a) => sum + a.timeSpent, 0) / answers.length
    if (avgTimeSpent < 20 && avgTimeSpent > 5) confidence += 0.2

    return Math.min(1.0, confidence)
  }

  private async generateAdaptiveContent(
    questionId: string,
    previousAnswers: QuizResponse[],
    userProfile?: UserProfile
  ): Promise<any> {
    const adaptations: any = {}

    // Adapt language based on detected user segment
    const segment = this.detectUserSegment(previousAnswers)
    
    if (segment === 'professional') {
      adaptations.language = 'professional'
      adaptations.examples = ['commercial job sites', 'crew efficiency', 'tool standardization']
    } else if (segment === 'diy') {
      adaptations.language = 'friendly'
      adaptations.examples = ['home projects', 'weekend work', 'hobby use']
    }

    // Adapt based on previous tool preferences
    const toolPrefs = previousAnswers.find(a => a.questionId === 'tool-preferences')
    if (toolPrefs && questionId === 'budget-range') {
      const brands = toolPrefs.selectedOptions
      if (brands.includes('dewalt') || brands.includes('milwaukee')) {
        adaptations.budgetHints = 'Professional-grade tools typically require higher capacity batteries'
      }
    }

    return adaptations
  }

  private analyzeSkipPattern(answers: QuizResponse[]): boolean {
    // Check for patterns indicating hesitation or confusion
    const quickAnswers = answers.filter(a => a.timeSpent < 3).length
    const longPauses = answers.filter(a => a.timeSpent > 30).length
    
    return quickAnswers > 2 || longPauses > 1
  }

  private generateInterventions(riskLevel: string, factors: any): string[] {
    const interventions: string[] = []

    if (riskLevel === 'high') {
      interventions.push('Show progress indicator with encouragement')
      interventions.push('Offer live chat assistance')
      interventions.push('Display completion time estimate')
      interventions.push('Show preview of personalized results')
    } else if (riskLevel === 'medium') {
      interventions.push('Highlight remaining questions count')
      interventions.push('Show relevant testimonial')
      interventions.push('Offer quick completion option')
    } else {
      interventions.push('Standard flow - user is engaged')
    }

    return interventions
  }

  private detectUserSegment(answers: QuizResponse[]): string {
    // Analyze answers to detect user segment
    const workTypeAnswer = answers.find(a => a.questionId === 'work-type')
    const teamSizeAnswer = answers.find(a => a.questionId === 'team-size')

    if (workTypeAnswer?.selectedOptions.includes('commercial') || 
        workTypeAnswer?.selectedOptions.includes('industrial')) {
      return 'professional'
    }

    if (teamSizeAnswer?.selectedOptions.includes('multiple-crews') ||
        teamSizeAnswer?.selectedOptions.includes('large-crew')) {
      return 'fleet_manager'
    }

    return 'diy'
  }
}