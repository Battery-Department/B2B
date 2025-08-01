'use client'

import React, { useRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useEngravingStore } from '@/lib/engraving-store'
import { toast } from 'react-hot-toast'
import { 
  ShoppingCart, CreditCard, FileText, Truck, Shield, Package, 
  Battery, CheckCircle, Trash2, Plus, Minus, Info, TrendingUp,
  Edit2, Save, X, Check, Sparkles, Zap, Clock, Loader2
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

const EnhancedBatteryPreview = dynamic(() => import('@/components/engraving/EnhancedBatteryPreview'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse">
      <div className="h-[600px] bg-gray-100 rounded-xl"></div>
    </div>
  )
})

// Remotion video player component
const RemotionVideoPlayer = dynamic(() => import('@/components/engraving/RemotionVideoPlayer'), {
  ssr: false
})

// Import the new simplified volume discount component
import VolumeDiscountProgressSimple from '@/components/engraving/VolumeDiscountProgressSimple'

// Debug component (only shows in development)
const ImageFlowDebugger = dynamic(() => import('@/components/debug/ImageFlowDebugger'), {
  ssr: false
})

// Battery data
const batteriesData = [
  {
    id: '6Ah',
    name: '6Ah FlexVolt Battery',
    runtime: 'Up to 4 hours',
    weight: '1.9 lbs',
    price: 149,
    msrp: 149,
    voltage: "20V/60V",
    features: "Compatible with all DeWalt 20V/60V tools",
    workOutput: '225 screws / 175 ft cuts',
    chargingTime: '45 minutes',
    savings: 44,
    popular: false
  },
  {
    id: '9Ah',
    name: '9Ah FlexVolt Battery',
    runtime: 'Up to 6.5 hours',
    weight: '2.4 lbs',
    price: 239,
    msrp: 239,
    voltage: "20V/60V",
    features: "Compatible with all DeWalt 20V/60V tools",
    workOutput: '340 screws / 260 ft cuts',
    chargingTime: '55 minutes',
    savings: 50,
    popular: true
  },
  {
    id: '15Ah',
    name: '15Ah FlexVolt Battery',
    runtime: 'Up to 10 hours',
    weight: '3.2 lbs',
    price: 359,
    msrp: 359,
    voltage: "20V/60V",
    features: "Compatible with all DeWalt 20V/60V tools",
    workOutput: '560 screws / 430 ft cuts',
    chargingTime: '90 minutes',
    savings: 35,
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
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all relative h-full flex flex-col">
      {/* Success indicator */}
      <div className={`absolute top-4 right-4 transition-all duration-300 ${showSuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
        <CheckCircle className="w-6 h-6 text-green-600" />
      </div>
      
      {/* Product details */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-3">{product.voltage} MAX • {product.runtime}</p>
        
        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-gray-900">${product.price}</span>
          <span className="text-sm text-gray-500 line-through">${product.msrp}</span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-semibold">
            Save {product.savings}%
          </span>
        </div>
        
        {/* Features */}
        <div className="flex flex-col gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            <span>{product.workOutput.split(' / ')[0]}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{product.chargingTime}</span>
          </div>
        </div>
      </div>
      
      {/* Quantity selector */}
      <div className="bg-gray-50 p-4 rounded-lg mt-auto">
        {/* Quick add buttons */}
        <div className="flex gap-2 mb-3">
          {[5, 10, 25].map((increment) => (
            <button
              key={increment}
              onClick={() => setLocalQuantity(localQuantity + increment)}
              className="flex-1 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 hover:border-blue-300 transition-all"
            >
              +{increment}
            </button>
          ))}
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Quantity</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocalQuantity(Math.max(0, localQuantity - 1))}
              className="w-8 h-8 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="relative">
              <input
                type="number"
                value={localQuantity}
                onChange={(e) => setLocalQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-20 h-8 text-center text-sm border border-gray-300 rounded font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isUpdating && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-3 h-3 text-gray-500 animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={() => setLocalQuantity(localQuantity + 1)}
              className="w-8 h-8 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
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


export default function EnhancedBatteryEngraving() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { text, setIsAnimating, quantity: engravingQuantity, previewImage, loadPreviewFromStorage } = useEngravingStore()
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
  const [activeTab, setActiveTab] = useState<'batteries' | 'engraving'>('engraving')
  const [isPageReady, setIsPageReady] = useState(false)
  
  // Ensure page starts at top on mount
  useEffect(() => {
    // Force scroll to top immediately
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Also scroll the main element if it exists
      const mainEl = document.getElementById('engraving-main');
      if (mainEl) {
        mainEl.scrollTop = 0;
      }
      
      // Load preview from storage if not already loaded
      if (!previewImage) {
        loadPreviewFromStorage();
      }
      
      // Mark page as ready after a brief delay
      requestAnimationFrame(() => {
        setIsPageReady(true);
      });
    }
  }, [])

  // Check if coming from quiz
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const fromQuiz = urlParams.get('from') === 'quiz'
    const hasVideo = urlParams.get('video') === 'true'
    
    // Remove any hash from URL which might cause scrolling
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    
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
          toast.success(`Welcome! Your ${engravingQuantity} FlexVolt batteries are ready to customize.`)
        }, 5500)
      } else {
        toast.success('Welcome! Your FlexVolt preview is ready.')
      }
      
      trackEvent('quiz_to_battery_transition', { 
        has_video: hasVideo,
        quantity: engravingQuantity 
      })
    }
  }, [engravingQuantity])

  // Mobile detection and scroll to top
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Ensure page loads at the top with a slight delay to account for rendering
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
    
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
    
    // Ensure we have a preview image
    if (!previewImage) {
      toast.error('Please wait for the battery preview to load');
      return;
    }

    // Get current cart from localStorage
    const cartStr = localStorage.getItem('cart')
    const cart = cartStr ? JSON.parse(cartStr) : { items: [] }
    
    // Create engraved battery items for each type
    Object.entries(quantities).forEach(([batteryId, qty]) => {
      if (qty > 0) {
        const battery = batteriesData.find(b => b.id === batteryId);
        if (battery) {
          const engravingItem = {
            id: `engraved-battery-${batteryId}-${Date.now()}`,
            productId: `flexvolt-${batteryId.toLowerCase()}-engraved`,
            name: `${battery.name} - Custom Engraved`,
            price: battery.price,
            quantity: qty,
            customization: {
              text: text || 'YOUR COMPANY',
              type: 'laser-engraving',
              previewImage: previewImage // Include the preview image
            }
          };
          cart.items.push(engravingItem);
        }
      }
    });
    
    localStorage.setItem('cart', JSON.stringify(cart))
    
    // Also update sessionStorage battery cart to sync with cart page
    const batteryCart = {
      items: quantities,
      lastUpdated: Date.now(),
      userId: 'guest'
    }
    sessionStorage.setItem('batteryCart', JSON.stringify(batteryCart))
    
    toast.success('Engraved batteries added to cart!')
    
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
    
    // Ensure we have a preview image
    if (!previewImage) {
      toast.error('Please wait for the battery preview to load');
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
            type: 'laser-engraving',
            previewImage: previewImage // Include the preview image
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
      previewImage: previewImage // Include at order level too
    };
    
    sessionStorage.setItem('orderData', JSON.stringify(orderData));
    router.push('/customer/checkout');
  };

  return (
    <>
      <main className="bg-gray-50 min-h-screen" id="engraving-main" style={{ opacity: isPageReady ? 1 : 0, transition: 'opacity 0.2s' }}>
        <div className={`container mx-auto px-4 py-4 max-w-7xl ${isMobile && subtotal > 0 ? 'pb-24' : ''}`}>
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-3"
          >
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                FlexVolt Battery Engraving & Order
              </h1>
              <p className="text-gray-600 text-base max-w-2xl mx-auto">
                Select your batteries and customize with professional laser engraving
              </p>
            </div>
          </motion.div>

          {/* Mobile Tab Navigation */}
          {isMobile && (
            <div className="flex mb-3 bg-white rounded-lg shadow-sm p-1">
              <button
                onClick={() => setActiveTab('engraving')}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                  activeTab === 'engraving' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Customize Engraving
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

          {/* Full Width Layout for Desktop/Tablet */}
          <div className="space-y-4">
            {/* Mobile Engraving Controls - Show first on mobile */}
            {isMobile && activeTab === 'engraving' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="lg:hidden"
              >
                <EnhancedEngravingDesigner />
              </motion.div>
            )}

            {/* Engraving Designer - Full Width */}
            {(!isMobile || activeTab === 'batteries') && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${isMobile && activeTab !== 'batteries' ? 'hidden' : ''}`}
              >
                {!isMobile && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <EnhancedEngravingDesigner />
                    </div>
                    <div style={{ backgroundColor: 'transparent' }}>
                      <EnhancedBatteryPreview />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Battery Selection - Full Width */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`${isMobile && activeTab !== 'batteries' ? 'hidden' : ''}`}
            >
              <div>
                <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Choose Your Quantity</h2>
                  <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                    BULK SAVINGS
                  </span>
                </div>
                <div className="bg-white border-2 border-t-0 border-gray-200 rounded-b-lg p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
              </div>
            </motion.div>


            {/* Order Summary - Full Width */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="bg-white border-2 border-blue-200 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                  <h3 className="text-lg font-semibold">Order Summary</h3>
                </div>
                
                <div className="p-6">
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
                  
                  {subtotal === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Battery className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No batteries selected</p>
                    </div>
                  )}
                  
                  {/* Totals */}
                  {subtotal > 0 && (
                    <>
                      <div className="pt-4 mt-4 border-t border-gray-200">
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
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                          <span>Total:</span>
                          <span className="text-blue-600">${total.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-6 space-y-3">
                        <button
                          onClick={handleCheckout}
                          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-5 h-5" />
                          Proceed to Checkout
                        </button>
                        
                        {/* Volume Discount Progress */}
                        <div className="py-4">
                          <VolumeDiscountProgressSimple
                            currentAmount={subtotal}
                            discountTiers={discountTiers}
                          />
                        </div>
                        
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
                                    type: 'laser-engraving',
                                    previewImage: previewImage
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
                              previewImage: previewImage,
                              requestedAt: new Date().toISOString()
                            };
                            
                            sessionStorage.setItem('invoiceRequestData', JSON.stringify(invoiceData));
                            toast.success('Invoice request prepared! Redirecting to invoice form...');
                            
                            // Redirect to invoice request page
                            setTimeout(() => {
                              router.push('/customer/invoice-request');
                            }, 1500);
                          }}
                          className="w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                        >
                          <FileText className="w-5 h-5" />
                          Send Me An Invoice
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </motion.div>
            
            {/* Features Grid - Full Width */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              <div className="bg-white border-2 border-gray-200 rounded-lg p-3 text-center hover:border-blue-300 hover:shadow-md transition-all">
                <div className="text-2xl mb-1">🔋</div>
                <h4 className="text-gray-800 font-semibold text-sm">FlexVolt Power</h4>
                <p className="text-gray-600 text-xs">20V/60V MAX</p>
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-3 text-center hover:border-blue-300 hover:shadow-md transition-all">
                <div className="text-2xl mb-1">✋</div>
                <h4 className="text-gray-800 font-semibold text-sm">Hand Crafted</h4>
                <p className="text-gray-600 text-xs">Expert engraving</p>
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-3 text-center hover:border-blue-300 hover:shadow-md transition-all">
                <div className="text-2xl mb-1">🛡️</div>
                <h4 className="text-gray-800 font-semibold text-sm">Theft Deterrent</h4>
                <p className="text-gray-600 text-xs">73% reduction</p>
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-3 text-center hover:border-blue-300 hover:shadow-md transition-all">
                <div className="text-2xl mb-1">🇺🇸</div>
                <h4 className="text-gray-800 font-semibold text-sm">Boston, USA</h4>
                <p className="text-gray-600 text-xs">Made in America</p>
              </div>
            </motion.div>

            {/* Pro Tips - Full Width */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200"
            >
              <h4 className="text-gray-800 font-semibold mb-2 flex items-center text-sm">
                <span className="text-lg mr-2">💡</span> Pro Tips
              </h4>
              <ul className="space-y-1 text-xs text-gray-700">
                <li>• Maximum 30 characters for optimal readability</li>
                <li>• Black engraving provides best contrast on metal</li>
                <li>• Add serial numbers for easy tracking</li>
                <li>• Consider adding QR codes for digital inventory</li>
              </ul>
            </motion.div>

            {/* Custom Engraving & Assembly Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
            >
              {/* Enhanced Header with Blue Gradient Background */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h3 className="text-lg font-bold text-white text-center">
                  🇺🇸 USA Custom Engraving & Assembly
                </h3>
              </div>
              
              {/* Content Section */}
              <div className="p-6">
                <p className="text-gray-700 mb-4 leading-relaxed text-center">
                  Your FlexVolt batteries are <strong>custom engraved and assembled in the USA</strong> which takes time. 
                  Our <strong>10% deposit system</strong> secures your batteries while we complete the engraving work.
                </p>
                
                {/* Payment Structure */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3 text-sm text-gray-800 mb-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></span>
                    <span><strong>Pay 10% now</strong> - locks in your order</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-800">
                    <span className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></span>
                    <span><strong>Pay remaining 90%</strong> when batteries are ready to ship</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Mobile Fixed Bottom Bar */}
          {isMobile && subtotal > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-lg z-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
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
              <RemotionVideoPlayer
                src={videoUrl}
                onComplete={() => setShowVideo(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Debug component - only shows in development */}
        <ImageFlowDebugger showDebug={process.env.NODE_ENV === 'development'} />
      </main>

      <style jsx global>{`
        /* Prevent initial layout shifts and scroll */
        html {
          overflow-x: hidden;
          scroll-behavior: auto;
          position: relative;
          scroll-padding-top: 0;
        }
        
        body {
          overflow-x: hidden;
          position: relative;
          margin: 0;
          padding: 0;
        }
        
        /* Ensure page loads at correct height */
        main {
          position: relative;
          will-change: auto;
          min-height: 100vh;
        }
        
        /* Prevent any unwanted scrolling on load */
        html:not([data-scroll='true']) {
          scroll-behavior: auto !important;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
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
      `}</style>
    </>
  )
}