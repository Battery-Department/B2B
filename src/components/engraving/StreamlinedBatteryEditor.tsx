'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEngravingStore } from '@/lib/engraving-store'
import { 
  Minus, Plus, ShoppingCart, Share2, Mail, MessageSquare, 
  Facebook, Twitter, Linkedin, Copy, ChevronDown, Check
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface StreamlinedBatteryEditorProps {
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

export default function StreamlinedBatteryEditor({ 
  canvasRef, 
  batteryImage,
  batteryData,
  onBatteryDataChange,
  onGetPricing,
  onShareDesign
}: StreamlinedBatteryEditorProps) {
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
  const [showShareDropdown, setShowShareDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowShareDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  // Share functions
  const shareOptions = [
    { 
      icon: Mail, 
      label: 'Email', 
      action: () => {
        window.open(`mailto:?subject=Check out my custom FlexVolt battery&body=${encodeURIComponent('Check out my custom engraved FlexVolt battery design!')}`, '_blank')
        setShowShareDropdown(false)
      }
    },
    { 
      icon: MessageSquare, 
      label: 'Text Message', 
      action: () => {
        window.open(`sms:?body=${encodeURIComponent('Check out my custom FlexVolt battery design!')}`, '_blank')
        setShowShareDropdown(false)
      }
    },
    { 
      icon: Facebook, 
      label: 'Facebook', 
      action: () => {
        const url = encodeURIComponent(window.location.href)
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
        setShowShareDropdown(false)
      }
    },
    { 
      icon: Twitter, 
      label: 'Twitter', 
      action: () => {
        const text = encodeURIComponent('Check out my custom FlexVolt battery design!')
        const url = encodeURIComponent(window.location.href)
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
        setShowShareDropdown(false)
      }
    },
    { 
      icon: Linkedin, 
      label: 'LinkedIn', 
      action: () => {
        const url = encodeURIComponent(window.location.href)
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank')
        setShowShareDropdown(false)
      }
    },
    { 
      icon: MessageSquare, 
      label: 'WhatsApp', 
      action: () => {
        const text = encodeURIComponent('Check out my custom FlexVolt battery design!')
        const url = encodeURIComponent(window.location.href)
        window.open(`https://wa.me/?text=${text}%20${url}`, '_blank')
        setShowShareDropdown(false)
      }
    },
    { 
      icon: Copy, 
      label: 'Copy Link', 
      action: () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
        setShowShareDropdown(false)
      }
    }
  ]

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Battery Preview - Left/Top */}
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading battery preview...</p>
                </div>
              </div>
            )}
            
            <div className="relative flex justify-center lg:justify-start">
              <div className="w-full max-w-[90vw] sm:max-w-md lg:max-w-full">
                <canvas
                  ref={canvasRef}
                  className="block cursor-move w-full h-auto"
                  style={{ 
                    aspectRatio: '1',
                    maxHeight: '60vh',
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
          </div>

          {/* Editor Panel - Right/Bottom */}
          <div className="space-y-6 w-full lg:pt-12">
            {/* Line Toggle Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedLine('line1')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  selectedLine === 'line1'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Line 1
              </button>
              <button
                onClick={() => setSelectedLine('line2')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  selectedLine === 'line2'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Line 2
              </button>
            </div>

            {/* Text Entry Fields */}
            <div className="space-y-4">
            {/* Line 1 Editor */}
            <div className={`relative transition-all ${
              selectedLine === 'line1' ? 'ring-2 ring-blue-400' : ''
            }`}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Line 1</label>
              <div className="flex items-center gap-0">
                <input
                  type="text"
                  value={textBoxes.line1.text}
                  onChange={(e) => handleTextChange('line1', e.target.value)}
                  placeholder="Enter Line 1 text (e.g., YOUR NAME)"
                  className={`flex-1 px-4 py-3 bg-gray-50 border-0 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    selectedLine === 'line1' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedLine('line1')}
                />
                <div className="flex items-center bg-gray-50 px-2 rounded-r-lg">
                  <button
                    onClick={() => adjustFontSize('line1', -2)}
                    className="p-1.5 text-gray-600 hover:text-gray-800 transition-colors"
                    title="Decrease font size"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-gray-700 w-12 text-center select-none">
                    {textBoxes.line1.fontSize}px
                  </span>
                  <button
                    onClick={() => adjustFontSize('line1', 2)}
                    className="p-1.5 text-gray-600 hover:text-gray-800 transition-colors"
                    title="Increase font size"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Line 2 Editor */}
            <div className={`relative transition-all ${
              selectedLine === 'line2' ? 'ring-2 ring-blue-400' : ''
            }`}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Line 2</label>
              <div className="flex items-center gap-0">
                <input
                  type="text"
                  value={textBoxes.line2.text}
                  onChange={(e) => handleTextChange('line2', e.target.value)}
                  placeholder="Enter Line 2 text (e.g., PHONE • WEBSITE)"
                  className={`flex-1 px-4 py-3 bg-gray-50 border-0 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    selectedLine === 'line2' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedLine('line2')}
                />
                <div className="flex items-center bg-gray-50 px-2 rounded-r-lg">
                  <button
                    onClick={() => adjustFontSize('line2', -2)}
                    className="p-1.5 text-gray-600 hover:text-gray-800 transition-colors"
                    title="Decrease font size"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-gray-700 w-12 text-center select-none">
                    {textBoxes.line2.fontSize}px
                  </span>
                  <button
                    onClick={() => adjustFontSize('line2', 2)}
                    className="p-1.5 text-gray-600 hover:text-gray-800 transition-colors"
                    title="Increase font size"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {/* Send to Colleague Dropdown */}
              <div className="relative flex-1" ref={dropdownRef}>
                <button
                  onClick={() => setShowShareDropdown(!showShareDropdown)}
                  className="w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Send to Colleague
                  <ChevronDown className={`w-4 h-4 transition-transform ${showShareDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showShareDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50"
                    >
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-100">
                          Share via
                        </div>
                        {shareOptions.map((option, index) => (
                          <button
                            key={index}
                            onClick={option.action}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                          >
                            <option.icon className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Get Pricing Button */}
              <button
                onClick={onGetPricing}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Get Pricing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}