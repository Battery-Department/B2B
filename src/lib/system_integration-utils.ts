/**
 * System Integration Utilities - RHY_071
 * Comprehensive utility functions for API Gateway and Integration Hub
 * Supports data transformation, validation, caching, and monitoring
 */

import { 
  IntegrationConfig, 
  IntegrationRequest, 
  IntegrationResponse,
  TransformationRule,
  FlexVoltIntegrationData,
  FlexVoltOrderData,
  WebhookEvent,
  SyncResult
} from '@/types/system_integration'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

/**
 * Data transformation utilities for system integrations
 */
export const integrationUtils = {
  
  /**
   * Transform FlexVolt product data for external systems
   */
  transformFlexVoltProduct: (productData: any): FlexVoltIntegrationData => {
    return {
      batterySpecs: {
        voltage: productData.voltage || '20V',
        capacity: productData.capacity || '6Ah',
        chemistry: 'Li-Ion',
        compatibility: productData.compatibility || ['20V MAX', '60V MAX']
      },
      warehouseData: {
        location: productData.warehouse || 'US_WEST',
        inventory: productData.inventory || 0,
        reserved: productData.reserved || 0,
        available: Math.max(0, (productData.inventory || 0) - (productData.reserved || 0))
      },
      supplierData: {
        tier: productData.supplierTier || 'DIRECT',
        discountLevel: productData.discountLevel || 0,
        creditLimit: productData.creditLimit || 10000,
        paymentTerms: productData.paymentTerms || 'NET_30'
      }
    }
  },

  /**
   * Transform order data for warehouse and ERP systems
   */
  transformOrderData: (orderData: any, warehouseRegion: string): FlexVoltOrderData => {
    const products = (orderData.items || []).map((item: any) => ({
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      batteryType: item.batteryType || '6Ah',
      voltage: item.voltage || '20V'
    }))

    const subtotal = products.reduce((sum, product) => sum + (product.quantity * product.unitPrice), 0)
    const discountPercentage = calculateVolumeDiscount(subtotal, orderData.supplierTier)
    const discount = subtotal * (discountPercentage / 100)
    const tax = (subtotal - discount) * 0.08 // 8% tax rate
    const shipping = calculateShippingCost(subtotal, warehouseRegion)
    const total = subtotal - discount + tax + shipping

    return {
      products,
      pricing: {
        subtotal,
        discount,
        discountPercentage,
        tax,
        shipping,
        total,
        currency: getCurrencyByRegion(warehouseRegion)
      },
      shipping: {
        warehouse: warehouseRegion,
        method: orderData.shippingMethod || 'STANDARD',
        estimatedDelivery: calculateDeliveryDate(warehouseRegion, orderData.shippingMethod),
        trackingNumber: orderData.trackingNumber
      }
    }
  },

  /**
   * Apply transformation rules to data
   */
  applyTransformationRules: (data: any, rules: TransformationRule[]): any => {
    let transformedData = { ...data }

    // Sort rules by priority
    const sortedRules = rules.sort((a, b) => a.priority - b.priority)

    for (const rule of sortedRules) {
      if (!rule.isActive) continue

      // Check condition if present
      if (rule.condition && !evaluateCondition(transformedData, rule.condition)) {
        continue
      }

      try {
        transformedData = applyTransformation(transformedData, rule)
      } catch (error) {
        logger.warn(`Failed to apply transformation rule ${rule.id}:`, error)
      }
    }

    return transformedData
  },

  /**
   * Validate integration data against schema
   */
  validateIntegrationData: (data: any, schema: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    try {
      // Basic validation logic
      if (schema.required) {
        for (const field of schema.required) {
          if (!data[field]) {
            errors.push(`Required field '${field}' is missing`)
          }
        }
      }

      if (schema.properties) {
        for (const [field, fieldSchema] of Object.entries(schema.properties as any)) {
          if (data[field] !== undefined) {
            const fieldErrors = validateField(data[field], fieldSchema, field)
            errors.push(...fieldErrors)
          }
        }
      }

      return { valid: errors.length === 0, errors }
    } catch (error) {
      return { valid: false, errors: ['Validation error: ' + (error instanceof Error ? error.message : 'Unknown error')] }
    }
  },

  /**
   * Generate cache key for integration requests
   */
  generateCacheKey: (request: IntegrationRequest): string => {
    const keyComponents = [
      'integration',
      request.integrationId,
      request.method,
      request.endpoint,
      request.supplierId,
      request.warehouse || 'default'
    ]

    if (request.queryParams) {
      keyComponents.push(JSON.stringify(request.queryParams))
    }

    if (request.data && request.method === 'GET') {
      keyComponents.push(JSON.stringify(request.data))
    }

    return keyComponents.join(':')
  },

  /**
   * Calculate request hash for idempotency
   */
  calculateRequestHash: (request: IntegrationRequest): string => {
    const hashData = {
      integrationId: request.integrationId,
      operation: request.operation,
      method: request.method,
      endpoint: request.endpoint,
      data: request.data,
      supplierId: request.supplierId,
      warehouse: request.warehouse
    }

    return crypto.createHash('sha256')
      .update(JSON.stringify(hashData))
      .digest('hex')
  },

  /**
   * Format integration response for different consumers
   */
  formatResponse: (response: IntegrationResponse, format: 'json' | 'xml' | 'csv'): string => {
    switch (format) {
      case 'xml':
        return jsonToXml(response)
      case 'csv':
        return jsonToCsv(response.data)
      case 'json':
      default:
        return JSON.stringify(response, null, 2)
    }
  },

  /**
   * Parse and normalize webhook payload
   */
  normalizeWebhookPayload: (payload: any, integrationId: string): WebhookEvent => {
    return {
      id: payload.id || crypto.randomUUID(),
      type: payload.type || 'unknown',
      source: integrationId,
      data: payload.data || payload,
      timestamp: payload.timestamp || new Date().toISOString(),
      version: payload.version || '1.0',
      correlationId: payload.correlationId,
      metadata: payload.metadata || {}
    }
  },

  /**
   * Calculate synchronization metrics
   */
  calculateSyncMetrics: (results: SyncResult[]): any => {
    const totalResults = results.length
    const successfulSyncs = results.filter(r => r.status === 'SUCCESS').length
    const partialSyncs = results.filter(r => r.status === 'PARTIAL_SUCCESS').length
    const failedSyncs = results.filter(r => r.status === 'FAILURE').length

    const totalRecordsProcessed = results.reduce((sum, r) => sum + r.recordsProcessed, 0)
    const totalRecordsSuccessful = results.reduce((sum, r) => sum + r.recordsSuccessful, 0)
    const totalRecordsFailed = results.reduce((sum, r) => sum + r.recordsFailed, 0)

    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / totalResults

    return {
      summary: {
        totalSyncs: totalResults,
        successRate: totalResults > 0 ? (successfulSyncs / totalResults) * 100 : 0,
        partialSuccessRate: totalResults > 0 ? (partialSyncs / totalResults) * 100 : 0,
        failureRate: totalResults > 0 ? (failedSyncs / totalResults) * 100 : 0
      },
      records: {
        totalProcessed: totalRecordsProcessed,
        totalSuccessful: totalRecordsSuccessful,
        totalFailed: totalRecordsFailed,
        successRate: totalRecordsProcessed > 0 ? (totalRecordsSuccessful / totalRecordsProcessed) * 100 : 0
      },
      performance: {
        averageDuration: avgDuration,
        throughput: avgDuration > 0 ? totalRecordsProcessed / (avgDuration / 1000) : 0
      }
    }
  },

  /**
   * Generate integration health report
   */
  generateHealthReport: (config: IntegrationConfig, metrics: any): any => {
    const healthScore = calculateHealthScore(metrics)
    const status = getHealthStatus(healthScore)

    return {
      integrationId: config.id,
      name: config.name,
      type: config.type,
      status,
      healthScore,
      lastCheck: new Date().toISOString(),
      metrics: {
        availability: metrics.availability || 0,
        responseTime: metrics.averageResponseTime || 0,
        errorRate: metrics.errorRate || 0,
        throughput: metrics.throughput || 0
      },
      recommendations: generateHealthRecommendations(healthScore, metrics),
      configuration: {
        isActive: config.isActive,
        timeout: config.timeout,
        retryAttempts: config.retryAttempts,
        rateLimit: config.rateLimit
      }
    }
  }
}

