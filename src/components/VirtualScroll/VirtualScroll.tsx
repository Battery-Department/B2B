import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useVirtualizer, VirtualizerOptions } from '@tanstack/react-virtual'

interface VirtualScrollProps<T> {
  items: T[]
  height: number
  itemHeight?: number | ((index: number) => number)
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  estimateSize?: (index: number) => number
  getItemKey?: (item: T, index: number) => string | number
  onScroll?: (scrollTop: number) => void
  className?: string
  gap?: number
  horizontal?: boolean
  scrollToIndex?: number
  scrollToAlignment?: 'start' | 'center' | 'end' | 'auto'
  onEndReached?: () => void
  endReachedThreshold?: number
}

export function VirtualScroll<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5,
  estimateSize,
  getItemKey,
  onScroll,
  className,
  gap = 0,
  horizontal = false,
  scrollToIndex,
  scrollToAlignment = 'auto',
  onEndReached,
  endReachedThreshold = 100
}: VirtualScrollProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const scrollingRef = useRef(false)
  const endReachedRef = useRef(false)

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateSize || ((index) => {
      if (typeof itemHeight === 'function') {
        return itemHeight(index)
      }
      return itemHeight || 50
    }),
    overscan,
    horizontal,
    gap
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  useEffect(() => {
    if (scrollToIndex !== undefined && scrollToIndex >= 0 && scrollToIndex < items.length) {
      rowVirtualizer.scrollToIndex(scrollToIndex, {
        align: scrollToAlignment
      })
    }
  }, [scrollToIndex, scrollToAlignment, rowVirtualizer, items.length])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollPosition = horizontal ? target.scrollLeft : target.scrollTop
    const scrollSize = horizontal ? target.scrollWidth : target.scrollHeight
    const clientSize = horizontal ? target.clientWidth : target.clientHeight

    onScroll?.(scrollPosition)

    if (onEndReached && !endReachedRef.current) {
      const distanceFromEnd = scrollSize - scrollPosition - clientSize
      if (distanceFromEnd < endReachedThreshold) {
        endReachedRef.current = true
        onEndReached()
        setTimeout(() => {
          endReachedRef.current = false
        }, 1000)
      }
    }
  }, [horizontal, onScroll, onEndReached, endReachedThreshold])

  const style = horizontal
    ? { width: height, overflowX: 'auto', overflowY: 'hidden' }
    : { height, overflowY: 'auto', overflowX: 'hidden' }

  return (
    <div
      ref={parentRef}
      className={className}
      style={style}
      onScroll={handleScroll}
    >
      <div
        style={{
          [horizontal ? 'width' : 'height']: `${totalSize}px`,
          [horizontal ? 'height' : 'width']: '100%',
          position: 'relative'
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index]
          const key = getItemKey
            ? getItemKey(item, virtualItem.index)
            : virtualItem.index

          return (
            <div
              key={key}
              style={{
                position: 'absolute',
                top: horizontal ? 0 : virtualItem.start,
                left: horizontal ? virtualItem.start : 0,
                [horizontal ? 'width' : 'height']: virtualItem.size,
                [horizontal ? 'height' : 'width']: '100%'
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface VirtualGridProps<T> {
  items: T[]
  height: number
  columnCount: number
  rowHeight: number | ((index: number) => number)
  columnWidth: number | ((index: number) => number)
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  gap?: number
  getItemKey?: (item: T, index: number) => string | number
  className?: string
}

export function VirtualGrid<T>({
  items,
  height,
  columnCount,
  rowHeight,
  columnWidth,
  renderItem,
  overscan = 2,
  gap = 0,
  getItemKey,
  className
}: VirtualGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const rowCount = Math.ceil(items.length / columnCount)

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      if (typeof rowHeight === 'function') {
        return rowHeight(index)
      }
      return rowHeight
    },
    overscan,
    gap
  })

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columnCount,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      if (typeof columnWidth === 'function') {
        return columnWidth(index)
      }
      return columnWidth
    },
    overscan,
    gap
  })

  return (
    <div
      ref={parentRef}
      className={className}
      style={{
        height,
        overflow: 'auto'
      }}
    >
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          width: columnVirtualizer.getTotalSize(),
          position: 'relative'
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <React.Fragment key={virtualRow.key}>
            {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
              const itemIndex = virtualRow.index * columnCount + virtualColumn.index
              if (itemIndex >= items.length) return null

              const item = items[itemIndex]
              const key = getItemKey
                ? getItemKey(item, itemIndex)
                : itemIndex

              return (
                <div
                  key={key}
                  style={{
                    position: 'absolute',
                    top: virtualRow.start,
                    left: virtualColumn.start,
                    width: virtualColumn.size,
                    height: virtualRow.size
                  }}
                >
                  {renderItem(item, itemIndex)}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

interface WindowVirtualScrollProps<T> {
  items: T[]
  itemHeight: number | ((index: number) => number)
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  getItemKey?: (item: T, index: number) => string | number
  className?: string
  gap?: number
}

export function WindowVirtualScroll<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 5,
  getItemKey,
  className,
  gap = 0
}: WindowVirtualScrollProps<T>) {
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setScrollElement(document.documentElement)
  }, [])

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollElement,
    estimateSize: (index) => {
      if (typeof itemHeight === 'function') {
        return itemHeight(index)
      }
      return itemHeight
    },
    overscan,
    gap
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  return (
    <div
      className={className}
      style={{
        height: totalSize,
        position: 'relative',
        width: '100%'
      }}
    >
      {virtualItems.map((virtualItem) => {
        const item = items[virtualItem.index]
        const key = getItemKey
          ? getItemKey(item, virtualItem.index)
          : virtualItem.index

        return (
          <div
            key={key}
            style={{
              position: 'absolute',
              top: virtualItem.start,
              left: 0,
              width: '100%',
              height: virtualItem.size
            }}
          >
            {renderItem(item, virtualItem.index)}
          </div>
        )
      })}
    </div>
  )
}

