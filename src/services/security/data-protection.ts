import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync, createHash } from 'crypto'
import { promisify } from 'util'

export interface EncryptionConfig {
  algorithm: string
  keyLength: number
  ivLength: number
  saltLength: number
  iterations: number
  masterKey: string
}

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted'
  retention: number // days
  encryption: boolean
  anonymization: boolean
  accessLogging: boolean
}

export interface PIIField {
  fieldName: string
  classification: DataClassification
  anonymizationMethod: 'mask' | 'hash' | 'tokenize' | 'delete'
  pattern?: RegExp
}

export interface DataRetentionPolicy {
  id: string
  name: string
  dataType: string
  retentionPeriod: number // days
  archivePeriod?: number // days
  deletionMethod: 'secure_wipe' | 'cryptographic_erasure'
  triggers: string[]
}

export interface GDPRConsent {
  userId: string
  purpose: string
  consentGiven: boolean
  consentDate: Date
  withdrawnDate?: Date
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests'
  dataTypes: string[]
  processingActivities: string[]
}

export class DataProtection {
  private config: EncryptionConfig
  private piiFields: PIIField[]
  private retentionPolicies: DataRetentionPolicy[]
  private gdprConsents: Map<string, GDPRConsent[]> = new Map()

  constructor(config: EncryptionConfig) {
    this.config = config
    this.initializePIIFields()
    this.initializeRetentionPolicies()
  }

