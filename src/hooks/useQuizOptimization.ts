'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { QuizResponse } from '@/types/quiz-v2'
import { QuizOptimizationEngine } from '@/services/quiz/optimization-engine'
import { ConversionOptimizer } from '@/services/quiz/conversion-optimizer'

interface OptimizationState {
  isOptimizing: boolean
  nextQuestion: string | null
  shouldSkip: boolean
  adaptiveContent: any
  dropOffRisk: {
    level: 'low' | 'medium' | 'high'
    probability: number
    interventions: string[]
  }
  conversionTriggers: any[]
  optimizedPricing: any
}

interface UseQuizOptimizationOptions {
  sessionId: string
  userProfile?: any
  enableRealTimeOptimization?: boolean
  enableDropOffPrevention?: boolean
  enableConversionOptimization?: boolean
}

export function useQuizOptimization(options: UseQuizOptimizationOptions) {
  const [state, setState] = useState<OptimizationState>({
    isOptimizing: false,
    nextQuestion: null,
    shouldSkip: false,
    adaptiveContent: {},
    dropOffRisk: { level: 'low', probability: 0, interventions: [] },
    conversionTriggers: [],
    optimizedPricing: null
  })

  const optimizationEngine = useRef(new QuizOptimizationEngine())
  const conversionOptimizer = useRef(new ConversionOptimizer())
  const sessionStartTime = useRef(Date.now())
  const lastOptimizationTime = useRef(0)

  const optimizeNext = useCallback(async (currentAnswers: QuizResponse[]) => {
    if (!options.enableRealTimeOptimization) return

    setState(prev => ({ ...prev, isOptimizing: true }))

    try {
      // Get next optimized question
      const nextQuestionResult = await optimizationEngine.current.getNextQuestion(
        options.sessionId,
        currentAnswers,
        options.userProfile
      )

      // Assess drop-off risk
      const timeSpent = Date.now() - sessionStartTime.current
      const dropOffRisk = await optimizationEngine.current.predictDropOffRisk(
        options.sessionId,
        currentAnswers,
        timeSpent / 1000
      )

      // Get conversion triggers
      const conversionTriggers = await conversionOptimizer.current.getConversionTriggers(
        options.sessionId,
        currentAnswers,
        timeSpent / 1000
      )

      setState(prev => ({
        ...prev,
        nextQuestion: nextQuestionResult.nextQuestionId,
        shouldSkip: nextQuestionResult.skipRecommendation || false,
        adaptiveContent: nextQuestionResult.adaptiveContent || {},
        dropOffRisk,
        conversionTriggers,
        isOptimizing: false
      }))

      lastOptimizationTime.current = Date.now()
    } catch (error) {
      console.error('Quiz optimization error:', error)
      setState(prev => ({ ...prev, isOptimizing: false }))
    }
  }, [options.sessionId, options.userProfile, options.enableRealTimeOptimization])

  const optimizePricing = useCallback(async (quizResponses: QuizResponse[]) => {
    if (!options.enableConversionOptimization) return

    try {
      const optimizedPricing = await conversionOptimizer.current.optimizePricing(
        quizResponses,
        options.userProfile
      )

      setState(prev => ({ ...prev, optimizedPricing }))
    } catch (error) {
      console.error('Pricing optimization error:', error)
    }
  }, [options.userProfile, options.enableConversionOptimization])

  const handleDropOffIntervention = useCallback(async (interventionType: string) => {
    // Track intervention effectiveness
    try {
      await fetch('/api/quiz/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: options.sessionId,
          action: 'intervention',
          type: interventionType,
          timestamp: Date.now()
        })
      })
    } catch (error) {
      console.error('Failed to track intervention:', error)
    }
  }, [options.sessionId])

  const getAdaptiveQuestionContent = useCallback((questionId: string) => {
    const adaptations = state.adaptiveContent[questionId] || {}
    
    return {
      language: adaptations.language || 'standard',
      examples: adaptations.examples || [],
      hints: adaptations.budgetHints || adaptations.hints || '',
      skipAvailable: state.shouldSkip && questionId === state.nextQuestion
    }
  }, [state.adaptiveContent, state.shouldSkip, state.nextQuestion])

  const shouldShowIntervention = useCallback(() => {
    if (!options.enableDropOffPrevention) return false
    
    return state.dropOffRisk.level === 'high' || 
           (state.dropOffRisk.level === 'medium' && state.dropOffRisk.probability > 0.6)
  }, [state.dropOffRisk, options.enableDropOffPrevention])

  const getInterventionContent = useCallback(() => {
    if (state.dropOffRisk.interventions.length === 0) return null

    const primaryIntervention = state.dropOffRisk.interventions[0]
    
    const interventionMap: Record<string, any> = {
      'Show progress indicator with encouragement': {
        type: 'progress_encouragement',
        title: 'You\'re doing great!',
        message: 'Just 2 more questions to get your personalized battery recommendation.',
        action: 'continue'
      },
      'Offer live chat assistance': {
        type: 'chat_offer',
        title: 'Need help?',
        message: 'Chat with our battery experts - average response time 30 seconds.',
        action: 'open_chat'
      },
      'Display completion time estimate': {
        type: 'time_estimate',
        title: 'Almost done!',
        message: 'This quiz typically takes 2 more minutes to complete.',
        action: 'continue'
      },
      'Show preview of personalized results': {
        type: 'results_preview',
        title: 'Your results are ready!',
        message: 'Complete the quiz to see your personalized battery recommendations.',
        action: 'continue'
      }
    }

    return interventionMap[primaryIntervention] || null
  }, [state.dropOffRisk.interventions])

  // Real-time optimization trigger
  useEffect(() => {
    if (options.enableRealTimeOptimization) {
      const interval = setInterval(() => {
        const timeSinceLastOptimization = Date.now() - lastOptimizationTime.current
        if (timeSinceLastOptimization > 30000) { // Re-optimize every 30 seconds
          // This would be triggered by answer changes in real usage
        }
      }, 10000)

      return () => clearInterval(interval)
    }
  }, [options.enableRealTimeOptimization])

  return {
    // State
    isOptimizing: state.isOptimizing,
    nextQuestion: state.nextQuestion,
    shouldSkip: state.shouldSkip,
    dropOffRisk: state.dropOffRisk,
    conversionTriggers: state.conversionTriggers,
    optimizedPricing: state.optimizedPricing,

    // Actions
    optimizeNext,
    optimizePricing,
    handleDropOffIntervention,
    
    // Content helpers
    getAdaptiveQuestionContent,
    shouldShowIntervention,
    getInterventionContent,

    // Analytics
    sessionDuration: Date.now() - sessionStartTime.current,
    optimizationCount: lastOptimizationTime.current > 0 ? 1 : 0
  }
}