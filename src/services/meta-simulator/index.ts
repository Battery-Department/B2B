import { EventGenerator } from './event-generator';
import { UserProfileGenerator } from './user-profiles';
import { 
  MetaEvent, 
  UserProfile, 
  CustomAudience, 
  ConversionData,
  QuizInteraction,
  SimulatorConfig 
} from './types';

export class MetaSimulator {
  private eventGenerator: EventGenerator;
  private userProfileGenerator: UserProfileGenerator;
  private activeUsers: Map<string, UserProfile> = new Map();
  private config: SimulatorConfig;

  constructor(config?: Partial<SimulatorConfig>) {
    this.config = {
      simulationSpeed: 1,
      userCount: 100,
      eventFrequency: 'normal',
      enableRealTimeMode: false,
      ...config
    };
    
    this.eventGenerator = new EventGenerator(this.config);
    this.userProfileGenerator = new UserProfileGenerator();
  }

  // Initialize simulation with a set of users
  async initialize(): Promise<void> {
    for (let i = 0; i < this.config.userCount; i++) {
      const user = this.userProfileGenerator.generateUser();
      this.activeUsers.set(user.id, user);
    }
  }

  // Generate a single event for a specific user
  generateEvent(userId: string, eventType?: string): MetaEvent | null {
    const user = this.activeUsers.get(userId);
    if (!user) return null;
    
    return this.eventGenerator.generateEvent(user, eventType);
  }

  // Generate batch of events
  generateEventBatch(count: number = 10): MetaEvent[] {
    const events: MetaEvent[] = [];
    const userIds = Array.from(this.activeUsers.keys());
    
    for (let i = 0; i < count; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const event = this.generateEvent(userId);
      if (event) events.push(event);
    }
    
    return events;
  }

  // Simulate quiz interaction flow
  simulateQuizInteraction(userId: string): QuizInteraction[] {
    const user = this.activeUsers.get(userId);
    if (!user) return [];
    
    const interactions: QuizInteraction[] = [];
    const quizId = `quiz_${Date.now()}`;
    const questions = ['power_needs', 'usage_pattern', 'budget', 'tool_types', 'location'];
    
    // Quiz start
    interactions.push({
      eventType: 'quiz_start',
      userId: user.id,
      quizId,
      timestamp: new Date(),
      metadata: {
        source: user.acquisitionSource,
        device: user.device
      }
    });
    
    // Answer questions
    questions.forEach((question, index) => {
      const timeSpent = Math.floor(Math.random() * 30) + 5; // 5-35 seconds
      
      interactions.push({
        eventType: 'quiz_answer',
        userId: user.id,
        quizId,
        timestamp: new Date(Date.now() + (index + 1) * timeSpent * 1000),
        metadata: {
          questionId: question,
          questionIndex: index,
          answer: this.generateQuizAnswer(question, user),
          timeSpent
        }
      });
    });
    
    // Quiz completion
    const completed = Math.random() > 0.2; // 80% completion rate
    if (completed) {
      interactions.push({
        eventType: 'quiz_complete',
        userId: user.id,
        quizId,
        timestamp: new Date(Date.now() + 150000), // 2.5 minutes later
        metadata: {
          completionTime: 150,
          recommendedProducts: this.getRecommendedProducts(user),
          score: Math.floor(Math.random() * 100)
        }
      });
    } else {
      interactions.push({
        eventType: 'quiz_abandon',
        userId: user.id,
        quizId,
        timestamp: new Date(Date.now() + 60000),
        metadata: {
          lastQuestion: questions[Math.floor(Math.random() * questions.length)],
          reason: 'timeout'
        }
      });
    }
    
    return interactions;
  }

  // Generate custom audience based on criteria
  generateCustomAudience(criteria: any): CustomAudience {
    const matchingUsers = Array.from(this.activeUsers.values()).filter(user => {
      if (criteria.minPurchaseValue && user.purchaseHistory.totalValue < criteria.minPurchaseValue) {
        return false;
      }
      if (criteria.interests && !criteria.interests.some((i: string) => user.interests.includes(i))) {
        return false;
      }
      if (criteria.location && user.location.country !== criteria.location) {
        return false;
      }
      if (criteria.ageRange) {
        if (user.demographics.age < criteria.ageRange.min || user.demographics.age > criteria.ageRange.max) {
          return false;
        }
      }
      return true;
    });
    
    return {
      id: `aud_${Date.now()}`,
      name: criteria.name || 'Custom Audience',
      description: criteria.description || 'Generated custom audience',
      size: matchingUsers.length,
      criteria,
      userIds: matchingUsers.map(u => u.id),
      created: new Date(),
      status: 'active'
    };
  }

  // Simulate conversion tracking
  simulateConversion(userId: string, conversionType: string, value?: number): ConversionData | null {
    const user = this.activeUsers.get(userId);
    if (!user) return null;
    
    const conversion: ConversionData = {
      eventId: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      conversionType,
      timestamp: new Date(),
      value: value || this.calculateConversionValue(conversionType, user),
      currency: 'USD',
      metadata: {
        source: user.lastTouchpoint || 'organic',
        device: user.device,
        sessionId: `session_${Date.now()}`,
        attributionWindow: '7d_click_1d_view'
      }
    };
    
    // Update user profile
    user.conversionHistory.push({
      type: conversionType,
      timestamp: conversion.timestamp,
      value: conversion.value
    });
    
    return conversion;
  }

