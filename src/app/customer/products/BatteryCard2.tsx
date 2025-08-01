'use client';

import React, { useState } from 'react';
import { Plus, Minus, Battery, Zap, ChevronDown, ChevronUp, Star } from 'lucide-react';

interface BatteryCardProps {
  type: '6Ah' | '9Ah' | '15Ah'
  specs: {
    weight: string
    runtime: string
    chargingTime: string
    compatibleTools?: string
    bestFor?: string
    dimensions?: string
    basePrice: number
  }
  retailPrice: number
  quantity: number
  onQuantityChange: (quantity: number) => void
  discountRate: number
  isExpanded: boolean
  onToggleExpand: () => void
}

const colors = {
  primary: "#0A051E",
  secondary: "#334155",
  accent: "#00AEEF",
  accentDark: "#0096CC",
  background: "#F8FAFC",
  cardBackground: "#FFFFFF",
  border: "#E2E8F0",
  text: "#334155",
  textLight: "#64748B",
  price: "#0A051E",
  savings: "#22C55E",
  buttonText: "#FFFFFF",
  buttonHover: "#F8FAFC",
  popular: "#FFA500"
}

const BatteryCard2: React.FC<BatteryCardProps> = ({
  type,
  specs,
  retailPrice,
  quantity,
  onQuantityChange,
  discountRate,
  isExpanded,
  onToggleExpand,
}) => {
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const finalPrice = specs.basePrice * (1 - discountRate);
  const savingsAmount = retailPrice - finalPrice;
  const savingsPercentage = Math.round((savingsAmount / retailPrice) * 100);
  const isPopular = type === '9Ah';

  const handleQuickAdd = (amount: number) => {
    onQuantityChange(quantity + amount);
  };

  return (
    <div
      style={{
        background: colors.cardBackground,
        borderRadius: "12px",
        boxShadow: isPopular ? "0 4px 12px rgba(255, 165, 0, 0.15)" : "0 2px 8px rgba(0,0,0,0.06)",
        border: isPopular ? `2px solid ${colors.popular}` : `1px solid ${colors.border}`,
        overflow: "hidden",
        transition: "all 0.3s ease",
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}
      onMouseEnter={() => setQuickAddVisible(true)}
      onMouseLeave={() => setQuickAddVisible(false)}
    >
      {/* Most Popular Badge */}
      {isPopular && (
        <div style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          background: colors.popular,
          color: "white",
          padding: "4px 12px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          zIndex: 1
        }}>
          <Star size={14} fill="white" />
          MOST POPULAR
        </div>
      )}

      {/* Main Content */}
      <div style={{
        padding: "20px",
        flex: 1,
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Header */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{
            fontSize: "13px",
            fontWeight: 600,
            color: colors.accent,
            background: `${colors.accent}10`,
            padding: "3px 8px",
            borderRadius: "4px",
            display: "inline-block",
            marginBottom: "8px",
          }}>
            FlexVolt
          </div>
          
          <h3 style={{
            fontSize: "20px",
            fontWeight: 700,
            color: colors.primary,
            margin: "0 0 6px 0",
          }}>
            {type} Battery
          </h3>
          
          <div style={{
            fontSize: "14px",
            color: colors.textLight,
          }}>
            {specs.runtime} · {specs.weight}
          </div>
        </div>

        {/* Pricing */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
            marginBottom: "4px"
          }}>
            <span style={{
              fontSize: "28px",
              fontWeight: 700,
              color: colors.price,
            }}>
              ${finalPrice.toFixed(0)}
            </span>
            <span style={{
              fontSize: "16px",
              color: colors.textLight,
              textDecoration: "line-through",
            }}>
              ${retailPrice}
            </span>
          </div>
          
          <div style={{
            background: "rgba(34, 197, 94, 0.1)",
            color: colors.savings,
            fontWeight: 600,
            fontSize: "13px",
            padding: "4px 8px",
            borderRadius: "4px",
            display: "inline-block"
          }}>
            Save ${savingsAmount.toFixed(0)} ({savingsPercentage}%)
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div style={{
          marginBottom: "16px",
          opacity: quickAddVisible ? 1 : 0,
          transition: "opacity 0.3s ease",
          height: quickAddVisible ? "auto" : 0,
          overflow: "hidden"
        }}>
          <div style={{
            display: "flex",
            gap: "8px",
            marginBottom: "8px"
          }}>
            {[5, 10, 25].map(amount => (
              <button
                key={amount}
                onClick={() => handleQuickAdd(amount)}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "1px solid #E2E8F0",
                  borderRadius: "6px",
                  background: "white",
                  color: "#003D88",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F0F9FF";
                  e.currentTarget.style.borderColor = "#006FEE";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.borderColor = "#E2E8F0";
                }}
              >
                +{amount}
              </button>
            ))}
          </div>
          <div style={{
            fontSize: "12px",
            color: "#64748B",
            textAlign: "center"
          }}>
            Quick add to cart
          </div>
        </div>

        {/* Specifications */}
        {isExpanded && (
          <div style={{
            borderTop: `1px solid ${colors.border}`,
            paddingTop: "16px",
            marginTop: "16px",
            fontSize: "14px",
            lineHeight: "1.8",
            color: colors.text
          }}>
            <div style={{ marginBottom: "8px" }}>
              <strong>Charging Time:</strong> {specs.chargingTime}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Dimensions:</strong> {specs.dimensions}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Best For:</strong> {specs.bestFor}
            </div>
            <div>
              <strong>Compatible:</strong> {specs.compatibleTools}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{
        padding: "16px 20px",
        borderTop: `1px solid ${colors.border}`,
        background: colors.background
      }}>
        {/* Quantity Controls */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px"
        }}>
          <span style={{
            fontSize: "14px",
            fontWeight: "600",
            color: colors.text
          }}>Quantity</span>
          
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            border: `1px solid ${colors.border}`,
            borderRadius: "8px",
            padding: "4px",
            background: "white"
          }}>
            <button
              onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: "none",
                background: quantity > 0 ? colors.accent : colors.border,
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s"
              }}
              disabled={quantity === 0}
            >
              <Minus size={16} />
            </button>
            
            <input
              type="number"
              value={quantity}
              onChange={(e) => onQuantityChange(Math.max(0, parseInt(e.target.value) || 0))}
              style={{
                width: "60px",
                textAlign: "center",
                border: "none",
                fontSize: "16px",
                fontWeight: "600",
                color: colors.primary,
                outline: "none"
              }}
            />
            
            <button
              onClick={() => onQuantityChange(quantity + 1)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: "none",
                background: colors.accent,
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.accentDark;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.accent;
              }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Details Toggle */}
        <button
          onClick={onToggleExpand}
          style={{
            width: "100%",
            padding: "8px",
            border: "none",
            background: "transparent",
            color: colors.accent,
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            transition: "color 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.accentDark;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.accent;
          }}
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
    </div>
  );
};

export default BatteryCard2;