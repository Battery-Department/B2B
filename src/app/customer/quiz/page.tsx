'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Users,
  MapPin,
  Clock
} from 'lucide-react'

// Mobile-first quiz types
interface QuizQuestion {
  id: string
  type: 'single-choice' | 'multi-choice' | 'scale' | 'image-choice'
  title: string
  subtitle?: string
  options: QuizOption[]
  required: boolean
  category: string
}

interface QuizOption {
  id: string
  label: string
  value: string | number
  icon?: React.ReactNode
  image?: string
  description?: string
}

interface QuizSession {
  id: string
  currentStep: number
  responses: Record<string, any>
  startTime: Date
  lastActivity: Date
}

// Sample quiz questions optimized for battery contractors
const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'project-size',
    type: 'image-choice',
    title: 'What size team do you typically work with?',
    subtitle: 'This helps us recommend the right battery fleet size',
    category: 'team-assessment',
    required: true,
    options: [
      {
        id: 'solo',
        label: 'Solo/1-2 People',
        value: 'small',
        icon: <Users size={24} />,
        description: '1-2 workers, residential projects'
      },
      {
        id: 'mid',
        label: 'Mid-Size Team',
        value: 'medium',
        icon: <Users size={24} />,
        description: '3-6 workers, commercial projects'
      },
      {
        id: 'large',
        label: 'Large Crew',
        value: 'large',
        icon: <Users size={24} />,
        description: '7+ workers, major construction'
      }
    ]
  },
  {
    id: 'daily-runtime',
    type: 'single-choice',
    title: 'How many hours do you typically use power tools per day?',
    subtitle: 'This determines your daily battery capacity needs',
    category: 'usage-pattern',
    required: true,
    options: [
      { id: 'light', label: '2-4 hours', value: 'light', description: 'Light usage - finish work, occasional cutting' },
      { id: 'moderate', label: '4-6 hours', value: 'moderate', description: 'Moderate usage - standard construction day' },
      { id: 'heavy', label: '6-8 hours', value: 'heavy', description: 'Heavy usage - full day heavy construction' },
      { id: 'continuous', label: '8+ hours', value: 'continuous', description: 'Continuous usage - non-stop operations' }
    ]
  },
  {
    id: 'primary-tools',
    type: 'multi-choice',
    title: 'Which tools do you use most frequently?',
    subtitle: 'Select all that apply - this affects battery drain calculations',
    category: 'tool-assessment',
    required: true,
    options: [
      { id: 'circular-saw', label: 'Circular Saw', value: 'circular_saw', icon: <Zap size={20} /> },
      { id: 'impact-driver', label: 'Impact Driver', value: 'impact_driver', icon: <Zap size={20} /> },
      { id: 'drill', label: 'Drill', value: 'drill', icon: <Zap size={20} /> },
      { id: 'reciprocating-saw', label: 'Reciprocating Saw', value: 'reciprocating_saw', icon: <Zap size={20} /> },
      { id: 'grinder', label: 'Grinder', value: 'grinder', icon: <Zap size={20} /> },
      { id: 'miter-saw', label: 'Miter Saw', value: 'miter_saw', icon: <Zap size={20} /> }
    ]
  },
  {
    id: 'budget-range',
    type: 'scale',
    title: 'What\'s your typical monthly budget for batteries and power supplies?',
    subtitle: 'This helps us recommend the most cost-effective solution',
    category: 'budget-assessment',
    required: true,
    options: [
      { id: 'budget-1', label: '$500-$1,000', value: 500 },
      { id: 'budget-2', label: '$1,000-$2,500', value: 1000 },
      { id: 'budget-3', label: '$2,500-$5,000', value: 2500 },
      { id: 'budget-4', label: '$5,000+', value: 5000 }
    ]
  }
]

