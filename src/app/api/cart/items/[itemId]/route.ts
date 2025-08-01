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

// Helper to get session ID
function getSessionId() {
  return cookies().get('sessionId')?.value
}

// PATCH /api/cart/items/[itemId] - Update item quantity
export async function PATCH(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const { quantity } = await request.json()
    const { itemId } = params

    if (quantity < 0) {
      return NextResponse.json(
        { error: 'Quantity must be non-negative' },
        { status: 400 }
      )
    }

    const userId = await getUserFromSession()
    const sessionId = getSessionId()

    // Find the cart item and verify ownership
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        product: true
      }
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    // Verify cart ownership
    const isOwner = userId ? cartItem.cart.userId === userId : cartItem.cart.sessionId === sessionId
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    if (quantity === 0) {
      // Delete item if quantity is 0
      await prisma.cartItem.delete({
        where: { id: itemId }
      })
    } else {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity }
      })
    }

    // Return updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cartItem.cartId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Calculate totals
    const subtotal = updatedCart!.items.reduce((sum, item) => {
      return sum + (item.quantity * item.product.basePrice)
    }, 0)

    const taxRate = 0.08 // 8% MA sales tax
    const tax = subtotal * taxRate
    const total = subtotal + tax

    return NextResponse.json({
      id: updatedCart!.id,
      items: updatedCart!.items.map(item => ({
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
    console.error('Error updating cart item:', error)
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    )
  }
}

// DELETE /api/cart/items/[itemId] - Remove item from cart
export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const { itemId } = params
    const userId = await getUserFromSession()
    const sessionId = getSessionId()

    // Find the cart item and verify ownership
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true
      }
    })

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    // Verify cart ownership
    const isOwner = userId ? cartItem.cart.userId === userId : cartItem.cart.sessionId === sessionId
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete the item
    await prisma.cartItem.delete({
      where: { id: itemId }
    })

    // Return updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cartItem.cartId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Calculate totals
    const subtotal = updatedCart!.items.reduce((sum, item) => {
      return sum + (item.quantity * item.product.basePrice)
    }, 0)

    const taxRate = 0.08 // 8% MA sales tax
    const tax = subtotal * taxRate
    const total = subtotal + tax

    return NextResponse.json({
      id: updatedCart!.id,
      items: updatedCart!.items.map(item => ({
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
    console.error('Error removing cart item:', error)
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    )
  }
}