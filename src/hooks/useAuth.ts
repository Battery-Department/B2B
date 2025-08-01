'use client'

/**
 * RHY Supplier Portal - Authentication Hook
 * Enterprise-grade authentication utilities with session management
 * Supports multi-warehouse operations and real-time session validation
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from '@/components/auth/SessionProvider'
import { 
  SupplierAuthData, 
  SessionData, 
  AuthState,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  PasswordChangeRequest,
  MFASetupResponse,
  MFAVerifyRequest
} from '@/types/auth'

// Authentication hook configuration
const API_BASE_URL = '/api/supplier/auth'
const MFA_SETUP_TIMEOUT = 300000 // 5 minutes
const PASSWORD_STRENGTH_MIN_SCORE = 3

// Password strength calculation
interface PasswordStrength {
  score: number // 0-4
  feedback: string[]
  isValid: boolean
}

/**
 * Calculate password strength
 */
function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0
  const feedback: string[] = []
  
  if (password.length >= 12) score++
  else feedback.push('Password should be at least 12 characters long')
  
  if (/[a-z]/.test(password)) score++
  else feedback.push('Add lowercase letters')
  
  if (/[A-Z]/.test(password)) score++
  else feedback.push('Add uppercase letters')
  
  if (/\d/.test(password)) score++
  else feedback.push('Add numbers')
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
  else feedback.push('Add special characters')
  
  return {
    score,
    feedback,
    isValid: score >= PASSWORD_STRENGTH_MIN_SCORE
  }
}

/**
 * Authentication hook interface
 */
interface UseAuthReturn {
  // Session state from SessionProvider
  supplier: SupplierAuthData | null
  session: SessionData | null
  user: { id: string; permissions: string[]; supplierType: string } | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  currentWarehouse: string | null
  availableWarehouses: string[]
  
  // Authentication actions
  login: (email: string, password: string, warehouse?: string, mfaCode?: string) => Promise<boolean>
  register: (data: RegisterRequest) => Promise<boolean>
  logout: (reason?: string) => Promise<void>
  
  // Password management
  changePassword: (data: PasswordChangeRequest) => Promise<boolean>
  requestPasswordReset: (email: string) => Promise<boolean>
  resetPassword: (token: string, newPassword: string) => Promise<boolean>
  
  // MFA management
  setupMFA: () => Promise<MFASetupResponse | null>
  verifyMFA: (code: string, backupCode?: string) => Promise<boolean>
  disableMFA: (password: string) => Promise<boolean>
  
  // Session management
  refreshSession: () => Promise<boolean>
  switchWarehouse: (warehouse: string) => Promise<boolean>
  extendSession: () => Promise<boolean>
  
  // Utility functions
  hasPermission: (permission: string, warehouse?: string) => boolean
  hasWarehouseAccess: (warehouse: string) => boolean
  getPermissions: (warehouse?: string) => string[]
  validatePasswordStrength: (password: string) => PasswordStrength
  
  // Activity tracking
  trackActivity: () => void
  lastActivity: Date | null
  isIdle: boolean
  idleTime: number
  timeUntilExpiry: number | null
}

/**
 * Main authentication hook
 */
