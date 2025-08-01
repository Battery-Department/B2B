import { PrismaClient } from '@/generated/prisma'
import { emailService } from '@/services/email/email-service'
import { serverAnalytics } from '@/lib/analytics/ga-measurement-protocol'

const prisma = new PrismaClient()

export class BehavioralTriggers {
  // Check for cart abandonment (runs every 30 minutes)
  async checkCartAbandonment() {
    try {
      // Find carts that haven't been updated in 2 hours but less than 24 hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const abandonedCarts = await prisma.cart.findMany({
        where: {
          updatedAt: {
            gte: twentyFourHoursAgo,
            lte: twoHoursAgo
          },
          items: {
            some: {}
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: true
        }
      })

      for (const cart of abandonedCarts) {
        // Check if we already sent an email for this cart
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: cart.userId,
            type: 'email',
            metadata: {
              path: ['emailType'],
              equals: 'cart_abandonment'
            },
            createdAt: {
              gte: twentyFourHoursAgo
            }
          }
        })

        if (!existingNotification && cart.user?.email) {
          // Calculate cart total
          const cartTotal = cart.items.reduce((sum, item) => 
            sum + (item.product.basePrice * item.quantity), 0
          )

          // Send cart abandonment email
          await emailService.sendCartAbandonmentEmail({
            email: cart.user.email,
            name: cart.user.name || 'Valued Customer',
            cartItems: cart.items.map(item => ({
              id: item.product.id,
              name: item.product.name,
              price: item.product.basePrice,
              quantity: item.quantity
            })),
            cartTotal,
            abandonmentTime: cart.updatedAt,
            sessionId: cart.sessionId || '',
            userId: cart.userId || undefined
          })

          // Track in analytics
          await serverAnalytics.trackCartAbandonment({
            value: cartTotal,
            currency: 'USD',
            items: cart.items.map(item => ({
              item_id: item.product.id,
              item_name: item.product.name,
              price: item.product.basePrice,
              quantity: item.quantity
            }))
          })
        }
      }
    } catch (error) {
      console.error('Error checking cart abandonment:', error)
    }
  }

  // Check for quote expiration reminders (runs daily)
  async checkQuoteExpirations() {
    try {
      // Find quotes expiring in 3 days
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      const fourDaysFromNow = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)

      const expiringQuotes = await prisma.savedQuote.findMany({
        where: {
          status: 'active',
          validUntil: {
            gte: threeDaysFromNow,
            lt: fourDaysFromNow
          }
        },
        include: {
          user: true
        }
      })

      for (const quote of expiringQuotes) {
        if (quote.user?.email || quote.customerEmail) {
          const email = quote.user?.email || quote.customerEmail!
          const name = quote.user?.name || quote.customerName || 'Valued Customer'

          // Send expiration reminder
          await emailService.sendQuoteSavedEmail({
            email,
            name,
            quoteId: quote.quoteId,
            quoteTotal: quote.total,
            validUntil: quote.validUntil,
            items: quote.items as any[],
            userId: quote.userId || undefined
          })
        }
      }
    } catch (error) {
      console.error('Error checking quote expirations:', error)
    }
  }

  // Check for browse abandonment (runs every hour)
  async checkBrowseAbandonment() {
    try {
      // Find sessions with product views but no cart/order in last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

      const browseEvents = await prisma.analyticsEvent.findMany({
        where: {
          eventName: 'view_item',
          timestamp: {
            gte: oneDayAgo,
            lte: oneHourAgo
          }
        },
        distinct: ['sessionId'],
        orderBy: {
          timestamp: 'desc'
        }
      })

      for (const event of browseEvents) {
        // Check if this session has a cart or order
        const hasCartActivity = await prisma.analyticsEvent.findFirst({
          where: {
            sessionId: event.sessionId,
            eventName: {
              in: ['add_to_cart', 'begin_checkout', 'purchase']
            },
            timestamp: {
              gte: event.timestamp
            }
          }
        })

        if (!hasCartActivity && event.userId) {
          // Get user details
          const user = await prisma.user.findUnique({
            where: { id: event.userId }
          })

          if (user?.email) {
            // Get viewed products from this session
            const viewedProducts = await prisma.analyticsEvent.findMany({
              where: {
                sessionId: event.sessionId,
                eventName: 'view_item'
              },
              take: 5
            })

            await emailService.sendBrowseAbandonmentEmail({
              email: user.email,
              name: user.name || 'Valued Customer',
              viewedProducts: viewedProducts.map(vp => vp.eventData),
              lastViewedTime: event.timestamp,
              sessionId: event.sessionId,
              userId: user.id
            })
          }
        }
      }
    } catch (error) {
      console.error('Error checking browse abandonment:', error)
    }
  }

  // Re-engagement campaign for inactive users (runs weekly)
  async checkInactiveUsers() {
    try {
      // Find users who haven't had activity in 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const inactiveUsers = await prisma.user.findMany({
        where: {
          email: { not: null },
          sessions: {
            none: {
              createdAt: {
                gte: thirtyDaysAgo
              }
            }
          }
        },
        include: {
          customer: {
            include: {
              orders: {
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          }
        }
      })

      for (const user of inactiveUsers) {
        // Send re-engagement email based on their history
        console.log(`Would send re-engagement email to ${user.email}`)
        // Implement re-engagement email template
      }
    } catch (error) {
      console.error('Error checking inactive users:', error)
    }
  }

  // Post-purchase follow-up (runs daily)
  async checkPostPurchaseFollowUp() {
    try {
      // Find orders delivered 7 days ago
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)

      const deliveredOrders = await prisma.order.findMany({
        where: {
          deliveredAt: {
            gte: eightDaysAgo,
            lt: sevenDaysAgo
          }
        },
        include: {
          customer: {
            include: {
              user: true
            }
          },
          items: {
            include: {
              product: true
            }
          }
        }
      })

      for (const order of deliveredOrders) {
        if (order.customer.user?.email) {
          // Send follow-up email asking for review
          console.log(`Would send review request for order ${order.orderNumber}`)
          // Implement review request email
        }
      }
    } catch (error) {
      console.error('Error checking post-purchase follow-up:', error)
    }
  }

  // Real-time triggers
  async triggerRealTimeEvent(eventType: string, data: any) {
    switch (eventType) {
      case 'high_value_cart':
        // Trigger when cart value exceeds $1000
        if (data.cartTotal >= 1000 && data.userEmail) {
          // Send high-value cart notification to sales team
          console.log(`High value cart alert: ${data.userEmail} - $${data.cartTotal}`)
        }
        break

      case 'volume_discount_threshold':
        // Trigger when user is close to next discount tier
        if (data.nextTierDifference <= 100 && data.userEmail) {
          // Send notification about being close to next discount
          console.log(`User ${data.userEmail} is $${data.nextTierDifference} away from ${data.nextTierDiscount}% discount`)
        }
        break

      case 'repeat_customer_detected':
        // Trigger when returning customer is identified
        if (data.previousOrderCount > 0) {
          // Apply loyalty benefits or send welcome back message
          console.log(`Repeat customer detected: ${data.userEmail} with ${data.previousOrderCount} previous orders`)
        }
        break
    }
  }
}

// Create cron job endpoints for these triggers
export const behavioralTriggers = new BehavioralTriggers()

// Helper function to run all scheduled checks
export async function runScheduledTriggers() {
  const triggers = new BehavioralTriggers()
  
  // Run different checks based on schedule
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()

  // Cart abandonment - every 30 minutes
  if (minute === 0 || minute === 30) {
    await triggers.checkCartAbandonment()
  }

  // Browse abandonment - every hour
  if (minute === 0) {
    await triggers.checkBrowseAbandonment()
  }

  // Quote expiration - once daily at 9 AM
  if (hour === 9 && minute === 0) {
    await triggers.checkQuoteExpirations()
  }

  // Inactive users - weekly on Mondays at 10 AM
  if (now.getDay() === 1 && hour === 10 && minute === 0) {
    await triggers.checkInactiveUsers()
  }

  // Post-purchase follow-up - daily at 2 PM
  if (hour === 14 && minute === 0) {
    await triggers.checkPostPurchaseFollowUp()
  }
}