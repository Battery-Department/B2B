/**
 * RHY Supplier Portal - Order Email Templates
 * Enterprise-grade email templates for FlexVolt battery order communications
 * Supports multi-language, responsive design, and variable substitution
 */

import { format } from 'date-fns'
import { WAREHOUSES, FLEXVOLT_PRODUCTS } from '@/config/app'

interface TemplateVariables {
  // Order Information
  orderId: string
  orderTotal: number
  orderDate: Date
  estimatedDelivery?: Date
  trackingNumber?: string
  
  // Customer Information
  customerName: string
  customerEmail: string
  customerCompany?: string
  customerType: 'DIRECT' | 'DISTRIBUTOR' | 'FLEET' | 'SERVICE'
  
  // Supplier Information
  supplierName: string
  supplierEmail: string
  supplierPhone?: string
  
  // Product Information
  products: Array<{
    id: string
    name: string
    sku: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  
  // Warehouse Information
  warehouseId: string
  warehouseName: string
  warehouseAddress?: string
  
  // Message Content
  messageSubject: string
  messageContent: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL'
  
  // Additional Data
  metadata?: Record<string, any>
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  html: string
  text: string
  variables: string[]
  language: string
  category: 'ORDER_UPDATE' | 'DELIVERY' | 'PAYMENT' | 'SYSTEM' | 'MARKETING'
}

/**
 * Email Template Generator
 * Generates responsive, branded email templates with variable substitution
 */
export class OrderEmailTemplates {
  private readonly brandColors = {
    primary: '#006FEE',
    secondary: '#0050B3',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    text: '#111827',
    textSecondary: '#6B7280',
    background: '#F9FAFB',
    border: '#E5E7EB'
  }

  private readonly baseStyles = `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: ${this.brandColors.text};
      margin: 0;
      padding: 0;
      background-color: ${this.brandColors.background};
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: linear-gradient(to right, ${this.brandColors.primary}, ${this.brandColors.secondary});
      color: white;
      padding: 24px;
      text-align: center;
    }
    
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    
    .content {
      padding: 32px 24px;
    }
    
    .footer {
      background-color: ${this.brandColors.background};
      padding: 24px;
      text-align: center;
      font-size: 14px;
      color: ${this.brandColors.textSecondary};
      border-top: 1px solid ${this.brandColors.border};
    }
    
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: ${this.brandColors.primary};
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 16px 0;
      transition: background-color 0.3s ease;
    }
    
    .button:hover {
      background-color: ${this.brandColors.secondary};
    }
    
    .order-summary {
      background-color: ${this.brandColors.background};
      border: 1px solid ${this.brandColors.border};
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    
    .product-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid ${this.brandColors.border};
    }
    
    .product-row:last-child {
      border-bottom: none;
      font-weight: 600;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status-urgent {
      background-color: #FEF2F2;
      color: #DC2626;
    }
    
    .status-high {
      background-color: #FFFBEB;
      color: #D97706;
    }
    
    .status-normal {
      background-color: #EFF6FF;
      color: #2563EB;
    }
    
    .warehouse-info {
      background-color: #F0F9FF;
      border-left: 4px solid ${this.brandColors.primary};
      padding: 16px;
      margin: 16px 0;
    }
    
    .tracking-info {
      background-color: #F0FDF4;
      border: 1px solid #BBF7D0;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      text-align: center;
    }
    
    .tracking-number {
      font-family: monospace;
      font-size: 18px;
      font-weight: 700;
      color: ${this.brandColors.success};
      margin: 8px 0;
    }
    
    @media only screen and (max-width: 600px) {
      .container {
        margin: 0;
        border-radius: 0;
      }
      
      .content {
        padding: 24px 16px;
      }
      
      .product-row {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `

