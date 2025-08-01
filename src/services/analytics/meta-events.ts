'use client'

import { prisma } from '@/lib/prisma'
import { subDays, format } from 'date-fns'

export interface MetaEventMetrics {
  totalEvents: number
  uniqueUsers: number
  eventsByType: Record<string, number>
  conversionRate: number
  topContent: ContentMetric[]
  engagement: EngagementMetrics
}

export interface ContentMetric {
  contentId: string
  title: string
  views: number
  engagement: number
  conversions: number
  revenue: number
}

export interface EngagementMetrics {
  avgTimeOnPage: number
  bounceRate: number
  pagesPerSession: number
  returningUsers: number
}

export interface AdSpendMetrics {
  totalSpend: number
  campaigns: CampaignMetric[]
  costPerConversion: number
  roas: number // Return on Ad Spend
}

export interface CampaignMetric {
  id: string
  name: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
}

export class MetaEventsService {
  // Get real Meta Pixel events
  async getMetaEvents(days: number = 30) {
    try {
      const startDate = subDays(new Date(), days)
      
      const events = await prisma.metaEvent.findMany({
        where: {
          timestamp: { gte: startDate }
        },
        orderBy: { timestamp: 'desc' }
      })

      return events
    } catch (error) {
      console.error('Failed to fetch Meta events:', error)
      return []
    }
  }

  // Get content performance metrics
  async getContentMetrics(days: number = 30): Promise<MetaEventMetrics> {
    try {
      const events = await this.getMetaEvents(days)
      
      // Calculate unique users
      const uniqueUsers = new Set(events.map(e => e.userId || e.sessionId)).size

      // Group events by type
      const eventsByType: Record<string, number> = {}
      events.forEach(event => {
        eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1
      })

      // Calculate conversions
      const conversions = events.filter(e => 
        e.eventType === 'Purchase' || e.eventType === 'CompleteRegistration'
      ).length

      const conversionRate = uniqueUsers > 0 ? (conversions / uniqueUsers) * 100 : 0

      // Get top content
      const contentViews = events.filter(e => e.eventType === 'ViewContent')
      const contentMetrics = await this.calculateContentMetrics(contentViews)

      // Calculate engagement metrics
      const engagement = await this.calculateEngagement(events)

      return {
        totalEvents: events.length,
        uniqueUsers,
        eventsByType,
        conversionRate: Math.round(conversionRate * 100) / 100,
        topContent: contentMetrics.slice(0, 10),
        engagement
      }
    } catch (error) {
      console.error('Failed to get content metrics:', error)
      return {
        totalEvents: 0,
        uniqueUsers: 0,
        eventsByType: {},
        conversionRate: 0,
        topContent: [],
        engagement: {
          avgTimeOnPage: 0,
          bounceRate: 0,
          pagesPerSession: 0,
          returningUsers: 0
        }
      }
    }
  }

  // Calculate content-specific metrics
  private async calculateContentMetrics(contentEvents: any[]): Promise<ContentMetric[]> {
    const contentMap = new Map<string, ContentMetric>()

    for (const event of contentEvents) {
      const contentId = event.contentId || event.data?.contentId || 'unknown'
      const existing = contentMap.get(contentId) || {
        contentId,
        title: event.data?.contentName || `Content ${contentId}`,
        views: 0,
        engagement: 0,
        conversions: 0,
        revenue: 0
      }

      existing.views++
      
      // Track engagement (likes, shares, comments)
      if (event.data?.action === 'engage') {
        existing.engagement++
      }

      contentMap.set(contentId, existing)
    }

    // Get conversion data for content
    const contentIds = Array.from(contentMap.keys())
    const conversions = await prisma.metaEvent.findMany({
      where: {
        eventType: 'Purchase',
        data: {
          path: '$.contentId',
          array_contains: contentIds
        }
      }
    })

    conversions.forEach(conv => {
      const contentId = conv.data?.contentId
      if (contentId && contentMap.has(contentId)) {
        const metric = contentMap.get(contentId)!
        metric.conversions++
        metric.revenue += conv.data?.value || 0
      }
    })

    return Array.from(contentMap.values())
      .sort((a, b) => b.views - a.views)
  }

