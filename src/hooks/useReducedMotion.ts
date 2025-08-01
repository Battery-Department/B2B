'use client'

import { useState, useEffect } from 'react'

export interface MotionPreferences {
  prefersReducedMotion: boolean
  respectReducedMotion: boolean
  animationIntensity: 'none' | 'reduced' | 'normal' | 'enhanced'
  allowAnimations: boolean
  enableParallax: boolean
  enableAutoplay: boolean
  batteryConscious: boolean
}

export interface UseReducedMotionOptions {
  respectUserPreference?: boolean
  defaultIntensity?: 'none' | 'reduced' | 'normal' | 'enhanced'
  batteryThreshold?: number // Battery percentage below which to reduce motion
}

export const useReducedMotion = (options: UseReducedMotionOptions = {}) => {
  const {
    respectUserPreference = true,
    defaultIntensity = 'normal',
    batteryThreshold = 20,
  } = options

  const [preferences, setPreferences] = useState<MotionPreferences>(() => ({
    prefersReducedMotion: false,
    respectReducedMotion: respectUserPreference,
    animationIntensity: defaultIntensity,
    allowAnimations: true,
    enableParallax: true,
    enableAutoplay: true,
    batteryConscious: false,
  }))

  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [isLowPowerMode, setIsLowPowerMode] = useState(false)

  // Check for prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const updateMotionPreference = () => {
      setPreferences(prev => ({
        ...prev,
        prefersReducedMotion: mediaQuery.matches,
      }))
    }

    updateMotionPreference()
    mediaQuery.addEventListener('change', updateMotionPreference)

    return () => mediaQuery.removeEventListener('change', updateMotionPreference)
  }, [])

  // Check battery status for battery-conscious motion
  useEffect(() => {
    if (typeof window === 'undefined' || !('navigator' in window)) return

    const checkBattery = async () => {
      try {
        // @ts-ignore - Battery API is experimental
        const battery = await navigator.getBattery?.()
        if (battery) {
          const updateBatteryInfo = () => {
            setBatteryLevel(battery.level * 100)
            setIsLowPowerMode(battery.level < (batteryThreshold / 100))
          }

          updateBatteryInfo()
          battery.addEventListener('levelchange', updateBatteryInfo)
          battery.addEventListener('chargingchange', updateBatteryInfo)

          return () => {
            battery.removeEventListener('levelchange', updateBatteryInfo)
            battery.removeEventListener('chargingchange', updateBatteryInfo)
          }
        }
      } catch (error) {
        // Battery API not supported
        console.debug('Battery API not supported')
      }
    }

    checkBattery()
  }, [batteryThreshold])

  // Update computed preferences
  useEffect(() => {
    setPreferences(prev => {
      const shouldReduceMotion = prev.respectReducedMotion && prev.prefersReducedMotion
      const batteryConscious = isLowPowerMode
      
      let intensity = prev.animationIntensity
      
      if (shouldReduceMotion) {
        intensity = 'none'
      } else if (batteryConscious) {
        intensity = intensity === 'enhanced' ? 'reduced' : intensity === 'normal' ? 'reduced' : intensity
      }

      return {
        ...prev,
        batteryConscious,
        animationIntensity: intensity,
        allowAnimations: intensity !== 'none',
        enableParallax: intensity === 'normal' || intensity === 'enhanced',
        enableAutoplay: !shouldReduceMotion && !batteryConscious,
      }
    })
  }, [preferences.prefersReducedMotion, preferences.respectReducedMotion, isLowPowerMode])

  const setAnimationIntensity = (intensity: MotionPreferences['animationIntensity']) => {
    setPreferences(prev => ({ ...prev, animationIntensity: intensity }))
  }

  const setRespectReducedMotion = (respect: boolean) => {
    setPreferences(prev => ({ ...prev, respectReducedMotion: respect }))
  }

  // Get animation duration based on preferences
  const getAnimationDuration = (normalDuration: number): number => {
    switch (preferences.animationIntensity) {
      case 'none':
        return 0
      case 'reduced':
        return normalDuration * 0.5
      case 'enhanced':
        return normalDuration * 1.5
      default:
        return normalDuration
    }
  }

  // Get animation delay based on preferences
  const getAnimationDelay = (normalDelay: number): number => {
    switch (preferences.animationIntensity) {
      case 'none':
        return 0
      case 'reduced':
        return normalDelay * 0.3
      case 'enhanced':
        return normalDelay * 1.2
      default:
        return normalDelay
    }
  }

  // Get safe animation styles
  const getAnimationStyles = (animationProps: {
    duration?: number
    delay?: number
    easing?: string
    transform?: string
    opacity?: number
  }) => {
    if (!preferences.allowAnimations) {
      return {
        transition: 'none',
        animation: 'none',
        transform: 'none',
      }
    }

    return {
      transitionDuration: animationProps.duration 
        ? `${getAnimationDuration(animationProps.duration)}ms` 
        : undefined,
      transitionDelay: animationProps.delay 
        ? `${getAnimationDelay(animationProps.delay)}ms` 
        : undefined,
      transitionTimingFunction: animationProps.easing,
      transform: animationProps.transform,
      opacity: animationProps.opacity,
    }
  }

  return {
    preferences,
    batteryLevel,
    isLowPowerMode,
    setAnimationIntensity,
    setRespectReducedMotion,
    getAnimationDuration,
    getAnimationDelay,
    getAnimationStyles,
    
    // Convenience getters
    shouldAnimate: preferences.allowAnimations,
    shouldReduceMotion: preferences.prefersReducedMotion && preferences.respectReducedMotion,
    canUseParallax: preferences.enableParallax,
    canAutoplay: preferences.enableAutoplay,
  }
}

// Hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fps: 60,
    averageFrameTime: 16.67,
    isSlowDevice: false,
    memoryUsage: 0,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    let frameCount = 0
    let lastTime = performance.now()
    let frameStartTime = performance.now()
    const frameTimes: number[] = []

    const measurePerformance = () => {
      const now = performance.now()
      const frameTime = now - frameStartTime
      
      frameTimes.push(frameTime)
      if (frameTimes.length > 60) frameTimes.shift()
      
      frameCount++
      frameStartTime = now

      // Calculate FPS every second
      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime))
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
        
        setMetrics(prev => ({
          ...prev,
          fps,
          averageFrameTime: avgFrameTime,
          isSlowDevice: fps < 30 || avgFrameTime > 33.33,
        }))

        frameCount = 0
        lastTime = now
      }

      requestAnimationFrame(measurePerformance)
    }

    const rafId = requestAnimationFrame(measurePerformance)

    // Memory monitoring
    const updateMemoryUsage = () => {
      // @ts-ignore - memory API is experimental
      if (performance.memory) {
        // @ts-ignore
        const used = performance.memory.usedJSHeapSize / 1048576 // Convert to MB
        setMetrics(prev => ({ ...prev, memoryUsage: used }))
      }
    }

    updateMemoryUsage()
    const memoryInterval = setInterval(updateMemoryUsage, 5000)

    return () => {
      cancelAnimationFrame(rafId)
      clearInterval(memoryInterval)
    }
  }, [])

  return metrics
}

// Combined hook for motion and performance
export const useAdaptiveMotion = (options: UseReducedMotionOptions = {}) => {
  const motionPrefs = useReducedMotion(options)
  const performance = usePerformanceMonitor()

  // Adapt motion based on performance
  const adaptiveIntensity = React.useMemo(() => {
    if (!motionPrefs.preferences.allowAnimations) return 'none'
    if (performance.isSlowDevice) return 'reduced'
    if (performance.fps < 45) return 'reduced'
    return motionPrefs.preferences.animationIntensity
  }, [motionPrefs.preferences.allowAnimations, motionPrefs.preferences.animationIntensity, performance.isSlowDevice, performance.fps])

  return {
    ...motionPrefs,
    performance,
    adaptiveIntensity,
    shouldUseReducedMotion: adaptiveIntensity === 'none' || adaptiveIntensity === 'reduced',
  }
}