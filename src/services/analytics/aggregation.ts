/**
 * Analytics Data Aggregation Service
 * Real-time aggregation, metric calculations, and trend analysis
 */

import { AnalyticsEvent, UserSession } from './enhanced-analytics';
import { DATA_POINTS, DataPointCategory } from './data-points';

export interface AggregationPeriod {
  start: Date;
  end: Date;
  granularity: 'minute' | 'hour' | 'day' | 'week' | 'month';
}

export interface MetricDefinition {
  id: string;
  name: string;
  type: 'count' | 'sum' | 'average' | 'min' | 'max' | 'percentile' | 'custom';
  dataPoint?: string;
  customCalculation?: (events: AnalyticsEvent[]) => number;
  filters?: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'greater' | 'less';
    value: any;
  }>;
}

export interface AggregatedMetric {
  metric: MetricDefinition;
  value: number;
  period: AggregationPeriod;
  segments?: Record<string, number>;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    previousValue: number;
  };
}

export interface Segment {
  id: string;
  name: string;
  conditions: Array<{
    dataPoint: string;
    operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in';
    value: any;
  }>;
}

export interface PerformanceScore {
  overall: number;
  categories: Record<string, number>;
  insights: string[];
  recommendations: string[];
}

export class AggregationService {
  private metrics: Map<string, MetricDefinition> = new Map();
  private segments: Map<string, Segment> = new Map();
  private cache: Map<string, AggregatedMetric> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute

  constructor() {
    this.initializeDefaultMetrics();
    this.initializeDefaultSegments();
  }

  /**
   * Initialize default metrics
   */
  private initializeDefaultMetrics(): void {
    // User metrics
    this.addMetric({
      id: 'active_users',
      name: 'Active Users',
      type: 'count',
      dataPoint: DATA_POINTS.USER_ID.id
    });

    this.addMetric({
      id: 'new_users',
      name: 'New Users',
      type: 'custom',
      customCalculation: (events) => {
        const userFirstSeen = new Map<string, Date>();
        for (const event of events) {
          if (event.userId && !userFirstSeen.has(event.userId)) {
            userFirstSeen.set(event.userId, event.timestamp);
          }
        }
        return userFirstSeen.size;
      }
    });

    // Engagement metrics
    this.addMetric({
      id: 'avg_session_duration',
      name: 'Average Session Duration',
      type: 'average',
      dataPoint: DATA_POINTS.SESSION_DURATION.id
    });

    this.addMetric({
      id: 'bounce_rate',
      name: 'Bounce Rate',
      type: 'average',
      dataPoint: DATA_POINTS.BOUNCE_RATE.id
    });

    this.addMetric({
      id: 'pages_per_session',
      name: 'Pages per Session',
      type: 'average',
      dataPoint: DATA_POINTS.PAGE_VIEWS.id
    });

    // Quiz metrics
    this.addMetric({
      id: 'quiz_completion_rate',
      name: 'Quiz Completion Rate',
      type: 'average',
      dataPoint: DATA_POINTS.QUIZ_COMPLETION_RATE.id
    });

    this.addMetric({
      id: 'quiz_conversions',
      name: 'Quiz Conversions',
      type: 'count',
      filters: [{
        field: 'eventName',
        operator: 'equals',
        value: 'quiz_conversion'
      }]
    });

    // Commerce metrics
    this.addMetric({
      id: 'revenue',
      name: 'Total Revenue',
      type: 'sum',
      dataPoint: DATA_POINTS.CART_VALUE.id,
      filters: [{
        field: 'eventName',
        operator: 'equals',
        value: 'purchase'
      }]
    });

    this.addMetric({
      id: 'conversion_rate',
      name: 'Conversion Rate',
      type: 'custom',
      customCalculation: (events) => {
        const sessions = new Set(events.map(e => e.sessionId));
        const conversions = new Set(
          events
            .filter(e => e.eventName === 'purchase')
            .map(e => e.sessionId)
        );
        return sessions.size > 0 ? conversions.size / sessions.size : 0;
      }
    });

    this.addMetric({
      id: 'avg_order_value',
      name: 'Average Order Value',
      type: 'average',
      dataPoint: DATA_POINTS.CART_VALUE.id,
      filters: [{
        field: 'eventName',
        operator: 'equals',
        value: 'purchase'
      }]
    });

    // Content metrics
    this.addMetric({
      id: 'content_engagement_rate',
      name: 'Content Engagement Rate',
      type: 'custom',
      customCalculation: (events) => {
        const contentViews = events.filter(e => 
          e.eventCategory === 'content' || e.eventName.includes('content_view')
        ).length;
        const engagements = events.filter(e =>
          e.eventName.includes('content_share') ||
          e.eventName.includes('content_download') ||
          e.eventName.includes('content_comment')
        ).length;
        return contentViews > 0 ? engagements / contentViews : 0;
      }
    });

    // Technical metrics
    this.addMetric({
      id: 'error_rate',
      name: 'Error Rate',
      type: 'custom',
      customCalculation: (events) => {
        const totalEvents = events.length;
        const errorEvents = events.filter(e => 
          e.eventCategory === 'error' || e.eventName.includes('error')
        ).length;
        return totalEvents > 0 ? errorEvents / totalEvents : 0;
      }
    });

    this.addMetric({
      id: 'api_response_time',
      name: 'API Response Time',
      type: 'average',
      dataPoint: 'api_response_time',
      filters: [{
        field: 'eventName',
        operator: 'equals',
        value: 'api_call'
      }]
    });
  }