/**
 * Helper functions for internal operations
 */

function calculateVolumeDiscount(orderValue: number, supplierTier: string): number {
  const discountTiers = {
    DIRECT: [
      { threshold: 1000, discount: 10 },
      { threshold: 2500, discount: 15 },
      { threshold: 5000, discount: 20 },
      { threshold: 7500, discount: 25 }
    ],
    DISTRIBUTOR: [
      { threshold: 500, discount: 15 },
      { threshold: 2000, discount: 20 },
      { threshold: 5000, discount: 25 },
      { threshold: 10000, discount: 30 }
    ],
    RETAILER: [
      { threshold: 1000, discount: 5 },
      { threshold: 3000, discount: 10 },
      { threshold: 7500, discount: 15 }
    ],
    FLEET_MANAGER: [
      { threshold: 2500, discount: 20 },
      { threshold: 10000, discount: 25 },
      { threshold: 25000, discount: 30 }
    ],
    SERVICE_PARTNER: [
      { threshold: 1500, discount: 15 },
      { threshold: 5000, discount: 20 },
      { threshold: 15000, discount: 25 }
    ]
  }

  const tiers = discountTiers[supplierTier as keyof typeof discountTiers] || discountTiers.DIRECT
  
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (orderValue >= tiers[i].threshold) {
      return tiers[i].discount
    }
  }

  return 0
}

