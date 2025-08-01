'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  CheckCircle, 
  FileText, 
  Download, 
  Printer, 
  ArrowRight,
  Battery,
  Package,
  Truck,
  Calendar
} from 'lucide-react'
import { calculateTax } from '@/config/tax'

// Design System Colors (matching products page)
const colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#3B82F6',
  
  success: '#10B981',
  successLight: '#D1FAE5',
  successDark: '#059669',
  
  gray900: '#111827',
  gray700: '#374151',
  gray600: '#6B7280',
  gray500: '#9CA3AF',
  gray400: '#D1D5DB',
  gray300: '#E5E7EB',
  gray200: '#F3F4F6',
  gray100: '#F9FAFB',
  
  white: '#FFFFFF',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7'
}

const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px'
}

const typography = {
  title: { fontSize: '24px', fontWeight: '700', color: colors.gray900 },
  sectionTitle: { fontSize: '20px', fontWeight: '600', color: colors.gray900 },
  cardTitle: { fontSize: '18px', fontWeight: '600', color: colors.gray900 },
  body: { fontSize: '14px', fontWeight: '400', color: colors.gray700 },
  label: { fontSize: '12px', fontWeight: '500', color: colors.gray600 },
  small: { fontSize: '12px', fontWeight: '400', color: colors.gray500 }
}

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [invoiceData, setInvoiceData] = useState<any>(null)
  const [animationComplete, setAnimationComplete] = useState(false)

  useEffect(() => {
    // Load completed invoice
    const completedInvoice = sessionStorage.getItem('completedInvoice')
    if (completedInvoice) {
      setInvoiceData(JSON.parse(completedInvoice))
    } else {
      // Fallback: Try to reconstruct from cart data
      const cartData = localStorage.getItem('cartData')
      const checkoutData = sessionStorage.getItem('checkoutData')
      
      if (cartData) {
        const cart = JSON.parse(cartData)
        const checkout = checkoutData ? JSON.parse(checkoutData) : {}
        
        // Create invoice data from cart
        const items = cart.items || []
        const subtotal = items.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
        const tax = calculateTax(subtotal) // Use centralized tax calculation
        const shipping = subtotal >= 500 ? 0 : 15 // Free shipping over $500
        const total = subtotal + tax + shipping
        
        // Calculate discount
        let discountPercentage = 0
        if (subtotal >= 5000) discountPercentage = 20
        else if (subtotal >= 2500) discountPercentage = 15
        else if (subtotal >= 1000) discountPercentage = 10
        
        const discount = subtotal * (discountPercentage / 100)
        const finalTotal = total - discount
        
        const invoiceData = {
          id: orderId || `ORD-${Date.now()}`,
          orderNumber: orderId || `ORD-${Date.now()}`,
          date: new Date().toLocaleDateString(),
          items: items.map((item: any) => ({
            name: item.name || `${item.type} Battery`,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total
          })),
          subtotal,
          tax,
          shipping,
          discount,
          discountPercentage,
          total: finalTotal,
          ...checkout
        }
        
        setInvoiceData(invoiceData)
        // Save for future reference
        sessionStorage.setItem('completedInvoice', JSON.stringify(invoiceData))
      }
    }

    // Trigger animation
    setTimeout(() => setAnimationComplete(true), 500)
  }, [orderId])

  const handleViewInvoice = () => {
    if (invoiceData) {
      sessionStorage.setItem('invoiceData', JSON.stringify(invoiceData))
      router.push('/customer/invoice')
    }
  }

  const handlePrintInvoice = () => {
    handleViewInvoice()
    setTimeout(() => window.print(), 1000)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.gray100,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Success Animation */}
        <div style={{
          width: '120px',
          height: '120px',
          margin: '0 auto',
          marginBottom: spacing.xl,
          background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.successDark} 100%)`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: animationComplete ? 'scale(1)' : 'scale(0)',
          transition: 'transform 0.5s ease-out',
          boxShadow: `0 8px 24px ${colors.success}40`
        }}>
          <CheckCircle size={60} color={colors.white} strokeWidth={3} />
        </div>

        {/* Success Message */}
        <h1 style={{
          ...typography.title,
          fontSize: '32px',
          marginBottom: spacing.md,
          opacity: animationComplete ? 1 : 0,
          transform: animationComplete ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.5s ease-out 0.3s'
        }}>
          Order Confirmed!
        </h1>

        <p style={{
          ...typography.body,
          fontSize: '16px',
          marginBottom: spacing.lg,
          opacity: animationComplete ? 1 : 0,
          transform: animationComplete ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.5s ease-out 0.4s'
        }}>
          Thank you for your order. Your invoice #{orderId} has been generated.
        </p>

        {/* Order Details Card */}
        <div style={{
          background: colors.white,
          borderRadius: '12px',
          padding: spacing.xl,
          border: `2px solid ${colors.gray200}`,
          marginBottom: spacing.lg,
          opacity: animationComplete ? 1 : 0,
          transform: animationComplete ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.5s ease-out 0.5s',
          textAlign: 'left'
        }}>
          {invoiceData && (
            <>
              {/* Order Summary */}
              <div style={{ marginBottom: spacing.lg }}>
                <h3 style={{ ...typography.cardTitle, marginBottom: spacing.md }}>Order Summary</h3>
                
                {invoiceData.items.map((item: any, idx: number) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: `${spacing.sm} 0`,
                    borderBottom: idx < invoiceData.items.length - 1 ? `1px solid ${colors.gray200}` : 'none'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: colors.gray900 }}>
                        {item.name || item.type || 'Battery Product'}
                      </div>
                      <div style={{ ...typography.small }}>
                        Quantity: {item.quantity} × ${item.unitPrice || 0}
                      </div>
                    </div>
                    <div style={{ fontWeight: '600', color: colors.gray900 }}>
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ 
                paddingTop: spacing.md,
                borderTop: `2px solid ${colors.gray200}`
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: spacing.xs
                }}>
                  <span style={{ ...typography.body }}>Subtotal</span>
                  <span style={{ ...typography.body }}>${invoiceData.subtotal.toFixed(2)}</span>
                </div>
                {invoiceData.discount > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: spacing.xs,
                    color: colors.success
                  }}>
                    <span style={{ fontWeight: '600' }}>
                      Volume Discount ({invoiceData.discountPercentage}%)
                    </span>
                    <span style={{ fontWeight: '600' }}>
                      -${invoiceData.discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: spacing.xs
                }}>
                  <span style={{ ...typography.body }}>Shipping</span>
                  <span style={{ ...typography.body }}>
                    {invoiceData.shipping === 0 ? 'FREE' : `$${invoiceData.shipping.toFixed(2)}`}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: spacing.md
                }}>
                  <span style={{ ...typography.body }}>Tax</span>
                  <span style={{ ...typography.body }}>${invoiceData.tax.toFixed(2)}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: spacing.md,
                  borderTop: `1px solid ${colors.gray200}`,
                  fontSize: '20px',
                  fontWeight: '700'
                }}>
                  <span style={{ color: colors.gray900 }}>Total</span>
                  <span style={{ color: colors.primary }}>${invoiceData.total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* What's Next */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.primary}10 0%, ${colors.primary}05 100%)`,
          borderRadius: '12px',
          padding: spacing.lg,
          border: `2px solid ${colors.primary}20`,
          marginBottom: spacing.lg,
          opacity: animationComplete ? 1 : 0,
          transform: animationComplete ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.5s ease-out 0.6s'
        }}>
          <h3 style={{ ...typography.cardTitle, marginBottom: spacing.md }}>What's Next?</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: spacing.md,
            marginTop: spacing.lg
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: colors.white,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: spacing.sm,
                boxShadow: `0 2px 8px ${colors.gray400}`
              }}>
                <Package size={24} color={colors.primary} />
              </div>
              <div style={{ ...typography.small, fontWeight: '600' }}>Order Processing</div>
              <div style={{ ...typography.small }}>1-2 business days</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: colors.white,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: spacing.sm,
                boxShadow: `0 2px 8px ${colors.gray400}`
              }}>
                <Truck size={24} color={colors.primary} />
              </div>
              <div style={{ ...typography.small, fontWeight: '600' }}>Shipping</div>
              <div style={{ ...typography.small }}>3-5 business days</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: colors.white,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: spacing.sm,
                boxShadow: `0 2px 8px ${colors.gray400}`
              }}>
                <Battery size={24} color={colors.primary} />
              </div>
              <div style={{ ...typography.small, fontWeight: '600' }}>Delivery</div>
              <div style={{ ...typography.small }}>Track your order</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: spacing.md,
          justifyContent: 'center',
          flexWrap: 'wrap',
          opacity: animationComplete ? 1 : 0,
          transform: animationComplete ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.5s ease-out 0.7s'
        }}>
          <button
            onClick={handleViewInvoice}
            style={{
              background: colors.primary,
              color: colors.white,
              border: 'none',
              borderRadius: '8px',
              padding: `${spacing.md} ${spacing.lg}`,
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.primaryDark
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary}40`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.primary
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <FileText size={20} />
            View Invoice
          </button>

          <button
            onClick={handlePrintInvoice}
            style={{
              background: colors.white,
              color: colors.gray700,
              border: `2px solid ${colors.gray300}`,
              borderRadius: '8px',
              padding: `${spacing.md} ${spacing.lg}`,
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.gray400
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = `0 4px 12px ${colors.gray400}`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.gray300
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <Printer size={20} />
            Print Invoice
          </button>

          <button
            onClick={() => router.push('/customer/products')}
            style={{
              background: colors.white,
              color: colors.gray700,
              border: `2px solid ${colors.gray300}`,
              borderRadius: '8px',
              padding: `${spacing.md} ${spacing.lg}`,
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.gray400
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = `0 4px 12px ${colors.gray400}`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.gray300
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Continue Shopping
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Contact Info */}
        <div style={{
          marginTop: spacing.xl,
          padding: spacing.lg,
          opacity: animationComplete ? 1 : 0,
          transition: 'all 0.5s ease-out 0.8s'
        }}>
          <p style={{ ...typography.small, marginBottom: spacing.xs }}>
            A confirmation email has been sent to your email address.
          </p>
          <p style={{ ...typography.small }}>
            Questions? Contact us at <strong>support@batterydepartment.com</strong> or call (312) 555-7890
          </p>
        </div>
      </div>
    </div>
  )
}