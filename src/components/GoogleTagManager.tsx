'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// Replace with your actual GTM Container ID
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-XXXXXXX'

declare global {
  interface Window {
    dataLayer: any[]
  }
}

// Initialize dataLayer
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || []
}

// Helper to push events to dataLayer
export const pushToDataLayer = (data: any) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(data)
  }
}

// Enhanced Ecommerce helpers
export const trackEcommerce = {
  // Product impressions (list views)
  impressions: (products: any[], listName: string = 'Search Results') => {
    pushToDataLayer({
      event: 'view_item_list',
      ecommerce: {
        item_list_id: listName.toLowerCase().replace(/\s+/g, '_'),
        item_list_name: listName,
        items: products.map((product, index) => ({
          item_id: product.id,
          item_name: product.name,
          item_category: 'battery',
          item_category2: product.voltage || '20V/60V',
          item_variant: product.capacity || '',
          price: product.price,
          currency: 'USD',
          index: index
        }))
      }
    })
  },

  // Product detail view
  viewItem: (product: any) => {
    pushToDataLayer({
      event: 'view_item',
      ecommerce: {
        currency: 'USD',
        value: product.price,
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_category: 'battery',
          item_category2: product.voltage || '20V/60V',
          item_variant: product.capacity || '',
          price: product.price,
          quantity: 1
        }]
      },
      user_properties: {
        visitor_type: localStorage.getItem('userId') ? 'returning' : 'new'
      }
    })
  },

  // Add to cart with enhanced data
  addToCart: (product: any, quantity: number) => {
    pushToDataLayer({
      event: 'add_to_cart',
      ecommerce: {
        currency: 'USD',
        value: product.price * quantity,
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_category: 'battery',
          item_category2: product.voltage || '20V/60V',
          item_variant: product.capacity || '',
          price: product.price,
          quantity: quantity
        }]
      }
    })
  },

  // Remove from cart
  removeFromCart: (product: any, quantity: number) => {
    pushToDataLayer({
      event: 'remove_from_cart',
      ecommerce: {
        currency: 'USD',
        value: product.price * quantity,
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_category: 'battery',
          item_category2: product.voltage || '20V/60V',
          item_variant: product.capacity || '',
          price: product.price,
          quantity: quantity
        }]
      }
    })
  },

  // View cart
  viewCart: (cart: any) => {
    pushToDataLayer({
      event: 'view_cart',
      ecommerce: {
        currency: 'USD',
        value: cart.total,
        items: cart.items.map((item: any) => ({
          item_id: item.id,
          item_name: item.name,
          item_category: 'battery',
          price: item.price,
          quantity: item.quantity
        }))
      }
    })
  },

  // Begin checkout with enhanced data
  beginCheckout: (cart: any) => {
    pushToDataLayer({
      event: 'begin_checkout',
      ecommerce: {
        currency: 'USD',
        value: cart.total,
        coupon: cart.discountCode || '',
        items: cart.items.map((item: any) => ({
          item_id: item.id,
          item_name: item.name,
          item_category: 'battery',
          item_category2: item.voltage || '20V/60V',
          item_variant: item.capacity || '',
          price: item.price,
          quantity: item.quantity,
          discount: item.discount || 0
        }))
      }
    })
  },

  // Add shipping info
  addShippingInfo: (cart: any, shippingMethod: string, shippingCost: number) => {
    pushToDataLayer({
      event: 'add_shipping_info',
      ecommerce: {
        currency: 'USD',
        value: cart.total,
        shipping_tier: shippingMethod,
        shipping: shippingCost,
        items: cart.items.map((item: any) => ({
          item_id: item.id,
          item_name: item.name,
          item_category: 'battery',
          price: item.price,
          quantity: item.quantity
        }))
      }
    })
  },

  // Add payment info
  addPaymentInfo: (cart: any, paymentMethod: string) => {
    pushToDataLayer({
      event: 'add_payment_info',
      ecommerce: {
        currency: 'USD',
        value: cart.total,
        payment_type: paymentMethod,
        items: cart.items.map((item: any) => ({
          item_id: item.id,
          item_name: item.name,
          item_category: 'battery',
          price: item.price,
          quantity: item.quantity
        }))
      }
    })
  },

  // Purchase with comprehensive data
  purchase: (order: any) => {
    pushToDataLayer({
      event: 'purchase',
      ecommerce: {
        transaction_id: order.id,
        value: order.total,
        tax: order.tax || 0,
        shipping: order.shipping || 0,
        currency: 'USD',
        coupon: order.couponCode || '',
        items: order.items.map((item: any) => ({
          item_id: item.id,
          item_name: item.name,
          item_category: 'battery',
          item_category2: item.voltage || '20V/60V',
          item_variant: item.capacity || '',
          price: item.price,
          quantity: item.quantity,
          discount: item.discount || 0
        }))
      },
      user_properties: {
        lifetime_value: order.customerLifetimeValue || 0,
        purchase_count: order.customerPurchaseCount || 1,
        customer_type: order.customerType || 'individual'
      }
    })
  },

  // Refund tracking
  refund: (order: any, items?: any[]) => {
    pushToDataLayer({
      event: 'refund',
      ecommerce: {
        transaction_id: order.id,
        value: items ? items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : order.total,
        currency: 'USD',
        items: items || order.items
      }
    })
  }
}

// Custom event tracking
export const trackCustomEvent = (eventName: string, parameters: any = {}) => {
  pushToDataLayer({
    event: eventName,
    ...parameters
  })
}

// User properties tracking
export const setUserProperties = (properties: any) => {
  pushToDataLayer({
    event: 'user_properties_set',
    user_properties: properties
  })
}

// Page timing
export const trackPageTiming = () => {
  if (typeof window !== 'undefined' && window.performance) {
    const timing = window.performance.timing
    const loadTime = timing.loadEventEnd - timing.navigationStart
    
    pushToDataLayer({
      event: 'page_timing',
      page_load_time: loadTime,
      dom_interactive_time: timing.domInteractive - timing.navigationStart,
      dom_content_loaded_time: timing.domContentLoadedEventEnd - timing.navigationStart
    })
  }
}

export default function GoogleTagManager() {
  const pathname = usePathname()

  useEffect(() => {
    // Track page views with enhanced data
    pushToDataLayer({
      event: 'page_view',
      page_path: pathname,
      page_title: document.title,
      user_id: localStorage.getItem('userId') || undefined,
      session_id: sessionStorage.getItem('sessionId') || undefined
    })

    // Track page timing after load
    if (document.readyState === 'complete') {
      trackPageTiming()
    } else {
      window.addEventListener('load', trackPageTiming)
      return () => window.removeEventListener('load', trackPageTiming)
    }
  }, [pathname])

  if (!GTM_ID || GTM_ID === 'GTM-XXXXXXX') {
    console.warn('Google Tag Manager ID not set')
    return null
  }

  return (
    <>
      {/* Google Tag Manager Script */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `,
        }}
      />

      {/* Google Tag Manager (noscript) */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  )
}