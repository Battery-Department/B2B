/**
 * Analytics Test Integration
 * Demonstrates integration with Meta Simulator for testing
 */

import { analytics } from './enhanced-analytics';
import { aggregationService } from './aggregation';
import { analyticsStorage } from './storage';
import { DATA_POINTS } from './data-points';
import { MetaSimulator } from '../meta-simulator';

export class AnalyticsTestIntegration {
  private metaSimulator: MetaSimulator;
  private isRunning: boolean = false;

  constructor() {
    this.metaSimulator = new MetaSimulator({
      userCount: 100,
      sessionsPerUser: { min: 1, max: 5 },
      eventsPerSession: { min: 10, max: 50 }
    });

    this.setupEventListeners();
  }

  /**
   * Set up event listeners to track Meta Simulator events
   */
  private setupEventListeners(): void {
    // Track page views
    this.metaSimulator.on('pageView', (data) => {
      analytics.trackEvent('page_view', {
        page: data.page,
        title: data.title,
        referrer: data.referrer
      }, {
        [DATA_POINTS.USER_ID.id]: data.userId,
        [DATA_POINTS.SESSION_ID.id]: data.sessionId,
        [DATA_POINTS.DEVICE_TYPE.id]: data.deviceType,
        [DATA_POINTS.COUNTRY.id]: data.country,
        [DATA_POINTS.SOURCE.id]: data.source,
        [DATA_POINTS.TIME_ON_PAGE.id]: data.timeOnPage
      });
    });

    // Track quiz events
    this.metaSimulator.on('quizEvent', (data) => {
      const quizDataPoints: Record<string, any> = {
        [DATA_POINTS.QUIZ_ID.id]: data.quizId,
        [DATA_POINTS.QUIZ_SESSION_ID.id]: data.quizSessionId,
        [DATA_POINTS.USER_ID.id]: data.userId
      };

      switch (data.eventType) {
        case 'quiz_started':
          quizDataPoints[DATA_POINTS.QUIZ_START_TIME.id] = new Date();
          break;
        case 'quiz_completed':
          quizDataPoints[DATA_POINTS.QUIZ_COMPLETION_TIME.id] = new Date();
          quizDataPoints[DATA_POINTS.QUIZ_SCORE.id] = data.score;
          quizDataPoints[DATA_POINTS.QUIZ_COMPLETION_RATE.id] = 100;
          quizDataPoints[DATA_POINTS.QUIZ_RESPONSES.id] = data.responses;
          quizDataPoints[DATA_POINTS.QUIZ_RECOMMENDATION.id] = data.recommendation;
          break;
        case 'quiz_abandoned':
          quizDataPoints[DATA_POINTS.QUIZ_ABANDONED_AT.id] = data.abandonedAt;
          quizDataPoints[DATA_POINTS.QUIZ_COMPLETION_RATE.id] = data.completionRate;
          break;
      }

      analytics.trackEvent(data.eventType, data, quizDataPoints);
    });

    // Track conversions
    this.metaSimulator.on('conversion', (data) => {
      analytics.trackEvent('conversion', {
        type: data.type,
        value: data.value,
        products: data.products
      }, {
        [DATA_POINTS.USER_ID.id]: data.userId,
        [DATA_POINTS.SESSION_ID.id]: data.sessionId,
        [DATA_POINTS.CART_VALUE.id]: data.value,
        [DATA_POINTS.CART_ITEMS.id]: data.products,
        [DATA_POINTS.QUIZ_CONVERSION.id]: data.fromQuiz || false,
        [DATA_POINTS.PAYMENT_METHOD.id]: data.paymentMethod,
        [DATA_POINTS.SHIPPING_METHOD.id]: data.shippingMethod
      });
    });

    // Track content engagement
    this.metaSimulator.on('contentEngagement', (data) => {
      analytics.trackEvent('content_' + data.action, {
        contentId: data.contentId,
        contentType: data.contentType,
        contentTitle: data.contentTitle
      }, {
        [DATA_POINTS.USER_ID.id]: data.userId,
        [DATA_POINTS.SESSION_ID.id]: data.sessionId,
        [DATA_POINTS.CONTENT_ENGAGEMENT_TIME.id]: data.engagementTime,
        [DATA_POINTS.CONTENT_COMPLETION_RATE.id]: data.completionRate,
        [DATA_POINTS.CONTENT_FORMAT_PREFERENCE.id]: data.contentType
      });
    });

    // Track errors
    this.metaSimulator.on('error', (data) => {
      analytics.trackEvent('error', {
        message: data.message,
        stack: data.stack,
        url: data.url
      }, {
        [DATA_POINTS.USER_ID.id]: data.userId,
        [DATA_POINTS.SESSION_ID.id]: data.sessionId,
        [DATA_POINTS.ERROR_ENCOUNTERS.id]: [data]
      });
    });
  }

  /**
   * Start the test integration
   */
  public async start(): Promise<void> {
    if (this.isRunning) return;

    console.log('Starting Analytics Test Integration...');
    this.isRunning = true;

    // Start Meta Simulator
    await this.metaSimulator.start();

    // Create default funnels
    this.createTestFunnels();

    // Create default cohorts
    this.createTestCohorts();

    // Start periodic reporting
    this.startPeriodicReporting();
  }

