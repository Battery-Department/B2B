'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QuizOption } from '@/components/common/QuizOption'
import { QuizInsight } from '@/components/common/QuizInsight'
import { QuizProgress } from '@/components/common/QuizProgress'
import { QuizQuestion } from '@/types/quiz-v2'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedQuestionWithStatsProps {
  question: QuizQuestion
  onSubmit: (selectedOptions: string[]) => void
  onPrevious?: () => void
  onSkip?: () => void
  currentStep: number
  totalSteps: number
  isFirstQuestion: boolean
  isLastQuestion: boolean
  initialSelected?: string[]
}

export function EnhancedQuestionWithStats({
  question,
  onSubmit,
  onPrevious,
  onSkip,
  currentStep,
  totalSteps,
  isFirstQuestion,
  isLastQuestion,
  initialSelected = [],
}: EnhancedQuestionWithStatsProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(initialSelected)
  const [showStats, setShowStats] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset when question changes
  useEffect(() => {
    setSelectedOptions(initialSelected)
    setShowStats(false)
  }, [question.id, initialSelected])

  const handleOptionClick = (optionValue: string) => {
    if (question.allowMultiple) {
      setSelectedOptions(prev => 
        prev.includes(optionValue)
          ? prev.filter(v => v !== optionValue)
          : [...prev, optionValue]
      )
    } else {
      setSelectedOptions([optionValue])
    }
  }

  const handleSubmit = async () => {
    if (selectedOptions.length === 0 && question.required) return
    
    setIsSubmitting(true)
    setShowStats(true)
    
    // Simulate API delay for dramatic effect
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    onSubmit(selectedOptions)
    setIsSubmitting(false)
  }

  const canSubmit = !question.required || selectedOptions.length > 0

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <QuizProgress 
          currentStep={currentStep}
          totalSteps={totalSteps}
          showStepIndicators={true}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Question Header */}
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0A051E]">
              {question.title}
            </h2>
            {question.subtitle && (
              <p className="text-[#64748B] text-lg">
                {question.subtitle}
              </p>
            )}
          </div>

          {/* Insight Box */}
          {question.insight && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <QuizInsight
                type={question.insight.type}
                title={question.insight.title}
                description={question.insight.description}
              />
            </motion.div>
          )}

          {/* Options */}
          <div className="space-y-4">
            {question.options.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <QuizOption
                  label={option.label}
                  value={option.value}
                  isSelected={selectedOptions.includes(option.value)}
                  isDisabled={isSubmitting}
                  onClick={() => handleOptionClick(option.value)}
                  peerPercentage={showStats ? option.stats?.percentage : undefined}
                  index={index}
                />
                
                {/* Live Stats Text */}
                {showStats && option.stats && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="mt-2 ml-14 text-sm text-[#64748B]"
                  >
                    <span className="font-semibold text-[#006FEE]">
                      {option.stats.percentage}%
                    </span>{' '}
                    of contractors chose this option
                    {option.stats.userCount > 1000 && (
                      <span className="text-xs ml-1">
                        ({(option.stats.userCount / 1000).toFixed(1)}k+ users)
                      </span>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Multiple Selection Hint */}
          {question.allowMultiple && (
            <div className="flex items-center gap-2 text-sm text-[#64748B]">
              <Info className="w-4 h-4" />
              <span>You can select multiple options</span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstQuestion || isSubmitting}
          className="group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Previous
        </Button>

        <div className="flex gap-4 flex-1 sm:flex-none justify-end">
          {!question.required && !isLastQuestion && (
            <Button
              variant="ghost"
              onClick={onSkip}
              disabled={isSubmitting}
              className="text-[#64748B]"
            >
              Skip
            </Button>
          )}
          
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={cn(
              "min-w-[140px] group",
              isSubmitting && "animate-pulse"
            )}
          >
            {isSubmitting ? (
              <>
                <span className="inline-block animate-spin mr-2">⚡</span>
                Analyzing...
              </>
            ) : (
              <>
                {isLastQuestion ? 'Get Results' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}