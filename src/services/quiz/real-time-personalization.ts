import { QuizResponse, QuizQuestion } from '@/types/quiz-v2'

interface PersonalizationContext {
  userProfile: {
    segment: 'professional' | 'diy' | 'fleet_manager'
    experienceLevel: 'beginner' | 'intermediate' | 'expert'
    industry?: string
    teamSize?: number
    location?: string
    deviceType: 'mobile' | 'tablet' | 'desktop'
    previousQuizzes: number
  }
  sessionData: {
    timeSpent: number
    questionHistory: QuizResponse[]
    clickPatterns: any[]
    scrollBehavior: any[]
  }
  externalContext: {
    timeOfDay: 'morning' | 'afternoon' | 'evening'
    dayOfWeek: string
    season: 'spring' | 'summer' | 'fall' | 'winter'
    marketConditions?: any
  }
}

interface PersonalizedContent {
  language: 'technical' | 'friendly' | 'professional'
  examples: string[]
  testimonials: any[]
  imagery: string[]
  messaging: {
    primary: string
    secondary: string
    callToAction: string
  }
  urgencyLevel: 'low' | 'medium' | 'high'
}

interface GeographicPersonalization {
  region: string
  localDealers: any[]
  regionalPreferences: any[]
  seasonalRecommendations: string[]
  localTestimonials: any[]
}

export class PersonalizationEngine {
  private personalizationRules = new Map<string, any>()
  private segmentProfiles = new Map<string, any>()

  constructor() {
    this.initializeSegmentProfiles()
    this.initializePersonalizationRules()
  }

  async personalizeQuestions(
    questions: QuizQuestion[],
    context: PersonalizationContext
  ): Promise<QuizQuestion[]> {
    const personalizedQuestions = [...questions]

    for (let i = 0; i < personalizedQuestions.length; i++) {
      let question = personalizedQuestions[i]
      
      // Personalize question content
      question.title = await this.personalizeQuestionTitle(question.title, context)
      question.subtitle = await this.personalizeQuestionSubtitle(question.subtitle, context)
      
      // Personalize options
      question.options = await this.personalizeOptions(question.options, context)
      
      // Add personalized insights
      question.insight = await this.generatePersonalizedInsight(question, context)
      
      // Adjust question difficulty based on experience
      question = await this.adjustQuestionComplexity(question, context)
      
      // Update the question in the array
      personalizedQuestions[i] = question
    }

    // Reorder questions based on user segment
    return this.optimizeQuestionOrder(personalizedQuestions, context)
  }

  async personalizeResults(
    recommendation: any,
    context: PersonalizationContext
  ): Promise<{
    personalizedRecommendation: any
    customizedMessaging: PersonalizedContent
    localizedContent: GeographicPersonalization
    industrySpecificInsights: any[]
  }> {
    // Personalize recommendation based on user profile
    const personalizedRecommendation = await this.customizeRecommendation(recommendation, context)
    
    // Generate personalized messaging
    const customizedMessaging = await this.generatePersonalizedMessaging(context)
    
    // Add geographic personalization
    const localizedContent = await this.addGeographicPersonalization(context)
    
    // Industry-specific insights
    const industrySpecificInsights = await this.generateIndustryInsights(context)

    return {
      personalizedRecommendation,
      customizedMessaging,
      localizedContent,
      industrySpecificInsights
    }
  }

  async adaptToRealTimeContext(
    currentContext: PersonalizationContext,
    recentBehavior: any[]
  ): Promise<{
    adaptedContent: PersonalizedContent
    behaviorPredictions: any[]
    interventionRecommendations: string[]
  }> {
    // Analyze recent behavior patterns
    const behaviorAnalysis = this.analyzeBehaviorPatterns(recentBehavior)
    
    // Predict user intentions
    const behaviorPredictions = await this.predictUserBehavior(behaviorAnalysis, currentContext)
    
    // Generate real-time content adaptations
    const adaptedContent = await this.generateAdaptedContent(behaviorAnalysis, currentContext)
    
    // Suggest interventions if needed
    const interventionRecommendations = this.generateInterventionRecommendations(
      behaviorAnalysis,
      currentContext
    )

    return {
      adaptedContent,
      behaviorPredictions,
      interventionRecommendations
    }
  }

