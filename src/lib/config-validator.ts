/**
 * RHY Supplier Portal - Configuration Validation System
 * Enterprise-grade configuration validation with comprehensive error handling,
 * security validation, and performance monitoring for global warehouse operations
 */

import { z } from 'zod'
import { WAREHOUSES, FLEXVOLT_PRODUCTS, SUPPLIER_TYPES } from '@/config/app'
import { getEnvironmentConfig, validateEnvironment } from '@/config/environment'

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: ValidationSuggestion[]
  performance: PerformanceMetrics
}

export interface ValidationError {
  code: string
  message: string
  field: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: 'security' | 'performance' | 'compliance' | 'functional'
  suggestion?: string
}

export interface ValidationWarning {
  code: string
  message: string
  field: string
  recommendation: string
}

export interface ValidationSuggestion {
  code: string
  message: string
  field: string
  improvement: string
  impact: 'high' | 'medium' | 'low'
}

export interface PerformanceMetrics {
  validationTime: number
  memoryUsage: number
  configSize: number
  cacheHits: number
  cacheMisses: number
}

// ============================================================================
// CONFIGURATION SCHEMAS
// ============================================================================

const WarehouseOperationsSchema = z.object({
  warehouseId: z.enum(['us-west', 'japan', 'eu', 'australia']),
  operatingHours: z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    timezone: z.string().min(1)
  }),
  inventoryLevels: z.object({
    minimum: z.number().int().min(0).max(10000),
    maximum: z.number().int().min(0).max(100000),
    reorderPoint: z.number().int().min(0).max(10000)
  }),
  complianceSettings: z.object({
    enabled: z.boolean(),
    standards: z.array(z.string()),
    auditInterval: z.number().int().min(1).max(365),
    documentationRequired: z.boolean()
  }),
  shippingConfiguration: z.object({
    providers: z.array(z.enum(['fedex', 'ups', 'dhl', 'local'])),
    defaultProvider: z.enum(['fedex', 'ups', 'dhl', 'local']),
    expressEnabled: z.boolean(),
    internationalEnabled: z.boolean()
  })
})

const SupplierAccessSchema = z.object({
  supplierId: z.string().uuid('Invalid supplier ID format'),
  supplierType: z.enum(['direct', 'distributor', 'retailer', 'fleet_manager', 'service_partner']),
  permissions: z.object({
    warehouses: z.array(z.enum(['us-west', 'japan', 'eu', 'australia'])),
    actions: z.array(z.string()),
    dataAccess: z.enum(['full', 'limited', 'read_only']),
    adminFunctions: z.boolean()
  }),
  securitySettings: z.object({
    mfaRequired: z.boolean(),
    passwordExpiration: z.number().int().min(30).max(365),
    sessionTimeout: z.number().int().min(900).max(86400),
    ipWhitelist: z.array(z.string().ip()).optional(),
    rateLimiting: z.object({
      requestsPerMinute: z.number().int().min(10).max(1000),
      burstLimit: z.number().int().min(5).max(100)
    })
  })
})

const ProductConfigurationSchema = z.object({
  productId: z.enum(['flexvolt-6ah', 'flexvolt-9ah', 'flexvolt-15ah']),
  availability: z.object({
    warehouses: z.array(z.enum(['us-west', 'japan', 'eu', 'australia'])),
    regions: z.array(z.string()),
    restrictions: z.array(z.string()).optional()
  }),
  pricing: z.object({
    basePrice: z.number().positive().max(1000),
    currency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'AUD']),
    volumeDiscounts: z.array(z.object({
      threshold: z.number().int().min(1),
      percentage: z.number().min(0).max(50)
    })),
    regionalPricing: z.record(z.string(), z.number().positive()).optional()
  }),
  specifications: z.object({
    capacity: z.string(),
    voltage: z.string(),
    weight: z.string(),
    dimensions: z.object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
      unit: z.enum(['mm', 'cm', 'in'])
    }).optional(),
    certifications: z.array(z.string()),
    warranty: z.object({
      period: z.number().int().min(12).max(60),
      coverage: z.enum(['standard', 'extended', 'comprehensive'])
    })
  })
})

