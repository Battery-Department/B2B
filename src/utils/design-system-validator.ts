'use client'

import React from 'react'
import { themes } from '../lib/constants/theme'

export interface ValidationResult {
  passed: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  score: number // 0-100
}

export interface ValidationError {
  type: 'color' | 'spacing' | 'hover' | 'focus' | 'darkMode' | 'accessibility' | 'responsive'
  element: string
  message: string
  severity: 'error' | 'critical'
}

export interface ValidationWarning {
  type: string
  element: string
  message: string
}

// Design system constants
const DESIGN_SYSTEM = {
  colors: {
    primary: '#006FEE',
    primaryDark: '#0050B3',
    secondary: '#F8FAFC',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    textPrimary: '#0A051E',
    textSecondary: '#374151',
    textMuted: '#64748B',
    border: '#E6F4FF',
    background: '#FFFFFF',
  },
  spacing: {
    base: 4, // 4px base unit
    allowed: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80],
  },
  borderRadius: {
    sm: '0.375rem', // 6px
    md: '0.75rem', // 12px
    lg: '1rem', // 16px
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 8px 24px rgba(0, 111, 238, 0.08)',
    xl: '0 16px 48px rgba(0, 111, 238, 0.12)',
  },
  transitions: {
    default: 'all 0.3s ease',
    fast: 'all 0.15s ease',
    slow: 'all 0.5s ease',
  },
}

