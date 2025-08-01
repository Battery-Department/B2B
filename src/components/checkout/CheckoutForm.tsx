'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCart } from '@/hooks/useCart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Lock, Truck, CheckCircle } from 'lucide-react'

interface CheckoutFormData {
  customerEmail: string
  customerName: string
  shippingAddress: {
    name: string
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  billingAddress?: {
    name: string
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  useSameAddress: boolean
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

export function CheckoutForm() {
  const { cart, loading: cartLoading } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useSameAddress, setUseSameAddress] = useState(true)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CheckoutFormData>({
    defaultValues: {
      useSameAddress: true,
      shippingAddress: {
        country: 'US'
      },
      billingAddress: {
        country: 'US'
      }
    }
  })

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      setIsSubmitting(true)
      
      const checkoutData = {
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        shippingAddress: data.shippingAddress,
        billingAddress: useSameAddress ? data.shippingAddress : data.billingAddress
      }
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Checkout failed')
      }
      
      const result = await response.json()
      
      // Redirect to Stripe checkout
      if (result.sessionUrl) {
        window.location.href = result.sessionUrl
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      alert(error.message || 'Failed to process checkout')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (cartLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="h-40 bg-gray-200 rounded"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!cart?.items.length) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-[#111827] mb-4">Your cart is empty</h1>
        <p className="text-[#6B7280] mb-6">Add some items to your cart before checkout.</p>
        <Button
          className="bg-[#006FEE] hover:bg-[#0050B3] text-white"
          onClick={() => window.location.href = '/customer/products'}
        >
          Browse Products
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#111827] mb-2">Checkout</h1>
        <p className="text-[#6B7280]">Complete your order for FlexVolt batteries</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Forms */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card className="border-2 border-[#E6F4FF]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#111827]">
                  <CheckCircle className="h-5 w-5 text-[#006FEE]" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customerEmail">Email Address *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    {...register('customerEmail', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className="mt-1"
                    placeholder="your@email.com"
                  />
                  {errors.customerEmail && (
                    <p className="text-sm text-[#EF4444] mt-1">{errors.customerEmail.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="customerName">Full Name *</Label>
                  <Input
                    id="customerName"
                    {...register('customerName', { required: 'Name is required' })}
                    className="mt-1"
                    placeholder="John Doe"
                  />
                  {errors.customerName && (
                    <p className="text-sm text-[#EF4444] mt-1">{errors.customerName.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card className="border-2 border-[#E6F4FF]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#111827]">
                  <Truck className="h-5 w-5 text-[#006FEE]" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shippingName">Full Name *</Label>
                  <Input
                    id="shippingName"
                    {...register('shippingAddress.name', { required: 'Name is required' })}
                    className="mt-1"
                  />
                  {errors.shippingAddress?.name && (
                    <p className="text-sm text-[#EF4444] mt-1">{errors.shippingAddress.name.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="shippingStreet">Street Address *</Label>
                  <Input
                    id="shippingStreet"
                    {...register('shippingAddress.street', { required: 'Street address is required' })}
                    className="mt-1"
                    placeholder="123 Main Street"
                  />
                  {errors.shippingAddress?.street && (
                    <p className="text-sm text-[#EF4444] mt-1">{errors.shippingAddress.street.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shippingCity">City *</Label>
                    <Input
                      id="shippingCity"
                      {...register('shippingAddress.city', { required: 'City is required' })}
                      className="mt-1"
                    />
                    {errors.shippingAddress?.city && (
                      <p className="text-sm text-[#EF4444] mt-1">{errors.shippingAddress.city.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="shippingState">State *</Label>
                    <Select onValueChange={(value) => setValue('shippingAddress.state', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.shippingAddress?.state && (
                      <p className="text-sm text-[#EF4444] mt-1">{errors.shippingAddress.state.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="shippingZip">ZIP Code *</Label>
                  <Input
                    id="shippingZip"
                    {...register('shippingAddress.zip', { 
                      required: 'ZIP code is required',
                      pattern: {
                        value: /^\d{5}(-\d{4})?$/,
                        message: 'Invalid ZIP code format'
                      }
                    })}
                    className="mt-1"
                    placeholder="12345"
                  />
                  {errors.shippingAddress?.zip && (
                    <p className="text-sm text-[#EF4444] mt-1">{errors.shippingAddress.zip.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card className="border-2 border-[#E6F4FF]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#111827]">
                  <CreditCard className="h-5 w-5 text-[#006FEE]" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="useSameAddress"
                    checked={useSameAddress}
                    onCheckedChange={(checked) => {
                      setUseSameAddress(checked as boolean)
                      setValue('useSameAddress', checked as boolean)
                    }}
                  />
                  <Label htmlFor="useSameAddress" className="text-sm">
                    Same as shipping address
                  </Label>
                </div>
                
                {!useSameAddress && (
                  <div className="space-y-4">
                    {/* Billing address fields - similar to shipping */}
                    <p className="text-sm text-[#6B7280]">
                      Please enter your billing address details (similar form fields as shipping)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <Card className="border-2 border-[#E6F4FF] sticky top-8">
              <CardHeader>
                <CardTitle className="text-[#111827]">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {cart.items.map((item) => {
                    const price = typeof item.price === 'number' ? item.price : Number(item.price)
                    const itemTotal = price * item.quantity
                    
                    return (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div>
                          <p className="font-medium text-[#111827]">{item.product.name}</p>
                          <p className="text-[#6B7280]">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">${itemTotal.toFixed(2)}</p>
                      </div>
                    )
                  })}
                </div>
                
                <Separator />
                
                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[#374151]">
                    <span>Subtotal</span>
                    <span>${cart.totals.subtotal.toFixed(2)}</span>
                  </div>
                  
                  {cart.totals.volumeDiscount && (
                    <div className="flex justify-between text-[#10B981]">
                      <span>{cart.totals.volumeDiscount.label}</span>
                      <span>-${cart.totals.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-[#374151]">
                    <span>Tax</span>
                    <span>${cart.totals.tax.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-[#374151]">
                    <span>Shipping</span>
                    <span>{cart.totals.shipping === 0 ? 'FREE' : `$${cart.totals.shipping.toFixed(2)}`}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-[#111827]">Total</span>
                    <span className="text-[#006FEE]">${cart.totals.total.toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Checkout Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#006FEE] hover:bg-[#0050B3] text-white font-semibold py-3"
                  disabled={isSubmitting}
                  style={{
                    boxShadow: '0 2px 8px rgba(0, 111, 238, 0.25)'
                  }}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Secure Checkout
                    </div>
                  )}
                </Button>
                
                {/* Security Badge */}
                <div className="text-center text-xs text-[#6B7280] pt-2">
                  <p className="flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3" />
                    Secured by Stripe
                  </p>
                </div>

                {/* Scrolling Trust Banner */}
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-3 text-center">Join 300+ happy customers</p>
                  
                  <div className="trust-banner-container relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-50 via-white to-blue-50 border border-blue-100 p-4">
                    {/* Left Fade Gradient */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                    
                    {/* Right Fade Gradient */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
                    
                    <div className="trust-banner-track flex animate-scroll">
                      <div className="trust-banner-content flex items-center gap-8 min-w-max">
                        {/* Stripe */}
                        <svg width="50" height="21" viewBox="0 0 50 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M20.3033 8.65854C20.3033 7.4878 21.1463 6.95122 22.439 6.95122C24.1707 6.95122 26.3659 7.4878 28.0488 8.31707V4.2439C26.1951 3.48781 24.3902 3.21951 22.439 3.21951C18.2293 3.21951 15.4146 5.51219 15.4146 8.90244C15.4146 14.122 22.9024 13.2293 22.9024 16.0488C22.9024 17.3415 21.7805 17.878 20.3033 17.878C18.2781 17.878 15.9024 17.0488 13.9024 16.0488V20.122C16.0488 20.9024 18.2781 21.2195 20.3033 21.2195C24.5610 21.2195 27.6585 18.9756 27.6585 15.4634C27.6585 9.95122 20.3033 10.9024 20.3033 8.65854Z" fill="#635BFF"/>
                          <path fillRule="evenodd" clipRule="evenodd" d="M31.4146 3.4878V7.04878C31.6829 6.95122 32.0488 6.95122 32.439 6.95122C35.3171 6.95122 36.8293 8.73171 36.8293 11.6098V20.7317H31.4146V12.0488C31.4146 10.6829 30.7805 10.0488 29.5366 10.0488C29.1707 10.0488 28.878 10.122 28.5854 10.2195V20.7317H23.1707V3.4878H31.4146Z" fill="#635BFF"/>
                          <path d="M6.04878 14.9268C5.70732 14.9268 5.39024 14.7805 5.14634 14.5366L0.439024 9.82927C-0.146341 9.24391 -0.146341 8.29268 0.439024 7.70732C1.02439 7.12195 1.97561 7.12195 2.56098 7.70732L6.04878 11.1951L13.439 3.80488C14.0244 3.21951 14.9756 3.21951 15.561 3.80488C16.1463 4.39024 16.1463 5.34146 15.561 5.92683L7.04878 14.439C6.92683 14.561 6.78049 14.6585 6.61585 14.7317C6.45122 14.8049 6.25610 14.8537 6.04878 14.9268Z" fill="#00D924"/>
                        </svg>

                        {/* Visa */}
                        <svg width="50" height="16" viewBox="0 0 50 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.0244 1.46341L16.878 14.5366H12.6829L15.8293 1.46341H20.0244Z" fill="#1434CB"/>
                          <path d="M31.9024 1.89024L27.6585 14.5366H23.6585L25.5122 9.07317L23.2195 2.4878C23.122 2.24391 22.9268 2.07317 22.6829 1.95122L17.7805 0.341463H23.5122C24.0488 0.341463 24.5366 0.707317 24.6829 1.21951L25.9756 5.95122L29.4146 1.89024H31.9024Z" fill="#1434CB"/>
                          <path d="M41.9024 14.5366H46.1463L42.5366 1.46341H38.9268C38.4878 1.46341 38.1463 1.78049 37.9756 2.19512L32.878 14.5366H37.3171L38.1463 12.3171H43.3171L41.9024 14.5366ZM39.2195 8.97561L41.2195 4.70732L42.4146 8.97561H39.2195Z" fill="#1434CB"/>
                          <path d="M11.0976 1.46341L6.9024 10.6829L6.41463 8.31707C5.85366 6.41463 4.24391 4.2439 2.36585 3.14634L6.12195 14.5366H10.6098L17.3659 1.46341H11.0976Z" fill="#1434CB"/>
                          <path d="M5.80488 1.46341H0.341463L0.292683 1.68293C5.90244 3.02439 9.58537 6.26829 11.0976 10.6829L9.75610 3.04878C9.53659 2.09756 8.80488 1.46341 7.95122 1.46341H5.80488Z" fill="#EB001B"/>
                        </svg>

                        {/* Mastercard */}
                        <svg width="50" height="30" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="19" cy="15" r="12" fill="#EB001B"/>
                          <circle cx="31" cy="15" r="12" fill="#F79E1B"/>
                          <path d="M25 7.5C27.5 10 27.5 20 25 22.5C22.5 20 22.5 10 25 7.5Z" fill="#FF5F00"/>
                        </svg>

                        {/* American Express */}
                        <svg width="50" height="30" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="50" height="30" rx="4" fill="#006FCF"/>
                          <path d="M8.5 9.5H13.5L15 12L16.5 9.5H21.5V20.5H16.5V15L15 17.5L13.5 15V20.5H8.5V9.5Z" fill="white"/>
                          <path d="M23 9.5H33V12.5H25V14H32V16.5H25V17.5H33V20.5H23V9.5Z" fill="white"/>
                          <path d="M35 9.5H40L42 12.5L44 9.5H49L45.5 15L49 20.5H44L42 17.5L40 20.5H35L38.5 15L35 9.5Z" fill="white"/>
                        </svg>

                        {/* Apple Pay */}
                        <svg width="50" height="21" viewBox="0 0 50 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.8049 6.07317C17.4146 6.65854 16.7317 7.02439 16.0488 7C15.9756 6.31707 16.2927 5.60976 16.6829 5.14634C17.0732 4.63415 17.7561 4.31707 18.3415 4.2439C18.4146 4.95122 18.1463 5.63415 17.8049 6.07317ZM18.3415 7.14634C17.3415 7.09756 16.4878 7.73171 16 7.73171C15.5122 7.73171 14.7805 7.17073 13.9512 7.19512C12.9024 7.21951 11.9268 7.80488 11.4146 8.73171C10.3171 10.6098 11.122 13.4634 12.1707 15.0244C12.6829 15.7805 13.2927 16.6098 14.122 16.5854C14.9024 16.561 15.2195 16.0976 16.1951 16.0976C17.1707 16.0976 17.439 16.5854 18.2927 16.561C19.1463 16.5366 19.6829 15.8049 20.1951 15.0488C20.7561 14.2195 20.9756 13.4146 21 13.3902C20.9756 13.3659 18.7317 12.561 18.7073 9.95122C18.6829 7.80488 20.4634 6.78049 20.5366 6.73171C19.6341 5.41463 18.2439 5.26829 17.8049 5.24391V6.07317H18.3415V7.14634Z" fill="#000000"/>
                          <path d="M25.9512 4.92683V16.4634H28.0732V12.4634H31.2195C33.7073 12.4634 35.4146 10.8537 35.4146 8.4878C35.4146 6.122 33.7561 4.48780 31.3415 4.48780H25.9512V4.92683ZM28.0732 6.63415H30.7317C32.3659 6.63415 33.2195 7.46341 33.2195 8.4878C33.2195 9.51219 32.3659 10.3415 30.7317 10.3415H28.0732V6.63415Z" fill="#000000"/>
                          <path d="M36.6829 13.9268C36.6829 15.561 37.9024 16.5854 39.7805 16.5854C41.6585 16.5854 42.878 15.561 42.878 13.9268C42.878 12.2927 41.6585 11.2683 39.7805 11.2683C37.9024 11.2683 36.6829 12.2927 36.6829 13.9268ZM40.7317 13.9268C40.7317 14.8537 40.2439 15.4146 39.7805 15.4146C39.3171 15.4146 38.8293 14.8537 38.8293 13.9268C38.8293 13 39.3171 12.4390 39.7805 12.4390C40.2439 12.4390 40.7317 13 40.7317 13.9268Z" fill="#000000"/>
                        </svg>
                      </div>
                      
                      {/* Duplicate set for seamless loop */}
                      <div className="trust-banner-content flex items-center gap-8 min-w-max">
                        {/* Stripe */}
                        <svg width="50" height="21" viewBox="0 0 50 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M20.3033 8.65854C20.3033 7.4878 21.1463 6.95122 22.439 6.95122C24.1707 6.95122 26.3659 7.4878 28.0488 8.31707V4.2439C26.1951 3.48781 24.3902 3.21951 22.439 3.21951C18.2293 3.21951 15.4146 5.51219 15.4146 8.90244C15.4146 14.122 22.9024 13.2293 22.9024 16.0488C22.9024 17.3415 21.7805 17.878 20.3033 17.878C18.2781 17.878 15.9024 17.0488 13.9024 16.0488V20.122C16.0488 20.9024 18.2781 21.2195 20.3033 21.2195C24.5610 21.2195 27.6585 18.9756 27.6585 15.4634C27.6585 9.95122 20.3033 10.9024 20.3033 8.65854Z" fill="#635BFF"/>
                          <path fillRule="evenodd" clipRule="evenodd" d="M31.4146 3.4878V7.04878C31.6829 6.95122 32.0488 6.95122 32.439 6.95122C35.3171 6.95122 36.8293 8.73171 36.8293 11.6098V20.7317H31.4146V12.0488C31.4146 10.6829 30.7805 10.0488 29.5366 10.0488C29.1707 10.0488 28.878 10.122 28.5854 10.2195V20.7317H23.1707V3.4878H31.4146Z" fill="#635BFF"/>
                          <path d="M6.04878 14.9268C5.70732 14.9268 5.39024 14.7805 5.14634 14.5366L0.439024 9.82927C-0.146341 9.24391 -0.146341 8.29268 0.439024 7.70732C1.02439 7.12195 1.97561 7.12195 2.56098 7.70732L6.04878 11.1951L13.439 3.80488C14.0244 3.21951 14.9756 3.21951 15.561 3.80488C16.1463 4.39024 16.1463 5.34146 15.561 5.92683L7.04878 14.439C6.92683 14.561 6.78049 14.6585 6.61585 14.7317C6.45122 14.8049 6.25610 14.8537 6.04878 14.9268Z" fill="#00D924"/>
                        </svg>

                        {/* Visa */}
                        <svg width="50" height="16" viewBox="0 0 50 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.0244 1.46341L16.878 14.5366H12.6829L15.8293 1.46341H20.0244Z" fill="#1434CB"/>
                          <path d="M31.9024 1.89024L27.6585 14.5366H23.6585L25.5122 9.07317L23.2195 2.4878C23.122 2.24391 22.9268 2.07317 22.6829 1.95122L17.7805 0.341463H23.5122C24.0488 0.341463 24.5366 0.707317 24.6829 1.21951L25.9756 5.95122L29.4146 1.89024H31.9024Z" fill="#1434CB"/>
                          <path d="M41.9024 14.5366H46.1463L42.5366 1.46341H38.9268C38.4878 1.46341 38.1463 1.78049 37.9756 2.19512L32.878 14.5366H37.3171L38.1463 12.3171H43.3171L41.9024 14.5366ZM39.2195 8.97561L41.2195 4.70732L42.4146 8.97561H39.2195Z" fill="#1434CB"/>
                          <path d="M11.0976 1.46341L6.9024 10.6829L6.41463 8.31707C5.85366 6.41463 4.24391 4.2439 2.36585 3.14634L6.12195 14.5366H10.6098L17.3659 1.46341H11.0976Z" fill="#1434CB"/>
                          <path d="M5.80488 1.46341H0.341463L0.292683 1.68293C5.90244 3.02439 9.58537 6.26829 11.0976 10.6829L9.75610 3.04878C9.53659 2.09756 8.80488 1.46341 7.95122 1.46341H5.80488Z" fill="#EB001B"/>
                        </svg>

                        {/* Mastercard */}
                        <svg width="50" height="30" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="19" cy="15" r="12" fill="#EB001B"/>
                          <circle cx="31" cy="15" r="12" fill="#F79E1B"/>
                          <path d="M25 7.5C27.5 10 27.5 20 25 22.5C22.5 20 22.5 10 25 7.5Z" fill="#FF5F00"/>
                        </svg>

                        {/* American Express */}
                        <svg width="50" height="30" viewBox="0 0 50 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="50" height="30" rx="4" fill="#006FCF"/>
                          <path d="M8.5 9.5H13.5L15 12L16.5 9.5H21.5V20.5H16.5V15L15 17.5L13.5 15V20.5H8.5V9.5Z" fill="white"/>
                          <path d="M23 9.5H33V12.5H25V14H32V16.5H25V17.5H33V20.5H23V9.5Z" fill="white"/>
                          <path d="M35 9.5H40L42 12.5L44 9.5H49L45.5 15L49 20.5H44L42 17.5L40 20.5H35L38.5 15L35 9.5Z" fill="white"/>
                        </svg>

                        {/* Apple Pay */}
                        <svg width="50" height="21" viewBox="0 0 50 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.8049 6.07317C17.4146 6.65854 16.7317 7.02439 16.0488 7C15.9756 6.31707 16.2927 5.60976 16.6829 5.14634C17.0732 4.63415 17.7561 4.31707 18.3415 4.2439C18.4146 4.95122 18.1463 5.63415 17.8049 6.07317ZM18.3415 7.14634C17.3415 7.09756 16.4878 7.73171 16 7.73171C15.5122 7.73171 14.7805 7.17073 13.9512 7.19512C12.9024 7.21951 11.9268 7.80488 11.4146 8.73171C10.3171 10.6098 11.122 13.4634 12.1707 15.0244C12.6829 15.7805 13.2927 16.6098 14.122 16.5854C14.9024 16.561 15.2195 16.0976 16.1951 16.0976C17.1707 16.0976 17.439 16.5854 18.2927 16.561C19.1463 16.5366 19.6829 15.8049 20.1951 15.0488C20.7561 14.2195 20.9756 13.4146 21 13.3902C20.9756 13.3659 18.7317 12.561 18.7073 9.95122C18.6829 7.80488 20.4634 6.78049 20.5366 6.73171C19.6341 5.41463 18.2439 5.26829 17.8049 5.24391V6.07317H18.3415V7.14634Z" fill="#000000"/>
                          <path d="M25.9512 4.92683V16.4634H28.0732V12.4634H31.2195C33.7073 12.4634 35.4146 10.8537 35.4146 8.4878C35.4146 6.122 33.7561 4.48780 31.3415 4.48780H25.9512V4.92683ZM28.0732 6.63415H30.7317C32.3659 6.63415 33.2195 7.46341 33.2195 8.4878C33.2195 9.51219 32.3659 10.3415 30.7317 10.3415H28.0732V6.63415Z" fill="#000000"/>
                          <path d="M36.6829 13.9268C36.6829 15.561 37.9024 16.5854 39.7805 16.5854C41.6585 16.5854 42.878 15.561 42.878 13.9268C42.878 12.2927 41.6585 11.2683 39.7805 11.2683C37.9024 11.2683 36.6829 12.2927 36.6829 13.9268ZM40.7317 13.9268C40.7317 14.8537 40.2439 15.4146 39.7805 15.4146C39.3171 15.4146 38.8293 14.8537 38.8293 13.9268C38.8293 13 39.3171 12.4390 39.7805 12.4390C40.2439 12.4390 40.7317 13 40.7317 13.9268Z" fill="#000000"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}