  // Encryption Methods
  async encryptData(data: string, context?: string): Promise<{
    encrypted: string
    iv: string
    salt: string
    keyId: string
  }> {
    try {
      const salt = randomBytes(this.config.saltLength)
      const iv = randomBytes(this.config.ivLength)
      
      // Derive key from master key and salt
      const key = pbkdf2Sync(this.config.masterKey, salt, this.config.iterations, this.config.keyLength, 'sha256')
      
      // Create cipher
      const cipher = createCipheriv(this.config.algorithm, key, iv)
      
      // Encrypt data
      let encrypted = cipher.update(data, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      // Generate key ID for rotation tracking
      const keyId = createHash('sha256')
        .update(this.config.masterKey + salt.toString('hex'))
        .digest('hex')
        .slice(0, 16)
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        keyId
      }
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`)
    }
  }

  async decryptData(encryptedData: {
    encrypted: string
    iv: string
    salt: string
    keyId: string
  }): Promise<string> {
    try {
      const salt = Buffer.from(encryptedData.salt, 'hex')
      const iv = Buffer.from(encryptedData.iv, 'hex')
      
      // Derive key
      const key = pbkdf2Sync(this.config.masterKey, salt, this.config.iterations, this.config.keyLength, 'sha256')
      
      // Create decipher
      const decipher = createDecipheriv(this.config.algorithm, key, iv)
      
      // Decrypt data
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`)
    }
  }

  // PII Detection and Protection
  detectPII(data: Record<string, any>): {
    hasPII: boolean
    piiFields: string[]
    recommendations: string[]
  } {
    const piiFields: string[] = []
    const recommendations: string[] = []
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        for (const piiField of this.piiFields) {
          if (piiField.pattern && piiField.pattern.test(value)) {
            piiFields.push(key)
            recommendations.push(`Field '${key}' contains ${piiField.fieldName} and should be ${piiField.anonymizationMethod}ed`)
          } else if (key.toLowerCase().includes(piiField.fieldName.toLowerCase())) {
            piiFields.push(key)
            recommendations.push(`Field '${key}' appears to be ${piiField.fieldName} and should be protected`)
          }
        }
      }
    }
    
    return {
      hasPII: piiFields.length > 0,
      piiFields,
      recommendations
    }
  }

  async anonymizeData(data: Record<string, any>, method: 'development' | 'analytics' | 'testing'): Promise<Record<string, any>> {
    const anonymized = { ...data }
    
    for (const [key, value] of Object.entries(anonymized)) {
      if (typeof value === 'string') {
        for (const piiField of this.piiFields) {
          if (key.toLowerCase().includes(piiField.fieldName.toLowerCase()) || 
              (piiField.pattern && piiField.pattern.test(value))) {
            
            switch (piiField.anonymizationMethod) {
              case 'mask':
                anonymized[key] = this.maskValue(value)
                break
              case 'hash':
                anonymized[key] = this.hashValue(value)
                break
              case 'tokenize':
                anonymized[key] = this.tokenizeValue(value)
                break
              case 'delete':
                delete anonymized[key]
                break
            }
          }
        }
      }
    }
    
    return anonymized
  }

  // Data Retention Management
  async applyRetentionPolicy(dataType: string, records: any[]): Promise<{
    retained: any[]
    archived: any[]
    deleted: string[]
  }> {
    const policy = this.retentionPolicies.find(p => p.dataType === dataType)
    if (!policy) {
      throw new Error(`No retention policy found for data type: ${dataType}`)
    }
    
    const now = new Date()
    const retentionCutoff = new Date(now.getTime() - (policy.retentionPeriod * 24 * 60 * 60 * 1000))
    const archiveCutoff = policy.archivePeriod ? 
      new Date(now.getTime() - (policy.archivePeriod * 24 * 60 * 60 * 1000)) : null
    
    const retained: any[] = []
    const archived: any[] = []
    const deleted: string[] = []
    
    for (const record of records) {
      const recordDate = new Date(record.createdAt || record.timestamp)
      
      if (recordDate > retentionCutoff) {
        retained.push(record)
      } else if (archiveCutoff && recordDate > archiveCutoff) {
        // Archive data (encrypt and move to cold storage)
        const archivedRecord = await this.archiveRecord(record)
        archived.push(archivedRecord)
      } else {
        // Securely delete
        await this.secureDelete(record)
        deleted.push(record.id)
      }
    }
    
    return { retained, archived, deleted }
  }

  // GDPR Compliance
  async recordConsent(consent: Omit<GDPRConsent, 'consentDate'>): Promise<void> {
    const fullConsent: GDPRConsent = {
      ...consent,
      consentDate: new Date()
    }
    
    const userConsents = this.gdprConsents.get(consent.userId) || []
    userConsents.push(fullConsent)
    this.gdprConsents.set(consent.userId, userConsents)
    
    // Log consent for audit trail
    console.log(`GDPR Consent recorded: User ${consent.userId} for ${consent.purpose}`)
  }

  async withdrawConsent(userId: string, purpose: string): Promise<void> {
    const userConsents = this.gdprConsents.get(userId) || []
    const consent = userConsents.find(c => c.purpose === purpose && !c.withdrawnDate)
    
    if (consent) {
      consent.withdrawnDate = new Date()
      consent.consentGiven = false
      
      // Trigger data deletion/anonymization for withdrawn consent
      await this.handleConsentWithdrawal(userId, purpose)
      
      console.log(`GDPR Consent withdrawn: User ${userId} for ${purpose}`)
    }
  }

  hasValidConsent(userId: string, purpose: string, dataType: string): boolean {
    const userConsents = this.gdprConsents.get(userId) || []
    return userConsents.some(consent => 
      consent.purpose === purpose &&
      consent.dataTypes.includes(dataType) &&
      consent.consentGiven &&
      !consent.withdrawnDate
    )
  }

  // Data Subject Rights (GDPR Articles 15-22)
  async generateDataExport(userId: string): Promise<{
    personalData: Record<string, any>
    processingActivities: string[]
    consents: GDPRConsent[]
    retentionPeriods: Record<string, number>
  }> {
    // Implementation would collect all user data from various systems
    const personalData = await this.collectUserData(userId)
    const userConsents = this.gdprConsents.get(userId) || []
    
    return {
      personalData: await this.anonymizeData(personalData, 'development'), // Don't expose raw PII
      processingActivities: this.getProcessingActivities(userId),
      consents: userConsents,
      retentionPeriods: this.getRetentionPeriods()
    }
  }

  async processDataDeletionRequest(userId: string, dataTypes?: string[]): Promise<{
    deleted: string[]
    retained: string[]
    reason: string
  }> {
    const deleted: string[] = []
    const retained: string[] = []
    let reason = ''
    
    // Check if deletion is legally required or if there are legitimate grounds to retain
    const hasLegalObligation = await this.checkLegalObligation(userId)
    if (hasLegalObligation) {
      reason = 'Data retained due to legal obligations'
      return { deleted, retained: dataTypes || ['all'], reason }
    }
    
    // Process deletion for specified data types
    const typesToDelete = dataTypes || await this.getAllUserDataTypes(userId)
    
    for (const dataType of typesToDelete) {
      try {
        await this.deleteUserDataByType(userId, dataType)
        deleted.push(dataType)
      } catch (error) {
        retained.push(dataType)
      }
    }
    
    return { deleted, retained, reason: 'Deletion processed successfully' }
  }

  // Security Utilities
  private maskValue(value: string): string {
    if (value.length <= 4) return '*'.repeat(value.length)
    return value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2)
  }

  private hashValue(value: string): string {
    return createHash('sha256').update(value + 'salt').digest('hex').slice(0, 16)
  }

  private tokenizeValue(value: string): string {
    // In production, this would use a proper tokenization service
    const hash = createHash('sha256').update(value).digest('hex')
    return `TOKEN_${hash.slice(0, 12).toUpperCase()}`
  }

  private async archiveRecord(record: any): Promise<any> {
    // Encrypt record for archival
    const encrypted = await this.encryptData(JSON.stringify(record))
    return {
      id: record.id,
      archivedAt: new Date(),
      encryptedData: encrypted
    }
  }

  private async secureDelete(record: any): Promise<void> {
    // Cryptographic erasure - delete encryption keys
    console.log(`Securely deleting record ${record.id}`)
    
    // In production, this would:
    // 1. Overwrite data with random bytes multiple times
    // 2. Delete encryption keys
    // 3. Update file system metadata
    // 4. Verify deletion was successful
  }

  private async handleConsentWithdrawal(userId: string, purpose: string): Promise<void> {
    // Implementation would trigger appropriate data handling based on consent withdrawal
    console.log(`Handling consent withdrawal for user ${userId}, purpose: ${purpose}`)
  }

  private initializePIIFields(): void {
    this.piiFields = [
      {
        fieldName: 'email',
        classification: { level: 'confidential', retention: 2555, encryption: true, anonymization: true, accessLogging: true },
        anonymizationMethod: 'hash',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      },
      {
        fieldName: 'phone',
        classification: { level: 'confidential', retention: 2555, encryption: true, anonymization: true, accessLogging: true },
        anonymizationMethod: 'mask',
        pattern: /^\+?[\d\s\-\(\)]{10,}$/
      },
      {
        fieldName: 'ssn',
        classification: { level: 'restricted', retention: 2555, encryption: true, anonymization: true, accessLogging: true },
        anonymizationMethod: 'tokenize',
        pattern: /^\d{3}-?\d{2}-?\d{4}$/
      },
      {
        fieldName: 'creditcard',
        classification: { level: 'restricted', retention: 90, encryption: true, anonymization: true, accessLogging: true },
        anonymizationMethod: 'tokenize',
        pattern: /^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$/
      },
      {
        fieldName: 'address',
        classification: { level: 'confidential', retention: 2555, encryption: true, anonymization: true, accessLogging: true },
        anonymizationMethod: 'mask'
      },
      {
        fieldName: 'name',
        classification: { level: 'confidential', retention: 2555, encryption: true, anonymization: true, accessLogging: true },
        anonymizationMethod: 'hash'
      }
    ]
  }

  private initializeRetentionPolicies(): void {
    this.retentionPolicies = [
      {
        id: 'user-data',
        name: 'User Personal Data',
        dataType: 'user',
        retentionPeriod: 2555, // 7 years
        archivePeriod: 1825, // 5 years
        deletionMethod: 'cryptographic_erasure',
        triggers: ['account_deletion', 'consent_withdrawal']
      },
      {
        id: 'transaction-data',
        name: 'Transaction Records',
        dataType: 'transaction',
        retentionPeriod: 2555, // 7 years (legal requirement)
        deletionMethod: 'secure_wipe',
        triggers: ['legal_requirement_met']
      },
      {
        id: 'session-data',
        name: 'Session Logs',
        dataType: 'session',
        retentionPeriod: 90, // 3 months
        deletionMethod: 'secure_wipe',
        triggers: ['session_expired']
      },
      {
        id: 'audit-logs',
        name: 'Security Audit Logs',
        dataType: 'audit',
        retentionPeriod: 2555, // 7 years
        archivePeriod: 1825, // 5 years
        deletionMethod: 'cryptographic_erasure',
        triggers: ['legal_requirement_met']
      }
    ]
  }

  // Mock database operations
  private async collectUserData(userId: string): Promise<Record<string, any>> {
    // Mock implementation - would collect from various data sources
    return {
      id: userId,
      email: 'user@example.com',
      name: 'John Doe',
      address: '123 Main St',
      createdAt: new Date()
    }
  }

  private getProcessingActivities(userId: string): string[] {
    return ['user_authentication', 'order_processing', 'analytics', 'customer_support']
  }

  private getRetentionPeriods(): Record<string, number> {
    return this.retentionPolicies.reduce((acc, policy) => {
      acc[policy.dataType] = policy.retentionPeriod
      return acc
    }, {} as Record<string, number>)
  }

  private async checkLegalObligation(userId: string): Promise<boolean> {
    // Check if there are legal obligations to retain data
    // (e.g., ongoing legal proceedings, tax requirements)
    return false
  }

  private async getAllUserDataTypes(userId: string): Promise<string[]> {
    return ['user', 'session', 'transaction', 'analytics']
  }

  private async deleteUserDataByType(userId: string, dataType: string): Promise<void> {
    console.log(`Deleting ${dataType} data for user ${userId}`)
  }

  // Public API
  getDataClassification(fieldName: string): DataClassification | null {
    const field = this.piiFields.find(f => f.fieldName === fieldName)
    return field ? field.classification : null
  }

  getRetentionPolicies(): DataRetentionPolicy[] {
    return [...this.retentionPolicies]
  }

  getUserConsents(userId: string): GDPRConsent[] {
    return this.gdprConsents.get(userId) || []
  }

  async validateDataProcessing(userId: string, purpose: string, dataTypes: string[]): Promise<{
    allowed: boolean
    missingConsents: string[]
    expiredConsents: string[]
  }> {
    const missingConsents: string[] = []
    const expiredConsents: string[] = []
    
    for (const dataType of dataTypes) {
      if (!this.hasValidConsent(userId, purpose, dataType)) {
        const userConsents = this.gdprConsents.get(userId) || []
        const consent = userConsents.find(c => c.purpose === purpose && c.dataTypes.includes(dataType))
        
        if (!consent) {
          missingConsents.push(dataType)
        } else if (consent.withdrawnDate) {
          expiredConsents.push(dataType)
        }
      }
    }
    
    return {
      allowed: missingConsents.length === 0 && expiredConsents.length === 0,
      missingConsents,
      expiredConsents
    }
  }
}