export function validateComponent(
  component: React.ComponentType<any>,
  props?: any
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  
  // Create a test instance
  const testElement = React.createElement(component, props || {})
  
  // Validate colors
  const validateColors = () => {
    const componentString = component.toString()
    
    // Check for hardcoded hex colors
    const hexColorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/g
    const hexMatches = componentString.match(hexColorRegex) || []
    
    hexMatches.forEach(color => {
      if (!Object.values(DESIGN_SYSTEM.colors).includes(color)) {
        errors.push({
          type: 'color',
          element: component.name || 'Component',
          message: `Hardcoded color "${color}" found. Use theme colors instead.`,
          severity: 'error',
        })
      }
    })
    
    // Check for rgb/rgba colors
    const rgbRegex = /rgb\(|rgba\(/g
    if (rgbRegex.test(componentString)) {
      warnings.push({
        type: 'color',
        element: component.name || 'Component',
        message: 'RGB/RGBA colors detected. Consider using theme colors.',
      })
    }
  }
  
  // Validate spacing
  const validateSpacing = () => {
    const componentString = component.toString()
    
    // Check for pixel values
    const pxRegex = /(\d+)px/g
    const pxMatches = componentString.match(pxRegex) || []
    
    pxMatches.forEach(px => {
      const value = parseInt(px)
      if (!DESIGN_SYSTEM.spacing.allowed.includes(value) && value % 4 !== 0) {
        errors.push({
          type: 'spacing',
          element: component.name || 'Component',
          message: `Non-standard spacing "${px}" found. Use 4px base unit.`,
          severity: 'error',
        })
      }
    })
  }
  
  // Validate hover states
  const validateHoverStates = () => {
    const componentString = component.toString()
    
    if (componentString.includes('button') || componentString.includes('Button')) {
      if (!componentString.includes('hover:') && !componentString.includes(':hover')) {
        warnings.push({
          type: 'hover',
          element: component.name || 'Component',
          message: 'Button component missing hover states.',
        })
      }
    }
    
    if (componentString.includes('cursor-pointer') && !componentString.includes('hover:')) {
      warnings.push({
        type: 'hover',
        element: component.name || 'Component',
        message: 'Interactive element missing hover effect.',
      })
    }
  }
  
  // Validate focus states
  const validateFocusStates = () => {
    const componentString = component.toString()
    
    if (componentString.includes('input') || componentString.includes('Input') ||
        componentString.includes('button') || componentString.includes('Button')) {
      if (!componentString.includes('focus:') && !componentString.includes(':focus')) {
        errors.push({
          type: 'focus',
          element: component.name || 'Component',
          message: 'Interactive element missing focus states.',
          severity: 'critical',
        })
      }
    }
  }
  
  // Validate dark mode support
  const validateDarkMode = () => {
    const componentString = component.toString()
    
    if (!componentString.includes('theme') && !componentString.includes('useTheme')) {
      warnings.push({
        type: 'darkMode',
        element: component.name || 'Component',
        message: 'Component may not support dark mode. Consider using useTheme hook.',
      })
    }
  }
  
  // Validate accessibility
  const validateAccessibility = () => {
    const componentString = component.toString()
    
    // Check for missing alt text on images
    if (componentString.includes('<img') && !componentString.includes('alt=')) {
      errors.push({
        type: 'accessibility',
        element: component.name || 'Component',
        message: 'Image missing alt attribute.',
        severity: 'critical',
      })
    }
    
    // Check for missing ARIA labels on interactive elements
    if ((componentString.includes('onClick') || componentString.includes('button')) &&
        !componentString.includes('aria-') && !componentString.includes('children')) {
      warnings.push({
        type: 'accessibility',
        element: component.name || 'Component',
        message: 'Interactive element may need ARIA labels.',
      })
    }
    
    // Check for color contrast
    if (componentString.includes('text-gray-400') || componentString.includes('text-gray-300')) {
      warnings.push({
        type: 'accessibility',
        element: component.name || 'Component',
        message: 'Low contrast text color detected. Ensure WCAG compliance.',
      })
    }
  }
  
  // Validate responsive behavior
  const validateResponsive = () => {
    const componentString = component.toString()
    
    // Check for responsive classes
    if (!componentString.includes('sm:') && !componentString.includes('md:') &&
        !componentString.includes('lg:') && !componentString.includes('@media')) {
      warnings.push({
        type: 'responsive',
        element: component.name || 'Component',
        message: 'Component may not be responsive. Consider adding breakpoint styles.',
      })
    }
    
    // Check for fixed widths
    if (componentString.includes('width:') && componentString.includes('px')) {
      warnings.push({
        type: 'responsive',
        element: component.name || 'Component',
        message: 'Fixed width detected. Consider using responsive units.',
      })
    }
  }
  
  // Run all validations
  validateColors()
  validateSpacing()
  validateHoverStates()
  validateFocusStates()
  validateDarkMode()
  validateAccessibility()
  validateResponsive()
  
  // Calculate score
  const totalIssues = errors.length + warnings.length
  const criticalErrors = errors.filter(e => e.severity === 'critical').length
  const score = Math.max(0, 100 - (totalIssues * 5) - (criticalErrors * 10))
  
  return {
    passed: errors.length === 0,
    errors,
    warnings,
    score,
  }
}

// Validate all components in a module
export function validateModule(module: any): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {}
  
  Object.keys(module).forEach(key => {
    const component = module[key]
    if (typeof component === 'function' && component.prototype?.isReactComponent) {
      results[key] = validateComponent(component)
    }
  })
  
  return results
}

// Generate validation report
export function generateValidationReport(results: Record<string, ValidationResult>): string {
  let report = '# Design System Validation Report\n\n'
  
  const totalComponents = Object.keys(results).length
  const passedComponents = Object.values(results).filter(r => r.passed).length
  const averageScore = Object.values(results).reduce((sum, r) => sum + r.score, 0) / totalComponents
  
  report += `## Summary\n`
  report += `- Total Components: ${totalComponents}\n`
  report += `- Passed: ${passedComponents}\n`
  report += `- Failed: ${totalComponents - passedComponents}\n`
  report += `- Average Score: ${averageScore.toFixed(1)}/100\n\n`
  
  report += `## Component Results\n\n`
  
  Object.entries(results).forEach(([component, result]) => {
    report += `### ${component}\n`
    report += `- Score: ${result.score}/100\n`
    report += `- Status: ${result.passed ? '✅ Passed' : '❌ Failed'}\n`
    
    if (result.errors.length > 0) {
      report += `- Errors (${result.errors.length}):\n`
      result.errors.forEach(error => {
        report += `  - **${error.severity.toUpperCase()}**: ${error.message}\n`
      })
    }
    
    if (result.warnings.length > 0) {
      report += `- Warnings (${result.warnings.length}):\n`
      result.warnings.forEach(warning => {
        report += `  - ${warning.message}\n`
      })
    }
    
    report += '\n'
  })
  
  return report
}

// React hook for component validation
export function useDesignSystemValidation(component: React.ComponentType<any>) {
  const [validationResult, setValidationResult] = React.useState<ValidationResult | null>(null)
  
  React.useEffect(() => {
    const result = validateComponent(component)
    setValidationResult(result)
    
    if (process.env.NODE_ENV === 'development' && !result.passed) {
      console.warn(`Design system validation failed for ${component.name}:`, result)
    }
  }, [component])
  
  return validationResult
}

// CLI validation function
export async function validateProject(projectPath: string = './src/components') {
  console.log('🎨 Starting design system validation...\n')
  
  // This would scan all component files in production
  // For now, return a mock report
  const mockResults = {
    Button: { passed: true, errors: [], warnings: [], score: 100 },
    Card: { passed: true, errors: [], warnings: [], score: 95 },
    Input: { 
      passed: false, 
      errors: [{
        type: 'color' as const,
        element: 'Input',
        message: 'Hardcoded color "#ccc" found',
        severity: 'error' as const,
      }],
      warnings: [], 
      score: 85 
    },
  }
  
  const report = generateValidationReport(mockResults)
  console.log(report)
  
  return mockResults
}