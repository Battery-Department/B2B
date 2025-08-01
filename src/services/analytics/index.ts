/**
 * Analytics Service Index
 * Central export for all analytics functionality
 */

// Core services
export { analytics, EnhancedAnalytics } from './enhanced-analytics';
export { aggregationService, AggregationService } from './aggregation';
export { analyticsStorage, AnalyticsStorage } from './storage';

// Data points
export { 
  DATA_POINTS,
  DataPointCategory,
  DataPointType,
  getDataPointsByCategory,
  getRequiredDataPoints,
  validateDataPoint,
  transformDataPoint,
  TOTAL_DATA_POINTS
} from './data-points';

// Types
export type {
  AnalyticsEvent,
  EventContext,
  UserSession,
  FunnelStep,
  Funnel,
  Cohort,
  Attribution
} from './enhanced-analytics';

export type {
  AggregationPeriod,
  MetricDefinition,
  AggregatedMetric,
  Segment,
  PerformanceScore
} from './aggregation';

export type {
  StorageOptions,
  StoredEvent,
  QueryOptions,
  AggregateQuery
} from './storage';

// Initialize analytics on import
import { analytics } from './enhanced-analytics';
import { analyticsStorage } from './storage';

// Set up event forwarding from analytics to storage
analytics.on('event', (event) => {
  analyticsStorage.storeEvent(event).catch(console.error);
});

analytics.on('batch:process', (batch) => {
  analyticsStorage.storeEvents(batch).catch(console.error);
});

// Export initialized instances
export default {
  analytics,
  aggregationService,
  analyticsStorage
};