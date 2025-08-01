/**
 * RHY_074: Health API Endpoint Tests
 * Integration tests for health check API endpoints
 * Tests request handling, response formatting, and error scenarios
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/supplier/health/route';
import { healthCheckService } from '@/services/monitoring/HealthCheckService';
import { monitoringService } from '@/lib/monitoring';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/services/monitoring/HealthCheckService');
jest.mock('@/lib/monitoring');
jest.mock('@/lib/logger');

const mockHealthCheckService = healthCheckService as jest.Mocked<typeof healthCheckService>;
const mockMonitoringService = monitoringService as jest.Mocked<typeof monitoringService>;
const mockLogger = logger as jest.Mocked<typeof logger>;

// Helper function to create mock requests
function createMockRequest(url: string, options: Partial<RequestInit> = {}): NextRequest {
  const headers = new Headers({
    'user-agent': 'test-agent',
    'content-type': 'application/json',
    ...(options.headers as any || {})
  });
  
  return new NextRequest(url, {
    method: options.method || 'GET',
    headers,
    body: options.body
  });
}

// Mock system health data
const mockSystemHealth = {
  overall: 'healthy' as const,
  services: [
    {
      service: 'database',
      status: 'healthy' as const,
      responseTime: 25.5,
      uptime: 99.95,
      errorRate: 0.05,
      lastCheck: new Date(),
      details: { connections: 15 },
      dependencies: [
        { name: 'primary_db', status: 'healthy' as const, responseTime: 20 },
        { name: 'rhy_db', status: 'healthy' as const, responseTime: 30 }
      ],
      alerts: []
    },
    {
      service: 'authentication',
      status: 'degraded' as const,
      responseTime: 85.3,
      uptime: 99.2,
      errorRate: 0.8,
      lastCheck: new Date(),
      details: { connections: 250 },
      dependencies: [
        { name: 'jwt_service', status: 'healthy' as const, responseTime: 15 },
        { name: 'session_store', status: 'degraded' as const, responseTime: 120 },
        { name: 'mfa_service', status: 'healthy' as const, responseTime: 25 }
      ],
      alerts: [
        {
          severity: 'warning' as const,
          message: 'Authentication response time is elevated',
          timestamp: new Date()
        }
      ]
    }
  ],
  metrics: {
    totalServices: 2,
    healthyServices: 1,
    degradedServices: 1,
    unhealthyServices: 0,
    averageResponseTime: 55.4,
    overallUptime: 99.575
  },
  recommendations: [
    {
      priority: 'medium' as const,
      service: 'authentication',
      issue: 'Elevated response time',
      recommendation: 'Monitor trends, consider performance tuning',
      estimatedImpact: 'Slightly slower response times'
    }
  ],
  lastUpdate: new Date()
};

const mockServiceHealth = {
  service: 'database',
  status: 'healthy' as const,
  responseTime: 25.5,
  uptime: 99.95,
  errorRate: 0.05,
  lastCheck: new Date(),
  details: { connections: 15, memoryUsage: 65 },
  dependencies: [
    { name: 'primary_db', status: 'healthy' as const, responseTime: 20 },
    { name: 'rhy_db', status: 'healthy' as const, responseTime: 30 }
  ],
  alerts: []
};

describe('/api/supplier/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockHealthCheckService.getSystemHealth = jest.fn().mockResolvedValue(mockSystemHealth);
    mockHealthCheckService.getServiceHealth = jest.fn().mockResolvedValue(mockServiceHealth);
    mockMonitoringService.recordMetric = jest.fn().mockResolvedValue(undefined);
    mockMonitoringService.getActiveAlerts = jest.fn().mockResolvedValue([]);
    mockLogger.info = jest.fn();
    mockLogger.error = jest.fn();
  });

  describe('GET /api/supplier/health', () => {
    describe('System Health Requests', () => {
      it('should return comprehensive system health overview', async () => {
        const request = createMockRequest('http://localhost:3000/api/supplier/health');
        
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.health).toEqual(mockSystemHealth);
        expect(data.timestamp).toBeDefined();
        expect(data.responseTime).toBeDefined();

        expect(mockHealthCheckService.getSystemHealth).toHaveBeenCalledTimes(1);
        expect(mockMonitoringService.recordMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            operation: 'health_check_api_system',
            success: true
          })
        );
      });

      it('should include metrics when requested', async () => {
        const mockAlerts = [
          {
            id: 'alert1',
            ruleId: 'rule1',
            message: 'High response time detected',
            severity: 'warning' as const,
            currentValue: 150,
            threshold: 100,
            isResolved: false,
            createdAt: new Date()
          }
        ];
        
        mockMonitoringService.getActiveAlerts = jest.fn().mockResolvedValue(mockAlerts);
        
        const request = createMockRequest(
          'http://localhost:3000/api/supplier/health?includeMetrics=true'
        );
        
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.alerts).toBeDefined();
        expect(data.alerts).toHaveLength(1);
        expect(data.alerts[0].message).toBe('High response time detected');

        expect(mockMonitoringService.getActiveAlerts).toHaveBeenCalledWith({
          resolved: false
        });
      });

      it('should log request details', async () => {
        const request = createMockRequest('http://localhost:3000/api/supplier/health');
        
        await GET(request);

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Health check API request',
          expect.objectContaining({
            query: {},
            userAgent: 'test-agent'
          })
        );

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Health check API completed successfully',
          expect.objectContaining({
            overall: 'healthy',
            serviceCount: 2,
            healthyServices: 1
          })
        );
      });
    });

    describe('Service-Specific Health Requests', () => {
      it('should return health status for specific service', async () => {
        const request = createMockRequest(
          'http://localhost:3000/api/supplier/health?service=database'
        );
        
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.service).toEqual(mockServiceHealth);
        expect(data.timestamp).toBeDefined();
        expect(data.responseTime).toBeDefined();

        expect(mockHealthCheckService.getServiceHealth).toHaveBeenCalledWith('database');
        expect(mockMonitoringService.recordMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            operation: 'health_check_api_service',
            success: true,
            metadata: expect.objectContaining({
              service: 'database',
              status: 'healthy'
            })
          })
        );
      });

      it('should handle invalid service names', async () => {
        mockHealthCheckService.getServiceHealth = jest.fn()
          .mockRejectedValue(new Error('Unknown service: invalid_service'));
        
        const request = createMockRequest(
          'http://localhost:3000/api/supplier/health?service=invalid_service'
        );
        
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Internal server error');

        expect(mockMonitoringService.recordMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            operation: 'health_check_api_service',
            success: false,
            error: 'Unknown service: invalid_service'
          })
        );
      });
    });

    describe('Query Parameter Validation', () => {
      it('should parse detailed parameter correctly', async () => {
        const request = createMockRequest(
          'http://localhost:3000/api/supplier/health?detailed=true'
        );
        
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Health check API request',
          expect.objectContaining({
            query: { detailed: true }
          })
        );
      });

      it('should handle includeMetrics parameter', async () => {
        const request = createMockRequest(
          'http://localhost:3000/api/supplier/health?includeMetrics=false'
        );
        
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.alerts).toBeUndefined();
        expect(mockMonitoringService.getActiveAlerts).not.toHaveBeenCalled();
      });

      it('should handle invalid query parameters gracefully', async () => {
        const request = createMockRequest(
          'http://localhost:3000/api/supplier/health?invalid=parameter&detailed=not_boolean'
        );
        
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        // Should ignore invalid parameters and process valid ones
      });
    });

    describe('Error Handling', () => {
      it('should handle health service errors', async () => {
        const error = new Error('Health service unavailable');
        mockHealthCheckService.getSystemHealth = jest.fn().mockRejectedValue(error);
        
        const request = createMockRequest('http://localhost:3000/api/supplier/health');
        
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Internal server error');
        expect(data.timestamp).toBeDefined();

        expect(mockMonitoringService.recordMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            operation: 'health_check_api_system',
            success: false,
            error: 'Health service unavailable'
          })
        );

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Health check API failed',
          expect.objectContaining({
            error: 'Health service unavailable'
          })
        );
      });

      it('should handle monitoring service errors', async () => {
        mockMonitoringService.getActiveAlerts = jest.fn()
          .mockRejectedValue(new Error('Monitoring service error'));
        
        const request = createMockRequest(
          'http://localhost:3000/api/supplier/health?includeMetrics=true'
        );
        
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
      });

      it('should record metrics even when main operation fails', async () => {
        mockHealthCheckService.getSystemHealth = jest.fn()
          .mockRejectedValue(new Error('Service failure'));
        
        const request = createMockRequest('http://localhost:3000/api/supplier/health');
        
        await GET(request);

        expect(mockMonitoringService.recordMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Service failure'
          })
        );
      });
    });

    describe('Performance Monitoring', () => {
      it('should measure and record response times', async () => {
        const request = createMockRequest('http://localhost:3000/api/supplier/health');
        
        const response = await GET(request);
        const data = await response.json();

        expect(data.responseTime).toBeDefined();
        expect(typeof data.responseTime).toBe('number');
        expect(data.responseTime).toBeGreaterThan(0);

        expect(mockMonitoringService.recordMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            duration: expect.any(Number)
          })
        );
      });

      it('should include performance metadata', async () => {
        const request = createMockRequest('http://localhost:3000/api/supplier/health');
        
        await GET(request);

        expect(mockMonitoringService.recordMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              totalServices: 2,
              healthyServices: 1,
              degradedServices: 1,
              unhealthyServices: 0,
              averageResponseTime: 55.4
            })
          })
        );
      });
    });
  });

  describe('POST /api/supplier/health', () => {
    describe('Manual Health Check Triggers', () => {
      it('should trigger manual health checks for all services', async () => {
        const request = createMockRequest('http://localhost:3000/api/supplier/health', {
          method: 'POST',
          body: JSON.stringify({ services: [] })
        });
        
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.results).toBeDefined();
        expect(data.results.summary.total).toBe(9); // All default services
        expect(data.results.summary.successful).toBeGreaterThan(0);
        expect(data.timestamp).toBeDefined();

        // Should call health check for each default service
        expect(mockHealthCheckService.getServiceHealth).toHaveBeenCalledTimes(9);
      });

      it('should trigger health checks for specific services', async () => {
        const request = createMockRequest('http://localhost:3000/api/supplier/health', {
          method: 'POST',
          body: JSON.stringify({ services: ['database', 'authentication'] })
        });
        
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.results.summary.total).toBe(2);

        expect(mockHealthCheckService.getServiceHealth).toHaveBeenCalledWith('database');
        expect(mockHealthCheckService.getServiceHealth).toHaveBeenCalledWith('authentication');
        expect(mockHealthCheckService.getServiceHealth).toHaveBeenCalledTimes(2);
      });

      it('should handle partial failures in health checks', async () => {
        mockHealthCheckService.getServiceHealth = jest.fn()
          .mockResolvedValueOnce(mockServiceHealth)
          .mockRejectedValueOnce(new Error('Service unavailable'));
        
        const request = createMockRequest('http://localhost:3000/api/supplier/health', {
          method: 'POST',
          body: JSON.stringify({ services: ['database', 'authentication'] })
        });
        
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.results.summary.successful).toBe(1);
        expect(data.results.summary.failed).toBe(1);
        expect(data.results.failed).toHaveLength(1);
        expect(data.results.failed[0].error).toBe('Service unavailable');
      });

      it('should record metrics for manual health checks', async () => {
        const request = createMockRequest('http://localhost:3000/api/supplier/health', {
          method: 'POST',
          body: JSON.stringify({ services: ['database'] })
        });
        
        await POST(request);

        expect(mockMonitoringService.recordMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            operation: 'health_check_api_manual',
            success: true,
            metadata: expect.objectContaining({
              requestedServices: 1,
              successful: 1,
              failed: 0
            })
          })
        );
      });
    });

    describe('Request Validation', () => {
      it('should validate request body structure', async () => {
        const request = createMockRequest('http://localhost:3000/api/supplier/health', {
          method: 'POST',
          body: JSON.stringify({ invalid: 'body' })
        });
        
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        // Should use default empty services array
        expect(data.results.summary.total).toBe(9);
      });

      it('should handle malformed JSON', async () => {
        const request = createMockRequest('http://localhost:3000/api/supplier/health', {
          method: 'POST',
          body: 'invalid json{'
        });
        
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Internal server error');
      });

      it('should validate services array', async () => {
        const request = createMockRequest('http://localhost:3000/api/supplier/health', {
          method: 'POST',
          body: JSON.stringify({ services: ['database', 'invalid_service', 'authentication'] })
        });
        
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.results.summary.total).toBe(3);
        // Should attempt to check all services, even invalid ones
      });
    });

    describe('Error Handling', () => {
      it('should handle complete health service failure', async () => {
        mockHealthCheckService.getServiceHealth = jest.fn()
          .mockRejectedValue(new Error('Complete system failure'));
        
        const request = createMockRequest('http://localhost:3000/api/supplier/health', {
          method: 'POST',
          body: JSON.stringify({ services: ['database'] })
        });
        
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.results.summary.successful).toBe(0);
        expect(data.results.summary.failed).toBe(1);

        expect(mockMonitoringService.recordMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            metadata: expect.objectContaining({
              failed: 1
            })
          })
        );
      });

      it('should log manual health check activities', async () => {
        const request = createMockRequest('http://localhost:3000/api/supplier/health', {
          method: 'POST',
          body: JSON.stringify({ services: ['database'] })
        });
        
        await POST(request);

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Manual health check triggered',
          expect.objectContaining({
            services: ['database'],
            userAgent: 'test-agent'
          })
        );

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Manual health check completed',
          expect.objectContaining({
            requestedServices: 1,
            successful: 1,
            failed: 0
          })
        );
      });
    });
  });

  describe('HTTP Methods', () => {
    it('should only accept GET and POST methods', async () => {
      // Test unsupported method (this would be handled by Next.js routing)
      // We're testing our handlers specifically
      const getRequest = createMockRequest('http://localhost:3000/api/supplier/health');
      const getResponse = await GET(getRequest);
      expect(getResponse.status).toBe(200);

      const postRequest = createMockRequest('http://localhost:3000/api/supplier/health', {
        method: 'POST',
        body: JSON.stringify({ services: [] })
      });
      const postResponse = await POST(postRequest);
      expect(postResponse.status).toBe(200);
    });
  });

  describe('Response Format Consistency', () => {
    it('should maintain consistent response structure for GET requests', async () => {
      const request = createMockRequest('http://localhost:3000/api/supplier/health');
      
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('responseTime');
      expect(typeof data.success).toBe('boolean');
      expect(typeof data.timestamp).toBe('string');
      expect(typeof data.responseTime).toBe('number');
    });

    it('should maintain consistent response structure for POST requests', async () => {
      const request = createMockRequest('http://localhost:3000/api/supplier/health', {
        method: 'POST',
        body: JSON.stringify({ services: [] })
      });
      
      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('results');
      expect(typeof data.success).toBe('boolean');
      expect(typeof data.timestamp).toBe('string');
      expect(data.results).toHaveProperty('summary');
    });

    it('should maintain consistent error response structure', async () => {
      mockHealthCheckService.getSystemHealth = jest.fn()
        .mockRejectedValue(new Error('Test error'));
      
      const request = createMockRequest('http://localhost:3000/api/supplier/health');
      
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('timestamp');
      expect(typeof data.error).toBe('string');
      expect(typeof data.timestamp).toBe('string');
    });
  });
});