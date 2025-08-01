'use client'

import dynamic from 'next/dynamic'
import { useRef, useState, useEffect } from 'react'
import { useEngravingStore } from '@/lib/engraving-store'
import { toast } from 'react-hot-toast'

// Dynamically import the UnifiedBatteryEditor to ensure it's only loaded on client
const UnifiedBatteryEditor = dynamic(
  () => import('./UnifiedBatteryEditor'),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Customize Your Battery</h2>
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading battery editor...</p>
          </div>
        </div>
      </div>
    )
  }
)

interface ClientBatteryEditorProps {
  onGetPricing?: () => void
  onShareDesign?: () => void
}

export default function ClientBatteryEditor({ onGetPricing, onShareDesign }: ClientBatteryEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Initialize from store
    const store = useEngravingStore.getState()
    setLine1(store.line1 || '')
    setLine2(store.line2 || '')
  }, [])

  if (!mounted) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Customize Your Battery</h2>
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading battery editor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <UnifiedBatteryEditor 
      canvasRef={canvasRef}
      batteryImage="/images/battery-flexvolt.png"
      batteryData={{
        line1: line1,
        line2: line2
      }}
      onBatteryDataChange={(data) => {
        setLine1(data.line1)
        setLine2(data.line2)
        // Update store
        const store = useEngravingStore.getState()
        store.setLine1(data.line1)
        store.setLine2(data.line2)
      }}
      onGetPricing={onGetPricing || (() => {
        // Default behavior
        const batterySection = document.getElementById('battery-selection')
        if (batterySection) {
          batterySection.scrollIntoView({ behavior: 'smooth' })
        }
      })}
      onShareDesign={onShareDesign || (() => {
        // Default behavior
        toast.success('Share feature coming soon!')
      })}
    />
  )
}