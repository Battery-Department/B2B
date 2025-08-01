import sgMail from '@sendgrid/mail'

interface OrderConfirmationData {
  id: string
  customer: {
    name?: string | null
    email: string
  }
  orderItems: Array<{
    quantity: number
    price: any
    product: {
      name: string
      sku: string
    }
  }>
  subtotal: any
  discount: any
  tax: any
  shipping: any
  total: any
  shippingAddress: any
  createdAt: Date
}

export class EmailService {
  constructor() {
    // Initialize SendGrid if API key is available
    const apiKey = process.env.SENDGRID_API_KEY
    if (apiKey) {
      sgMail.setApiKey(apiKey)
    }
  }

  async sendOrderConfirmation(order: OrderConfirmationData): Promise<void> {
    try {
      const customerName = order.customer.name || 'Valued Customer'
      const orderDate = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'long',
        timeStyle: 'short'
      }).format(order.createdAt)

      const itemsHtml = order.orderItems.map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">
            ${item.product.name} (${item.product.sku})
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: right;">
            $${(item.price * item.quantity).toFixed(2)}
          </td>
        </tr>
      `).join('')

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation - Lithi Battery Department</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F8FAFC;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white;">
            <!-- Header -->
            <div style="background: linear-gradient(to right, #006FEE, #0050B3); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmation</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Thank you for your purchase!</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 20px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${customerName},
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                We're excited to confirm that we've received your order. Your FlexVolt batteries will be on their way soon!
              </p>
              
              <!-- Order Details -->
              <div style="background-color: #F9FAFB; border: 2px solid #E6F4FF; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <h2 style="color: #111827; font-size: 20px; margin: 0 0 15px 0;">Order Details</h2>
                <p style="color: #6B7280; margin: 5px 0;"><strong>Order Number:</strong> ${order.id}</p>
                <p style="color: #6B7280; margin: 5px 0;"><strong>Order Date:</strong> ${orderDate}</p>
              </div>
              
              <!-- Items Table -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                  <tr style="background-color: #F9FAFB;">
                    <th style="padding: 10px; text-align: left; color: #374151; font-weight: 600;">Item</th>
                    <th style="padding: 10px; text-align: center; color: #374151; font-weight: 600;">Qty</th>
                    <th style="padding: 10px; text-align: right; color: #374151; font-weight: 600;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <!-- Totals -->
              <div style="border-top: 2px solid #E5E7EB; padding-top: 20px; margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #6B7280;">Subtotal:</span>
                  <span style="color: #374151;">$${order.subtotal.toFixed(2)}</span>
                </div>
                ${order.discount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #10B981;">Volume Discount:</span>
                  <span style="color: #10B981;">-$${order.discount.toFixed(2)}</span>
                </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #6B7280;">Tax:</span>
                  <span style="color: #374151;">$${order.tax.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #6B7280;">Shipping:</span>
                  <span style="color: #374151;">${order.shipping === 0 ? 'FREE' : `$${order.shipping.toFixed(2)}`}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px solid #E5E7EB;">
                  <span style="color: #111827; font-weight: 600; font-size: 18px;">Total:</span>
                  <span style="color: #006FEE; font-weight: 600; font-size: 18px;">$${order.total.toFixed(2)}</span>
                </div>
              </div>
              
              <!-- Shipping Address -->
              <div style="background-color: #F9FAFB; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <h3 style="color: #111827; font-size: 16px; margin: 0 0 10px 0;">Shipping Address</h3>
                <p style="color: #6B7280; margin: 5px 0; line-height: 1.5;">
                  ${order.shippingAddress.name}<br>
                  ${order.shippingAddress.street}<br>
                  ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}<br>
                  ${order.shippingAddress.country || 'USA'}
                </p>
              </div>
              
              <!-- Next Steps -->
              <div style="background-color: #E6F4FF; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <h3 style="color: #0050B3; font-size: 16px; margin: 0 0 10px 0;">What's Next?</h3>
                <ul style="color: #374151; margin: 0; padding-left: 20px; line-height: 1.6;">
                  <li>You'll receive a shipping confirmation email once your order ships</li>
                  <li>Track your package using the tracking number provided</li>
                  <li>Your batteries will arrive within 3-5 business days</li>
                </ul>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${process.env.NEXT_PUBLIC_URL}/customer/orders/${order.id}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #006FEE; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  View Order Status
                </a>
              </div>
              
              <!-- Contact Info -->
              <p style="color: #6B7280; font-size: 14px; line-height: 1.6; text-align: center;">
                Questions? Contact our support team at<br>
                <a href="mailto:support@lithipower.com" style="color: #006FEE; text-decoration: none;">support@lithipower.com</a> or call 1-800-BATTERY
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #F9FAFB; padding: 30px 20px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 12px; margin: 0 0 10px 0;">
                © 2025 Lithi Battery Department. All rights reserved.
              </p>
              <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                1234 Battery Lane, Power City, PC 12345
              </p>
            </div>
          </div>
        </body>
        </html>
      `

      const msg = {
        to: order.customer.email,
        from: process.env.SENDGRID_FROM_EMAIL || 'orders@lithipower.com',
        subject: `Order Confirmation - #${order.id}`,
        html: emailHtml,
        text: this.generatePlainTextEmail(order, customerName, orderDate)
      }

      if (process.env.SENDGRID_API_KEY) {
        await sgMail.send(msg)
        console.log(`Order confirmation email sent to ${order.customer.email}`)
      } else {
        // In development, just log the email
        console.log('Email would be sent:', {
          to: msg.to,
          subject: msg.subject,
          preview: 'Order confirmation for ' + order.id
        })
      }
    } catch (error) {
      console.error('Error sending order confirmation email:', error)
      // Don't throw - we don't want email failures to break the checkout flow
    }
  }

  private generatePlainTextEmail(
    order: OrderConfirmationData, 
    customerName: string, 
    orderDate: string
  ): string {
    const items = order.orderItems.map(item => 
      `- ${item.product.name} (${item.product.sku}) x${item.quantity}: $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n')

    return `
Order Confirmation - Lithi Battery Department

Hi ${customerName},

Thank you for your order! We're excited to confirm that we've received your purchase.

Order Details:
--------------
Order Number: ${order.id}
Order Date: ${orderDate}

Items:
${items}

Order Summary:
Subtotal: $${order.subtotal.toFixed(2)}
${order.discount > 0 ? `Volume Discount: -$${order.discount.toFixed(2)}` : ''}
Tax: $${order.tax.toFixed(2)}
Shipping: ${order.shipping === 0 ? 'FREE' : `$${order.shipping.toFixed(2)}`}
Total: $${order.total.toFixed(2)}

Shipping Address:
${order.shippingAddress.name}
${order.shippingAddress.street}
${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}

What's Next?
- You'll receive a shipping confirmation email once your order ships
- Track your package using the tracking number provided
- Your batteries will arrive within 3-5 business days

Questions? Contact our support team at support@lithipower.com or call 1-800-BATTERY

Thank you for choosing Lithi Battery Department!

© 2025 Lithi Battery Department. All rights reserved.
    `.trim()
  }

  async sendShippingNotification(order: any, trackingNumber: string): Promise<void> {
    // Implementation for shipping notification
    console.log(`Shipping notification would be sent for order ${order.id} with tracking ${trackingNumber}`)
  }

  async sendAbandonedCartReminder(email: string, cartItems: any[]): Promise<void> {
    // Implementation for abandoned cart reminders
    console.log(`Abandoned cart reminder would be sent to ${email}`)
  }
}

// Export singleton instance
export const emailService = new EmailService()