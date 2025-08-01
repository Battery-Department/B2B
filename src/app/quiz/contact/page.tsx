'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Phone,
  Building,
  Calculator,
  Truck,
  Users,
  BarChart3,
  Lock,
  Shield,
  Clock,
  CheckCircle,
  Battery
} from 'lucide-react'

function ContactCaptureContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') || ''
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  
  // Get user type from session storage or default to professional
  const [userType] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('quiz-user-type') || 'professional'
    }
    return 'professional'
  })
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Name is required'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }
    
    if (userType === 'professional' && !formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required for contractors'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const checkBusinessEmail = (email: string) => {
    const freeEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com']
    const domain = email.split('@')[1]
    
    if (userType === 'professional' && freeEmailDomains.includes(domain)) {
      setShowWarning(true)
      return false
    }
    setShowWarning(false)
    return true
  }
  
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/quiz/v2/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          contactInfo: formData
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Store for results page
        if (typeof window !== 'undefined') {
          localStorage.setItem('quiz-contact', JSON.stringify(formData))
        }
        
        // Track conversion
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'lead_captured', {
            event_category: 'quiz',
            user_type: userType,
            has_company: !!formData.companyName
          })
        }
        
        // Navigate to results
        router.push(data.results_url || `/quiz/results?session=${sessionId}`)
      }
    } catch (error) {
      console.error('Error submitting contact info:', error)
      // Still navigate to results on error
      router.push(`/quiz/results?session=${sessionId}`)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const valueProps = userType === 'professional' ? [
    { icon: Calculator, text: "Custom fleet pricing calculator" },
    { icon: Truck, text: "Free shipping on orders $200+" },
    { icon: Users, text: "Dedicated account manager" },
    { icon: BarChart3, text: "Battery usage analytics dashboard" }
  ] : [
    { icon: Calculator, text: "Instant savings calculator" },
    { icon: Truck, text: "Free shipping on orders $99+" },
    { icon: Shield, text: "12-month no-hassle warranty" },
    { icon: Clock, text: "Same-day shipping available" }
  ]
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-sm text-[#006FEE]">
            <Battery className="w-4 h-4" />
            <span className="font-semibold">Lithi</span>
            <span className="text-gray-400">•</span>
            <span>Almost there!</span>
          </div>
        </div>
      </header>
      
      <main className="px-4 py-8 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Heading */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🎯</div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Perfect! Your personalized battery solution is ready
            </h1>
            <p className="text-gray-600">
              {userType === 'professional' 
                ? "Plus: Get exclusive access to your Contractor Portal"
                : "Plus: Unlock member-only deals and free shipping"}
            </p>
          </div>
          
          {/* Value Props */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {valueProps.map((prop, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-200"
              >
                <prop.icon className="w-5 h-5 text-[#006FEE] flex-shrink-0" />
                <span className="text-sm text-gray-700">{prop.text}</span>
              </motion.div>
            ))}
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Smith"
                  className={`
                    w-full pl-10 pr-4 py-3 border-2 rounded-xl text-base
                    focus:outline-none focus:ring-2 focus:ring-[#006FEE] focus:border-transparent
                    ${errors.fullName ? 'border-red-500' : 'border-gray-200'}
                  `}
                  autoComplete="name"
                />
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
              )}
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {userType === 'professional' ? 'Work Email' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    checkBusinessEmail(e.target.value)
                  }}
                  placeholder={userType === 'professional' ? "john@smithconstruction.com" : "john@email.com"}
                  className={`
                    w-full pl-10 pr-4 py-3 border-2 rounded-xl text-base
                    focus:outline-none focus:ring-2 focus:ring-[#006FEE] focus:border-transparent
                    ${errors.email ? 'border-red-500' : 'border-gray-200'}
                  `}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
              {showWarning && userType === 'professional' && (
                <p className="text-amber-600 text-sm mt-1 flex items-start gap-1">
                  <span>💡</span>
                  <span>Tip: Use your business email for faster approval and net terms</span>
                </p>
              )}
            </div>
            
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                  placeholder="(555) 123-4567"
                  className={`
                    w-full pl-10 pr-4 py-3 border-2 rounded-xl text-base
                    focus:outline-none focus:ring-2 focus:ring-[#006FEE] focus:border-transparent
                    ${errors.phone ? 'border-red-500' : 'border-gray-200'}
                  `}
                  autoComplete="tel"
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">For order updates & exclusive deals</p>
            </div>
            
            {/* Company Name (Professional only) */}
            {userType === 'professional' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Smith Construction LLC"
                    className={`
                      w-full pl-10 pr-4 py-3 border-2 rounded-xl text-base
                      focus:outline-none focus:ring-2 focus:ring-[#006FEE] focus:border-transparent
                      ${errors.companyName ? 'border-red-500' : 'border-gray-200'}
                    `}
                    autoComplete="organization"
                  />
                </div>
                {errors.companyName && (
                  <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
                )}
              </div>
            )}
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-200
                ${isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#006FEE] to-[#0050B3] hover:shadow-lg active:scale-[0.98]'
                }
              `}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {userType === 'professional' 
                    ? "Get Fleet Pricing & Portal Access"
                    : "Get My Recommendations & Deals"}
                  <CheckCircle className="w-5 h-5" />
                </span>
              )}
            </button>
          </form>
          
          {/* Trust Badges */}
          <div className="flex justify-center items-center gap-6 mt-6 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Lock className="w-4 h-4" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>No Spam Promise</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Results in 5 seconds</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default function ContactCapturePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#006FEE] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ContactCaptureContent />
    </Suspense>
  )
}