import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { trackCustomEvent } from '@/components/GoogleAnalytics'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      quoteId,
      customerId,
      customerName,
      customerEmail,
      userId,
      items,
      quantities,
      subtotal,
      discountAmount,
      discountPercentage,
      total,
      validUntil
    } = body

    // Save to database
    const savedQuote = await prisma.savedQuote.create({
      data: {
        quoteId,
        customerId: customerId || null,
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        userId: userId || null,
        items,
        quantities,
        subtotal,
        discountAmount: discountAmount || 0,
        discountPercentage: discountPercentage || 0,
        total,
        validUntil: new Date(validUntil),
        status: 'active'
      }
    })

    // Track analytics event
    await prisma.analyticsEvent.create({
      data: {
        sessionId: body.sessionId || 'unknown',
        userId: userId || null,
        eventName: 'quote_saved',
        eventCategory: 'engagement',
        eventData: {
          quoteId,
          total,
          itemCount: items.length,
          discountApplied: discountAmount > 0
        },
        dataPoints: {
          subtotal,
          discountAmount,
          discountPercentage,
          total,
          quantities
        },
        context: {
          page: '/customer/products',
          userAgent: request.headers.get('user-agent') || '',
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
        },
        timestamp: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      quote: savedQuote,
      message: 'Quote saved successfully'
    })
  } catch (error) {
    console.error('Error saving quote:', error)
    return NextResponse.json(
      { error: 'Failed to save quote' },
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
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status') || 'active'

    const where = {
      status,
      ...(userId && { userId }),
      ...(customerId && { customerId })
    }

    const quotes = await prisma.savedQuote.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // Update expired quotes
    const now = new Date()
    const expiredQuoteIds = quotes
      .filter(q => new Date(q.validUntil) < now && q.status === 'active')
      .map(q => q.id)

    if (expiredQuoteIds.length > 0) {
      await prisma.savedQuote.updateMany({
        where: { id: { in: expiredQuoteIds } },
        data: { status: 'expired' }
      })
    }

    return NextResponse.json({ 
      success: true, 
      quotes: quotes.map(q => ({
        ...q,
        status: new Date(q.validUntil) < now ? 'expired' : q.status
      }))
    })
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}