/**
 * RHY_066 Internal Messaging System - Security Configuration
 * Enterprise-grade security measures for messaging system
 */

import { z } from 'zod'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

// Security configuration constants
export const MESSAGING_SECURITY_CONFIG = {
  // Rate limiting
  maxMessagesPerMinute: 60,
  maxMessagesPerHour: 500,
  maxMessagesPerDay: 2000,
  
  // Content validation
  maxMessageLength: 4000,
  maxAttachmentSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/csv',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  
  // Session management
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  maxActiveSessions: 5,
  
  // Encryption
  encryptionAlgorithm: 'aes-256-gcm',
  keyDerivationIterations: 100000,
  
  // Content filtering
  bannedWords: [
    // Add comprehensive list of banned words
    'spam', 'phishing', 'malware', 'virus'
  ],
  
  // IP restrictions
  trustedIpRanges: [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16'
  ]
} as const

// Security validation schemas
export const securitySchemas = {
  messageContent: z.object({
    content: z.string()
      .min(1, 'Message content cannot be empty')
      .max(MESSAGING_SECURITY_CONFIG.maxMessageLength, `Message content cannot exceed ${MESSAGING_SECURITY_CONFIG.maxMessageLength} characters`)
      .refine(
        (content) => !MESSAGING_SECURITY_CONFIG.bannedWords.some(word => 
          content.toLowerCase().includes(word.toLowerCase())
        ),
        'Message contains prohibited content'
      ),
    type: z.enum(['TEXT', 'FILE', 'SYSTEM', 'WAREHOUSE_ALERT', 'ORDER_UPDATE']),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  }),
  
  fileUpload: z.object({
    fileName: z.string().min(1).max(255),
    fileSize: z.number().positive().max(MESSAGING_SECURITY_CONFIG.maxAttachmentSize),
    mimeType: z.string().refine(
      (type) => MESSAGING_SECURITY_CONFIG.allowedFileTypes.includes(type),
      'File type not allowed'
    )
  }),
  
  participantPermissions: z.object({
    userId: z.string().uuid(),
    role: z.enum(['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER']),
    permissions: z.array(z.object({
      action: z.enum(['read', 'WRITE', 'DELETE', 'ADMIN', 'INVITE', 'REMOVE']),
      scope: z.enum(['MESSAGE', 'CONVERSATION', 'PARTICIPANT']),
      granted: z.boolean()
    }))
  })
}

/**
 * Security service for messaging system
 */
export class MessagingSecurityService {
  private rateLimitStore = new Map<string, { count: number; windowStart: number; type: string }>()
  private activeSessionsStore = new Map<string, Set<string>>()
  private encryptionKey: Buffer | null = null
  
  constructor() {
    this.initializeEncryption()
    this.startCleanupTasks()
  }

  /**
   * Initialize encryption key from environment
   */
  private initializeEncryption(): void {
    const encryptionKey = process.env.MESSAGING_ENCRYPTION_KEY
    if (!encryptionKey) {
      logger.warn('No encryption key provided for messaging system')
      return
    }
    
    try {
      this.encryptionKey = crypto.scryptSync(
        encryptionKey, 
        'messaging-salt', 
        32,
        { N: MESSAGING_SECURITY_CONFIG.keyDerivationIterations }
      )
      logger.info('Messaging encryption initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize messaging encryption', { error })
    }
  }

  /**
   * Rate limiting check
   */
  public async checkRateLimit(
    userId: string, 
    type: 'message' | 'conversation' | 'file_upload' = 'message'
  ): Promise<{ allowed: boolean; remainingRequests: number; resetTime: number }> {
    const now = Date.now()
    const windowDuration = 60 * 1000 // 1 minute window
    const key = `${userId}:${type}`
    
    const currentWindow = this.rateLimitStore.get(key)
    
    // Determine rate limit based on type
    let maxRequests = MESSAGING_SECURITY_CONFIG.maxMessagesPerMinute
    if (type === 'file_upload') maxRequests = 10
    if (type === 'conversation') maxRequests = 20
    
    if (!currentWindow || now - currentWindow.windowStart > windowDuration) {
      // New window
      this.rateLimitStore.set(key, {
        count: 1,
        windowStart: now,
        type
      })
      
      return {
        allowed: true,
        remainingRequests: maxRequests - 1,
        resetTime: now + windowDuration
      }
    }
    
    if (currentWindow.count >= maxRequests) {
      logger.warn('Rate limit exceeded', { 
        userId, 
        type, 
        count: currentWindow.count,
        maxRequests
      })
      
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: currentWindow.windowStart + windowDuration
      }
    }
    
