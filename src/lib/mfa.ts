/**
 * RHY Supplier Portal - Multi-Factor Authentication
 * Enterprise-grade MFA implementation with TOTP and backup codes
 * Supports secure enrollment, verification, and recovery mechanisms
 */

import crypto from 'crypto'
import { authenticator } from 'otplib'

// Configure TOTP settings
authenticator.options = {
  window: 1, // Allow 1 step tolerance
  step: 30,  // 30-second window
  digits: 6  // 6-digit codes
}

// ================================
// MFA SECRET GENERATION
// ================================

export function generateMFASecret(): string {
  // Generate a 160-bit (20-byte) secret for TOTP
  return authenticator.generateSecret()
}

export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = []
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric backup codes
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }
  
  return codes
}

// ================================
// MFA VERIFICATION
// ================================

export function verifyMFACode(secret: string, code: string): boolean {
  try {
    // Remove any spaces and validate format
    const cleanCode = code.replace(/\s/g, '')
    
    if (!/^\d{6}$/.test(cleanCode)) {
      return false
    }
    
    return authenticator.verify({
      token: cleanCode,
      secret: secret
    })
  } catch (error) {
    console.error('MFA code verification error:', error)
    return false
  }
}

export function verifyBackupCode(
  storedCodes: string[], 
  providedCode: string
): { valid: boolean; remainingCodes?: string[] } {
  try {
    const cleanCode = providedCode.replace(/\s/g, '').toUpperCase()
    
    if (!/^[A-F0-9]{8}$/.test(cleanCode)) {
      return { valid: false }
    }
    
    const codeIndex = storedCodes.indexOf(cleanCode)
    
    if (codeIndex === -1) {
      return { valid: false }
    }
    
    // Remove used backup code
    const remainingCodes = storedCodes.filter((_, index) => index !== codeIndex)
    
    return {
      valid: true,
      remainingCodes
    }
  } catch (error) {
    console.error('Backup code verification error:', error)
    return { valid: false }
  }
}

// ================================
// QR CODE GENERATION
// ================================

export function generateQRCodeURL(
  secret: string,
  email: string,
  issuer: string = 'RHY Supplier Portal'
): string {
  return authenticator.keyuri(
    email,
    issuer,
    secret
  )
}

export function generateManualEntryKey(secret: string): string {
  // Format secret for manual entry (groups of 4 characters)
  return secret.match(/.{1,4}/g)?.join(' ').toUpperCase() || secret
}

// ================================
// MFA STATUS VALIDATION
// ================================

export function validateMFASetup(
  secret: string,
  verificationCode: string,
  backupCodes: string[]
): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Validate secret format
  if (!secret || secret.length < 16) {
    errors.push('Invalid MFA secret format')
  }
  
  // Validate verification code
  if (!verifyMFACode(secret, verificationCode)) {
    errors.push('Invalid verification code')
  }
  
  // Validate backup codes
  if (!backupCodes || backupCodes.length < 8) {
    errors.push('Insufficient backup codes generated')
  }
  
  // Check backup code format
  const invalidCodes = backupCodes.filter(code => !/^[A-F0-9]{8}$/.test(code))
  if (invalidCodes.length > 0) {
    errors.push('Invalid backup code format detected')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// ================================
// TIME-BASED UTILITIES
// ================================

export function getCurrentTimeStep(): number {
  return Math.floor(Date.now() / 1000 / 30)
}

export function getTimeRemaining(): number {
  const currentStep = getCurrentTimeStep()
  const nextStep = (currentStep + 1) * 30
  const currentTime = Math.floor(Date.now() / 1000)
  return nextStep - currentTime
}

// ================================
// SECURITY UTILITIES
// ================================

export function encryptMFASecret(secret: string, encryptionKey: string): string {
  try {
    const cipher = crypto.createCipher('aes-256-cbc', encryptionKey)
    let encrypted = cipher.update(secret, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
  } catch (error) {
    console.error('MFA secret encryption error:', error)
    throw new Error('Failed to encrypt MFA secret')
  }
}

export function decryptMFASecret(encryptedSecret: string, encryptionKey: string): string {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey)
    let decrypted = decipher.update(encryptedSecret, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('MFA secret decryption error:', error)
    throw new Error('Failed to decrypt MFA secret')
  }
}

export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

// ================================
// MFA RECOVERY
// ================================

export interface MFARecoveryOptions {
  generateNewSecret?: boolean
  generateNewBackupCodes?: boolean
  requireAdminApproval?: boolean
}

export function generateMFARecoveryData(options: MFARecoveryOptions = {}) {
  const recovery: any = {}
  
  if (options.generateNewSecret) {
    recovery.newSecret = generateMFASecret()
  }
  
  if (options.generateNewBackupCodes) {
    recovery.newBackupCodes = generateBackupCodes()
  }
  
  recovery.recoveryId = crypto.randomUUID()
  recovery.expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)) // 24 hours
  recovery.requiresApproval = options.requireAdminApproval || false
  
  return recovery
}

