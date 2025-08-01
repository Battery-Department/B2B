import React from 'react'

interface VolumeDiscountProgressSimpleProps {
  currentAmount: number
  discountTiers: Array<{
    threshold: number
    percentage: number
  }>
}

export default function VolumeDiscountProgressSimple({ 
  currentAmount, 
  discountTiers 
}: VolumeDiscountProgressSimpleProps) {
  const maxAmount = discountTiers[discountTiers.length - 1].threshold
  const progressPercentage = Math.min((currentAmount / maxAmount) * 100, 100)
  
  const activeDiscount = discountTiers.reduce((acc: any, tier: any) => {
    return currentAmount >= tier.threshold ? tier : acc
  }, null)
  
  const nextTier = discountTiers.find((tier: any) => tier.threshold > currentAmount)
  const amountToNext = nextTier ? nextTier.threshold - currentAmount : 0
  
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium text-gray-700">Volume Discount Progress</h3>
          {activeDiscount && (
            <span className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
              {activeDiscount.percentage}% off active
            </span>
          )}
        </div>
        {nextTier && (
          <span className="text-sm text-gray-500">
            ${amountToNext.toLocaleString()} to next tier
          </span>
        )}
      </div>
      
      {/* Progress bar container */}
      <div className="relative">
        {/* Background track */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          {/* Progress fill */}
          <div 
            className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Tier markers */}
        {discountTiers.map((tier, index) => {
          const position = (tier.threshold / maxAmount) * 100
          const isPassed = currentAmount >= tier.threshold
          
          return (
            <div
              key={tier.threshold}
              className="absolute top-0 -translate-x-1/2"
              style={{ left: `${position}%` }}
            >
              {/* Vertical line */}
              <div 
                className={`w-0.5 h-6 -mt-2 transition-colors duration-300 ${
                  isPassed ? 'bg-green-600' : 'bg-gray-400'
                }`}
              />
              
              {/* Label below */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 pt-1">
                <div className="text-center whitespace-nowrap">
                  <p className={`text-xs font-medium ${
                    isPassed ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {tier.percentage}%
                  </p>
                  <p className="text-xs text-gray-400">
                    ${(tier.threshold / 1000).toFixed(1)}k
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        
        {/* Current amount indicator */}
        {currentAmount > 0 && currentAmount < maxAmount && (
          <div
            className="absolute -top-1 w-3 h-3 bg-green-600 rounded-full border-2 border-white shadow-sm -translate-x-1/2 transition-all duration-500"
            style={{ left: `${progressPercentage}%` }}
          />
        )}
      </div>
      
      {/* Bottom spacing for labels */}
      <div className="h-12" />
    </div>
  )
}