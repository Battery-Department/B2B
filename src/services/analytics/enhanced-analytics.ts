/**
 * Enhanced Analytics System
 * Comprehensive event tracking and analysis
 */

import { DATA_POINTS, DataPoint, DataPointCategory, validateDataPoint, transformDataPoint } from './data-points';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface AnalyticsEvent {
  id: string;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  eventName: string;
  eventCategory: string;
  eventData: Record<string, any>;
  dataPoints: Record<string, any>;
  context: EventContext;
}

export interface EventContext {
  page?: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
  viewport?: { width: number; height: number };
  screen?: { width: number; height: number };
  location?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface UserSession {
  id: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  events: AnalyticsEvent[];
  dataPoints: Map<string, any>;
}

export interface FunnelStep {
  name: string;
  eventName: string;
  conditions?: Record<string, any>;
}

export interface Funnel {
  id: string;
  name: string;
  steps: FunnelStep[];
}

export interface Cohort {
  id: string;
  name: string;
  definition: {
    filters: Array<{
      dataPoint: string;
      operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in';
      value: any;
    }>;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  users: Set<string>;
}

export interface Attribution {
  model: 'firstTouch' | 'lastTouch' | 'linear' | 'timeDecay' | 'positionBased';
  touchpoints: Array<{
    channel: string;
    timestamp: Date;
    weight: number;
  }>;
  conversion?: {
    timestamp: Date;
    value: number;
  };
}

class EnhancedAnalytics extends EventEmitter {
  private sessions: Map<string, UserSession> = new Map();
  private eventQueue: AnalyticsEvent[] = [];
  private funnels: Map<string, Funnel> = new Map();
  private cohorts: Map<string, Cohort> = new Map();
  private attributions: Map<string, Attribution[]> = new Map();
  private isRecording: boolean = false;
  private batchTimer?: NodeJS.Timeout;
  private readonly BATCH_SIZE = 100;
  private readonly BATCH_INTERVAL = 5000; // 5 seconds

  constructor() {
    super();
    this.startBatchProcessing();
  }

  /**
   * Track a custom event with data points
   */
  public trackEvent(
    eventName: string,
    eventData: Record<string, any> = {},
    dataPoints: Record<string, any> = {},
    context?: Partial<EventContext>
  ): string {
    const eventId = uuidv4();
    const sessionId = this.getCurrentSessionId();
    const userId = this.getCurrentUserId();

    // Validate and transform data points
    const validatedDataPoints: Record<string, any> = {};
    for (const [key, value] of Object.entries(dataPoints)) {
      if (validateDataPoint(key, value)) {
        validatedDataPoints[key] = transformDataPoint(key, value);
      }
    }

    const event: AnalyticsEvent = {
      id: eventId,
      timestamp: new Date(),
      sessionId,
      userId,
      eventName,
      eventCategory: this.categorizeEvent(eventName),
      eventData,
      dataPoints: validatedDataPoints,
      context: {
        ...this.getDefaultContext(),
        ...context
      }
    };

    // Add to session
    this.addEventToSession(sessionId, event);

    // Queue for processing
    this.eventQueue.push(event);

    // Emit event for real-time processing
    this.emit('event', event);

    // Check funnel progress
    this.checkFunnelProgress(event);

    // Update cohorts
    this.updateCohorts(event);

    // Track attribution
    this.trackAttribution(event);

    return eventId;
  }

  /**
   * Start a new user session
   */
  public startSession(userId?: string): string {
    const sessionId = uuidv4();
    const session: UserSession = {
      id: sessionId,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      events: [],
      dataPoints: new Map()
    };

    this.sessions.set(sessionId, session);
    
    // Track session start event
    this.trackEvent('session_start', { sessionId }, {
      [DATA_POINTS.SESSION_ID.id]: sessionId,
      [DATA_POINTS.USER_ID.id]: userId
    });

    return sessionId;
  }

  /**
   * End a user session
   */
  public endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const duration = Date.now() - session.startTime.getTime();
    
    // Track session end event
    this.trackEvent('session_end', {
      sessionId,
      duration,
      eventCount: session.events.length
    }, {
      [DATA_POINTS.SESSION_ID.id]: sessionId,
      [DATA_POINTS.SESSION_DURATION.id]: duration / 1000
    });

    // Clean up after a delay to allow final events
    setTimeout(() => {
      this.sessions.delete(sessionId);
    }, 30000); // 30 seconds
  }

  /**
   * Enable session recording
   */
  public startRecording(): void {
    this.isRecording = true;
    this.emit('recording:start');
  }

  /**
   * Stop session recording
   */
  public stopRecording(): void {
    this.isRecording = false;
    this.emit('recording:stop');
  }

