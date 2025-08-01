'use client'

import React, { useRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useEngravingStore } from '@/lib/engraving-store'
import { toast } from 'react-hot-toast'
import { 
  ShoppingCart, CreditCard, FileText, Truck, Shield, Package, 
  Battery, CheckCircle, Trash2, Plus, Minus, Info, TrendingUp,
  Edit2, Save, X, Check, Sparkles, Zap, Clock, Loader2,
  Share2, Briefcase
} from 'lucide-react'

// Dynamic imports for enhanced components
const EnhancedEngravingDesigner = dynamic(() => import('@/components/engraving/EnhancedEngravingDesigner'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse">
      <div className="h-96 bg-gray-100 rounded-xl"></div>
    </div>
  )
})

// Import the new simplified volume discount component
import VolumeDiscountProgressSimple from '@/components/engraving/VolumeDiscountProgressSimple'

// Battery data with 10% deposit pricing
const batteriesData = [
  {
    id: '6Ah',
    name: '6Ah FlexVolt Battery',
    runtime: 'Up to 4 hours',
    weight: '1.9 lbs',
    price: 14.90,
    retailPrice: 149,
    voltage: "20V/60V MAX",
    features: "Compatible with all DeWalt 20V/60V tools",
    workOutput: '225 screws / 175 ft cuts',
    chargingTime: '45 minutes',
    savings: 10,
    popular: false
  },
  {
    id: '9Ah',
    name: '9Ah FlexVolt Battery',
    runtime: 'Up to 6.5 hours',
    weight: '2.4 lbs',
    price: 23.90,
    retailPrice: 239,
    voltage: "20V/60V MAX",
    features: "Compatible with all DeWalt 20V/60V tools",
    workOutput: '340 screws / 260 ft cuts',
    chargingTime: '55 minutes',
    savings: 10,
    popular: true
  },
  {
    id: '15Ah',
    name: '15Ah FlexVolt Battery',
    runtime: 'Up to 10 hours',
    weight: '3.2 lbs',
    price: 35.90,
    retailPrice: 359,
    voltage: "20V/60V MAX",
    features: "Compatible with all DeWalt 20V/60V tools",
    workOutput: '560 screws / 430 ft cuts',
    chargingTime: '90 minutes',
    savings: 10,
    popular: false
  }
]

const discountTiers = [
  { threshold: 1000, percentage: 10 },
  { threshold: 2500, percentage: 15 },
  { threshold: 5000, percentage: 20 }
]

// Slideshow data
const slideshowItems = [
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Theft-Proof Design",
    description: "Laser engraving makes batteries permanently identifiable"
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Premium Samsung Cells",
    description: "21700 technology delivers 40% longer runtime than standard"
  },
  {
    icon: <Package className="w-8 h-8" />,
    title: "Crew Accountability",
    description: "Assigned batteries increase tool responsibility by 87%"
  },
  {
    icon: <CheckCircle className="w-8 h-8" />,
    title: "Boston-Based Support",
    description: "Local team ensures your batteries arrive on schedule"
  }
]

