'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { useEngravingStore } from '@/lib/engraving-store'

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

export default function VerifyCanvasPage() {
  const { line1, line2, logo } = useEngravingStore()
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Interactive Canvas Verification</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Engraving Data</h2>
          <div className="space-y-2 text-sm text-gray-600 mb-6">
            <p><strong>Line 1:</strong> {line1 || 'Not set'}</p>
            <p><strong>Line 2:</strong> {line2 || 'Not set'}</p>
            <p><strong>Logo:</strong> {logo ? 'Uploaded' : 'Not set'}</p>
          </div>
          
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <InteractiveCanvas
              canvasRef={canvasRef}
              batteryImage="/images/flexbat-battery.png"
              batteryData={{
                line1: line1 || 'ACME CONSTRUCTION',
                line2: line2 || '555-0123 • acme.com',
                logo: logo || ''
              }}
            />
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Interactive Features:</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Click and drag text to reposition</li>
            <li>• On mobile: Use touch to drag text</li>
            <li>• On mobile: Pinch to zoom to resize text</li>
            <li>• Selected text will show a blue outline</li>
          </ul>
        </div>
      </div>
    </div>
  )
}