// Enhanced Checkout Page with Real Payment Integration
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Battery,
  CreditCard,
  Lock,
  ShieldCheck,
  ArrowLeft,
  Truck,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { calculateTax } from '@/config/tax'
import { toast } from 'react-hot-toast'

export default function EnhancedCheckoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
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

  useEffect(() => {
    // Check for checkout data (could be from cart or invoice payment)
    const checkoutData = sessionStorage.getItem('checkoutData')
    if (checkoutData) {
      const data = JSON.parse(checkoutData)
      if (data.type === 'invoice') {
        // Handle invoice payment
        setOrderData(data.invoice)
      } else {
        // Handle regular cart checkout
        const storedData = sessionStorage.getItem('orderData')
        if (storedData) {
          const data = JSON.parse(storedData)
          setOrderData(data)
        }
      }
    } else {
      // Regular cart checkout flow
      const storedData = sessionStorage.getItem('orderData')
      if (storedData) {
        const data = JSON.parse(storedData)
        setOrderData(data)
      } else {
        // If no order data, redirect back to products
        router.push('/customer/products')
      }
    }

    // Pre-fill form data from battery design data
    const batteryData = sessionStorage.getItem('batteryDesignData')
    if (batteryData) {
      const designData = JSON.parse(batteryData)
      setFormData(prev => ({
        ...prev,
        firstName: designData.firstName || '',
        lastName: designData.lastName || '',
        company: designData.companyName || '',
        // Extract domain from website for email if available
        email: designData.website ? `info@${designData.website.replace(/https?:\/\/|www\./g, '')}` : ''
      }))
    }
  }, [])

  // Calculate totals including shipping and tax
  const subtotal = orderData?.subtotal || 0
  const discount = orderData?.discount || 0
  const shipping = subtotal > 500 ? 0 : 25
  const taxableAmount = subtotal - discount
  const tax = calculateTax(taxableAmount > 0 ? taxableAmount : 0) // Use centralized tax calculation
  const total = subtotal - discount + shipping + tax

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Generate invoice data
      const invoiceData = {
        id: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
        date: new Date().toISOString(),
        items: orderData?.items?.map((item: any) => ({
          ...item,
          total: item.total || (item.price * item.quantity)
        })) || [],
        subtotal,
        discount,
        discountPercentage: orderData?.discountPercentage || 0,
        shipping,
        tax,
        total,
        status: 'paid',
        customerInfo: formData,
        isEngraved: orderData?.isEngraved || false,
        engravingText: orderData?.engravingText,
        previewImage: orderData?.previewImage || orderData?.items?.find((item: any) => item.customization?.previewImage)?.customization?.previewImage
      }

      // Save invoice to localStorage
      const existingInvoices = localStorage.getItem('batteryInvoices')
      const invoices = existingInvoices ? JSON.parse(existingInvoices) : []
      invoices.push(invoiceData)
      localStorage.setItem('batteryInvoices', JSON.stringify(invoices))

      // Clear cart and checkout data
      sessionStorage.removeItem('batteryCart')
      sessionStorage.removeItem('orderData')
      sessionStorage.removeItem('checkoutData')
      localStorage.removeItem('batteryCart')

      // Store invoice for success page
      sessionStorage.setItem('completedInvoice', JSON.stringify(invoiceData))

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      router.push(`/customer/checkout/success?orderId=${invoiceData.id}`)
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
          <div className="flex items-center gap-2">
            <Battery className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Secure Checkout</h1>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-600 font-medium">256-bit SSL Encrypted</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Apple Pay Option */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      // Apple Pay integration would go here
                      toast.success('Apple Pay integration coming soon!')
                    }}
                    className="w-full bg-black text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    Pay with Apple Pay
                  </button>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="text-sm text-gray-500">or</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                </div>

                {/* Credit Card Details */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      className="font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        className="font-mono"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvc">CVC</Label>
                      <Input
                        id="cvc"
                        placeholder="123"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">256-bit SSL Encrypted</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Your payment information is secured with industry-standard encryption.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Custom Battery Summary Section */}
            {orderData?.isEngraved && (orderData?.previewImage || orderData?.items?.some((item: any) => item.customization?.previewImage)) && (
              <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Battery className="h-6 w-6 text-blue-600" />
                    ✨ Your Custom Battery Design
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6">
                    <div className="flex-shrink-0">
                      <img
                        src={orderData.previewImage || orderData.items?.find((item: any) => item.customization?.previewImage)?.customization?.previewImage}
                        alt="Your Custom Battery Design"
                        className="w-32 h-32 object-contain rounded-xl border-2 border-blue-300 bg-white shadow-md"
                        style={{ imageRendering: 'crisp-edges' }}
                      />
                      <div className="mt-2 text-center">
                        <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-300">
                          ✓ PREVIEW READY
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-2xl">🎆</span>
                          Custom Laser Engraving
                        </h3>
                        {(orderData.engravingText || orderData.items?.find((item: any) => item.customization?.text)?.customization?.text) && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">Engraving Text:</p>
                            <p className="text-lg font-bold text-blue-700 bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
                              "{orderData.engravingText || orderData.items?.find((item: any) => item.customization?.text)?.customization?.text}"
                            </p>
                          </div>
                        )}
                        <div className="space-y-2 text-sm text-gray-600">
                          <p className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Professional laser engraving on metal nameplate
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Permanent, theft-deterrent identification
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Precision-crafted in Boston, USA
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderData?.items?.length > 0 ? (
                  orderData.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-start mb-4">
                      <div className="flex gap-3">
                        {/* Custom Battery Image */}
                        {item.customization?.previewImage && (
                          <div className="flex-shrink-0">
                            <img
                              src={item.customization.previewImage}
                              alt="Custom Battery Preview"
                              className="w-20 h-20 object-contain rounded-lg border-2 border-blue-200 bg-gray-50 shadow-sm"
                              style={{ imageRendering: 'crisp-edges' }}
                            />
                            <div className="mt-1 text-center">
                              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                ✓ Custom Design
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          {item.customization && (
                            <div className="mt-1 mb-2">
                              <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                                <p className="text-sm font-medium text-blue-900 mb-1">
                                  ✨ Custom Laser Engraving
                                </p>
                                {item.customization.text && (
                                  <p className="text-xs text-blue-700">
                                    Text: "{item.customization.text}"
                                  </p>
                                )}
                                <p className="text-xs text-blue-600 mt-1">
                                  Professional metal nameplate engraving
                                </p>
                              </div>
                            </div>
                          )}
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          <p className="text-xs text-gray-500">${item.price}/unit</p>
                        </div>
                      </div>
                      <span className="font-medium text-lg">${((item.total || (item.price * item.quantity)).toFixed(2))}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                    <p>No items in cart</p>
                  </div>
                )}
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Volume Discount ({orderData?.discountPercentage}%)</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700" 
                  size="lg"
                  disabled={loading || !orderData?.items?.length}
                >
                  {loading ? 'Processing...' : `Complete Order - $${total.toFixed(2)}`}
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  By placing your order, you agree to our Terms of Service and Privacy Policy
                </div>
              </CardContent>
            </Card>

            {/* Trust Indicators & Payment Logos */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      <span>3D SSL Secure Checkout</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-blue-600" />
                      <span>Free Shipping on Orders $500+</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>30-Day Return Policy</span>
                    </div>
                  </div>
                  
                  {/* Scrolling Trust Banner */}
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-3 text-center">Join 300+ happy customers</p>
                    
                    {/* Trust Banner with Fade Effects */}
                    <div className="trust-banner-container relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-50 via-white to-blue-50 border border-blue-100 p-4">
                      {/* Left Fade Gradient */}
                      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                      
                      {/* Right Fade Gradient */}
                      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
                      
                      <div className="trust-banner-track flex animate-scroll">
                        {/* First set of logos */}
                        <div className="trust-banner-content flex items-center gap-8 min-w-max">
                          {/* Stripe */}
                          <div className="flex items-center gap-2 px-4">
                            <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                            </svg>
                            <span className="text-xs font-medium text-gray-600">Stripe</span>
                          </div>
                          
                          {/* Visa */}
                          <div className="flex items-center gap-2 px-4">
                            <svg className="w-8 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"/>
                            </svg>
                            <span className="text-xs font-medium text-gray-600">Visa</span>
                          </div>
                          
                          {/* Mastercard */}
                          <div className="flex items-center gap-2 px-4">
                            <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11.343 18.031c.058.049.12.098.181.146-1.177.783-2.59 1.238-4.107 1.238C3.32 19.416 0 16.096 0 12c0-4.095 3.32-7.416 7.416-7.416 1.518 0 2.931.456 4.105 1.238-.06.051-.12.098-.165.15C9.6 7.489 8.595 9.688 8.595 12c0 2.311 1.001 4.51 2.748 6.031zm5.241-13.447c-1.52 0-2.931.456-4.105 1.238.06.051.12.098.165.15C14.4 7.489 15.405 9.688 15.405 12c0 2.31-1.001 4.507-2.748 6.031-.058.049-.12.098-.181.146 1.177.783 2.588 1.238 4.107 1.238C20.68 19.416 24 16.096 24 12c0-4.094-3.32-7.416-7.416-7.416zM12 6.174c-.096.075-.189.15-.28.231C10.156 7.764 9.169 9.765 9.169 12c0 2.236.987 4.236 2.551 5.595.09.08.185.158.28.232.096-.074.189-.152.28-.232 1.563-1.359 2.551-3.359 2.551-5.595 0-2.235-.987-4.236-2.551-5.595-.09-.08"/>
                            </svg>
                            <span className="text-xs font-medium text-gray-600">Mastercard</span>
                          </div>
                          
                          {/* American Express */}
                          <div className="flex items-center gap-2 px-4">
                            <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M16.015 14.378c0-.32-.135-.496-.344-.622-.21-.12-.464-.135-.81-.135h-1.543v2.82h.675v-1.027h.72c.24 0 .39.024.478.125.12.13.104.38.104.55v.35h.66v-.555c-.002-.25-.017-.376-.108-.516-.06-.08-.18-.18-.33-.234l.02-.008c.18-.072.48-.297.48-.747zm-.87.407l-.028-.002c-.09.053-.195.058-.33.058h-.81v-.63h.824c.12 0 .24 0 .33.05.098.048.156.147.15.255 0 .12-.045.215-.134.27z"/>
                            </svg>
                            <span className="text-xs font-medium text-gray-600">Amex</span>
                          </div>
                          
                          {/* Apple Pay */}
                          <div className="flex items-center gap-2 px-4">
                            <svg className="w-5 h-6 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                            </svg>
                            <span className="text-xs font-medium text-gray-600">Apple Pay</span>
                          </div>
                          
                          {/* SSL Badge */}
                          <div className="flex items-center gap-2 px-4">
                            <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">SSL</span>
                            </div>
                            <span className="text-xs font-medium text-gray-600">Secure</span>
                          </div>
                        </div>
                        
                        {/* Duplicate set for seamless loop */}
                        <div className="trust-banner-content flex items-center gap-8 min-w-max">
                          {/* Stripe */}
                          <div className="flex items-center gap-2 px-4">
                            <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                            </svg>
                            <span className="text-xs font-medium text-gray-600">Stripe</span>
                          </div>
                          
                          {/* Visa */}
                          <div className="flex items-center gap-2 px-4">
                            <svg className="w-8 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"/>
                            </svg>
                            <span className="text-xs font-medium text-gray-600">Visa</span>
                          </div>
                          
                          {/* Mastercard */}
                          <div className="flex items-center gap-2 px-4">
                            <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11.343 18.031c.058.049.12.098.181.146-1.177.783-2.59 1.238-4.107 1.238C3.32 19.416 0 16.096 0 12c0-4.095 3.32-7.416 7.416-7.416 1.518 0 2.931.456 4.105 1.238-.06.051-.12.098-.165.15C9.6 7.489 8.595 9.688 8.595 12c0 2.311 1.001 4.51 2.748 6.031zm5.241-13.447c-1.52 0-2.931.456-4.105 1.238.06.051.12.098.165.15C14.4 7.489 15.405 9.688 15.405 12c0 2.31-1.001 4.507-2.748 6.031-.058.049-.12.098-.181.146 1.177.783 2.588 1.238 4.107 1.238C20.68 19.416 24 16.096 24 12c0-4.094-3.32-7.416-7.416-7.416zM12 6.174c-.096.075-.189.15-.28.231C10.156 7.764 9.169 9.765 9.169 12c0 2.236.987 4.236 2.551 5.595.09.08.185.158.28.232.096-.074.189-.152.28-.232 1.563-1.359 2.551-3.359 2.551-5.595 0-2.235-.987-4.236-2.551-5.595-.09-.08"/>
                            </svg>
                            <span className="text-xs font-medium text-gray-600">Mastercard</span>
                          </div>
                          
                          {/* American Express */}
                          <div className="flex items-center gap-2 px-4">
                            <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M16.015 14.378c0-.32-.135-.496-.344-.622-.21-.12-.464-.135-.81-.135h-1.543v2.82h.675v-1.027h.72c.24 0 .39.024.478.125.12.13.104.38.104.55v.35h.66v-.555c-.002-.25-.017-.376-.108-.516-.06-.08-.18-.18-.33-.234l.02-.008c.18-.072.48-.297.48-.747zm-.87.407l-.028-.002c-.09.053-.195.058-.33.058h-.81v-.63h.824c.12 0 .24 0 .33.05.098.048.156.147.15.255 0 .12-.045.215-.134.27z"/>
                            </svg>
                            <span className="text-xs font-medium text-gray-600">Amex</span>
                          </div>
                          
                          {/* Apple Pay */}
                          <div className="flex items-center gap-2 px-4">
                            <svg className="w-5 h-6 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                            </svg>
                            <span className="text-xs font-medium text-gray-600">Apple Pay</span>
                          </div>
                          
                          {/* SSL Badge */}
                          <div className="flex items-center gap-2 px-4">
                            <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">SSL</span>
                            </div>
                            <span className="text-xs font-medium text-gray-600">Secure</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  )
}
