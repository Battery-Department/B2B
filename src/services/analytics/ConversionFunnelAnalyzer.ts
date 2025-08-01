interface FunnelStep {
  id: string;
  name: string;
  description: string;
  order: number;
  expectedActions: string[];
  conversionCriteria: (event: FunnelEvent) => boolean;
  isOptional?: boolean;
}

interface FunnelEvent {
  userId: string;
  sessionId: string;
  stepId: string;
  action: string;
  timestamp: Date;
  metadata?: any;
  value?: number;
  productId?: string;
}

interface FunnelMetrics {
  stepId: string;
  stepName: string;
  totalEntries: number;
  completions: number;
  dropoffs: number;
  conversionRate: number;
  averageTimeToComplete: number;
  averageTimeOnStep: number;
  revenue?: number;
  topDropoffReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
}

interface FunnelAnalysis {
  funnelId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  totalSessions: number;
  overallConversionRate: number;
  stepMetrics: FunnelMetrics[];
  bottlenecks: Array<{
    stepId: string;
    severity: 'low' | 'medium' | 'high';
    impact: number;
    recommendations: string[];
  }>;
  cohortAnalysis: {
    [cohort: string]: {
      conversionRate: number;
      averageRevenue: number;
      completionTime: number;
    };
  };
  segmentPerformance: {
    [segment: string]: FunnelMetrics[];
  };
}

interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  targetMetric: string;
  variants: Array<{
    id: string;
    name: string;
    description: string;
    trafficAllocation: number; // Percentage 0-100
    config: any; // Variant-specific configuration
  }>;
  criteria: {
    targetAudience?: string[];
    includeCriteria?: any;
    excludeCriteria?: any;
    minimumSampleSize?: number;
    maxDuration?: number; // days
  };
  statisticalSettings: {
    confidenceLevel: number; // 0.95 for 95%
    minimumDetectableEffect: number; // Minimum effect size to detect
    power: number; // Statistical power (0.8 for 80%)
  };
}

interface ABTestResult {
  testId: string;
  status: 'running' | 'completed' | 'inconclusive';
  startDate: Date;
  endDate?: Date;
  duration: number; // days
  participants: number;
  variants: Array<{
    id: string;
    name: string;
    participants: number;
    conversionRate: number;
    averageValue: number;
    totalValue: number;
    confidence: number;
    isWinner?: boolean;
    lift?: number; // % improvement over control
    pValue?: number;
  }>;
  statistics: {
    significance: number;
    confidenceInterval: [number, number];
    sampleSizeReached: boolean;
    hasWinner: boolean;
    winningVariant?: string;
  };
  insights: string[];
  recommendations: string[];
}

export class ConversionFunnelAnalyzer {
  private funnelDefinitions: Map<string, FunnelStep[]> = new Map();
  private funnelEvents: Map<string, FunnelEvent[]> = new Map();
  private abTests: Map<string, ABTestConfig> = new Map();
  private abTestResults: Map<string, ABTestResult> = new Map();
  private abTestAssignments: Map<string, Map<string, string>> = new Map(); // userId -> testId -> variantId

  constructor() {
    this.initializeFunnels();
    this.generateMockData();
  }

