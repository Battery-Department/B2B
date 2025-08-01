'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEngravingStore } from '@/lib/engraving-store'
import { Move, ZoomIn, Download, Plus, Minus, Type, Info, MousePointer } from 'lucide-react'

interface InteractiveCanvasWithTooltipsProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  batteryImage: string
  text?: string
  batteryData?: {
    line1: string
    line2: string
    logo: string
  }
}

interface TextBox {
  x: number
  y: number
  width: number
  height: number
  text: string
  fontSize: number
  isSelected: boolean
}

interface Tooltip {
  id: string
  content: string
  visible: boolean
}

export default function InteractiveCanvasWithTooltips({ 
  canvasRef, 
  batteryImage, 
  text = "YOUR COMPANY",
  batteryData = { line1: '', line2: '', logo: '' }
}: InteractiveCanvasWithTooltipsProps) {
  const { 
    fontSize: globalFontSize, 
    fontFamily,
    capturePreviewImage 
  } = useEngravingStore()
  
  const [isLoading, setIsLoading] = useState(true)
  const [batteryImg, setBatteryImg] = useState<HTMLImageElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedText, setSelectedText] = useState<'line1' | 'line2' | null>(null)
  const [textBoxes, setTextBoxes] = useState<{ line1: TextBox, line2: TextBox }>({
    line1: { x: 0, y: 0, width: 0, height: 0, text: '', fontSize: globalFontSize || 28, isSelected: false },
    line2: { x: 0, y: 0, width: 0, height: 0, text: '', fontSize: globalFontSize || 28, isSelected: false }
  })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialTextPos, setInitialTextPos] = useState({ x: 0, y: 0 })
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [showInteractionHint, setShowInteractionHint] = useState(true)
  
  // Touch gesture states
  const [initialPinchDistance, setInitialPinchDistance] = useState(0)
  const [initialFontSize, setInitialFontSize] = useState(0)

  // Tooltip states
  const [tooltips, setTooltips] = useState<Tooltip[]>([
    { id: 'drag', content: 'Click and drag text to move it', visible: false },
    { id: 'resize', content: 'Select text then use +/- buttons to resize', visible: false }
  ])

  // Check if user has interacted before
  useEffect(() => {
    const hasInteracted = localStorage.getItem('battery-canvas-interacted')
    if (hasInteracted) {
      setShowInteractionHint(false)
    }
  }, [])

  // Memoize canvas dimensions to prevent recalculation
  const canvasDimensions = useMemo(() => {
    if (!batteryImg) return { width: 0, height: 0 }
    const scaleFactor = 1.35 // Increased by ~12.5%
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

  // Initialize canvas and text positions when battery image loads
  useEffect(() => {
    if (!batteryImg || !canvasRef.current || canvasDimensions.width === 0) return
    
    const canvas = canvasRef.current
    canvas.width = canvasDimensions.width
    canvas.height = canvasDimensions.height
    setCanvasSize(canvasDimensions)
    
    // Initialize text boxes with proper positions
    const line1Text = batteryData.line1 || text
    const line2Text = batteryData.line2 || ''
    
    setTextBoxes({
      line1: {
        x: canvas.width / 2,
        y: canvas.height / 2 - 20,
        width: 0,
        height: 0,
        text: line1Text,
        fontSize: globalFontSize || 28,
        isSelected: false
      },
      line2: {
        x: canvas.width / 2,
        y: canvas.height / 2 + 20,
        width: 0,
        height: 0,
        text: line2Text,
        fontSize: globalFontSize || 24,
        isSelected: false
      }
    })
  }, [batteryImg, canvasDimensions, text, batteryData, globalFontSize])

  // Render canvas
  const renderCanvas = () => {
    if (!canvasRef.current || !batteryImg) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw battery
    const scale = canvasDimensions.width / batteryImg.width
    ctx.drawImage(batteryImg, 0, 0, canvasDimensions.width, canvasDimensions.height)
    
    // Draw nameplate area
    const nameplateY = canvas.height * 0.38
    const nameplateHeight = canvas.height * 0.28
    
    // Draw text for each line
    Object.entries(textBoxes).forEach(([key, box]) => {
      if (box.text) {
        ctx.save()
        
        // Set font
        ctx.font = `bold ${box.fontSize}px ${fontFamily}`
        ctx.fillStyle = '#000000'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        // Draw selection indicator
        if (box.isSelected) {
          const metrics = ctx.measureText(box.text.toUpperCase())
          const padding = 10
          ctx.strokeStyle = '#006FEE'
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
  }, [textBoxes, batteryImg, fontFamily])

  // Mouse event handlers
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
    
    let clickedText: 'line1' | 'line2' | null = null
    
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
        clickedText = key as 'line1' | 'line2'
      }
    })
    
    if (clickedText) {
      setSelectedText(clickedText)
      setIsDragging(true)
      setDragStart({ x, y })
      setInitialTextPos({ 
        x: textBoxes[clickedText].x, 
        y: textBoxes[clickedText].y 
      })
      
      // Update selection state
      setTextBoxes(prev => ({
        line1: { ...prev.line1, isSelected: clickedText === 'line1' },
        line2: { ...prev.line2, isSelected: clickedText === 'line2' }
      }))
      
      // Hide hint after first interaction
      if (showInteractionHint) {
        setShowInteractionHint(false)
        localStorage.setItem('battery-canvas-interacted', 'true')
      }
    } else {
      setSelectedText(null)
      setTextBoxes(prev => ({
        line1: { ...prev.line1, isSelected: false },
        line2: { ...prev.line2, isSelected: false }
      }))
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedText || !canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    const deltaX = x - dragStart.x
    const deltaY = y - dragStart.y
    
    setTextBoxes(prev => ({
      ...prev,
      [selectedText]: {
        ...prev[selectedText],
        x: initialTextPos.x + deltaX,
        y: initialTextPos.y + deltaY
      }
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      setInitialPinchDistance(distance)
      setInitialFontSize(selectedText ? textBoxes[selectedText].fontSize : globalFontSize || 28)
    } else if (e.touches.length === 1) {
      // Convert touch to mouse event
      const touch = e.touches[0]
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      handleMouseDown(mouseEvent as any)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance > 0 && selectedText) {
      // Handle pinch zoom
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      
      const scale = currentDistance / initialPinchDistance
      const newFontSize = Math.max(16, Math.min(48, initialFontSize * scale))
      
      setTextBoxes(prev => ({
        ...prev,
        [selectedText]: {
          ...prev[selectedText],
          fontSize: Math.round(newFontSize)
        }
      }))
    } else if (e.touches.length === 1) {
      const touch = e.touches[0]
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      handleMouseMove(mouseEvent as any)
    }
  }

  const handleTouchEnd = () => {
    setInitialPinchDistance(0)
    handleMouseUp()
  }

  // Text size controls
  const adjustTextSize = (increment: number) => {
    if (!selectedText) return
    
    setTextBoxes(prev => ({
      ...prev,
      [selectedText]: {
        ...prev[selectedText],
        fontSize: Math.max(16, Math.min(48, prev[selectedText].fontSize + increment))
      }
    }))
  }

  // Export function
  const handleExport = async () => {
    if (!canvasRef.current) return
    
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png')
      await capturePreviewImage(dataUrl)
      
      // Download the image
      const link = document.createElement('a')
      link.download = 'battery-preview.png'
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Failed to export canvas:', error)
    }
  }

  return (
    <div className="relative w-full flex flex-col items-center" id="battery-preview">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-20">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading battery preview...</p>
          </div>
        </div>
      )}
      
      <div className="relative">
        {/* Text Size Controls - Positioned above the battery metal plate */}
        {!isLoading && canvasSize.width > 0 && selectedText && (
          <div className="absolute top-[35%] left-1/2 transform -translate-x-1/2 -translate-y-full hidden sm:flex z-10">
            <div id="text-size-controls" className="flex items-center gap-2 bg-white rounded-[10px] shadow-md px-3 py-1.5" style={{boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)'}}>
              <button
                onClick={() => adjustTextSize(-2)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Decrease text size"
              >
                <Minus className="w-3 h-3 text-gray-600" />
              </button>
              <span className="text-sm font-bold text-gray-900 min-w-[45px] text-center">
                {textBoxes[selectedText].fontSize}px
              </span>
              <button
                onClick={() => adjustTextSize(2)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Increase text size"
              >
                <Plus className="w-3 h-3 text-gray-600" />
              </button>
            </div>
          </div>
        )}
        
        <canvas
          id="battery-canvas"
          ref={canvasRef}
          className="block w-full cursor-move mx-auto"
          style={{ 
            maxWidth: '497px', // Increased by ~10%
            height: canvasSize.height > 0 ? `${canvasSize.height * (497 / canvasSize.width)}px` : 'auto',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s',
            touchAction: 'none'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        
        {/* Pulsing outline when line is selected */}
        {selectedText && !isLoading && (
          <div className="absolute inset-0 pointer-events-none">
            <div 
              className="absolute animate-pulse"
              style={{
                top: '38%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '65%',
                height: '28%',
                border: '2px solid rgba(0, 111, 238, 0.5)',
                borderRadius: '4px',
                boxShadow: '0 0 0 2px rgba(0, 111, 238, 0.2)'
              }}
            />
          </div>
        )}
        
        {/* Interactive Hint Overlay */}
        {!isLoading && showInteractionHint && textBoxes.line1.text && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <MousePointer className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Click text to select, then drag to move!</span>
              <span className="text-sm font-medium sm:hidden">Tap text to select, drag to move!</span>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Help text below canvas */}
      {!isLoading && (
        <div className="mt-4 text-center">
          {selectedText ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-blue-600 font-medium flex items-center justify-center gap-2"
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">
                Editing {selectedText === 'line1' ? 'Line 1' : 'Line 2'} • Drag to move • Use +/- to resize
              </span>
              <span className="sm:hidden">
                Editing {selectedText === 'line1' ? 'Line 1' : 'Line 2'} • Drag to move • Pinch to resize
              </span>
            </motion.p>
          ) : textBoxes.line1.text ? (
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <MousePointer className="w-4 h-4" />
              <span className="hidden sm:inline">Click on text to select and edit</span>
              <span className="sm:hidden">Tap text to select • Drag to move • Pinch to resize</span>
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}