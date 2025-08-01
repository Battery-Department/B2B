/**
 * RHY Supplier Portal - MFA Verification Component
 * Enterprise-grade Multi-Factor Authentication verification for login flows
 * Supports TOTP codes and backup codes with comprehensive error handling
 */

'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Key, 
  RefreshCw, 
  AlertTriangle,
  Smartphone,
  HelpCircle,
  ArrowLeft,
  Clock
} from 'lucide-react'

interface MFAVerificationProps {
  onVerificationSuccess?: (verificationData: any) => void
  onCancel?: () => void
  onBackupCodeMode?: () => void
  userEmail?: string
  className?: string
  // For login flow integration
  loginData?: {
    email: string
    password: string
    warehouse?: string
    rememberMe?: boolean
  }
}

export function MFAVerification({ 
  onVerificationSuccess, 
  onCancel, 
  onBackupCodeMode,
  userEmail,
  className = '',
  loginData
}: MFAVerificationProps) {
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isBackupMode, setIsBackupMode] = useState(false)
  const [remainingTime, setRemainingTime] = useState(30)
  const [canResend, setCanResend] = useState(false)
  const [attemptsRemaining, setAttemptsRemaining] = useState(5)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-focus input when component mounts or mode changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [isBackupMode])

  // Countdown timer for TOTP refresh
  useEffect(() => {
    if (!isBackupMode) {
      intervalRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            setCanResend(true)
            return 30
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [isBackupMode])

  const handleVerification = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const code = isBackupMode ? backupCode.trim().toUpperCase() : verificationCode.trim()
    
    if (!code || (isBackupMode && code.length !== 8) || (!isBackupMode && code.length !== 6)) {
      setError(`Please enter a valid ${isBackupMode ? '8-character backup code' : '6-digit verification code'}`)
      setIsLoading(false)
      return
    }

    try {
      let response: Response

      // If this is part of a login flow, include login data
      if (loginData) {
        response = await fetch('/api/supplier/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...loginData,
            mfaCode: isBackupMode ? undefined : code,
            backupCode: isBackupMode ? code : undefined
          }),
        })
      } else {
        // Standalone MFA verification
        response = await fetch('/api/supplier/auth/mfa/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: isBackupMode ? undefined : code,
            backupCode: isBackupMode ? code : undefined
          }),
        })
      }

      const result = await response.json()

      if (result.success) {
        onVerificationSuccess?.(result)
      } else {
        setError(result.error || 'Verification failed. Please try again.')
        setAttemptsRemaining(prev => Math.max(0, prev - 1))
        
        // Clear the input for retry
        if (isBackupMode) {
          setBackupCode('')
        } else {
          setVerificationCode('')
        }
      }
    } catch (err) {
      console.error('MFA verification error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }, [verificationCode, backupCode, isBackupMode, loginData, onVerificationSuccess])

  const handleCodeChange = useCallback((value: string) => {
    if (isBackupMode) {
      // Backup code: 8 alphanumeric characters
      const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
      setBackupCode(cleanValue)
    } else {
      // TOTP code: 6 digits only
      const cleanValue = value.replace(/\D/g, '').slice(0, 6)
      setVerificationCode(cleanValue)
    }
    setError(null)
  }, [isBackupMode])

  const toggleBackupMode = useCallback(() => {
    setIsBackupMode(!isBackupMode)
    setVerificationCode('')
    setBackupCode('')
    setError(null)
    onBackupCodeMode?.()
  }, [isBackupMode, onBackupCodeMode])

  const resetCode = useCallback(() => {
    setVerificationCode('')
    setBackupCode('')
    setError(null)
    setCanResend(false)
    setRemainingTime(30)
  }, [])

  const currentCode = isBackupMode ? backupCode : verificationCode
  const expectedLength = isBackupMode ? 8 : 6
  const isCodeComplete = currentCode.length === expectedLength

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <Card className="p-8 transition-all duration-300"
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '2px solid #E6F4FF',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
        
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full"
               style={{ backgroundColor: '#E6F4FF' }}>
            {isBackupMode ? (
              <Key size={32} style={{ color: '#006FEE' }} />
            ) : (
              <Shield size={32} style={{ color: '#006FEE' }} />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#111827' }}>
              {isBackupMode ? 'Enter Backup Code' : 'Two-Factor Authentication'}
            </h2>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              {isBackupMode 
                ? 'Enter one of your saved backup codes'
                : 'Enter the 6-digit code from your authenticator app'
              }
            </p>
            {userEmail && (
              <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
                Signing in as {userEmail}
              </p>
            )}
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleVerification} className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="verification-input" className="text-sm font-medium" style={{ color: '#374151' }}>
                {isBackupMode ? 'Backup Code' : 'Verification Code'}
              </Label>
              {!isBackupMode && (
                <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7280' }}>
                  <Clock size={14} />
                  <span>{remainingTime}s</span>
                  {canResend && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetCode}
                      className="h-auto p-1 text-xs"
                      style={{ color: '#006FEE' }}
                    >
                      <RefreshCw size={12} className="mr-1" />
                      New code
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <Input
              ref={inputRef}
              id="verification-input"
              type="text"
              value={currentCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder={isBackupMode ? 'ABCD1234' : '000000'}
              required
              autoComplete="one-time-code"
              className={`text-center font-mono tracking-wider transition-all duration-200 ${
                isBackupMode ? 'text-base' : 'text-lg'
              }`}
              style={{
                backgroundColor: '#F9FAFB',
                border: `2px solid ${error ? '#EF4444' : '#E5E7EB'}`,
                borderRadius: '8px',
                padding: '16px 20px',
                fontSize: isBackupMode ? '16px' : '18px',
                color: '#111827',
                letterSpacing: isBackupMode ? '0.1em' : '0.25em'
              }}
              onFocus={(e) => {
                if (!error) {
                  e.target.style.borderColor = '#006FEE'
                  e.target.style.backgroundColor = 'white'
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 111, 238, 0.1)'
                }
              }}
              onBlur={(e) => {
                if (!error) {
                  e.target.style.borderColor = '#E5E7EB'
                  e.target.style.backgroundColor = '#F9FAFB'
                  e.target.style.boxShadow = 'none'
                }
              }}
            />
            
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: '#6B7280' }}>
                {currentCode.length}/{expectedLength} characters
              </span>
              {attemptsRemaining < 5 && (
                <Badge variant="outline" style={{ borderColor: '#F59E0B', color: '#F59E0B' }}>
                  {attemptsRemaining} attempts left
                </Badge>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle size={16} />
              <div>
                <h4 className="font-semibold">Verification Failed</h4>
                <p className="text-sm">{error}</p>
              </div>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              type="submit"
              disabled={isLoading || !isCodeComplete || attemptsRemaining === 0}
              className="w-full transition-all duration-300"
              style={{
                backgroundColor: isCodeComplete && attemptsRemaining > 0 ? '#006FEE' : '#E5E7EB',
                color: isCodeComplete && attemptsRemaining > 0 ? 'white' : '#9CA3AF',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                padding: '12px 24px',
                boxShadow: isCodeComplete && attemptsRemaining > 0 ? '0 2px 8px rgba(0, 111, 238, 0.25)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (isCodeComplete && !isLoading && attemptsRemaining > 0) {
                  e.currentTarget.style.backgroundColor = '#0050B3'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 111, 238, 0.35)'
                }
              }}
              onMouseLeave={(e) => {
                if (isCodeComplete && !isLoading && attemptsRemaining > 0) {
                  e.currentTarget.style.backgroundColor = '#006FEE'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 111, 238, 0.25)'
                }
              }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw size={16} className="animate-spin" />
                  Verifying...
                </div>
              ) : (
                `Verify ${isBackupMode ? 'Backup Code' : 'Code'}`
              )}
            </Button>

            {/* Alternative Options */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="ghost"
                onClick={toggleBackupMode}
                className="w-full text-sm transition-colors"
                style={{ color: '#6B7280' }}
              >
                {isBackupMode ? (
                  <div className="flex items-center gap-2">
                    <Smartphone size={16} />
                    Use authenticator app instead
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Key size={16} />
                    Use backup code instead
                  </div>
                )}
              </Button>

              {onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onCancel}
                  className="w-full text-sm"
                  style={{ color: '#6B7280' }}
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to login
                </Button>
              )}
            </div>
          </div>
        </form>

        {/* Help Section */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: '#F9FAFB' }}>
            <HelpCircle size={16} className="mt-0.5" style={{ color: '#6B7280' }} />
            <div className="text-xs space-y-1" style={{ color: '#6B7280' }}>
              <p className="font-medium">Need help?</p>
              {isBackupMode ? (
                <>
                  <p>• Backup codes are 8 characters long</p>
                  <p>• Each code can only be used once</p>
                  <p>• Find them in your secure storage</p>
                </>
              ) : (
                <>
                  <p>• Open your authenticator app</p>
                  <p>• Find "RHY Battery Portal"</p>
                  <p>• Enter the 6-digit code shown</p>
                </>
              )}
              <p>• Contact support if you're still having trouble</p>
            </div>
          </div>
        </div>

        {/* Account Lockout Warning */}
        {attemptsRemaining <= 2 && attemptsRemaining > 0 && (
          <Alert className="mt-4" variant="destructive">
            <AlertTriangle size={16} />
            <div>
              <h4 className="font-semibold">Warning</h4>
              <p className="text-sm">
                Your account will be temporarily locked after {attemptsRemaining} more failed attempt{attemptsRemaining === 1 ? '' : 's'}.
              </p>
            </div>
          </Alert>
        )}

        {attemptsRemaining === 0 && (
          <Alert className="mt-4" variant="destructive">
            <AlertTriangle size={16} />
            <div>
              <h4 className="font-semibold">Account Locked</h4>
              <p className="text-sm">
                Too many failed attempts. Your account has been temporarily locked for security. 
                Please try again in 15 minutes or contact support for assistance.
              </p>
            </div>
          </Alert>
        )}
      </Card>
    </div>
  )
}