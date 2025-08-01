/**
 * Warehouse Validator - RHY_031
 * Enterprise-grade validation service for warehouse operations
 * Provides comprehensive data validation with Zod schemas
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * Validation schemas for warehouse operations
 */

// Base warehouse schema
const WarehouseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  code: z.string().min(2).max(10).regex(/^[A-Z0-9_-]+$/),
  region: z.enum(['US_WEST', 'JAPAN', 'EU', 'AUSTRALIA']),
  location: z.string().min(1).max(200),
  capacity: z.number().int().min(1).max(1000000),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CLOSED']),
  operatingHours: z.object({
    start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    timezone: z.string()
  }),
  contact: z.object({
    manager: z.string().min(1).max(100),
    phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/),
    email: z.string().email()
  }),
  compliance: z.object({
    certifications: z.array(z.string()),
    lastAudit: z.date().optional(),
    nextAudit: z.date().optional()
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastActivity: z.date().optional()
});

// Warehouse query schema
const WarehouseQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  region: z.enum(['US_WEST', 'JAPAN', 'EU', 'AUSTRALIA']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CLOSED']).optional(),
  sortBy: z.enum(['name', 'region', 'capacity', 'createdAt', 'lastActivity']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  userId: z.string().uuid().optional()
});

// Warehouse operation schema
const WarehouseOperationSchema = z.object({
  type: z.enum([
    'INVENTORY_UPDATE',
    'INVENTORY_SYNC',
    'STOCK_RECEIPT',
    'STOCK_DISPATCH',
    'TRANSFER_IN',
    'TRANSFER_OUT',
    'CROSS_REGION_TRANSFER',
    'AUDIT_CHECK',
    'MAINTENANCE',
    'EMERGENCY_RESPONSE',
    'COMPLIANCE_CHECK',
    'STAFF_ASSIGNMENT',
    'CAPACITY_ADJUSTMENT',
    'SYSTEM_UPDATE'
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  description: z.string().min(1).max(500),
  details: z.record(z.any()).optional(),
  scheduledFor: z.date().optional(),
  estimatedDuration: z.number().int().min(1).optional(), // in minutes
  requiredStaff: z.number().int().min(0).optional(),
  requiredResources: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

// Inventory update schema
const InventoryUpdateSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(0).optional(),
  location: z.string().max(50).optional(),
  batchNumber: z.string().max(50).optional(),
  expirationDate: z.date().optional(),
  supplierInfo: z.object({
    supplierId: z.string().uuid().optional(),
    orderNumber: z.string().max(50).optional(),
    receivedDate: z.date().optional()
  }).optional(),
  qualityCheck: z.object({
    status: z.enum(['PASSED', 'FAILED', 'PENDING']),
    inspector: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
    checkDate: z.date().optional()
  }).optional(),
  metadata: z.record(z.any()).optional()
});

// Date range schema
const DateRangeSchema = z.object({
  start: z.date(),
  end: z.date()
}).refine(data => data.start <= data.end, {
  message: "Start date must be before or equal to end date"
});

// Staff assignment schema
const StaffAssignmentSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['MANAGER', 'SUPERVISOR', 'OPERATOR', 'QUALITY_INSPECTOR', 'MAINTENANCE', 'SECURITY']),
  shift: z.enum(['MORNING', 'AFTERNOON', 'NIGHT', 'FLEXIBLE']),
  startDate: z.date(),
  endDate: z.date().optional(),
  permissions: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional()
});

// Performance metrics query schema
const PerformanceMetricsQuerySchema = z.object({
  warehouseId: z.string().uuid(),
  dateRange: DateRangeSchema,
  includeDetails: z.boolean().default(false),
  granularity: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).default('DAILY'),
  metrics: z.array(z.enum([
    'OPERATIONS',
    'INVENTORY',
    'STAFF',
    'COMPLIANCE',
    'CAPACITY',
    'EFFICIENCY',
    'QUALITY'
  ])).optional()
});

// Regional compliance schema
const RegionalComplianceSchema = z.object({
  region: z.enum(['US_WEST', 'JAPAN', 'EU', 'AUSTRALIA']),
  regulations: z.array(z.object({
    name: z.string(),
    type: z.enum(['SAFETY', 'ENVIRONMENTAL', 'LABOR', 'QUALITY', 'CUSTOMS']),
    required: z.boolean(),
    validFrom: z.date(),
    validTo: z.date().optional(),
    description: z.string().optional()
  })),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    validFrom: z.date(),
    validTo: z.date(),
    documentUrl: z.string().url().optional()
  })).optional()
});