// ================================
// RATE LIMITING FOR MFA
// ================================

const mfaAttempts = new Map<string, { count: number; resetTime: number }>()

export function checkMFAAttemptLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = mfaAttempts.get(identifier)
  
  if (!entry || now > entry.resetTime) {
    // New window or expired
    mfaAttempts.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetTime: now + windowMs
    }
  }
  
  entry.count += 1
  mfaAttempts.set(identifier, entry)
  
  return {
    allowed: entry.count <= maxAttempts,
    remaining: Math.max(0, maxAttempts - entry.count),
    resetTime: entry.resetTime
  }
}

export function resetMFAAttempts(identifier: string): void {
  mfaAttempts.delete(identifier)
}

// ================================
// MFA ANALYTICS
// ================================

export interface MFAUsageStats {
  totalVerifications: number
  successfulVerifications: number
  failedVerifications: number
  backupCodeUsage: number
  setupCompletions: number
  recoveryRequests: number
}

// In-memory stats (use database in production)
const mfaStats: MFAUsageStats = {
  totalVerifications: 0,
  successfulVerifications: 0,
  failedVerifications: 0,
  backupCodeUsage: 0,
  setupCompletions: 0,
  recoveryRequests: 0
}

export function recordMFAEvent(event: keyof MFAUsageStats): void {
  mfaStats[event] += 1
}

export function getMFAStats(): MFAUsageStats {
  return { ...mfaStats }
}

// ================================
// ADMIN UTILITIES
// ================================

export function disableMFAForUser(
  userId: string,
  adminId: string,
  reason: string
): {
  success: boolean
  auditEntry: {
    userId: string
    adminId: string
    action: string
    reason: string
    timestamp: Date
  }
} {
  const auditEntry = {
    userId,
    adminId,
    action: 'MFA_DISABLED_BY_ADMIN',
    reason,
    timestamp: new Date()
  }
  
  // Log the admin action for security audit
  console.log('🔑 Admin MFA Action:', auditEntry)
  
  return {
    success: true,
    auditEntry
  }
}

export function validateMFAAdminAction(
  adminId: string,
  targetUserId: string,
  action: string
): boolean {
  // Implement admin authorization logic
  // For now, allow all admin actions (implement proper RBAC in production)
  return true
}

// ================================
// TESTING UTILITIES (Development Only)
// ================================

export function generateTestMFACode(secret: string, timeStep?: number): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test MFA codes are not available in production')
  }
  
  const step = timeStep || getCurrentTimeStep()
  return authenticator.generate(secret)
}

export function simulateMFAVerification(
  secret: string,
  providedCode: string,
  allowedTimeSkew: number = 1
): {
  valid: boolean
  timeStep: number
  skew: number
} {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('MFA simulation is not available in production')
  }
  
  const currentStep = getCurrentTimeStep()
  
  for (let i = -allowedTimeSkew; i <= allowedTimeSkew; i++) {
    const testStep = currentStep + i
    const expectedCode = authenticator.generate(secret)
    
    if (providedCode === expectedCode) {
      return {
        valid: true,
        timeStep: testStep,
        skew: i
      }
    }
  }
  
  return {
    valid: false,
    timeStep: currentStep,
    skew: 0
  }
}