'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

// Replace with your actual GA4 Measurement ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX'

// Helper to track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }
}

// Helper to track events
export const event = ({ action, category, label, value }: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Track specific ecommerce events
export const trackEcommerce = {
  viewItem: (item: any) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_item', {
        currency: 'USD',
        value: item.price,
        items: [{
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: 1,
          item_category: 'battery'
        }]
      })
    }
  },
  
  addToCart: (item: any, quantity: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'USD',
        value: item.price * quantity,
        items: [{
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: quantity,
          item_category: 'battery'
        }]
      })
    }
  },
  
  removeFromCart: (item: any, quantity: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'remove_from_cart', {
        currency: 'USD',
        value: item.price * quantity,
        items: [{
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: quantity,
          item_category: 'battery'
        }]
      })
    }
  },
  
  beginCheckout: (items: any[], total: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: total,
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
          item_category: 'battery'
        }))
      })
    }
  },
  
  purchase: (order: any) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: order.id,
        value: order.total,
        currency: 'USD',
        tax: order.tax || 0,
        shipping: order.shipping || 0,
        items: order.items.map((item: any) => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
          item_category: 'battery'
        }))
      })
    }
  },

  saveQuote: (quote: any) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'save_quote', {
        quote_id: quote.quoteId,
        value: quote.total,
        currency: 'USD',
        items_count: quote.items.length
      })
    }
  }
}

// Track custom events
export const trackCustomEvent = (eventName: string, parameters?: any) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters)
  }
}

export default function GoogleAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const url = pathname + searchParams.toString()
    pageview(url)
  }, [pathname, searchParams])

  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
    console.warn('Google Analytics Measurement ID not set')
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              send_page_view: false
            });
          `,
        }}
      />
    </>
  )
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}