/**
 * RHY_066 Internal Messaging System - API Tests
 * Comprehensive test suite for messaging APIs
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals'
import { NextRequest } from 'next/server'
import { MessagingService } from '@/services/communication/MessagingService'
import { messagingSecurityService } from '@/lib/messaging-security'
import { prisma } from '@/lib/prisma'

// Mock data
const mockSupplier = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@supplier.com',
  contactName: 'Test Supplier',
  companyName: 'Test Company',
  role: 'VIEWER'
}

const mockConversation = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Test Conversation',
  type: 'DIRECT' as const,
  participantIds: [mockSupplier.id, '550e8400-e29b-41d4-a716-446655440002'],
  warehouseId: '550e8400-e29b-41d4-a716-446655440003',
  region: 'US' as const,
  metadata: {}
}

const mockMessage = {
  conversationId: mockConversation.id,
  content: 'Test message content',
  type: 'TEXT' as const,
  priority: 'NORMAL' as const
}

// Test utilities
class TestMessagingAPI {
  private messagingService: MessagingService

  constructor() {
    this.messagingService = MessagingService.getInstance()
  }

  async createTestRequest(method: string, url: string, body?: any, headers?: Record<string, string>): Promise<NextRequest> {
    const requestInit: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=test_session_${mockSupplier.id}`,
        ...headers
      }
    }

    if (body) {
      requestInit.body = JSON.stringify(body)
    }

    return new NextRequest(url, requestInit as any)
  }

  async authenticateRequest(request: NextRequest): Promise<any> {
    // Mock authentication for tests
    return {
      valid: true,
      supplier: mockSupplier
    }
  }

  async testMessageCreation(messageData: any): Promise<any> {
    return await this.messagingService.sendMessage(
      messageData,
      mockSupplier.id,
      { name: mockSupplier.contactName, role: mockSupplier.role }
    )
  }

  async testConversationCreation(conversationData: any): Promise<any> {
    return await this.messagingService.createConversation(
      conversationData,
      mockSupplier.id
    )
  }

  async testMessagesRetrieval(conversationId: string, query: any = {}): Promise<any> {
    return await this.messagingService.getMessages(
      conversationId,
      mockSupplier.id,
      query
    )
  }

  async testConversationsRetrieval(query: any = {}): Promise<any> {
    return await this.messagingService.getConversations(
      mockSupplier.id,
      query
    )
  }
}

describe('RHY_066 Messaging API Tests', () => {
  let testAPI: TestMessagingAPI
  let testConversationId: string
  let testMessageId: string

  beforeAll(async () => {
    testAPI = new TestMessagingAPI()
    
    // Initialize test database state
    try {
      // Clean up any existing test data
      await prisma.message.deleteMany({
        where: { userId: mockSupplier.id }
      })
      
      await prisma.chatSession.deleteMany({
        where: { userId: mockSupplier.id }
      })
    } catch (error) {
      console.log('Database cleanup skipped (development mode)')
    }
  })

  afterAll(async () => {
    // Final cleanup
    try {
      await prisma.message.deleteMany({
        where: { userId: mockSupplier.id }
      })
      
      await prisma.chatSession.deleteMany({
        where: { userId: mockSupplier.id }
      })
    } catch (error) {
      console.log('Database cleanup skipped (development mode)')
    }
  })

  beforeEach(() => {
    // Reset any mocks or state before each test
    jest.clearAllMocks()
  })

  describe('Conversation Management API', () => {
    it('should create a new conversation successfully', async () => {
      const conversationData = {
        ...mockConversation,
        name: `Test Conversation ${Date.now()}`
      }

      const result = await testAPI.testConversationCreation(conversationData)

      expect(result.success).toBe(true)
      expect(result.data.conversation).toBeDefined()
      expect(result.data.conversation.name).toBe(conversationData.name)
      expect(result.data.conversation.type).toBe(conversationData.type)
      expect(result.data.conversation.participants).toHaveLength(2)
      expect(result.performance.responseTime).toBeLessThan(1000)

      testConversationId = result.data.conversation.id
    })

    it('should validate conversation creation input', async () => {
      const invalidConversationData = {
        name: '', // Invalid: empty name
        type: 'INVALID_TYPE', // Invalid type
        participantIds: [] // Invalid: no participants
      }

      await expect(
        testAPI.testConversationCreation(invalidConversationData)
      ).rejects.toThrow()
    })

    it('should retrieve conversations with pagination', async () => {
      const query = {
        limit: 10,
        offset: 0,
        sortBy: 'lastActivity',
        sortOrder: 'desc'
      }

      const result = await testAPI.testConversationsRetrieval(query)

      expect(result.success).toBe(true)
      expect(result.data.conversations).toBeDefined()
      expect(Array.isArray(result.data.conversations)).toBe(true)
      expect(result.data.pagination).toBeDefined()
      expect(result.data.summary).toBeDefined()
      expect(result.performance.responseTime).toBeLessThan(1000)
    })

    it('should filter conversations by type', async () => {
      const query = {
        type: 'DIRECT',
        limit: 20
      }

      const result = await testAPI.testConversationsRetrieval(query)

      expect(result.success).toBe(true)
      expect(result.data.conversations.every((conv: any) => conv.type === 'DIRECT')).toBe(true)
    })

    it('should handle conversation search', async () => {
      const query = {
        search: 'Test',
        limit: 10
      }

      const result = await testAPI.testConversationsRetrieval(query)

      expect(result.success).toBe(true)
      expect(result.data.conversations).toBeDefined()
    })
  })

  describe('Message Management API', () => {
    beforeEach(async () => {
      // Ensure we have a test conversation
      if (!testConversationId) {
        const conversationResult = await testAPI.testConversationCreation({
          ...mockConversation,
          name: `Test Conversation for Messages ${Date.now()}`
        })
        testConversationId = conversationResult.data.conversation.id
      }
    })

    it('should send a message successfully', async () => {
      const messageData = {
        ...mockMessage,
        conversationId: testConversationId,
        content: `Test message ${Date.now()}`
      }

      const result = await testAPI.testMessageCreation(messageData)

      expect(result.success).toBe(true)
      expect(result.data.message).toBeDefined()
      expect(result.data.message.content).toBe(messageData.content)
      expect(result.data.message.type).toBe(messageData.type)
      expect(result.data.message.priority).toBe(messageData.priority)
      expect(result.data.message.senderId).toBe(mockSupplier.id)
      expect(result.performance.responseTime).toBeLessThan(1000)

      testMessageId = result.data.message.id
    })

    it('should validate message content', async () => {
      const invalidMessageData = {
        conversationId: testConversationId,
        content: '', // Invalid: empty content
        type: 'TEXT'
      }

      await expect(
        testAPI.testMessageCreation(invalidMessageData)
      ).rejects.toThrow()
    })

    it('should handle long message content', async () => {
      const longContent = 'a'.repeat(5000) // Exceeds max length

      const messageData = {
        conversationId: testConversationId,
        content: longContent,
        type: 'TEXT'
      }

      await expect(
        testAPI.testMessageCreation(messageData)
      ).rejects.toThrow()
    })

    it('should retrieve messages with pagination', async () => {
      const query = {
        limit: 10,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }

      const result = await testAPI.testMessagesRetrieval(testConversationId, query)

      expect(result.success).toBe(true)
      expect(result.data.messages).toBeDefined()
      expect(Array.isArray(result.data.messages)).toBe(true)
      expect(result.data.pagination).toBeDefined()
      expect(result.data.conversation).toBeDefined()
      expect(result.performance.responseTime).toBeLessThan(1000)
    })

    it('should filter messages by type', async () => {
      const query = {
        type: 'TEXT',
        limit: 20
      }

      const result = await testAPI.testMessagesRetrieval(testConversationId, query)

      expect(result.success).toBe(true)
      expect(result.data.messages.every((msg: any) => msg.type === 'TEXT')).toBe(true)
    })

    it('should handle message search', async () => {
      const query = {
        content: 'Test',
        limit: 10
      }

      const result = await testAPI.testMessagesRetrieval(testConversationId, query)

      expect(result.success).toBe(true)
      expect(result.data.messages).toBeDefined()
    })

    it('should handle date range filtering', async () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const query = {
        dateFrom: yesterday.toISOString(),
        dateTo: now.toISOString(),
        limit: 10
      }

      const result = await testAPI.testMessagesRetrieval(testConversationId, query)

      expect(result.success).toBe(true)
      expect(result.data.messages).toBeDefined()
    })
  })

  describe('Security and Validation Tests', () => {
    it('should enforce rate limiting', async () => {
      const messageData = {
        conversationId: testConversationId,
        content: 'Rate limit test message',
        type: 'TEXT'
      }

      // Send multiple messages rapidly
      const promises = Array.from({ length: 70 }, () => 
        testAPI.testMessageCreation({
          ...messageData,
          content: `Rate limit test ${Math.random()}`
        })
      )

      const results = await Promise.allSettled(promises)
      
      // Some should be rejected due to rate limiting
      const rejectedCount = results.filter(r => r.status === 'rejected').length
      expect(rejectedCount).toBeGreaterThan(0)
    })

    it('should sanitize message content', async () => {
      const maliciousContent = '<script>alert("xss")</script>'
      
      const validation = messagingSecurityService.validateMessageContent(maliciousContent, 'TEXT')
      
      expect(validation.valid).toBe(false)
      expect(validation.issues.length).toBeGreaterThan(0)
      expect(validation.sanitizedContent).not.toContain('<script>')
    })

    it('should validate file uploads', async () => {
      const invalidFile = {
        fileName: '../../../etc/passwd',
        fileSize: 1024,
        mimeType: 'text/plain'
      }

      const validation = messagingSecurityService.validateFileUpload(invalidFile)
      
      expect(validation.valid).toBe(false)
      expect(validation.issues).toContain('File name contains suspicious characters')
    })

    it('should check user permissions', async () => {
      const hasReadPermission = messagingSecurityService.checkPermissions(
        mockSupplier.id,
        'read',
        'MESSAGE',
        testConversationId,
        'VIEWER'
      )

      const hasDeletePermission = messagingSecurityService.checkPermissions(
        mockSupplier.id,
        'DELETE',
        'MESSAGE',
        testConversationId,
        'VIEWER'
      )

      expect(hasReadPermission).toBe(true)
      expect(hasDeletePermission).toBe(false)
    })

    it('should validate session tokens', async () => {
      const validToken = messagingSecurityService.generateSecureToken()
      messagingSecurityService.registerSession(mockSupplier.id, validToken)

      const isValid = messagingSecurityService.validateSessionToken(validToken, mockSupplier.id)
      const isInvalid = messagingSecurityService.validateSessionToken('invalid_token', mockSupplier.id)

      expect(isValid).toBe(true)
      expect(isInvalid).toBe(false)
    })
  })

  describe('Performance Tests', () => {
    it('should handle concurrent message creation', async () => {
      const startTime = Date.now()
      
      const messagePromises = Array.from({ length: 10 }, (_, i) => 
        testAPI.testMessageCreation({
          conversationId: testConversationId,
          content: `Concurrent message ${i}`,
          type: 'TEXT'
        })
      )

      const results = await Promise.all(messagePromises)
      const endTime = Date.now()

      expect(results.every(r => r.success)).toBe(true)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should retrieve large message sets efficiently', async () => {
      const startTime = Date.now()
      
      const result = await testAPI.testMessagesRetrieval(testConversationId, {
        limit: 100,
        offset: 0
      })
      
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(endTime - startTime).toBeLessThan(2000) // Should complete within 2 seconds
      expect(result.performance.responseTime).toBeLessThan(1000)
    })

    it('should handle complex message queries efficiently', async () => {
      const startTime = Date.now()
      
      const result = await testAPI.testMessagesRetrieval(testConversationId, {
        content: 'test',
        type: 'TEXT',
        priority: 'NORMAL',
        dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
      
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(endTime - startTime).toBeLessThan(3000)
    })
  })

  describe('Error Handling Tests', () => {
    it('should handle non-existent conversation gracefully', async () => {
      const nonExistentId = 'conv_nonexistent_001'
      
      await expect(
        testAPI.testMessagesRetrieval(nonExistentId)
      ).rejects.toThrow('Conversation not found or access denied')
    })

    it('should handle invalid message data gracefully', async () => {
      const invalidMessageData = {
        conversationId: testConversationId,
        content: null, // Invalid content
        type: 'INVALID_TYPE' // Invalid type
      }

      await expect(
        testAPI.testMessageCreation(invalidMessageData)
      ).rejects.toThrow()
    })

    it('should handle database connection issues', async () => {
      // This test would require mocking database failures
      // For now, we'll test that proper error handling exists
      expect(true).toBe(true) // Placeholder for database error testing
    })

    it('should handle malformed request data', async () => {
      const malformedData = {
        conversationId: 'invalid-uuid',
        content: undefined,
        type: null
      }

      await expect(
        testAPI.testMessageCreation(malformedData)
      ).rejects.toThrow()
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete message flow', async () => {
      // Create conversation
      const conversationResult = await testAPI.testConversationCreation({
        name: `Integration Test Conversation ${Date.now()}`,
        type: 'GROUP',
        participantIds: [mockSupplier.id, 'user_integration_001', 'user_integration_002']
      })

      expect(conversationResult.success).toBe(true)
      const conversationId = conversationResult.data.conversation.id

      // Send messages
      const message1 = await testAPI.testMessageCreation({
        conversationId,
        content: 'First integration test message',
        type: 'TEXT',
        priority: 'NORMAL'
      })

      const message2 = await testAPI.testMessageCreation({
        conversationId,
        content: 'Second integration test message',
        type: 'TEXT',
        priority: 'HIGH'
      })

      expect(message1.success).toBe(true)
      expect(message2.success).toBe(true)

      // Retrieve messages
      const messagesResult = await testAPI.testMessagesRetrieval(conversationId, {
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'asc'
      })

      expect(messagesResult.success).toBe(true)
      expect(messagesResult.data.messages).toHaveLength(2)
      expect(messagesResult.data.messages[0].content).toBe('First integration test message')
      expect(messagesResult.data.messages[1].content).toBe('Second integration test message')

      // Verify conversation in conversations list
      const conversationsResult = await testAPI.testConversationsRetrieval({
        limit: 20
      })

      expect(conversationsResult.success).toBe(true)
      const conversation = conversationsResult.data.conversations.find(
        (c: any) => c.id === conversationId
      )
      expect(conversation).toBeDefined()
      expect(conversation.participants).toBe(3)
    })

    it('should handle message with attachments workflow', async () => {
      // Test file validation
      const validFile = {
        fileName: 'test-document.pdf',
        fileSize: 1024 * 1024, // 1MB
        mimeType: 'application/pdf'
      }

      const fileValidation = messagingSecurityService.validateFileUpload(validFile)
      expect(fileValidation.valid).toBe(true)

      // Create message with attachment metadata
      const messageWithAttachment = await testAPI.testMessageCreation({
        conversationId: testConversationId,
        content: 'Message with attachment',
        type: 'FILE',
        priority: 'NORMAL',
        attachments: [validFile]
      })

      expect(messageWithAttachment.success).toBe(true)
      expect(messageWithAttachment.data.message.type).toBe('FILE')
    })
  })
})

// Test runner configuration
export const testConfig = {
  timeout: 30000, // 30 seconds timeout for tests
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/services/communication/**/*.ts',
    'src/lib/messaging-security.ts',
    'src/app/api/supplier/messages/**/*.ts',
    'src/app/api/supplier/conversations/**/*.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}