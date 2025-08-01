'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle, 
  ArrowRight,
  CreditCard,
  FileText,
  TrendingUp,
  Package,
  Truck,
  Shield,
  Zap,
  AlertCircle,
  Loader2
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
};

const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px'
};

const typography = {
  title: { fontSize: '24px', fontWeight: '700', color: colors.gray900 },
  sectionTitle: { fontSize: '20px', fontWeight: '600', color: colors.gray900 },
  productTitle: { fontSize: '16px', fontWeight: '600', color: colors.gray900 },
  price: { fontSize: '20px', fontWeight: '700', color: colors.gray900 },
  body: { fontSize: '14px', fontWeight: '400', color: colors.gray700 },
  label: { fontSize: '12px', fontWeight: '500', color: colors.gray600 },
  small: { fontSize: '12px', fontWeight: '400', color: colors.gray500 }
};

// Battery data (matching products page)
const batteriesData = [
  {
    id: '6Ah',
    name: '6Ah FlexVolt Battery',
    runtime: 'Up to 4 hours',
    weight: '1.9 lbs',
    price: 149,
    msrp: 149,
    voltage: "20V/60V",
    features: "Compatible with all DeWalt 20V/60V tools",
    workOutput: '225 screws / 175 ft cuts',
    chargingTime: '45 minutes',
    savings: 44,
    popular: false
  },
  {
    id: '9Ah',
    name: '9Ah FlexVolt Battery',
    runtime: 'Up to 6.5 hours',
    weight: '2.4 lbs',
    price: 239,
    msrp: 239,
    voltage: "20V/60V",
    features: "Compatible with all DeWalt 20V/60V tools",
    workOutput: '340 screws / 260 ft cuts',
    chargingTime: '55 minutes',
    savings: 50,
    popular: true
  },
  {
    id: '15Ah',
    name: '15Ah FlexVolt Battery',
    runtime: 'Up to 10 hours',
    weight: '3.2 lbs',
    price: 359,
    msrp: 359,
    voltage: "20V/60V",
    features: "Compatible with all DeWalt 20V/60V tools",
    workOutput: '560 screws / 430 ft cuts',
    chargingTime: '90 minutes',
    savings: 35,
    popular: false
  }
];

const discountTiers = [
  { threshold: 1000, percentage: 10 },
  { threshold: 2500, percentage: 15 },
  { threshold: 5000, percentage: 20 }
];