  /**
   * Get session recording data
   */
  public getRecording(sessionId: string): AnalyticsEvent[] | null {
    const session = this.sessions.get(sessionId);
    return session ? session.events : null;
  }

  /**
   * Create a funnel for analysis
   */
  public createFunnel(name: string, steps: FunnelStep[]): string {
    const funnelId = uuidv4();
    const funnel: Funnel = {
      id: funnelId,
      name,
      steps
    };

    this.funnels.set(funnelId, funnel);
    return funnelId;
  }

  /**
   * Analyze funnel conversion
   */
  public analyzeFunnel(funnelId: string, timeRange?: { start: Date; end: Date }): {
    totalUsers: number;
    steps: Array<{
      name: string;
      users: number;
      conversionRate: number;
      dropoffRate: number;
    }>;
  } {
    const funnel = this.funnels.get(funnelId);
    if (!funnel) {
      throw new Error(`Funnel ${funnelId} not found`);
    }

    const userProgress = new Map<string, number>();
    
    // Track user progress through funnel
    for (const session of this.sessions.values()) {
      let currentStep = 0;
      
      for (const event of session.events) {
        if (timeRange) {
          if (event.timestamp < timeRange.start || event.timestamp > timeRange.end) {
            continue;
          }
        }

        if (currentStep < funnel.steps.length) {
          const step = funnel.steps[currentStep];
          if (event.eventName === step.eventName) {
            if (step.conditions) {
              const conditionsMet = Object.entries(step.conditions).every(
                ([key, value]) => event.eventData[key] === value
              );
              if (!conditionsMet) continue;
            }
            currentStep++;
            userProgress.set(session.userId || session.id, currentStep);
          }
        }
      }
    }

    // Calculate metrics
    const totalUsers = userProgress.size;
    const stepMetrics = funnel.steps.map((step, index) => {
      const usersAtStep = Array.from(userProgress.values()).filter(
        progress => progress > index
      ).length;
      
      const conversionRate = totalUsers > 0 ? usersAtStep / totalUsers : 0;
      const dropoffRate = index > 0 ? 
        1 - (usersAtStep / Array.from(userProgress.values()).filter(
          progress => progress > index - 1
        ).length) : 0;

      return {
        name: step.name,
        users: usersAtStep,
        conversionRate,
        dropoffRate
      };
    });

    return {
      totalUsers,
      steps: stepMetrics
    };
  }

  /**
   * Create a user cohort
   */
  public createCohort(name: string, definition: Cohort['definition']): string {
    const cohortId = uuidv4();
    const cohort: Cohort = {
      id: cohortId,
      name,
      definition,
      users: new Set()
    };

    // Populate cohort with existing users
    for (const session of this.sessions.values()) {
      if (this.matchesCohortDefinition(session, definition)) {
        cohort.users.add(session.userId || session.id);
      }
    }

    this.cohorts.set(cohortId, cohort);
    return cohortId;
  }

  /**
   * Get cohort metrics
   */
  public getCohortMetrics(cohortId: string): {
    size: number;
    retention: Record<string, number>;
    engagement: number;
    revenue: number;
  } {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) {
      throw new Error(`Cohort ${cohortId} not found`);
    }

    // Calculate retention by days
    const retention: Record<string, number> = {};
    const now = new Date();
    
