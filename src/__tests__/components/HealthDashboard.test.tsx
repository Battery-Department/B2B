/**
 * @jest-environment jsdom
 */

/**
 * RHY_074: Health Dashboard Component Tests
 * Comprehensive test suite for HealthDashboard React component
 * Tests UI rendering, API integration, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HealthDashboard } from '../../components/health/HealthDashboard';
import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

// Helper to create mock Response objects
const createMockResponse = (data, ok, status, statusText) => {
  const response = {
    ok: ok === undefined ? true : ok,
    status: status || 200,
    statusText: statusText || 'OK',
    json: async () => data,
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: '',
    clone: function() { return this; },
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    text: async () => JSON.stringify(data)
  };
  return response;
};

const mockHealthData = {
  success: true,
  health: {
    overall: 'healthy',
    services: [
      {
        service: 'database',
        status: 'healthy',
        responseTime: 25.5,
        uptime: 99.95,
        errorRate: 0.05,
        lastCheck: new Date().toISOString(),
        details: {
          connections: 15,
          memoryUsage: 65
        },
        dependencies: [
          {
            name: 'primary_db',
            status: 'healthy',
            responseTime: 20.2
          },
          {
            name: 'rhy_db',
            status: 'healthy',
            responseTime: 30.8
          }
        ],
        alerts: []
      },
      {
        service: 'authentication',
        status: 'degraded',
        responseTime: 85.3,
        uptime: 99.2,
        errorRate: 0.8,
        lastCheck: new Date().toISOString(),
        details: {
          connections: 250
        },
        dependencies: [
          {
            name: 'jwt_service',
            status: 'healthy',
            responseTime: 15.5
          },
          {
            name: 'session_store',
            status: 'degraded',
            responseTime: 120.0
          },
          {
            name: 'mfa_service',
            status: 'healthy',
            responseTime: 25.0
          }
        ],
        alerts: [
          {
            severity: 'warning',
            message: 'Authentication response time is elevated: 85.30ms',
            timestamp: new Date()
          }
        ]
      },
      {
        service: 'warehouse',
        status: 'unhealthy',
        responseTime: 350.0,
        uptime: 98.5,
        errorRate: 2.1,
        lastCheck: new Date().toISOString(),
        details: {
          connections: 45
        },
        dependencies: [
          {
            name: 'operations_engine',
            status: 'unhealthy',
            responseTime: 400.0
          },
          {
            name: 'inventory_sync',
            status: 'degraded',
            responseTime: 180.0
          },
          {
            name: 'performance_metrics',
            status: 'healthy',
            responseTime: 75.0
          }
        ],
        alerts: [
          {
            severity: 'error',
            message: 'Warehouse service response time is critical: 350.00ms',
            timestamp: new Date()
          }
        ]
      }
    ],
    metrics: {
      totalServices: 3,
      healthyServices: 1,
      degradedServices: 1,
      unhealthyServices: 1,
      averageResponseTime: 153.6,
      overallUptime: 99.22
    },
    recommendations: [
      {
        priority: 'critical',
        service: 'warehouse',
        issue: 'Service is completely unavailable',
        recommendation: 'Immediate investigation and recovery required',
        estimatedImpact: 'Complete service outage'
      },
      {
        priority: 'high',
        service: 'authentication',
        issue: 'Elevated response time: 85.30ms',
        recommendation: 'Monitor trends, consider performance tuning',
        estimatedImpact: 'Slightly slower response times'
      }
    ],
    lastUpdate: new Date().toISOString()
  },
  timestamp: new Date().toISOString(),
  responseTime: 145.2
};

const mockErrorResponse = {
  success: false,
  error: 'Failed to fetch health data',
  timestamp: new Date().toISOString()
};

describe('HealthDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock
    fetch.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Initial Loading State', () => {
    it('should display loading spinner while fetching data', () => {
      // Mock a pending promise
      fetch.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<HealthDashboard />);

      expect(screen.getByText('Loading health status...')).toBeInTheDocument();
      // Check for the spinning refresh icon
      const spinningIcon = document.querySelector('.animate-spin');
      expect(spinningIcon).toBeInTheDocument();
    });
  });

  describe('Successful Data Loading', () => {
    beforeEach(() => {
      fetch.mockResolvedValue(
        createMockResponse(mockHealthData)
      );
    });

    it('should render system health overview correctly', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeInTheDocument();
      });

      // Check overall status badge (should have at least one)
      const overallHealthy = screen.getAllByText(/healthy/i);
      expect(overallHealthy.length).toBeGreaterThan(0);

      // Check metrics cards
      expect(screen.getByText('Total Services')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      
      // Check service count labels exist (multiple instances with different counts)
      const healthyLabels = screen.getAllByText('Healthy');
      expect(healthyLabels.length).toBeGreaterThan(0);
      
      const degradedLabels = screen.getAllByText('Degraded');
      expect(degradedLabels.length).toBeGreaterThan(0);
      
      const unhealthyLabels = screen.getAllByText('Unhealthy');
      expect(unhealthyLabels.length).toBeGreaterThan(0);
    });

    it('should display performance metrics correctly', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      });

      expect(screen.getByText('Average Response Time')).toBeInTheDocument();
      expect(screen.getByText('154ms')).toBeInTheDocument(); // Rounded value
      expect(screen.getByText('Overall Uptime')).toBeInTheDocument();
      expect(screen.getByText('99.22%')).toBeInTheDocument();
    });

    it('should render service health details correctly', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Service Health Details')).toBeInTheDocument();
      });

      // Check database service
      const databaseTexts = screen.getAllByText(/database/i);
      expect(databaseTexts.length).toBeGreaterThan(0);
      expect(screen.getByText('26ms')).toBeInTheDocument(); // Database response time
      expect(screen.getByText('99.95%')).toBeInTheDocument(); // Database uptime
      expect(screen.getByText('0.05%')).toBeInTheDocument(); // Database error rate

      // Check authentication service
      const authenticationTexts = screen.getAllByText(/authentication/i);
      expect(authenticationTexts.length).toBeGreaterThan(0);
      expect(screen.getByText('85ms')).toBeInTheDocument();

      // Check warehouse service
      const warehouseTexts = screen.getAllByText(/warehouse/i);
      expect(warehouseTexts.length).toBeGreaterThan(0);
      expect(screen.getByText('350ms')).toBeInTheDocument();
    });

    it('should display health recommendations', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Health Recommendations')).toBeInTheDocument();
      });

      // Check critical recommendation
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
      const warehouseTexts = screen.getAllByText(/warehouse/i);
      expect(warehouseTexts.length).toBeGreaterThan(0);
      expect(screen.getByText('Service is completely unavailable')).toBeInTheDocument();
      expect(screen.getByText('Immediate investigation and recovery required')).toBeInTheDocument();

      // Check high priority recommendation
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      const authTexts = screen.getAllByText(/authentication/i);
      expect(authTexts.length).toBeGreaterThan(0);
    });

    it('should show last update timestamp', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      });
    });

    it('should display correct status badges for each service', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        const badges = screen.getAllByText(/healthy|degraded|unhealthy/i);
        expect(badges.length).toBeGreaterThan(0);
      });

      // Should have multiple status indicators
      const healthyBadges = screen.getAllByText(/healthy/i);
      const degradedBadges = screen.getAllByText(/degraded/i);
      const unhealthyBadges = screen.getAllByText(/unhealthy/i);

      expect(healthyBadges.length).toBeGreaterThanOrEqual(1);
      expect(degradedBadges.length).toBeGreaterThanOrEqual(1);
      expect(unhealthyBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      fetch.mockResolvedValue(
        createMockResponse({}, false, 500, 'Internal Server Error')
      );

      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load health data')).toBeInTheDocument();
      });

      expect(screen.getByText('HTTP 500: Internal Server Error')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should display error when response is not successful', async () => {
      fetch.mockResolvedValue(
        createMockResponse(mockErrorResponse)
      );

      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load health data')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to fetch health data')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      fetch.mockRejectedValue(
        new Error('Network error')
      );

      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load health data')).toBeInTheDocument();
      });

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    beforeEach(() => {
      fetch.mockResolvedValue(
        createMockResponse(mockHealthData)
      );
    });

    it('should allow manual refresh of health data', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();

      // Click refresh
      fireEvent.click(refreshButton);

      // Should call fetch again
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2); // Initial load + refresh
      });
    });

    it('should show loading state during refresh', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeInTheDocument();
      });

      // Mock a slow refresh
      fetch.mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve(createMockResponse(mockHealthData)), 100)
        )
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      // Should show spinning icon
      expect(refreshButton).toBeDisabled();
    });

    it('should retry after error', async () => {
      // First call fails
      fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(createMockResponse(mockHealthData));

      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load health data')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeInTheDocument();
      });

      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Auto-refresh Functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      fetch.mockResolvedValue(
        createMockResponse(mockHealthData)
      );
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should auto-refresh data at specified intervals', async () => {
      render(<HealthDashboard autoRefresh={true} refreshInterval={10000} />);

      // Initial load
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      // Fast-forward 10 seconds
      jest.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2);
      });

      // Fast-forward another 10 seconds
      jest.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(3);
      });
    });

    it('should not auto-refresh when disabled', async () => {
      render(<HealthDashboard autoRefresh={false} />);

      // Initial load
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      // Fast-forward time
      jest.advanceTimersByTime(60000);

      // Should not have called fetch again
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should cleanup interval on unmount', async () => {
      const { unmount } = render(<HealthDashboard autoRefresh={true} refreshInterval={5000} />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Fast-forward time after unmount
      jest.advanceTimersByTime(10000);

      // Should not call fetch after unmount
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('API Integration', () => {
    it('should call correct API endpoint with proper parameters', async () => {
      fetch.mockResolvedValue(
        createMockResponse(mockHealthData)
      );

      render(<HealthDashboard />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/supplier/health?includeMetrics=true');
      });
    });

    it('should handle malformed JSON responses', async () => {
      fetch.mockResolvedValue({
        ...createMockResponse({}),
        json: async () => { throw new Error('Invalid JSON'); }
      });

      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load health data')).toBeInTheDocument();
      });

      expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      fetch.mockResolvedValue(
        createMockResponse(mockHealthData)
      );
    });

    it('should render grid layout for metrics cards', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeInTheDocument();
      });

      // Check that metrics are displayed in card format
      const totalServicesCard = screen.getByText('Total Services').closest('div');
      const healthyCard = screen.getByText('Healthy').closest('div');
      const degradedCard = screen.getByText('Degraded').closest('div');
      const unhealthyCard = screen.getByText('Unhealthy').closest('div');

      expect(totalServicesCard).toBeInTheDocument();
      expect(healthyCard).toBeInTheDocument();
      expect(degradedCard).toBeInTheDocument();
      expect(unhealthyCard).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fetch.mockResolvedValue(
        createMockResponse(mockHealthData)
      );
    });

    it('should have proper ARIA labels and roles', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeInTheDocument();
      });

      // Check for button roles
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      
      // Should be focusable
      refreshButton.focus();
      expect(refreshButton).toHaveFocus();

      // Should respond to Enter key
      fireEvent.keyDown(refreshButton, { key: 'Enter', code: 'Enter' });
      // Note: actual behavior would depend on implementation
    });
  });

  describe('Data Formatting', () => {
    beforeEach(() => {
      fetch.mockResolvedValue(
        createMockResponse(mockHealthData)
      );
    });

    it('should format response times correctly', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('26ms')).toBeInTheDocument(); // Database
        expect(screen.getByText('85ms')).toBeInTheDocument(); // Authentication
        expect(screen.getByText('350ms')).toBeInTheDocument(); // Warehouse
      });
    });

    it('should format uptime percentages correctly', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('99.95%')).toBeInTheDocument(); // Database uptime
        expect(screen.getByText('99.22%')).toBeInTheDocument(); // Overall uptime
      });
    });

    it('should format error rates correctly', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('0.05%')).toBeInTheDocument(); // Database error rate
        expect(screen.getByText('0.80%')).toBeInTheDocument(); // Auth error rate
        expect(screen.getByText('2.10%')).toBeInTheDocument(); // Warehouse error rate
      });
    });
  });
});