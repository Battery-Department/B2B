import { QuizResponse, QuizRecommendation, RecommendedProduct } from '@/types/quiz-v2'

interface RecommendationContext {
  abTestVariant?: string
  sessionId: string
}

export class RecommendationEngine {
  private products = [
    {
      id: 'flexvolt-6ah',
      name: 'FlexVolt 6Ah Battery',
      sku: 'DCB606',
      price: 95,
      specs: { capacity: 6, voltage: '20V/60V', runtime: 'medium' }
    },
    {
      id: 'flexvolt-9ah',
      name: 'FlexVolt 9Ah Battery',
      sku: 'DCB609',
      price: 125,
      specs: { capacity: 9, voltage: '20V/60V', runtime: 'high' }
    },
    {
      id: 'flexvolt-15ah',
      name: 'FlexVolt 15Ah Battery',
      sku: 'DCB615',
      price: 245,
      specs: { capacity: 15, voltage: '20V/60V', runtime: 'extended' }
    }
  ]

  async generateRecommendation(
    responses: QuizResponse[],
    context: RecommendationContext
  ): Promise<QuizRecommendation> {
    // Analyze responses to determine user needs
    const analysis = this.analyzeResponses(responses)
    
    // Generate product recommendations based on analysis
    const recommendedProducts = this.selectProducts(analysis)
    
    // Calculate pricing and discounts
    const totalPrice = recommendedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0)
    const discountInfo = this.calculateVolumeDiscount(totalPrice)
    
    // Generate reasoning
    const reasoning = this.generateReasoning(analysis, recommendedProducts)
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(responses, recommendedProducts)

