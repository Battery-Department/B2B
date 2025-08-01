// Design system types
export interface DesignContext {
  customerType?: 'contractor' | 'personal' | 'business'
  previousDesigns?: DesignHistory[]
  batteryModel?: '6Ah' | '9Ah' | '15Ah'
  orderQuantity?: number
  industryHints?: string[]
  conversationHistory?: ChatMessage[]
}

export interface DesignHistory {
  id: string
  parameters: EngraveParameters
  timestamp: Date
  userSatisfaction?: number
}

export interface DesignIntention {
  type: 'text' | 'position' | 'style' | 'logo' | 'technical'
  confidence: number
  parameters: Partial<EngraveParameters>
  description: string
  reasoning: string
}

export interface DesignResult {
  intentions: DesignIntention[]
  response: string
  confidence: number
  suggestions?: string[]
  warnings?: string[]
  cached?: boolean
  usedFallback?: boolean
  processingTimeMs?: number
  // Claude 4 enhancements
  thinkingUsed?: boolean
  thinkingTokens?: number
  filesAnalyzed?: string[]
  enhancedProcessing?: boolean
  stopReason?: 'end_turn' | 'max_tokens' | 'refusal'
  modelVersion?: string
}

export interface EngraveParameters {
  // Text content
  primaryText: string
  secondaryText: string
  showSecondaryText: boolean
  
  // Typography
  fontSize: number
  fontFamily: string
  textAlign: string
  
  // Positioning
  textXPosition: number
  textYPosition: number
  textSize: number
  
  // Technical
  engravingDepth: number
  
  // Logo
  logoImage?: string | null
  logoUrl?: string | null
  showLogo: boolean
  logoScale: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  confidence?: number
  suggestions?: string[]
  designApplied?: boolean
  intentions?: DesignIntention[]
  processingTimeMs?: number
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info'
  message: string
  suggestion?: string
  parameter?: keyof EngraveParameters
}

export interface ValidationResult {
  isValid: boolean
  issues: ValidationIssue[]
  score: number // 0-100 quality score
}

export interface DesignVariation {
  id: string
  name: string
  description: string
  changes: Partial<EngraveParameters>
  previewUrl?: string
  confidence: number
}

export interface ConversationContext {
  sessionId: string
  messageCount: number
  customerPreferences: CustomerPreferences
  designEvolution: DesignSnapshot[]
  lastActivity: Date
}

export interface CustomerPreferences {
  preferredFonts: string[]
  typicalTextLength: number
  industryContext: string
  stylePreference: 'professional' | 'bold' | 'elegant' | 'industrial'
}

export interface DesignSnapshot {
  parameters: EngraveParameters
  timestamp: Date
  userFeedback?: 'positive' | 'negative' | 'neutral'
  modifications?: string[]
}

export interface DesignMetrics {
  sessionId: string
  totalIterations: number
  finalConfidence: number
  timeToCompletion: number
  conversionToOrder: boolean
  userSatisfactionScore?: number
}

// Voice recognition types
export interface VoiceRecognitionState {
  isListening: boolean
  isSupported: boolean
  confidence: number
  partialTranscript: string
  finalTranscript: string
  error?: string
}

// Template matching types
export interface DesignTemplate {
  id: string
  name: string
  description: string
  category: 'business' | 'personal' | 'industrial' | 'creative'
  parameters: EngraveParameters
  popularity: number
  tags: string[]
}

export interface TemplateMatch {
  template: DesignTemplate
  similarity: number
  adaptationSuggestions: string[]
}