  private initializeFunnels() {
    // Define standard e-commerce funnel
    const ecommerceFunnel: FunnelStep[] = [
      {
        id: 'awareness',
        name: 'Awareness',
        description: 'User becomes aware of products',
        order: 1,
        expectedActions: ['page_view', 'search', 'ad_click'],
        conversionCriteria: (event) => ['page_view', 'search', 'ad_click'].includes(event.action)
      },
      {
        id: 'interest',
        name: 'Interest',
        description: 'User shows interest in specific products',
        order: 2,
        expectedActions: ['product_view', 'category_browse', 'filter_apply'],
        conversionCriteria: (event) => ['product_view', 'category_browse', 'filter_apply'].includes(event.action)
      },
      {
        id: 'consideration',
        name: 'Consideration',
        description: 'User evaluates products and options',
        order: 3,
        expectedActions: ['product_compare', 'configure_product', 'read_reviews'],
        conversionCriteria: (event) => ['product_compare', 'configure_product', 'read_reviews'].includes(event.action)
      },
      {
        id: 'intent',
        name: 'Intent',
        description: 'User shows purchase intent',
        order: 4,
        expectedActions: ['add_to_cart', 'save_for_later', 'get_quote'],
        conversionCriteria: (event) => ['add_to_cart', 'save_for_later', 'get_quote'].includes(event.action)
      },
      {
        id: 'purchase',
        name: 'Purchase',
        description: 'User completes purchase',
        order: 5,
        expectedActions: ['checkout_start', 'payment_complete', 'order_complete'],
        conversionCriteria: (event) => ['checkout_start', 'payment_complete', 'order_complete'].includes(event.action)
      },
      {
        id: 'retention',
        name: 'Retention',
        description: 'User returns for additional purchases',
        order: 6,
        expectedActions: ['return_visit', 'repeat_purchase', 'referral'],
        conversionCriteria: (event) => ['return_visit', 'repeat_purchase', 'referral'].includes(event.action),
        isOptional: true
      }
    ];

    this.funnelDefinitions.set('ecommerce', ecommerceFunnel);

    // Define product discovery funnel
    const discoveryFunnel: FunnelStep[] = [
      {
        id: 'entry',
        name: 'Entry',
        description: 'User enters the product discovery flow',
        order: 1,
        expectedActions: ['landing_page', 'search', 'quiz_start'],
        conversionCriteria: (event) => ['landing_page', 'search', 'quiz_start'].includes(event.action)
      },
      {
        id: 'exploration',
        name: 'Exploration',
        description: 'User explores product options',
        order: 2,
        expectedActions: ['product_view', 'filter_apply', 'sort_change'],
        conversionCriteria: (event) => ['product_view', 'filter_apply', 'sort_change'].includes(event.action)
      },
      {
        id: 'engagement',
        name: 'Engagement',
        description: 'User engages with product content',
        order: 3,
        expectedActions: ['configure_product', 'view_specs', 'watch_video'],
        conversionCriteria: (event) => ['configure_product', 'view_specs', 'watch_video'].includes(event.action)
      },
      {
        id: 'conversion',
        name: 'Conversion',
        description: 'User takes conversion action',
        order: 4,
        expectedActions: ['add_to_cart', 'request_quote', 'contact_sales'],
        conversionCriteria: (event) => ['add_to_cart', 'request_quote', 'contact_sales'].includes(event.action)
      }
    ];

    this.funnelDefinitions.set('discovery', discoveryFunnel);
  }

  private generateMockData() {
    // Generate mock funnel events
    const users = Array.from({ length: 1000 }, (_, i) => `user_${i}`);
    const sessions = Array.from({ length: 2000 }, (_, i) => `session_${i}`);
    
    const actions = [
      'page_view', 'search', 'ad_click', 'product_view', 'category_browse',
      'filter_apply', 'product_compare', 'configure_product', 'read_reviews',
      'add_to_cart', 'save_for_later', 'get_quote', 'checkout_start',
      'payment_complete', 'order_complete', 'return_visit', 'repeat_purchase'
    ];

    const events: FunnelEvent[] = [];
    
    // Generate realistic funnel progression with drop-offs
    sessions.forEach(sessionId => {
      const userId = users[Math.floor(Math.random() * users.length)];
      const sessionEvents: FunnelEvent[] = [];
      
      let currentTime = new Date();
      currentTime.setDate(currentTime.getDate() - Math.floor(Math.random() * 30));
      
      // Simulate funnel progression with realistic drop-off rates
      const funnelSteps = this.funnelDefinitions.get('ecommerce') || [];
      let continueFunnel = true;
      
      funnelSteps.forEach((step, index) => {
        if (!continueFunnel) return;
        
        // Drop-off rates: 20%, 35%, 45%, 60%, 75%, 85%
        const dropOffRates = [0.2, 0.35, 0.45, 0.6, 0.75, 0.85];
        const shouldDropOff = Math.random() < dropOffRates[index];
        
        if (shouldDropOff && index > 0) {
          continueFunnel = false;
          return;
        }
        
        // Generate event for this step
        const stepAction = step.expectedActions[Math.floor(Math.random() * step.expectedActions.length)];
        const event: FunnelEvent = {
          userId,
          sessionId,
          stepId: step.id,
          action: stepAction,
          timestamp: new Date(currentTime.getTime() + Math.random() * 3600000), // Random time within hour
          metadata: {
            deviceType: Math.random() > 0.7 ? 'mobile' : 'desktop',
            source: Math.random() > 0.5 ? 'organic' : 'paid'
          }
        };
        
        if (step.id === 'purchase') {
          event.value = 95 + Math.random() * 300; // Random purchase value
          event.productId = ['6Ah', '9Ah', '15Ah'][Math.floor(Math.random() * 3)];
        }
        
        sessionEvents.push(event);
        currentTime = new Date(currentTime.getTime() + Math.random() * 1800000); // 0-30 min between events
      });
      
      events.push(...sessionEvents);
    });

    this.funnelEvents.set('ecommerce', events);
    
    // Initialize sample A/B tests
    this.initializeSampleABTests();
  }

