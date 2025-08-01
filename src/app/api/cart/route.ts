import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// Helper to get user from session
async function getUserFromSession() {
  const sessionCookie = cookies().get('session')
  if (!sessionCookie) return null
  
  try {
    const decoded = jwt.verify(sessionCookie.value, process.env.JWT_SECRET || 'your-secret-key') as any
    return decoded.userId
  } catch {
    return null
  }
}

// Helper to get or create session ID
function getSessionId() {
  const sessionId = cookies().get('sessionId')?.value || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Set session ID cookie if it doesn't exist
  if (!cookies().get('sessionId')) {
    cookies().set('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })
  }
  
  return sessionId
}

// GET /api/cart - Get current cart
export async function GET() {
  try {
    const userId = await getUserFromSession()
    const sessionId = getSessionId()

    // Find cart by user ID or session ID
    let cart = await prisma.cart.findFirst({
      where: userId ? { userId } : { sessionId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          sessionId,
          userId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      })
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + (item.quantity * item.product.basePrice)
    }, 0)

    // Use centralized tax calculation
    const { calculateTotal } = await import('@/config/tax')
    const taxCalc = calculateTotal(subtotal)
    const tax = taxCalc.tax
    const total = taxCalc.total

    return NextResponse.json({
      id: cart.id,
      items: cart.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.product.basePrice,
        total: item.quantity * item.product.basePrice
      })),
      totals: {
        subtotal,
        tax,
        total
      }
    })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const { productId, quantity = 1 } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const userId = await getUserFromSession()
    const sessionId = getSessionId()

    // Find or create cart
    let cart = await prisma.cart.findFirst({
      where: userId ? { userId } : { sessionId }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          sessionId,
          userId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId
        }
      }
    })

    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      })
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,
          quantity: quantity
        }
      })
    }

    // Return updated cart
    return GET()
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}

// DELETE /api/cart - Clear entire cart
export async function DELETE() {
  try {
    const userId = await getUserFromSession()
    const sessionId = getSessionId()

    const cart = await prisma.cart.findFirst({
      where: userId ? { userId } : { sessionId }
    })

    if (!cart) {
      return NextResponse.json({ 
        items: [], 
        totals: { subtotal: 0, tax: 0, total: 0 } 
      })
    }

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    })

    // Return empty cart
    return NextResponse.json({
      id: cart.id,
      items: [],
      totals: {
        subtotal: 0,
        tax: 0,
        total: 0
      }
    })
  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    )
  }
}