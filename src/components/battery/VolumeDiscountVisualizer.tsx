'use client';

import React from 'react';
import { TrendingUp, Gift, Target, ArrowRight } from 'lucide-react';

interface DiscountTier {
  threshold: number;
  percentage: number;
  label?: string;
  color?: string;
}

interface VolumeDiscountVisualizerProps {
  currentAmount: number;
  discountTiers: DiscountTier[];
  onTargetClick?: (tier: DiscountTier) => void;
  className?: string;
}

export function VolumeDiscountVisualizer({ 
  currentAmount, 
  discountTiers, 
  onTargetClick,
  className = '' 
}: VolumeDiscountVisualizerProps) {
  
  // Find current discount tier
  const currentTier = discountTiers
    .slice()
    .reverse()
    .find(tier => currentAmount >= tier.threshold);
  
  // Find next tier
  const nextTier = discountTiers.find(tier => tier.threshold > currentAmount);
  
  // Calculate progress to next tier
  const progressToNext = nextTier ? 
    Math.min((currentAmount / nextTier.threshold) * 100, 100) : 100;
  
  // Calculate savings
  const currentSavings = currentTier ? (currentAmount * currentTier.percentage / 100) : 0;
  const potentialSavings = nextTier ? (currentAmount * nextTier.percentage / 100) : currentSavings;

  const getDiscountColor = (percentage: number) => {
    if (percentage >= 20) return 'from-purple-500 to-pink-500';
    if (percentage >= 15) return 'from-blue-500 to-purple-500';
    if (percentage >= 10) return 'from-green-500 to-blue-500';
    return 'from-gray-400 to-gray-500';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={`bg-white rounded-2xl p-6 border-2 border-gray-100 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <TrendingUp size={24} className="text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Volume Discounts</h3>
          <p className="text-gray-600 text-sm">Save more as you buy more</p>
        </div>
      </div>

      {/* Current Status */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Current Order</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(currentAmount)}</span>
        </div>
        
        {currentTier ? (
          <div className="flex items-center gap-2 text-green-600">
            <Gift size={16} />
            <span className="font-semibold">
              You're saving {currentTier.percentage}% ({formatCurrency(currentSavings)})
            </span>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">
            Add more items to unlock discounts
          </div>
        )}
      </div>

      {/* Progress to Next Tier */}
      {nextTier && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress to {nextTier.percentage}% discount
            </span>
            <span className="text-sm font-semibold text-blue-600">
              {formatCurrency(nextTier.threshold - currentAmount)} to go
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatCurrency(0)}</span>
            <span>{formatCurrency(nextTier.threshold)}</span>
          </div>

          {/* Potential savings */}
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <Target size={14} />
              <span className="text-sm font-medium">
                Reach {formatCurrency(nextTier.threshold)} to save an extra {formatCurrency(potentialSavings - currentSavings)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Discount Tiers */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 mb-3">All Discount Tiers</h4>
        {discountTiers.map((tier, index) => {
          const isActive = currentAmount >= tier.threshold;
          const isNext = tier === nextTier;
          
          return (
            <div
              key={tier.threshold}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                isActive 
                  ? 'border-green-300 bg-green-50' 
                  : isNext 
                    ? 'border-blue-300 bg-blue-50 hover:bg-blue-100 cursor-pointer' 
                    : 'border-gray-200 bg-gray-50'
              }`}
              onClick={() => isNext && onTargetClick?.(tier)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-r ${getDiscountColor(tier.percentage)}`}>
                    {tier.percentage}%
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {tier.percentage}% off orders {formatCurrency(tier.threshold)}+
                    </p>
                    {tier.label && (
                      <p className="text-sm text-gray-600">{tier.label}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isActive && (
                    <span className="text-green-600 font-semibold text-sm">Active</span>
                  )}
                  {isNext && (
                    <ArrowRight size={16} className="text-blue-600" />
                  )}
                </div>
              </div>

              {isNext && (
                <div className="mt-2 text-sm text-blue-700">
                  Click to see products that reach this tier
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Call to Action */}
      {nextTier && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Quick Tip</p>
              <p className="text-sm opacity-90">
                Add {formatCurrency(nextTier.threshold - currentAmount)} more to unlock {nextTier.percentage}% savings
              </p>
            </div>
            <Gift size={24} className="opacity-80" />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper hook to calculate discount recommendations
export function useDiscountRecommendations(currentItems: Record<string, number>, productPrices: Record<string, number>) {
  const discountTiers = [
    { threshold: 1000, percentage: 10, label: 'Small fleet discount' },
    { threshold: 2500, percentage: 15, label: 'Medium fleet discount' },
    { threshold: 5000, percentage: 20, label: 'Large fleet discount' }
  ];

  const currentAmount = Object.entries(currentItems).reduce((total, [productId, quantity]) => {
    return total + (quantity * (productPrices[productId] || 0));
  }, 0);

  const nextTier = discountTiers.find(tier => tier.threshold > currentAmount);
  const amountNeeded = nextTier ? nextTier.threshold - currentAmount : 0;

  // Generate smart recommendations to reach next tier
  const getRecommendations = () => {
    if (!nextTier || amountNeeded <= 0) return [];

    const recommendations = [];
    const availableProducts = Object.entries(productPrices);

    // Find products that would get close to the threshold
    for (const [productId, price] of availableProducts) {
      const quantityNeeded = Math.ceil(amountNeeded / price);
      if (quantityNeeded <= 10) { // Reasonable quantity
        recommendations.push({
          productId,
          quantity: quantityNeeded,
          cost: quantityNeeded * price,
          savingsUnlocked: (currentAmount + quantityNeeded * price) * nextTier.percentage / 100
        });
      }
    }

    return recommendations.sort((a, b) => a.cost - b.cost).slice(0, 3);
  };

  return {
    currentAmount,
    discountTiers,
    nextTier,
    amountNeeded,
    recommendations: getRecommendations()
  };
}