'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package,
  ShoppingCart,
  Heart,
  Home,
  User,
  CreditCard,
  MapPin,
  LogOut,
  Menu,
  X,
  Search,
  Filter,
  Calendar,
  ChevronRight,
  Eye,
  RefreshCw,
  Download,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Battery,
  FileText,
  ArrowRight,
  HelpCircle
} from 'lucide-react'

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

export default function CustomerOrdersPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  useEffect(() => {
    // Get user from localStorage
    const savedUser = localStorage.getItem('customerUser')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }

    // Load invoices from localStorage and convert to orders format
    const savedInvoices = localStorage.getItem('batteryInvoices')
    if (savedInvoices) {
      const invoices = JSON.parse(savedInvoices)
      
      // Transform invoices to orders format with simulated shipping data
      const transformedOrders = invoices.map((invoice: any) => {
        // Determine order status based on date
        const orderDate = new Date(invoice.date)
        const today = new Date()
        const daysSinceOrder = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
        
        let status = 'Processing'
        let trackingNumber = null
        let estimatedDelivery = null
        let deliveryDate = null
        
        if (daysSinceOrder >= 7) {
          status = 'Delivered'
          trackingNumber = `1Z999AA1${Math.floor(Math.random() * 900000000) + 100000000}`
          deliveryDate = new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        } else if (daysSinceOrder >= 3) {
          status = 'In Transit'
          trackingNumber = `1Z999AA1${Math.floor(Math.random() * 900000000) + 100000000}`
          estimatedDelivery = new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        } else {
          estimatedDelivery = new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        }

        // Format shipping address from customer info
        const customerInfo = invoice.customerInfo || {}
        const shippingAddress = customerInfo.address 
          ? `${customerInfo.address}, ${customerInfo.city}, ${customerInfo.state} ${customerInfo.zipCode}`
          : '123 Main St, Denver, CO 80223'

        return {
          id: invoice.id,
          date: new Date(invoice.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          status,
          total: `$${invoice.total.toFixed(2)}`,
          items: invoice.items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: `$${((item.unitPrice || item.price || 0) * item.quantity).toFixed(2)}`
          })),
          trackingNumber,
          estimatedDelivery,
          deliveryDate,
          shippingAddress,
          originalInvoice: invoice
        }
      })

      // Sort by date (newest first)
      transformedOrders.sort((a: any, b: any) => {
        return new Date(b.originalInvoice.date).getTime() - new Date(a.originalInvoice.date).getTime()
      })

      setOrders(transformedOrders)
    }

    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: colors.gray100 
      }}>
        <div style={{ textAlign: 'center' }}>
          <Battery size={48} color={colors.primary} style={{ marginBottom: spacing.md }} />
          <p style={{ ...typography.body }}>Loading orders...</p>
        </div>
      </div>
    )
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.items.some((item: any) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = selectedStatus === 'all' || order.status.toLowerCase() === selectedStatus.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const handleReorder = (order: any) => {
    // Extract quantities from the original invoice
    const quantities: any = {
      '6Ah': 0,
      '9Ah': 0,
      '15Ah': 0
    }
    
    order.originalInvoice.items.forEach((item: any) => {
      const batteryType = item.type || item.id || item.name?.match(/(\d+Ah)/)?.[1]
      if (batteryType && quantities.hasOwnProperty(batteryType)) {
        quantities[batteryType] = item.quantity
      }
    })
    
    // Save to cart with proper structure and redirect
    const cartData = {
      items: quantities,
      lastUpdated: Date.now(),
      userId: 'guest',
      subtotal: order.originalInvoice.subtotal,
      discount: order.originalInvoice.discount,
      discountPercentage: order.originalInvoice.discountPercentage,
      total: order.originalInvoice.total
    }
    
    // Save to both sessionStorage and localStorage with correct keys
    sessionStorage.setItem('batteryCart', JSON.stringify(cartData))
    localStorage.setItem('batteryCart_backup', JSON.stringify(cartData))
    
    // Also save for persistence
    localStorage.setItem('batteryCart', JSON.stringify(cartData))
    
    router.push('/customer/cart')
  }

  const handleTrackShipment = (trackingNumber: string) => {
    // Simulate tracking link
    window.open(`https://www.ups.com/track?tracknum=${trackingNumber}`, '_blank')
  }

  const handleViewInvoice = (order: any) => {
    sessionStorage.setItem('invoiceData', JSON.stringify(order.originalInvoice))
    router.push('/customer/invoice')
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: colors.gray100,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: `linear-gradient(to right, ${colors.primary}, ${colors.primaryDark})`,
        position: 'sticky',
        top: 0,
        zIndex: 20
      }}>
        <div style={{ 
          padding: `${spacing.lg} ${spacing.xl}`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <Package size={28} color={colors.white} />
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: colors.white }}>Order History</h1>
          </div>
          <button
            onClick={() => router.push('/customer/products')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
              color: colors.white,
              padding: `${spacing.sm} ${spacing.lg}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
            }}
          >
            <ShoppingCart size={16} />
            Continue Shopping
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ padding: spacing.xl }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Page header */}
          <div style={{ marginBottom: spacing.xl }}>
            <p style={{ ...typography.body }}>Track your battery orders and shipments</p>
          </div>

          {/* Search and filters */}
          <div style={{ marginBottom: spacing.lg, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                <Search size={20} style={{
                  position: 'absolute',
                  left: spacing.md,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: colors.gray500
                }} />
                <input
                  type="text"
                  placeholder="Search orders or products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: `${spacing.md} ${spacing.md} ${spacing.md} ${spacing.xxl}`,
                    border: `2px solid ${colors.gray200}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: colors.white
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary
                    e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.gray200
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            {/* Status filters */}
            <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
              {['all', 'processing', 'in transit', 'delivered'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  style={{
                    padding: `${spacing.sm} ${spacing.lg}`,
                    borderRadius: '8px',
                    border: '2px solid',
                    borderColor: selectedStatus === status ? colors.primary : colors.gray200,
                    backgroundColor: selectedStatus === status ? colors.primary : colors.white,
                    color: selectedStatus === status ? colors.white : colors.gray700,
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedStatus !== status) {
                      e.currentTarget.style.borderColor = colors.gray300
                      e.currentTarget.style.backgroundColor = colors.gray100
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedStatus !== status) {
                      e.currentTarget.style.borderColor = colors.gray200
                      e.currentTarget.style.backgroundColor = colors.white
                    }
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Orders list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
            {filteredOrders.map((order) => (
              <div key={order.id} style={{
                backgroundColor: colors.white,
                borderRadius: '12px',
                border: `2px solid ${colors.gray200}`,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                transform: hoveredCard === order.id ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: hoveredCard === order.id ? `0 12px 24px ${colors.gray400}` : 'none'
              }}
              onMouseEnter={() => setHoveredCard(order.id)}
              onMouseLeave={() => setHoveredCard(null)}>
                <div style={{
                  padding: spacing.lg,
                  borderBottom: expandedOrder === order.id ? `2px solid ${colors.gray200}` : 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'start', 
                    marginBottom: spacing.md 
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs }}>
                        <h3 style={{ ...typography.cardTitle }}>{order.id}</h3>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: `${spacing.xs} ${spacing.md}`,
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: order.status === 'Delivered' ? colors.successLight : 
                                         order.status === 'In Transit' ? colors.warningLight : 
                                         order.status === 'Processing' ? `${colors.primary}10` : colors.gray100,
                          color: order.status === 'Delivered' ? colors.successDark : 
                                order.status === 'In Transit' ? colors.warning : 
                                order.status === 'Processing' ? colors.primary : colors.gray600
                        }}>
                          {order.status === 'Delivered' && <CheckCircle size={14} style={{ marginRight: spacing.xs }} />}
                          {order.status === 'In Transit' && <Truck size={14} style={{ marginRight: spacing.xs }} />}
                          {order.status === 'Processing' && <Clock size={14} style={{ marginRight: spacing.xs }} />}
                          {order.status}
                        </span>
                      </div>
                      <p style={{ ...typography.body }}>{order.date}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '20px', fontWeight: '700', color: colors.primary }}>{order.total}</p>
                      <p style={{ ...typography.small }}>{order.items.length} items</p>
                    </div>
                  </div>

                  {/* Order items preview */}
                  <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' }}>
                    {order.items.slice(0, 2).map((item: any, index: number) => (
                      <span key={index} style={{
                        padding: `${spacing.sm} ${spacing.md}`,
                        backgroundColor: `${colors.primary}10`,
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: colors.primary,
                        fontWeight: '500'
                      }}>
                        {item.quantity}× {item.name}
                      </span>
                    ))}
                    {order.items.length > 2 && (
                      <span style={{
                        padding: `${spacing.sm} ${spacing.md}`,
                        backgroundColor: colors.gray100,
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: colors.gray600,
                        fontWeight: '500'
                      }}>
                        +{order.items.length - 2} more
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
                    {order.trackingNumber && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTrackShipment(order.trackingNumber!)
                        }}
                        style={{
                          padding: `${spacing.sm} ${spacing.lg}`,
                          backgroundColor: colors.primary,
                          color: colors.white,
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.sm,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.primaryDark
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = colors.primary
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        <Truck size={16} />
                        Track Shipment
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReorder(order)
                      }}
                      style={{
                        padding: `${spacing.sm} ${spacing.lg}`,
                        border: `2px solid ${colors.gray200}`,
                        backgroundColor: colors.white,
                        color: colors.primary,
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.gray100
                        e.currentTarget.style.borderColor = colors.primary
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.white
                        e.currentTarget.style.borderColor = colors.gray200
                      }}
                    >
                      <RefreshCw size={16} />
                      Reorder
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push('/customer/support?order=' + order.orderNumber)
                      }}
                      style={{
                        padding: `${spacing.sm} ${spacing.lg}`,
                        border: `2px solid ${colors.gray200}`,
                        backgroundColor: colors.white,
                        color: colors.gray700,
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.primary
                        e.currentTarget.style.color = colors.white
                        e.currentTarget.style.borderColor = colors.primary
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.white
                        e.currentTarget.style.color = colors.gray700
                        e.currentTarget.style.borderColor = colors.gray200
                      }}
                    >
                      <HelpCircle size={16} />
                      Get Help
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewInvoice(order)
                      }}
                      style={{
                        padding: `${spacing.sm} ${spacing.lg}`,
                        border: `2px solid ${colors.gray200}`,
                        backgroundColor: colors.white,
                        color: colors.gray700,
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.gray100
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.white
                      }}
                    >
                      <FileText size={16} />
                      Invoice
                    </button>
                  </div>
                </div>

                {/* Expanded order details */}
                {expandedOrder === order.id && (
                  <div style={{ padding: spacing.lg, backgroundColor: colors.gray100 }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                      gap: spacing.lg 
                    }}>
                      {/* Order items */}
                      <div>
                        <h4 style={{ 
                          ...typography.label, 
                          textTransform: 'uppercase',
                          marginBottom: spacing.md 
                        }}>
                          Order Items
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                          {order.items.map((item: any, index: number) => (
                            <div key={index} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: spacing.md,
                              backgroundColor: colors.white,
                              borderRadius: '8px',
                              border: `2px solid ${colors.gray200}`
                            }}>
                              <div>
                                <p style={{ fontWeight: '600', color: colors.gray900 }}>{item.name}</p>
                                <p style={{ ...typography.small }}>Quantity: {item.quantity}</p>
                              </div>
                              <p style={{ fontWeight: '700', color: colors.primary }}>{item.price}</p>
                            </div>
                          ))}
                        </div>
                        
                        {/* Order totals */}
                        <div style={{
                          marginTop: spacing.md,
                          padding: spacing.md,
                          backgroundColor: colors.white,
                          borderRadius: '8px',
                          border: `2px solid ${colors.gray200}`
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                            <span style={{ ...typography.body }}>Subtotal</span>
                            <span style={{ ...typography.body }}>
                              ${order.originalInvoice.subtotal.toFixed(2)}
                            </span>
                          </div>
                          {order.originalInvoice.discount > 0 && (
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              marginBottom: spacing.xs,
                              color: colors.success 
                            }}>
                              <span style={{ fontWeight: '600' }}>
                                Discount ({order.originalInvoice.discountPercentage}%)
                              </span>
                              <span style={{ fontWeight: '600' }}>
                                -${order.originalInvoice.discount.toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            paddingTop: spacing.sm,
                            borderTop: `1px solid ${colors.gray200}`,
                            fontWeight: '700'
                          }}>
                            <span>Total</span>
                            <span style={{ color: colors.primary }}>{order.total}</span>
                          </div>
                        </div>
                      </div>

                      {/* Shipping information */}
                      <div>
                        <h4 style={{ 
                          ...typography.label, 
                          textTransform: 'uppercase',
                          marginBottom: spacing.md 
                        }}>
                          Shipping Information
                        </h4>
                        <div style={{
                          padding: spacing.lg,
                          backgroundColor: colors.white,
                          borderRadius: '8px',
                          border: `2px solid ${colors.gray200}`
                        }}>
                          <div style={{ marginBottom: spacing.md }}>
                            <p style={{ ...typography.label, marginBottom: spacing.xs }}>Shipping Address</p>
                            <p style={{ fontWeight: '500', color: colors.gray900 }}>{order.shippingAddress}</p>
                          </div>
                          {order.trackingNumber && (
                            <div style={{ marginBottom: spacing.md }}>
                              <p style={{ ...typography.label, marginBottom: spacing.xs }}>Tracking Number</p>
                              <p style={{ 
                                color: colors.primary, 
                                fontFamily: 'monospace', 
                                fontWeight: '600' 
                              }}>
                                {order.trackingNumber}
                              </p>
                            </div>
                          )}
                          <div>
                            <p style={{ ...typography.label, marginBottom: spacing.xs }}>
                              {order.status === 'Delivered' ? 'Delivered On' : 'Estimated Delivery'}
                            </p>
                            <p style={{ fontWeight: '500', color: colors.gray900 }}>
                              {order.deliveryDate || order.estimatedDelivery}
                            </p>
                          </div>
                          
                          {/* Shipping status indicator */}
                          <div style={{
                            marginTop: spacing.lg,
                            padding: spacing.md,
                            backgroundColor: 
                              order.status === 'Delivered' ? colors.successLight : 
                              order.status === 'In Transit' ? colors.warningLight : 
                              `${colors.primary}10`,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.sm
                          }}>
                            {order.status === 'Delivered' && <CheckCircle size={16} color={colors.successDark} />}
                            {order.status === 'In Transit' && <Truck size={16} color={colors.warning} />}
                            {order.status === 'Processing' && <Clock size={16} color={colors.primary} />}
                            <span style={{ 
                              fontWeight: '600',
                              color: 
                                order.status === 'Delivered' ? colors.successDark : 
                                order.status === 'In Transit' ? colors.warning : 
                                colors.primary
                            }}>
                              {order.status === 'Delivered' && 'Package delivered successfully'}
                              {order.status === 'In Transit' && 'Package is on the way'}
                              {order.status === 'Processing' && 'Order is being prepared'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredOrders.length === 0 && (
            <div style={{
              backgroundColor: colors.white,
              borderRadius: '12px',
              border: `2px solid ${colors.gray200}`,
              padding: spacing.xxl,
              textAlign: 'center'
            }}>
              <Package size={48} style={{ color: colors.gray300, margin: `0 auto ${spacing.md}` }} />
              <h3 style={{ ...typography.cardTitle, marginBottom: spacing.sm }}>
                No orders found
              </h3>
              <p style={{ ...typography.body, marginBottom: spacing.lg }}>
                {searchTerm ? `No orders matching "${searchTerm}"` : 'You haven\'t placed any orders yet'}
              </p>
              <button
                onClick={() => router.push('/customer/products')}
                style={{
                  background: colors.primary,
                  color: colors.white,
                  border: 'none',
                  borderRadius: '8px',
                  padding: `${spacing.md} ${spacing.xl}`,
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
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
                <Battery size={20} />
                Shop Batteries
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}