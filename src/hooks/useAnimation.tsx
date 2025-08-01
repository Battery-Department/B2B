'use client'

import { useState, useEffect, useRef } from 'react'
import { animations, respectsReducedMotion } from '@/lib/animations'

// Re-export for component compatibility
export { respectsReducedMotion }

export interface UseAnimationOptions {
  duration?: string
  delay?: number
  trigger?: boolean
  once?: boolean
}

export const useAnimation = (
  animationType: 'fadeIn' | 'slideInUp' | 'slideInDown' | 'slideInLeft' | 'slideInRight' | 'scaleIn',
  options: UseAnimationOptions = {}
) => {
  const { duration = animations.duration.normal, delay = 0, trigger = true, once = true } = options
  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!trigger || (once && hasTriggered)) return

    const timer = setTimeout(() => {
      setIsVisible(true)
      setHasTriggered(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [trigger, delay, once, hasTriggered])

  const animationConfig = animations.entrance[animationType]
  const shouldReduceMotion = respectsReducedMotion()

  const style: React.CSSProperties = {
    ...(!isVisible ? animationConfig.from : animationConfig.to),
    transition: shouldReduceMotion ? 'none' : `${animationConfig.transition}`.replace('300ms', duration),
  }

  return {
    ref: elementRef,
    style,
    isVisible,
  }
}

export const useHover = () => {
  const [isHovered, setIsHovered] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  }

  const getHoverStyle = (baseStyle: React.CSSProperties, hoverOverrides: React.CSSProperties = {}) => {
    const shouldReduceMotion = respectsReducedMotion()
    
    return {
      ...baseStyle,
      transition: shouldReduceMotion ? 'none' : `all ${animations.duration.normal} ${animations.easing.smooth}`,
      cursor: 'pointer',
      ...(isHovered && !shouldReduceMotion ? {
        transform: animations.hover.lift,
        boxShadow: animations.shadow.hover,
        ...hoverOverrides,
      } : {}),
    }
  }

  return {
    ref: elementRef,
    isHovered,
    hoverProps,
    getHoverStyle,
  }
}

export const useFocus = () => {
  const [isFocused, setIsFocused] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  const focusProps = {
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  }

  const getFocusStyle = (baseStyle: React.CSSProperties) => {
    const shouldReduceMotion = respectsReducedMotion()
    
    return {
      ...baseStyle,
      outline: 'none',
      transition: shouldReduceMotion ? 'none' : `box-shadow ${animations.duration.fast} ${animations.easing.easeOut}`,
      ...(isFocused && !shouldReduceMotion ? {
        boxShadow: animations.focus.ring,
      } : {}),
    }
  }

  return {
    ref: elementRef,
    isFocused,
    focusProps,
    getFocusStyle,
  }
}

export const useRipple = () => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
  const nextRippleId = useRef(0)

  const createRipple = (event: React.MouseEvent<HTMLElement>) => {
    const element = event.currentTarget
    const rect = element.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const ripple = {
      id: nextRippleId.current++,
      x,
      y,
    }

    setRipples(prev => [...prev, ripple])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id))
    }, 600)
  }

  const rippleElements = ripples.map(ripple => (
    <span
      key={ripple.id}
      style={{
        position: 'absolute',
        left: ripple.x,
        top: ripple.y,
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: 'currentColor',
        opacity: 0.3,
        pointerEvents: 'none',
        transform: 'translate(-50%, -50%)',
        animation: respectsReducedMotion() ? 'none' : animations.ripple.animation,
      }}
    />
  ))

  return {
    createRipple,
    rippleElements,
  }
}

export const useStaggeredChildren = (childCount: number, delay = 100) => {
  const [visibleChildren, setVisibleChildren] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (respectsReducedMotion()) {
      // Show all children immediately if motion is reduced
      setVisibleChildren(new Set(Array.from({ length: childCount }, (_, i) => i)))
      return
    }

    const timeouts: NodeJS.Timeout[] = []

    for (let i = 0; i < childCount; i++) {
      const timeout = setTimeout(() => {
        setVisibleChildren(prev => new Set([...prev, i]))
      }, i * delay)
      
      timeouts.push(timeout)
    }

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [childCount, delay])

  const getChildStyle = (index: number): React.CSSProperties => {
    const isVisible = visibleChildren.has(index)
    
    if (respectsReducedMotion()) {
      return { opacity: 1, transform: 'translateY(0)' }
    }

    return {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: `all ${animations.duration.normal} ${animations.easing.easeOut}`,
    }
  }

  return { getChildStyle }
}

export const useIntersectionAnimation = (
  animationType: 'fadeIn' | 'slideInUp' | 'slideInDown' | 'slideInLeft' | 'slideInRight' | 'scaleIn',
  options: { threshold?: number; once?: boolean } = {}
) => {
  const { threshold = 0.1, once = true } = options
  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && (!once || !hasTriggered)) {
          setIsVisible(true)
          setHasTriggered(true)
        } else if (!once && !entry.isIntersecting) {
          setIsVisible(false)
        }
      },
      { threshold }
    )

    observer.observe(element)

    return () => observer.unobserve(element)
  }, [threshold, once, hasTriggered])

  const animationConfig = animations.entrance[animationType]
  const shouldReduceMotion = respectsReducedMotion()

  const style: React.CSSProperties = {
    ...(!isVisible ? animationConfig.from : animationConfig.to),
    transition: shouldReduceMotion ? 'none' : animationConfig.transition,
  }

  return {
    ref: elementRef,
    style,
    isVisible,
  }
}