function getCurrencyByRegion(region: string): 'USD' | 'EUR' | 'JPY' | 'AUD' {
  const currencyMap = {
    US_WEST: 'USD',
    US_EAST: 'USD',
    JAPAN: 'JPY',
    EU: 'EUR',
    AUSTRALIA: 'AUD'
  }
  return currencyMap[region as keyof typeof currencyMap] || 'USD'
}

function calculateShippingCost(orderValue: number, region: string): number {
  const baseCosts = {
    US_WEST: 15,
    US_EAST: 20,
    JAPAN: 45,
    EU: 35,
    AUSTRALIA: 40
  }

  const baseCost = baseCosts[region as keyof typeof baseCosts] || 25

  // Free shipping for orders over $500
  if (orderValue >= 500) {
    return 0
  }

  return baseCost
}

function calculateDeliveryDate(region: string, shippingMethod: string = 'STANDARD'): string {
  const businessDays = {
    STANDARD: {
      US_WEST: 3,
      US_EAST: 5,
      JAPAN: 7,
      EU: 10,
      AUSTRALIA: 12
    },
    EXPRESS: {
      US_WEST: 1,
      US_EAST: 2,
      JAPAN: 3,
      EU: 5,
      AUSTRALIA: 7
    },
    OVERNIGHT: {
      US_WEST: 1,
      US_EAST: 1,
      JAPAN: 2,
      EU: 3,
      AUSTRALIA: 5
    }
  }

  const days = businessDays[shippingMethod as keyof typeof businessDays]?.[region as keyof typeof businessDays.STANDARD] || 5
  const deliveryDate = new Date()
  deliveryDate.setDate(deliveryDate.getDate() + days)
  
  return deliveryDate.toISOString().split('T')[0]
}

