'use client'

import React, { useRef } from 'react'
import dynamic from 'next/dynamic'

const InteractiveCanvas = dynamic(() => import('@/components/engraving/InteractiveCanvasFixed'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Loading interactive canvas...</p>
      </div>
    </div>
  )
})

export default function TestCanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Canvas Debug Test</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-semibold mb-4">Interactive Battery Preview</h2>
          
          <InteractiveCanvas
            canvasRef={canvasRef}
            batteryImage="/images/flexbat-battery.png"
            batteryData={{
              line1: 'TEST COMPANY',
              line2: '555-1234 • test.com',
              logo: ''
            }}
          />
        </div>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            This is a test page for the interactive canvas component. You can drag the text to reposition it and use pinch-to-zoom on mobile devices to resize.
          </p>
        </div>
      </div>
    </div>
  )
}