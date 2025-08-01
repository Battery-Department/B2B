'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Eye, EyeOff, Building2, Loader2, ArrowRight, ArrowLeft, 
  CheckCircle, AlertCircle, User, Mail, Lock, MapPin, 
  Phone, FileText, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface RegistrationFormData {
  // Step 1: Company Information
  companyName: string
  companyType: 'direct' | 'distributor' | 'retailer' | 'fleet' | 'service'
  taxId: string
  website: string
  
  // Step 2: Contact Information
  firstName: string
  lastName: string
  jobTitle: string
  email: string
  phone: string
  
  // Step 3: Location & Warehouse
  address: string
  city: string
  state: string
  postalCode: string
  country: string
  preferredWarehouse: string
  
  // Step 4: Security
  password: string
  confirmPassword: string
  acceptTerms: boolean
  subscribeNewsletter: boolean
}

interface RegistrationError {
  message: string
  field?: keyof RegistrationFormData
  code?: string
}

const companyTypes = [
  { value: 'direct', label: 'Direct Manufacturer', description: 'Full access - Manufacture FlexVolt batteries' },
  { value: 'distributor', label: 'Regional Distributor', description: 'Limited access - Regional distribution partners' },
  { value: 'retailer', label: 'Retail Partner', description: 'View-only access - End-point sales' },
  { value: 'fleet', label: 'Fleet Manager', description: 'Analytics access - Bulk purchase coordination' },
  { value: 'service', label: 'Service Partner', description: 'Support tools access - Warranty and repair' }
]

const warehouses = [
  { id: 'us-west', name: 'US West Coast (Los Angeles)', timezone: 'PST', currency: 'USD' },
  { id: 'japan', name: 'Japan (Tokyo)', timezone: 'JST', currency: 'JPY' },
  { id: 'eu', name: 'EU (Berlin)', timezone: 'CET', currency: 'EUR' },
  { id: 'australia', name: 'Australia (Sydney)', timezone: 'AEDT', currency: 'AUD' }
]

const countries = [
  'United States', 'Canada', 'Japan', 'Germany', 'France', 'United Kingdom', 
  'Australia', 'New Zealand', 'Singapore', 'Netherlands', 'Belgium', 'Switzerland'
]