  private initializeSampleABTests() {
    // Sample A/B test: Checkout flow optimization
    const checkoutTest: ABTestConfig = {
      id: 'checkout_optimization_001',
      name: 'Checkout Flow Optimization',
      description: 'Test simplified vs. detailed checkout flow',
      status: 'running',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      targetMetric: 'conversion_rate',
      variants: [
        {
          id: 'control',
          name: 'Original Checkout',
          description: 'Current multi-step checkout process',
          trafficAllocation: 50,
          config: { steps: 4, guestCheckout: false }
        },
        {
          id: 'simplified',
          name: 'Simplified Checkout',
          description: 'Single-page checkout with guest option',
          trafficAllocation: 50,
          config: { steps: 1, guestCheckout: true }
        }
      ],
      criteria: {
        targetAudience: ['returning_customers', 'high_intent'],
        minimumSampleSize: 1000,
        maxDuration: 30
      },
      statisticalSettings: {
        confidenceLevel: 0.95,
        minimumDetectableEffect: 0.05, // 5% minimum detectable effect
        power: 0.8
      }
    };

    this.abTests.set(checkoutTest.id, checkoutTest);

    // Sample A/B test: Product page layout
    const productPageTest: ABTestConfig = {
      id: 'product_page_layout_002',
      name: 'Product Page Layout Test',
      description: 'Test different product page layouts for engagement',
      status: 'running',
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      targetMetric: 'add_to_cart_rate',
      variants: [
        {
          id: 'control',
          name: 'Standard Layout',
          description: 'Current product page layout',
          trafficAllocation: 33,
          config: { layout: 'standard', configPosition: 'right' }
        },
        {
          id: 'hero_config',
          name: 'Hero Configuration',
          description: 'Configuration tool prominently displayed',
          trafficAllocation: 33,
          config: { layout: 'hero', configPosition: 'center' }
        },
        {
          id: 'tabs_layout',
          name: 'Tabbed Layout',
          description: 'Information organized in tabs',
          trafficAllocation: 34,
          config: { layout: 'tabs', configPosition: 'tab' }
        }
      ],
      criteria: {
        minimumSampleSize: 2000,
        maxDuration: 30
      },
      statisticalSettings: {
        confidenceLevel: 0.95,
        minimumDetectableEffect: 0.03,
        power: 0.8
      }
    };

    this.abTests.set(productPageTest.id, productPageTest);

    // Generate mock results for these tests
    this.generateMockABTestResults();
  }

  private generateMockABTestResults() {
    // Generate results for checkout optimization test
    const checkoutResult: ABTestResult = {
      testId: 'checkout_optimization_001',
      status: 'running',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      duration: 7,
      participants: 1250,
      variants: [
        {
          id: 'control',
          name: 'Original Checkout',
          participants: 625,
          conversionRate: 0.072, // 7.2%
          averageValue: 185,
          totalValue: 8325,
          confidence: 0.89
        },
        {
          id: 'simplified',
          name: 'Simplified Checkout',
          participants: 625,
          conversionRate: 0.094, // 9.4%
          averageValue: 178,
          totalValue: 10463,
          confidence: 0.92,
          isWinner: true,
          lift: 30.6, // 30.6% improvement
          pValue: 0.032
        }
      ],
      statistics: {
        significance: 0.968,
        confidenceInterval: [0.15, 0.46],
        sampleSizeReached: true,
        hasWinner: true,
        winningVariant: 'simplified'
      },
      insights: [
        'Simplified checkout significantly improves conversion rate',
        'Guest checkout option reduces friction for new customers',
        'Single-page flow reduces abandonment at payment step'
      ],
      recommendations: [
        'Implement simplified checkout as default',
        'A/B test guest vs. account creation incentives',
        'Monitor impact on customer retention'
      ]
    };

    this.abTestResults.set('checkout_optimization_001', checkoutResult);

    // Generate results for product page test
    const productPageResult: ABTestResult = {
      testId: 'product_page_layout_002',
      status: 'running',
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      duration: 14,
      participants: 2100,
      variants: [
        {
          id: 'control',
          name: 'Standard Layout',
          participants: 693,
          conversionRate: 0.156, // 15.6%
          averageValue: 142,
          totalValue: 15373,
          confidence: 0.85
        },
        {
          id: 'hero_config',
          name: 'Hero Configuration',
          participants: 693,
          conversionRate: 0.178, // 17.8%
          averageValue: 158,
          totalValue: 19486,
          confidence: 0.91,
          lift: 14.1,
          pValue: 0.058
        },
        {
          id: 'tabs_layout',
          name: 'Tabbed Layout',
          participants: 714,
          conversionRate: 0.171, // 17.1%
          averageValue: 151,
          totalValue: 18443,
          confidence: 0.88,
          lift: 9.6,
          pValue: 0.12
        }
      ],
      statistics: {
        significance: 0.87,
        confidenceInterval: [0.05, 0.23],
        sampleSizeReached: true,
        hasWinner: false
      },
      insights: [
        'Hero configuration shows promising improvement in add-to-cart rate',
        'Both variants outperform control but results need more statistical power',
        'Configuration prominence correlates with engagement'
      ],
      recommendations: [
        'Continue test for 1-2 more weeks to reach statistical significance',
        'Consider testing hero configuration with different messaging',
        'Monitor secondary metrics like time on page and bounce rate'
      ]
    };

    this.abTestResults.set('product_page_layout_002', productPageResult);
  }

