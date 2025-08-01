// Advanced Dashboard Charts for Terminal 5 Phase 2
export { default as OrderTrendChart } from './OrderTrendChart'
export { default as SavingsBreakdown } from './SavingsBreakdown'
export { default as BatteryUsageHeatmap } from './BatteryUsageHeatmap'

// Re-export types for convenience
export type {
  OrderTrendData,
  SavingsData,
  UsageData,
  DashboardChartsData,
  DashboardChartsState,
  UseDashboardChartsOptions
} from '../../../hooks/useDashboardCharts'