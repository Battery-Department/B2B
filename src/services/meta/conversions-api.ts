import { MetaEvent, ConversionsAPIConfig, ServerEvent } from '@/types/meta';

export class ConversionsAPI {
  private accessToken: string;
  private pixelId: string;
  private isTestMode: boolean;
  private config: ConversionsAPIConfig;
  private eventQueue: ServerEvent[] = [];
  private batchSize: number = 1000;
  private flushInterval: number = 10000; // 10 seconds
  private retryAttempts: number = 3;
  private baseUrl: string = 'https://graph.facebook.com/v18.0';

  constructor(config: ConversionsAPIConfig) {
    this.accessToken = config.accessToken;
    this.pixelId = config.pixelId;
    this.isTestMode = config.testMode || false;
    this.config = config;

    if (!this.isTestMode) {
      this.startBatchProcessor();
    }
  }

  async sendEvent(event: ServerEvent): Promise<boolean> {
    if (this.isTestMode) {
      return this.handleTestEvent(event);
    }

    this.eventQueue.push(event);

    if (this.eventQueue.length >= this.batchSize) {
      await this.flushEvents();
    }

    return true;
  }

  async sendEvents(events: ServerEvent[]): Promise<boolean> {
    if (this.isTestMode) {
      events.forEach(event => this.handleTestEvent(event));
      return true;
    }

    this.eventQueue.push(...events);

    if (this.eventQueue.length >= this.batchSize) {
      await this.flushEvents();
    }

    return true;
  }

  private handleTestEvent(event: ServerEvent): boolean {
    const testEvent = {
      ...event,
      testMode: true,
      timestamp: new Date().toISOString()
    };

    console.log('[Conversions API - Test Mode] Event:', testEvent);
    
    // Store in localStorage for dashboard viewing
    const stored = localStorage.getItem('meta_capi_test_events') || '[]';
    const events = JSON.parse(stored);
    events.push(testEvent);
    localStorage.setItem('meta_capi_test_events', JSON.stringify(events.slice(-100)));

    return true;
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = this.eventQueue.splice(0, this.batchSize);
    
    try {
      await this.sendBatch(eventsToSend);
    } catch (error) {
      console.error('Failed to send events batch:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...eventsToSend);
    }
  }

  private async sendBatch(events: ServerEvent[], attempt: number = 1): Promise<void> {
    const url = `${this.baseUrl}/${this.pixelId}/events`;
    
    const payload = {
      data: events.map(event => this.formatServerEvent(event)),
      test_event_code: this.config.testEventCode,
      partner_agent: 'lithiai_v1.0.0'
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      
      if (result.events_received !== events.length) {
        console.warn(`Events received mismatch: sent ${events.length}, received ${result.events_received}`);
      }

      console.log(`Successfully sent ${result.events_received} events to Meta`);
      
    } catch (error) {
      if (attempt < this.retryAttempts) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Retrying batch send in ${delay}ms (attempt ${attempt + 1})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendBatch(events, attempt + 1);
      }
      
      throw error;
    }
  }

  private formatServerEvent(event: ServerEvent): any {
    return {
      event_name: event.eventName,
      event_time: Math.floor(event.eventTime / 1000),
      event_id: event.eventId,
      action_source: event.actionSource || 'website',
      user_data: this.formatUserData(event.userData),
      custom_data: event.customData,
      event_source_url: event.eventSourceUrl,
      opt_out: event.optOut || false,
      data_processing_options: event.dataProcessingOptions || [],
      data_processing_options_country: event.dataProcessingOptionsCountry || 0,
      data_processing_options_state: event.dataProcessingOptionsState || 0
    };
  }

  private formatUserData(userData: any): any {
    if (!userData) return {};

    return {
      em: userData.email ? this.hashData(userData.email.toLowerCase().trim()) : undefined,
      ph: userData.phone ? this.hashData(userData.phone.replace(/\D/g, '')) : undefined,
      fn: userData.firstName ? this.hashData(userData.firstName.toLowerCase().trim()) : undefined,
      ln: userData.lastName ? this.hashData(userData.lastName.toLowerCase().trim()) : undefined,
      db: userData.dateOfBirth ? this.hashData(userData.dateOfBirth) : undefined,
      ge: userData.gender ? this.hashData(userData.gender.toLowerCase()) : undefined,
      ct: userData.city ? this.hashData(userData.city.toLowerCase().replace(/\s/g, '')) : undefined,
      st: userData.state ? this.hashData(userData.state.toLowerCase()) : undefined,
      zp: userData.zipCode ? this.hashData(userData.zipCode) : undefined,
      country: userData.country ? this.hashData(userData.country.toLowerCase()) : undefined,
      external_id: userData.customerId,
      client_ip_address: userData.clientIpAddress,
      client_user_agent: userData.clientUserAgent,
      fbc: userData.fbc, // Facebook click ID
      fbp: userData.fbp, // Facebook browser ID
    };
  }

