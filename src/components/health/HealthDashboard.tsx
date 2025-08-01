/**
 * RHY_074: Health Dashboard Component
 * Comprehensive health monitoring dashboard for RHY Supplier Portal
 * Real-time display of system health, service metrics, and performance alerts
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SystemHealthOverview, ServiceHealthStatus } from '@/services/monitoring/HealthCheckService';

interface HealthDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function HealthDashboard({ 
  className, 
  autoRefresh = true, 
  refreshInterval = 30000 
}: HealthDashboardProps) {
  const [healthData, setHealthData] = useState<SystemHealthOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealthData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/supplier/health?includeMetrics=true');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch health data');
      }

      setHealthData(data.health);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Failed to fetch health data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchHealthData();
  };

  useEffect(() => {
    fetchHealthData();

    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unhealthy': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'unhealthy': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatResponseTime = (time: number) => {
    return time < 1000 ? `${Math.round(time)}ms` : `${(time / 1000).toFixed(2)}s`;
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card>
          <CardContent className="flex items-center justify-center h-48">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading health status...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !healthData) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 space-y-4">
            <div className="flex items-center space-x-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Failed to load health data</span>
            </div>
            {error && (
              <p className="text-sm text-muted-foreground text-center">{error}</p>
            )}
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Overall Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">System Health</h2>
          <Badge 
            className={cn(
              'text-sm px-3 py-1 border font-medium',
              getStatusColor(healthData.overall)
            )}
          >
            <span className="flex items-center space-x-1">
              {getStatusIcon(healthData.overall)}
              <span className="capitalize">{healthData.overall}</span>
            </span>
          </Badge>
        </div>
        
        <div className="flex items-center space-x-3">
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Services</p>
                <p className="text-2xl font-bold text-gray-900">{healthData.metrics.totalServices}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Healthy</p>
                <p className="text-2xl font-bold text-green-600">{healthData.metrics.healthyServices}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600 font-medium">
                  {((healthData.metrics.healthyServices / healthData.metrics.totalServices) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Degraded</p>
                <p className="text-2xl font-bold text-yellow-600">{healthData.metrics.degradedServices}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unhealthy</p>
                <p className="text-2xl font-bold text-red-600">{healthData.metrics.unhealthyServices}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Average Response Time</span>
              <span className="text-sm font-bold text-gray-900">
                {formatResponseTime(healthData.metrics.averageResponseTime)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Overall Uptime</span>
              <span className="text-sm font-bold text-gray-900">
                {formatUptime(healthData.metrics.overallUptime)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  'w-3 h-3 rounded-full',
                  healthData.overall === 'healthy' ? 'bg-green-500' :
                  healthData.overall === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                )} />
                <span className="text-sm font-medium text-gray-900">
                  System is {healthData.overall}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                All core services are monitored in real-time. Automatic recovery 
                procedures are active for degraded services.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Service Health Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthData.services.map((service: ServiceHealthStatus) => (
              <div 
                key={service.service} 
                className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center border',
                    getStatusColor(service.status)
                  )}>
                    {getStatusIcon(service.status)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">
                      {service.service.replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Last checked: {new Date(service.lastCheck).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="font-medium text-gray-900">
                      {formatResponseTime(service.responseTime)}
                    </p>
                    <p className="text-muted-foreground">Response</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900">
                      {formatUptime(service.uptime)}
                    </p>
                    <p className="text-muted-foreground">Uptime</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900">
                      {service.errorRate.toFixed(2)}%
                    </p>
                    <p className="text-muted-foreground">Errors</p>
                  </div>
                  <Badge 
                    className={cn(
                      'text-xs border font-medium',
                      getStatusColor(service.status)
                    )}
                  >
                    {service.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {healthData.recommendations && healthData.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Health Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthData.recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className={cn(
                    'p-4 rounded-lg border-l-4',
                    rec.priority === 'critical' ? 'border-red-500 bg-red-50' :
                    rec.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                    rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge 
                          variant="outline"
                          className={cn(
                            'text-xs',
                            rec.priority === 'critical' ? 'border-red-500 text-red-700' :
                            rec.priority === 'high' ? 'border-orange-500 text-orange-700' :
                            rec.priority === 'medium' ? 'border-yellow-500 text-yellow-700' :
                            'border-blue-500 text-blue-700'
                          )}
                        >
                          {rec.priority.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium text-gray-900">
                          {rec.service}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{rec.issue}</p>
                      <p className="text-sm text-gray-600">{rec.recommendation}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Impact: {rec.estimatedImpact}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}