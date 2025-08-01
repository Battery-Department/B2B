'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ShieldCheck, Loader2, Building2, ArrowRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface LoginFormData {
  email: string
  password: string
  warehouse?: string
  rememberMe: boolean
}

interface LoginError {
  message: string
  field?: keyof LoginFormData
  code?: string
}

const warehouses = [
  { id: 'us-west', name: 'US West Coast (Los Angeles)', timezone: 'PST', currency: 'USD' },
  { id: 'japan', name: 'Japan (Tokyo)', timezone: 'JST', currency: 'JPY' },
  { id: 'eu', name: 'EU (Berlin)', timezone: 'CET', currency: 'EUR' },
  { id: 'australia', name: 'Australia (Sydney)', timezone: 'AEDT', currency: 'AUD' }
]

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    warehouse: '',
    rememberMe: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<LoginError[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)

  const validateForm = (): boolean => {
    const newErrors: LoginError[] = []

    if (!formData.email) {
      newErrors.push({ message: 'Email is required', field: 'email' })
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.push({ message: 'Please enter a valid email address', field: 'email' })
    }

    if (!formData.password) {
      newErrors.push({ message: 'Password is required', field: 'password' })
    } else if (formData.password.length < 8) {
      newErrors.push({ message: 'Password must be at least 8 characters', field: 'password' })
    }

    if (!formData.warehouse) {
      newErrors.push({ message: 'Please select your warehouse location', field: 'warehouse' })
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    if (!validateForm()) return

    setIsLoading(true)
    setAttemptCount(prev => prev + 1)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          warehouse: formData.warehouse,
          rememberMe: formData.rememberMe
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Store authentication data
        if (formData.rememberMe) {
          localStorage.setItem('rhySupplierToken', data.token)
          localStorage.setItem('rhySupplierUser', JSON.stringify(data.user))
        } else {
          sessionStorage.setItem('rhySupplierToken', data.token)
          sessionStorage.setItem('rhySupplierUser', JSON.stringify(data.user))
        }
        
        // Redirect based on user role and warehouse
        const redirectUrl = data.user.role === 'admin' 
          ? '/portal/dashboard' 
          : `/supplier/${formData.warehouse}/dashboard`
        
        router.push(redirectUrl)
      } else {
        setErrors([{ 
          message: data.error || 'Invalid credentials. Please check your email and password.',
          code: data.code 
        }])
      }
    } catch (err) {
      setErrors([{ 
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        code: 'NETWORK_ERROR'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field-specific errors when user starts typing
    setErrors(prev => prev.filter(error => error.field !== field))
  }

  const getFieldError = (field: keyof LoginFormData) => {
    return errors.find(error => error.field === field)?.message
  }

  const hasGeneralError = errors.some(error => !error.field)

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Card */}
        <div className="bg-white rounded-t-2xl border-2 border-[#E6F4FF] border-b-0 overflow-hidden">
          <div 
            style={{
              background: 'linear-gradient(to right, #006FEE, #0050B3)',
              padding: '32px 24px',
              textAlign: 'center'
            }}
          >
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <ShieldCheck size={40} color="white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              RHY Supplier Portal
            </h1>
            <p className="text-white/90 text-sm">
              FlexVolt Battery Management System
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-b-2xl border-2 border-[#E6F4FF] border-t-0 p-8">
          {/* General Error Alert */}
          {hasGeneralError && (
            <div className="mb-6 p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-[#EF4444] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[#EF4444] font-medium text-sm">Authentication Failed</p>
                <p className="text-[#DC2626] text-sm mt-1">
                  {errors.find(e => !e.field)?.message}
                </p>
                {attemptCount >= 3 && (
                  <p className="text-[#B91C1C] text-xs mt-2">
                    Multiple failed attempts detected. Please wait 5 minutes before retrying.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#374151] mb-2">
                Email Address
                <span className="text-[#EF4444] ml-1">*</span>
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
                error={!!getFieldError('email')}
                className={cn(
                  "h-12 text-base",
                  getFieldError('email') && "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20"
                )}
                aria-describedby={getFieldError('email') ? "email-error" : undefined}
                aria-invalid={!!getFieldError('email')}
              />
              {getFieldError('email') && (
                <p id="email-error" className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
                  <AlertCircle size={16} />
                  {getFieldError('email')}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#374151] mb-2">
                Password
                <span className="text-[#EF4444] ml-1">*</span>
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  error={!!getFieldError('password')}
                  className={cn(
                    "h-12 text-base pr-12",
                    getFieldError('password') && "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20"
                  )}
                  aria-describedby={getFieldError('password') ? "password-error" : undefined}
                  aria-invalid={!!getFieldError('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#6B7280] hover:text-[#374151] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {getFieldError('password') && (
                <p id="password-error" className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
                  <AlertCircle size={16} />
                  {getFieldError('password')}
                </p>
              )}
            </div>

            {/* Warehouse Selection */}
            <div>
              <label htmlFor="warehouse" className="block text-sm font-semibold text-[#374151] mb-2">
                Warehouse Location
                <span className="text-[#EF4444] ml-1">*</span>
              </label>
              <select
                id="warehouse"
                value={formData.warehouse}
                onChange={(e) => handleInputChange('warehouse', e.target.value)}
                className={cn(
                  "w-full h-12 px-4 text-base bg-[#F9FAFB] border-2 border-[#E6F4FF] rounded-lg",
                  "focus:outline-none focus:border-[#006FEE] focus:bg-white focus:ring-2 focus:ring-[#006FEE]/20",
                  "transition-all duration-300 ease-in-out",
                  getFieldError('warehouse') && "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20"
                )}
                aria-describedby={getFieldError('warehouse') ? "warehouse-error" : undefined}
                aria-invalid={!!getFieldError('warehouse')}
              >
                <option value="">Select your warehouse location</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.currency})
                  </option>
                ))}
              </select>
              {getFieldError('warehouse') && (
                <p id="warehouse-error" className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
                  <AlertCircle size={16} />
                  {getFieldError('warehouse')}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  className="w-4 h-4 text-[#006FEE] border-2 border-[#E5E7EB] rounded focus:ring-[#006FEE]/20"
                />
                <span className="text-sm text-[#374151]">Keep me signed in</span>
              </label>
              <Link 
                href="/auth/forgot-password"
                className="text-sm text-[#006FEE] hover:text-[#0050B3] font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full h-12 text-base font-semibold",
                "bg-gradient-to-r from-[#006FEE] to-[#0050B3]",
                "hover:shadow-lg hover:-translate-y-1",
                "transition-all duration-300 ease-in-out"
              )}
              loading={isLoading}
              loadingText="Authenticating..."
            >
              {!isLoading && <ArrowRight size={20} className="mr-2" />}
              Sign In to Portal
            </Button>
          </form>

          {/* Additional Links */}
          <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
            <div className="text-center space-y-3">
              <p className="text-sm text-[#6B7280]">
                Don't have a supplier account?
              </p>
              <Link 
                href="/auth/register"
                className="inline-flex items-center gap-2 text-[#006FEE] hover:text-[#0050B3] font-medium text-sm transition-colors"
              >
                <Building2 size={16} />
                Apply for Supplier Access
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-[#6B7280]">
          <p>© 2025 RHY Supplier Portal. All rights reserved.</p>
          <p className="mt-1">
            Secure authentication powered by enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  )
}