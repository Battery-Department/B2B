'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useEngravingStore } from '@/lib/engraving-store'

interface DebugInteractiveCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  batteryImage: string
  text?: string
  batteryData?: {
    line1: string
    line2: string
    logo: string
  }
}

interface DebugLog {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
  data?: any
}

export default function DebugInteractiveCanvas({ 
  canvasRef, 
  batteryImage, 
  text = "YOUR COMPANY",
  batteryData = { line1: '', line2: '', logo: '' }
}: DebugInteractiveCanvasProps) {
  const [logs, setLogs] = useState<DebugLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { fontSize, fontFamily, capturePreviewImage } = useEngravingStore()
  
  const addLog = (level: DebugLog['level'], message: string, data?: any) => {
    const log: DebugLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    }
    console.log(`[${level.toUpperCase()}] ${message}`, data || '')
    setLogs(prev => [...prev, log])
  }

  useEffect(() => {
    addLog('info', 'Component mounted', { batteryImage, batteryData })
    
    // Check if canvas ref is available
    if (!canvasRef.current) {
      addLog('error', 'Canvas ref not available')
      setError('Canvas reference not provided')
      return
    }
    
    // Check browser capabilities
    if (typeof window === 'undefined') {
      addLog('error', 'Window object not available (SSR)')
      setError('Component must be rendered on client side')
      return
    }
    
    // Check canvas support
    const testCanvas = document.createElement('canvas')
    if (!testCanvas.getContext) {
      addLog('error', 'Canvas not supported by browser')
      setError('Canvas API not supported')
      return
    }
    
    // Load battery image
    addLog('info', 'Starting battery image load')
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      addLog('info', 'Battery image loaded successfully', {
        width: img.width,
        height: img.height,
        src: img.src
      })
      
      try {
        // Initialize canvas
        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          throw new Error('Could not get 2D context')
        }
        
        // Set canvas dimensions
        const scaleFactor = 1.2
        canvas.width = img.width * scaleFactor
        canvas.height = img.height * scaleFactor
        
        addLog('info', 'Canvas initialized', {
          width: canvas.width,
          height: canvas.height
        })
        
        // Draw battery
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Draw text
        const textArea = {
          x: canvas.width * 0.4605,
          y: canvas.height * 0.4873,
          width: canvas.width * 0.3373,
          height: canvas.height * 0.1645
        }
        
        const fontScaleFactor = canvas.width / 1920
        const baseFontSize = fontSize * fontScaleFactor * 2.5
        
        // Line 1
        ctx.save()
        ctx.font = `bold ${baseFontSize * 1.1}px ${fontFamily}`
        ctx.fillStyle = '#000000'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(
          (batteryData.line1 || 'YOUR COMPANY').toUpperCase(),
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
        ctx.fillText(
          (batteryData.line2 || 'Phone • Website').toUpperCase(),
          textArea.x + textArea.width / 2,
          textArea.y + textArea.height * 0.65
        )
        ctx.restore()
        
        addLog('info', 'Canvas rendering complete')
        
        // Capture preview
        if (capturePreviewImage) {
          capturePreviewImage(canvas)
          addLog('info', 'Preview image captured')
        }
        
        setIsLoading(false)
      } catch (err) {
        addLog('error', 'Canvas rendering failed', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setIsLoading(false)
      }
    }
    
    img.onerror = (e) => {
      addLog('error', 'Failed to load battery image', {
        src: img.src,
        error: e
      })
      setError('Failed to load battery image')
      setIsLoading(false)
    }
    
    img.src = batteryImage
    
    return () => {
      addLog('info', 'Component unmounting')
    }
  }, [batteryImage, batteryData, canvasRef, fontSize, fontFamily, capturePreviewImage])

  return (
    <div className="relative w-full max-w-[451px] mx-auto">
      {/* Debug Panel */}
      <div className="absolute top-0 left-0 right-0 bg-black/80 text-white p-4 rounded-t-lg max-h-40 overflow-y-auto text-xs font-mono">
        <div className="font-bold mb-2">Debug Console</div>
        {logs.map((log, i) => (
          <div key={i} className={`mb-1 ${
            log.level === 'error' ? 'text-red-400' : 
            log.level === 'warn' ? 'text-yellow-400' : 
            'text-green-400'
          }`}>
            [{log.timestamp.split('T')[1].split('.')[0]}] {log.level.toUpperCase()}: {log.message}
            {log.data && <pre className="ml-4 text-gray-300">{JSON.stringify(log.data, null, 2)}</pre>}
          </div>
        ))}
      </div>
      
      {/* Main Canvas Area */}
      <div className="pt-48">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 font-semibold">Error</p>
            <p className="text-red-500">{error}</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center bg-gray-50 rounded-lg p-8">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading battery preview...</p>
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="block w-full"
            style={{ maxWidth: '451px' }}
          />
        )}
      </div>
    </div>
  )
}