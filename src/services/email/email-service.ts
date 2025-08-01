import sgMail from '@sendgrid/mail'
import { PrismaClient } from '@/generated/prisma'
import { serverAnalytics } from '@/lib/analytics/ga-measurement-protocol'

const prisma = new PrismaClient()

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export class EmailService {
  private fromEmail: string
  private fromName: string

  constructor() {
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@batterydepartment.com'
    this.fromName = 'Battery Department'
  }

  // Cart abandonment email
  async sendCartAbandonmentEmail(data: {
    email: string
    name: string
    cartItems: any[]
    cartTotal: number
    abandonmentTime: Date
    sessionId: string
    userId?: string
  }) {
    const template = this.getCartAbandonmentTemplate(data)
    
    const msg = {
      to: data.email,
      from: {
        email: this.fromEmail,
        name: this.fromName
      },
      subject: template.subject,
      html: template.html,
      text: template.text,
      trackingSettings: {
        clickTracking: {
          enable: true,
          enableText: true
        },
        openTracking: {
          enable: true
        }
      },
      customArgs: {
        campaign_id: 'cart_abandonment',
        user_id: data.userId || '',
        session_id: data.sessionId
      }
    }

    try {
      await sgMail.send(msg)
      
      // Track email sent
      await serverAnalytics.trackEmail('sent', {
        campaign_id: 'cart_abandonment',
        campaign_name: 'Cart Abandonment Recovery',
        email_type: 'transactional',
        recipient_id: data.userId
      })

      // Log to database
      await this.logEmailSent({
        recipient: data.email,
        type: 'cart_abandonment',
        subject: template.subject,
        metadata: {
          cartTotal: data.cartTotal,
          itemCount: data.cartItems.length,
          sessionId: data.sessionId
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error sending cart abandonment email:', error)
      return { success: false, error }
    }
  }

  // Quote saved confirmation email
  async sendQuoteSavedEmail(data: {
    email: string
    name: string
    quoteId: string
    quoteTotal: number
    validUntil: Date
    items: any[]
    userId?: string
  }) {
    const template = this.getQuoteSavedTemplate(data)
    
    const msg = {
      to: data.email,
      from: {
        email: this.fromEmail,
        name: this.fromName
      },
      subject: template.subject,
      html: template.html,
      text: template.text,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      },
      customArgs: {
        campaign_id: 'quote_saved',
        quote_id: data.quoteId,
        user_id: data.userId || ''
      }
    }

    try {
      await sgMail.send(msg)
      
      await serverAnalytics.trackEmail('sent', {
        campaign_id: 'quote_saved',
        campaign_name: 'Quote Saved Confirmation',
        email_type: 'transactional',
        recipient_id: data.userId
      })

      await this.logEmailSent({
        recipient: data.email,
        type: 'quote_saved',
        subject: template.subject,
        metadata: {
          quoteId: data.quoteId,
          quoteTotal: data.quoteTotal,
          validUntil: data.validUntil
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error sending quote saved email:', error)
      return { success: false, error }
    }
  }

  // Order confirmation email
  async sendOrderConfirmationEmail(data: {
    email: string
    name: string
    orderId: string
    orderTotal: number
    items: any[]
    shippingAddress: any
    estimatedDelivery: Date
    userId?: string
  }) {
    const template = this.getOrderConfirmationTemplate(data)
    
    const msg = {
      to: data.email,
      from: {
        email: this.fromEmail,
        name: this.fromName
      },
      subject: template.subject,
      html: template.html,
      text: template.text,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      },
      customArgs: {
        campaign_id: 'order_confirmation',
        order_id: data.orderId,
        user_id: data.userId || ''
      }
    }

    try {
      await sgMail.send(msg)
      
      await serverAnalytics.trackEmail('sent', {
        campaign_id: 'order_confirmation',
        campaign_name: 'Order Confirmation',
        email_type: 'transactional',
        recipient_id: data.userId
      })

      await this.logEmailSent({
        recipient: data.email,
        type: 'order_confirmation',
        subject: template.subject,
        metadata: {
          orderId: data.orderId,
          orderTotal: data.orderTotal,
          itemCount: data.items.length
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error sending order confirmation email:', error)
      return { success: false, error }
    }
  }

  // Browse abandonment email
  async sendBrowseAbandonmentEmail(data: {
    email: string
    name: string
    viewedProducts: any[]
    lastViewedTime: Date
    sessionId: string
    userId?: string
  }) {
    const template = this.getBrowseAbandonmentTemplate(data)
    
    const msg = {
      to: data.email,
      from: {
        email: this.fromEmail,
        name: this.fromName
      },
      subject: template.subject,
      html: template.html,
      text: template.text,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      },
      customArgs: {
        campaign_id: 'browse_abandonment',
        session_id: data.sessionId,
        user_id: data.userId || ''
      }
    }

    try {
      await sgMail.send(msg)
      
      await serverAnalytics.trackEmail('sent', {
        campaign_id: 'browse_abandonment',
        campaign_name: 'Browse Abandonment Recovery',
        email_type: 'marketing',
        recipient_id: data.userId
      })

      await this.logEmailSent({
        recipient: data.email,
        type: 'browse_abandonment',
        subject: template.subject,
        metadata: {
          viewedProductCount: data.viewedProducts.length,
          sessionId: data.sessionId
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error sending browse abandonment email:', error)
      return { success: false, error }
    }
  }

  // Email templates
  private getCartAbandonmentTemplate(data: any): EmailTemplate {
    const itemsHtml = data.cartItems.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${item.name}</strong><br>
          <span style="color: #6b7280; font-size: 14px;">Quantity: ${item.quantity}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('')

    return {
      subject: `${data.name}, you left items in your cart`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Complete Your Order</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <!-- Header -->
              <div style="background-color: #2563eb; padding: 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0;">Battery Department</h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 32px;">
                <h2 style="color: #111827; margin-bottom: 16px;">Hi ${data.name},</h2>
                <p style="color: #374151; line-height: 1.6;">
                  You left some great items in your cart. Complete your order now and enjoy free shipping on orders over $500!
                </p>
                
                <!-- Cart Items -->
                <table style="width: 100%; margin: 24px 0; border-collapse: collapse;">
                  ${itemsHtml}
                  <tr>
                    <td style="padding: 16px; font-weight: bold;">Total</td>
                    <td style="padding: 16px; text-align: right; font-weight: bold; color: #2563eb;">
                      $${data.cartTotal.toFixed(2)}
                    </td>
                  </tr>
                </table>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/customer/cart?utm_source=email&utm_medium=cart_abandonment&utm_campaign=recovery"
                     style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Complete Your Order
                  </a>
                </div>
                
                <!-- Incentive -->
                <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 24px 0;">
                  <p style="color: #92400e; margin: 0; font-weight: bold;">
                    🎁 Special Offer: Use code SAVE10 for 10% off your order!
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 14px;">
                <p>© 2024 Battery Department. All rights reserved.</p>
                <p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe" style="color: #2563eb;">Unsubscribe</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `Hi ${data.name}, you left items in your cart. Complete your order at ${process.env.NEXT_PUBLIC_APP_URL}/customer/cart`
    }
  }

  private getQuoteSavedTemplate(data: any): EmailTemplate {
    const validDays = Math.ceil((new Date(data.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    
    return {
      subject: `Your quote ${data.quoteId} has been saved`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Quote Saved</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <div style="background-color: #10b981; padding: 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0;">Quote Saved Successfully</h1>
              </div>
              
              <div style="padding: 32px;">
                <h2 style="color: #111827;">Hi ${data.name},</h2>
                <p style="color: #374151; line-height: 1.6;">
                  Your quote has been saved and is valid for ${validDays} days.
                </p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0; color: #374151;"><strong>Quote ID:</strong> ${data.quoteId}</p>
                  <p style="margin: 8px 0; color: #374151;"><strong>Total:</strong> $${data.quoteTotal.toFixed(2)}</p>
                  <p style="margin: 8px 0; color: #374151;"><strong>Items:</strong> ${data.items.length}</p>
                  <p style="margin: 0; color: #374151;"><strong>Valid Until:</strong> ${new Date(data.validUntil).toLocaleDateString()}</p>
                </div>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/customer/payment?tab=saved-quotes&utm_source=email&utm_medium=quote_saved"
                     style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    View Your Quote
                  </a>
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    }
  }

  private getOrderConfirmationTemplate(data: any): EmailTemplate {
    return {
      subject: `Order Confirmation #${data.orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Order Confirmation</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto;">
              <h1>Thank you for your order!</h1>
              <p>Order Total: $${data.orderTotal.toFixed(2)}</p>
              <p>Estimated Delivery: ${new Date(data.estimatedDelivery).toLocaleDateString()}</p>
            </div>
          </body>
        </html>
      `
    }
  }

  private getBrowseAbandonmentTemplate(data: any): EmailTemplate {
    return {
      subject: `${data.name}, check out these batteries you viewed`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Products You Viewed</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto;">
              <h1>Items you recently viewed</h1>
              <p>We noticed you were checking out some batteries. They're still available!</p>
            </div>
          </body>
        </html>
      `
    }
  }

  // Log email sent to database
  private async logEmailSent(data: {
    recipient: string
    type: string
    subject: string
    metadata?: any
  }) {
    try {
      await prisma.notification.create({
        data: {
          userId: data.metadata?.userId,
          type: 'email',
          title: data.subject,
          message: `Email sent to ${data.recipient}`,
          channel: 'email',
          priority: 'medium',
          metadata: {
            emailType: data.type,
            recipient: data.recipient,
            ...data.metadata
          }
        }
      })
    } catch (error) {
      console.error('Error logging email:', error)
    }
  }
}

export const emailService = new EmailService()