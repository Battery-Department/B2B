'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Design page error:', error)
  }, [error])

  const handleReset = () => {
    // Clear potentially problematic localStorage items
    try {
      localStorage.removeItem('battery-design-tour-completed')
      localStorage.removeItem('battery-design-tour-skipped')
    } catch (e) {
      console.error('Error clearing localStorage:', e)
    }
    reset()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong!</h2>
        <p className="text-gray-600 mb-4">We encountered an error while loading the design page.</p>
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-700 font-mono break-words">{error.message}</p>
          </div>
        )}
        <button
          onClick={handleReset}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}