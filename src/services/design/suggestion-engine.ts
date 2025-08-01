import { EngraveParameters, ChatMessage, DesignIntention } from '@/types/design'

export class SuggestionEngine {
  generateContextualSuggestions(
    currentDesign: EngraveParameters,
    customerType: string,
    conversationHistory: ChatMessage[]
  ): string[] {
    const suggestions: string[] = []
    
    // Analyze current design state
    const designAnalysis = this.analyzeDesign(currentDesign)
    
    // Generate suggestions based on missing elements
    this.addMissingSuggestions(designAnalysis, suggestions)
    
    // Add customer-type specific suggestions
    this.addCustomerTypeSuggestions(customerType, currentDesign, suggestions)
    
    // Add conversation-context suggestions
    this.addConversationSuggestions(conversationHistory, suggestions)
    
    // Add improvement suggestions
    this.addImprovementSuggestions(currentDesign, suggestions)
    
    // Remove duplicates and limit to top suggestions
    const uniqueSuggestions = [...new Set(suggestions)]
    
    // Rank suggestions by relevance
    return this.rankSuggestions(uniqueSuggestions, currentDesign, customerType).slice(0, 4)
  }
  
  private analyzeDesign(design: EngraveParameters) {
    return {
      hasText: design.primaryText && design.primaryText.length > 0,
      hasSecondaryText: design.showSecondaryText && design.secondaryText.length > 0,
      hasCustomPosition: design.textXPosition !== 0 || design.textYPosition !== 0,
      hasCustomFont: design.fontFamily !== 'Arial',
      hasCustomSize: design.textSize !== 0.15,
      hasDeepEngraving: design.engravingDepth > 0.06,
      isMinimal: this.isDesignMinimal(design),
      isComplex: this.isDesignComplex(design)
    }
  }
  
  private addMissingSuggestions(analysis: any, suggestions: string[]) {
    if (!analysis.hasText) {
      suggestions.push("Add your company name or personal text")
      suggestions.push("Try: 'Put ACME CONSTRUCTION in the center'")
    }
    
    if (analysis.hasText && !analysis.hasSecondaryText) {
      suggestions.push("Add your phone number or contact information")
      suggestions.push("Include a tagline or department name")
    }
    
    if (!analysis.hasCustomPosition) {
      suggestions.push("Try positioning the text at the top or bottom")
      suggestions.push("Move the text to the left or right side")
    }
    
    if (!analysis.hasCustomFont) {
      suggestions.push("Try a different font style like Helvetica or Georgia")
      suggestions.push("Use Courier New for an industrial look")
    }
    
    if (!analysis.hasDeepEngraving) {
      suggestions.push("Make the engraving deeper for outdoor durability")
    }
  }
  
  private addCustomerTypeSuggestions(customerType: string, design: EngraveParameters, suggestions: string[]) {
    switch (customerType) {
      case 'contractor':
        suggestions.push("Add your license number for compliance")
        suggestions.push("Try deeper engraving for job site durability")
        suggestions.push("Include your trade or specialty")
        if (!design.primaryText.includes('#') && !design.secondaryText.includes('#')) {
          suggestions.push("Add a tool or equipment number")
        }
        break
        
      case 'business':
        suggestions.push("Include your company website or email")
        suggestions.push("Add your business phone number")
        suggestions.push("Try a professional font like Helvetica")
        suggestions.push("Center the text for a professional look")
        break
        
      case 'personal':
        suggestions.push("Add your initials or full name")
        suggestions.push("Include a motivational quote or phrase")
        suggestions.push("Try an elegant font like Georgia")
        suggestions.push("Add the date you got the tool")
        break
        
      default:
        suggestions.push("Tell me what type of work you do for better suggestions")
        suggestions.push("Are you a contractor, business owner, or personal user?")
        break
    }
  }
  
  private addConversationSuggestions(history: ChatMessage[], suggestions: string[]) {
    const recentMessages = history.slice(-3)
    const mentionedTerms = this.extractMentionedTerms(recentMessages)
    
    // Suggest based on conversation flow
    if (mentionedTerms.includes('company') && !mentionedTerms.includes('phone')) {
      suggestions.push("Add your company phone number below the name")
    }
    
    if (mentionedTerms.includes('professional') && !mentionedTerms.includes('center')) {
      suggestions.push("Center the text for a more professional appearance")
    }
    
    if (mentionedTerms.includes('outdoor') && !mentionedTerms.includes('deep')) {
      suggestions.push("Use deeper engraving for outdoor durability")
    }
    
    if (mentionedTerms.includes('bold') && !mentionedTerms.includes('size')) {
      suggestions.push("Make the text larger for more impact")
    }
    
    // Suggest refinements based on previous changes
    const lastMessage = recentMessages[recentMessages.length - 1]
    if (lastMessage && lastMessage.intentions) {
      const lastIntentions = lastMessage.intentions
      
      if (lastIntentions.some(i => i.type === 'text')) {
        suggestions.push("Adjust the position or size of your new text")
        suggestions.push("Try a different font style")
      }
      
      if (lastIntentions.some(i => i.type === 'position')) {
        suggestions.push("Fine-tune the text size for this position")
        suggestions.push("Add secondary text to balance the layout")
      }
    }
  }
  
