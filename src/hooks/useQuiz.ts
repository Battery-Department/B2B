'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { QuizQuestion, QuizResponse, QuizSession, QuizRecommendation } from '@/types/quiz-v2'
import { useRouter } from 'next/navigation'

interface UseQuizOptions {
  onComplete?: (session: QuizSession) => void
  autoSave?: boolean
  abTestVariant?: string
}

export function useQuiz(questions: QuizQuestion[], options?: UseQuizOptions) {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<QuizResponse[]>([])
  const [session, setSession] = useState<QuizSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const questionStartTime = useRef<number>(Date.now())
  const sessionId = useRef<string>(`quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

  // Initialize session
  useEffect(() => {
    const newSession: QuizSession = {
      id: sessionId.current,
      startedAt: new Date().toISOString(),
      responses: [],
      abTestVariant: options?.abTestVariant,
      deviceType: getDeviceType(),
    }
    setSession(newSession)
    
    // Track quiz start
    trackEvent('quiz_started', {
      sessionId: sessionId.current,
      variant: options?.abTestVariant,
    })
  }, [options?.abTestVariant])

  // Auto-save progress
  useEffect(() => {
    if (options?.autoSave && session && responses.length > 0) {
      saveProgress()
    }
  }, [responses, options?.autoSave])

  const currentQuestion = questions[currentQuestionIndex]
  const isFirstQuestion = currentQuestionIndex === 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const saveProgress = async () => {
    try {
      await fetch('/api/quiz/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId.current,
          responses,
          currentQuestionIndex,
        }),
      })
    } catch (err) {
      console.error('Failed to save progress:', err)
    }
  }

  const submitResponse = useCallback(async (selectedOptions: string[]) => {
    if (!currentQuestion) return

    const timeSpent = Math.round((Date.now() - questionStartTime.current) / 1000)
    
    const response: QuizResponse = {
      questionId: currentQuestion.id,
      selectedOptions,
      timestamp: Date.now(),
      timeSpent,
    }

    setResponses(prev => [...prev, response])

    // Track response
    trackEvent('quiz_question_answered', {
      sessionId: sessionId.current,
      questionId: currentQuestion.id,
      selectedOptions,
      timeSpent,
    })

    // Move to next question or complete
    if (isLastQuestion) {
      await completeQuiz([...responses, response])
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
      questionStartTime.current = Date.now()
    }
  }, [currentQuestion, isLastQuestion, responses])

  const goToPrevious = useCallback(() => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1)
      questionStartTime.current = Date.now()
    }
  }, [isFirstQuestion])

  const completeQuiz = async (allResponses: QuizResponse[]) => {
    setIsLoading(true)
    setError(null)

    try {
      // Get recommendation from API
      const response = await fetch('/api/quiz/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId.current,
          responses: allResponses,
          abTestVariant: options?.abTestVariant,
        }),
      })

      if (!response.ok) throw new Error('Failed to complete quiz')

      const data = await response.json()
      const recommendation: QuizRecommendation = data.recommendation

      const completedSession: QuizSession = {
        ...session!,
        completedAt: new Date().toISOString(),
        responses: allResponses,
        recommendation,
      }

      setSession(completedSession)

      // Track completion
      trackEvent('quiz_completed', {
        sessionId: sessionId.current,
        totalQuestions: questions.length,
        totalTimeSpent: allResponses.reduce((sum, r) => sum + r.timeSpent, 0),
        recommendedProducts: recommendation.products.length,
        totalPrice: recommendation.totalPrice,
      })

      // Call completion callback
      options?.onComplete?.(completedSession)

      // Navigate to results
      router.push(`/customer/quiz/results?session=${sessionId.current}`)
    } catch (err) {
      console.error('Failed to complete quiz:', err)
      setError('Failed to get your personalized recommendation. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const skipQuestion = useCallback(() => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1)
      questionStartTime.current = Date.now()
      
      trackEvent('quiz_question_skipped', {
        sessionId: sessionId.current,
        questionId: currentQuestion?.id,
      })
    }
  }, [currentQuestion, isLastQuestion])

  const restart = useCallback(() => {
    setCurrentQuestionIndex(0)
    setResponses([])
    sessionId.current = `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    questionStartTime.current = Date.now()
    
    const newSession: QuizSession = {
      id: sessionId.current,
      startedAt: new Date().toISOString(),
      responses: [],
      abTestVariant: options?.abTestVariant,
      deviceType: getDeviceType(),
    }
    setSession(newSession)
  }, [options?.abTestVariant])

  return {
    // State
    currentQuestion,
    currentQuestionIndex,
    totalQuestions: questions.length,
    responses,
    session,
    isLoading,
    error,
    progress,
    isFirstQuestion,
    isLastQuestion,
    
    // Actions
    submitResponse,
    goToPrevious,
    skipQuestion,
    restart,
    saveProgress,
  }
}

// Helper functions
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

function trackEvent(eventName: string, data: Record<string, any>) {
  // Send to analytics API
  if (typeof window !== 'undefined') {
    fetch('/api/quiz/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: eventName, data, timestamp: Date.now() }),
    }).catch(console.error)
  }
}