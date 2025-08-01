'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

export interface QuizOptionProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string
  isSelected?: boolean
  isCorrect?: boolean | null
  isDisabled?: boolean
  showResult?: boolean
  peerPercentage?: number
  index?: number
}

const QuizOption = React.forwardRef<HTMLDivElement, QuizOptionProps>(
  ({
    className,
    label,
    value,
    isSelected = false,
    isCorrect = null,
    isDisabled = false,
    showResult = false,
    peerPercentage,
    index = 0,
    onClick,
    ...props
  }, ref) => {
    const [isAnimating, setIsAnimating] = React.useState(false)

    React.useEffect(() => {
      if (showResult && peerPercentage !== undefined) {
        setIsAnimating(true)
      }
    }, [showResult, peerPercentage])

    const baseStyles = [
      "relative min-h-[80px] p-6 rounded-xl border-2 cursor-pointer",
      "transition-all duration-300 ease-in-out",
      "flex items-center justify-between",
      "hover:shadow-lithi hover:-translate-y-1",
      "active:translate-y-0",
    ]

    const stateStyles = {
      default: [
        "border-[#E6F4FF] bg-white",
        "hover:border-[#006FEE] hover:bg-[#E6F4FF]",
      ],
      selected: [
        "border-[#006FEE] bg-[#E6F4FF]",
        "shadow-lithi",
      ],
      correct: [
        "border-[#10B981] bg-[#F0FDF4]",
        "shadow-lithi",
      ],
      incorrect: [
        "border-[#EF4444] bg-[#FEE2E2]",
        "shadow-lithi",
      ],
      disabled: [
        "opacity-50 cursor-not-allowed",
        "hover:shadow-none hover:translate-y-0",
      ],
    }

    const getStateStyle = () => {
      if (isDisabled) return stateStyles.disabled
      if (showResult && isCorrect === true) return stateStyles.correct
      if (showResult && isCorrect === false && isSelected) return stateStyles.incorrect
      if (isSelected) return stateStyles.selected
      return stateStyles.default
    }

    return (
      <div
        ref={ref}
        className={cn(
          ...baseStyles,
          ...getStateStyle(),
          className
        )}
        onClick={isDisabled ? undefined : onClick}
        role="button"
        aria-selected={isSelected}
        aria-disabled={isDisabled}
        style={{
          animationDelay: `${index * 100}ms`,
        }}
        {...props}
      >
        {/* Option Label */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                "font-bold text-sm transition-all duration-300",
                isSelected || (showResult && isCorrect === true)
                  ? "bg-[#006FEE] text-white"
                  : showResult && isCorrect === false && isSelected
                  ? "bg-[#EF4444] text-white"
                  : "bg-[#F8FAFC] text-[#64748B]"
              )}
            >
              {value}
            </div>
            <span
              className={cn(
                "text-base font-medium transition-colors duration-300",
                isSelected || (showResult && isCorrect === true)
                  ? "text-[#0A051E]"
                  : "text-[#374151]"
              )}
            >
              {label}
            </span>
          </div>
        </div>

        {/* Result Icon */}
        {showResult && isSelected && (
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              "animate-scale-in",
              isCorrect ? "bg-[#10B981]" : "bg-[#EF4444]"
            )}
          >
            {isCorrect ? (
              <Check className="w-5 h-5 text-white" />
            ) : (
              <X className="w-5 h-5 text-white" />
            )}
          </div>
        )}

        {/* Peer Percentage Bar */}
        {showResult && peerPercentage !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#E6F4FF] rounded-b-xl overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-1000 ease-out",
                isCorrect ? "bg-[#10B981]" : "bg-[#006FEE]"
              )}
              style={{
                width: isAnimating ? `${peerPercentage}%` : '0%',
                transitionDelay: `${index * 100 + 300}ms`,
              }}
            />
          </div>
        )}

        {/* Peer Percentage Text */}
        {showResult && peerPercentage !== undefined && isAnimating && (
          <div
            className="absolute -bottom-6 left-0 text-xs text-[#64748B] animate-fade-in"
            style={{
              animationDelay: `${index * 100 + 500}ms`,
            }}
          >
            {peerPercentage}% of users selected this
          </div>
        )}
      </div>
    )
  }
)

QuizOption.displayName = 'QuizOption'

export { QuizOption }