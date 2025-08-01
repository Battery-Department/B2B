import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      eventName,
      eventCategory,
      eventData,
      sessionId,
      userId,
      page,
      additionalData
    } = body

    // Get user agent and IP
    const userAgent = request.headers.get('user-agent') || ''
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''

    // Track analytics event
    const analyticsEvent = await prisma.analyticsEvent.create({
      data: {
        sessionId: sessionId || 'unknown',
        userId: userId || null,
        eventName,
        eventCategory: eventCategory || 'general',
        eventData: eventData || {},
        dataPoints: additionalData || {},
        context: {
          page: page || request.headers.get('referer') || '',
          userAgent,
          ip,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date()
      }
    })

    // Update session if exists
    if (sessionId) {
      const session = await prisma.analyticsSession.findUnique({
        where: { id: sessionId }
      })

      if (session) {
        await prisma.analyticsSession.update({
          where: { id: sessionId },
          data: {
            events: { increment: 1 },
            endTime: new Date(),
            duration: Math.floor((new Date().getTime() - new Date(session.startTime).getTime()) / 1000)
          }
        })
      }
    }

    return NextResponse.json({ 
      success: true,
      eventId: analyticsEvent.id
    })
  } catch (error) {
    console.error('Error tracking analytics event:', error)
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Endpoint to create/update analytics session
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessionId,
      userId,
      visitorId,
      source,
      medium,
      campaign,
      deviceType,
      browser,
      operatingSystem,
      screenResolution,
      language,
      referrer
    } = body

    const userAgent = request.headers.get('user-agent') || ''
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''

    let session
    if (sessionId) {
      // Try to find existing session
      session = await prisma.analyticsSession.findUnique({
        where: { id: sessionId }
      })

      if (session) {
        // Update existing session
        session = await prisma.analyticsSession.update({
          where: { id: sessionId },
          data: {
            endTime: new Date(),
            duration: Math.floor((new Date().getTime() - new Date(session.startTime).getTime()) / 1000),
            pageViews: { increment: 1 }
          }
        })
      }
    }

    if (!session) {
      // Create new session
      session = await prisma.analyticsSession.create({
        data: {
          id: sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          userId: userId || null,
          visitorId: visitorId || `visitor_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          startTime: new Date(),
          pageViews: 1,
          events: 0,
          bounced: true, // Will be updated if user interacts
          source: source || referrer || 'direct',
          medium: medium || 'organic',
          campaign: campaign || null,
          deviceType: deviceType || 'desktop',
          browser: browser || 'unknown',
          browserVersion: '0',
          operatingSystem: operatingSystem || 'unknown',
          screenResolution: screenResolution || '1920x1080',
          language: language || 'en-US',
          referrer: referrer || null,
          ipAddress: ip,
          userAgent
        }
      })
    }

    return NextResponse.json({ 
      success: true,
      sessionId: session.id,
      visitorId: session.visitorId
    })
  } catch (error) {
    console.error('Error managing analytics session:', error)
    return NextResponse.json(
      { error: 'Failed to manage session' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}