  private async personalizeQuestionTitle(
    title: string | undefined,
    context: PersonalizationContext
  ): Promise<string> {
    if (!title) return ''

    const { userProfile } = context
    
    // Technical language for professionals
    if (userProfile.segment === 'professional' && userProfile.experienceLevel === 'expert') {
      return title.replace(/battery/gi, 'power solution')
        .replace(/tools/gi, 'equipment')
        .replace(/work/gi, 'operations')
    }
    
    // Friendly language for DIY users
    if (userProfile.segment === 'diy') {
      return title.replace(/contractor/gi, 'home improver')
        .replace(/crew/gi, 'family')
        .replace(/job site/gi, 'project')
    }
    
    // Fleet-specific language
    if (userProfile.segment === 'fleet_manager') {
      return title.replace(/tool/gi, 'asset')
        .replace(/battery/gi, 'power system')
        .replace(/work/gi, 'deployment')
    }

    return title
  }

  private async personalizeQuestionSubtitle(
    subtitle: string | undefined,
    context: PersonalizationContext
  ): Promise<string | undefined> {
    if (!subtitle) return undefined

    const { userProfile } = context
    
    // Add experience-appropriate context
    if (userProfile.experienceLevel === 'beginner') {
      return subtitle + ' (Don\'t worry - we\'ll guide you through this!)'
    }
    
    if (userProfile.experienceLevel === 'expert') {
      return subtitle + ' (Based on your professional requirements)'
    }

    return subtitle
  }

  private async personalizeOptions(
    options: any[],
    context: PersonalizationContext
  ): Promise<any[]> {
    return options.map(option => {
      // Add industry-specific context to options
      if (context.userProfile.industry) {
        option.description = this.addIndustryContext(option.description, context.userProfile.industry)
      }
      
      // Add experience-level appropriate details
      if (context.userProfile.experienceLevel === 'expert') {
        option.metadata = {
          ...option.metadata,
          technicalSpecs: this.getTechnicalSpecs(option.value),
          professionalInsights: this.getProfessionalInsights(option.value)
        }
      }
      
      return option
    })
  }

  private async generatePersonalizedInsight(
    question: QuizQuestion,
    context: PersonalizationContext
  ): Promise<any> {
    const { userProfile, sessionData, externalContext } = context
    
    // Generate insights based on user segment
    let insightType = 'tip'
    let title = 'Pro Tip'
    let description = ''

    if (userProfile.segment === 'professional') {
      insightType = 'performance'
      title = 'Professional Insight'
      description = this.generateProfessionalInsight(question, context)
    } else if (userProfile.segment === 'diy') {
      insightType = 'tip'
      title = 'Helpful Tip'
      description = this.generateDIYInsight(question, context)
    } else if (userProfile.segment === 'fleet_manager') {
      insightType = 'recommendation'
      title = 'Fleet Management Insight'
      description = this.generateFleetInsight(question, context)
    }

    return {
      type: insightType,
      title,
      description
    }
  }

  private async adjustQuestionComplexity(
    question: QuizQuestion,
    context: PersonalizationContext
  ): Promise<QuizQuestion> {
    const { userProfile } = context
    
    // Simplify for beginners
    if (userProfile.experienceLevel === 'beginner') {
      // Reduce number of options for complex questions
      if (question.options.length > 4) {
        question.options = question.options.slice(0, 4)
      }
      
      // Add helpful hints
      question.options.forEach(option => {
        if (!option.description) {
          option.description = this.generateBeginnerFriendlyDescription(option.value)
        }
      })
    }
    
    // Add advanced options for experts
    if (userProfile.experienceLevel === 'expert') {
      // Add technical details
      question.options.forEach(option => {
        option.metadata = {
          ...option.metadata,
          advancedFeatures: this.getAdvancedFeatures(option.value)
        }
      })
    }

    return question
  }