  /**
   * Initialize default segments
   */
  private initializeDefaultSegments(): void {
    // Device segments
    this.addSegment({
      id: 'mobile_users',
      name: 'Mobile Users',
      conditions: [{
        dataPoint: DATA_POINTS.DEVICE_TYPE.id,
        operator: 'equals',
        value: 'mobile'
      }]
    });

    this.addSegment({
      id: 'desktop_users',
      name: 'Desktop Users',
      conditions: [{
        dataPoint: DATA_POINTS.DEVICE_TYPE.id,
        operator: 'equals',
        value: 'desktop'
      }]
    });

    // Geographic segments
    this.addSegment({
      id: 'us_users',
      name: 'US Users',
      conditions: [{
        dataPoint: DATA_POINTS.COUNTRY.id,
        operator: 'equals',
        value: 'US'
      }]
    });

    // Behavior segments
    this.addSegment({
      id: 'high_engagement',
      name: 'High Engagement Users',
      conditions: [{
        dataPoint: DATA_POINTS.ENGAGEMENT_SCORE.id,
        operator: 'greater',
        value: 80
      }]
    });

    this.addSegment({
      id: 'quiz_completers',
      name: 'Quiz Completers',
      conditions: [{
        dataPoint: DATA_POINTS.QUIZ_COMPLETION_RATE.id,
        operator: 'equals',
        value: 100
      }]
    });

    // Commerce segments
    this.addSegment({
      id: 'purchasers',
      name: 'Purchasers',
      conditions: [{
        dataPoint: DATA_POINTS.RETURN_CUSTOMER.id,
        operator: 'equals',
        value: true
      }]
    });

    this.addSegment({
      id: 'high_value_customers',
      name: 'High Value Customers',
      conditions: [{
        dataPoint: DATA_POINTS.USER_LIFETIME_VALUE.id,
        operator: 'greater',
        value: 1000
      }]
    });

    // Source segments
    this.addSegment({
      id: 'facebook_traffic',
      name: 'Facebook Traffic',
      conditions: [{
        dataPoint: DATA_POINTS.USER_ACQUISITION_SOURCE.id,
        operator: 'contains',
        value: 'facebook'
      }]
    });

    this.addSegment({
      id: 'google_traffic',
      name: 'Google Traffic',
      conditions: [{
        dataPoint: DATA_POINTS.USER_ACQUISITION_SOURCE.id,
        operator: 'contains',
        value: 'google'
      }]
    });
  }

  /**
   * Add a custom metric
   */
  public addMetric(metric: MetricDefinition): void {
    this.metrics.set(metric.id, metric);
  }

  /**
   * Add a custom segment
   */
  public addSegment(segment: Segment): void {
    this.segments.set(segment.id, segment);
  }

