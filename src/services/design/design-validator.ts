import { EngraveParameters, ValidationResult, ValidationIssue } from '@/types/design'

export class DesignValidator {
  validateDesign(parameters: EngraveParameters): ValidationResult {
    const issues: ValidationIssue[] = []
    
    // Text length validation
    this.validateTextLength(parameters, issues)
    
    // Position feasibility
    this.validatePositioning(parameters, issues)
    
    // Size and readability
    this.validateSizeAndReadability(parameters, issues)
    
    // Engraving depth validation
    this.validateEngravingDepth(parameters, issues)
    
    // Font and alignment compatibility
    this.validateFontCompatibility(parameters, issues)
    
    // Calculate overall quality score
    const score = this.calculateQualityScore(parameters, issues)
    
    return {
      isValid: issues.filter(i => i.type === 'error').length === 0,
      issues,
      score
    }
  }
  
  private validateTextLength(parameters: EngraveParameters, issues: ValidationIssue[]) {
    // Primary text validation
    if (parameters.primaryText.length > 20) {
      issues.push({
        type: 'warning',
        message: 'Primary text may be too long for optimal readability',
        suggestion: 'Consider shortening to 20 characters or less',
        parameter: 'primaryText'
      })
    }
    
    if (parameters.primaryText.length > 30) {
      issues.push({
        type: 'error',
        message: 'Primary text is too long for laser engraving constraints',
        suggestion: 'Reduce to 30 characters maximum',
        parameter: 'primaryText'
      })
    }
    
    // Secondary text validation
    if (parameters.showSecondaryText && parameters.secondaryText.length > 30) {
      issues.push({
        type: 'warning',
        message: 'Secondary text may be difficult to read when engraved',
        suggestion: 'Consider shortening secondary text',
        parameter: 'secondaryText'
      })
    }
  }
  
  private validatePositioning(parameters: EngraveParameters, issues: ValidationIssue[]) {
    // Check if large text fits at edge positions
    if (parameters.textSize > 0.18 && Math.abs(parameters.textXPosition) > 0.5) {
      issues.push({
        type: 'error',
        message: 'Large text cannot fit at edge positions',
        suggestion: 'Use center position or reduce text size',
        parameter: 'textXPosition'
      })
    }
    
    // Warn about extreme positioning
    if (Math.abs(parameters.textXPosition) > 1.0) {
      issues.push({
        type: 'warning',
        message: 'Text positioned very close to battery edge',
        suggestion: 'Consider moving closer to center for better visibility',
        parameter: 'textXPosition'
      })
    }
    
    if (Math.abs(parameters.textYPosition) > 0.4) {
      issues.push({
        type: 'warning',
        message: 'Text positioned at extreme vertical position',
        suggestion: 'Consider more centered vertical positioning',
        parameter: 'textYPosition'
      })
    }
  }
  
  private validateSizeAndReadability(parameters: EngraveParameters, issues: ValidationIssue[]) {
    // Minimum readable size
    if (parameters.textSize < 0.10) {
      issues.push({
        type: 'warning',
        message: 'Text may be too small to read clearly',
        suggestion: 'Increase text size to at least 0.10 for better readability',
        parameter: 'textSize'
      })
    }
    
    // Maximum practical size
    if (parameters.textSize > 0.22) {
      issues.push({
        type: 'warning',
        message: 'Text may be too large for battery surface',
        suggestion: 'Consider reducing text size or shortening text',
        parameter: 'textSize'
      })
    }
    
    // Font and size combination
    if (parameters.fontFamily === 'Georgia' && parameters.textSize > 0.18) {
      issues.push({
        type: 'info',
        message: 'Elegant fonts work best at moderate sizes',
        suggestion: 'Consider reducing size slightly for better proportion',
        parameter: 'textSize'
      })
    }
  }
  
