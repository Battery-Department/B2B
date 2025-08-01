'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QuizRecommendation, ContractorTestimonial } from '@/types/quiz-v2'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Users, 
  Star, 
  ShoppingCart, 
  TrendingUp,
  Shield,
  Award,
  Quote,
  Plus,
  Minus,
  ChevronDown,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface ResultsWithCommunityInsightsProps {
  recommendation: QuizRecommendation
  onAddToCart: (productIds: string[]) => void
  className?: string
}

// Mock contractor testimonials
const testimonials: ContractorTestimonial[] = [
  {
    id: 'test-1',
    name: 'Mike Rodriguez',
    company: 'Rodriguez Construction',
    role: 'Site Foreman',
    quote: 'The 9Ah batteries keep my crew running all day. No more mid-job charging breaks.',
    image: '/api/placeholder/48/48',
    verified: true,
    products: ['flexvolt-9ah'],
    rating: 5
  },
  {
    id: 'test-2', 
    name: 'Sarah Chen',
    company: 'Chen Electric',
    role: 'Master Electrician',
    quote: 'Best investment I made. The volume discount saved me $300 on my first order.',
    image: '/api/placeholder/48/48',
    verified: true,
    products: ['flexvolt-6ah', 'flexvolt-9ah'],
    rating: 5
  },
  {
    id: 'test-3',
    name: 'Tony Williams',
    company: 'Williams HVAC',
    role: 'Owner',
    quote: 'FlexVolt system eliminated battery confusion. One platform for all our tools.',
    image: '/api/placeholder/48/48',
    verified: true,
    products: ['flexvolt-15ah'],
    rating: 5
  }
]

type ViewMode = 'recommendation' | 'insights' | 'testimonials'

