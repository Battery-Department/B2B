'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle, 
  Shield, Clock, Key, RefreshCw, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ResetFormData {
  email: string
  resetCode?: string
  newPassword?: string
  confirmPassword?: string
}

interface ResetError {
  message: string
  field?: keyof ResetFormData
  code?: string
}

type ResetStep = 'request' | 'verify' | 'reset' | 'success'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<ResetStep>('request')
  const [formData, setFormData] = useState<ResetFormData>({
    email: '',
    resetCode: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<ResetError[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [attemptCount, setAttemptCount] = useState(0)

  React.useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const validateForm = (): boolean => {
    const newErrors: ResetError[] = []

    switch (currentStep) {
      case 'request':
        if (!formData.email.trim()) {
          newErrors.push({ message: 'Email is required', field: 'email' })
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.push({ message: 'Please enter a valid email address', field: 'email' })
        }
        break

      case 'verify':
        if (!formData.resetCode?.trim()) {
          newErrors.push({ message: 'Reset code is required', field: 'resetCode' })
        } else if (formData.resetCode.length !== 6) {
          newErrors.push({ message: 'Reset code must be 6 digits', field: 'resetCode' })
        }
        break

      case 'reset':
        if (!formData.newPassword) {
          newErrors.push({ message: 'New password is required', field: 'newPassword' })
        } else if (formData.newPassword.length < 12) {
          newErrors.push({ message: 'Password must be at least 12 characters', field: 'newPassword' })
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(formData.newPassword)) {
          newErrors.push({ 
            message: 'Password must contain uppercase, lowercase, number, and special character', 
            field: 'newPassword' 
          })
        }
        if (formData.newPassword !== formData.confirmPassword) {
          newErrors.push({ message: 'Passwords do not match', field: 'confirmPassword' })
        }
        break
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleRequestReset = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    setAttemptCount(prev => prev + 1)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })

      const data = await response.json()

      if (response.ok) {
        setCurrentStep('verify')
        setCountdown(300) // 5 minutes countdown
      } else {
        setErrors([{ 
          message: data.error || 'Failed to send reset code. Please try again.',
          code: data.code 
        }])
      }
    } catch (err) {
      setErrors([{ 
        message: 'Unable to connect to the server. Please check your internet connection.',
        code: 'NETWORK_ERROR'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email,
          resetCode: formData.resetCode 
        })
      })

      const data = await response.json()

      if (response.ok) {
        setCurrentStep('reset')
        setCountdown(0)
      } else {
        setErrors([{ 
          message: data.error || 'Invalid reset code. Please check and try again.',
          field: 'resetCode',
          code: data.code 
        }])
      }
    } catch (err) {
      setErrors([{ 
        message: 'Unable to verify code. Please try again.',
        code: 'NETWORK_ERROR'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          resetCode: formData.resetCode,
          newPassword: formData.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setCurrentStep('success')
      } else {
        setErrors([{ 
          message: data.error || 'Failed to reset password. Please try again.',
          code: data.code 
        }])
      }
    } catch (err) {
      setErrors([{ 
        message: 'Unable to reset password. Please try again.',
        code: 'NETWORK_ERROR'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    setErrors([])

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })

      if (response.ok) {
        setCountdown(300) // Reset 5 minute countdown
        setErrors([])
      } else {
        const data = await response.json()
        setErrors([{ 
          message: data.error || 'Failed to resend code. Please try again.',
          code: data.code 
        }])
      }
    } catch (err) {
      setErrors([{ 
        message: 'Unable to resend code. Please try again.',
        code: 'NETWORK_ERROR'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof ResetFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => prev.filter(error => error.field !== field))
  }

  const getFieldError = (field: keyof ResetFormData) => {
    return errors.find(error => error.field === field)?.message
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderRequestStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#E6F4FF] rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail size={32} className="text-[#006FEE]" />
        </div>
        <h2 className="text-2xl font-bold text-[#111827] mb-2">
          Reset Your Password
        </h2>
        <p className="text-[#6B7280]">
          Enter your email address and we'll send you a secure reset code
        </p>
      </div>

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
          placeholder="Enter your registered email address"
          error={!!getFieldError('email')}
          className="h-12 text-base"
          icon={<Mail size={20} />}
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

      <Button
        onClick={handleRequestReset}
        disabled={isLoading}
        loading={isLoading}
        loadingText="Sending reset code..."
        className="w-full h-12 text-base bg-gradient-to-r from-[#006FEE] to-[#0050B3]"
      >
        <Mail size={20} className="mr-2" />
        Send Reset Code
      </Button>

      {attemptCount >= 3 && (
        <div className="p-4 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-[#F59E0B] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[#92400E] font-medium text-sm">Multiple Attempts Detected</p>
              <p className="text-[#78350F] text-sm mt-1">
                For security reasons, please wait 5 minutes before requesting another reset code.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderVerifyStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#E6F4FF] rounded-full flex items-center justify-center mx-auto mb-4">
          <Key size={32} className="text-[#006FEE]" />
        </div>
        <h2 className="text-2xl font-bold text-[#111827] mb-2">
          Enter Reset Code
        </h2>
        <p className="text-[#6B7280]">
          We've sent a 6-digit code to{' '}
          <span className="font-medium text-[#374151]">{formData.email}</span>
        </p>
      </div>

      <div>
        <label htmlFor="resetCode" className="block text-sm font-semibold text-[#374151] mb-2">
          Reset Code
          <span className="text-[#EF4444] ml-1">*</span>
        </label>
        <Input
          id="resetCode"
          type="text"
          value={formData.resetCode || ''}
          onChange={(e) => handleInputChange('resetCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter 6-digit code"
          error={!!getFieldError('resetCode')}
          className="h-12 text-base text-center text-2xl font-mono tracking-widest"
          maxLength={6}
          aria-describedby={getFieldError('resetCode') ? "reset-code-error" : undefined}
          aria-invalid={!!getFieldError('resetCode')}
        />
        {getFieldError('resetCode') && (
          <p id="reset-code-error" className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
            <AlertCircle size={16} />
            {getFieldError('resetCode')}
          </p>
        )}
      </div>

      {countdown > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-[#6B7280]">
          <Clock size={16} />
          Code expires in {formatTime(countdown)}
        </div>
      )}

      <Button
        onClick={handleVerifyCode}
        disabled={isLoading || !formData.resetCode || formData.resetCode.length !== 6}
        loading={isLoading}
        loadingText="Verifying code..."
        className="w-full h-12 text-base bg-gradient-to-r from-[#006FEE] to-[#0050B3]"
      >
        <Key size={20} className="mr-2" />
        Verify Code
      </Button>

      <div className="text-center">
        <p className="text-sm text-[#6B7280] mb-2">
          Didn't receive the code?
        </p>
        <Button
          variant="outline"
          onClick={handleResendCode}
          disabled={isLoading || countdown > 0}
          className="h-10"
        >
          <RefreshCw size={16} className="mr-2" />
          Resend Code
        </Button>
      </div>
    </div>
  )

  const renderResetStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#E6F4FF] rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield size={32} className="text-[#006FEE]" />
        </div>
        <h2 className="text-2xl font-bold text-[#111827] mb-2">
          Create New Password
        </h2>
        <p className="text-[#6B7280]">
          Choose a strong password to secure your account
        </p>
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-sm font-semibold text-[#374151] mb-2">
          New Password
          <span className="text-[#EF4444] ml-1">*</span>
        </label>
        <Input
          id="newPassword"
          type="password"
          value={formData.newPassword || ''}
          onChange={(e) => handleInputChange('newPassword', e.target.value)}
          placeholder="Create a secure password"
          error={!!getFieldError('newPassword')}
          className="h-12 text-base"
          aria-describedby={getFieldError('newPassword') ? "new-password-error" : undefined}
          aria-invalid={!!getFieldError('newPassword')}
        />
        <div className="mt-2 text-xs text-[#6B7280]">
          Password must be at least 12 characters with uppercase, lowercase, number, and special character
        </div>
        {getFieldError('newPassword') && (
          <p id="new-password-error" className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
            <AlertCircle size={16} />
            {getFieldError('newPassword')}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#374151] mb-2">
          Confirm New Password
          <span className="text-[#EF4444] ml-1">*</span>
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword || ''}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          placeholder="Confirm your new password"
          error={!!getFieldError('confirmPassword')}
          className="h-12 text-base"
          aria-describedby={getFieldError('confirmPassword') ? "confirm-password-error" : undefined}
          aria-invalid={!!getFieldError('confirmPassword')}
        />
        {getFieldError('confirmPassword') && (
          <p id="confirm-password-error" className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
            <AlertCircle size={16} />
            {getFieldError('confirmPassword')}
          </p>
        )}
      </div>

      <Button
        onClick={handleResetPassword}
        disabled={isLoading || !formData.newPassword || !formData.confirmPassword}
        loading={isLoading}
        loadingText="Resetting password..."
        className="w-full h-12 text-base bg-gradient-to-r from-[#006FEE] to-[#0050B3]"
      >
        <Shield size={20} className="mr-2" />
        Reset Password
      </Button>
    </div>
  )

  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-[#D1FAE5] rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={40} className="text-[#10B981]" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-[#111827] mb-2">
          Password Reset Successful
        </h2>
        <p className="text-[#6B7280]">
          Your password has been successfully reset. You can now sign in with your new password.
        </p>
      </div>

      <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle size={20} className="text-[#10B981] mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <p className="text-[#059669] font-medium text-sm">Security Notice</p>
            <p className="text-[#047857] text-sm mt-1">
              For your security, you've been signed out of all devices. Please sign in again with your new password.
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={() => router.push('/auth/login')}
        className="w-full h-12 text-base bg-gradient-to-r from-[#006FEE] to-[#0050B3]"
      >
        <ArrowRight size={20} className="mr-2" />
        Sign In Now
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border-2 border-[#E6F4FF] p-8">
          {/* General Error Alert */}
          {errors.some(e => !e.field) && (
            <div className="mb-6 p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-[#EF4444] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[#EF4444] font-medium text-sm">Reset Failed</p>
                  <p className="text-[#DC2626] text-sm mt-1">
                    {errors.find(e => !e.field)?.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step Content */}
          {currentStep === 'request' && renderRequestStep()}
          {currentStep === 'verify' && renderVerifyStep()}
          {currentStep === 'reset' && renderResetStep()}
          {currentStep === 'success' && renderSuccessStep()}

          {/* Back to Login Link */}
          {currentStep !== 'success' && (
            <div className="mt-8 pt-6 border-t border-[#E5E7EB] text-center">
              <Link 
                href="/auth/login"
                className="inline-flex items-center gap-2 text-sm text-[#006FEE] hover:text-[#0050B3] font-medium transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-[#6B7280]">
          <p>© 2025 RHY Supplier Portal. All rights reserved.</p>
          <p className="mt-1">
            Secure password reset powered by enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  )
}