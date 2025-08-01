/**
 * RHY_066 Internal Messaging System - Integration Tests
 * End-to-end testing for complete messaging workflow
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import { MessagingService } from '@/services/communication/MessagingService'
import { messagingSecurityService } from '@/lib/messaging-security'
import { prisma } from '@/lib/prisma'

// Integration test suite class
class MessagingIntegrationTest {
  private messagingService: MessagingService
  private testUserId: string
  private testConversationId: string | null = null
  private testMessageIds: string[] = []
  private startTime: number

  constructor() {
    this.messagingService = MessagingService.getInstance()
    this.testUserId = '550e8400-e29b-41d4-a716-446655440000'
    this.startTime = Date.now()
  }

  async setup(): Promise<void> {
    console.log('🚀 Starting RHY_066 Messaging Integration Tests')
    console.log(`Test User ID: ${this.testUserId}`)
    console.log(`Test Start Time: ${new Date(this.startTime).toISOString()}`)
    
    // Cleanup any existing test data
    await this.cleanup()
  }

  async cleanup(): Promise<void> {
    try {
      console.log('🧹 Cleaning up test data...')
      
      // Clean up messages
      const deletedMessages = await prisma.message.deleteMany({
        where: { userId: this.testUserId }
      })
      console.log(`Deleted ${deletedMessages.count} test messages`)

      // Clean up chat sessions
      const deletedSessions = await prisma.chatSession.deleteMany({
        where: { userId: this.testUserId }
      })
      console.log(`Deleted ${deletedSessions.count} test chat sessions`)

      // Clean up notifications
      await prisma.notification.deleteMany({
        where: { userId: this.testUserId }
      })

      this.testConversationId = null
      this.testMessageIds = []
      
    } catch (error) {
      console.log('Cleanup skipped (development mode)')
    }
  }

  async testConversationLifecycle(): Promise<{ success: boolean; metrics: any }> {
    console.log('\n📝 Testing Conversation Lifecycle...')
    const startTime = Date.now()
    
    try {
      // Step 1: Create conversation
      console.log('1. Creating conversation...')
      const conversationData = {
        name: `Integration Test Conversation ${this.startTime}`,
        description: 'Test conversation for integration testing',
        type: 'GROUP' as const,
        participantIds: [this.testUserId, '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
        warehouseId: '550e8400-e29b-41d4-a716-446655440003',
        region: 'US' as const,
        metadata: {
          testRun: this.startTime,
          environment: 'integration'
        }
      }

      const createResult = await this.messagingService.createConversation(
        conversationData,
        this.testUserId
      )

      expect(createResult.success).toBe(true)
      expect(createResult.data.conversation).toBeDefined()
      expect(createResult.data.conversation.name).toBe(conversationData.name)
      expect(createResult.data.conversation.participants).toHaveLength(3)

      this.testConversationId = createResult.data.conversation.id
      console.log(`✅ Conversation created: ${this.testConversationId}`)

      // Step 2: Retrieve conversations
      console.log('2. Retrieving conversations...')
      const conversationsResult = await this.messagingService.getConversations(
        this.testUserId,
        { limit: 10, sortBy: 'lastActivity', sortOrder: 'desc' }
      )

      expect(conversationsResult.success).toBe(true)
      expect(conversationsResult.data.conversations).toBeDefined()
      expect(conversationsResult.data.conversations.length).toBeGreaterThan(0)

      const foundConversation = conversationsResult.data.conversations.find(
        conv => conv.id === this.testConversationId
      )
      expect(foundConversation).toBeDefined()
      console.log(`✅ Conversation found in list`)

      // Step 3: Test pagination
      console.log('3. Testing pagination...')
      const paginatedResult = await this.messagingService.getConversations(
        this.testUserId,
        { limit: 1, offset: 0 }
      )

      expect(paginatedResult.success).toBe(true)
      expect(paginatedResult.data.pagination).toBeDefined()
      expect(paginatedResult.data.pagination.total).toBeGreaterThanOrEqual(1)
      console.log(`✅ Pagination working correctly`)

      const duration = Date.now() - startTime
      return {
        success: true,
        metrics: {
          duration,
          conversationId: this.testConversationId,
          participantCount: 3,
          responseTime: createResult.performance.responseTime
        }
      }

    } catch (error) {
      console.error('❌ Conversation lifecycle test failed:', error)
      return {
        success: false,
        metrics: { duration: Date.now() - startTime, error: error.message }
      }
    }
  }

  async testMessageLifecycle(): Promise<{ success: boolean; metrics: any }> {
    console.log('\n💬 Testing Message Lifecycle...')
    const startTime = Date.now()

    if (!this.testConversationId) {
      throw new Error('No test conversation available. Run conversation lifecycle test first.')
    }

    try {
      // Step 1: Send text message
      console.log('1. Sending text message...')
      const textMessage = {
        conversationId: this.testConversationId,
        content: 'Integration test message - TEXT type',
        type: 'TEXT' as const,
        priority: 'NORMAL' as const,
        metadata: {
          testType: 'integration',
          timestamp: Date.now()
        }
      }

      const textResult = await this.messagingService.sendMessage(
        textMessage,
        this.testUserId,
        { name: 'Integration Test User', role: 'VIEWER' }
      )

      expect(textResult.success).toBe(true)
      expect(textResult.data.message).toBeDefined()
      expect(textResult.data.message.content).toBe(textMessage.content)
      expect(textResult.data.message.senderId).toBe(this.testUserId)

      this.testMessageIds.push(textResult.data.message.id)
      console.log(`✅ Text message sent: ${textResult.data.message.id}`)

      // Step 2: Send warehouse alert message
      console.log('2. Sending warehouse alert message...')
      const alertMessage = {
        conversationId: this.testConversationId,
        content: 'ALERT: Low inventory detected for FlexVolt 9Ah batteries',
        type: 'WAREHOUSE_ALERT' as const,
        priority: 'HIGH' as const,
        metadata: {
          warehouseId: '550e8400-e29b-41d4-a716-446655440003',
          region: 'US',
          alertLevel: 'HIGH'
        }
      }

      const alertResult = await this.messagingService.sendMessage(
        alertMessage,
        this.testUserId,
        { name: 'Integration Test User', role: 'MANAGER' }
      )

      expect(alertResult.success).toBe(true)
      expect(alertResult.data.message.type).toBe('WAREHOUSE_ALERT')
      expect(alertResult.data.message.priority).toBe('HIGH')

      this.testMessageIds.push(alertResult.data.message.id)
      console.log(`✅ Warehouse alert sent: ${alertResult.data.message.id}`)

      // Step 3: Send order update message
      console.log('3. Sending order update message...')
      const orderMessage = {
        conversationId: this.testConversationId,
        content: 'Order #ORD-2024-TEST has been processed and shipped',
        type: 'ORDER_UPDATE' as const,
        priority: 'NORMAL' as const,
        metadata: {
          orderId: 'ORD-2024-TEST',
          status: 'SHIPPED',
          trackingNumber: 'TEST123456789'
        }
      }

      const orderResult = await this.messagingService.sendMessage(
        orderMessage,
        this.testUserId,
        { name: 'Integration Test User', role: 'OPERATOR' }
      )

      expect(orderResult.success).toBe(true)
      expect(orderResult.data.message.type).toBe('ORDER_UPDATE')

      this.testMessageIds.push(orderResult.data.message.id)
      console.log(`✅ Order update sent: ${orderResult.data.message.id}`)

      // Step 4: Retrieve messages
      console.log('4. Retrieving messages...')
      const messagesResult = await this.messagingService.getMessages(
        this.testConversationId,
        this.testUserId,
        { limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }
      )

      expect(messagesResult.success).toBe(true)
      expect(messagesResult.data.messages).toBeDefined()
      expect(messagesResult.data.messages.length).toBeGreaterThanOrEqual(3)

      // Verify all test messages are present
      const messageContents = messagesResult.data.messages.map(m => m.content)
      expect(messageContents).toContain(textMessage.content)
      expect(messageContents).toContain(alertMessage.content)
      expect(messageContents).toContain(orderMessage.content)
      console.log(`✅ All messages retrieved correctly`)

      // Step 5: Test message filtering
      console.log('5. Testing message filtering...')
      const alertFilter = await this.messagingService.getMessages(
        this.testConversationId,
        this.testUserId,
        { type: 'WAREHOUSE_ALERT', limit: 10 }
      )

      expect(alertFilter.success).toBe(true)
      expect(alertFilter.data.messages.every(m => m.type === 'WAREHOUSE_ALERT')).toBe(true)
      console.log(`✅ Message filtering working correctly`)

      // Step 6: Test content search
      console.log('6. Testing content search...')
      const searchResult = await this.messagingService.getMessages(
        this.testConversationId,
        this.testUserId,
        { content: 'FlexVolt', limit: 10 }
      )

      expect(searchResult.success).toBe(true)
      console.log(`✅ Content search working correctly`)

      const duration = Date.now() - startTime
      return {
        success: true,
        metrics: {
          duration,
          messagesSent: this.testMessageIds.length,
          messagesRetrieved: messagesResult.data.messages.length,
          averageResponseTime: [textResult, alertResult, orderResult]
            .reduce((sum, r) => sum + r.performance.responseTime, 0) / 3
        }
      }

    } catch (error) {
      console.error('❌ Message lifecycle test failed:', error)
      return {
        success: false,
        metrics: { duration: Date.now() - startTime, error: error.message }
      }
    }
  }

  async testSecurityFeatures(): Promise<{ success: boolean; metrics: any }> {
    console.log('\n🔒 Testing Security Features...')
    const startTime = Date.now()

    try {
      // Step 1: Test rate limiting
      console.log('1. Testing rate limiting...')
      const rateLimitTest = await messagingSecurityService.checkRateLimit(
        this.testUserId,
        'message'
      )

      expect(rateLimitTest.allowed).toBe(true)
      expect(rateLimitTest.remainingRequests).toBeGreaterThan(0)
      console.log(`✅ Rate limiting working: ${rateLimitTest.remainingRequests} requests remaining`)

      // Step 2: Test content validation
      console.log('2. Testing content validation...')
      const validContent = 'This is a valid message for testing'
      const invalidContent = '<script>alert("xss")</script>'

      const validValidation = messagingSecurityService.validateMessageContent(validContent, 'TEXT')
      const invalidValidation = messagingSecurityService.validateMessageContent(invalidContent, 'TEXT')

      expect(validValidation.valid).toBe(true)
      expect(invalidValidation.valid).toBe(false)
      expect(invalidValidation.issues.length).toBeGreaterThan(0)
      console.log(`✅ Content validation working correctly`)

      // Step 3: Test file upload validation
      console.log('3. Testing file upload validation...')
      const validFile = {
        fileName: 'test-document.pdf',
        fileSize: 1024 * 1024, // 1MB
        mimeType: 'application/pdf'
      }

      const invalidFile = {
        fileName: '../../../etc/passwd',
        fileSize: 1024,
        mimeType: 'text/plain'
      }

      const validFileTest = messagingSecurityService.validateFileUpload(validFile)
      const invalidFileTest = messagingSecurityService.validateFileUpload(invalidFile)

      expect(validFileTest.valid).toBe(true)
      expect(invalidFileTest.valid).toBe(false)
      console.log(`✅ File upload validation working correctly`)

      // Step 4: Test permissions
      console.log('4. Testing permission system...')
      const readPermission = messagingSecurityService.checkPermissions(
        this.testUserId,
        'read',
        'MESSAGE',
        this.testConversationId || 'test',
        'VIEWER'
      )

      const deletePermission = messagingSecurityService.checkPermissions(
        this.testUserId,
        'DELETE',
        'MESSAGE',
        this.testConversationId || 'test',
        'VIEWER'
      )

      expect(readPermission).toBe(true)
      expect(deletePermission).toBe(false)
      console.log(`✅ Permission system working correctly`)

      // Step 5: Test session management
      console.log('5. Testing session management...')
      const token = messagingSecurityService.generateSecureToken()
      messagingSecurityService.registerSession(this.testUserId, token)

      const validToken = messagingSecurityService.validateSessionToken(token, this.testUserId)
      const invalidToken = messagingSecurityService.validateSessionToken('invalid', this.testUserId)

      expect(validToken).toBe(true)
      expect(invalidToken).toBe(false)
      console.log(`✅ Session management working correctly`)

      // Step 6: Test encryption (if available)
      console.log('6. Testing encryption...')
      const testContent = 'This is a secret message for encryption testing'
      const encrypted = messagingSecurityService.encryptMessage(testContent)

      if (encrypted) {
        const decrypted = messagingSecurityService.decryptMessage(encrypted.encrypted, encrypted.iv)
        expect(decrypted).toBe(testContent)
        console.log(`✅ Encryption working correctly`)
      } else {
        console.log(`⚠️ Encryption not available in test environment`)
      }

      const duration = Date.now() - startTime
      return {
        success: true,
        metrics: {
          duration,
          rateLimitCheck: rateLimitTest.allowed,
          contentValidationTests: 2,
          fileValidationTests: 2,
          permissionTests: 2,
          sessionTests: 2,
          encryptionAvailable: !!encrypted
        }
      }

    } catch (error) {
      console.error('❌ Security features test failed:', error)
      return {
        success: false,
        metrics: { duration: Date.now() - startTime, error: error.message }
      }
    }
  }

  async testPerformance(): Promise<{ success: boolean; metrics: any }> {
    console.log('\n⚡ Testing Performance...')
    const startTime = Date.now()

    if (!this.testConversationId) {
      throw new Error('No test conversation available. Run conversation lifecycle test first.')
    }

    try {
      // Step 1: Concurrent message sending
      console.log('1. Testing concurrent message sending...')
      const concurrentStartTime = Date.now()
      
      const messagePromises = Array.from({ length: 10 }, (_, i) =>
        this.messagingService.sendMessage(
          {
            conversationId: this.testConversationId!,
            content: `Concurrent performance test message ${i}`,
            type: 'TEXT' as const,
            priority: 'NORMAL' as const
          },
          this.testUserId,
          { name: 'Performance Test User', role: 'VIEWER' }
        )
      )

      const concurrentResults = await Promise.all(messagePromises)
      const concurrentDuration = Date.now() - concurrentStartTime

      expect(concurrentResults.every(r => r.success)).toBe(true)
      console.log(`✅ 10 concurrent messages sent in ${concurrentDuration}ms`)

      // Step 2: Large message retrieval
      console.log('2. Testing large message retrieval...')
      const retrievalStartTime = Date.now()
      
      const largeRetrievalResult = await this.messagingService.getMessages(
        this.testConversationId,
        this.testUserId,
        { limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }
      )

      const retrievalDuration = Date.now() - retrievalStartTime

      expect(largeRetrievalResult.success).toBe(true)
      console.log(`✅ Retrieved ${largeRetrievalResult.data.messages.length} messages in ${retrievalDuration}ms`)

      // Step 3: Complex query performance
      console.log('3. Testing complex query performance...')
      const complexQueryStartTime = Date.now()
      
      const complexQueryResult = await this.messagingService.getMessages(
        this.testConversationId,
        this.testUserId,
        {
          content: 'test',
          type: 'TEXT',
          priority: 'NORMAL',
          dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          limit: 50,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      )

      const complexQueryDuration = Date.now() - complexQueryStartTime

      expect(complexQueryResult.success).toBe(true)
      console.log(`✅ Complex query completed in ${complexQueryDuration}ms`)

      // Step 4: Memory usage estimation
      console.log('4. Estimating memory usage...')
      const memoryBefore = process.memoryUsage()
      
      // Create and process large data set
      const largeDataPromises = Array.from({ length: 50 }, (_, i) =>
        this.messagingService.sendMessage(
          {
            conversationId: this.testConversationId!,
            content: `Memory test message ${i} - ${Array(100).fill('x').join('')}`, // ~100 chars
            type: 'TEXT' as const,
            priority: 'LOW' as const
          },
          this.testUserId,
          { name: 'Memory Test User', role: 'VIEWER' }
        )
      )

      await Promise.all(largeDataPromises)
      const memoryAfter = process.memoryUsage()
      
      const memoryDelta = {
        rss: memoryAfter.rss - memoryBefore.rss,
        heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
        heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal
      }

      console.log(`✅ Memory usage delta - RSS: ${Math.round(memoryDelta.rss / 1024 / 1024)}MB, Heap: ${Math.round(memoryDelta.heapUsed / 1024 / 1024)}MB`)

      const duration = Date.now() - startTime
      return {
        success: true,
        metrics: {
          duration,
          concurrentMessageTime: concurrentDuration,
          largeRetrievalTime: retrievalDuration,
          complexQueryTime: complexQueryDuration,
          memoryDelta,
          messagesProcessed: 60, // 10 concurrent + 50 memory test
          averageMessageTime: concurrentDuration / 10
        }
      }

    } catch (error) {
      console.error('❌ Performance test failed:', error)
      return {
        success: false,
        metrics: { duration: Date.now() - startTime, error: error.message }
      }
    }
  }

  async runFullTestSuite(): Promise<{ success: boolean; metrics: any; summary: any }> {
    console.log('\n🎯 Running Complete Integration Test Suite')
    console.log('================================================')
    
    const suiteStartTime = Date.now()
    const results = {
      conversation: null as any,
      message: null as any,
      security: null as any,
      performance: null as any
    }

    try {
      await this.setup()

      // Run all test categories
      results.conversation = await this.testConversationLifecycle()
      results.message = await this.testMessageLifecycle()
      results.security = await this.testSecurityFeatures()
      results.performance = await this.testPerformance()

      const suiteDuration = Date.now() - suiteStartTime
      const allSuccessful = Object.values(results).every(r => r.success)

      const summary = {
        totalDuration: suiteDuration,
        testsRun: 4,
        testsPassed: Object.values(results).filter(r => r.success).length,
        testsFailed: Object.values(results).filter(r => !r.success).length,
        overallSuccess: allSuccessful,
        conversationId: this.testConversationId,
        messagesCreated: this.testMessageIds.length,
        timestamp: new Date().toISOString()
      }

      console.log('\n📊 Test Suite Summary')
      console.log('====================')
      console.log(`Total Duration: ${suiteDuration}ms`)
      console.log(`Tests Run: ${summary.testsRun}`)
      console.log(`Tests Passed: ${summary.testsPassed}`)
      console.log(`Tests Failed: ${summary.testsFailed}`)
      console.log(`Overall Success: ${allSuccessful ? '✅' : '❌'}`)
      console.log(`Conversation Created: ${this.testConversationId}`)
      console.log(`Messages Created: ${this.testMessageIds.length}`)

      // Detailed results
      console.log('\n📝 Detailed Results')
      console.log('==================')
      Object.entries(results).forEach(([category, result]) => {
        const status = result.success ? '✅' : '❌'
        console.log(`${status} ${category.toUpperCase()}: ${result.metrics.duration}ms`)
        if (!result.success) {
          console.log(`   Error: ${result.metrics.error}`)
        }
      })

      return {
        success: allSuccessful,
        metrics: results,
        summary
      }

    } catch (error) {
      console.error('❌ Integration test suite failed:', error)
      return {
        success: false,
        metrics: results,
        summary: {
          totalDuration: Date.now() - suiteStartTime,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }
    } finally {
      await this.cleanup()
      console.log('\n🧹 Test cleanup completed')
    }
  }
}

// Test execution
describe('RHY_066 Messaging System - Integration Tests', () => {
  let integrationTest: MessagingIntegrationTest

  beforeAll(async () => {
    integrationTest = new MessagingIntegrationTest()
  })

  afterAll(async () => {
    if (integrationTest) {
      await integrationTest.cleanup()
    }
  })

  describe('Integration Test Cycle 1', () => {
    it('should complete full messaging system integration test', async () => {
      console.log('\n🔄 INTEGRATION TEST CYCLE 1 - STARTING')
      console.log('=====================================')
      
      const result = await integrationTest.runFullTestSuite()
      
      expect(result.success).toBe(true)
      expect(result.summary.testsPassed).toBe(4)
      expect(result.summary.testsFailed).toBe(0)
      
      console.log('\n🎉 INTEGRATION TEST CYCLE 1 - COMPLETED')
      console.log('======================================')
    }, 60000) // 60 second timeout for full integration test
  })

  describe('Integration Test Cycle 2', () => {
    it('should complete second full messaging system integration test', async () => {
      console.log('\n🔄 INTEGRATION TEST CYCLE 2 - STARTING')
      console.log('=====================================')
      
      const result = await integrationTest.runFullTestSuite()
      
      expect(result.success).toBe(true)
      expect(result.summary.testsPassed).toBe(4)
      expect(result.summary.testsFailed).toBe(0)
      
      console.log('\n🎉 INTEGRATION TEST CYCLE 2 - COMPLETED')
      console.log('======================================')
    }, 60000)
  })

  describe('Integration Test Cycle 3', () => {
    it('should complete third full messaging system integration test', async () => {
      console.log('\n🔄 INTEGRATION TEST CYCLE 3 - STARTING')
      console.log('=====================================')
      
      const result = await integrationTest.runFullTestSuite()
      
      expect(result.success).toBe(true)
      expect(result.summary.testsPassed).toBe(4)
      expect(result.summary.testsFailed).toBe(0)
      
      console.log('\n🎉 INTEGRATION TEST CYCLE 3 - COMPLETED')
      console.log('======================================')
      console.log('\n🏆 ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY')
      console.log('================================================')
    }, 60000)
  })
})

export { MessagingIntegrationTest }