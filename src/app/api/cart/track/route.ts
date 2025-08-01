import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      action,
      userId,
      sessionId,
      product,
      quantity,
      cartTotal,
      items
    } = body

    // Track analytics event
    const analyticsEvent = await prisma.analyticsEvent.create({
      data: {
        sessionId: sessionId || 'unknown',
        userId: userId || null,
        eventName: `cart_${action}`,
        eventCategory: 'ecommerce',
        eventData: {
          action,
          product: product || null,
          quantity: quantity || null,
          cartTotal: cartTotal || null,
          itemsCount: items?.length || 0
        },
        dataPoints: {
          cartTotal,
          itemsCount: items?.length || 0,
          quantities: items?.reduce((acc: any, item: any) => {
            acc[item.id] = item.quantity
            return acc
          }, {}) || {}
        },
        context: {
          page: request.headers.get('referer') || '',
          userAgent: request.headers.get('user-agent') || '',
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
        },
        timestamp: new Date()
      }
    })

    // Update or create cart in database if userId is provided
    if (userId || sessionId) {
      const existingCart = await prisma.cart.findFirst({
        where: {
          OR: [
            { userId: userId || undefined },
            { sessionId: sessionId || undefined }
          ]
        }
      })

      if (existingCart && items) {
        // Clear existing items
        await prisma.cartItem.deleteMany({
          where: { cartId: existingCart.id }
        })

        // Add new items
        if (items.length > 0) {
          await prisma.cartItem.createMany({
            data: items.map((item: any) => ({
              cartId: existingCart.id,
              productId: item.id,
              quantity: item.quantity
            }))
          })
        }
      } else if (!existingCart && items && items.length > 0) {
        // Create new cart
        const newCart = await prisma.cart.create({
          data: {
            userId: userId || null,
            sessionId: sessionId || null,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            items: {
              create: items.map((item: any) => ({
                productId: item.id,
                quantity: item.quantity
              }))
            }
          }
        })
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Cart action tracked successfully'
    })
  } catch (error) {
    console.error('Error tracking cart action:', error)
    return NextResponse.json(
      { error: 'Failed to track cart action' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const sessionId = searchParams.get('sessionId')

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'userId or sessionId required' },
        { status: 400 }
      )
    }

    const cart = await prisma.cart.findFirst({
      where: {
        OR: [
          { userId: userId || undefined },
          { sessionId: sessionId || undefined }
        ]
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!cart) {
      return NextResponse.json({ 
        success: true,
        cart: null
      })
    }

    // Check if cart is expired
    if (new Date(cart.expiresAt) < new Date()) {
      await prisma.cart.delete({
        where: { id: cart.id }
      })
      return NextResponse.json({ 
        success: true,
        cart: null
      })
    }

    return NextResponse.json({ 
      success: true,
      cart: {
        id: cart.id,
        items: cart.items.map(item => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.basePrice,
          quantity: item.quantity
        })),
        total: cart.items.reduce((sum, item) => 
          sum + (item.product.basePrice * item.quantity), 0
        ),
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt
      }
    })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}