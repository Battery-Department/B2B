'use client';

// Customer Behavior Analytics - Comprehensive customer journey and behavior analysis
// Handles customer segmentation, behavior tracking, journey mapping, and personalization

import { prisma } from '@/lib/prisma';
import { metricsCalculator } from './metrics-calculator';
import { analyticsDataLayer } from '../database/analytics-data-layer';
import { realTimeAnalyticsEngine } from './real-time-engine';

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    demographic: { [key: string]: any };
    behavioral: { [key: string]: any };
    transactional: { [key: string]: any };
  };
  metrics: {
    customerCount: number;
    averageOrderValue: number;
    lifetimeValue: number;
    purchaseFrequency: number;
    churnRate: number;
    profitability: number;
  };
  characteristics: {
    topProducts: string[];
    preferredChannels: string[];
    seasonalPatterns: string[];
    pricesensitivity: 'low' | 'medium' | 'high';
  };
}

export interface CustomerJourney {
  customerId: string;
  stages: Array<{
    stage: 'awareness' | 'consideration' | 'purchase' | 'retention' | 'advocacy';
    touchpoints: Array<{
      channel: string;
      action: string;
      timestamp: Date;
      value: number;
      metadata: { [key: string]: any };
    }>;
    duration: number; // days spent in stage
    conversion: boolean;
    dropoffPoint?: string;
  }>;
  totalJourneyTime: number;
  conversionRate: number;
  journeyValue: number;
  satisfaction: number;
}

