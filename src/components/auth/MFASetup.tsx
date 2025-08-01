/**
 * RHY Supplier Portal - MFA Setup Component
 * Enterprise-grade Multi-Factor Authentication setup with QR code and backup codes
 * Follows RHY design system with Lithi branding
 */

'use client'

import React, { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  QrCode, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Download,
  AlertTriangle,
  Smartphone,
  Key,
  Lock
} from 'lucide-react'

interface MFASetupProps {
  onSetupComplete?: (success: boolean) => void
  onCancel?: () => void
  className?: string
}

interface MFASetupData {
  secret: string
  qrCode: string
  backupCodes: string[]
}

export function MFASetup({ onSetupComplete, onCancel, className = '' }: MFASetupProps) {
  const [currentStep, setCurrentStep] = useState<'password' | 'setup' | 'verify' | 'complete'>('password')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mfaData, setMFAData] = useState<MFASetupData | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({})
  const [backupCodesDownloaded, setBackupCodesDownloaded] = useState(false)

  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/supplier/auth/mfa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        setMFAData(result.data)
        setCurrentStep('setup')
      } else {
        setError(result.error || 'Failed to setup MFA. Please try again.')
      }
    } catch (err) {
      console.error('MFA setup error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }, [password])

  const handleVerification = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/supplier/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verificationCode }),
      })

      const result = await response.json()

      if (result.success) {
        setCurrentStep('complete')
        setTimeout(() => {
          onSetupComplete?.(true)
        }, 2000)
      } else {
        setError(result.error || 'Invalid verification code. Please try again.')
      }
    } catch (err) {
      console.error('MFA verification error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }, [verificationCode, onSetupComplete])

  const copyToClipboard = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates(prev => ({ ...prev, [key]: true }))
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }))
      }, 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }, [])

  const downloadBackupCodes = useCallback(() => {
    if (!mfaData?.backupCodes) return

    const content = [
      'RHY Battery Supplier Portal - MFA Backup Codes',
      '==============================================',
      '',
      'IMPORTANT: Keep these codes secure and private.',
      'Each code can only be used once.',
      '',
      'Backup Codes:',
      ...mfaData.backupCodes.map((code, index) => `${index + 1}. ${code}`),
      '',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'If you lose access to your authenticator app, you can use these',
      'codes to sign in. Store them in a secure location.'
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rhy-mfa-backup-codes-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    setBackupCodesDownloaded(true)
  }, [mfaData?.backupCodes])

  const renderPasswordStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full"
             style={{ backgroundColor: '#E6F4FF' }}>
          <Shield size={32} style={{ color: '#006FEE' }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#111827' }}>
            Enable Multi-Factor Authentication
          </h2>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Add an extra layer of security to your RHY supplier account
          </p>
        </div>
      </div>

      <Alert>
        <Shield size={16} />
        <div>
          <h4 className="font-semibold">Enhanced Security</h4>
          <p className="text-sm">
            MFA protects your account even if your password is compromised. 
            Enterprise accounts require MFA for compliance.
          </p>
        </div>
      </Alert>

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium" style={{ color: '#374151' }}>
            Confirm your password to continue
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your current password"
              required
              className="pr-12"
              style={{
                backgroundColor: '#F9FAFB',
                border: '2px solid #E5E7EB',
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '14px',
                color: '#111827'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#006FEE'
                e.target.style.backgroundColor = 'white'
                e.target.style.boxShadow = '0 0 0 3px rgba(0, 111, 238, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E5E7EB'
                e.target.style.backgroundColor = '#F9FAFB'
                e.target.style.boxShadow = 'none'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle size={16} />
            <div>
              <h4 className="font-semibold">Error</h4>
              <p className="text-sm">{error}</p>
            </div>
          </Alert>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="flex-1 transition-all duration-300"
            style={{
              backgroundColor: '#006FEE',
              color: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              padding: '12px 24px',
              boxShadow: '0 2px 8px rgba(0, 111, 238, 0.25)'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && password.trim()) {
                e.currentTarget.style.backgroundColor = '#0050B3'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 111, 238, 0.35)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && password.trim()) {
                e.currentTarget.style.backgroundColor = '#006FEE'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 111, 238, 0.25)'
              }
            }}
          >
            {isLoading ? 'Verifying...' : 'Continue'}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              style={{
                border: '2px solid #E6F4FF',
                backgroundColor: 'white',
                color: '#006FEE',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                padding: '10px 20px'
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  )

  const renderSetupStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full"
             style={{ backgroundColor: '#E6F4FF' }}>
          <QrCode size={32} style={{ color: '#006FEE' }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#111827' }}>
            Setup Your Authenticator
          </h2>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Scan the QR code with your authenticator app
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* QR Code Section */}
        <Card className="p-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: '#374151' }}>
            <Smartphone size={16} />
            Scan QR Code
          </div>
          
          {mfaData?.qrCode && (
            <div className="flex justify-center">
              <img 
                src={mfaData.qrCode} 
                alt="MFA QR Code"
                className="border-2 rounded-lg"
                style={{ borderColor: '#E6F4FF' }}
              />
            </div>
          )}

          <p className="text-xs" style={{ color: '#6B7280' }}>
            Use Google Authenticator, Authy, or any TOTP app
          </p>
        </Card>

        {/* Manual Setup Section */}
        <Card className="p-6 space-y-4">
          <div className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: '#374151' }}>
            <Key size={16} />
            Manual Setup
          </div>
          
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium" style={{ color: '#6B7280' }}>
                Secret Key
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 text-xs font-mono rounded border text-center"
                      style={{ 
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        color: '#374151'
                      }}>
                  {mfaData?.secret}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(mfaData?.secret || '', 'secret')}
                  className="px-3"
                >
                  {copiedStates.secret ? <Check size={14} /> : <Copy size={14} />}
                </Button>
              </div>
            </div>
            
            <div className="text-xs space-y-1" style={{ color: '#6B7280' }}>
              <p>• Add a new account in your authenticator app</p>
              <p>• Choose "Enter a setup key"</p>
              <p>• Paste the secret key above</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Backup Codes Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={16} style={{ color: '#006FEE' }} />
            <h3 className="font-semibold" style={{ color: '#374151' }}>Backup Codes</h3>
            <Badge variant="outline" style={{ borderColor: '#F59E0B', color: '#F59E0B' }}>
              Important
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadBackupCodes}
            className="gap-2"
          >
            <Download size={14} />
            Download
          </Button>
        </div>
        
        <Alert>
          <AlertTriangle size={16} />
          <div>
            <h4 className="font-semibold">Save these backup codes</h4>
            <p className="text-sm">
              Store them securely. Each code can only be used once if you lose access to your authenticator.
            </p>
          </div>
        </Alert>

        <div className="grid grid-cols-2 gap-3">
          {mfaData?.backupCodes.map((code, index) => (
            <div key={index} className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 text-sm font-mono rounded border text-center"
                    style={{ 
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      color: '#374151'
                    }}>
                {code}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(code, `backup-${index}`)}
                className="px-3"
              >
                {copiedStates[`backup-${index}`] ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={() => setCurrentStep('verify')}
          className="flex-1 transition-all duration-300"
          style={{
            backgroundColor: '#006FEE',
            color: 'white',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            padding: '12px 24px',
            boxShadow: '0 2px 8px rgba(0, 111, 238, 0.25)'
          }}
        >
          I've Set Up My Authenticator
        </Button>
      </div>
    </div>
  )

  const renderVerifyStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full"
             style={{ backgroundColor: '#E6F4FF' }}>
          <Key size={32} style={{ color: '#006FEE' }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#111827' }}>
            Verify Your Setup
          </h2>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Enter the 6-digit code from your authenticator app
          </p>
        </div>
      </div>

      <form onSubmit={handleVerification} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="verification-code" className="text-sm font-medium" style={{ color: '#374151' }}>
            Verification Code
          </Label>
          <Input
            id="verification-code"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            required
            className="text-center text-lg font-mono tracking-widest"
            style={{
              backgroundColor: '#F9FAFB',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              padding: '16px 20px',
              fontSize: '18px',
              color: '#111827'
            }}
          />
          <p className="text-xs text-center" style={{ color: '#6B7280' }}>
            Code refreshes every 30 seconds
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle size={16} />
            <div>
              <h4 className="font-semibold">Verification Failed</h4>
              <p className="text-sm">{error}</p>
            </div>
          </Alert>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading || verificationCode.length !== 6}
            className="flex-1 transition-all duration-300"
            style={{
              backgroundColor: '#006FEE',
              color: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              padding: '12px 24px',
              boxShadow: '0 2px 8px rgba(0, 111, 238, 0.25)'
            }}
          >
            {isLoading ? 'Verifying...' : 'Verify & Enable MFA'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep('setup')}
            className="px-6"
          >
            Back
          </Button>
        </div>
      </form>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full"
             style={{ backgroundColor: '#BBF7D0' }}>
          <Check size={32} style={{ color: '#10B981' }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#111827' }}>
            MFA Successfully Enabled!
          </h2>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Your account is now protected with multi-factor authentication
          </p>
        </div>
      </div>

      <Alert>
        <Shield size={16} />
        <div>
          <h4 className="font-semibold">Account Security Enhanced</h4>
          <p className="text-sm">
            You'll now need to enter a code from your authenticator app when signing in.
            Keep your backup codes safe in case you lose access to your authenticator.
          </p>
        </div>
      </Alert>

      <div className="flex flex-col gap-2 text-sm" style={{ color: '#6B7280' }}>
        <p>✓ TOTP authenticator configured</p>
        <p>✓ Backup codes {backupCodesDownloaded ? 'downloaded' : 'generated'}</p>
        <p>✓ Account security enhanced</p>
      </div>
    </div>
  )

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <Card className="p-8 transition-all duration-300"
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '2px solid #E6F4FF',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
        
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {['password', 'setup', 'verify', 'complete'].map((step, index) => {
              const isActive = step === currentStep
              const isCompleted = ['password', 'setup', 'verify', 'complete'].indexOf(currentStep) > index
              const stepNumber = index + 1
              
              return (
                <div key={step} className="flex items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isActive 
                          ? 'text-white'
                          : 'text-gray-400'
                    }`}
                    style={isActive ? { backgroundColor: '#006FEE' } : {}}
                  >
                    {isCompleted ? <Check size={16} /> : stepNumber}
                  </div>
                  {index < 3 && (
                    <div className={`w-16 h-0.5 mx-2 transition-all duration-300 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
          <div className="text-xs text-center" style={{ color: '#6B7280' }}>
            Step {['password', 'setup', 'verify', 'complete'].indexOf(currentStep) + 1} of 4
          </div>
        </div>

        {currentStep === 'password' && renderPasswordStep()}
        {currentStep === 'setup' && renderSetupStep()}
        {currentStep === 'verify' && renderVerifyStep()}
        {currentStep === 'complete' && renderCompleteStep()}
      </Card>
    </div>
  )
}