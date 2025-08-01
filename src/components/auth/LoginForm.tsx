'use client'

import React, { useState } from 'react'
import { Eye, EyeOff, ArrowRight, AlertCircle, Building2 } from 'lucide-react'
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

interface Warehouse {
  id: string
  name: string
  timezone: string
  currency: string
}

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>
  isLoading?: boolean
  errors?: LoginError[]
  showWarehouseSelection?: boolean
  warehouses?: Warehouse[]
  className?: string
  size?: 'default' | 'compact'
}

const defaultWarehouses: Warehouse[] = [
  { id: 'us-west', name: 'US West Coast (Los Angeles)', timezone: 'PST', currency: 'USD' },
  { id: 'japan', name: 'Japan (Tokyo)', timezone: 'JST', currency: 'JPY' },
  { id: 'eu', name: 'EU (Berlin)', timezone: 'CET', currency: 'EUR' },
  { id: 'australia', name: 'Australia (Sydney)', timezone: 'AEDT', currency: 'AUD' }
]

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading = false,
  errors = [],
  showWarehouseSelection = true,
  warehouses = defaultWarehouses,
  className,
  size = 'default'
}) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    warehouse: '',
    rememberMe: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [localErrors, setLocalErrors] = useState<LoginError[]>([])

  const allErrors = [...errors, ...localErrors]

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

    if (showWarehouseSelection && !formData.warehouse) {
      newErrors.push({ message: 'Please select your warehouse location', field: 'warehouse' })
    }

    setLocalErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalErrors([])

    if (!validateForm()) return

    try {
      await onSubmit(formData)
    } catch (error) {
      // onSubmit should handle errors, but this is a fallback
      setLocalErrors([{ 
        message: 'An unexpected error occurred. Please try again.',
        code: 'UNKNOWN_ERROR'
      }])
    }
  }

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field-specific errors when user starts typing
    setLocalErrors(prev => prev.filter(error => error.field !== field))
  }

  const getFieldError = (field: keyof LoginFormData) => {
    return allErrors.find(error => error.field === field)?.message
  }

  const hasGeneralError = allErrors.some(error => !error.field)
  const inputHeight = size === 'compact' ? 'h-10' : 'h-12'
  const spacing = size === 'compact' ? 'space-y-4' : 'space-y-6'

  return (
    <div className={cn("w-full", className)}>
      {/* General Error Alert */}
      {hasGeneralError && (
        <div className="mb-6 p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-[#EF4444] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[#EF4444] font-medium text-sm">Authentication Failed</p>
            <p className="text-[#DC2626] text-sm mt-1">
              {allErrors.find(e => !e.field)?.message}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={spacing}>
        {/* Email Field */}
        <div>
          <label htmlFor="login-email" className="block text-sm font-semibold text-[#374151] mb-2">
            Email Address
            <span className="text-[#EF4444] ml-1">*</span>
          </label>
          <Input
            id="login-email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email address"
            error={!!getFieldError('email')}
            className={cn(
              inputHeight,
              "text-base",
              getFieldError('email') && "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20"
            )}
            aria-describedby={getFieldError('email') ? "login-email-error" : undefined}
            aria-invalid={!!getFieldError('email')}
            disabled={isLoading}
          />
          {getFieldError('email') && (
            <p id="login-email-error" className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
              <AlertCircle size={16} />
              {getFieldError('email')}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="login-password" className="block text-sm font-semibold text-[#374151] mb-2">
            Password
            <span className="text-[#EF4444] ml-1">*</span>
          </label>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Enter your password"
              error={!!getFieldError('password')}
              className={cn(
                inputHeight,
                "text-base pr-12",
                getFieldError('password') && "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20"
              )}
              aria-describedby={getFieldError('password') ? "login-password-error" : undefined}
              aria-invalid={!!getFieldError('password')}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#6B7280] hover:text-[#374151] transition-colors disabled:opacity-50"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {getFieldError('password') && (
            <p id="login-password-error" className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
              <AlertCircle size={16} />
              {getFieldError('password')}
            </p>
          )}
        </div>

        {/* Warehouse Selection */}
        {showWarehouseSelection && (
          <div>
            <label htmlFor="login-warehouse" className="block text-sm font-semibold text-[#374151] mb-2">
              Warehouse Location
              <span className="text-[#EF4444] ml-1">*</span>
            </label>
            <select
              id="login-warehouse"
              value={formData.warehouse}
              onChange={(e) => handleInputChange('warehouse', e.target.value)}
              className={cn(
                `w-full ${inputHeight} px-4 text-base bg-[#F9FAFB] border-2 border-[#E6F4FF] rounded-lg`,
                "focus:outline-none focus:border-[#006FEE] focus:bg-white focus:ring-2 focus:ring-[#006FEE]/20",
                "transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed",
                getFieldError('warehouse') && "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20"
              )}
              aria-describedby={getFieldError('warehouse') ? "login-warehouse-error" : undefined}
              aria-invalid={!!getFieldError('warehouse')}
              disabled={isLoading}
            >
              <option value="">Select your warehouse location</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} ({warehouse.currency})
                </option>
              ))}
            </select>
            {getFieldError('warehouse') && (
              <p id="login-warehouse-error" className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
                <AlertCircle size={16} />
                {getFieldError('warehouse')}
              </p>
            )}
          </div>
        )}

        {/* Remember Me Checkbox */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
              className="w-4 h-4 text-[#006FEE] border-2 border-[#E5E7EB] rounded focus:ring-[#006FEE]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            />
            <span className="text-sm text-[#374151]">Keep me signed in</span>
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className={cn(
            `w-full ${inputHeight} text-base font-semibold`,
            "bg-gradient-to-r from-[#006FEE] to-[#0050B3]",
            "hover:shadow-lg hover:-translate-y-1",
            "transition-all duration-300 ease-in-out"
          )}
          loading={isLoading}
          loadingText="Signing in..."
        >
          {!isLoading && <ArrowRight size={20} className="mr-2" />}
          Sign In
        </Button>
      </form>
    </div>
  )
}

export default LoginForm