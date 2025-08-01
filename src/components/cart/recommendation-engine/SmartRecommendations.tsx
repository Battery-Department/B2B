// Terminal 3 Phase 2: Smart Recommendations Component
// AI-powered cross-sells, upsells, and intelligent product suggestions

'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Star, Zap, TrendingUp, Users, Package, ArrowRight } from 'lucide-react'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  msrp: number
}

export interface UserProfile {
  customerId: string
  jobType: 'residential' | 'commercial' | 'industrial' | 'mixed'
  experienceLevel: 'beginner' | 'intermediate' | 'professional'
  purchaseHistory: string[]
  preferences: {
    budget: 'budget' | 'mid-range' | 'premium'
    workload: 'light' | 'moderate' | 'heavy'
    brands: string[]
  }
}

export interface Order {
  id: string
  items: CartItem[]
  total: number
  createdAt: string
}

export interface RecommendationProps {
  cartItems: CartItem[]
  userProfile?: UserProfile
  orderHistory?: Order[]
  onAddToCart: (item: CartItem) => void
  className?: string
}

export interface RecommendationItem {
  id: string
  name: string
  price: number
  msrp: number
  image: string
  reason: string
  confidence: number
  category: 'frequently_bought' | 'complete_kit' | 'upgrade' | 'seasonal' | 'trending'
  savings: number
  compatibility: string[]
  features: string[]
  isPopular?: boolean
  isOnSale?: boolean
}

