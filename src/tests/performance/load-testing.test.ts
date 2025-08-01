/**
 * =============================================================================
 * RHY_079: ENTERPRISE LOAD TESTING SUITE
 * =============================================================================
 * Comprehensive load testing for the RHY Supplier Portal
 * Tests: API performance, concurrent users, real-time operations, CDN performance
 * Performance Targets: <100ms API, 1000+ concurrent users, 99.9% uptime
 * =============================================================================
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { performance } from 'perf_hooks';
import axios from 'axios';
import WebSocket from 'ws';
import { performanceMonitor } from '@/lib/performance';

// Load test configuration
const LOAD_TEST_CONFIG = {
  API_RESPONSE_TARGET: 100,      // 100ms for API responses
  DATABASE_QUERY_TARGET: 50,     // 50ms for database queries  
  CONCURRENT_USERS_TARGET: 1000, // Support 1000+ concurrent users
  CDN_RESPONSE_TARGET: 50,       // 50ms for CDN assets
  WEBSOCKET_MESSAGE_TARGET: 25,  // 25ms for WebSocket messages
  ERROR_RATE_THRESHOLD: 0.01,    // <1% error rate
  THROUGHPUT_TARGET: 1000,       // 1000 requests/second
  WAREHOUSE_SYNC_TARGET: 1000,   // <1s for warehouse sync
};

// Test environment configuration
const TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_WS_URL = process.env.TEST_WS_URL || 'ws://localhost:3000';

// Utility functions for load testing
class LoadTestManager {
  private results: Array<{
    timestamp: number;
    duration: number;
    status: number;
    url: string;
    scenario: string;
  }> = [];

  private activeConnections: Set<WebSocket> = new Set();

  async measureApiCall(url: string, scenario: string = 'default'): Promise<{
    duration: number;
    status: number;
    success: boolean;
  }> {
    const startTime = performance.now();
    try {
      const response = await axios.get(`${TEST_BASE_URL}${url}`, {
        timeout: 5000,
        headers: {
          'X-Load-Test': 'true',
          'X-Scenario': scenario,
        }
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.results.push({
        timestamp: startTime,
        duration,
        status: response.status,
        url,
        scenario
      });

      return {
        duration,
        status: response.status,
        success: response.status >= 200 && response.status < 300
      };
    } catch (error: any) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.results.push({
        timestamp: startTime,
        duration,
        status: error.response?.status || 0,
        url,
        scenario
      });

      return {
        duration,
        status: error.response?.status || 0,
        success: false
      };
    }
  }

  async runConcurrentRequests(
    urls: string[], 
    concurrency: number, 
    scenario: string = 'concurrent'
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    requestsPerSecond: number;
  }> {
    const startTime = performance.now();
    const promises: Promise<any>[] = [];
    
    // Create concurrent requests
    for (let i = 0; i < concurrency; i++) {
      const url = urls[i % urls.length];
      promises.push(this.measureApiCall(url, scenario));
    }

    const results = await Promise.all(promises);
    const endTime = performance.now();
    const totalDuration = (endTime - startTime) / 1000; // Convert to seconds

    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = results.filter(r => !r.success).length;
    const durations = results.map(r => r.duration).sort((a, b) => a - b);
    
    const averageResponseTime = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);
    
    return {
      totalRequests: results.length,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      p95ResponseTime: durations[p95Index] || 0,
      p99ResponseTime: durations[p99Index] || 0,
      errorRate: failedRequests / results.length,
      requestsPerSecond: results.length / totalDuration
    };
  }

  async simulateUserJourney(journeySteps: Array<{url: string, thinkTime: number}>): Promise<{
    totalJourneyTime: number;
    stepsCompleted: number;
    success: boolean;
  }> {
    const startTime = performance.now();
    let stepsCompleted = 0;
    
    try {
      for (const step of journeySteps) {
        const result = await this.measureApiCall(step.url, 'user-journey');
        if (!result.success) {
          break;
        }
        stepsCompleted++;
        
        // Simulate user think time
        if (step.thinkTime > 0) {
          await new Promise(resolve => setTimeout(resolve, step.thinkTime));
        }
      }
      
      const endTime = performance.now();
      return {
        totalJourneyTime: endTime - startTime,
        stepsCompleted,
        success: stepsCompleted === journeySteps.length
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        totalJourneyTime: endTime - startTime,
        stepsCompleted,
        success: false
      };
    }
  }

  async testWebSocketConnections(count: number, duration: number): Promise<{
    connectionsEstablished: number;
    messagesExchanged: number;
    averageLatency: number;
    connectionsDropped: number;
  }> {
    const connections: WebSocket[] = [];
    const latencies: number[] = [];
    let messagesExchanged = 0;
    let connectionsDropped = 0;
    
    // Establish connections
    for (let i = 0; i < count; i++) {
      try {
        const ws = new WebSocket(`${TEST_WS_URL}/ws`);
        connections.push(ws);
        this.activeConnections.add(ws);
        
        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'pong' && message.timestamp) {
              const latency = Date.now() - message.timestamp;
              latencies.push(latency);
            }
            messagesExchanged++;
          } catch (e) {
            // Ignore parse errors
          }
        });
        
        ws.on('close', () => {
          connectionsDropped++;
          this.activeConnections.delete(ws);
        });
        
      } catch (error) {
        connectionsDropped++;
      }
    }

    // Wait for connections to establish
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Send ping messages periodically
    const interval = setInterval(() => {
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'ping',
            timestamp: Date.now()
          }));
        }
      });
    }, 1000);
    
    // Run test for specified duration
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // Cleanup
    clearInterval(interval);
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    return {
      connectionsEstablished: connections.length - connectionsDropped,
      messagesExchanged,
      averageLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      connectionsDropped
    };
  }

  getResults() {
    return this.results;
  }

  clear() {
    this.results = [];
  }

  async cleanup() {
    // Close all active WebSocket connections
    this.activeConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    this.activeConnections.clear();
  }
}

describe('RHY Load Testing Suite', () => {
  let loadTestManager: LoadTestManager;

  beforeAll(async () => {
    loadTestManager = new LoadTestManager();
    performanceMonitor.setEnabled(true);
  });

  afterAll(async () => {
    await loadTestManager.cleanup();
  });

  beforeEach(() => {
    loadTestManager.clear();
    performanceMonitor.clear();
  });

  // =============================================================================
  // API ENDPOINT PERFORMANCE TESTS
  // =============================================================================

  describe('API Endpoint Performance', () => {
    it('should handle homepage requests within performance targets', async () => {
      const result = await loadTestManager.runConcurrentRequests(
        ['/'],
        100,
        'homepage'
      );

      expect(result.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.API_RESPONSE_TARGET);
      expect(result.p95ResponseTime).toBeLessThan(LOAD_TEST_CONFIG.API_RESPONSE_TARGET * 2);
      expect(result.errorRate).toBeLessThan(LOAD_TEST_CONFIG.ERROR_RATE_THRESHOLD);
      expect(result.successfulRequests).toBeGreaterThan(95); // 95% success rate
    });

    it('should handle product API requests efficiently', async () => {
      const productEndpoints = [
        '/api/products',
        '/api/products/flexvolt-6ah',
        '/api/products/flexvolt-9ah',
        '/api/products/flexvolt-15ah'
      ];

      const result = await loadTestManager.runConcurrentRequests(
        productEndpoints,
        200,
        'products'
      );

      expect(result.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.API_RESPONSE_TARGET);
      expect(result.p99ResponseTime).toBeLessThan(LOAD_TEST_CONFIG.API_RESPONSE_TARGET * 3);
      expect(result.errorRate).toBeLessThan(LOAD_TEST_CONFIG.ERROR_RATE_THRESHOLD);
      expect(result.requestsPerSecond).toBeGreaterThan(50);
    });

    it('should handle warehouse API requests across all regions', async () => {
      const warehouseEndpoints = [
        '/api/warehouse/US/metrics',
        '/api/warehouse/JP/metrics', 
        '/api/warehouse/EU/metrics',
        '/api/warehouse/AU/metrics'
      ];

      const result = await loadTestManager.runConcurrentRequests(
        warehouseEndpoints,
        100,
        'warehouse'
      );

      expect(result.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.WAREHOUSE_SYNC_TARGET);
      expect(result.errorRate).toBeLessThan(LOAD_TEST_CONFIG.ERROR_RATE_THRESHOLD);
      expect(result.successfulRequests).toBe(100); // All warehouse requests should succeed
    });

    it('should handle authentication API load', async () => {
      const authEndpoints = [
        '/api/auth/session',
        '/api/customer/auth/verify',
        '/api/supplier/auth/verify'
      ];

      const result = await loadTestManager.runConcurrentRequests(
        authEndpoints,
        150,
        'authentication'
      );

      expect(result.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.API_RESPONSE_TARGET);
      expect(result.errorRate).toBeLessThan(LOAD_TEST_CONFIG.ERROR_RATE_THRESHOLD * 2); // Auth can be slightly higher
    });
  });

  // =============================================================================
  // CONCURRENT USER SIMULATION
  // =============================================================================

  describe('Concurrent User Load Testing', () => {
    it('should support 1000+ concurrent users browsing products', async () => {
      const browsePaths = [
        '/',
        '/customer/products',
        '/customer/products/flexvolt-6ah',
        '/customer/products/flexvolt-9ah',
        '/customer/quiz'
      ];

      const result = await loadTestManager.runConcurrentRequests(
        browsePaths,
        1000,
        'concurrent-browse'
      );

      expect(result.totalRequests).toBe(1000);
      expect(result.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.API_RESPONSE_TARGET * 2); // Allow 2x for high concurrency
      expect(result.errorRate).toBeLessThan(LOAD_TEST_CONFIG.ERROR_RATE_THRESHOLD * 5); // Allow 5x for stress testing
      expect(result.successfulRequests).toBeGreaterThan(950); // 95% success rate under load
    });

    it('should handle concurrent supplier portal usage', async () => {
      const supplierPaths = [
        '/portal/dashboard',
        '/portal/orders',
        '/portal/inventory',
        '/portal/analytics',
        '/portal/warehouse'
      ];

      const result = await loadTestManager.runConcurrentRequests(
        supplierPaths,
        500,
        'supplier-portal'
      );

      expect(result.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.API_RESPONSE_TARGET * 1.5);
      expect(result.errorRate).toBeLessThan(LOAD_TEST_CONFIG.ERROR_RATE_THRESHOLD * 2);
      expect(result.requestsPerSecond).toBeGreaterThan(100);
    });

    it('should maintain performance under mixed workload', async () => {
      const mixedEndpoints = [
        '/', // Homepage - 30%
        '/customer/products', // Product browsing - 25% 
        '/api/products', // API calls - 20%
        '/portal/dashboard', // Portal usage - 15%
        '/api/warehouse/US/metrics', // Warehouse ops - 10%
      ];

      // Simulate realistic distribution
      const requests: string[] = [];
      const weights = [0.3, 0.25, 0.2, 0.15, 0.1];
      
      for (let i = 0; i < 800; i++) {
        const random = Math.random();
        let cumulative = 0;
        for (let j = 0; j < weights.length; j++) {
          cumulative += weights[j];
          if (random < cumulative) {
            requests.push(mixedEndpoints[j]);
            break;
          }
        }
      }

      const result = await loadTestManager.runConcurrentRequests(
        requests,
        800,
        'mixed-workload'
      );

      expect(result.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.API_RESPONSE_TARGET * 1.5);
      expect(result.errorRate).toBeLessThan(LOAD_TEST_CONFIG.ERROR_RATE_THRESHOLD * 3);
      expect(result.successfulRequests).toBeGreaterThan(750); // 93.75% success rate
    });
  });

  // =============================================================================
  // USER JOURNEY TESTING
  // =============================================================================

  describe('User Journey Load Testing', () => {
    it('should handle complete customer purchase journey under load', async () => {
      const purchaseJourney = [
        { url: '/', thinkTime: 2000 },
        { url: '/customer/products', thinkTime: 3000 },
        { url: '/customer/products/flexvolt-9ah', thinkTime: 5000 },
        { url: '/api/cart/add', thinkTime: 1000 },
        { url: '/customer/cart', thinkTime: 3000 },
        { url: '/customer/checkout', thinkTime: 2000 },
        { url: '/api/orders/create', thinkTime: 0 }
      ];

      // Simulate 50 concurrent user journeys
      const journeyPromises = Array.from({ length: 50 }, () => 
        loadTestManager.simulateUserJourney(purchaseJourney)
      );

      const journeyResults = await Promise.all(journeyPromises);
      const successfulJourneys = journeyResults.filter(j => j.success).length;
      const averageJourneyTime = journeyResults.reduce((sum, j) => sum + j.totalJourneyTime, 0) / journeyResults.length;

      expect(successfulJourneys).toBeGreaterThan(45); // 90% journey completion
      expect(averageJourneyTime).toBeLessThan(60000); // Under 1 minute average
    });

    it('should handle supplier workflow journeys efficiently', async () => {
      const supplierJourney = [
        { url: '/portal/dashboard', thinkTime: 2000 },
        { url: '/portal/warehouse', thinkTime: 3000 },
        { url: '/api/warehouse/US/metrics', thinkTime: 1000 },
        { url: '/portal/orders', thinkTime: 2000 },
        { url: '/api/orders/pending', thinkTime: 1000 },
        { url: '/portal/analytics', thinkTime: 3000 },
        { url: '/api/analytics/performance', thinkTime: 0 }
      ];

      const journeyPromises = Array.from({ length: 25 }, () => 
        loadTestManager.simulateUserJourney(supplierJourney)
      );

      const journeyResults = await Promise.all(journeyPromises);
      const successfulJourneys = journeyResults.filter(j => j.success).length;

      expect(successfulJourneys).toBeGreaterThan(22); // 88% completion for complex workflows
    });
  });

  // =============================================================================
  // REAL-TIME FEATURES TESTING
  // =============================================================================

  describe('Real-time Features Load Testing', () => {
    it('should handle multiple WebSocket connections efficiently', async () => {
      const result = await loadTestManager.testWebSocketConnections(100, 10000); // 100 connections for 10 seconds

      expect(result.connectionsEstablished).toBeGreaterThan(95); // 95% connection success
      expect(result.averageLatency).toBeLessThan(LOAD_TEST_CONFIG.WEBSOCKET_MESSAGE_TARGET);
      expect(result.connectionsDropped).toBeLessThan(5); // Less than 5% drop rate
      expect(result.messagesExchanged).toBeGreaterThan(500); // Should exchange many messages
    });

    it('should maintain WebSocket performance under load', async () => {
      const result = await loadTestManager.testWebSocketConnections(200, 15000); // 200 connections for 15 seconds

      expect(result.connectionsEstablished).toBeGreaterThan(180); // 90% under higher load
      expect(result.averageLatency).toBeLessThan(LOAD_TEST_CONFIG.WEBSOCKET_MESSAGE_TARGET * 2); // Allow 2x under load
      expect(result.connectionsDropped).toBeLessThan(20); // Less than 10% drop rate
    });
  });

  // =============================================================================
  // SPIKE TRAFFIC TESTING
  // =============================================================================

  describe('Spike Traffic Handling', () => {
    it('should handle sudden traffic spikes gracefully', async () => {
      // Start with normal load
      const normalLoad = loadTestManager.runConcurrentRequests(['/'], 50, 'normal');
      
      // Wait for normal load to establish
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create traffic spike
      const spike = loadTestManager.runConcurrentRequests(['/'], 500, 'spike');
      
      const [normalResult, spikeResult] = await Promise.all([normalLoad, spike]);

      // Normal load should complete successfully
      expect(normalResult.errorRate).toBeLessThan(LOAD_TEST_CONFIG.ERROR_RATE_THRESHOLD);
      
      // Spike should be handled without complete failure
      expect(spikeResult.errorRate).toBeLessThan(0.1); // Allow 10% error rate during spike
      expect(spikeResult.successfulRequests).toBeGreaterThan(400); // 80% success during spike
    });

    it('should recover quickly after traffic spike', async () => {
      // Create and resolve spike
      await loadTestManager.runConcurrentRequests(['/'], 800, 'recovery-spike');
      
      // Wait for recovery
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test post-spike performance
      const recoveryResult = await loadTestManager.runConcurrentRequests(['/'], 100, 'post-spike');
      
      expect(recoveryResult.averageResponseTime).toBeLessThan(LOAD_TEST_CONFIG.API_RESPONSE_TARGET * 1.2);
      expect(recoveryResult.errorRate).toBeLessThan(LOAD_TEST_CONFIG.ERROR_RATE_THRESHOLD);
    });
  });

  // =============================================================================
  // LONG-DURATION TESTING
  // =============================================================================

  describe('Sustained Load Testing', () => {
    it('should maintain performance over extended periods', async () => {
      const duration = 30000; // 30 seconds
      const interval = 1000; // 1 second intervals
      const iterations = duration / interval;
      const results: any[] = [];

      for (let i = 0; i < iterations; i++) {
        const result = await loadTestManager.runConcurrentRequests(['/'], 50, `sustained-${i}`);
        results.push(result);
        
        // Small delay between iterations
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Analyze performance over time
      const averageResponseTimes = results.map(r => r.averageResponseTime);
      const errorRates = results.map(r => r.errorRate);
      
      const overallAverage = averageResponseTimes.reduce((a, b) => a + b, 0) / averageResponseTimes.length;
      const maxErrorRate = Math.max(...errorRates);
      
      // Performance should remain stable
      expect(overallAverage).toBeLessThan(LOAD_TEST_CONFIG.API_RESPONSE_TARGET * 1.3);
      expect(maxErrorRate).toBeLessThan(LOAD_TEST_CONFIG.ERROR_RATE_THRESHOLD * 3);
      
      // Performance shouldn't degrade significantly over time
      const firstHalf = averageResponseTimes.slice(0, Math.floor(averageResponseTimes.length / 2));
      const secondHalf = averageResponseTimes.slice(Math.floor(averageResponseTimes.length / 2));
      
      const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.2); // Max 20% degradation
    }, 45000); // 45 second timeout
  });

  // =============================================================================
  // PERFORMANCE MONITORING VERIFICATION
  // =============================================================================

  describe('Performance Monitoring Integration', () => {
    it('should accurately track load test metrics', async () => {
      await loadTestManager.runConcurrentRequests(['/'], 100, 'monitoring-test');
      
      const stats = performanceMonitor.getStats();
      const healthCheck = performanceMonitor.getHealthCheck();
      
      expect(stats.totalRequests).toBeGreaterThan(0);
      expect(stats.averageResponseTime).toBeGreaterThan(0);
      expect(healthCheck.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthCheck.status);
    });

    it('should generate comprehensive performance reports', async () => {
      // Run various load tests
      await Promise.all([
        loadTestManager.runConcurrentRequests(['/'], 50, 'report-test-1'),
        loadTestManager.runConcurrentRequests(['/api/products'], 30, 'report-test-2'),
        loadTestManager.runConcurrentRequests(['/portal/dashboard'], 20, 'report-test-3')
      ]);
      
      const exportedMetrics = performanceMonitor.exportMetrics('json');
      const metricsData = JSON.parse(exportedMetrics);
      
      expect(metricsData.metrics).toBeDefined();
      expect(metricsData.stats).toBeDefined();
      expect(metricsData.health).toBeDefined();
      expect(metricsData.timestamp).toBeDefined();
    });
  });
});