/**
 * RHY Supplier Portal Design Tokens
 * Enterprise-grade design system for FlexVolt battery operations
 */

// EXACT COLOR VALUES - NEVER APPROXIMATE
export const colors = {
  // Primary Brand Colors
  primary: {
    DEFAULT: '#006FEE',
    dark: '#0050B3',
    darker: '#003A82',
    light: '#E6F4FF',
    foreground: '#FFFFFF',
    gradient: 'linear-gradient(to right, #006FEE, #0050B3)',
    gradientVertical: 'linear-gradient(to bottom, #006FEE, #0050B3)',
    gradient135: 'linear-gradient(135deg, #006FEE, #0050B3)',
  },

  // Status Colors
  success: {
    DEFAULT: '#10B981',
    light: '#BBF7D0',
    dark: '#065F46',
    bg: '#F0FDF4',
    border: '#A7F3D0',
    foreground: '#064E3B',
  },
  error: {
    DEFAULT: '#EF4444',
    light: '#FCA5A5',
    dark: '#991B1B',
    bg: '#FEE2E2',
    border: '#FECACA',
    foreground: '#7F1D1D',
  },
  warning: {
    DEFAULT: '#F59E0B',
    light: '#FDE68A',
    dark: '#92400E',
    bg: '#FEF3C7',
    border: '#FCD34D',
    foreground: '#78350F',
  },
  info: {
    DEFAULT: '#006FEE',
    light: '#93C5FD',
    dark: '#1E40AF',
    bg: '#E6F4FF',
    border: '#BFDBFE',
    foreground: '#1E3A8A',
  },

  // Grayscale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F9FAFB',
    muted: '#F1F5F9',
    elevated: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
    glass: 'rgba(255, 255, 255, 0.8)',
  },

  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#374151',
    muted: '#6B7280',
    light: '#9CA3AF',
    inverse: '#FFFFFF',
    disabled: '#D1D5DB',
  },

  // Border Colors
  border: {
    primary: '#E6F4FF',
    secondary: '#E5E7EB',
    muted: '#F1F5F9',
    focus: '#006FEE',
    error: '#FCA5A5',
    success: '#BBF7D0',
    warning: '#FDE68A',
  },

  // Component-specific Colors
  card: {
    background: '#FFFFFF',
    border: '#E6F4FF',
    shadow: 'rgba(0, 111, 238, 0.08)',
  },
  input: {
    background: '#F9FAFB',
    border: '#E5E7EB',
    focus: '#FFFFFF',
    placeholder: '#9CA3AF',
  },
} as const

// SPACING SYSTEM - 4px base unit
export const spacing = {
  0: '0px',
  1: '4px',    // 0.25rem
  2: '8px',    // 0.5rem
  3: '12px',   // 0.75rem
  4: '16px',   // 1rem
  5: '20px',   // 1.25rem
  6: '24px',   // 1.5rem
  7: '28px',   // 1.75rem
  8: '32px',   // 2rem
  10: '40px',  // 2.5rem
  12: '48px',  // 3rem
  16: '64px',  // 4rem
  20: '80px',  // 5rem
  24: '96px',  // 6rem
  32: '128px', // 8rem
} as const