/**
 * Warehouse Validator Class
 * Provides validation methods for all warehouse-related operations
 */
export class WarehouseValidator {
  private readonly maxRetries = 3;
  private readonly sanitizeInput = true;

  /**
   * Validate warehouse query parameters
   */
  public validateQuery(query: unknown): z.infer<typeof WarehouseQuerySchema> {
    try {
      return WarehouseQuerySchema.parse(query);
    } catch (error) {
      logger.error('Warehouse query validation failed', {
        query,
        error: error instanceof z.ZodError ? error.errors : error
      });
      throw new Error(`Invalid warehouse query: ${this.formatZodError(error)}`);
    }
  }

  /**
   * Validate warehouse ID
   */
  public validateId(id: unknown): string {
    try {
      const idSchema = z.string().uuid();
      return idSchema.parse(id);
    } catch (error) {
      logger.error('Warehouse ID validation failed', { id, error });
      throw new Error(`Invalid warehouse ID: ${id}`);
    }
  }

  /**
   * Validate warehouse operation data
   */
  public validateOperation(operation: unknown): z.infer<typeof WarehouseOperationSchema> {
    try {
      const validated = WarehouseOperationSchema.parse(operation);
      
      // Additional business logic validation
      this.validateOperationBusinessRules(validated);
      
      return validated;
    } catch (error) {
      logger.error('Warehouse operation validation failed', {
        operation,
        error: error instanceof z.ZodError ? error.errors : error
      });
      throw new Error(`Invalid warehouse operation: ${this.formatZodError(error)}`);
    }
  }

  /**
   * Validate inventory update data
   */
  public validateInventoryUpdate(update: unknown): z.infer<typeof InventoryUpdateSchema> {
    try {
      const validated = InventoryUpdateSchema.parse(update);
      
      // Additional validation for inventory business rules
      this.validateInventoryBusinessRules(validated);
      
      return validated;
    } catch (error) {
      logger.error('Inventory update validation failed', {
        update,
        error: error instanceof z.ZodError ? error.errors : error
      });
      throw new Error(`Invalid inventory update: ${this.formatZodError(error)}`);
    }
  }

  /**
   * Validate date range
   */
  public validateDateRange(dateRange: unknown): z.infer<typeof DateRangeSchema> {
    try {
      // Convert string dates to Date objects if needed
      if (typeof dateRange === 'object' && dateRange !== null) {
        const range = dateRange as any;
        if (typeof range.start === 'string') {
          range.start = new Date(range.start);
        }
        if (typeof range.end === 'string') {
          range.end = new Date(range.end);
        }
      }

      const validated = DateRangeSchema.parse(dateRange);
      
      // Additional business validation
      this.validateDateRangeBusinessRules(validated);
      
      return validated;
    } catch (error) {
      logger.error('Date range validation failed', {
        dateRange,
        error: error instanceof z.ZodError ? error.errors : error
      });
      throw new Error(`Invalid date range: ${this.formatZodError(error)}`);
    }
  }

  /**
   * Validate staff assignment
   */
  public validateStaffAssignment(assignment: unknown): z.infer<typeof StaffAssignmentSchema> {
    try {
      const validated = StaffAssignmentSchema.parse(assignment);
      
      // Additional validation for staff assignment rules
      this.validateStaffAssignmentBusinessRules(validated);
      
      return validated;
    } catch (error) {
      logger.error('Staff assignment validation failed', {
        assignment,
        error: error instanceof z.ZodError ? error.errors : error
      });
      throw new Error(`Invalid staff assignment: ${this.formatZodError(error)}`);
    }
  }

  /**
   * Validate performance metrics query
   */
  public validatePerformanceMetricsQuery(query: unknown): z.infer<typeof PerformanceMetricsQuerySchema> {
    try {
      return PerformanceMetricsQuerySchema.parse(query);
    } catch (error) {
      logger.error('Performance metrics query validation failed', {
        query,
        error: error instanceof z.ZodError ? error.errors : error
      });
      throw new Error(`Invalid performance metrics query: ${this.formatZodError(error)}`);
    }
  }

  /**
   * Validate regional compliance data
   */
  public validateRegionalCompliance(compliance: unknown): z.infer<typeof RegionalComplianceSchema> {
    try {
      const validated = RegionalComplianceSchema.parse(compliance);
      
      // Additional compliance validation
      this.validateComplianceBusinessRules(validated);
      
      return validated;
    } catch (error) {
      logger.error('Regional compliance validation failed', {
        compliance,
        error: error instanceof z.ZodError ? error.errors : error
      });
      throw new Error(`Invalid regional compliance: ${this.formatZodError(error)}`);
    }
  }

