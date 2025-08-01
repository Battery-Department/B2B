'use client'

import React, { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion'
import { useEngravingStore } from '@/lib/engraving-store'
import { toast } from 'react-hot-toast'
import { 
  ShoppingCart, CreditCard, FileText, Truck, Shield, Package, 
  Battery, CheckCircle, Trash2, Plus, Minus, Info, TrendingUp,
  Edit2, Save, X, Check, Sparkles, Zap, Clock, Loader2,
  Share2, Mail, Phone, MessageSquare, Linkedin, Briefcase
} from 'lucide-react'

// Direct imports for enhanced components
import dynamic from 'next/dynamic'
import KeyBenefitsSlideshow from './KeyBenefitsSlideshow'

// Dynamic import for FullScreenBatteryEditor
const FullScreenBatteryEditor = dynamic(() => import('@/components/engraving/FullScreenBatteryEditor'), {
  ssr: false,
  loading: () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full h-[600px] relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"
          />
        </div>
      </div>
    </motion.div>
  )
})

// Battery data with updated pricing
const batteriesData = [
  {
    id: '6Ah',
    name: '6Ah FlexVolt Battery',
    runtime: 'Up to 4 hours',
    weight: '1.9 lbs',
    price: 14.90,
    retailPrice: 149,
    msrp: 149,
    voltage: "20V/60V",
    features: "Compatible with all DeWalt 20V/60V tools",
    workOutput: '225 screws / 175 ft cuts',
    chargingTime: '45 minutes',
    depositPercentage: 10,
    popular: false,
    image: '/6Ah FlexVolt (3).png'
  },
  {
    id: '9Ah',
    name: '9Ah FlexVolt Battery',
    runtime: 'Up to 6.5 hours',
    weight: '2.4 lbs',
    price: 23.90,
    retailPrice: 239,
    msrp: 239,
    voltage: "20V/60V",
    features: "Compatible with all DeWalt 20V/60V tools",
    workOutput: '340 screws / 260 ft cuts',
    chargingTime: '55 minutes',
    depositPercentage: 10,
    popular: true,
    image: '/9Ah FlexVolt (4).png'
  },
  {
    id: '15Ah',
    name: '15Ah FlexVolt Battery',
    runtime: 'Up to 10 hours',
    weight: '3.2 lbs',
    price: 35.90,
    retailPrice: 359,
    msrp: 359,
    voltage: "20V/60V",
    features: "Compatible with all DeWalt 20V/60V tools",
    workOutput: '560 screws / 430 ft cuts',
    chargingTime: '90 minutes',
    depositPercentage: 10,
    popular: false,
    image: '/15Ah FlexVolt (2).png'
  }
]

const discountTiers = [
  { threshold: 1000, percentage: 10 },
  { threshold: 2500, percentage: 15 },
  { threshold: 5000, percentage: 20 }
]

// Scroll Reveal Component
const ScrollReveal = ({ children, delay = 0, variants }: any) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const shouldReduceMotion = useReducedMotion()
  
  const defaultVariants = variants || {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 80
      }
    }
  }
  
  return (
    <motion.div
      ref={ref}
      variants={defaultVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      transition={{ delay: shouldReduceMotion ? 0 : delay }}
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.div>
  )
}