// TYPOGRAPHY SYSTEM
export const typography = {
  fontFamily: {
    sans: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(', '),
    mono: [
      'ui-monospace',
      'SFMono-Regular',
      '"SF Mono"',
      'Consolas',
      '"Liberation Mono"',
      'Menlo',
      'monospace',
    ].join(', '),
  },
  fontSize: {
    xs: ['12px', { lineHeight: '16px' }],
    sm: ['14px', { lineHeight: '20px' }],
    base: ['16px', { lineHeight: '24px' }],
    lg: ['18px', { lineHeight: '28px' }],
    xl: ['20px', { lineHeight: '28px' }],
    '2xl': ['24px', { lineHeight: '32px' }],
    '3xl': ['30px', { lineHeight: '36px' }],
    '4xl': ['36px', { lineHeight: '40px' }],
    '5xl': ['48px', { lineHeight: '1' }],
    '6xl': ['60px', { lineHeight: '1' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeight: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
} as const

// BORDER RADIUS SYSTEM
export const borderRadius = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px',
} as const

// SHADOW SYSTEM
export const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 8px 24px rgba(0, 111, 238, 0.08)',
  xl: '0 16px 48px rgba(0, 111, 238, 0.12)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  none: '0 0 #0000',

  // Lithi-specific shadows
  lithi: {
    sm: '0 2px 8px rgba(0, 111, 238, 0.15)',
    md: '0 4px 12px rgba(0, 111, 238, 0.2)',
    lg: '0 8px 24px rgba(0, 111, 238, 0.25)',
    xl: '0 12px 32px rgba(0, 111, 238, 0.3)',
    button: '0 8px 24px rgba(0, 111, 238, 0.3)',
    buttonHover: '0 12px 32px rgba(0, 111, 238, 0.4)',
    focus: '0 0 0 3px rgba(0, 111, 238, 0.1)',
    glow: '0 0 20px rgba(0, 111, 238, 0.3)',
  },
} as const

// ANIMATION SYSTEM
export const animations = {
  duration: {
    fastest: '100ms',
    fast: '200ms',
    normal: '300ms',
    slow: '400ms',
    slowest: '500ms',
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    bounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  keyframes: {
    fadeIn: {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    slideUp: {
      from: { transform: 'translateY(10px)', opacity: '0' },
      to: { transform: 'translateY(0)', opacity: '1' },
    },
    slideDown: {
      from: { transform: 'translateY(-10px)', opacity: '0' },
      to: { transform: 'translateY(0)', opacity: '1' },
    },
    scaleIn: {
      from: { transform: 'scale(0.95)', opacity: '0' },
      to: { transform: 'scale(1)', opacity: '1' },
    },
    spin: {
      to: { transform: 'rotate(360deg)' },
    },
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' },
    },
    bounce: {
      '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
      '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
    },
  },
} as const

// BREAKPOINT SYSTEM
export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// Z-INDEX SCALE
export const zIndex = {
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1020,
  banner: 1030,
  overlay: 1040,
  modal: 1050,
  popover: 1060,
  skipLink: 1070,
  toast: 1080,
  tooltip: 1090,
} as const

// COMPONENT DESIGN TOKENS
export const components = {
  card: {
    background: colors.card.background,
    borderRadius: borderRadius.lg,
    border: `2px solid ${colors.card.border}`,
    padding: spacing[6],
    shadow: shadows.lg,
    hoverTransform: 'translateY(-4px)',
    hoverShadow: shadows.xl,
    transition: `all ${animations.duration.normal} ${animations.easing.easeOut}`,
  },

  button: {
    borderRadius: borderRadius.md,
    paddingX: spacing[6],
    paddingY: spacing[3],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    transition: `all ${animations.duration.normal} ${animations.easing.easeOut}`,
    focusShadow: shadows.lithi.focus,
    hoverTransform: 'translateY(-2px)',
    activeTransform: 'translateY(0)',
  },

  input: {
    borderRadius: borderRadius.md,
    border: `2px solid ${colors.input.border}`,
    background: colors.input.background,
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.fontSize.base,
    focusBorder: colors.border.focus,
    focusBackground: colors.input.focus,
    focusShadow: shadows.lithi.focus,
    transition: `all ${animations.duration.normal} ${animations.easing.easeOut}`,
  },

  modal: {
    overlay: colors.background.overlay,
    background: colors.background.primary,
    borderRadius: borderRadius.xl,
    shadow: shadows['2xl'],
    maxWidth: '32rem',
    padding: spacing[8],
  },

  tooltip: {
    background: colors.gray[900],
    color: colors.text.inverse,
    borderRadius: borderRadius.md,
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: typography.fontSize.sm,
    shadow: shadows.md,
    zIndex: zIndex.tooltip,
  },
} as const

// RESPONSIVE UTILITIES
export const responsive = {
  // Container queries
  container: {
    xs: `(max-width: ${breakpoints.xs})`,
    sm: `(max-width: ${breakpoints.sm})`,
    md: `(max-width: ${breakpoints.md})`,
    lg: `(max-width: ${breakpoints.lg})`,
    xl: `(max-width: ${breakpoints.xl})`,
    '2xl': `(max-width: ${breakpoints['2xl']})`,
  },

  // Touch targets for mobile
  touchTarget: {
    minHeight: '44px',
    minWidth: '44px',
  },

  // Layout constraints
  maxWidths: {
    prose: '65ch',
    container: '1280px',
    chat: '840px',
    form: '600px',
    sidebar: '280px',
  },

  // Grid systems
  gridCols: {
    1: 'repeat(1, minmax(0, 1fr))',
    2: 'repeat(2, minmax(0, 1fr))',
    3: 'repeat(3, minmax(0, 1fr))',
    4: 'repeat(4, minmax(0, 1fr))',
    auto: 'repeat(auto-fit, minmax(300px, 1fr))',
    autoCard: 'repeat(auto-fill, minmax(280px, 1fr))',
  },
} as const

// ACCESSIBILITY TOKENS
export const a11y = {
  // Focus visible styles
  focusVisible: {
    outline: `2px solid ${colors.primary.DEFAULT}`,
    outlineOffset: '2px',
    boxShadow: shadows.lithi.focus,
  },

  // Screen reader only
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  },

  // Color contrast ratios (WCAG AA compliant)
  contrast: {
    normal: '4.5:1',
    large: '3:1',
    decorative: '3:1',
  },

  // Motion preferences
  reduceMotion: {
    none: 'none',
    reduce: 'reduce',
  },
} as const

// BUSINESS CONTEXT TOKENS
export const business = {
  // FlexVolt Products
  products: {
    flexvolt6: { capacity: '6Ah', price: 95, runtime: '2 hours' },
    flexvolt9: { capacity: '9Ah', price: 125, runtime: '3 hours' },
    flexvolt15: { capacity: '15Ah', price: 245, runtime: '5 hours' },
  },

  // Volume Discounts
  discounts: {
    tier1: { threshold: 1000, discount: 0.1 },   // 10%
    tier2: { threshold: 2500, discount: 0.15 },  // 15%
    tier3: { threshold: 5000, discount: 0.2 },   // 20%
    tier4: { threshold: 10000, discount: 0.25 }, // 25%
  },

  // Warehouse Regions
  warehouses: {
    us: { region: 'US West Coast', currency: 'USD', timezone: 'PST' },
    japan: { region: 'Japan', currency: 'JPY', timezone: 'JST' },
    eu: { region: 'EU', currency: 'EUR', timezone: 'CET' },
    australia: { region: 'Australia', currency: 'AUD', timezone: 'AEDT' },
  },
} as const

// UTILITY FUNCTIONS
export const utils = {
  // Color manipulation
  rgba: (color: string, alpha: number) => `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`,
  
  // Responsive value helper
  responsive: <T>(mobile: T, tablet?: T, desktop?: T): Record<string, T> => ({
    base: mobile,
    ...(tablet && { md: tablet }),
    ...(desktop && { lg: desktop }),
  }),

  // Spacing scale helper
  space: (multiplier: number) => `${multiplier * 4}px`,

  // Shadow color helper
  shadowColor: (color: string, opacity: number) => 
    `0 4px 12px ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
} as const

// TYPE DEFINITIONS
export type ColorKey = keyof typeof colors
export type SpacingKey = keyof typeof spacing
export type BreakpointKey = keyof typeof breakpoints
export type ShadowKey = keyof typeof shadows
export type BorderRadiusKey = keyof typeof borderRadius

// DESIGN SYSTEM VERSION
export const version = '1.0.0'
export const lastUpdated = '2025-01-24'

// EXPORT ALL TOKENS
export const designTokens = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  animations,
  breakpoints,
  zIndex,
  components,
  responsive,
  a11y,
  business,
  utils,
  version,
  lastUpdated,
} as const

export default designTokens