  /**
   * Validate bulk data with batch processing
   */
  public async validateBulkData<T>(
    data: unknown[],
    validator: (item: unknown) => T,
    batchSize: number = 100
  ): Promise<{
    valid: T[];
    invalid: Array<{ item: unknown; error: string; index: number }>;
  }> {
    const valid: T[] = [];
    const invalid: Array<{ item: unknown; error: string; index: number }> = [];

    // Process in batches to avoid memory issues
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (item, batchIndex) => {
          try {
            return { 
              result: validator(item), 
              index: i + batchIndex,
              item 
            };
          } catch (error) {
            throw { 
              error: error instanceof Error ? error.message : 'Validation failed',
              index: i + batchIndex,
              item
            };
          }
        })
      );

      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          valid.push(result.value.result);
        } else {
          invalid.push(result.reason);
        }
      });
    }

    logger.info('Bulk validation completed', {
      total: data.length,
      valid: valid.length,
      invalid: invalid.length,
      batchSize
    });

    return { valid, invalid };
  }

  /**
   * Sanitize input data
   */
  public sanitizeInput(input: string): string {
    if (!this.sanitizeInput) return input;

    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .substring(0, 1000); // Limit length
  }

  /**
   * Private validation helper methods
   */

  private validateOperationBusinessRules(operation: z.infer<typeof WarehouseOperationSchema>): void {
    // Cross-region transfers require special approval
    if (operation.type === 'CROSS_REGION_TRANSFER' && operation.priority !== 'HIGH') {
      throw new Error('Cross-region transfers must have HIGH priority');
    }

    // Critical operations cannot be scheduled for weekends (simplified rule)
    if (operation.priority === 'CRITICAL' && operation.scheduledFor) {
      const dayOfWeek = operation.scheduledFor.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        logger.warn('Critical operation scheduled for weekend', {
          operation: operation.type,
          scheduledFor: operation.scheduledFor
        });
      }
    }

    // Validate estimated duration ranges
    if (operation.estimatedDuration) {
      const maxDurations: Record<string, number> = {
        'INVENTORY_UPDATE': 240, // 4 hours
        'INVENTORY_SYNC': 480,   // 8 hours
        'CROSS_REGION_TRANSFER': 1440, // 24 hours
        'MAINTENANCE': 720,      // 12 hours
        'EMERGENCY_RESPONSE': 120, // 2 hours
        'COMPLIANCE_CHECK': 360   // 6 hours
      };

      const maxDuration = maxDurations[operation.type] || 480;
      if (operation.estimatedDuration > maxDuration) {
        throw new Error(`Operation duration exceeds maximum allowed for ${operation.type}: ${maxDuration} minutes`);
      }
    }
  }

  private validateInventoryBusinessRules(update: z.infer<typeof InventoryUpdateSchema>): void {
    // Validate quantity limits for FlexVolt products
    if (update.quantity !== undefined) {
      if (update.quantity > 10000) {
        throw new Error('Quantity exceeds maximum allowed limit: 10,000 units');
      }
    }

    // Validate expiration dates for battery products
    if (update.expirationDate) {
      const now = new Date();
      const maxShelfLife = new Date(now.getTime() + (365 * 5 * 24 * 60 * 60 * 1000)); // 5 years
      
      if (update.expirationDate < now) {
        throw new Error('Expiration date cannot be in the past');
      }
      
      if (update.expirationDate > maxShelfLife) {
        throw new Error('Expiration date exceeds maximum shelf life for battery products');
      }
    }

    // Validate batch number format for traceability
    if (update.batchNumber) {
      const batchRegex = /^[A-Z0-9]{2,3}-\d{6}-[A-Z0-9]{2,4}$/;
      if (!batchRegex.test(update.batchNumber)) {
        throw new Error('Batch number must follow format: XX-YYYYMM-XXXX');
      }
    }

    // Quality check validation
    if (update.qualityCheck) {
      if (update.qualityCheck.status === 'FAILED' && !update.qualityCheck.notes) {
        throw new Error('Quality check notes required when status is FAILED');
      }
    }
  }

  private validateDateRangeBusinessRules(dateRange: z.infer<typeof DateRangeSchema>): void {
    const now = new Date();
    const maxHistoricalRange = new Date(now.getTime() - (365 * 2 * 24 * 60 * 60 * 1000)); // 2 years ago
    const maxFutureRange = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year ahead

    // Validate historical data limits
    if (dateRange.start < maxHistoricalRange) {
      throw new Error('Date range cannot exceed 2 years of historical data');
    }

    // Validate future date limits
    if (dateRange.end > maxFutureRange) {
      throw new Error('Date range cannot exceed 1 year into the future');
    }

    // Validate range duration
    const rangeDuration = dateRange.end.getTime() - dateRange.start.getTime();
    const maxDuration = 90 * 24 * 60 * 60 * 1000; // 90 days

    if (rangeDuration > maxDuration) {
      throw new Error('Date range cannot exceed 90 days');
    }
  }

  private validateStaffAssignmentBusinessRules(assignment: z.infer<typeof StaffAssignmentSchema>): void {
    // Validate assignment duration
    if (assignment.endDate) {
      if (assignment.endDate <= assignment.startDate) {
        throw new Error('End date must be after start date');
      }

      const duration = assignment.endDate.getTime() - assignment.startDate.getTime();
      const maxDuration = 365 * 24 * 60 * 60 * 1000; // 1 year

      if (duration > maxDuration) {
        throw new Error('Staff assignment cannot exceed 1 year');
      }
    }

    // Validate role-specific requirements
    const roleRequirements: Record<string, { minCertifications?: number; requiredPermissions?: string[] }> = {
      'MANAGER': { minCertifications: 2, requiredPermissions: ['FULL_ACCESS', 'STAFF_MANAGEMENT'] },
      'QUALITY_INSPECTOR': { minCertifications: 1, requiredPermissions: ['QUALITY_CONTROL'] },
      'SECURITY': { minCertifications: 1, requiredPermissions: ['SECURITY_ACCESS'] }
    };

    const requirements = roleRequirements[assignment.role];
    if (requirements) {
      if (requirements.minCertifications && 
          (!assignment.certifications || assignment.certifications.length < requirements.minCertifications)) {
        throw new Error(`${assignment.role} requires at least ${requirements.minCertifications} certifications`);
      }

      if (requirements.requiredPermissions && assignment.permissions) {
        const hasRequiredPermissions = requirements.requiredPermissions.every(
          perm => assignment.permissions!.includes(perm)
        );
        if (!hasRequiredPermissions) {
          throw new Error(`${assignment.role} requires permissions: ${requirements.requiredPermissions.join(', ')}`);
        }
      }
    }
  }

  private validateComplianceBusinessRules(compliance: z.infer<typeof RegionalComplianceSchema>): void {
    // Validate region-specific requirements
    const regionRequirements: Record<string, { minRegulations: number; requiredTypes: string[] }> = {
      'US_WEST': { minRegulations: 3, requiredTypes: ['SAFETY', 'ENVIRONMENTAL'] },
      'EU': { minRegulations: 4, requiredTypes: ['SAFETY', 'ENVIRONMENTAL', 'LABOR'] },
      'JAPAN': { minRegulations: 3, requiredTypes: ['SAFETY', 'QUALITY'] },
      'AUSTRALIA': { minRegulations: 2, requiredTypes: ['SAFETY'] }
    };

    const requirements = regionRequirements[compliance.region];
    if (requirements) {
      if (compliance.regulations.length < requirements.minRegulations) {
        throw new Error(`${compliance.region} requires at least ${requirements.minRegulations} regulations`);
      }

      const regulationTypes = compliance.regulations.map(reg => reg.type);
      const hasRequiredTypes = requirements.requiredTypes.every(
        type => regulationTypes.includes(type)
      );
      if (!hasRequiredTypes) {
        throw new Error(`${compliance.region} requires regulation types: ${requirements.requiredTypes.join(', ')}`);
      }
    }

    // Validate certification expiration dates
    if (compliance.certifications) {
      const now = new Date();
      const expiredCertifications = compliance.certifications.filter(cert => cert.validTo < now);
      
      if (expiredCertifications.length > 0) {
        logger.warn('Expired certifications detected', {
          region: compliance.region,
          expired: expiredCertifications.map(cert => cert.name)
        });
      }
    }
  }

  private formatZodError(error: unknown): string {
    if (error instanceof z.ZodError) {
      return error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('; ');
    }
    return error instanceof Error ? error.message : 'Unknown validation error';
  }
}

// Export schemas for external use
export {
  WarehouseSchema,
  WarehouseQuerySchema,
  WarehouseOperationSchema,
  InventoryUpdateSchema,
  DateRangeSchema,
  StaffAssignmentSchema,
  PerformanceMetricsQuerySchema,
  RegionalComplianceSchema
};