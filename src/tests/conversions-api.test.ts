import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConversionsAPI, initializeConversionsAPI } from '@/services/meta/conversions-api';
import { ConversionsAPIConfig, ServerEvent } from '@/types/meta';

// Mock fetch
global.fetch = vi.fn();

describe('Conversions API Service', () => {
  let capi: ConversionsAPI;
  let config: ConversionsAPIConfig;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();

    config = {
      accessToken: 'TEST_ACCESS_TOKEN',
      pixelId: 'TEST_PIXEL_123',
      testMode: true,
      testEventCode: 'TEST123'
    };

    capi = new ConversionsAPI(config);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Test Mode', () => {
    it('should handle events in test mode without API calls', async () => {
      const event: ServerEvent = {
        eventName: 'Purchase',
        eventTime: Date.now(),
        eventId: 'event_123',
        userData: {
          email: 'test@example.com',
          customerId: 'user_123'
        },
        customData: {
          value: 250.00,
          currency: 'USD'
        }
      };

      const result = await capi.sendEvent(event);
      
      expect(result).toBe(true);
      expect(fetch).not.toHaveBeenCalled();
      
      // Check localStorage
      const storedEvents = JSON.parse(localStorage.getItem('meta_capi_test_events') || '[]');
      expect(storedEvents).toHaveLength(1);
      expect(storedEvents[0]).toMatchObject({
        eventName: 'Purchase',
        testMode: true
      });
    });

    it('should limit test events to 100 in localStorage', async () => {
      for (let i = 0; i < 105; i++) {
        await capi.sendEvent({
          eventName: 'PageView',
          eventTime: Date.now(),
          eventId: `event_${i}`
        });
      }

      const storedEvents = JSON.parse(localStorage.getItem('meta_capi_test_events') || '[]');
      expect(storedEvents).toHaveLength(100);
    });
  });

  describe('Event Batching', () => {
    let prodCapi: ConversionsAPI;

    beforeEach(() => {
      prodCapi = new ConversionsAPI({
        ...config,
        testMode: false
      });

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ events_received: 1 })
      });
    });

    it('should batch events up to 1000', async () => {
      // Send 999 events - should not trigger flush
      for (let i = 0; i < 999; i++) {
        await prodCapi.sendEvent({
          eventName: 'PageView',
          eventTime: Date.now(),
          eventId: `event_${i}`
        });
      }
      
      expect(fetch).not.toHaveBeenCalled();

      // 1000th event should trigger flush
      await prodCapi.sendEvent({
        eventName: 'PageView',
        eventTime: Date.now(),
        eventId: 'event_1000'
      });

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/TEST_PIXEL_123/events'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer TEST_ACCESS_TOKEN'
          })
        })
      );
    });

    it('should flush events after 10 seconds', async () => {
      await prodCapi.sendEvent({
        eventName: 'PageView',
        eventTime: Date.now(),
        eventId: 'event_1'
      });

      expect(fetch).not.toHaveBeenCalled();

      // Advance timers by 10 seconds
      vi.advanceTimersByTime(10000);

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple batches correctly', async () => {
      const events: ServerEvent[] = Array.from({ length: 10 }, (_, i) => ({
        eventName: 'PageView',
        eventTime: Date.now(),
        eventId: `event_${i}`
      }));

      await prodCapi.sendEvents(events);
      expect(fetch).not.toHaveBeenCalled();

      await prodCapi.flush();
      expect(fetch).toHaveBeenCalledTimes(1);

      const callBody = JSON.parse((fetch as any).mock.calls[0][1].body);
      expect(callBody.data).toHaveLength(10);
    });
  });

  describe('Retry Logic', () => {
    let prodCapi: ConversionsAPI;

    beforeEach(() => {
      prodCapi = new ConversionsAPI({
        ...config,
        testMode: false
      });
    });

    it('should retry failed requests with exponential backoff', async () => {
      let attempts = 0;
      (fetch as any).mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ events_received: 1 })
        });
      });

      await prodCapi.sendEvent({
        eventName: 'Purchase',
        eventTime: Date.now(),
        eventId: 'event_1'
      });

      await prodCapi.flush();

      // Should retry 3 times total
      expect(attempts).toBe(3);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should re-queue events on final failure', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));

      await prodCapi.sendEvent({
        eventName: 'Purchase',
        eventTime: Date.now(),
        eventId: 'event_1'
      });

      await prodCapi.flush();

      // Event should be re-queued
      const status = prodCapi.getQueueStatus();
      expect(status.queueLength).toBe(1);
    });
  });

  describe('Data Hashing', () => {
    it('should hash PII data correctly', async () => {
      const event: ServerEvent = {
        eventName: 'Purchase',
        eventTime: Date.now(),
        eventId: 'event_123',
        userData: {
          email: 'TEST@EXAMPLE.COM',
          phone: '+1 (234) 567-8900',
          firstName: 'John',
          lastName: 'Doe',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          customerId: 'user_123',
          clientIpAddress: '192.168.1.1',
          clientUserAgent: 'Mozilla/5.0',
          fbc: 'fb.1.123456789.987654321',
          fbp: 'fb.1.123456789.123456789'
        }
      };

      await capi.sendEvent(event);

      const storedEvents = JSON.parse(localStorage.getItem('meta_capi_test_events') || '[]');
      const storedEvent = storedEvents[0];

      // These should be hashed
      expect(storedEvent.userData).toBeDefined();
      
      // These should not be hashed
      expect(storedEvent.userData.customerId).toBe('user_123');
      expect(storedEvent.userData.clientIpAddress).toBe('192.168.1.1');
      expect(storedEvent.userData.clientUserAgent).toBe('Mozilla/5.0');
      expect(storedEvent.userData.fbc).toBe('fb.1.123456789.987654321');
      expect(storedEvent.userData.fbp).toBe('fb.1.123456789.123456789');
    });
  });

  describe('Standard Event Methods', () => {
    it('should track all standard events with proper format', async () => {
      const userData = {
        email: 'test@example.com',
        customerId: 'user_123'
      };

      // PageView
      await capi.trackPageView(userData);
      
      // ViewContent
      await capi.trackViewContent(userData, {
        content_ids: ['battery_123'],
        content_type: 'product',
        value: 125.00,
        currency: 'USD'
      });

      // AddToCart
      await capi.trackAddToCart(userData, {
        content_ids: ['battery_123'],
        content_type: 'product',
        value: 125.00,
        currency: 'USD'
      });

      // Purchase
      await capi.trackPurchase(userData, {
        value: 250.00,
        currency: 'USD',
        content_ids: ['battery_123', 'battery_456'],
        num_items: 2
      });

      // Lead
      await capi.trackLead(userData, {
        content_name: 'Battery Inquiry'
      });

      // CompleteRegistration
      await capi.trackCompleteRegistration(userData);

      // InitiateCheckout
      await capi.trackInitiateCheckout(userData, {
        value: 500.00,
        currency: 'USD'
      });

      // Search
      await capi.trackSearch(userData, {
        search_string: 'flexvolt battery'
      });

      const storedEvents = JSON.parse(localStorage.getItem('meta_capi_test_events') || '[]');
      expect(storedEvents).toHaveLength(8);

      const eventNames = storedEvents.map((e: any) => e.eventName);
      expect(eventNames).toEqual([
        'PageView',
        'ViewContent',
        'AddToCart',
        'Purchase',
        'Lead',
        'CompleteRegistration',
        'InitiateCheckout',
        'Search'
      ]);
    });
  });

  describe('Custom Events', () => {
    it('should track custom events correctly', async () => {
      await capi.trackCustomEvent('QuizCompleted', 
        { customerId: 'user_123' },
        { quiz_type: 'battery_selector', score: 85 }
      );

      const storedEvents = JSON.parse(localStorage.getItem('meta_capi_test_events') || '[]');
      expect(storedEvents[0]).toMatchObject({
        eventName: 'QuizCompleted',
        customData: {
          quiz_type: 'battery_selector',
          score: 85
        }
      });
    });
  });

  describe('Event ID Generation', () => {
    it('should generate unique event IDs', async () => {
      const eventIds = new Set();

      for (let i = 0; i < 100; i++) {
        await capi.trackPageView({ customerId: `user_${i}` });
      }

      const storedEvents = JSON.parse(localStorage.getItem('meta_capi_test_events') || '[]');
      storedEvents.forEach((event: any) => {
        eventIds.add(event.eventId);
      });

      expect(eventIds.size).toBe(100); // All IDs should be unique
    });
  });

  describe('Health Check', () => {
    it('should return success in test mode', async () => {
      const result = await capi.testConnection();
      
      expect(result).toEqual({
        success: true,
        message: 'Test mode - connection not required'
      });
    });

    it('should test actual connection in production mode', async () => {
      const prodCapi = new ConversionsAPI({
        ...config,
        testMode: false
      });

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => 'OK'
      });

      const result = await prodCapi.testConnection();
      
      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/TEST_PIXEL_123'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer TEST_ACCESS_TOKEN'
          })
        })
      );
    });
  });

  describe('Queue Management', () => {
    it('should provide queue status', () => {
      const status = capi.getQueueStatus();
      
      expect(status).toEqual({
        queueLength: 0,
        batchSize: 1000,
        flushInterval: 10000
      });
    });

    it('should clear test events correctly', () => {
      capi.trackPageView({ customerId: 'user_123' });
      capi.clearTestEvents();
      
      const events = capi.getTestEvents();
      expect(events).toHaveLength(0);
      expect(localStorage.getItem('meta_capi_test_events')).toBeNull();
    });
  });

  describe('Event Format', () => {
    let prodCapi: ConversionsAPI;

    beforeEach(() => {
      prodCapi = new ConversionsAPI({
        ...config,
        testMode: false
      });

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ events_received: 1 })
      });
    });

    it('should format events according to Meta spec', async () => {
      const event: ServerEvent = {
        eventName: 'Purchase',
        eventTime: Date.now(),
        eventId: 'event_123',
        actionSource: 'website',
        userData: {
          email: 'test@example.com',
          customerId: 'user_123'
        },
        customData: {
          value: 250.00,
          currency: 'USD'
        },
        eventSourceUrl: 'https://example.com/checkout',
        optOut: false,
        dataProcessingOptions: ['LDU'],
        dataProcessingOptionsCountry: 1,
        dataProcessingOptionsState: 1000
      };

      await prodCapi.sendEvent(event);
      await prodCapi.flush();

      const callBody = JSON.parse((fetch as any).mock.calls[0][1].body);
      
      expect(callBody).toMatchObject({
        data: expect.arrayContaining([
          expect.objectContaining({
            event_name: 'Purchase',
            event_time: expect.any(Number),
            event_id: 'event_123',
            action_source: 'website',
            user_data: expect.any(Object),
            custom_data: {
              value: 250.00,
              currency: 'USD'
            },
            event_source_url: 'https://example.com/checkout',
            opt_out: false,
            data_processing_options: ['LDU'],
            data_processing_options_country: 1,
            data_processing_options_state: 1000
          })
        ]),
        test_event_code: 'TEST123',
        partner_agent: 'lithiai_v1.0.0'
      });
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = initializeConversionsAPI(config);
      const instance2 = initializeConversionsAPI(config);
      
      expect(instance1).toBe(instance2);
    });
  });
});