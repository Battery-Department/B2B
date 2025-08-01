import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@/generated/prisma'

const prisma = new PrismaClient()

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

// Validation helper
function validateOrderData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate required fields
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Order must contain at least one item')
  }

  // Validate items
  data.items?.forEach((item: any, index: number) => {
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantity must be greater than 0`)
    }
    if (!item.unitPrice || item.unitPrice < 0) {
      errors.push(`Item ${index + 1}: Invalid unit price`)
    }
  })

  // Validate totals
  if (typeof data.subtotal !== 'number' || data.subtotal < 0) {
    errors.push('Invalid subtotal')
  }
  if (typeof data.total !== 'number' || data.total < 0) {
    errors.push('Invalid total')
  }

  // Validate shipping address
  if (!data.shippingAddress || typeof data.shippingAddress !== 'string') {
    errors.push('Shipping address is required')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerId,
      items,
      subtotal,
      tax,
      shipping,
      total,
      shippingAddress,
      shippingMethod,
      paymentIntentId,
      customerNotes,
      sessionId,
      userId,
      quoteId
    } = body

    // Validate order data
    const validation = validateOrderData(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Generate unique order number
    const orderNumber = generateOrderNumber()

    // Use transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create or get customer
      let customer
      if (customerId) {
        customer = await tx.customer.findUnique({
          where: { id: customerId }
        })
      } else if (userId) {
        customer = await tx.customer.findUnique({
          where: { userId }
        })
        
        if (!customer) {
          // Create new customer
          customer = await tx.customer.create({
            data: {
              userId,
              billingAddress: shippingAddress,
              shippingAddress: shippingAddress
            }
          })
        }
      }

      if (!customer) {
        throw new Error('Customer not found or could not be created')
      }

      // Validate inventory (if products have stock tracking)
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.id || item.productId }
        })

        if (product && product.stockQuantity !== null) {
          if (product.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`)
          }
        }
      }

      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          status: 'pending',
          subtotal,
          tax: tax || 0,
          shipping: shipping || 0,
          total,
          shippingAddress,
          shippingMethod,
          paymentIntentId,
          customerNotes,
          paymentStatus: paymentIntentId ? 'paid' : 'pending',
          paidAt: paymentIntentId ? new Date() : null,
          items: {
            create: items.map((item: any) => ({
              productId: item.id || item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice || item.price,
              totalPrice: (item.unitPrice || item.price) * item.quantity,
              productSnapshot: {
                name: item.name,
                sku: item.sku || item.id,
                specifications: item.specifications || {}
              }
            }))
          }
        },
        include: {
          items: true
        }
      })

      // Update inventory
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.id || item.productId }
        })

        if (product && product.stockQuantity !== null) {
          await tx.product.update({
            where: { id: product.id },
            data: {
              stockQuantity: product.stockQuantity - item.quantity
            }
          })
        }
      }

      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: `INV-${orderNumber}`,
          customerId: customer.id,
          type: 'order',
          orderId: order.id,
          subtotal,
          tax: tax || 0,
          total,
          status: paymentIntentId ? 'paid' : 'pending',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          paidAt: paymentIntentId ? new Date() : null,
          paymentIntentId,
          paymentMethod: 'card'
        }
      })

      // Update order with invoice
      await tx.order.update({
        where: { id: order.id },
        data: { invoiceId: invoice.id }
      })

      // If this order came from a quote, mark it as converted
      if (quoteId) {
        const quote = await tx.savedQuote.findUnique({
          where: { quoteId }
        })

        if (quote) {
          await tx.savedQuote.update({
            where: { quoteId },
            data: {
              status: 'converted',
              convertedToOrderId: order.id,
              convertedAt: new Date()
            }
          })
        }
      }

      // Track analytics event
      await tx.analyticsEvent.create({
        data: {
          sessionId: sessionId || 'unknown',
          userId: userId || null,
          eventName: 'order_created',
          eventCategory: 'ecommerce',
          eventData: {
            orderNumber,
            orderId: order.id,
            total,
            itemsCount: items.length,
            paymentStatus: order.paymentStatus,
            fromQuote: !!quoteId
          },
          dataPoints: {
            subtotal,
            tax,
            shipping,
            total,
            itemsCount: items.length
          },
          context: {
            page: '/customer/checkout',
            userAgent: request.headers.get('user-agent') || '',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
          },
          timestamp: new Date()
        }
      })

      // Clear the user's cart
      if (userId || sessionId) {
        const cart = await tx.cart.findFirst({
          where: {
            OR: [
              { userId: userId || undefined },
              { sessionId: sessionId || undefined }
            ]
          }
        })

        if (cart) {
          await tx.cart.delete({
            where: { id: cart.id }
          })
        }
      }

      return { order, invoice }
    })

    return NextResponse.json({ 
      success: true,
      order: {
        id: result.order.id,
        orderNumber: result.order.orderNumber,
        invoiceId: result.invoice.id,
        total: result.order.total,
        status: result.order.status,
        paymentStatus: result.order.paymentStatus
      }
    })
  } catch (error) {
    console.error('Error creating order:', error)
    
    // Handle specific error types
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle unique constraint violations
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Order number already exists. Please try again.' },
          { status: 409 }
        )
      }
      // Handle foreign key constraints
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Invalid product or customer reference' },
          { status: 400 }
        )
      }
      // Handle record not found
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Referenced record not found' },
          { status: 404 }
        )
      }
    }
    
    // Handle custom validation errors
    if (error instanceof Error) {
      if (error.message.includes('Insufficient stock')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      if (error.message.includes('Customer not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
    }
    
    // Generic error response
    return NextResponse.json(
      { 
        error: 'Failed to create order. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}