function evaluateCondition(data: any, condition: any): boolean {
  const fieldValue = getNestedValue(data, condition.field)

  switch (condition.operator) {
    case 'EQUALS':
      return fieldValue === condition.value
    case 'NOT_EQUALS':
      return fieldValue !== condition.value
    case 'CONTAINS':
      return String(fieldValue).includes(String(condition.value))
    case 'NOT_CONTAINS':
      return !String(fieldValue).includes(String(condition.value))
    case 'GREATER_THAN':
      return Number(fieldValue) > Number(condition.value)
    case 'LESS_THAN':
      return Number(fieldValue) < Number(condition.value)
    case 'EXISTS':
      return fieldValue !== undefined && fieldValue !== null
    case 'NOT_EXISTS':
      return fieldValue === undefined || fieldValue === null
    default:
      return false
  }
}

function applyTransformation(data: any, rule: TransformationRule): any {
  const transformedData = { ...data }
  const sourceValue = getNestedValue(data, rule.sourceField)

  switch (rule.transformation) {
    case 'DIRECT':
      setNestedValue(transformedData, rule.targetField, sourceValue)
      break
    case 'FORMAT':
      const formatted = formatValue(sourceValue, rule.parameters?.format)
      setNestedValue(transformedData, rule.targetField, formatted)
      break
    case 'LOOKUP':
      const lookupValue = lookupMapping(sourceValue, rule.parameters?.mapping)
      setNestedValue(transformedData, rule.targetField, lookupValue)
      break
    case 'CALCULATE':
      const calculated = calculateValue(data, rule.parameters?.calculation)
      setNestedValue(transformedData, rule.targetField, calculated)
      break
    case 'AGGREGATE':
      const aggregated = aggregateValues(data, rule.parameters)
      setNestedValue(transformedData, rule.targetField, aggregated)
      break
  }

  return transformedData
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {}
    return current[key]
  }, obj)
  target[lastKey] = value
}

function formatValue(value: any, format?: string): any {
  if (!format) return value

  switch (format) {
    case 'uppercase':
      return String(value).toUpperCase()
    case 'lowercase':
      return String(value).toLowerCase()
    case 'currency':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value))
    case 'date':
      return new Date(value).toISOString().split('T')[0]
    case 'datetime':
      return new Date(value).toISOString()
    default:
      return value
  }
}

function lookupMapping(value: any, mapping?: Record<string, any>): any {
  if (!mapping) return value
  return mapping[String(value)] || value
}

function calculateValue(data: any, calculation?: string): any {
  if (!calculation) return 0

  try {
    // Simple calculation evaluation (in production, use a safe expression evaluator)
    const expression = calculation.replace(/\{([^}]+)\}/g, (match, fieldPath) => {
      const value = getNestedValue(data, fieldPath)
      return String(value || 0)
    })
    
    // Basic arithmetic evaluation (simplified - use proper parser in production)
    return eval(expression)
  } catch (error) {
    logger.warn('Failed to calculate value:', error)
    return 0
  }
}

function aggregateValues(data: any, parameters?: any): any {
  if (!parameters || !parameters.fields) return null

  const values = parameters.fields.map((field: string) => getNestedValue(data, field)).filter((v: any) => v !== undefined)

  switch (parameters.operation) {
    case 'SUM':
      return values.reduce((sum: number, val: number) => sum + Number(val), 0)
    case 'AVERAGE':
      return values.length > 0 ? values.reduce((sum: number, val: number) => sum + Number(val), 0) / values.length : 0
    case 'MIN':
      return Math.min(...values.map(Number))
    case 'MAX':
      return Math.max(...values.map(Number))
    case 'COUNT':
      return values.length
    default:
      return values[0]
  }
}

