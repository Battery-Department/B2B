import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MetaPixel, initializeMetaPixel } from '@/services/meta/pixel';
import { PixelConfig } from '@/types/meta';

describe('Meta Pixel Service', () => {
  let pixel: MetaPixel;
  let config: PixelConfig;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Mock window.fbq
    global.window = {
      fbq: vi.fn(),
      _fbq: null,
      localStorage: global.localStorage
    } as any;

    config = {
      pixelId: 'TEST_PIXEL_123',
      testMode: true,
      externalId: 'user_123',
      email: 'test@example.com',
      phone: '+1234567890'
    };

    pixel = new MetaPixel(config);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize in test mode without loading script', async () => {
      await pixel.initialize();
      
      // Should not load Meta script in test mode
      expect(document.getElementById('facebook-pixel')).toBeNull();
      
      // Should set up mock fbq function
      expect(window.fbq).toBeDefined();
      expect(typeof window.fbq).toBe('function');
    });

    it('should not reinitialize if already initialized', async () => {
      await pixel.initialize();
      const firstFbq = window.fbq;
      
      await pixel.initialize();
      expect(window.fbq).toBe(firstFbq);
    });
  });

  describe('Event Tracking', () => {
    beforeEach(async () => {
      await pixel.initialize();
    });

    it('should track PageView event in test mode', () => {
      pixel.track('PageView');
      
      expect(window.fbq).toHaveBeenCalledWith('track', 'PageView', expect.objectContaining({
        source: 'lithiai',
        content_category: 'battery'
      }));
    });

    it('should track ViewContent with custom data', () => {
      pixel.viewContent({
        content_type: 'product',
        content_ids: ['battery_123'],
        value: 125.00,
        currency: 'USD'
      });

      expect(window.fbq).toHaveBeenCalledWith('track', 'ViewContent', expect.objectContaining({
        content_type: 'product',
        content_ids: ['battery_123'],
        value: 125.00,
        currency: 'USD'
      }));
    });

    it('should track Purchase event', () => {
      pixel.purchase({
        value: 250.00,
        currency: 'USD',
        content_ids: ['battery_456'],
        content_type: 'product'
      });

      expect(window.fbq).toHaveBeenCalledWith('track', 'Purchase', expect.objectContaining({
        value: 250.00,
        currency: 'USD'
      }));
    });

    it('should store events in localStorage in test mode', () => {
      pixel.track('AddToCart', {
        content_type: 'product',
        content_ids: ['battery_789'],
        value: 95.00,
        currency: 'USD'
      });

      const storedEvents = JSON.parse(localStorage.getItem('meta_test_events') || '[]');
      expect(storedEvents).toHaveLength(1);
      expect(storedEvents[0]).toMatchObject({
        event: 'AddToCart',
        testMode: true
      });
    });

    it('should limit stored events to 100', () => {
      // Track 105 events
      for (let i = 0; i < 105; i++) {
        pixel.track('PageView');
      }

      const storedEvents = JSON.parse(localStorage.getItem('meta_test_events') || '[]');
      expect(storedEvents).toHaveLength(100);
    });
  });

  describe('Event Deduplication', () => {
    beforeEach(async () => {
      await pixel.initialize();
    });

    it('should generate unique event IDs', () => {
      const eventIds = new Set();
      
      for (let i = 0; i < 10; i++) {
        pixel.track('ViewContent', { content_ids: ['test'] });
        const calls = (window.fbq as any).mock.calls;
        const lastCall = calls[calls.length - 1];
        const eventId = lastCall[3]?.eventID;
        eventIds.add(eventId);
      }

      expect(eventIds.size).toBe(10); // All IDs should be unique
    });
  });

  describe('iOS 14.5+ Privacy Handling', () => {
    it('should add LDU data processing options when enabled', async () => {
      const privacyConfig: PixelConfig = {
        ...config,
        limitedDataUse: true
      };
      
      const privacyPixel = new MetaPixel(privacyConfig);
      await privacyPixel.initialize();
      
      privacyPixel.track('PageView');
      
      expect(window.fbq).toHaveBeenCalledWith('track', 'PageView', expect.objectContaining({
        data_processing_options: ['LDU'],
        data_processing_options_country: 1,
        data_processing_options_state: 1000
      }));
    });
  });

  describe('User Data Hashing', () => {
    beforeEach(async () => {
      await pixel.initialize();
    });

    it('should hash email addresses correctly', () => {
      pixel.setUserData({
        email: 'TEST@EXAMPLE.COM',
        customerId: 'user_123'
      });

      expect(window.fbq).toHaveBeenCalledWith('init', config.pixelId, expect.objectContaining({
        em: expect.any(String),
        external_id: 'user_123'
      }));

      // Email should be lowercased and hashed
      const call = (window.fbq as any).mock.calls.find((c: any) => c[0] === 'init');
      expect(call[2].em).not.toBe('TEST@EXAMPLE.COM');
      expect(call[2].em).not.toBe('test@example.com');
    });

    it('should hash phone numbers correctly', () => {
      pixel.setUserData({
        phone: '+1 (234) 567-8900',
        customerId: 'user_123'
      });

      const call = (window.fbq as any).mock.calls.find((c: any) => c[0] === 'init');
      expect(call[2].ph).toBeDefined();
      expect(call[2].ph).not.toBe('+1 (234) 567-8900');
      expect(call[2].ph).not.toBe('12345678900');
    });

    it('should hash all PII fields', () => {
      pixel.setUserData({
        email: 'test@example.com',
        phone: '1234567890',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        customerId: 'user_123'
      });

      const call = (window.fbq as any).mock.calls.find((c: any) => c[0] === 'init');
      const hashedData = call[2];

      // All PII should be hashed
      expect(hashedData.em).toBeDefined();
      expect(hashedData.ph).toBeDefined();
      expect(hashedData.fn).toBeDefined();
      expect(hashedData.ln).toBeDefined();
      expect(hashedData.db).toBeDefined();
      expect(hashedData.ge).toBeDefined();
      expect(hashedData.ct).toBeDefined();
      expect(hashedData.st).toBeDefined();
      expect(hashedData.zp).toBeDefined();
      expect(hashedData.country).toBeDefined();

      // External ID should not be hashed
      expect(hashedData.external_id).toBe('user_123');
    });
  });

  describe('Test Mode Utilities', () => {
    beforeEach(async () => {
      await pixel.initialize();
    });

    it('should return test events when in test mode', () => {
      pixel.track('PageView');
      pixel.track('ViewContent');
      
      const testEvents = pixel.getTestEvents();
      expect(testEvents).toHaveLength(2);
      expect(testEvents[0].event).toBe('PageView');
      expect(testEvents[1].event).toBe('ViewContent');
    });

    it('should clear test events', () => {
      pixel.track('PageView');
      pixel.track('ViewContent');
      
      pixel.clearTestEvents();
      
      const testEvents = pixel.getTestEvents();
      expect(testEvents).toHaveLength(0);
      expect(localStorage.getItem('meta_test_events')).toBeNull();
    });

    it('should not return events in production mode', async () => {
      const prodConfig: PixelConfig = {
        ...config,
        testMode: false
      };
      
      const prodPixel = new MetaPixel(prodConfig);
      await prodPixel.initialize();
      
      const testEvents = prodPixel.getTestEvents();
      expect(testEvents).toHaveLength(0);
    });
  });

  describe('Standard Meta Events', () => {
    beforeEach(async () => {
      await pixel.initialize();
    });

    it('should track all standard events correctly', () => {
      // Lead
      pixel.lead({ content_name: 'Battery Inquiry', value: 50 });
      expect(window.fbq).toHaveBeenCalledWith('track', 'Lead', expect.any(Object));

      // CompleteRegistration
      pixel.completeRegistration({ content_name: 'Dealer Registration' });
      expect(window.fbq).toHaveBeenCalledWith('track', 'CompleteRegistration', expect.any(Object));

      // InitiateCheckout
      pixel.initiateCheckout({ value: 500, currency: 'USD' });
      expect(window.fbq).toHaveBeenCalledWith('track', 'InitiateCheckout', expect.any(Object));

      // Search
      pixel.search({ search_string: 'flexvolt battery' });
      expect(window.fbq).toHaveBeenCalledWith('track', 'Search', expect.any(Object));
    });
  });

  describe('Custom Events', () => {
    beforeEach(async () => {
      await pixel.initialize();
    });

    it('should track custom events', () => {
      pixel.trackCustom('QuizCompleted', {
        quiz_type: 'battery_selector',
        score: 85
      });

      expect(window.fbq).toHaveBeenCalledWith('trackCustom', 'QuizCompleted', expect.objectContaining({
        quiz_type: 'battery_selector',
        score: 85
      }));
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = initializeMetaPixel(config);
      const instance2 = initializeMetaPixel(config);
      
      expect(instance1).toBe(instance2);
    });
  });
});