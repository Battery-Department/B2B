'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingCart, X, ChevronDown, ChevronUp } from 'lucide-react';

interface PersistentCartProps {
  quantities: { [key: string]: number };
  baseTotal: number;
  discountAmount: number;
  finalTotal: number;
  currentDiscountTier: number;
  discountTiers: any[];
  retailPrices: { [key: string]: number };
  batterySpecs: { [key: string]: any };
  onCheckout: () => void;
  onInvoice: () => void;
  isMobile: boolean;
}

const PersistentCart: React.FC<PersistentCartProps> = ({
  quantities,
  baseTotal,
  discountAmount,
  finalTotal,
  currentDiscountTier,
  discountTiers,
  retailPrices,
  batterySpecs,
  onCheckout,
  onInvoice,
  isMobile
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isScrolled || isMobile || totalItems === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
      border: '1px solid #E6F4FF',
      width: '320px',
      zIndex: 100,
      transition: 'all 0.3s ease',
      transform: isExpanded ? 'translateY(0)' : 'translateY(calc(100% - 70px))'
    }}>
      {/* Cart Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: isExpanded ? '1px solid #E6F4FF' : 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            position: 'relative'
          }}>
            <ShoppingCart size={24} color="#006FEE" />
            <div style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: '#006FEE',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {totalItems}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#003D88'
            }}>
              ${finalTotal.toFixed(2)}
            </div>
            {currentDiscountTier >= 0 && (
              <div style={{
                fontSize: '12px',
                color: '#10B981',
                fontWeight: '500'
              }}>
                {discountTiers[currentDiscountTier].discount} applied
              </div>
            )}
          </div>
        </div>
        {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </div>

      {/* Cart Details */}
      {isExpanded && (
        <>
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '16px'
          }}>
            {Object.entries(quantities).map(([type, quantity]) => {
              if (quantity === 0) return null;
              const batteryType = type as '6Ah' | '9Ah' | '15Ah';
              const savings = ((retailPrices[batteryType] - batterySpecs[batteryType].basePrice) / retailPrices[batteryType]) * 100;
              
              return (
                <div key={type} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '12px',
                  marginBottom: '12px',
                  borderBottom: '1px solid #F3F4F6'
                }}>
                  <div>
                    <div style={{
                      fontWeight: '600',
                      color: '#003D88',
                      marginBottom: '4px'
                    }}>
                      {type} Battery × {quantity}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#10B981'
                    }}>
                      Save {Math.round(savings)}% vs retail
                    </div>
                  </div>
                  <div style={{
                    textAlign: 'right'
                  }}>
                    <div style={{
                      fontWeight: '600',
                      color: '#003D88'
                    }}>
                      ${(batterySpecs[batteryType].basePrice * quantity).toFixed(2)}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#64748B',
                      textDecoration: 'line-through'
                    }}>
                      ${(retailPrices[batteryType] * quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid #E6F4FF',
            background: '#F8FAFC'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ color: '#64748B' }}>Subtotal</span>
              <span style={{ color: '#003D88' }}>${baseTotal.toFixed(2)}</span>
            </div>
            {currentDiscountTier >= 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                color: '#10B981',
                fontWeight: '600'
              }}>
                <span>Bulk Discount</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid #E6F4FF',
              fontWeight: '700',
              fontSize: '18px',
              color: '#003D88'
            }}>
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            padding: '16px',
            display: 'flex',
            gap: '12px'
          }}>
            <button
              onClick={onCheckout}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #006FEE 0%, #0084FF 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 111, 238, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Checkout
            </button>
            <button
              onClick={onInvoice}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Get Invoice
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PersistentCart;