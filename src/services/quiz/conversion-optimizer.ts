import { QuizResponse, QuizRecommendation } from '@/types/quiz-v2'

interface ConversionTrigger {
  type: 'urgency' | 'social_proof' | 'discount' | 'bundle' | 'guarantee'
  priority: number
  content: string
  action?: string
  metadata?: any
}

interface PricingOptimization {
  basePrice: number
  optimizedPrice: number
  discountPercentage: number
  discountReason: string
  bundleRecommendation?: {
    items: string[]
    bundlePrice: number
    savings: number
  }
}

interface UserPsychProfile {
  pricesensitivity: 'low' | 'medium' | 'high'
  decisionSpeed: 'fast' | 'medium' | 'slow'
  trustLevel: 'high' | 'medium' | 'low'
  valueOrientation: 'premium' | 'value' | 'budget'
}

export class ConversionOptimizer {
  private conversionRules = new Map<string, any>()
  private pricingMatrix = new Map<string, PricingOptimization>()

  async optimizePricing(
    quizResponses: QuizResponse[],
    userProfile?: any
  ): Promise<PricingOptimization> {
    // Analyze quiz responses to determine pricing strategy
    const psychProfile = this.buildPsychProfile(quizResponses)
    const budgetIndication = this.extractBudgetSignals(quizResponses)
    const urgencyLevel = this.assessUrgency(quizResponses)

    // Base pricing from quiz recommendation
    const baseRecommendation = await this.getBaseRecommendation(quizResponses)
    const basePrice = baseRecommendation.totalPrice

    // Apply optimization logic
    let optimizedPrice = basePrice
    let discountPercentage = 0
    let discountReason = ''

    // Budget-conscious users get volume discounts
    if (psychProfile.pricesensitivity === 'high') {
      if (basePrice >= 1000) {
        discountPercentage = 15
        discountReason = 'Volume discount for smart shopping'
        optimizedPrice = basePrice * 0.85
      } else {
        discountPercentage = 10
        discountReason = 'New customer discount'
        optimizedPrice = basePrice * 0.9
      }
    }

    // Premium users get bundle upgrades
    if (psychProfile.valueOrientation === 'premium') {
      const bundleRecommendation = this.generatePremiumBundle(quizResponses, basePrice)
      if (bundleRecommendation) {
        return {
          basePrice,
          optimizedPrice: bundleRecommendation.bundlePrice,
          discountPercentage: 0,
          discountReason: 'Premium bundle recommendation',
          bundleRecommendation
        }
      }
    }

    // Urgency-based pricing
    if (urgencyLevel === 'high') {
      discountPercentage = Math.max(discountPercentage, 12)
      discountReason = 'Limited-time quiz completion bonus'
      optimizedPrice = basePrice * (1 - discountPercentage / 100)
    }

    return {
      basePrice,
      optimizedPrice,
      discountPercentage,
      discountReason,
      bundleRecommendation: this.generateSmartBundle(quizResponses, optimizedPrice)
    }
  }

  async prePopulateCart(
    quizResults: QuizRecommendation,
    optimizedPricing: PricingOptimization
  ): Promise<{
    cartItems: any[]
    appliedDiscounts: any[]
    urgencyTimers: any[]
    recommendations: string[]
  }> {
    const cartItems: any[] = []
    const appliedDiscounts: any[] = []

    // Add recommended products to cart
    quizResults.products.forEach(product => {
      cartItems.push({
        productId: product.id,
        quantity: product.quantity,
        originalPrice: product.price,
        discountedPrice: product.price * (1 - optimizedPricing.discountPercentage / 100),
        reason: product.reason,
        quizRecommended: true
      })
    })

    // Apply quiz-specific discount
    if (optimizedPricing.discountPercentage > 0) {
      appliedDiscounts.push({
        type: 'quiz_completion',
        amount: optimizedPricing.basePrice - optimizedPricing.optimizedPrice,
        percentage: optimizedPricing.discountPercentage,
        reason: optimizedPricing.discountReason,
        expiresIn: 30 * 60 * 1000 // 30 minutes
      })
    }

    // Add bundle items if recommended
    if (optimizedPricing.bundleRecommendation) {
      optimizedPricing.bundleRecommendation.items.forEach(itemId => {
        if (!cartItems.find(item => item.productId === itemId)) {
          cartItems.push({
            productId: itemId,
            quantity: 1,
            bundleItem: true,
            discountedPrice: this.getBundleItemPrice(itemId)
          })
        }
      })
    }

    // Generate urgency timers
    const urgencyTimers = [{
      type: 'quiz_discount',
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
      message: 'Your quiz discount expires in'
    }]

    // Smart recommendations for cart optimization
    const recommendations = [
      'Complete your purchase within 30 minutes to secure your quiz discount',
      'Add 2 more batteries to qualify for free shipping',
      'Consider our starter kit for additional savings'
    ]

    return { cartItems, appliedDiscounts, urgencyTimers, recommendations }
  }

