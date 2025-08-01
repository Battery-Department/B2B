class ClaudeIntegration {
  initialize() {
    console.log('Claude integration initialized')
  }

  async sendMessage(message: string, context?: string): Promise<string> {
    try {
      // Gather customer data from localStorage
      const customerData = this.gatherCustomerData()
      
      // Call the API route instead of using the SDK directly
      const response = await fetch('/api/chat/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          customerData
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      return data.content
    } catch (error) {
      console.error('Error calling Claude API:', error)
      
      // Fallback to mock response on error
      return this.getMockResponse(message)
    }
  }

  private gatherCustomerData(): any {
    try {
      // Get customer user data
      const userStr = localStorage.getItem('customerUser')
      const user = userStr ? JSON.parse(userStr) : null

      // Get invoices (orders)
      const invoicesStr = localStorage.getItem('batteryInvoices')
      const invoices = invoicesStr ? JSON.parse(invoicesStr) : []

      // Get current cart
      const cartStr = localStorage.getItem('batteryCart') || sessionStorage.getItem('batteryCart')
      const cart = cartStr ? JSON.parse(cartStr) : null

      // Get support tickets
      const ticketsStr = localStorage.getItem('supportTickets')
      const tickets = ticketsStr ? JSON.parse(ticketsStr) : []

      // Calculate cart summary
      let cartSummary = null
      if (cart && cart.items) {
        const totalItems = Object.values(cart.items as Record<string, number>).reduce((sum: number, qty: any) => sum + qty, 0)
        cartSummary = {
          totalItems,
          total: cart.total || 0,
          discount: cart.discount || 0,
          discountPercentage: cart.discountPercentage || 0
        }
      }

      // Transform invoices to order format with more details
      const orders = invoices.map((invoice: any) => {
        const items = invoice.items || []
        const itemsSummary = items.map((item: any) => `${item.quantity}x ${item.name}`).join(', ')
        
        return {
          id: invoice.id,
          date: new Date(invoice.date).toLocaleDateString(),
          status: invoice.status || 'paid',
          total: invoice.total,
          itemCount: items.length,
          items: itemsSummary,
          shipping: invoice.shipping || 0,
          discount: invoice.discount || 0
        }
      }).slice(0, 5) // Last 5 orders

      // Get open tickets
      const openTickets = tickets.filter((t: any) => t.status !== 'resolved' && t.status !== 'closed')

      return {
        name: user?.name || 'Guest User',
        email: user?.email,
        type: user?.type || 'individual',
        company: user?.company,
        orders,
        cart: cartSummary,
        tickets: openTickets,
        hasAccount: !!user
      }
    } catch (error) {
      console.error('Error gathering customer data:', error)
      return null
    }
  }

  private getMockResponse(message: string): string {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Hello! I\'m Lithi, your battery assistant. How can I help you today?'
    } else if (lowerMessage.includes('battery') || lowerMessage.includes('batteries')) {
      return 'I can help you find the perfect battery solution. Are you looking for batteries for electric vehicles, energy storage systems, or other applications?'
    } else if (lowerMessage.includes('order') || lowerMessage.includes('buy')) {
      return 'I\'d be happy to help you place an order. What type of batteries are you interested in? We have solutions for EVs, energy storage, and more.'
    } else if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return 'Our pricing varies based on battery type and quantity. Could you provide more details about your specific needs so I can give you accurate pricing?'
    } else if (lowerMessage.includes('help')) {
      return 'I\'m here to assist you with:\n- Finding the right battery solution\n- Placing orders\n- Tracking existing orders\n- Technical specifications\n- Pricing information\n\nWhat would you like help with?'
    } else if (lowerMessage.includes('track') || lowerMessage.includes('status')) {
      return 'To track your order, please provide your order number or I can show you a list of your recent orders.'
    } else if (lowerMessage.includes('technical') || lowerMessage.includes('specs')) {
      return 'I can provide detailed technical specifications for our battery products. Which product line are you interested in?'
    }
    
    return 'I\'m here to help with your battery needs. Could you please provide more details about what you\'re looking for?'
  }
}

export const claudeIntegration = new ClaudeIntegration()