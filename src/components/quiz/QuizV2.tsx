'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle,
  AlertCircle,
  Zap,
  Users,
  Clock,
  Battery,
  Building,
  Home,
  Shield,
  Truck,
  Calculator,
  BarChart3,
  Phone,
  Mail,
  User,
  Lock,
  Star,
  HelpCircle
} from 'lucide-react'

import { QuizSession, QuizQuestion, QuizOption, MicroInteraction } from '@/types/quiz-v2'
import { QUIZ_BRANDS, sortBrandsByRelevance } from '@/config/quiz-brands'
import { USER_TYPE_QUESTION, getQuestionsForPath, getNextQuestion } from '@/config/quiz-questions'

interface QuizV2Props {
  utmParams?: Record<string, string>
}

export default function QuizV2({ utmParams = {} }: QuizV2Props) {
  const router = useRouter()
  const [session, setSession] = useState<QuizSession>({
    sessionId: '',
    currentStep: 0,
    responses: {},
    startTime: new Date(),
    lastActivity: new Date(),
    utmParams
  })
  
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>(USER_TYPE_QUESTION)
  const [questions, setQuestions] = useState<QuizQuestion[]>([USER_TYPE_QUESTION])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showIntervention, setShowIntervention] = useState(false)
  const [interventionMessage, setInterventionMessage] = useState('')
  
  // Micro-interaction tracking
  const interactionQueue = useRef<MicroInteraction[]>([])
  const hesitationTimer = useRef<NodeJS.Timeout>()
  const lastInteractionTime = useRef<number>(Date.now())
  
  // Touch gesture support
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  
  // Initialize session
  useEffect(() => {
    initializeSession()
  }, [])
  
  // Track micro-interactions
  useEffect(() => {
    const flushInteractions = setInterval(() => {
      if (interactionQueue.current.length > 0) {
        sendInteractionBatch(interactionQueue.current)
        interactionQueue.current = []
      }
    }, 5000)
    
    return () => clearInterval(flushInteractions)
  }, [])
  
  // Hesitation detection
  useEffect(() => {
    hesitationTimer.current = setTimeout(() => {
      const timeSinceLastInteraction = Date.now() - lastInteractionTime.current
      if (timeSinceLastInteraction > 30000 && !isSubmitting) {
        showInterventionModal('Take your time! Most contractors spend 2-3 minutes total.')
      }
    }, 30000)
    
    return () => {
      if (hesitationTimer.current) {
        clearTimeout(hesitationTimer.current)
      }
    }
  }, [currentQuestion, isSubmitting])
  
  const initializeSession = async () => {
    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        screen: {
          width: screen.width,
          height: screen.height,
          pixelRatio: window.devicePixelRatio
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      }
      
      const response = await fetch('/api/quiz/v2/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: 'battery-multi-brand-v2',
          source: utmParams.utm_source || 'direct',
          utmParams,
          deviceInfo,
          version: '2.0'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSession(prev => ({
          ...prev,
          sessionId: data.sessionId
        }))
        
        // Track quiz start
        trackEvent('quiz_started', {
          source: utmParams.utm_source,
          campaign: utmParams.utm_campaign,
          device_type: window.innerWidth < 768 ? 'mobile' : 'desktop'
        })
      }
    } catch (error) {
      console.error('Failed to initialize session:', error)
    }
  }
  
  const trackEvent = (eventName: string, eventData: any) => {
    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, eventData)
    }
    
    // Send to internal tracking
    fetch('/api/quiz/intelligence/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventName,
        data: eventData,
        sessionId: session.sessionId
      })
    }).catch(console.error)
  }
  
  const trackMicroInteraction = (event: MicroInteraction) => {
    interactionQueue.current.push(event)
    lastInteractionTime.current = Date.now()
    
    // Check for specific patterns
    if (event.type === 'hesitation' && event.duration && event.duration > 2000) {
      trackEvent('hesitation_detected', {
        question_id: currentQuestion.id,
        hesitation_time: event.duration,
        element: event.element
      })
    }
  }
  
  const sendInteractionBatch = async (interactions: MicroInteraction[]) => {
    try {
      await fetch('/api/quiz/intelligence/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          interactions
        })
      })
    } catch (error) {
      console.error('Failed to send interactions:', error)
    }
  }
  
  const showInterventionModal = (message: string) => {
    setInterventionMessage(message)
    setShowIntervention(true)
    
    trackEvent('intervention_triggered', {
      type: 'hesitation',
      trigger_reason: 'slow_response',
      message
    })
  }
  
  const handleResponse = async (value: any, metadata?: any) => {
    const startTime = Date.now()
    const updatedResponses = { ...session.responses }
    
    // Handle different question types
    if (currentQuestion.type === 'multi-choice') {
      const currentValues = updatedResponses[currentQuestion.id] || []
      if (currentValues.includes(value)) {
        updatedResponses[currentQuestion.id] = currentValues.filter((v: any) => v !== value)
      } else {
        updatedResponses[currentQuestion.id] = [...currentValues, value]
      }
    } else {
      updatedResponses[currentQuestion.id] = value
    }
    
    // Update session
    const updatedSession = {
      ...session,
      responses: updatedResponses,
      lastActivity: new Date()
    }
    setSession(updatedSession)
    
    // Special handling for user type selection
    if (currentQuestion.id === 'user-type') {
      updatedSession.userType = value
      const pathQuestions = getQuestionsForPath(value)
      // Insert brand selection after user type
      const brandQuestion: QuizQuestion = {
        id: 'battery-brand',
        type: 'brand-grid',
        question: value === 'professional' 
          ? "What's your crew's main battery platform?"
          : "Which battery system do you use?",
        subtitle: "We carry all major brands with guaranteed compatibility",
        options: sortBrandsByRelevance(value as 'professional' | 'personal').map(brand => ({
          id: brand.id,
          value: brand.id,
          label: brand.displayName,
          description: brand.voltage,
          color: brand.color
        }))
      }
      const newQuestions = [USER_TYPE_QUESTION, brandQuestion, ...pathQuestions]
      setQuestions(newQuestions)
      console.log('Updated questions array:', newQuestions.length, 'questions')
    }
    
    // Handle brand selection
    if (currentQuestion.id === 'battery-brand') {
      updatedSession.selectedBrand = value
    }
    
    // Track response
    trackEvent('question_answered', {
      question_id: currentQuestion.id,
      question_text: currentQuestion.question,
      answer_value: value,
      answer_text: currentQuestion.options.find(opt => opt.value === value)?.label,
      time_to_answer: Date.now() - startTime,
      question_number: session.currentStep + 1,
      total_questions: questions.length
    })
    
    // Save response to backend
    if (session.sessionId) {
      fetch('/api/quiz/v2/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          questionId: currentQuestion.id,
          answerValue: value,
          answerMetadata: {
            timeToAnswer: Date.now() - startTime,
            ...metadata
          }
        })
      }).catch(console.error)
    }
    
    // Auto-advance for single choice questions (but not for user-type, brand-grid which need manual continue)
    if ((currentQuestion.type === 'single-choice' || currentQuestion.type === 'visual-cards') && 
        currentQuestion.id !== 'user-type' && currentQuestion.type !== 'brand-grid') {
      setTimeout(() => {
        handleNext(updatedSession)
      }, 500)
    } else if (currentQuestion.id === 'user-type') {
      // For user type, pass the newly built questions array directly to handleNext
      const pathQuestions = getQuestionsForPath(updatedSession.userType!)
      const brandQuestion: QuizQuestion = {
        id: 'battery-brand',
        type: 'brand-grid',
        question: updatedSession.userType === 'professional' 
          ? "What's your crew's main battery platform?"
          : "Which battery system do you use?",
        subtitle: "We carry all major brands with guaranteed compatibility",
        options: sortBrandsByRelevance(updatedSession.userType as 'professional' | 'personal').map(brand => ({
          id: brand.id,
          value: brand.id,
          label: brand.displayName,
          description: brand.voltage,
          color: brand.color
        }))
      }
      const newQuestions = [USER_TYPE_QUESTION, brandQuestion, ...pathQuestions]
      
      setTimeout(() => {
        handleNext(updatedSession, newQuestions)
      }, 800)
    }
  }
  
  const handleNext = (sessionToUse = session, questionsArray = questions) => {
    console.log(`handleNext: step ${sessionToUse.currentStep}, total questions: ${questionsArray.length}`)
    
    if (sessionToUse.currentStep < questionsArray.length - 1) {
      const nextStep = sessionToUse.currentStep + 1
      const nextQuestion = questionsArray[nextStep]
      
      console.log(`Moving to step ${nextStep}: ${nextQuestion.id}`)
      setCurrentQuestion(nextQuestion)
      setSession({ ...sessionToUse, currentStep: nextStep })
    } else {
      console.log('Quiz complete, moving to contact capture')
      // Save quiz state to localStorage before navigating
      if (typeof window !== 'undefined') {
        localStorage.setItem('quiz-user-type', sessionToUse.userType || '')
        localStorage.setItem('quiz-session-id', sessionToUse.sessionId)
        localStorage.setItem('quiz-brand', sessionToUse.selectedBrand || '')
      }
      // Move to contact capture
      router.push(`/quiz/contact?session=${sessionToUse.sessionId}`)
    }
  }
  
  const handlePrevious = () => {
    if (session.currentStep > 0) {
      const prevStep = session.currentStep - 1
      setCurrentQuestion(questions[prevStep])
      setSession({ ...session, currentStep: prevStep })
    }
  }
  
  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    }
    
    const distanceX = touchStart.x - touchEnd.x
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(touchStart.y - touchEnd.y)
    
    if (isHorizontalSwipe && Math.abs(distanceX) > 50) {
      if (distanceX > 0) {
        // Swipe left - next
        if (isCurrentQuestionAnswered()) {
          handleNext()
        }
      } else {
        // Swipe right - previous
        if (session.currentStep > 0) {
          handlePrevious()
        }
      }
    }
  }
  
  const isCurrentQuestionAnswered = () => {
    const response = session.responses[currentQuestion.id]
    if (currentQuestion.type === 'multi-choice') {
      return response && response.length > 0
    }
    return response !== undefined && response !== null
  }
  
  const progressPercentage = ((session.currentStep + 1) / questions.length) * 100
  
  // Render different question types
  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'visual-cards':
        return (
          <div className="grid gap-4">
            {currentQuestion.options.map((option) => {
              const isSelected = session.responses[currentQuestion.id] === option.value
              return (
                <motion.button
                  key={option.id}
                  onClick={() => handleResponse(option.value)}
                  className={`
                    relative p-6 rounded-2xl border-2 transition-all duration-200
                    ${isSelected 
                      ? 'border-[#006FEE] bg-blue-50 scale-[0.98]' 
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25'
                    }
                  `}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={() => trackMicroInteraction({
                    sessionId: session.sessionId,
                    timestamp: Date.now(),
                    questionId: currentQuestion.id,
                    type: 'hover',
                    element: option.id
                  })}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      text-4xl
                      ${isSelected ? 'animate-pulse' : ''}
                    `}>
                      {option.label.split(' ')[0]}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-lg mb-1">{option.title}</h3>
                      <p className="text-sm text-gray-600">{option.description}</p>
                      {option.highlights && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {option.highlights.map((highlight, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {highlight}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-6 h-6 text-[#006FEE]" />
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        )
        
      case 'brand-grid':
        return (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {currentQuestion.options.map((option) => {
              const isSelected = session.responses[currentQuestion.id] === option.value
              const brand = QUIZ_BRANDS.find(b => b.id === option.value)
              
              return (
                <motion.button
                  key={option.id}
                  onClick={() => handleResponse(option.value)}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all duration-200
                    hover:shadow-md hover:scale-105
                    flex flex-col items-center justify-center
                    min-h-[100px]
                    ${isSelected ? 
                      'border-[#006FEE] bg-blue-50 ring-4 ring-[#006FEE] ring-opacity-20' : 
                      'border-gray-200 bg-white hover:border-gray-300'
                    }
                  `}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    borderColor: isSelected ? '#006FEE' : undefined,
                    backgroundColor: isSelected ? `${brand?.color}15` : undefined
                  }}
                >
                  <div 
                    className="text-lg font-bold mb-1"
                    style={{ color: brand?.color || '#000' }}
                  >
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-600">
                    {option.description}
                  </div>
                  {session.userType === 'professional' && brand?.marketShare && (
                    <div className="absolute top-1 right-1 text-xs bg-gray-100 px-1 rounded">
                      {brand.marketShare}
                    </div>
                  )}
                  {isSelected && (
                    <motion.div
                      className="absolute -top-1 -right-1"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="w-6 h-6 bg-[#006FEE] rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>
        )
        
      case 'single-choice':
        return (
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = session.responses[currentQuestion.id] === option.value
              return (
                <motion.button
                  key={option.id}
                  onClick={() => handleResponse(option.value)}
                  className={`
                    w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left
                    ${isSelected 
                      ? 'border-[#006FEE] bg-blue-50' 
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25'
                    }
                  `}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {option.icon && (
                        <span className="text-2xl">{option.icon}</span>
                      )}
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
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-[#006FEE]" />
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        )
        
      case 'multi-choice':
        return (
          <>
            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const selectedValues = session.responses[currentQuestion.id] || []
                const isSelected = selectedValues.includes(option.value)
                return (
                  <motion.button
                    key={option.id}
                    onClick={() => handleResponse(option.value)}
                    className={`
                      w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left
                      ${isSelected 
                        ? 'border-[#006FEE] bg-blue-50' 
                        : 'border-gray-200 bg-white hover:border-blue-300'
                      }
                    `}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center
                        ${isSelected ? 'border-[#006FEE] bg-[#006FEE]' : 'border-gray-300'}
                      `}>
                        {isSelected && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="text-sm text-gray-600">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-xl mt-4">
              <AlertCircle className="w-4 h-4" />
              <span>You can select multiple options</span>
            </div>
          </>
        )
        
      default:
        return null
    }
  }
  
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header with progress */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="px-4 py-3">
          {/* Progress Bar */}
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={handlePrevious}
              disabled={session.currentStep === 0}
              className={`
                p-2 rounded-full transition-all
                ${session.currentStep === 0 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-blue-50 active:scale-95'
                }
              `}
            >
              <ChevronLeft className="w-5 h-5 text-[#006FEE]" />
            </button>
            
            <div className="flex-1">
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#006FEE] to-[#0050B3] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
            
            <span className="text-sm font-medium text-[#006FEE] min-w-[3rem] text-right">
              {session.currentStep + 1}/{questions.length}
            </span>
          </div>
          
          {/* Branding */}
          <div className="flex items-center justify-center gap-2 text-sm text-[#006FEE]">
            <Battery className="w-4 h-4" />
            <span className="font-semibold">Lithi</span>
            <span className="text-gray-400">•</span>
            <span>Find Your Perfect Battery Match</span>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="px-4 py-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Question Header */}
            <div className="text-center space-y-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {currentQuestion.question}
              </h1>
              {currentQuestion.subtitle && (
                <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                  {currentQuestion.subtitle}
                </p>
              )}
            </div>
            
            {/* Question Options */}
            {renderQuestion()}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Bottom Navigation */}
      {(currentQuestion.type === 'multi-choice' || currentQuestion.type === 'brand-grid') && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => handleNext()}
              disabled={!isCurrentQuestionAnswered()}
              className={`
                w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2
                ${isCurrentQuestionAnswered()
                  ? 'bg-gradient-to-r from-[#006FEE] to-[#0050B3] hover:shadow-lg active:scale-[0.98]'
                  : 'bg-gray-300 cursor-not-allowed'
                }
              `}
            >
              <span>Continue</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Intervention Modal */}
      <AnimatePresence>
        {showIntervention && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowIntervention(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-[#006FEE]" />
                </div>
                <h3 className="text-lg font-semibold">Need Help?</h3>
              </div>
              <p className="text-gray-600 mb-6">{interventionMessage}</p>
              <button
                onClick={() => setShowIntervention(false)}
                className="w-full py-3 px-6 bg-[#006FEE] text-white rounded-xl font-medium hover:bg-[#0050B3] transition-colors"
              >
                Got it, thanks!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile swipe hint */}
      {session.currentStep === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-24 left-0 right-0 text-center text-sm text-gray-500"
        >
          Swipe left/right to navigate • Tap to select
        </motion.div>
      )}
    </div>
  )
}