  /**
   * Analyze conversion funnel performance
   */
  async analyzeFunnel(
    funnelId: string,
    timeRange: { start: Date; end: Date },
    segmentBy?: string
  ): Promise<FunnelAnalysis> {
    
    const funnelSteps = this.funnelDefinitions.get(funnelId);
    if (!funnelSteps) {
      throw new Error(`Funnel ${funnelId} not found`);
    }

    const events = this.funnelEvents.get(funnelId) || [];
    const filteredEvents = events.filter(event => 
      event.timestamp >= timeRange.start && event.timestamp <= timeRange.end
    );

    // Calculate step metrics
    const stepMetrics = await this.calculateStepMetrics(funnelSteps, filteredEvents);
    
    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks(stepMetrics);
    
    // Perform cohort analysis
    const cohortAnalysis = await this.performCohortAnalysis(filteredEvents);
    
    // Analyze segment performance
    const segmentPerformance = segmentBy 
      ? await this.analyzeSegmentPerformance(funnelSteps, filteredEvents, segmentBy)
      : {};

    // Calculate overall metrics
    const totalSessions = new Set(filteredEvents.map(e => e.sessionId)).size;
    const completedSessions = filteredEvents.filter(e => e.stepId === 'purchase').length;
    const overallConversionRate = totalSessions > 0 ? completedSessions / totalSessions : 0;

    return {
      funnelId,
      timeRange,
      totalSessions,
      overallConversionRate,
      stepMetrics,
      bottlenecks,
      cohortAnalysis,
      segmentPerformance
    };
  }

  private async calculateStepMetrics(steps: FunnelStep[], events: FunnelEvent[]): Promise<FunnelMetrics[]> {
    const metrics: FunnelMetrics[] = [];
    
    steps.forEach((step, index) => {
      const stepEvents = events.filter(e => e.stepId === step.id);
      const uniqueSessions = new Set(stepEvents.map(e => e.sessionId));
      
      // Calculate entries (sessions that reached this step)
      const totalEntries = uniqueSessions.size;
      
      // Calculate completions (sessions that completed this step and moved to next)
      let completions = 0;
      if (index < steps.length - 1) {
        const nextStep = steps[index + 1];
        const nextStepSessions = new Set(
          events.filter(e => e.stepId === nextStep.id).map(e => e.sessionId)
        );
        completions = Array.from(uniqueSessions).filter(sessionId => 
          nextStepSessions.has(sessionId)
        ).length;
      } else {
        // For last step, completion = entry
        completions = totalEntries;
      }
      
      const dropoffs = totalEntries - completions;
      const conversionRate = totalEntries > 0 ? completions / totalEntries : 0;
      
      // Calculate time metrics
      const sessionTimes = this.calculateSessionTimes(stepEvents);
      const averageTimeOnStep = sessionTimes.averageTimeOnStep;
      const averageTimeToComplete = sessionTimes.averageTimeToComplete;
      
      // Calculate revenue for purchase step
      const revenue = step.id === 'purchase' 
        ? stepEvents.reduce((sum, e) => sum + (e.value || 0), 0)
        : undefined;
      
      // Identify top drop-off reasons (mock)
      const topDropoffReasons = this.identifyDropoffReasons(step, dropoffs);

      metrics.push({
        stepId: step.id,
        stepName: step.name,
        totalEntries,
        completions,
        dropoffs,
        conversionRate,
        averageTimeToComplete,
        averageTimeOnStep,
        revenue,
        topDropoffReasons
      });
    });
    
    return metrics;
  }

