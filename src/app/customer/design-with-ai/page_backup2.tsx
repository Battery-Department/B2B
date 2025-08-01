'use client'

import React, { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useEngravingStore } from '@/lib/engraving-store'

// Now using modular battery system with fixed positioning
import VolumeDiscountProgressSimple from '@/components/engraving/VolumeDiscountProgressSimple'
import { toast } from 'react-hot-toast'
import { 
  ShoppingCart, CreditCard, FileText, Truck, Shield, Package, 
  Battery, CheckCircle, Trash2, Plus, Minus, Info, TrendingUp,
  Edit2, Save, X, Check, Sparkles, Zap, Clock, Loader2,
  MessageCircle, Send, Bot, User, Upload, Camera,
  Share2, Mail, Phone, MessageSquare, Linkedin
} from 'lucide-react'

// Direct imports for enhanced components
import EnhancedEngravingDesigner from '@/components/engraving/EnhancedEngravingDesigner'
import EnhancedBatteryPreview from '@/components/engraving/EnhancedBatteryPreview'
import NaturalLanguageDesigner from '@/components/engraving/NaturalLanguageDesigner'
import NaturalLanguageDesignerMinimal from '@/components/engraving/NaturalLanguageDesignerMinimal'
import MobileChatSystem from '@/components/engraving/MobileChatSystem'
import FullScreenBatteryEditor from '@/components/engraving/FullScreenBatteryEditor'
import KeyBenefitsSlideshow from './KeyBenefitsSlideshow'

// Remotion video player component - disabled for Vercel deployment
// const RemotionVideoPlayer = dynamic(() => import('@/components/engraving/RemotionVideoPlayer'), {
//   ssr: false
// })

// Battery data
const batteriesData = [
  {
    id: '6Ah',
    name: '6Ah FlexVolt Battery',
    runtime: 'Up to 4 hours',
    weight: '1.9 lbs',
    price: 95,
    retailPrice: 130,
    msrp: 130,
    voltage: "20V/60V",
    features: "Compatible with all DeWalt 20V/60V tools",
    workOutput: '225 screws / 175 ft cuts',
    chargingTime: '45 minutes',
    depositPercentage: 10,
    popular: false
  },
  {
    id: '9Ah',
    name: '9Ah FlexVolt Battery',
    runtime: 'Up to 6.5 hours',
    weight: '2.4 lbs',
    price: 125,
    retailPrice: 195,
    msrp: 195,
    voltage: "20V/60V",
    features: "Compatible with all DeWalt 20V/60V tools",
    workOutput: '340 screws / 260 ft cuts',
    chargingTime: '55 minutes',
    depositPercentage: 10,
    popular: true
  },
  {
    id: '15Ah',
    name: '15Ah FlexVolt Battery',
    runtime: 'Up to 10 hours',
    weight: '3.2 lbs',
    price: 245,
    retailPrice: 290,
    msrp: 290,
    voltage: "20V/60V",
    features: "Compatible with all DeWalt 20V/60V tools",
    workOutput: '560 screws / 430 ft cuts',
    chargingTime: '90 minutes',
    depositPercentage: 10,
    popular: false
  }
]

const discountTiers = [
  { threshold: 1000, percentage: 10 },
  { threshold: 2500, percentage: 15 },
  { threshold: 5000, percentage: 20 }
]

// Simple analytics function for this page
const trackEvent = (eventName: string, properties?: any) => {
  console.log('Analytics Event:', eventName, properties)
}

// Enhanced Product Card Component
const ProductCard = ({ product, quantity, onUpdateQuantity, showSuccess, onShowSuccess }: any) => {
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Sync local quantity with parent quantity
  useEffect(() => {
    setLocalQuantity(quantity);
  }, [quantity]);
  
  // Auto-update cart after delay
  useEffect(() => {
    if (localQuantity !== quantity) {
      clearTimeout(updateTimeoutRef.current);
      setIsUpdating(true);
      
      updateTimeoutRef.current = setTimeout(() => {
        onUpdateQuantity(product.id, localQuantity - quantity);
        setIsUpdating(false);
        if (localQuantity > quantity && onShowSuccess) {
          onShowSuccess(product.id);
        }
      }, 800);
    } else {
      setIsUpdating(false);
    }
    
    return () => {
      clearTimeout(updateTimeoutRef.current);
      setIsUpdating(false);
    };
  }, [localQuantity, quantity, product.id, onUpdateQuantity, onShowSuccess]);
  
  const lineTotal = product.price * localQuantity;
  
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all relative">
      {/* Success indicator */}
      <div className={`absolute top-3 right-3 transition-all duration-300 ${showSuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
        <CheckCircle className="w-5 h-5 text-green-600" />
      </div>
      
      {/* Product header - Centered like screenshot */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.id} FlexVolt Battery</h3>
        <p className="text-sm text-gray-600 mb-4">{product.voltage} MAX • {product.runtime}</p>
        
        {/* Large Price Display - Deposit Model */}
        <div className="mb-4">
          <div className="mb-2">
            <span className="text-3xl font-bold text-gray-900">${product.price}</span>
            <span className="text-sm text-gray-500 line-through ml-2">${product.retailPrice}</span>
          </div>
          <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
            {product.depositPercentage}% Deposit
          </div>
        </div>
      </div>
      
      {/* Quantity selector - Matches screenshot layout */}
      <div className="bg-gray-50 p-4 rounded-lg">
        {/* Quick add buttons */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[5, 10, 25].map((increment) => (
            <button
              key={increment}
              onClick={() => setLocalQuantity(localQuantity + increment)}
              className="py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 hover:border-blue-300 transition-all"
            >
              +{increment}
            </button>
          ))}
        </div>
        
        {/* Centered quantity controls - thumb-friendly */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <button
            onClick={() => setLocalQuantity(Math.max(0, localQuantity - 1))}
            className="w-12 h-12 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-blue-400 flex items-center justify-center transition-all shadow-sm"
          >
            <Minus className="w-5 h-5 text-gray-600" />
          </button>
          <div className="relative">
            <input
              type="number"
              value={localQuantity}
              onChange={(e) => setLocalQuantity(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 h-12 text-center text-lg border-2 border-gray-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {isUpdating && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
              </div>
            )}
          </div>
          <button
            onClick={() => setLocalQuantity(localQuantity + 1)}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        {/* Line total */}
        {localQuantity > 0 && (
          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <span className={`font-bold text-lg text-gray-900 transition-opacity ${isUpdating ? 'opacity-60' : ''}`}>
              ${lineTotal.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Minimal Volume Discount Progress Component for Order Summary
const MinimalVolumeDiscountProgress = ({ currentAmount, discountTiers }: any) => {
  const maxAmount = discountTiers[discountTiers.length - 1].threshold;
  const activeDiscount = discountTiers.reduce((acc: any, tier: any) => {
    return currentAmount >= tier.threshold ? tier : acc;
  }, null);
  const nextTier = discountTiers.find((tier: any) => tier.threshold > currentAmount);
  
  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Volume Discount Progress</h4>
      
      {/* Simple Green Progress Lines */}
      <div className="space-y-2">
        {discountTiers.map((tier: any, index: number) => {
          const isActive = currentAmount >= tier.threshold;
          const progress = Math.min((currentAmount / tier.threshold) * 100, 100);
          const isCurrentTier = !isActive && (!nextTier || tier.threshold <= nextTier.threshold);
          
          return (
            <div key={tier.threshold} className="flex items-center gap-3">
              {/* Simple green line with percentage inside */}
              <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden relative">
                <div 
                  className={`h-full transition-all duration-500 relative ${
                    isActive ? 'bg-green-500' : isCurrentTier ? 'bg-green-300' : 'bg-gray-200'
                  }`}
                  style={{ width: isActive ? '100%' : isCurrentTier ? `${progress}%` : '0%' }}
                >
                  {/* Percentage inside the bar */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xs font-bold ${
                      isActive || (isCurrentTier && progress > 30) ? 'text-white' : 'text-gray-600'
                    }`}>
                      {tier.percentage}%
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Threshold amount */}
              <div className={`text-xs font-medium min-w-[60px] text-right ${
                isActive ? 'text-green-600' : 'text-gray-500'
              }`}>
                ${tier.threshold >= 1000 ? `${tier.threshold/1000}k` : tier.threshold}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Minimal status */}
      {nextTier && (
        <p className="text-xs text-gray-600 mt-2">
          Add ${(nextTier.threshold - currentAmount).toLocaleString()} more for {nextTier.percentage}% off
        </p>
      )}
    </div>
  );
};

