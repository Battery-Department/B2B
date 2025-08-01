import React, { ComponentType, ReactNode } from 'react'
import { designTokens, DesignTokens } from './DesignSystemValidator'

// Component Library Types
interface ComponentVariant {
  name: string
  props: Record<string, any>
  description?: string
}

interface ComponentLibraryEntry {
  name: string
  component: ComponentType<any>
  category: string
  description: string
  variants: ComponentVariant[]
  examples: Array<{
    name: string
    code: string
    component: ReactNode
  }>
  designTokens: string[]
  accessibility: {
    guidelines: string[]
    ariaAttributes: string[]
    keyboardNavigation: string[]
  }
  status: 'stable' | 'beta' | 'alpha' | 'deprecated'
}

// Design System Components with proper token usage
export const DSButton: React.FC<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  children: ReactNode
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
}> = ({
  variant = 'primary',
  size = 'medium',
  children,
  disabled = false,
  loading = false,
  onClick,
  className = '',
  type = 'button'
}) => {
  const tokens = designTokens

  const baseStyles = {
    fontFamily: tokens.typography.fontFamilies.sans,
    borderRadius: tokens.borderRadius.md,
    fontWeight: tokens.typography.fontWeights.medium,
    transition: 'all 0.2s ease-in-out',
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none'
  }

  const sizeStyles = {
    small: {
      padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
      fontSize: tokens.typography.fontSizes.sm
    },
    medium: {
      padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
      fontSize: tokens.typography.fontSizes.base
    },
    large: {
      padding: `${tokens.spacing[4]} ${tokens.spacing[6]}`,
      fontSize: tokens.typography.fontSizes.lg
    }
  }

  const variantStyles = {
    primary: {
      backgroundColor: disabled ? tokens.colors.neutral[300] : tokens.colors.primary[500],
      color: tokens.colors.neutral.white,
      boxShadow: disabled ? 'none' : tokens.shadows.sm
    },
    secondary: {
      backgroundColor: disabled ? tokens.colors.neutral[100] : tokens.colors.neutral[200],
      color: disabled ? tokens.colors.neutral[400] : tokens.colors.neutral[700],
      border: `1px solid ${disabled ? tokens.colors.neutral[300] : tokens.colors.neutral[300]}`
    },
    danger: {
      backgroundColor: disabled ? tokens.colors.neutral[300] : tokens.colors.semantic.error[500],
      color: tokens.colors.neutral.white,
      boxShadow: disabled ? 'none' : tokens.shadows.sm
    },
    ghost: {
      backgroundColor: 'transparent',
      color: disabled ? tokens.colors.neutral[400] : tokens.colors.primary[500],
      border: 'none'
    }
  }

  return (
    <button
      type={type}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      className={className}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
        opacity: disabled ? 0.6 : 1
      }}
      aria-busy={loading}
      aria-disabled={disabled}
    >
      {loading && (
        <span
          style={{
            width: tokens.spacing[4],
            height: tokens.spacing[4],
            marginRight: tokens.spacing[2],
            border: `2px solid currentColor`,
            borderTop: '2px solid transparent',
            borderRadius: tokens.borderRadius.full,
            animation: 'spin 1s linear infinite'
          }}
        />
      )}
      {children}
    </button>
  )
}

export const DSCard: React.FC<{
  variant?: 'default' | 'outlined' | 'elevated'
  children: ReactNode
  className?: string
  padding?: keyof DesignTokens['spacing']
}> = ({
  variant = 'default',
  children,
  className = '',
  padding = '6'
}) => {
  const tokens = designTokens

  const baseStyles = {
    borderRadius: tokens.borderRadius.lg,
    backgroundColor: tokens.colors.neutral.white
  }

  const variantStyles = {
    default: {
      border: `1px solid ${tokens.colors.neutral[200]}`
    },
    outlined: {
      border: `2px solid ${tokens.colors.neutral[300]}`
    },
    elevated: {
      border: 'none',
      boxShadow: tokens.shadows.lg
    }
  }

  return (
    <div
      className={className}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        padding: tokens.spacing[padding]
      }}
    >
      {children}
    </div>
  )
}