  private hashData(data: string): string {
    // In production, use SHA-256 hashing
    // For now, using a simple hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private startBatchProcessor(): void {
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.flushInterval);
  }

  // Standard event tracking methods
  async trackPageView(userData: any, customData?: any): Promise<boolean> {
    return this.sendEvent({
      eventName: 'PageView',
      eventTime: Date.now(),
      eventId: this.generateEventId('PageView'),
      userData,
      customData,
      eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined
    });
  }

  async trackViewContent(userData: any, customData: any): Promise<boolean> {
    return this.sendEvent({
      eventName: 'ViewContent',
      eventTime: Date.now(),
      eventId: this.generateEventId('ViewContent'),
      userData,
      customData,
      eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined
    });
  }

  async trackAddToCart(userData: any, customData: any): Promise<boolean> {
    return this.sendEvent({
      eventName: 'AddToCart',
      eventTime: Date.now(),
      eventId: this.generateEventId('AddToCart'),
      userData,
      customData,
      eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined
    });
  }

  async trackPurchase(userData: any, customData: any): Promise<boolean> {
    return this.sendEvent({
      eventName: 'Purchase',
      eventTime: Date.now(),
      eventId: this.generateEventId('Purchase'),
      userData,
      customData,
      eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined
    });
  }

  async trackLead(userData: any, customData?: any): Promise<boolean> {
    return this.sendEvent({
      eventName: 'Lead',
      eventTime: Date.now(),
      eventId: this.generateEventId('Lead'),
      userData,
      customData,
      eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined
    });
  }

  async trackCompleteRegistration(userData: any, customData?: any): Promise<boolean> {
    return this.sendEvent({
      eventName: 'CompleteRegistration',
      eventTime: Date.now(),
      eventId: this.generateEventId('CompleteRegistration'),
      userData,
      customData,
      eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined
    });
  }

  async trackInitiateCheckout(userData: any, customData: any): Promise<boolean> {
    return this.sendEvent({
      eventName: 'InitiateCheckout',
      eventTime: Date.now(),
      eventId: this.generateEventId('InitiateCheckout'),
      userData,
      customData,
      eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined
    });
  }

  async trackSearch(userData: any, customData: any): Promise<boolean> {
    return this.sendEvent({
      eventName: 'Search',
      eventTime: Date.now(),
      eventId: this.generateEventId('Search'),
      userData,
      customData,
      eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined
    });
  }

  async trackCustomEvent(eventName: string, userData: any, customData?: any): Promise<boolean> {
    return this.sendEvent({
      eventName,
      eventTime: Date.now(),
      eventId: this.generateEventId(eventName),
      userData,
      customData,
      eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined
    });
  }

  private generateEventId(eventName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${eventName}_${timestamp}_${random}`;
  }

  // Test mode utilities
  getTestEvents(): ServerEvent[] {
    if (!this.isTestMode) return [];
    
    const stored = localStorage.getItem('meta_capi_test_events') || '[]';
    return JSON.parse(stored);
  }

  clearTestEvents(): void {
    if (this.isTestMode) {
      localStorage.removeItem('meta_capi_test_events');
    }
  }

  // Health check and diagnostics
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (this.isTestMode) {
      return { success: true, message: 'Test mode - connection not required' };
    }

    try {
      const url = `${this.baseUrl}/${this.pixelId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });

      if (response.ok) {
        return { success: true, message: 'Connection successful' };
      } else {
        return { success: false, message: `HTTP ${response.status}: ${await response.text()}` };
      }
    } catch (error) {
      return { success: false, message: `Connection failed: ${error.message}` };
    }
  }

  // Force flush remaining events
  async flush(): Promise<void> {
    if (!this.isTestMode && this.eventQueue.length > 0) {
      await this.flushEvents();
    }
  }

  // Get queue status
  getQueueStatus(): { queueLength: number; batchSize: number; flushInterval: number } {
    return {
      queueLength: this.eventQueue.length,
      batchSize: this.batchSize,
      flushInterval: this.flushInterval
    };
  }
}

// Singleton instance
let capiInstance: ConversionsAPI | null = null;

export const initializeConversionsAPI = (config: ConversionsAPIConfig): ConversionsAPI => {
  if (!capiInstance) {
    capiInstance = new ConversionsAPI(config);
  }
  return capiInstance;
};

export const getConversionsAPI = (): ConversionsAPI | null => {
  return capiInstance;
};