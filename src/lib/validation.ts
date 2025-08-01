/**
 * RHY Supplier Portal - Enterprise Validation Infrastructure
 * Comprehensive validation schemas and utilities for multi-warehouse operations
 * Implements input sanitization, business rule validation, and compliance checks
 */

import { z, ZodError, ZodSchema } from 'zod'
import { APIErrorCode, createValidationErrorResponse } from './api-response'
import { NextRequest } from 'next/server'

// Enhanced validation result type
export interface ValidationResult<T> {
  success: boolean
  data?: T
  error?: {
    code: APIErrorCode
    message: string
    field?: string
    details?: any
  }
  warnings?: Array<{
    field: string
    message: string
    code: string
  }>
}

// Sanitization utilities for security
class Sanitizer {
  // Remove potential XSS characters
  static sanitizeText(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>?/gm, '')
      .replace(/[<>]/g, '')
      .trim()
  }

  // Sanitize email addresses
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim().replace(/[^\w@.\-+]/g, '')
  }

  // Sanitize phone numbers to digits and common separators
  static sanitizePhone(phone: string): string {
    return phone.replace(/[^\d\-\(\)\s\+\.]/g, '').trim()
  }

  // Sanitize company names
  static sanitizeCompanyName(name: string): string {
    return name
      .replace(/[<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100)
  }

  // Sanitize SQL injection attempts
  static sanitizeSQL(input: string): string {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(--|\/\*|\*\/|;)/g,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi
    ]
    
    let sanitized = input
    sqlPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '')
    })
    
    return sanitized.trim()
  }
}

