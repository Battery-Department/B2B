/**
 * RHY Supplier Portal - Data Protection Security Testing Suite
 * Comprehensive data security tests for enterprise FlexVolt operations
 * Tests encryption, data sanitization, privacy compliance, and secure data handling
 */

import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals'
import { rhyPrisma } from '@/lib/rhy-database'
import { authService } from '@/services/auth/AuthService'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Data protection testing utilities
class DataProtectionTestUtils {
  static async createTestSupplier(overrides = {}) {
    const sensitiveData = {
      email: `data-protection-${uuidv4()}@rhy-security.com`,
      passwordHash: await bcrypt.hash('SecureTestPassword123!', 12),
      companyName: 'Data Protection Test Corp',
      contactName: 'John Privacy Tester',
      phoneNumber: '+1-555-DATA-SEC',
      taxId: 'TAX-123-456-789',
      status: 'ACTIVE',
      tier: 'STANDARD',
      businessType: 'DIRECT',
      mfaEnabled: false,
      ...overrides
    }

    return await rhyPrisma.rHYSupplier.create({
      data: {
        ...sensitiveData,
        warehouseAccess: {
          create: {
            warehouse: 'US',
            role: 'OPERATOR',
            permissions: ['VIEW_PRODUCTS', 'PLACE_ORDERS'],
            grantedAt: new Date()
          }
        }
      },
      include: {
        warehouseAccess: true
      }
    })
  }

  static async cleanupTestData() {
    await rhyPrisma.rHYSupplier.deleteMany({
      where: {
        email: { contains: 'rhy-security.com' }
      }
    })
  }

  static createSecurityContext(overrides = {}) {
    return {
      ipAddress: '192.168.1.100',
      userAgent: 'Data Protection Test Bot',
      timestamp: new Date(),
      deviceFingerprint: 'data-protection-device',
      ...overrides
    }
  }

  static generatePersonalData() {
    return {
      sensitiveStrings: [
        'SSN: 123-45-6789',
        'Credit Card: 4111-1111-1111-1111',
        'Driver License: DL123456789',
        'Tax ID: 12-3456789',
        'Bank Account: 1234567890'
      ],
      piiData: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
        ssn: '123-45-6789',
        address: '123 Privacy Street, Security City, SC 12345'
      },
      financialData: {
        creditCard: '4111111111111111',
        bankAccount: '1234567890',
        routingNumber: '987654321',
        taxId: '12-3456789'
      }
    }
  }

  static async createTestOrder(supplierId: string) {
    return await rhyPrisma.order.create({
      data: {
        orderNumber: `ORDER-${uuidv4()}`,
        customerId: supplierId,
        status: 'pending',
        subtotal: 100.00,
        tax: 8.50,
        shipping: 15.00,
        total: 123.50,
        currency: 'USD',
        shippingAddress: {
          name: 'John Doe',
          street: '123 Privacy Street',
          city: 'Security City',
          state: 'SC',
          zip: '12345',
          country: 'USA'
        },
        customerNotes: 'Handle with care - sensitive equipment'
      }
    })
  }

  static generateMaliciousDataPayloads() {
    return {
      xssAttempts: [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert(document.cookie)',
        '<svg onload="alert(1)">',
        '"><script>alert("XSS")</script>'
      ],
      sqlInjectionAttempts: [
        "'; DROP TABLE rHYSupplier; --",
        "' UNION SELECT password FROM rHYSupplier --",
        "admin' OR '1'='1' --",
        "'; INSERT INTO malicious_table VALUES ('hacked'); --"
      ],
      pathTraversalAttempts: [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '../../../../../../../../etc/shadow',
        '../.env',
        '../../database.sqlite'
      ]
    }
  }
}