    currentWindow.count++
    this.rateLimitStore.set(key, currentWindow)
    
    return {
      allowed: true,
      remainingRequests: maxRequests - currentWindow.count,
      resetTime: currentWindow.windowStart + windowDuration
    }
  }

  /**
   * Validate message content for security threats
   */
  public validateMessageContent(content: string, type: string): {
    valid: boolean
    issues: string[]
    sanitizedContent: string
  } {
    const issues: string[] = []
    let sanitizedContent = content.trim()

    try {
      // Schema validation
      securitySchemas.messageContent.parse({
        content: sanitizedContent,
        type,
        priority: 'NORMAL'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        issues.push(...error.errors.map(e => e.message))
      }
    }

    // XSS prevention
    sanitizedContent = this.sanitizeHtml(sanitizedContent)

    // SQL injection prevention
    if (this.containsSqlInjection(sanitizedContent)) {
      issues.push('Message contains potentially malicious SQL content')
    }

    // Check for suspicious patterns
    if (this.containsSuspiciousPatterns(sanitizedContent)) {
      issues.push('Message contains suspicious patterns')
    }

    // Profanity and content filtering
    const contentIssues = this.checkContentPolicy(sanitizedContent)
    if (contentIssues.length > 0) {
      issues.push(...contentIssues)
    }

    return {
      valid: issues.length === 0,
      issues,
      sanitizedContent
    }
  }

  /**
   * Encrypt sensitive message content
   */
  public encryptMessage(content: string): { encrypted: string; iv: string } | null {
    if (!this.encryptionKey) {
      logger.warn('Encryption key not available')
      return null
    }

    try {
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipher(MESSAGING_SECURITY_CONFIG.encryptionAlgorithm, this.encryptionKey)
      cipher.setAutoPadding(true)
      
      let encrypted = cipher.update(content, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      return {
        encrypted,
        iv: iv.toString('hex')
      }
    } catch (error) {
      logger.error('Failed to encrypt message', { error })
      return null
    }
  }

  /**
   * Decrypt message content
   */
  public decryptMessage(encrypted: string, iv: string): string | null {
    if (!this.encryptionKey) {
      logger.warn('Encryption key not available')
      return null
    }

    try {
      const decipher = crypto.createDecipher(MESSAGING_SECURITY_CONFIG.encryptionAlgorithm, this.encryptionKey)
      decipher.setAutoPadding(true)
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      logger.error('Failed to decrypt message', { error })
      return null
    }
  }

  /**
   * Validate file upload security
   */
  public validateFileUpload(file: {
    fileName: string
    fileSize: number
    mimeType: string
    buffer?: Buffer
  }): {
    valid: boolean
    issues: string[]
    securityScan: {
      malwareDetected: boolean
      suspiciousPatterns: boolean
      fileIntegrity: boolean
    }
  } {
    const issues: string[] = []
    
    try {
      securitySchemas.fileUpload.parse(file)
    } catch (error) {
      if (error instanceof z.ZodError) {
        issues.push(...error.errors.map(e => e.message))
      }
    }

    // File name security checks
    if (this.containsSuspiciousFileName(file.fileName)) {
      issues.push('File name contains suspicious characters')
    }

    // MIME type validation
    if (!this.isValidMimeType(file.mimeType, file.fileName)) {
      issues.push('File type does not match content')
    }

    // File content scanning (basic)
    const securityScan = {
      malwareDetected: false,
      suspiciousPatterns: false,
      fileIntegrity: true
    }

    if (file.buffer) {
      securityScan.suspiciousPatterns = this.scanFileForSuspiciousPatterns(file.buffer)
      securityScan.fileIntegrity = this.validateFileIntegrity(file.buffer, file.mimeType)
    }

    return {
      valid: issues.length === 0 && !securityScan.malwareDetected && !securityScan.suspiciousPatterns,
      issues,
      securityScan
    }
  }

  /**
   * Check user permissions for action
   */
  public checkPermissions(
    userId: string,
    action: string,
    scope: string,
    conversationId: string,
    userRole: string = 'VIEWER'
  ): boolean {
    // Admin always has full permissions
    if (userRole === 'ADMIN') return true

    // Define permission matrix
    const permissionMatrix: Record<string, Record<string, string[]>> = {
      MESSAGE: {
        read: ['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER'],
        WRITE: ['ADMIN', 'MANAGER', 'OPERATOR'],
        DELETE: ['ADMIN', 'MANAGER'],
        EDIT: ['ADMIN', 'MANAGER']
      },
      CONVERSATION: {
        read: ['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER'],
        WRITE: ['ADMIN', 'MANAGER', 'OPERATOR'],
        DELETE: ['ADMIN', 'MANAGER'],
        ADMIN: ['ADMIN']
      },
      PARTICIPANT: {
        INVITE: ['ADMIN', 'MANAGER'],
        REMOVE: ['ADMIN', 'MANAGER'],
        read: ['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER']
      }
    }

    const scopePermissions = permissionMatrix[scope]
    if (!scopePermissions) return false

    const actionPermissions = scopePermissions[action]
    if (!actionPermissions) return false

    return actionPermissions.includes(userRole)
  }

  /**
   * Validate IP address against trusted ranges
   */
  public validateIpAddress(ipAddress: string): boolean {
    // For development, allow all IPs
    if (process.env.NODE_ENV === 'development') return true

    // Check against trusted IP ranges
    return MESSAGING_SECURITY_CONFIG.trustedIpRanges.some(range => {
      return this.isIpInRange(ipAddress, range)
    })
  }

  /**
   * Generate secure session token
   */
  public generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Validate session token
   */
  public validateSessionToken(token: string, userId: string): boolean {
    if (!token || token.length !== 64) return false
    
    const userSessions = this.activeSessionsStore.get(userId)
    return userSessions ? userSessions.has(token) : false
  }

  /**
   * Register new session
   */
  public registerSession(userId: string, token: string): void {
    let userSessions = this.activeSessionsStore.get(userId)
    
    if (!userSessions) {
      userSessions = new Set()
      this.activeSessionsStore.set(userId, userSessions)
    }

    // Limit active sessions
    if (userSessions.size >= MESSAGING_SECURITY_CONFIG.maxActiveSessions) {
      const oldestSession = userSessions.values().next().value
      userSessions.delete(oldestSession)
    }

    userSessions.add(token)
  }

  /**
   * Private helper methods
   */
  private sanitizeHtml(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  private containsSqlInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(--|#|\/\*|\*\/)/,
      /(\b(OR|AND)\b.*[=<>])/i,
      /[';].*(--)|(\/\*)/
    ]
    
    return sqlPatterns.some(pattern => pattern.test(input))
  }

  private containsSuspiciousPatterns(input: string): boolean {
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /vbscript:/i,
      /onload\s*=/i,
      /onerror\s*=/i,
      /eval\s*\(/i,
      /expression\s*\(/i
    ]
    
    return suspiciousPatterns.some(pattern => pattern.test(input))
  }

  private checkContentPolicy(content: string): string[] {
    const issues: string[] = []
    
    // Check for banned words
    const lowerContent = content.toLowerCase()
    const foundBannedWords = MESSAGING_SECURITY_CONFIG.bannedWords.filter(word =>
      lowerContent.includes(word.toLowerCase())
    )
    
    if (foundBannedWords.length > 0) {
      issues.push(`Content contains prohibited words: ${foundBannedWords.join(', ')}`)
    }

    // Check for excessive capitalization (potential spam)
    const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length
    if (upperCaseRatio > 0.7 && content.length > 20) {
      issues.push('Excessive use of capital letters detected')
    }

    // Check for repetitive content
    if (this.isRepetitiveContent(content)) {
      issues.push('Repetitive content detected')
    }

    return issues
  }

  private containsSuspiciousFileName(fileName: string): boolean {
    const suspiciousPatterns = [
      /\.\./,  // Directory traversal
      /[<>:"|?*]/,  // Invalid filename characters
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,  // Reserved Windows names
      /\.(exe|bat|cmd|com|pif|scr|vbs|js)$/i  // Executable extensions
    ]
    
    return suspiciousPatterns.some(pattern => pattern.test(fileName))
  }

  private isValidMimeType(mimeType: string, fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (!extension) return false

    const mimeTypeMap: Record<string, string[]> = {
      'jpg': ['image/jpeg'],
      'jpeg': ['image/jpeg'],
      'png': ['image/png'],
      'gif': ['image/gif'],
      'pdf': ['application/pdf'],
      'txt': ['text/plain'],
      'csv': ['text/csv'],
      'doc': ['application/msword'],
      'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    }

    const expectedMimeTypes = mimeTypeMap[extension]
    return expectedMimeTypes ? expectedMimeTypes.includes(mimeType) : false
  }

  private scanFileForSuspiciousPatterns(buffer: Buffer): boolean {
    const content = buffer.toString('ascii', 0, Math.min(1024, buffer.length))
    
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /eval\s*\(/i,
      /exec\s*\(/i
    ]
    
    return suspiciousPatterns.some(pattern => pattern.test(content))
  }

  private validateFileIntegrity(buffer: Buffer, mimeType: string): boolean {
    // Basic file header validation
    const magicNumbers: Record<string, number[]> = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'application/pdf': [0x25, 0x50, 0x44, 0x46]
    }

    const expectedHeader = magicNumbers[mimeType]
    if (!expectedHeader) return true // Skip validation for unknown types

    const actualHeader = Array.from(buffer.slice(0, expectedHeader.length))
    return expectedHeader.every((byte, index) => byte === actualHeader[index])
  }

  private isRepetitiveContent(content: string): boolean {
    const words = content.split(/\s+/)
    if (words.length < 5) return false

    const wordCounts = new Map<string, number>()
    for (const word of words) {
      const count = wordCounts.get(word) || 0
      wordCounts.set(word, count + 1)
    }

    const maxRepeats = Math.max(...wordCounts.values())
    return maxRepeats > words.length * 0.4
  }

  private isIpInRange(ip: string, range: string): boolean {
    // Simple IP range check implementation
    if (range.includes('/')) {
      const [network, mask] = range.split('/')
      const networkParts = network.split('.').map(Number)
      const ipParts = ip.split('.').map(Number)
      const maskBits = parseInt(mask)
      
      // Convert to 32-bit integers and apply mask
      const networkInt = (networkParts[0] << 24) + (networkParts[1] << 16) + (networkParts[2] << 8) + networkParts[3]
      const ipInt = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3]
      const maskInt = (-1 << (32 - maskBits)) >>> 0
      
      return (networkInt & maskInt) === (ipInt & maskInt)
    }
    
    return ip === range
  }

  /**
   * Cleanup expired rate limit entries and sessions
   */
  private startCleanupTasks(): void {
    setInterval(() => {
      const now = Date.now()
      
      // Cleanup rate limit entries
      for (const [key, data] of this.rateLimitStore.entries()) {
        if (now - data.windowStart > 60 * 1000) { // 1 minute
          this.rateLimitStore.delete(key)
        }
      }
      
      logger.debug('Cleaned up security store entries', {
        rateLimitEntries: this.rateLimitStore.size,
        activeSessionUsers: this.activeSessionsStore.size
      })
    }, 5 * 60 * 1000) // Cleanup every 5 minutes
  }
}

// Export singleton instance
export const messagingSecurityService = new MessagingSecurityService()