export default function BatteryDesignPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { text, setText, setIsAnimating, quantity: engravingQuantity, capturePreviewImage } = useEngravingStore()
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [customDesign, setCustomDesign] = useState({ line1: '', line2: '' })
  const [showThanks, setShowThanks] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [quantities, setQuantities] = useState<{[key: string]: number}>({
    '6Ah': 0,
    '9Ah': 0,
    '15Ah': 0
  })
  const [successItems, setSuccessItems] = useState<Set<string>>(new Set())
  
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

  // Initialize from store
  useEffect(() => {
    const store = useEngravingStore.getState()
    setLine1(store.line1 || '')
    setLine2(store.line2 || '')
  }, [])

  // Auto-advance slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideshowItems.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  // Update engraving quantity when batteries change
  useEffect(() => {
    const total = Object.values(quantities).reduce((sum, qty) => sum + qty, 0)
    if (total > 0) {
      useEngravingStore.setState({ quantity: total })
    }
  }, [quantities])

  // Calculate totals
  const subtotal = Object.entries(quantities).reduce((sum, [battery, qty]) => {
    const batteryData = batteriesData.find(b => b.id === battery);
    return sum + (batteryData ? batteryData.price * qty : 0);
  }, 0);

  // Calculate discount
  let discountPercentage = 0;
  for (const tier of [...discountTiers].reverse()) {
    if (subtotal >= tier.threshold * 0.1) {
      discountPercentage = tier.percentage;
      break;
    }
  }

  const discountAmount = subtotal * (discountPercentage / 100);
  const total = subtotal - discountAmount;

  // Calculate retail prices for display
  const retailSubtotal = Object.entries(quantities).reduce((sum, [battery, qty]) => {
    const batteryData = batteriesData.find(b => b.id === battery);
    return sum + (batteryData ? batteryData.retailPrice * qty : 0);
  }, 0);

  const updateQuantity = (battery: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [battery]: Math.max(0, prev[battery] + delta)
    }));
    
    // Show success animation
    if (delta > 0) {
      setSuccessItems(prev => new Set(prev).add(battery));
      setTimeout(() => {
        setSuccessItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(battery);
          return newSet;
        });
      }, 1500);
    }
  };

  const handleCheckout = () => {
    // Check if batteries are selected
    const totalBatteries = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
    if (totalBatteries === 0) {
      toast.error('Please select at least one battery');
      return;
    }

    // Capture the preview image
    if (canvasRef.current) {
      capturePreviewImage(canvasRef.current);
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
            line1: customDesign.line1 || line1 || 'YOUR COMPANY',
            line2: customDesign.line2 || line2 || '',
            type: 'laser-engraving',
            previewImage: useEngravingStore.getState().previewImage
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
      engravingText: `${line1 || 'YOUR COMPANY'} ${line2 || ''}`.trim(),
      previewImage: useEngravingStore.getState().previewImage
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
              line1: line1 || 'YOUR COMPANY',
              line2: line2 || ''
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

  return (
    <>
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">
              End stolen tools at <span className="text-blue-600">Your Business</span>
            </h1>
            <p className="text-xl text-gray-700">
              with laser-engraved FlexVolt batteries
            </p>
          </div>

          {/* Battery Editor and Preview */}
          <div className="mb-8">
            <EnhancedEngravingDesigner 
              isReviewMode={isReviewMode}
              customDesign={customDesign}
              setCustomDesign={setCustomDesign}
              line1={line1}
              line2={line2}
              onLine1Change={setLine1}
              onLine2Change={setLine2}
              canvasRef={canvasRef}
            />
          </div>

          {/* Key Benefits Slideshow */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-white text-center relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="relative z-10"
                >
                  <div className="flex justify-center mb-4 text-white">
                    {slideshowItems[currentSlide].icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    {slideshowItems[currentSlide].title}
                  </h3>
                  <p className="text-lg opacity-90">
                    {slideshowItems[currentSlide].description}
                  </p>
                </motion.div>
              </AnimatePresence>
              
              {/* Slide indicators */}
              <div className="flex justify-center gap-2 mt-6">
                {slideshowItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentSlide 
                        ? 'w-8 bg-white' 
                        : 'w-2 bg-white bg-opacity-50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Battery Selection with Enhanced Cart */}
          <div className="mb-8" id="battery-selection">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Your Batteries</h2>
            
            {/* Responsive Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              {/* Main Content - Battery Cards */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {batteriesData.map((battery) => (
                    <div key={battery.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      {/* Card Header */}
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">{battery.name}</h3>
                        <p className="text-sm text-gray-600">{battery.voltage} • {battery.runtime}</p>
                      </div>
                      
                      {/* Price Display */}
                      <div className="p-4">
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold text-gray-900">${battery.price}</div>
                          <div className="text-sm text-gray-500 line-through">${battery.retailPrice}</div>
                          <div className="text-sm font-medium text-green-600">10% Deposit</div>
                        </div>
                        
                        {/* Success Animation */}
                        <AnimatePresence>
                          {successItems.has(battery.id) && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              className="absolute top-4 right-4"
                            >
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => updateQuantity(battery.id, 5)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            +5
                          </button>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(battery.id, -1)}
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                              disabled={quantities[battery.id] === 0}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            
                            <input
                              type="number"
                              value={quantities[battery.id]}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setQuantities(prev => ({ ...prev, [battery.id]: Math.max(0, val) }));
                              }}
                              className="w-16 text-center border rounded-lg px-2 py-1"
                            />
                            
                            <button
                              onClick={() => updateQuantity(battery.id, 1)}
                              className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => updateQuantity(battery.id, 10)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            +10
                          </button>
                          
                          <button
                            onClick={() => updateQuantity(battery.id, 25)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            +25
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Volume Discount Progress */}
                {subtotal > 0 && (
                  <div className="mt-6">
                    <VolumeDiscountProgressSimple 
                      currentTotal={retailSubtotal}
                      discountTiers={discountTiers}
                    />
                  </div>
                )}
                
                {/* Business Benefits */}
                {subtotal > 0 && (
                  <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      Business Benefits
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Volume Pricing Secured</p>
                          <p className="text-sm text-gray-600">Rate locked for 48 hours</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">NET 30 Terms Available</p>
                          <p className="text-sm text-gray-600">For qualified businesses</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Free Engraving Included</p>
                          <p className="text-sm text-gray-600">$15 value per battery</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Boston-Based Support</p>
                          <p className="text-sm text-gray-600">Local team assistance</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sidebar - Order Summary */}
              {subtotal > 0 && (
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <ShoppingCart className="w-6 h-6 text-blue-600" />
                      Order Summary
                    </h2>
                    
                    {/* Circular Payment Visualization */}
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
                          <p className="text-3xl font-bold text-blue-600">${total.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">10% of total</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Line Items */}
                    <div className="space-y-3 mb-6">
                      {Object.entries(quantities).map(([batteryId, qty]) => {
                        if (qty === 0) return null;
                        const battery = batteriesData.find(b => b.id === batteryId);
                        if (!battery) return null;
                        
                        return (
                          <div key={batteryId} className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{battery.name}</p>
                              <p className="text-sm text-gray-600">
                                {qty} × ${battery.price} deposit
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">${(battery.price * qty).toFixed(2)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Discount if applicable */}
                    {discountPercentage > 0 && (
                      <div className="flex justify-between items-center pb-4 mb-4 border-b">
                        <span className="text-green-600 font-medium">
                          Volume Discount ({discountPercentage}%)
                        </span>
                        <span className="text-green-600 font-semibold">
                          -${discountAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {/* Total */}
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-lg font-semibold">Total Deposit</span>
                      <span className="text-2xl font-bold text-blue-600">${total.toFixed(2)}</span>
                    </div>
                    
                    {/* Payment Structure */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <p className="text-sm font-medium text-gray-900 mb-2">Payment Structure</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Today (10%)</span>
                          <span className="font-medium">${total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">On Delivery (90%)</span>
                          <span className="font-medium">${(retailSubtotal * 0.9).toFixed(2)}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between">
                            <span className="font-medium">Total Value</span>
                            <span className="font-bold">${retailSubtotal.toFixed(2)}</span>
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
                        onClick={() => setShowInvoiceModal(true)}
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
                  </div>
                  
                  {/* Trust Indicators */}
                  <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                      Join <span className="font-semibold text-gray-900">300+</span> businesses securing their tools
                    </p>
                    <p className="text-xs text-amber-600 font-medium mt-1">
                      ⚡ Volume pricing secured for 48 hours
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Total Bar - Always visible on desktop */}
            {subtotal > 0 && (
              <div className="mt-8 bg-blue-600 text-white rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Total Deposit Due (10%)</p>
                    <p className="text-2xl font-bold">${total.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Get Pricing
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Sticky Footer - Only show on mobile when items in cart */}
      {subtotal > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-600">Total Deposit</p>
              <p className="text-xl font-bold text-blue-600">${total.toFixed(2)}</p>
            </div>
            <button
              onClick={handleCheckout}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
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
                <h3 className="font-semibold mb-2">Order Summary</h3>
                <div className="space-y-1 text-sm">
                  {Object.entries(quantities).map(([batteryId, qty]) => {
                    if (qty === 0) return null;
                    const battery = batteriesData.find(b => b.id === batteryId);
                    return (
                      <div key={batteryId} className="flex justify-between">
                        <span>{battery?.name} x{qty}</span>
                        <span>${((battery?.retailPrice || 0) * qty).toFixed(2)}</span>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t font-semibold">
                    <div className="flex justify-between">
                      <span>Total Value:</span>
                      <span>${retailSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-blue-600">
                      <span>10% Deposit Due:</span>
                      <span>${(retailSubtotal * 0.1).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleInvoiceSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name*</label>
                    <input
                      type="text"
                      required
                      value={b2bFormData.companyName}
                      onChange={(e) => setB2bFormData({...b2bFormData, companyName: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name*</label>
                    <input
                      type="text"
                      required
                      value={b2bFormData.contactName}
                      onChange={(e) => setB2bFormData({...b2bFormData, contactName: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                    <input
                      type="email"
                      required
                      value={b2bFormData.email}
                      onChange={(e) => setB2bFormData({...b2bFormData, email: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone*</label>
                    <input
                      type="tel"
                      required
                      value={b2bFormData.phone}
                      onChange={(e) => setB2bFormData({...b2bFormData, phone: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address*</label>
                  <textarea
                    required
                    value={b2bFormData.address}
                    onChange={(e) => setB2bFormData({...b2bFormData, address: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PO Number (Optional)</label>
                    <input
                      type="text"
                      value={b2bFormData.poNumber}
                      onChange={(e) => setB2bFormData({...b2bFormData, poNumber: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                    <select
                      value={b2bFormData.paymentTerms}
                      onChange={(e) => setB2bFormData({...b2bFormData, paymentTerms: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option>NET 30 (Standard)</option>
                      <option>NET 15</option>
                      <option>Due on Receipt</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method for 10% Deposit</label>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="paymentType"
                        value="invoice"
                        checked={b2bFormData.paymentType === 'invoice'}
                        onChange={(e) => setB2bFormData({...b2bFormData, paymentType: e.target.value})}
                        className="sr-only peer"
                      />
                      <div className="p-3 border rounded-lg text-center peer-checked:border-blue-600 peer-checked:bg-blue-50">
                        <FileText className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-sm">Invoice</span>
                      </div>
                    </label>
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="paymentType"
                        value="ach"
                        checked={b2bFormData.paymentType === 'ach'}
                        onChange={(e) => setB2bFormData({...b2bFormData, paymentType: e.target.value})}
                        className="sr-only peer"
                      />
                      <div className="p-3 border rounded-lg text-center peer-checked:border-blue-600 peer-checked:bg-blue-50">
                        <CreditCard className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-sm">ACH Transfer</span>
                      </div>
                    </label>
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="paymentType"
                        value="card"
                        checked={b2bFormData.paymentType === 'card'}
                        onChange={(e) => setB2bFormData({...b2bFormData, paymentType: e.target.value})}
                        className="sr-only peer"
                      />
                      <div className="p-3 border rounded-lg text-center peer-checked:border-blue-600 peer-checked:bg-blue-50">
                        <CreditCard className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-sm">Credit Card</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                        Generating Invoice...
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5 inline mr-2" />
                        Generate Invoice & Continue
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInvoiceModal(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}