  async getConversionTriggers(
    sessionId: string,
    quizResponses: QuizResponse[],
    timeSpent: number
  ): Promise<ConversionTrigger[]> {
    const triggers: ConversionTrigger[] = []
    const psychProfile = this.buildPsychProfile(quizResponses)

    // Social proof triggers
    if (psychProfile.trustLevel !== 'high') {
      triggers.push({
        type: 'social_proof',
        priority: 8,
        content: '2,847 contractors completed this quiz this month',
        metadata: { testimonialCount: 127, averageRating: 4.8 }
      })

      triggers.push({
        type: 'social_proof', 
        priority: 7,
        content: '94% of contractors who bought these products would recommend them',
        metadata: { satisfactionRate: 94, reviewCount: 1234 }
      })
    }

    // Urgency triggers for slow decision makers
    if (psychProfile.decisionSpeed === 'slow' || timeSpent > 180) {
      triggers.push({
        type: 'urgency',
        priority: 9,
        content: 'Quiz discount valid for next 30 minutes only',
        action: 'countdown_timer',
        metadata: { expiresAt: Date.now() + 30 * 60 * 1000 }
      })
    }

    // Discount triggers for price-sensitive users
    if (psychProfile.pricesensitivity === 'high') {
      triggers.push({
        type: 'discount',
        priority: 10,
        content: 'Save up to 20% with volume pricing',
        action: 'show_volume_discounts',
        metadata: { maxDiscount: 20, threshold: 5000 }
      })
    }

    // Bundle triggers for value-oriented users
    if (psychProfile.valueOrientation === 'value') {
      triggers.push({
        type: 'bundle',
        priority: 6,
        content: 'Get a complete power solution - starter kit saves $85',
        action: 'show_bundle_options',
        metadata: { bundleSavings: 85 }
      })
    }

    // Guarantee triggers for trust-building
    triggers.push({
      type: 'guarantee',
      priority: 5,
      content: '30-day money-back guarantee + 3-year warranty',
      metadata: { guaranteeDays: 30, warrantyYears: 3 }
    })

    // Sort by priority and return top triggers
    return triggers.sort((a, b) => b.priority - a.priority).slice(0, 3)
  }

  async optimizeCheckoutFlow(
    cartData: any[],
    userBehavior: any
  ): Promise<{
    recommendedFlow: string[]
    skipSteps: string[]
    emphasisPoints: string[]
    trustSignals: string[]
  }> {
    const psychProfile = this.buildPsychProfile(userBehavior.quizResponses || [])
    
    // Standard checkout flow
    let recommendedFlow = [
      'cart_review',
      'shipping_info',
      'payment_method',
      'order_review',
      'confirmation'
    ]

    let skipSteps: string[] = []
    let emphasisPoints: string[] = []
    let trustSignals: string[] = []

    // Fast decision makers get express flow
    if (psychProfile.decisionSpeed === 'fast') {
      recommendedFlow = ['cart_review', 'express_checkout', 'confirmation']
      skipSteps = ['shipping_info', 'payment_method'] // Combined in express
      emphasisPoints = ['one_click_purchase', 'saved_payment_methods']
    }

    // Trust-sensitive users need more assurance
    if (psychProfile.trustLevel === 'low') {
      trustSignals = [
        'ssl_security_badge',
        'money_back_guarantee',
        'customer_reviews_summary',
        'secure_payment_icons',
        'business_credentials'
      ]
      emphasisPoints.push('security_assurance')
    }

    // Price-sensitive users need cost breakdown
    if (psychProfile.pricesensitivity === 'high') {
      emphasisPoints.push('cost_breakdown', 'savings_summary', 'no_hidden_fees')
    }

    return { recommendedFlow, skipSteps, emphasisPoints, trustSignals }
  }

