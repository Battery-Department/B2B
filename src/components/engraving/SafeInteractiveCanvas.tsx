'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useEngravingStore } from '@/lib/engraving-store'

interface SafeInteractiveCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  batteryImage: string
  text?: string
  batteryData?: {
    line1: string
    line2: string
    logo: string
  }
}

export default function SafeInteractiveCanvas({ 
  canvasRef, 
  batteryImage, 
  text = "YOUR COMPANY",
  batteryData = { line1: '', line2: '', logo: '' }
}: SafeInteractiveCanvasProps) {
  const { fontSize, fontFamily, capturePreviewImage } = useEngravingStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAndDrawBattery = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        if (!canvasRef.current) {
          throw new Error('Canvas ref not available')
        }

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('Could not get canvas context')
        }

        // Load battery image
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = () => reject(new Error('Failed to load battery image'))
          img.src = batteryImage
        })

        // Set canvas dimensions
        const scaleFactor = 1.2
        canvas.width = img.width * scaleFactor
        canvas.height = img.height * scaleFactor

        // Draw battery
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Calculate text area
        const textArea = {
          x: canvas.width * 0.4605,
          y: canvas.height * 0.4873,
          width: canvas.width * 0.3373,
          height: canvas.height * 0.1645
        }

        // Draw text
        const fontScaleFactor = canvas.width / 1920
        const baseFontSize = fontSize * fontScaleFactor * 2.5

        // Line 1
        ctx.save()
        ctx.font = `bold ${baseFontSize * 1.1}px ${fontFamily}`
        ctx.fillStyle = '#000000'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
        ctx.shadowBlur = 2
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1
        
        const line1Text = (batteryData.line1 || 'YOUR COMPANY').toUpperCase()
        ctx.fillText(
          line1Text, 
          textArea.x + textArea.width / 2, 
          textArea.y + textArea.height * 0.35
        )
        ctx.restore()

        // Line 2
        ctx.save()
        ctx.font = `bold ${baseFontSize * 0.8}px ${fontFamily}`
        ctx.fillStyle = '#000000'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
        ctx.shadowBlur = 2
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1
        
        const line2Text = (batteryData.line2 || 'Phone • Website').toUpperCase()
        ctx.fillText(
          line2Text, 
          textArea.x + textArea.width / 2, 
          textArea.y + textArea.height * 0.65
        )
        ctx.restore()

        // Capture preview
        capturePreviewImage(canvas)
        setIsLoading(false)
      } catch (err) {
        console.error('Error in SafeInteractiveCanvas:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setIsLoading(false)
      }
    }

    loadAndDrawBattery()
  }, [canvasRef, batteryImage, batteryData.line1, batteryData.line2, fontSize, fontFamily, capturePreviewImage])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading preview</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-[451px] mx-auto">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-20">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading battery preview...</p>
          </div>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        className="block w-full"
        style={{ 
          maxWidth: '451px',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s'
        }}
      />
      
      <div className="mt-4 text-center text-xs text-gray-500">
        <p>Preview mode - Interactive features temporarily disabled</p>
      </div>
    </div>
  )
}