  private optimizeQuestionOrder(
    questions: QuizQuestion[],
    context: PersonalizationContext
  ): QuizQuestion[] {
    const { userProfile } = context
    
    // Professionals want efficiency - start with most impactful questions
    if (userProfile.segment === 'professional') {
      return questions.sort((a, b) => {
        const priorityMap: Record<string, number> = {
          'work-type': 1,
          'team-size': 2,
          'budget-range': 3,
          'tool-preferences': 4
        }
        return (priorityMap[a.id] || 99) - (priorityMap[b.id] || 99)
      })
    }
    
    // DIY users prefer gradual engagement
    if (userProfile.segment === 'diy') {
      return questions.sort((a, b) => {
        const easyFirstMap: Record<string, number> = {
          'tool-preferences': 1,
          'work-type': 2,
          'budget-range': 3,
          'team-size': 4
        }
        return (easyFirstMap[a.id] || 99) - (easyFirstMap[b.id] || 99)
      })
    }

    return questions
  }

  private async customizeRecommendation(
    recommendation: any,
    context: PersonalizationContext
  ): Promise<any> {
    const { userProfile } = context
    
    // Customize reasoning based on user segment
    if (userProfile.segment === 'professional') {
      recommendation.reasoning = recommendation.reasoning.map((reason: string) =>
        reason.replace(/save money/gi, 'optimize ROI')
          .replace(/convenient/gi, 'maximize efficiency')
      )
    }
    
    // Add segment-specific product suggestions
    if (userProfile.segment === 'fleet_manager') {
      recommendation.products.forEach((product: any) => {
        product.fleetBenefits = this.generateFleetBenefits(product)
      })
    }

    return recommendation
  }

  private async generatePersonalizedMessaging(
    context: PersonalizationContext
  ): Promise<PersonalizedContent> {
    const { userProfile, externalContext } = context
    
    let language: 'technical' | 'friendly' | 'professional' = 'friendly'
    let urgencyLevel: 'low' | 'medium' | 'high' = 'low'
    
    if (userProfile.segment === 'professional') {
      language = userProfile.experienceLevel === 'expert' ? 'technical' : 'professional'
      urgencyLevel = 'medium'
    }
    
    // Time-based urgency
    if (externalContext.timeOfDay === 'evening' || externalContext.dayOfWeek === 'Friday') {
      urgencyLevel = 'high'
    }

    return {
      language,
      examples: this.generatePersonalizedExamples(context),
      testimonials: this.selectRelevantTestimonials(context),
      imagery: this.selectPersonalizedImagery(context),
      messaging: {
        primary: this.generatePrimaryMessage(context),
        secondary: this.generateSecondaryMessage(context),
        callToAction: this.generateCallToAction(context)
      },
      urgencyLevel
    }
  }

  private async addGeographicPersonalization(
    context: PersonalizationContext
  ): Promise<GeographicPersonalization> {
    // Mock geographic data - in real implementation, this would use actual location services
    return {
      region: 'Northeast',
      localDealers: [
        { name: 'Professional Tool Supply', distance: 2.3, rating: 4.8 },
        { name: 'Contractor Central', distance: 5.1, rating: 4.6 }
      ],
      regionalPreferences: ['Cold weather performance', 'Indoor work focus'],
      seasonalRecommendations: this.getSeasonalRecommendations(context.externalContext.season),
      localTestimonials: this.getLocalTestimonials('Northeast')
    }
  }

