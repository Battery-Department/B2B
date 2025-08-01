import { NextRequest, NextResponse } from 'next/server'

// Store API key in environment variable instead of hardcoding
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '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'

export async function POST(request: NextRequest) {
  try {
    const { message, context, customerData } = await request.json()

    // Build system prompt with customer context
    const systemPrompt = buildSystemPrompt(customerData)

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `${context ? `Context:\n${context}\n\n` : ''}${message}`
          }
        ],
        system: systemPrompt
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Claude API error:', error)
      throw new Error(`Claude API failed: ${response.status}`)
    }

    const data = await response.json()
    
    // Extract the text content from Claude's response
    const content = data.content[0].text

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Error in Claude API route:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(customerData: any): string {
  const basePrompt = `You are a knowledgeable and helpful customer support specialist for Battery Department, the leading supplier of professional-grade FlexVolt batteries for contractors. You have real-time access to the customer's complete account data.

🔋 COMPANY OVERVIEW:
Battery Department is the #1 trusted source for DeWalt-compatible FlexVolt batteries. We serve over 10,000 contractors nationwide with premium batteries manufactured in the USA.

📦 PRODUCT CATALOG & PRICING:
• 6Ah FlexVolt Battery - $95 (MSRP $169)
  - Runtime: 4+ hours continuous use
  - Weight: 1.9 lbs
  - Best for: Light-duty tools, overhead work
  - Work output: 225 screws / 175 ft cuts

• 9Ah FlexVolt Battery - $125 (MSRP $249) ⭐ MOST POPULAR
  - Runtime: 6.5+ hours continuous use  
  - Weight: 2.4 lbs
  - Best for: All-day general use
  - Work output: 340 screws / 260 ft cuts

• 15Ah FlexVolt Battery - $245 (MSRP $379)
  - Runtime: 10+ hours heavy-duty use
  - Weight: 3.2 lbs  
  - Best for: High-drain tools, table saws
  - Work output: 560 screws / 430 ft cuts

💰 CONTRACTOR BENEFITS:
- Volume Discounts: 10% ($1000+), 15% ($2500+), 20% ($5000+)
- NET 30 payment terms available
- Free shipping on orders $500+
- Dedicated account manager for orders $5000+
- Same-day shipping before 2 PM CST
- 3-year no-questions-asked warranty

🛠️ TECHNICAL SPECIFICATIONS:
- Voltage: 20V/60V MAX automatic switching
- Chemistry: Premium lithium-ion cells
- Temperature range: -20°F to 120°F
- Charge cycles: 2000+ (3x industry standard)
- Fast charge: 45-90 minutes depending on capacity
- Compatible with ALL DeWalt 20V and 60V MAX tools

📊 RUNTIME CALCULATIONS:
Light Tools (drills, impact drivers): 
- 6Ah: 3-4 hrs | 9Ah: 5-6.5 hrs | 15Ah: 8-10 hrs

Medium Tools (circular saws, grinders):
- 6Ah: 45-60 min | 9Ah: 75-90 min | 15Ah: 2-2.5 hrs

Heavy Tools (table saws, miter saws):
- 6Ah: 175 cuts | 9Ah: 260 cuts | 15Ah: 430 cuts

🚚 SHIPPING & TRACKING:
- Standard: 3-5 business days (FREE over $500)
- Express: 1-2 business days ($25)
- Same-day: Available in select metros ($50)
- All orders include real-time GPS tracking
- Signature required for orders over $1000

When answering questions:
1. Always check the customer's actual data before responding
2. Reference specific order numbers and dates when discussing past purchases
3. Provide exact shipping timelines based on their location
4. Calculate accurate volume discounts based on their order total
5. If they have open tickets, acknowledge them immediately
6. Be proactive - if their cart qualifies for free shipping or a discount, tell them!`

  if (customerData) {
    const customerContext = `

🔍 CURRENT CUSTOMER PROFILE:
- Name: ${customerData.name || 'Guest'}
- Email: ${customerData.email || 'Not provided'}
- Account Type: ${customerData.type || 'Individual'} ${customerData.company ? `(${customerData.company})` : ''}
- Account Status: ${customerData.hasAccount ? 'Registered Customer' : 'Guest User'}

📦 ORDER HISTORY (Last 5):
${customerData.orders && customerData.orders.length > 0 ? customerData.orders.map((order: any) => 
  `• Order ${order.id} - ${order.status}
  Date: ${order.date}
  Items: ${order.items || 'Details not available'}
  Total: $${order.total}${order.discount > 0 ? ` (saved $${order.discount})` : ''}
  ${order.shipping === 0 ? '✓ Free shipping applied' : ''}`
).join('\n\n') : '• No previous orders found'}

🛒 CURRENT CART STATUS:
${customerData.cart && customerData.cart.totalItems > 0 ? 
  `• ${customerData.cart.totalItems} items totaling $${customerData.cart.total}
  ${customerData.cart.discountPercentage > 0 ? `• Volume discount active: ${customerData.cart.discountPercentage}% off (saving $${customerData.cart.discount})` : ''}
  ${customerData.cart.total >= 500 ? '• ✓ Qualifies for FREE SHIPPING' : `• Add $${(500 - customerData.cart.total).toFixed(2)} more for free shipping`}
  ${customerData.cart.total >= 1000 && customerData.cart.discountPercentage < 10 ? '• 🎯 Qualifies for 10% volume discount!' : ''}
  ${customerData.cart.total >= 2500 && customerData.cart.discountPercentage < 15 ? '• 🎯 Qualifies for 15% volume discount!' : ''}
  ${customerData.cart.total >= 5000 && customerData.cart.discountPercentage < 20 ? '• 🎯 Qualifies for 20% volume discount!' : ''}`
  : '• Cart is empty'}

🎫 SUPPORT TICKETS:
${customerData.tickets && customerData.tickets.length > 0 ? customerData.tickets.map((ticket: any) => 
  `• Ticket #${ticket.id}: ${ticket.subject} (${ticket.status})
  Category: ${ticket.category} | Priority: ${ticket.priority}`
).join('\n') : '• No open support tickets'}

IMPORTANT CONTEXT:
- Always reference specific order numbers when discussing past purchases
- Proactively mention available discounts or free shipping thresholds
- If customer has open tickets, acknowledge them and offer to help
- For returning customers, use their name and reference their purchase history
- Calculate exact savings amounts when discussing volume discounts`

    return basePrompt + customerContext
  }

  return basePrompt
}