export function useVirtualScrollRestoration(
  key: string,
  virtualizer: ReturnType<typeof useVirtualizer>
) {
  const scrollPositionKey = `virtual-scroll-${key}`

  useEffect(() => {
    const savedPosition = sessionStorage.getItem(scrollPositionKey)
    if (savedPosition) {
      const position = JSON.parse(savedPosition)
      virtualizer.scrollToOffset(position.offset, {
        align: 'start'
      })
    }
  }, [])

  useEffect(() => {
    const handleBeforeUnload = () => {
      const scrollElement = virtualizer.scrollElement
      if (scrollElement) {
        const offset = virtualizer.scrollOffset
        sessionStorage.setItem(
          scrollPositionKey,
          JSON.stringify({ offset })
        )
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [virtualizer, scrollPositionKey])
}

interface DynamicVirtualScrollProps<T> {
  items: T[]
  height: number
  renderItem: (item: T, index: number) => React.ReactNode
  measureElement?: (element: HTMLElement) => void
  overscan?: number
  getItemKey?: (item: T, index: number) => string | number
  className?: string
}

export function DynamicVirtualScroll<T>({
  items,
  height,
  renderItem,
  overscan = 5,
  getItemKey,
  className
}: DynamicVirtualScrollProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [measurements, setMeasurements] = useState<Record<number, number>>({})

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((index) => measurements[index] || 100, [measurements]),
    overscan,
    measureElement: useCallback((element, entry) => {
      const index = entry.index
      const height = element.getBoundingClientRect().height
      
      setMeasurements(prev => {
        if (prev[index] !== height) {
          return { ...prev, [index]: height }
        }
        return prev
      })
    }, [])
  })

  return (
    <div
      ref={parentRef}
      className={className}
      style={{ height, overflow: 'auto' }}
    >
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          position: 'relative',
          width: '100%'
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index]
          const key = getItemKey
            ? getItemKey(item, virtualItem.index)
            : virtualItem.index

          return (
            <div
              key={key}
              data-index={virtualItem.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: virtualItem.start,
                left: 0,
                width: '100%'
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}