const SystemPerformanceSchema = z.object({
  database: z.object({
    connectionPoolSize: z.number().int().min(5).max(100),
    queryTimeout: z.number().int().min(1000).max(120000),
    slowQueryThreshold: z.number().int().min(100).max(10000),
    enableQueryLogging: z.boolean(),
    enablePerformanceInsights: z.boolean()
  }),
  api: z.object({
    rateLimiting: z.object({
      enabled: z.boolean(),
      requestsPerWindow: z.number().int().min(10).max(10000),
      windowSizeMinutes: z.number().int().min(1).max(60),
      burstLimit: z.number().int().min(5).max(1000)
    }),
    timeout: z.number().int().min(5000).max(300000),
    retryPolicy: z.object({
      maxRetries: z.number().int().min(0).max(10),
      backoffMultiplier: z.number().min(1).max(5),
      initialDelay: z.number().int().min(100).max(10000)
    }),
    compression: z.object({
      enabled: z.boolean(),
      algorithm: z.enum(['gzip', 'brotli', 'deflate']),
      level: z.number().int().min(1).max(9)
    })
  }),
  caching: z.object({
    enabled: z.boolean(),
    provider: z.enum(['redis', 'memory', 'hybrid']),
    ttl: z.number().int().min(60).max(86400),
    maxMemoryUsage: z.number().int().min(64).max(8192),
    compressionEnabled: z.boolean()
  }),
  monitoring: z.object({
    metricsEnabled: z.boolean(),
    tracingEnabled: z.boolean(),
    loggingLevel: z.enum(['error', 'warn', 'info', 'debug']),
    alerting: z.object({
      enabled: z.boolean(),
      channels: z.array(z.enum(['email', 'slack', 'webhook'])),
      thresholds: z.object({
        responseTime: z.number().int().min(100).max(10000),
        errorRate: z.number().min(0).max(100),
        memoryUsage: z.number().min(0).max(100),
        cpuUsage: z.number().min(0).max(100)
      })
    })
  })
})

const SecurityConfigurationSchema = z.object({
  authentication: z.object({
    provider: z.enum(['jwt', 'oauth2', 'saml']),
    jwtSettings: z.object({
      algorithm: z.enum(['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512']),
      expirationTime: z.string().regex(/^\d+[smhd]$/, 'Invalid duration format'),
      refreshTokenEnabled: z.boolean(),
      refreshTokenTTL: z.string().regex(/^\d+[smhd]$/, 'Invalid duration format')
    }).optional(),
    mfaSettings: z.object({
      required: z.boolean(),
      providers: z.array(z.enum(['totp', 'sms', 'email', 'hardware'])),
      backupCodes: z.boolean(),
      gracePeriod: z.number().int().min(0).max(30)
    }),
    passwordPolicy: z.object({
      minLength: z.number().int().min(8).max(128),
      requireUppercase: z.boolean(),
      requireLowercase: z.boolean(),
      requireNumbers: z.boolean(),
      requireSpecialChars: z.boolean(),
      maxAge: z.number().int().min(30).max(365),
      historySize: z.number().int().min(0).max(24)
    })
  }),
  authorization: z.object({
    rbacEnabled: z.boolean(),
    permissions: z.array(z.string()),
    roleHierarchy: z.record(z.string(), z.array(z.string())),
    resourceAccess: z.record(z.string(), z.array(z.string()))
  }),
  dataProtection: z.object({
    encryptionAtRest: z.boolean(),
    encryptionInTransit: z.boolean(),
    encryptionAlgorithm: z.enum(['AES-256-GCM', 'ChaCha20-Poly1305']),
    keyRotation: z.object({
      enabled: z.boolean(),
      interval: z.number().int().min(30).max(365),
      automaticRotation: z.boolean()
    }),
    dataRetention: z.object({
      auditLogs: z.number().int().min(30).max(2555), // 7 years
      userData: z.number().int().min(30).max(2555),
      systemLogs: z.number().int().min(7).max(365)
    }),
    gdprCompliance: z.object({
      enabled: z.boolean(),
      dataPortability: z.boolean(),
      rightToErasure: z.boolean(),
      consentManagement: z.boolean()
    })
  })
})

