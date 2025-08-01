'use client'

// Advanced physics-based animations for Terminal 1 Phase 3

export interface SpringConfig {
  tension: number
  friction: number
  mass: number
}

export interface PhysicsState {
  position: number
  velocity: number
  target: number
}

export interface GestureConfig {
  threshold: number
  velocity: number
  resistance: number
}

// Spring physics engine
export class SpringPhysics {
  private config: SpringConfig
  private state: PhysicsState
  private animationId: number | null = null
  private onUpdate: (value: number) => void
  private onComplete?: () => void

  constructor(
    config: SpringConfig = { tension: 300, friction: 30, mass: 1 },
    onUpdate: (value: number) => void,
    onComplete?: () => void
  ) {
    this.config = config
    this.state = { position: 0, velocity: 0, target: 0 }
    this.onUpdate = onUpdate
    this.onComplete = onComplete
  }

  setTarget(target: number) {
    this.state.target = target
    this.start()
  }

  setPosition(position: number) {
    this.state.position = position
    this.state.velocity = 0
  }

  private start() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    this.animate()
  }

  private animate = () => {
    const { tension, friction, mass } = this.config
    const { position, velocity, target } = this.state

    const spring = -tension * (position - target)
    const damper = -friction * velocity
    const acceleration = (spring + damper) / mass

    const newVelocity = velocity + acceleration * 0.016 // 60fps
    const newPosition = position + newVelocity * 0.016

    this.state.velocity = newVelocity
    this.state.position = newPosition

    this.onUpdate(newPosition)

    // Check if animation is complete
    const isNearTarget = Math.abs(target - newPosition) < 0.01
    const isSlowVelocity = Math.abs(newVelocity) < 0.01

    if (isNearTarget && isSlowVelocity) {
      this.state.position = target
      this.state.velocity = 0
      this.onUpdate(target)
      this.onComplete?.()
    } else {
      this.animationId = requestAnimationFrame(this.animate)
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }
}

// Pre-configured spring presets
export const SPRING_PRESETS = {
  gentle: { tension: 120, friction: 14, mass: 1 },
  wobbly: { tension: 180, friction: 12, mass: 1 },
  stiff: { tension: 300, friction: 30, mass: 1 },
  slow: { tension: 280, friction: 120, mass: 1 },
  bouncy: { tension: 400, friction: 8, mass: 1 },
} as const

// Momentum scrolling with physics
export class MomentumScroller {
  private element: HTMLElement
  private velocity = 0
  private position = 0
  private animationId: number | null = null
  private friction = 0.95
  private threshold = 0.1

  constructor(element: HTMLElement, friction = 0.95) {
    this.element = element
    this.friction = friction
  }

  addVelocity(deltaVelocity: number) {
    this.velocity += deltaVelocity
    this.startMomentum()
  }

  private startMomentum() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    this.animate()
  }

  private animate = () => {
    this.velocity *= this.friction
    this.position += this.velocity

    this.element.scrollTop = this.position

    if (Math.abs(this.velocity) > this.threshold) {
      this.animationId = requestAnimationFrame(this.animate)
    } else {
      this.velocity = 0
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.velocity = 0
  }
}

// Elastic interactions
export class ElasticInteraction {
  private element: HTMLElement
  private originalTransform: string
  private isActive = false

  constructor(element: HTMLElement) {
    this.element = element
    this.originalTransform = window.getComputedStyle(element).transform
  }

  press(intensity = 0.95) {
    if (this.isActive) return

    this.isActive = true
    this.element.style.transition = 'transform 0.1s ease-out'
    this.element.style.transform = `${this.originalTransform} scale(${intensity})`
  }

  release() {
    if (!this.isActive) return

    this.element.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
    this.element.style.transform = this.originalTransform

    setTimeout(() => {
      this.isActive = false
      this.element.style.transition = ''
    }, 300)
  }
}

// Gesture recognition
export class GestureRecognizer {
  private element: HTMLElement
  private startX = 0
  private startY = 0
  private startTime = 0
  private isTracking = false

  constructor(element: HTMLElement) {
    this.element = element
    this.setupEventListeners()
  }