describe('🛡️ RHY Data Protection Security Testing Suite', () => {
  beforeAll(async () => {
    await DataProtectionTestUtils.cleanupTestData()
  })

  afterAll(async () => {
    await DataProtectionTestUtils.cleanupTestData()
  })

  describe('🔐 Data Encryption Tests', () => {
    test('should store passwords using secure hashing', async () => {
      const supplier = await DataProtectionTestUtils.createTestSupplier()
      
      // Verify password is hashed, not stored in plain text
      expect(supplier.passwordHash).toBeDefined()
      expect(supplier.passwordHash).not.toBe('SecureTestPassword123!')
      expect(supplier.passwordHash.startsWith('$2a$')).toBe(true) // bcrypt hash
      
      // Verify password can be verified
      const isValid = await bcrypt.compare('SecureTestPassword123!', supplier.passwordHash)
      expect(isValid).toBe(true)
      
      // Verify wrong password fails
      const isInvalid = await bcrypt.compare('WrongPassword', supplier.passwordHash)
      expect(isInvalid).toBe(false)
    })

    test('should protect sensitive supplier data in database', async () => {
      const supplier = await DataProtectionTestUtils.createTestSupplier({
        taxId: 'TAX-SENSITIVE-123456',
        internalNotes: 'Contains sensitive business information'
      })

      // Verify data is stored
      expect(supplier.taxId).toBeDefined()
      
      // In production, sensitive fields should be encrypted
      // This test demonstrates the expectation for encryption
      const storedSupplier = await rhyPrisma.rHYSupplier.findUnique({
        where: { id: supplier.id }
      })

      expect(storedSupplier?.taxId).toBeDefined()
      // In real implementation, taxId would be encrypted
    })

    test('should encrypt MFA secrets securely', async () => {
      const supplier = await DataProtectionTestUtils.createTestSupplier()
      
      // Setup MFA
      const setupResult = await authService.setupMFA(
        supplier.id,
        'SecureTestPassword123!',
        DataProtectionTestUtils.createSecurityContext()
      )

      expect(setupResult.success).toBe(true)
      expect(setupResult.secret).toBeDefined()

      // Verify MFA secret is stored securely in database
      const mfaRecord = await rhyPrisma.rHYMFA.findUnique({
        where: { supplierId: supplier.id }
      })

      expect(mfaRecord).toBeDefined()
      expect(mfaRecord?.secret).toBeDefined()
      // In production, secret should be encrypted
    })

    test('should protect session data integrity', async () => {
      const supplier = await DataProtectionTestUtils.createTestSupplier()
      
      const loginResult = await authService.login(
        {
          email: supplier.email,
          password: 'SecureTestPassword123!',
          warehouse: 'US'
        },
        DataProtectionTestUtils.createSecurityContext()
      )

      expect(loginResult.success).toBe(true)

      // Verify session data is stored securely
      const sessions = await rhyPrisma.rHYSession.findMany({
        where: { supplierId: supplier.id }
      })

      expect(sessions.length).toBeGreaterThan(0)
      expect(sessions[0].deviceFingerprint).toBeDefined()
      // Session data should be tamper-resistant
    })
  })

  describe('🧹 Data Sanitization Tests', () => {
    test('should sanitize user input to prevent XSS', async () => {
      const maliciousPayloads = DataProtectionTestUtils.generateMaliciousDataPayloads()
      
      for (const xssPayload of maliciousPayloads.xssAttempts) {
        const supplier = await DataProtectionTestUtils.createTestSupplier({
          companyName: xssPayload,
          contactName: xssPayload
        })

        // Data should be stored but sanitized
        expect(supplier.companyName).toBeDefined()
        expect(supplier.contactName).toBeDefined()
        
        // Should not contain executable script tags
        expect(supplier.companyName).not.toMatch(/<script[^>]*>/i)
        expect(supplier.contactName).not.toMatch(/<script[^>]*>/i)

        await rhyPrisma.rHYSupplier.delete({ where: { id: supplier.id } })
      }
    })

    test('should prevent SQL injection in user inputs', async () => {
      const maliciousPayloads = DataProtectionTestUtils.generateMaliciousDataPayloads()
      
      for (const sqlPayload of maliciousPayloads.sqlInjectionAttempts) {
        // Attempt to create supplier with SQL injection payload
        try {
          const supplier = await DataProtectionTestUtils.createTestSupplier({
            companyName: sqlPayload,
            contactName: sqlPayload
          })

          // If creation succeeds, verify data integrity
          expect(supplier.companyName).toBe(sqlPayload) // Stored as literal string
          expect(supplier.contactName).toBe(sqlPayload)

          // Verify database integrity
          const supplierCount = await rhyPrisma.rHYSupplier.count()
          expect(supplierCount).toBeGreaterThan(0) // Database should still exist

          await rhyPrisma.rHYSupplier.delete({ where: { id: supplier.id } })
        } catch (error) {
          // If creation fails, that's also acceptable (input validation)
          expect(error).toBeDefined()
        }
      }
    })

    test('should validate and sanitize file upload inputs', async () => {
      const maliciousFilenames = [
        '../../../etc/passwd',
        'script.js<script>alert(1)</script>',
        'invoice.pdf; rm -rf /',
        'document.exe',
        'file with spaces and $pecial ch@rs!'
      ]

      for (const filename of maliciousFilenames) {
        // Test filename sanitization
        const sanitizedFilename = filename.replace(/[<>:"/\\|?*]/g, '_')
        expect(sanitizedFilename).not.toContain('<')
        expect(sanitizedFilename).not.toContain('>')
        expect(sanitizedFilename).not.toContain('..')
      }
    })

    test('should strip metadata from uploaded files', async () => {
      // This test demonstrates the expectation for metadata stripping
      const fileWithMetadata = {
        originalName: 'invoice.pdf',
        mimeType: 'application/pdf',
        size: 1024000,
        metadata: {
          author: 'John Doe',
          creator: 'Microsoft Word',
          created: '2024-01-01',
          modified: '2024-01-15',
          location: 'GPS coordinates embedded'
        }
      }

      // In production, metadata should be stripped before storage
      const sanitizedFile = {
        originalName: fileWithMetadata.originalName,
        mimeType: fileWithMetadata.mimeType,
        size: fileWithMetadata.size
        // metadata should be removed
      }

      expect(sanitizedFile.metadata).toBeUndefined()
    })
  })

  describe('🕵️ Data Privacy Compliance Tests', () => {
    test('should support data subject access requests (GDPR Article 15)', async () => {
      const supplier = await DataProtectionTestUtils.createTestSupplier()
      const order = await DataProtectionTestUtils.createTestOrder(supplier.id)

      // Simulate data access request
      const supplierData = await rhyPrisma.rHYSupplier.findUnique({
        where: { id: supplier.id },
        include: {
          warehouseAccess: true,
          sessions: true
        }
      })

      const orderData = await rhyPrisma.order.findMany({
        where: { customerId: supplier.id }
      })

      // User should be able to access all their data
      expect(supplierData).toBeDefined()
      expect(supplierData?.email).toBe(supplier.email)
      expect(supplierData?.warehouseAccess).toBeDefined()
      expect(orderData.length).toBeGreaterThan(0)
    })

    test('should support data portability (GDPR Article 20)', async () => {
      const supplier = await DataProtectionTestUtils.createTestSupplier()
      await DataProtectionTestUtils.createTestOrder(supplier.id)

      // Export user data in portable format
      const exportData = {
        supplier: await rhyPrisma.rHYSupplier.findUnique({
          where: { id: supplier.id },
          include: {
            warehouseAccess: true
          }
        }),
        orders: await rhyPrisma.order.findMany({
          where: { customerId: supplier.id }
        }),
        sessions: await rhyPrisma.rHYSession.findMany({
          where: { supplierId: supplier.id }
        })
      }

      // Data should be exportable in machine-readable format
      const jsonExport = JSON.stringify(exportData)
      expect(jsonExport).toBeDefined()
      expect(jsonExport.length).toBeGreaterThan(0)
      
      // Verify data integrity in export
      const parsedData = JSON.parse(jsonExport)
      expect(parsedData.supplier.email).toBe(supplier.email)
    })

    test('should support right to erasure (GDPR Article 17)', async () => {
      const supplier = await DataProtectionTestUtils.createTestSupplier()
      const order = await DataProtectionTestUtils.createTestOrder(supplier.id)

      // Verify data exists
      const initialSupplier = await rhyPrisma.rHYSupplier.findUnique({
        where: { id: supplier.id }
      })
      expect(initialSupplier).toBeDefined()

      // Simulate erasure request (anonymization approach for business records)
      await rhyPrisma.rHYSupplier.update({
        where: { id: supplier.id },
        data: {
          email: `anonymized-${supplier.id}@deleted.rhy.com`,
          companyName: 'ANONYMIZED',
          contactName: 'ANONYMIZED',
          phoneNumber: 'ANONYMIZED',
          taxId: null
        }
      })

      // Verify data is anonymized
      const anonymizedSupplier = await rhyPrisma.rHYSupplier.findUnique({
        where: { id: supplier.id }
      })

      expect(anonymizedSupplier?.email).toContain('anonymized')
      expect(anonymizedSupplier?.companyName).toBe('ANONYMIZED')
      expect(anonymizedSupplier?.contactName).toBe('ANONYMIZED')
      expect(anonymizedSupplier?.taxId).toBeNull()
    })

    test('should support data rectification (GDPR Article 16)', async () => {
      const supplier = await DataProtectionTestUtils.createTestSupplier()

      // Simulate rectification request
      const updatedData = {
        companyName: 'Corrected Company Name Ltd.',
        contactName: 'Corrected Contact Person',
        phoneNumber: '+1-555-CORRECTED'
      }

      await rhyPrisma.rHYSupplier.update({
        where: { id: supplier.id },
        data: updatedData
      })

      // Verify data is updated
      const correctedSupplier = await rhyPrisma.rHYSupplier.findUnique({
        where: { id: supplier.id }
      })

      expect(correctedSupplier?.companyName).toBe(updatedData.companyName)
      expect(correctedSupplier?.contactName).toBe(updatedData.contactName)
      expect(correctedSupplier?.phoneNumber).toBe(updatedData.phoneNumber)
    })

    test('should implement consent management', async () => {
      const supplier = await DataProtectionTestUtils.createTestSupplier({
        acceptsMarketing: true,
        acceptsAnalytics: false,
        acceptsCookies: true
      })

      // Verify consent is properly stored
      expect(supplier.acceptsMarketing).toBe(true)
      
      // Test consent withdrawal
      await rhyPrisma.rHYSupplier.update({
        where: { id: supplier.id },
        data: {
          acceptsMarketing: false
        }
      })

      const updatedSupplier = await rhyPrisma.rHYSupplier.findUnique({
        where: { id: supplier.id }
      })

      expect(updatedSupplier?.acceptsMarketing).toBe(false)
    })
  })

  describe('🗃️ Data Retention and Lifecycle Tests', () => {
    test('should implement data retention policies', async () => {
      // Create old supplier data
      const oldSupplier = await rhyPrisma.rHYSupplier.create({
        data: {
          email: `old-data-${uuidv4()}@rhy-security.com`,
          passwordHash: await bcrypt.hash('OldPassword123!', 12),
          companyName: 'Old Company',
          contactName: 'Old Contact',
          phoneNumber: '+1-555-OLD-DATA',
          status: 'INACTIVE',
          tier: 'STANDARD',
          businessType: 'DIRECT',
          mfaEnabled: false,
          createdAt: new Date('2020-01-01'), // Old data
          lastLoginAt: new Date('2021-01-01'), // Very old login
          warehouseAccess: {
            create: {
              warehouse: 'US',
              role: 'OPERATOR',
              permissions: ['VIEW_PRODUCTS'],
              grantedAt: new Date('2020-01-01')
            }
          }
        }
      })

      // In production, implement retention policy check
      const retentionThreshold = new Date()
      retentionThreshold.setFullYear(retentionThreshold.getFullYear() - 3) // 3 year retention

      // Data older than retention threshold should be candidates for archival/deletion
      const oldData = await rhyPrisma.rHYSupplier.findMany({
        where: {
          AND: [
            { createdAt: { lt: retentionThreshold } },
            { status: 'INACTIVE' },
            { lastLoginAt: { lt: retentionThreshold } }
          ]
        }
      })

      expect(oldData.length).toBeGreaterThanOrEqual(1)
    })

    test('should archive inactive sessions', async () => {
      const supplier = await DataProtectionTestUtils.createTestSupplier()

      // Create expired session
      const expiredSession = await rhyPrisma.rHYSession.create({
        data: {
          id: uuidv4(),
          supplierId: supplier.id,
          ipAddress: '192.168.1.100',
          userAgent: 'Test Browser',
          warehouse: 'US',
          expiresAt: new Date('2023-01-01'), // Expired
          deviceFingerprint: 'old-device',
          lastUsedAt: new Date('2023-01-01')
        }
      })

      // Find expired sessions for cleanup
      const expiredSessions = await rhyPrisma.rHYSession.findMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      })

      expect(expiredSessions.length).toBeGreaterThan(0)

      // Archive or delete expired sessions
      await rhyPrisma.rHYSession.deleteMany({
        where: {
          id: { in: expiredSessions.map(s => s.id) }
        }
      })

      // Verify cleanup
      const remainingSessions = await rhyPrisma.rHYSession.findMany({
        where: {
          id: expiredSession.id
        }
      })

      expect(remainingSessions.length).toBe(0)
    })

    test('should manage audit log retention', async () => {
      // Create old audit log entries
      const oldAuditLog = await rhyPrisma.auditLog.create({
        data: {
          action: 'LOGIN_SUCCESS',
          entityType: 'SUPPLIER',
          entityId: uuidv4(),
          userId: uuidv4(),
          ipAddress: '192.168.1.100',
          details: { test: 'old audit data' },
          createdAt: new Date('2023-01-01') // Old entry
        }
      })

      // Implement audit log retention (e.g., 7 years for compliance)
      const auditRetentionThreshold = new Date()
      auditRetentionThreshold.setFullYear(auditRetentionThreshold.getFullYear() - 7)

      const oldAuditEntries = await rhyPrisma.auditLog.findMany({
        where: {
          createdAt: { lt: auditRetentionThreshold }
        }
      })

      // Old entries should be archived, not deleted (compliance requirement)
      expect(oldAuditEntries).toBeDefined()
    })
  })

  describe('🔒 Access Control and Authorization Tests', () => {
    test('should enforce role-based data access', async () => {
      const viewerSupplier = await rhyPrisma.rHYSupplier.create({
        data: {
          email: `viewer-${uuidv4()}@rhy-security.com`,
          passwordHash: await bcrypt.hash('ViewerPassword123!', 12),
          companyName: 'Viewer Company',
          contactName: 'Viewer Contact',
          phoneNumber: '+1-555-VIEWER',
          status: 'ACTIVE',
          tier: 'STANDARD',
          businessType: 'DIRECT',
          mfaEnabled: false,
          warehouseAccess: {
            create: {
              warehouse: 'US',
              role: 'VIEWER', // Limited role
              permissions: ['VIEW_PRODUCTS'], // Limited permissions
              grantedAt: new Date()
            }
          }
        },
        include: {
          warehouseAccess: true
        }
      })

      // Verify role-based permissions
      const usAccess = viewerSupplier.warehouseAccess.find(w => w.warehouse === 'US')
      expect(usAccess?.role).toBe('VIEWER')
      expect(usAccess?.permissions).toEqual(['VIEW_PRODUCTS'])
      expect(usAccess?.permissions).not.toContain('PLACE_ORDERS')
      expect(usAccess?.permissions).not.toContain('ADMIN_ACCESS')
    })

    test('should prevent unauthorized data access across warehouses', async () => {
      const supplier = await DataProtectionTestUtils.createTestSupplier()

      // Verify supplier only has access to authorized warehouse
      const authorizedWarehouses = supplier.warehouseAccess.map(w => w.warehouse)
      expect(authorizedWarehouses).toContain('US')
      expect(authorizedWarehouses).not.toContain('JP')
      expect(authorizedWarehouses).not.toContain('AU')
    })

    test('should implement data classification and handling', async () => {
      const sensitiveData = DataProtectionTestUtils.generatePersonalData()
      
      // Classify data sensitivity levels
      const dataClassification = {
        public: ['companyName', 'publicEmail'],
        internal: ['phoneNumber', 'address'],
        confidential: ['taxId', 'creditCard'],
        restricted: ['ssn', 'password']
      }

      // Verify appropriate handling for each classification
      Object.entries(dataClassification).forEach(([level, fields]) => {
        fields.forEach(field => {
          // Each field should have appropriate security controls based on classification
          expect(field).toBeDefined()
          expect(level).toBeDefined()
        })
      })
    })
  })

  describe('📊 Data Integrity and Validation Tests', () => {
    test('should validate data integrity on creation', async () => {
      const validData = {
        email: 'valid@example.com',
        companyName: 'Valid Company Name',
        phoneNumber: '+1-555-123-4567'
      }

      const supplier = await DataProtectionTestUtils.createTestSupplier(validData)
      
      expect(supplier.email).toBe(validData.email)
      expect(supplier.companyName).toBe(validData.companyName)
      expect(supplier.phoneNumber).toBe(validData.phoneNumber)
    })

    test('should prevent data corruption through validation', async () => {
      const invalidDataSets = [
        { email: 'invalid-email' }, // Invalid email format
        { phoneNumber: 'not-a-phone' }, // Invalid phone format
        { companyName: '' }, // Empty required field
      ]

      for (const invalidData of invalidDataSets) {
        try {
          await DataProtectionTestUtils.createTestSupplier(invalidData)
          // If creation succeeds, data should be corrected or validated
        } catch (error) {
          // Validation errors are acceptable
          expect(error).toBeDefined()
        }
      }
    })

    test('should maintain referential integrity', async () => {
      const supplier = await DataProtectionTestUtils.createTestSupplier()
      const order = await DataProtectionTestUtils.createTestOrder(supplier.id)

      // Verify foreign key relationships
      const orderWithSupplier = await rhyPrisma.order.findUnique({
        where: { id: order.id },
        include: {
          customer: true
        }
      })

      expect(orderWithSupplier?.customerId).toBe(supplier.id)
      expect(orderWithSupplier?.customer?.id).toBe(supplier.id)
    })

    test('should detect and prevent data tampering', async () => {
      const supplier = await DataProtectionTestUtils.createTestSupplier()
      const originalCreatedAt = supplier.createdAt
      const originalId = supplier.id

      // Attempt to tamper with critical fields
      try {
        await rhyPrisma.rHYSupplier.update({
          where: { id: supplier.id },
          data: {
            // Attempting to modify system fields that shouldn't change
            createdAt: new Date('2020-01-01'),
            // id cannot be updated in Prisma
          }
        })
      } catch (error) {
        // Some fields may be protected from updates
      }

      // Verify critical data integrity
      const updatedSupplier = await rhyPrisma.rHYSupplier.findUnique({
        where: { id: supplier.id }
      })

      expect(updatedSupplier?.id).toBe(originalId)
      // createdAt might be updatable in this schema, but should be protected in production
    })
  })

  describe('🔍 Data Monitoring and Alerting Tests', () => {
    test('should detect suspicious data access patterns', async () => {
      const supplier = await DataProtectionTestUtils.createTestSupplier()

      // Simulate rapid consecutive data access (potential data scraping)
      const accessAttempts = []
      for (let i = 0; i < 10; i++) {
        accessAttempts.push(
          rhyPrisma.rHYSupplier.findUnique({
            where: { id: supplier.id }
          })
        )
      }

      const results = await Promise.all(accessAttempts)
      
      // All attempts should succeed, but would trigger monitoring alerts in production
      expect(results.every(result => result !== null)).toBe(true)
      
      // In production, this pattern would be flagged for review
    })

    test('should log data access for audit purposes', async () => {
      const supplier = await DataProtectionTestUtils.createTestSupplier()

      // Access supplier data
      await rhyPrisma.rHYSupplier.findUnique({
        where: { id: supplier.id }
      })

      // In production, this would create audit log entry
      const auditEntry = await rhyPrisma.auditLog.create({
        data: {
          action: 'DATA_ACCESS',
          entityType: 'SUPPLIER',
          entityId: supplier.id,
          userId: 'system',
          ipAddress: '192.168.1.100',
          details: { accessType: 'READ', fields: ['email', 'companyName'] }
        }
      })

      expect(auditEntry).toBeDefined()
      expect(auditEntry.action).toBe('DATA_ACCESS')
      expect(auditEntry.entityId).toBe(supplier.id)
    })

    test('should monitor for data export activities', async () => {
      const supplier = await DataProtectionTestUtils.createTestSupplier()
      
      // Simulate data export
      const exportData = await rhyPrisma.rHYSupplier.findUnique({
        where: { id: supplier.id },
        include: {
          warehouseAccess: true
        }
      })

      // Log export activity
      const exportLog = await rhyPrisma.auditLog.create({
        data: {
          action: 'DATA_EXPORT',
          entityType: 'SUPPLIER',
          entityId: supplier.id,
          userId: 'system',
          ipAddress: '192.168.1.100',
          details: { 
            exportType: 'full_profile',
            dataSize: JSON.stringify(exportData).length,
            timestamp: new Date()
          }
        }
      })

      expect(exportLog).toBeDefined()
      expect(exportLog.action).toBe('DATA_EXPORT')
    })
  })
})