export const DSInput: React.FC<{
  variant?: 'default' | 'error' | 'success'
  size?: 'small' | 'medium' | 'large'
  type?: string
  value?: string
  defaultValue?: string
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
  label?: string
  error?: string
  success?: string
}> = ({
  variant = 'default',
  size = 'medium',
  type = 'text',
  value,
  defaultValue,
  placeholder,
  disabled = false,
  readOnly = false,
  onChange,
  className = '',
  label,
  error,
  success
}) => {
  const tokens = designTokens

  const baseStyles = {
    width: '100%',
    fontFamily: tokens.typography.fontFamilies.sans,
    borderRadius: tokens.borderRadius.md,
    transition: 'all 0.2s ease-in-out',
    outline: 'none'
  }

  const sizeStyles = {
    small: {
      padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
      fontSize: tokens.typography.fontSizes.sm
    },
    medium: {
      padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
      fontSize: tokens.typography.fontSizes.base
    },
    large: {
      padding: `${tokens.spacing[4]} ${tokens.spacing[5]}`,
      fontSize: tokens.typography.fontSizes.lg
    }
  }

  const variantStyles = {
    default: {
      border: `1px solid ${tokens.colors.neutral[300]}`,
      backgroundColor: disabled ? tokens.colors.neutral[50] : tokens.colors.neutral.white
    },
    error: {
      border: `1px solid ${tokens.colors.semantic.error[500]}`,
      backgroundColor: disabled ? tokens.colors.neutral[50] : tokens.colors.semantic.error[50]
    },
    success: {
      border: `1px solid ${tokens.colors.semantic.success[500]}`,
      backgroundColor: disabled ? tokens.colors.neutral[50] : tokens.colors.semantic.success[50]
    }
  }

  return (
    <div className={className}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: tokens.typography.fontSizes.sm,
            fontWeight: tokens.typography.fontWeights.medium,
            color: tokens.colors.neutral[700],
            marginBottom: tokens.spacing[1]
          }}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        onChange={onChange}
        style={{
          ...baseStyles,
          ...sizeStyles[size],
          ...variantStyles[variant],
          opacity: disabled ? 0.6 : 1
        }}
        aria-invalid={variant === 'error'}
        aria-describedby={error ? 'error-message' : success ? 'success-message' : undefined}
      />
      {error && (
        <p
          id="error-message"
          style={{
            fontSize: tokens.typography.fontSizes.sm,
            color: tokens.colors.semantic.error[600],
            marginTop: tokens.spacing[1]
          }}
        >
          {error}
        </p>
      )}
      {success && (
        <p
          id="success-message"
          style={{
            fontSize: tokens.typography.fontSizes.sm,
            color: tokens.colors.semantic.success[600],
            marginTop: tokens.spacing[1]
          }}
        >
          {success}
        </p>
      )}
    </div>
  )
}

export const DSBadge: React.FC<{
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'small' | 'medium' | 'large'
  children: ReactNode
  className?: string
}> = ({
  variant = 'primary',
  size = 'medium',
  children,
  className = ''
}) => {
  const tokens = designTokens

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    fontFamily: tokens.typography.fontFamilies.sans,
    fontWeight: tokens.typography.fontWeights.medium,
    borderRadius: tokens.borderRadius.full
  }

  const sizeStyles = {
    small: {
      padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
      fontSize: tokens.typography.fontSizes.xs
    },
    medium: {
      padding: `${tokens.spacing[1]} ${tokens.spacing[3]}`,
      fontSize: tokens.typography.fontSizes.sm
    },
    large: {
      padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
      fontSize: tokens.typography.fontSizes.base
    }
  }

  const variantStyles = {
    primary: {
      backgroundColor: tokens.colors.primary[100],
      color: tokens.colors.primary[800]
    },
    secondary: {
      backgroundColor: tokens.colors.neutral[100],
      color: tokens.colors.neutral[800]
    },
    success: {
      backgroundColor: tokens.colors.semantic.success[100],
      color: tokens.colors.semantic.success[800]
    },
    warning: {
      backgroundColor: tokens.colors.semantic.warning[100],
      color: tokens.colors.semantic.warning[800]
    },
    error: {
      backgroundColor: tokens.colors.semantic.error[100],
      color: tokens.colors.semantic.error[800]
    }
  }

  return (
    <span
      className={className}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant]
      }}
    >
      {children}
    </span>
  )
}

