'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Lightbulb, Info, AlertCircle, HelpCircle, Zap, TrendingUp, Shield, Star } from 'lucide-react'

export interface QuizInsightProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description: string
  type?: 'tip' | 'info' | 'warning' | 'help' | 'insight' | 'performance' | 'security' | 'recommendation'
  icon?: React.ReactNode
  showIcon?: boolean
  variant?: 'default' | 'compact'
}

const iconMap = {
  tip: Lightbulb,
  info: Info,
  warning: AlertCircle,
  help: HelpCircle,
  insight: Zap,
  performance: TrendingUp,
  security: Shield,
  recommendation: Star,
}

const typeStyles = {
  tip: {
    bg: '#FEF3C7',
    border: '#FDE68A',
    icon: '#F59E0B',
    title: '#92400E',
    text: '#78350F',
  },
  info: {
    bg: '#E6F4FF',
    border: '#93C5FD',
    icon: '#006FEE',
    title: '#1E3A8A',
    text: '#1E40AF',
  },
  warning: {
    bg: '#FEE2E2',
    border: '#FCA5A5',
    icon: '#EF4444',
    title: '#991B1B',
    text: '#DC2626',
  },
  help: {
    bg: '#F3E8FF',
    border: '#C4B5FD',
    icon: '#7C3AED',
    title: '#5B21B6',
    text: '#6D28D9',
  },
  insight: {
    bg: '#F0FDF4',
    border: '#BBF7D0',
    icon: '#10B981',
    title: '#14532D',
    text: '#059669',
  },
  performance: {
    bg: '#FFF7ED',
    border: '#FDBA74',
    icon: '#EA580C',
    title: '#7C2D12',
    text: '#C2410C',
  },
  security: {
    bg: '#EFF6FF',
    border: '#93C5FD',
    icon: '#2563EB',
    title: '#1E3A8A',
    text: '#1D4ED8',
  },
  recommendation: {
    bg: '#FEFCE8',
    border: '#FDE047',
    icon: '#EAB308',
    title: '#713F12',
    text: '#A16207',
  },
}

const QuizInsight = React.forwardRef<HTMLDivElement, QuizInsightProps>(
  ({
    className,
    title,
    description,
    type = 'tip',
    icon,
    showIcon = true,
    variant = 'default',
    ...props
  }, ref) => {
    const styles = typeStyles[type]
    const IconComponent = iconMap[type]

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-xl border-2 transition-all duration-300",
          "animate-fade-in",
          variant === 'compact' ? 'p-3' : 'p-4',
          className
        )}
        style={{
          backgroundColor: styles.bg,
          borderColor: styles.border,
        }}
        {...props}
      >
        <div className="flex gap-3">
          {/* Icon */}
          {showIcon && (
            <div
              className={cn(
                "flex-shrink-0 rounded-lg flex items-center justify-center",
                variant === 'compact' ? 'w-8 h-8' : 'w-10 h-10'
              )}
              style={{
                backgroundColor: `${styles.icon}20`,
              }}
            >
              {icon || (
                <IconComponent
                  className={variant === 'compact' ? 'w-4 h-4' : 'w-5 h-5'}
                  style={{ color: styles.icon }}
                />
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 space-y-1">
            {title && (
              <h4
                className={cn(
                  "font-semibold",
                  variant === 'compact' ? 'text-sm' : 'text-base'
                )}
                style={{ color: styles.title }}
              >
                {title}
              </h4>
            )}
            <p
              className={cn(
                variant === 'compact' ? 'text-xs' : 'text-sm',
                "leading-relaxed"
              )}
              style={{ color: styles.text }}
            >
              {description}
            </p>
          </div>
        </div>

        {/* Decorative corner accent */}
        <div
          className="absolute top-0 right-0 w-12 h-12 rounded-tr-xl rounded-bl-xl opacity-10"
          style={{
            background: `linear-gradient(135deg, ${styles.icon} 0%, transparent 100%)`,
          }}
        />
      </div>
    )
  }
)

QuizInsight.displayName = 'QuizInsight'

// Pre-built insight components for common use cases
export const QuizTip: React.FC<Omit<QuizInsightProps, 'type'>> = (props) => (
  <QuizInsight type="tip" title="Pro Tip" {...props} />
)

export const QuizInfo: React.FC<Omit<QuizInsightProps, 'type'>> = (props) => (
  <QuizInsight type="info" title="Did You Know?" {...props} />
)

export const QuizWarning: React.FC<Omit<QuizInsightProps, 'type'>> = (props) => (
  <QuizInsight type="warning" title="Important Note" {...props} />
)

export const QuizHelp: React.FC<Omit<QuizInsightProps, 'type'>> = (props) => (
  <QuizInsight type="help" title="Need Help?" {...props} />
)

export const QuizPerformance: React.FC<Omit<QuizInsightProps, 'type'>> = (props) => (
  <QuizInsight type="performance" title="Performance Insight" {...props} />
)

export const QuizSecurity: React.FC<Omit<QuizInsightProps, 'type'>> = (props) => (
  <QuizInsight type="security" title="Security Tip" {...props} />
)

export const QuizRecommendation: React.FC<Omit<QuizInsightProps, 'type'>> = (props) => (
  <QuizInsight type="recommendation" title="We Recommend" {...props} />
)

export { QuizInsight }