  /**
   * Generate order confirmation email
   */
  generateOrderConfirmation(variables: TemplateVariables): EmailTemplate {
    const warehouse = this.getWarehouseInfo(variables.warehouseId)
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation - RHY Supplier Portal</title>
          <style>${this.baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔋 Order Confirmation</h1>
              <p>Thank you for your FlexVolt battery order!</p>
            </div>
            
            <div class="content">
              <h2>Hello ${variables.customerName},</h2>
              
              <p>We've received your order and it's being processed at our ${warehouse.name} facility. Here are the details:</p>
              
              <div class="order-summary">
                <h3>Order #${variables.orderId}</h3>
                <p><strong>Order Date:</strong> ${format(variables.orderDate, 'MMMM d, yyyy')}</p>
                ${variables.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${format(variables.estimatedDelivery, 'MMMM d, yyyy')}</p>` : ''}
                
                <h4>Products Ordered:</h4>
                ${variables.products.map(product => `
                  <div class="product-row">
                    <div>
                      <strong>${product.name}</strong><br>
                      <small>SKU: ${product.sku} | Qty: ${product.quantity}</small>
                    </div>
                    <div>$${product.totalPrice.toFixed(2)}</div>
                  </div>
                `).join('')}
                
                <div class="product-row">
                  <div><strong>Total Amount</strong></div>
                  <div><strong>$${variables.orderTotal.toFixed(2)}</strong></div>
                </div>
              </div>
              
              <div class="warehouse-info">
                <h4>📍 Fulfillment Center</h4>
                <p><strong>${warehouse.name}</strong><br>
                ${warehouse.location}<br>
                Processing Hours: ${warehouse.businessHours.start} - ${warehouse.businessHours.end} ${warehouse.businessHours.timezone}</p>
              </div>
              
              <div style="text-align: center;">
                <a href="https://portal.rhy-supplier.com/orders/${variables.orderId}" class="button">
                  Track Your Order
                </a>
              </div>
              
              <p>You'll receive another email with tracking information once your order ships. If you have any questions, please don't hesitate to contact us.</p>
              
              <p>Best regards,<br>
              <strong>${variables.supplierName}</strong><br>
              RHY Supplier Portal Team</p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} RHY Supplier Portal. All rights reserved.</p>
              <p>This email was sent regarding order #${variables.orderId}</p>
              <p>Questions? Contact us at ${variables.supplierEmail}</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
Order Confirmation - RHY Supplier Portal

Hello ${variables.customerName},

Thank you for your FlexVolt battery order! We've received your order and it's being processed at our ${warehouse.name} facility.

Order Details:
- Order #: ${variables.orderId}
- Order Date: ${format(variables.orderDate, 'MMMM d, yyyy')}
${variables.estimatedDelivery ? `- Estimated Delivery: ${format(variables.estimatedDelivery, 'MMMM d, yyyy')}` : ''}

Products Ordered:
${variables.products.map(product => `- ${product.name} (${product.sku}) x${product.quantity}: $${product.totalPrice.toFixed(2)}`).join('\n')}

Total Amount: $${variables.orderTotal.toFixed(2)}

Fulfillment Center: ${warehouse.name}, ${warehouse.location}

Track your order: https://portal.rhy-supplier.com/orders/${variables.orderId}

You'll receive tracking information once your order ships.

Best regards,
${variables.supplierName}
RHY Supplier Portal Team

Questions? Contact us at ${variables.supplierEmail}
    `

    return {
      id: 'order_confirmation',
      name: 'Order Confirmation',
      subject: `Order Confirmation #${variables.orderId} - Your FlexVolt Battery Order`,
      html,
      text,
      variables: Object.keys(variables),
      language: 'en',
      category: 'ORDER_UPDATE'
    }
  }

  /**
   * Generate shipping notification email
   */
  generateShippingNotification(variables: TemplateVariables): EmailTemplate {
    const warehouse = this.getWarehouseInfo(variables.warehouseId)
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Order Has Shipped - RHY Supplier Portal</title>
          <style>${this.baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 Your Order Has Shipped!</h1>
              <p>Your FlexVolt batteries are on the way</p>
            </div>
            
            <div class="content">
              <h2>Great news, ${variables.customerName}!</h2>
              
              <p>Your order #${variables.orderId} has been shipped from our ${warehouse.name} facility and is on its way to you.</p>
              
              ${variables.trackingNumber ? `
                <div class="tracking-info">
                  <h3>📍 Track Your Package</h3>
                  <div class="tracking-number">${variables.trackingNumber}</div>
                  <p>Use this tracking number to monitor your shipment's progress</p>
                  <a href="https://tracking.example.com/${variables.trackingNumber}" class="button">
                    Track Package
                  </a>
                </div>
              ` : ''}
              
              <div class="order-summary">
                <h3>Shipment Details</h3>
                <p><strong>Order #:</strong> ${variables.orderId}</p>
                <p><strong>Shipped From:</strong> ${warehouse.name}</p>
                ${variables.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${format(variables.estimatedDelivery, 'EEEE, MMMM d, yyyy')}</p>` : ''}
                
                <h4>Items Shipped:</h4>
                ${variables.products.map(product => `
                  <div class="product-row">
                    <div>
                      <strong>${product.name}</strong><br>
                      <small>Quantity: ${product.quantity}</small>
                    </div>
                    <div>✅ Shipped</div>
                  </div>
                `).join('')}
              </div>
              
              <div class="warehouse-info">
                <h4>📞 Need Help?</h4>
                <p>If you have any questions about your shipment, please contact:</p>
                <p><strong>${variables.supplierName}</strong><br>
                Email: ${variables.supplierEmail}<br>
                ${variables.supplierPhone ? `Phone: ${variables.supplierPhone}` : ''}</p>
              </div>
              
              <p>Thank you for choosing RHY for your FlexVolt battery needs. We appreciate your business!</p>
              
              <p>Best regards,<br>
              <strong>${variables.supplierName}</strong><br>
              RHY Supplier Portal Team</p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} RHY Supplier Portal. All rights reserved.</p>
              <p>This email was sent regarding order #${variables.orderId}</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
Your Order Has Shipped! - RHY Supplier Portal

Great news, ${variables.customerName}!

Your order #${variables.orderId} has been shipped from our ${warehouse.name} facility.

${variables.trackingNumber ? `Tracking Number: ${variables.trackingNumber}` : ''}
${variables.estimatedDelivery ? `Estimated Delivery: ${format(variables.estimatedDelivery, 'EEEE, MMMM d, yyyy')}` : ''}

Items Shipped:
${variables.products.map(product => `- ${product.name} x${product.quantity}`).join('\n')}

${variables.trackingNumber ? `Track your package: https://tracking.example.com/${variables.trackingNumber}` : ''}

Need help? Contact ${variables.supplierName} at ${variables.supplierEmail}

Thank you for choosing RHY for your FlexVolt battery needs!

Best regards,
${variables.supplierName}
RHY Supplier Portal Team
    `

    return {
      id: 'shipping_notification',
      name: 'Shipping Notification',
      subject: `📦 Your Order #${variables.orderId} Has Shipped!`,
      html,
      text,
      variables: Object.keys(variables),
      language: 'en',
      category: 'DELIVERY'
    }
  }

  /**
   * Generate order update email
   */
  generateOrderUpdate(variables: TemplateVariables): EmailTemplate {
    const warehouse = this.getWarehouseInfo(variables.warehouseId)
    const priorityClass = this.getPriorityClass(variables.priority)
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Update - RHY Supplier Portal</title>
          <style>${this.baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📄 Order Update</h1>
              <span class="status-badge ${priorityClass}">${variables.priority} Priority</span>
            </div>
            
            <div class="content">
              <h2>Hello ${variables.customerName},</h2>
              
              <p>We have an update regarding your order #${variables.orderId}:</p>
              
              <div class="order-summary">
                <h3>${variables.messageSubject}</h3>
                <p>${variables.messageContent}</p>
              </div>
              
              <div class="order-summary">
                <h3>Order Information</h3>
                <p><strong>Order #:</strong> ${variables.orderId}</p>
                <p><strong>Order Date:</strong> ${format(variables.orderDate, 'MMMM d, yyyy')}</p>
                <p><strong>Processing at:</strong> ${warehouse.name}</p>
                ${variables.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${format(variables.estimatedDelivery, 'MMMM d, yyyy')}</p>` : ''}
                
                <h4>Order Contents:</h4>
                ${variables.products.map(product => `
                  <div class="product-row">
                    <div>
                      <strong>${product.name}</strong><br>
                      <small>Quantity: ${product.quantity}</small>
                    </div>
                    <div>$${product.totalPrice.toFixed(2)}</div>
                  </div>
                `).join('')}
              </div>
              
              <div style="text-align: center;">
                <a href="https://portal.rhy-supplier.com/orders/${variables.orderId}" class="button">
                  View Order Details
                </a>
              </div>
              
              <p>If you have any questions or concerns about this update, please don't hesitate to reach out to us.</p>
              
              <p>Thank you for your patience and for choosing RHY for your FlexVolt battery needs.</p>
              
              <p>Best regards,<br>
              <strong>${variables.supplierName}</strong><br>
              RHY Supplier Portal Team</p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} RHY Supplier Portal. All rights reserved.</p>
              <p>This email was sent regarding order #${variables.orderId}</p>
              <p>Questions? Reply to this email or contact ${variables.supplierEmail}</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
Order Update - RHY Supplier Portal

Hello ${variables.customerName},

We have an update regarding your order #${variables.orderId}:

${variables.messageSubject}
${variables.messageContent}

Order Information:
- Order #: ${variables.orderId}
- Order Date: ${format(variables.orderDate, 'MMMM d, yyyy')}
- Processing at: ${warehouse.name}
${variables.estimatedDelivery ? `- Estimated Delivery: ${format(variables.estimatedDelivery, 'MMMM d, yyyy')}` : ''}

Order Contents:
${variables.products.map(product => `- ${product.name} x${product.quantity}: $${product.totalPrice.toFixed(2)}`).join('\n')}

View order details: https://portal.rhy-supplier.com/orders/${variables.orderId}

If you have any questions, please contact us at ${variables.supplierEmail}

Thank you for choosing RHY!

Best regards,
${variables.supplierName}
RHY Supplier Portal Team
    `

    return {
      id: 'order_update',
      name: 'Order Update',
      subject: `Order Update: #${variables.orderId} - ${variables.messageSubject}`,
      html,
      text,
      variables: Object.keys(variables),
      language: 'en',
      category: 'ORDER_UPDATE'
    }
  }

  /**
   * Generate delivery confirmation email
   */
  generateDeliveryConfirmation(variables: TemplateVariables): EmailTemplate {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Delivered - RHY Supplier Portal</title>
          <style>${this.baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Order Delivered!</h1>
              <p>Your FlexVolt batteries have arrived</p>
            </div>
            
            <div class="content">
              <h2>Great news, ${variables.customerName}!</h2>
              
              <p>Your order #${variables.orderId} has been successfully delivered. We hope you're excited to power up your projects with these professional-grade FlexVolt batteries!</p>
              
              <div class="order-summary">
                <h3>Delivery Confirmation</h3>
                <p><strong>Order #:</strong> ${variables.orderId}</p>
                <p><strong>Delivered:</strong> ${format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
                ${variables.trackingNumber ? `<p><strong>Tracking #:</strong> ${variables.trackingNumber}</p>` : ''}
                
                <h4>Items Delivered:</h4>
                ${variables.products.map(product => `
                  <div class="product-row">
                    <div>
                      <strong>${product.name}</strong><br>
                      <small>Professional-grade 20V/60V MAX compatible</small>
                    </div>
                    <div>✅ x${product.quantity}</div>
                  </div>
                `).join('')}
              </div>
              
              <div class="tracking-info">
                <h3>🔋 Battery Care Tips</h3>
                <p>To ensure optimal performance and longevity of your FlexVolt batteries:</p>
                <ul style="text-align: left; display: inline-block;">
                  <li>Store in a cool, dry place (32°F to 120°F)</li>
                  <li>Charge before first use and after storage</li>
                  <li>Use original charger for best results</li>
                  <li>Avoid complete discharge when possible</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="https://portal.rhy-supplier.com/support/warranty" class="button">
                  Register Warranty
                </a>
              </div>
              
              <p>We'd love to hear about your experience! Please consider leaving a review and let us know how these batteries are powering your work.</p>
              
              <p>Thank you for choosing RHY for your professional battery needs. We look forward to serving you again!</p>
              
              <p>Best regards,<br>
              <strong>${variables.supplierName}</strong><br>
              RHY Supplier Portal Team</p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} RHY Supplier Portal. All rights reserved.</p>
              <p>Need support? Contact us at ${variables.supplierEmail}</p>
              <p><a href="https://portal.rhy-supplier.com/support">Support Center</a> | <a href="https://portal.rhy-supplier.com/warranty">Warranty Registration</a></p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
Order Delivered! - RHY Supplier Portal

Great news, ${variables.customerName}!

Your order #${variables.orderId} has been successfully delivered!

Delivery Details:
- Order #: ${variables.orderId}
- Delivered: ${format(new Date(), 'EEEE, MMMM d, yyyy')}
${variables.trackingNumber ? `- Tracking #: ${variables.trackingNumber}` : ''}

Items Delivered:
${variables.products.map(product => `- ${product.name} x${product.quantity} (20V/60V MAX compatible)`).join('\n')}

Battery Care Tips:
- Store in cool, dry place (32°F to 120°F)
- Charge before first use and after storage
- Use original charger for best results
- Avoid complete discharge when possible

Register warranty: https://portal.rhy-supplier.com/support/warranty

Thank you for choosing RHY for your professional battery needs!

Best regards,
${variables.supplierName}
RHY Supplier Portal Team

Support: ${variables.supplierEmail}
    `

    return {
      id: 'delivery_confirmation',
      name: 'Delivery Confirmation',
      subject: `✅ Your FlexVolt Order #${variables.orderId} Has Been Delivered!`,
      html,
      text,
      variables: Object.keys(variables),
      language: 'en',
      category: 'DELIVERY'
    }
  }

  /**
   * Generate customer query response email
   */
  generateCustomerQueryResponse(variables: TemplateVariables): EmailTemplate {
    const warehouse = this.getWarehouseInfo(variables.warehouseId)
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Response to Your Inquiry - RHY Supplier Portal</title>
          <style>${this.baseStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💬 Response to Your Inquiry</h1>
              <p>We're here to help with your FlexVolt questions</p>
            </div>
            
            <div class="content">
              <h2>Hello ${variables.customerName},</h2>
              
              <p>Thank you for reaching out regarding your order #${variables.orderId}. We're happy to help!</p>
              
              <div class="order-summary">
                <h3>Your Question:</h3>
                <p style="font-style: italic; border-left: 3px solid ${this.brandColors.primary}; padding-left: 16px;">
                  "${variables.messageSubject}"
                </p>
                
                <h3>Our Response:</h3>
                <p>${variables.messageContent}</p>
              </div>
              
              <div class="warehouse-info">
                <h4>Order Details</h4>
                <p><strong>Order #:</strong> ${variables.orderId}</p>
                <p><strong>Processing at:</strong> ${warehouse.name}</p>
                ${variables.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${format(variables.estimatedDelivery, 'MMMM d, yyyy')}</p>` : ''}
                ${variables.trackingNumber ? `<p><strong>Tracking #:</strong> ${variables.trackingNumber}</p>` : ''}
              </div>
              
              <div style="text-align: center;">
                <a href="https://portal.rhy-supplier.com/orders/${variables.orderId}" class="button">
                  View Full Order Details
                </a>
              </div>
              
              <p>If you have any additional questions or need further assistance, please don't hesitate to contact us. We're committed to providing you with exceptional service and support.</p>
              
              <p>Thank you for choosing RHY for your professional battery needs!</p>
              
              <p>Best regards,<br>
              <strong>${variables.supplierName}</strong><br>
              RHY Supplier Portal Team<br>
              ${variables.supplierEmail}<br>
              ${variables.supplierPhone ? `${variables.supplierPhone}` : ''}</p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} RHY Supplier Portal. All rights reserved.</p>
              <p>Need more help? Visit our <a href="https://portal.rhy-supplier.com/support">Support Center</a></p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
Response to Your Inquiry - RHY Supplier Portal

Hello ${variables.customerName},

Thank you for reaching out regarding your order #${variables.orderId}.

Your Question: "${variables.messageSubject}"

Our Response:
${variables.messageContent}

Order Details:
- Order #: ${variables.orderId}
- Processing at: ${warehouse.name}
${variables.estimatedDelivery ? `- Estimated Delivery: ${format(variables.estimatedDelivery, 'MMMM d, yyyy')}` : ''}
${variables.trackingNumber ? `- Tracking #: ${variables.trackingNumber}` : ''}

View order details: https://portal.rhy-supplier.com/orders/${variables.orderId}

If you have additional questions, please contact us at ${variables.supplierEmail}

Thank you for choosing RHY!

Best regards,
${variables.supplierName}
RHY Supplier Portal Team
${variables.supplierEmail}
${variables.supplierPhone ? variables.supplierPhone : ''}
    `

    return {
      id: 'customer_query_response',
      name: 'Customer Query Response',
      subject: `Re: ${variables.messageSubject} - Order #${variables.orderId}`,
      html,
      text,
      variables: Object.keys(variables),
      language: 'en',
      category: 'ORDER_UPDATE'
    }
  }

  /**
   * Utility methods
   */
  private getWarehouseInfo(warehouseId: string) {
    const warehouse = Object.values(WAREHOUSES).find(w => w.id === warehouseId)
    return warehouse || WAREHOUSES.US_WEST
  }

  private getPriorityClass(priority: string): string {
    switch (priority) {
      case 'CRITICAL':
      case 'URGENT':
        return 'status-urgent'
      case 'HIGH':
        return 'status-high'
      default:
        return 'status-normal'
    }
  }

  /**
   * Variable substitution helper
   */
  static substituteVariables(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match
    })
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): string[] {
    return [
      'order_confirmation',
      'shipping_notification', 
      'order_update',
      'delivery_confirmation',
      'customer_query_response'
    ]
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string, variables: TemplateVariables): EmailTemplate | null {
    switch (templateId) {
      case 'order_confirmation':
        return this.generateOrderConfirmation(variables)
      case 'shipping_notification':
        return this.generateShippingNotification(variables)
      case 'order_update':
        return this.generateOrderUpdate(variables)
      case 'delivery_confirmation':
        return this.generateDeliveryConfirmation(variables)
      case 'customer_query_response':
        return this.generateCustomerQueryResponse(variables)
      default:
        return null
    }
  }
}

export default OrderEmailTemplates
export type { TemplateVariables, EmailTemplate }