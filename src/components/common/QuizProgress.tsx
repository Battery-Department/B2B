'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export interface QuizProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  currentStep: number
  totalSteps: number
  showStepIndicators?: boolean
  variant?: 'default' | 'compact'
}

const QuizProgress = React.forwardRef<HTMLDivElement, QuizProgressProps>(
  ({
    className,
    currentStep,
    totalSteps,
    showStepIndicators = true,
    variant = 'default',
    ...props
  }, ref) => {
    const progress = (currentStep / totalSteps) * 100
    const isComplete = currentStep === totalSteps

    return (
      <div
        ref={ref}
        className={cn(
          "w-full",
          variant === 'compact' ? 'space-y-2' : 'space-y-4',
          className
        )}
        {...props}
      >
        {/* Progress Text */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#374151]">
              Question {currentStep} of {totalSteps}
            </span>
          </div>
          <span className="text-sm font-semibold text-[#006FEE]">
            {Math.round(progress)}% Complete
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div
            className={cn(
              "w-full rounded-full bg-[#E6F4FF] overflow-hidden",
              variant === 'compact' ? 'h-2' : 'h-3'
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                "bg-gradient-to-r from-[#006FEE] to-[#0050B3]",
                "relative overflow-hidden"
              )}
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{
                  animation: 'shimmer 2s linear infinite',
                  transform: 'translateX(-100%)',
                }}
              />
            </div>
          </div>

          {/* Step Indicators */}
          {showStepIndicators && variant === 'default' && (
            <div className="absolute top-0 w-full h-full flex items-center">
              {Array.from({ length: totalSteps }).map((_, index) => {
                const stepNumber = index + 1
                const isCompleted = stepNumber < currentStep
                const isCurrent = stepNumber === currentStep
                const stepPosition = (stepNumber / totalSteps) * 100

                return (
                  <div
                    key={index}
                    className="absolute"
                    style={{ left: `${stepPosition}%`, transform: 'translateX(-50%)' }}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full border-2 bg-white",
                        "transition-all duration-300 ease-out",
                        "flex items-center justify-center",
                        isCompleted || isCurrent
                          ? "border-[#006FEE] shadow-lithi-sm"
                          : "border-[#E6F4FF]"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-3 h-3 text-[#006FEE]" />
                      ) : isCurrent ? (
                        <div className="w-2 h-2 rounded-full bg-[#006FEE] animate-pulse" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-[#E6F4FF]" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Milestone Messages */}
        {variant === 'default' && (
          <div className="text-center">
            {isComplete && (
              <p className="text-sm font-medium text-[#10B981] animate-fade-in">
                🎉 Quiz Complete! Great job!
              </p>
            )}
            {!isComplete && currentStep > totalSteps * 0.5 && (
              <p className="text-sm text-[#64748B] animate-fade-in">
                You're halfway there! Keep going!
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

QuizProgress.displayName = 'QuizProgress'

// Additional CSS for shimmer animation
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(200%);
    }
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = shimmerStyles
  document.head.appendChild(styleElement)
}

export { QuizProgress }