// Compact Battery Design Preview Component
const CompactBatteryDesignPreview = () => {
  const { text, primaryText, secondaryText, showSecondaryText, previewImage } = useEngravingStore()
  
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
              alt="Your custom battery design"
              className="w-full h-full object-contain rounded"
            />
          </div>
        ) : (
          <div className="relative w-48 h-36 bg-gradient-to-br from-gray-200 to-gray-300 rounded flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-80"></div>
            
            {/* Metal plate effect */}
            <div className="absolute inset-x-4 inset-y-6 bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 rounded shadow-inner">
              <div className="h-full w-full flex items-center justify-center p-3 relative">
                {/* Engraving text */}
                <div className="text-center">
                  {displayText ? (
                    <div className="font-bold text-gray-900 text-xs leading-tight">
                      {displayText.split('\n').map((line, index) => (
                        <div key={index} className="whitespace-nowrap">
                          {line}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-xs">
                      Your text here
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Battery brand text */}
            <div className="absolute bottom-2 left-2 text-white text-xs font-bold">
              20V/60V MAX
            </div>
          </div>
        )}
      </div>
      
      <p className="text-center text-xs text-gray-600 mt-2">
        Your custom engraving design
      </p>
    </div>
  );
};

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
  const retailLineTotal = product.retailPrice * localQuantity;
  
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
            <motion.button
              key={increment}
              onClick={() => setLocalQuantity(localQuantity + increment)}
              className="py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 hover:border-blue-300 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              +{increment}
            </motion.button>
          ))}
        </div>
        
        {/* Centered quantity controls - thumb-friendly */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <motion.button
            onClick={() => setLocalQuantity(Math.max(0, localQuantity - 1))}
            className="w-12 h-12 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-blue-400 flex items-center justify-center transition-all shadow-sm"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Minus className="w-5 h-5 text-gray-600" />
          </motion.button>
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
          <motion.button
            onClick={() => setLocalQuantity(localQuantity + 1)}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all shadow-md hover:shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>
        
        {/* Line total */}
        {localQuantity > 0 && (
          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Total Deposit</span>
            <span className={`font-bold text-lg text-gray-900 transition-opacity ${isUpdating ? 'opacity-60' : ''}`}>
              ${lineTotal.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Cart Summary Component with Premium Design
const EnhancedCartSummary = ({ quantities, onCheckout, onInvoice }: any) => {
  const { text, primaryText, secondaryText, showSecondaryText, previewImage } = useEngravingStore()
  
  // Calculate pricing
  const items = Object.entries(quantities)
    .filter(([_, qty]) => qty > 0)
    .map(([batteryId, qty]) => {
      const battery = batteriesData.find(b => b.id === batteryId);
      return battery ? { ...battery, quantity: qty } : null;
    })
    .filter(Boolean);
  
  const subtotal = items.reduce((sum, item) => sum + (item.retailPrice * item.quantity), 0);
  const depositSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate volume discount
  let discountPercentage = 0;
  let discountAmount = 0;
  
  if (subtotal >= 5000) {
    discountPercentage = 20;
  } else if (subtotal >= 2500) {
    discountPercentage = 15;
  } else if (subtotal >= 1000) {
    discountPercentage = 10;
  }
  
  if (discountPercentage > 0) {
    discountAmount = subtotal * (discountPercentage / 100);
  }
  
  const finalTotal = subtotal - discountAmount;
  const depositTotal = finalTotal * 0.1;
  const balanceTotal = finalTotal * 0.9;
  
  const activeDiscount = discountTiers.find(tier => subtotal >= tier.threshold);
  const nextTier = discountTiers.find(tier => tier.threshold > subtotal);
  
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Battery className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
        <p className="text-gray-600 mb-6">Start by designing your custom batteries</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Your Custom Battery Summary</h3>
        </div>
        <p className="text-sm text-blue-100 mt-1">Secure checkout with 10% deposit</p>
      </div>
      
      {/* Responsive 50/50 Layout Container */}
      <div className="p-6 lg:p-8 lg:flex lg:gap-8">
        {/* Left Panel - Order Details */}
        <div className="lg:w-1/2 space-y-6 mb-6 lg:mb-0">
          {/* Battery Preview */}
          <CompactBatteryDesignPreview />
          
          {/* Items List */}
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-start py-3 border-b border-gray-200 last:border-0">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      Qty: {item.quantity}
                    </span>
                    {text && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Sparkles className="w-3 h-3" />
                        <span>Custom Engraved</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${(item.retailPrice * item.quantity).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">@ ${item.retailPrice} each</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pricing Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Subtotal</span>
              </div>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Volume Discount ({discountPercentage}%)</span>
                </div>
                <span className="font-medium">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200 font-bold text-lg">
              <span>Total Order Value</span>
              <span className="text-blue-600">${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Payment & Actions */}
        <div className="lg:w-1/2 space-y-6">
          {/* Smart Payment Structure Visualization */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-blue-600" />
              <h4 className="text-lg font-bold text-gray-900">Smart Payment Structure</h4>
            </div>
            
            {/* Circular Progress Chart */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <circle 
                    cx="90" 
                    cy="90" 
                    r="70" 
                    fill="none" 
                    stroke="#E5E7EB" 
                    strokeWidth="20"
                  />
                  <circle 
                    cx="90" 
                    cy="90" 
                    r="70" 
                    fill="none" 
                    stroke="#006FEE" 
                    strokeWidth="20"
                    strokeDasharray={`${2 * Math.PI * 70 * 0.1} ${2 * Math.PI * 70 * 0.9}`}
                    strokeDashoffset={0} 
                    transform="rotate(-90 90 90)"
                    className="transition-all duration-1500 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-blue-600">${depositTotal.toFixed(2)}</p>
                  <p className="text-xs text-gray-600">Due Today</p>
                </div>
              </div>
            </div>
            
            {/* Payment Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 border-2 border-blue-500 relative overflow-hidden">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Due Today</p>
                    <p className="text-xl font-bold text-blue-600">${depositTotal.toFixed(2)}</p>
                    <p className="text-sm text-blue-600 font-medium mt-1">10% Deposit</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-gray-300">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Upon Delivery</p>
                    <p className="text-xl font-bold text-gray-700">${balanceTotal.toFixed(2)}</p>
                    <p className="text-sm text-gray-600 font-medium mt-1">90% Balance</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Info Box */}
            <div className="mt-4 bg-blue-100 rounded-lg p-3 text-center">
              <p className="text-sm text-blue-800">Pay just 10% now to lock in your order and volume discount</p>
            </div>
          </div>
        
          {/* Volume Discount Progress */}
          {nextTier && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">
                    Add ${(nextTier.threshold - subtotal).toFixed(2)} more for {nextTier.percentage}% off
                  </p>
                  <div className="mt-2 h-2 bg-amber-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${(subtotal / nextTier.threshold) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* CTA Buttons */}
          <div className="space-y-3">
            <motion.button 
              onClick={onInvoice}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex flex-col items-center gap-1"
              whileHover={{ scale: 1.02, y: -2, boxShadow: '0 20px 25px -5px rgba(0, 111, 238, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span className="text-base">Send Me An Invoice</span>
              </div>
              <span className="text-xs font-normal opacity-90">Review terms, then pay deposit</span>
            </motion.button>
            
            <motion.button 
              onClick={onCheckout}
              className="w-full bg-white border-2 border-gray-300 hover:border-blue-600 text-gray-700 py-4 rounded-xl font-semibold transition-all flex flex-col items-center gap-1"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <span className="text-base">Pay 10% Deposit Online Now</span>
              </div>
              <span className="text-xs font-normal text-gray-600">Credit card or ACH transfer</span>
            </motion.button>
            
            <p className="text-center text-xs text-gray-600 mt-2">
              Both options require 10% deposit • Balance due NET 30 after approval
            </p>
          </div>
          
          {/* Trust Indicators */}
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Bank-level Security</p>
                <p className="text-xs text-blue-700">Your payment is protected by 256-bit SSL encryption</p>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4" />
                Business Benefits
              </h4>
              <ul className="space-y-1 text-sm text-amber-800">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Tax deductible business expense</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>NET 30/60 terms available</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Massachusetts tax exempt eligible</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Invoice Modal Component
const InvoiceModal = ({ show, onClose, onSubmit, quantities, subtotal }: any) => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    poNumber: '',
    paymentTerms: 'NET 30',
    paymentType: 'invoice'
  });
  const [loading, setLoading] = useState(false);
  
  const depositAmount = subtotal * 0.1;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
  };
  
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Secure Your Custom Battery Order</h2>
            <motion.button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Order Summary at Top */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span className="font-semibold">
                {Object.values(quantities).reduce((sum: number, qty: any) => sum + qty, 0)} Custom Batteries
              </span>
              <span className="font-bold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-2 text-blue-600 font-semibold">
              <span>10% Deposit Due Now:</span>
              <span>${depositAmount.toFixed(2)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-bold text-lg">Company Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="Company Name*" 
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                required 
              />
              <input 
                type="text" 
                placeholder="Contact Name*" 
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.contactName}
                onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                required 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="email" 
                placeholder="Email*" 
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required 
              />
              <input 
                type="tel" 
                placeholder="Phone*" 
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required 
              />
            </div>

            <textarea 
              placeholder="Billing Address*" 
              className="w-full p-3 border rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              required 
            />

            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="PO Number (Optional)" 
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.poNumber}
                onChange={(e) => setFormData({...formData, poNumber: e.target.value})}
              />
              <select 
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
              >
                <option value="NET 30">NET 30 (Standard)</option>
                <option value="NET 60">NET 60</option>
                <option value="Due on Receipt">Due on Receipt</option>
              </select>
            </div>

            <h3 className="font-bold text-lg mt-6">Payment Method</h3>
            
            <div className="space-y-3">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input 
                  type="radio" 
                  name="paymentType" 
                  value="invoice"
                  checked={formData.paymentType === 'invoice'}
                  onChange={(e) => setFormData({...formData, paymentType: e.target.value})}
                  className="mr-3" 
                />
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                <div className="flex-1">
                  <span className="font-medium">Send Invoice</span>
                  <p className="text-sm text-gray-600">We'll email an invoice with payment instructions</p>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input 
                  type="radio" 
                  name="paymentType" 
                  value="card"
                  checked={formData.paymentType === 'card'}
                  onChange={(e) => setFormData({...formData, paymentType: e.target.value})}
                  className="mr-3" 
                />
                <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                <div className="flex-1">
                  <span className="font-medium">Pay Deposit Now</span>
                  <p className="text-sm text-gray-600">Secure payment via credit card or ACH</p>
                </div>
              </label>
            </div>

            <motion.button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
              whileHover={{ scale: loading ? 1 : 1.02, boxShadow: loading ? 'none' : '0 20px 25px -5px rgba(0, 111, 238, 0.3)' }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {formData.paymentType === 'invoice' ? <FileText className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  {formData.paymentType === 'invoice' ? 'Generate Invoice' : `Pay ${depositAmount.toFixed(2)} Deposit`}
                </>
              )}
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function BatteryDesigner() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const { text, setText, primaryText, secondaryText, showSecondaryText, previewImage, capturePreviewImage } = useEngravingStore()
  const [quantities, setQuantities] = useState<{[key: string]: number}>({
    '6Ah': 0,
    '9Ah': 0,
    '15Ah': 0
  })
  const [successItems, setSuccessItems] = useState<Set<string>>(new Set())
  
  // Preload video for better performance
  useEffect(() => {
    const preloadVideo = () => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'video'
      link.href = '/dew-plate.mp4'
      document.head.appendChild(link)
      
      // Also create a video element to start loading
      const video = document.createElement('video')
      video.src = '/dew-plate.mp4'
      video.preload = 'auto'
      video.muted = true
      video.style.display = 'none'
      video.load()
    }
    
    // Preload after a short delay to not block initial page load
    const timer = setTimeout(preloadVideo, 1500)
    return () => clearTimeout(timer)
  }, [])
  const [isMobile, setIsMobile] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showBatterySelection, setShowBatterySelection] = useState(false)
  const [shouldScrollOnShow, setShouldScrollOnShow] = useState(false)
  const [batteryData, setBatteryData] = useState({
    line1: primaryText || '',
    line2: secondaryText || ''
  })
  
  // Check for shared design in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const sharedLine1 = urlParams.get('line1')
    const sharedLine2 = urlParams.get('line2')
    
    if (sharedLine1 || sharedLine2) {
      setBatteryData({
        line1: sharedLine1 || primaryText || '',
        line2: sharedLine2 || secondaryText || ''
      })
      // Update the store as well
      if (sharedLine1) setText('line1', sharedLine1)
      if (sharedLine2) setText('line2', sharedLine2)
      
      // Show a toast that design was loaded
      toast.success('Shared design loaded!')
    }
  }, [])
  
  // Animation variants
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1], // Smoother easing curve
        when: "beforeChildren"
      }
    }
  }

  const heroVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  }

  const titleLineVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        type: 'tween',
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  }

  const subtitleVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        type: 'tween',
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
        delay: 0.3 // Starts immediately after title
      }
    }
  }

  const batteryEditorVariants = {
    hidden: { opacity: 0, scale: 0.85, y: 40 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 25,
        mass: 1,
        delay: 0.4
      }
    }
  }

  const staggerContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const productCardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 80
      }
    },
    hover: {
      scale: 1.02,
      y: -4,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 30
      }
    }
  }
  
  // Check mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Update quantity with animation
  const updateQuantity = (batteryId: string, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [batteryId]: Math.max(0, prev[batteryId] + change)
    }))
  }
  
  // Show success animation
  const showSuccessAnimation = (batteryId: string) => {
    setSuccessItems(prev => new Set(prev).add(batteryId))
    setTimeout(() => {
      setSuccessItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(batteryId)
        return newSet
      })
    }, 2000)
  }
  
  // Calculate pricing
  const subtotal = Object.entries(quantities).reduce((sum, [batteryId, qty]) => {
    const battery = batteriesData.find(b => b.id === batteryId)
    return sum + (battery ? battery.retailPrice * qty : 0)
  }, 0)
  
  const retailSubtotal = subtotal;
  let discountPercentage = 0;
  let discountAmount = 0;
  
  if (subtotal >= 5000) {
    discountPercentage = 20;
  } else if (subtotal >= 2500) {
    discountPercentage = 15;
  } else if (subtotal >= 1000) {
    discountPercentage = 10;
  }
  
  if (discountPercentage > 0) {
    discountAmount = subtotal * (discountPercentage / 100);
  }
  
  const total = subtotal - discountAmount;
  
  // Handle checkout
  const handleCheckout = () => {
    const totalBatteries = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
    if (totalBatteries === 0) {
      toast.error('Please select at least one battery');
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
          retailPrice: battery?.retailPrice || 0,
          quantity: qty,
          total: (battery?.retailPrice || 0) * qty,
          customization: {
            line1: batteryData.line1,
            line2: batteryData.line2,
            previewImage: previewImage
          }
        };
      });

    const orderData = {
      items: orderItems,
      quantities,
      subtotal,
      isEngraved: true,
      engravingText: batteryData.line1 || batteryData.line2 ? `${batteryData.line1} ${batteryData.line2}`.trim() : '',
      previewImage: previewImage
    };
    
    sessionStorage.setItem('orderData', JSON.stringify(orderData));
    router.push('/customer/checkout');
  };
  
  // Handle invoice submission
  const handleInvoiceSubmit = async (formData: any) => {
    try {
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
        subtotal: subtotal,
        depositAmount: subtotal * 0.1,
        customer: {
          companyName: formData.companyName,
          firstName: formData.contactName.split(' ')[0],
          lastName: formData.contactName.split(' ').slice(1).join(' '),
          email: formData.email,
          phone: formData.phone,
          address: formData.address
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
        sessionStorage.setItem('currentInvoice', JSON.stringify(result.invoice))
        setShowInvoiceModal(false)
        
        if (formData.paymentType === 'card') {
          router.push(`/api/stripe/checkout?invoice=${result.invoice.invoiceNumber}&amount=${result.invoice.depositAmount}`)
        } else {
          router.push(`/customer/invoice?id=${result.invoice.invoiceNumber}`)
        }
      }
    } catch (error) {
      console.error('Invoice generation error:', error)
      toast.error('Failed to generate invoice. Please try again.')
    }
  }
  
  return (
    <motion.div 
      className="min-h-screen bg-white max-w-full overflow-x-hidden"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Full Screen Header and Battery Editor Container */}
      <div className="min-h-screen flex flex-col">
        {/* Header Section - Animated Typography */}
        <motion.div 
          className="text-center py-6 md:py-8 px-4"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            className="font-extrabold text-gray-900 mb-2" 
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              fontWeight: '800',
              lineHeight: '1.1',
              letterSpacing: '-0.02em'
            }}
          >
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              End stolen tools at{' '}
              <span className="text-blue-600">Your Business</span>
            </motion.span>
          </motion.h1>
          <motion.p 
            className="text-gray-900" 
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              fontWeight: '800',
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
              marginTop: '0.5rem'
            }}
            variants={subtitleVariants}
            transition={{ delay: 0.4 }}
          >
            with laser-engraved FlexVolt batteries
          </motion.p>
        </motion.div>
      
        {/* Battery Editor Section - Animated Full Screen */}
        <motion.div 
          className="flex-1 flex items-center justify-center px-4 pb-8"
          variants={batteryEditorVariants}
          initial="hidden"
          animate="visible"
          style={{ perspective: '1000px' }}
        >
          <div className="w-full max-w-7xl">
            <FullScreenBatteryEditor
              canvasRef={canvasRef}
              batteryImage="/images/flexbat-battery.png"
              batteryData={batteryData}
              onBatteryDataChange={setBatteryData}
              onGetPricing={() => {
                console.log('[DEBUG] Get Pricing clicked')
                setShouldScrollOnShow(true)
                setShowBatterySelection(true)
              }}
              onShareDesign={() => toast.success('Share feature coming soon!')}
            />
          </div>
        </motion.div>
      </div>
      
      {/* Only show content below when battery selection is active */}
      <AnimatePresence>
        {showBatterySelection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onAnimationComplete={(definition: any) => {
              console.log('[DEBUG] Animation complete:', definition, 'shouldScroll:', shouldScrollOnShow)
              if (definition.opacity === 1 && shouldScrollOnShow) {
                // Reset the flag
                setShouldScrollOnShow(false)
                
                // Scroll after animation is complete
                setTimeout(() => {
                  const slideshowSection = document.querySelector('.key-benefits-slideshow')
                  if (slideshowSection) {
                    const yOffset = -88;
                    const rect = slideshowSection.getBoundingClientRect();
                    const y = rect.top + window.pageYOffset + yOffset;
                    console.log('[DEBUG] Animation complete - scrolling to:', y)
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                }, 100) // Small delay to ensure DOM is fully painted
              }
            }}
          >
            {/* Key Benefits Slideshow - Scroll Reveal */}
            <div className="key-benefits-slideshow">
              <ScrollReveal>
                <KeyBenefitsSlideshow />
              </ScrollReveal>
            </div>
            
            {/* Battery Selection Section - Animated Container */}
            <div className="battery-selection-section bg-gray-50 border-t border-gray-200">
              <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-7xl">
                <ScrollReveal>
                  <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center" style={{fontFamily: "'Poppins', sans-serif"}}>Select Your Batteries</h2>
                </ScrollReveal>
                
                <motion.div 
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-12"
                  variants={staggerContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
              {batteriesData.map((battery) => (
                <ProductCard
                  key={battery.id}
                  product={battery}
                  quantity={quantities[battery.id]}
                  onUpdateQuantity={updateQuantity}
                  showSuccess={successItems.has(battery.id)}
                  onShowSuccess={showSuccessAnimation}
                />
              ))}
                </motion.div>
              
              {/* Order Summary / Cart - Full Width Container */}
              {Object.values(quantities).reduce((sum: number, qty: any) => sum + qty, 0) > 0 && (
                <div className="w-full">
                  <EnhancedCartSummary 
                    quantities={quantities}
                    onCheckout={handleCheckout}
                    onInvoice={() => setShowInvoiceModal(true)}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
      
      {/* Invoice Modal */}
      <InvoiceModal 
        show={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onSubmit={handleInvoiceSubmit}
        quantities={quantities}
        subtotal={subtotal}
      />
    </motion.div>
  )
}