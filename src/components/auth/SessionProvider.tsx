'use client'

/**
 * RHY Supplier Portal - Session Provider Component
 * Enterprise-grade session management with React Context
 * Supports multi-warehouse operations and real-time session validation
 */

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  useRef
} from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  SupplierAuthData, 
  SessionData, 
  AuthState, 
  SecurityContext,
  AuthStatus
} from '@/types/auth'

// Session management configuration
const SESSION_CHECK_INTERVAL = 60000 // 1 minute
const TOKEN_REFRESH_THRESHOLD = 300000 // 5 minutes before expiry
const IDLE_WARNING_TIME = 300000 // 5 minutes idle warning
const MAX_IDLE_TIME = 900000 // 15 minutes max idle
const API_BASE_URL = '/api/supplier/auth'

// Session context interface
interface SessionContextType {
  // Auth state
  authState: AuthState
  supplier: SupplierAuthData | null
  session: SessionData | null
  
  // Session management
  login: (email: string, password: string, warehouse?: string) => Promise<boolean>
  logout: (reason?: string) => Promise<void>
  refreshSession: () => Promise<boolean>
  switchWarehouse: (warehouse: string) => Promise<boolean>
  
  // Session status
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  lastActivity: Date | null
  timeUntilExpiry: number | null
  
  // Warehouse management
  currentWarehouse: string | null
  availableWarehouses: string[]
  
  // Activity tracking
  trackActivity: () => void
  isIdle: boolean
  idleTime: number
}

// Create session context
const SessionContext = createContext<SessionContextType | undefined>(undefined)

// Session provider props
interface SessionProviderProps {
  children: React.ReactNode
  autoRefresh?: boolean
  showIdleWarning?: boolean
  redirectOnExpiry?: boolean
}

/**
 * Session Provider Component
 * Manages authentication state and session lifecycle
 */