  private calculateSessionTimes(events: FunnelEvent[]): {
    averageTimeOnStep: number;
    averageTimeToComplete: number;
  } {
    // Group events by session
    const sessionEvents = new Map<string, FunnelEvent[]>();
    events.forEach(event => {
      if (!sessionEvents.has(event.sessionId)) {
        sessionEvents.set(event.sessionId, []);
      }
      sessionEvents.get(event.sessionId)!.push(event);
    });

    const timesOnStep: number[] = [];
    const timesToComplete: number[] = [];

    sessionEvents.forEach(events => {
      if (events.length > 0) {
        events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        // Time on step = time from first to last event in step
        const timeOnStep = events[events.length - 1].timestamp.getTime() - events[0].timestamp.getTime();
        timesOnStep.push(timeOnStep / 1000); // Convert to seconds
        
        // Time to complete = same as time on step for single step
        timesToComplete.push(timeOnStep / 1000);
      }
    });

    return {
      averageTimeOnStep: timesOnStep.length > 0 
        ? timesOnStep.reduce((sum, time) => sum + time, 0) / timesOnStep.length 
        : 0,
      averageTimeToComplete: timesToComplete.length > 0 
        ? timesToComplete.reduce((sum, time) => sum + time, 0) / timesToComplete.length 
        : 0
    };
  }

  private identifyDropoffReasons(step: FunnelStep, totalDropoffs: number): Array<{
    reason: string;
    count: number;
    percentage: number;
  }> {
    
    // Mock drop-off reasons based on step
    const reasonsByStep: { [stepId: string]: Array<{ reason: string; weight: number }> } = {
      awareness: [
        { reason: 'Page load too slow', weight: 0.3 },
        { reason: 'Irrelevant content', weight: 0.25 },
        { reason: 'Poor search results', weight: 0.2 },
        { reason: 'Unclear value proposition', weight: 0.15 },
        { reason: 'Mobile experience issues', weight: 0.1 }
      ],
      interest: [
        { reason: 'Limited product selection', weight: 0.25 },
        { reason: 'Price concerns', weight: 0.3 },
        { reason: 'Unclear product benefits', weight: 0.2 },
        { reason: 'Comparison difficulties', weight: 0.15 },
        { reason: 'Technical specifications unclear', weight: 0.1 }
      ],
      consideration: [
        { reason: 'Insufficient product information', weight: 0.3 },
        { reason: 'No customer reviews', weight: 0.25 },
        { reason: 'Configuration too complex', weight: 0.2 },
        { reason: 'Shipping concerns', weight: 0.15 },
        { reason: 'Competitor comparison', weight: 0.1 }
      ],
      intent: [
        { reason: 'Shipping costs too high', weight: 0.3 },
        { reason: 'Payment security concerns', weight: 0.2 },
        { reason: 'Account creation required', weight: 0.25 },
        { reason: 'Delivery time too long', weight: 0.15 },
        { reason: 'Return policy unclear', weight: 0.1 }
      ],
      purchase: [
        { reason: 'Payment method not supported', weight: 0.25 },
        { reason: 'Checkout process too long', weight: 0.3 },
        { reason: 'Unexpected fees', weight: 0.2 },
        { reason: 'Technical errors', weight: 0.15 },
        { reason: 'Trust/security concerns', weight: 0.1 }
      ]
    };

    const stepReasons = reasonsByStep[step.id] || [];
    
    return stepReasons.map(({ reason, weight }) => ({
      reason,
      count: Math.round(totalDropoffs * weight),
      percentage: weight * 100
    }));
  }

