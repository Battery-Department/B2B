// Unified event manager for client-server event matching and deduplication
import { MetaPixel as MetaPixelService } from './pixel';
import { ConversionsAPI as ConversionsAPIService } from './conversions-api';
import { EventData, ServerEvent, EventMatchResult, UserData } from './types';
import { DataEnrichmentService } from './data-enrichment';

interface EventManagerConfig {
  enablePixel: boolean;
  enableCAPI: boolean;
  pixelConfig?: {
    pixelId: string;
    testMode: boolean;
    debug?: boolean;
  };
  capiConfig?: {
    accessToken: string;
    pixelId: string;
    testMode: boolean;
    testEventCode?: string;
    debug?: boolean;
  };
  deduplicationWindow?: number; // milliseconds
}

interface TrackedEvent {
  eventId: string;
  eventName: string;
  timestamp: number;
  source: 'pixel' | 'capi' | 'both';
  data?: any;
}

export class MetaEventManager {
  private static instance: MetaEventManager;
  private config: EventManagerConfig;
  private pixelService?: MetaPixelService;
  private capiService?: ConversionsAPIService;
  private enrichmentService: DataEnrichmentService;
  private eventHistory: Map<string, TrackedEvent> = new Map();
  private userData?: UserData;
  private deduplicationWindow: number;

  private constructor(config: EventManagerConfig) {
    this.config = config;
    this.deduplicationWindow = config.deduplicationWindow || 60000; // 1 minute default
    this.enrichmentService = DataEnrichmentService.getInstance();
    this.initializeServices();
  }

  static getInstance(config?: EventManagerConfig): MetaEventManager {
    if (!MetaEventManager.instance && config) {
      MetaEventManager.instance = new MetaEventManager(config);
    }
    return MetaEventManager.instance;
  }

  private async initializeServices(): Promise<void> {
    if (this.config.enablePixel && this.config.pixelConfig) {
      this.pixelService = MetaPixelService.getInstance(this.config.pixelConfig);
      await this.pixelService.initialize();
    }

    if (this.config.enableCAPI && this.config.capiConfig) {
      this.capiService = ConversionsAPIService.getInstance(this.config.capiConfig);
    }

    // Clean up old events periodically
    setInterval(() => this.cleanupEventHistory(), this.deduplicationWindow);
  }

  async track(eventName: string, data?: EventData, options?: {
    source?: 'pixel' | 'capi' | 'both';
    userData?: UserData;
    actionSource?: ServerEvent['action_source'];
  }): Promise<void> {
    const source = options?.source || 'both';
    const eventId = this.generateEventId(eventName);
    const timestamp = Date.now();

    // Check for duplicate events
    if (this.isDuplicateEvent(eventId, eventName, data)) {
      console.warn(`[Meta Event Manager] Duplicate event detected: ${eventName}`);
      return;
    }

    // Record event
    this.recordEvent(eventId, eventName, timestamp, source, data);

    // Merge user data
    const effectiveUserData = options?.userData || this.userData;

    // Track on Pixel
    if ((source === 'pixel' || source === 'both') && this.pixelService) {
      this.pixelService.track(eventName, {
        ...data,
        eventID: eventId,
      });
    }

    // Track on CAPI
    if ((source === 'capi' || source === 'both') && this.capiService) {
      const serverEvent: ServerEvent = {
        event_name: eventName,
        event_time: Math.floor(timestamp / 1000),
        event_id: eventId,
        action_source: options?.actionSource || 'website',
        event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
        user_data: effectiveUserData,
        custom_data: data,
      };

      await this.capiService.track(serverEvent);
    }
  }

  async trackCustom(eventName: string, data?: any, options?: {
    source?: 'pixel' | 'capi' | 'both';
    userData?: UserData;
  }): Promise<void> {
    const source = options?.source || 'both';
    const eventId = this.generateEventId(`custom:${eventName}`);
    const timestamp = Date.now();

    // Check for duplicate events
    if (this.isDuplicateEvent(eventId, `custom:${eventName}`, data)) {
      console.warn(`[Meta Event Manager] Duplicate custom event detected: ${eventName}`);
      return;
    }

    // Record event
    this.recordEvent(eventId, `custom:${eventName}`, timestamp, source, data);

    // Merge user data
    const effectiveUserData = options?.userData || this.userData;

    // Track on Pixel
    if ((source === 'pixel' || source === 'both') && this.pixelService) {
      this.pixelService.trackCustom(eventName, {
        ...data,
        eventID: eventId,
      });
    }

    // Track on CAPI
    if ((source === 'capi' || source === 'both') && this.capiService) {
      const serverEvent: ServerEvent = {
        event_name: eventName,
        event_time: Math.floor(timestamp / 1000),
        event_id: eventId,
        action_source: 'website',
        event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
        user_data: effectiveUserData,
        custom_data: data,
      };

      await this.capiService.track(serverEvent);
    }
  }

