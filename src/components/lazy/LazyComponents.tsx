import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

// Lazy load heavy components to improve initial bundle size
export const LazyQuizV2 = lazy(() => 
  import('@/components/quiz/QuizV2').then(module => ({ default: module.QuizV2 }))
)

export const LazyProductGrid = lazy(() => 
  import('@/components/battery/ProductGrid').then(module => ({ default: module.ProductGrid }))
)

export const LazyVolumeDiscountVisualizer = lazy(() => 
  import('@/components/battery/VolumeDiscountVisualizer').then(module => ({ 
    default: module.VolumeDiscountVisualizer 
  }))
)

export const LazyContentGenerator = lazy(() => 
  import('@/services/ai/content-generator').then(module => ({ 
    default: module.ContentGenerator 
  }))
)

export const LazyAnalyticsDashboard = lazy(() => 
  import('@/components/analytics/AnalyticsDashboard')
)

export const LazyPerformanceMonitor = lazy(() => 
  import('@/components/performance/PerformanceMonitor')
)

// Loading components with proper sizing to prevent layout shift
const QuizLoadingSkeleton = () => (
  <div className="max-w-2xl mx-auto p-6 space-y-6">
    <div className="text-center space-y-4">
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-1/2 mx-auto" />
    </div>
    
    <div className="w-full bg-gray-200 rounded-full h-2">
      <Skeleton className="h-2 w-1/3 rounded-full" />
    </div>
    
    <div className="space-y-4">
      <Skeleton className="h-6 w-full" />
      <div className="grid grid-cols-1 gap-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  </div>
)

const ProductGridLoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map(i => (
      <Card key={i} className="overflow-hidden">
        <CardContent className="p-0">
          <Skeleton className="h-48 w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

const VolumeDiscountLoadingSkeleton = () => (
  <Card className="p-6">
    <div className="space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <Skeleton className="h-4 w-2/3" />
    </div>
  </Card>
)

const AnalyticsLoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <Card key={i} className="p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        </Card>
      ))}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </Card>
      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </Card>
    </div>
  </div>
)

const PerformanceLoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <Card key={i} className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-8 w-16" />
        </Card>
      ))}
    </div>
    
    <Card className="p-6">
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </Card>
  </div>
)

// Wrapper components with proper error boundaries
export const QuizV2WithSuspense = (props: any) => (
  <Suspense fallback={<QuizLoadingSkeleton />}>
    <LazyQuizV2 {...props} />
  </Suspense>
)

export const ProductGridWithSuspense = (props: any) => (
  <Suspense fallback={<ProductGridLoadingSkeleton />}>
    <LazyProductGrid {...props} />
  </Suspense>
)

export const VolumeDiscountVisualizerWithSuspense = (props: any) => (
  <Suspense fallback={<VolumeDiscountLoadingSkeleton />}>
    <LazyVolumeDiscountVisualizer {...props} />
  </Suspense>
)

export const AnalyticsDashboardWithSuspense = (props: any) => (
  <Suspense fallback={<AnalyticsLoadingSkeleton />}>
    <LazyAnalyticsDashboard {...props} />
  </Suspense>
)

export const PerformanceMonitorWithSuspense = (props: any) => (
  <Suspense fallback={<PerformanceLoadingSkeleton />}>
    <LazyPerformanceMonitor {...props} />
  </Suspense>
)

// Higher-order component for lazy loading with error boundaries
export function withLazyLoading<T extends object>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  LoadingComponent: React.ComponentType = () => <Skeleton className="h-32 w-full" />
) {
  const LazyComponent = lazy(importFn)
  
  return function LazyWrapper(props: T) {
    return (
      <Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// Preload function for critical components
export const preloadComponents = {
  quiz: () => import('@/components/quiz/QuizV2'),
  productGrid: () => import('@/components/battery/ProductGrid'),
  volumeDiscount: () => import('@/components/battery/VolumeDiscountVisualizer'),
  analytics: () => import('@/components/analytics/AnalyticsDashboard'),
  performance: () => import('@/components/performance/PerformanceMonitor')
}

// Preload critical components based on route
export const preloadForRoute = (route: string) => {
  switch (route) {
    case '/customer/quiz':
      preloadComponents.quiz()
      break
    case '/customer/products':
      preloadComponents.productGrid()
      preloadComponents.volumeDiscount()
      break
    case '/admin/analytics':
      preloadComponents.analytics()
      break
    case '/admin/performance':
      preloadComponents.performance()
      break
  }
}

// Hook for intelligent preloading
export const useIntelligentPreloading = () => {
  const preloadOnHover = (componentName: keyof typeof preloadComponents) => {
    return {
      onMouseEnter: () => {
        preloadComponents[componentName]()
      }
    }
  }

  const preloadOnFocus = (componentName: keyof typeof preloadComponents) => {
    return {
      onFocus: () => {
        preloadComponents[componentName]()
      }
    }
  }

  return {
    preloadOnHover,
    preloadOnFocus,
    preloadForRoute
  }
}