const SmartRecommendations: React.FC<RecommendationProps> = ({
  cartItems,
  userProfile,
  orderHistory = [],
  onAddToCart,
  className = ''
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  // Generate intelligent recommendations
  useEffect(() => {
    generateRecommendations()
  }, [cartItems, userProfile, orderHistory])

  const generateRecommendations = async () => {
    setIsLoading(true)
    
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      const allRecommendations: RecommendationItem[] = []

      // 1. Frequently bought together recommendations
      const frequentlyBought = getFrequentlyBoughtTogether(cartItems, orderHistory)
      allRecommendations.push(...frequentlyBought)

      // 2. Complete your kit recommendations
      const completeKit = getCompleteKitRecommendations(cartItems, userProfile)
      allRecommendations.push(...completeKit)

      // 3. Upgrade recommendations
      const upgrades = getUpgradeRecommendations(cartItems, userProfile)
      allRecommendations.push(...upgrades)

      // 4. Seasonal/job-specific recommendations
      const seasonal = getSeasonalRecommendations(userProfile)
      allRecommendations.push(...seasonal)

      // 5. Trending items
      const trending = getTrendingRecommendations()
      allRecommendations.push(...trending)

      // Sort by confidence score and remove duplicates
      const uniqueRecommendations = allRecommendations
        .filter((item, index, arr) => arr.findIndex(r => r.id === item.id) === index)
        .filter(item => !cartItems.some(cartItem => cartItem.id === item.id))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 8) // Limit to 8 recommendations

      setRecommendations(uniqueRecommendations)
    } catch (error) {
      console.error('Error generating recommendations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Frequently bought together analysis
  const getFrequentlyBoughtTogether = (cartItems: CartItem[], orderHistory: Order[]): RecommendationItem[] => {
    const cartProductIds = cartItems.map(item => item.id)
    const itemCombinations: Record<string, number> = {}

    // Analyze order history for combinations
    orderHistory.forEach(order => {
      const orderProductIds = order.items.map(item => item.id)
      
      cartProductIds.forEach(cartId => {
        if (orderProductIds.includes(cartId)) {
          orderProductIds.forEach(orderId => {
            if (orderId !== cartId && !cartProductIds.includes(orderId)) {
              const key = `${cartId}+${orderId}`
              itemCombinations[key] = (itemCombinations[key] || 0) + 1
            }
          })
        }
      })
    })

    // Convert to recommendations
    return Object.entries(itemCombinations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([combination, count]) => {
        const [, productId] = combination.split('+')
        return createRecommendationItem(
          productId,
          'frequently_bought',
          `Often bought with items in your cart`,
          Math.min(0.9, count / 10)
        )
      })
  }

  // Complete kit recommendations
  const getCompleteKitRecommendations = (cartItems: CartItem[], userProfile?: UserProfile): RecommendationItem[] => {
    const recommendations: RecommendationItem[] = []
    const hasCharger = cartItems.some(item => item.name.toLowerCase().includes('charger'))
    const hasTool = cartItems.some(item => item.name.toLowerCase().includes('tool'))

    // Suggest charger if not in cart
    if (!hasCharger) {
      recommendations.push(createRecommendationItem(
        'DCB115',
        'complete_kit',
        'Complete your battery kit with fast charging',
        0.85
      ))
    }

    // Suggest tools based on batteries
    if (!hasTool && cartItems.length > 0) {
      const toolRecommendation = userProfile?.jobType === 'commercial' ? 'DCD771C2' : 'DCS570B'
      recommendations.push(createRecommendationItem(
        toolRecommendation,
        'complete_kit',
        'Perfect tool for your FlexVolt batteries',
        0.8
      ))
    }

    // Suggest carrying case
    if (cartItems.length >= 2) {
      recommendations.push(createRecommendationItem(
        'DWST08202',
        'complete_kit',
        'Professional storage for your batteries',
        0.75
      ))
    }

    return recommendations
  }

  // Upgrade recommendations
  const getUpgradeRecommendations = (cartItems: CartItem[], userProfile?: UserProfile): RecommendationItem[] => {
    const recommendations: RecommendationItem[] = []

    // Suggest higher capacity batteries
    cartItems.forEach(item => {
      if (item.id === '6Ah') {
        recommendations.push(createRecommendationItem(
          '9Ah',
          'upgrade',
          'Upgrade to 50% longer runtime',
          0.7
        ))
      } else if (item.id === '9Ah') {
        recommendations.push(createRecommendationItem(
          '15Ah',
          'upgrade',
          'Maximum runtime for demanding jobs',
          0.65
        ))
      }
    })

    return recommendations
  }

  // Seasonal recommendations
  const getSeasonalRecommendations = (userProfile?: UserProfile): RecommendationItem[] => {
    const currentMonth = new Date().getMonth()
    const recommendations: RecommendationItem[] = []

    // Winter months (Nov-Feb): Indoor tools
    if (currentMonth >= 10 || currentMonth <= 1) {
      recommendations.push(createRecommendationItem(
        'DCS355B',
        'seasonal',
        'Perfect for winter indoor projects',
        0.6
      ))
    }

    // Spring/Summer (Mar-Aug): Outdoor tools
    if (currentMonth >= 2 && currentMonth <= 7) {
      recommendations.push(createRecommendationItem(
        'DCCS620B',
        'seasonal',
        'Essential for outdoor season work',
        0.6
      ))
    }

    return recommendations
  }

  // Trending recommendations
  const getTrendingRecommendations = (): RecommendationItem[] => {
    return [
      createRecommendationItem(
        '12Ah',
        'trending',
        'New high-capacity battery - trending now',
        0.55
      )
    ]
  }

  // Helper function to create recommendation items
  const createRecommendationItem = (
    productId: string,
    category: RecommendationItem['category'],
    reason: string,
    confidence: number
  ): RecommendationItem => {
    const productData = getProductData(productId)
    
    return {
      id: productId,
      name: productData.name,
      price: productData.price,
      msrp: productData.msrp,
      image: productData.image,
      reason,
      confidence,
      category,
      savings: productData.msrp - productData.price,
      compatibility: productData.compatibility,
      features: productData.features,
      isPopular: productData.isPopular,
      isOnSale: productData.savings > 0
    }
  }

  // Product data lookup
  const getProductData = (productId: string) => {
    const products: Record<string, any> = {
      '6Ah': {
        name: '6Ah FlexVolt Battery',
        price: 95,
        msrp: 169,
        image: '/images/battery-6ah.jpg',
        compatibility: ['DeWalt 20V MAX', 'DeWalt FLEXVOLT 60V MAX'],
        features: ['4 hour runtime', 'Fast charging', 'LED fuel gauge'],
        isPopular: false,
        savings: 74
      },
      '9Ah': {
        name: '9Ah FlexVolt Battery',
        price: 125,
        msrp: 249,
        image: '/images/battery-9ah.jpg',
        compatibility: ['DeWalt 20V MAX', 'DeWalt FLEXVOLT 60V MAX'],
        features: ['6.5 hour runtime', 'Fast charging', 'LED fuel gauge'],
        isPopular: true,
        savings: 124
      },
      '15Ah': {
        name: '15Ah FlexVolt Battery',
        price: 245,
        msrp: 379,
        image: '/images/battery-15ah.jpg',
        compatibility: ['DeWalt 20V MAX', 'DeWalt FLEXVOLT 60V MAX'],
        features: ['10 hour runtime', 'Fast charging', 'LED fuel gauge'],
        isPopular: false,
        savings: 134
      },
      '12Ah': {
        name: '12Ah FlexVolt Battery',
        price: 195,
        msrp: 299,
        image: '/images/battery-12ah.jpg',
        compatibility: ['DeWalt 20V MAX', 'DeWalt FLEXVOLT 60V MAX'],
        features: ['8 hour runtime', 'Fast charging', 'LED fuel gauge', 'NEW'],
        isPopular: true,
        savings: 104
      },
      'DCB115': {
        name: 'Fast Charger',
        price: 49,
        msrp: 79,
        image: '/images/charger.jpg',
        compatibility: ['All FlexVolt Batteries'],
        features: ['Fast 1-hour charging', 'LED indicators', 'Wall mount'],
        isPopular: true,
        savings: 30
      },
      'DCD771C2': {
        name: 'Drill/Driver Kit',
        price: 149,
        msrp: 199,
        image: '/images/drill.jpg',
        compatibility: ['DeWalt 20V MAX'],
        features: ['2-speed transmission', 'LED light', 'Compact design'],
        isPopular: true,
        savings: 50
      },
      'DWST08202': {
        name: 'ToughSystem Case',
        price: 79,
        msrp: 99,
        image: '/images/case.jpg',
        compatibility: ['Universal'],
        features: ['Weather resistant', 'Stackable', 'Heavy duty'],
        isPopular: false,
        savings: 20
      }
    }

    return products[productId] || {
      name: 'Unknown Product',
      price: 0,
      msrp: 0,
      image: '/images/placeholder.jpg',
      compatibility: [],
      features: [],
      isPopular: false,
      savings: 0
    }
  }

  const filteredRecommendations = activeCategory === 'all' 
    ? recommendations 
    : recommendations.filter(item => item.category === activeCategory)

  const categoryIcons = {
    frequently_bought: <Users size={16} />,
    complete_kit: <Package size={16} />,
    upgrade: <TrendingUp size={16} />,
    seasonal: <Star size={16} />,
    trending: <Zap size={16} />
  }

  if (recommendations.length === 0 && !isLoading) {
    return null
  }

  return (
    <div className={`bg-white rounded-lg border border-blue-100 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Smart Recommendations</h3>
              <p className="text-sm text-gray-600">AI-powered suggestions just for you</p>
            </div>
          </div>
          
          {recommendations.length > 0 && (
            <div className="text-sm text-gray-500">
              {recommendations.length} suggestion{recommendations.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
              activeCategory === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {Array.from(new Set(recommendations.map(r => r.category))).map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeCategory === category
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {categoryIcons[category]}
              {category.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                <div className="w-full h-32 bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRecommendations.map(item => (
              <RecommendationCard
                key={item.id}
                item={item}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredRecommendations.length === 0 && activeCategory !== 'all' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500">No recommendations in this category</p>
            <button
              onClick={() => setActiveCategory('all')}
              className="text-blue-600 hover:text-blue-700 font-medium mt-2"
            >
              View all recommendations
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Individual recommendation card component
const RecommendationCard: React.FC<{
  item: RecommendationItem
  onAddToCart: (item: CartItem) => void
}> = ({ item, onAddToCart }) => {
  const handleAddToCart = () => {
    onAddToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      msrp: item.msrp
    })
  }

  return (
    <div className="group relative bg-gray-50 rounded-lg p-4 hover:bg-white hover:shadow-lg transition-all duration-200 border border-transparent hover:border-blue-200">
      {/* Product Image Placeholder */}
      <div className="w-full h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
        <Package size={32} className="text-gray-400" />
        
        {item.isPopular && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
            POPULAR
          </div>
        )}
        
        {item.isOnSale && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            SALE
          </div>
        )}

        {/* Confidence indicator */}
        <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 text-xs font-medium px-2 py-1 rounded">
          {Math.round(item.confidence * 100)}% match
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">
          {item.name}
        </h4>
        
        <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
          {item.reason}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-600">${item.price}</span>
            {item.savings > 0 && (
              <span className="text-xs text-gray-500 line-through">${item.msrp}</span>
            )}
          </div>
          
          {item.savings > 0 && (
            <span className="text-xs font-medium text-green-600">
              Save ${item.savings}
            </span>
          )}
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1">
          {item.features.slice(0, 2).map((feature, index) => (
            <span
              key={index}
              className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 group-hover:shadow-md"
        >
          <Plus size={16} />
          Add to Cart
        </button>
      </div>
    </div>
  )
}

export default SmartRecommendations