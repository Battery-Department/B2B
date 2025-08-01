'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug, Clock, Shield } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  enableRetry?: boolean
  maxRetries?: number
  resetOnLocationChange?: boolean
  showErrorDetails?: boolean
  level?: 'page' | 'component' | 'widget'
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
  errorId: string
  timestamp: Date
  userAgent: string
  userId?: string
  sessionId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null

  constructor(props: Props) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorId: '',
      timestamp: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      userId: this.getUserId(),
      sessionId: this.getSessionId()
    }
  }

  private getUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined
    try {
      return localStorage.getItem('userId') || undefined
    } catch {
      return undefined
    }
  }

  private getSessionId(): string | undefined {
    if (typeof window === 'undefined') return undefined
    try {
      return sessionStorage.getItem('sessionId') || undefined
    } catch {
      return undefined
    }
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      errorId: this.state.errorId,
      timestamp: this.state.timestamp.toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: this.state.userAgent,
      userId: this.state.userId,
      sessionId: this.state.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      retryCount: this.state.retryCount,
      level: this.props.level || 'component',
      // Additional FlexVolt business context
      warehouse: this.getWarehouseContext(),
      userRole: this.getUserRole(),
      currentPage: this.getCurrentPage()
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Triggered')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.table(errorData)
      console.groupEnd()
    }

    // Send to error monitoring service
    this.sendToErrorMonitoring(errorData)

    // Call custom error handler
    this.props.onError?.(error, errorInfo)
  }

  private getWarehouseContext(): string {
    if (typeof window === 'undefined') return 'Unknown'
    try {
      return localStorage.getItem('selectedWarehouse') || 'US-West'
    } catch {
      return 'Unknown'
    }
  }

  private getUserRole(): string {
    if (typeof window === 'undefined') return 'Unknown'
    try {
      return localStorage.getItem('userRole') || 'customer'
    } catch {
      return 'Unknown'
    }
  }

  private getCurrentPage(): string {
    if (typeof window === 'undefined') return 'Unknown'
    return window.location.pathname
  }

  private async sendToErrorMonitoring(errorData: any) {
    try {
      // Send to internal error tracking API
      await fetch('/api/errors/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      })
    } catch (e) {
      // Silently fail error reporting to avoid infinite loops
      console.warn('Failed to send error to monitoring service:', e)
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    this.logError(error, errorInfo)
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnLocationChange } = this.props
    const { hasError } = this.state

    if (hasError && resetOnLocationChange && typeof window !== 'undefined') {
      const currentLocation = window.location.href
      const prevLocation = (prevProps as any).location || currentLocation

      if (currentLocation !== prevLocation) {
        this.handleReset()
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  private handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3
    
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }))
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorId: '',
      timestamp: new Date()
    })
  }

  private handleReportIssue = () => {
    const { error, errorId, timestamp } = this.state
    const subject = `Error Report - ${errorId}`
    const body = `
Error ID: ${errorId}
Timestamp: ${timestamp.toISOString()}
Page: ${window.location.href}
Error: ${error?.message}

Please describe what you were doing when this error occurred:
[Your description here]
    `.trim()

    const mailtoLink = `mailto:support@flexvolt.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink)
  }

  private getErrorSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    const { error, level } = this.state
    const { level: propLevel } = this.props

    if (propLevel === 'page') return 'critical'
    if (propLevel === 'component') return 'high'
    if (error?.message.includes('Network') || error?.message.includes('fetch')) return 'medium'
    return 'low'
  }

  private renderErrorUI() {
    const { error, errorId, timestamp, retryCount } = this.state
    const { enableRetry = true, maxRetries = 3, showErrorDetails = false, level = 'component' } = this.props
    const severity = this.getErrorSeverity()
    const canRetry = enableRetry && retryCount < maxRetries

    const severityColors = {
      low: 'border-yellow-200 bg-yellow-50',
      medium: 'border-orange-200 bg-orange-50',
      high: 'border-red-200 bg-red-50',
      critical: 'border-red-300 bg-red-100'
    }

    const severityIcons = {
      low: AlertTriangle,
      medium: AlertTriangle,
      high: Bug,
      critical: Shield
    }

    const SeverityIcon = severityIcons[severity]

    return (
      <Card className={`w-full max-w-2xl mx-auto p-6 ${severityColors[severity]} border-2 transition-all duration-300`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <SeverityIcon 
              className={`h-6 w-6 ${
                severity === 'critical' ? 'text-red-600' :
                severity === 'high' ? 'text-red-500' :
                severity === 'medium' ? 'text-orange-500' :
                'text-yellow-600'
              }`} 
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {level === 'page' ? 'Page Error' : 'Component Error'}
            </h3>
            
            <div className="space-y-3">
              <Alert className="border-lithi-primary bg-white">
                <AlertTriangle className="h-4 w-4 text-lithi-primary" />
                <AlertTitle className="text-gray-900">
                  Something went wrong with the FlexVolt supplier portal
                </AlertTitle>
                <AlertDescription className="text-gray-700">
                  {level === 'page' 
                    ? 'The page encountered an unexpected error. Our team has been notified and is working on a fix.'
                    : 'A component on this page encountered an issue. You can try refreshing or continue using other features.'
                  }
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Error occurred at {timestamp.toLocaleString()}</span>
              </div>

              {showErrorDetails && error && (
                <details className="bg-gray-100 rounded-lg p-4">
                  <summary className="cursor-pointer font-medium text-gray-800">
                    Technical Details (Error ID: {errorId})
                  </summary>
                  <div className="mt-2 text-sm text-gray-700 font-mono">
                    <div><strong>Message:</strong> {error.message}</div>
                    {error.stack && (
                      <div className="mt-2">
                        <strong>Stack Trace:</strong>
                        <pre className="whitespace-pre-wrap text-xs mt-1 bg-gray-200 p-2 rounded">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    className="bg-lithi-primary hover:bg-lithi-primary-dark text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lithi-button"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="border-2 border-lithi-primary text-lithi-primary hover:bg-lithi-primary hover:text-white transition-all duration-300"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>

                <Button
                  variant="outline"
                  onClick={this.handleReportIssue}
                  className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              </div>

              <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                For immediate assistance with FlexVolt battery orders, contact your account manager 
                or call our 24/7 support line: 1-800-FLEXVOLT
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  render() {
    const { hasError } = this.state
    const { children, fallback } = this.props

    if (hasError) {
      if (fallback) {
        return fallback
      }
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-gray-50">
          {this.renderErrorUI()}
        </div>
      )
    }

    return children
  }
}

// Hook for functional components to trigger error boundaries
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: any) => {
    // This will trigger the nearest error boundary
    throw error
  }
}

// Higher-order component for easy wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

export default ErrorBoundary