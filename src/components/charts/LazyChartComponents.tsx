'use client'

import { lazy, Suspense, ComponentType } from 'react'
import { LoadingSpinner } from '../ui/LoadingSpinner'

// Lazy load chart components to reduce bundle size
const LineChart = lazy(() => import('./LineChart').then(module => ({ default: module.LineChart })))
const BarChart = lazy(() => import('./BarChart').then(module => ({ default: module.BarChart })))
const PieChart = lazy(() => import('./PieChart').then(module => ({ default: module.PieChart })))
const AreaChart = lazy(() => import('./AreaChart').then(module => ({ default: module.AreaChart })))

// Chart loading fallback component
const ChartLoadingFallback = ({ height = 300 }: { height?: number }) => (
  <div 
    className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50"
    style={{ height }}
  >
    <div className="text-center">
      <LoadingSpinner size="md" />
      <p className="mt-2 text-sm text-gray-500">Loading chart...</p>
    </div>
  </div>
)

// Higher-order component for lazy chart wrapper
const withChartLazyLoading = <T extends {}>(
  ChartComponent: ComponentType<T>,
  fallbackHeight?: number
) => {
  return (props: T) => (
    <Suspense fallback={<ChartLoadingFallback height={fallbackHeight} />}>
      <ChartComponent {...props} />
    </Suspense>
  )
}

// Exported lazy chart components
export const LazyLineChart = withChartLazyLoading(LineChart, 300)
export const LazyBarChart = withChartLazyLoading(BarChart, 300)
export const LazyPieChart = withChartLazyLoading(PieChart, 300)
export const LazyAreaChart = withChartLazyLoading(AreaChart, 300)

// Chart type registry for dynamic loading
export const CHART_COMPONENTS = {
  line: LazyLineChart,
  bar: LazyBarChart,
  pie: LazyPieChart,
  area: LazyAreaChart,
} as const

export type ChartType = keyof typeof CHART_COMPONENTS

// Dynamic chart loader component
interface DynamicChartProps {
  type: ChartType
  data: any
  options?: any
  height?: number
}

export const DynamicChart = ({ type, data, options, height }: DynamicChartProps) => {
  const ChartComponent = CHART_COMPONENTS[type]
  
  if (!ChartComponent) {
    return (
      <div className="flex items-center justify-center p-8 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600">Unknown chart type: {type}</p>
      </div>
    )
  }

  return <ChartComponent data={data} options={options} height={height} />
}

// Preload chart components for better UX
export const preloadChartComponent = (type: ChartType) => {
  switch (type) {
    case 'line':
      import('./LineChart')
      break
    case 'bar':
      import('./BarChart')
      break
    case 'pie':
      import('./PieChart')
      break
    case 'area':
      import('./AreaChart')
      break
  }
}

// Preload all chart components
export const preloadAllCharts = () => {
  Object.keys(CHART_COMPONENTS).forEach(type => {
    preloadChartComponent(type as ChartType)
  })
}