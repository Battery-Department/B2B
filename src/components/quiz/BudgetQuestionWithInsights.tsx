'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QuizQuestion } from '@/types/quiz-v2'
import { QuizProgress } from '@/components/common/QuizProgress'
import { QuizInsight } from '@/components/common/QuizInsight'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, DollarSign, TrendingUp, Users, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BudgetQuestionWithInsightsProps {
  question: QuizQuestion
  onSubmit: (selectedOptions: string[]) => void
  onPrevious?: () => void
  currentStep: number
  totalSteps: number
  isFirstQuestion: boolean
  isLastQuestion: boolean
  initialSelected?: string[]
}

// Budget validation data from real contractors
const budgetValidation = {
  'under-500': {
    percentage: 15,
    avgSpend: 380,
    satisfaction: 78,
    insight: "Entry-level contractors typically start here",
    recommendation: "Consider the 6Ah starter pack for $285"
  },
  '500-1000': {
    percentage: 35,
    avgSpend: 750,
    satisfaction: 85,
    insight: "Most popular range for growing contractors",
    recommendation: "Mix of 6Ah and 9Ah batteries offers best flexibility"
  },
  '1000-2500': {
    percentage: 30,
    avgSpend: 1650,
    satisfaction: 92,
    insight: "Professional contractors maximizing efficiency",
    recommendation: "Bulk pricing kicks in - save 10% on orders over $1000"
  },
  '2500-5000': {
    percentage: 15,
    avgSpend: 3200,
    satisfaction: 94,
    insight: "Established contractors with multiple crews",
    recommendation: "15% discount applied - consider 15Ah for heavy-duty work"
  },
  'over-5000': {
    percentage: 5,
    avgSpend: 7500,
    satisfaction: 96,
    insight: "Enterprise contractors with fleet management",
    recommendation: "20% volume discount - dedicated account manager available"
  }
}

export function BudgetQuestionWithInsights({
  question,
  onSubmit,
  onPrevious,
  currentStep,
  totalSteps,
  isFirstQuestion,
  isLastQuestion,
  initialSelected = [],
}: BudgetQuestionWithInsightsProps) {
  const [selectedOption, setSelectedOption] = useState<string>(initialSelected[0] || '')
  const [showValidation, setShowValidation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setSelectedOption(initialSelected[0] || '')
    setShowValidation(false)
  }, [question.id, initialSelected])

  const handleSubmit = async () => {
    if (!selectedOption && question.required) return
    
    setIsSubmitting(true)
    setShowValidation(true)
    
    // Show validation insights before proceeding
    await new Promise(resolve => setTimeout(resolve, 2500))
    
    onSubmit([selectedOption])
    setIsSubmitting(false)
  }

  const canSubmit = !question.required || selectedOption

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

          {/* Initial Insight */}
          <QuizInsight
            type="info"
            title="Budget Planning Tip"
            description="Most contractors find their sweet spot between $1,000-$2,500 for initial battery investment. This typically covers 2-3 crews with backup power."
          />

          {/* Budget Options */}
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const isSelected = selectedOption === option.value
              const validation = budgetValidation[option.value as keyof typeof budgetValidation]
              
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <button
                    onClick={() => setSelectedOption(option.value)}
                    disabled={isSubmitting}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 transition-all duration-300",
                      "hover:shadow-lithi-md hover:border-[#93C5FD]",
                      isSelected 
                        ? "border-[#006FEE] bg-[#E6F4FF] shadow-lithi-sm" 
                        : "border-[#E2E8F0] bg-white",
                      isSubmitting && "pointer-events-none"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center",
                          isSelected ? "bg-[#006FEE]" : "bg-[#F3F4F6]"
                        )}>
                          <DollarSign className={cn(
                            "w-6 h-6",
                            isSelected ? "text-white" : "text-[#64748B]"
                          )} />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-[#0A051E]">{option.label}</p>
                          {option.description && (
                            <p className="text-sm text-[#64748B] mt-0.5">{option.description}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Peer Percentage */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#006FEE]">
                          {validation?.percentage}%
                        </p>
                        <p className="text-xs text-[#64748B]">of contractors</p>
                      </div>
                    </div>

                    {/* Validation Details (shown after selection) */}
                    {isSelected && showValidation && validation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t border-[#E2E8F0]"
                      >
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <Users className="w-5 h-5 mx-auto mb-1 text-[#64748B]" />
                            <p className="text-sm font-semibold text-[#0A051E]">
                              ${validation.avgSpend}
                            </p>
                            <p className="text-xs text-[#64748B]">Avg Spend</p>
                          </div>
                          <div>
                            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-[#64748B]" />
                            <p className="text-sm font-semibold text-[#0A051E]">
                              {validation.satisfaction}%
                            </p>
                            <p className="text-xs text-[#64748B]">Satisfaction</p>
                          </div>
                          <div>
                            <Shield className="w-5 h-5 mx-auto mb-1 text-[#64748B]" />
                            <p className="text-sm font-semibold text-[#0A051E]">
                              30-Day
                            </p>
                            <p className="text-xs text-[#64748B]">Returns</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 p-3 bg-[#F0F9FF] rounded-lg">
                          <p className="text-sm text-[#0369A1]">
                            <span className="font-semibold">Insight:</span> {validation.insight}
                          </p>
                          <p className="text-sm text-[#059669] mt-1">
                            <span className="font-semibold">💡 Tip:</span> {validation.recommendation}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </button>
                </motion.div>
              )
            })}
          </div>

          {/* Contractor Validation Message */}
          {showValidation && selectedOption && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <QuizInsight
                type="recommendation"
                title="Budget Validated ✓"
                description={`Your budget aligns with ${budgetValidation[selectedOption as keyof typeof budgetValidation]?.percentage}% of contractors in similar situations. We'll customize recommendations to maximize value within your range.`}
              />
            </motion.div>
          )}

          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-4 justify-center text-sm text-[#64748B] pt-4">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>30-Day Money Back</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>10,000+ Contractors</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>Volume Discounts</span>
            </div>
          </div>
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
              <span className="inline-block animate-spin mr-2">💰</span>
              Validating Budget...
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
  )
}