import { useState, useRef, useEffect, useCallback, useMemo } from 'react'

interface VirtualizationOptions {
  rootMargin?: string
  threshold?: number | number[]
  bufferSize?: number
  estimatedItemHeight?: number
}

interface VirtualItem<T> {
  index: number
  data: T
  isVisible: boolean
  ref: (element: HTMLElement | null) => void
}

export function useIntersectionVirtualization<T>(
  items: T[],
  options: VirtualizationOptions = {}
) {
  const {
    rootMargin = '100px',
    threshold = 0,
    bufferSize = 5,
    estimatedItemHeight = 100
  } = options

  const [visibleRange, setVisibleRange] = useState({ start: 0, end: bufferSize })
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const visibilityMap = useRef<Map<number, boolean>>(new Map())

  const updateVisibleRange = useCallback(() => {
    const visible = Array.from(visibilityMap.current.entries())
      .filter(([_, isVisible]) => isVisible)
      .map(([index]) => index)

    if (visible.length > 0) {
      const start = Math.max(0, Math.min(...visible) - bufferSize)
      const end = Math.min(items.length, Math.max(...visible) + bufferSize)
      setVisibleRange({ start, end })
    }
  }, [items.length, bufferSize])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-index'))
          visibilityMap.current.set(index, entry.isIntersecting)
        })
        updateVisibleRange()
      },
      { rootMargin, threshold }
    )

    return () => {
      observerRef.current?.disconnect()
    }
  }, [rootMargin, threshold, updateVisibleRange])

  const setItemRef = useCallback((index: number) => (element: HTMLElement | null) => {
    const observer = observerRef.current
    const previousElement = itemRefs.current.get(index)

    if (previousElement && observer) {
      observer.unobserve(previousElement)
      itemRefs.current.delete(index)
    }

    if (element && observer) {
      element.setAttribute('data-index', String(index))
      observer.observe(element)
      itemRefs.current.set(index, element)
    }
  }, [])

  const virtualItems = useMemo<VirtualItem<T>[]>(() => {
    const virtualItems: VirtualItem<T>[] = []
    
    for (let i = visibleRange.start; i < visibleRange.end && i < items.length; i++) {
      virtualItems.push({
        index: i,
        data: items[i],
        isVisible: visibilityMap.current.get(i) || false,
        ref: setItemRef(i)
      })
    }

    return virtualItems
  }, [visibleRange, items, setItemRef])

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const element = itemRefs.current.get(index)
    if (element) {
      element.scrollIntoView({ behavior, block: 'center' })
    }
  }, [])

  const totalHeight = useMemo(() => {
    return items.length * estimatedItemHeight
  }, [items.length, estimatedItemHeight])

  return {
    virtualItems,
    totalHeight,
    visibleRange,
    scrollToIndex,
    itemRefs: itemRefs.current
  }
}

interface LazyLoadOptions {
  rootMargin?: string
  threshold?: number
  loadAhead?: number
  onLoadMore?: () => void | Promise<void>
}

export function useLazyLoadVirtualization<T>(
  items: T[],
  hasMore: boolean,
  options: LazyLoadOptions = {}
) {
  const {
    rootMargin = '200px',
    threshold = 0,
    loadAhead = 5,
    onLoadMore
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadMoreTriggered = useRef(false)

  const virtualization = useIntersectionVirtualization(items, {
    rootMargin,
    threshold
  })

  useEffect(() => {
    if (!hasMore || !onLoadMore || !sentinelRef.current) return

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting && !isLoading && !loadMoreTriggered.current) {
          loadMoreTriggered.current = true
          setIsLoading(true)
          
          try {
            await onLoadMore()
          } finally {
            setIsLoading(false)
            loadMoreTriggered.current = false
          }
        }
      },
      { rootMargin, threshold }
    )

    observer.observe(sentinelRef.current)

    return () => observer.disconnect()
  }, [hasMore, isLoading, onLoadMore, rootMargin, threshold])

  const shouldShowSentinel = useMemo(() => {
    return hasMore && virtualization.visibleRange.end >= items.length - loadAhead
  }, [hasMore, virtualization.visibleRange.end, items.length, loadAhead])

  return {
    ...virtualization,
    isLoading,
    sentinelRef,
    shouldShowSentinel
  }
}

interface RecyclePoolOptions {
  poolSize?: number
  recycleDelay?: number
}

export function useRecyclePool<T>(
  items: T[],
  renderItem: (item: T, index: number) => React.ReactNode,
  options: RecyclePoolOptions = {}
) {
  const { poolSize = 20, recycleDelay = 100 } = options
  
  const [pool, setPool] = useState<Map<number, React.ReactNode>>(new Map())
  const recycleTimeouts = useRef<Map<number, NodeJS.Timeout>>(new Map())
  
  const getPooledItem = useCallback((index: number): React.ReactNode | null => {
    if (pool.has(index)) {
      return pool.get(index)!
    }
    
    if (index >= 0 && index < items.length) {
      const rendered = renderItem(items[index], index)
      
      setPool(prev => {
        const next = new Map(prev)
        
        if (next.size >= poolSize) {
          const oldestKey = next.keys().next().value
          next.delete(oldestKey)
        }
        
        next.set(index, rendered)
        return next
      })
      
      return rendered
    }
    
    return null
  }, [items, renderItem, pool, poolSize])
  
  const recycleItem = useCallback((index: number) => {
    const existingTimeout = recycleTimeouts.current.get(index)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }
    
    const timeout = setTimeout(() => {
      setPool(prev => {
        const next = new Map(prev)
        next.delete(index)
        return next
      })
      recycleTimeouts.current.delete(index)
    }, recycleDelay)
    
    recycleTimeouts.current.set(index, timeout)
  }, [recycleDelay])
  
  useEffect(() => {
    return () => {
      recycleTimeouts.current.forEach(timeout => clearTimeout(timeout))
    }
  }, [])
  
  return {
    getPooledItem,
    recycleItem,
    poolSize: pool.size
  }
}

export function useScrollAwareVirtualization<T>(
  items: T[],
  containerRef: React.RefObject<HTMLElement>,
  options: VirtualizationOptions = {}
) {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down')
  const [scrollVelocity, setScrollVelocity] = useState(0)
  const lastScrollTop = useRef(0)
  const lastScrollTime = useRef(Date.now())
  
  const virtualization = useIntersectionVirtualization(items, {
    ...options,
    bufferSize: scrollDirection === 'down' 
      ? (options.bufferSize || 5) * 2 
      : options.bufferSize || 5
  })
  
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    const handleScroll = () => {
      const currentScrollTop = container.scrollTop
      const currentTime = Date.now()
      const timeDiff = currentTime - lastScrollTime.current
      const scrollDiff = currentScrollTop - lastScrollTop.current
      
      if (timeDiff > 0) {
        const velocity = Math.abs(scrollDiff) / timeDiff
        setScrollVelocity(velocity)
        setScrollDirection(scrollDiff > 0 ? 'down' : 'up')
      }
      
      lastScrollTop.current = currentScrollTop
      lastScrollTime.current = currentTime
    }
    
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [containerRef])
  
  return {
    ...virtualization,
    scrollDirection,
    scrollVelocity,
    isScrollingFast: scrollVelocity > 2
  }
}