  private setupEventListeners() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this))
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this))
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this))
    
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.element.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this))
  }

  private handleTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    this.startTracking(touch.clientX, touch.clientY)
  }

  private handleMouseDown(event: MouseEvent) {
    this.startTracking(event.clientX, event.clientY)
  }

  private startTracking(x: number, y: number) {
    this.startX = x
    this.startY = y
    this.startTime = Date.now()
    this.isTracking = true
  }

  private handleTouchMove(event: TouchEvent) {
    if (!this.isTracking) return
    const touch = event.touches[0]
    this.updateTracking(touch.clientX, touch.clientY)
  }

  private handleMouseMove(event: MouseEvent) {
    if (!this.isTracking) return
    this.updateTracking(event.clientX, event.clientY)
  }

  private updateTracking(x: number, y: number) {
    const deltaX = x - this.startX
    const deltaY = y - this.startY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // Emit gesture update event
    this.element.dispatchEvent(new CustomEvent('gestureupdate', {
      detail: { deltaX, deltaY, distance }
    }))
  }

  private handleTouchEnd(event: TouchEvent) {
    this.endTracking()
  }

  private handleMouseUp(event: MouseEvent) {
    this.endTracking()
  }

  private endTracking() {
    if (!this.isTracking) return

    const endTime = Date.now()
    const duration = endTime - this.startTime
    
    // Calculate velocity
    const velocityX = (event as any).clientX ? ((event as any).clientX - this.startX) / duration : 0
    const velocityY = (event as any).clientY ? ((event as any).clientY - this.startY) / duration : 0

    // Emit gesture end event
    this.element.dispatchEvent(new CustomEvent('gestureend', {
      detail: { velocityX, velocityY, duration }
    }))

    this.isTracking = false
  }
}

// Advanced animation utilities
export const createPhysicsAnimation = (
  element: HTMLElement,
  property: string,
  from: number,
  to: number,
  springConfig: SpringConfig = SPRING_PRESETS.gentle
): Promise<void> => {
  return new Promise((resolve) => {
    const spring = new SpringPhysics(
      springConfig,
      (value) => {
        if (property === 'transform') {
          element.style.transform = `translateX(${value}px)`
        } else {
          ;(element.style as any)[property] = `${value}px`
        }
      },
      resolve
    )

    spring.setPosition(from)
    spring.setTarget(to)
  })
}

// Morphing animations
export const createMorphAnimation = (
  element: HTMLElement,
  fromPath: string,
  toPath: string,
  duration = 300
): Promise<void> => {
  return new Promise((resolve) => {
    if (!(element instanceof SVGPathElement)) {
      console.warn('Morph animation requires SVG path element')
      resolve()
      return
    }

    const steps = 60 // 60fps
    const stepDuration = duration / steps
    let currentStep = 0

    const animate = () => {
      const progress = currentStep / steps
      const easedProgress = easeInOutCubic(progress)
      
      // Simple path interpolation (would use proper SVG path interpolation in production)
      element.setAttribute('d', progress < 0.5 ? fromPath : toPath)
      
      currentStep++
      
      if (currentStep <= steps) {
        setTimeout(animate, stepDuration)
      } else {
        resolve()
      }
    }

    animate()
  })
}

// Easing functions
export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export const easeOutBounce = (t: number): number => {
  const n1 = 7.5625
  const d1 = 2.75

  if (t < 1 / d1) {
    return n1 * t * t
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  }
}

// Haptic feedback (for supported devices)
export const triggerHapticFeedback = (intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    }
    navigator.vibrate(patterns[intensity])
  }
}

// Performance-aware animation frame scheduler
export class AnimationScheduler {
  private tasks: Array<() => void> = []
  private isRunning = false
  private frameTime = 16.67 // Target 60fps
  private lastFrameTime = 0

  schedule(task: () => void) {
    this.tasks.push(task)
    if (!this.isRunning) {
      this.start()
    }
  }

  private start() {
    this.isRunning = true
    this.run()
  }

  private run = (currentTime = performance.now()) => {
    const deltaTime = currentTime - this.lastFrameTime
    
    if (deltaTime >= this.frameTime) {
      // Execute tasks within frame budget
      const startTime = performance.now()
      const frameBudget = 8 // 8ms budget per frame
      
      while (this.tasks.length > 0 && (performance.now() - startTime) < frameBudget) {
        const task = this.tasks.shift()
        task?.()
      }
      
      this.lastFrameTime = currentTime
    }

    if (this.tasks.length > 0) {
      requestAnimationFrame(this.run)
    } else {
      this.isRunning = false
    }
  }
}

// Global animation scheduler instance
export const animationScheduler = new AnimationScheduler()