// Lithi AI Battery Department Design System Constants
// Terminal 1: Design System Implementation

// Light theme colors
export const lightColors = {
  primary: {
    DEFAULT: '#006FEE',
    dark: '#0050B3',
    light: '#E6F4FF',
    gradient: 'linear-gradient(to right, #006FEE, #0050B3)',
    gradientAlt: 'linear-gradient(135deg, #006FEE 0%, #0050B3 100%)',
  },
  secondary: {
    DEFAULT: '#F8FAFC',
    dark: '#F1F5F9',
    border: '#E6F4FF',
  },
  text: {
    primary: '#0A051E',
    secondary: '#374151',
    muted: '#64748B',
    light: '#94A3B8',
    inverse: '#FFFFFF',
  },
  status: {
    success: '#10B981',
    successLight: '#BBF7D0',
    successBg: '#F0FDF4',
    error: '#EF4444',
    errorLight: '#FCA5A5',
    errorBg: '#FEE2E2',
    warning: '#F59E0B',
    warningLight: '#FDE68A',
    warningBg: '#FEF3C7',
    info: '#006FEE',
    infoLight: '#93C5FD',
    infoBg: '#E6F4FF',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F9FAFB',
    surface: '#FFFFFF',
    elevated: '#FFFFFF',
  },
  border: {
    primary: '#E6F4FF',
    secondary: '#E5E7EB',
    muted: '#F1F5F9',
  },
} as const

// Dark theme colors
export const darkColors = {
  primary: {
    DEFAULT: '#3B82F6',
    dark: '#1D4ED8',
    light: '#1E293B',
    gradient: 'linear-gradient(to right, #3B82F6, #1D4ED8)',
    gradientAlt: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
  },
  secondary: {
    DEFAULT: '#1E293B',
    dark: '#0F172A',
    border: '#334155',
  },
  text: {
    primary: '#F1F5F9',
    secondary: '#CBD5E1',
    muted: '#94A3B8',
    light: '#64748B',
    inverse: '#0A051E',
  },
  status: {
    success: '#10B981',
    successLight: '#065F46',
    successBg: '#064E3B',
    error: '#EF4444',
    errorLight: '#991B1B',
    errorBg: '#7F1D1D',
    warning: '#F59E0B',
    warningLight: '#92400E',
    warningBg: '#78350F',
    info: '#3B82F6',
    infoLight: '#1E40AF',
    infoBg: '#1E3A8A',
  },
  background: {
    primary: '#0F172A',
    secondary: '#1E293B',
    tertiary: '#334155',
    surface: '#1E293B',
    elevated: '#334155',
  },
  border: {
    primary: '#334155',
    secondary: '#475569',
    muted: '#64748B',
  },
} as const

// Default to light theme for backward compatibility
export const colors = lightColors

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '40px',
  '3xl': '48px',
  '4xl': '64px',
} as const

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  full: '9999px',
} as const

// Light theme shadows
export const lightShadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 8px 24px rgba(0, 111, 238, 0.08)',
  xl: '0 16px 48px rgba(0, 111, 238, 0.12)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  focus: '0 0 0 3px rgba(0, 111, 238, 0.1)',
  button: '0 8px 24px rgba(0, 111, 238, 0.3)',
  buttonHover: '0 12px 32px rgba(0, 111, 238, 0.4)',
} as const

// Dark theme shadows
export const darkShadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.4)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.3)',
  xl: '0 16px 48px rgba(0, 0, 0, 0.4)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
  focus: '0 0 0 3px rgba(59, 130, 246, 0.2)',
  button: '0 8px 24px rgba(59, 130, 246, 0.3)',
  buttonHover: '0 12px 32px rgba(59, 130, 246, 0.4)',
} as const

// Default to light theme shadows
export const shadows = lightShadows

export const animations = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeight: {
    tight: '1.1',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
} as const

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const

// Theme configurations
export type ThemeName = 'light' | 'dark'

