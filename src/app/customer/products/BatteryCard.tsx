'use client'

import React from 'react'

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
}

const BatteryCard: React.FC<BatteryCardProps> = ({
  type,
  specs,
  retailPrice,
  quantity,
  onQuantityChange,
  discountRate,
  isExpanded,
  onToggleExpand,
}) => {
  // Calculate prices
  const finalPrice = specs.basePrice * (1 - discountRate);
  const savingsAmount = retailPrice - finalPrice;
  const savingsPercentage = Math.round((savingsAmount / retailPrice) * 100);

  return (
    <div
      style={{
        background: colors.cardBackground,
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        marginBottom: "16px",
        border: `1px solid ${colors.border}`,
        overflow: "hidden",
        transition: "box-shadow 0.2s ease",
      }}
    >
      {/* Card Header with FlexVolt Branding */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "16px",
          borderBottom: isExpanded ? `1px solid ${colors.border}` : "none",
        }}
      >
        <div>
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
          
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: colors.primary,
              margin: "0 0 6px 0",
            }}
          >
            {type} Battery
          </h2>
          
          <div style={{
            fontSize: "14px",
            color: colors.textLight,
            marginBottom: "10px",
          }}>
            {specs.runtime} · {specs.weight}
          </div>
          
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: colors.price,
              }}
            >
              ${finalPrice.toFixed(0)}
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 400,
                color: colors.textLight,
                textDecoration: "line-through",
              }}
            >
              ${retailPrice}
            </div>
            
            <div style={{
              background: "rgba(34, 197, 94, 0.1)",
              color: colors.savings,
              fontWeight: 600,
              fontSize: "13px",
              padding: "3px 8px",
              borderRadius: "4px",
            }}>
              Save {savingsPercentage}%
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <button
              onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
              onMouseEnter={(e) => {
                if (quantity > 0) {
                  e.currentTarget.style.backgroundColor = '#0096CC';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = quantity > 0 ? colors.accent : "#E2E8F0";
              }}
              style={{
                width: "38px",
                height: "38px",
                backgroundColor: quantity > 0 ? colors.accent : "#E2E8F0",
                color: colors.buttonText,
                border: "none",
                borderRadius: "8px 0 0 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: quantity > 0 ? "pointer" : "not-allowed",
                fontSize: "18px",
                fontWeight: "600",
                transition: "background-color 0.2s ease",
              }}
              disabled={quantity === 0}
            >
              −
            </button>

            <input
              type="number"
              min="0"
              max="999"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                onQuantityChange(Math.max(0, Math.min(999, val)));
              }}
              style={{
                width: "40px",
                height: "38px",
                border: "1px solid #E2E8F0",
                borderLeft: "none",
                borderRight: "none",
                textAlign: "center",
                fontSize: "16px",
                fontWeight: "600",
                padding: "8px 0",
                color: colors.primary,
                outline: "none",
                WebkitAppearance: "none",
                MozAppearance: "textfield",
                appearance: "textfield",
              }}
            />

            <button
              onClick={() => onQuantityChange(Math.min(999, quantity + 1))}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0096CC';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.accent;
              }}
              style={{
                width: "38px",
                height: "38px",
                backgroundColor: colors.accent,
                color: colors.buttonText,
                border: "none",
                borderRadius: "0 8px 8px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "18px",
                fontWeight: "600",
                transition: "background-color 0.2s ease",
              }}
              disabled={quantity >= 999}
            >
              +
            </button>
          </div>
        </div>
      </div>
      
      {/* Compatibility Badge - Always Visible */}
      <div style={{
        padding: "0 16px 12px 16px", 
        display: "flex", 
        alignItems: "center", 
        gap: "6px"
      }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.savings}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        <span style={{fontSize: "13px", color: colors.savings, fontWeight: 500}}>
          Compatible with all DeWalt 20V/60V tools
        </span>
      </div>

      {/* Expandable Content */}
      <div
        style={{
          maxHeight: isExpanded ? "500px" : "0",
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}
      >
        <div style={{ padding: "0 16px 16px 16px" }}>
          {/* Best For */}
          {specs.bestFor && (
            <div
              style={{
                marginBottom: "16px",
                background: "rgba(243, 244, 246, 0.5)",
                padding: "12px",
                borderRadius: "8px",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: colors.primary,
                  margin: "0 0 6px 0",
                }}
              >
                Best For
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: colors.text,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {specs.bestFor}
              </p>
            </div>
          )}

          {/* Specifications Grid */}
          <div>
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: colors.primary,
                margin: "0 0 10px 0",
              }}
            >
              Specifications
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <SpecItem
                label="Weight"
                value={specs.weight}
                colors={colors}
                icon="weight"
              />
              <SpecItem
                label="Runtime"
                value={specs.runtime}
                colors={colors}
                icon="clock"
              />
              <SpecItem
                label="Charging Time"
                value={specs.chargingTime}
                colors={colors}
                icon="battery"
              />
              {specs.dimensions && (
                <SpecItem
                  label="Dimensions"
                  value={specs.dimensions}
                  colors={colors}
                  icon="box"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expand Button */}
      <button
        onClick={onToggleExpand}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isExpanded ? "rgba(243, 244, 246, 0.9)" : "rgba(243, 244, 246, 0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isExpanded ? "rgba(243, 244, 246, 0.7)" : "transparent";
        }}
        style={{
          width: "100%",
          background: isExpanded ? "rgba(243, 244, 246, 0.7)" : "transparent",
          border: "none",
          borderTop: `1px solid ${colors.border}`,
          padding: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.accent,
          fontSize: "14px",
          fontWeight: 500,
          cursor: "pointer",
          transition: "background 0.2s ease",
        }}
      >
        {isExpanded ? "Show less" : "Show details"}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            marginLeft: "6px",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  )
}

// Enhanced SpecItem Component with icons
function SpecItem({ label, value, colors, icon }: { label: string; value: string; colors: any; icon: string }) {
  let iconSvg;
  
  switch(icon) {
    case "weight":
      iconSvg = (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textLight} strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
      );
      break;
    case "clock":
      iconSvg = (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textLight} strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      );
      break;
    case "battery":
      iconSvg = (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textLight} strokeWidth="2">
          <rect x="1" y="6" width="18" height="12" rx="2" ry="2"></rect>
          <line x1="23" y1="13" x2="23" y2="11"></line>
        </svg>
      );
      break;
    case "box":
      iconSvg = (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textLight} strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        </svg>
      );
      break;
    default:
      iconSvg = null;
  }
  
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "6px",
    }}>
      {iconSvg && <div style={{marginTop: "2px"}}>{iconSvg}</div>}
      <div>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: colors.textLight,
            marginBottom: "3px",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: colors.primary,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

export default BatteryCard