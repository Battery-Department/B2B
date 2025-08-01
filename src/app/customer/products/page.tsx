'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, CreditCard, FileText, Truck, Shield, Package, 
  Battery, CheckCircle, Trash2, Plus, Minus, Info, TrendingUp,
  Edit2, Save, X, Check, Sparkles, Zap, Clock, Loader2
} from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Design System
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

// Battery data
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

// Enhanced Product Card Component with Original Quantity Selector
const ProductCard = ({ product, quantity, onUpdateQuantity, showSuccess, onShowSuccess }: any) => {
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Sync local quantity with parent quantity
  useEffect(() => {
    setLocalQuantity(quantity);
  }, [quantity]);
  
  // Auto-update cart after delay
  useEffect(() => {
    if (localQuantity !== quantity) {
      clearTimeout(updateTimeoutRef.current);
      setIsUpdating(true);
      
      updateTimeoutRef.current = setTimeout(() => {
        onUpdateQuantity(product.id, localQuantity - quantity);
        setIsUpdating(false);
        if (localQuantity > quantity && onShowSuccess) {
          onShowSuccess(product.id);
        }
      }, 800); // 800ms delay for auto-update
    } else {
      // If quantities match, ensure spinner is hidden
      setIsUpdating(false);
    }
    
    return () => {
      clearTimeout(updateTimeoutRef.current);
      setIsUpdating(false);
    };
  }, [localQuantity, quantity, product.id, onUpdateQuantity, onShowSuccess]);
  
  const lineTotal = product.price * localQuantity;
  
  return (
    <div style={{
      backgroundColor: colors.white,
      border: `1px solid ${colors.gray300}`,
      borderRadius: '8px',
      padding: spacing.lg,
      position: 'relative',
      transition: 'all 0.2s ease'
    }}>
      {/* Success indicator */}
      <div style={{
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        opacity: showSuccess ? 1 : 0,
        transform: showSuccess ? 'scale(1)' : 'scale(0)',
        transition: 'all 0.3s ease'
      }}>
        <CheckCircle size={20} color={colors.success} />
      </div>
      
      {/* Product header */}
      <div style={{ marginBottom: spacing.md }}>
        <h3 style={typography.productTitle}>{product.name}</h3>
        <p style={typography.small}>{product.voltage} MAX • {product.runtime}</p>
      </div>
      
      {/* Price display */}
      <div style={{ marginBottom: spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: spacing.sm }}>
          <span style={typography.price}>${product.price}</span>
          <span style={{ 
            ...typography.small, 
            textDecoration: 'line-through',
            color: colors.gray500 
          }}>
            ${product.msrp}
          </span>
          <span style={{
            backgroundColor: colors.successLight,
            color: colors.successDark,
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            Save {product.savings}%
          </span>
        </div>
      </div>
      
      {/* Features */}
      <div style={{ 
        display: 'flex', 
        gap: spacing.md, 
        marginBottom: spacing.md,
        fontSize: '12px',
        color: colors.gray600
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Zap size={14} />
          <span>{product.workOutput.split(' / ')[0]}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={14} />
          <span>{product.chargingTime}</span>
        </div>
      </div>
      
      {/* Original Quantity selector with quick add buttons */}
      <div style={{
        backgroundColor: colors.gray100,
        padding: spacing.md,
        borderRadius: '6px',
        marginBottom: spacing.md
      }}>
        {/* Quick add buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '6px',
          marginBottom: spacing.md,
          justifyContent: 'center',
          width: '100%'
        }}>
          {[5, 10, 25].map((increment) => (
            <button
              key={increment}
              onClick={() => setLocalQuantity(localQuantity + increment)}
              style={{
                flex: 1,
                height: '32px',
                fontSize: '13px',
                fontWeight: '500',
                color: colors.primary,
                backgroundColor: '#EFF6FF',
                border: `1px solid #DBEAFE`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 8px',
                minWidth: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#DBEAFE';
                e.currentTarget.style.borderColor = '#93C5FD';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#EFF6FF';
                e.currentTarget.style.borderColor = '#DBEAFE';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              +{increment}
            </button>
          ))}
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: spacing.sm
        }}>
          <span style={typography.label}>Quantity</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <button
              onClick={() => setLocalQuantity(Math.max(0, localQuantity - 1))}
              style={{
                width: '28px',
                height: '28px',
                backgroundColor: colors.white,
                border: `1px solid ${colors.gray300}`,
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Minus size={14} />
            </button>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={localQuantity}
                onChange={(e) => setLocalQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                style={{
                  width: '80px',
                  height: '36px',
                  textAlign: 'center',
                  border: `1px solid ${colors.gray300}`,
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
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
              onClick={() => setLocalQuantity(localQuantity + 1)}
              style={{
                width: '28px',
                height: '28px',
                backgroundColor: colors.white,
                border: `1px solid ${colors.gray300}`,
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
        
        {/* Line total */}
        {localQuantity > 0 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: spacing.sm,
            borderTop: `1px solid ${colors.gray300}`
          }}>
            <span style={typography.label}>Line total</span>
            <span style={{ 
              ...typography.body, 
              fontWeight: '600',
              transition: 'all 0.3s ease',
              opacity: isUpdating ? 0.6 : 1
            }}>
              ${lineTotal.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Volume Discount Progress Component
const VolumeDiscountProgress = ({ currentAmount, discountTiers }: any) => {
  const maxAmount = discountTiers[discountTiers.length - 1].threshold;
  const progressPercentage = Math.min((currentAmount / maxAmount) * 100, 100);
  
  const activeDiscount = discountTiers.reduce((acc: any, tier: any) => {
    return currentAmount >= tier.threshold ? tier : acc;
  }, null);
  
  const nextTier = discountTiers.find(tier => tier.threshold > currentAmount);
  const amountToNext = nextTier ? nextTier.threshold - currentAmount : 0;
  const extraSavings = nextTier && activeDiscount 
    ? (currentAmount * (nextTier.percentage - (activeDiscount?.percentage || 0)) / 100).toFixed(0)
    : nextTier ? (currentAmount * nextTier.percentage / 100).toFixed(0) : 0;
  
  return (
    <div style={{
      backgroundColor: colors.white,
      border: `1px solid ${colors.gray300}`,
      borderRadius: '8px',
      padding: spacing.lg
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
      <div style={{ marginBottom: '60px', position: 'relative', padding: '4px 0' }}>
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
                right: '-2px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '24px',
                height: '24px',
                backgroundColor: colors.white,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                border: `2px solid ${colors.primary}`
              }}>
                <span style={{ fontSize: '8px', fontWeight: '600', color: colors.primary, letterSpacing: '-0.3px' }}>
                  {Math.round(progressPercentage)}%
                </span>
              </div>
            )}
          </div>
          
          {/* Tier markers */}
          {discountTiers.map((tier: any, index: number) => {
            const position = (tier.threshold / maxAmount) * 100;
            // Add the 100% progress indicator if we've reached max discount
            const showProgressHere = progressPercentage >= 100 && index === discountTiers.length - 1;
            const isActive = activeDiscount && tier.threshold === activeDiscount.threshold;
            const isPassed = currentAmount >= tier.threshold;
            const isNext = nextTier && tier.threshold === nextTier.threshold;
            
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
                  width: isActive ? '24px' : '20px',
                  height: isActive ? '24px' : '20px',
                  borderRadius: '50%',
                  backgroundColor: isPassed ? colors.primary : colors.white,
                  border: `2px solid ${isPassed ? colors.primary : isNext ? colors.warning : colors.gray400}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  transition: 'all 0.3s ease',
                  boxShadow: isActive ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none',
                  position: 'relative',
                  fontSize: '0',
                  lineHeight: '0'
                }}>
                  {isPassed ? (
                    <CheckCircle size={12} color={colors.white} strokeWidth={3} />
                  ) : (
                    <span style={{ 
                      fontSize: '8px', 
                      fontWeight: '600', 
                      color: isNext ? colors.warning : colors.gray600,
                      letterSpacing: '-0.2px',
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
                      width: 'calc(100% + 6px)',
                      height: 'calc(100% + 6px)',
                      borderRadius: '50%',
                      border: `2px solid ${colors.warning}`,
                      animation: 'pulse 2s ease-in-out infinite',
                      top: '-3px',
                      left: '-3px'
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
                  top: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  minWidth: '80px'
                }}>
                  <p style={{ 
                    ...typography.label,
                    fontWeight: isActive || isNext ? '700' : '500',
                    color: isActive ? colors.primary : isNext ? colors.warning : colors.gray600,
                    marginBottom: '2px'
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
      <div style={{ marginTop: spacing.xl }}>
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

// Order Summary Card Component
const OrderSummaryCard = ({ 
  quantities, 
  subtotal, 
  discountAmount, 
  discountPercentage, 
  total,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onInvoice,
  onSaveQuote
}: any) => {
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
      
      {/* Cart items */}
      <div style={{ padding: spacing.lg }}>
        {Object.entries(quantities).map(([batteryId, qty]) => {
          if (qty === 0) return null;
          const battery = batteriesData.find(b => b.id === batteryId);
          if (!battery) return null;
          
          return (
            <div
              key={batteryId}
              style={{
                paddingBottom: spacing.md,
                marginBottom: spacing.md,
                borderBottom: `1px solid ${colors.gray200}`
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: spacing.sm
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ ...typography.body, fontWeight: '600' }}>{battery.name}</p>
                  <p style={typography.small}>
                    Qty: {qty} × ${battery.price}
                  </p>
                </div>
                <span style={{ ...typography.body, fontWeight: '600' }}>
                  ${(battery.price * qty).toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: spacing.sm }}>
                <button
                  onClick={() => onRemoveItem(batteryId)}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: colors.white,
                    border: `1px solid ${colors.gray300}`,
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: colors.error,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.errorLight;
                    e.currentTarget.style.borderColor = colors.error;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.white;
                    e.currentTarget.style.borderColor = colors.gray300;
                  }}
                >
                  <Trash2 size={12} />
                  Remove
                </button>
              </div>
            </div>
          );
        })}
        
        {/* Empty cart */}
        {subtotal === 0 && (
          <div style={{ 
            padding: spacing.xl, 
            textAlign: 'center',
            color: colors.gray500
          }}>
            <ShoppingCart size={48} style={{ margin: '0 auto', marginBottom: spacing.md }} />
            <p>Your cart is empty</p>
          </div>
        )}
      </div>
      
      {/* Totals */}
      {subtotal > 0 && (
        <>
          <div style={{
            padding: spacing.lg,
            borderTop: `1px solid ${colors.gray300}`,
            backgroundColor: colors.gray50
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <span style={typography.body}>Subtotal:</span>
              <span style={typography.body}>${subtotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                <span style={{ ...typography.body, color: colors.success }}>
                  Discount ({discountPercentage}%):
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
          
          {/* Action buttons */}
          <div style={{ padding: spacing.lg, display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            <button
              onClick={onCheckout}
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
                gap: spacing.sm,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
            >
              <CreditCard size={20} />
              Checkout
            </button>
            <button
              onClick={onInvoice}
              style={{
                width: '100%',
                backgroundColor: colors.white,
                color: colors.primary,
                padding: '12px 24px',
                borderRadius: '6px',
                border: `2px solid ${colors.primary}`,
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray50}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.white}
            >
              <FileText size={20} />
              Get Invoice
            </button>
            <button
              onClick={onSaveQuote}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                color: colors.gray600,
                padding: '8px',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.gray600;
              }}
            >
              Save Quote for Later
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default function ProductsPage() {
  const router = useRouter();
  const [quantities, setQuantities] = useState<{[key: string]: number}>({
    '6Ah': 0,
    '9Ah': 0,
    '15Ah': 0
  });
  const [successItems, setSuccessItems] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  // Cart persistence - load saved cart on mount
  useEffect(() => {
    const savedCart = sessionStorage.getItem('batteryCart') || localStorage.getItem('batteryCart_backup');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        if (cartData.items) {
          setQuantities(cartData.items);
        }
      } catch (error) {
        console.error('Failed to load saved cart:', error);
      }
    }
  }, []);

  // Save cart whenever it changes
  useEffect(() => {
    const cartData = {
      items: quantities,
      lastUpdated: Date.now(),
      userId: 'guest' // Replace with actual user ID when available
    };
    
    sessionStorage.setItem('batteryCart', JSON.stringify(cartData));
    localStorage.setItem('batteryCart_backup', JSON.stringify(cartData));
  }, [quantities]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add CSS for animations
  useEffect(() => {
    const style = document.createElement('style');
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
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Calculate totals
  const subtotal = Object.entries(quantities).reduce((sum, [battery, qty]) => {
    const batteryData = batteriesData.find(b => b.id === battery);
    return sum + (batteryData ? batteryData.price * qty : 0);
  }, 0);

  // Calculate discount
  let discountPercentage = 0;
  for (const tier of [...discountTiers].reverse()) {
    if (subtotal >= tier.threshold) {
      discountPercentage = tier.percentage;
      break;
    }
  }

  const discountAmount = Math.round(subtotal * (discountPercentage / 100));
  const total = subtotal - discountAmount;

  const updateQuantity = async (battery: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [battery]: Math.max(0, prev[battery] + delta)
    }));
    
    // Track cart update
    const newQuantity = Math.max(0, quantities[battery] + delta);
    const batteryData = batteriesData.find(b => b.id === battery);
    
    if (batteryData) {
      // Track with Google Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        if (delta > 0) {
          window.gtag('event', 'add_to_cart', {
            currency: 'USD',
            value: batteryData.price * Math.abs(delta),
            items: [{
              item_id: battery,
              item_name: batteryData.name,
              price: batteryData.price,
              quantity: Math.abs(delta),
              item_category: 'battery'
            }]
          });
        } else if (delta < 0) {
          window.gtag('event', 'remove_from_cart', {
            currency: 'USD',
            value: batteryData.price * Math.abs(delta),
            items: [{
              item_id: battery,
              item_name: batteryData.name,
              price: batteryData.price,
              quantity: Math.abs(delta),
              item_category: 'battery'
            }]
          });
        }
      }
      
      // Track to database
      try {
        const updatedQuantities = { ...quantities, [battery]: newQuantity };
        const cartItems = Object.entries(updatedQuantities)
          .filter(([_, qty]) => qty > 0)
          .map(([id, qty]) => {
            const bat = batteriesData.find(b => b.id === id);
            return {
              id,
              name: bat?.name || '',
              price: bat?.price || 0,
              quantity: qty
            };
          });
        
        const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        await fetch('/api/cart/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: delta > 0 ? 'add' : 'remove',
            sessionId: sessionStorage.getItem('sessionId') || undefined,
            userId: localStorage.getItem('userId') || undefined,
            product: batteryData,
            quantity: Math.abs(delta),
            cartTotal,
            items: cartItems
          })
        });
      } catch (error) {
        console.error('Failed to track cart update:', error);
      }
    }
  };

  const removeItem = (battery: string) => {
    setQuantities(prev => ({
      ...prev,
      [battery]: 0
    }));
  };

  const showSuccess = (batteryId: string) => {
    setSuccessItems(prev => new Set(prev).add(batteryId));
    setTimeout(() => {
      setSuccessItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(batteryId);
        return newSet;
      });
    }, 2000);
  };

  const handleCheckout = () => {
    // Prepare complete order data for checkout
    const orderItems = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([batteryId, qty]) => {
        const battery = batteriesData.find(b => b.id === batteryId);
        return {
          id: batteryId,
          type: batteryId,
          name: battery?.name || '',
          price: battery?.price || 0,
          unitPrice: battery?.price || 0,
          quantity: qty,
          total: (battery?.price || 0) * qty
        };
      });

    const orderData = {
      items: orderItems,
      quantities, // Keep original format for compatibility
      subtotal,
      discount: discountAmount,
      discountPercentage,
      total,
      orderDate: new Date().toISOString()
    };
    
    // Save both order data and cart state
    sessionStorage.setItem('orderData', JSON.stringify(orderData));
    sessionStorage.setItem('cartData', JSON.stringify(orderData)); // For backwards compatibility
    router.push('/customer/checkout');
  };

  // Save quote functionality
  const saveQuoteForLater = async () => {
    try {
      // Check if cart has items
      const hasItems = Object.values(quantities).some(qty => qty > 0);
      if (!hasItems) {
        alert('Please add items to your cart before saving a quote.');
        return;
      }

      const quoteData = {
        quoteId: `Q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        customerId: 'guest', // Replace with actual customer ID
        customerName: 'John Contractor', // Replace with actual customer name
        items: Object.entries(quantities)
          .filter(([_, qty]) => qty > 0)
          .map(([batteryId, qty]) => {
            const battery = batteriesData.find(b => b.id === batteryId);
            return {
              id: batteryId,
              type: batteryId,
              name: battery?.name || '',
              quantity: qty,
              unitPrice: battery?.price || 0,
              total: (battery?.price || 0) * qty
            };
          }),
        quantities, // Keep original format for easy cart restoration
        subtotal,
        discount: discountAmount,
        discountPercentage,
        total,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      // Save to database
      const response = await fetch('/api/quotes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quoteData,
          sessionId: sessionStorage.getItem('sessionId') || undefined,
          userId: localStorage.getItem('userId') || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save quote to database');
      }

      // Also save to localStorage for offline access
      const savedQuotes = JSON.parse(localStorage.getItem('savedQuotes') || '[]');
      savedQuotes.unshift(quoteData); // Add to beginning of array
      localStorage.setItem('savedQuotes', JSON.stringify(savedQuotes));

      // Show success notification with better styling
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors.success};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
      `;
      notification.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" stroke-width="2">
          <circle cx="10" cy="10" r="9"></circle>
          <path d="M6 10l3 3 5-5"></path>
        </svg>
        <div>
          <div style="font-weight: 600;">Quote saved successfully!</div>
          <div style="font-size: 14px; opacity: 0.9;">Quote ID: ${quoteData.quoteId}</div>
        </div>
      `;
      document.body.appendChild(notification);
      
      // Add animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `;
      document.head.appendChild(style);
      
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        notification.style.animationFillMode = 'forwards';
        setTimeout(() => {
          document.body.removeChild(notification);
          document.head.removeChild(style);
        }, 300);
      }, 3000);

      // Track with Google Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'save_quote', {
          quote_id: quoteData.quoteId,
          value: quoteData.total,
          currency: 'USD',
          items_count: quoteData.items.length
        });
      }

      // Clear cart after saving
      setQuantities({ '6Ah': 0, '9Ah': 0, '15Ah': 0 });
      
      // Navigate to payment page after a short delay
      setTimeout(() => {
        router.push('/customer/payment?tab=saved-quotes');
      }, 1500);
      
    } catch (error) {
      console.error('Failed to save quote:', error);
      alert('Failed to save quote. Please try again.');
    }
  };

  const handleInvoice = () => {
    // Prepare complete cart data for invoice
    const cartItems = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([batteryId, qty]) => {
        const battery = batteriesData.find(b => b.id === batteryId);
        return {
          type: batteryId, // Invoice expects 'type' field
          id: batteryId,
          name: battery?.name || `${batteryId} Battery`, // Add name field
          product: battery?.name || '',
          description: `${battery?.voltage} MAX FlexVolt Battery`,
          quantity: qty, // Use 'quantity' instead of 'qty'
          unitPrice: battery?.price || 0, // Use 'unitPrice' instead of 'price'
          total: (battery?.price || 0) * qty
        };
      });

    // Ensure we have valid data
    if (cartItems.length === 0) {
      alert('Please add items to your cart before generating an invoice.');
      return;
    }

    const invoiceData = {
      items: cartItems,
      subtotal,
      discount: discountAmount, // Send as number, not object
      discountPercentage, // Send percentage separately
      total,
      generatedAt: new Date().toISOString()
    };

    // Store in session and navigate to invoice page
    sessionStorage.setItem('invoiceData', JSON.stringify(invoiceData));
    router.push('/customer/invoice');
  };

  return (
    <div style={{ 
      backgroundColor: colors.gray100,
      minHeight: '100vh',
      paddingBottom: isMobile && subtotal > 0 ? '80px' : 0
    }}>
      {/* Mobile Sticky Cart Summary */}
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
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md
        }}>
          <div>
            <p style={{ ...typography.small, marginBottom: '2px' }}>
              {Object.values(quantities).reduce((sum, qty) => sum + qty, 0)} items
            </p>
            <p style={{ ...typography.price, color: colors.primary }}>
              ${total.toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => {
              const cartSection = document.getElementById('order-summary');
              cartSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              backgroundColor: colors.primary,
              color: colors.white,
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs
            }}
          >
            View Cart
            <ShoppingCart size={16} />
          </button>
        </div>
      )}
      
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
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: spacing.md
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <h1 style={{ ...typography.title, color: colors.white }}>
              Heavy-Duty FlexVolt Batteries
            </h1>
            <span style={{
              backgroundColor: colors.warningLight,
              color: colors.gray900,
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              BULK SAVINGS
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            gap: spacing.lg,
            fontSize: '14px',
            opacity: 0.9
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Battery size={16} />
              <span>20V/60V MAX</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Truck size={16} />
              <span>Free Shipping</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Shield size={16} />
              <span>12-Mo Warranty</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: spacing.xl,
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: spacing.xl
      }}>
        {/* Product Selection */}
        <section>
          <h2 style={{ ...typography.sectionTitle, marginBottom: spacing.lg }}>
            Select Your Batteries
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: spacing.lg
          }}>
            {batteriesData.map(battery => (
              <ProductCard
                key={battery.id}
                product={battery}
                quantity={quantities[battery.id]}
                onUpdateQuantity={updateQuantity}
                showSuccess={successItems.has(battery.id)}
                onShowSuccess={showSuccess}
              />
            ))}
          </div>
        </section>

        {/* Volume Discounts */}
        {subtotal > 0 && (
          <section>
            <VolumeDiscountProgress
              currentAmount={subtotal}
              discountTiers={discountTiers}
            />
          </section>
        )}

        {/* Order Summary */}
        <section id="order-summary">
          <OrderSummaryCard
            quantities={quantities}
            subtotal={subtotal}
            discountAmount={discountAmount}
            discountPercentage={discountPercentage}
            total={total}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onCheckout={handleCheckout}
            onInvoice={handleInvoice}
            onSaveQuote={saveQuoteForLater}
          />
        </section>
      </div>
    </div>
  );
}