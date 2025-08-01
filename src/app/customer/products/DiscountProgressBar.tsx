'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, Zap } from 'lucide-react';

interface DiscountProgressBarProps {
  currentTotal: number;
  discountTiers: any[];
  isMobile: boolean;
}

const DiscountProgressBar: React.FC<DiscountProgressBarProps> = ({ 
  currentTotal = 0, 
  discountTiers = [],
  isMobile = false
}) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Validate props
  if (!discountTiers || discountTiers.length === 0) {
    return null;
  }
  
  // Find current tier and calculate progress
  let currentTierIndex = -1;
  let nextTierIndex = 0;
  
  for (let i = discountTiers.length - 1; i >= 0; i--) {
    if (discountTiers[i] && currentTotal >= discountTiers[i].threshold) {
      currentTierIndex = i;
      nextTierIndex = i + 1;
      break;
    }
  }

  // Calculate progress percentage
  let progressPercentage = 0;
  let dollarsToNext = 0;
  
  if (currentTierIndex === -1 && currentTotal > 0 && discountTiers[0]) {
    // Haven't reached first tier yet
    progressPercentage = (currentTotal / discountTiers[0].threshold) * 100;
    dollarsToNext = discountTiers[0].threshold - currentTotal;
  } else if (currentTierIndex >= 0 && currentTierIndex < discountTiers.length - 1 && discountTiers[nextTierIndex]) {
    // Between tiers
    const currentTierThreshold = discountTiers[currentTierIndex].threshold;
    const nextTierThreshold = discountTiers[nextTierIndex].threshold;
    const tierRange = nextTierThreshold - currentTierThreshold;
    const progressInTier = currentTotal - currentTierThreshold;
    progressPercentage = ((currentTierIndex * 100) + (progressInTier / tierRange * 100)) / discountTiers.length;
    dollarsToNext = nextTierThreshold - currentTotal;
  } else {
    // Reached maximum tier
    progressPercentage = 100;
  }

  useEffect(() => {
    // Animate progress bar
    setTimeout(() => {
      setAnimatedWidth(progressPercentage);
    }, 100);
    
    // Show confetti effect when reaching a tier
    if (currentTierIndex >= 0 && progressPercentage > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1000);
    }
  }, [progressPercentage, currentTierIndex]);

  return (
    <div style={{
      background: "white",
      borderRadius: "12px",
      padding: isMobile ? "16px" : "20px",
      marginBottom: "24px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
      border: "1px solid #E6F4FF",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Confetti effect */}
      {showConfetti && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none"
        }}>
          <Zap size={48} color="#10B981" style={{
            animation: "bounce 0.5s ease-out"
          }} />
        </div>
      )}
      
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "16px"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <TrendingUp size={20} color="#006FEE" />
          <h3 style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#003D88",
            margin: 0
          }}>Unlock More Savings</h3>
        </div>
        
        {currentTierIndex < discountTiers.length - 1 && (
          <div style={{
            fontSize: "14px",
            color: "#10B981",
            fontWeight: "600"
          }}>
            ${dollarsToNext.toFixed(0)} to {(discountTiers[nextTierIndex] && discountTiers[nextTierIndex].discount) || '20%'}
          </div>
        )}
      </div>

      {/* Progress bar container */}
      <div style={{
        position: "relative",
        height: "40px",
        background: "#F3F4F6",
        borderRadius: "20px",
        overflow: "hidden",
        marginBottom: "12px"
      }}>
        {/* Tier markers */}
        {discountTiers.map((tier, index) => {
          const position = ((index + 1) / discountTiers.length) * 100;
          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: `${position}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "2px",
                height: "100%",
                background: "#E5E7EB",
                zIndex: 1
              }}
            />
          );
        })}
        
        {/* Animated progress bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${animatedWidth}%`,
            background: "linear-gradient(90deg, #10B981 0%, #059669 100%)",
            borderRadius: "20px",
            transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: "12px"
          }}
        >
          {animatedWidth > 20 && (
            <span style={{
              color: "white",
              fontSize: "14px",
              fontWeight: "600"
            }}>
              ${currentTotal.toFixed(0)}
            </span>
          )}
        </div>
        
        {/* Tier indicators */}
        {discountTiers.map((tier, index) => {
          const position = ((index + 1) / discountTiers.length) * 100;
          const isReached = currentTierIndex >= index;
          
          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: `${position}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: isReached ? (tier.color || "#10B981") : "white",
                border: `3px solid ${isReached ? (tier.color || "#10B981") : "#E5E7EB"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "700",
                color: isReached ? "white" : "#64748B",
                transition: "all 0.3s",
                cursor: "pointer",
                zIndex: 2,
                boxShadow: isReached ? "0 2px 4px rgba(0, 0, 0, 0.1)" : "none"
              }}
              title={`${tier.discount} at $${tier.threshold}`}
            >
              {tier.discount.replace(' OFF', '')}
            </div>
          );
        })}
      </div>

      {/* Motivational message */}
      <div style={{
        textAlign: "center",
        fontSize: "14px",
        color: currentTierIndex >= discountTiers.length - 1 ? "#10B981" : "#64748B"
      }}>
        {currentTierIndex >= discountTiers.length - 1 && discountTiers[currentTierIndex] ? (
          <span style={{ fontWeight: "600" }}>
            🎉 Maximum savings unlocked! You're saving {discountTiers[currentTierIndex].discount}
          </span>
        ) : currentTierIndex >= 0 && discountTiers[currentTierIndex] ? (
          <>
            <span style={{ fontWeight: "600", color: "#10B981" }}>
              Great job! You're saving {discountTiers[currentTierIndex].discount}
            </span>
            <br />
            Add ${dollarsToNext.toFixed(0)} more to unlock {(discountTiers[nextTierIndex] && discountTiers[nextTierIndex].discount) || 'maximum'} savings
          </>
        ) : (
          <>
            Add ${dollarsToNext.toFixed(0)} to unlock your first bulk discount of{' '}
            <span style={{ fontWeight: "600", color: "#006FEE" }}>
              {discountTiers[0] && discountTiers[0].discount || '10%'}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default DiscountProgressBar;