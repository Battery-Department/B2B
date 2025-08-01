'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QuizRecommendation } from '@/types/quiz-v2'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  Users, 
  Star, 
  ShoppingCart, 
  Zap,
  Award,
  Target,
  ArrowRight,
  Info,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SmartRecommendationsProps {
  recommendation: QuizRecommendation
  conversionTriggers: any[]
  optimizedPricing: any
  onAddToCart: (products: any[]) => void
  onCustomizeRecommendation?: (changes: any) => void
  showConversionOptimization?: boolean
  className?: string
}

interface SmartInsight {
  type: 'efficiency' | 'savings' | 'compatibility' | 'upgrade'
  title: string
  description: string
  value: string
  icon: React.ComponentType<any>
  priority: number
}

export function SmartRecommendations({
  recommendation,
  conversionTriggers,
  optimizedPricing,
  onAddToCart,
  onCustomizeRecommendation,
  showConversionOptimization = true,
  className
}: SmartRecommendationsProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    recommendation.products.map(p => p.id)
  )
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)

  const smartInsights: SmartInsight[] = [
    {
      type: 'efficiency',
      title: 'Workflow Optimization',
      description: 'This combination reduces downtime by 34% based on similar contractors',
      value: '+34% efficiency',
      icon: Zap,
      priority: 9
    },
    {
      type: 'savings',
      title: 'Smart Bundle Savings',
      description: `Save $${optimizedPricing?.bundleRecommendation?.savings || 85} vs buying separately`,
      value: `$${optimizedPricing?.bundleRecommendation?.savings || 85} saved`,
      icon: DollarSign,
      priority: 8
    },
    {
      type: 'compatibility',
      title: 'Future-Proof Choice',
      description: 'Compatible with 95+ DeWalt tools in your category',
      value: '95+ tools',
      icon: Target,
      priority: 7
    },
    {
      type: 'upgrade',
      title: 'Upgrade Recommendation',
      description: 'Consider 15Ah for 40% longer runtime on heavy tools',
      value: '+40% runtime',
      icon: TrendingUp,
      priority: 6
    }
  ]

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleOptimizeRecommendation = async () => {
    setIsOptimizing(true)
    
    // Simulate optimization process
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Apply optimization based on current selection
    if (onCustomizeRecommendation) {
      onCustomizeRecommendation({
        selectedProducts,
        optimizationType: 'user_customized'
      })
    }
    
    setIsOptimizing(false)
  }

  const handleAddToCart = () => {
    const selectedProductDetails = recommendation.products.filter(p => 
      selectedProducts.includes(p.id)
    )
    onAddToCart(selectedProductDetails)
  }

  const totalSelectedPrice = recommendation.products
    .filter(p => selectedProducts.includes(p.id))
    .reduce((sum, p) => sum + (p.price * p.quantity), 0)

  const finalPrice = optimizedPricing 
    ? totalSelectedPrice * (1 - optimizedPricing.discountPercentage / 100)
    : totalSelectedPrice

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="flex items-center justify-center gap-2">
          <Award className="w-6 h-6 text-[#006FEE]" />
          <h2 className="text-2xl font-bold text-[#0A051E]">Smart Recommendations</h2>
        </div>
        <p className="text-[#64748B]">
          Optimized for your workflow with {recommendation.confidence * 100}% confidence
        </p>
      </motion.div>

      {/* Smart Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {smartInsights
          .sort((a, b) => b.priority - a.priority)
          .slice(0, 4)
          .map((insight, index) => (
          <motion.div
            key={insight.type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className="bg-white border border-[#E6F4FF] rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#E6F4FF] rounded-lg flex items-center justify-center flex-shrink-0">
                <insight.icon className="w-5 h-5 text-[#006FEE]" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-[#0A051E] text-sm">{insight.title}</h4>
                <p className="text-xs text-[#64748B] mt-1">{insight.description}</p>
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle className="w-3 h-3 text-[#10B981]" />
                  <span className="text-xs font-medium text-[#10B981]">{insight.value}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Product Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#0A051E]">Customize Your Package</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAlternatives(!showAlternatives)}
          >
            {showAlternatives ? 'Hide' : 'Show'} Alternatives
          </Button>
        </div>

        <div className="space-y-3">
          {recommendation.products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={cn(
                "border-2 rounded-xl p-4 transition-all cursor-pointer",
                selectedProducts.includes(product.id)
                  ? "border-[#006FEE] bg-[#E6F4FF]"
                  : "border-[#E2E8F0] bg-white hover:border-[#93C5FD]"
              )}
              onClick={() => handleProductToggle(product.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "w-3 h-3 rounded-full border-2 transition-all",
                      selectedProducts.includes(product.id)
                        ? "bg-[#006FEE] border-[#006FEE]"
                        : "border-[#D1D5DB]"
                    )} />
                    <h4 className="font-semibold text-[#0A051E]">{product.name}</h4>
                    <span className="bg-[#10B981] text-white text-xs px-2 py-1 rounded-full">
                      {product.matchScore}% Match
                    </span>
                  </div>
                  <p className="text-sm text-[#64748B] mb-2">{product.reason}</p>
                  <div className="flex items-center gap-4 text-xs text-[#64748B]">
                    <span>SKU: {product.sku}</span>
                    <span>Qty: {product.quantity}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-[#0A051E]">${product.price}</p>
                  <p className="text-sm text-[#64748B]">each</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Alternative Products */}
        <AnimatePresence>
          {showAlternatives && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t pt-4"
            >
              <h4 className="font-medium text-[#0A051E] mb-3">Alternative Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { id: 'alt-1', name: 'FlexVolt 12Ah Battery', price: 185, match: 87 },
                  { id: 'alt-2', name: 'Compact 3Ah Battery', price: 65, match: 75 }
                ].map(alt => (
                  <div key={alt.id} className="border border-[#E2E8F0] rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-[#0A051E] text-sm">{alt.name}</h5>
                        <span className="text-xs text-[#64748B]">{alt.match}% Match</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#0A051E]">${alt.price}</p>
                        <Button size="sm" variant="outline" className="text-xs">
                          Swap
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Conversion Triggers */}
      {showConversionOptimization && conversionTriggers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {conversionTriggers.slice(0, 2).map((trigger, index) => (
            <div
              key={index}
              className={cn(
                "p-4 rounded-lg border-l-4",
                trigger.type === 'urgency' && "bg-red-50 border-red-400",
                trigger.type === 'social_proof' && "bg-blue-50 border-blue-400",
                trigger.type === 'discount' && "bg-green-50 border-green-400"
              )}
            >
              <div className="flex items-center gap-2">
                {trigger.type === 'urgency' && <Clock className="w-4 h-4 text-red-600" />}
                {trigger.type === 'social_proof' && <Users className="w-4 h-4 text-blue-600" />}
                {trigger.type === 'discount' && <DollarSign className="w-4 h-4 text-green-600" />}
                <span className="font-medium text-sm">{trigger.content}</span>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Pricing Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-[#F8FAFC] rounded-xl p-6 border border-[#E2E8F0]"
      >
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[#64748B]">Selected items ({selectedProducts.length})</span>
            <span className="font-medium">${totalSelectedPrice.toFixed(2)}</span>
          </div>
          
          {optimizedPricing?.discountPercentage > 0 && (
            <div className="flex justify-between items-center text-green-600">
              <span>Quiz optimization discount</span>
              <span>-${(totalSelectedPrice - finalPrice).toFixed(2)}</span>
            </div>
          )}
          
          <div className="border-t pt-3 flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span className="text-[#006FEE]">${finalPrice.toFixed(2)}</span>
          </div>

          {optimizedPricing?.discountReason && (
            <div className="flex items-center gap-2 text-sm text-[#059669]">
              <Info className="w-4 h-4" />
              <span>{optimizedPricing.discountReason}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Button
          onClick={handleOptimizeRecommendation}
          disabled={isOptimizing}
          variant="outline"
          className="flex-1"
        >
          {isOptimizing ? (
            <>
              <span className="animate-spin mr-2">⚡</span>
              Optimizing...
            </>
          ) : (
            <>
              <Target className="w-4 h-4 mr-2" />
              Optimize Selection
            </>
          )}
        </Button>

        <Button
          onClick={handleAddToCart}
          disabled={selectedProducts.length === 0}
          className="flex-1 bg-gradient-to-r from-[#006FEE] to-[#0050B3] group"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart - ${finalPrice.toFixed(2)}
          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      </motion.div>

      {/* Trust Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex items-center justify-center gap-6 text-sm text-[#64748B] pt-4"
      >
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500" />
          <span>4.9/5 Rating</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>30-Day Returns</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-blue-500" />
          <span>10K+ Contractors</span>
        </div>
      </motion.div>
    </div>
  )
}