export interface Theme {
  name: ThemeName
  colors: typeof lightColors
  shadows: typeof lightShadows
  isDark: boolean
}

export const themes: Record<ThemeName, Theme> = {
  light: {
    name: 'light',
    colors: lightColors,
    shadows: lightShadows,
    isDark: false,
  },
  dark: {
    name: 'dark',
    colors: darkColors,
    shadows: darkShadows,
    isDark: true,
  },
}

// Component-specific design tokens (theme-aware)
export const createComponents = (theme: Theme) => ({
  card: {
    background: theme.colors.background.primary,
    borderRadius: borderRadius.lg,
    border: `2px solid ${theme.colors.border.primary}`,
    padding: spacing.lg,
    shadow: theme.shadows.lg,
    hoverTransform: 'translateY(-4px)',
    hoverShadow: theme.shadows.xl,
  },
  button: {
    borderRadius: borderRadius.md,
    paddingX: spacing.md,
    paddingY: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    transition: `all ${animations.duration.normal} ${animations.easing.DEFAULT}`,
    focusShadow: theme.shadows.focus,
  },
  input: {
    borderRadius: borderRadius.md,
    border: `2px solid ${theme.colors.border.primary}`,
    background: theme.colors.background.tertiary,
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: typography.fontSize.base,
    focusBorder: theme.colors.primary.DEFAULT,
    focusShadow: theme.shadows.focus,
  },
})

// Component-specific design tokens (backward compatibility)
export const components = createComponents(themes.light)

// CSS Custom Properties for theme switching
export const createCSSVariables = (theme: Theme) => ({
  // Colors
  '--color-primary': theme.colors.primary.DEFAULT,
  '--color-primary-dark': theme.colors.primary.dark,
  '--color-primary-light': theme.colors.primary.light,
  '--color-text-primary': theme.colors.text.primary,
  '--color-text-secondary': theme.colors.text.secondary,
  '--color-text-muted': theme.colors.text.muted,
  '--color-text-light': theme.colors.text.light,
  '--color-text-inverse': theme.colors.text.inverse,
  '--color-bg-primary': theme.colors.background.primary,
  '--color-bg-secondary': theme.colors.background.secondary,
  '--color-bg-tertiary': theme.colors.background.tertiary,
  '--color-bg-surface': theme.colors.background.surface,
  '--color-bg-elevated': theme.colors.background.elevated,
  '--color-border-primary': theme.colors.border.primary,
  '--color-border-secondary': theme.colors.border.secondary,
  '--color-border-muted': theme.colors.border.muted,
  '--color-success': theme.colors.status.success,
  '--color-success-light': theme.colors.status.successLight,
  '--color-success-bg': theme.colors.status.successBg,
  '--color-error': theme.colors.status.error,
  '--color-error-light': theme.colors.status.errorLight,
  '--color-error-bg': theme.colors.status.errorBg,
  '--color-warning': theme.colors.status.warning,
  '--color-warning-light': theme.colors.status.warningLight,
  '--color-warning-bg': theme.colors.status.warningBg,
  '--color-info': theme.colors.status.info,
  '--color-info-light': theme.colors.status.infoLight,
  '--color-info-bg': theme.colors.status.infoBg,
  
  // Shadows
  '--shadow-sm': theme.shadows.sm,
  '--shadow-default': theme.shadows.DEFAULT,
  '--shadow-md': theme.shadows.md,
  '--shadow-lg': theme.shadows.lg,
  '--shadow-xl': theme.shadows.xl,
  '--shadow-2xl': theme.shadows['2xl'],
  '--shadow-focus': theme.shadows.focus,
  '--shadow-button': theme.shadows.button,
  '--shadow-button-hover': theme.shadows.buttonHover,
  
  // Gradients
  '--gradient-primary': theme.colors.primary.gradient,
  '--gradient-primary-alt': theme.colors.primary.gradientAlt,
})