    for (let days = 1; days <= 30; days++) {
      const activeUsers = Array.from(cohort.users).filter(userId => {
        const session = Array.from(this.sessions.values()).find(
          s => s.userId === userId
        );
        if (!session) return false;
        
        const daysSinceStart = Math.floor(
          (now.getTime() - session.startTime.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceStart >= days;
      }).length;

      retention[`day_${days}`] = cohort.users.size > 0 ? 
        activeUsers / cohort.users.size : 0;
    }

    // Calculate engagement score
    let totalEvents = 0;
    for (const userId of cohort.users) {
      const userSessions = Array.from(this.sessions.values()).filter(
        s => s.userId === userId
      );
      for (const session of userSessions) {
        totalEvents += session.events.length;
      }
    }
    const engagement = cohort.users.size > 0 ? 
      totalEvents / cohort.users.size : 0;

    // Calculate revenue (simplified)
    let revenue = 0;
    for (const userId of cohort.users) {
      const userSessions = Array.from(this.sessions.values()).filter(
        s => s.userId === userId
      );
      for (const session of userSessions) {
        const purchaseEvents = session.events.filter(
          e => e.eventName === 'purchase'
        );
        for (const event of purchaseEvents) {
          revenue += event.eventData.value || 0;
        }
      }
    }

    return {
      size: cohort.users.size,
      retention,
      engagement,
      revenue
    };
  }

  /**
   * Set attribution model
   */
  public setAttributionModel(
    userId: string,
    model: Attribution['model']
  ): void {
    const userAttributions = this.attributions.get(userId) || [];
    
    // Update existing attributions with new model
    for (const attribution of userAttributions) {
      attribution.model = model;
      this.recalculateAttribution(attribution);
    }
  }

  /**
   * Get attribution report
   */
  public getAttributionReport(userId: string): Attribution[] {
    return this.attributions.get(userId) || [];
  }

  /**
   * Track user behavior patterns
   */
  public analyzeUserBehavior(userId: string): {
    patterns: Array<{
      pattern: string;
      frequency: number;
      lastOccurrence: Date;
    }>;
    predictions: {
      nextAction: string;
      probability: number;
      churnRisk: number;
    };
  } {
    const userSessions = Array.from(this.sessions.values()).filter(
      s => s.userId === userId
    );

    // Analyze event sequences
    const sequences: Map<string, { count: number; lastSeen: Date }> = new Map();
    
    for (const session of userSessions) {
      for (let i = 0; i < session.events.length - 1; i++) {
        const sequence = `${session.events[i].eventName} -> ${session.events[i + 1].eventName}`;
        const existing = sequences.get(sequence) || { count: 0, lastSeen: new Date(0) };
        sequences.set(sequence, {
          count: existing.count + 1,
          lastSeen: session.events[i + 1].timestamp
        });
      }
    }

    // Convert to patterns
    const patterns = Array.from(sequences.entries()).map(([pattern, data]) => ({
      pattern,
      frequency: data.count,
      lastOccurrence: data.lastSeen
    })).sort((a, b) => b.frequency - a.frequency);

    // Simple prediction based on most common next action
    const lastEvent = userSessions[userSessions.length - 1]?.events.slice(-1)[0];
    let nextAction = 'unknown';
    let probability = 0;

    if (lastEvent) {
      const possibleNext = Array.from(sequences.entries())
        .filter(([pattern]) => pattern.startsWith(lastEvent.eventName))
        .sort((a, b) => b[1].count - a[1].count);
      
      if (possibleNext.length > 0) {
        nextAction = possibleNext[0][0].split(' -> ')[1];
        const totalOccurrences = possibleNext.reduce((sum, [, data]) => sum + data.count, 0);
        probability = possibleNext[0][1].count / totalOccurrences;
      }
    }

    // Calculate churn risk (simplified)
    const daysSinceLastActivity = userSessions.length > 0 ?
      (Date.now() - userSessions[userSessions.length - 1].lastActivity.getTime()) / (1000 * 60 * 60 * 24) : 
      999;
    const churnRisk = Math.min(daysSinceLastActivity / 30, 1); // 30 days = 100% risk

    return {
      patterns,
      predictions: {
        nextAction,
        probability,
        churnRisk
      }
    };
  }

  // Private helper methods

  private getCurrentSessionId(): string {
    // In a real implementation, this would get the current session from context
    // For now, return the most recent session or create a new one
    const recentSession = Array.from(this.sessions.values())
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())[0];
    
    return recentSession?.id || this.startSession();
  }

  private getCurrentUserId(): string | undefined {
    // In a real implementation, this would get from auth context
    const sessionId = this.getCurrentSessionId();
    return this.sessions.get(sessionId)?.userId;
  }

  private getDefaultContext(): EventContext {
    // In a real implementation, this would gather browser/device info
    return {
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    };
  }

  private categorizeEvent(eventName: string): string {
    // Simple categorization logic
    if (eventName.includes('page') || eventName.includes('view')) return 'pageview';
    if (eventName.includes('click') || eventName.includes('tap')) return 'interaction';
    if (eventName.includes('form') || eventName.includes('submit')) return 'form';
    if (eventName.includes('error') || eventName.includes('exception')) return 'error';
    if (eventName.includes('purchase') || eventName.includes('checkout')) return 'commerce';
    if (eventName.includes('quiz')) return 'quiz';
    return 'custom';
  }

  private addEventToSession(sessionId: string, event: AnalyticsEvent): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.events.push(event);
    session.lastActivity = new Date();

    // Update session data points
    for (const [key, value] of Object.entries(event.dataPoints)) {
      session.dataPoints.set(key, value);
    }
  }

  private checkFunnelProgress(event: AnalyticsEvent): void {
    // Check if event progresses any funnels
    for (const funnel of this.funnels.values()) {
      this.emit('funnel:progress', {
        funnelId: funnel.id,
        event,
        step: funnel.steps.findIndex(s => s.eventName === event.eventName)
      });
    }
  }

