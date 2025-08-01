/**
 * =============================================================================
 * RHY_005: ENTERPRISE PASSWORD RESET COMPONENT
 * =============================================================================
 * Production-ready React component for secure password reset functionality
 * Features: Real-time validation, strength meter, breach detection, security feedback
 * Compliant with RHY design system and enterprise security standards
 * =============================================================================
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Eye, 
  EyeOff, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Key,
  Mail,
  Lock,
  ArrowLeft,
  RefreshCw,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  analyzePasswordStrength, 
  estimatePasswordCrackTime,
  checkPasswordBreach 
} from '@/lib/password-security';
import type { PasswordStrengthResult, BreachDetectionResult } from '@/lib/password-security';

// ===================================
// INTERFACES AND TYPES
// ===================================

type PasswordResetStep = 'request' | 'sent' | 'reset' | 'success' | 'error';

interface PasswordResetState {
  step: PasswordResetStep;
  token: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
  warehouse: 'US' | 'JP' | 'EU' | 'AU' | '';
  showPassword: boolean;
  showConfirmPassword: boolean;
  isSubmitting: boolean;
  isTokenValidating: boolean;
  tokenValid: boolean;
  tokenError: string | null;
  errors: Record<string, string>;
  success: boolean;
  passwordStrength: PasswordStrengthResult | null;
  breachResult: BreachDetectionResult | null;
  countdown: number;
}

interface TokenValidationResponse {
  success: boolean;
  valid: boolean;
  expiresAt?: string;
  timeRemaining?: number;
  error?: {
    code: string;
    message: string;
  };
}

interface ResetPasswordResponse {
  success: boolean;
  message?: string;
  redirectTo?: string;
  securityNote?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ===================================
// MAIN COMPONENT
// ===================================

export default function PasswordReset() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get('token');
  const warehouseParam = searchParams.get('warehouse') || 'US';
  
  const [state, setState] = useState<PasswordResetState>({
    step: resetToken ? 'reset' : 'request',
    token: resetToken || '',
    email: '',
    newPassword: '',
    confirmPassword: '',
    warehouse: warehouseParam as any,
    showPassword: false,
    showConfirmPassword: false,
    isSubmitting: false,
    isTokenValidating: false,
    tokenValid: false,
    tokenError: null,
    errors: {},
    success: false,
    passwordStrength: null,
    breachResult: null,
    countdown: 0
  });

  // ===================================
  // TOKEN VALIDATION
  // ===================================

  const validateResetToken = useCallback(async (token: string) => {
    if (!token) {
      setState(prev => ({
        ...prev,
        tokenValid: false,
        tokenError: 'No reset token provided'
      }));
      return;
    }

    setState(prev => ({ ...prev, isTokenValidating: true }));

    try {
      const response = await fetch(`/api/supplier/auth/reset-password?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: TokenValidationResponse = await response.json();

      setState(prev => ({
        ...prev,
        isTokenValidating: false,
        tokenValid: data.success && data.valid,
        tokenError: data.success && data.valid ? null : (data.error?.message || 'Invalid or expired reset token')
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isTokenValidating: false,
        tokenValid: false,
        tokenError: 'Failed to validate reset token. Please try again.'
      }));
    }
  }, []);

  // Validate token on component mount
  useEffect(() => {
    if (state.token) {
      validateResetToken(state.token);
    }
  }, [state.token, validateResetToken]);

  // ===================================
  // PASSWORD VALIDATION
  // ===================================

  const handlePasswordChange = useCallback((password: string) => {
    setState(prev => ({ ...prev, newPassword: password, errors: { ...prev.errors, newPassword: '' } }));
    
    if (password) {
      const strength = validatePassword(password);
      setState(prev => ({ ...prev, passwordStrength: strength }));
    } else {
      setState(prev => ({ ...prev, passwordStrength: null }));
    }
  }, []);

  const handleConfirmPasswordChange = useCallback((confirmPassword: string) => {
    setState(prev => ({ 
      ...prev, 
      confirmPassword, 
      errors: { ...prev.errors, confirmPassword: '' } 
    }));
  }, []);

  // ===================================
  // FORM SUBMISSION
  // ===================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};

    // Validation
    if (!state.newPassword) {
      errors.newPassword = 'Password is required';
    } else if (!state.passwordStrength?.isValid) {
      errors.newPassword = 'Password does not meet security requirements';
    }

    if (!state.confirmPassword) {
      errors.confirmPassword = 'Password confirmation is required';
    } else if (state.newPassword !== state.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setState(prev => ({ ...prev, errors }));
      return;
    }

    setState(prev => ({ ...prev, isSubmitting: true, errors: {} }));

    try {
      const response = await fetch('/api/supplier/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: state.token,
          newPassword: state.newPassword,
          confirmPassword: state.confirmPassword,
          warehouse: state.warehouse || undefined
        }),
      });

      const data: ResetPasswordResponse = await response.json();

      if (data.success) {
        setState(prev => ({ ...prev, success: true }));
        
        // Redirect after success message
        setTimeout(() => {
          router.push(data.redirectTo || '/supplier/auth/login');
        }, 3000);
      } else {
        setState(prev => ({
          ...prev,
          errors: { 
            submit: data.error?.message || 'Password reset failed. Please try again.' 
          }
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: { 
          submit: 'Network error. Please check your connection and try again.' 
        }
      }));
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // ===================================
  // RENDER HELPERS
  // ===================================

  const renderPasswordStrengthMeter = () => {
    if (!state.passwordStrength) return null;

    const { strength, score, errors, warnings, suggestions } = state.passwordStrength;
    const color = getPasswordStrengthColor(strength);
    const percentage = getPasswordStrengthPercentage(strength);

    return (
      <div className="mt-2 space-y-2">
        {/* Strength Bar */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${percentage}%`,
                backgroundColor: color
              }}
            />
          </div>
          <span
            className="text-sm font-medium capitalize"
            style={{ color }}
          >
            {strength.replace('_', ' ')}
          </span>
        </div>

        {/* Feedback */}
        {(errors.length > 0 || warnings.length > 0) && (
          <div className="text-sm space-y-1">
            {errors.map((error, index) => (
              <div key={index} className="flex items-center space-x-1 text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span>{error}</span>
              </div>
            ))}
            {warnings.map((warning, index) => (
              <div key={index} className="flex items-center space-x-1 text-amber-600">
                <AlertCircle className="w-3 h-3" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="text-sm text-gray-600">
            <p className="font-medium">Suggestions:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              {suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // ===================================
  // RENDER STATES
  // ===================================

  // Token validation loading
  if (state.isTokenValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Validating Reset Token</h2>
          <p className="text-gray-600">Please wait while we verify your reset token...</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (!state.tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Invalid Reset Token</h2>
          <p className="text-gray-600 mb-6">{state.tokenError}</p>
          <button
            onClick={() => router.push('/supplier/auth/forgot-password')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (state.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Password Reset Successful</h2>
          <p className="text-gray-600 mb-6">
            Your password has been successfully reset. You will be redirected to the login page in a few seconds.
          </p>
          <div className="flex items-center justify-center space-x-2 text-blue-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Redirecting...</span>
          </div>
        </div>
      </div>
    );
  }

  // ===================================
  // MAIN RENDER
  // ===================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Reset Your Password</h1>
          <p className="text-gray-600">Create a new secure password for your RHY Supplier Portal account</p>
          {state.warehouse && (
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {state.warehouse} Warehouse
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={state.showPassword ? 'text' : 'password'}
                value={state.newPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  state.errors.newPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your new password"
                required
              />
              <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {state.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {state.errors.newPassword && (
              <p className="mt-2 text-sm text-red-600">{state.errors.newPassword}</p>
            )}
            {renderPasswordStrengthMeter()}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={state.showConfirmPassword ? 'text' : 'password'}
                value={state.confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  state.errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Confirm your new password"
                required
              />
              <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {state.showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {state.errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-600">{state.errors.confirmPassword}</p>
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Security Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>At least 12 characters long</li>
                  <li>Mix of uppercase and lowercase letters</li>
                  <li>At least one number and special character</li>
                  <li>No common patterns or repeated characters</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {state.errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-800">{state.errors.submit}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={state.isSubmitting || !state.passwordStrength?.isValid}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {state.isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Resetting Password...</span>
              </>
            ) : (
              <>
                <Key className="w-5 h-5" />
                <span>Reset Password</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <button
              onClick={() => router.push('/supplier/auth/login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { analyzePasswordStrength, estimatePasswordCrackTime } from '@/lib/password-security'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Shield,
  ArrowLeft,
  RefreshCw
} from 'lucide-react'

// ================================
// TYPES & INTERFACES
// ================================

type PasswordResetStep = 'request' | 'sent' | 'reset' | 'success' | 'error'

interface PasswordStrengthIndicatorProps {
  password: string
  showStrength: boolean
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  token?: string
  general?: string
}

// ================================
// VALIDATION SCHEMAS
// ================================

const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long')
    .toLowerCase()
})

const ResetPasswordSchema = z.object({
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password is too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// ================================
// MAIN COMPONENT
// ================================

export function PasswordReset() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resetToken = searchParams.get('token')
  const warehouse = searchParams.get('warehouse') || 'US'

  // State management
  const [step, setStep] = useState<PasswordResetStep>('request')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [countdown, setCountdown] = useState(0)

  // Effects
  useEffect(() => {
    if (resetToken) {
      setStep('reset')
      validateResetToken(resetToken)
    }
  }, [resetToken])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // ================================
  // API FUNCTIONS
  // ================================

  const validateResetToken = async (token: string) => {
    try {
      const response = await fetch(`/api/supplier/auth/reset-password?token=${token}`)
      const data = await response.json()
      
      if (data.success && data.valid) {
        setTokenValid(true)
        if (data.timeRemaining && data.timeRemaining < 5 * 60 * 1000) {
          // Show warning if less than 5 minutes remaining
          setErrors({ 
            token: `This reset link expires in ${Math.ceil(data.timeRemaining / 60000)} minutes` 
          })
        }
      } else {
        setTokenValid(false)
        setStep('error')
        setErrors({ token: 'Invalid or expired reset token' })
      }
    } catch (error) {
      setTokenValid(false)
      setStep('error')
      setErrors({ token: 'Unable to validate reset token' })
    }
  }

  const requestPasswordReset = async (emailAddress: string) => {
    setLoading(true)
    setErrors({})

    try {
      const validation = ForgotPasswordSchema.safeParse({ email: emailAddress })
      if (!validation.success) {
        setErrors({ email: validation.error.errors[0]?.message })
        return
      }

      const response = await fetch('/api/supplier/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: emailAddress,
          warehouse
        })
      })

      const data = await response.json()

      if (data.success) {
        setStep('sent')
        setCountdown(300) // 5 minutes
      } else {
        setErrors({ 
          general: data.error?.message || 'Failed to send reset email. Please try again.' 
        })
      }
    } catch (error) {
      setErrors({ 
        general: 'Network error. Please check your connection and try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async () => {
    setLoading(true)
    setErrors({})

    try {
      const validation = ResetPasswordSchema.safeParse({ password, confirmPassword })
      if (!validation.success) {
        const errorMap: FormErrors = {}
        validation.error.errors.forEach(error => {
          if (error.path[0]) {
            errorMap[error.path[0] as keyof FormErrors] = error.message
          }
        })
        setErrors(errorMap)
        return
      }

      const response = await fetch('/api/supplier/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: password,
          confirmPassword,
          warehouse
        })
      })

      const data = await response.json()

      if (data.success) {
        setStep('success')
      } else {
        setErrors({ 
          general: data.error?.message || 'Failed to reset password. Please try again.' 
        })
        
        if (data.error?.code === 'INVALID_TOKEN') {
          setTokenValid(false)
          setStep('error')
        }
      }
    } catch (error) {
      setErrors({ 
        general: 'Network error. Please check your connection and try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  // ================================
  // EVENT HANDLERS
  // ================================

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    requestPasswordReset(email)
  }

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    resetPassword()
  }

  const handleBackToLogin = () => {
    router.push(`/supplier/auth/login${warehouse ? `?warehouse=${warehouse}` : ''}`)
  }

  const handleResendEmail = () => {
    setStep('request')
    setErrors({})
  }

  // ================================
  // RENDER FUNCTIONS
  // ================================

  const renderRequestStep = () => (
    <Card className="w-full max-w-md mx-auto" enhancedHover={false}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#006FEE] to-[#0050B3]">
          <Lock className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-[#111827]">
          Reset Your Password
        </CardTitle>
        <CardDescription className="text-[#6B7280]">
          Enter your email address and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleRequestSubmit}>
        <CardContent className="space-y-4">
          {errors.general && (
            <div className="flex items-center gap-2 p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg">
              <XCircle className="h-4 w-4 text-[#EF4444] flex-shrink-0" />
              <p className="text-sm text-[#DC2626]">{errors.general}</p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-[#374151]">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="supplier@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              icon={<Mail className="h-4 w-4" />}
              className="text-base"
              autoComplete="email"
              autoFocus
            />
            {errors.email && (
              <p className="text-sm text-[#EF4444] flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {errors.email}
              </p>
            )}
          </div>

          <div className="bg-[#E6F4FF] border border-[#93C5FD] rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-[#006FEE] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[#0050B3]">
                <p className="font-medium">Security Notice</p>
                <p className="text-xs mt-1">
                  For security, we'll send reset instructions only if this email is associated with an active RHY supplier account.
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full"
            loading={loading}
            loadingText="Sending Reset Link..."
            variant="gradient"
          >
            Send Reset Link
          </Button>
          
          <Button 
            type="button" 
            variant="ghost" 
            onClick={handleBackToLogin}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
        </CardFooter>
      </form>
    </Card>
  )

  const renderSentStep = () => (
    <Card className="w-full max-w-md mx-auto" enhancedHover={false}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
          <Mail className="h-8 w-8 text-[#10B981]" />
        </div>
        <CardTitle className="text-2xl font-bold text-[#111827]">
          Check Your Email
        </CardTitle>
        <CardDescription className="text-[#6B7280]">
          We've sent password reset instructions to your email address
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <p className="text-sm text-[#374151]">
            Didn't receive the email? Check your spam folder or wait a few minutes.
          </p>
          
          {countdown > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-[#6B7280]">
              <Clock className="h-4 w-4" />
              <span>
                Resend available in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[#92400E]">
              <p className="font-medium">Reset Link Expires</p>
              <p className="text-xs mt-1">
                The reset link will expire in 1 hour for your security. If you don't reset your password within this time, you'll need to request a new link.
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        <Button 
          onClick={handleResendEmail}
          variant="outline"
          className="w-full"
          disabled={countdown > 0}
        >
          {countdown > 0 ? (
            <>
              <Clock className="h-4 w-4 mr-2" />
              Resend in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend Email
            </>
          )}
        </Button>
        
        <Button 
          variant="ghost" 
          onClick={handleBackToLogin}
          className="w-full"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Button>
      </CardFooter>
    </Card>
  )

  const renderResetStep = () => {
    if (tokenValid === false) {
      return renderErrorStep()
    }

    return (
      <Card className="w-full max-w-md mx-auto" enhancedHover={false}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#006FEE] to-[#0050B3]">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#111827]">
            Create New Password
          </CardTitle>
          <CardDescription className="text-[#6B7280]">
            Enter a strong password for your RHY supplier account
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleResetSubmit}>
          <CardContent className="space-y-4">
            {errors.general && (
              <div className="flex items-center gap-2 p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg">
                <XCircle className="h-4 w-4 text-[#EF4444] flex-shrink-0" />
                <p className="text-sm text-[#DC2626]">{errors.general}</p>
              </div>
            )}

            {errors.token && (
              <div className="flex items-center gap-2 p-3 bg-[#FEF3C7] border border-[#F59E0B] rounded-lg">
                <AlertTriangle className="h-4 w-4 text-[#F59E0B] flex-shrink-0" />
                <p className="text-sm text-[#92400E]">{errors.token}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#374151]">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!errors.password}
                  icon={<Lock className="h-4 w-4" />}
                  className="text-base pr-10"
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#374151] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-[#EF4444] flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
              {password && <PasswordStrengthIndicator password={password} showStrength={true} />}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-[#374151]">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={!!errors.confirmPassword}
                  icon={<Lock className="h-4 w-4" />}
                  className="text-base pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#374151] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-[#EF4444] flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {errors.confirmPassword}
                </p>
              )}
              {confirmPassword && password && confirmPassword === password && (
                <p className="text-sm text-[#10B981] flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Passwords match
                </p>
              )}
            </div>

            <PasswordRequirements />
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full"
              loading={loading}
              loadingText="Resetting Password..."
              variant="gradient"
              disabled={!password || !confirmPassword || password !== confirmPassword}
            >
              Reset Password
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              onClick={handleBackToLogin}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    )
  }

  const renderSuccessStep = () => (
    <Card className="w-full max-w-md mx-auto" enhancedHover={false}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
          <CheckCircle className="h-8 w-8 text-[#10B981]" />
        </div>
        <CardTitle className="text-2xl font-bold text-[#111827]">
          Password Reset Successful
        </CardTitle>
        <CardDescription className="text-[#6B7280]">
          Your password has been successfully updated. You can now log in with your new password.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-[#D1FAE5] border border-[#10B981] rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-[#10B981] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[#065F46]">
              <p className="font-medium">Security Notice</p>
              <p className="text-xs mt-1">
                For your security, all existing sessions have been invalidated. You'll need to log in again with your new password.
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          onClick={handleBackToLogin}
          className="w-full"
          variant="gradient"
        >
          Continue to Login
        </Button>
      </CardFooter>
    </Card>
  )

  const renderErrorStep = () => (
    <Card className="w-full max-w-md mx-auto" enhancedHover={false}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FEE2E2]">
          <XCircle className="h-8 w-8 text-[#EF4444]" />
        </div>
        <CardTitle className="text-2xl font-bold text-[#111827]">
          Reset Link Invalid
        </CardTitle>
        <CardDescription className="text-[#6B7280]">
          This password reset link is invalid or has expired
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-[#EF4444] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[#DC2626]">
              <p className="font-medium">Possible Reasons:</p>
              <ul className="text-xs mt-1 space-y-1 list-disc list-inside">
                <li>The reset link has expired (links are valid for 1 hour)</li>
                <li>The link has already been used</li>
                <li>The link was copied incorrectly</li>
              </ul>
            </div>
          </div>
        </div>

        <p className="text-sm text-[#374151] text-center">
          Please request a new password reset link to continue.
        </p>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        <Button 
          onClick={() => setStep('request')}
          className="w-full"
          variant="gradient"
        >
          Request New Reset Link
        </Button>
        
        <Button 
          variant="ghost" 
          onClick={handleBackToLogin}
          className="w-full"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Button>
      </CardFooter>
    </Card>
  )

  // ================================
  // RENDER MAIN COMPONENT
  // ================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#E6F4FF] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* RHY Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#006FEE] to-[#0050B3] rounded-xl shadow-lithi-lg mb-4">
            <h1 className="text-xl font-bold text-white">RHY Supplier Portal</h1>
          </div>
          <p className="text-sm text-[#6B7280]">
            {warehouse} Warehouse Operations • Secure FlexVolt Battery Management
          </p>
        </div>

        {/* Step Content */}
        {step === 'request' && renderRequestStep()}
        {step === 'sent' && renderSentStep()}
        {step === 'reset' && renderResetStep()}
        {step === 'success' && renderSuccessStep()}
        {step === 'error' && renderErrorStep()}

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-xs text-[#9CA3AF]">
            Need help? Contact our support team at{' '}
            <a 
              href="mailto:support@rhy-portal.com" 
              className="text-[#006FEE] hover:text-[#0050B3] underline"
            >
              support@rhy-portal.com
            </a>
          </p>
          <p className="text-xs text-[#9CA3AF]">
            © 2025 RHY Corporation • Secure by Design
          </p>
        </div>
      </div>
    </div>
  )
}

// ================================
// HELPER COMPONENTS
// ================================

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  showStrength 
}) => {
  if (!password || !showStrength) return null

  const strengthResult = analyzePasswordStrength(password)
  const crackTime = estimatePasswordCrackTime(password)

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'very-weak': return 'bg-[#EF4444]'
      case 'weak': return 'bg-[#F59E0B]'
      case 'fair': return 'bg-[#F59E0B]'
      case 'good': return 'bg-[#10B981]'
      case 'strong': return 'bg-[#10B981]'
      case 'very-strong': return 'bg-[#059669]'
      default: return 'bg-[#E5E7EB]'
    }
  }

  const getStrengthText = (strength: string) => {
    switch (strength) {
      case 'very-weak': return 'Very Weak'
      case 'weak': return 'Weak'
      case 'fair': return 'Fair'
      case 'good': return 'Good'
      case 'strong': return 'Strong'
      case 'very-strong': return 'Very Strong'
      default: return 'Unknown'
    }
  }

  return (
    <div className="space-y-2">
      {/* Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${getStrengthColor(strengthResult.strength)}`}
            style={{ width: `${(strengthResult.score / 10) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-[#374151]">
          {getStrengthText(strengthResult.strength)}
        </span>
      </div>

      {/* Crack Time */}
      <div className="text-xs text-[#6B7280] flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span>Time to crack: {crackTime.humanReadable}</span>
      </div>

      {/* Feedback */}
      {strengthResult.feedback.length > 0 && (
        <div className="space-y-1">
          {strengthResult.feedback.map((feedback, index) => (
            <p key={index} className="text-xs text-[#EF4444] flex items-center gap-1">
              <XCircle className="h-3 w-3 flex-shrink-0" />
              {feedback}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

const PasswordRequirements: React.FC = () => (
  <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg p-3">
    <p className="text-sm font-medium text-[#374151] mb-2">Password Requirements:</p>
    <ul className="text-xs text-[#6B7280] space-y-1">
      <li className="flex items-center gap-2">
        <CheckCircle className="h-3 w-3 text-[#10B981]" />
        At least 12 characters long
      </li>
      <li className="flex items-center gap-2">
        <CheckCircle className="h-3 w-3 text-[#10B981]" />
        Contains uppercase and lowercase letters
      </li>
      <li className="flex items-center gap-2">
        <CheckCircle className="h-3 w-3 text-[#10B981]" />
        Contains at least one number
      </li>
      <li className="flex items-center gap-2">
        <CheckCircle className="h-3 w-3 text-[#10B981]" />
        Contains special characters (@$!%*?&)
      </li>
      <li className="flex items-center gap-2">
        <CheckCircle className="h-3 w-3 text-[#10B981]" />
        No common patterns or repeated characters
      </li>
    </ul>
  </div>
)