export function SessionProvider({ 
  children, 
  autoRefresh = true,
  showIdleWarning = true,
  redirectOnExpiry = true
}: SessionProviderProps): JSX.Element {
  // State management
  const [authState, setAuthState] = useState<AuthState>({
    status: 'loading',
    loading: true
  })
  
  const [supplier, setSupplier] = useState<SupplierAuthData | null>(null)
  const [session, setSession] = useState<SessionData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastActivity, setLastActivity] = useState<Date>(new Date())
  const [currentWarehouse, setCurrentWarehouse] = useState<string | null>(null)
  const [isIdle, setIsIdle] = useState(false)
  const [idleTime, setIdleTime] = useState(0)
  
  // Refs for timers and intervals
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const idleCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<Date>(new Date())
  
  // Hooks
  const router = useRouter()
  const pathname = usePathname()

  // Computed values
  const isAuthenticated = authState.status === 'authenticated' && !!supplier
  const isLoading = authState.loading
  const availableWarehouses = supplier?.warehouseAccess?.map(w => w.warehouse) || []
  
  const timeUntilExpiry = session?.expiresAt 
    ? Math.max(0, session.expiresAt.getTime() - Date.now())
    : null

  /**
   * Track user activity
   */
  const trackActivity = useCallback(() => {
    const now = new Date()
    setLastActivity(now)
    lastActivityRef.current = now
    setIsIdle(false)
    setIdleTime(0)
  }, [])

  /**
   * Create security context from current environment
   */
  const createSecurityContext = useCallback((): SecurityContext => ({
    ipAddress: 'client-side', // Server-side will provide actual IP
    userAgent: navigator.userAgent,
    timestamp: new Date(),
    warehouse: currentWarehouse || undefined
  }), [currentWarehouse])

  /**
   * Handle authentication errors
   */
  const handleAuthError = useCallback((error: string, shouldLogout: boolean = false) => {
    console.error('Authentication error:', error)
    setError(error)
    
    if (shouldLogout) {
      setAuthState({
        status: 'unauthenticated',
        loading: false
      })
      setSupplier(null)
      setSession(null)
      
      if (redirectOnExpiry && !pathname.startsWith('/auth')) {
        router.push('/auth/login')
      }
    }
  }, [pathname, router, redirectOnExpiry])

  /**
   * Validate current session
   */
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/session`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError('Session expired', true)
          return false
        }
        throw new Error('Session validation failed')
      }

      const data = await response.json()
      
      if (data.success && data.supplier) {
        setSupplier(data.supplier)
        setSession(data.session)
        setCurrentWarehouse(data.session?.warehouse || data.supplier.warehouseAccess?.[0]?.warehouse || null)
        setAuthState({
          status: 'authenticated',
          supplier: data.supplier,
          session: data.session,
          loading: false
        })
        setError(null)
        return true
      } else {
        handleAuthError(data.error || 'Session invalid', true)
        return false
      }
    } catch (error) {
      console.error('Session validation error:', error)
      handleAuthError('Session validation failed', true)
      return false
    }
  }, [handleAuthError])

  /**
   * Refresh authentication tokens
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Warehouse': currentWarehouse || ''
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError('Session expired', true)
          return false
        }
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      
      if (data.success) {
        // Session will be updated via cookie
        console.log('Session refreshed successfully')
        return true
      } else {
        handleAuthError(data.error || 'Token refresh failed', true)
        return false
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      handleAuthError('Token refresh failed', true)
      return false
    }
  }, [currentWarehouse, handleAuthError])

  /**
   * Login function
   */
  const login = useCallback(async (
    email: string, 
    password: string, 
    warehouse?: string
  ): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      setError(null)

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          warehouse,
          rememberMe: false
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSupplier(data.supplier)
        setSession(data.session)
        setCurrentWarehouse(warehouse || data.supplier.warehouseAccess?.[0]?.warehouse || null)
        setAuthState({
          status: 'authenticated',
          supplier: data.supplier,
          session: data.session,
          loading: false
        })
        trackActivity()
        return true
      } else {
        handleAuthError(data.error || 'Login failed', false)
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      handleAuthError('Login failed', false)
      return false
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }))
    }
  }, [handleAuthError, trackActivity])

  /**
   * Logout function
   */
  const logout = useCallback(async (reason: string = 'USER_LOGOUT'): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear state regardless of API call success
      setAuthState({
        status: 'unauthenticated',
        loading: false
      })
      setSupplier(null)
      setSession(null)
      setCurrentWarehouse(null)
      setError(null)
      
      // Clear intervals
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current)
      }
      if (idleCheckInterval.current) {
        clearInterval(idleCheckInterval.current)
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }

      // Redirect to login
      if (redirectOnExpiry) {
        router.push('/auth/login')
      }
    }
  }, [router, redirectOnExpiry])

  /**
   * Switch warehouse
   */
  const switchWarehouse = useCallback(async (warehouse: string): Promise<boolean> => {
    try {
      if (!supplier?.warehouseAccess?.some(w => w.warehouse === warehouse)) {
        handleAuthError('No access to selected warehouse', false)
        return false
      }

      const response = await fetch(`${API_BASE_URL}/switch-warehouse`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ warehouse })
      })

      if (response.ok) {
        setCurrentWarehouse(warehouse)
        trackActivity()
        return true
      } else {
        handleAuthError('Failed to switch warehouse', false)
        return false
      }
    } catch (error) {
      console.error('Warehouse switch error:', error)
      handleAuthError('Failed to switch warehouse', false)
      return false
    }
  }, [supplier, handleAuthError, trackActivity])

  /**
   * Setup activity tracking
   */
  useEffect(() => {
    const handleActivity = () => trackActivity()
    
    // Activity event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [trackActivity])

  /**
   * Setup idle monitoring
   */
  useEffect(() => {
    if (!isAuthenticated) return

    const checkIdle = () => {
      const now = Date.now()
      const timeSinceActivity = now - lastActivityRef.current.getTime()
      
      setIdleTime(timeSinceActivity)
      
      // Show idle warning
      if (timeSinceActivity > IDLE_WARNING_TIME && !isIdle && showIdleWarning) {
        setIsIdle(true)
        console.warn('User has been idle for 5 minutes')
      }
      
      // Auto-logout after max idle time
      if (timeSinceActivity > MAX_IDLE_TIME) {
        console.warn('User exceeded maximum idle time, logging out')
        logout('IDLE_TIMEOUT')
      }
    }

    idleCheckInterval.current = setInterval(checkIdle, 30000) // Check every 30 seconds

    return () => {
      if (idleCheckInterval.current) {
        clearInterval(idleCheckInterval.current)
      }
    }
  }, [isAuthenticated, isIdle, showIdleWarning, logout])

  /**
   * Setup session monitoring and auto-refresh
   */
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return

    const checkSession = async () => {
      // Check if token needs refresh
      if (timeUntilExpiry && timeUntilExpiry < TOKEN_REFRESH_THRESHOLD) {
        console.log('Token expiring soon, refreshing...')
        await refreshSession()
      }
      
      // Validate session periodically
      await validateSession()
    }

    // Initial session check
    checkSession()

    // Setup periodic session checks
    sessionCheckInterval.current = setInterval(checkSession, SESSION_CHECK_INTERVAL)

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current)
      }
    }
  }, [isAuthenticated, autoRefresh, timeUntilExpiry, refreshSession, validateSession])

  /**
   * Initial session validation on mount
   */
  useEffect(() => {
    validateSession()
  }, [validateSession])

  // Context value
  const contextValue: SessionContextType = {
    // Auth state
    authState,
    supplier,
    session,
    
    // Session management
    login,
    logout,
    refreshSession,
    switchWarehouse,
    
    // Session status
    isAuthenticated,
    isLoading,
    error,
    lastActivity,
    timeUntilExpiry,
    
    // Warehouse management
    currentWarehouse,
    availableWarehouses,
    
    // Activity tracking
    trackActivity,
    isIdle,
    idleTime
  }

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  )
}

/**
 * Hook to use session context
 */
export function useSession(): SessionContextType {
  const context = useContext(SessionContext)
  
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  
  return context
}

/**
 * Session Guard Component
 * Protects routes that require authentication
 */
interface SessionGuardProps {
  children: React.ReactNode
  requiredWarehouse?: string
  requiredPermissions?: string[]
  fallback?: React.ReactNode
}

export function SessionGuard({ 
  children, 
  requiredWarehouse,
  requiredPermissions = [],
  fallback 
}: SessionGuardProps): JSX.Element {
  const { 
    isAuthenticated, 
    isLoading, 
    supplier, 
    currentWarehouse,
    error 
  } = useSession()
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Validating session...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error && !isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md border-2 border-red-100 max-w-md">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return fallback || <div>Redirecting to login...</div>
  }

  // Check warehouse access
  if (requiredWarehouse && currentWarehouse !== requiredWarehouse) {
    const hasAccess = supplier?.warehouseAccess?.some(w => w.warehouse === requiredWarehouse)
    
    if (!hasAccess) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow-md border-2 border-yellow-100 max-w-md">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
              <p className="text-gray-600">You don't have access to the {requiredWarehouse} warehouse.</p>
            </div>
          </div>
        </div>
      )
    }
  }

  // Check permissions
  if (requiredPermissions.length > 0) {
    const userPermissions = supplier?.warehouseAccess
      ?.find(w => w.warehouse === currentWarehouse)
      ?.permissions || []
    
    const hasAllPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    )
    
    if (!hasAllPermissions) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow-md border-2 border-red-100 max-w-md">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Insufficient Permissions</h3>
              <p className="text-gray-600">You don't have the required permissions to access this resource.</p>
            </div>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}