    return {
      products: recommendedProducts,
      totalPrice,
      discountAmount: discountInfo.amount,
      discountPercentage: discountInfo.percentage,
      reasoning,
      confidence,
      peerComparison: await this.getPeerComparison(analysis)
    }
  }

  private analyzeResponses(responses: QuizResponse[]) {
    const analysis: any = {
      workType: 'general',
      teamSize: 1,
      budget: 'medium',
      toolBrands: [],
      usage: 'moderate',
      priorities: []
    }

    responses.forEach(response => {
      // Analyze work type
      if (response.questionId.includes('work-type')) {
        analysis.workType = response.selectedOptions[0] || 'general'
      }
      
      // Analyze team size
      if (response.questionId.includes('team') || response.questionId.includes('crew')) {
        const teamIndicators = response.selectedOptions.join(' ').toLowerCase()
        if (teamIndicators.includes('large') || teamIndicators.includes('multiple')) {
          analysis.teamSize = 5
        } else if (teamIndicators.includes('medium') || teamIndicators.includes('crew')) {
          analysis.teamSize = 3
        }
      }
      
      // Analyze budget
      if (response.questionId.includes('budget')) {
        const budgetRange = response.selectedOptions[0]
        analysis.budget = budgetRange
      }
      
      // Analyze tool preferences
      if (response.questionId.includes('tool') || response.questionId.includes('brand')) {
        analysis.toolBrands = response.selectedOptions
      }
      
      // Analyze usage patterns
      if (response.questionId.includes('usage') || response.questionId.includes('hour')) {
        const usageLevel = response.selectedOptions.join(' ').toLowerCase()
        if (usageLevel.includes('heavy') || usageLevel.includes('all day')) {
          analysis.usage = 'heavy'
        } else if (usageLevel.includes('light') || usageLevel.includes('occasional')) {
          analysis.usage = 'light'
        }
      }
    })

    return analysis
  }

  private selectProducts(analysis: any): RecommendedProduct[] {
    const recommendations: RecommendedProduct[] = []
    
    // Base recommendation logic
    if (analysis.usage === 'heavy' || analysis.teamSize > 3) {
      // Heavy usage: recommend 15Ah + 9Ah combination
      recommendations.push({
        id: 'flexvolt-15ah',
        name: 'FlexVolt 15Ah Battery',
        sku: 'DCB615',
        price: 245,
        quantity: 2,
        reason: 'Extended runtime for heavy-duty work and multiple crews',
        matchScore: 95
      })
      
      recommendations.push({
        id: 'flexvolt-9ah',
        name: 'FlexVolt 9Ah Battery',
        sku: 'DCB609',
        price: 125,
        quantity: 2,
        reason: 'Backup power with excellent performance balance',
        matchScore: 88
      })
    } else if (analysis.teamSize > 1 || analysis.usage === 'moderate') {
      // Medium usage: recommend 9Ah + 6Ah combination
      recommendations.push({
        id: 'flexvolt-9ah',
        name: 'FlexVolt 9Ah Battery',
        sku: 'DCB609',
        price: 125,
        quantity: 2,
        reason: 'Optimal balance of runtime and weight for team work',
        matchScore: 92
      })
      
      recommendations.push({
        id: 'flexvolt-6ah',
        name: 'FlexVolt 6Ah Battery',
        sku: 'DCB606',
        price: 95,
        quantity: 2,
        reason: 'Lightweight backup for detailed work and rotating crews',
        matchScore: 85
      })
    } else {
      // Light usage: recommend 6Ah starter pack
      recommendations.push({
        id: 'flexvolt-6ah',
        name: 'FlexVolt 6Ah Battery',
        sku: 'DCB606',
        price: 95,
        quantity: 3,
        reason: 'Perfect starter pack for individual contractors',
        matchScore: 90
      })
    }

    // Budget adjustment
    if (analysis.budget === 'under-500') {
      // Reduce quantities to fit budget
      recommendations.forEach(rec => rec.quantity = Math.max(1, rec.quantity - 1))
    } else if (analysis.budget === 'over-5000') {
      // Increase quantities for enterprise
      recommendations.forEach(rec => rec.quantity += 1)
    }

    return recommendations
  }

  private calculateVolumeDiscount(totalPrice: number) {
    let percentage = 0
    if (totalPrice >= 5000) percentage = 20
    else if (totalPrice >= 2500) percentage = 15
    else if (totalPrice >= 1000) percentage = 10

    return {
      percentage,
      amount: totalPrice * (percentage / 100)
    }
  }

  private generateReasoning(analysis: any, products: RecommendedProduct[]): string[] {
    const reasoning: string[] = []
    
    if (analysis.teamSize > 1) {
      reasoning.push(`Recommended for ${analysis.teamSize}-person crew with rotating battery needs`)
    }
    
    if (analysis.usage === 'heavy') {
      reasoning.push('High-capacity batteries selected for all-day performance')
    }
    
    if (products.length > 1) {
      reasoning.push('Mixed capacity approach provides flexibility and backup power')
    }
    
    reasoning.push('FlexVolt compatibility ensures future tool expansion')
    reasoning.push('Volume pricing optimized based on professional contractor usage patterns')
    
    return reasoning
  }

  private calculateConfidence(responses: QuizResponse[], products: RecommendedProduct[]): number {
    // Base confidence on response completeness and product match
    const responseCompleteness = responses.length / 5 // Assuming 5 total questions
    const productMatchAvg = products.reduce((sum, p) => sum + p.matchScore, 0) / products.length / 100
    
    return Math.min(0.95, (responseCompleteness * 0.4 + productMatchAvg * 0.6))
  }

  private async getPeerComparison(analysis: any) {
    // Mock peer comparison data (in real implementation, this would query actual user data)
    const similarUsers = analysis.teamSize > 3 ? 2840 : analysis.teamSize > 1 ? 5620 : 3750
    const satisfactionRate = analysis.usage === 'heavy' ? 94 : 91
    const averageSpend = analysis.teamSize > 3 ? 3200 : analysis.teamSize > 1 ? 1650 : 750

    return {
      similarUsers,
      satisfactionRate,
      averageSpend
    }
  }
}