  /**
   * Stop the test integration
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('Stopping Analytics Test Integration...');
    this.isRunning = false;

    await this.metaSimulator.stop();
  }

  /**
   * Create test funnels
   */
  private createTestFunnels(): void {
    // Quiz to Purchase Funnel
    analytics.createFunnel('Quiz to Purchase', [
      { name: 'Quiz Started', eventName: 'quiz_started' },
      { name: 'Quiz Completed', eventName: 'quiz_completed' },
      { name: 'Product Viewed', eventName: 'page_view', conditions: { page: '/products' } },
      { name: 'Add to Cart', eventName: 'cart_add' },
      { name: 'Checkout Started', eventName: 'checkout_start' },
      { name: 'Purchase', eventName: 'conversion', conditions: { type: 'purchase' } }
    ]);

    // Content Engagement Funnel
    analytics.createFunnel('Content Engagement', [
      { name: 'Content Viewed', eventName: 'content_view' },
      { name: 'Content Engaged', eventName: 'content_engage' },
      { name: 'Content Shared', eventName: 'content_share' },
      { name: 'Conversion', eventName: 'conversion' }
    ]);

    // Onboarding Funnel
    analytics.createFunnel('User Onboarding', [
      { name: 'Registration', eventName: 'user_registered' },
      { name: 'Profile Completed', eventName: 'profile_completed' },
      { name: 'First Action', eventName: 'first_action_taken' },
      { name: 'First Purchase', eventName: 'conversion', conditions: { type: 'purchase' } }
    ]);
  }

  /**
   * Create test cohorts
   */
  private createTestCohorts(): void {
    // Quiz Completers Cohort
    analytics.createCohort('Quiz Completers', {
      filters: [{
        dataPoint: DATA_POINTS.QUIZ_COMPLETION_RATE.id,
        operator: 'equals',
        value: 100
      }]
    });

    // High Value Users Cohort
    analytics.createCohort('High Value Users', {
      filters: [{
        dataPoint: DATA_POINTS.USER_LIFETIME_VALUE.id,
        operator: 'greater',
        value: 500
      }]
    });

    // Mobile Users Cohort
    analytics.createCohort('Mobile Users', {
      filters: [{
        dataPoint: DATA_POINTS.DEVICE_TYPE.id,
        operator: 'equals',
        value: 'mobile'
      }]
    });

    // Facebook Campaign Cohort
    analytics.createCohort('Facebook Campaign Users', {
      filters: [{
        dataPoint: DATA_POINTS.USER_ACQUISITION_SOURCE.id,
        operator: 'contains',
        value: 'facebook'
      }],
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      }
    });
  }

  /**
   * Start periodic reporting
   */
  private startPeriodicReporting(): void {
    // Report every 5 minutes
    setInterval(async () => {
      if (!this.isRunning) return;

      console.log('\n=== Analytics Report ===');
      
      // Get recent events
      const events = await analyticsStorage.queryEvents({
        startDate: new Date(Date.now() - 5 * 60 * 1000),
        endDate: new Date()
      });

      console.log(`Events in last 5 minutes: ${events.length}`);

      // Calculate metrics
      const metrics = await aggregationService.calculateMetrics(events, {
        start: new Date(Date.now() - 5 * 60 * 1000),
        end: new Date(),
        granularity: 'minute'
      });

      console.log('\nKey Metrics:');
      metrics.forEach(metric => {
        console.log(`- ${metric.metric.name}: ${metric.value.toFixed(2)}`);
      });

      // Get funnel analysis
      const funnelAnalysis = analytics.analyzeFunnel('Quiz to Purchase');
      console.log('\nQuiz to Purchase Funnel:');
      funnelAnalysis.steps.forEach(step => {
        console.log(`- ${step.name}: ${(step.conversionRate * 100).toFixed(1)}% (${step.users} users)`);
      });

      // Get cohort metrics
      const cohortMetrics = analytics.getCohortMetrics('Quiz Completers');
      console.log('\nQuiz Completers Cohort:');
      console.log(`- Size: ${cohortMetrics.size} users`);
      console.log(`- Engagement Score: ${cohortMetrics.engagement.toFixed(2)}`);
      console.log(`- Revenue: $${cohortMetrics.revenue.toFixed(2)}`);

      console.log('=====================\n');
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Generate sample report
   */
  public async generateReport(): Promise<any> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get all events from last 24 hours
    const events = await analyticsStorage.queryEvents({
      startDate: dayAgo,
      endDate: now
    });

    // Calculate all metrics
    const metrics = await aggregationService.calculateMetrics(events, {
      start: dayAgo,
      end: now,
      granularity: 'hour'
    });

    // Get performance score
    const performanceScore = aggregationService.calculatePerformanceScore(metrics);

    // Get storage stats
    const storageStats = await analyticsStorage.getStats();

    return {
      generated: now,
      period: { start: dayAgo, end: now },
      summary: {
        totalEvents: events.length,
        uniqueUsers: new Set(events.map(e => e.userId).filter(Boolean)).size,
        uniqueSessions: new Set(events.map(e => e.sessionId)).size,
        ...storageStats
      },
      metrics: metrics.map(m => ({
        name: m.metric.name,
        value: m.value,
        trend: m.trend
      })),
      performance: performanceScore,
      topEvents: storageStats.topEvents
    };
  }
}

// Export singleton instance
export const analyticsTestIntegration = new AnalyticsTestIntegration();

// Example usage
if (process.env.NODE_ENV === 'development') {
  // Uncomment to start test integration
  // analyticsTestIntegration.start();
}