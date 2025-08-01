/**
 * RHY_074: Service Health Card Component
 * Individual service health monitoring component with detailed metrics
 * Used within the HealthDashboard for granular service status display
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Activity, 
  Database, 
  Shield, 
  Package, 
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceHealthStatus } from '@/services/monitoring/HealthCheckService';

interface ServiceHealthCardProps {
  service: ServiceHealthStatus;
  onRefresh?: (serviceName: string) => Promise<void>;
  className?: string;
  showDetails?: boolean;
}

export function ServiceHealthCard({ 
  service, 
  onRefresh, 
  className,
  showDetails = false 
}: ServiceHealthCardProps) {
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh(service.service);
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case 'database': return <Database className="h-5 w-5" />;
      case 'authentication': return <Shield className="h-5 w-5" />;
      case 'warehouse': 
      case 'inventory':
      case 'orders': return <Package className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const formatResponseTime = (time: number) => {
    return time < 1000 ? `${Math.round(time)}ms` : `${(time / 1000).toFixed(2)}s`;
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`;
  };

  const getPerformanceIndicator = (responseTime: number, uptime: number, errorRate: number) => {
    if (responseTime < 50 && uptime > 99.5 && errorRate < 0.1) {
      return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    } else if (responseTime < 100 && uptime > 99 && errorRate < 0.5) {
      return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    } else if (responseTime < 200 && uptime > 98 && errorRate < 1) {
      return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    } else {
      return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-100' };
    }
  };

  const performance = getPerformanceIndicator(service.responseTime, service.uptime, service.errorRate);

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center border',
                getStatusColor(service.status)
              )}>
                {getServiceIcon(service.service)}
              </div>
              <div>
                <CardTitle className="text-lg font-semibold capitalize">
                  {service.service.replace('_', ' ')}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Last checked: {new Date(service.lastCheck).toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge 
                className={cn(
                  'text-sm border font-medium',
                  getStatusColor(service.status)
                )}
              >
                <span className="flex items-center space-x-1">
                  {getStatusIcon(service.status)}
                  <span className="capitalize">{service.status}</span>
                </span>
              </Badge>
              
              {onRefresh && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                </Button>
              )}
              
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-gray-50">
              <p className="text-sm font-medium text-gray-900">
                {formatResponseTime(service.responseTime)}
              </p>
              <p className="text-xs text-muted-foreground">Response Time</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-50">
              <p className="text-sm font-medium text-gray-900">
                {formatUptime(service.uptime)}
              </p>
              <p className="text-xs text-muted-foreground">Uptime</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-50">
              <p className="text-sm font-medium text-gray-900">
                {service.errorRate.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground">Error Rate</p>
            </div>
          </div>

          {/* Performance Indicator */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Performance</span>
            <Badge className={cn('text-xs', performance.color, performance.bg)}>
              {performance.label}
            </Badge>
          </div>

          <CollapsibleContent>
            <div className="space-y-4 pt-4 border-t">
              {/* Service Details */}
              {service.details && Object.keys(service.details).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Service Details</h4>
                  <div className="space-y-2">
                    {service.details.version && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Version:</span>
                        <span className="font-medium">{service.details.version}</span>
                      </div>
                    )}
                    {service.details.connections !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Active Connections:</span>
                        <span className="font-medium">{service.details.connections}</span>
                      </div>
                    )}
                    {service.details.memoryUsage !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Memory Usage:</span>
                        <span className="font-medium">{service.details.memoryUsage}%</span>
                      </div>
                    )}
                    {service.details.cpuUsage !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">CPU Usage:</span>
                        <span className="font-medium">{service.details.cpuUsage}%</span>
                      </div>
                    )}
                    {service.details.diskUsage !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Disk Usage:</span>
                        <span className="font-medium">{service.details.diskUsage}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dependencies */}
              {service.dependencies && service.dependencies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Dependencies</h4>
                  <div className="space-y-2">
                    {service.dependencies.map((dep, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-50">
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            'w-2 h-2 rounded-full',
                            dep.status === 'healthy' ? 'bg-green-500' :
                            dep.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                          )} />
                          <span className="text-sm font-medium capitalize">
                            {dep.name.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatResponseTime(dep.responseTime)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alerts */}
              {service.alerts && service.alerts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Active Alerts</h4>
                  <div className="space-y-2">
                    {service.alerts.map((alert, index) => (
                      <div 
                        key={index} 
                        className={cn(
                          'p-3 rounded-lg border-l-4',
                          alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                          alert.severity === 'error' ? 'border-orange-500 bg-orange-50' :
                          alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
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
                                  alert.severity === 'critical' ? 'border-red-500 text-red-700' :
                                  alert.severity === 'error' ? 'border-orange-500 text-orange-700' :
                                  alert.severity === 'warning' ? 'border-yellow-500 text-yellow-700' :
                                  'border-blue-500 text-blue-700'
                                )}
                              >
                                {alert.severity.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700">{alert.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}