// ============================================================================
// VALIDATION CACHE
// ============================================================================

class ValidationCache {
  private cache = new Map<string, { result: ValidationResult; timestamp: number }>()
  private readonly ttl = 300000 // 5 minutes
  private hits = 0
  private misses = 0

  get(key: string): ValidationResult | null {
    const cached = this.cache.get(key)
    if (!cached) {
      this.misses++
      return null
    }

    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key)
      this.misses++
      return null
    }

    this.hits++
    return cached.result
  }

  set(key: string, result: ValidationResult): void {
    this.cache.set(key, { result, timestamp: Date.now() })
  }

  getStats() {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) * 100
    }
  }

  clear(): void {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
  }
}

const validationCache = new ValidationCache()

// ============================================================================
// CONFIGURATION VALIDATOR CLASS
// ============================================================================

export class ConfigurationValidator {
  private startTime: number = 0
  private errors: ValidationError[] = []
  private warnings: ValidationWarning[] = []
  private suggestions: ValidationSuggestion[] = []

  /**
   * Validate complete RHY system configuration
   */
  async validateSystemConfiguration(config: any): Promise<ValidationResult> {
    this.startMemoryTracking()
    const cacheKey = this.generateCacheKey(config)
    
    // Check cache first
    const cached = validationCache.get(cacheKey)
    if (cached) {
      return cached
    }

    this.reset()
    
    try {
      // Validate environment configuration
      await this.validateEnvironmentConfiguration()
      
      // Validate warehouse operations
      await this.validateWarehouseOperations(config.warehouses)
      
      // Validate supplier access configuration
      await this.validateSupplierAccess(config.suppliers)
      
      // Validate product configuration
      await this.validateProductConfiguration(config.products)
      
      // Validate system performance settings
      await this.validateSystemPerformance(config.performance)
      
      // Validate security configuration
      await this.validateSecurityConfiguration(config.security)
      
      // Run integration tests
      await this.validateIntegrations(config.integrations)
      
      // Check business rules compliance
      await this.validateBusinessRules(config)
      
      // Performance and optimization checks
      await this.validatePerformanceOptimization(config)

    } catch (error) {
      this.addError({
        code: 'VALIDATION_SYSTEM_ERROR',
        message: `System validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        field: 'system',
        severity: 'critical',
        category: 'functional'
      })
    }

    const result = this.buildValidationResult()
    validationCache.set(cacheKey, result)
    
    return result
  }

  /**
   * Validate environment configuration
   */
  private async validateEnvironmentConfiguration(): Promise<void> {
    const envValidation = validateEnvironment()
    
    if (!envValidation.valid) {
      envValidation.errors.forEach(error => {
        this.addError({
          code: 'ENV_VALIDATION_ERROR',
          message: error,
          field: 'environment',
          severity: 'critical',
          category: 'functional'
        })
      })
    }

    const config = getEnvironmentConfig()
    
    // Security validations
    if (config.security.jwtSecret.length < 32) {
      this.addError({
        code: 'WEAK_JWT_SECRET',
        message: 'JWT secret is too short (minimum 32 characters)',
        field: 'security.jwtSecret',
        severity: 'critical',
        category: 'security',
        suggestion: 'Generate a strong, random secret key with at least 32 characters'
      })
    }

    if (config.app.nodeEnv === 'production' && config.security.corsOrigin === '*') {
      this.addError({
        code: 'INSECURE_CORS',
        message: 'CORS origin set to wildcard in production',
        field: 'security.corsOrigin',
        severity: 'high',
        category: 'security',
        suggestion: 'Specify exact origins for production deployment'
      })
    }

    // Performance validations
    if (config.database.poolSize > 50) {
      this.addWarning({
        code: 'HIGH_DB_POOL_SIZE',
        message: 'Database pool size is very high',
        field: 'database.poolSize',
        recommendation: 'Consider reducing pool size to optimize memory usage'
      })
    }

    // Feature flag validations
    if (config.features.predictiveOrdering && !config.ai.openaiApiKey) {
      this.addError({
        code: 'MISSING_AI_CONFIG',
        message: 'Predictive ordering enabled but AI configuration missing',
        field: 'features.predictiveOrdering',
        severity: 'medium',
        category: 'functional',
        suggestion: 'Configure AI API keys or disable predictive ordering'
      })
    }
  }

  /**
   * Validate warehouse operations
   */
  private async validateWarehouseOperations(warehouseConfigs: any[]): Promise<void> {
    if (!Array.isArray(warehouseConfigs)) {
      this.addError({
        code: 'INVALID_WAREHOUSE_CONFIG',
        message: 'Warehouse configuration must be an array',
        field: 'warehouses',
        severity: 'critical',
        category: 'functional'
      })
      return
    }

    for (const [index, config] of warehouseConfigs.entries()) {
      try {
        WarehouseOperationsSchema.parse(config)
        
        // Business rule validations
        if (config.inventoryLevels.minimum >= config.inventoryLevels.maximum) {
          this.addError({
            code: 'INVALID_INVENTORY_LEVELS',
            message: 'Minimum inventory level must be less than maximum',
            field: `warehouses[${index}].inventoryLevels`,
            severity: 'medium',
            category: 'functional'
          })
        }

        if (config.inventoryLevels.reorderPoint <= config.inventoryLevels.minimum) {
          this.addWarning({
            code: 'LOW_REORDER_POINT',
            message: 'Reorder point should be higher than minimum inventory level',
            field: `warehouses[${index}].inventoryLevels.reorderPoint`,
            recommendation: 'Set reorder point above minimum level to prevent stockouts'
          })
        }

        // Check if warehouse exists in system
        const warehouseExists = Object.values(WAREHOUSES).some(w => w.id === config.warehouseId)
        if (!warehouseExists) {
          this.addError({
            code: 'UNKNOWN_WAREHOUSE',
            message: `Warehouse '${config.warehouseId}' not found in system configuration`,
            field: `warehouses[${index}].warehouseId`,
            severity: 'high',
            category: 'functional'
          })
        }

      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            this.addError({
              code: 'WAREHOUSE_SCHEMA_ERROR',
              message: err.message,
              field: `warehouses[${index}].${err.path.join('.')}`,
              severity: 'medium',
              category: 'functional'
            })
          })
        }
      }
    }
  }

  /**
   * Validate supplier access configuration
   */
  private async validateSupplierAccess(supplierConfigs: any[]): Promise<void> {
    if (!Array.isArray(supplierConfigs)) {
      this.addError({
        code: 'INVALID_SUPPLIER_CONFIG',
        message: 'Supplier configuration must be an array',
        field: 'suppliers',
        severity: 'critical',
        category: 'functional'
      })
      return
    }

    for (const [index, config] of supplierConfigs.entries()) {
      try {
        SupplierAccessSchema.parse(config)
        
        // Validate supplier type exists
        const supplierTypeExists = Object.keys(SUPPLIER_TYPES).includes(config.supplierType.toUpperCase())
        if (!supplierTypeExists) {
          this.addError({
            code: 'UNKNOWN_SUPPLIER_TYPE',
            message: `Supplier type '${config.supplierType}' not recognized`,
            field: `suppliers[${index}].supplierType`,
            severity: 'medium',
            category: 'functional'
          })
        }

        // Security validations
        if (config.securitySettings.sessionTimeout < 900) {
          this.addError({
            code: 'SHORT_SESSION_TIMEOUT',
            message: 'Session timeout too short (minimum 15 minutes)',
            field: `suppliers[${index}].securitySettings.sessionTimeout`,
            severity: 'medium',
            category: 'security'
          })
        }

        if (config.securitySettings.passwordExpiration < 30) {
          this.addWarning({
            code: 'SHORT_PASSWORD_EXPIRY',
            message: 'Password expiration period is very short',
            field: `suppliers[${index}].securitySettings.passwordExpiration`,
            recommendation: 'Consider extending to at least 30 days'
          })
        }

        // Performance validations
        if (config.securitySettings.rateLimiting.requestsPerMinute > 500) {
          this.addWarning({
            code: 'HIGH_RATE_LIMIT',
            message: 'Rate limit is very high, may impact system performance',
            field: `suppliers[${index}].securitySettings.rateLimiting.requestsPerMinute`,
            recommendation: 'Consider reducing to optimize system resources'
          })
        }

      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            this.addError({
              code: 'SUPPLIER_SCHEMA_ERROR',
              message: err.message,
              field: `suppliers[${index}].${err.path.join('.')}`,
              severity: 'medium',
              category: 'functional'
            })
          })
        }
      }
    }
  }

  /**
   * Validate product configuration
   */
  private async validateProductConfiguration(productConfigs: any[]): Promise<void> {
    if (!Array.isArray(productConfigs)) {
      this.addError({
        code: 'INVALID_PRODUCT_CONFIG',
        message: 'Product configuration must be an array',
        field: 'products',
        severity: 'critical',
        category: 'functional'
      })
      return
    }

    for (const [index, config] of productConfigs.entries()) {
      try {
        ProductConfigurationSchema.parse(config)
        
        // Validate product exists in system
        const productExists = Object.values(FLEXVOLT_PRODUCTS).some(p => p.id === config.productId)
        if (!productExists) {
          this.addError({
            code: 'UNKNOWN_PRODUCT',
            message: `Product '${config.productId}' not found in system catalog`,
            field: `products[${index}].productId`,
            severity: 'high',
            category: 'functional'
          })
        }

        // Price validation
        const systemProduct = Object.values(FLEXVOLT_PRODUCTS).find(p => p.id === config.productId)
        if (systemProduct && Math.abs(config.pricing.basePrice - systemProduct.price) > systemProduct.price * 0.1) {
          this.addWarning({
            code: 'PRICE_DEVIATION',
            message: 'Price deviates significantly from system default',
            field: `products[${index}].pricing.basePrice`,
            recommendation: 'Verify pricing is correct'
          })
        }

        // Volume discount validation
        let previousThreshold = 0
        for (const discount of config.pricing.volumeDiscounts) {
          if (discount.threshold <= previousThreshold) {
            this.addError({
              code: 'INVALID_DISCOUNT_THRESHOLDS',
              message: 'Volume discount thresholds must be in ascending order',
              field: `products[${index}].pricing.volumeDiscounts`,
              severity: 'medium',
              category: 'functional'
            })
          }
          previousThreshold = discount.threshold
        }

        // Warranty validation
        if (config.specifications.warranty.period < 12) {
          this.addWarning({
            code: 'SHORT_WARRANTY',
            message: 'Warranty period is less than industry standard',
            field: `products[${index}].specifications.warranty.period`,
            recommendation: 'Consider extending warranty to at least 12 months'
          })
        }

      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            this.addError({
              code: 'PRODUCT_SCHEMA_ERROR',
              message: err.message,
              field: `products[${index}].${err.path.join('.')}`,
              severity: 'medium',
              category: 'functional'
            })
          })
        }
      }
    }
  }

  /**
   * Validate system performance configuration
   */
  private async validateSystemPerformance(performanceConfig: any): Promise<void> {
    try {
      SystemPerformanceSchema.parse(performanceConfig)
      
      // Database performance checks
      if (performanceConfig.database.connectionPoolSize > 50) {
        this.addWarning({
          code: 'HIGH_DB_POOL',
          message: 'Database connection pool size is high',
          field: 'performance.database.connectionPoolSize',
          recommendation: 'Monitor memory usage and consider reducing pool size'
        })
      }

      if (performanceConfig.database.queryTimeout > 30000) {
        this.addWarning({
          code: 'HIGH_QUERY_TIMEOUT',
          message: 'Database query timeout is very high',
          field: 'performance.database.queryTimeout',
          recommendation: 'Consider optimizing queries instead of increasing timeout'
        })
      }

      // API performance checks
      if (performanceConfig.api.rateLimiting.requestsPerWindow > 5000) {
        this.addWarning({
          code: 'HIGH_API_RATE_LIMIT',
          message: 'API rate limit is very high',
          field: 'performance.api.rateLimiting.requestsPerWindow',
          recommendation: 'Ensure system can handle this load'
        })
      }

      // Caching configuration
      if (performanceConfig.caching.enabled && performanceConfig.caching.maxMemoryUsage > 4096) {
        this.addWarning({
          code: 'HIGH_CACHE_MEMORY',
          message: 'Cache memory usage is very high',
          field: 'performance.caching.maxMemoryUsage',
          recommendation: 'Monitor system memory and adjust if needed'
        })
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          this.addError({
            code: 'PERFORMANCE_SCHEMA_ERROR',
            message: err.message,
            field: `performance.${err.path.join('.')}`,
            severity: 'medium',
            category: 'performance'
          })
        })
      }
    }
  }

  /**
   * Validate security configuration
   */
  private async validateSecurityConfiguration(securityConfig: any): Promise<void> {
    try {
      SecurityConfigurationSchema.parse(securityConfig)
      
      // Password policy validation
      const passwordPolicy = securityConfig.authentication.passwordPolicy
      if (passwordPolicy.minLength < 12) {
        this.addError({
          code: 'WEAK_PASSWORD_POLICY',
          message: 'Password minimum length is too short',
          field: 'security.authentication.passwordPolicy.minLength',
          severity: 'high',
          category: 'security',
          suggestion: 'Set minimum password length to at least 12 characters'
        })
      }

      if (!passwordPolicy.requireSpecialChars) {
        this.addWarning({
          code: 'NO_SPECIAL_CHARS_REQUIRED',
          message: 'Password policy does not require special characters',
          field: 'security.authentication.passwordPolicy.requireSpecialChars',
          recommendation: 'Enable special character requirement for stronger passwords'
        })
      }

      // MFA validation
      if (!securityConfig.authentication.mfaSettings.required) {
        this.addError({
          code: 'MFA_NOT_REQUIRED',
          message: 'Multi-factor authentication is not required',
          field: 'security.authentication.mfaSettings.required',
          severity: 'high',
          category: 'security',
          suggestion: 'Enable MFA requirement for enhanced security'
        })
      }

      // Data retention validation
      if (securityConfig.dataProtection.dataRetention.auditLogs < 90) {
        this.addError({
          code: 'SHORT_AUDIT_RETENTION',
          message: 'Audit log retention period is too short for compliance',
          field: 'security.dataProtection.dataRetention.auditLogs',
          severity: 'medium',
          category: 'compliance',
          suggestion: 'Extend audit log retention to at least 90 days'
        })
      }

      // GDPR compliance check
      if (securityConfig.dataProtection.gdprCompliance.enabled) {
        if (!securityConfig.dataProtection.gdprCompliance.rightToErasure) {
          this.addError({
            code: 'GDPR_RIGHT_TO_ERASURE_MISSING',
            message: 'GDPR compliance enabled but right to erasure not implemented',
            field: 'security.dataProtection.gdprCompliance.rightToErasure',
            severity: 'high',
            category: 'compliance'
          })
        }
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          this.addError({
            code: 'SECURITY_SCHEMA_ERROR',
            message: err.message,
            field: `security.${err.path.join('.')}`,
            severity: 'high',
            category: 'security'
          })
        })
      }
    }
  }

  /**
   * Validate integrations
   */
  private async validateIntegrations(integrationConfigs: any): Promise<void> {
    // Validate required integrations are configured
    const requiredIntegrations = ['payment', 'warehouse_management', 'compliance']
    
    for (const integration of requiredIntegrations) {
      if (!integrationConfigs[integration] || !integrationConfigs[integration].enabled) {
        this.addError({
          code: 'MISSING_REQUIRED_INTEGRATION',
          message: `Required integration '${integration}' is not configured or enabled`,
          field: `integrations.${integration}`,
          severity: 'high',
          category: 'functional'
        })
      }
    }

    // Validate integration health
    for (const [name, config] of Object.entries(integrationConfigs) as [string, any][]) {
      if (config.enabled && !config.healthCheckUrl) {
        this.addWarning({
          code: 'NO_HEALTH_CHECK',
          message: `Integration '${name}' has no health check configured`,
          field: `integrations.${name}.healthCheckUrl`,
          recommendation: 'Configure health check endpoint for monitoring'
        })
      }
    }
  }

  /**
   * Validate business rules compliance
   */
  private async validateBusinessRules(config: any): Promise<void> {
    // Validate warehouse coverage
    const configuredWarehouses = config.warehouses?.map((w: any) => w.warehouseId) || []
    const systemWarehouses = Object.keys(WAREHOUSES).map(k => WAREHOUSES[k as keyof typeof WAREHOUSES].id)
    
    const missingWarehouses = systemWarehouses.filter(w => !configuredWarehouses.includes(w))
    if (missingWarehouses.length > 0) {
      this.addWarning({
        code: 'INCOMPLETE_WAREHOUSE_COVERAGE',
        message: `Configuration missing for warehouses: ${missingWarehouses.join(', ')}`,
        field: 'warehouses',
        recommendation: 'Configure all system warehouses for complete coverage'
      })
    }

    // Validate product availability across warehouses
    for (const productConfig of config.products || []) {
      const availableWarehouses = productConfig.availability?.warehouses || []
      if (availableWarehouses.length === 0) {
        this.addError({
          code: 'PRODUCT_NO_WAREHOUSE',
          message: `Product '${productConfig.productId}' is not available in any warehouse`,
          field: `products.${productConfig.productId}.availability.warehouses`,
          severity: 'medium',
          category: 'functional'
        })
      }
    }

    // Validate compliance requirements
    for (const warehouseConfig of config.warehouses || []) {
      const warehouse = Object.values(WAREHOUSES).find(w => w.id === warehouseConfig.warehouseId)
      if (warehouse && warehouse.compliance) {
        const configuredStandards = warehouseConfig.complianceSettings?.standards || []
        const missingStandards = warehouse.compliance.filter(std => !configuredStandards.includes(std))
        
        if (missingStandards.length > 0) {
          this.addError({
            code: 'MISSING_COMPLIANCE_STANDARDS',
            message: `Warehouse '${warehouse.id}' missing compliance standards: ${missingStandards.join(', ')}`,
            field: `warehouses.${warehouse.id}.complianceSettings.standards`,
            severity: 'high',
            category: 'compliance'
          })
        }
      }
    }
  }

  /**
   * Validate performance optimization
   */
  private async validatePerformanceOptimization(config: any): Promise<void> {
    // Check for performance anti-patterns
    if (config.performance?.database?.connectionPoolSize > config.performance?.api?.rateLimiting?.requestsPerWindow / 10) {
      this.addSuggestion({
        code: 'OPTIMIZE_DB_POOL',
        message: 'Database pool size may be too high relative to API rate limits',
        field: 'performance.database.connectionPoolSize',
        improvement: 'Adjust pool size based on expected concurrent requests',
        impact: 'medium'
      })
    }

    // Check caching strategy
    if (!config.performance?.caching?.enabled) {
      this.addSuggestion({
        code: 'ENABLE_CACHING',
        message: 'Caching is disabled, which may impact performance',
        field: 'performance.caching.enabled',
        improvement: 'Enable caching to improve response times',
        impact: 'high'
      })
    }

    // Check monitoring configuration
    if (!config.performance?.monitoring?.metricsEnabled) {
      this.addSuggestion({
        code: 'ENABLE_METRICS',
        message: 'Performance metrics are disabled',
        field: 'performance.monitoring.metricsEnabled',
        improvement: 'Enable metrics collection for performance optimization',
        impact: 'medium'
      })
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private startMemoryTracking(): void {
    this.startTime = Date.now()
  }

  private reset(): void {
    this.errors = []
    this.warnings = []
    this.suggestions = []
  }

  private addError(error: ValidationError): void {
    this.errors.push(error)
  }

  private addWarning(warning: ValidationWarning): void {
    this.warnings.push(warning)
  }

  private addSuggestion(suggestion: ValidationSuggestion): void {
    this.suggestions.push(suggestion)
  }

  private generateCacheKey(config: any): string {
    return `config_${JSON.stringify(config).slice(0, 100)}_${Date.now().toString().slice(-6)}`
  }

  private buildValidationResult(): ValidationResult {
    const endTime = Date.now()
    const cacheStats = validationCache.getStats()
    
    return {
      valid: this.errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
      errors: this.errors,
      warnings: this.warnings,
      suggestions: this.suggestions,
      performance: {
        validationTime: endTime - this.startTime,
        memoryUsage: process.memoryUsage().heapUsed,
        configSize: JSON.stringify({}).length,
        cacheHits: cacheStats.hits,
        cacheMisses: cacheStats.misses
      }
    }
  }
}

// ============================================================================
// MAIN VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate complete system configuration
 */
export async function validateConfiguration(config: any): Promise<ValidationResult> {
  const validator = new ConfigurationValidator()
  return await validator.validateSystemConfiguration(config)
}

/**
 * Quick validation for critical errors only
 */
export async function validateConfigurationQuick(config: any): Promise<{ valid: boolean; criticalErrors: ValidationError[] }> {
  const result = await validateConfiguration(config)
  const criticalErrors = result.errors.filter(e => e.severity === 'critical')
  
  return {
    valid: criticalErrors.length === 0,
    criticalErrors
  }
}

/**
 * Validate specific configuration section
 */
export async function validateConfigurationSection(section: string, config: any): Promise<ValidationResult> {
  const validator = new ConfigurationValidator()
  
  switch (section) {
    case 'warehouse':
      await validator['validateWarehouseOperations'](config)
      break
    case 'supplier':
      await validator['validateSupplierAccess'](config)
      break
    case 'product':
      await validator['validateProductConfiguration'](config)
      break
    case 'security':
      await validator['validateSecurityConfiguration'](config)
      break
    case 'performance':
      await validator['validateSystemPerformance'](config)
      break
    default:
      throw new Error(`Unknown configuration section: ${section}`)
  }
  
  return validator['buildValidationResult']()
}

/**
 * Get validation cache statistics
 */
export function getValidationCacheStats() {
  return validationCache.getStats()
}

/**
 * Clear validation cache
 */
export function clearValidationCache(): void {
  validationCache.clear()
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  WarehouseOperationsSchema,
  SupplierAccessSchema,
  ProductConfigurationSchema,
  SystemPerformanceSchema,
  SecurityConfigurationSchema
}

export default ConfigurationValidator