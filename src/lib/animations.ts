// Animation Library - Reusable animation utilities for the Lithi Design System

import React from 'react'

export const animations = {
  // Duration constants
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '800ms',
  },

  // Easing functions
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Hover transforms
  hover: {
    lift: 'translateY(-4px)',
    liftSmall: 'translateY(-2px)',
    scale: 'scale(1.05)',
    scaleSmall: 'scale(1.02)',
  },

  // Focus effects
  focus: {
    ring: '0 0 0 3px rgba(0, 111, 238, 0.1)',
    ringLarge: '0 0 0 4px rgba(0, 111, 238, 0.15)',
    glow: '0 0 20px rgba(0, 111, 238, 0.3)',
  },

  // Box shadows
  shadow: {
    sm: '0 2px 4px rgba(0, 111, 238, 0.08)',
    md: '0 4px 12px rgba(0, 111, 238, 0.12)',
    lg: '0 8px 24px rgba(0, 111, 238, 0.15)',
    xl: '0 16px 48px rgba(0, 111, 238, 0.2)',
    hover: '0 8px 16px rgba(0, 111, 238, 0.3)',
    hoverLarge: '0 12px 32px rgba(0, 111, 238, 0.4)',
  },

  // Loading animations
  loading: {
    spin: {
      animation: 'spin 1s linear infinite',
      keyframes: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `,
    },
    pulse: {
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      keyframes: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `,
    },
    bounce: {
      animation: 'bounce 1s infinite',
      keyframes: `
        @keyframes bounce {
          0%, 100% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
      `,
    },
  },

  // Entrance animations
  entrance: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
      transition: 'opacity 300ms ease-out',
    },
    slideInUp: {
      from: { opacity: 0, transform: 'translateY(20px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
      transition: 'all 300ms ease-out',
    },
    slideInDown: {
      from: { opacity: 0, transform: 'translateY(-20px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
      transition: 'all 300ms ease-out',
    },
    slideInLeft: {
      from: { opacity: 0, transform: 'translateX(-20px)' },
      to: { opacity: 1, transform: 'translateX(0)' },
      transition: 'all 300ms ease-out',
    },
    slideInRight: {
      from: { opacity: 0, transform: 'translateX(20px)' },
      to: { opacity: 1, transform: 'translateX(0)' },
      transition: 'all 300ms ease-out',
    },
    scaleIn: {
      from: { opacity: 0, transform: 'scale(0.95)' },
      to: { opacity: 1, transform: 'scale(1)' },
      transition: 'all 300ms ease-out',
    },
  },

  // Exit animations
  exit: {
    fadeOut: {
      from: { opacity: 1 },
      to: { opacity: 0 },
      transition: 'opacity 200ms ease-in',
    },
    slideOutUp: {
      from: { opacity: 1, transform: 'translateY(0)' },
      to: { opacity: 0, transform: 'translateY(-20px)' },
      transition: 'all 200ms ease-in',
    },
    slideOutDown: {
      from: { opacity: 1, transform: 'translateY(0)' },
      to: { opacity: 0, transform: 'translateY(20px)' },
      transition: 'all 200ms ease-in',
    },
    scaleOut: {
      from: { opacity: 1, transform: 'scale(1)' },
      to: { opacity: 0, transform: 'scale(0.95)' },
      transition: 'all 200ms ease-in',
    },
  },

  // Micro-interactions
  ripple: {
    keyframes: `
      @keyframes ripple {
        0% {
          transform: scale(0);
          opacity: 1;
        }
        100% {
          transform: scale(4);
          opacity: 0;
        }
      }
    `,
    animation: 'ripple 0.6s linear',
  },

  // Page transitions
  pageTransition: {
    enter: {
      opacity: 0,
      transform: 'translateY(20px)',
    },
    enterActive: {
      opacity: 1,
      transform: 'translateY(0)',
      transition: 'all 500ms ease-out',
    },
    exit: {
      opacity: 1,
      transform: 'translateY(0)',
    },
    exitActive: {
      opacity: 0,
      transform: 'translateY(-20px)',
      transition: 'all 300ms ease-in',
    },
  },
}

// Helper functions for creating animated styles
export const createHoverStyle = (baseStyle: React.CSSProperties, hoverOverrides: React.CSSProperties = {}) => ({
  ...baseStyle,
  transition: animations.duration.normal + ' ' + animations.easing.smooth,
  cursor: 'pointer',
  ':hover': {
    transform: animations.hover.lift,
    boxShadow: animations.shadow.hover,
    ...hoverOverrides,
  },
})

export const createFocusStyle = (baseStyle: React.CSSProperties) => ({
  ...baseStyle,
  ':focus': {
    outline: 'none',
    boxShadow: animations.focus.ring,
  },
  ':focus-visible': {
    outline: 'none',
    boxShadow: animations.focus.ring,
  },
})

export const createButtonStyle = (variant: 'primary' | 'secondary' = 'primary') => {
  const baseStyle: React.CSSProperties = {
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: `all ${animations.duration.normal} ${animations.easing.smooth}`,
  }

  if (variant === 'primary') {
    return {
      ...baseStyle,
      background: 'linear-gradient(135deg, #006FEE 0%, #0084FF 100%)',
      color: 'white',
      boxShadow: animations.shadow.md,
    }
  }

  return {
    ...baseStyle,
    background: 'transparent',
    color: '#006FEE',
    border: '2px solid #006FEE',
  }
}

export const createCardStyle = (): React.CSSProperties => ({
  background: 'white',
  borderRadius: '12px',
  padding: '24px',
  border: '2px solid #E6F4FF',
  boxShadow: animations.shadow.sm,
  transition: `all ${animations.duration.normal} ${animations.easing.smooth}`,
})

// Animation hook utilities
export const useAnimatedMount = (delay = 0) => {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return isMounted
}

export const useStaggeredAnimation = (items: any[], delay = 100) => {
  const [visibleItems, setVisibleItems] = React.useState<Set<number>>(new Set())

  React.useEffect(() => {
    items.forEach((_, index) => {
      const timer = setTimeout(() => {
        setVisibleItems(prev => new Set([...prev, index]))
      }, index * delay)

      return () => clearTimeout(timer)
    })
  }, [items, delay])

  return visibleItems
}

// Reduced motion support
export const respectsReducedMotion = () => {
  if (typeof window === 'undefined') return false
  const mediaQueryList = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  return mediaQueryList?.matches ?? false
}

export const getAnimationDuration = (normalDuration: string) => {
  if (respectsReducedMotion()) return '0ms'
  return normalDuration
}

export const getAnimationStyle = (normalStyle: React.CSSProperties, reducedStyle: React.CSSProperties = {}) => {
  if (respectsReducedMotion()) {
    return {
      ...normalStyle,
      ...reducedStyle,
      transition: 'none',
      animation: 'none',
    }
  }
  return normalStyle
}