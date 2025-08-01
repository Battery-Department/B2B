/**
 * Lithi Integration Service
 * Simplified version - Connects the Lithi chatbot with the dashboard system
 */

import { claudeIntegration } from './claude-integration'

interface ChatContext {
  userId?: string
  sessionId?: string
  customerData?: any
  orderHistory?: any[]
  currentPage?: string
  metadata?: Record<string, any>
}

export class LithiIntegration {
  private isInitialized = false
  private chatContext: ChatContext = {}

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    // Initialize Claude integration
    claudeIntegration.initialize()
    
    // Initialize chat context
    await this.initializeChatContext()
    
    this.isInitialized = true
    console.log('Lithi integration initialized')
  }

  private async initializeChatContext(): Promise<void> {
    // Initialize with basic context
    this.chatContext = {
      sessionId: this.generateSessionId()
    }
  }

  // Send message to chatbot
  async sendChatMessage(
    message: string,
    role: 'user' | 'system' = 'user',
    metadata?: any
  ): Promise<string> {
    if (!this.chatContext.sessionId) {
      this.chatContext.sessionId = this.generateSessionId()
    }

    try {
      // Create context for Claude
      const context = this.buildChatContext()
      
      // Use Claude integration to get response
      const responseContent = await claudeIntegration.sendMessage(message, context)

      return responseContent
    } catch (error) {
      console.error('Error sending chat message:', error)
      return 'I apologize, but I\'m having trouble connecting. Please try again in a moment.'
    }
  }
  
  // Build context string for Claude
  private buildChatContext(): string {
    const contextParts = []
    
    if (this.chatContext.userId) {
      contextParts.push(`User ID: ${this.chatContext.userId}`)
    }
    
    if (this.chatContext.customerData) {
      contextParts.push(`Customer: ${JSON.stringify(this.chatContext.customerData)}`)
    }
    
    if (this.chatContext.currentPage) {
      contextParts.push(`Current Page: ${this.chatContext.currentPage}`)
    }
    
    return contextParts.join('\n')
  }

  // Update chat context
  updateChatContext(updates: Partial<ChatContext>): void {
    this.chatContext = {
      ...this.chatContext,
      ...updates
    }
  }

  // Get chat context
  getChatContext(): ChatContext {
    return this.chatContext
  }

  // Generate session ID
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Check if chatbot is available
  async isChatbotAvailable(): Promise<boolean> {
    return true // Simplified - always available
  }

  // Get chat history
  async getChatHistory(): Promise<any[]> {
    // Simplified - return empty history
    return []
  }
}

// Export singleton instance
export const lithiIntegration = new LithiIntegration()

// Initialize on import
if (typeof window !== 'undefined') {
  lithiIntegration.initialize().catch(console.error)
}