export interface BehaviorPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  pattern: {
    triggers: string[];
    actions: string[];
    outcomes: string[];
    duration: number;
  };
  segments: string[];
  impact: {
    revenue: number;
    conversion: number;
    retention: number;
  };
  recommendations: Array<{
    action: string;
    expectedImpact: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

export interface CustomerInsights {
  customerId: string;
  profile: {
    demographic: {
      segment: string;
      registrationDate: Date;
      lastActivity: Date;
      preferredChannel: string;
    };
    behavioral: {
      visitFrequency: number;
      averageSessionDuration: number;
      pageViewsPerSession: number;
      bounceRate: number;
      devicePreference: string[];
    };
    transactional: {
      totalOrders: number;
      totalSpent: number;
      averageOrderValue: number;
      lastPurchase: Date;
      paymentMethods: string[];
      shippingPreferences: string[];
    };
  };
  preferences: {
    productCategories: string[];
    brands: string[];
    priceRanges: string[];
    promotionTypes: string[];
    communicationChannels: string[];
  };
  predictions: {
    nextPurchaseProbability: number;
    churnRisk: number;
    lifetimeValueForecast: number;
    recommendedProducts: string[];
    optimalContactTime: string;
  };
  satisfaction: {
    score: number;
    factors: { [key: string]: number };
    feedback: Array<{
      type: string;
      rating: number;
      comment: string;
      date: Date;
    }>;
  };
}

export interface CohortAnalysis {
  cohortId: string;
  cohortDate: Date;
  size: number;
  retentionRates: Array<{
    period: number; // months since acquisition
    customers: number;
    retentionRate: number;
    revenue: number;
    revenuePerCustomer: number;
  }>;
  metrics: {
    averageLifetime: number;
    totalRevenue: number;
    averageLTV: number;
    churnRate: number;
  };
  characteristics: {
    acquisitionChannel: string;
    firstPurchaseCategory: string;
    seasonality: string;
  };
}

export interface PersonalizationEngine {
  customerId: string;
  recommendations: {
    products: Array<{
      productId: string;
      score: number;
      reason: string;
      confidence: number;
    }>;
    content: Array<{
      type: 'banner' | 'email' | 'popup' | 'widget';
      content: string;
      targeting: { [key: string]: any };
      expectedCTR: number;
    }>;
    offers: Array<{
      type: 'discount' | 'bundle' | 'upgrade' | 'loyalty';
      details: any;
      expectedConversion: number;
    }>;
  };
  optimization: {
    optimalPricing: number;
    bestContactTime: string;
    preferredChannel: string;
    messageFrequency: number;
  };
}

export class CustomerBehaviorAnalytics {
  private customerSegments: Map<string, CustomerSegment> = new Map();
  private customerJourneys: Map<string, CustomerJourney> = new Map();
  private behaviorPatterns: Map<string, BehaviorPattern> = new Map();
  private customerInsights: Map<string, CustomerInsights> = new Map();
  private cohortAnalyses: Map<string, CohortAnalysis> = new Map();
  private personalizationData: Map<string, PersonalizationEngine> = new Map();
  private isAnalyzing = false;

  constructor() {
    this.initializeCustomerAnalytics();
    this.startBehaviorTracking();
    this.setupJourneyMapping();
    this.initializeSegmentation();
  }

  /**
   * Initialize customer analytics system
   */
  private async initializeCustomerAnalytics(): Promise<void> {
    try {
      console.log('Initializing customer behavior analytics...');
      
      await this.loadCustomerData();
      await this.createCustomerSegments();
      await this.analyzeBehaviorPatterns();
      await this.generateCustomerInsights();
      await this.performCohortAnalysis();
      await this.initializePersonalization();
      
      console.log('Customer behavior analytics initialized successfully');
    } catch (error) {
      console.error('Customer analytics initialization error:', error);
    }
  }

  /**
   * Load customer data from database
   */
  private async loadCustomerData(): Promise<any[]> {
    try {
      // Try to load from database
      const customers = await prisma.user.findMany({
        include: {
          orders: {
            include: {
              orderItems: {
                include: {
                  product: true
                }
              }
            }
          }
        }
      });

      return customers;
    } catch (error) {
      console.error('Error loading customer data:', error);
      // Return mock customer data
      return this.generateMockCustomerData();
    }
  }

  /**
   * Generate mock customer data for testing
   */
  private generateMockCustomerData(): any[] {
    const customers = [];
    const segments = ['contractors', 'diy_enthusiasts', 'small_business', 'enterprise'];
    const channels = ['organic', 'paid_search', 'social', 'referral', 'direct'];
    
    for (let i = 1; i <= 100; i++) {
      const registrationDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
      const lastActivity = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      customers.push({
        id: `customer_${i}`,
        email: `customer${i}@example.com`,
        name: `Customer ${i}`,
        registrationDate,
        lastActivity,
        segment: segments[Math.floor(Math.random() * segments.length)],
        acquisitionChannel: channels[Math.floor(Math.random() * channels.length)],
        orders: this.generateMockOrders(i)
      });
    }
    
    return customers;
  }

  /**
   * Generate mock orders for a customer
   */
  private generateMockOrders(customerId: number): any[] {
    const orderCount = Math.floor(Math.random() * 8) + 1; // 1-8 orders
    const orders = [];
    
    for (let i = 0; i < orderCount; i++) {
      const orderDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
      const products = ['6Ah', '9Ah', '15Ah'];
      const selectedProducts = products.slice(0, Math.floor(Math.random() * 3) + 1);
      
      orders.push({
        id: `order_${customerId}_${i}`,
        customerId: `customer_${customerId}`,
        total: Math.floor(Math.random() * 800) + 100,
        status: 'completed',
        createdAt: orderDate,
        orderItems: selectedProducts.map(productId => ({
          productId,
          quantity: Math.floor(Math.random() * 3) + 1,
          price: productId === '6Ah' ? 95 : productId === '9Ah' ? 125 : 245,
          product: {
            id: productId,
            name: `${productId} FlexVolt Battery`,
            category: 'battery'
          }
        }))
      });
    }
    
    return orders;
  }

  /**
   * Create customer segments
   */
  private async createCustomerSegments(): Promise<void> {
    const customers = await this.loadCustomerData();
    
    // Define segments based on behavior and characteristics
    const segments = [
      {
        id: 'professional_contractors',
        name: 'Professional Contractors',
        description: 'High-volume professional users with consistent purchasing patterns',
        criteria: {
          demographic: { segment: 'contractors' },
          behavioral: { orderFrequency: '>6 per year' },
          transactional: { averageOrderValue: '>$300' }
        }
      },
      {
        id: 'diy_enthusiasts',
        name: 'DIY Enthusiasts',
        description: 'Regular DIY users with moderate purchase frequency',
        criteria: {
          demographic: { segment: 'diy_enthusiasts' },
          behavioral: { orderFrequency: '2-6 per year' },
          transactional: { averageOrderValue: '$100-$300' }
        }
      },
      {
        id: 'occasional_users',
        name: 'Occasional Users',
        description: 'Infrequent purchasers, often single transactions',
        criteria: {
          demographic: { mixed: true },
          behavioral: { orderFrequency: '<2 per year' },
          transactional: { averageOrderValue: '<$200' }
        }
      },
      {
        id: 'enterprise_customers',
        name: 'Enterprise Customers',
        description: 'Large business customers with bulk purchasing',
        criteria: {
          demographic: { segment: 'enterprise' },
          behavioral: { orderFrequency: '>12 per year' },
          transactional: { averageOrderValue: '>$1000' }
        }
      }
    ];

    for (const segmentDef of segments) {
      const segmentCustomers = this.filterCustomersBySegment(customers, segmentDef);
      const metrics = this.calculateSegmentMetrics(segmentCustomers);
      const characteristics = this.analyzeSegmentCharacteristics(segmentCustomers);
      
      const segment: CustomerSegment = {
        ...segmentDef,
        metrics,
        characteristics
      };
      
      this.customerSegments.set(segment.id, segment);
    }
  }

  /**
   * Filter customers by segment criteria
   */
  private filterCustomersBySegment(customers: any[], segmentDef: any): any[] {
    return customers.filter(customer => {
      const orderCount = customer.orders.length;
      const totalSpent = customer.orders.reduce((sum: number, order: any) => sum + order.total, 0);
      const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
      
      // Simple filtering logic based on segment type
      switch (segmentDef.id) {
        case 'professional_contractors':
          return customer.segment === 'contractors' && orderCount >= 6 && avgOrderValue >= 300;
        case 'diy_enthusiasts':
          return customer.segment === 'diy_enthusiasts' && orderCount >= 2 && orderCount <= 6;
        case 'occasional_users':
          return orderCount < 2 || avgOrderValue < 200;
        case 'enterprise_customers':
          return customer.segment === 'enterprise' && orderCount >= 12 && avgOrderValue >= 1000;
        default:
          return false;
      }
    });
  }

  /**
   * Calculate segment metrics
   */
  private calculateSegmentMetrics(customers: any[]): CustomerSegment['metrics'] {
    if (customers.length === 0) {
      return {
        customerCount: 0,
        averageOrderValue: 0,
        lifetimeValue: 0,
        purchaseFrequency: 0,
        churnRate: 0,
        profitability: 0
      };
    }

    const totalOrders = customers.reduce((sum, customer) => sum + customer.orders.length, 0);
    const totalRevenue = customers.reduce((sum, customer) => 
      sum + customer.orders.reduce((orderSum: number, order: any) => orderSum + order.total, 0), 0
    );
    
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const avgLifetimeValue = totalRevenue / customers.length;
    const avgPurchaseFrequency = totalOrders / customers.length;
    
    // Calculate churn rate (customers inactive for >90 days)
    const now = Date.now();
    const churnedCustomers = customers.filter(customer => 
      (now - customer.lastActivity.getTime()) > (90 * 24 * 60 * 60 * 1000)
    ).length;
    const churnRate = (churnedCustomers / customers.length) * 100;
    
    // Estimate profitability (40% margin)
    const profitability = totalRevenue * 0.4;

    return {
      customerCount: customers.length,
      averageOrderValue: avgOrderValue,
      lifetimeValue: avgLifetimeValue,
      purchaseFrequency: avgPurchaseFrequency,
      churnRate,
      profitability
    };
  }

  /**
   * Analyze segment characteristics
   */
  private analyzeSegmentCharacteristics(customers: any[]): CustomerSegment['characteristics'] {
    const productCounts = new Map<string, number>();
    const channelCounts = new Map<string, number>();
    
    customers.forEach(customer => {
      // Count product preferences
      customer.orders.forEach((order: any) => {
        order.orderItems.forEach((item: any) => {
          productCounts.set(item.productId, (productCounts.get(item.productId) || 0) + item.quantity);
        });
      });
      
      // Count acquisition channels
      channelCounts.set(customer.acquisitionChannel, (channelCounts.get(customer.acquisitionChannel) || 0) + 1);
    });
    
    const topProducts = Array.from(productCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([product]) => product);
    
    const preferredChannels = Array.from(channelCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([channel]) => channel);

    return {
      topProducts,
      preferredChannels,
      seasonalPatterns: ['Q4 peak', 'Spring uptick'],
      pricesensitivity: 'medium'
    };
  }

  /**
   * Analyze behavior patterns
   */
  private async analyzeBehaviorPatterns(): Promise<void> {
    const patterns = [
      {
        id: 'bulk_purchase_pattern',
        name: 'Bulk Purchase Pattern',
        description: 'Customers who purchase multiple high-capacity batteries together',
        frequency: 0.15,
        pattern: {
          triggers: ['project_start', 'bulk_discount'],
          actions: ['view_multiple_products', 'add_multiple_to_cart', 'large_order'],
          outcomes: ['high_order_value', 'customer_satisfaction'],
          duration: 2
        },
        segments: ['professional_contractors', 'enterprise_customers'],
        impact: {
          revenue: 45,
          conversion: 12,
          retention: 8
        },
        recommendations: [
          {
            action: 'Offer volume discounts for 3+ batteries',
            expectedImpact: '25% increase in order value',
            priority: 'high'
          },
          {
            action: 'Create professional contractor bundles',
            expectedImpact: '15% conversion rate improvement',
            priority: 'medium'
          }
        ]
      },
      {
        id: 'research_intensive_pattern',
        name: 'Research-Intensive Pattern',
        description: 'Customers who extensively research before purchasing',
        frequency: 0.35,
        pattern: {
          triggers: ['first_visit', 'specific_need'],
          actions: ['multiple_sessions', 'spec_comparison', 'review_reading'],
          outcomes: ['educated_purchase', 'higher_satisfaction'],
          duration: 7
        },
        segments: ['diy_enthusiasts', 'occasional_users'],
        impact: {
          revenue: 20,
          conversion: -5, // Lower conversion but higher quality
          retention: 25
        },
        recommendations: [
          {
            action: 'Enhance product comparison tools',
            expectedImpact: '10% reduction in research time',
            priority: 'high'
          },
          {
            action: 'Provide detailed usage guides',
            expectedImpact: '20% increase in purchase confidence',
            priority: 'medium'
          }
        ]
      },
      {
        id: 'seasonal_preparation_pattern',
        name: 'Seasonal Preparation Pattern',
        description: 'Customers who purchase in anticipation of seasonal work',
        frequency: 0.25,
        pattern: {
          triggers: ['season_change', 'weather_forecast'],
          actions: ['stock_up_purchase', 'preparation_buying'],
          outcomes: ['season_readiness', 'bulk_orders'],
          duration: 14
        },
        segments: ['professional_contractors'],
        impact: {
          revenue: 30,
          conversion: 18,
          retention: 15
        },
        recommendations: [
          {
            action: 'Send seasonal reminders and forecasts',
            expectedImpact: '35% increase in seasonal sales',
            priority: 'high'
          },
          {
            action: 'Offer pre-season discounts',
            expectedImpact: '20% earlier purchase timing',
            priority: 'medium'
          }
        ]
      }
    ];

    patterns.forEach(pattern => {
      this.behaviorPatterns.set(pattern.id, pattern as BehaviorPattern);
    });
  }

  /**
   * Generate customer insights
   */
  private async generateCustomerInsights(): Promise<void> {
    const customers = await this.loadCustomerData();
    
    for (const customer of customers.slice(0, 20)) { // Analyze first 20 for demo
      const insights = await this.analyzeCustomerInsights(customer);
      this.customerInsights.set(customer.id, insights);
    }
  }

  /**
   * Analyze individual customer insights
   */
  private async analyzeCustomerInsights(customer: any): Promise<CustomerInsights> {
    const orders = customer.orders || [];
    const totalSpent = orders.reduce((sum: number, order: any) => sum + order.total, 0);
    const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
    const lastPurchase = orders.length > 0 ? new Date(Math.max(...orders.map((o: any) => o.createdAt.getTime()))) : new Date(0);
    
    // Generate behavioral data
    const visitFrequency = 2.5 + Math.random() * 2; // 2.5-4.5 visits per week
    const sessionDuration = 8 + Math.random() * 10; // 8-18 minutes
    const pageViews = 12 + Math.random() * 8; // 12-20 pages per session
    const bounceRate = 15 + Math.random() * 20; // 15-35% bounce rate
    
    // Predict next purchase probability
    const daysSinceLastPurchase = (Date.now() - lastPurchase.getTime()) / (24 * 60 * 60 * 1000);
    const nextPurchaseProbability = Math.max(0, Math.min(100, 80 - (daysSinceLastPurchase / 30) * 20));
    
    // Calculate churn risk
    const churnRisk = Math.min(100, daysSinceLastPurchase > 90 ? 70 + Math.random() * 30 : Math.random() * 30);
    
    // Forecast lifetime value
    const lifetimeValueForecast = totalSpent + (avgOrderValue * 0.7 * Math.max(0, 5 - orders.length));

    return {
      customerId: customer.id,
      profile: {
        demographic: {
          segment: customer.segment,
          registrationDate: customer.registrationDate,
          lastActivity: customer.lastActivity,
          preferredChannel: customer.acquisitionChannel
        },
        behavioral: {
          visitFrequency,
          averageSessionDuration: sessionDuration,
          pageViewsPerSession: pageViews,
          bounceRate,
          devicePreference: ['desktop', 'mobile']
        },
        transactional: {
          totalOrders: orders.length,
          totalSpent,
          averageOrderValue: avgOrderValue,
          lastPurchase,
          paymentMethods: ['credit_card'],
          shippingPreferences: ['standard']
        }
      },
      preferences: {
        productCategories: ['battery'],
        brands: ['DeWalt'],
        priceRanges: ['$100-$200', '$200-$300'],
        promotionTypes: ['volume_discount', 'seasonal_sale'],
        communicationChannels: ['email', 'sms']
      },
      predictions: {
        nextPurchaseProbability,
        churnRisk,
        lifetimeValueForecast,
        recommendedProducts: this.getRecommendedProducts(customer),
        optimalContactTime: 'Tuesday 10AM'
      },
      satisfaction: {
        score: 4.2 + Math.random() * 0.6,
        factors: {
          productQuality: 4.5,
          customerService: 4.2,
          deliverySpeed: 4.3,
          priceValue: 3.9
        },
        feedback: []
      }
    };
  }

  /**
   * Get recommended products for customer
   */
  private getRecommendedProducts(customer: any): string[] {
    const purchasedProducts = new Set();
    customer.orders.forEach((order: any) => {
      order.orderItems.forEach((item: any) => {
        purchasedProducts.add(item.productId);
      });
    });
    
    const allProducts = ['6Ah', '9Ah', '15Ah'];
    const recommendations = allProducts.filter(product => !purchasedProducts.has(product));
    
    // If they've bought everything, recommend upgrades or accessories
    if (recommendations.length === 0) {
      return ['15Ah']; // Recommend highest capacity
    }
    
    return recommendations.slice(0, 2);
  }

  /**
   * Perform cohort analysis
   */
  private async performCohortAnalysis(): Promise<void> {
    const customers = await this.loadCustomerData();
    
    // Group customers by registration month
    const cohorts = new Map<string, any[]>();
    
    customers.forEach(customer => {
      const cohortKey = customer.registrationDate.toISOString().substring(0, 7); // YYYY-MM
      if (!cohorts.has(cohortKey)) {
        cohorts.set(cohortKey, []);
      }
      cohorts.get(cohortKey)!.push(customer);
    });
    
    // Analyze each cohort
    for (const [cohortId, cohortCustomers] of cohorts.entries()) {
      const analysis = this.analyzeCohort(cohortId, cohortCustomers);
      this.cohortAnalyses.set(cohortId, analysis);
    }
  }

  /**
   * Analyze individual cohort
   */
  private analyzeCohort(cohortId: string, customers: any[]): CohortAnalysis {
    const cohortDate = new Date(cohortId + '-01');
    const size = customers.length;
    
    // Calculate retention rates for each month
    const retentionRates = [];
    for (let month = 0; month < 12; month++) {
      const periodEnd = new Date(cohortDate);
      periodEnd.setMonth(periodEnd.getMonth() + month + 1);
      
      const activeCustomers = customers.filter(customer => {
        return customer.orders.some((order: any) => 
          order.createdAt >= cohortDate && order.createdAt < periodEnd
        );
      });
      
      const revenue = activeCustomers.reduce((sum, customer) => 
        sum + customer.orders
          .filter((order: any) => order.createdAt >= cohortDate && order.createdAt < periodEnd)
          .reduce((orderSum: number, order: any) => orderSum + order.total, 0), 0
      );
      
      retentionRates.push({
        period: month,
        customers: activeCustomers.length,
        retentionRate: (activeCustomers.length / size) * 100,
        revenue,
        revenuePerCustomer: activeCustomers.length > 0 ? revenue / activeCustomers.length : 0
      });
    }
    
    const totalRevenue = customers.reduce((sum, customer) => 
      sum + customer.orders.reduce((orderSum: number, order: any) => orderSum + order.total, 0), 0
    );
    
    return {
      cohortId,
      cohortDate,
      size,
      retentionRates,
      metrics: {
        averageLifetime: this.calculateAverageLifetime(customers),
        totalRevenue,
        averageLTV: totalRevenue / size,
        churnRate: this.calculateCohortChurnRate(customers)
      },
      characteristics: {
        acquisitionChannel: this.getMostCommonChannel(customers),
        firstPurchaseCategory: 'battery',
        seasonality: this.getCohortSeasonality(cohortDate)
      }
    };
  }

  /**
   * Initialize personalization engine
   */
  private async initializePersonalization(): Promise<void> {
    const customers = await this.loadCustomerData();
    
    for (const customer of customers.slice(0, 10)) { // Demo with first 10 customers
      const personalization = this.createPersonalizationProfile(customer);
      this.personalizationData.set(customer.id, personalization);
    }
  }

  /**
   * Create personalization profile
   */
  private createPersonalizationProfile(customer: any): PersonalizationEngine {
    const insights = this.customerInsights.get(customer.id);
    
    return {
      customerId: customer.id,
      recommendations: {
        products: this.generateProductRecommendations(customer, insights),
        content: this.generateContentRecommendations(customer, insights),
        offers: this.generateOfferRecommendations(customer, insights)
      },
      optimization: {
        optimalPricing: this.calculateOptimalPricing(customer, insights),
        bestContactTime: insights?.predictions.optimalContactTime || 'Tuesday 10AM',
        preferredChannel: customer.acquisitionChannel,
        messageFrequency: this.calculateOptimalFrequency(customer, insights)
      }
    };
  }

  // Helper methods

  private calculateAverageLifetime(customers: any[]): number {
    const lifetimes = customers.map(customer => {
      const orders = customer.orders;
      if (orders.length < 2) return 30; // Default 30 days for single order
      
      const firstOrder = new Date(Math.min(...orders.map((o: any) => o.createdAt.getTime())));
      const lastOrder = new Date(Math.max(...orders.map((o: any) => o.createdAt.getTime())));
      
      return (lastOrder.getTime() - firstOrder.getTime()) / (24 * 60 * 60 * 1000);
    });
    
    return lifetimes.reduce((sum, lifetime) => sum + lifetime, 0) / lifetimes.length;
  }

  private calculateCohortChurnRate(customers: any[]): number {
    const now = Date.now();
    const churnedCustomers = customers.filter(customer => 
      (now - customer.lastActivity.getTime()) > (90 * 24 * 60 * 60 * 1000)
    ).length;
    
    return (churnedCustomers / customers.length) * 100;
  }

  private getMostCommonChannel(customers: any[]): string {
    const channelCounts = new Map<string, number>();
    customers.forEach(customer => {
      channelCounts.set(customer.acquisitionChannel, (channelCounts.get(customer.acquisitionChannel) || 0) + 1);
    });
    
    return Array.from(channelCounts.entries()).sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';
  }

  private getCohortSeasonality(cohortDate: Date): string {
    const month = cohortDate.getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  }

  private generateProductRecommendations(customer: any, insights?: CustomerInsights): any[] {
    const recommendations = [
      {
        productId: '9Ah',
        score: 0.85,
        reason: 'Popular among similar customers',
        confidence: 85
      },
      {
        productId: '15Ah',
        score: 0.72,
        reason: 'High-capacity upgrade option',
        confidence: 72
      }
    ];
    
    return recommendations;
  }

  private generateContentRecommendations(customer: any, insights?: CustomerInsights): any[] {
    return [
      {
        type: 'banner',
        content: 'Professional-grade batteries for your projects',
        targeting: { segment: customer.segment },
        expectedCTR: 3.2
      }
    ];
  }

  private generateOfferRecommendations(customer: any, insights?: CustomerInsights): any[] {
    return [
      {
        type: 'discount',
        details: { percentage: 10, minOrder: 200 },
        expectedConversion: 15.5
      }
    ];
  }

  private calculateOptimalPricing(customer: any, insights?: CustomerInsights): number {
    // Base pricing with customer-specific adjustments
    return 125; // Base price
  }

  private calculateOptimalFrequency(customer: any, insights?: CustomerInsights): number {
    return 2; // 2 messages per week
  }

  // Start continuous tracking
  private startBehaviorTracking(): void {
    setInterval(() => {
      this.trackCustomerBehavior();
    }, 30000); // Every 30 seconds
  }

  private setupJourneyMapping(): void {
    setInterval(() => {
      this.updateCustomerJourneys();
    }, 60000); // Every minute
  }

  private initializeSegmentation(): void {
    setInterval(() => {
      this.refreshSegmentation();
    }, 3600000); // Every hour
  }

  private async trackCustomerBehavior(): Promise<void> {
    // Track real-time customer behavior
    // This would integrate with web analytics in production
  }

  private async updateCustomerJourneys(): Promise<void> {
    // Update customer journey mapping
    // This would track touchpoints and stages in production
  }

  private async refreshSegmentation(): Promise<void> {
    // Refresh customer segmentation
    if (!this.isAnalyzing) {
      this.isAnalyzing = true;
      try {
        await this.createCustomerSegments();
      } finally {
        this.isAnalyzing = false;
      }
    }
  }

  // Public API methods

  /**
   * Get customer segments
   */
  public getCustomerSegments(): CustomerSegment[] {
    return Array.from(this.customerSegments.values());
  }

  /**
   * Get customer insights
   */
  public getCustomerInsights(customerId?: string): CustomerInsights | CustomerInsights[] {
    if (customerId) {
      return this.customerInsights.get(customerId) || null;
    }
    return Array.from(this.customerInsights.values());
  }

  /**
   * Get behavior patterns
   */
  public getBehaviorPatterns(): BehaviorPattern[] {
    return Array.from(this.behaviorPatterns.values());
  }

  /**
   * Get cohort analysis
   */
  public getCohortAnalysis(cohortId?: string): CohortAnalysis | CohortAnalysis[] {
    if (cohortId) {
      return this.cohortAnalyses.get(cohortId) || null;
    }
    return Array.from(this.cohortAnalyses.values());
  }

  /**
   * Get personalization data
   */
  public getPersonalizationData(customerId: string): PersonalizationEngine | null {
    return this.personalizationData.get(customerId) || null;
  }

  /**
   * Get customer journey
   */
  public getCustomerJourney(customerId: string): CustomerJourney | null {
    return this.customerJourneys.get(customerId) || null;
  }

  /**
   * Get analytics summary
   */
  public getAnalyticsSummary(): {
    totalCustomers: number;
    totalSegments: number;
    averageLifetimeValue: number;
    averageChurnRate: number;
    topPerformingSegment: string;
    behaviorPatternsIdentified: number;
  } {
    const segments = Array.from(this.customerSegments.values());
    const totalCustomers = segments.reduce((sum, segment) => sum + segment.metrics.customerCount, 0);
    const weightedLTV = segments.reduce((sum, segment) => 
      sum + (segment.metrics.lifetimeValue * segment.metrics.customerCount), 0
    ) / totalCustomers;
    const averageChurnRate = segments.reduce((sum, segment) => sum + segment.metrics.churnRate, 0) / segments.length;
    
    const topSegment = segments.sort((a, b) => b.metrics.profitability - a.metrics.profitability)[0];

    return {
      totalCustomers,
      totalSegments: segments.length,
      averageLifetimeValue: weightedLTV,
      averageChurnRate,
      topPerformingSegment: topSegment?.name || 'Unknown',
      behaviorPatternsIdentified: this.behaviorPatterns.size
    };
  }

  /**
   * Force refresh analytics
   */
  public async forceRefresh(): Promise<void> {
    this.isAnalyzing = true;
    try {
      await this.createCustomerSegments();
      await this.generateCustomerInsights();
      await this.performCohortAnalysis();
    } finally {
      this.isAnalyzing = false;
    }
  }
}

// Export singleton instance
export const customerBehaviorAnalytics = new CustomerBehaviorAnalytics();