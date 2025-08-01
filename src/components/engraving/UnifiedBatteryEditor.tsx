'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEngravingStore } from '@/lib/engraving-store'
import { Minus, Plus, Trash2, Share2, ShoppingCart, Type } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface UnifiedBatteryEditorProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  batteryImage: string
  batteryData: {
    line1: string
    line2: string
  }
  onBatteryDataChange: (data: { line1: string; line2: string }) => void
  onGetPricing: () => void
  onShareDesign: () => void
}

interface TextBox {
  x: number
  y: number
  text: string
  fontSize: number
}

export default function UnifiedBatteryEditor({ 
  canvasRef, 
  batteryImage,
  batteryData,
  onBatteryDataChange,
  onGetPricing,
  onShareDesign
}: UnifiedBatteryEditorProps) {
  const { fontFamily, capturePreviewImage } = useEngravingStore()
  
  const [isLoading, setIsLoading] = useState(true)
  const [batteryImg, setBatteryImg] = useState<HTMLImageElement | null>(null)
  const [selectedLine, setSelectedLine] = useState<'line1' | 'line2'>('line1')
  const [textBoxes, setTextBoxes] = useState<{ line1: TextBox, line2: TextBox }>({
    line1: { x: 0, y: 0, text: batteryData.line1 || '', fontSize: 28 },
    line2: { x: 0, y: 0, text: batteryData.line2 || '', fontSize: 24 }
  })
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialTextPos, setInitialTextPos] = useState({ x: 0, y: 0 })

  // Memoize canvas dimensions
  const canvasDimensions = useMemo(() => {
    if (!batteryImg) return { width: 0, height: 0 }
    const scaleFactor = 1.35
    return {
      width: batteryImg.width * scaleFactor,
      height: batteryImg.height * scaleFactor
    }
  }, [batteryImg])

  // Load battery image
  useEffect(() => {
    let mounted = true
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      if (mounted) {
        setBatteryImg(img)
        setIsLoading(false)
      }
    }
    
    img.onerror = () => {
      if (mounted) {
        console.error('Failed to load battery image')
        setIsLoading(false)
      }
    }
    
    img.src = batteryImage
    
    return () => { mounted = false }
  }, [batteryImage])

  // Initialize canvas and text positions
  useEffect(() => {
    if (!batteryImg || !canvasRef.current || canvasDimensions.width === 0) return
    
    const canvas = canvasRef.current
    canvas.width = canvasDimensions.width
    canvas.height = canvasDimensions.height
    setCanvasSize(canvasDimensions)
    
    // Initialize text positions
    setTextBoxes({
      line1: {
        x: canvas.width / 2,
        y: canvas.height / 2 - 20,
        text: batteryData.line1 || '',
        fontSize: 28
      },
      line2: {
        x: canvas.width / 2,
        y: canvas.height / 2 + 20,
        text: batteryData.line2 || '',
        fontSize: 24
      }
    })
  }, [batteryImg, canvasDimensions, batteryData])

  // Render canvas
  const renderCanvas = () => {
    if (!canvasRef.current || !batteryImg) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw battery
    ctx.drawImage(batteryImg, 0, 0, canvasDimensions.width, canvasDimensions.height)
    
    // Draw text for each line
    Object.entries(textBoxes).forEach(([key, box]) => {
      if (box.text) {
        ctx.save()
        
        // Set font
        ctx.font = `bold ${box.fontSize}px ${fontFamily}`
        ctx.fillStyle = '#000000'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        // Draw selection indicator for selected line
        if (key === selectedLine) {
          const metrics = ctx.measureText(box.text.toUpperCase())
          const padding = 10
          ctx.strokeStyle = '#0055FF'
          ctx.lineWidth = 2
          ctx.setLineDash([5, 5])
          ctx.strokeRect(
            box.x - metrics.width / 2 - padding,
            box.y - box.fontSize / 2 - padding / 2,
            metrics.width + padding * 2,
            box.fontSize + padding
          )
          ctx.setLineDash([])
        }
        
        // Draw text
        ctx.fillText(box.text.toUpperCase(), box.x, box.y)
        
        ctx.restore()
      }
    })
  }

  // Re-render when text boxes change
  useEffect(() => {
    renderCanvas()
  }, [textBoxes, batteryImg, fontFamily, selectedLine])

  // Handle text changes
  const handleTextChange = (line: 'line1' | 'line2', value: string) => {
    setTextBoxes(prev => ({
      ...prev,
      [line]: { ...prev[line], text: value }
    }))
    onBatteryDataChange({
      ...batteryData,
      [line]: value
    })
  }

  // Handle font size changes
  const adjustFontSize = (line: 'line1' | 'line2', increment: number) => {
    setTextBoxes(prev => ({
      ...prev,
      [line]: {
        ...prev[line],
        fontSize: Math.max(16, Math.min(48, prev[line].fontSize + increment))
      }
    }))
  }

  // Mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    // Check if clicking on text
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    
    Object.entries(textBoxes).forEach(([key, box]) => {
      ctx.font = `bold ${box.fontSize}px ${fontFamily}`
      const metrics = ctx.measureText(box.text.toUpperCase())
      const textHeight = box.fontSize
      
      if (
        x >= box.x - metrics.width / 2 - 10 &&
        x <= box.x + metrics.width / 2 + 10 &&
        y >= box.y - textHeight / 2 - 5 &&
        y <= box.y + textHeight / 2 + 5
      ) {
        setSelectedLine(key as 'line1' | 'line2')
        setIsDragging(true)
        setDragStart({ x, y })
        setInitialTextPos({ x: box.x, y: box.y })
      }
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    const deltaX = x - dragStart.x
    const deltaY = y - dragStart.y
    
    setTextBoxes(prev => ({
      ...prev,
      [selectedLine]: {
        ...prev[selectedLine],
        x: initialTextPos.x + deltaX,
        y: initialTextPos.y + deltaY
      }
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Clear all text
  const handleClearAll = () => {
    const clearedData = { line1: '', line2: '' }
    onBatteryDataChange(clearedData)
    setTextBoxes(prev => ({
      line1: { ...prev.line1, text: '' },
      line2: { ...prev.line2, text: '' }
    }))
    toast.success('All text cleared')
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Battery Preview */}
      <div className="relative mb-6">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-20">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading battery preview...</p>
            </div>
          </div>
        )}
        
        <div className="relative flex justify-center">
          <canvas
            ref={canvasRef}
            className="block cursor-move"
            style={{ 
              maxWidth: '497px',
              width: '100%',
              height: canvasSize.height > 0 ? `${canvasSize.height * (497 / canvasSize.width)}px` : 'auto',
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.3s'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>

      {/* Unified Editing Panel */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-6">
        {/* Line Toggle Buttons */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setSelectedLine('line1')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              selectedLine === 'line1'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Line 1
          </button>
          <button
            onClick={() => setSelectedLine('line2')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              selectedLine === 'line2'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Line 2
          </button>
        </div>

        {/* Text Entry Fields with Inline Font Size Controls */}
        <div className="space-y-4">
          {/* Line 1 Editor */}
          <div className={`p-4 rounded-lg border-2 transition-all ${
            selectedLine === 'line1' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-sm font-semibold text-gray-700">Line 1</label>
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => adjustFontSize('line1', -2)}
                  className="p-1 hover:bg-white rounded transition-colors"
                  title="Decrease font size"
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-[40px] text-center">
                  {textBoxes.line1.fontSize}px
                </span>
                <button
                  onClick={() => adjustFontSize('line1', 2)}
                  className="p-1 hover:bg-white rounded transition-colors"
                  title="Increase font size"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            <input
              type="text"
              value={textBoxes.line1.text}
              onChange={(e) => handleTextChange('line1', e.target.value)}
              placeholder="Enter Line 1 text (e.g., YOUR NAME)"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onClick={() => setSelectedLine('line1')}
            />
          </div>

          {/* Line 2 Editor */}
          <div className={`p-4 rounded-lg border-2 transition-all ${
            selectedLine === 'line2' ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-sm font-semibold text-gray-700">Line 2</label>
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => adjustFontSize('line2', -2)}
                  className="p-1 hover:bg-white rounded transition-colors"
                  title="Decrease font size"
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-[40px] text-center">
                  {textBoxes.line2.fontSize}px
                </span>
                <button
                  onClick={() => adjustFontSize('line2', 2)}
                  className="p-1 hover:bg-white rounded transition-colors"
                  title="Increase font size"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            <input
              type="text"
              value={textBoxes.line2.text}
              onChange={(e) => handleTextChange('line2', e.target.value)}
              placeholder="Enter Line 2 text (e.g., PHONE • WEBSITE)"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onClick={() => setSelectedLine('line2')}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleClearAll}
            className="flex-1 px-6 py-3 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Clear All
          </button>
          
          <button
            onClick={onShareDesign}
            className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Send to Colleague
          </button>
          
          <button
            onClick={onGetPricing}
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Get Pricing
          </button>
        </div>
      </div>
    </div>
  )
}