export default function RegisterPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<RegistrationFormData>({
    companyName: '',
    companyType: 'distributor',
    taxId: '',
    website: '',
    firstName: '',
    lastName: '',
    jobTitle: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    preferredWarehouse: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    subscribeNewsletter: true
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<RegistrationError[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const steps = [
    { number: 1, title: 'Company Info', icon: Building2 },
    { number: 2, title: 'Contact Details', icon: User },
    { number: 3, title: 'Location', icon: MapPin },
    { number: 4, title: 'Security', icon: Shield }
  ]

  const validateStep = (step: number): boolean => {
    const newErrors: RegistrationError[] = []

    switch (step) {
      case 1:
        if (!formData.companyName.trim()) {
          newErrors.push({ message: 'Company name is required', field: 'companyName' })
        }
        if (!formData.companyType) {
          newErrors.push({ message: 'Please select a company type', field: 'companyType' })
        }
        if (!formData.taxId.trim()) {
          newErrors.push({ message: 'Tax ID/Registration number is required', field: 'taxId' })
        }
        break

      case 2:
        if (!formData.firstName.trim()) {
          newErrors.push({ message: 'First name is required', field: 'firstName' })
        }
        if (!formData.lastName.trim()) {
          newErrors.push({ message: 'Last name is required', field: 'lastName' })
        }
        if (!formData.email.trim()) {
          newErrors.push({ message: 'Email is required', field: 'email' })
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.push({ message: 'Please enter a valid email address', field: 'email' })
        }
        if (!formData.jobTitle.trim()) {
          newErrors.push({ message: 'Job title is required', field: 'jobTitle' })
        }
        if (!formData.phone.trim()) {
          newErrors.push({ message: 'Phone number is required', field: 'phone' })
        }
        break

      case 3:
        if (!formData.address.trim()) {
          newErrors.push({ message: 'Address is required', field: 'address' })
        }
        if (!formData.city.trim()) {
          newErrors.push({ message: 'City is required', field: 'city' })
        }
        if (!formData.country) {
          newErrors.push({ message: 'Please select a country', field: 'country' })
        }
        if (!formData.preferredWarehouse) {
          newErrors.push({ message: 'Please select a preferred warehouse', field: 'preferredWarehouse' })
        }
        break

      case 4:
        if (!formData.password) {
          newErrors.push({ message: 'Password is required', field: 'password' })
        } else if (formData.password.length < 12) {
          newErrors.push({ message: 'Password must be at least 12 characters', field: 'password' })
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(formData.password)) {
          newErrors.push({ message: 'Password must contain uppercase, lowercase, number, and special character', field: 'password' })
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.push({ message: 'Passwords do not match', field: 'confirmPassword' })
        }
        if (!formData.acceptTerms) {
          newErrors.push({ message: 'You must accept the terms and conditions', field: 'acceptTerms' })
        }
        break
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => [...prev.filter(s => s !== currentStep), currentStep])
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setErrors([])
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        // Registration successful - redirect to pending approval page
        router.push('/auth/registration-pending')
      } else {
        setErrors([{ 
          message: data.error || 'Registration failed. Please try again.',
          code: data.code 
        }])
      }
    } catch (err) {
      setErrors([{ 
        message: 'Unable to submit registration. Please check your connection and try again.',
        code: 'NETWORK_ERROR'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof RegistrationFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => prev.filter(error => error.field !== field))
  }

  const getFieldError = (field: keyof RegistrationFormData) => {
    return errors.find(error => error.field === field)?.message
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className="flex flex-col items-center">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
              currentStep === step.number 
                ? "bg-[#006FEE] border-[#006FEE] text-white shadow-lg"
                : completedSteps.includes(step.number)
                ? "bg-[#10B981] border-[#10B981] text-white"
                : "bg-white border-[#E5E7EB] text-[#6B7280]"
            )}>
              {completedSteps.includes(step.number) ? (
                <CheckCircle size={20} />
              ) : (
                <step.icon size={20} />
              )}
            </div>
            <span className={cn(
              "text-xs font-medium mt-2 text-center",
              currentStep === step.number 
                ? "text-[#006FEE]"
                : completedSteps.includes(step.number)
                ? "text-[#10B981]"
                : "text-[#6B7280]"
            )}>
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              "flex-1 h-0.5 mx-4 transition-all duration-300",
              completedSteps.includes(step.number) 
                ? "bg-[#10B981]" 
                : "bg-[#E5E7EB]"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-[#374151] mb-2">
          Company Name <span className="text-[#EF4444]">*</span>
        </label>
        <Input
          value={formData.companyName}
          onChange={(e) => handleInputChange('companyName', e.target.value)}
          placeholder="Enter your company name"
          error={!!getFieldError('companyName')}
          className="h-12"
        />
        {getFieldError('companyName') && (
          <p className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
            <AlertCircle size={16} />
            {getFieldError('companyName')}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#374151] mb-3">
          Company Type <span className="text-[#EF4444]">*</span>
        </label>
        <div className="space-y-3">
          {companyTypes.map((type) => (
            <label key={type.value} className="flex items-start gap-3 p-4 border-2 border-[#E5E7EB] rounded-lg cursor-pointer hover:border-[#006FEE] transition-colors">
              <input
                type="radio"
                name="companyType"
                value={type.value}
                checked={formData.companyType === type.value}
                onChange={(e) => handleInputChange('companyType', e.target.value)}
                className="mt-1 w-4 h-4 text-[#006FEE]"
              />
              <div>
                <div className="font-medium text-[#374151]">{type.label}</div>
                <div className="text-sm text-[#6B7280] mt-1">{type.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#374151] mb-2">
          Tax ID / Registration Number <span className="text-[#EF4444]">*</span>
        </label>
        <Input
          value={formData.taxId}
          onChange={(e) => handleInputChange('taxId', e.target.value)}
          placeholder="Enter your tax ID or registration number"
          error={!!getFieldError('taxId')}
          className="h-12"
        />
        {getFieldError('taxId') && (
          <p className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
            <AlertCircle size={16} />
            {getFieldError('taxId')}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#374151] mb-2">
          Company Website
        </label>
        <Input
          value={formData.website}
          onChange={(e) => handleInputChange('website', e.target.value)}
          placeholder="https://www.yourcompany.com"
          className="h-12"
        />
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-[#374151] mb-2">
            First Name <span className="text-[#EF4444]">*</span>
          </label>
          <Input
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            placeholder="Enter your first name"
            error={!!getFieldError('firstName')}
            className="h-12"
          />
          {getFieldError('firstName') && (
            <p className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
              <AlertCircle size={16} />
              {getFieldError('firstName')}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#374151] mb-2">
            Last Name <span className="text-[#EF4444]">*</span>
          </label>
          <Input
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            placeholder="Enter your last name"
            error={!!getFieldError('lastName')}
            className="h-12"
          />
          {getFieldError('lastName') && (
            <p className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
              <AlertCircle size={16} />
              {getFieldError('lastName')}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#374151] mb-2">
          Job Title <span className="text-[#EF4444]">*</span>
        </label>
        <Input
          value={formData.jobTitle}
          onChange={(e) => handleInputChange('jobTitle', e.target.value)}
          placeholder="e.g., Procurement Manager, Operations Director"
          error={!!getFieldError('jobTitle')}
          className="h-12"
        />
        {getFieldError('jobTitle') && (
          <p className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
            <AlertCircle size={16} />
            {getFieldError('jobTitle')}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#374151] mb-2">
          Business Email <span className="text-[#EF4444]">*</span>
        </label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="Enter your business email"
          error={!!getFieldError('email')}
          className="h-12"
          icon={<Mail size={20} />}
        />
        {getFieldError('email') && (
          <p className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
            <AlertCircle size={16} />
            {getFieldError('email')}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#374151] mb-2">
          Phone Number <span className="text-[#EF4444]">*</span>
        </label>
        <Input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder="Enter your phone number"
          error={!!getFieldError('phone')}
          className="h-12"
          icon={<Phone size={20} />}
        />
        {getFieldError('phone') && (
          <p className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
            <AlertCircle size={16} />
            {getFieldError('phone')}
          </p>
        )}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-[#374151] mb-2">
          Business Address <span className="text-[#EF4444]">*</span>
        </label>
        <Input
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          placeholder="Enter your business address"
          error={!!getFieldError('address')}
          className="h-12"
        />
        {getFieldError('address') && (
          <p className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
            <AlertCircle size={16} />
            {getFieldError('address')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-[#374151] mb-2">
            City <span className="text-[#EF4444]">*</span>
          </label>
          <Input
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder="Enter city"
            error={!!getFieldError('city')}
            className="h-12"
          />
          {getFieldError('city') && (
            <p className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
              <AlertCircle size={16} />
              {getFieldError('city')}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#374151] mb-2">
            State/Province
          </label>
          <Input
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            placeholder="Enter state or province"
            className="h-12"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-[#374151] mb-2">
            Postal Code
          </label>
          <Input
            value={formData.postalCode}
            onChange={(e) => handleInputChange('postalCode', e.target.value)}
            placeholder="Enter postal code"
            className="h-12"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#374151] mb-2">
            Country <span className="text-[#EF4444]">*</span>
          </label>
          <select
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className={cn(
              "w-full h-12 px-4 bg-[#F9FAFB] border-2 border-[#E6F4FF] rounded-lg",
              "focus:outline-none focus:border-[#006FEE] focus:bg-white focus:ring-2 focus:ring-[#006FEE]/20",
              "transition-all duration-300 ease-in-out",
              getFieldError('country') && "border-[#EF4444]"
            )}
          >
            <option value="">Select your country</option>
            {countries.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
          {getFieldError('country') && (
            <p className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
              <AlertCircle size={16} />
              {getFieldError('country')}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#374151] mb-2">
          Preferred Warehouse <span className="text-[#EF4444]">*</span>
        </label>
        <select
          value={formData.preferredWarehouse}
          onChange={(e) => handleInputChange('preferredWarehouse', e.target.value)}
          className={cn(
            "w-full h-12 px-4 bg-[#F9FAFB] border-2 border-[#E6F4FF] rounded-lg",
            "focus:outline-none focus:border-[#006FEE] focus:bg-white focus:ring-2 focus:ring-[#006FEE]/20",
            "transition-all duration-300 ease-in-out",
            getFieldError('preferredWarehouse') && "border-[#EF4444]"
          )}
        >
          <option value="">Select preferred warehouse</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name} ({warehouse.currency})
            </option>
          ))}
        </select>
        {getFieldError('preferredWarehouse') && (
          <p className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
            <AlertCircle size={16} />
            {getFieldError('preferredWarehouse')}
          </p>
        )}
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-[#374151] mb-2">
          Password <span className="text-[#EF4444]">*</span>
        </label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Create a secure password"
            error={!!getFieldError('password')}
            className="h-12 pr-12"
            icon={<Lock size={20} />}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#6B7280] hover:text-[#374151] transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <div className="mt-2 text-xs text-[#6B7280]">
          Password must be at least 12 characters with uppercase, lowercase, number, and special character
        </div>
        {getFieldError('password') && (
          <p className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
            <AlertCircle size={16} />
            {getFieldError('password')}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#374151] mb-2">
          Confirm Password <span className="text-[#EF4444]">*</span>
        </label>
        <div className="relative">
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            placeholder="Confirm your password"
            error={!!getFieldError('confirmPassword')}
            className="h-12 pr-12"
            icon={<Lock size={20} />}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#6B7280] hover:text-[#374151] transition-colors"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {getFieldError('confirmPassword') && (
          <p className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
            <AlertCircle size={16} />
            {getFieldError('confirmPassword')}
          </p>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.acceptTerms}
            onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
            className={cn(
              "mt-1 w-4 h-4 text-[#006FEE] border-2 rounded",
              getFieldError('acceptTerms') ? "border-[#EF4444]" : "border-[#E5E7EB]"
            )}
          />
          <span className="text-sm text-[#374151]">
            I accept the{' '}
            <Link href="/terms" className="text-[#006FEE] hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-[#006FEE] hover:underline">
              Privacy Policy
            </Link>
            <span className="text-[#EF4444] ml-1">*</span>
          </span>
        </label>
        {getFieldError('acceptTerms') && (
          <p className="text-sm text-[#EF4444] flex items-center gap-2">
            <AlertCircle size={16} />
            {getFieldError('acceptTerms')}
          </p>
        )}

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.subscribeNewsletter}
            onChange={(e) => handleInputChange('subscribeNewsletter', e.target.checked)}
            className="mt-1 w-4 h-4 text-[#006FEE] border-2 border-[#E5E7EB] rounded"
          />
          <span className="text-sm text-[#374151]">
            Subscribe to newsletters and product updates
          </span>
        </label>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-[#006FEE] to-[#0050B3] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} color="white" />
          </div>
          <h1 className="text-3xl font-bold text-[#111827] mb-2">
            RHY Supplier Registration
          </h1>
          <p className="text-[#6B7280]">
            Join the FlexVolt battery supplier network
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border-2 border-[#E6F4FF] p-8">
          {renderStepIndicator()}

          {/* General Errors */}
          {errors.some(e => !e.field) && (
            <div className="mb-6 p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-[#EF4444] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[#EF4444] font-medium text-sm">Registration Error</p>
                  <p className="text-[#DC2626] text-sm mt-1">
                    {errors.find(e => !e.field)?.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="mb-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="h-12 px-6"
            >
              <ArrowLeft size={20} className="mr-2" />
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="h-12 px-6 bg-gradient-to-r from-[#006FEE] to-[#0050B3]"
              >
                Next
                <ArrowRight size={20} className="ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                loading={isLoading}
                loadingText="Submitting..."
                className="h-12 px-6 bg-gradient-to-r from-[#006FEE] to-[#0050B3]"
              >
                Submit Registration
                <ArrowRight size={20} className="ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#6B7280]">
            Already have an account?{' '}
            <Link 
              href="/auth/login"
              className="text-[#006FEE] hover:text-[#0050B3] font-medium"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}