// Component Library Registry
export const componentLibrary: Record<string, ComponentLibraryEntry> = {
  DSButton: {
    name: 'DSButton',
    component: DSButton,
    category: 'Actions',
    description: 'A button component that follows design system tokens for consistent styling and behavior.',
    variants: [
      {
        name: 'Primary',
        props: { variant: 'primary' },
        description: 'Main call-to-action button'
      },
      {
        name: 'Secondary',
        props: { variant: 'secondary' },
        description: 'Secondary action button'
      },
      {
        name: 'Danger',
        props: { variant: 'danger' },
        description: 'Destructive action button'
      },
      {
        name: 'Ghost',
        props: { variant: 'ghost' },
        description: 'Minimal button without background'
      }
    ],
    examples: [
      {
        name: 'Basic Usage',
        code: '<DSButton variant="primary">Click me</DSButton>',
        component: <DSButton variant="primary">Click me</DSButton>
      },
      {
        name: 'Loading State',
        code: '<DSButton variant="primary" loading>Loading...</DSButton>',
        component: <DSButton variant="primary" loading>Loading...</DSButton>
      },
      {
        name: 'Disabled State',
        code: '<DSButton variant="primary" disabled>Disabled</DSButton>',
        component: <DSButton variant="primary" disabled>Disabled</DSButton>
      }
    ],
    designTokens: [
      'colors.primary.*',
      'colors.neutral.*',
      'colors.semantic.error.*',
      'typography.fontFamilies.sans',
      'typography.fontSizes.*',
      'typography.fontWeights.medium',
      'spacing.*',
      'borderRadius.md',
      'shadows.sm'
    ],
    accessibility: {
      guidelines: [
        'Use semantic button element',
        'Provide clear, descriptive text',
        'Include appropriate ARIA attributes for state',
        'Ensure sufficient color contrast (4.5:1 minimum)',
        'Support keyboard navigation'
      ],
      ariaAttributes: [
        'aria-busy (for loading state)',
        'aria-disabled (for disabled state)',
        'aria-pressed (for toggle buttons)',
        'aria-expanded (for dropdown triggers)'
      ],
      keyboardNavigation: [
        'Tab to focus',
        'Enter or Space to activate',
        'Escape to cancel (if applicable)'
      ]
    },
    status: 'stable'
  },
  DSCard: {
    name: 'DSCard',
    component: DSCard,
    category: 'Layout',
    description: 'A flexible card container component with multiple visual variants.',
    variants: [
      {
        name: 'Default',
        props: { variant: 'default' },
        description: 'Standard card with border'
      },
      {
        name: 'Outlined',
        props: { variant: 'outlined' },
        description: 'Card with emphasized border'
      },
      {
        name: 'Elevated',
        props: { variant: 'elevated' },
        description: 'Card with drop shadow'
      }
    ],
    examples: [
      {
        name: 'Basic Card',
        code: '<DSCard><p>Card content</p></DSCard>',
        component: <DSCard><p>Card content</p></DSCard>
      }
    ],
    designTokens: [
      'colors.neutral.*',
      'borderRadius.lg',
      'shadows.lg',
      'spacing.*'
    ],
    accessibility: {
      guidelines: [
        'Use semantic HTML structure',
        'Provide sufficient color contrast',
        'Ensure interactive elements are keyboard accessible'
      ],
      ariaAttributes: [],
      keyboardNavigation: []
    },
    status: 'stable'
  },
  DSInput: {
    name: 'DSInput',
    component: DSInput,
    category: 'Forms',
    description: 'A form input component with validation states and accessibility features.',
    variants: [
      {
        name: 'Default',
        props: { variant: 'default' },
        description: 'Standard input field'
      },
      {
        name: 'Error',
        props: { variant: 'error', error: 'This field is required' },
        description: 'Input with error state'
      },
      {
        name: 'Success',
        props: { variant: 'success', success: 'Input is valid' },
        description: 'Input with success state'
      }
    ],
    examples: [
      {
        name: 'With Label',
        code: '<DSInput label="Email" placeholder="Enter your email" />',
        component: <DSInput label="Email" placeholder="Enter your email" />
      }
    ],
    designTokens: [
      'colors.neutral.*',
      'colors.semantic.*',
      'typography.fontFamilies.sans',
      'typography.fontSizes.*',
      'typography.fontWeights.medium',
      'spacing.*',
      'borderRadius.md'
    ],
    accessibility: {
      guidelines: [
        'Associate labels with inputs',
        'Provide clear error messages',
        'Use appropriate input types',
        'Support keyboard navigation',
        'Include ARIA attributes for validation states'
      ],
      ariaAttributes: [
        'aria-invalid (for error state)',
        'aria-describedby (for help text)',
        'aria-required (for required fields)'
      ],
      keyboardNavigation: [
        'Tab to focus',
        'Type to enter text',
        'Arrow keys to navigate text'
      ]
    },
    status: 'stable'
  },
  DSBadge: {
    name: 'DSBadge',
    component: DSBadge,
    category: 'Display',
    description: 'A small label component for status, categories, or tags.',
    variants: [
      {
        name: 'Primary',
        props: { variant: 'primary' },
        description: 'Primary status badge'
      },
      {
        name: 'Success',
        props: { variant: 'success' },
        description: 'Success status badge'
      },
      {
        name: 'Warning',
        props: { variant: 'warning' },
        description: 'Warning status badge'
      },
      {
        name: 'Error',
        props: { variant: 'error' },
        description: 'Error status badge'
      }
    ],
    examples: [
      {
        name: 'Status Badge',
        code: '<DSBadge variant="success">Active</DSBadge>',
        component: <DSBadge variant="success">Active</DSBadge>
      }
    ],
    designTokens: [
      'colors.primary.*',
      'colors.semantic.*',
      'colors.neutral.*',
      'typography.fontFamilies.sans',
      'typography.fontSizes.*',
      'typography.fontWeights.medium',
      'spacing.*',
      'borderRadius.full'
    ],
    accessibility: {
      guidelines: [
        'Use semantic HTML',
        'Ensure sufficient color contrast',
        'Provide text alternatives for icon-only badges'
      ],
      ariaAttributes: [
        'aria-label (for icon-only badges)'
      ],
      keyboardNavigation: []
    },
    status: 'stable'
  }
}

