'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEngravingStore } from '@/lib/engraving-store'
import { 
  Minus, Plus, ShoppingCart, Share2, Mail, MessageSquare, 
  Facebook, Twitter, Linkedin, Copy, ChevronDown, Hash, Link,
  Shield, ScanLine
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createPortal } from 'react-dom'
import { BatteryTrackingDemoModal } from '@/components/tracking/BatteryTrackingDemoModal'

interface FullScreenBatteryEditorProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  batteryImage: string
  batteryData: {
    line1: string
    line2: string
  }
  onBatteryDataChange: (data: { line1: string; line2: string }) => void
  onGetPricing: () => void
  onShareDesign?: () => void
}

interface TextBox {
  x: number
  y: number
  text: string
  fontSize: number
}

export default function FullScreenBatteryEditor({ 
  canvasRef, 
  batteryImage,
  batteryData,
  onBatteryDataChange,
  onGetPricing,
  onShareDesign
}: FullScreenBatteryEditorProps) {
  const { fontFamily, capturePreviewImage } = useEngravingStore()
  
  const [isLoading, setIsLoading] = useState(true)
  const [batteryImg, setBatteryImg] = useState<HTMLImageElement | null>(null)
  const [selectedLine, setSelectedLine] = useState<'line1' | 'line2'>('line1')
  const [textBoxes, setTextBoxes] = useState<{ line1: TextBox, line2: TextBox }>({
    line1: { x: 0, y: 0, text: batteryData.line1 || '', fontSize: 28 },
    line2: { x: 0, y: 0, text: batteryData.line2 || '', fontSize: 30 }
  })
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialTextPos, setInitialTextPos] = useState({ x: 0, y: 0 })
  const [showTrackingModal, setShowTrackingModal] = useState(false)


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
        fontSize: 30
      }
    })
    
    // Save initial data to localStorage
    if (typeof window !== 'undefined') {
      if (batteryData.line1) {
        localStorage.setItem('engravingPrimaryText', batteryData.line1)
      }
      if (batteryData.line2) {
        localStorage.setItem('engravingSecondaryText', batteryData.line2)
      }
    }
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
    
    // Define text area - CENTER text on entire nameplate
    // Based on precise measurements: nameplate spans from 22.5% to 80.2% (width: 57.7%)
    const nameplateArea = {
      x: canvas.width * 0.225,       // 22.5% from left
      y: canvas.height * 0.525,      // 52.5% from top
      width: canvas.width * 0.577,    // 57.7% width
      height: canvas.height * 0.141   // 14.1% height
    }
    
    // Calculate absolute center of nameplate
    const nameplateCenterX = nameplateArea.x + (nameplateArea.width / 2)  // 51.35% of canvas
    const nameplateCenterY = nameplateArea.y + (nameplateArea.height / 2) // 59.55% of canvas
    
    // Draw text with proper positioning
    if (textBoxes.line1.text) {
      ctx.save()
      
      // Set font with precise sizing from HTML tool
      const fontScaleFactor = canvas.width / 1920
      const scaledFontSize = 31 * fontScaleFactor * 2.5  // 31px as determined by positioning tool
      
      ctx.font = `bold ${scaledFontSize}px 'Poppins', ${fontFamily}`
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Add engraving depth effect
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
      ctx.shadowBlur = 2
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1
      
      // Position line 1 - using precise positioning from HTML tool
      const line1X = canvas.width * 0.616   // 61.6% from left
      const line1Y = canvas.height * 0.536  // 53.6% from top (56.1% - 2.5%)
      
      // Draw text with engraving effect
      ctx.fillText(textBoxes.line1.text.toUpperCase(), line1X, line1Y)
      ctx.globalAlpha = 0.3
      ctx.fillText(textBoxes.line1.text.toUpperCase(), line1X + 0.5, line1Y + 0.5)
      ctx.globalAlpha = 1
      
      ctx.restore()
    }
    
    if (textBoxes.line2.text) {
      ctx.save()
      
      // Set font with precise sizing from HTML tool (smaller for line 2)
      const fontScaleFactor = canvas.width / 1920
      const scaledFontSize = 21 * fontScaleFactor * 2.5  // 21px as determined by positioning tool
      
      ctx.font = `bold ${scaledFontSize}px 'Poppins', ${fontFamily}`
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Add engraving depth effect
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
      ctx.shadowBlur = 2
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1
      
      // Position line 2 - using precise positioning from HTML tool
      const line2X = canvas.width * 0.616   // 61.6% from left
      const line2Y = canvas.height * 0.615  // 61.5% from top (64% - 2.5%)
      
      // Draw text with engraving effect
      ctx.fillText(textBoxes.line2.text.toUpperCase(), line2X, line2Y)
      ctx.globalAlpha = 0.3
      ctx.fillText(textBoxes.line2.text.toUpperCase(), line2X + 0.5, line2Y + 0.5)
      ctx.globalAlpha = 1
      
      ctx.restore()
    }
  }

  // Re-render when text boxes change
  useEffect(() => {
    renderCanvas()
    // Capture preview after rendering
    if (canvasRef.current && batteryImg) {
      setTimeout(() => {
        if (canvasRef.current) {
          capturePreviewImage(canvasRef.current)
        }
      }, 100)
    }
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
    
    // Save to localStorage for the modal to access
    if (typeof window !== 'undefined') {
      if (line === 'line1') {
        localStorage.setItem('engravingPrimaryText', value)
      } else if (line === 'line2') {
        localStorage.setItem('engravingSecondaryText', value)
      }
    }
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


  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Battery Preview - Left/Top */}
          <div className="relative flex items-center justify-center">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading battery preview...</p>
                </div>
              </div>
            )}
            
            <div className="relative w-full max-w-[500px] mx-auto">
              <canvas
                ref={canvasRef}
                className="block w-full h-auto select-none"
                style={{ 
                  aspectRatio: '1',
                  maxHeight: '500px',
                  opacity: isLoading ? 0 : 1,
                  transition: 'opacity 0.3s',
                  cursor: 'default',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none'
                }}
              />
            </div>
          </div>

          {/* Editor Panel - Right/Bottom */}
          <div className="w-full max-w-[500px] mx-auto lg:mx-0">
            {/* Line Toggle Buttons */}
            <div className="flex gap-2 mb-6">
              <motion.button
                onClick={() => setSelectedLine('line1')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  selectedLine === 'line1'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                Line 1
              </motion.button>
              <motion.button
                onClick={() => setSelectedLine('line2')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  selectedLine === 'line2'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                Line 2
              </motion.button>
            </div>

            {/* Text Entry Fields */}
            <div className="space-y-5">
              {/* Line 1 Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Line 1</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={textBoxes.line1.text}
                    onChange={(e) => handleTextChange('line1', e.target.value)}
                    placeholder="Enter Line 1 text (e.g., YOUR NAME)"
                    className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onClick={() => setSelectedLine('line1')}
                  />
                  <motion.button
                    onClick={() => adjustFontSize('line1', -2)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                    title="Decrease font size"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <Minus className="w-4 h-4" />
                  </motion.button>
                  <span className="text-sm font-medium text-gray-600 min-w-[40px] text-center select-none">
                    {textBoxes.line1.fontSize}px
                  </span>
                  <motion.button
                    onClick={() => adjustFontSize('line1', 2)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                    title="Increase font size"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Line 2 Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Line 2</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={textBoxes.line2.text}
                    onChange={(e) => handleTextChange('line2', e.target.value)}
                    placeholder="Enter Line 2 text (e.g., PHONE • WEBSITE)"
                    className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onClick={() => setSelectedLine('line2')}
                  />
                  <motion.button
                    onClick={() => adjustFontSize('line2', -2)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                    title="Decrease font size"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <Minus className="w-4 h-4" />
                  </motion.button>
                  <span className="text-sm font-medium text-gray-600 min-w-[40px] text-center select-none">
                    {textBoxes.line2.fontSize}px
                  </span>
                  <motion.button
                    onClick={() => adjustFontSize('line2', 2)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                    title="Increase font size"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              {/* QR Tracking Demo Button */}
              <motion.button
                onClick={() => setShowTrackingModal(true)}
                className="flex-1 px-6 py-3.5 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:border-blue-600 transition-all duration-200 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <ScanLine className="w-5 h-5" />
                Demo: How Your QR Tracking Works
              </motion.button>
              
              {/* Get Pricing Button */}
              <motion.button
                onClick={onGetPricing}
                className="flex-1 px-6 py-3.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02, y: -2, boxShadow: '0 20px 25px -5px rgba(0, 111, 238, 0.3)' }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <ShoppingCart className="w-5 h-5" />
                Get Pricing
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Battery Tracking Modal */}
      <BatteryTrackingDemoModal
        isOpen={showTrackingModal}
        onClose={() => setShowTrackingModal(false)}
        onContinue={onGetPricing}
      />
    </div>
  )
}