export function useAuth(): UseAuthReturn {
  // Session context
  const sessionContext = useSession()
  
  // Local state for auth operations
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaSetupData, setMfaSetupData] = useState<MFASetupResponse | null>(null)
  
  // Refs
  const mfaTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Hooks
  const router = useRouter()
  const pathname = usePathname()

  /**
   * Handle API errors consistently
   */
  const handleError = useCallback((error: any, defaultMessage: string) => {
    const message = error?.response?.data?.error || error?.message || defaultMessage
    setAuthError(message)
    console.error('Auth error:', message)
    return false
  }, [])

  /**
   * Clear auth error
   */
  const clearError = useCallback(() => {
    setAuthError(null)
  }, [])

  /**
   * Enhanced login with MFA support
   */
  const login = useCallback(async (
    email: string, 
    password: string, 
    warehouse?: string, 
    mfaCode?: string
  ): Promise<boolean> => {
    try {
      setAuthLoading(true)
      clearError()

      const requestData: LoginRequest = {
        email: email.toLowerCase().trim(),
        password,
        warehouse,
        mfaCode,
        rememberMe: false
      }

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      const data: LoginResponse = await response.json()

      if (!response.ok) {
        return handleError(data, 'Login failed')
      }

      if (data.requiresMFA && !mfaCode) {
        setMfaRequired(true)
        setAuthError('Please enter your MFA code')
        return false
      }

      if (data.success && data.supplier) {
        // SessionProvider will handle the session state
        setMfaRequired(false)
        
        // Redirect to appropriate dashboard
        const redirectPath = warehouse 
          ? `/supplier/dashboard?warehouse=${warehouse}`
          : '/supplier/dashboard'
        
        router.push(redirectPath)
        return true
      }

      return handleError(data, 'Login failed')
    } catch (error) {
      return handleError(error, 'Network error during login')
    } finally {
      setAuthLoading(false)
    }
  }, [handleError, clearError, router])

  /**
   * Register new supplier
   */
  const register = useCallback(async (data: RegisterRequest): Promise<boolean> => {
    try {
      setAuthLoading(true)
      clearError()

      // Validate password strength
      const passwordStrength = calculatePasswordStrength(data.password)
      if (!passwordStrength.isValid) {
        setAuthError(`Password too weak: ${passwordStrength.feedback.join(', ')}`)
        return false
      }

      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          email: data.email.toLowerCase().trim(),
          companyName: data.companyName.trim(),
          contactName: data.contactName.trim()
        })
      })

      const result: RegisterResponse = await response.json()

      if (!response.ok) {
        return handleError(result, 'Registration failed')
      }

      if (result.success) {
        if (result.requiresVerification) {
          router.push('/auth/verify-email')
        } else {
          router.push('/supplier/dashboard')
        }
        return true
      }

      return handleError(result, 'Registration failed')
    } catch (error) {
      return handleError(error, 'Network error during registration')
    } finally {
      setAuthLoading(false)
    }
  }, [handleError, clearError, router])

  /**
   * Logout with reason tracking
   */
  const logout = useCallback(async (reason: string = 'USER_LOGOUT'): Promise<void> => {
    await sessionContext.logout(reason)
    setMfaRequired(false)
    setMfaSetupData(null)
    clearError()
  }, [sessionContext, clearError])

  /**
   * Change password with validation
   */
  const changePassword = useCallback(async (data: PasswordChangeRequest): Promise<boolean> => {
    try {
      setAuthLoading(true)
      clearError()

      // Validate new password strength
      const passwordStrength = calculatePasswordStrength(data.newPassword)
      if (!passwordStrength.isValid) {
        setAuthError(`New password too weak: ${passwordStrength.feedback.join(', ')}`)
        return false
      }

      const response = await fetch(`${API_BASE_URL}/change-password`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        return handleError(result, 'Password change failed')
      }

      if (result.success) {
        // Force re-authentication for security
        await logout('PASSWORD_CHANGED')
        router.push('/auth/login?message=password-changed')
        return true
      }

      return handleError(result, 'Password change failed')
    } catch (error) {
      return handleError(error, 'Network error during password change')
    } finally {
      setAuthLoading(false)
    }
  }, [handleError, clearError, logout, router])

  /**
   * Request password reset
   */
  const requestPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    try {
      setAuthLoading(true)
      clearError()

      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      })

      const result = await response.json()

      if (!response.ok) {
        return handleError(result, 'Password reset request failed')
      }

      return result.success
    } catch (error) {
      return handleError(error, 'Network error during password reset request')
    } finally {
      setAuthLoading(false)
    }
  }, [handleError, clearError])

  /**
   * Reset password with token
   */
  const resetPassword = useCallback(async (token: string, newPassword: string): Promise<boolean> => {
    try {
      setAuthLoading(true)
      clearError()

      // Validate password strength
      const passwordStrength = calculatePasswordStrength(newPassword)
      if (!passwordStrength.isValid) {
        setAuthError(`Password too weak: ${passwordStrength.feedback.join(', ')}`)
        return false
      }

      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, newPassword })
      })

      const result = await response.json()

      if (!response.ok) {
        return handleError(result, 'Password reset failed')
      }

      if (result.success) {
        router.push('/auth/login?message=password-reset')
        return true
      }

      return handleError(result, 'Password reset failed')
    } catch (error) {
      return handleError(error, 'Network error during password reset')
    } finally {
      setAuthLoading(false)
    }
  }, [handleError, clearError, router])

  /**
   * Setup MFA
   */
  const setupMFA = useCallback(async (): Promise<MFASetupResponse | null> => {
    try {
      setAuthLoading(true)
      clearError()

      const response = await fetch(`${API_BASE_URL}/mfa/setup`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result: MFASetupResponse = await response.json()

      if (!response.ok) {
        handleError(result, 'MFA setup failed')
        return null
      }

      if (result.success) {
        setMfaSetupData(result)
        
        // Set timeout for MFA setup
        mfaTimeoutRef.current = setTimeout(() => {
          setMfaSetupData(null)
          setAuthError('MFA setup timed out. Please try again.')
        }, MFA_SETUP_TIMEOUT)
        
        return result
      }

      handleError(result, 'MFA setup failed')
      return null
    } catch (error) {
      handleError(error, 'Network error during MFA setup')
      return null
    } finally {
      setAuthLoading(false)
    }
  }, [handleError, clearError])

  /**
   * Verify MFA code
   */
  const verifyMFA = useCallback(async (code: string, backupCode?: string): Promise<boolean> => {
    try {
      setAuthLoading(true)
      clearError()

      const requestData: MFAVerifyRequest = {
        code: code.replace(/\s/g, ''), // Remove spaces
        backupCode
      }

      const response = await fetch(`${API_BASE_URL}/mfa/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (!response.ok) {
        return handleError(result, 'MFA verification failed')
      }

      if (result.success) {
        setMfaSetupData(null)
        setMfaRequired(false)
        
        // Clear MFA timeout
        if (mfaTimeoutRef.current) {
          clearTimeout(mfaTimeoutRef.current)
        }
        
        return true
      }

      return handleError(result, 'MFA verification failed')
    } catch (error) {
      return handleError(error, 'Network error during MFA verification')
    } finally {
      setAuthLoading(false)
    }
  }, [handleError, clearError])

  /**
   * Disable MFA
   */
  const disableMFA = useCallback(async (password: string): Promise<boolean> => {
    try {
      setAuthLoading(true)
      clearError()

      const response = await fetch(`${API_BASE_URL}/mfa/disable`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      })

      const result = await response.json()

      if (!response.ok) {
        return handleError(result, 'Failed to disable MFA')
      }

      return result.success
    } catch (error) {
      return handleError(error, 'Network error while disabling MFA')
    } finally {
      setAuthLoading(false)
    }
  }, [handleError, clearError])

  /**
   * Extend current session
   */
  const extendSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/extend-session`, {
        method: 'POST',
        credentials: 'include'
      })

      const result = await response.json()
      return result.success || false
    } catch (error) {
      console.error('Session extension failed:', error)
      return false
    }
  }, [])

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback((
    permission: string, 
    warehouse?: string
  ): boolean => {
    if (!sessionContext.supplier) return false
    
    const targetWarehouse = warehouse || sessionContext.currentWarehouse
    const warehouseAccess = sessionContext.supplier.warehouseAccess?.find(
      w => w.warehouse === targetWarehouse
    )
    
    return warehouseAccess?.permissions.includes(permission) || false
  }, [sessionContext.supplier, sessionContext.currentWarehouse])

  /**
   * Check if user has access to specific warehouse
   */
  const hasWarehouseAccess = useCallback((warehouse: string): boolean => {
    return sessionContext.availableWarehouses.includes(warehouse)
  }, [sessionContext.availableWarehouses])

  /**
   * Get permissions for warehouse
   */
  const getPermissions = useCallback((warehouse?: string): string[] => {
    if (!sessionContext.supplier) return []
    
    const targetWarehouse = warehouse || sessionContext.currentWarehouse
    const warehouseAccess = sessionContext.supplier.warehouseAccess?.find(
      w => w.warehouse === targetWarehouse
    )
    
    return warehouseAccess?.permissions || []
  }, [sessionContext.supplier, sessionContext.currentWarehouse])

  /**
   * Cleanup effect
   */
  useEffect(() => {
    return () => {
      if (mfaTimeoutRef.current) {
        clearTimeout(mfaTimeoutRef.current)
      }
    }
  }, [])

  // Combine loading states
  const isLoading = sessionContext.isLoading || authLoading

  // Combine error states
  const error = sessionContext.error || authError

  return {
    // Session state
    supplier: sessionContext.supplier,
    session: sessionContext.session,
    user: sessionContext.supplier ? {
      id: sessionContext.supplier.id,
      permissions: sessionContext.supplier.warehouseAccess?.flatMap(w => w.permissions) || [],
      supplierType: sessionContext.supplier.supplierType
    } : null,
    isAuthenticated: sessionContext.isAuthenticated,
    isLoading,
    error,
    currentWarehouse: sessionContext.currentWarehouse,
    availableWarehouses: sessionContext.availableWarehouses,
    
    // Authentication actions
    login,
    register,
    logout,
    
    // Password management
    changePassword,
    requestPasswordReset,
    resetPassword,
    
    // MFA management
    setupMFA,
    verifyMFA,
    disableMFA,
    
    // Session management
    refreshSession: sessionContext.refreshSession,
    switchWarehouse: sessionContext.switchWarehouse,
    extendSession,
    
    // Utility functions
    hasPermission,
    hasWarehouseAccess,
    getPermissions,
    validatePasswordStrength: calculatePasswordStrength,
    
    // Activity tracking
    trackActivity: sessionContext.trackActivity,
    lastActivity: sessionContext.lastActivity,
    isIdle: sessionContext.isIdle,
    idleTime: sessionContext.idleTime,
    timeUntilExpiry: sessionContext.timeUntilExpiry
  }
}