// Cart Item Component
const CartItemCard = ({ item, onUpdateQuantity, onRemove }: any) => {
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const battery = batteriesData.find(b => b.id === item.id);
  
  if (!battery) return null;
  
  // Check if this is a custom engraved battery
  const isCustomEngraved = item.customization && (item.customization.previewImage || item.customization.text);

  const handleQuantityChange = (newQuantity: number) => {
    setLocalQuantity(newQuantity);
    setIsUpdating(true);
    setTimeout(() => {
      onUpdateQuantity(item.id, newQuantity - item.quantity);
      setIsUpdating(false);
    }, 500);
  };

  return (
    <div style={{
      backgroundColor: colors.white,
      border: `1px solid ${colors.gray300}`,
      borderRadius: '8px',
      padding: spacing.lg,
      marginBottom: spacing.md,
      transition: 'all 0.2s ease'
    }}>
      <div style={{ display: 'flex', gap: spacing.lg }}>
        {/* Custom Battery Preview Image */}
        {isCustomEngraved && item.customization?.previewImage && (
          <div style={{ flexShrink: 0 }}>
            <img
              src={item.customization.previewImage}
              alt="Custom Battery Preview"
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '2px solid #E6F4FF',
                backgroundColor: colors.gray100,
                imageRendering: 'crisp-edges'
              }}
            />
          </div>
        )}
        
        {/* Product Info */}
        <div style={{ flex: 1 }}>
          <h3 style={typography.productTitle}>{battery.name}</h3>
          <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.sm }}>
            <span style={typography.small}>{battery.voltage} MAX</span>
            <span style={typography.small}>•</span>
            <span style={typography.small}>{battery.runtime}</span>
            <span style={typography.small}>•</span>
            <span style={typography.small}>{battery.chargingTime} charge</span>
          </div>
          
          {/* Custom Engraving Info */}
          {isCustomEngraved && (
            <div style={{ marginTop: spacing.sm, marginBottom: spacing.sm }}>
              <div style={{
                backgroundColor: colors.successLight,
                padding: '6px 12px',
                borderRadius: '6px',
                display: 'inline-block'
              }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: colors.successDark
                }}>
                  ✓ Custom Engraved
                </span>
              </div>
              {item.customization?.text && (
                <p style={{
                  ...typography.small,
                  color: colors.primary,
                  marginTop: '4px',
                  fontWeight: '500'
                }}>
                  Text: "{item.customization.text}"
                </p>
              )}
            </div>
          )}
          
          {/* Price */}
          <div style={{ marginTop: spacing.md }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: spacing.sm }}>
              <span style={typography.price}>${battery.price}</span>
              <span style={{ 
                ...typography.small, 
                textDecoration: 'line-through',
                color: colors.gray500 
              }}>
                ${battery.msrp}
              </span>
              <span style={{
                backgroundColor: colors.successLight,
                color: colors.successDark,
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                Save {battery.savings}%
              </span>
            </div>
          </div>
        </div>

        {/* Quantity Controls */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: spacing.sm
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <button
              onClick={() => handleQuantityChange(Math.max(0, localQuantity - 1))}
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: colors.white,
                border: `1px solid ${colors.gray300}`,
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.gray100;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.white;
              }}
            >
              <Minus size={16} />
            </button>
            
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={localQuantity}
                onChange={(e) => handleQuantityChange(Math.max(0, parseInt(e.target.value) || 0))}
                style={{
                  width: '80px',
                  height: '36px',
                  textAlign: 'center',
                  border: `1px solid ${colors.gray300}`,
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: '500',
                  appearance: 'textfield',
                  MozAppearance: 'textfield',
                  WebkitAppearance: 'none'
                }}
              />
              {isUpdating && (
                <div style={{
                  position: 'absolute',
                  right: '4px',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}>
                  <Loader2 size={14} color={colors.gray500} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              )}
            </div>
            
            <button
              onClick={() => handleQuantityChange(localQuantity + 1)}
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: colors.white,
                border: `1px solid ${colors.gray300}`,
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.gray100;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.white;
              }}
            >
              <Plus size={16} />
            </button>
          </div>
          
          <button
            onClick={() => onRemove(item.id)}
            style={{
              color: colors.error,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            <Trash2 size={14} />
            Remove
          </button>
        </div>

        {/* Line Total */}
        <div style={{ 
          textAlign: 'right',
          minWidth: '100px'
        }}>
          <p style={typography.label}>Line Total</p>
          <p style={typography.price}>
            ${(battery.price * localQuantity).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

// Enhanced Volume Discount Progress Component (matching products page)
const VolumeDiscountProgress = ({ currentAmount, discountTiers }: any) => {
  const maxAmount = discountTiers[discountTiers.length - 1].threshold;
  const progressPercentage = Math.min((currentAmount / maxAmount) * 100, 100);
  
  const activeDiscount = discountTiers.reduce((acc: any, tier: any) => {
    return currentAmount >= tier.threshold ? tier : acc;
  }, null);
  
  const nextTier = discountTiers.find((tier: any) => tier.threshold > currentAmount);
  const amountToNext = nextTier ? nextTier.threshold - currentAmount : 0;
  const extraSavings = nextTier && activeDiscount 
    ? (currentAmount * (nextTier.percentage - (activeDiscount?.percentage || 0)) / 100).toFixed(0)
    : nextTier ? (currentAmount * nextTier.percentage / 100).toFixed(0) : 0;
  
  return (
    <div style={{
      backgroundColor: colors.white,
      border: `1px solid ${colors.gray300}`,
      borderRadius: '8px',
      padding: spacing.lg,
      marginBottom: spacing.lg
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: spacing.lg 
      }}>
        <h2 style={typography.sectionTitle}>
          Volume Discount Progress
        </h2>
        {activeDiscount && (
          <span style={{
            color: colors.success,
            fontSize: '14px',
            fontWeight: '600'
          }}>
            Currently: {activeDiscount.percentage}% off
          </span>
        )}
      </div>
      
      {/* Enhanced Progress bar */}
      <div style={{ marginBottom: spacing.lg, position: 'relative', padding: '4px 0' }}>
        <div style={{
          position: 'relative',
          height: '44px',
          backgroundColor: colors.gray200,
          borderRadius: '22px',
          overflow: 'visible',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
        }}>
          {/* Background track with subtle pattern */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '20px',
            opacity: 0.5,
            background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.02) 10px, rgba(0,0,0,0.02) 20px)'
          }} />
          
          {/* Progress fill with animated gradient */}
          <div style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            height: 'calc(100% - 8px)',
            width: `calc(${progressPercentage}% - 8px)`,
            background: `linear-gradient(90deg, ${colors.primaryLight} 0%, ${colors.primary} 50%, ${colors.primaryDark} 100%)`,
            backgroundSize: '200% 100%',
            borderRadius: '16px',
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
            animation: 'shimmer 3s linear infinite'
          }}>
            {/* Animated progress indicator */}
            {progressPercentage < 100 && (
              <div style={{
                position: 'absolute',
                right: '-4px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '32px',
                height: '32px',
                backgroundColor: colors.white,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15)',
                border: `2px solid ${colors.primary}`
              }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: colors.primary, letterSpacing: '-0.5px' }}>
                  {Math.round(progressPercentage)}%
                </span>
              </div>
            )}
          </div>
          
          {/* Tier markers */}
          {discountTiers.map((tier: any, index: number) => {
            const position = (tier.threshold / maxAmount) * 100;
            const isActive = activeDiscount && tier.threshold === activeDiscount.threshold;
            const isPassed = currentAmount >= tier.threshold;
            const isNext = nextTier && tier.threshold === nextTier.threshold;
            const showProgressHere = progressPercentage >= 100 && index === discountTiers.length - 1;
            
            return (
              <div
                key={tier.threshold}
                style={{
                  position: 'absolute',
                  left: `${position}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing.xs
                }}
              >
                {/* Marker */}
                <div style={{
                  width: isActive ? '32px' : '28px',
                  height: isActive ? '32px' : '28px',
                  borderRadius: '50%',
                  backgroundColor: isPassed ? colors.primary : colors.white,
                  border: `3px solid ${isPassed ? colors.primary : isNext ? colors.warning : colors.gray400}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  transition: 'all 0.3s ease',
                  boxShadow: isActive ? '0 0 0 4px rgba(37, 99, 235, 0.15)' : 'none',
                  position: 'relative',
                  fontSize: '0',
                  lineHeight: '0'
                }}>
                  {isPassed ? (
                    <CheckCircle size={16} color={colors.white} strokeWidth={3} />
                  ) : (
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      color: isNext ? colors.warning : colors.gray600,
                      letterSpacing: '0',
                      lineHeight: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {tier.percentage}%
                    </span>
                  )}
                  {isNext && (
                    <div style={{
                      position: 'absolute',
                      width: 'calc(100% + 8px)',
                      height: 'calc(100% + 8px)',
                      borderRadius: '50%',
                      border: `2px solid ${colors.warning}`,
                      animation: 'pulse 2s ease-in-out infinite',
                      top: '-4px',
                      left: '-4px'
                    }} />
                  )}
                  {/* Show 100% indicator at last tier when progress is complete */}
                  {showProgressHere && (
                    <div style={{
                      position: 'absolute',
                      right: '-40px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '32px',
                      height: '32px',
                      backgroundColor: colors.success,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)',
                      border: `3px solid ${colors.white}`,
                      zIndex: 3
                    }}>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: '700', 
                        color: colors.white, 
                        letterSpacing: '0',
                        lineHeight: '1'
                      }}>
                        100%
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Label */}
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  marginTop: spacing.md,
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}>
                  <p style={{ 
                    ...typography.label,
                    fontWeight: isActive || isNext ? '700' : '500',
                    color: isActive ? colors.primary : isNext ? colors.warning : colors.gray600
                  }}>
                    {tier.percentage}% off
                  </p>
                  <p style={{ ...typography.small, color: colors.gray500 }}>
                    ${tier.threshold.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Status messages */}
      <div style={{ marginTop: '70px' }}>
        {activeDiscount && (
          <div style={{
            backgroundColor: colors.successLight,
            padding: spacing.md,
            borderRadius: '6px',
            marginBottom: spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            <CheckCircle size={16} color={colors.successDark} />
            <p style={{ ...typography.body, color: colors.successDark, fontWeight: '600' }}>
              You're getting {activeDiscount.percentage}% off your order!
            </p>
          </div>
        )}
        
        {nextTier && (
          <div style={{
            backgroundColor: colors.warningLight,
            padding: spacing.md,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: spacing.sm
          }}>
            <span style={{ fontSize: '20px' }}>🎯</span>
            <div>
              <p style={{ ...typography.body, color: colors.gray900, fontWeight: '600' }}>
                Add ${amountToNext.toLocaleString()} more to unlock {nextTier.percentage}% off
              </p>
              {extraSavings > 0 && (
                <p style={{ ...typography.small, color: colors.gray700, marginTop: '4px' }}>
                  Save an extra ${extraSavings} on your current order
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function CartPage() {
  const router = useRouter()
  const [quantities, setQuantities] = useState<{[key: string]: number}>({
    '6Ah': 0,
    '9Ah': 0,
    '15Ah': 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load cart from sessionStorage and localStorage on mount
  useEffect(() => {
    // First try sessionStorage (most recent from products page)
    const savedCart = sessionStorage.getItem('batteryCart')
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart)
        if (cartData.items) {
          setQuantities(cartData.items)
        }
      } catch (error) {
        console.error('Failed to load cart from session:', error)
      }
    } else {
      // Fallback to localStorage
      const savedCart = localStorage.getItem('batteryCart_backup')
      if (savedCart) {
        try {
          const cartData = JSON.parse(savedCart)
          if (cartData.items) {
            setQuantities(cartData.items)
          }
        } catch (error) {
          console.error('Failed to load cart from localStorage:', error)
        }
      }
    }
    
    // Also check for custom engraved items in localStorage
    try {
      const customCartStr = localStorage.getItem('cart')
      if (customCartStr) {
        const customCart = JSON.parse(customCartStr)
        if (customCart.items && customCart.items.length > 0) {
          // Merge custom items with existing quantities
          const updatedQuantities = { ...quantities }
          customCart.items.forEach((item: any) => {
            // Extract battery type from productId (e.g., 'flexvolt-6ah-engraved' -> '6Ah')
            const match = item.productId?.match(/(\d+ah)/i)
            if (match) {
              const batteryType = match[1].charAt(0).toUpperCase() + match[1].slice(1) // Convert to '6Ah' format
              updatedQuantities[batteryType] = (updatedQuantities[batteryType] || 0) + item.quantity
            }
          })
          setQuantities(updatedQuantities)
        }
      }
    } catch (error) {
      console.error('Failed to load custom cart items:', error)
    }
    
    setIsLoading(false)
  }, [])

  // Save cart whenever it changes
  useEffect(() => {
    if (!isLoading) {
      const cartData = {
        items: quantities,
        lastUpdated: Date.now(),
        userId: 'guest'
      }
      
      sessionStorage.setItem('batteryCart', JSON.stringify(cartData))
      localStorage.setItem('batteryCart_backup', JSON.stringify(cartData))
    }
  }, [quantities, isLoading])

  // Add CSS for animations
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.1); }
      }
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      /* Remove number input spinners */
      input[type=number]::-webkit-inner-spin-button,
      input[type=number]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type=number] {
        -moz-appearance: textfield;
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  const updateQuantity = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, prev[id] + delta)
    }))
  }

  const removeItem = (id: string) => {
    setQuantities(prev => ({
      ...prev,
      [id]: 0
    }))
  }

  // Calculate totals and include custom items data
  const cartItems = Object.entries(quantities)
    .filter(([_, qty]) => qty > 0)
    .map(([id, quantity]) => {
      // Check for custom item data
      const existingCartStr = localStorage.getItem('cart')
      const existingCart = existingCartStr ? JSON.parse(existingCartStr) : { items: [] }
      const customItem = existingCart.items.find((item: any) => 
        item.productId && item.productId.includes(id.toLowerCase()) && item.customization
      )
      
      return { 
        id, 
        quantity,
        customization: customItem?.customization || null
      }
    })

  const subtotal = Object.entries(quantities).reduce((sum, [battery, qty]) => {
    const batteryData = batteriesData.find(b => b.id === battery)
    return sum + (batteryData ? batteryData.price * qty : 0)
  }, 0)

  // Calculate discount
  let discountPercentage = 0
  for (const tier of [...discountTiers].reverse()) {
    if (subtotal >= tier.threshold) {
      discountPercentage = tier.percentage
      break
    }
  }

  const discountAmount = Math.round(subtotal * (discountPercentage / 100))
  const total = subtotal - discountAmount

  const handleCheckout = () => {
    // Load existing cart items from localStorage (for custom engraved items)
    const existingCartStr = localStorage.getItem('cart')
    const existingCart = existingCartStr ? JSON.parse(existingCartStr) : { items: [] }
    
    // Prepare order data for checkout
    const orderItems = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([batteryId, qty]) => {
        const battery = batteriesData.find(b => b.id === batteryId)
        
        // Check if there's a custom engraved version of this battery in cart
        const customItem = existingCart.items.find((item: any) => 
          item.productId && item.productId.includes(batteryId.toLowerCase()) && item.customization
        )
        
        return {
          id: batteryId,
          type: batteryId,
          name: battery?.name || '',
          price: battery?.price || 0,
          unitPrice: battery?.price || 0,
          quantity: qty,
          total: (battery?.price || 0) * qty,
          customization: customItem?.customization || null
        }
      })

    // Check if any items have custom preview images
    const hasCustomPreview = orderItems.some(item => item.customization?.previewImage)
    
    const orderData = {
      items: orderItems,
      quantities,
      subtotal,
      discount: discountAmount,
      discountPercentage,
      total,
      orderDate: new Date().toISOString(),
      isEngraved: orderItems.some(item => item.customization),
      engravingText: orderItems.find(item => item.customization?.text)?.customization?.text,
      previewImage: orderItems.find(item => item.customization?.previewImage)?.customization?.previewImage
    }
    
    sessionStorage.setItem('orderData', JSON.stringify(orderData))
    sessionStorage.setItem('cartData', JSON.stringify(orderData))
    router.push('/customer/checkout')
  }

  const handleInvoice = () => {
    // Load existing cart items for custom data
    const existingCartStr = localStorage.getItem('cart')
    const existingCart = existingCartStr ? JSON.parse(existingCartStr) : { items: [] }
    
    // Prepare invoice data
    const invoiceItems = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([batteryId, qty]) => {
        const battery = batteriesData.find(b => b.id === batteryId)
        const customItem = existingCart.items.find((item: any) => 
          item.productId && item.productId.includes(batteryId.toLowerCase()) && item.customization
        )
        
        const isCustom = !!customItem?.customization
        const description = isCustom 
          ? `${battery?.voltage} MAX FlexVolt Battery - Custom Engraved`
          : `${battery?.voltage} MAX FlexVolt Battery`
        
        return {
          type: batteryId,
          product: battery?.name || '',
          description,
          quantity: qty,
          unitPrice: battery?.price || 0,
          total: (battery?.price || 0) * qty,
          customization: customItem?.customization || null
        }
      })

    if (invoiceItems.length === 0) {
      alert('Please add items to your cart before generating an invoice.')
      return
    }

    const invoiceData = {
      items: invoiceItems,
      subtotal,
      discount: discountAmount,
      discountPercentage,
      total,
      generatedAt: new Date().toISOString(),
      isEngraved: invoiceItems.some(item => item.customization),
      engravingText: invoiceItems.find(item => item.customization?.text)?.customization?.text,
      previewImage: invoiceItems.find(item => item.customization?.previewImage)?.customization?.previewImage
    }

    sessionStorage.setItem('invoiceData', JSON.stringify(invoiceData))
    router.push('/customer/invoice')
  }

  if (isLoading) {
    return (
      <div style={{ 
        backgroundColor: colors.gray100,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Loader2 size={40} color={colors.primary} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ 
      backgroundColor: colors.gray100,
      minHeight: '100vh',
      paddingBottom: isMobile && subtotal > 0 ? '80px' : 0
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: colors.primary,
        color: colors.white,
        padding: `${spacing.md} 0`
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: `0 ${spacing.lg}`,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md
        }}>
          <ShoppingCart size={24} />
          <h1 style={{ ...typography.title, color: colors.white }}>
            Shopping Cart
          </h1>
          <span style={{
            backgroundColor: colors.warningLight,
            color: colors.gray900,
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
            marginLeft: 'auto'
          }}>
            {cartItems.length} {cartItems.length === 1 ? 'ITEM' : 'ITEMS'}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: spacing.xl,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 380px',
        gap: spacing.xl
      }}>
        {/* Left Column - Cart Items */}
        <div>
          {/* Volume Discount Progress */}
          {subtotal > 0 && (
            <VolumeDiscountProgress
              currentAmount={subtotal}
              discountTiers={discountTiers}
            />
          )}

          {/* Cart Items */}
          <div>
            <h2 style={{ ...typography.sectionTitle, marginBottom: spacing.lg }}>
              Cart Items
            </h2>
            
            {cartItems.length === 0 ? (
              <div style={{
                backgroundColor: colors.white,
                border: `1px solid ${colors.gray300}`,
                borderRadius: '8px',
                padding: spacing.xl,
                textAlign: 'center'
              }}>
                <ShoppingCart size={48} color={colors.gray400} style={{ marginBottom: spacing.md }} />
                <p style={typography.body}>Your cart is empty</p>
                <button
                  onClick={() => router.push('/customer/products')}
                  style={{
                    marginTop: spacing.lg,
                    padding: '12px 24px',
                    backgroundColor: colors.primary,
                    color: colors.white,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primaryDark
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.35)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cartItems.map(item => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column - Order Summary */}
        {!isMobile && (
          <div style={{ position: 'sticky', top: spacing.lg, height: 'fit-content' }}>
            <OrderSummaryCard
              subtotal={subtotal}
              discountAmount={discountAmount}
              discountPercentage={discountPercentage}
              total={total}
              onCheckout={handleCheckout}
              onInvoice={handleInvoice}
            />
          </div>
        )}
      </div>

      {/* Mobile Sticky Footer */}
      {isMobile && subtotal > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.white,
          borderTop: `2px solid ${colors.gray300}`,
          padding: spacing.md,
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)',
          zIndex: 100
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.sm
          }}>
            <span style={typography.body}>Total:</span>
            <span style={{ ...typography.price, color: colors.primary }}>
              ${total.toLocaleString()}
            </span>
          </div>
          <button
            onClick={handleCheckout}
            style={{
              width: '100%',
              backgroundColor: colors.primary,
              color: colors.white,
              padding: '12px 24px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm
            }}
          >
            <CreditCard size={20} />
            Checkout
          </button>
        </div>
      )}
    </div>
  )
}

