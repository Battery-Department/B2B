'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  TrendingUp
} from 'lucide-react'

interface QuizResults {
  teamSize: string
  dailyRuntime: string
  tools: string[]
  budget: number
  recommendation: BatteryRecommendation
  savings: number
  confidence: number
}

interface BatteryRecommendation {
  packageName: string
  totalPrice: number
  originalPrice: number
  batteries: Array<{
    type: '6Ah' | '9Ah' | '15Ah'
    quantity: number
    price: number
    runtime: string
  }>
  totalRuntime: string
  perfectFor: string[]
  whyChosen: string
}

export default function QuizResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<QuizResults | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading and result calculation
    const timer = setTimeout(() => {
      const quizResponses = JSON.parse(localStorage.getItem('quiz-responses') || '{}')
      const calculatedResults = calculateRecommendation(quizResponses)
      setResults(calculatedResults)
      setIsLoading(false)
      setShowConfetti(true)
      
      // Remove confetti after animation
      setTimeout(() => setShowConfetti(false), 3000)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const calculateRecommendation = (responses: any): QuizResults => {
    const teamSize = responses['project-size'] || 'medium'
    const runtime = responses['daily-runtime'] || 'moderate'
    const tools = responses['primary-tools'] || []
    const budget = responses['budget-range'] || 1000

    // Calculate recommendation based on responses
    let recommendation: BatteryRecommendation

    if (teamSize === 'small') {
      recommendation = {
        packageName: 'Starter Crew Package',
        totalPrice: 1494,
        originalPrice: 1494,
        batteries: [
          { type: '6Ah', quantity: 2, price: 298, runtime: '8 hours' },
          { type: '9Ah', quantity: 2, price: 478, runtime: '13 hours' },
          { type: '15Ah', quantity: 2, price: 718, runtime: '20 hours' }
        ],
        totalRuntime: '64 hours continuous work',
        perfectFor: ['1-3 person teams', 'Residential projects', 'Daily construction work'],
        whyChosen: 'Perfect balance of power and portability for small teams'
      }
    } else if (teamSize === 'large') {
      recommendation = {
        packageName: 'Full Workforce Solution',
        totalPrice: 12400,
        originalPrice: 12400,
        batteries: [
          { type: '6Ah', quantity: 15, price: 2235, runtime: '60 hours' },
          { type: '9Ah', quantity: 20, price: 4780, runtime: '130 hours' },
          { type: '15Ah', quantity: 15, price: 5385, runtime: '150 hours' }
        ],
        totalRuntime: '450 hours continuous work',
        perfectFor: ['7-12 person teams', 'General contractors', 'Major projects'],
        whyChosen: 'Enterprise-grade solution for maximum productivity'
      }
    } else {
      recommendation = {
        packageName: 'Mid-Size Crew Package',
        totalPrice: 5675,
        originalPrice: 5675,
        batteries: [
          { type: '6Ah', quantity: 10, price: 1490, runtime: '40 hours' },
          { type: '9Ah', quantity: 10, price: 2390, runtime: '65 hours' },
          { type: '15Ah', quantity: 5, price: 1795, runtime: '50 hours' }
        ],
        totalRuntime: '224 hours continuous work',
        perfectFor: ['4-6 person teams', 'Commercial projects', 'Professional contractors'],
        whyChosen: 'Most popular choice - optimal power for growing teams'
      }
    }

    return {
      teamSize,
      dailyRuntime: runtime,
      tools,
      budget,
      recommendation,
      savings: recommendation.originalPrice - recommendation.totalPrice,
      confidence: 94
    }
  }

  const handleAddToCart = () => {
    // Add to cart logic
    localStorage.setItem('recommended-package', JSON.stringify(results?.recommendation))
    router.push('/customer/products?recommended=true')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Battery Fleet Recommendation',
        text: `I just got my personalized battery recommendation: ${results?.recommendation.packageName}`,
        url: window.location.href,
      })
    }
  }

  const handleDownloadReport = () => {
    // Generate and download PDF report
    console.log('Downloading report...')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center space-y-6 px-4">
          <div className="relative">
            <div className="w-20 h-20 mx-auto">
              <Battery size={80} className="text-blue-500 animate-pulse" />
            </div>
            <div className="absolute inset-0 animate-spin">
              <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full mx-auto"></div>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">Analyzing Your Needs...</h2>
            <p className="text-gray-600">Calculating the perfect battery solution for your team</p>
          </div>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (!results) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 relative overflow-hidden">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-green-500 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-green-200 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} className="text-green-500" />
              <div>
                <h1 className="font-bold text-gray-900">Quiz Complete!</h1>
                <p className="text-sm text-gray-600">{results.confidence}% Match Confidence</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <Share2 size={18} />
              </button>
              <button
                onClick={handleDownloadReport}
                className="p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Download size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Confidence Score */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-green-200">
          <div className="text-center space-y-4">
            <div className="relative w-24 h-24 mx-auto">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="#10b981" 
                  strokeWidth="8" 
                  fill="none"
                  strokeDasharray={`${results.confidence * 2.51} 251`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">{results.confidence}%</span>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Perfect Match Found!</h2>
              <p className="text-gray-600">Based on your team size, daily usage, and budget preferences</p>
            </div>
          </div>
        </div>

        {/* Recommendation Card */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-blue-200">
          <div className="space-y-6">
            {/* Package Header */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-3">
                <Star size={16} className="fill-current" />
                Recommended for You
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {results.recommendation.packageName}
              </h3>
              <p className="text-gray-600 mb-4">{results.recommendation.whyChosen}</p>
              
              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl font-bold text-green-600">
                    ${results.recommendation.totalPrice.toLocaleString()}
                  </span>
                  <span className="text-xl text-gray-400 line-through">
                    ${results.recommendation.originalPrice.toLocaleString()}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  <TrendingUp size={14} />
                  Save ${results.savings.toLocaleString()} ({Math.round((results.savings / results.recommendation.originalPrice) * 100)}%)
                </div>
              </div>
            </div>

            {/* Battery Breakdown */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Battery size={18} />
                What's Included
              </h4>
              {results.recommendation.batteries.map((battery, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Zap size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {battery.quantity}× {battery.type} FlexVolt
                      </div>
                      <div className="text-sm text-gray-600">{battery.runtime} total runtime</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">${battery.price}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Key Benefits */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle size={18} />
                Perfect For
              </h4>
              <div className="space-y-2">
                {results.recommendation.perfectFor.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Runtime Summary */}
            <div className="bg-blue-50 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock size={20} className="text-blue-600" />
                <span className="font-semibold text-blue-900">Total Runtime</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {results.recommendation.totalRuntime}
              </div>
              <div className="text-sm text-blue-700 mt-1">
                Continuous operation across your entire team
              </div>
            </div>
          </div>
        </div>

        {/* Your Responses Summary */}
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Wrench size={18} />
            Your Requirements
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-gray-600">Team Size</div>
              <div className="font-medium capitalize">{results.teamSize.replace('_', ' ')}</div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-600">Daily Usage</div>
              <div className="font-medium capitalize">{results.dailyRuntime}</div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-600">Budget Range</div>
              <div className="font-medium">${results.budget.toLocaleString()}+</div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-600">Primary Tools</div>
              <div className="font-medium">{results.tools.length} selected</div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-lg mx-auto space-y-3">
          <button
            onClick={handleAddToCart}
            className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-2xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <ShoppingCart size={20} />
            <span>Add ${results.recommendation.totalPrice.toLocaleString()} Package to Cart</span>
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/customer/products')}
              className="flex-1 py-3 px-4 border-2 border-blue-200 text-blue-600 font-medium rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              View All Products
            </button>
            <button
              onClick={() => router.push('/customer/chat')}
              className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              Ask Questions
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="text-center text-xs text-gray-500 space-y-1">
            <div>🔒 Zero-hassle replacements • 30-day money back guarantee</div>
            <div>📞 Expert support • Direct-to-jobsite delivery available</div>
          </div>
        </div>
      </div>

      {/* Bottom spacing for fixed footer */}
      <div className="h-48"></div>
    </div>
  )
}