export default function QuizPage() {
  const router = useRouter()
  const [session, setSession] = useState<QuizSession>({
    id: `quiz-${Date.now()}`,
    currentStep: 0,
    responses: {},
    startTime: new Date(),
    lastActivity: new Date()
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  const currentQuestion = QUIZ_QUESTIONS[session.currentStep]
  const isLastQuestion = session.currentStep === QUIZ_QUESTIONS.length - 1
  const progressPercentage = ((session.currentStep + 1) / QUIZ_QUESTIONS.length) * 100

  // Handle response selection
  const handleResponse = (questionId: string, value: any) => {
    const updatedResponses = { ...session.responses }
    
    if (currentQuestion.type === 'multi-choice') {
      const currentValues = updatedResponses[questionId] || []
      if (currentValues.includes(value)) {
        updatedResponses[questionId] = currentValues.filter((v: any) => v !== value)
      } else {
        updatedResponses[questionId] = [...currentValues, value]
      }
    } else {
      updatedResponses[questionId] = value
    }

    setSession(prev => ({
      ...prev,
      responses: updatedResponses,
      lastActivity: new Date()
    }))

    // Auto-advance for single choice questions on mobile
    if (currentQuestion.type === 'single-choice' || currentQuestion.type === 'image-choice') {
      setTimeout(() => {
        if (!isLastQuestion) {
          handleNext()
        }
      }, 500)
    }
  }

  // Navigation
  const handleNext = () => {
    if (session.currentStep < QUIZ_QUESTIONS.length - 1) {
      setSession(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1
      }))
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (session.currentStep > 0) {
      setSession(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1
      }))
    }
  }

  // Touch gestures for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return

    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd

    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0 && !isLastQuestion) {
        // Swipe left - next question
        handleNext()
      } else if (diff < 0 && session.currentStep > 0) {
        // Swipe right - previous question
        handlePrevious()
      }
    }
  }

  // Submit quiz
  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Store quiz data
      localStorage.setItem('quiz-responses', JSON.stringify(session.responses))
      
      // Navigate to results
      router.push('/customer/quiz/results')
    } catch (error) {
      console.error('Error submitting quiz:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if current question is answered
  const isCurrentQuestionAnswered = () => {
    const response = session.responses[currentQuestion.id]
    if (currentQuestion.type === 'multi-choice') {
      return response && response.length > 0
    }
    return response !== undefined && response !== null
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-blue-100">
        <div className="px-4 py-3">
          {/* Progress Bar */}
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={handlePrevious}
              disabled={session.currentStep === 0}
              className={`p-2 rounded-full transition-all ${
                session.currentStep === 0 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-blue-50 active:scale-95'
              }`}
            >
              <ChevronLeft size={20} className="text-blue-600" />
            </button>
            
            <div className="flex-1">
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            
            <span className="text-sm font-medium text-blue-600 min-w-[3rem] text-right">
              {session.currentStep + 1}/{QUIZ_QUESTIONS.length}
            </span>
          </div>
          
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <Clock size={14} />
            <span>Step {session.currentStep + 1} • {currentQuestion.category.replace('-', ' ')}</span>
          </div>
        </div>
      </header>

      {/* Main Question Content */}
      <main className="px-4 py-6 max-w-md mx-auto">
        <div className="space-y-6">
          {/* Question Header */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {currentQuestion.title}
            </h1>
            {currentQuestion.subtitle && (
              <p className="text-gray-600 text-base leading-relaxed">
                {currentQuestion.subtitle}
              </p>
            )}
          </div>

          {/* Question Options */}
          <div className="space-y-3">
            {currentQuestion.type === 'image-choice' && (
              <div className="grid gap-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = session.responses[currentQuestion.id] === option.value
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleResponse(currentQuestion.id, option.value)}
                      className={`
                        p-4 rounded-2xl border-2 transition-all duration-200 text-left
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50 scale-[0.98]' 
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25 active:scale-[0.97]'
                        }
                      `}
                      style={{ minHeight: '48px' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          flex-shrink-0 p-2 rounded-xl
                          ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                        `}>
                          {option.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">
                            {option.label}
                          </div>
                          {option.description && (
                            <div className="text-sm text-gray-600">
                              {option.description}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle size={20} className="text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {currentQuestion.type === 'single-choice' && (
              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = session.responses[currentQuestion.id] === option.value
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleResponse(currentQuestion.id, option.value)}
                      className={`
                        w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25'
                        }
                      `}
                      style={{ minHeight: '48px' }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {option.label}
                          </div>
                          {option.description && (
                            <div className="text-sm text-gray-600 mt-1">
                              {option.description}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle size={20} className="text-blue-500" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {currentQuestion.type === 'multi-choice' && (
              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const selectedValues = session.responses[currentQuestion.id] || []
                  const isSelected = selectedValues.includes(option.value)
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleResponse(currentQuestion.id, option.value)}
                      className={`
                        w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:border-blue-300'
                        }
                      `}
                      style={{ minHeight: '48px' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          flex-shrink-0 p-1 rounded-lg
                          ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                        `}>
                          {option.icon}
                        </div>
                        <div className="flex-1 font-semibold text-gray-900">
                          {option.label}
                        </div>
                        {isSelected && (
                          <CheckCircle size={20} className="text-blue-500" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {currentQuestion.type === 'scale' && (
              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = session.responses[currentQuestion.id] === option.value
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleResponse(currentQuestion.id, option.value)}
                      className={`
                        w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left
                        ${isSelected 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 bg-white hover:border-green-300'
                        }
                      `}
                      style={{ minHeight: '48px' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-gray-900">
                          {option.label}
                        </div>
                        {isSelected && (
                          <CheckCircle size={20} className="text-green-500" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Multi-choice helper text */}
          {currentQuestion.type === 'multi-choice' && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-xl">
              <AlertCircle size={16} />
              <span>You can select multiple options</span>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-md mx-auto">
          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!isCurrentQuestionAnswered() || isSubmitting}
              className={`
                w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-200
                ${isCurrentQuestionAnswered() && !isSubmitting
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-[0.98]'
                  : 'bg-gray-300 cursor-not-allowed'
                }
              `}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Getting Your Results...</span>
                </div>
              ) : (
                'Get My Battery Recommendations'
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!isCurrentQuestionAnswered()}
              className={`
                w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2
                ${isCurrentQuestionAnswered()
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98]'
                  : 'bg-gray-300 cursor-not-allowed'
                }
              `}
            >
              <span>Continue</span>
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Swipe hint for first question */}
      {session.currentStep === 0 && (
        <div className="fixed bottom-24 left-0 right-0 text-center text-sm text-gray-500 animate-pulse">
          Swipe left/right to navigate • Tap to select
        </div>
      )}
    </div>
  )
}