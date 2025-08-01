// B2B Construction Checkout - Battery Department LLC
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Shield, 
  Users, 
  Award, 
  MapPin, 
  Info, 
  AlertCircle,
  FileText,
  CreditCard,
  CheckCircle,
  Phone,
  Mail,
  Loader2,
  Package,
  Clock,
  DollarSign,
  X
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function B2BCheckoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('invoice')
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    // Get order data from session storage or create mock data
    const storedData = sessionStorage.getItem('orderData')
    if (storedData) {
      const data = JSON.parse(storedData)
      setOrderData(data)
    } else {
      // Create mock order data for testing
      const mockData = {
        items: [
          {
            id: '9ah-flexvolt',
            name: '9Ah FlexVolt Battery',
            price: 19.50,
            quantity: 10,
            image: '/images/9ah-battery.jpg'
          }
        ],
        subtotal: 195.00,
        discount: 0,
        total: 195.00
      }
      setOrderData(mockData)
    }

    // Pre-fill form data from battery design data
    const batteryData = sessionStorage.getItem('batteryDesignData')
    if (batteryData) {
      const designData = JSON.parse(batteryData)
      setFormData(prev => ({
        ...prev,
        companyName: designData.companyName || '',
        contactName: `${designData.firstName || ''} ${designData.lastName || ''}`.trim(),
        email: designData.website ? `info@${designData.website.replace(/https?:\/\/|www\./g, '')}` : ''
      }))
    }
  }, [router])

  // Calculate totals
  const subtotal = orderData?.retailSubtotal || orderData?.subtotal || 0
  const discount = orderData?.discount || 0
  const total = orderData?.retailTotal || subtotal - discount
  const depositAmount = total * 0.1 // 10% deposit
  const balanceAmount = total * 0.9 // 90% balance

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create order with invoice details
      const orderDetails = {
        ...orderData,
        ...formData,
        depositAmount,
        balanceAmount,
        total,
        paymentType: formData.paymentType,
        timestamp: new Date().toISOString()
      }

      // Store order details
      sessionStorage.setItem('b2bOrderDetails', JSON.stringify(orderDetails))

      // Handle different payment types
      if (formData.paymentType === 'card') {
        // Redirect to payment page
        router.push('/customer/payment')
      } else {
        // Show success and redirect to confirmation
        toast.success('Order submitted! Invoice will be sent within 2 hours.')
        router.push('/customer/checkout/success')
      }
    } catch (error) {
      toast.error('Failed to submit order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const InvoiceModal = () => (
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
                {orderData?.items?.[0]?.quantity || 10}× {orderData?.items?.[0]?.name || '9Ah FlexVolt Batteries'}
              </span>
              <span className="font-bold">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-2 text-blue-600 font-semibold">
              <span>10% Deposit Due Now:</span>
              <span>${depositAmount.toFixed(2)}</span>
            </div>
          </div>

          <form onSubmit={handleInvoiceSubmit} className="space-y-4">
            <h3 className="font-bold text-lg">Company Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="Company Name*" 
                className="w-full p-3 border rounded-lg"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                required 
              />
              <input 
                type="text" 
                placeholder="Contact Name*" 
                className="w-full p-3 border rounded-lg"
                value={formData.contactName}
                onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                required 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="email" 
                placeholder="Email*" 
                className="w-full p-3 border rounded-lg"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required 
              />
              <input 
                type="tel" 
                placeholder="Phone*" 
                className="w-full p-3 border rounded-lg"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required 
              />
            </div>
            
            <input 
              type="text" 
              placeholder="Company Address*" 
              className="w-full p-3 border rounded-lg"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              required 
            />
            
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="PO Number (if available)" 
                className="w-full p-3 border rounded-lg"
                value={formData.poNumber}
                onChange={(e) => setFormData({...formData, poNumber: e.target.value})}
              />
              <select 
                className="w-full p-3 border rounded-lg"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
              >
                <option>NET 30 (Standard)</option>
                <option>NET 60</option>
                <option>Due on Receipt</option>
              </select>
            </div>
            
            <textarea 
              placeholder="Custom engraving text for each battery (we'll confirm before production)"
              className="w-full p-3 border rounded-lg h-24"
              value={formData.engravingText}
              onChange={(e) => setFormData({...formData, engravingText: e.target.value})}
              required
            />
            
            <div className="border-t pt-4">
              <h3 className="font-bold text-lg mb-3">Choose Deposit Payment Method:</h3>
              
              <div className="space-y-3">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="invoice" 
                    className="mr-3" 
                    checked={formData.paymentType === 'invoice'}
                    onChange={(e) => setFormData({...formData, paymentType: e.target.value})}
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
                    checked={formData.paymentType === 'card'}
                    onChange={(e) => setFormData({...formData, paymentType: e.target.value})}
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
                    checked={formData.paymentType === 'ach'}
                    onChange={(e) => setFormData({...formData, paymentType: e.target.value})}
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
  )

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section with Trust Signals */}
      <div className="bg-gray-50 border-b py-4 mb-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Fully Insured</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>300+ Companies Trust Us</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span>12-Month Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-600" />
              <span>Made in Boston, USA</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-12">
        <h1 className="text-3xl font-bold mb-8">Complete Your Order</h1>

        {/* Enhanced Payment Structure Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            How Our Payment Process Works
          </h3>
          
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
              <div>
                <p className="font-semibold">10% Deposit to Secure Your Order</p>
                <p className="text-sm text-gray-700">${depositAmount.toFixed(2)} due today - Required for material procurement & production slot</p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
              <div>
                <p className="font-semibold">Approve Your Custom Engraving</p>
                <p className="text-sm text-gray-700">Review & approve before permanent battery assembly</p>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
              <div>
                <p className="font-semibold">Final Invoice (NET 30 Available)</p>
                <p className="text-sm text-gray-700">${balanceAmount.toFixed(2)} balance - Due after approval, NET 30 terms available</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white rounded border border-blue-200">
            <p className="text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span><strong>Why 10% deposit?</strong> Custom engraving requires immediate material investment and production scheduling. This secures your slot in our 30-day production queue.</span>
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="font-bold text-lg mb-4">Order Summary</h3>
          {orderData?.items?.map((item: any, index: number) => (
            <div key={index} className="flex justify-between items-center mb-2">
              <span>{item.quantity}× {item.name}</span>
              <span className="font-semibold">${((item.retailPrice || item.price * 10) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total Order Value:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-blue-600 font-semibold mt-2">
              <span>10% Deposit Required:</span>
              <span>${depositAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Dual CTA Buttons */}
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
                setFormData({...formData, paymentType: 'card'})
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

        {/* Additional Trust Information */}
        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <Package className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <h4 className="font-semibold">30-Day Production</h4>
              <p className="text-sm text-gray-600">Custom engraving takes time to perfect</p>
            </div>
            <div>
              <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <h4 className="font-semibold">Your Approval Required</h4>
              <p className="text-sm text-gray-600">Review before permanent assembly</p>
            </div>
            <div>
              <DollarSign className="w-8 h-8 mx-auto text-purple-600 mb-2" />
              <h4 className="font-semibold">NET 30 Available</h4>
              <p className="text-sm text-gray-600">Flexible terms for established businesses</p>
            </div>
          </div>
        </div>

        {/* Footer with Company Details */}
        <div className="mt-12 pt-8 border-t text-center space-y-4">
          <div>
            <h4 className="font-bold text-lg">Battery Department LLC</h4>
            <p className="text-sm text-gray-600">
              68 Harrison Avenue, Ste 605<br/>
              Boston, MA 02111<br/>
              United States
            </p>
          </div>
          
          <div className="flex justify-center gap-6 text-sm">
            <a href="tel:1-800-BATTERY" className="flex items-center gap-2 text-blue-600 hover:underline">
              <Phone className="w-4 h-4" />
              1-800-BATTERY
            </a>
            <a href="mailto:orders@batterydepartment.com" className="flex items-center gap-2 text-blue-600 hover:underline">
              <Mail className="w-4 h-4" />
              orders@batterydepartment.com
            </a>
          </div>
          
          <p className="text-xs text-gray-500">
            Mon-Fri 7AM-6PM EST • Proudly serving contractors since 2019
          </p>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && <InvoiceModal />}
    </div>
  )
}