  /**
   * Calculate metrics for a period
   */
  public async calculateMetrics(
    events: AnalyticsEvent[],
    period: AggregationPeriod,
    metricIds?: string[],
    segmentIds?: string[]
  ): Promise<AggregatedMetric[]> {
    const metricsToCalculate = metricIds 
      ? metricIds.map(id => this.metrics.get(id)).filter(Boolean) as MetricDefinition[]
      : Array.from(this.metrics.values());

    const results: AggregatedMetric[] = [];

    for (const metric of metricsToCalculate) {
      // Check cache
      const cacheKey = this.getCacheKey(metric.id, period, segmentIds);
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.period.end.getTime() < this.CACHE_TTL) {
        results.push(cached);
        continue;
      }

      // Filter events by period
      const periodEvents = this.filterEventsByPeriod(events, period);

      // Calculate base metric
      const baseValue = this.calculateMetricValue(metric, periodEvents);

      // Calculate segments if requested
      const segments: Record<string, number> = {};
      if (segmentIds) {
        for (const segmentId of segmentIds) {
          const segment = this.segments.get(segmentId);
          if (segment) {
            const segmentEvents = this.filterEventsBySegment(periodEvents, segment);
            segments[segmentId] = this.calculateMetricValue(metric, segmentEvents);
          }
        }
      }

      // Calculate trend
      const trend = await this.calculateTrend(metric, period, baseValue, events);

      const result: AggregatedMetric = {
        metric,
        value: baseValue,
        period,
        segments: Object.keys(segments).length > 0 ? segments : undefined,
        trend
      };

      // Cache result
      this.cache.set(cacheKey, result);
      results.push(result);
    }

