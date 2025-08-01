import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnhancedAnalytics } from '@/services/analytics/enhanced-analytics';
import { DataPoint, DATA_POINTS } from '@/services/analytics/data-points';

describe('Enhanced Analytics Service', () => {
  let analytics: EnhancedAnalytics;
  
  beforeEach(() => {
    analytics = new EnhancedAnalytics();
    vi.clearAllMocks();
  });

  describe('Data Points Collection', () => {
    it('should collect all 150+ data points', () => {
      const allDataPoints = Object.values(DATA_POINTS).flat();
      expect(allDataPoints.length).toBeGreaterThanOrEqual(150);
      
      // Verify categories
      expect(DATA_POINTS.USER_DEMOGRAPHICS).toHaveLength(20);
      expect(DATA_POINTS.BEHAVIORAL_PATTERNS).toHaveLength(25);
      expect(DATA_POINTS.CONTENT_ENGAGEMENT).toHaveLength(20);
      expect(DATA_POINTS.QUIZ_INTERACTIONS).toHaveLength(25);
      expect(DATA_POINTS.PURCHASE_JOURNEY).toHaveLength(25);
      expect(DATA_POINTS.DEVICE_BROWSER).toHaveLength(20);
      expect(DATA_POINTS.GEOGRAPHIC).toHaveLength(15);
      expect(DATA_POINTS.CUSTOM).toHaveLength(10);
    });

    it('should validate data point structure', () => {
      const samplePoint = DATA_POINTS.USER_DEMOGRAPHICS[0];
      
      expect(samplePoint).toHaveProperty('id');
      expect(samplePoint).toHaveProperty('name');
      expect(samplePoint).toHaveProperty('category');
      expect(samplePoint).toHaveProperty('type');
      expect(samplePoint).toHaveProperty('description');
    });
  });

  describe('Event Tracking', () => {
    it('should track events with all required fields', async () => {
      const eventData = {
        eventName: 'pageView',
        userId: 'user_123',
        sessionId: 'session_456',
        properties: {
          page: '/products',
          referrer: 'google.com'
        }
      };

      const result = await analytics.trackEvent(eventData);
      
      expect(result).toHaveProperty('eventId');
      expect(result).toHaveProperty('timestamp');
      expect(result.success).toBe(true);
    });

    it('should enrich events with device fingerprinting', async () => {
      const eventData = {
        eventName: 'viewContent',
        userId: 'user_123',
        properties: {
          contentId: 'battery_123'
        }
      };

      const enrichedEvent = await analytics.enrichEvent(eventData);
      
      expect(enrichedEvent).toHaveProperty('deviceFingerprint');
      expect(enrichedEvent).toHaveProperty('userAgent');
      expect(enrichedEvent).toHaveProperty('screenResolution');
      expect(enrichedEvent).toHaveProperty('timezone');
      expect(enrichedEvent).toHaveProperty('language');
    });

    it('should track behavioral patterns', async () => {
      // Simulate user behavior
      await analytics.trackEvent({
        eventName: 'pageView',
        userId: 'user_123',
        properties: { page: '/home' }
      });

      await analytics.trackEvent({
        eventName: 'pageView',
        userId: 'user_123',
        properties: { page: '/products' }
      });

      await analytics.trackEvent({
        eventName: 'addToCart',
        userId: 'user_123',
        properties: { productId: 'battery_123' }
      });

      const patterns = await analytics.analyzeBehaviorPatterns('user_123');
      
      expect(patterns).toHaveProperty('sessionDepth');
      expect(patterns).toHaveProperty('engagementScore');
      expect(patterns).toHaveProperty('intentSignals');
      expect(patterns.sessionDepth).toBe(3);
    });
  });

  describe('User Profiling', () => {
    it('should build comprehensive user profiles', async () => {
      const profile = await analytics.buildUserProfile('user_123', {
        demographics: {
          age: 35,
          gender: 'male',
          income: '$75,000-$100,000'
        },
        behaviors: {
          visitFrequency: 'weekly',
          averageOrderValue: 250,
          preferredCategories: ['batteries', 'tools']
        }
      });

      expect(profile).toHaveProperty('userId');
      expect(profile).toHaveProperty('segments');
      expect(profile).toHaveProperty('psychographics');
      expect(profile).toHaveProperty('predictiveScores');
      expect(profile).toHaveProperty('lifetimeValue');
    });

    it('should calculate predictive scores', async () => {
      const scores = await analytics.calculatePredictiveScores('user_123');
      
      expect(scores).toHaveProperty('purchaseProbability');
      expect(scores).toHaveProperty('churnRisk');
      expect(scores).toHaveProperty('lifetimeValue');
      expect(scores).toHaveProperty('nextPurchaseWindow');
      
      // Scores should be between 0 and 1
      expect(scores.purchaseProbability).toBeGreaterThanOrEqual(0);
      expect(scores.purchaseProbability).toBeLessThanOrEqual(1);
      expect(scores.churnRisk).toBeGreaterThanOrEqual(0);
      expect(scores.churnRisk).toBeLessThanOrEqual(1);
    });

    it('should generate psychographic profiles', async () => {
      const psychographics = await analytics.generatePsychographics('user_123', {
        quizResponses: {
          primaryUse: 'professional',
          experience: 'expert',
          budget: 'premium'
        },
        browsingBehavior: {
          categoriesViewed: ['pro-tools', 'bulk-batteries'],
          contentEngagement: 'high'
        }
      });

      expect(psychographics).toHaveProperty('personality');
      expect(psychographics).toHaveProperty('values');
      expect(psychographics).toHaveProperty('lifestyle');
      expect(psychographics).toHaveProperty('motivations');
    });
  });

  describe('Session Recording', () => {
    it('should record session data', async () => {
      const sessionId = await analytics.startSession('user_123');
      
      // Record some events
      await analytics.recordSessionEvent(sessionId, {
        type: 'click',
        target: 'add-to-cart-button',
        timestamp: Date.now()
      });

      await analytics.recordSessionEvent(sessionId, {
        type: 'scroll',
        depth: 75,
        timestamp: Date.now()
      });

      const session = await analytics.getSession(sessionId);
      
      expect(session).toHaveProperty('id', sessionId);
      expect(session).toHaveProperty('userId', 'user_123');
      expect(session).toHaveProperty('events');
      expect(session.events).toHaveLength(2);
    });

    it('should calculate session metrics', async () => {
      const sessionId = await analytics.startSession('user_123');
      
      // Simulate session activity
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const metrics = await analytics.getSessionMetrics(sessionId);
      
      expect(metrics).toHaveProperty('duration');
      expect(metrics).toHaveProperty('pageViews');
      expect(metrics).toHaveProperty('interactions');
      expect(metrics).toHaveProperty('bounceRate');
      expect(metrics.duration).toBeGreaterThan(0);
    });
  });

  describe('Funnel Analysis', () => {
    it('should track funnel progression', async () => {
      const funnelId = await analytics.createFunnel('quiz-to-purchase', [
        'quiz_start',
        'quiz_complete',
        'product_view',
        'add_to_cart',
        'checkout',
        'purchase'
      ]);

      // Simulate users going through funnel
      for (let i = 0; i < 100; i++) {
        await analytics.trackFunnelStep(funnelId, `user_${i}`, 'quiz_start');
      }
      
      for (let i = 0; i < 80; i++) {
        await analytics.trackFunnelStep(funnelId, `user_${i}`, 'quiz_complete');
      }
      
      for (let i = 0; i < 60; i++) {
        await analytics.trackFunnelStep(funnelId, `user_${i}`, 'product_view');
      }
      
      for (let i = 0; i < 40; i++) {
        await analytics.trackFunnelStep(funnelId, `user_${i}`, 'add_to_cart');
      }
      
      for (let i = 0; i < 30; i++) {
        await analytics.trackFunnelStep(funnelId, `user_${i}`, 'checkout');
      }
      
      for (let i = 0; i < 25; i++) {
        await analytics.trackFunnelStep(funnelId, `user_${i}`, 'purchase');
      }

      const analysis = await analytics.analyzeFunnel(funnelId);
      
      expect(analysis).toHaveProperty('conversionRate');
      expect(analysis).toHaveProperty('dropoffRates');
      expect(analysis).toHaveProperty('averageTimePerStep');
      expect(analysis.conversionRate).toBe(0.25); // 25/100
      expect(analysis.dropoffRates).toHaveLength(5);
    });
  });

  describe('Cohort Analysis', () => {
    it('should create and track cohorts', async () => {
      const cohortId = await analytics.createCohort('january_2024_signups', {
        criteria: {
          signupDate: { start: '2024-01-01', end: '2024-01-31' }
        }
      });

      // Add users to cohort
      for (let i = 0; i < 50; i++) {
        await analytics.addUserToCohort(cohortId, `user_${i}`);
      }

      const cohortData = await analytics.getCohortMetrics(cohortId);
      
      expect(cohortData).toHaveProperty('size', 50);
      expect(cohortData).toHaveProperty('retentionRates');
      expect(cohortData).toHaveProperty('averageRevenue');
      expect(cohortData).toHaveProperty('churnRate');
    });

    it('should calculate retention curves', async () => {
      const cohortId = 'test_cohort';
      const retention = await analytics.calculateRetention(cohortId, {
        periods: [1, 7, 14, 30, 60, 90],
        metric: 'active_users'
      });

      expect(retention).toHaveProperty('curve');
      expect(retention.curve).toHaveLength(6);
      expect(retention.curve[0]).toBeGreaterThanOrEqual(retention.curve[5]);
    });
  });

  describe('Attribution Analysis', () => {
    it('should track attribution touchpoints', async () => {
      const userId = 'user_123';
      
      // Track touchpoints
      await analytics.trackTouchpoint(userId, {
        channel: 'google_ads',
        campaign: 'battery_sale_2024',
        timestamp: Date.now() - 86400000 // 1 day ago
      });

      await analytics.trackTouchpoint(userId, {
        channel: 'facebook',
        campaign: 'retargeting_jan',
        timestamp: Date.now() - 43200000 // 12 hours ago
      });

      await analytics.trackTouchpoint(userId, {
        channel: 'email',
        campaign: 'newsletter_promo',
        timestamp: Date.now() - 3600000 // 1 hour ago
      });

      // Track conversion
      await analytics.trackConversion(userId, {
        value: 250,
        eventName: 'purchase'
      });

      const attribution = await analytics.calculateAttribution(userId);
      
      expect(attribution).toHaveProperty('firstTouch');
      expect(attribution).toHaveProperty('lastTouch');
      expect(attribution).toHaveProperty('linear');
      expect(attribution).toHaveProperty('timeDecay');
      expect(attribution).toHaveProperty('datadriven');
      
      expect(attribution.firstTouch.channel).toBe('google_ads');
      expect(attribution.lastTouch.channel).toBe('email');
    });
  });

  describe('Real-time Analytics', () => {
    it('should provide real-time metrics', async () => {
      const metrics = await analytics.getRealTimeMetrics();
      
      expect(metrics).toHaveProperty('activeUsers');
      expect(metrics).toHaveProperty('pageViews');
      expect(metrics).toHaveProperty('events');
      expect(metrics).toHaveProperty('conversions');
      expect(metrics).toHaveProperty('revenue');
    });

    it('should track real-time user flow', async () => {
      const flow = await analytics.getUserFlow({
        timeWindow: 300 // 5 minutes
      });

      expect(flow).toHaveProperty('nodes');
      expect(flow).toHaveProperty('edges');
      expect(flow).toHaveProperty('exitRates');
    });
  });

  describe('Performance Metrics', () => {
    it('should handle high volume of events', async () => {
      const startTime = Date.now();
      const promises = [];

      // Track 10,000 events
      for (let i = 0; i < 10000; i++) {
        promises.push(analytics.trackEvent({
          eventName: 'test_event',
          userId: `user_${i % 100}`,
          properties: { index: i }
        }));
      }

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      // Should complete in under 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should batch events efficiently', async () => {
      const events = Array.from({ length: 1000 }, (_, i) => ({
        eventName: 'batch_test',
        userId: `user_${i}`,
        properties: { index: i }
      }));

      const result = await analytics.batchTrackEvents(events);
      
      expect(result.success).toBe(true);
      expect(result.processed).toBe(1000);
      expect(result.failed).toBe(0);
    });
  });

  describe('Data Export', () => {
    it('should export analytics data in multiple formats', async () => {
      // Track some events
      await analytics.trackEvent({
        eventName: 'test_export',
        userId: 'user_123',
        properties: { test: true }
      });

      const jsonExport = await analytics.exportData({
        format: 'json',
        dateRange: { start: new Date(Date.now() - 86400000), end: new Date() }
      });

      const csvExport = await analytics.exportData({
        format: 'csv',
        dateRange: { start: new Date(Date.now() - 86400000), end: new Date() }
      });

      expect(jsonExport).toHaveProperty('events');
      expect(jsonExport).toHaveProperty('users');
      expect(jsonExport).toHaveProperty('sessions');
      
      expect(csvExport).toContain('eventName,userId,timestamp');
    });
  });

  describe('Privacy Compliance', () => {
    it('should anonymize data on request', async () => {
      const userId = 'user_to_anonymize';
      
      // Track events
      await analytics.trackEvent({
        eventName: 'purchase',
        userId,
        properties: { amount: 100 }
      });

      // Anonymize user
      await analytics.anonymizeUser(userId);

      const events = await analytics.getUserEvents(userId);
      
      expect(events).toHaveLength(0);
    });

    it('should respect data retention policies', async () => {
      const retentionDays = 90;
      await analytics.setDataRetention(retentionDays);

      const policy = await analytics.getDataRetentionPolicy();
      
      expect(policy.days).toBe(retentionDays);
      expect(policy.autoDelete).toBe(true);
    });
  });
});