  private identifyBottlenecks(stepMetrics: FunnelMetrics[]): Array<{
    stepId: string;
    severity: 'low' | 'medium' | 'high';
    impact: number;
    recommendations: string[];
  }> {
    
    const bottlenecks = [];
    
    stepMetrics.forEach((metric, index) => {
      const conversionRate = metric.conversionRate;
      let severity: 'low' | 'medium' | 'high' = 'low';
      
      // Determine severity based on conversion rate
      if (conversionRate < 0.3) severity = 'high';
      else if (conversionRate < 0.6) severity = 'medium';
      
      // Calculate impact (dropoffs as percentage of total funnel entries)
      const totalEntries = stepMetrics[0]?.totalEntries || 1;
      const impact = (metric.dropoffs / totalEntries) * 100;
      
      if (severity !== 'low' || impact > 10) {
        const recommendations = this.generateBottleneckRecommendations(metric.stepId, severity, conversionRate);
        
        bottlenecks.push({
          stepId: metric.stepId,
          severity,
          impact,
          recommendations
        });
      }
    });
    
    return bottlenecks;
  }

  private generateBottleneckRecommendations(stepId: string, severity: string, conversionRate: number): string[] {
    const recommendations: { [stepId: string]: string[] } = {
      awareness: [
        'Optimize page load speed and mobile experience',
        'Improve search functionality and filters',
        'Clarify value proposition and product benefits',
        'A/B test landing page layouts'
      ],
      interest: [
        'Expand product catalog and options',
        'Implement dynamic pricing strategies',
        'Enhance product descriptions and imagery',
        'Add product comparison tools'
      ],
      consideration: [
        'Add customer reviews and testimonials',
        'Simplify product configuration process',
        'Provide detailed technical specifications',
        'Offer live chat support'
      ],
      intent: [
        'Offer free or discounted shipping',
        'Simplify checkout process',
        'Add guest checkout option',
        'Clarify return and warranty policies'
      ],
      purchase: [
        'Optimize checkout flow and reduce steps',
        'Add multiple payment options',
        'Improve error handling and messaging',
        'Implement trust signals and security badges'
      ]
    };
    
    return recommendations[stepId] || ['Analyze user behavior and conduct user research'];
  }

  private async performCohortAnalysis(events: FunnelEvent[]): Promise<{
    [cohort: string]: {
      conversionRate: number;
      averageRevenue: number;
      completionTime: number;
    };
  }> {
    
    // Group users by cohort (acquisition week)
    const cohorts: { [cohort: string]: { [userId: string]: FunnelEvent[] } } = {};
    
    // Group events by user
    const userEvents = new Map<string, FunnelEvent[]>();
    events.forEach(event => {
      if (!userEvents.has(event.userId)) {
        userEvents.set(event.userId, []);
      }
      userEvents.get(event.userId)!.push(event);
    });
    
    // Assign users to cohorts based on first event
    userEvents.forEach((userEventList, userId) => {
      const firstEvent = userEventList.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
      const cohortWeek = this.getWeekKey(firstEvent.timestamp);
      
      if (!cohorts[cohortWeek]) {
        cohorts[cohortWeek] = {};
      }
      cohorts[cohortWeek][userId] = userEventList;
    });
    
    // Calculate cohort metrics
    const cohortAnalysis: { [cohort: string]: any } = {};
    
    Object.entries(cohorts).forEach(([cohortWeek, cohortUsers]) => {
      const userIds = Object.keys(cohortUsers);
      const conversions = userIds.filter(userId => 
        cohortUsers[userId].some(event => event.stepId === 'purchase')
      );
      
      const conversionRate = conversions.length / userIds.length;
      
      const revenues = conversions.map(userId => 
        cohortUsers[userId]
          .filter(event => event.stepId === 'purchase')
          .reduce((sum, event) => sum + (event.value || 0), 0)
      );
      
      const averageRevenue = revenues.length > 0 
        ? revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length 
        : 0;
      
      // Calculate average completion time
      const completionTimes = conversions.map(userId => {
        const userEvents = cohortUsers[userId].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const firstEvent = userEvents[0];
        const purchaseEvent = userEvents.find(e => e.stepId === 'purchase');
        
        return purchaseEvent 
          ? (purchaseEvent.timestamp.getTime() - firstEvent.timestamp.getTime()) / (1000 * 60 * 60 * 24) // days
          : 0;
      }).filter(time => time > 0);
      
      const averageCompletionTime = completionTimes.length > 0
        ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
        : 0;
      
      cohortAnalysis[cohortWeek] = {
        conversionRate,
        averageRevenue,
        completionTime: averageCompletionTime
      };
    });
    
    return cohortAnalysis;
  }

  private getWeekKey(date: Date): string {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    return weekStart.toISOString().split('T')[0];
  }

