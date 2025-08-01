import { MetaEvent, MetaEventData, PixelConfig } from '@/types/meta';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export class MetaPixel {
  private pixelId: string;
  private isTestMode: boolean;
  private config: PixelConfig;
  private eventQueue: MetaEvent[] = [];
  private isInitialized: boolean = false;

  constructor(config: PixelConfig) {
    this.pixelId = config.pixelId;
    this.isTestMode = config.testMode || false;
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (this.isTestMode) {
      console.log('[Meta Pixel - Test Mode] Initializing Pixel:', this.pixelId);
      this.setupTestMode();
    } else {
      await this.loadPixelScript();
      this.initializePixel();
    }

    this.isInitialized = true;
  }

  private setupTestMode(): void {
    window.fbq = (action: string, event: string, data?: any) => {
      const testEvent: MetaEvent = {
        event,
        data,
        timestamp: new Date(),
        source: 'pixel',
        testMode: true
      };
      
      console.log('[Meta Pixel - Test Mode] Event:', testEvent);
      this.eventQueue.push(testEvent);
      
      // Store in localStorage for dashboard viewing
      const stored = localStorage.getItem('meta_test_events') || '[]';
      const events = JSON.parse(stored);
      events.push(testEvent);
      localStorage.setItem('meta_test_events', JSON.stringify(events.slice(-100))); // Keep last 100
    };
  }

  private async loadPixelScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById('facebook-pixel')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'facebook-pixel';
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
      `;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Meta Pixel script'));
      document.head.appendChild(script);
    });
  }

  private initializePixel(): void {
    if (!window.fbq) {
      console.error('Meta Pixel script not loaded');
      return;
    }

    window.fbq('init', this.pixelId, {
      external_id: this.config.externalId,
      em: this.config.email ? this.hashEmail(this.config.email) : undefined,
      ph: this.config.phone ? this.hashPhone(this.config.phone) : undefined,
    });

    // Track PageView automatically
    this.track('PageView');
  }

  track(eventName: string, eventData?: MetaEventData, customData?: any): void {
    if (!this.isInitialized) {
      console.warn('Meta Pixel not initialized');
      return;
    }

    const data = this.enrichEventData(eventData, customData);
    
    if (this.isTestMode) {
      window.fbq('track', eventName, data);
    } else {
      // Add event deduplication
      const eventId = this.generateEventId(eventName, data);
      window.fbq('track', eventName, data, { eventID: eventId });
    }
  }

  trackCustom(eventName: string, eventData?: MetaEventData, customData?: any): void {
    if (!this.isInitialized) {
      console.warn('Meta Pixel not initialized');
      return;
    }

    const data = this.enrichEventData(eventData, customData);
    
    if (this.isTestMode) {
      window.fbq('trackCustom', eventName, data);
    } else {
      const eventId = this.generateEventId(eventName, data);
      window.fbq('trackCustom', eventName, data, { eventID: eventId });
    }
  }

  private enrichEventData(eventData?: MetaEventData, customData?: any): any {
    const baseData = {
      source: 'lithiai',
      content_category: 'battery',
      ...eventData
    };

    // Add iOS 14.5+ privacy handling
    if (this.config.limitedDataUse) {
      baseData.data_processing_options = ['LDU'];
      baseData.data_processing_options_country = 1;
      baseData.data_processing_options_state = 1000;
    }

    return { ...baseData, ...customData };
  }

  private generateEventId(eventName: string, data: any): string {
    const timestamp = Date.now();
    const dataString = JSON.stringify(data);
    return `${eventName}_${timestamp}_${this.hashString(dataString)}`;
  }

  private hashEmail(email: string): string {
    return this.hashString(email.toLowerCase().trim());
  }

  private hashPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    return this.hashString(cleaned);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  getTestEvents(): MetaEvent[] {
    if (!this.isTestMode) return [];
    return this.eventQueue;
  }

  clearTestEvents(): void {
    if (this.isTestMode) {
      this.eventQueue = [];
      localStorage.removeItem('meta_test_events');
    }
  }

  setUserData(userData: any): void {
    if (!this.isInitialized || !window.fbq) return;

    const hashedData = {
      em: userData.email ? this.hashEmail(userData.email) : undefined,
      ph: userData.phone ? this.hashPhone(userData.phone) : undefined,
      external_id: userData.customerId,
      fn: userData.firstName ? this.hashString(userData.firstName.toLowerCase()) : undefined,
      ln: userData.lastName ? this.hashString(userData.lastName.toLowerCase()) : undefined,
      db: userData.dateOfBirth ? this.hashString(userData.dateOfBirth) : undefined,
      ge: userData.gender ? this.hashString(userData.gender.toLowerCase()) : undefined,
      ct: userData.city ? this.hashString(userData.city.toLowerCase()) : undefined,
      st: userData.state ? this.hashString(userData.state.toLowerCase()) : undefined,
      zp: userData.zipCode ? this.hashString(userData.zipCode) : undefined,
      country: userData.country ? this.hashString(userData.country.toLowerCase()) : undefined,
    };

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(hashedData).filter(([_, v]) => v !== undefined)
    );

    window.fbq('init', this.pixelId, cleanData);
  }

  // Standard Meta events
  viewContent(data?: { content_type?: string; content_ids?: string[]; value?: number; currency?: string }): void {
    this.track('ViewContent', data);
  }

  addToCart(data?: { content_type?: string; content_ids?: string[]; value?: number; currency?: string }): void {
    this.track('AddToCart', data);
  }

  purchase(data: { value: number; currency: string; content_ids?: string[]; content_type?: string }): void {
    this.track('Purchase', data);
  }

  lead(data?: { content_name?: string; value?: number; currency?: string }): void {
    this.track('Lead', data);
  }

  completeRegistration(data?: { content_name?: string; value?: number; currency?: string }): void {
    this.track('CompleteRegistration', data);
  }

  initiateCheckout(data?: { content_type?: string; content_ids?: string[]; value?: number; currency?: string }): void {
    this.track('InitiateCheckout', data);
  }

  search(data?: { search_string?: string; content_category?: string }): void {
    this.track('Search', data);
  }
}

// Singleton instance
let pixelInstance: MetaPixel | null = null;

export const initializeMetaPixel = (config: PixelConfig): MetaPixel => {
  if (!pixelInstance) {
    pixelInstance = new MetaPixel(config);
  }
  return pixelInstance;
};

export const getMetaPixel = (): MetaPixel | null => {
  return pixelInstance;
};