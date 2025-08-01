import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DiscountTier {
  threshold: number;
  discount: string;
  color: string;
}

interface EnhancedDiscountProgressBarProps {
  currentTotal: number;
  discountTiers: DiscountTier[];
  isMobile: boolean;
  prevTotal?: number | null;
}

const EnhancedDiscountProgressBar: React.FC<EnhancedDiscountProgressBarProps> = ({ 
  currentTotal = 0, 
  discountTiers = [],
  isMobile = false,
  prevTotal
}) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [discountMessage, setDiscountMessage] = useState<string | null>(null);
  const [justReachedThreshold, setJustReachedThreshold] = useState(false);
  const previousTotal = useRef<number>(prevTotal !== undefined && prevTotal !== null ? prevTotal : 0);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // Confetti configuration
  const confettiConfig = {
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#4F46E5', '#3B82F6', '#60A5FA', '#34D399', '#F59E0B', '#EF4444'],
    // For TypeScript compatibility: shapes needs to be properly typed
    ticks: 300,
    gravity: 0.8,
    drift: 0,
    scalar: 1.2,
    zIndex: 100
  };

  // Function to fire confetti with tier-based density
  const fireConfetti = (discountLevel: string): void => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Skip animation but still show message
      setDiscountMessage(`You've unlocked ${discountLevel} savings!`);
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = setTimeout(() => setDiscountMessage(null), 5000);
      return;
    }
    
    // Set particle count based on discount tier percentage
    const discountPercentage = parseInt(discountLevel.replace('%', '').trim());
    const particleCount = discountPercentage * 10; // 10% = 100 particles, 20% = 200 particles
    
    // Fire confetti from multiple origins
    confetti({
      ...confettiConfig,
      particleCount,
      origin: { x: 0.3, y: 0.5 }
    });
    
    confetti({
      ...confettiConfig,
      particleCount,
      origin: { x: 0.7, y: 0.5 }
    });
    
    // Show congratulatory message
    setDiscountMessage(`Congratulations! You've unlocked ${discountLevel} savings!`);
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    messageTimeoutRef.current = setTimeout(() => setDiscountMessage(null), 5000);
    
    // Add pulse effect to progress bar
    setJustReachedThreshold(true);
    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    animationTimeoutRef.current = setTimeout(() => setJustReachedThreshold(false), 3000);
  };

  useEffect(() => {
    // Animate progress bar
    setAnimatedWidth(0);
    const animationTimeout: NodeJS.Timeout = setTimeout(() => {
      setAnimatedWidth(progressPercentage);
    }, 100);
    
    // Detect threshold crossing
    if (currentTotal > previousTotal.current) {
      // Check if we've crossed a threshold
      for (let i = 0; i < discountTiers.length; i++) {
        const threshold = discountTiers[i].threshold;
        if (currentTotal >= threshold && previousTotal.current < threshold) {
          // We crossed this threshold
          setShowConfetti(true);
          fireConfetti(discountTiers[i].discount);
          break;
        }
      }
    }
    
    // Update previous total
    previousTotal.current = currentTotal;
    
    // Cleanup timeouts on unmount
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      clearTimeout(animationTimeout);
    };
  }, [progressPercentage, currentTotal, discountTiers]);

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
          }}>
            Unlock More Savings
          </h3>
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
            paddingRight: "12px",
            animation: justReachedThreshold ? "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none"
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
                background: isReached ? tier.color : "white",
                border: `3px solid ${isReached ? tier.color : "#E5E7EB"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "700",
                color: isReached ? "white" : "#64748B",
                transition: "all 0.3s",
                cursor: "pointer",
                zIndex: 2
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

      {/* Congratulatory message overlay */}
      {discountMessage && (
        <div 
          style={{
            position: "fixed",
            top: "25%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(255, 255, 255, 0.95)",
            padding: "24px 32px",
            borderRadius: "12px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            textAlign: "center",
            zIndex: 50,
            animation: "fade-in 0.5s ease-out forwards",
            maxWidth: "90vw"
          }}
          role="alert"
          aria-live="polite"
        >
          <div style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "#2563EB",
            marginBottom: "8px"
          }}>
            {discountMessage}
          </div>
          <div style={{
            fontSize: "16px",
            color: "#4B5563"
          }}>
            Keep adding items for even bigger savings!
          </div>
        </div>
      )}

      {/* Custom animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translate(-50%, -60%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </div>
  );
};

export default EnhancedDiscountProgressBar;