  private async analyzeSegmentPerformance(
    steps: FunnelStep[], 
    events: FunnelEvent[], 
    segmentBy: string
  ): Promise<{ [segment: string]: FunnelMetrics[] }> {
    
    // Group events by segment
    const segments: { [segment: string]: FunnelEvent[] } = {};
    
    events.forEach(event => {
      const segmentValue = this.getSegmentValue(event, segmentBy);
      if (!segments[segmentValue]) {
        segments[segmentValue] = [];
      }
      segments[segmentValue].push(event);
    });
    
    // Calculate metrics for each segment
    const segmentPerformance: { [segment: string]: FunnelMetrics[] } = {};
    
    for (const [segment, segmentEvents] of Object.entries(segments)) {
      segmentPerformance[segment] = await this.calculateStepMetrics(steps, segmentEvents);
    }
    
    return segmentPerformance;
  }

  private getSegmentValue(event: FunnelEvent, segmentBy: string): string {
    switch (segmentBy) {
      case 'device':
        return event.metadata?.deviceType || 'unknown';
      case 'source':
        return event.metadata?.source || 'unknown';
      case 'product':
        return event.productId || 'no_product';
      default:
        return 'all';
    }
  }

  /**
   * Create and manage A/B tests
   */
  async createABTest(config: ABTestConfig): Promise<string> {
    // Validate configuration
    this.validateABTestConfig(config);
    
    // Generate unique ID if not provided
    if (!config.id) {
      config.id = `ab_test_${Date.now()}`;
    }
    
    // Set default values
    config.status = 'draft';
    config.startDate = config.startDate || new Date();
    
    // Store configuration
    this.abTests.set(config.id, config);
    
    return config.id;
  }

  private validateABTestConfig(config: ABTestConfig): void {
    // Validate traffic allocation adds up to 100%
    const totalAllocation = config.variants.reduce((sum, variant) => sum + variant.trafficAllocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error(`Traffic allocation must sum to 100%, got ${totalAllocation}%`);
    }
    
    // Validate variants
    if (config.variants.length < 2) {
      throw new Error('A/B test must have at least 2 variants');
    }
    
    // Validate statistical settings
    if (config.statisticalSettings.confidenceLevel < 0.8 || config.statisticalSettings.confidenceLevel > 0.99) {
      throw new Error('Confidence level must be between 80% and 99%');
    }
  }

  async startABTest(testId: string): Promise<void> {
    const test = this.abTests.get(testId);
    if (!test) {
      throw new Error(`A/B test ${testId} not found`);
    }
    
    test.status = 'running';
    test.startDate = new Date();
    
    // Initialize assignments map
    this.abTestAssignments.set(testId, new Map());
  }

  async pauseABTest(testId: string): Promise<void> {
    const test = this.abTests.get(testId);
    if (!test) {
      throw new Error(`A/B test ${testId} not found`);
    }
    
    test.status = 'paused';
  }

  async stopABTest(testId: string): Promise<void> {
    const test = this.abTests.get(testId);
    if (!test) {
      throw new Error(`A/B test ${testId} not found`);
    }
    
    test.status = 'completed';
    test.endDate = new Date();
  }

  /**
   * Assign user to A/B test variant
   */
  assignToVariant(userId: string, testId: string): string | null {
    const test = this.abTests.get(testId);
    if (!test || test.status !== 'running') {
      return null;
    }
    
    // Check if user already assigned
    const testAssignments = this.abTestAssignments.get(testId);
    if (testAssignments?.has(userId)) {
      return testAssignments.get(userId)!;
    }
    
    // Check user eligibility
    if (!this.isUserEligible(userId, test)) {
      return null;
    }
    
    // Assign to variant based on traffic allocation
    const hash = this.hashUserId(userId, testId);
    const rand = hash % 100;
    
    let cumulative = 0;
    for (const variant of test.variants) {
      cumulative += variant.trafficAllocation;
      if (rand < cumulative) {
        // Assign user to this variant
        if (!testAssignments) {
          this.abTestAssignments.set(testId, new Map());
        }
        this.abTestAssignments.get(testId)!.set(userId, variant.id);
        return variant.id;
      }
    }
    
    // Fallback to control (should not happen with proper allocation)
    return test.variants[0].id;
  }

  private isUserEligible(userId: string, test: ABTestConfig): boolean {
    // Check target audience criteria
    if (test.criteria.targetAudience) {
      // Mock eligibility check
      return Math.random() > 0.3; // 70% eligible
    }
    
    return true;
  }