  setUserData(userData: UserData): void {
    // Enrich user data
    const enriched = this.enrichmentService.enrichUserData(userData);
    this.userData = enriched;

    // Update Pixel user data
    if (this.pixelService) {
      this.pixelService.setUserData(enriched);
    }
  }

  updateDataLayer(key: string, value: any): void {
    if (this.pixelService) {
      this.pixelService.updateDataLayer(key, value);
    }
  }

  // Privacy controls
  setDataProcessingOptions(options: string[], country?: number, state?: number): void {
    if (this.pixelService) {
      this.pixelService.setDataProcessingOptions(options, country, state);
    }
  }

  // Enable limited data use for California
  enableLimitedDataUse(): void {
    this.setDataProcessingOptions(['LDU'], 1, 1000); // US, California
  }

  // Disable all data processing (opt-out)
  disableDataProcessing(): void {
    this.setDataProcessingOptions([]);
  }

  private isDuplicateEvent(eventId: string, eventName: string, data?: any): boolean {
    const existingEvent = Array.from(this.eventHistory.values()).find(event => {
      return event.eventName === eventName &&
             JSON.stringify(event.data) === JSON.stringify(data) &&
             (Date.now() - event.timestamp) < this.deduplicationWindow;
    });

    return !!existingEvent;
  }

  private recordEvent(eventId: string, eventName: string, timestamp: number, source: 'pixel' | 'capi' | 'both', data?: any): void {
    this.eventHistory.set(eventId, {
      eventId,
      eventName,
      timestamp,
      source,
      data,
    });
  }

  private cleanupEventHistory(): void {
    const now = Date.now();
    const expiredEvents: string[] = [];

    this.eventHistory.forEach((event, id) => {
      if (now - event.timestamp > this.deduplicationWindow) {
        expiredEvents.push(id);
      }
    });

    expiredEvents.forEach(id => this.eventHistory.delete(id));
  }

  private generateEventId(eventName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${eventName}_${timestamp}_${random}`;
  }

  // Get event history for debugging
  getEventHistory(): TrackedEvent[] {
    return Array.from(this.eventHistory.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get matched events
  getMatchedEvents(timeWindow?: number): EventMatchResult[] {
    const window = timeWindow || this.deduplicationWindow;
    const now = Date.now();
    const results: EventMatchResult[] = [];

    this.eventHistory.forEach(event => {
      if (now - event.timestamp <= window && event.source === 'both') {
        results.push({
          clientEventId: event.eventId,
          serverEventId: event.eventId,
          timestamp: event.timestamp,
          matched: true,
        });
      }
    });

    return results;
  }

  // Flush any pending events
  async flush(): Promise<void> {
    if (this.capiService) {
      await this.capiService.flush();
    }
  }

  // Get service status
  getStatus(): {
    pixel: { enabled: boolean; initialized: boolean };
    capi: { enabled: boolean; queueStatus?: { pending: number; processing: boolean } };
    eventHistory: number;
  } {
    return {
      pixel: {
        enabled: this.config.enablePixel,
        initialized: !!this.pixelService,
      },
      capi: {
        enabled: this.config.enableCAPI,
        queueStatus: this.capiService?.getQueueStatus(),
      },
      eventHistory: this.eventHistory.size,
    };
  }

  // Export events for analysis
  exportEvents(format: 'json' | 'csv' = 'json'): string {
    const events = this.getEventHistory();

    if (format === 'json') {
      return JSON.stringify(events, null, 2);
    }

    // CSV format
    const headers = ['eventId', 'eventName', 'timestamp', 'source', 'data'];
    const rows = events.map(event => [
      event.eventId,
      event.eventName,
      new Date(event.timestamp).toISOString(),
      event.source,
      JSON.stringify(event.data || {}),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}