  private async generateIndustryInsights(
    context: PersonalizationContext
  ): Promise<any[]> {
    const industry = context.userProfile.industry || 'general'
    
    const industryInsights: Record<string, any[]> = {
      electrical: [
        { insight: 'OSHA compliance requires backup power for safety equipment', priority: 'high' },
        { insight: 'Voltage consistency critical for sensitive electronics', priority: 'medium' }
      ],
      plumbing: [
        { insight: 'Water resistance crucial for basement and outdoor work', priority: 'high' },
        { insight: 'Compact batteries better for tight spaces', priority: 'medium' }
      ],
      hvac: [
        { insight: 'Temperature extremes affect battery performance', priority: 'high' },
        { insight: 'Extended runtime needed for system installations', priority: 'medium' }
      ]
    }

    return industryInsights[industry] || []
  }

  private initializeSegmentProfiles() {
    this.segmentProfiles.set('professional', {
      preferredLanguage: 'technical',
      priorityFactors: ['efficiency', 'reliability', 'ROI'],
      decisionSpeed: 'fast',
      trustFactors: ['specifications', 'warranties', 'peer_reviews']
    })

    this.segmentProfiles.set('diy', {
      preferredLanguage: 'friendly',
      priorityFactors: ['ease_of_use', 'value', 'versatility'],
      decisionSpeed: 'slow',
      trustFactors: ['ratings', 'tutorials', 'return_policy']
    })

    this.segmentProfiles.set('fleet_manager', {
      preferredLanguage: 'professional',
      priorityFactors: ['cost_efficiency', 'standardization', 'support'],
      decisionSpeed: 'medium',
      trustFactors: ['bulk_pricing', 'service_agreements', 'case_studies']
    })
  }

  private initializePersonalizationRules() {
    // Initialize context-based personalization rules
    this.personalizationRules.set('morning', {
      urgency: 'low',
      messaging: 'start_day_right',
      focus: 'planning'
    })

    this.personalizationRules.set('evening', {
      urgency: 'high',
      messaging: 'complete_today',
      focus: 'decision_making'
    })
  }

  // Helper methods for content generation
  private generateProfessionalInsight(question: QuizQuestion, context: PersonalizationContext): string {
    return `Based on 10,000+ contractor workflows, this choice impacts job completion efficiency by 15-25%.`
  }

  private generateDIYInsight(question: QuizQuestion, context: PersonalizationContext): string {
    return `Most home improvers find this works best for weekend projects and home maintenance tasks.`
  }

  private generateFleetInsight(question: QuizQuestion, context: PersonalizationContext): string {
    return `Fleet managers report 30% reduction in equipment downtime with this configuration.`
  }

  private generateBeginnerFriendlyDescription(value: string): string {
    const descriptions: Record<string, string> = {
      'dewalt': 'Popular professional brand, reliable and widely available',
      'milwaukee': 'High-performance tools, great for heavy-duty work',
      'commercial': 'Business and construction projects',
      'residential': 'Home improvement and repair projects'
    }
    return descriptions[value] || 'Great choice for most users'
  }

  private getAdvancedFeatures(value: string): string[] {
    const features: Record<string, string[]> = {
      'dewalt': ['Electronic cell protection', 'LED fuel gauge', 'XR Li-Ion technology'],
      'milwaukee': ['REDLITHIUM technology', 'Individual cell monitoring', 'Temperature management']
    }
    return features[value] || []
  }

  private analyzeBehaviorPatterns(behavior: any[]) {
    return {
      hesitationPoints: behavior.filter(b => b.type === 'long_pause').length,
      quickDecisions: behavior.filter(b => b.type === 'fast_click').length,
      backtracking: behavior.filter(b => b.type === 'back_button').length,
      scrollBehavior: behavior.filter(b => b.type === 'scroll').length
    }
  }

