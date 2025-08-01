import crypto from 'crypto'

// Google Analytics Measurement Protocol v2
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''
const GA_API_SECRET = process.env.GA_MEASUREMENT_API_SECRET || ''
const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect'

interface GAEvent {
  name: string
  params?: Record<string, any>
}

interface GAUserProperties {
  [key: string]: string | number | boolean
}

export class GoogleAnalyticsMeasurementProtocol {
  private clientId: string
  private sessionId: string
  private userId?: string

  constructor(clientId?: string, sessionId?: string, userId?: string) {
    this.clientId = clientId || this.generateClientId()
    this.sessionId = sessionId || this.generateSessionId()
    this.userId = userId
  }

  private generateClientId(): string {
    return crypto.randomUUID()
  }

  private generateSessionId(): string {
    return Date.now().toString()
  }

  private async sendRequest(events: GAEvent[], userProperties?: GAUserProperties) {
    if (!GA_MEASUREMENT_ID || !GA_API_SECRET) {
      console.warn('GA Measurement ID or API Secret not configured')
      return
    }

    const payload = {
      client_id: this.clientId,
      user_id: this.userId,
      timestamp_micros: Date.now() * 1000,
      user_properties: userProperties,
      events: events.map(event => ({
        name: event.name,
        params: {
          session_id: this.sessionId,
          engagement_time_msec: 100,
          ...event.params
        }
      }))
    }

    try {
      const response = await fetch(`${GA_ENDPOINT}?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        console.error('GA Measurement Protocol error:', response.status)
      }
    } catch (error) {
      console.error('Failed to send GA event:', error)
    }
  }

  // Track page view
  async trackPageView(page_location: string, page_title: string, page_referrer?: string) {
    await this.sendRequest([{
      name: 'page_view',
      params: {
        page_location,
        page_title,
        page_referrer
      }
    }])
  }

  // Track custom event
  async trackEvent(eventName: string, parameters?: Record<string, any>) {
    await this.sendRequest([{
      name: eventName,
      params: parameters
    }])
  }

  // Track ecommerce events
  async trackPurchase(transactionData: {
    transaction_id: string
    value: number
    currency: string
    tax?: number
    shipping?: number
    coupon?: string
    items: Array<{
      item_id: string
      item_name: string
      price: number
      quantity: number
      item_category?: string
      item_variant?: string
    }>
  }) {
    await this.sendRequest([{
      name: 'purchase',
      params: {
        currency: transactionData.currency,
        value: transactionData.value,
        transaction_id: transactionData.transaction_id,
        tax: transactionData.tax || 0,
        shipping: transactionData.shipping || 0,
        coupon: transactionData.coupon,
        items: transactionData.items
      }
    }])
  }

  // Track cart abandonment
  async trackCartAbandonment(cart: {
    value: number
    currency: string
    items: Array<{
      item_id: string
      item_name: string
      price: number
      quantity: number
    }>
  }) {
    await this.sendRequest([{
      name: 'cart_abandonment',
      params: {
        currency: cart.currency,
        value: cart.value,
        items: cart.items
      }
    }])
  }

  // Track quote saved
  async trackQuoteSaved(quote: {
    quote_id: string
    value: number
    currency: string
    items_count: number
  }) {
    await this.sendRequest([{
      name: 'save_quote',
      params: {
        quote_id: quote.quote_id,
        value: quote.value,
        currency: quote.currency,
        items_count: quote.items_count
      }
    }])
  }

  // Track email events
  async trackEmail(action: 'sent' | 'opened' | 'clicked', emailData: {
    campaign_id: string
    campaign_name: string
    email_type: string
    recipient_id?: string
  }) {
    await this.sendRequest([{
      name: `email_${action}`,
      params: {
        campaign_id: emailData.campaign_id,
        campaign_name: emailData.campaign_name,
        email_type: emailData.email_type,
        recipient_id: emailData.recipient_id
      }
    }])
  }

  // Set user properties
  async setUserProperties(properties: GAUserProperties) {
    await this.sendRequest([], properties)
  }

  // Track user timing
  async trackTiming(category: string, variable: string, time: number, label?: string) {
    await this.sendRequest([{
      name: 'timing_complete',
      params: {
        timing_category: category,
        timing_variable: variable,
        timing_time: time,
        timing_label: label
      }
    }])
  }

  // Track exceptions
  async trackException(description: string, fatal: boolean = false) {
    await this.sendRequest([{
      name: 'exception',
      params: {
        description,
        fatal
      }
    }])
  }
}

// Singleton instance for server-side tracking
export const serverAnalytics = new GoogleAnalyticsMeasurementProtocol()