// Order Summary Card Component
const OrderSummaryCard = ({ subtotal, discountAmount, discountPercentage, total, onCheckout, onInvoice }: any) => {
  return (
    <div style={{
      backgroundColor: colors.white,
      border: `1px solid ${colors.gray300}`,
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: spacing.lg,
        borderBottom: `1px solid ${colors.gray300}`,
        backgroundColor: colors.gray50
      }}>
        <h2 style={typography.sectionTitle}>Order Summary</h2>
      </div>
      
      <div style={{ padding: spacing.lg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <span style={typography.body}>Subtotal:</span>
          <span style={typography.body}>${subtotal.toLocaleString()}</span>
        </div>
        {discountAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <span style={{ ...typography.body, color: colors.success }}>
              Volume Discount ({discountPercentage}%):
            </span>
            <span style={{ ...typography.body, color: colors.success }}>
              -${discountAmount.toLocaleString()}
            </span>
          </div>
        )}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          paddingTop: spacing.sm,
          borderTop: `1px solid ${colors.gray300}`
        }}>
          <span style={typography.sectionTitle}>Total:</span>
          <span style={{ ...typography.price, color: colors.primary }}>
            ${total.toLocaleString()}
          </span>
        </div>
      </div>
      
      <div style={{ padding: spacing.lg, paddingTop: 0, display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        <button
          onClick={onCheckout}
          disabled={subtotal === 0}
          style={{
            width: '100%',
            backgroundColor: subtotal > 0 ? colors.primary : colors.gray300,
            color: colors.white,
            padding: '12px 24px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
            cursor: subtotal > 0 ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (subtotal > 0) {
              e.currentTarget.style.backgroundColor = colors.primaryDark
            }
          }}
          onMouseLeave={(e) => {
            if (subtotal > 0) {
              e.currentTarget.style.backgroundColor = colors.primary
            }
          }}
        >
          <CreditCard size={20} />
          Checkout
        </button>
        <button
          onClick={onInvoice}
          disabled={subtotal === 0}
          style={{
            width: '100%',
            backgroundColor: colors.white,
            color: colors.primary,
            padding: '12px 24px',
            borderRadius: '6px',
            border: `2px solid ${colors.primary}`,
            fontSize: '16px',
            fontWeight: '600',
            cursor: subtotal > 0 ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            transition: 'all 0.2s',
            opacity: subtotal === 0 ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (subtotal > 0) {
              e.currentTarget.style.backgroundColor = colors.gray50
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.white
          }}
        >
          <FileText size={20} />
          Get Invoice
        </button>
      </div>
    </div>
  )
}