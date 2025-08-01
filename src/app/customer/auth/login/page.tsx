'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ShoppingBag, Loader2, User, Zap } from 'lucide-react'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

export default function CustomerLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/customer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        // Store customer session
        localStorage.setItem('customerToken', data.token)
        localStorage.setItem('customerUser', JSON.stringify(data.user))
        
        // Redirect to customer dashboard
        router.push('/customer/dashboard')
      } else {
        setError(data.error || 'Invalid credentials')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestAccess = () => {
    // Create guest session for demo
    const guestUser = {
      id: 'guest-' + Date.now(),
      email: 'guest@lithi.com',
      name: 'Guest User',
      tier: 'Guest'
    }
    
    localStorage.setItem('customerToken', 'guest-token-' + Date.now())
    localStorage.setItem('customerUser', JSON.stringify(guestUser))
    
    // Redirect to dashboard
    router.push('/customer/dashboard')
  }

  const handleDemoLogin = () => {
    // Auto-fill demo credentials
    setEmail('demo@lithi.com')
    setPassword('demo123')
    setError('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F8FAFC',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 111, 238, 0.08)',
        overflow: 'hidden',
        border: '1px solid #E6F4FF'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0048AC 0%, #006FEE 50%, #0084FF 100%)',
          padding: '32px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            backdropFilter: 'blur(10px)'
          }}>
            <Zap size={32} color="white" />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '8px'
          }}>
            Welcome to Lithi
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            Log in to your customer account
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: '32px' }}>
          {/* Demo Credentials Box */}
          <div style={{
            backgroundColor: '#F0F9FF',
            border: '1px solid #E6F4FF',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#0048AC',
              marginBottom: '8px'
            }}>
              🎯 Test Credentials
            </div>
            <div style={{ fontSize: '14px', color: '#5B6B7D' }}>
              <div>Email: demo@lithi.com</div>
              <div>Password: demo123</div>
            </div>
            <button
              onClick={handleDemoLogin}
              style={{
                marginTop: '12px',
                background: 'none',
                border: '1px solid #006FEE',
                color: '#006FEE',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F0F9FF'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              Use Demo Account
            </button>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#FFE6E6',
              color: '#DC2626',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                  backgroundColor: '#F9FAFB'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#006FEE'
                  e.target.style.backgroundColor = 'white'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB'
                  e.target.style.backgroundColor = '#F9FAFB'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    paddingRight: '48px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'all 0.2s',
                    backgroundColor: '#F9FAFB'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#006FEE'
                    e.target.style.backgroundColor = 'white'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E5E7EB'
                    e.target.style.backgroundColor = '#F9FAFB'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '8px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#6B7280'
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #006FEE 0%, #0084FF 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 111, 238, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {isLoading && <Loader2 size={20} className="animate-spin" />}
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '24px 0'
          }}>
            <div style={{
              flex: 1,
              height: '1px',
              backgroundColor: '#E5E7EB'
            }} />
            <span style={{
              padding: '0 16px',
              color: '#9CA3AF',
              fontSize: '14px'
            }}>
              OR
            </span>
            <div style={{
              flex: 1,
              height: '1px',
              backgroundColor: '#E5E7EB'
            }} />
          </div>

          {/* Google Sign In */}
          <GoogleSignInButton 
            returnUrl="/customer/dashboard"
            className="mb-3"
          />

          <button
            onClick={handleGuestAccess}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#F0F9FF',
              color: '#006FEE',
              border: '1px solid #E6F4FF',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E6F4FF'
              e.currentTarget.style.borderColor = '#006FEE'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F0F9FF'
              e.currentTarget.style.borderColor = '#E6F4FF'
            }}
          >
            <User size={20} />
            Continue as Guest
          </button>

          <div style={{
            textAlign: 'center',
            marginTop: '24px',
            color: '#6B7280',
            fontSize: '14px'
          }}>
            Don't have an account?{' '}
            <Link 
              href="/customer/auth/register"
              style={{
                color: '#006FEE',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}