  private validateEngravingDepth(parameters: EngraveParameters, issues: ValidationIssue[]) {
    // Minimum depth for visibility
    if (parameters.engravingDepth < 0.02) {
      issues.push({
        type: 'warning',
        message: 'Engraving may be too shallow to see clearly',
        suggestion: 'Increase depth to at least 0.02mm',
        parameter: 'engravingDepth'
      })
    }
    
    // Maximum safe depth
    if (parameters.engravingDepth > 0.12) {
      issues.push({
        type: 'error',
        message: 'Engraving depth may damage battery casing',
        suggestion: 'Reduce depth to 0.12mm or less for safety',
        parameter: 'engravingDepth'
      })
    }
    
    // Optimal depth recommendations
    if (parameters.engravingDepth >= 0.08) {
      issues.push({
        type: 'info',
        message: 'Deep engraving provides excellent durability for outdoor use',
        suggestion: 'Great choice for contractor and industrial applications'
      })
    }
  }
  
  private validateFontCompatibility(parameters: EngraveParameters, issues: ValidationIssue[]) {
    // Font recommendations based on use case
    const industrialFonts = ['Courier New', 'Arial']
    const businessFonts = ['Helvetica', 'Arial']
    const elegantFonts = ['Georgia', 'Times New Roman']
    
    // Small size with decorative fonts
    if (parameters.textSize < 0.12 && elegantFonts.includes(parameters.fontFamily)) {
      issues.push({
        type: 'warning',
        message: 'Decorative fonts may not be clear at small sizes',
        suggestion: 'Use Arial or Helvetica for better clarity at small sizes',
        parameter: 'fontFamily'
      })
    }
    
    // Alignment with certain fonts
    if (parameters.fontFamily === 'Courier New' && parameters.textAlign !== 'left') {
      issues.push({
        type: 'info',
        message: 'Monospace fonts often look best with left alignment',
        suggestion: 'Consider left alignment for technical appearance',
        parameter: 'textAlign'
      })
    }
  }
  
  private calculateQualityScore(parameters: EngraveParameters, issues: ValidationIssue[]): number {
    let score = 100
    
    // Deduct points for issues
    issues.forEach(issue => {
      switch (issue.type) {
        case 'error':
          score -= 20
          break
        case 'warning':
          score -= 10
          break
        case 'info':
          score -= 2
          break
      }
    })
    
    // Bonus points for good practices
    if (parameters.textSize >= 0.12 && parameters.textSize <= 0.18) {
      score += 5 // Good readable size
    }
    
    if (parameters.engravingDepth >= 0.04 && parameters.engravingDepth <= 0.08) {
      score += 5 // Good durability depth
    }
    
    if (parameters.primaryText.length >= 3 && parameters.primaryText.length <= 15) {
      score += 5 // Good text length
    }
    
    if (Math.abs(parameters.textXPosition) <= 0.5 && Math.abs(parameters.textYPosition) <= 0.3) {
      score += 5 // Good positioning
    }
    
    return Math.max(0, Math.min(100, score))
  }
  
  // Get design recommendations based on customer type
  getRecommendationsForCustomerType(customerType: string): Partial<EngraveParameters> {
    switch (customerType) {
      case 'contractor':
        return {
          fontFamily: 'Arial',
          textSize: 0.16,
          engravingDepth: 0.08, // Deep for durability
          textAlign: 'center'
        }
        
      case 'business':
        return {
          fontFamily: 'Helvetica',
          textSize: 0.15,
          engravingDepth: 0.05,
          textAlign: 'center'
        }
        
      case 'personal':
        return {
          fontFamily: 'Georgia',
          textSize: 0.14,
          engravingDepth: 0.04,
          textAlign: 'center'
        }
        
      default:
        return {
          fontFamily: 'Arial',
          textSize: 0.15,
          engravingDepth: 0.05,
          textAlign: 'center'
        }
    }
  }
  
  // Quick validation for API responses
  quickValidate(parameters: Partial<EngraveParameters>): boolean {
    // Check for critical issues only
    if (parameters.textSize && parameters.textSize > 0.25) return false
    if (parameters.engravingDepth && parameters.engravingDepth > 0.15) return false
    if (parameters.primaryText && parameters.primaryText.length > 30) return false
    if (parameters.textXPosition && Math.abs(parameters.textXPosition) > 1.5) return false
    if (parameters.textYPosition && Math.abs(parameters.textYPosition) > 0.5) return false
    
    return true
  }
}

export const designValidator = new DesignValidator()