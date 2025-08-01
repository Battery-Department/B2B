/**
 * Warehouse Utilities - RHY_031
 * Utility functions for warehouse operations and data transformations
 * Supports global FlexVolt battery warehouse management
 */

import { logger } from '@/lib/logger';
import type { 
  Warehouse, 
  WarehouseOperation, 
  WarehouseInventory,
  WarehouseStaff,
  WarehouseAuditLog,
  RegionalCompliance 
} from '@/types/warehouse';

/**
 * Warehouse data transformation utilities
 */
export const warehouseUtils = {
  /**
   * Transform warehouse data from database to API format
   */
  transformWarehouseData(warehouse: any): Warehouse {
    try {
      return {
        id: warehouse.id,
        name: warehouse.name,
        code: warehouse.code,
        region: warehouse.region,
        location: warehouse.location,
        capacity: warehouse.capacity,
        currentCapacity: warehouse.currentCapacity || 0,
        status: warehouse.status,
        operatingHours: warehouse.operatingHours || {
          start: '08:00',
          end: '18:00',
          timezone: this.getRegionTimezone(warehouse.region)
        },
        contact: warehouse.contact || {
          manager: 'N/A',
          phone: 'N/A',
          email: 'N/A'
        },
        compliance: warehouse.compliance,
        inventory: warehouse.inventory?.map((item: any) => this.transformInventoryData(item)) || [],
        staff: warehouse.staff?.map((member: any) => this.transformStaffData(member)) || [],
        operations: warehouse.operations?.map((op: any) => this.transformOperationData(op)) || [],
        auditLogs: warehouse.auditLogs?.map((log: any) => this.transformAuditLogData(log)) || [],
        performanceMetrics: warehouse.performanceMetrics || null,
        capacityUtilization: warehouse.capacityUtilization || 0,
        performanceScore: warehouse.performanceScore || 0,
        createdAt: warehouse.createdAt,
        updatedAt: warehouse.updatedAt,
        lastActivity: warehouse.lastActivity
      };
    } catch (error) {
      logger.error('Failed to transform warehouse data', {
        warehouseId: warehouse?.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Data transformation failed');
    }
  },

  /**
   * Transform inventory data from database to API format
   */
  transformInventoryData(inventory: any): WarehouseInventory {
    try {
      return {
        id: inventory.id,
        warehouseId: inventory.warehouseId,
        productId: inventory.productId,
        product: inventory.product ? {
          id: inventory.product.id,
          name: inventory.product.name,
          sku: inventory.product.sku,
          category: inventory.product.category,
          price: inventory.product.price,
          specifications: inventory.product.specifications
        } : undefined,
        quantity: inventory.quantity,
        location: inventory.location,
        status: inventory.status,
        batchNumber: inventory.batchNumber,
        expirationDate: inventory.expirationDate,
        supplierInfo: inventory.supplierInfo,
        qualityCheck: inventory.qualityCheck,
        lastUpdated: inventory.lastUpdated,
        updatedBy: inventory.updatedBy,
        metadata: inventory.metadata
      };
    } catch (error) {
      logger.error('Failed to transform inventory data', {
        inventoryId: inventory?.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Inventory data transformation failed');
    }
  },

  /**
   * Transform operation data from database to API format
   */
  transformOperationData(operation: any): WarehouseOperation {
    try {
      return {
        id: operation.id,
        type: operation.type,
        warehouseId: operation.warehouseId,
        userId: operation.userId,
        priority: operation.priority,
        status: operation.status,
        description: operation.description,
        details: operation.details,
        scheduledFor: operation.scheduledFor,
        estimatedDuration: operation.estimatedDuration,
        actualDuration: operation.actualDuration,
        requiredStaff: operation.requiredStaff,
        assignedStaff: operation.assignedStaff,
        requiredResources: operation.requiredResources,
        error: operation.error,
        createdAt: operation.createdAt,
        updatedAt: operation.updatedAt,
        completedAt: operation.completedAt,
        metadata: operation.metadata,
        warehouse: operation.warehouse,
        user: operation.user
      };
    } catch (error) {
      logger.error('Failed to transform operation data', {
        operationId: operation?.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Operation data transformation failed');
    }
  },

  /**
   * Transform staff data from database to API format
   */
  transformStaffData(staff: any): WarehouseStaff {
    try {
      return {
        id: staff.id,
        warehouseId: staff.warehouseId,
        userId: staff.userId,
        role: staff.role,
        shift: staff.shift,
        status: staff.status,
        startDate: staff.startDate,
        endDate: staff.endDate,
        permissions: staff.permissions || [],
        certifications: staff.certifications || [],
        active: staff.active,
        user: staff.user,
        metadata: staff.metadata
      };
    } catch (error) {
      logger.error('Failed to transform staff data', {
        staffId: staff?.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Staff data transformation failed');
    }
  },

  /**
   * Transform audit log data from database to API format
   */
  transformAuditLogData(log: any): WarehouseAuditLog {
    try {
      return {
        id: log.id,
        action: log.action,
        warehouseId: log.warehouseId,
        userId: log.userId,
        details: log.details,
        region: log.region,
        timestamp: log.timestamp,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        metadata: log.metadata
      };
    } catch (error) {
      logger.error('Failed to transform audit log data', {
        logId: log?.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Audit log data transformation failed');
    }
  },

  /**
   * Get timezone for warehouse region
   */
  getRegionTimezone(region: string): string {
    const timezones: Record<string, string> = {
      'US_WEST': 'America/Los_Angeles',
      'JAPAN': 'Asia/Tokyo',
      'EU': 'Europe/Berlin',
      'AUSTRALIA': 'Australia/Sydney'
    };
    return timezones[region] || 'UTC';
  },

  /**
   * Get region-specific operating hours
   */
  getRegionOperatingHours(region: string): { start: string; end: string; timezone: string } {
    const operatingHours: Record<string, { start: string; end: string; timezone: string }> = {
      'US_WEST': { start: '06:00', end: '18:00', timezone: 'America/Los_Angeles' },
      'JAPAN': { start: '09:00', end: '18:00', timezone: 'Asia/Tokyo' },
      'EU': { start: '08:00', end: '17:00', timezone: 'Europe/Berlin' },
      'AUSTRALIA': { start: '08:00', end: '17:00', timezone: 'Australia/Sydney' }
    };
    return operatingHours[region] || { start: '08:00', end: '18:00', timezone: 'UTC' };
  },

  /**
   * Calculate warehouse capacity utilization
   */
  calculateCapacityUtilization(currentCapacity: number, totalCapacity: number): {
    percentage: number;
    status: 'OPTIMAL' | 'HIGH' | 'CRITICAL' | 'LOW';
    recommendation: string;
  } {
    const percentage = totalCapacity > 0 ? (currentCapacity / totalCapacity) * 100 : 0;
    
    let status: 'OPTIMAL' | 'HIGH' | 'CRITICAL' | 'LOW';
    let recommendation: string;

    if (percentage >= 95) {
      status = 'CRITICAL';
      recommendation = 'Immediate action required: Warehouse at maximum capacity. Consider emergency overflow procedures.';
    } else if (percentage >= 85) {
      status = 'HIGH';
      recommendation = 'High utilization: Plan for capacity expansion or optimize storage layout.';
    } else if (percentage >= 60) {
      status = 'OPTIMAL';
      recommendation = 'Optimal utilization: Current capacity usage is within ideal range.';
    } else {
      status = 'LOW';
      recommendation = 'Low utilization: Consider consolidating inventory or reducing storage costs.';
    }

    return { percentage, status, recommendation };
  },

  /**
   * Format FlexVolt product information
   */
  formatFlexVoltProduct(product: any): {
    displayName: string;
    specifications: string;
    compatibility: string;
    priceFormatted: string;
  } {
    const flexVoltSizes: Record<string, { capacity: string; runtime: string; grade: string }> = {
      'FLEXVOLT_6AH': { capacity: '6Ah', runtime: '2 hours', grade: 'Professional' },
      'FLEXVOLT_9AH': { capacity: '9Ah', runtime: '3 hours', grade: 'Heavy-duty' },
      'FLEXVOLT_15AH': { capacity: '15Ah', runtime: '5 hours', grade: 'Industrial' }
    };

    const productInfo = flexVoltSizes[product.sku] || { capacity: 'Unknown', runtime: 'Unknown', grade: 'Standard' };
    
    return {
      displayName: `FlexVolt ${productInfo.capacity} Battery`,
      specifications: `${productInfo.capacity} capacity, ${productInfo.runtime} runtime, ${productInfo.grade} grade`,
      compatibility: '20V/60V MAX compatible for professional tools',
      priceFormatted: this.formatCurrency(product.price, 'USD')
    };
  },

  /**
   * Format currency based on region
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    try {
      const locale = currency === 'USD' ? 'en-US' : 
                    currency === 'EUR' ? 'de-DE' : 
                    currency === 'JPY' ? 'ja-JP' : 
                    currency === 'AUD' ? 'en-AU' : 'en-US';

      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error) {
      logger.warn('Currency formatting failed', { amount, currency, error });
      return `${currency} ${amount.toFixed(2)}`;
    }
  },

  /**
   * Get regional currency for warehouse
   */
  getRegionalCurrency(region: string): string {
    const currencies: Record<string, string> = {
      'US_WEST': 'USD',
      'JAPAN': 'JPY',
      'EU': 'EUR',
      'AUSTRALIA': 'AUD'
    };
    return currencies[region] || 'USD';
  },

  /**
   * Calculate volume discounts based on order value
   */
  calculateVolumeDiscount(orderValue: number, region: string): {
    discountPercentage: number;
    discountAmount: number;
    tier: string;
    nextTierAmount?: number;
  } {
    const currency = this.getRegionalCurrency(region);
    
    // Convert to USD equivalent for consistent discount calculation
    const usdValue = this.convertToUSD(orderValue, currency);
    
    let discountPercentage = 0;
    let tier = 'None';
    let nextTierAmount: number | undefined;

    if (usdValue >= 10000) {
      discountPercentage = 25;
      tier = 'Enterprise ($10,000+)';
    } else if (usdValue >= 5000) {
      discountPercentage = 20;
      tier = 'Large Enterprise ($5,000+)';
      nextTierAmount = 10000;
    } else if (usdValue >= 2500) {
      discountPercentage = 15;
      tier = 'Medium Fleet ($2,500+)';
      nextTierAmount = 5000;
    } else if (usdValue >= 1000) {
      discountPercentage = 10;
      tier = 'Small Contractor ($1,000+)';
      nextTierAmount = 2500;
    } else {
      nextTierAmount = 1000;
    }

    const discountAmount = (orderValue * discountPercentage) / 100;

    return {
      discountPercentage,
      discountAmount,
      tier,
      nextTierAmount
    };
  },

  /**
   * Convert currency amounts to USD for internal calculations
   */
  convertToUSD(amount: number, fromCurrency: string): number {
    // Simplified conversion rates - in production, use real-time rates
    const rates: Record<string, number> = {
      'USD': 1.0,
      'EUR': 1.1,
      'JPY': 0.0067,
      'AUD': 0.65
    };
    return amount * (rates[fromCurrency] || 1.0);
  },

  /**
   * Generate warehouse performance summary
   */
  generatePerformanceSummary(metrics: any): {
    overall: string;
    strengths: string[];
    concerns: string[];
    recommendations: string[];
  } {
    const strengths: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];

    // Analyze operations performance
    if (metrics.operations?.successRate >= 95) {
      strengths.push('Excellent operational reliability');
    } else if (metrics.operations?.successRate < 85) {
      concerns.push('Low operational success rate');
      recommendations.push('Review and improve operational procedures');
    }

    // Analyze inventory performance
    if (metrics.inventory?.stockAccuracy >= 98) {
      strengths.push('High inventory accuracy');
    } else if (metrics.inventory?.stockAccuracy < 90) {
      concerns.push('Inventory accuracy issues');
      recommendations.push('Implement automated inventory tracking');
    }

    // Analyze capacity utilization
    if (metrics.capacity?.utilizationRate >= 60 && metrics.capacity?.utilizationRate <= 85) {
      strengths.push('Optimal capacity utilization');
    } else if (metrics.capacity?.utilizationRate > 90) {
      concerns.push('Near-maximum capacity');
      recommendations.push('Plan for capacity expansion');
    } else if (metrics.capacity?.utilizationRate < 40) {
      concerns.push('Low capacity utilization');
      recommendations.push('Consider consolidating operations');
    }

    // Analyze staff performance
    if (metrics.staff?.productivity >= 90) {
      strengths.push('High staff productivity');
    } else if (metrics.staff?.productivity < 70) {
      concerns.push('Low staff productivity');
      recommendations.push('Provide additional training and support');
    }

    // Analyze compliance
    if (metrics.compliance?.complianceRate >= 95) {
      strengths.push('Excellent regulatory compliance');
    } else if (metrics.compliance?.complianceRate < 85) {
      concerns.push('Compliance issues detected');
      recommendations.push('Address compliance gaps immediately');
    }

    // Generate overall assessment
    const overallScore = metrics.overallScore || 0;
    let overall: string;

    if (overallScore >= 90) {
      overall = 'Excellent performance across all key metrics';
    } else if (overallScore >= 80) {
      overall = 'Good performance with minor areas for improvement';
    } else if (overallScore >= 70) {
      overall = 'Satisfactory performance with several improvement opportunities';
    } else if (overallScore >= 60) {
      overall = 'Below average performance requiring immediate attention';
    } else {
      overall = 'Poor performance requiring comprehensive intervention';
    }

    return {
      overall,
      strengths,
      concerns,
      recommendations
    };
  },

  /**
   * Validate warehouse business hours against current time
   */
  isWarehouseOpen(warehouse: Warehouse, currentTime?: Date): {
    isOpen: boolean;
    timeUntilOpen?: number;
    timeUntilClosed?: number;
    localTime: string;
  } {
    const now = currentTime || new Date();
    const timezone = warehouse.operatingHours.timezone;
    
    try {
      // Convert current time to warehouse timezone
      const localTime = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(now);

      const currentHour = parseInt(localTime.split(':')[0]);
      const currentMinute = parseInt(localTime.split(':')[1]);
      const currentTimeMinutes = currentHour * 60 + currentMinute;

      const [startHour, startMinute] = warehouse.operatingHours.start.split(':').map(Number);
      const [endHour, endMinute] = warehouse.operatingHours.end.split(':').map(Number);
      
      const startTimeMinutes = startHour * 60 + startMinute;
      const endTimeMinutes = endHour * 60 + endMinute;

      const isOpen = currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes;
      
      let timeUntilOpen: number | undefined;
      let timeUntilClosed: number | undefined;

      if (!isOpen && currentTimeMinutes < startTimeMinutes) {
        timeUntilOpen = startTimeMinutes - currentTimeMinutes;
      } else if (!isOpen && currentTimeMinutes >= endTimeMinutes) {
        // Next day opening
        timeUntilOpen = (24 * 60) - currentTimeMinutes + startTimeMinutes;
      }

      if (isOpen) {
        timeUntilClosed = endTimeMinutes - currentTimeMinutes;
      }

      return {
        isOpen,
        timeUntilOpen,
        timeUntilClosed,
        localTime
      };
    } catch (error) {
      logger.error('Failed to calculate warehouse operating hours', {
        warehouseId: warehouse.id,
        timezone,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        isOpen: false,
        localTime: 'Unknown'
      };
    }
  },

  /**
   * Generate audit trail summary
   */
  generateAuditTrail(logs: WarehouseAuditLog[], timeframe: number = 24): {
    summary: string;
    criticalActions: WarehouseAuditLog[];
    userActivity: Record<string, number>;
    actionTypes: Record<string, number>;
    recommendations: string[];
  } {
    const cutoffTime = new Date(Date.now() - timeframe * 60 * 60 * 1000);
    const recentLogs = logs.filter(log => log.timestamp >= cutoffTime);

    const criticalActions = recentLogs.filter(log => 
      ['EMERGENCY_RESPONSE', 'COMPLIANCE_VIOLATION', 'SECURITY_BREACH', 'SYSTEM_FAILURE'].includes(log.action)
    );

    const userActivity: Record<string, number> = {};
    const actionTypes: Record<string, number> = {};

    recentLogs.forEach(log => {
      if (log.userId) {
        userActivity[log.userId] = (userActivity[log.userId] || 0) + 1;
      }
      actionTypes[log.action] = (actionTypes[log.action] || 0) + 1;
    });

    const recommendations: string[] = [];
    
    if (criticalActions.length > 0) {
      recommendations.push('Review and address critical security events');
    }
    
    if (Object.keys(userActivity).length > 20) {
      recommendations.push('High user activity detected - monitor for unusual patterns');
    }

    const summary = `${recentLogs.length} activities in the last ${timeframe} hours. ${criticalActions.length} critical events detected.`;

    return {
      summary,
      criticalActions,
      userActivity,
      actionTypes,
      recommendations
    };
  },

  /**
   * Format operation duration for display
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 
        ? `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`
        : `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      return remainingHours > 0 
        ? `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`
        : `${days} day${days !== 1 ? 's' : ''}`;
    }
  },

  /**
   * Generate warehouse status badge configuration
   */
  getStatusBadgeConfig(status: string): {
    color: string;
    backgroundColor: string;
    text: string;
    icon: string;
  } {
    const configs: Record<string, any> = {
      'ACTIVE': {
        color: '#10B981',
        backgroundColor: '#D1FAE5',
        text: 'Active',
        icon: 'CheckCircle'
      },
      'INACTIVE': {
        color: '#6B7280',
        backgroundColor: '#F3F4F6',
        text: 'Inactive',
        icon: 'XCircle'
      },
      'MAINTENANCE': {
        color: '#F59E0B',
        backgroundColor: '#FEF3C7',
        text: 'Maintenance',
        icon: 'Wrench'
      },
      'CLOSED': {
        color: '#EF4444',
        backgroundColor: '#FEE2E2',
        text: 'Closed',
        icon: 'Lock'
      }
    };

    return configs[status] || configs['INACTIVE'];
  }
};