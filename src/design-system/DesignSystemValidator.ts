import { ReactElement, ComponentType } from 'react'

// Design System Types
export interface DesignTokens {
  colors: {
    primary: Record<string, string>
    secondary: Record<string, string>
    neutral: Record<string, string>
    semantic: {
      success: Record<string, string>
      warning: Record<string, string>
      error: Record<string, string>
      info: Record<string, string>
    }
  }
  typography: {
    fontFamilies: Record<string, string>
    fontSizes: Record<string, string>
    fontWeights: Record<string, number>
    lineHeights: Record<string, number>
    letterSpacing: Record<string, string>
  }
  spacing: Record<string, string>
  borderRadius: Record<string, string>
  shadows: Record<string, string>
  breakpoints: Record<string, string>
  zIndex: Record<string, number>
}

export interface ComponentSpec {
  name: string
  variants?: string[]
  sizes?: string[]
  states?: string[]
  requiredProps?: string[]
  allowedProps?: string[]
  constraints?: {
    maxChildren?: number
    minChildren?: number
    allowedChildren?: string[]
    forbiddenChildren?: string[]
  }
  accessibility?: {
    requiredAttributes?: string[]
    requiredRoles?: string[]
    keyboardNavigation?: boolean
    screenReaderSupport?: boolean
  }
}

export interface ValidationRule {
  name: string
  description: string
  severity: 'error' | 'warning' | 'info'
  validate: (element: ReactElement, spec: ComponentSpec, tokens: DesignTokens) => ValidationResult
}

export interface ValidationResult {
  passed: boolean
  message: string
  suggestion?: string
  fix?: () => void
}

export interface ValidationReport {
  componentName: string
  results: Array<ValidationResult & { rule: string; severity: string }>
  score: number
  passed: boolean
}

// Design Tokens Definition
export const designTokens: DesignTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      900: '#1e3a8a'
    },
    secondary: {
      50: '#f9fafb',
      100: '#f3f4f6',
      500: '#6b7280',
      600: '#4b5563',
      900: '#111827'
    },
    neutral: {
      white: '#ffffff',
      black: '#000000',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    },
    semantic: {
      success: {
        50: '#ecfdf5',
        100: '#d1fae5',
        500: '#10b981',
        600: '#059669',
        900: '#064e3b'
      },
      warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        500: '#f59e0b',
        600: '#d97706',
        900: '#78350f'
      },
      error: {
        50: '#fef2f2',
        100: '#fee2e2',
        500: '#ef4444',
        600: '#dc2626',
        900: '#7f1d1d'
      },
      info: {
        50: '#eff6ff',
        100: '#dbeafe',
        500: '#3b82f6',
        600: '#2563eb',
        900: '#1e3a8a'
      }
    }
  },
  typography: {
    fontFamilies: {
      sans: 'system-ui, -apple-system, sans-serif',
      serif: 'Georgia, serif',
      mono: 'Monaco, monospace'
    },
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    fontWeights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeights: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em'
    }
  },
  spacing: {
    px: '1px',
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem'
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  zIndex: {
    hide: -1,
    auto: 0,
    base: 1,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800
  }
}

// Component Specifications
export const componentSpecs: Record<string, ComponentSpec> = {
  Button: {
    name: 'Button',
    variants: ['primary', 'secondary', 'danger', 'ghost'],
    sizes: ['small', 'medium', 'large'],
    states: ['default', 'hover', 'active', 'disabled', 'loading'],
    requiredProps: ['children'],
    allowedProps: ['variant', 'size', 'disabled', 'loading', 'onClick', 'type', 'className'],
    accessibility: {
      requiredAttributes: ['type'],
      keyboardNavigation: true,
      screenReaderSupport: true
    }
  },
  Modal: {
    name: 'Modal',
    requiredProps: ['children'],
    allowedProps: ['isOpen', 'onClose', 'size', 'className'],
    constraints: {
      minChildren: 1
    },
    accessibility: {
      requiredAttributes: ['role', 'aria-modal'],
      requiredRoles: ['dialog'],
      keyboardNavigation: true,
      screenReaderSupport: true
    }
  },
  Input: {
    name: 'Input',
    variants: ['default', 'error', 'success'],
    sizes: ['small', 'medium', 'large'],
    states: ['default', 'focus', 'disabled', 'readonly'],
    requiredProps: [],
    allowedProps: ['type', 'value', 'defaultValue', 'placeholder', 'disabled', 'readOnly', 'onChange', 'className'],
    accessibility: {
      requiredAttributes: ['type'],
      keyboardNavigation: true,
      screenReaderSupport: true
    }
  }
}

