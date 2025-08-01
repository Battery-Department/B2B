/**
 * RHY Supplier Portal - Authentication Types
 * Enterprise-grade authentication system for FlexVolt battery supplier management
 * Supports multi-warehouse operations: US, Japan, EU, Australia
 */

import { z } from 'zod'

// ================================
// CORE AUTHENTICATION TYPES
// ================================

export interface SupplierAuthData {
  id: string
  email: string
  companyName: string
  contactName?: string
  phoneNumber?: string
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'
  tier: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE'
  warehouseAccess: WarehouseAccess[]
  mfaEnabled: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface WarehouseAccess {
  warehouse: 'US' | 'JP' | 'EU' | 'AU'
  role: 'VIEWER' | 'OPERATOR' | 'MANAGER' | 'ADMIN'
  permissions: string[]
  grantedAt: Date
  expiresAt?: Date
}

export interface SessionData {
  id: string
  supplierId: string
  token: string
  userAgent?: string
  ipAddress?: string
  warehouse?: 'US' | 'JP' | 'EU' | 'AU'
  expiresAt: Date
  createdAt: Date
  lastUsedAt: Date
}

export interface JWTPayload {
  sub: string // supplier ID
  email: string
  companyName: string
  tier: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE'
  warehouses: string[]
  permissions: string[]
  iat: number
  exp: number
  iss: 'rhy-supplier-portal'
  aud: 'rhy-suppliers'
}

export interface MFAData {
  secret: string
  backupCodes: string[]
  isEnabled: boolean
  verifiedAt?: Date
}

// ================================
// REQUEST/RESPONSE INTERFACES
// ================================

export interface LoginRequest {
  email: string
  password: string
  warehouse?: 'US' | 'JP' | 'EU' | 'AU'
  rememberMe?: boolean
  mfaCode?: string
}

export interface LoginResponse {
  success: boolean
  token?: string
  refreshToken?: string
  supplier?: SupplierAuthData
  expiresIn?: number
  requiresMFA?: boolean
  mfaSetupRequired?: boolean
  error?: string
  warehouse?: 'US' | 'JP' | 'EU' | 'AU'
}

export interface RegisterRequest {
  email: string
  password: string
  companyName: string
  contactName: string
  phoneNumber?: string
  warehouseRegion: 'US' | 'JP' | 'EU' | 'AU'
  businessType: 'MANUFACTURER' | 'DISTRIBUTOR' | 'RETAILER' | 'SERVICE'
  agreesToTerms: boolean
  acceptsMarketing?: boolean
}

export interface RegisterResponse {
  success: boolean
  supplier?: {
    id: string
    email: string
    companyName: string
    status: string
  }
  message?: string
  error?: string
  requiresVerification?: boolean
}

export interface SessionResponse {
  valid: boolean
  supplier?: SupplierAuthData
  session?: {
    id: string
    expiresAt: Date
    lastUsedAt: Date
  }
  error?: string
}

export interface LogoutResponse {
  success: boolean
  message?: string
  error?: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  success: boolean
  token?: string
  refreshToken?: string
  expiresIn?: number
  error?: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetResponse {
  success: boolean
  message?: string
  error?: string
}

export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface MFASetupRequest {
  password: string
}

export interface MFASetupResponse {
  success: boolean
  secret?: string
  qrCode?: string
  backupCodes?: string[]
  error?: string
}

export interface MFAVerifyRequest {
  code: string
  backupCode?: string
}

export interface MFAVerifyResponse {
  success: boolean
  message?: string
  error?: string
}

// ================================
// VALIDATION SCHEMAS
// ================================

export const LoginSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(254, 'Email too long')
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password too long'),
  warehouse: z
    .enum(['US', 'JP', 'EU', 'AU'])
    .optional(),
  rememberMe: z.boolean().optional().default(false),
  mfaCode: z
    .string()
    .regex(/^\d{6}$/, 'MFA code must be 6 digits')
    .optional()
})

export const RegisterSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(254, 'Email too long')
    .toLowerCase(),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character'),
  companyName: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name too long')
    .trim(),
  contactName: z
    .string()
    .min(2, 'Contact name must be at least 2 characters')
    .max(100, 'Contact name too long')
    .trim(),
  phoneNumber: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .max(20, 'Phone number too long')
    .optional(),
  warehouseRegion: z.enum(['US', 'JP', 'EU', 'AU']),
  businessType: z.enum(['MANUFACTURER', 'DISTRIBUTOR', 'RETAILER', 'SERVICE']),
  agreesToTerms: z
    .boolean()
    .refine(val => val === true, 'You must agree to the terms of service'),
  acceptsMarketing: z.boolean().optional().default(false)
})

export const PasswordChangeSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required')
    .max(128, 'Password too long'),
  newPassword: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const MFASetupSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password too long')
})

export const MFAVerifySchema = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, 'Code must be exactly 6 digits')
    .optional(),
  backupCode: z
    .string()
    .regex(/^[A-Z0-9]{8}$/, 'Invalid backup code format')
    .optional()
}).refine(data => data.code || data.backupCode, {
  message: "Either MFA code or backup code is required"
})

export const MFACodeSchema = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, 'Code must be exactly 6 digits')
    .optional(),
  backupCode: z
    .string()
    .regex(/^[A-Z0-9]{8}$/, 'Invalid backup code format')
    .optional()
}).refine(data => data.code || data.backupCode, {
  message: "Either MFA code or backup code is required"
})

export const EmailSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(254, 'Email too long')
    .toLowerCase()
})

// ================================
// ERROR TYPES
// ================================

export interface AuthError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: Date
}

export type AuthErrorCode = 
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_INACTIVE'
  | 'MFA_REQUIRED'
  | 'INVALID_MFA_CODE'
  | 'SESSION_EXPIRED'
  | 'INVALID_TOKEN'
  | 'RATE_LIMITED'
  | 'EMAIL_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'INVALID_WAREHOUSE'
  | 'PERMISSION_DENIED'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'

// ================================
// AUDIT & SECURITY TYPES
// ================================

export interface AuthAuditEvent {
  id: string
  supplierId?: string
  action: string
  resource: string
  success: boolean
  ipAddress?: string
  userAgent?: string
  warehouse?: string
  metadata?: Record<string, any>
  timestamp: Date
}

export interface SecurityContext {
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  warehouse?: 'US' | 'JP' | 'EU' | 'AU'
  riskScore?: number
  deviceFingerprint?: string
}

export interface RateLimitInfo {
  remaining: number
  resetTime: Date
  limit: number
  windowMs: number
}

// ================================
// UTILITY TYPES
// ================================

export type AuthAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'MFA_SETUP'
  | 'MFA_VERIFY'
  | 'SESSION_REFRESH'
  | 'ACCOUNT_LOCK'
  | 'ACCOUNT_UNLOCK'

export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading' | 'error'

export interface AuthState {
  status: AuthStatus
  supplier?: SupplierAuthData
  session?: SessionData
  error?: string
  loading: boolean
}

// ================================
// API RESPONSE WRAPPER
// ================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, any>
  }
  meta?: {
    timestamp: string
    requestId: string
    version: string
  }
}

// Export AuthError class for compatibility
export class AuthError extends Error {
  code: AuthErrorCode
  details?: Record<string, any>
  
  constructor(code: AuthErrorCode, message: string, details?: Record<string, any>) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.details = details
  }
}