// Compact Battery Design Preview Component
const CompactBatteryDesignPreview = () => {
  const { text, primaryText, secondaryText, showSecondaryText, previewImage } = useEngravingStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [batteryData] = useState({
    line1: '',
    line2: '',
    logo: ''
  })
  
  // Get display text
  const displayText = showSecondaryText 
    ? `${primaryText}\n${secondaryText}`
    : text || primaryText
  
  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg">      
      <div className="flex justify-center">
        {/* Display saved preview image if available */}
        {previewImage ? (
          <div className="relative w-48 h-36 flex-shrink-0">
            <img 
              src={previewImage} 
              alt="Your Custom Battery Design"
              className="w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
            />
          </div>
        ) : (
          /* Fallback to default battery image */
          <div className="relative w-48 h-36 flex-shrink-0">
            <img 
              src="/9Ah FlexVolt (4).png" 
              alt="Your Custom Battery"
              className="w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
            />
          
            {/* Enlarged Text Overlay for larger battery */}
            {(displayText || Object.values(batteryData).some(v => v)) && (
              <div 
                className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-gray-800 pointer-events-none"
                style={{
                  top: '35%',
                  left: '22%',
                  right: '22%',
                  height: '30%',
                }}
              >
                <div className="text-center leading-tight overflow-hidden">
                  {batteryData.line1 && (
                    <div className="truncate">{batteryData.line1}</div>
                  )}
                  {batteryData.line2 && (
                    <div className="truncate">{batteryData.line2}</div>
                  )}
                  {batteryData.logo && (
                    <div className="truncate text-xs">Logo: {batteryData.logo.slice(0, 10)}...</div>
                  )}
                  {!Object.values(batteryData).some(v => v) && displayText && (
                    <div className="truncate">{displayText.slice(0, 15)}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  )
}

// Progressive Checkout Component
const ProgressiveCheckout = ({ orderData, onClose }: any) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    paymentMethod: 'card'
  })
  
  // Calculate totals
  const subtotal = orderData?.subtotal || 0
  const discount = orderData?.discount || 0
  const shipping = subtotal > 500 ? 0 : 25
  const tax = Math.round(subtotal * 0.0875) // 8.75% tax
  const total = subtotal - discount + shipping + tax
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create invoice
      const invoiceData = {
        id: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
        date: new Date().toISOString(),
        items: orderData?.items || [],
        subtotal,
        discount,
        shipping,
        tax,
        total,
        status: 'paid',
        customerInfo: formData,
        isEngraved: true,
        engravingText: orderData?.engravingText,
        customDesign: {
          batteryData: batteryData,
          designText: text,
          primaryText: text,
          quantities: quantities,
          batteryImage: '/9Ah FlexVolt (4).png' // Include the battery image path
        }
      }
      
      // Save and redirect based on payment method
      sessionStorage.setItem('completedInvoice', JSON.stringify(invoiceData))
      
      if (formData.paymentMethod === 'invoice') {
        // For invoice payment method, redirect to invoice page
        sessionStorage.setItem('invoiceData', JSON.stringify({
          ...invoiceData,
          status: 'pending', // Invoice is pending payment
          depositAmount: total * 0.1, // 10% deposit
          remainingBalance: total * 0.9 // 90% balance
        }))
        window.location.href = `/customer/invoice?orderId=${invoiceData.id}`
      } else {
        // For card payment, redirect to success page
        window.location.href = `/customer/checkout/success?orderId=${invoiceData.id}`
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mt-8 bg-white border-2 border-blue-200 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Secure Checkout</h3>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Customer Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 mb-4">Contact Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john@company.com"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Smith"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company (Optional)</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ABC Construction"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123 Main St"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="TX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  required
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12345"
                />
              </div>
            </div>
          </div>
          
          {/* Right Column - Order Summary & Payment */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 mb-4">Order Summary</h4>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Deposit (10%):</span>
                <span className="font-medium">${(subtotal * 0.1).toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-${discount.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total Due Now:</span>
                <span className="text-blue-600">${(subtotal - discount).toLocaleString()}</span>
              </div>
            </div>
            
            <div className="space-y-3 mt-6">
              <h4 className="font-semibold text-gray-900">Payment Method</h4>
              

              <div className="flex items-center gap-4 my-3">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-sm text-gray-500">or</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="mr-3"
                  />
                  <CreditCard className="w-5 h-5 mr-2" />
                  <span className="font-medium">Credit Card</span>
                </label>
                
                <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="invoice"
                    checked={formData.paymentMethod === 'invoice'}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="mr-3"
                  />
                  <FileText className="w-5 h-5 mr-2" />
                  <span className="font-medium">Send Invoice (10% Deposit)</span>
                </label>
              </div>

              {/* Credit Card Fields */}
              {formData.paymentMethod === 'card' && (
                <div className="space-y-3 mt-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="mt-8 space-y-3">
          {/* Apple Pay Button - Show only when not invoice payment */}
          {formData.paymentMethod !== 'invoice' && (
            <button
              type="button"
              onClick={() => {
                toast.success('Apple Pay integration coming soon!')
              }}
              className="w-full bg-black text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Pay with Apple Pay
            </button>
          )}
          
          {/* Complete Order Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Complete Order
              </>
            )}
          </button>
        </div>
        
        {/* Security Info & Trust Badges */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>
          
          {/* Scrolling Trust Banner */}
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-3 text-center">Join 300+ happy customers</p>
            
            <div className="trust-banner-container relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-50 via-white to-blue-50 border border-blue-100 p-3">
              {/* Left Fade Gradient */}
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
              
              {/* Right Fade Gradient */}
              <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
              
              <div className="trust-banner-track flex animate-scroll">
                <div className="trust-banner-content flex items-center gap-6 min-w-max">
                  {/* Stripe */}
                  <svg width="40" height="16" viewBox="0 0 50 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M20.3033 8.65854C20.3033 7.4878 21.1463 6.95122 22.439 6.95122C24.1707 6.95122 26.3659 7.4878 28.0488 8.31707V4.2439C26.1951 3.48781 24.3902 3.21951 22.439 3.21951C18.2293 3.21951 15.4146 5.51219 15.4146 8.90244C15.4146 14.122 22.9024 13.2293 22.9024 16.0488C22.9024 17.3415 21.7805 17.878 20.3033 17.878C18.2781 17.878 15.9024 17.0488 13.9024 16.0488V20.122C16.0488 20.9024 18.2781 21.2195 20.3033 21.2195C24.5610 21.2195 27.6585 18.9756 27.6585 15.4634C27.6585 9.95122 20.3033 10.9024 20.3033 8.65854Z" fill="#635BFF"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M31.4146 3.4878V7.04878C31.6829 6.95122 32.0488 6.95122 32.439 6.95122C35.3171 6.95122 36.8293 8.73171 36.8293 11.6098V20.7317H31.4146V12.0488C31.4146 10.6829 30.7805 10.0488 29.5366 10.0488C29.1707 10.0488 28.878 10.122 28.5854 10.2195V20.7317H23.1707V3.4878H31.4146Z" fill="#635BFF"/>
                    <path d="M6.04878 14.9268C5.70732 14.9268 5.39024 14.7805 5.14634 14.5366L0.439024 9.82927C-0.146341 9.24391 -0.146341 8.29268 0.439024 7.70732C1.02439 7.12195 1.97561 7.12195 2.56098 7.70732L6.04878 11.1951L13.439 3.80488C14.0244 3.21951 14.9756 3.21951 15.561 3.80488C16.1463 4.39024 16.1463 5.34146 15.561 5.92683L7.04878 14.439C6.92683 14.561 6.78049 14.6585 6.61585 14.7317C6.45122 14.8049 6.25610 14.8537 6.04878 14.9268Z" fill="#00D924"/>
                  </svg>

                  {/* Visa */}
                  <svg width="40" height="12" viewBox="0 0 50 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.0244 1.46341L16.878 14.5366H12.6829L15.8293 1.46341H20.0244Z" fill="#1434CB"/>
                    <path d="M31.9024 1.89024L27.6585 14.5366H23.6585L25.5122 9.07317L23.2195 2.4878C23.122 2.24391 22.9268 2.07317 22.6829 1.95122L17.7805 0.341463H23.5122C24.0488 0.341463 24.5366 0.707317 24.6829 1.21951L25.9756 5.95122L29.4146 1.89024H31.9024Z" fill="#1434CB"/>
                    <path d="M41.9024 14.5366H46.1463L42.5366 1.46341H38.9268C38.4878 1.46341 38.1463 1.78049 37.9756 2.19512L32.878 14.5366H37.3171L38.1463 12.3171H43.3171L41.9024 14.5366ZM39.2195 8.97561L41.2195 4.70732L42.4146 8.97561H39.2195Z" fill="#1434CB"/>
                    <path d="M11.0976 1.46341L6.9024 10.6829L6.41463 8.31707C5.85366 6.41463 4.24391 4.2439 2.36585 3.14634L6.12195 14.5366H10.6098L17.3659 1.46341H11.0976Z" fill="#1434CB"/>
                    <path d="M5.80488 1.46341H0.341463L0.292683 1.68293C5.90244 3.02439 9.58537 6.26829 11.0976 10.6829L9.75610 3.04878C9.53659 2.09756 8.80488 1.46341 7.95122 1.46341H5.80488Z" fill="#EB001B"/>
                  </svg>

                  {/* Mastercard */}
                  <svg width="40" height="24" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="19" cy="15" r="12" fill="#EB001B"/>
                    <circle cx="31" cy="15" r="12" fill="#F79E1B"/>
                    <path d="M25 7.5C27.5 10 27.5 20 25 22.5C22.5 20 22.5 10 25 7.5Z" fill="#FF5F00"/>
                  </svg>

                  {/* American Express */}
                  <svg width="40" height="24" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="50" height="30" rx="4" fill="#006FCF"/>
                    <path d="M8.5 9.5H13.5L15 12L16.5 9.5H21.5V20.5H16.5V15L15 17.5L13.5 15V20.5H8.5V9.5Z" fill="white"/>
                    <path d="M23 9.5H33V12.5H25V14H32V16.5H25V17.5H33V20.5H23V9.5Z" fill="white"/>
                    <path d="M35 9.5H40L42 12.5L44 9.5H49L45.5 15L49 20.5H44L42 17.5L40 20.5H35L38.5 15L35 9.5Z" fill="white"/>
                  </svg>

                  {/* Apple Pay */}
                  <svg width="40" height="16" viewBox="0 0 50 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.8049 6.07317C17.4146 6.65854 16.7317 7.02439 16.0488 7C15.9756 6.31707 16.2927 5.60976 16.6829 5.14634C17.0732 4.63415 17.7561 4.31707 18.3415 4.2439C18.4146 4.95122 18.1463 5.63415 17.8049 6.07317ZM18.3415 7.14634C17.3415 7.09756 16.4878 7.73171 16 7.73171C15.5122 7.73171 14.7805 7.17073 13.9512 7.19512C12.9024 7.21951 11.9268 7.80488 11.4146 8.73171C10.3171 10.6098 11.122 13.4634 12.1707 15.0244C12.6829 15.7805 13.2927 16.6098 14.122 16.5854C14.9024 16.561 15.2195 16.0976 16.1951 16.0976C17.1707 16.0976 17.439 16.5854 18.2927 16.561C19.1463 16.5366 19.6829 15.8049 20.1951 15.0488C20.7561 14.2195 20.9756 13.4146 21 13.3902C20.9756 13.3659 18.7317 12.561 18.7073 9.95122C18.6829 7.80488 20.4634 6.78049 20.5366 6.73171C19.6341 5.41463 18.2439 5.26829 17.8049 5.24391V6.07317H18.3415V7.14634Z" fill="#000000"/>
                    <path d="M25.9512 4.92683V16.4634H28.0732V12.4634H31.2195C33.7073 12.4634 35.4146 10.8537 35.4146 8.4878C35.4146 6.122 33.7561 4.48780 31.3415 4.48780H25.9512V4.92683ZM28.0732 6.63415H30.7317C32.3659 6.63415 33.2195 7.46341 33.2195 8.4878C33.2195 9.51219 32.3659 10.3415 30.7317 10.3415H28.0732V6.63415Z" fill="#000000"/>
                    <path d="M36.6829 13.9268C36.6829 15.561 37.9024 16.5854 39.7805 16.5854C41.6585 16.5854 42.878 15.561 42.878 13.9268C42.878 12.2927 41.6585 11.2683 39.7805 11.2683C37.9024 11.2683 36.6829 12.2927 36.6829 13.9268ZM40.7317 13.9268C40.7317 14.8537 40.2439 15.4146 39.7805 15.4146C39.3171 15.4146 38.8293 14.8537 38.8293 13.9268C38.8293 13 39.3171 12.4390 39.7805 12.4390C40.2439 12.4390 40.7317 13 40.7317 13.9268Z" fill="#000000"/>
                  </svg>
                </div>
                
                {/* Duplicate set for seamless loop */}
                <div className="trust-banner-content flex items-center gap-6 min-w-max">
                  {/* Stripe */}
                  <svg width="40" height="16" viewBox="0 0 50 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M20.3033 8.65854C20.3033 7.4878 21.1463 6.95122 22.439 6.95122C24.1707 6.95122 26.3659 7.4878 28.0488 8.31707V4.2439C26.1951 3.48781 24.3902 3.21951 22.439 3.21951C18.2293 3.21951 15.4146 5.51219 15.4146 8.90244C15.4146 14.122 22.9024 13.2293 22.9024 16.0488C22.9024 17.3415 21.7805 17.878 20.3033 17.878C18.2781 17.878 15.9024 17.0488 13.9024 16.0488V20.122C16.0488 20.9024 18.2781 21.2195 20.3033 21.2195C24.5610 21.2195 27.6585 18.9756 27.6585 15.4634C27.6585 9.95122 20.3033 10.9024 20.3033 8.65854Z" fill="#635BFF"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M31.4146 3.4878V7.04878C31.6829 6.95122 32.0488 6.95122 32.439 6.95122C35.3171 6.95122 36.8293 8.73171 36.8293 11.6098V20.7317H31.4146V12.0488C31.4146 10.6829 30.7805 10.0488 29.5366 10.0488C29.1707 10.0488 28.878 10.122 28.5854 10.2195V20.7317H23.1707V3.4878H31.4146Z" fill="#635BFF"/>
                    <path d="M6.04878 14.9268C5.70732 14.9268 5.39024 14.7805 5.14634 14.5366L0.439024 9.82927C-0.146341 9.24391 -0.146341 8.29268 0.439024 7.70732C1.02439 7.12195 1.97561 7.12195 2.56098 7.70732L6.04878 11.1951L13.439 3.80488C14.0244 3.21951 14.9756 3.21951 15.561 3.80488C16.1463 4.39024 16.1463 5.34146 15.561 5.92683L7.04878 14.439C6.92683 14.561 6.78049 14.6585 6.61585 14.7317C6.45122 14.8049 6.25610 14.8537 6.04878 14.9268Z" fill="#00D924"/>
                  </svg>

                  {/* Visa */}
                  <svg width="40" height="12" viewBox="0 0 50 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.0244 1.46341L16.878 14.5366H12.6829L15.8293 1.46341H20.0244Z" fill="#1434CB"/>
                    <path d="M31.9024 1.89024L27.6585 14.5366H23.6585L25.5122 9.07317L23.2195 2.4878C23.122 2.24391 22.9268 2.07317 22.6829 1.95122L17.7805 0.341463H23.5122C24.0488 0.341463 24.5366 0.707317 24.6829 1.21951L25.9756 5.95122L29.4146 1.89024H31.9024Z" fill="#1434CB"/>
                    <path d="M41.9024 14.5366H46.1463L42.5366 1.46341H38.9268C38.4878 1.46341 38.1463 1.78049 37.9756 2.19512L32.878 14.5366H37.3171L38.1463 12.3171H43.3171L41.9024 14.5366ZM39.2195 8.97561L41.2195 4.70732L42.4146 8.97561H39.2195Z" fill="#1434CB"/>
                    <path d="M11.0976 1.46341L6.9024 10.6829L6.41463 8.31707C5.85366 6.41463 4.24391 4.2439 2.36585 3.14634L6.12195 14.5366H10.6098L17.3659 1.46341H11.0976Z" fill="#1434CB"/>
                    <path d="M5.80488 1.46341H0.341463L0.292683 1.68293C5.90244 3.02439 9.58537 6.26829 11.0976 10.6829L9.75610 3.04878C9.53659 2.09756 8.80488 1.46341 7.95122 1.46341H5.80488Z" fill="#EB001B"/>
                  </svg>

                  {/* Mastercard */}
                  <svg width="40" height="24" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="19" cy="15" r="12" fill="#EB001B"/>
                    <circle cx="31" cy="15" r="12" fill="#F79E1B"/>
                    <path d="M25 7.5C27.5 10 27.5 20 25 22.5C22.5 20 22.5 10 25 7.5Z" fill="#FF5F00"/>
                  </svg>

                  {/* American Express */}
                  <svg width="40" height="24" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="50" height="30" rx="4" fill="#006FCF"/>
                    <path d="M8.5 9.5H13.5L15 12L16.5 9.5H21.5V20.5H16.5V15L15 17.5L13.5 15V20.5H8.5V9.5Z" fill="white"/>
                    <path d="M23 9.5H33V12.5H25V14H32V16.5H25V17.5H33V20.5H23V9.5Z" fill="white"/>
                    <path d="M35 9.5H40L42 12.5L44 9.5H49L45.5 15L49 20.5H44L42 17.5L40 20.5H35L38.5 15L35 9.5Z" fill="white"/>
                  </svg>

                  {/* Apple Pay */}
                  <svg width="40" height="16" viewBox="0 0 50 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.8049 6.07317C17.4146 6.65854 16.7317 7.02439 16.0488 7C15.9756 6.31707 16.2927 5.60976 16.6829 5.14634C17.0732 4.63415 17.7561 4.31707 18.3415 4.2439C18.4146 4.95122 18.1463 5.63415 17.8049 6.07317ZM18.3415 7.14634C17.3415 7.09756 16.4878 7.73171 16 7.73171C15.5122 7.73171 14.7805 7.17073 13.9512 7.19512C12.9024 7.21951 11.9268 7.80488 11.4146 8.73171C10.3171 10.6098 11.122 13.4634 12.1707 15.0244C12.6829 15.7805 13.2927 16.6098 14.122 16.5854C14.9024 16.561 15.2195 16.0976 16.1951 16.0976C17.1707 16.0976 17.439 16.5854 18.2927 16.561C19.1463 16.5366 19.6829 15.8049 20.1951 15.0488C20.7561 14.2195 20.9756 13.4146 21 13.3902C20.9756 13.3659 18.7317 12.561 18.7073 9.95122C18.6829 7.80488 20.4634 6.78049 20.5366 6.73171C19.6341 5.41463 18.2439 5.26829 17.8049 5.24391V6.07317H18.3415V7.14634Z" fill="#000000"/>
                    <path d="M25.9512 4.92683V16.4634H28.0732V12.4634H31.2195C33.7073 12.4634 35.4146 10.8537 35.4146 8.4878C35.4146 6.122 33.7561 4.48780 31.3415 4.48780H25.9512V4.92683ZM28.0732 6.63415H30.7317C32.3659 6.63415 33.2195 7.46341 33.2195 8.4878C33.2195 9.51219 32.3659 10.3415 30.7317 10.3415H28.0732V6.63415Z" fill="#000000"/>
                    <path d="M36.6829 13.9268C36.6829 15.561 37.9024 16.5854 39.7805 16.5854C41.6585 16.5854 42.878 15.561 42.878 13.9268C42.878 12.2927 41.6585 11.2683 39.7805 11.2683C37.9024 11.2683 36.6829 12.2927 36.6829 13.9268ZM40.7317 13.9268C40.7317 14.8537 40.2439 15.4146 39.7805 15.4146C39.3171 15.4146 38.8293 14.8537 38.8293 13.9268C38.8293 13 39.3171 12.4390 39.7805 12.4390C40.2439 12.4390 40.7317 13 40.7317 13.9268Z" fill="#000000"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </form>
    </motion.div>
  )
}

export default function AIBatteryDesigner() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { text, setText, setIsAnimating, quantity: engravingQuantity } = useEngravingStore()
  const [showVideo, setShowVideo] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isFromQuiz, setIsFromQuiz] = useState(false)
  const [quantities, setQuantities] = useState<{[key: string]: number}>({
    '6Ah': 0,
    '9Ah': 0,
    '15Ah': 0
  })
  const [successItems, setSuccessItems] = useState<Set<string>>(new Set())
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState<'ai-design' | 'manual-design' | 'batteries'>('ai-design')
  const [useMobileChatSystem, setUseMobileChatSystem] = useState(false)
  const [isLithiAIMobile, setIsLithiAIMobile] = useState(true)
  const [showProgressiveCheckout, setShowProgressiveCheckout] = useState(false)
  const [showBatterySelection, setShowBatterySelection] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [b2bFormData, setB2bFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    poNumber: '',
    paymentTerms: 'NET 30 (Standard)',
    engravingText: '',
    paymentType: 'invoice'
  })
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if coming from quiz
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const fromQuiz = urlParams.get('from') === 'quiz'
    const hasVideo = urlParams.get('video') === 'true'
    
    if (fromQuiz) {
      setIsFromQuiz(true)
      
      // Get stored video URL from session
      const storedVideoUrl = sessionStorage.getItem('introVideoUrl')
      if (storedVideoUrl && hasVideo) {
        setVideoUrl(storedVideoUrl)
        setShowVideo(true)
        
        // Auto-hide video after playback
        setTimeout(() => {
          setShowVideo(false)
          toast.success(`Welcome! Your ${engravingQuantity} FlexVolt batteries are ready to customize with AI.`)
        }, 5500)
      } else {
        toast.success('Welcome! Design your FlexVolt battery with AI assistance.')
      }
      
      trackEvent('quiz_to_ai_battery_transition', { 
        has_video: hasVideo,
        quantity: engravingQuantity 
      })
    }
  }, [engravingQuantity])

  // Mobile detection and enhanced mobile system preference
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      const smallMobile = window.innerWidth < 640
      setIsMobile(mobile)
      
      // Auto-enable Lithi AI mobile experience for small screens
      if (smallMobile) {
        setIsLithiAIMobile(true)
        setUseMobileChatSystem(true)
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate totals
  const subtotal = Object.entries(quantities).reduce((sum, [battery, qty]) => {
    const batteryData = batteriesData.find(b => b.id === battery);
    return sum + (batteryData ? batteryData.price * qty : 0);
  }, 0);

  // Calculate discount
  let discountPercentage = 0;
  for (const tier of [...discountTiers].reverse()) {
    if (subtotal >= tier.threshold) {
      discountPercentage = tier.percentage;
      break;
    }
  }

  const discountAmount = Math.round(subtotal * (discountPercentage / 100));
  const total = subtotal - discountAmount;
  
  // Calculate retail subtotal (using retail prices)
  const retailSubtotal = Object.entries(quantities).reduce((sum, [battery, qty]) => {
    const batteryData = batteriesData.find(b => b.id === battery);
    return sum + (batteryData ? batteryData.retailPrice * qty : 0);
  }, 0);

  const updateQuantity = (battery: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [battery]: Math.max(0, prev[battery] + delta)
    }));
  };

  const showSuccess = (batteryId: string) => {
    setSuccessItems(prev => new Set(prev).add(batteryId));
    setTimeout(() => {
      setSuccessItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(batteryId);
        return newSet;
      });
    }, 2000);
  };

  const handleAddToCart = () => {
    // Check if batteries are selected
    const totalBatteries = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
    if (totalBatteries === 0) {
      toast.error('Please select at least one battery to engrave');
      setActiveTab('batteries');
      return;
    }

    // Get current cart from localStorage - use batteryCart for consistency
    const cartStr = localStorage.getItem('batteryCart')
    const cart = cartStr ? JSON.parse(cartStr) : { items: [] }
    
    // Get the preview image from engraving store
    const { previewImage } = useEngravingStore.getState()
    
    // Create engraved battery items for each type
    Object.entries(quantities).forEach(([batteryId, qty]) => {
      if (qty > 0) {
        const battery = batteriesData.find(b => b.id === batteryId);
        if (battery) {
          const engravingItem = {
            id: `ai-engraved-battery-${batteryId}-${Date.now()}`,
            productId: `flexvolt-${batteryId.toLowerCase()}-ai-engraved`,
            name: `${battery.name} - AI Custom Engraved`,
            price: battery.price,
            quantity: qty,
            customization: {
              text: text || 'YOUR COMPANY',
              type: 'ai-laser-engraving',
              aiGenerated: true,
              previewImage: previewImage // Include the preview image
            }
          };
          cart.items.push(engravingItem);
        }
      }
    });
    
    localStorage.setItem('batteryCart', JSON.stringify(cart))
    
    toast.success('AI-designed engraved batteries added to cart!')
    
    // Redirect to cart after short delay
    setTimeout(() => {
      router.push('/customer/cart')
    }, 1500)
  }

  const handleCheckout = () => {
    // Check if batteries are selected
    const totalBatteries = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
    if (totalBatteries === 0) {
      toast.error('Please select at least one battery');
      setActiveTab('batteries');
      return;
    }

    // Prepare order data
    const orderItems = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([batteryId, qty]) => {
        const battery = batteriesData.find(b => b.id === batteryId);
        return {
          id: batteryId,
          type: batteryId,
          name: battery?.name || '',
          price: battery?.price || 0,
          quantity: qty,
          total: (battery?.price || 0) * qty,
          customization: {
            text: text || 'YOUR COMPANY',
            type: 'ai-laser-engraving',
            aiGenerated: true,
            previewImage: useEngravingStore.getState().previewImage // Include preview image
          }
        };
      });

    const orderData = {
      items: orderItems,
      quantities,
      subtotal,
      discount: discountAmount,
      discountPercentage,
      total,
      isEngraved: true,
      engravingText: text || 'YOUR COMPANY',
      aiGenerated: true,
      previewImage: useEngravingStore.getState().previewImage // Include at order level too
    };
    
    sessionStorage.setItem('orderData', JSON.stringify(orderData));
    router.push('/customer/checkout');
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get preview image from engraving store
      const { previewImage } = useEngravingStore.getState()
      
      // Create order with invoice details
      const orderDetails = {
        items: Object.entries(quantities).filter(([_, qty]) => qty > 0).map(([batteryId, qty]) => {
          const battery = batteriesData.find(b => b.id === batteryId)
          return {
            id: batteryId,
            name: battery?.name || '',
            price: battery?.price || 0,
            retailPrice: battery?.retailPrice || 0,
            quantity: qty,
            image: battery?.image || '',
            customization: {
              line1: batteryData.line1,
              line2: batteryData.line2
            },
            previewImage: previewImage
          }
        }),
        subtotal: retailSubtotal,
        depositAmount: retailSubtotal * 0.1,
        customer: {
          companyName: b2bFormData.companyName,
          firstName: b2bFormData.contactName.split(' ')[0],
          lastName: b2bFormData.contactName.split(' ').slice(1).join(' '),
          email: b2bFormData.email,
          phone: b2bFormData.phone,
          address: b2bFormData.address
        },
        batteryPreview: previewImage
      }

      // Generate invoice via API
      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderDetails)
      })

      if (!response.ok) {
        throw new Error('Failed to generate invoice')
      }

      const result = await response.json()

      if (result.success) {
        // Store invoice data
        sessionStorage.setItem('currentInvoice', JSON.stringify(result.invoice))
        
        // Close modal first
        setShowInvoiceModal(false)
        
        // Handle different payment types
        if (b2bFormData.paymentType === 'card') {
          // For card payment, redirect to Stripe checkout
          setTimeout(() => {
            router.push(`/api/stripe/checkout?invoice=${result.invoice.invoiceNumber}&amount=${result.invoice.depositAmount}`)
          }, 100)
        } else {
          // For invoice/ACH, go to invoice page
          setTimeout(() => {
            router.push(`/customer/invoice?id=${result.invoice.invoiceNumber}`)
          }, 100)
        }
      } else {
        throw new Error(result.error || 'Failed to generate invoice')
      }
    } catch (error) {
      console.error('Invoice generation error:', error)
      toast.error('Failed to generate invoice. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // State for Lithi AI mobile interface (moved outside conditional)
  const [isDesignUpdating, setIsDesignUpdating] = useState(false)
  const [showUploadOptions, setShowUploadOptions] = useState(false)
  
  // New state for two-stage data input system
  const [selectedDataType, setSelectedDataType] = useState<string | null>(null)
  const [batteryData, setBatteryData] = useState({
    line1: '',
    line2: '',
    logo: ''
  })

  const handleDesignUpdate = async (inputText: string) => {
    if (!inputText.trim() || !selectedDataType) return

    setIsDesignUpdating(true)
    
    // Process input based on selected data type
    let processedValue = inputText.trim()
    
    // Remove common command words
    processedValue = processedValue.replace(/^(enter|add|put|type|input|my|the)\s+/gi, '').trim()
    
    // Field-specific processing
    switch (selectedDataType) {
      case 'line1':
        processedValue = processedValue.replace(/line\s*(1|one)\s*(is|text)?\s*/gi, '').trim()
        // Keep original case for Line 1 
        break
      case 'line2':
        processedValue = processedValue.replace(/line\s*(2|two)\s*(is|text)?\s*/gi, '').trim()
        // Keep original case for Line 2
        break
      case 'logo':
        processedValue = processedValue.replace(/logo\s*(is|file|upload)?\s*/gi, '').trim()
        // Handle both text and potential file uploads for logo
        break
    }

    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 800))
    
    if (processedValue) {
      // Update battery data
      const updatedBatteryData = {
        ...batteryData,
        [selectedDataType]: processedValue
      }
      
      setBatteryData(updatedBatteryData)
      
      // Save to sessionStorage for checkout pre-fill
      sessionStorage.setItem('batteryDesignData', JSON.stringify(updatedBatteryData))
      
      // Update text display for immediate feedback
      setText(processedValue)
    }
    
    setIsDesignUpdating(false)
    
    // Reset selection to allow for next input
    setSelectedDataType(null)
  }

  // Show enhanced stolen tools interface
  if (isLithiAIMobile) {
    return (
      <div key="stolen-tools-interface" className="min-h-screen bg-white max-w-full overflow-x-hidden">
        {/* Header Section */}
        <div className="text-center py-8 px-4">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            End stolen tools at <span className="text-blue-600">Your Business</span>
          </h1>
          <p className="text-xl text-gray-700 font-medium">
            with laser-engraved FlexVolt batteries
          </p>
        </div>

        {/* Battery Editor Section */}
        <div className="px-4 max-w-6xl mx-auto mb-8">
          <FullScreenBatteryEditor
            canvasRef={canvasRef}
            batteryImage="/images/dewalt-flexvolt-battery.png"
            batteryData={batteryData}
            onBatteryDataChange={setBatteryData}
            onGetPricing={() => {
              setShowBatterySelection(true)
              // Smooth scroll to battery selection after a short delay
              setTimeout(() => {
                const batterySection = document.querySelector('.battery-selection-section')
                if (batterySection) {
                  batterySection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }, 100)
            }}
            onShareDesign={() => toast.success('Share feature coming soon!')}
          />
        </div>

        {/* Only show content below when battery selection is active */}
        {showBatterySelection && (
          <>
            {/* Key Benefits Slideshow */}
            <KeyBenefitsSlideshow />

            {/* Battery Selection Section */}
            <div className="battery-selection-section bg-gray-50 border-t border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Your Batteries</h2>
          
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {batteriesData.map(battery => (
              <ProductCard
                key={battery.id}
                product={battery}
                quantity={quantities[battery.id]}
                onUpdateQuantity={updateQuantity}
                showSuccess={successItems.has(battery.id)}
                onShowSuccess={showSuccess}
              />
            ))}
          </div>
        </div>



        {/* Order Summary - Always visible when batteries selected */}

        {/* Progressive Checkout */}
        {showProgressiveCheckout && subtotal > 0 && (
          <div className="p-6">
            <ProgressiveCheckout
              orderData={{
                items: Object.entries(quantities)
                  .filter(([_, qty]) => qty > 0)
                  .map(([batteryId, qty]) => {
                    const battery = batteriesData.find(b => b.id === batteryId);
                    return {
                      id: batteryId,
                      type: batteryId,
                      name: battery?.name || '',
                      price: battery?.price || 0,
                      quantity: qty,
                      total: (battery?.price || 0) * qty
                    };
                  }),
                subtotal,
                discount: discountAmount,
                discountPercentage,
                total,
                isEngraved: true,
                engravingText: text || 'YOUR COMPANY'
              }}
              onClose={() => setShowProgressiveCheckout(false)}
            />
          </div>
        )}

        {/* Order Summary */}
        {subtotal > 0 && (
          <div className="bg-white border-t border-gray-200 p-6">
            <div className="bg-white border-2 border-blue-200 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                <h3 className="text-lg font-semibold">
                  {batteryData.firstName ? `${batteryData.firstName}'s Custom Battery Summary` : 'Your Custom Battery Summary'}
                </h3>
              </div>
              
              <div className="p-6">
                {/* Your Battery Design Preview */}
                <CompactBatteryDesignPreview />
                
                {/* Selected Batteries */}
                {Object.entries(quantities).map(([batteryId, qty]) => {
                  if (qty === 0) return null;
                  const battery = batteriesData.find(b => b.id === batteryId);
                  if (!battery) return null;
                  
                  return (
                    <div key={batteryId} className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{battery.name}</p>
                        <p className="text-sm text-gray-600">Qty: {qty} × ${battery.price}</p>
                      </div>
                      <span className="font-semibold text-gray-900">
                        ${(battery.price * qty).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
                
                {/* Enhanced Payment Breakdown */}
                <div className="pt-4 mt-4 border-t border-gray-200">
                  {/* Order Summary */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Order Summary</h4>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">${subtotal.toLocaleString()}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between mb-2 text-green-600">
                        <span>Discount ({discountPercentage}%):</span>
                        <span>-${discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 mb-4">
                      <span>Total Order Value:</span>
                      <span className="text-blue-600">${total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Payment Structure */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-blue-800 mb-3">Payment Structure</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="text-sm font-medium text-gray-700">Deposit (10% now)</span>
                        </div>
                        <span className="font-bold text-green-600">${(total * 0.1).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span className="text-sm font-medium text-gray-700">Final Payment (at completion)</span>
                        </div>
                        <span className="font-bold text-blue-600">${(total * 0.9).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Information */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-gray-800 mb-1">Final Payment Process</h5>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          We'll send you an invoice for the final payment (${(total * 0.9).toFixed(2)}) when your custom engraved batteries are completed and ready for shipment.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* B2B Dual CTA Buttons */}
                <div className="space-y-4">
                  <p className="text-center font-semibold text-gray-700">Choose your preferred payment method for the 10% deposit:</p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Invoice Option */}
                    <button 
                      onClick={() => setShowInvoiceModal(true)}
                      className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-5 h-5" />
                      <div className="text-left">
                        <div>Send Me An Invoice</div>
                        <div className="text-sm font-normal">Review terms, then pay deposit</div>
                      </div>
                    </button>
                    
                    {/* Direct Payment Option */}
                    <button 
                      onClick={() => {
                        setB2bFormData({...b2bFormData, paymentType: 'card'})
                        setShowInvoiceModal(true)
                      }}
                      className="flex-1 bg-white text-blue-600 border-2 border-blue-600 px-6 py-4 rounded-lg font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-5 h-5" />
                      <div className="text-left">
                        <div>Pay 10% Deposit Online Now</div>
                        <div className="text-sm font-normal">Credit card or ACH transfer</div>
                      </div>
                    </button>
                  </div>
                  
                  <p className="text-center text-sm text-gray-600">
                    Both options require 10% deposit • Balance due NET 30 after approval
                  </p>
                </div>
                
              </div>
            </div>
          </div>
        )}

            {/* B2B Invoice Modal */}
            {showInvoiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Secure Your Custom Battery Order</h2>
                  <button onClick={() => setShowInvoiceModal(false)} className="text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Order Summary at Top */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">
                      {Object.entries(quantities).reduce((sum, [_, qty]) => sum + qty, 0)} Custom Batteries
                    </span>
                    <span className="font-bold">${retailSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-blue-600 font-semibold">
                    <span>10% Deposit Due Now:</span>
                    <span>${(retailSubtotal * 0.1).toFixed(2)}</span>
                  </div>
                </div>

                <form onSubmit={handleInvoiceSubmit} className="space-y-4">
                  <h3 className="font-bold text-lg">Company Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="Company Name*" 
                      className="w-full p-3 border rounded-lg"
                      value={b2bFormData.companyName}
                      onChange={(e) => setB2bFormData({...b2bFormData, companyName: e.target.value})}
                      required 
                    />
                    <input 
                      type="text" 
                      placeholder="Contact Name*" 
                      className="w-full p-3 border rounded-lg"
                      value={b2bFormData.contactName}
                      onChange={(e) => setB2bFormData({...b2bFormData, contactName: e.target.value})}
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="email" 
                      placeholder="Email*" 
                      className="w-full p-3 border rounded-lg"
                      value={b2bFormData.email}
                      onChange={(e) => setB2bFormData({...b2bFormData, email: e.target.value})}
                      required 
                    />
                    <input 
                      type="tel" 
                      placeholder="Phone*" 
                      className="w-full p-3 border rounded-lg"
                      value={b2bFormData.phone}
                      onChange={(e) => setB2bFormData({...b2bFormData, phone: e.target.value})}
                      required 
                    />
                  </div>
                  
                  <input 
                    type="text" 
                    placeholder="Company Address*" 
                    className="w-full p-3 border rounded-lg"
                    value={b2bFormData.address}
                    onChange={(e) => setB2bFormData({...b2bFormData, address: e.target.value})}
                    required 
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="PO Number (if available)" 
                      className="w-full p-3 border rounded-lg"
                      value={b2bFormData.poNumber}
                      onChange={(e) => setB2bFormData({...b2bFormData, poNumber: e.target.value})}
                    />
                    <select 
                      className="w-full p-3 border rounded-lg"
                      value={b2bFormData.paymentTerms}
                      onChange={(e) => setB2bFormData({...b2bFormData, paymentTerms: e.target.value})}
                    >
                      <option>NET 30 (Standard)</option>
                      <option>NET 60</option>
                      <option>Due on Receipt</option>
                    </select>
                  </div>
                  
                  <textarea 
                    placeholder="Custom engraving text for each battery (we'll confirm before production)"
                    className="w-full p-3 border rounded-lg h-24"
                    value={b2bFormData.engravingText}
                    onChange={(e) => setB2bFormData({...b2bFormData, engravingText: e.target.value})}
                    required
                  />
                  
                  <div className="mt-6">
                    <h3 className="font-bold text-lg mb-3">Choose Deposit Payment Method:</h3>
                    
                    <div className="space-y-3">
                      <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input 
                          type="radio" 
                          name="payment" 
                          value="invoice" 
                          className="mr-3" 
                          checked={b2bFormData.paymentType === 'invoice'}
                          onChange={(e) => setB2bFormData({...b2bFormData, paymentType: e.target.value})}
                        />
                        <div>
                          <p className="font-semibold">Send Invoice for 10% Deposit</p>
                          <p className="text-sm text-gray-600">We'll email invoice immediately - pay within 3 days to secure production slot</p>
                        </div>
                      </label>
                      
                      <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input 
                          type="radio" 
                          name="payment" 
                          value="card" 
                          className="mr-3"
                          checked={b2bFormData.paymentType === 'card'}
                          onChange={(e) => setB2bFormData({...b2bFormData, paymentType: e.target.value})}
                        />
                        <div>
                          <p className="font-semibold">Pay 10% Deposit Now by Card</p>
                          <p className="text-sm text-gray-600">Immediate payment secures your production slot today</p>
                        </div>
                      </label>
                      
                      <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input 
                          type="radio" 
                          name="payment" 
                          value="ach" 
                          className="mr-3"
                          checked={b2bFormData.paymentType === 'ach'}
                          onChange={(e) => setB2bFormData({...b2bFormData, paymentType: e.target.value})}
                        />
                        <div>
                          <p className="font-semibold">Pay 10% Deposit by ACH/Wire</p>
                          <p className="text-sm text-gray-600">We'll send wire instructions - 2-3 day processing</p>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      What Happens Next:
                    </h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Receive official PO & invoice within 2 hours</li>
                      <li>Pay 10% deposit to begin production</li>
                      <li>Approve engraving proof before assembly (Day 15)</li>
                      <li>Final invoice for balance (NET 30 after approval)</li>
                      <li>Batteries ship within 30 days of deposit</li>
                    </ol>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      'Submit Order & Get Invoice →'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* Custom Animations for SVG Engraving + ChatGPT Style */}
        <style jsx>{`
          @keyframes svgEngrave {
            0% {
              stroke-dashoffset: 1000;
              opacity: 0;
            }
            50% {
              opacity: 0.7;
            }
            100% {
              stroke-dashoffset: 0;
              opacity: 1;
            }
          }
          
          @keyframes metalEngrave {
            0% {
              transform: scale(0.8) translateX(-20px);
              opacity: 0;
            }
            100% {
              transform: scale(1) translateX(0);
              opacity: 1;
            }
          }

          /* Mobile-First Horizontal Card Scrolling */
          .mobile-card-scroll-container {
            width: 100%;
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding: 0 16px;
          }
          
          .mobile-card-scroll-container::-webkit-scrollbar {
            display: none;
          }
          
          .mobile-card-scroll-content {
            display: flex;
            gap: 12px;
            width: 100%;
            padding-bottom: 8px;
          }
          
          .mobile-suggestion-card {
            flex-shrink: 0;
            width: 100px;
            min-width: 100px;
            max-width: 100px;
            padding: 12px;
            border-radius: 12px;
            border: 1px solid;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            transition: all 0.2s ease;
            transform: translateZ(0);
            backface-visibility: hidden;
            scroll-snap-align: start;
          }
          
          .mobile-suggestion-card:hover {
            transform: translateY(-2px) translateZ(0);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          
          .mobile-suggestion-card:active {
            transform: scale(0.95) translateZ(0);
          }

          .compact-suggestion-card {
            flex: 1;
            flex-shrink: 0;
            width: calc(33.333% - 8px);
            min-width: calc(33.333% - 8px);
            padding: 8px;
            border-radius: 12px;
            border: 1px solid;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            transition: all 0.2s ease;
            transform: translateZ(0);
            backface-visibility: hidden;
            scroll-snap-align: start;
          }
          
          .compact-suggestion-card:hover {
            transform: translateY(-2px) translateZ(0);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          
          .compact-suggestion-card:active {
            transform: scale(0.95) translateZ(0);
          }

          .glassmorphic-approve-btn {
            background: linear-gradient(135deg, rgba(0, 111, 238, 0.9), rgba(0, 80, 179, 0.9));
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 111, 238, 0.3);
          }
          
          .glassmorphic-approve-btn:hover {
            background: linear-gradient(135deg, rgba(0, 111, 238, 1), rgba(0, 80, 179, 1));
            transform: translateY(-2px);
            box-shadow: 0 12px 40px rgba(0, 111, 238, 0.4);
          }

          /* Mobile viewport constraints - Critical for preventing horizontal page scroll */
          * {
            box-sizing: border-box;
          }
          
          html, body {
            overflow-x: hidden !important;
            max-width: 100vw !important;
            position: relative;
          }
          
          /* Prevent horizontal scroll on the main container */
          .min-h-screen {
            overflow-x: hidden !important;
            width: 100vw;
            max-width: 100vw;
          }
          
          /* Ensure all containers respect viewport width */
          .bg-white, .bg-gray-50 {
            max-width: 100vw;
            overflow-x: hidden;
          }
          
          /* Full width cards on mobile */
          @media (max-width: 768px) {
            .mobile-card-scroll-container {
              width: 100%;
              max-width: 100%;
              overflow-x: visible;
            }
            
            .mobile-card-scroll-content {
              scroll-snap-type: none;
              width: 100%;
            }
            
            .compact-suggestion-card {
              flex: 1;
              width: calc(33.333% - 8px);
              min-width: calc(33.333% - 8px);
              max-width: calc(33.333% - 8px);
              display: flex;
              flex-direction: column;
              justify-content: center;
              text-align: center;
              min-height: 70px;
            }
            
            .compact-suggestion-card h4 {
              font-size: 10px;
              line-height: 1.2;
              margin: 0;
            }
            
            .compact-suggestion-card .text-xs {
              font-size: 9px;
            }
          }
          
          /* Adjustments for larger mobile devices */
          @media (min-width: 400px) and (max-width: 768px) {
            .compact-suggestion-card {
              min-height: 80px;
              padding: 12px 8px;
            }
            
            .compact-suggestion-card h4 {
              font-size: 11px;
            }
            
            .compact-suggestion-card .text-xs {
              font-size: 10px;
            }
          }
        `}</style>

      </div>
    )
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50 overflow-x-hidden">
        <div className="container mx-auto px-4 pt-4 max-w-7xl">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="text-center">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1" />
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
                  <Bot className="w-10 h-10 text-blue-600" />
                  AI Battery Designer
                  <Sparkles className="w-8 h-8 text-yellow-500" />
                </h1>
                <div className="flex-1 flex justify-end gap-2">
                  
                  {/* Legacy Mobile Chat System Toggle - For Testing */}
                  <button
                    onClick={() => setUseMobileChatSystem(!useMobileChatSystem)}
                    className="hidden sm:flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                    title="Toggle Mobile Chat Experience"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {useMobileChatSystem ? 'Desktop View' : 'Legacy Mobile'}
                  </button>
                </div>
              </div>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Describe your ideal battery design in plain English and watch AI create it instantly
              </p>
              {useMobileChatSystem && (
                <div className="mt-3 inline-flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  Mobile Chat System Active
                </div>
              )}
            </div>
          </motion.div>

          {/* Mobile Tab Navigation - Only show if not using mobile chat system */}
          {isMobile && !useMobileChatSystem && (
            <div className="flex mb-3 bg-white rounded-lg shadow-sm p-1">
              <button
                onClick={() => setActiveTab('ai-design')}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                  activeTab === 'ai-design' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Bot className="w-4 h-4 inline mr-2" />
                AI Designer
              </button>
              <button
                onClick={() => setActiveTab('manual-design')}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                  activeTab === 'manual-design' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Manual Design
              </button>
              <button
                onClick={() => setActiveTab('batteries')}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                  activeTab === 'batteries' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Select Batteries
              </button>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6 mb-4">
            {/* Left Section - AI Design Interface */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1"
            >
              {/* AI Natural Language Designer - Show first on mobile when ai-design tab active */}
              {(activeTab === 'ai-design' || !isMobile) && (
                <div className="mb-6">
                  <NaturalLanguageDesigner />
                </div>
              )}

              {/* Manual Design Controls - Show when manual-design tab active */}
              {(activeTab === 'manual-design' || (!isMobile && activeTab !== 'ai-design')) && (
                <div className="mb-6">
                  <EnhancedEngravingDesigner />
                </div>
              )}
            </motion.div>

            {/* Right Section - Preview */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1"
              style={{ backgroundColor: 'transparent' }}
            >
              <EnhancedBatteryPreview 
                batteryImage="/images/dewalt-flexvolt-battery.png"
                batteryData={batteryData}
                canvasRef={canvasRef}
              />
            </motion.div>
          </div>

          {/* Full Width Battery Selection Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <h2 className="text-lg font-semibold">Heavy-Duty FlexVolt Batteries</h2>
              <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                BULK SAVINGS
              </span>
            </div>
            <div className="bg-white border-2 border-t-0 border-gray-200 rounded-b-lg p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {batteriesData.map(battery => (
                  <ProductCard
                    key={battery.id}
                    product={battery}
                    quantity={quantities[battery.id]}
                    onUpdateQuantity={updateQuantity}
                    showSuccess={successItems.has(battery.id)}
                    onShowSuccess={showSuccess}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Full Width Order Summary Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <div className="grid lg:grid-cols-2 gap-6">

              {/* Enhanced Order Summary with Premium Features */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                    Order Summary
                  </h3>
                </div>
                
                <div className="p-6">
                  {/* Selected Batteries with enhanced display */}
                  {Object.entries(quantities).map(([batteryId, qty]) => {
                    if (qty === 0) return null;
                    const battery = batteriesData.find(b => b.id === batteryId);
                    if (!battery) return null;
                    const batteryTotal = battery.price * qty;
                    const retailTotal = battery.retailPrice * qty;
                    
                    return (
                      <div key={batteryId} className="flex justify-between items-start py-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{battery.name}</p>
                            <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                              {qty}x
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            ${battery.price} × {qty} = ${batteryTotal.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Sparkles className="w-3 h-3 text-blue-600" />
                            <span className="text-xs text-blue-600 font-medium">Custom Engraved</span>
                            {text && (
                              <span className="text-xs text-gray-500">• "{text}"</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            ${batteryTotal.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 line-through">
                            ${retailTotal.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {subtotal === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Battery className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No batteries selected</p>
                      <p className="text-sm mt-2">Start by describing your ideal design above</p>
                    </div>
                  )}
                  
                  {/* Enhanced Pricing Breakdown */}
                  {subtotal > 0 && (
                    <>
                      {/* Pricing breakdown container */}
                      <div className="bg-gray-50 rounded-lg p-4 mt-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Subtotal</span>
                          </div>
                          <span className="font-semibold">${subtotal.toLocaleString()}</span>
                        </div>
                        
                        {discountAmount > 0 && (
                          <div className="flex justify-between items-center text-green-600">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              <span>Volume Discount ({discountPercentage}%)</span>
                            </div>
                            <span className="font-semibold">-${discountAmount.toLocaleString()}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200 font-bold text-lg">
                          <span>Total Order Value</span>
                          <span className="text-blue-600">${total.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {/* Circular Payment Visualization */}
                      <div className="mt-6">
                        <div className="flex justify-center mb-6">
                          <div className="relative">
                            <svg width="200" height="200" viewBox="0 0 200 200">
                              <circle 
                                cx="100" 
                                cy="100" 
                                r="80" 
                                fill="none" 
                                stroke="#F3F4F6" 
                                strokeWidth="16"
                              />
                              <circle 
                                cx="100" 
                                cy="100" 
                                r="80" 
                                fill="none" 
                                stroke="#006FEE" 
                                strokeWidth="16"
                                strokeDasharray={`${2 * Math.PI * 80 * 0.1} ${2 * Math.PI * 80 * 0.9}`}
                                strokeDashoffset={0}
                                transform="rotate(-90 100 100)"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <p className="text-sm text-gray-600">Deposit Due</p>
                              <p className="text-3xl font-bold text-blue-600">${(total * 0.1).toFixed(2)}</p>
                              <p className="text-xs text-gray-500">10% of total</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Payment Structure */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                          <p className="text-sm font-medium text-gray-900 mb-2">Payment Structure</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Today (10%)</span>
                              <span className="font-medium">${(total * 0.1).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">On Delivery (90%)</span>
                              <span className="font-medium">${(total * 0.9).toFixed(2)}</span>
                            </div>
                            <div className="pt-2 border-t">
                              <div className="flex justify-between">
                                <span className="font-medium">Total Value</span>
                                <span className="font-bold">${total.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <button
                          onClick={handleCheckout}
                          className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-[1.02] shadow-lg"
                        >
                          <CreditCard className="w-5 h-5 inline mr-2" />
                          Proceed to Payment
                        </button>
                        
                        <button
                          onClick={() => {
                            // Check if batteries are selected
                            const totalBatteries = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
                            if (totalBatteries === 0) {
                              toast.error('Please select at least one battery');
                              setActiveTab('batteries');
                              return;
                            }

                            // Store order data for invoice
                            const orderItems = Object.entries(quantities)
                              .filter(([_, qty]) => qty > 0)
                              .map(([batteryId, qty]) => {
                                const battery = batteriesData.find(b => b.id === batteryId);
                                return {
                                  id: batteryId,
                                  type: batteryId,
                                  name: battery?.name || '',
                                  price: battery?.price || 0,
                                  quantity: qty,
                                  total: (battery?.price || 0) * qty,
                                  customization: {
                                    text: text || 'YOUR COMPANY',
                                    type: 'ai-laser-engraving',
                                    aiGenerated: true
                                  }
                                };
                              });

                            const invoiceData = {
                              items: orderItems,
                              quantities,
                              subtotal,
                              discount: discountAmount,
                              discountPercentage,
                              total,
                              isEngraved: true,
                              engravingText: text || 'YOUR COMPANY',
                              aiGenerated: true,
                              requestedAt: new Date().toISOString()
                            };
                            
                            sessionStorage.setItem('invoiceRequestData', JSON.stringify(invoiceData));
                            toast.success('AI design invoice request prepared! Redirecting...');
                            
                            // Redirect to invoice request page
                            setTimeout(() => {
                              router.push('/customer/invoice-request');
                            }, 1500);
                          }}
                          className="w-full py-3 bg-white border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <FileText className="w-5 h-5 inline mr-2" />
                          Request B2B Invoice
                        </button>
                      </div>
                      
                      {/* Security Badges */}
                      <div className="mt-6 pt-6 border-t">
                        <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Shield className="w-4 h-4 text-green-600" />
                            <span>Secure</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Truck className="w-4 h-4 text-blue-600" />
                            <span>30-Day</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="w-4 h-4 text-purple-600" />
                            <span>USA Made</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* How Our Payment Process Works */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <span className="text-2xl">🛠️</span>
                  How Our Payment Process Works
                </h3>
                
                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900 mb-1">
                        10% Deposit to Secure Your Order
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Pay only 10% today to reserve your custom batteries and secure your production slot
                      </p>
                    </div>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900 mb-1">
                        Review & Approve Your Custom Engraving
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        We'll send you a proof of your laser engraving design for approval before production
                      </p>
                    </div>
                  </div>
                  
                  {/* Step 3 */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900 mb-1">
                        Final Payment Upon Completion
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Remaining 90% is due when your batteries are completed and ready to ship (NET 30)
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Info Box */}
                <div className="mt-5 p-3 bg-gray-50 rounded-lg flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900 mb-1">
                      🔐 Your Order, Your Confidence
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      You're in control the entire way. No full payment until your custom batteries are built, engraved, and ready for dispatch.
                    </p>
                  </div>
                </div>
              </div>

              {/* Features Grid - Compact Version */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3"
              >
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-center hover:border-blue-300 hover:shadow-md transition-all">
                  <div className="text-2xl mb-1">🤖</div>
                  <h4 className="text-sm font-semibold text-gray-800">AI-Powered</h4>
                  <p className="text-xs text-gray-600">Natural language</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-center hover:border-blue-300 hover:shadow-md transition-all">
                  <div className="text-2xl mb-1">⚡</div>
                  <h4 className="text-sm font-semibold text-gray-800">Instant Design</h4>
                  <p className="text-xs text-gray-600">Real-time creation</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-center hover:border-blue-300 hover:shadow-md transition-all">
                  <div className="text-2xl mb-1">🎯</div>
                  <h4 className="text-sm font-semibold text-gray-800">0.1mm Precision</h4>
                  <p className="text-xs text-gray-600">Laser accuracy</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-center hover:border-blue-300 hover:shadow-md transition-all">
                  <div className="text-2xl mb-1">💡</div>
                  <h4 className="text-sm font-semibold text-gray-800">Smart Suggestions</h4>
                  <p className="text-xs text-gray-600">Context-aware</p>
                </div>
              </motion.div>

              {/* AI Design Tips - Compact */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200"
              >
                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <Bot className="w-4 h-4 mr-2 text-blue-600" />
                  AI Design Tips
                </h4>
                <ul className="space-y-1 text-xs text-gray-700">
                  <li>• Try: "Put ACME CONSTRUCTION in bold letters at the top"</li>
                  <li>• Say: "Make it look professional for outdoor use"</li>
                  <li>• Ask: "Add our phone number below the company name"</li>
                  <li>• Describe: "Industrial style with deep engraving for durability"</li>
                </ul>
              </motion.div>
            </div>
          </motion.div>

          {/* Mobile Fixed Bottom Bar */}
          {isMobile && subtotal > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-lg z-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    AI Total
                  </p>
                  <p className="text-xl font-bold text-blue-600">${total.toLocaleString()}</p>
                </div>
                <button
                  onClick={handleCheckout}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Checkout
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Video Overlay */}
        <AnimatePresence>
          {showVideo && videoUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            >
              {/* Video player disabled for Vercel deployment */}
              <div className="text-white text-center">
                <p>Video player temporarily disabled</p>
                <button 
                  onClick={() => setShowVideo(false)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2);
          }
        }
        
        @keyframes lithiGlow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(0, 111, 238, 0.3);
          }
          50% {
            box-shadow: 0 0 25px rgba(0, 111, 238, 0.6);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        /* Real-time update animations */
        .preview-updating {
          animation: lithiGlow 0.8s ease-in-out;
        }
        
        .shimmer-effect {
          animation: shimmer 1.5s infinite;
        }
        
        /* Remove number input spinners */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        
        /* Mobile optimizations */
        @media (max-width: 640px) {
          .fixed-header {
            height: 40vh;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 100;
          }
          
          .scrollable-chat {
            padding-top: 40vh;
            height: 100vh;
          }
          
          /* Ensure 60fps performance */
          .battery-preview-mobile {
            transform: translateZ(0);
            will-change: transform;
          }
          
          /* Raise elements by 10px for better fit */
          .raise-10px {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </>
  )
}