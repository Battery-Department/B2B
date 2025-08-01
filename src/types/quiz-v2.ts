// Enhanced Quiz Types with Community Stats
export interface QuizQuestion {
  id: string
  type: 'single-choice' | 'multi-choice' | 'tool-selection' | 'budget' | 'brand'
  title: string
  subtitle?: string
  options: QuizOption[]
  insight?: QuizInsight
  allowMultiple?: boolean
  required?: boolean
  order: number
}

export interface QuizOption {
  id: string
  label: string
  value: string
  description?: string
  image?: string
  stats?: {
    percentage: number
    userCount: number
    trend?: 'up' | 'down' | 'stable'
  }
  metadata?: Record<string, any>
}

export interface QuizInsight {
  type: 'tip' | 'recommendation' | 'warning' | 'info'
  title?: string
  description: string
  relatedOptions?: string[] // Option IDs that this insight relates to
}

export interface QuizResponse {
  questionId: string
  selectedOptions: string[]
  timestamp: number
  timeSpent: number // seconds spent on this question
}

export interface QuizSession {
  id: string
  userId?: string
  startedAt: string
  completedAt?: string
  responses: QuizResponse[]
  recommendation?: QuizRecommendation
  abTestVariant?: string
  source?: string
  deviceType?: 'mobile' | 'tablet' | 'desktop'
}

export interface QuizRecommendation {
  products: RecommendedProduct[]
  totalPrice: number
  discountAmount: number
  discountPercentage: number
  reasoning: string[]
  confidence: number // 0-1 confidence score
  peerComparison?: {
    similarUsers: number
    satisfactionRate: number
    averageSpend: number
  }
}

export interface RecommendedProduct {
  id: string
  name: string
  sku: string
  price: number
  quantity: number
  reason: string
  matchScore: number // 0-100 how well this matches user needs
}

export interface CommunityStats {
  totalResponses: number
  optionDistribution: Record<string, number>
  averageTimeSpent: number
  completionRate: number
  dropOffPoint?: string // Question ID where most users drop off
  popularCombinations?: Array<{
    options: string[]
    percentage: number
  }>
}

export interface ContractorTestimonial {
  id: string
  name: string
  company: string
  role: string
  quote: string
  image?: string
  verified: boolean
  products: string[]
  rating: number
}

export interface ABTestVariant {
  id: string
  name: string
  description: string
  questionOrder?: string[]
  contentChanges?: Record<string, any>
  startDate: string
  endDate?: string
  metrics: {
    views: number
    completions: number
    conversionRate: number
    averageOrderValue: number
  }
}