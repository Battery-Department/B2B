import { ABTestVariant } from '@/types/quiz-v2'

export class ABTestingService {
  private variants: ABTestVariant[] = [
    {
      id: 'control',
      name: 'Control - Standard Quiz',
      description: 'Original quiz flow with basic recommendations',
      startDate: '2024-01-01',
      metrics: {
        views: 0,
        completions: 0,
        conversionRate: 0,
        averageOrderValue: 0
      }
    },
    {
      id: 'community-insights',
      name: 'Community Insights Enhanced',
      description: 'Quiz with real-time peer statistics and contractor validation',
      questionOrder: ['work-type', 'team-size', 'tools', 'budget', 'priorities'],
      contentChanges: {
        showPeerStats: true,
        showContractorValidation: true,
        enhancedResults: true
      },
      startDate: '2024-01-15',
      metrics: {
        views: 0,
        completions: 0,
        conversionRate: 0,
        averageOrderValue: 0
      }
    },
    {
      id: 'social-proof',
      name: 'Social Proof Focus',
      description: 'Heavy emphasis on testimonials and community data',
      contentChanges: {
        testimonialCount: 5,
        socialProofWeight: 'high',
        trustIndicators: true
      },
      startDate: '2024-02-01',
      metrics: {
        views: 0,
        completions: 0,
        conversionRate: 0,
        averageOrderValue: 0
      }
    }
  ]

  assignVariant(sessionId: string): string {
    // Simple hash-based assignment for consistent user experience
    const hash = this.simpleHash(sessionId)
    const variants = this.getActiveVariants()
    
    if (variants.length === 0) return 'control'
    
    const index = hash % variants.length
    return variants[index].id
  }

  getVariant(variantId: string): ABTestVariant | null {
    return this.variants.find(v => v.id === variantId) || null
  }

  getActiveVariants(): ABTestVariant[] {
    const now = new Date()
    return this.variants.filter(variant => {
      const startDate = new Date(variant.startDate)
      const endDate = variant.endDate ? new Date(variant.endDate) : null
      
      return startDate <= now && (!endDate || endDate >= now)
    })
  }

  async trackEvent(variantId: string, event: 'view' | 'completion' | 'conversion', value?: number) {
    const variant = this.getVariant(variantId)
    if (!variant) return

    // In a real implementation, this would update database records
    // For now, we'll just log the event
    console.log(`A/B Test Event: ${variantId} - ${event}${value ? ` ($${value})` : ''}`)
    
    // Update in-memory metrics (in real app, this would be persistent)
    switch (event) {
      case 'view':
        variant.metrics.views++
        break
      case 'completion':
        variant.metrics.completions++
        variant.metrics.conversionRate = (variant.metrics.completions / variant.metrics.views) * 100
        break
      case 'conversion':
        if (value) {
          const totalValue = variant.metrics.averageOrderValue * variant.metrics.completions + value
          variant.metrics.averageOrderValue = totalValue / (variant.metrics.completions + 1)
        }
        break
    }
  }

  getVariantConfig(variantId: string) {
    const variant = this.getVariant(variantId)
    if (!variant) return null

    return {
      id: variant.id,
      name: variant.name,
      questionOrder: variant.questionOrder,
      contentChanges: variant.contentChanges || {}
    }
  }

  async getTestResults(): Promise<{
    variants: ABTestVariant[]
    winner?: string
    confidence?: number
    recommendations: string[]
  }> {
    const activeVariants = this.getActiveVariants()
    
    // Calculate statistical significance (simplified)
    let winner: string | undefined
    let confidence: number | undefined
    
    if (activeVariants.length >= 2) {
      const sortedByConversion = activeVariants.sort((a, b) => 
        b.metrics.conversionRate - a.metrics.conversionRate
      )
      
      const best = sortedByConversion[0]
      const second = sortedByConversion[1]
      
      // Simple confidence calculation (in real app, would use proper statistical tests)
      if (best.metrics.views > 100 && second.metrics.views > 100) {
        const difference = best.metrics.conversionRate - second.metrics.conversionRate
        confidence = Math.min(95, difference * 5) // Simplified confidence
        
        if (confidence > 80) {
          winner = best.id
        }
      }
    }

    return {
      variants: activeVariants,
      winner,
      confidence,
      recommendations: this.generateRecommendations(activeVariants)
    }
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  private generateRecommendations(variants: ABTestVariant[]): string[] {
    const recommendations: string[] = []
    
    const bestConversion = Math.max(...variants.map(v => v.metrics.conversionRate))
    const bestAOV = Math.max(...variants.map(v => v.metrics.averageOrderValue))
    
    if (bestConversion > 0) {
      const winner = variants.find(v => v.metrics.conversionRate === bestConversion)
      recommendations.push(`${winner?.name} shows highest conversion rate at ${bestConversion.toFixed(1)}%`)
    }
    
    if (bestAOV > 0) {
      const aovWinner = variants.find(v => v.metrics.averageOrderValue === bestAOV)
      recommendations.push(`${aovWinner?.name} drives highest order value at $${bestAOV.toFixed(0)}`)
    }
    
    // Add sample size recommendations
    const minViews = Math.min(...variants.map(v => v.metrics.views))
    if (minViews < 100) {
      recommendations.push('Increase sample size to at least 100 views per variant for reliable results')
    }
    
    return recommendations
  }
}