  // Get aggregated stats
  getSimulationStats() {
    const users = Array.from(this.activeUsers.values());
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.engagementScore > 0.5).length,
      averageEngagement: users.reduce((sum, u) => sum + u.engagementScore, 0) / users.length,
      deviceBreakdown: this.getDeviceBreakdown(),
      locationBreakdown: this.getLocationBreakdown(),
      interestCategories: this.getTopInterests(),
      conversionRate: this.calculateConversionRate(),
      averageOrderValue: this.calculateAverageOrderValue()
    };
  }

  // Helper methods
  private generateQuizAnswer(question: string, user: UserProfile): any {
    const answers: Record<string, any> = {
      power_needs: user.businessType === 'construction' ? 'high' : 'medium',
      usage_pattern: user.engagementScore > 0.7 ? 'daily' : 'weekly',
      budget: user.purchaseHistory.averageOrderValue > 500 ? 'premium' : 'standard',
      tool_types: user.interests.includes('power_tools') ? ['drill', 'saw', 'grinder'] : ['drill', 'driver'],
      location: user.location.state
    };
    
    return answers[question] || 'unknown';
  }

  private getRecommendedProducts(user: UserProfile): string[] {
    const products = [];
    
    if (user.businessType === 'construction' || user.interests.includes('heavy_duty')) {
      products.push('MK-48-11-2460', 'MK-48-11-2462'); // High capacity batteries
    } else {
      products.push('MK-48-11-2420', 'MK-48-11-2440'); // Standard batteries
    }
    
    if (user.purchaseHistory.averageOrderValue > 500) {
      products.push('MK-48-59-2463'); // Premium charger
    }
    
    return products;
  }

  private calculateConversionValue(type: string, user: UserProfile): number {
    const baseValues: Record<string, number> = {
      purchase: 250,
      add_to_cart: 50,
      lead: 100,
      subscribe: 30,
      quote_request: 150
    };
    
    const base = baseValues[type] || 10;
    const modifier = user.purchaseHistory.averageOrderValue / 200; // User value modifier
    
    return Math.round(base * modifier * (0.8 + Math.random() * 0.4)); // ±20% variance
  }

  private getDeviceBreakdown() {
    const users = Array.from(this.activeUsers.values());
    const breakdown: Record<string, number> = {};
    
    users.forEach(user => {
      breakdown[user.device.type] = (breakdown[user.device.type] || 0) + 1;
    });
    
    return breakdown;
  }

  private getLocationBreakdown() {
    const users = Array.from(this.activeUsers.values());
    const breakdown: Record<string, number> = {};
    
    users.forEach(user => {
      breakdown[user.location.country] = (breakdown[user.location.country] || 0) + 1;
    });
    
    return breakdown;
  }

  private getTopInterests() {
    const interests: Record<string, number> = {};
    const users = Array.from(this.activeUsers.values());
    
    users.forEach(user => {
      user.interests.forEach(interest => {
        interests[interest] = (interests[interest] || 0) + 1;
      });
    });
    
    return Object.entries(interests)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([interest, count]) => ({ interest, count }));
  }

  private calculateConversionRate(): number {
    const users = Array.from(this.activeUsers.values());
    const convertedUsers = users.filter(u => u.conversionHistory.length > 0).length;
    return convertedUsers / users.length;
  }

  private calculateAverageOrderValue(): number {
    const users = Array.from(this.activeUsers.values());
    const totalValue = users.reduce((sum, u) => sum + u.purchaseHistory.totalValue, 0);
    const totalOrders = users.reduce((sum, u) => sum + u.purchaseHistory.orderCount, 0);
    return totalOrders > 0 ? totalValue / totalOrders : 0;
  }

  // Real-time event stream simulation
  startRealTimeSimulation(callback: (event: MetaEvent) => void): () => void {
    let intervalId: NodeJS.Timeout;
    
    const generateAndEmit = () => {
      const userIds = Array.from(this.activeUsers.keys());
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const event = this.generateEvent(userId);
      
      if (event) {
        callback(event);
      }
    };
    
    // Generate events at configured frequency
    const baseInterval = this.config.eventFrequency === 'high' ? 100 : 
                        this.config.eventFrequency === 'low' ? 5000 : 1000;
    
    intervalId = setInterval(generateAndEmit, baseInterval / this.config.simulationSpeed);
    
    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  // Export data in Meta-compatible format
  exportMetaCompatibleData(): any {
    const events = this.generateEventBatch(100);
    
    return {
      data: events.map(event => ({
        event_name: event.eventName,
        event_time: Math.floor(event.timestamp.getTime() / 1000),
        event_id: event.eventId,
        event_source_url: event.sourceUrl,
        user_data: {
          external_id: event.userId,
          client_ip_address: event.userData.ipAddress,
          client_user_agent: event.userData.userAgent,
          fbc: event.userData.fbc,
          fbp: event.userData.fbp,
          ...(event.userData.email && { em: this.hashValue(event.userData.email) }),
          ...(event.userData.phone && { ph: this.hashValue(event.userData.phone) }),
          ...(event.userData.firstName && { fn: this.hashValue(event.userData.firstName) }),
          ...(event.userData.lastName && { ln: this.hashValue(event.userData.lastName) }),
          ...(event.userData.city && { ct: this.hashValue(event.userData.city) }),
          ...(event.userData.state && { st: this.hashValue(event.userData.state) }),
          ...(event.userData.zip && { zp: this.hashValue(event.userData.zip) }),
          ...(event.userData.country && { country: this.hashValue(event.userData.country) })
        },
        custom_data: event.customData,
        action_source: 'website'
      })),
      test_event_code: this.config.testEventCode
    };
  }

  private hashValue(value: string): string {
    // In production, use actual SHA-256 hashing
    // This is a placeholder for simulation
    return `hashed_${value.toLowerCase().replace(/\s/g, '')}`;
  }
}

// Export types and main class
export * from './types';
export { EventGenerator } from './event-generator';
export { UserProfileGenerator } from './user-profiles';