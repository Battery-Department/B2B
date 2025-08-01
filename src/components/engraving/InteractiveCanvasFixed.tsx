'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEngravingStore } from '@/lib/engraving-store'
import { Move, ZoomIn, Download } from 'lucide-react'

interface InteractiveCanvasFixedProps {
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

export default function InteractiveCanvasFixed({ 
  canvasRef, 
  batteryImage, 
  text = "YOUR COMPANY",
  batteryData = { line1: '', line2: '', logo: '' }
}: InteractiveCanvasFixedProps) {
  const { 
    fontSize, 
    fontFamily,
    capturePreviewImage 
  } = useEngravingStore()
  
  const [isLoading, setIsLoading] = useState(true)
  const [batteryImg, setBatteryImg] = useState<HTMLImageElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedText, setSelectedText] = useState<'line1' | 'line2' | null>(null)
  const [textBoxes, setTextBoxes] = useState<{ line1: TextBox, line2: TextBox }>({
    line1: { x: 0, y: 0, width: 0, height: 0, text: '', fontSize: 0, isSelected: false },
    line2: { x: 0, y: 0, width: 0, height: 0, text: '', fontSize: 0, isSelected: false }
  })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialTextPos, setInitialTextPos] = useState({ x: 0, y: 0 })
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  
  // Touch gesture states
  const [initialPinchDistance, setInitialPinchDistance] = useState(0)
  const [initialFontSize, setInitialFontSize] = useState(0)

  // Memoize canvas dimensions to prevent recalculation
  const canvasDimensions = useMemo(() => {
    if (!batteryImg) return { width: 0, height: 0 }
    const scaleFactor = 1.2
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
    
    const fontScaleFactor = canvasDimensions.width / 1920
    const baseFontSize = fontSize * fontScaleFactor * 2.5
    
    // Text area positioned on the right side of nameplate
    const textArea = {
      x: canvasDimensions.width * 0.4605,
      y: canvasDimensions.height * 0.4873,
      width: canvasDimensions.width * 0.3373,
      height: canvasDimensions.height * 0.1645
    }
    
    setTextBoxes({
      line1: {
        x: textArea.x + textArea.width / 2,
        y: textArea.y + textArea.height * 0.35,
        width: textArea.width,
        height: baseFontSize * 1.5,
        text: batteryData.line1 || 'YOUR COMPANY',
        fontSize: baseFontSize * 1.1,
        isSelected: false
      },
      line2: {
        x: textArea.x + textArea.width / 2,
        y: textArea.y + textArea.height * 0.65,
        width: textArea.width,
        height: baseFontSize * 1.2,
        text: batteryData.line2 || 'Phone • Website',
        fontSize: baseFontSize * 0.8,
        isSelected: false
      }
    })
  }, [batteryImg, canvasRef, canvasDimensions, fontSize, batteryData.line1, batteryData.line2])

  // Update text when batteryData changes
  useEffect(() => {
    setTextBoxes(prev => ({
      line1: { ...prev.line1, text: batteryData.line1 || 'YOUR COMPANY' },
      line2: { ...prev.line2, text: batteryData.line2 || 'Phone • Website' }
    }))
  }, [batteryData.line1, batteryData.line2])

  // Render canvas whenever dependencies change
  useEffect(() => {
    if (!canvasRef.current || !batteryImg || canvasSize.width === 0) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear and draw battery
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(batteryImg, 0, 0, canvas.width, canvas.height)

    // Draw text boxes
    Object.entries(textBoxes).forEach(([key, box]) => {
      ctx.save()
      
      // Text styling
      ctx.font = `bold ${box.fontSize}px ${fontFamily}`
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
      ctx.shadowBlur = 2
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1
      
      // Draw text
      ctx.fillText(box.text.toUpperCase(), box.x, box.y)
      
      // Draw selection box if selected
      if (box.isSelected) {
        ctx.strokeStyle = '#006FEE'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        const metrics = ctx.measureText(box.text.toUpperCase())
        const textHeight = box.fontSize
        ctx.strokeRect(
          box.x - metrics.width / 2 - 10,
          box.y - textHeight / 2 - 5,
          metrics.width + 20,
          textHeight + 10
        )
      }
      
      ctx.restore()
    })

    // Capture preview
    capturePreviewImage(canvas)
  }, [canvasRef, batteryImg, textBoxes, fontFamily, capturePreviewImage, canvasSize])

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
      setInitialFontSize(selectedText ? textBoxes[selectedText].fontSize : fontSize)
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
      const newFontSize = Math.max(10, Math.min(100, initialFontSize * scale))
      
      setTextBoxes(prev => ({
        ...prev,
        [selectedText]: {
          ...prev[selectedText],
          fontSize: newFontSize
        }
      }))
    } else if (e.touches.length === 1 && isDragging) {
      // Handle drag
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

  // Export function
  const handleExport = () => {
    if (!canvasRef.current) return
    
    const dataURL = canvasRef.current.toDataURL('image/png', 1.0)
    const link = document.createElement('a')
    link.download = `battery-engraving-${Date.now()}.png`
    link.href = dataURL
    link.click()
  }

  return (
    <div className="relative w-full max-w-[451px] mx-auto" style={{ height: 'auto' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-20">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading battery preview...</p>
          </div>
        </div>
      )}
      
      {!isLoading && canvasSize.width > 0 && (
        <>
          <div className="absolute -top-12 left-0 right-0 flex justify-between items-center">
            <div className="flex gap-2">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Move className="w-3 h-3" />
                <span>Drag to move</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <ZoomIn className="w-3 h-3" />
                <span>Pinch to resize</span>
              </div>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
          </div>
        </>
      )}
      
      <canvas
        ref={canvasRef}
        className="block w-full cursor-move"
        style={{ 
          maxWidth: '451px',
          height: canvasSize.height > 0 ? `${canvasSize.height * (451 / canvasSize.width)}px` : 'auto',
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
      
      {!isLoading && selectedText && (
        <div className="absolute -bottom-10 left-0 right-0 text-center">
          <p className="text-xs text-blue-600 font-medium">
            Editing {selectedText === 'line1' ? 'Line 1' : 'Line 2'}
          </p>
        </div>
      )}
    </div>
  )
}