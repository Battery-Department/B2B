'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import dynamic from 'next/dynamic'

// Safely import Joyride with error handling
const JoyRide = dynamic(
  () => import('react-joyride').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => null
  }
)

// Define simplified steps focused on text editing
const getSteps = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  
  const steps = [
    {
      target: '#line1-card',
      content: 'Click here to add Line 1 text',
      disableBeacon: true,
      placement: 'bottom' as const
    },
    {
      target: '#line2-card',
      content: 'Click here to add Line 2 text',
      placement: 'bottom' as const
    },
    {
      target: '#battery-canvas',
      content: isMobile 
        ? 'Tap and drag text to move • Pinch to resize'
        : 'Click and drag text to move • Use +/- buttons to resize',
      placement: 'center' as const
    }
  ]
  
  return steps
}

interface OnboardingTourProps {
  onComplete?: () => void
  autoStart?: boolean
}

const OnboardingTourSafe = forwardRef<{ startTour: () => void }, OnboardingTourProps>(
  ({ onComplete, autoStart = false }, ref) => {
    const [run, setRun] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [tourSteps, setTourSteps] = useState<any[]>([])

    // Method to start tour manually
    const startTour = () => {
      setRun(true)
    }

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      startTour
    }))

  useEffect(() => {
    setMounted(true)
    // Set tour steps based on screen size
    setTourSteps(getSteps())
    
    // Only auto-start if explicitly requested
    if (autoStart) {
      // Check if user has seen the tour
      try {
        const hasSeenTour = localStorage.getItem('battery-design-tour-completed')
        const tourSkipped = localStorage.getItem('battery-design-tour-skipped')
        
        if (!hasSeenTour && !tourSkipped) {
          // Start tour after a short delay to ensure page is loaded
          const timer = setTimeout(() => {
            setRun(true)
          }, 1500)
          return () => clearTimeout(timer)
        }
      } catch (error) {
        console.error('Error checking tour status:', error)
      }
    }
  }, [autoStart])

  const handleJoyrideCallback = (data: any) => {
    try {
      const { status, type } = data
      
      if (status === 'finished' || status === 'skipped') {
        if (status === 'finished') {
          localStorage.setItem('battery-design-tour-completed', 'true')
        } else {
          localStorage.setItem('battery-design-tour-skipped', 'true')
        }
        setRun(false)
        onComplete?.()
      }
    } catch (error) {
      console.error('Error in tour callback:', error)
      setRun(false)
    }
  }

  const joyrideStyles = {
    options: {
      primaryColor: '#006FEE',
      backgroundColor: '#FFFFFF',
      textColor: '#111827',
      width: 320,
      zIndex: 10000,
      arrowColor: '#FFFFFF',
      overlayColor: 'rgba(0, 0, 0, 0.5)'
    },
    tooltip: {
      borderRadius: 12,
      padding: 20,
      fontSize: 15,
      lineHeight: 1.4
    },
    tooltipContent: {
      textAlign: 'left' as const
    },
    buttonNext: {
      backgroundColor: '#006FEE',
      borderRadius: 8,
      color: '#FFFFFF',
      fontSize: 14,
      padding: '8px 16px'
    },
    buttonBack: {
      color: '#6B7280',
      fontSize: 14,
      marginRight: 8
    },
    buttonSkip: {
      color: '#9CA3AF',
      fontSize: 14
    },
    spotlight: {
      borderRadius: 12
    }
  }

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return null
  }

    return (
      <>
        {JoyRide && tourSteps.length > 0 && (
          <JoyRide
            steps={tourSteps}
            run={run}
            continuous
            showProgress
            showSkipButton
            scrollToFirstStep
            scrollOffset={100}
            spotlightPadding={8}
            disableOverlayClose={false}
            locale={{
              back: 'Back',
              close: 'Close',
              last: 'Finish',
              next: 'Next',
              skip: 'Skip tour'
            }}
            callback={handleJoyrideCallback}
            styles={joyrideStyles}
          />
        )}
      </>
    )
  }
)

OnboardingTourSafe.displayName = 'OnboardingTourSafe'

export default OnboardingTourSafe

// Export a helper to restart the tour
export const restartTour = () => {
  try {
    localStorage.removeItem('battery-design-tour-completed')
    localStorage.removeItem('battery-design-tour-skipped')
    window.location.reload()
  } catch (error) {
    console.error('Error restarting tour:', error)
  }
}