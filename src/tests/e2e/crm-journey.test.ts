import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';

describe('CRM Enhancement E2E Journey', () => {
  let browser: Browser;
  let page: Page;
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000';

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Complete User Journey', () => {
    it('should track user from landing to purchase with full CRM enhancement', async () => {
      // 1. User visits site (PageView event)
      await page.goto(baseUrl);
      
      // Verify Meta Pixel initialized
      const pixelInitialized = await page.evaluate(() => {
        return typeof window.fbq !== 'undefined';
      });
      expect(pixelInitialized).toBe(true);

      // Check PageView event logged
      const pageViewEvents = await page.evaluate(() => {
        const events = JSON.parse(localStorage.getItem('meta_test_events') || '[]');
        return events.filter((e: any) => e.event === 'PageView');
      });
      expect(pageViewEvents.length).toBeGreaterThan(0);

      // 2. User browses products (ViewContent events)
      await page.click('[data-testid="products-link"]');
      await page.waitForSelector('[data-testid="product-card"]');
      
      // Click on a product
      await page.click('[data-testid="product-card"]:first-child');
      await page.waitForSelector('[data-testid="product-details"]');

      // Verify ViewContent event
      const viewContentEvents = await page.evaluate(() => {
        const events = JSON.parse(localStorage.getItem('meta_test_events') || '[]');
        return events.filter((e: any) => e.event === 'ViewContent');
      });
      expect(viewContentEvents.length).toBeGreaterThan(0);
      expect(viewContentEvents[0].data).toHaveProperty('content_ids');

      // 3. User takes quiz (Enhanced profiling)
      await page.click('[data-testid="take-quiz-button"]');
      await page.waitForSelector('[data-testid="quiz-container"]');

      // Answer quiz questions
      const quizSteps = [
        { question: 'primary-use', answer: 'professional' },
        { question: 'battery-type', answer: 'flexvolt' },
        { question: 'usage-frequency', answer: 'daily' },
        { question: 'budget-range', answer: 'premium' }
      ];

      for (const step of quizSteps) {
        await page.click(`[data-testid="answer-${step.answer}"]`);
        await page.click('[data-testid="quiz-next-button"]');
        await page.waitForTimeout(500); // Animation delay
      }

      // Verify quiz completion tracked
      const quizEvents = await page.evaluate(() => {
        const events = JSON.parse(localStorage.getItem('meta_test_events') || '[]');
        return events.filter((e: any) => e.event === 'QuizCompleted');
      });
      expect(quizEvents.length).toBe(1);

      // Check enhanced profile created
      const profile = await page.evaluate(() => {
        return localStorage.getItem('user_profile');
      });
      expect(profile).toBeTruthy();
      const parsedProfile = JSON.parse(profile!);
      expect(parsedProfile).toHaveProperty('segments');
      expect(parsedProfile).toHaveProperty('psychographics');

      // 4. User adds to cart (AddToCart event)
      await page.click('[data-testid="recommended-product"]');
      await page.click('[data-testid="add-to-cart-button"]');
      
      // Verify AddToCart event
      const addToCartEvents = await page.evaluate(() => {
        const events = JSON.parse(localStorage.getItem('meta_test_events') || '[]');
        return events.filter((e: any) => e.event === 'AddToCart');
      });
      expect(addToCartEvents.length).toBeGreaterThan(0);
      expect(addToCartEvents[0].data).toHaveProperty('value');

      // 5. User proceeds to checkout (InitiateCheckout event)
      await page.click('[data-testid="cart-icon"]');
      await page.click('[data-testid="checkout-button"]');
      
      const checkoutEvents = await page.evaluate(() => {
        const events = JSON.parse(localStorage.getItem('meta_test_events') || '[]');
        return events.filter((e: any) => e.event === 'InitiateCheckout');
      });
      expect(checkoutEvents.length).toBe(1);

      // 6. User completes purchase (Purchase event)
      // Fill checkout form
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="name-input"]', 'John Doe');
      await page.fill('[data-testid="card-number"]', '4242424242424242');
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvc"]', '123');
      
      await page.click('[data-testid="place-order-button"]');
      await page.waitForSelector('[data-testid="order-confirmation"]');

      // Verify Purchase event with proper attribution
      const purchaseEvents = await page.evaluate(() => {
        const events = JSON.parse(localStorage.getItem('meta_test_events') || '[]');
        return events.filter((e: any) => e.event === 'Purchase');
      });
      expect(purchaseEvents.length).toBe(1);
      expect(purchaseEvents[0].data).toHaveProperty('value');
      expect(purchaseEvents[0].data).toHaveProperty('currency');

      // 7. Verify data in CRM dashboard
      // Navigate to dealer portal
      await page.goto(`${baseUrl}/portal/crm`);
      
      // Check dashboard loads
      await page.waitForSelector('[data-testid="crm-dashboard"]');
      
      // Verify user appears in profiles
      await page.click('[data-testid="user-profiles-tab"]');
      const userProfile = await page.waitForSelector('[data-testid="user-profile-card"]');
      expect(userProfile).toBeTruthy();

      // 8. Check Meta test events recorded
      await page.click('[data-testid="meta-events-tab"]');
      const eventsList = await page.$$('[data-testid="meta-event-item"]');
      expect(eventsList.length).toBeGreaterThan(5);

      // 9. Validate audience membership updated
      await page.click('[data-testid="audiences-tab"]');
      const audienceCards = await page.$$('[data-testid="audience-card"]');
      expect(audienceCards.length).toBeGreaterThan(0);

      // Check user is in high-value segment
      const highValueAudience = await page.waitForSelector(
        '[data-testid="audience-high-value"]'
      );
      const audienceCount = await highValueAudience.textContent();
      expect(parseInt(audienceCount || '0')).toBeGreaterThan(0);
    });
  });

  describe('Privacy Consent Flow', () => {
    it('should respect user privacy choices', async () => {
      // Clear cookies and storage
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());

      // Visit site - consent banner should appear
      await page.goto(baseUrl);
      await page.waitForSelector('[data-testid="consent-banner"]');

      // Decline all tracking
      await page.click('[data-testid="consent-decline-all"]');

      // Verify no Meta events tracked
      await page.click('[data-testid="products-link"]');
      await page.waitForTimeout(1000);

      const events = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('meta_test_events') || '[]');
      });
      expect(events.length).toBe(0);

      // Update consent to allow analytics
      await page.click('[data-testid="privacy-settings"]');
      await page.click('[data-testid="consent-analytics"]');
      await page.click('[data-testid="save-preferences"]');

      // Now events should be tracked
      await page.reload();
      await page.waitForTimeout(1000);

      const newEvents = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('meta_test_events') || '[]');
      });
      expect(newEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Meta Simulator Verification', () => {
    it('should generate realistic test data', async () => {
      await page.goto(`${baseUrl}/portal/crm`);
      
      // Enable Meta simulator
      await page.click('[data-testid="meta-simulator-toggle"]');
      await page.waitForTimeout(2000); // Let simulator generate events

      // Check event stream
      const eventItems = await page.$$('[data-testid="event-stream-item"]');
      expect(eventItems.length).toBeGreaterThan(0);

      // Verify event variety
      const eventTypes = await page.evaluate(() => {
        const items = document.querySelectorAll('[data-testid="event-type"]');
        return Array.from(items).map(item => item.textContent);
      });

      expect(eventTypes).toContain('PageView');
      expect(eventTypes).toContain('ViewContent');
      expect(eventTypes).toContain('AddToCart');

      // Check user demographics distribution
      const demographics = await page.waitForSelector('[data-testid="demographics-chart"]');
      expect(demographics).toBeTruthy();
    });
  });

  describe('Performance Validation', () => {
    it('should maintain performance with high event volume', async () => {
      await page.goto(`${baseUrl}/portal/crm`);

      // Measure initial load time
      const startTime = Date.now();
      await page.waitForSelector('[data-testid="analytics-cards"]');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(2000); // Should load in under 2 seconds

      // Generate high volume of events
      await page.evaluate(() => {
        for (let i = 0; i < 1000; i++) {
          window.fbq('track', 'PageView', { page: `/test-${i}` });
        }
      });

      // Dashboard should still be responsive
      const refreshStart = Date.now();
      await page.click('[data-testid="refresh-button"]');
      await page.waitForSelector('[data-testid="loading-complete"]');
      const refreshTime = Date.now() - refreshStart;

      expect(refreshTime).toBeLessThan(1000); // Refresh in under 1 second
    });
  });

  describe('Error Handling', () => {
    it('should handle API failures gracefully', async () => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());

      await page.goto(`${baseUrl}/portal/crm`);
      
      // Should show error state, not crash
      const errorMessage = await page.waitForSelector('[data-testid="error-message"]');
      expect(await errorMessage.textContent()).toContain('Unable to load data');

      // Should offer retry option
      const retryButton = await page.waitForSelector('[data-testid="retry-button"]');
      expect(retryButton).toBeTruthy();

      // Restore network
      await page.unroute('**/api/**');
      await page.click('[data-testid="retry-button"]');
      
      // Should recover
      await page.waitForSelector('[data-testid="analytics-cards"]');
    });
  });
});