  private updateCohorts(event: AnalyticsEvent): void {
    const session = this.sessions.get(event.sessionId);
    if (!session) return;

    for (const cohort of this.cohorts.values()) {
      if (this.matchesCohortDefinition(session, cohort.definition)) {
        cohort.users.add(session.userId || session.id);
      }
    }
  }

  private matchesCohortDefinition(
    session: UserSession,
    definition: Cohort['definition']
  ): boolean {
    // Check filters
    for (const filter of definition.filters) {
      const value = session.dataPoints.get(filter.dataPoint);
      
      switch (filter.operator) {
        case 'equals':
          if (value !== filter.value) return false;
          break;
        case 'contains':
          if (!String(value).includes(filter.value)) return false;
          break;
        case 'greater':
          if (value <= filter.value) return false;
          break;
        case 'less':
          if (value >= filter.value) return false;
          break;
        case 'between':
          if (value < filter.value[0] || value > filter.value[1]) return false;
          break;
        case 'in':
          if (!filter.value.includes(value)) return false;
          break;
      }
    }

    // Check date range
    if (definition.dateRange) {
      if (session.startTime < definition.dateRange.start ||
          session.startTime > definition.dateRange.end) {
        return false;
      }
    }

    return true;
  }

  private trackAttribution(event: AnalyticsEvent): void {
    if (!event.userId) return;

    const userAttributions = this.attributions.get(event.userId) || [];
    
    // Find or create attribution chain
    let currentAttribution = userAttributions.find(a => !a.conversion);
    
    if (!currentAttribution) {
      currentAttribution = {
        model: 'lastTouch',
        touchpoints: []
      };
      userAttributions.push(currentAttribution);
      this.attributions.set(event.userId, userAttributions);
    }

    // Add touchpoint
    const channel = this.determineChannel(event);
    currentAttribution.touchpoints.push({
      channel,
      timestamp: event.timestamp,
      weight: 0 // Will be calculated based on model
    });

    // Check for conversion
    if (event.eventName === 'purchase' || event.eventName === 'conversion') {
      currentAttribution.conversion = {
        timestamp: event.timestamp,
        value: event.eventData.value || 0
      };
      this.recalculateAttribution(currentAttribution);
    }
  }

  private determineChannel(event: AnalyticsEvent): string {
    // Simple channel determination
    const source = event.dataPoints.utm_source || event.context.referrer;
    
    if (!source) return 'direct';
    if (source.includes('google')) return 'google';
    if (source.includes('facebook')) return 'facebook';
    if (source.includes('email')) return 'email';
    return 'other';
  }

  private recalculateAttribution(attribution: Attribution): void {
    const touchpointCount = attribution.touchpoints.length;
    if (touchpointCount === 0) return;

    switch (attribution.model) {
      case 'firstTouch':
        attribution.touchpoints.forEach((tp, i) => {
          tp.weight = i === 0 ? 1 : 0;
        });
        break;
        
      case 'lastTouch':
        attribution.touchpoints.forEach((tp, i) => {
          tp.weight = i === touchpointCount - 1 ? 1 : 0;
        });
        break;
        
      case 'linear':
        attribution.touchpoints.forEach(tp => {
          tp.weight = 1 / touchpointCount;
        });
        break;
        
      case 'timeDecay':
        const halfLife = 7 * 24 * 60 * 60 * 1000; // 7 days
        const conversionTime = attribution.conversion?.timestamp.getTime() || Date.now();
        
        attribution.touchpoints.forEach(tp => {
          const age = conversionTime - tp.timestamp.getTime();
          tp.weight = Math.exp(-age / halfLife);
        });
        
        // Normalize weights
        const totalWeight = attribution.touchpoints.reduce((sum, tp) => sum + tp.weight, 0);
        attribution.touchpoints.forEach(tp => {
          tp.weight /= totalWeight;
        });
        break;
        
      case 'positionBased':
        attribution.touchpoints.forEach((tp, i) => {
          if (i === 0 || i === touchpointCount - 1) {
            tp.weight = 0.4; // 40% each for first and last
          } else {
            tp.weight = 0.2 / (touchpointCount - 2); // 20% distributed among middle
          }
        });
        break;
    }
  }

  private startBatchProcessing(): void {
    this.batchTimer = setInterval(() => {
      this.processBatch();
    }, this.BATCH_INTERVAL);
  }

  private async processBatch(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const batch = this.eventQueue.splice(0, this.BATCH_SIZE);
    
    try {
      // In a real implementation, this would send to analytics storage
      this.emit('batch:process', batch);
    } catch (error) {
      // Re-queue failed events
      this.eventQueue.unshift(...batch);
      this.emit('batch:error', error);
    }
  }

  public destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    this.removeAllListeners();
  }
}

// Create singleton instance
export const analytics = new EnhancedAnalytics();

// Export types and class
export { EnhancedAnalytics };