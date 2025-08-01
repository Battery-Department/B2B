'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { QuizResponse } from '@/types/quiz-v2'

interface ConversionMetrics {
  sessionId: string
  startTime: number
  questionStartTimes: Record<string, number>
  questionCompleteTimes: Record<string, number>
  dropOffPoints: string[]
  conversionEvents: ConversionEvent[]
  finalConversion?: {
    type: 'cart' | 'purchase' | 'abandoned'
    value?: number
    timestamp: number
  }
}

interface ConversionEvent {
  type: 'question_start' | 'question_complete' | 'question_skip' | 'intervention_shown' | 'intervention_clicked' | 'cart_add' | 'checkout_start'
  questionId?: string
  timestamp: number
  data?: any
}

interface ConversionFunnel {
  started: number
  questionCompleted: Record<string, number>
  completedQuiz: number
  addedToCart: number
  startedCheckout: number
  completedPurchase: number
}

export function useConversionTracking(sessionId: string, enableTracking: boolean = true) {
  const [metrics, setMetrics] = useState<ConversionMetrics>({
    sessionId,
    startTime: Date.now(),
    questionStartTimes: {},
    questionCompleteTimes: {},
    dropOffPoints: [],
    conversionEvents: []
  })

  const [funnel, setFunnel] = useState<ConversionFunnel>({
    started: 0,
    questionCompleted: {},
    completedQuiz: 0,
    addedToCart: 0,
    startedCheckout: 0,
    completedPurchase: 0
  })

  const trackingEnabled = useRef(enableTracking)
  const isTracking = useRef(false)

  const trackEvent = useCallback((event: Omit<ConversionEvent, 'timestamp'>) => {
    if (!trackingEnabled.current) return

    const newEvent: ConversionEvent = {
      ...event,
      timestamp: Date.now()
    }

    setMetrics(prev => ({
      ...prev,
      conversionEvents: [...prev.conversionEvents, newEvent]
    }))

    // Send to analytics API
    if (enableTracking) {
      fetch('/api/quiz/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'conversion_tracking',
          data: {
            sessionId,
            ...newEvent
          },
          timestamp: newEvent.timestamp
        })
      }).catch(error => {
        console.error('Failed to track conversion event:', error)
      })
    }
  }, [sessionId, enableTracking])

  const trackQuestionStart = useCallback((questionId: string) => {
    if (!trackingEnabled.current) return

    const timestamp = Date.now()
    
    setMetrics(prev => ({
      ...prev,
      questionStartTimes: {
        ...prev.questionStartTimes,
        [questionId]: timestamp
      }
    }))

    trackEvent({
      type: 'question_start',
      questionId,
      data: { timeFromStart: timestamp - metrics.startTime }
    })
  }, [trackEvent, metrics.startTime])

  const trackQuestionComplete = useCallback((questionId: string, response: QuizResponse) => {
    if (!trackingEnabled.current) return

    const timestamp = Date.now()
    const startTime = metrics.questionStartTimes[questionId]
    const timeSpent = startTime ? timestamp - startTime : 0

    setMetrics(prev => ({
      ...prev,
      questionCompleteTimes: {
        ...prev.questionCompleteTimes,
        [questionId]: timestamp
      }
    }))

    trackEvent({
      type: 'question_complete',
      questionId,
      data: {
        timeSpent,
        selectedOptions: response.selectedOptions,
        totalTimeFromStart: timestamp - metrics.startTime
      }
    })

    // Update funnel metrics
    setFunnel(prev => ({
      ...prev,
      questionCompleted: {
        ...prev.questionCompleted,
        [questionId]: (prev.questionCompleted[questionId] || 0) + 1
      }
    }))
  }, [trackEvent, metrics.startTime, metrics.questionStartTimes])

  const trackQuestionSkip = useCallback((questionId: string, reason?: string) => {
    if (!trackingEnabled.current) return

    trackEvent({
      type: 'question_skip',
      questionId,
      data: { reason: reason || 'user_skip' }
    })
  }, [trackEvent])

  const trackDropOff = useCallback((questionId: string, timeSpent: number) => {
    if (!trackingEnabled.current) return

    setMetrics(prev => ({
      ...prev,
      dropOffPoints: [...prev.dropOffPoints, questionId]
    }))

    trackEvent({
      type: 'question_skip',
      questionId,
      data: { 
        reason: 'drop_off',
        timeSpent,
        isDropOff: true
      }
    })
  }, [trackEvent])

  const trackIntervention = useCallback((interventionType: string, questionId?: string, clicked: boolean = false) => {
    if (!trackingEnabled.current) return

    trackEvent({
      type: clicked ? 'intervention_clicked' : 'intervention_shown',
      questionId,
      data: { interventionType }
    })
  }, [trackEvent])

  const trackCartAdd = useCallback((products: any[], totalValue: number) => {
    if (!trackingEnabled.current) return

    trackEvent({
      type: 'cart_add',
      data: {
        products,
        totalValue,
        quizToCartTime: Date.now() - metrics.startTime
      }
    })

    setFunnel(prev => ({ ...prev, addedToCart: prev.addedToCart + 1 }))
  }, [trackEvent, metrics.startTime])

  const trackCheckoutStart = useCallback((cartValue: number) => {
    if (!trackingEnabled.current) return

    trackEvent({
      type: 'checkout_start',
      data: {
        cartValue,
        quizToCheckoutTime: Date.now() - metrics.startTime
      }
    })

    setFunnel(prev => ({ ...prev, startedCheckout: prev.startedCheckout + 1 }))
  }, [trackEvent, metrics.startTime])

  const trackFinalConversion = useCallback((type: 'cart' | 'purchase' | 'abandoned', value?: number) => {
    if (!trackingEnabled.current) return

    const finalConversion = {
      type,
      value,
      timestamp: Date.now()
    }

    setMetrics(prev => ({ ...prev, finalConversion }))

    if (type === 'purchase') {
      setFunnel(prev => ({ ...prev, completedPurchase: prev.completedPurchase + 1 }))
    }

    // Send final conversion data
    fetch('/api/quiz/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'final_conversion',
        data: {
          sessionId,
          ...finalConversion,
          totalSessionTime: finalConversion.timestamp - metrics.startTime,
          totalQuestions: Object.keys(metrics.questionCompleteTimes).length,
          dropOffCount: metrics.dropOffPoints.length
        },
        timestamp: finalConversion.timestamp
      })
    }).catch(error => {
      console.error('Failed to track final conversion:', error)
    })
  }, [sessionId, metrics.startTime, metrics.questionCompleteTimes, metrics.dropOffPoints])

  const getConversionRate = useCallback(() => {
    const totalEvents = metrics.conversionEvents.length
    if (totalEvents === 0) return 0

    const conversions = metrics.conversionEvents.filter(e => 
      e.type === 'cart_add' || e.type === 'checkout_start'
    ).length

    return (conversions / totalEvents) * 100
  }, [metrics.conversionEvents])

  const getTimeToConversion = useCallback(() => {
    const cartEvent = metrics.conversionEvents.find(e => e.type === 'cart_add')
    if (!cartEvent) return null

    return cartEvent.timestamp - metrics.startTime
  }, [metrics.conversionEvents, metrics.startTime])

  const getQuestionMetrics = useCallback((questionId: string) => {
    const startTime = metrics.questionStartTimes[questionId]
    const completeTime = metrics.questionCompleteTimes[questionId]
    const timeSpent = startTime && completeTime ? completeTime - startTime : null

    const wasDroppedOff = metrics.dropOffPoints.includes(questionId)
    const wasCompleted = !!completeTime

    return {
      timeSpent,
      wasCompleted,
      wasDroppedOff,
      completionRate: wasCompleted ? 100 : 0
    }
  }, [metrics.questionStartTimes, metrics.questionCompleteTimes, metrics.dropOffPoints])

  const getFunnelMetrics = useCallback(() => {
    const questionKeys = Object.keys(funnel.questionCompleted)
    const avgQuestionCompletion = questionKeys.length > 0 
      ? Object.values(funnel.questionCompleted).reduce((sum, count) => sum + count, 0) / questionKeys.length
      : 0

    return {
      quizStarted: 1, // Current session
      questionCompletion: avgQuestionCompletion,
      quizCompleted: funnel.completedQuiz,
      cartConversion: funnel.addedToCart,
      checkoutConversion: funnel.startedCheckout,
      purchaseConversion: funnel.completedPurchase,
      
      // Conversion rates
      quizToCart: funnel.addedToCart > 0 ? (funnel.addedToCart / 1) * 100 : 0,
      cartToCheckout: funnel.startedCheckout > 0 ? (funnel.startedCheckout / Math.max(funnel.addedToCart, 1)) * 100 : 0,
      checkoutToPurchase: funnel.completedPurchase > 0 ? (funnel.completedPurchase / Math.max(funnel.startedCheckout, 1)) * 100 : 0,
      overallConversion: funnel.completedPurchase > 0 ? (funnel.completedPurchase / 1) * 100 : 0
    }
  }, [funnel])

  // Initialize tracking
  useEffect(() => {
    if (enableTracking && !isTracking.current) {
      isTracking.current = true
      setFunnel(prev => ({ ...prev, started: prev.started + 1 }))
      
      trackEvent({
        type: 'question_start',
        data: { isFirstQuestion: true }
      })
    }
  }, [enableTracking, trackEvent])

  // Cleanup tracking on unmount
  useEffect(() => {
    return () => {
      if (isTracking.current && !metrics.finalConversion) {
        trackFinalConversion('abandoned')
      }
    }
  }, [trackFinalConversion, metrics.finalConversion])

  return {
    // Tracking functions
    trackQuestionStart,
    trackQuestionComplete,
    trackQuestionSkip,
    trackDropOff,
    trackIntervention,
    trackCartAdd,
    trackCheckoutStart,
    trackFinalConversion,

    // Analytics functions
    getConversionRate,
    getTimeToConversion,
    getQuestionMetrics,
    getFunnelMetrics,

    // Raw data
    metrics,
    funnel,

    // Session info
    sessionDuration: Date.now() - metrics.startTime,
    questionsCompleted: Object.keys(metrics.questionCompleteTimes).length,
    hasConverted: !!metrics.finalConversion && metrics.finalConversion.type !== 'abandoned'
  }
}