export function ResultsWithCommunityInsights({
  recommendation,
  onAddToCart,
  className
}: ResultsWithCommunityInsightsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('recommendation')
  const [quantities, setQuantities] = useState<Record<string, number>>(
    recommendation.products.reduce((acc, product) => ({
      ...acc,
      [product.id]: product.quantity
    }), {})
  )
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const totalPrice = recommendation.products.reduce((sum, product) => 
    sum + (product.price * (quantities[product.id] || product.quantity)), 0
  )
  const discountAmount = totalPrice * (recommendation.discountPercentage / 100)
  const finalPrice = totalPrice - discountAmount

  const updateQuantity = (productId: string, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + change)
    }))
  }

  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    const productIds = recommendation.products.flatMap(product => 
      Array(quantities[product.id] || product.quantity).fill(product.id)
    )
    await onAddToCart(productIds)
    setIsAddingToCart(false)
  }

  return (
    <div className={cn("w-full max-w-4xl mx-auto space-y-6", className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-[#0A051E]">
          Your Personalized Battery Solution
        </h1>
        <p className="text-[#64748B] text-lg">
          Based on your needs and {recommendation.peerComparison?.similarUsers.toLocaleString()} similar contractors
        </p>
      </motion.div>

      {/* View Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center"
      >
        <div className="inline-flex bg-[#F8FAFC] rounded-lg p-1 border border-[#E2E8F0]">
          {[
            { id: 'recommendation', label: 'Your Plan', icon: Award },
            { id: 'insights', label: 'Community Data', icon: BarChart3 },
            { id: 'testimonials', label: 'Reviews', icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as ViewMode)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                viewMode === tab.id
                  ? "bg-white text-[#006FEE] shadow-sm"
                  : "text-[#64748B] hover:text-[#374151]"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content Views */}
      <AnimatePresence mode="wait">
        {viewMode === 'recommendation' && (
          <motion.div
            key="recommendation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Confidence Score */}
            <div className="bg-gradient-to-r from-[#006FEE] to-[#0050B3] rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Match Confidence</h3>
                  <p className="text-blue-100">Based on your quiz responses</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{Math.round(recommendation.confidence * 100)}%</div>
                  <div className="text-blue-100 text-sm">Accuracy</div>
                </div>
              </div>
            </div>

            {/* Recommended Products */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#0A051E]">Recommended Products</h3>
              {recommendation.products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white border-2 border-[#E6F4FF] rounded-xl p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-[#0A051E]">{product.name}</h4>
                        <span className="bg-[#10B981] text-white text-xs px-2 py-1 rounded-full">
                          {product.matchScore}% Match
                        </span>
                      </div>
                      <p className="text-[#64748B] mb-2">{product.reason}</p>
                      <p className="text-sm text-[#059669] font-medium">SKU: {product.sku}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#0A051E]">${product.price}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F8FAFC]"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {quantities[product.id] || product.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          className="w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center hover:bg-[#F8FAFC]"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pricing Summary */}
            <div className="bg-[#F8FAFC] rounded-xl p-6 border border-[#E2E8F0]">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Subtotal</span>
                  <span className="font-medium">${totalPrice.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#10B981]">
                    <span>Volume Discount ({recommendation.discountPercentage}%)</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-[#006FEE]">${finalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Community Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-[#E6F4FF] rounded-xl p-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-3 text-[#006FEE]" />
                <p className="text-2xl font-bold text-[#0A051E]">
                  {recommendation.peerComparison?.similarUsers.toLocaleString()}
                </p>
                <p className="text-[#64748B]">Similar Contractors</p>
              </div>
              <div className="bg-white border border-[#E6F4FF] rounded-xl p-6 text-center">
                <Star className="w-8 h-8 mx-auto mb-3 text-[#006FEE]" />
                <p className="text-2xl font-bold text-[#0A051E]">
                  {recommendation.peerComparison?.satisfactionRate}%
                </p>
                <p className="text-[#64748B]">Satisfaction Rate</p>
              </div>
              <div className="bg-white border border-[#E6F4FF] rounded-xl p-6 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-3 text-[#006FEE]" />
                <p className="text-2xl font-bold text-[#0A051E]">
                  ${recommendation.peerComparison?.averageSpend.toLocaleString()}
                </p>
                <p className="text-[#64748B]">Average Spend</p>
              </div>
            </div>

            {/* Reasoning */}
            <div className="bg-white border border-[#E6F4FF] rounded-xl p-6">
              <h3 className="text-xl font-bold text-[#0A051E] mb-4">Why This Recommendation?</h3>
              <ul className="space-y-2">
                {recommendation.reasoning.map((reason, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#006FEE] rounded-full mt-2 flex-shrink-0" />
                    <span className="text-[#374151]">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {viewMode === 'testimonials' && (
          <motion.div
            key="testimonials"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white border border-[#E6F4FF] rounded-xl p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#E6F4FF] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[#006FEE] font-bold text-lg">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-[#0A051E]">{testimonial.name}</h4>
                        {testimonial.verified && (
                          <Shield className="w-4 h-4 text-[#10B981]" />
                        )}
                      </div>
                      <p className="text-sm text-[#64748B] mb-2">
                        {testimonial.role} at {testimonial.company}
                      </p>
                      <div className="flex items-center gap-1 mb-3">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-[#FDB813] text-[#FDB813]" />
                        ))}
                      </div>
                      <Quote className="w-5 h-5 text-[#E2E8F0] mb-2" />
                      <p className="text-[#374151] italic">"{testimonial.quote}"</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add to Cart Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="sticky bottom-0 bg-white border-t border-[#E2E8F0] p-6 -mx-6"
      >
        <Button
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          className={cn(
            "w-full bg-gradient-to-r from-[#006FEE] to-[#0050B3] text-white",
            "text-lg font-semibold py-4 group",
            isAddingToCart && "animate-pulse"
          )}
        >
          {isAddingToCart ? (
            <>
              <span className="inline-block animate-spin mr-2">🔄</span>
              Adding to Cart...
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart - ${finalPrice.toFixed(2)}
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
        
        <div className="flex items-center justify-center gap-4 text-sm text-[#64748B] mt-3">
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            <span>30-Day Returns</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span>Volume Discounts</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            <span>4.9/5 Rating</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}