// Validation Rules
export const validationRules: ValidationRule[] = [
  {
    name: 'prop-validation',
    description: 'Validates that component props match specification',
    severity: 'error',
    validate: (element, spec) => {
      const elementProps = Object.keys(element.props || {})
      const invalidProps = elementProps.filter(prop => 
        spec.allowedProps && !spec.allowedProps.includes(prop) && prop !== 'children'
      )
      
      return {
        passed: invalidProps.length === 0,
        message: invalidProps.length > 0 
          ? `Invalid props found: ${invalidProps.join(', ')}`
          : 'All props are valid',
        suggestion: invalidProps.length > 0
          ? `Remove invalid props or add them to the component specification`
          : undefined
      }
    }
  },
  {
    name: 'required-props',
    description: 'Validates that all required props are present',
    severity: 'error',
    validate: (element, spec) => {
      const elementProps = Object.keys(element.props || {})
      const missingProps = (spec.requiredProps || []).filter(prop => !elementProps.includes(prop))
      
      return {
        passed: missingProps.length === 0,
        message: missingProps.length > 0
          ? `Missing required props: ${missingProps.join(', ')}`
          : 'All required props are present',
        suggestion: missingProps.length > 0
          ? `Add the missing required props to the component`
          : undefined
      }
    }
  },
  {
    name: 'variant-validation',
    description: 'Validates that variant prop uses allowed values',
    severity: 'warning',
    validate: (element, spec) => {
      const variant = element.props?.variant
      if (!variant) {
        return { passed: true, message: 'No variant specified' }
      }
      
      const validVariants = spec.variants || []
      const isValid = validVariants.includes(variant)
      
      return {
        passed: isValid,
        message: isValid
          ? `Variant "${variant}" is valid`
          : `Invalid variant "${variant}". Valid variants: ${validVariants.join(', ')}`,
        suggestion: !isValid
          ? `Use one of the valid variants: ${validVariants.join(', ')}`
          : undefined
      }
    }
  },
  {
    name: 'size-validation',
    description: 'Validates that size prop uses allowed values',
    severity: 'warning',
    validate: (element, spec) => {
      const size = element.props?.size
      if (!size) {
        return { passed: true, message: 'No size specified' }
      }
      
      const validSizes = spec.sizes || []
      const isValid = validSizes.includes(size)
      
      return {
        passed: isValid,
        message: isValid
          ? `Size "${size}" is valid`
          : `Invalid size "${size}". Valid sizes: ${validSizes.join(', ')}`,
        suggestion: !isValid
          ? `Use one of the valid sizes: ${validSizes.join(', ')}`
          : undefined
      }
    }
  },
  {
    name: 'accessibility-attributes',
    description: 'Validates accessibility attributes are present',
    severity: 'error',
    validate: (element, spec) => {
      const props = element.props || {}
      const requiredAttrs = spec.accessibility?.requiredAttributes || []
      const missingAttrs = requiredAttrs.filter(attr => !(attr in props))
      
      return {
        passed: missingAttrs.length === 0,
        message: missingAttrs.length > 0
          ? `Missing accessibility attributes: ${missingAttrs.join(', ')}`
          : 'All accessibility attributes are present',
        suggestion: missingAttrs.length > 0
          ? `Add the missing accessibility attributes for better screen reader support`
          : undefined
      }
    }
  },
  {
    name: 'design-token-usage',
    description: 'Validates that custom styles use design tokens',
    severity: 'info',
    validate: (element, spec, tokens) => {
      const className = element.props?.className || ''
      const style = element.props?.style || {}
      
      // Check for hardcoded colors in style
      const hardcodedColors = Object.values(style).some((value: any) => 
        typeof value === 'string' && /^#[0-9A-F]{6}$/i.test(value)
      )
      
      return {
        passed: !hardcodedColors,
        message: hardcodedColors
          ? 'Hardcoded colors found in style prop'
          : 'No hardcoded colors detected',
        suggestion: hardcodedColors
          ? 'Consider using design tokens for colors instead of hardcoded values'
          : undefined
      }
    }
  }
]

// Design System Validator Class
export class DesignSystemValidator {
  private tokens: DesignTokens
  private specs: Record<string, ComponentSpec>
  private rules: ValidationRule[]

  constructor(
    tokens: DesignTokens = designTokens,
    specs: Record<string, ComponentSpec> = componentSpecs,
    rules: ValidationRule[] = validationRules
  ) {
    this.tokens = tokens
    this.specs = specs
    this.rules = rules
  }

