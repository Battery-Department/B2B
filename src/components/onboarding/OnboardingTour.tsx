'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { CallBackProps, STATUS, Step } from 'react-joyride'

const JoyRide = dynamic(() => import('react-joyride'), { ssr: false })

const TOUR_STEPS: Step[] = [
  {
    target: '#line1-card',
    content: '📝 Start here! Click on Line 1 to add your company name or main text that will be engraved on the battery.',
    disableBeacon: true,
    placement: 'bottom'
  },
  {
    target: '#line2-card',
    content: '📝 Add a second line for additional details like phone number, website, or tagline.',
    placement: 'bottom'
  },
  {
    target: '#design-input',
    content: '💬 Describe your design in natural language here. For example: "Add my company logo ABC Construction with phone 555-1234"',
    placement: 'top'
  },
  {
    target: '#battery-preview',
    content: '🔄 Your battery preview appears here. You can drag the text to reposition it anywhere on the battery!',
    placement: 'left'
  },
  {
    target: '#battery-canvas',
    content: '👆 Try it now! Click and drag the text to move it around. On mobile, you can also pinch to zoom to resize the text.',
    placement: 'center',
    styles: {
      options: {
        width: 340
      }
    }
  },
  {
    target: '#text-size-controls',
    content: '🔍 Use these controls to make your text bigger or smaller. Perfect for ensuring your engraving is clearly visible!',
    placement: 'top'
  },
  {
    target: '#get-pricing-btn',
    content: '✅ When you\'re happy with your design, click here to get pricing for your custom batteries!',
    placement: 'top'
  },
  {
    target: '#share-btn',
    content: '📤 Or share your design with a colleague for approval before ordering.',
    placement: 'top'
  }
]

interface OnboardingTourProps {
  onComplete?: () => void
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem('battery-design-tour-completed')
    const tourSkipped = localStorage.getItem('battery-design-tour-skipped')
    
    if (!hasSeenTour && !tourSkipped) {
      // Start tour after a short delay to ensure page is loaded
      const timer = setTimeout(() => {
        setRun(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      if (status === STATUS.FINISHED) {
        localStorage.setItem('battery-design-tour-completed', 'true')
      } else {
        localStorage.setItem('battery-design-tour-skipped', 'true')
      }
      setRun(false)
      onComplete?.()
    }

    if (type === 'step:after') {
      setStepIndex(index + 1)
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

  return (
    <JoyRide
      steps={TOUR_STEPS}
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
  )
}

// Export a helper to restart the tour
export const restartTour = () => {
  localStorage.removeItem('battery-design-tour-completed')
  localStorage.removeItem('battery-design-tour-skipped')
  window.location.reload()
}