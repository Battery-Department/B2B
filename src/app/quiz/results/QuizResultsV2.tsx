'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  Star, 
  Users, 
  Clock, 
  Zap, 
  DollarSign,
  ShoppingCart,
  Share2,
  Download,
  ArrowRight,
  Battery,
  Wrench,
  TrendingUp,
  Phone,
  MessageCircle,
  Shield,
  Truck,
  Calculator,
  BarChart3,
  Building,
  Home,
  Award,
  Package
} from 'lucide-react'
import { getBrandById } from '@/config/quiz-brands'
import { BrandVoltageOptions } from '@/types/quiz-v2'

interface QuizResultsProps {
  sessionId: string
}

interface ResultsData {
  session: any
  recommendations: any
  leadScore: number
}

export default function QuizResultsV2({ sessionId }: QuizResultsProps) {
  const router = useRouter()
  const [results, setResults] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    loadResults()
  }, [sessionId])
  
  const loadResults = async () => {
    try {
      const response = await fetch(`/api/quiz/v2/results?sessionId=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      }
    } catch (error) {
      console.error('Failed to load results:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Battery className="w-16 h-16 text-[#006FEE] mx-auto mb-4" />
          </motion.div>
          <p className="text-lg text-gray-600">Analyzing your requirements...</p>
        </div>
      </div>
    )
  }
  
  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Results not found</p>
        </div>
      </div>
    )
  }
  
  const { session, recommendations, leadScore } = results
  const brand = getBrandById(session.selectedBrand)
  const isProfessional = session.userType === 'professional'
  
  // Calculate savings based on crew size and usage
  const annualSavings = isProfessional 
    ? Math.round((session.crewSize || 4) * 800) // $800 per crew member average
    : 127 // DIY savings
  
  const monthlyPayment = isProfessional
    ? Math.round(annualSavings / 12)
    : 0
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-sm text-[#006FEE]">
            <Battery className="w-4 h-4" />
            <span className="font-semibold">Lithi</span>
            <span className="text-gray-400">•</span>
            <span>Your Personalized Results</span>
          </div>
        </div>
      </header>
      
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="flex justify-center py-8"
      >
        <div className="relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-20"
          />
          <CheckCircle className="w-20 h-20 text-green-500 relative" />
        </div>
      </motion.div>
      
      {/* Main Content */}
      <main className="px-4 pb-32 max-w-4xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {isProfessional 
              ? `${session.userName || 'Contractor'}, here's your ${session.companyName || 'company'} battery solution`
              : `Great choices, ${session.userName || 'there'}! Here's your perfect setup`}
          </h1>
          
          {isProfessional ? (
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#006FEE]">${annualSavings.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Annual Savings</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{Math.round(leadScore * 100)}%</div>
                <div className="text-sm text-gray-600">Fleet Efficiency Score</div>
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full text-green-700 mb-6">
              <Award className="w-5 h-5" />
              <span className="font-medium">Smart Shopper - Save ${annualSavings} on this setup!</span>
            </div>
          )}
        </motion.div>
        
        {/* Brand Header */}
        {brand && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-8"
          >
            <div 
              className="inline-block text-4xl font-bold mb-2"
              style={{ color: brand.color }}
            >
              {brand.displayName}
            </div>
            <p className="text-gray-600">
              {brand.voltage} Platform • {isProfessional ? 'Professional Grade' : 'Perfect for DIY'}
            </p>
          </motion.div>
        )}
        
        {/* Recommendations Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          {/* Primary Recommendation */}
          <div className="bg-white rounded-2xl border-2 border-[#006FEE] p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-[#006FEE] rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold">Recommended Fleet Package</h2>
              <span className="ml-auto text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                Best Value
              </span>
            </div>
            
            {isProfessional ? (
              <div className="space-y-4">
                {/* High Capacity Batteries */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <Package className="w-12 h-12 text-[#006FEE] flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {brand?.displayName} 9.0Ah Battery {session.crewSize || 6}-Pack
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      Perfect for your {session.userSegment || 'trade'} crew's 6-8 hour daily usage
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-[#006FEE]">
                        $759
                      </span>
                      <span className="text-gray-500 line-through">$894</span>
                      <span className="text-green-600 font-medium">Save 15%</span>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Cold weather rated to -4°F
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        3-year commercial warranty
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        12-month no-hassle replacement
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={() => setSelectedProducts(prev => new Set(prev).add('9ah-pack'))}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      selectedProducts.has('9ah-pack')
                        ? 'bg-green-500 text-white'
                        : 'bg-[#006FEE] text-white hover:bg-[#0050B3]'
                    }`}
                  >
                    {selectedProducts.has('9ah-pack') ? 'Added ✓' : 'Add to Cart'}
                  </button>
                </div>
                
                {/* Gang Charger */}
                {session.crewSize && session.crewSize > 2 && (
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <Zap className="w-12 h-12 text-amber-500 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">6-Bay Gang Charger Station</h3>
                      <p className="text-gray-600 text-sm mb-2">
                        Charge your entire fleet simultaneously
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-[#006FEE]">$299</span>
                        <span className="text-gray-500 line-through">$399</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedProducts(prev => new Set(prev).add('charger'))}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        selectedProducts.has('charger')
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {selectedProducts.has('charger') ? 'Added ✓' : 'Add'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* DIY Starter Pack */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <Package className="w-12 h-12 text-[#006FEE] flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {brand?.displayName} 4.0Ah Battery 2-Pack Starter Bundle
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      Perfect for your weekend projects
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-[#006FEE]">$149</span>
                      <span className="text-gray-500 line-through">$196</span>
                      <span className="text-green-600 font-medium">Save $47</span>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        45-minute quick charge
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        3-year warranty
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Free shipping included
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={() => setSelectedProducts(prev => new Set(prev).add('starter-pack'))}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      selectedProducts.has('starter-pack')
                        ? 'bg-green-500 text-white'
                        : 'bg-[#006FEE] text-white hover:bg-[#0050B3]'
                    }`}
                  >
                    {selectedProducts.has('starter-pack') ? 'Added ✓' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Value Props */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-4 rounded-xl border border-gray-200 text-center"
            >
              <Shield className="w-8 h-8 text-[#006FEE] mx-auto mb-2" />
              <div className="font-semibold">12-Month</div>
              <div className="text-sm text-gray-600">Warranty</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-4 rounded-xl border border-gray-200 text-center"
            >
              <Truck className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="font-semibold">Free Shipping</div>
              <div className="text-sm text-gray-600">Orders ${isProfessional ? '200' : '99'}+</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-4 rounded-xl border border-gray-200 text-center"
            >
              <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <div className="font-semibold">Same Day</div>
              <div className="text-sm text-gray-600">Processing</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-4 rounded-xl border border-gray-200 text-center"
            >
              <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="font-semibold">50K+</div>
              <div className="text-sm text-gray-600">Happy Customers</div>
            </motion.div>
          </div>
          
          {/* Portal Preview (Professional only) */}
          {isProfessional && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-r from-[#006FEE] to-[#0050B3] rounded-2xl p-6 text-white"
            >
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-8 h-8" />
                <h2 className="text-xl font-bold">Your Contractor Portal is Ready!</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Real-time battery inventory tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Usage analytics by crew member</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Automated reorder alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Expense reports for accounting</span>
                  </div>
                </div>
              </div>
              <button className="w-full bg-white text-[#006FEE] py-3 px-6 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                Activate Your Portal Access
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </motion.div>
      </main>
      
      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <div className="text-2xl font-bold text-gray-900">
              Total: ${selectedProducts.size > 0 ? 
                (isProfessional ? 
                  (selectedProducts.has('9ah-pack') ? 759 : 0) + (selectedProducts.has('charger') ? 299 : 0)
                  : selectedProducts.has('starter-pack') ? 149 : 0
                ).toLocaleString() : '0'}
            </div>
            {isProfessional && monthlyPayment > 0 && (
              <div className="text-sm text-gray-600">
                or ${monthlyPayment}/month with fleet financing
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Call for Quote
            </button>
            <button 
              className="px-8 py-3 bg-gradient-to-r from-[#006FEE] to-[#0050B3] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              disabled={selectedProducts.size === 0}
            >
              <ShoppingCart className="w-5 h-5" />
              Checkout ({selectedProducts.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}