  private addImprovementSuggestions(design: EngraveParameters, suggestions: string[]) {
    // Size-based suggestions
    if (design.textSize < 0.12) {
      suggestions.push("Make the text larger for better readability")
    } else if (design.textSize > 0.20) {
      suggestions.push("Make the text smaller to fit better")
    }
    
    // Position-based suggestions
    if (Math.abs(design.textXPosition) > 0.8) {
      suggestions.push("Move the text closer to center for balance")
    }
    
    // Depth-based suggestions
    if (design.engravingDepth < 0.04) {
      suggestions.push("Increase engraving depth for better visibility")
    }
    
    // Font-specific suggestions
    if (design.fontFamily === 'Times New Roman') {
      suggestions.push("Try Arial or Helvetica for modern industrial look")
    }
    
    // Combination suggestions
    if (design.textSize > 0.18 && design.primaryText.length > 15) {
      suggestions.push("Either make the text smaller or shorter for better fit")
    }
  }
  
  private extractMentionedTerms(messages: ChatMessage[]): string[] {
    const terms: string[] = []
    const keywords = [
      'company', 'business', 'phone', 'professional', 'center', 'left', 'right',
      'top', 'bottom', 'bold', 'size', 'big', 'small', 'deep', 'outdoor',
      'industrial', 'elegant', 'name', 'contact', 'number'
    ]
    
    messages.forEach(message => {
      const content = message.content.toLowerCase()
      keywords.forEach(keyword => {
        if (content.includes(keyword)) {
          terms.push(keyword)
        }
      })
    })
    
    return terms
  }
  
  private isDesignMinimal(design: EngraveParameters): boolean {
    return design.primaryText.length < 5 && 
           !design.showSecondaryText &&
           design.textSize <= 0.15 &&
           design.textXPosition === 0 &&
           design.textYPosition === 0
  }
  
  private isDesignComplex(design: EngraveParameters): boolean {
    return design.primaryText.length > 15 ||
           (design.showSecondaryText && design.secondaryText.length > 10) ||
           Math.abs(design.textXPosition) > 0.5 ||
           Math.abs(design.textYPosition) > 0.3
  }
  
  private rankSuggestions(suggestions: string[], design: EngraveParameters, customerType: string): string[] {
    // Simple ranking based on relevance
    const ranked = suggestions.map(suggestion => ({
      text: suggestion,
      score: this.calculateSuggestionScore(suggestion, design, customerType)
    }))
    
    ranked.sort((a, b) => b.score - a.score)
    return ranked.map(item => item.text)
  }
  
  private calculateSuggestionScore(suggestion: string, design: EngraveParameters, customerType: string): number {
    let score = 1
    
    // Higher score for customer-type relevant suggestions
    if (customerType === 'contractor') {
      if (suggestion.includes('license') || suggestion.includes('durability') || suggestion.includes('job site')) {
        score += 3
      }
    }
    
    if (customerType === 'business') {
      if (suggestion.includes('professional') || suggestion.includes('website') || suggestion.includes('phone')) {
        score += 3
      }
    }
    
    // Higher score for addressing current design gaps
    if (!design.showSecondaryText && suggestion.includes('phone')) {
      score += 2
    }
    
    if (design.textSize < 0.12 && suggestion.includes('larger')) {
      score += 2
    }
    
    if (design.engravingDepth < 0.05 && suggestion.includes('deeper')) {
      score += 2
    }
    
    // Lower score for redundant suggestions
    if (design.primaryText.includes('COMPANY') && suggestion.includes('company name')) {
      score -= 1
    }
    
    return score
  }
  
  // Generate quick action suggestions for common requests
  generateQuickActions(design: EngraveParameters): Array<{ text: string, action: string }> {
    const actions = []
    
    // Text actions
    if (design.primaryText === 'YOUR COMPANY') {
      actions.push({
        text: "Add my company name",
        action: "Put [YOUR COMPANY NAME] in bold letters"
      })
    }
    
    // Size actions
    actions.push({
      text: "Make it bigger",
      action: "Make the text larger and more prominent"
    })
    
    actions.push({
      text: "Make it smaller",
      action: "Make the text smaller and more subtle"
    })
    
    // Position actions
    actions.push({
      text: "Move to top",
      action: "Move the text to the top of the battery"
    })
    
    actions.push({
      text: "Center it",
      action: "Center the text on the battery"
    })
    
    // Style actions
    actions.push({
      text: "Make it professional",
      action: "Make it look professional for business use"
    })
    
    actions.push({
      text: "Make it bold",
      action: "Make the text bold and prominent"
    })
    
    return actions.slice(0, 6)
  }
}

export const suggestionEngine = new SuggestionEngine()