    return results;
  }

  /**
   * Analyze trends
   */
  public async analyzeTrends(
    events: AnalyticsEvent[],
    metricId: string,
    periods: number = 7
  ): Promise<Array<{ period: Date; value: number }>> {
    const metric = this.metrics.get(metricId);
    if (!metric) throw new Error(`Metric ${metricId} not found`);

    const results: Array<{ period: Date; value: number }> = [];
    const now = new Date();

    for (let i = periods - 1; i >= 0; i--) {
      const periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - i);
      periodStart.setHours(0, 0, 0, 0);

      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 1);

      const period: AggregationPeriod = {
        start: periodStart,
        end: periodEnd,
        granularity: 'day'
      };

      const periodEvents = this.filterEventsByPeriod(events, period);
      const value = this.calculateMetricValue(metric, periodEvents);

      results.push({
        period: periodStart,
        value
      });
    }

    return results;
  }

  /**
   * Create custom segments based on behavior
   */
  public createBehaviorSegments(events: AnalyticsEvent[]): Segment[] {
    const segments: Segment[] = [];

    // Analyze event patterns to create segments
    const userBehaviors = this.analyzeUserBehaviors(events);

    // Power users segment
    const powerUsers = Array.from(userBehaviors.entries())
      .filter(([_, behavior]) => behavior.eventCount > 100)
      .map(([userId]) => userId);

    if (powerUsers.length > 0) {
      segments.push({
        id: 'power_users',
        name: 'Power Users',
        conditions: [{
          dataPoint: DATA_POINTS.USER_ID.id,
          operator: 'in',
          value: powerUsers
        }]
      });
    }

    // Early adopters segment
    const sortedByFirstSeen = Array.from(userBehaviors.entries())
      .sort((a, b) => a[1].firstSeen.getTime() - b[1].firstSeen.getTime());
    
    const earlyAdopters = sortedByFirstSeen
      .slice(0, Math.floor(sortedByFirstSeen.length * 0.1))
      .map(([userId]) => userId);

    if (earlyAdopters.length > 0) {
      segments.push({
        id: 'early_adopters',
        name: 'Early Adopters',
        conditions: [{
          dataPoint: DATA_POINTS.USER_ID.id,
          operator: 'in',
          value: earlyAdopters
        }]
      });
    }

    // At-risk users segment
    const atRiskUsers = Array.from(userBehaviors.entries())
      .filter(([_, behavior]) => {
        const daysSinceLastSeen = (Date.now() - behavior.lastSeen.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLastSeen > 14 && daysSinceLastSeen < 30;
      })
      .map(([userId]) => userId);

    if (atRiskUsers.length > 0) {
      segments.push({
        id: 'at_risk_users',
        name: 'At Risk Users',
        conditions: [{
          dataPoint: DATA_POINTS.USER_ID.id,
          operator: 'in',
          value: atRiskUsers
        }]
      });
    }

    return segments;
  }

  /**
   * Calculate performance score
   */
  public calculatePerformanceScore(
    metrics: AggregatedMetric[],
    benchmarks?: Record<string, { target: number; weight: number }>
  ): PerformanceScore {
    const categories: Record<string, { score: number; metrics: number }> = {
      engagement: { score: 0, metrics: 0 },
      conversion: { score: 0, metrics: 0 },
      technical: { score: 0, metrics: 0 },
      content: { score: 0, metrics: 0 }
    };

    const insights: string[] = [];
    const recommendations: string[] = [];

    for (const aggregatedMetric of metrics) {
      const category = this.categorizeMetric(aggregatedMetric.metric.id);
      const benchmark = benchmarks?.[aggregatedMetric.metric.id];

      let score = 0;
      if (benchmark) {
        score = Math.min((aggregatedMetric.value / benchmark.target) * 100, 100);
        
        if (score < 70) {
          recommendations.push(
            `Improve ${aggregatedMetric.metric.name}: Currently at ${aggregatedMetric.value.toFixed(2)}, target is ${benchmark.target}`
          );
        }
      } else {
        // Default scoring based on metric type
        score = this.defaultScoring(aggregatedMetric);
      }

      categories[category].score += score;
      categories[category].metrics += 1;

      // Generate insights
      if (aggregatedMetric.trend) {
        if (aggregatedMetric.trend.direction === 'up' && aggregatedMetric.trend.percentage > 20) {
          insights.push(
            `${aggregatedMetric.metric.name} is trending up by ${aggregatedMetric.trend.percentage.toFixed(1)}%`
          );
        } else if (aggregatedMetric.trend.direction === 'down' && aggregatedMetric.trend.percentage > 20) {
          insights.push(
            `${aggregatedMetric.metric.name} has decreased by ${aggregatedMetric.trend.percentage.toFixed(1)}%`
          );
        }
      }
    }

    // Calculate category scores
    const categoryScores: Record<string, number> = {};
    let totalScore = 0;
    let totalCategories = 0;

    for (const [category, data] of Object.entries(categories)) {
      if (data.metrics > 0) {
        categoryScores[category] = data.score / data.metrics;
        totalScore += categoryScores[category];
        totalCategories += 1;
      }
    }

    const overallScore = totalCategories > 0 ? totalScore / totalCategories : 0;

    // Additional recommendations based on overall performance
    if (overallScore < 60) {
      recommendations.push('Overall performance needs improvement. Focus on the lowest-scoring categories first.');
    } else if (overallScore > 80) {
      insights.push('Excellent overall performance! Consider A/B testing to optimize further.');
    }

    return {
      overall: overallScore,
      categories: categoryScores,
      insights,
      recommendations
    };
  }

  /**
   * Real-time metric updates
   */
  public updateRealTimeMetric(metricId: string, event: AnalyticsEvent): number | null {
    const metric = this.metrics.get(metricId);
    if (!metric) return null;

    // For real-time updates, we'll calculate incrementally
    // This is a simplified version - in production, you'd maintain running totals
    return this.calculateMetricValue(metric, [event]);
  }

  // Private helper methods

  private filterEventsByPeriod(events: AnalyticsEvent[], period: AggregationPeriod): AnalyticsEvent[] {
    return events.filter(event => 
      event.timestamp >= period.start && event.timestamp <= period.end
    );
  }

  private filterEventsBySegment(events: AnalyticsEvent[], segment: Segment): AnalyticsEvent[] {
    return events.filter(event => {
      for (const condition of segment.conditions) {
        const value = event.dataPoints[condition.dataPoint] || 
                     event.eventData[condition.dataPoint];

        if (!this.checkCondition(value, condition.operator, condition.value)) {
          return false;
        }
      }
      return true;
    });
  }

  private checkCondition(value: any, operator: string, targetValue: any): boolean {
    switch (operator) {
      case 'equals':
        return value === targetValue;
      case 'contains':
        return String(value).includes(targetValue);
      case 'greater':
        return Number(value) > Number(targetValue);
      case 'less':
        return Number(value) < Number(targetValue);
      case 'between':
        return Number(value) >= targetValue[0] && Number(value) <= targetValue[1];
      case 'in':
        return Array.isArray(targetValue) && targetValue.includes(value);
      default:
        return false;
    }
  }

  private calculateMetricValue(metric: MetricDefinition, events: AnalyticsEvent[]): number {
    // Apply filters
    let filteredEvents = events;
    if (metric.filters) {
      filteredEvents = events.filter(event => {
        for (const filter of metric.filters!) {
          const value = event.eventData[filter.field] || event[filter.field as keyof AnalyticsEvent];
          if (!this.checkCondition(value, filter.operator, filter.value)) {
            return false;
          }
        }
        return true;
      });
    }

    // Custom calculation
    if (metric.customCalculation) {
      return metric.customCalculation(filteredEvents);
    }

    // Standard calculations
    const values = filteredEvents
      .map(event => event.dataPoints[metric.dataPoint!])
      .filter(v => v !== undefined && v !== null)
      .map(v => Number(v));

    switch (metric.type) {
      case 'count':
        return values.length;
      case 'sum':
        return values.reduce((sum, v) => sum + v, 0);
      case 'average':
        return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
      case 'min':
        return values.length > 0 ? Math.min(...values) : 0;
      case 'max':
        return values.length > 0 ? Math.max(...values) : 0;
      case 'percentile':
        // Default to 50th percentile (median)
        return this.calculatePercentile(values, 50);
      default:
        return 0;
    }
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    
    if (Number.isInteger(index)) {
      return sorted[index];
    } else {
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index - lower;
      return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    }
  }

  private async calculateTrend(
    metric: MetricDefinition,
    currentPeriod: AggregationPeriod,
    currentValue: number,
    allEvents: AnalyticsEvent[]
  ): Promise<AggregatedMetric['trend']> {
    // Calculate previous period
    const periodDuration = currentPeriod.end.getTime() - currentPeriod.start.getTime();
    const previousPeriod: AggregationPeriod = {
      start: new Date(currentPeriod.start.getTime() - periodDuration),
      end: new Date(currentPeriod.end.getTime() - periodDuration),
      granularity: currentPeriod.granularity
    };

    const previousEvents = this.filterEventsByPeriod(allEvents, previousPeriod);
    const previousValue = this.calculateMetricValue(metric, previousEvents);

    if (previousValue === 0) {
      return currentValue > 0 ? {
        direction: 'up',
        percentage: 100,
        previousValue: 0
      } : undefined;
    }

    const change = ((currentValue - previousValue) / previousValue) * 100;
    
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      percentage: Math.abs(change),
      previousValue
    };
  }

  private getCacheKey(metricId: string, period: AggregationPeriod, segmentIds?: string[]): string {
    const segments = segmentIds ? segmentIds.sort().join(',') : '';
    return `${metricId}_${period.start.getTime()}_${period.end.getTime()}_${period.granularity}_${segments}`;
  }

  private analyzeUserBehaviors(events: AnalyticsEvent[]): Map<string, {
    eventCount: number;
    firstSeen: Date;
    lastSeen: Date;
  }> {
    const behaviors = new Map<string, {
      eventCount: number;
      firstSeen: Date;
      lastSeen: Date;
    }>();

    for (const event of events) {
      if (event.userId) {
        const existing = behaviors.get(event.userId);
        if (existing) {
          existing.eventCount++;
          existing.lastSeen = event.timestamp;
        } else {
          behaviors.set(event.userId, {
            eventCount: 1,
            firstSeen: event.timestamp,
            lastSeen: event.timestamp
          });
        }
      }
    }

    return behaviors;
  }

  private categorizeMetric(metricId: string): string {
    // Simple categorization based on metric ID
    if (metricId.includes('engagement') || metricId.includes('session') || metricId.includes('bounce')) {
      return 'engagement';
    }
    if (metricId.includes('conversion') || metricId.includes('revenue') || metricId.includes('cart')) {
      return 'conversion';
    }
    if (metricId.includes('error') || metricId.includes('response_time') || metricId.includes('api')) {
      return 'technical';
    }
    if (metricId.includes('content') || metricId.includes('quiz')) {
      return 'content';
    }
    return 'other';
  }

  private defaultScoring(metric: AggregatedMetric): number {
    // Default scoring logic based on metric type
    const { value, trend } = metric;
    
    // Base score from value (normalized to 0-100)
    let score = Math.min(value * 10, 100); // This is simplified
    
    // Adjust based on trend
    if (trend) {
      if (trend.direction === 'up') {
        score = Math.min(score + trend.percentage / 10, 100);
      } else if (trend.direction === 'down') {
        score = Math.max(score - trend.percentage / 10, 0);
      }
    }
    
    return score;
  }
}

// Create singleton instance
export const aggregationService = new AggregationService();

// Export alias for compatibility
export const DataAggregationService = AggregationService;