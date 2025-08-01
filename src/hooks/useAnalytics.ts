'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function useAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    // Initialize or get session
    const initSession = async () => {
      let sessionId = sessionStorage.getItem('sessionId')
      let visitorId = localStorage.getItem('visitorId')
      
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
        sessionStorage.setItem('sessionId', sessionId)
      }
      
      if (!visitorId) {
        visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(7)}`
        localStorage.setItem('visitorId', visitorId)
      }

      // Get device info
      const deviceType = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      const screenResolution = `${window.screen.width}x${window.screen.height}`
      
      // Get UTM parameters
      const params = new URLSearchParams(window.location.search)
      const source = params.get('utm_source') || document.referrer || 'direct'
      const medium = params.get('utm_medium') || 'organic'
      const campaign = params.get('utm_campaign') || null

      try {
        await fetch('/api/analytics/track', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            visitorId,
            userId: localStorage.getItem('userId') || null,
            source,
            medium,
            campaign,
            deviceType,
            browser: navigator.userAgent,
            operatingSystem: navigator.platform,
            screenResolution,
            language: navigator.language,
            referrer: document.referrer
          })
        })
      } catch (error) {
        console.error('Failed to initialize analytics session:', error)
      }
    }

    initSession()
  }, [])

  // Track page views
  useEffect(() => {
    const trackPageView = async () => {
      const sessionId = sessionStorage.getItem('sessionId')
      
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userId: localStorage.getItem('userId') || null,
            eventName: 'page_view',
            eventCategory: 'navigation',
            eventData: {
              page: pathname,
              title: document.title,
              url: window.location.href
            },
            page: pathname
          })
        })
      } catch (error) {
        console.error('Failed to track page view:', error)
      }
    }

    trackPageView()
  }, [pathname])

  // Track custom events
  const trackEvent = async (eventName: string, eventData?: any) => {
    const sessionId = sessionStorage.getItem('sessionId')
    
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId: localStorage.getItem('userId') || null,
          eventName,
          eventCategory: eventData?.category || 'interaction',
          eventData,
          page: pathname
        })
      })
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  return { trackEvent }
}