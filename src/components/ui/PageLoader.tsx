'use client'

import React from 'react'
import { useTheme } from '../../hooks/useTheme'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface PageLoaderProps {
  fullScreen?: boolean
  message?: string
  showProgress?: boolean
  progress?: number
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  fullScreen = true,
  message = 'Loading...',
  showProgress = false,
  progress = 0
}) => {
  const { theme } = useTheme()
  const { shouldAnimate, getAnimationDuration } = useReducedMotion()

  const containerStyles: React.CSSProperties = {
    position: fullScreen ? 'fixed' : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fullScreen ? theme.colors.background : 'transparent',
    zIndex: fullScreen ? 9999 : 1,
    transition: `opacity ${getAnimationDuration(300)}ms ease-in-out`,
  }

  const batteryStyles: React.CSSProperties = {
    width: '120px',
    height: '60px',
    position: 'relative',
    backgroundColor: theme.colors.surface,
    border: `3px solid ${theme.colors.primary}`,
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: theme.shadows.md,
  }

  const batteryCapStyles: React.CSSProperties = {
    position: 'absolute',
    right: '-12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '12px',
    height: '24px',
    backgroundColor: theme.colors.primary,
    borderRadius: '0 4px 4px 0',
  }

  const batteryFillStyles: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: showProgress ? `${progress}%` : '100%',
    background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
    transition: `width ${getAnimationDuration(500)}ms ease-out`,
    animation: shouldAnimate && !showProgress ? 'batteryCharge 2s ease-in-out infinite' : 'none',
  }

  const lightningBoltStyles: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '24px',
    height: '36px',
    fill: theme.colors.background,
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
    animation: shouldAnimate ? 'pulse 1.5s ease-in-out infinite' : 'none',
  }

  const messageStyles: React.CSSProperties = {
    marginTop: '24px',
    fontSize: '16px',
    fontWeight: 500,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: '300px',
  }

  const progressBarContainerStyles: React.CSSProperties = {
    marginTop: '16px',
    width: '200px',
    height: '4px',
    backgroundColor: theme.colors.border,
    borderRadius: '2px',
    overflow: 'hidden',
  }

  const progressBarFillStyles: React.CSSProperties = {
    height: '100%',
    width: `${progress}%`,
    backgroundColor: theme.colors.primary,
    transition: `width ${getAnimationDuration(300)}ms ease-out`,
  }

  return (
    <div 
      style={containerStyles}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div style={{ position: 'relative' }}>
        <div style={batteryStyles}>
          <div style={batteryCapStyles} />
          <div style={batteryFillStyles} />
          <svg
            style={lightningBoltStyles}
            viewBox="0 0 24 36"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M14 0L0 20h8l-2 16L18 16h-8z" />
          </svg>
        </div>
      </div>

      <p style={messageStyles}>{message}</p>

      {showProgress && (
        <div style={progressBarContainerStyles}>
          <div style={progressBarFillStyles} />
        </div>
      )}

      <style jsx>{`
        @keyframes batteryCharge {
          0% {
            width: 20%;
          }
          50% {
            width: 80%;
          }
          100% {
            width: 20%;
          }
        }

        @keyframes pulse {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes batteryCharge {
            0%, 100% {
              width: 50%;
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
          }
        }
      `}</style>
    </div>
  )
}

// Skeleton loader component for content placeholders
interface SkeletonLoaderProps {
  width?: string | number
  height?: string | number
  variant?: 'text' | 'circular' | 'rectangular'
  animation?: 'pulse' | 'wave' | 'none'
  className?: string
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = '20px',
  variant = 'text',
  animation = 'pulse',
  className = '',
}) => {
  const { theme } = useTheme()
  const { shouldAnimate } = useReducedMotion()

  const getVariantStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      backgroundColor: theme.colors.border,
      position: 'relative',
      overflow: 'hidden',
    }

    switch (variant) {
      case 'circular':
        return {
          ...baseStyles,
          width: width,
          height: width, // Make it square, then round it
          borderRadius: '50%',
        }
      case 'rectangular':
        return {
          ...baseStyles,
          width,
          height,
          borderRadius: theme.radius.md,
        }
      case 'text':
      default:
        return {
          ...baseStyles,
          width,
          height,
          borderRadius: theme.radius.sm,
          marginBottom: '8px',
        }
    }
  }

  const shimmerStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(
      90deg,
      transparent 0%,
      ${theme.colors.background} 50%,
      transparent 100%
    )`,
    animation: shouldAnimate && animation === 'wave' 
      ? 'shimmer 1.5s ease-in-out infinite' 
      : 'none',
  }

  const pulseAnimation = shouldAnimate && animation === 'pulse' 
    ? 'pulse-skeleton 1.5s ease-in-out infinite' 
    : 'none'

  return (
    <div 
      className={className}
      style={{
        ...getVariantStyles(),
        animation: pulseAnimation,
      }}
      aria-busy="true"
      aria-label="Loading content"
      role="status"
    >
      {animation === 'wave' && <div style={shimmerStyles} />}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes pulse-skeleton {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes shimmer {
            0%, 100% {
              transform: translateX(0);
            }
          }
          
          @keyframes pulse-skeleton {
            0%, 100% {
              opacity: 0.8;
            }
          }
        }
      `}</style>
    </div>
  )
}

// Inline loader for buttons and small areas
interface InlineLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

export const InlineLoader: React.FC<InlineLoaderProps> = ({
  size = 'md',
  color,
}) => {
  const { theme } = useTheme()
  const { shouldAnimate } = useReducedMotion()

  const sizes = {
    sm: 16,
    md: 20,
    lg: 24,
  }

  const loaderSize = sizes[size]
  const strokeColor = color || theme.colors.primary

  return (
    <svg
      width={loaderSize}
      height={loaderSize}
      viewBox="0 0 24 24"
      style={{
        animation: shouldAnimate ? 'spin 1s linear infinite' : 'none',
      }}
      role="status"
      aria-label="Loading"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={strokeColor}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="31.416 31.416"
        transform="rotate(-90 12 12)"
        style={{
          opacity: 0.25,
        }}
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={strokeColor}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="31.416 31.416"
        strokeDashoffset="15.708"
        transform="rotate(-90 12 12)"
      />
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes spin {
            0%, 100% {
              transform: rotate(0deg);
            }
          }
        }
      `}</style>
    </svg>
  )
}