/**
 * Hook for password strength validation
 */
export function usePasswordStrength(password: string) {
  const [strength, setStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isValid: false
  })

  useEffect(() => {
    if (password) {
      setStrength(calculatePasswordStrength(password))
    } else {
      setStrength({ score: 0, feedback: [], isValid: false })
    }
  }, [password])

  return strength
}

/**
 * Hook for MFA management
 */
export function useMFA() {
  const { setupMFA, verifyMFA, disableMFA, supplier } = useAuth()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [isSetupMode, setIsSetupMode] = useState(false)

  const startSetup = useCallback(async () => {
    const result = await setupMFA()
    if (result) {
      setQrCode(result.qrCode || null)
      setBackupCodes(result.backupCodes || [])
      setIsSetupMode(true)
    }
    return !!result
  }, [setupMFA])

  const completeSetup = useCallback(async (code: string) => {
    const success = await verifyMFA(code)
    if (success) {
      setIsSetupMode(false)
      setQrCode(null)
    }
    return success
  }, [verifyMFA])

  const cancelSetup = useCallback(() => {
    setIsSetupMode(false)
    setQrCode(null)
    setBackupCodes([])
  }, [])

  return {
    // State
    qrCode,
    backupCodes,
    isSetupMode,
    isMFAEnabled: supplier?.mfaEnabled || false,
    
    // Actions
    startSetup,
    completeSetup,
    cancelSetup,
    disableMFA,
    verifyMFA
  }
}

// Export for backwards compatibility with existing AuthContext
export { useAuth as default }