// Component Library Utilities
export class ComponentLibraryManager {
  private library: Record<string, ComponentLibraryEntry>

  constructor(library: Record<string, ComponentLibraryEntry> = componentLibrary) {
    this.library = library
  }

  getComponent(name: string): ComponentLibraryEntry | undefined {
    return this.library[name]
  }

  getComponentsByCategory(category: string): ComponentLibraryEntry[] {
    return Object.values(this.library).filter(entry => entry.category === category)
  }

  getComponentsByStatus(status: ComponentLibraryEntry['status']): ComponentLibraryEntry[] {
    return Object.values(this.library).filter(entry => entry.status === status)
  }

  searchComponents(query: string): ComponentLibraryEntry[] {
    const lowerQuery = query.toLowerCase()
    return Object.values(this.library).filter(entry =>
      entry.name.toLowerCase().includes(lowerQuery) ||
      entry.description.toLowerCase().includes(lowerQuery) ||
      entry.category.toLowerCase().includes(lowerQuery)
    )
  }

  getUsedDesignTokens(): string[] {
    const tokens = new Set<string>()
    Object.values(this.library).forEach(entry => {
      entry.designTokens.forEach(token => tokens.add(token))
    })
    return Array.from(tokens).sort()
  }

  generateDocumentation(): string {
    let docs = '# Component Library Documentation\n\n'
    
    const categories = [...new Set(Object.values(this.library).map(entry => entry.category))].sort()
    
    categories.forEach(category => {
      docs += `## ${category}\n\n`
      
      const components = this.getComponentsByCategory(category)
      components.forEach(component => {
        docs += `### ${component.name}\n\n`
        docs += `${component.description}\n\n`
        docs += `**Status:** ${component.status}\n\n`
        
        if (component.variants.length > 0) {
          docs += '**Variants:**\n'
          component.variants.forEach(variant => {
            docs += `- **${variant.name}**: ${variant.description || 'No description'}\n`
          })
          docs += '\n'
        }
        
        docs += '**Design Tokens Used:**\n'
        component.designTokens.forEach(token => {
          docs += `- ${token}\n`
        })
        docs += '\n'
        
        docs += '**Accessibility Guidelines:**\n'
        component.accessibility.guidelines.forEach(guideline => {
          docs += `- ${guideline}\n`
        })
        docs += '\n'
      })
    })
    
    return docs
  }
}

export const libraryManager = new ComponentLibraryManager()