  private hashUserId(userId: string, testId: string): number {
    // Simple hash function for consistent assignment
    const str = userId + testId;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Track A/B test events
   */
  async trackABTestEvent(
    userId: string, 
    testId: string, 
    eventType: string, 
    value?: number
  ): Promise<void> {
    
    const variant = this.assignToVariant(userId, testId);
    if (!variant) return;
    
    // Store event for analysis (in real implementation, this would go to analytics system)
    console.log(`A/B Test Event: ${testId} - ${variant} - ${eventType} - ${value || 0}`);
  }

  /**
   * Get A/B test results
   */
  async getABTestResults(testId: string): Promise<ABTestResult | null> {
    return this.abTestResults.get(testId) || null;
  }

  /**
   * Calculate statistical significance
   */
  private calculateStatisticalSignificance(
    controlRate: number,
    controlSample: number,
    testRate: number,
    testSample: number
  ): { pValue: number; isSignificant: boolean; confidence: number } {
    
    // Simplified z-test for proportions
    const pooledRate = (controlRate * controlSample + testRate * testSample) / (controlSample + testSample);
    const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1/controlSample + 1/testSample));
    
    const zScore = Math.abs(testRate - controlRate) / standardError;
    
    // Approximate p-value calculation
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    
    return {
      pValue,
      isSignificant: pValue < 0.05,
      confidence: 1 - pValue
    };
  }

  private normalCDF(x: number): number {
    // Approximation of normal cumulative distribution function
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of error function
    const a = 0.3275911;
    const t = 1 / (1 + a * Math.abs(x));
    const result = 1 - (((((1.061405429 * t + -1.453152027) * t) + 1.421413741) * t + -0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return x >= 0 ? result : -result;
  }

  /**
   * Get active A/B tests for a user
   */
  getActiveTests(userId: string): Array<{ testId: string; variant: string }> {
    const activeTests: Array<{ testId: string; variant: string }> = [];
    
    this.abTests.forEach((test, testId) => {
      if (test.status === 'running') {
        const variant = this.assignToVariant(userId, testId);
        if (variant) {
          activeTests.push({ testId, variant });
        }
      }
    });
    
    return activeTests;
  }

  /**
   * Get all A/B test configurations
   */
  getAllABTests(): ABTestConfig[] {
    return Array.from(this.abTests.values());
  }

  /**
   * Get funnel optimization recommendations
   */
  async getFunnelOptimizationRecommendations(funnelId: string): Promise<Array<{
    priority: 'high' | 'medium' | 'low';
    type: 'ui_change' | 'content' | 'process' | 'ab_test';
    title: string;
    description: string;
    expectedImpact: string;
    implementationEffort: 'low' | 'medium' | 'high';
    suggestedABTest?: Partial<ABTestConfig>;
  }>> {
    
    const analysis = await this.analyzeFunnel(funnelId, {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    });

    const recommendations = [];

    // Generate recommendations based on bottlenecks
    analysis.bottlenecks.forEach(bottleneck => {
      if (bottleneck.severity === 'high') {
        recommendations.push({
          priority: 'high' as const,
          type: 'ab_test' as const,
          title: `Optimize ${bottleneck.stepId} conversion`,
          description: `Address ${bottleneck.impact.toFixed(1)}% funnel dropoff at ${bottleneck.stepId} step`,
          expectedImpact: `${(bottleneck.impact * 0.3).toFixed(1)}% improvement in overall conversion`,
          implementationEffort: 'medium' as const,
          suggestedABTest: {
            name: `${bottleneck.stepId} Optimization Test`,
            description: `Test improvements to reduce dropoff at ${bottleneck.stepId}`,
            targetMetric: 'conversion_rate',
            variants: [
              { id: 'control', name: 'Current Flow', trafficAllocation: 50, config: {} },
              { id: 'optimized', name: 'Optimized Flow', trafficAllocation: 50, config: {} }
            ]
          }
        });
      }
    });

    // Add general recommendations
    recommendations.push(
      {
        priority: 'medium' as const,
        type: 'content' as const,
        title: 'Improve product descriptions',
        description: 'Enhance product information to reduce consideration stage dropoff',
        expectedImpact: '5-10% improvement in consideration conversion',
        implementationEffort: 'low' as const
      },
      {
        priority: 'high' as const,
        type: 'process' as const,
        title: 'Simplify checkout process',
        description: 'Reduce checkout steps and add guest checkout option',
        expectedImpact: '15-25% improvement in purchase conversion',
        implementationEffort: 'high' as const
      }
    );

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
}

// Singleton instance
export const conversionFunnelAnalyzer = new ConversionFunnelAnalyzer();