// Enterprise-grade base schemas
export const BaseSchemas = {
  // Enhanced email validation with domain blacklist
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(254, 'Email too long')
    .refine(email => !email.includes('+'), 'Plus signs not allowed in email')
    .refine(email => {
      const domain = email.split('@')[1]?.toLowerCase()
      const blacklistedDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com']
      return !blacklistedDomains.includes(domain)
    }, 'Email domain not allowed')
    .transform(Sanitizer.sanitizeEmail),

  // Password with enterprise security requirements
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password too long')
    .regex(/(?=.*[a-z])/, 'Password must contain lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain number')
    .regex(/(?=.*[!@#$%^&*(),.?":{}|<>])/, 'Password must contain special character')
    .refine(pwd => !/(.)\1{2,}/.test(pwd), 'Password cannot have repeating characters')
    .refine(pwd => {
      const common = ['password', '123456', 'qwerty', 'admin', 'letmein']
      return !common.some(c => pwd.toLowerCase().includes(c))
    }, 'Password is too common'),

  // Phone number with international format support
  phone: z.string()
    .min(1, 'Phone number is required')
    .regex(/^[\+]?[0-9\-\(\)\s\.]{7,20}$/, 'Invalid phone number format')
    .transform(Sanitizer.sanitizePhone)
    .refine(phone => {
      const digitsOnly = phone.replace(/\D/g, '')
      return digitsOnly.length >= 7 && digitsOnly.length <= 15
    }, 'Phone number must have 7-15 digits'),

  // Company name with business validation
  companyName: z.string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name too long')
    .regex(/^[a-zA-Z0-9\s\.\-&',()]+$/, 'Company name contains invalid characters')
    .transform(Sanitizer.sanitizeCompanyName)
    .refine(name => !/^\d+$/.test(name), 'Company name cannot be only numbers'),

  // Contact person name
  contactName: z.string()
    .min(2, 'Contact name must be at least 2 characters')
    .max(50, 'Contact name too long')
    .regex(/^[a-zA-Z\s\.\-']+$/, 'Contact name contains invalid characters')
    .transform(Sanitizer.sanitizeText),

  // Warehouse identifier validation
  warehouse: z.enum(['US_WEST', 'JAPAN', 'EU', 'AUSTRALIA'], {
    errorMap: () => ({ message: 'Invalid warehouse location' })
  }),

  // Supplier tier validation
  supplierTier: z.enum(['DIRECT', 'DISTRIBUTOR', 'RETAILER', 'FLEET_MANAGER', 'SERVICE_PARTNER'], {
    errorMap: () => ({ message: 'Invalid supplier tier' })
  }),

  // Role validation for warehouse access
  warehouseRole: z.enum(['VIEWER', 'OPERATOR', 'MANAGER', 'ADMIN'], {
    errorMap: () => ({ message: 'Invalid warehouse role' })
  }),

  // Currency validation for multi-region support
  currency: z.enum(['USD', 'EUR', 'JPY', 'AUD'], {
    errorMap: () => ({ message: 'Invalid currency code' })
  }),

  // ID validation (UUID format)
  id: z.string()
    .uuid('Invalid ID format')
    .transform(id => id.toLowerCase()),

  // Pagination parameters
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),

  // Date range validation
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  }).refine(({ startDate, endDate }) => {
    return new Date(startDate) <= new Date(endDate)
  }, 'Start date must be before end date'),

  // IP address validation
  ipAddress: z.string()
    .regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/, 'Invalid IP address'),

  // Secure token validation
  token: z.string()
    .min(1, 'Token is required')
    .max(2048, 'Token too long')
    .regex(/^[A-Za-z0-9\-_\.]+$/, 'Invalid token format')
}

// Authentication schemas
export const AuthSchemas = {
  // Supplier registration
  supplierRegister: z.object({
    email: BaseSchemas.email,
    password: BaseSchemas.password,
    companyName: BaseSchemas.companyName,
    contactName: BaseSchemas.contactName,
    phoneNumber: BaseSchemas.phone,
    warehouse: BaseSchemas.warehouse,
    tier: BaseSchemas.supplierTier,
    businessType: z.string().min(2).max(50),
    taxId: z.string().optional(),
    website: z.string().url().optional(),
    address: z.object({
      street: z.string().min(5).max(100),
      city: z.string().min(2).max(50),
      state: z.string().min(2).max(50),
      postalCode: z.string().min(3).max(10),
      country: z.string().min(2).max(2)
    }),
    complianceInfo: z.object({
      gdprConsent: z.boolean().optional(),
      dataProcessingConsent: z.boolean(),
      termsAccepted: z.boolean().refine(val => val === true, 'Terms must be accepted')
    })
  }),

  // Supplier login
  supplierLogin: z.object({
    email: BaseSchemas.email,
    password: z.string().min(1, 'Password is required'),
    warehouse: BaseSchemas.warehouse.optional(),
    rememberMe: z.boolean().default(false),
    mfaCode: z.string().regex(/^\d{6}$/, 'MFA code must be 6 digits').optional()
  }),

  // Password reset request
  passwordResetRequest: z.object({
    email: BaseSchemas.email,
    warehouse: BaseSchemas.warehouse.optional()
  }),

  // Password reset confirmation
  passwordResetConfirm: z.object({
    token: BaseSchemas.token,
    newPassword: BaseSchemas.password,
    confirmPassword: z.string()
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }),

  // MFA setup
  mfaSetup: z.object({
    secret: z.string().min(1),
    code: z.string().regex(/^\d{6}$/, 'MFA code must be 6 digits')
  })
}

// Business operation schemas
export const BusinessSchemas = {
  // FlexVolt product validation
  flexVoltProduct: z.object({
    sku: z.string().regex(/^FV-(6|9|15)AH-\d{4}$/, 'Invalid FlexVolt SKU format'),
    capacity: z.enum(['6AH', '9AH', '15AH']),
    voltage: z.literal('20V/60V_MAX'),
    price: z.number().positive().refine(price => {
      // Validate standard FlexVolt pricing
      const validPrices = [95.00, 125.00, 245.00]
      return validPrices.includes(price)
    }, 'Invalid FlexVolt price'),
    quantity: z.number().int().min(1).max(1000)
  }),

  // Volume discount validation
  volumeDiscount: z.object({
    orderTotal: z.number().positive(),
    discountTier: z.enum(['TIER_1', 'TIER_2', 'TIER_3', 'TIER_4']),
    discountPercentage: z.number().min(0).max(25),
    isAnnualContract: z.boolean().default(false)
  }).refine(data => {
    // Validate discount tiers match business rules
    const tiers = {
      TIER_1: { min: 1000, discount: 10 },
      TIER_2: { min: 2500, discount: 15 },
      TIER_3: { min: 5000, discount: 20 },
      TIER_4: { min: 10000, discount: 25 }
    }
    
    const tier = tiers[data.discountTier]
    return data.orderTotal >= tier.min && data.discountPercentage === tier.discount
  }, 'Invalid discount tier for order total'),

  // Warehouse inventory update
  inventoryUpdate: z.object({
    warehouse: BaseSchemas.warehouse,
    sku: z.string().min(1),
    quantityChange: z.number().int(),
    reason: z.enum(['RESTOCK', 'SALE', 'DAMAGE', 'RETURN', 'ADJUSTMENT']),
    notes: z.string().max(500).optional(),
    operatorId: BaseSchemas.id
  }),

  // Order creation
  orderCreate: z.object({
    supplierId: BaseSchemas.id,
    warehouse: BaseSchemas.warehouse,
    items: z.array(z.object({
      sku: z.string().min(1),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive()
    })).min(1, 'Order must contain at least one item'),
    shippingAddress: z.object({
      companyName: BaseSchemas.companyName,
      contactName: BaseSchemas.contactName,
      phone: BaseSchemas.phone,
      street: z.string().min(5).max(100),
      city: z.string().min(2).max(50),
      state: z.string().min(2).max(50),
      postalCode: z.string().min(3).max(10),
      country: z.string().min(2).max(2)
    }),
    paymentMethod: z.enum(['NET_30', 'NET_60', 'CREDIT_CARD', 'WIRE_TRANSFER']),
    specialInstructions: z.string().max(1000).optional()
  })
}

// Multi-warehouse validation schemas
export const WarehouseSchemas = {
  // Warehouse access request
  warehouseAccess: z.object({
    supplierId: BaseSchemas.id,
    warehouse: BaseSchemas.warehouse,
    role: BaseSchemas.warehouseRole,
    permissions: z.array(z.string()).min(1),
    expiresAt: z.string().datetime().optional(),
    justification: z.string().min(10).max(500)
  }),

  // Cross-warehouse transfer
  warehouseTransfer: z.object({
    fromWarehouse: BaseSchemas.warehouse,
    toWarehouse: BaseSchemas.warehouse,
    sku: z.string().min(1),
    quantity: z.number().int().positive(),
    urgency: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
    requestedBy: BaseSchemas.id,
    reason: z.string().min(10).max(500)
  }).refine(data => data.fromWarehouse !== data.toWarehouse, {
    message: 'Source and destination warehouses must be different'
  }),

  // Regional compliance check
  complianceCheck: z.object({
    warehouse: BaseSchemas.warehouse,
    complianceType: z.enum(['GDPR', 'OSHA', 'JIS', 'CE', 'FCC']),
    documentType: z.enum(['SAFETY_CERT', 'QUALITY_CERT', 'EXPORT_LICENSE', 'TAX_DOCUMENT']),
    documentId: z.string().min(1),
    expiryDate: z.string().datetime().optional()
  })
}

// Request validation middleware
async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
  options: {
    source?: 'body' | 'query' | 'params'
    sanitize?: boolean
    logValidation?: boolean
    context?: {
      warehouse?: string
      region?: string
      supplierId?: string
    }
  } = {}
): Promise<ValidationResult<T>> {
  const { source = 'body', sanitize = true, logValidation = true, context } = options

  try {
    let data: any

    // Extract data based on source
    switch (source) {
      case 'body':
        data = await request.json()
        break
      case 'query':
        data = Object.fromEntries(new URL(request.url).searchParams)
        break
      case 'params':
        // This would be handled by Next.js route params
        data = {}
        break
      default:
        data = await request.json()
    }

    // Pre-validation sanitization
    if (sanitize && typeof data === 'object') {
      data = sanitizeObjectRecursively(data)
    }

    // Validate using schema
    const result = schema.safeParse(data)

    if (!result.success) {
      const firstError = result.error.errors[0]
      
      if (logValidation) {
        console.log('Validation Error:', {
          source,
          errors: result.error.errors,
          context,
          timestamp: new Date().toISOString()
        })
      }

      return {
        success: false,
        error: {
          code: APIErrorCode.VALIDATION_ERROR,
          message: firstError?.message || 'Validation failed',
          field: firstError?.path?.join('.') || 'unknown',
          details: result.error.errors
        }
      }
    }

    // Success case with optional warnings
    const warnings = generateValidationWarnings(result.data, context)

    if (logValidation && warnings.length > 0) {
      console.log('Validation Warnings:', {
        warnings,
        context,
        timestamp: new Date().toISOString()
      })
    }

    return {
      success: true,
      data: result.data,
      warnings: warnings.length > 0 ? warnings : undefined
    }

  } catch (error) {
    if (logValidation) {
      console.error('Validation Exception:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context,
        timestamp: new Date().toISOString()
      })
    }

    return {
      success: false,
      error: {
        code: APIErrorCode.VALIDATION_ERROR,
        message: 'Invalid request format',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Recursive object sanitization
function sanitizeObjectRecursively(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? Sanitizer.sanitizeText(obj) : obj
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectRecursively)
  }

  const sanitized: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const cleanKey = Sanitizer.sanitizeText(key)
    sanitized[cleanKey] = sanitizeObjectRecursively(value)
  }

  return sanitized
}

// Generate contextual validation warnings
function generateValidationWarnings(
  data: any,
  context?: {
    warehouse?: string
    region?: string
    supplierId?: string
  }
): Array<{ field: string; message: string; code: string }> {
  const warnings: Array<{ field: string; message: string; code: string }> = []

  // Business logic warnings based on context
  if (context?.warehouse && context?.region) {
    // Regional compliance warnings
    if (context.region === 'EU' && data.email && !data.gdprConsent) {
      warnings.push({
        field: 'gdprConsent',
        message: 'GDPR consent recommended for EU operations',
        code: 'COMPLIANCE_WARNING'
      })
    }

    // Volume discount opportunities
    if (data.orderTotal && data.orderTotal >= 900 && data.orderTotal < 1000) {
      warnings.push({
        field: 'orderTotal',
        message: 'Add $' + (1000 - data.orderTotal) + ' more for 10% volume discount',
        code: 'DISCOUNT_OPPORTUNITY'
      })
    }
  }

  return warnings
}

// Validation result type guards
export function isValidationSuccess<T>(result: ValidationResult<T>): result is ValidationResult<T> & { data: T } {
  return result.success && result.data !== undefined
}

export function isValidationError<T>(result: ValidationResult<T>): result is ValidationResult<T> & { error: NonNullable<ValidationResult<T>['error']> } {
  return !result.success && result.error !== undefined
}

// Export commonly used schemas
export const CommonSchemas = {
  ...BaseSchemas,
  ...AuthSchemas,
  ...BusinessSchemas,
  ...WarehouseSchemas
}

// Validation utilities export
export { Sanitizer, validateRequest }

// Additional export for compatibility
export function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
      error: null
    }
  }
  
  return {
    success: false,
    data: null,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    }
  }
}