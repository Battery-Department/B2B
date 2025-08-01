export interface ChatContext {
  userId?: string
  sessionId?: string
  previousMessages?: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
  userPreferences?: Record<string, any>
}

export interface ChatResponse {
  response: string
  suggestedActions?: string[]
  confidence?: number
  metadata?: Record<string, any>
}

export interface ClaudeChatService {
  processMessage(message: string, context?: ChatContext): Promise<ChatResponse>
}

class MockClaudeChatService implements ClaudeChatService {
  async processMessage(message: string, context?: ChatContext): Promise<ChatResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
    
    const lowerMessage = message.toLowerCase()
    let response = ''
    let suggestedActions: string[] = []
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      response = 'Hello! I\'m your Lithi AI battery assistant. I can help you find the perfect FlexVolt battery solution for your needs. What would you like to know?'
      suggestedActions = [
        'Show me battery options',
        'Help me choose the right battery',
        'What are the price ranges?'
      ]
    } else if (lowerMessage.includes('flexvolt') || lowerMessage.includes('battery') || lowerMessage.includes('batteries')) {
      response = `Our FlexVolt batteries are 20V/60V MAX compatible and perfect for professional contractors:

**Available Options:**
• 6Ah FlexVolt - $95 (Great for lighter tools)
• 9Ah FlexVolt - $125 (Balanced power and runtime) 
• 15Ah FlexVolt - $245 (Maximum runtime for heavy-duty work)

All batteries feature intelligent power management and work with both 20V and 60V tools. Which capacity would work best for your applications?`
      
      suggestedActions = [
        'Compare all battery specs',
        'Calculate my needs',
        'Check volume discounts'
      ]
    } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('discount')) {
      response = `**FlexVolt Battery Pricing:**
• 6Ah - $95 each
• 9Ah - $125 each  
• 15Ah - $245 each

**Volume Discounts Available:**
• 10% off orders $1,000+ 
• 15% off orders $2,500+
• 20% off orders $5,000+

For fleet purchases or bulk orders, our volume discounts can provide significant savings. How many batteries are you looking to purchase?`
      
      suggestedActions = [
        'Calculate bulk pricing',
        'Start building my order',
        'Contact sales team'
      ]
    } else if (lowerMessage.includes('compare') || lowerMessage.includes('difference') || lowerMessage.includes('which')) {
      response = `**FlexVolt Battery Comparison:**

**6Ah ($95)** - Best for:
• Light to medium-duty tools
• Occasional professional use
• Weight-sensitive applications

**9Ah ($125)** - Best for:
• Most common professional applications
• Balanced power and weight
• All-day moderate use

**15Ah ($245)** - Best for:
• Heavy-duty professional tools
• Extended runtime requirements  
• High-power applications

All offer the same 20V/60V compatibility. The main differences are runtime and weight. What type of work will you primarily be doing?`
      
      suggestedActions = [
        'Help me choose',
        'See technical specs',
        'Add to cart'
      ]
    } else if (lowerMessage.includes('help') || lowerMessage.includes('choose') || lowerMessage.includes('recommend')) {
      response = `I'd be happy to help you choose the right FlexVolt battery! To give you the best recommendation, could you tell me:

1. What type of tools will you primarily use?
2. How long do you typically work between charging opportunities?
3. Is weight a major concern for your applications?
4. What's your budget range?

Based on your answers, I can recommend the perfect battery solution for your needs.`
      
      suggestedActions = [
        'Take the battery quiz',
        'Browse all products',
        'Speak with an expert'
      ]
    } else if (lowerMessage.includes('order') || lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
      response = `Ready to order your FlexVolt batteries? Here's how to get started:

1. **Choose your batteries** - Select the capacity that fits your needs
2. **Check quantities** - Remember our volume discounts start at $1,000
3. **Review your cart** - Make sure everything looks correct
4. **Secure checkout** - We accept all major payment methods

Would you like me to help you build your order, or do you have specific questions about the ordering process?`
      
      suggestedActions = [
        'Start my order',
        'View my cart',
        'Contact support'
      ]
    } else {
      response = `I'm here to help with your FlexVolt battery needs! I can assist with:

• **Product Selection** - Find the right battery for your tools
• **Pricing & Discounts** - Calculate costs including volume savings  
• **Technical Specs** - Compare features and compatibility
• **Order Assistance** - Help with purchasing and checkout

What would you like to know about our FlexVolt battery solutions?`
      
      suggestedActions = [
        'Show me all batteries',
        'Help me choose',
        'Get pricing info'
      ]
    }
    
    return {
      response,
      suggestedActions,
      confidence: 0.85 + Math.random() * 0.15,
      metadata: {
        processingTime: Math.floor(500 + Math.random() * 1000),
        model: 'claude-3-haiku',
        context: context ? 'with_context' : 'standalone'
      }
    }
  }
}

let chatServiceInstance: ClaudeChatService | null = null

export function getClaudeChatService(): ClaudeChatService {
  if (!chatServiceInstance) {
    // In a real implementation, this would check for API keys and create the appropriate service
    chatServiceInstance = new MockClaudeChatService()
  }
  return chatServiceInstance
}

export default getClaudeChatService