  private async predictUserBehavior(analysis: any, context: PersonalizationContext) {
    return [
      {
        prediction: 'likely_to_complete',
        confidence: analysis.hesitationPoints < 2 ? 0.8 : 0.4,
        reasoning: 'Low hesitation indicates engagement'
      },
      {
        prediction: 'needs_assistance',
        confidence: analysis.backtracking > 1 ? 0.7 : 0.2,
        reasoning: 'Multiple back actions suggest confusion'
      }
    ]
  }

  private async generateAdaptedContent(analysis: any, context: PersonalizationContext): Promise<PersonalizedContent> {
    return {
      language: analysis.hesitationPoints > 2 ? 'friendly' : 'professional',
      examples: [],
      testimonials: [],
      imagery: [],
      messaging: {
        primary: analysis.quickDecisions > 3 ? 'You know what you want!' : 'Let us help you decide',
        secondary: '',
        callToAction: 'Continue'
      },
      urgencyLevel: analysis.hesitationPoints > 2 ? 'low' : 'medium'
    }
  }

  private generateInterventionRecommendations(analysis: any, context: PersonalizationContext): string[] {
    const recommendations: string[] = []
    
    if (analysis.hesitationPoints > 2) {
      recommendations.push('Show help tooltip')
      recommendations.push('Offer live chat')
    }
    
    if (analysis.backtracking > 1) {
      recommendations.push('Simplify current question')
      recommendations.push('Add progress indicator')
    }

    return recommendations
  }

  private generatePersonalizedExamples(context: PersonalizationContext): string[] {
    const { userProfile } = context
    
    if (userProfile.segment === 'professional') {
      return ['Commercial construction site', 'Multi-story building project', 'Industrial installation']
    }
    
    return ['Kitchen renovation', 'Deck building', 'Garage organization']
  }

  private selectRelevantTestimonials(context: PersonalizationContext): any[] {
    // Return testimonials matching user segment
    return []
  }

  private selectPersonalizedImagery(context: PersonalizationContext): string[] {
    return []
  }

  private generatePrimaryMessage(context: PersonalizationContext): string {
    const { userProfile } = context
    
    if (userProfile.segment === 'professional') {
      return 'Optimize your crew\'s productivity'
    }
    
    return 'Power through your projects'
  }

  private generateSecondaryMessage(context: PersonalizationContext): string {
    return 'Trusted by contractors nationwide'
  }

  private generateCallToAction(context: PersonalizationContext): string {
    const { userProfile } = context
    
    if (userProfile.segment === 'fleet_manager') {
      return 'Get Volume Pricing'
    }
    
    return 'Shop Now'
  }

  private getSeasonalRecommendations(season: string): string[] {
    const seasonal: Record<string, string[]> = {
      winter: ['Cold weather performance batteries', 'Indoor project focus'],
      spring: ['Outdoor project preparation', 'Landscaping tools'],
      summer: ['Extended runtime for long days', 'Heat-resistant options'],
      fall: ['Winterization projects', 'Indoor preparation']
    }
    
    return seasonal[season] || []
  }

  private getLocalTestimonials(region: string): any[] {
    return [
      {
        name: 'Local Contractor',
        company: `${region} Construction`,
        quote: 'Perfect for our local climate and work conditions'
      }
    ]
  }

  private addIndustryContext(description: string | undefined, industry: string): string {
    if (!description) return ''
    
    const industryContexts: Record<string, string> = {
      electrical: '(ideal for electrical work)',
      plumbing: '(great for plumbing applications)',
      hvac: '(perfect for HVAC installations)'
    }
    
    return description + ' ' + (industryContexts[industry] || '')
  }

  private getTechnicalSpecs(value: string): any {
    return { voltage: '20V', chemistry: 'Li-Ion', cellCount: 10 }
  }

  private getProfessionalInsights(value: string): string[] {
    return ['Professional grade', 'Commercial warranty', 'Bulk pricing available']
  }

  private generateFleetBenefits(product: any): string[] {
    return [
      'Standardized across fleet',
      'Volume pricing available',
      'Centralized warranty management'
    ]
  }
}