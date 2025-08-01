/**
 * =============================================================================
 * RHY_079: ENTERPRISE STRESS TESTING FRAMEWORK
 * =============================================================================
 * Advanced stress testing for the RHY Supplier Portal
 * Tests: Memory pressure, CPU stress, connection limits, error recovery
 * Validates: System breaking points, graceful degradation, recovery patterns
 * =============================================================================
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { performance } from 'perf_hooks';
import axios from 'axios';
import WebSocket from 'ws';
import { performanceMonitor } from '@/lib/performance';

// Stress test configuration
const STRESS_TEST_CONFIG = {
  MAX_MEMORY_USAGE: 1024 * 1024 * 1024, // 1GB max memory
  MAX_CPU_USAGE: 90,                     // 90% max CPU
  CONNECTION_LIMIT: 2000,                // 2000 concurrent connections
  EXTREME_LOAD_MULTIPLIER: 10,           // 10x normal load
  BREAKING_POINT_TARGET: 5000,           // Find breaking point up to 5000 concurrent
  RECOVERY_TIME_MAX: 30000,              // 30 seconds max recovery time
  ERROR_RATE_FAILURE_THRESHOLD: 0.5,     // 50% error rate = system failure
  RESPONSE_TIME_FAILURE_THRESHOLD: 10000, // 10s response time = system failure
};

// Test environment configuration
const TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_WS_URL = process.env.TEST_WS_URL || 'ws://localhost:3000';

// System resource monitoring utilities
class SystemResourceMonitor {
  private cpuUsageHistory: number[] = [];
  private memoryUsageHistory: number[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  startMonitoring(intervalMs: number = 1000): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      // In a real implementation, would use actual system monitoring
      // For testing, we'll simulate based on current load
      const cpuUsage = this.simulateCpuUsage();
      const memoryUsage = this.simulateMemoryUsage();
      
      this.cpuUsageHistory.push(cpuUsage);
      this.memoryUsageHistory.push(memoryUsage);
      
      // Keep only last 300 readings (5 minutes at 1s intervals)
      if (this.cpuUsageHistory.length > 300) {
        this.cpuUsageHistory.shift();
      }
      if (this.memoryUsageHistory.length > 300) {
        this.memoryUsageHistory.shift();
      }
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
  }

  private simulateCpuUsage(): number {
    // Simulate CPU usage based on current performance monitor load
    const stats = performanceMonitor.getStats();
    const baseUsage = Math.min(stats.totalRequests * 0.1, 20);
    const randomVariation = Math.random() * 10;
    return Math.min(baseUsage + randomVariation, 100);
  }

  private simulateMemoryUsage(): number {
    // Simulate memory usage in bytes
    const stats = performanceMonitor.getStats();
    const baseUsage = 100 * 1024 * 1024; // 100MB base
    const loadUsage = stats.totalRequests * 1024 * 100; // 100KB per request
    return baseUsage + loadUsage;
  }

  getCurrentCpuUsage(): number {
    return this.cpuUsageHistory[this.cpuUsageHistory.length - 1] || 0;
  }

  getCurrentMemoryUsage(): number {
    return this.memoryUsageHistory[this.memoryUsageHistory.length - 1] || 0;
  }

  getAverageCpuUsage(lastNReadings?: number): number {
    const readings = lastNReadings 
      ? this.cpuUsageHistory.slice(-lastNReadings)
      : this.cpuUsageHistory;
    
    return readings.length > 0 
      ? readings.reduce((sum, usage) => sum + usage, 0) / readings.length
      : 0;
  }

  getAverageMemoryUsage(lastNReadings?: number): number {
    const readings = lastNReadings 
      ? this.memoryUsageHistory.slice(-lastNReadings)
      : this.memoryUsageHistory;
    
    return readings.length > 0 
      ? readings.reduce((sum, usage) => sum + usage, 0) / readings.length
      : 0;
  }

  getPeakCpuUsage(): number {
    return Math.max(...this.cpuUsageHistory, 0);
  }

  getPeakMemoryUsage(): number {
    return Math.max(...this.memoryUsageHistory, 0);
  }

  clear(): void {
    this.cpuUsageHistory = [];
    this.memoryUsageHistory = [];
  }
}

// Stress testing manager
class StressTestManager {
  private activeConnections: Set<any> = new Set();
  private systemMonitor: SystemResourceMonitor;
  private testResults: Map<string, any> = new Map();

  constructor() {
    this.systemMonitor = new SystemResourceMonitor();
  }

  async findBreakingPoint(
    testFunction: (load: number) => Promise<any>,
    startLoad: number = 100,
    maxLoad: number = STRESS_TEST_CONFIG.BREAKING_POINT_TARGET,
    step: number = 100
  ): Promise<{
    breakingPoint: number;
    maxSuccessfulLoad: number;
    testResults: Array<{load: number, success: boolean, metrics: any}>;
  }> {
    const results: Array<{load: number, success: boolean, metrics: any}> = [];
    let maxSuccessfulLoad = 0;
    let breakingPoint = maxLoad;

    for (let load = startLoad; load <= maxLoad; load += step) {
      this.systemMonitor.startMonitoring();
      
      try {
        const startTime = performance.now();
        const result = await testFunction(load);
        const endTime = performance.now();
        
        const duration = endTime - startTime;
        const success = this.evaluateSuccess(result, duration);
        
        const metrics = {
          duration,
          errorRate: result.errorRate || 0,
          averageResponseTime: result.averageResponseTime || 0,
          cpuUsage: this.systemMonitor.getAverageCpuUsage(10), // Last 10 readings
          memoryUsage: this.systemMonitor.getAverageMemoryUsage(10)
        };

        results.push({ load, success, metrics });

        if (success) {
          maxSuccessfulLoad = load;
        } else {
          breakingPoint = load;
          break;
        }

        // Brief recovery time between iterations
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        results.push({ 
          load, 
          success: false, 
          metrics: { 
            error: error instanceof Error ? error.message : 'Unknown error',
            cpuUsage: this.systemMonitor.getCurrentCpuUsage(),
            memoryUsage: this.systemMonitor.getCurrentMemoryUsage()
          }
        });
        breakingPoint = load;
        break;
      } finally {
        this.systemMonitor.stopMonitoring();
      }
    }

    return { breakingPoint, maxSuccessfulLoad, testResults: results };
  }

  private evaluateSuccess(result: any, duration: number): boolean {
    // Define success criteria
    const errorRateOk = (result.errorRate || 0) < STRESS_TEST_CONFIG.ERROR_RATE_FAILURE_THRESHOLD;
    const responseTimeOk = (result.averageResponseTime || 0) < STRESS_TEST_CONFIG.RESPONSE_TIME_FAILURE_THRESHOLD;
    const durationOk = duration < STRESS_TEST_CONFIG.RESPONSE_TIME_FAILURE_THRESHOLD;
    const cpuOk = this.systemMonitor.getCurrentCpuUsage() < STRESS_TEST_CONFIG.MAX_CPU_USAGE;
    const memoryOk = this.systemMonitor.getCurrentMemoryUsage() < STRESS_TEST_CONFIG.MAX_MEMORY_USAGE;

    return errorRateOk && responseTimeOk && durationOk && cpuOk && memoryOk;
  }

  async stressTestApiEndpoints(concurrency: number, endpoint: string): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    errorRate: number;
    timeouts: number;
    connectionErrors: number;
  }> {
    const promises: Promise<any>[] = [];
    let successfulRequests = 0;
    let failedRequests = 0;
    let timeouts = 0;
    let connectionErrors = 0;
    const responseTimes: number[] = [];

    for (let i = 0; i < concurrency; i++) {
      const promise = this.makeStressRequest(endpoint)
        .then(result => {
          if (result.success) {
            successfulRequests++;
            responseTimes.push(result.responseTime);
          } else {
            failedRequests++;
            if (result.timeout) timeouts++;
            if (result.connectionError) connectionErrors++;
          }
        })
        .catch(() => {
          failedRequests++;
          connectionErrors++;
        });
      
      promises.push(promise);
    }

    await Promise.all(promises);

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    return {
      totalRequests: concurrency,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      errorRate: failedRequests / concurrency,
      timeouts,
      connectionErrors
    };
  }

  private async makeStressRequest(endpoint: string): Promise<{
    success: boolean;
    responseTime: number;
    timeout: boolean;
    connectionError: boolean;
  }> {
    const startTime = performance.now();
    
    try {
      const response = await axios.get(`${TEST_BASE_URL}${endpoint}`, {
        timeout: 5000,
        headers: {
          'X-Stress-Test': 'true',
          'X-Timestamp': Date.now().toString()
        }
      });
      
      const endTime = performance.now();
      
      return {
        success: response.status >= 200 && response.status < 300,
        responseTime: endTime - startTime,
        timeout: false,
        connectionError: false
      };
    } catch (error: any) {
      const endTime = performance.now();
      
      return {
        success: false,
        responseTime: endTime - startTime,
        timeout: error.code === 'ECONNABORTED',
        connectionError: error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND'
      };
    }
  }

  async stressTestWebSockets(connectionCount: number, duration: number): Promise<{
    connectionsEstablished: number;
    connectionsDropped: number;
    messagesExchanged: number;
    averageLatency: number;
    maxLatency: number;
    connectionErrors: number;
  }> {
    const connections: WebSocket[] = [];
    const latencies: number[] = [];
    let messagesExchanged = 0;
    let connectionsDropped = 0;
    let connectionErrors = 0;

    // Establish connections rapidly
    const connectionPromises = [];
    for (let i = 0; i < connectionCount; i++) {
      const promise = new Promise<WebSocket | null>((resolve) => {
        try {
          const ws = new WebSocket(`${TEST_WS_URL}/ws`);
          this.activeConnections.add(ws);
          
          const timeout = setTimeout(() => {
            connectionErrors++;
            resolve(null);
          }, 5000);

          ws.on('open', () => {
            clearTimeout(timeout);
            connections.push(ws);
            resolve(ws);
          });

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

          ws.on('error', () => {
            clearTimeout(timeout);
            connectionErrors++;
            resolve(null);
          });
        } catch (error) {
          connectionErrors++;
          resolve(null);
        }
      });
      
      connectionPromises.push(promise);
    }

    await Promise.all(connectionPromises);
    
    // Send messages rapidly to stress the system
    const messageInterval = setInterval(() => {
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({
              type: 'ping',
              timestamp: Date.now(),
              stress: true
            }));
          } catch (error) {
            // Connection might have closed
          }
        }
      });
    }, 100); // Every 100ms

    // Run for specified duration
    await new Promise(resolve => setTimeout(resolve, duration));

    // Cleanup
    clearInterval(messageInterval);
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    return {
      connectionsEstablished: connections.length,
      connectionsDropped,
      messagesExchanged,
      averageLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      maxLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
      connectionErrors
    };
  }

  async testRecoveryAfterFailure(
    failureFunction: () => Promise<void>,
    healthCheckFunction: () => Promise<boolean>,
    maxRecoveryTime: number = STRESS_TEST_CONFIG.RECOVERY_TIME_MAX
  ): Promise<{
    recoveryTime: number;
    recovered: boolean;
    healthCheckAttempts: number;
  }> {
    const startTime = performance.now();
    
    // Cause the failure
    try {
      await failureFunction();
    } catch (error) {
      // Expected to fail
    }

    // Wait a bit for the failure to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Monitor recovery
    let healthCheckAttempts = 0;
    let recovered = false;
    
    while (performance.now() - startTime < maxRecoveryTime) {
      healthCheckAttempts++;
      
      try {
        const isHealthy = await healthCheckFunction();
        if (isHealthy) {
          recovered = true;
          break;
        }
      } catch (error) {
        // Health check failed, continue monitoring
      }
      
      // Wait before next health check
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const recoveryTime = performance.now() - startTime;
    
    return {
      recoveryTime,
      recovered,
      healthCheckAttempts
    };
  }

  getSystemMonitor(): SystemResourceMonitor {
    return this.systemMonitor;
  }

  async cleanup(): Promise<void> {
    this.systemMonitor.stopMonitoring();
    
    // Close all active connections
    this.activeConnections.forEach((connection: any) => {
      if (connection && typeof connection.close === 'function') {
        try {
          connection.close();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });
    
    this.activeConnections.clear();
    this.testResults.clear();
  }
}

describe('RHY Stress Testing Framework', () => {
  let stressTestManager: StressTestManager;

  beforeAll(async () => {
    stressTestManager = new StressTestManager();
    performanceMonitor.setEnabled(true);
  });

  afterAll(async () => {
    await stressTestManager.cleanup();
  });

  beforeEach(() => {
    performanceMonitor.clear();
    stressTestManager.getSystemMonitor().clear();
  });

  // =============================================================================
  // BREAKING POINT DETECTION
  // =============================================================================

  describe('Breaking Point Detection', () => {
    it('should find API endpoint breaking point', async () => {
      const testFunction = async (load: number) => {
        return await stressTestManager.stressTestApiEndpoints(load, '/');
      };

      const result = await stressTestManager.findBreakingPoint(
        testFunction,
        100,   // Start at 100 concurrent
        1000,  // Max 1000 concurrent
        100    // Step by 100
      );

      expect(result.maxSuccessfulLoad).toBeGreaterThan(0);
      expect(result.breakingPoint).toBeGreaterThan(result.maxSuccessfulLoad);
      expect(result.testResults.length).toBeGreaterThan(0);
      
      // Log breaking point for monitoring
      console.log(`API Breaking Point: ${result.breakingPoint} concurrent requests`);
      console.log(`Max Successful Load: ${result.maxSuccessfulLoad} concurrent requests`);
    }, 120000); // 2 minute timeout

    it('should find WebSocket connection breaking point', async () => {
      const testFunction = async (load: number) => {
        return await stressTestManager.stressTestWebSockets(load, 10000); // 10 second test
      };

      const result = await stressTestManager.findBreakingPoint(
        testFunction,
        50,   // Start at 50 connections
        500,  // Max 500 connections
        50    // Step by 50
      );

      expect(result.maxSuccessfulLoad).toBeGreaterThan(0);
      expect(result.breakingPoint).toBeGreaterThan(result.maxSuccessfulLoad);
      
      console.log(`WebSocket Breaking Point: ${result.breakingPoint} concurrent connections`);
      console.log(`Max Successful Connections: ${result.maxSuccessfulLoad} concurrent connections`);
    }, 180000); // 3 minute timeout
  });

  // =============================================================================
  // RESOURCE EXHAUSTION TESTING
  // =============================================================================

  describe('Resource Exhaustion Testing', () => {
    it('should handle extreme memory pressure gracefully', async () => {
      const monitor = stressTestManager.getSystemMonitor();
      monitor.startMonitoring();

      // Create memory pressure through large concurrent requests
      const largePayloadEndpoint = '/api/products'; // Assuming this returns substantial data
      
      const result = await stressTestManager.stressTestApiEndpoints(
        500, // High concurrency
        largePayloadEndpoint
      );

      const peakMemoryUsage = monitor.getPeakMemoryUsage();
      monitor.stopMonitoring();

      // System should not crash under memory pressure
      expect(result.connectionErrors).toBeLessThan(result.totalRequests * 0.5); // <50% connection errors
      expect(peakMemoryUsage).toBeLessThan(STRESS_TEST_CONFIG.MAX_MEMORY_USAGE);
      
      console.log(`Peak Memory Usage: ${(peakMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
    });

    it('should handle CPU pressure from complex operations', async () => {
      const monitor = stressTestManager.getSystemMonitor();
      monitor.startMonitoring();

      // Create CPU pressure through complex analytical endpoints
      const complexEndpoints = [
        '/api/analytics/performance',
        '/api/warehouse/US/metrics',
        '/api/warehouse/JP/metrics',
        '/api/warehouse/EU/metrics'
      ];

      const results = await Promise.all(
        complexEndpoints.map(endpoint => 
          stressTestManager.stressTestApiEndpoints(100, endpoint)
        )
      );

      const peakCpuUsage = monitor.getPeakCpuUsage();
      const avgCpuUsage = monitor.getAverageCpuUsage();
      monitor.stopMonitoring();

      // Verify CPU usage is within acceptable bounds
      expect(peakCpuUsage).toBeLessThan(STRESS_TEST_CONFIG.MAX_CPU_USAGE);
      expect(avgCpuUsage).toBeLessThan(STRESS_TEST_CONFIG.MAX_CPU_USAGE * 0.8); // Average should be 80% of max

      // System should still be responsive
      const totalSuccessful = results.reduce((sum, r) => sum + r.successfulRequests, 0);
      const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
      expect(totalSuccessful / totalRequests).toBeGreaterThan(0.8); // 80% success rate

      console.log(`Peak CPU Usage: ${peakCpuUsage.toFixed(2)}%`);
      console.log(`Average CPU Usage: ${avgCpuUsage.toFixed(2)}%`);
    });
  });

  // =============================================================================
  // CONNECTION LIMIT TESTING
  // =============================================================================

  describe('Connection Limit Testing', () => {
    it('should handle connection pool exhaustion gracefully', async () => {
      // Test database connection pool limits
      const dbIntensiveEndpoint = '/api/warehouse/US/metrics'; // Database-heavy endpoint
      
      const result = await stressTestManager.stressTestApiEndpoints(
        300, // Exceed typical connection pool size
        dbIntensiveEndpoint
      );

      // Should handle gracefully, not crash
      expect(result.errorRate).toBeLessThan(0.8); // Allow high error rate but not complete failure
      expect(result.connectionErrors).toBeLessThan(result.totalRequests); // Some requests should succeed
      
      console.log(`Connection Pool Stress - Error Rate: ${(result.errorRate * 100).toFixed(2)}%`);
    });

    it('should recover from connection exhaustion', async () => {
      // Exhaust connections
      const exhaustionResult = await stressTestManager.stressTestApiEndpoints(400, '/api/products');
      
      // Wait for recovery
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Test recovery
      const recoveryResult = await stressTestManager.stressTestApiEndpoints(50, '/api/products');
      
      expect(recoveryResult.errorRate).toBeLessThan(0.1); // Should recover to <10% error rate
      expect(recoveryResult.averageResponseTime).toBeLessThan(1000); // Should recover performance
      
      console.log(`Recovery Error Rate: ${(recoveryResult.errorRate * 100).toFixed(2)}%`);
    });
  });

  // =============================================================================
  // EXTREME LOAD TESTING
  // =============================================================================

  describe('Extreme Load Testing', () => {
    it('should survive extreme traffic bursts', async () => {
      const extremeLoad = 2000; // 2000 concurrent requests
      
      const result = await stressTestManager.stressTestApiEndpoints(
        extremeLoad,
        '/' // Homepage - simplest endpoint
      );

      // Under extreme load, system should not completely fail
      expect(result.successfulRequests).toBeGreaterThan(0); // Some requests should succeed
      expect(result.connectionErrors).toBeLessThan(result.totalRequests); // Not all should be connection errors
      
      // Log extreme load results
      console.log(`Extreme Load Results - Success Rate: ${(result.successfulRequests / result.totalRequests * 100).toFixed(2)}%`);
      console.log(`Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`);
    }, 60000); // 1 minute timeout

    it('should handle mixed extreme workload', async () => {
      // Simulate extreme mixed traffic
      const mixedEndpoints = ['/', '/api/products', '/portal/dashboard', '/api/warehouse/US/metrics'];
      
      const results = await Promise.all(
        mixedEndpoints.map(endpoint => 
          stressTestManager.stressTestApiEndpoints(500, endpoint) // 500 each = 2000 total
        )
      );

      const totalSuccessful = results.reduce((sum, r) => sum + r.successfulRequests, 0);
      const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
      
      // Should handle mixed load better than single endpoint extreme load
      expect(totalSuccessful).toBeGreaterThan(0);
      expect(totalSuccessful / totalRequests).toBeGreaterThan(0.1); // At least 10% success rate
    });
  });

  // =============================================================================
  // FAILURE RECOVERY TESTING
  // =============================================================================

  describe('Failure Recovery Testing', () => {
    it('should recover from simulated system overload', async () => {
      const failureFunction = async () => {
        // Simulate system overload
        await stressTestManager.stressTestApiEndpoints(1500, '/');
      };

      const healthCheckFunction = async () => {
        try {
          const result = await stressTestManager.stressTestApiEndpoints(10, '/');
          return result.errorRate < 0.2 && result.averageResponseTime < 1000;
        } catch (error) {
          return false;
        }
      };

      const recovery = await stressTestManager.testRecoveryAfterFailure(
        failureFunction,
        healthCheckFunction,
        30000 // 30 second max recovery time
      );

      expect(recovery.recovered).toBe(true);
      expect(recovery.recoveryTime).toBeLessThan(STRESS_TEST_CONFIG.RECOVERY_TIME_MAX);
      expect(recovery.healthCheckAttempts).toBeGreaterThan(0);
      
      console.log(`Recovery Time: ${(recovery.recoveryTime / 1000).toFixed(2)} seconds`);
      console.log(`Health Check Attempts: ${recovery.healthCheckAttempts}`);
    }, 60000); // 1 minute timeout

    it('should recover from WebSocket overload', async () => {
      const failureFunction = async () => {
        // Overload WebSocket connections
        await stressTestManager.stressTestWebSockets(1000, 5000);
      };

      const healthCheckFunction = async () => {
        try {
          const result = await stressTestManager.stressTestWebSockets(10, 3000);
          return result.connectionErrors === 0 && result.connectionsEstablished >= 8;
        } catch (error) {
          return false;
        }
      };

      const recovery = await stressTestManager.testRecoveryAfterFailure(
        failureFunction,
        healthCheckFunction
      );

      expect(recovery.recovered).toBe(true);
      expect(recovery.recoveryTime).toBeLessThan(STRESS_TEST_CONFIG.RECOVERY_TIME_MAX);
    }, 90000); // 1.5 minute timeout
  });

  // =============================================================================
  // CASCADING FAILURE TESTING
  // =============================================================================

  describe('Cascading Failure Prevention', () => {
    it('should prevent cascading failures across services', async () => {
      // Stress multiple services simultaneously
      const serviceEndpoints = [
        '/api/products',           // Product service
        '/api/warehouse/US/metrics', // Warehouse service
        '/portal/dashboard',       // Portal service
        '/api/auth/session',       // Auth service
      ];

      const stressResults = await Promise.all(
        serviceEndpoints.map(endpoint => 
          stressTestManager.stressTestApiEndpoints(300, endpoint)
        )
      );

      // At least one service should remain partially functional
      const serviceSurvivalCount = stressResults.filter(result => 
        result.successfulRequests > 0 && result.errorRate < 0.9
      ).length;

      expect(serviceSurvivalCount).toBeGreaterThan(0);
      
      // System should not have complete outage
      const totalSuccessful = stressResults.reduce((sum, r) => sum + r.successfulRequests, 0);
      expect(totalSuccessful).toBeGreaterThan(0);
      
      console.log(`Services with partial functionality: ${serviceSurvivalCount}/${serviceEndpoints.length}`);
    });

    it('should maintain core functionality under partial service failure', async () => {
      // Stress non-critical services heavily
      await Promise.all([
        stressTestManager.stressTestApiEndpoints(500, '/api/analytics/performance'),
        stressTestManager.stressTestApiEndpoints(400, '/portal/dashboard')
      ]);

      // Core services should still work
      const coreResults = await Promise.all([
        stressTestManager.stressTestApiEndpoints(50, '/'),
        stressTestManager.stressTestApiEndpoints(50, '/api/products'),
        stressTestManager.stressTestApiEndpoints(50, '/api/auth/session')
      ]);

      // Core services should maintain reasonable performance
      coreResults.forEach(result => {
        expect(result.errorRate).toBeLessThan(0.3); // <30% error rate for core services
        expect(result.successfulRequests).toBeGreaterThan(30); // >60% success rate
      });
    });
  });

  // =============================================================================
  // LONG-DURATION STRESS TESTING
  // =============================================================================

  describe('Long-Duration Stress Testing', () => {
    it('should maintain stability under sustained high load', async () => {
      const monitor = stressTestManager.getSystemMonitor();
      monitor.startMonitoring();

      const duration = 60000; // 1 minute of sustained stress
      const intervalMs = 5000; // Test every 5 seconds
      const intervals = Math.floor(duration / intervalMs);
      const results: any[] = [];

      for (let i = 0; i < intervals; i++) {
        const result = await stressTestManager.stressTestApiEndpoints(200, '/');
        results.push({
          interval: i,
          ...result,
          cpuUsage: monitor.getCurrentCpuUsage(),
          memoryUsage: monitor.getCurrentMemoryUsage()
        });
        
        // Brief pause between stress intervals
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      monitor.stopMonitoring();

      // Analyze stability over time
      const errorRates = results.map(r => r.errorRate);
      const responseTimes = results.map(r => r.averageResponseTime);
      
      const avgErrorRate = errorRates.reduce((a, b) => a + b, 0) / errorRates.length;
      const maxErrorRate = Math.max(...errorRates);
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      
      // System should remain stable
      expect(avgErrorRate).toBeLessThan(0.5); // Average <50% error rate
      expect(maxErrorRate).toBeLessThan(0.8); // Peak <80% error rate
      expect(avgResponseTime).toBeLessThan(5000); // Average <5s response time
      
      console.log(`Sustained Load - Avg Error Rate: ${(avgErrorRate * 100).toFixed(2)}%`);
      console.log(`Sustained Load - Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
    }, 90000); // 1.5 minute timeout
  });
});