  private buildPsychProfile(responses: QuizResponse[]): UserPsychProfile {
    let pricesensitivity: 'low' | 'medium' | 'high' = 'medium'
    let decisionSpeed: 'fast' | 'medium' | 'slow' = 'medium'
    let trustLevel: 'high' | 'medium' | 'low' = 'medium'
    let valueOrientation: 'premium' | 'value' | 'budget' = 'value'

    // Analyze budget responses
    const budgetResponse = responses.find(r => r.questionId.includes('budget'))
    if (budgetResponse) {
      const budgetChoice = budgetResponse.selectedOptions[0]
      if (budgetChoice?.includes('under-500') || budgetChoice?.includes('1000')) {
        pricesensitivity = 'high'
        valueOrientation = 'budget'
      } else if (budgetChoice?.includes('over-5000')) {
        pricesensitivity = 'low'
        valueOrientation = 'premium'
      }
    }

    // Analyze response speed patterns
    const avgResponseTime = responses.reduce((sum, r) => sum + r.timeSpent, 0) / responses.length
    if (avgResponseTime < 8) {
      decisionSpeed = 'fast'
    } else if (avgResponseTime > 20) {
      decisionSpeed = 'slow'
    }

    // Analyze tool brand preferences (premium brands = higher trust)
    const toolResponse = responses.find(r => r.questionId.includes('tool'))
    if (toolResponse?.selectedOptions.includes('dewalt') || 
        toolResponse?.selectedOptions.includes('milwaukee')) {
      trustLevel = 'high'
      valueOrientation = 'premium'
    }

    return { pricesensitivity, decisionSpeed, trustLevel, valueOrientation }
  }

  private extractBudgetSignals(responses: QuizResponse[]): number {
    const budgetResponse = responses.find(r => r.questionId.includes('budget'))
    if (!budgetResponse) return 1000 // Default

    const budgetChoice = budgetResponse.selectedOptions[0]
    if (budgetChoice?.includes('under-500')) return 400
    if (budgetChoice?.includes('500-1000')) return 750
    if (budgetChoice?.includes('1000-2500')) return 1750
    if (budgetChoice?.includes('2500-5000')) return 3500
    if (budgetChoice?.includes('over-5000')) return 7500

    return 1000
  }

  private assessUrgency(responses: QuizResponse[]): 'low' | 'medium' | 'high' {
    // Check for urgency indicators in responses
    const workTypeResponse = responses.find(r => r.questionId.includes('work'))
    const hasUrgentWork = workTypeResponse?.selectedOptions.some(opt => 
      opt.includes('commercial') || opt.includes('deadline')
    )

    const totalTime = responses.reduce((sum, r) => sum + r.timeSpent, 0)
    const isQuickCompletion = totalTime < 90 // Under 90 seconds

    if (hasUrgentWork && isQuickCompletion) return 'high'
    if (hasUrgentWork || isQuickCompletion) return 'medium'
    return 'low'
  }

  private async getBaseRecommendation(responses: QuizResponse[]): Promise<QuizRecommendation> {
    // Simplified base recommendation calculation
    return {
      products: [
        {
          id: 'flexvolt-9ah',
          name: 'FlexVolt 9Ah Battery',
          sku: 'DCB609',
          price: 125,
          quantity: 2,
          reason: 'Optimal for your workflow',
          matchScore: 92
        }
      ],
      totalPrice: 250,
      discountAmount: 0,
      discountPercentage: 0,
      reasoning: ['Based on your quiz responses'],
      confidence: 0.9
    }
  }

  private generatePremiumBundle(responses: QuizResponse[], basePrice: number) {
    if (basePrice < 500) return null

    return {
      items: ['flexvolt-9ah', 'flexvolt-15ah', 'dual-charger'],
      bundlePrice: basePrice * 1.2,
      savings: basePrice * 0.15
    }
  }

  private generateSmartBundle(responses: QuizResponse[], price: number) {
    if (price < 300) return null

    return {
      items: ['flexvolt-9ah', 'flexvolt-6ah'],
      bundlePrice: price * 1.1,
      savings: price * 0.05
    }
  }

  private getBundleItemPrice(itemId: string): number {
    const prices: Record<string, number> = {
      'flexvolt-6ah': 95,
      'flexvolt-9ah': 125,
      'flexvolt-15ah': 245,
      'dual-charger': 85
    }
    return prices[itemId] || 100
  }
}