function validateField(value: any, schema: any, fieldName: string): string[] {
  const errors: string[] = []

  if (schema.type) {
    const expectedType = schema.type
    const actualType = typeof value

    if (expectedType === 'number' && actualType !== 'number') {
      errors.push(`Field '${fieldName}' should be a number, got ${actualType}`)
    } else if (expectedType === 'string' && actualType !== 'string') {
      errors.push(`Field '${fieldName}' should be a string, got ${actualType}`)
    } else if (expectedType === 'boolean' && actualType !== 'boolean') {
      errors.push(`Field '${fieldName}' should be a boolean, got ${actualType}`)
    }
  }

  if (schema.minLength && String(value).length < schema.minLength) {
    errors.push(`Field '${fieldName}' should have at least ${schema.minLength} characters`)
  }

  if (schema.maxLength && String(value).length > schema.maxLength) {
    errors.push(`Field '${fieldName}' should have at most ${schema.maxLength} characters`)
  }

  if (schema.pattern && !new RegExp(schema.pattern).test(String(value))) {
    errors.push(`Field '${fieldName}' does not match the required pattern`)
  }

  return errors
}

function jsonToXml(obj: any, rootElement = 'root'): string {
  const toXml = (data: any, name: string): string => {
    if (Array.isArray(data)) {
      return data.map(item => toXml(item, name.slice(0, -1))).join('')
    }
    
    if (typeof data === 'object' && data !== null) {
      const children = Object.entries(data)
        .map(([key, value]) => toXml(value, key))
        .join('')
      return `<${name}>${children}</${name}>`
    }
    
    return `<${name}>${String(data)}</${name}>`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>${toXml(obj, rootElement)}`
}

function jsonToCsv(data: any): string {
  if (!Array.isArray(data)) {
    data = [data]
  }

  if (data.length === 0) {
    return ''
  }

  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')
  
  const csvRows = data.map((row: any) => 
    headers.map(header => {
      const value = row[header]
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : String(value || '')
    }).join(',')
  )

  return [csvHeaders, ...csvRows].join('\n')
}

function calculateHealthScore(metrics: any): number {
  const weights = {
    availability: 0.4,
    responseTime: 0.3,
    errorRate: 0.2,
    throughput: 0.1
  }

  const availabilityScore = Math.min(100, (metrics.availability || 0))
  const responseTimeScore = Math.max(0, 100 - ((metrics.averageResponseTime || 0) / 1000) * 10)
  const errorRateScore = Math.max(0, 100 - (metrics.errorRate || 0) * 10)
  const throughputScore = Math.min(100, (metrics.throughput || 0) / 10)

  return Math.round(
    availabilityScore * weights.availability +
    responseTimeScore * weights.responseTime +
    errorRateScore * weights.errorRate +
    throughputScore * weights.throughput
  )
}

function getHealthStatus(healthScore: number): string {
  if (healthScore >= 90) return 'HEALTHY'
  if (healthScore >= 70) return 'DEGRADED'
  if (healthScore >= 50) return 'UNHEALTHY'
  return 'CRITICAL'
}

function generateHealthRecommendations(healthScore: number, metrics: any): string[] {
  const recommendations: string[] = []

  if (healthScore < 90) {
    if (metrics.errorRate > 5) {
      recommendations.push('High error rate detected. Review error logs and implement error handling improvements.')
    }

    if (metrics.averageResponseTime > 5000) {
      recommendations.push('Response time is high. Consider optimizing API endpoints or increasing timeout values.')
    }

    if (metrics.availability < 95) {
      recommendations.push('Low availability detected. Check integration health and implement circuit breaker patterns.')
    }

    if (metrics.throughput < 10) {
      recommendations.push('Low throughput detected. Consider increasing concurrent request limits or optimizing data processing.')
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Integration is performing well. Continue monitoring for any changes.')
  }

  return recommendations
}

// Export utility functions for external use
export const {
  transformFlexVoltProduct,
  transformOrderData,
  applyTransformationRules,
  validateIntegrationData,
  generateCacheKey,
  calculateRequestHash,
  formatResponse,
  normalizeWebhookPayload,
  calculateSyncMetrics,
  generateHealthReport
} = integrationUtils