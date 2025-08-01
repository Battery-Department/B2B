'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { generateOptimizedImageUrl, OptimizedImageProps } from '@/utils/performance'

interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>, OptimizedImageProps {
  fallback?: string
  containerClassName?: string
  blur?: boolean
  showSpinner?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality,
  format,
  priority = false,
  lazy = true,
  fallback = '/images/placeholder.jpg',
  blur = true,
  showSpinner = true,
  className,
  containerClassName,
  ...props
}: ImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(!lazy || priority)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [lazy, priority, isInView])

  // Preload critical images
  useEffect(() => {
    if (priority && typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = generateOptimizedImageUrl(src, { width, height, quality, format })
      document.head.appendChild(link)
    }
  }, [priority, src, width, height, quality, format])

  const handleLoad = () => {
    setIsLoaded(true)
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
  }

  const optimizedSrc = generateOptimizedImageUrl(src, {
    width,
    height,
    quality,
    format
  })

  // Generate responsive srcSet for different screen sizes
  const generateSrcSet = () => {
    if (!width) return undefined

    const sizes = [1, 1.5, 2, 3] // 1x, 1.5x, 2x, 3x pixel densities
    return sizes
      .map(scale => {
        const scaledWidth = Math.round(width * scale)
        const scaledSrc = generateOptimizedImageUrl(src, {
          width: scaledWidth,
          height: height ? Math.round(height * scale) : undefined,
          quality,
          format
        })
        return `${scaledSrc} ${scale}x`
      })
      .join(', ')
  }

  // Generate sizes attribute for responsive images
  const generateSizes = () => {
    if (!width) return undefined
    
    // Default responsive sizes - can be customized per use case
    return `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, ${width}px`
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        width && height && 'aspect-auto',
        containerClassName
      )}
      style={{ width, height }}
    >
      {/* Loading placeholder */}
      {(isLoading || !isInView) && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            blur && 'backdrop-blur-sm',
            isLoading ? 'bg-gray-100' : 'bg-gray-200'
          )}
        >
          {showSpinner && isLoading && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          )}
          {!isInView && (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
          )}
        </div>
      )}

      {/* Main image */}
      {isInView && (
        <img
          ref={imgRef}
          src={hasError ? fallback : optimizedSrc}
          srcSet={!hasError ? generateSrcSet() : undefined}
          sizes={generateSizes()}
          alt={alt}
          width={width}
          height={height}
          loading={lazy && !priority ? 'lazy' : 'eager'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          {...props}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <div className="text-gray-400 text-sm">
              Failed to load image
            </div>
            <div className="text-gray-300 text-xs mt-1">
              {alt}
            </div>
          </div>
        </div>
      )}

      {/* Blur overlay during loading */}
      {blur && isLoading && isInView && (
        <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm" />
      )}
    </div>
  )
}

// Progressive image component with multiple formats
export function ProgressiveImage({
  src,
  alt,
  width,
  height,
  className,
  containerClassName,
  ...props
}: ImageProps) {
  const [currentFormat, setCurrentFormat] = useState<'avif' | 'webp' | 'jpeg'>('avif')
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (currentFormat === 'avif') {
      setCurrentFormat('webp')
    } else if (currentFormat === 'webp') {
      setCurrentFormat('jpeg')
    } else {
      setHasError(true)
    }
  }

  return (
    <picture className={containerClassName}>
      {/* AVIF format for modern browsers */}
      <source
        srcSet={generateOptimizedImageUrl(src, { width, height, format: 'avif' })}
        type="image/avif"
      />
      
      {/* WebP format for broader support */}
      <source
        srcSet={generateOptimizedImageUrl(src, { width, height, format: 'webp' })}
        type="image/webp"
      />
      
      {/* JPEG fallback */}
      <OptimizedImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        format="jpeg"
        className={className}
        onError={handleError}
        {...props}
      />
    </picture>
  )
}

// Background image component with optimization
export function OptimizedBackgroundImage({
  src,
  alt,
  width,
  height,
  children,
  className,
  ...props
}: ImageProps & { children?: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.onload = () => setIsLoaded(true)
    img.onerror = () => setHasError(true)
    img.src = generateOptimizedImageUrl(src, { width, height, quality: 80, format: 'webp' })
  }, [src, width, height])

  const backgroundImage = isLoaded && !hasError
    ? `url(${generateOptimizedImageUrl(src, { width, height, quality: 80, format: 'webp' })})`
    : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'

  return (
    <div
      className={cn(
        'bg-cover bg-center bg-no-repeat transition-all duration-500',
        isLoaded ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{
        backgroundImage,
        width,
        height,
        ...props.style
      }}
      role={children ? undefined : 'img'}
      aria-label={children ? undefined : alt}
      {...props}
    >
      {children}
      
      {/* Loading indicator */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
        </div>
      )}
    </div>
  )
}

// Image gallery with optimized loading
export function ImageGallery({
  images,
  className,
  imageClassName,
  ...props
}: {
  images: Array<OptimizedImageProps & { id: string }>
  className?: string
  imageClassName?: string
}) {
  const [loadedImages, setLoadedImages] = useState(new Set<string>())

  const handleImageLoad = (id: string) => {
    setLoadedImages(prev => new Set([...prev, id]))
  }

  return (
    <div className={cn('grid gap-4', className)} {...props}>
      {images.map((image, index) => (
        <OptimizedImage
          key={image.id}
          {...image}
          priority={index < 3} // Prioritize first 3 images
          className={cn(
            'transition-transform duration-300 hover:scale-105',
            imageClassName
          )}
          onLoad={() => handleImageLoad(image.id)}
        />
      ))}
    </div>
  )
}

export default OptimizedImage