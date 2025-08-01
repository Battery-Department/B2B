'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface AccessibilityPreferences {
  highContrast: boolean
  largeFonts: boolean
  focusVisible: boolean
  announcements: boolean
  keyboardNavigation: boolean
  screenReader: boolean
  reducedTransparency: boolean
  colorBlindnessMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
}

export interface UseAccessibilityOptions {
  enableAnnouncements?: boolean
  focusManagement?: boolean
  keyboardTrapping?: boolean
}

export const useAccessibility = (options: UseAccessibilityOptions = {}) => {
  const {
    enableAnnouncements = true,
    focusManagement = true,
    keyboardTrapping = false,
  } = options

  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    highContrast: false,
    largeFonts: false,
    focusVisible: true,
    announcements: enableAnnouncements,
    keyboardNavigation: true,
    screenReader: false,
    reducedTransparency: false,
    colorBlindnessMode: 'none',
  })

  const announcementRef = useRef<HTMLDivElement | null>(null)
  const [lastFocusedElement, setLastFocusedElement] = useState<HTMLElement | null>(null)

  // Detect system accessibility preferences
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkMediaQueries = () => {
      const updates: Partial<AccessibilityPreferences> = {}

      // High contrast
      if (window.matchMedia('(prefers-contrast: high)').matches) {
        updates.highContrast = true
      }

      // Reduced transparency
      if (window.matchMedia('(prefers-reduced-transparency: reduce)').matches) {
        updates.reducedTransparency = true
      }

      // Large fonts (system zoom > 100%)
      const fontScale = window.devicePixelRatio || 1
      if (fontScale > 1.2) {
        updates.largeFonts = true
      }

      if (Object.keys(updates).length > 0) {
        setPreferences(prev => ({ ...prev, ...updates }))
      }
    }

    checkMediaQueries()

    // Listen for changes
    const contrastQuery = window.matchMedia('(prefers-contrast: high)')
    const transparencyQuery = window.matchMedia('(prefers-reduced-transparency: reduce)')
    
    contrastQuery.addEventListener('change', checkMediaQueries)
    transparencyQuery.addEventListener('change', checkMediaQueries)

    return () => {
      contrastQuery.removeEventListener('change', checkMediaQueries)
      transparencyQuery.removeEventListener('change', checkMediaQueries)
    }
  }, [])

  // Detect screen reader usage
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check for common screen reader indicators
    const hasScreenReader = 
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver') ||
      'speechSynthesis' in window

    if (hasScreenReader) {
      setPreferences(prev => ({ ...prev, screenReader: true }))
    }
  }, [])

  // Create announcement region for screen readers
  useEffect(() => {
    if (!enableAnnouncements || typeof window === 'undefined') return

    if (!announcementRef.current) {
      const announcer = document.createElement('div')
      announcer.setAttribute('aria-live', 'polite')
      announcer.setAttribute('aria-atomic', 'true')
      announcer.setAttribute('aria-relevant', 'text')
      announcer.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `
      document.body.appendChild(announcer)
      announcementRef.current = announcer
    }

    return () => {
      if (announcementRef.current) {
        document.body.removeChild(announcementRef.current)
        announcementRef.current = null
      }
    }
  }, [enableAnnouncements])

  // Announce messages to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!preferences.announcements || !announcementRef.current) return

    announcementRef.current.setAttribute('aria-live', priority)
    announcementRef.current.textContent = message

    // Clear after announcement
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = ''
      }
    }, 1000)
  }, [preferences.announcements])

  // Focus management utilities
  const saveFocus = useCallback(() => {
    if (focusManagement && document.activeElement instanceof HTMLElement) {
      setLastFocusedElement(document.activeElement)
    }
  }, [focusManagement])

  const restoreFocus = useCallback(() => {
    if (focusManagement && lastFocusedElement) {
      lastFocusedElement.focus()
      setLastFocusedElement(null)
    }
  }, [focusManagement, lastFocusedElement])

  const trapFocus = useCallback((container: HTMLElement) => {
    if (!keyboardTrapping) return () => {}

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [keyboardTrapping])

  // Keyboard navigation helpers
  const isKeyboardUser = useRef(false)

  useEffect(() => {
    if (!preferences.keyboardNavigation || typeof window === 'undefined') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        isKeyboardUser.current = true
        document.body.classList.add('keyboard-user')
      }
    }

    const handleMouseDown = () => {
      isKeyboardUser.current = false
      document.body.classList.remove('keyboard-user')
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [preferences.keyboardNavigation])

  // Apply accessibility styles
  useEffect(() => {
    if (typeof window === 'undefined') return

    const root = document.documentElement

    // High contrast mode
    if (preferences.highContrast) {
      root.setAttribute('data-high-contrast', 'true')
    } else {
      root.removeAttribute('data-high-contrast')
    }

    // Large fonts
    if (preferences.largeFonts) {
      root.style.fontSize = '1.25em'
    } else {
      root.style.fontSize = ''
    }

    // Reduced transparency
    if (preferences.reducedTransparency) {
      root.setAttribute('data-reduced-transparency', 'true')
    } else {
      root.removeAttribute('data-reduced-transparency')
    }

    // Color blindness mode
    root.setAttribute('data-colorblind-mode', preferences.colorBlindnessMode)

    // Focus visible
    if (preferences.focusVisible) {
      root.setAttribute('data-focus-visible', 'true')
    } else {
      root.removeAttribute('data-focus-visible')
    }
  }, [preferences])

  // Skip link utility
  const createSkipLink = useCallback((targetId: string, label: string = 'Skip to main content') => {
    return {
      href: `#${targetId}`,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        const target = document.getElementById(targetId)
        if (target) {
          target.focus()
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
          announce(`Skipped to ${label}`)
        }
      },
      className: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50',
      children: label,
    }
  }, [announce])

  // ARIA helpers
  const generateId = useCallback((prefix: string = 'a11y') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const getAriaProps = useCallback((config: {
    label?: string
    labelledBy?: string
    describedBy?: string
    expanded?: boolean
    selected?: boolean
    disabled?: boolean
    required?: boolean
    invalid?: boolean
    live?: 'polite' | 'assertive' | 'off'
    role?: string
  }) => {
    const props: Record<string, any> = {}

    if (config.label) props['aria-label'] = config.label
    if (config.labelledBy) props['aria-labelledby'] = config.labelledBy
    if (config.describedBy) props['aria-describedby'] = config.describedBy
    if (config.expanded !== undefined) props['aria-expanded'] = config.expanded
    if (config.selected !== undefined) props['aria-selected'] = config.selected
    if (config.disabled !== undefined) props['aria-disabled'] = config.disabled
    if (config.required !== undefined) props['aria-required'] = config.required
    if (config.invalid !== undefined) props['aria-invalid'] = config.invalid
    if (config.live) props['aria-live'] = config.live
    if (config.role) props.role = config.role

    return props
  }, [])

  return {
    preferences,
    setPreferences,
    announce,
    saveFocus,
    restoreFocus,
    trapFocus,
    createSkipLink,
    generateId,
    getAriaProps,
    isKeyboardUser: isKeyboardUser.current,
  }
}

// Hook for managing focus within components
export const useFocusManagement = (isOpen: boolean = true) => {
  const previousFocus = useRef<HTMLElement | null>(null)
  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocus.current = document.activeElement as HTMLElement
      
      // Focus first focusable element in container
      if (containerRef.current) {
        const focusable = containerRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement
        
        if (focusable) {
          focusable.focus()
        }
      }
    }

    return () => {
      // Restore focus when unmounting or closing
      if (previousFocus.current && isOpen) {
        previousFocus.current.focus()
      }
    }
  }, [isOpen])

  return { containerRef }
}

// Hook for managing ARIA live regions
export const useLiveRegion = () => {
  const regionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const region = document.createElement('div')
    region.setAttribute('aria-live', 'polite')
    region.setAttribute('aria-atomic', 'true')
    region.className = 'sr-only'
    document.body.appendChild(region)
    regionRef.current = region

    return () => {
      if (regionRef.current && document.body.contains(regionRef.current)) {
        document.body.removeChild(regionRef.current)
      }
    }
  }, [])

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (regionRef.current) {
      regionRef.current.setAttribute('aria-live', priority)
      regionRef.current.textContent = message
      
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = ''
        }
      }, 1000)
    }
  }, [])

  return { announce }
}