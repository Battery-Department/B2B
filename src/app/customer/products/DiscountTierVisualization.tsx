'use client';

import React from 'react';

interface DiscountTierVisualizationProps {
  currentTotal: number;
  discountTiers: Array<{
    threshold: number;
    discount: string;
    discountRate: number;
    color: string;
    description: string;
  }>;
  showDiscountTiers: boolean;
  setShowDiscountTiers: (show: boolean) => void;
}

const DiscountTierVisualization: React.FC<DiscountTierVisualizationProps> = ({ 
  currentTotal, 
  discountTiers,
  showDiscountTiers,
  setShowDiscountTiers
}) => {
  // Find current discount tier
  let currentDiscountTier = -1;
  for (let i = discountTiers.length - 1; i >= 0; i--) {
    if (currentTotal >= discountTiers[i].threshold) {
      currentDiscountTier = i;
      break;
    }
  }
  
  return (
    <>
      {/* Enhanced Discount Tiers Toggle Button */}
      <button
        onClick={() => setShowDiscountTiers(!showDiscountTiers)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "linear-gradient(135deg, #E6F4FF 0%, #DEEEFF 100%)";
          e.currentTarget.style.borderColor = "rgba(0, 111, 238, 0.2)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "linear-gradient(135deg, #F0F9FF 0%, #E6F4FF 100%)";
          e.currentTarget.style.borderColor = "rgba(0, 111, 238, 0.15)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
        style={{
          width: "100%",
          background: "linear-gradient(135deg, #F0F9FF 0%, #E6F4FF 100%)",
          border: "1px solid rgba(0, 111, 238, 0.15)",
          borderRadius: "12px",
          color: "#006FEE",
          fontSize: "15px",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "14px",
          margin: "24px 0 8px 0",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 8px rgba(0, 111, 238, 0.08)",
          transform: "translateY(0)",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M4.93 4.93l1.41 1.41" />
          <path d="M17.66 17.66l1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="M6.34 17.66l-1.41 1.41" />
          <path d="M19.07 4.93l-1.41 1.41" />
        </svg>
        {showDiscountTiers ? "Hide" : "View"} Bulk Discount Tiers
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
            transform: showDiscountTiers ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Enhanced Discount Tiers Content */}
      <div
        style={{
          overflow: "hidden",
          maxHeight: showDiscountTiers ? "600px" : "0px",
          transition: "max-height 0.3s ease-in-out",
        }}
      >
        <div
          style={{
            marginTop: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            border: "1px solid rgba(0, 111, 238, 0.1)",
            borderRadius: "16px",
            padding: "20px",
            background: "linear-gradient(135deg, #FFFFFF 0%, #F8FBFF 100%)",
            boxShadow: "0 4px 12px rgba(0, 111, 238, 0.05)",
          }}
        >
          <h3 style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#003D88",
            margin: "0 0 16px 0",
            textAlign: "center",
          }}>
            Volume Discounts
          </h3>
          
          {discountTiers.map((tier, index) => {
            const isActive = currentDiscountTier >= index;
            
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "18px",
                  borderRadius: "12px",
                  border: `1px solid ${isActive ? "rgba(0, 111, 238, 0.2)" : "#E2E8F0"}`,
                  background: isActive 
                    ? "linear-gradient(135deg, #E6F4FF 0%, #F0F9FF 100%)"
                    : "#FFFFFF",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  boxShadow: isActive ? "0 4px 12px rgba(0, 111, 238, 0.08)" : "none",
                }}
              >
                {isActive && (
                  <div style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "#22C55E",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                )}
                
                <div
                  style={{
                    minWidth: "90px",
                    padding: "12px",
                    borderRadius: "10px",
                    background: isActive 
                      ? "linear-gradient(135deg, #006FEE 0%, #0084FF 100%)"
                      : "linear-gradient(135deg, #F0F9FF 0%, #E6F4FF 100%)",
                    color: isActive ? "#FFFFFF" : "#5B9FFF",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "16px",
                    marginRight: "16px",
                    boxShadow: isActive ? "0 2px 8px rgba(0, 111, 238, 0.2)" : "none",
                  }}
                >
                  ${tier.threshold.toLocaleString()}+
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: isActive ? "#003D88" : "#0F172A",
                      marginBottom: "4px",
                    }}
                  >
                    {tier.discount} off all batteries
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#64748B",
                    }}
                  >
                    {tier.description}
                  </div>
                </div>
              </div>
            );
          })}
          
          <div style={{
            fontSize: "14px",
            color: "#5B9FFF",
            textAlign: "center",
            marginTop: "16px",
            fontWeight: "500",
          }}>
            Discounts applied automatically at checkout
          </div>
        </div>
      </div>
    </>
  );
};

export default DiscountTierVisualization;