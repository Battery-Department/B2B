'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug, Clock, Shield, ArrowLeft, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [errorId, setErrorId] = useState<string>('')
  const [retryCount, setRetryCount] = useState(0)
  const [timestamp, setTimestamp] = useState<Date>(new Date())
  const [userAgent, setUserAgent] = useState<string>('Unknown')
  const [errorDetails, setErrorDetails] = useState<any>({})

  const maxRetries = 3

  useEffect(() => {
    // Generate unique error ID
    const id = `err_page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setErrorId(id)
    setUserAgent(navigator.userAgent)

    // Gather comprehensive error context
    const context = {
      errorId: id,
      timestamp: timestamp.toISOString(),
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      userId: localStorage.getItem('userId') || 'anonymous',
      sessionId: sessionStorage.getItem('sessionId') || 'no-session',
      warehouse: localStorage.getItem('selectedWarehouse') || 'US-West',
      userRole: localStorage.getItem('userRole') || 'guest',
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      },
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt
      } : null,
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null,
      timing: {
        navigationStart: performance.timing?.navigationStart,
        loadEventEnd: performance.timing?.loadEventEnd,
        domContentLoaded: performance.timing?.domContentLoadedEventEnd
      }
    }

    setErrorDetails(context)

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Page Error Boundary Triggered')
      console.error('Error:', error)
      console.table(context)
      console.groupEnd()
    }

    // Send to error monitoring service
    sendErrorToMonitoring(context)
  }, [error, timestamp])

  const sendErrorToMonitoring = async (errorData: any) => {
    try {
      await fetch('/api/errors/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...errorData,
          type: 'page_error',
          severity: 'critical',
          category: 'frontend',
          source: 'error_boundary'
        }),
      })
    } catch (e) {
      console.warn('Failed to send error to monitoring service:', e)
      
      // Fallback: try to save to localStorage for later sync
      try {
        const savedErrors = JSON.parse(localStorage.getItem('pendingErrors') || '[]')
        savedErrors.push({ ...errorData, savedAt: Date.now() })
        localStorage.setItem('pendingErrors', JSON.stringify(savedErrors.slice(-10))) // Keep last 10
      } catch {
        // Silently fail if localStorage is not available
      }
    }
  }

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1)
      reset()
    }
  }

  const handleReportIssue = () => {
    const subject = `Critical Page Error - ${errorId}`
    const body = `
ERROR REPORT - RHY SUPPLIER PORTAL
=====================================

Error ID: ${errorId}
Timestamp: ${timestamp.toISOString()}
Page URL: ${window.location.href}
User Agent: ${userAgent}

Error Details:
- Message: ${error.message}
- Digest: ${error.digest || 'N/A'}
- Retry Count: ${retryCount}

System Information:
- Warehouse: ${localStorage.getItem('selectedWarehouse') || 'US-West'}
- User Role: ${localStorage.getItem('userRole') || 'guest'}
- Session: ${sessionStorage.getItem('sessionId') || 'no-session'}

Please describe what you were doing when this error occurred:
[Your description here]

Critical FlexVolt Operations Impact:
[ ] Unable to process battery orders
[ ] Cannot access warehouse inventory
[ ] Supplier portal unavailable
[ ] Customer portal disrupted
[ ] Analytics dashboard down
[ ] Other: ________________

Priority Level:
[ ] Low - Minor inconvenience
[ ] Medium - Affects some operations
[ ] High - Impacts business operations
[ ] Critical - Complete system failure

Contact Information:
Name: ________________
Email: ________________
Phone: ________________
Company: ________________
Supplier ID: ________________

Additional Context:
________________
    `.trim()

    const mailtoLink = `mailto:critical-support@rhy-portal.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink)
  }

  const getErrorCategory = (): 'network' | 'runtime' | 'security' | 'performance' | 'unknown' => {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network'
    }
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'security'
    }
    if (message.includes('memory') || message.includes('performance') || message.includes('slow')) {
      return 'performance'
    }
    if (message.includes('undefined') || message.includes('null') || message.includes('cannot read')) {
      return 'runtime'
    }
    return 'unknown'
  }

  const getErrorGuidance = () => {
    const category = getErrorCategory()
    
    switch (category) {
      case 'network':
        return {
          title: 'Network Connection Issue',
          description: 'There seems to be a problem with your internet connection or our servers.',
          suggestions: [
            'Check your internet connection',
            'Try refreshing the page',
            'Contact your network administrator if using corporate network',
            'Switch to a different network if possible'
          ]
        }
      case 'security':
        return {
          title: 'Access Permission Error',
          description: 'You may not have sufficient permissions to access this resource.',
          suggestions: [
            'Check if you are logged in with the correct account',
            'Verify your user role and permissions',
            'Contact your system administrator',
            'Try logging out and back in'
          ]
        }
      case 'performance':
        return {
          title: 'Performance Related Issue',
          description: 'The application encountered a performance-related problem.',
          suggestions: [
            'Close unnecessary browser tabs',
            'Clear your browser cache',
            'Restart your browser',
            'Try using a different browser'
          ]
        }
      case 'runtime':
        return {
          title: 'Application Runtime Error',
          description: 'The application encountered an unexpected runtime error.',
          suggestions: [
            'Refresh the page to reload the application',
            'Clear your browser cache and cookies',
            'Try using an incognito/private browser window',
            'Update your browser to the latest version'
          ]
        }
      default:
        return {
          title: 'Unexpected Application Error',
          description: 'An unexpected error occurred in the RHY Supplier Portal.',
          suggestions: [
            'Try refreshing the page',
            'Clear your browser cache',
            'Try using a different browser',
            'Contact technical support if the issue persists'
          ]
        }
    }
  }

  const guidance = getErrorGuidance()
  const canRetry = retryCount < maxRetries

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            RHY Supplier Portal Error
          </h1>
          <p className="text-gray-600">
            Critical system error detected in FlexVolt battery operations
          </p>
        </div>

        {/* Main Error Card */}
        <Card className="bg-white border-2 border-red-200 p-8 mb-6 shadow-xl">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {guidance.title}
              </h2>
              
              <Alert className="mb-6 border-lithi-primary bg-blue-50">
                <AlertTriangle className="h-4 w-4 text-lithi-primary" />
                <AlertTitle className="text-gray-900">
                  Page Loading Failed
                </AlertTitle>
                <AlertDescription className="text-gray-700">
                  {guidance.description} Our engineering team has been automatically notified 
                  and is working to resolve this issue.
                </AlertDescription>
              </Alert>

              {/* Error Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">Time</span>
                  </div>
                  <p className="text-sm text-gray-700">{timestamp.toLocaleString()}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bug className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">Error ID</span>
                  </div>
                  <p className="text-sm text-gray-700 font-mono">{errorId}</p>
                </div>
              </div>

              {/* Troubleshooting Steps */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Recommended Actions:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {guidance.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {canRetry && (
                  <Button
                    onClick={handleRetry}
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
                  Reload Page
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>

                <Button
                  variant="outline"
                  onClick={handleReportIssue}
                  className="border-2 border-red-300 text-red-700 hover:bg-red-50 transition-all duration-300"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Report Critical Issue
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Technical Details (Collapsible) */}
        <Card className="bg-gray-50 border border-gray-200 p-6 mb-6">
          <details className="group">
            <summary className="cursor-pointer font-medium text-gray-800 flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Technical Details (For Support)
              <span className="ml-auto text-sm text-gray-500 group-open:hidden">Click to expand</span>
            </summary>
            <div className="mt-4 space-y-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Error Message:</strong>
                  <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-x-auto">
                    {error.message}
                  </pre>
                </div>
                <div>
                  <strong>Error Digest:</strong>
                  <pre className="mt-1 p-2 bg-white rounded border text-xs">
                    {error.digest || 'Not available'}
                  </pre>
                </div>
              </div>
              
              {error.stack && (
                <div>
                  <strong>Stack Trace:</strong>
                  <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-x-auto whitespace-pre-wrap max-h-40">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        </Card>

        {/* Emergency Support */}
        <Card className="bg-yellow-50 border-2 border-yellow-200 p-6">
          <div className="flex items-start gap-4">
            <Phone className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">
                Emergency FlexVolt Operations Support
              </h3>
              <p className="text-yellow-800 text-sm mb-3">
                If this error is impacting critical battery operations, warehouse management, 
                or customer orders, contact our 24/7 emergency support immediately.
              </p>
              <div className="space-y-2 text-sm">
                <div><strong>Emergency Hotline:</strong> 1-800-FLEXVOLT (1-800-353-9865)</div>
                <div><strong>Email:</strong> critical-support@rhy-portal.com</div>
                <div><strong>Escalation Code:</strong> RHY-CRITICAL-{errorId.slice(-8).toUpperCase()}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}