  // Calculate engagement metrics
  private async calculateEngagement(events: any[]): Promise<EngagementMetrics> {
    const sessions = new Map<string, any[]>()
    
    // Group events by session
    events.forEach(event => {
      const sessionId = event.sessionId || event.userId
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, [])
      }
      sessions.get(sessionId)!.push(event)
    })

    // Calculate metrics
    let totalTimeOnPage = 0
    let totalPages = 0
    let bounces = 0
    let returningUsers = 0

    sessions.forEach((sessionEvents, sessionId) => {
      // Sort events by timestamp
      sessionEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      
      // Calculate time on page
      if (sessionEvents.length > 1) {
        const sessionDuration = sessionEvents[sessionEvents.length - 1].timestamp.getTime() - 
                              sessionEvents[0].timestamp.getTime()
        totalTimeOnPage += sessionDuration
      }

      // Count pages
      const pageViews = sessionEvents.filter(e => e.eventType === 'PageView').length
      totalPages += pageViews

      // Bounce if only one page view
      if (pageViews === 1) {
        bounces++
      }

      // Check if returning user
      const userEvents = events.filter(e => e.userId === sessionId)
      if (userEvents.length > sessionEvents.length) {
        returningUsers++
      }
    })

    const totalSessions = sessions.size

    return {
      avgTimeOnPage: totalSessions > 0 ? totalTimeOnPage / totalSessions / 1000 / 60 : 0, // Minutes
      bounceRate: totalSessions > 0 ? (bounces / totalSessions) * 100 : 0,
      pagesPerSession: totalSessions > 0 ? totalPages / totalSessions : 0,
      returningUsers
    }
  }

  // Get ad spend metrics (simulated - would connect to Meta Ads API)
  async getAdSpendMetrics(days: number = 30): Promise<AdSpendMetrics> {
    try {
      // In production, this would connect to Meta Ads API
      // For now, we'll calculate based on tracked conversions
      
      const startDate = subDays(new Date(), days)
      
      // Get conversion events with campaign data
      const conversions = await prisma.metaEvent.findMany({
        where: {
          eventType: 'Purchase',
          timestamp: { gte: startDate },
          data: {
            path: '$.campaignId',
            not: null
          }
        }
      })

      // Group by campaign
      const campaignMap = new Map<string, CampaignMetric>()
      let totalRevenue = 0

      conversions.forEach(conv => {
        const campaignId = conv.data?.campaignId || 'organic'
        const existing = campaignMap.get(campaignId) || {
          id: campaignId,
          name: conv.data?.campaignName || `Campaign ${campaignId}`,
          spend: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0
        }

        existing.conversions++
        existing.revenue += conv.data?.value || 0
        totalRevenue += conv.data?.value || 0

        campaignMap.set(campaignId, existing)
      })

      // Simulate spend data (in production, from Meta Ads API)
      const campaigns = Array.from(campaignMap.values())
      let totalSpend = 0
      
      campaigns.forEach(campaign => {
        // Simulate spend based on conversions (rough estimate)
        campaign.spend = campaign.conversions * 25 // $25 per conversion estimate
        campaign.impressions = campaign.conversions * 1000 // 0.1% conversion rate
        campaign.clicks = campaign.conversions * 50 // 2% conversion from clicks
        totalSpend += campaign.spend
      })

      const costPerConversion = conversions.length > 0 ? totalSpend / conversions.length : 0
      const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0

      return {
        totalSpend,
        campaigns: campaigns.sort((a, b) => b.revenue - a.revenue),
        costPerConversion,
        roas
      }
    } catch (error) {
      console.error('Failed to get ad spend metrics:', error)
      return {
        totalSpend: 0,
        campaigns: [],
        costPerConversion: 0,
        roas: 0
      }
    }
  }

  // Track new Meta event
  async trackEvent(event: {
    eventType: string
    userId?: string
    sessionId: string
    data?: any
  }) {
    try {
      return await prisma.metaEvent.create({
        data: {
          eventType: event.eventType,
          userId: event.userId,
          sessionId: event.sessionId,
          data: event.data || {},
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to track Meta event:', error)
      throw error
    }
  }

  // Get real-time event stream
  async *getEventStream() {
    while (true) {
      try {
        const latestEvents = await prisma.metaEvent.findMany({
          orderBy: { timestamp: 'desc' },
          take: 10
        })

        yield latestEvents

        // Wait 5 seconds before next update
        await new Promise(resolve => setTimeout(resolve, 5000))
      } catch (error) {
        console.error('Event stream error:', error)
        yield []
      }
    }
  }
}

// Create singleton instance
export const metaEventsService = new MetaEventsService()