  validateComponent(element: ReactElement): ValidationReport {
    const componentName = this.getComponentName(element)
    const spec = this.specs[componentName]

    if (!spec) {
      return {
        componentName,
        results: [{
          passed: false,
          message: `No specification found for component "${componentName}"`,
          rule: 'component-spec',
          severity: 'warning'
        }],
        score: 0,
        passed: false
      }
    }

    const results = this.rules.map(rule => {
      const result = rule.validate(element, spec, this.tokens)
      return {
        ...result,
        rule: rule.name,
        severity: rule.severity
      }
    })

    const score = this.calculateScore(results)
    const passed = results.every(result => result.passed || result.severity !== 'error')

    return {
      componentName,
      results,
      score,
      passed
    }
  }

  validateMultipleComponents(elements: ReactElement[]): ValidationReport[] {
    return elements.map(element => this.validateComponent(element))
  }

  generateReport(reports: ValidationReport[]): string {
    const totalScore = reports.reduce((sum, report) => sum + report.score, 0) / reports.length
    const passedCount = reports.filter(report => report.passed).length
    
    let output = `Design System Validation Report\n`
    output += `================================\n\n`
    output += `Overall Score: ${Math.round(totalScore)}%\n`
    output += `Components Passed: ${passedCount}/${reports.length}\n\n`

    reports.forEach(report => {
      output += `Component: ${report.componentName}\n`
      output += `Score: ${Math.round(report.score)}% | Status: ${report.passed ? 'PASSED' : 'FAILED'}\n`
      
      const errors = report.results.filter(r => !r.passed && r.severity === 'error')
      const warnings = report.results.filter(r => !r.passed && r.severity === 'warning')
      const info = report.results.filter(r => !r.passed && r.severity === 'info')

      if (errors.length > 0) {
        output += `  Errors (${errors.length}):\n`
        errors.forEach(error => {
          output += `    • ${error.message}\n`
          if (error.suggestion) {
            output += `      Suggestion: ${error.suggestion}\n`
          }
        })
      }

      if (warnings.length > 0) {
        output += `  Warnings (${warnings.length}):\n`
        warnings.forEach(warning => {
          output += `    • ${warning.message}\n`
          if (warning.suggestion) {
            output += `      Suggestion: ${warning.suggestion}\n`
          }
        })
      }

      if (info.length > 0) {
        output += `  Info (${info.length}):\n`
        info.forEach(infoItem => {
          output += `    • ${infoItem.message}\n`
          if (infoItem.suggestion) {
            output += `      Suggestion: ${infoItem.suggestion}\n`
          }
        })
      }

      output += '\n'
    })

    return output
  }

  private getComponentName(element: ReactElement): string {
    if (typeof element.type === 'string') {
      return element.type
    }
    
    if (typeof element.type === 'function') {
      return element.type.displayName || element.type.name || 'Unknown'
    }
    
    return 'Unknown'
  }

  private calculateScore(results: Array<ValidationResult & { severity: string }>): number {
    if (results.length === 0) return 100

    let totalWeight = 0
    let passedWeight = 0

    results.forEach(result => {
      const weight = result.severity === 'error' ? 3 : result.severity === 'warning' ? 2 : 1
      totalWeight += weight
      if (result.passed) {
        passedWeight += weight
      }
    })

    return Math.round((passedWeight / totalWeight) * 100)
  }

  // Utility methods for design token validation
  validateColorUsage(color: string): boolean {
    const allColors = [
      ...Object.values(this.tokens.colors.primary),
      ...Object.values(this.tokens.colors.secondary),
      ...Object.values(this.tokens.colors.neutral),
      ...Object.values(this.tokens.colors.semantic.success),
      ...Object.values(this.tokens.colors.semantic.warning),
      ...Object.values(this.tokens.colors.semantic.error),
      ...Object.values(this.tokens.colors.semantic.info)
    ]
    
    return allColors.includes(color)
  }

  validateSpacingUsage(spacing: string): boolean {
    return Object.values(this.tokens.spacing).includes(spacing)
  }

  validateTypographyUsage(property: string, value: string): boolean {
    switch (property) {
      case 'fontFamily':
        return Object.values(this.tokens.typography.fontFamilies).includes(value)
      case 'fontSize':
        return Object.values(this.tokens.typography.fontSizes).includes(value)
      case 'fontWeight':
        return Object.values(this.tokens.typography.fontWeights).includes(Number(value))
      case 'lineHeight':
        return Object.values(this.tokens.typography.lineHeights).includes(Number(value))
      case 'letterSpacing':
        return Object.values(this.tokens.typography.letterSpacing).includes(value)
      default:
        return false
    }
  }
}

// Export singleton instance
export const validator = new DesignSystemValidator()