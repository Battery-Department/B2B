import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEngravingStore } from '@/lib/engraving-store'

interface FlexVoltCanvasPreviewProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  batteryImage: string
  text?: string
  batteryData?: {
    line1: string
    line2: string
    logo: string
  }
}

export default function FlexVoltCanvasPreview({ 
  canvasRef, 
  batteryImage, 
  text = "YOUR COMPANY",
  batteryData = { line1: '', line2: '', logo: '' }
}: FlexVoltCanvasPreviewProps) {
  const { 
    fontSize, 
    fontFamily, 
    textAlign, 
    isAnimating,
    logoUrl,
    logoImage,
    showLogo,
    logoScale,
    capturePreviewImage 
  } = useEngravingStore()
  
  const [isLoading, setIsLoading] = useState(false) // Changed to false to show immediately
  const [batteryImg, setBatteryImg] = useState<HTMLImageElement | null>(null)
  const animationRef = useRef<number>()
  const progressRef = useRef(0)

  // Load battery image
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setBatteryImg(img)
      // setIsLoading(false) // No longer needed since we start with false
    }
    img.src = batteryImage
  }, [batteryImage])

  // Main rendering function
  const renderCanvas = (progress: number = 1) => {
    const canvas = canvasRef.current
    if (!canvas || !batteryImg) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match battery image (20% larger)
    const scaleFactor = 1.2 // 20% larger
    canvas.width = batteryImg.width * scaleFactor
    canvas.height = batteryImg.height * scaleFactor

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw battery image scaled 20% larger
    ctx.drawImage(batteryImg, 0, 0, canvas.width, canvas.height)

    // Legacy engraving area definition removed - using new precise measurements below

    // Remove any engraving area highlight - text should appear directly on metal

    // Configure text style
    const fontScaleFactor = canvas.width / 1920 // Scale based on original image size (already scaled by 20%)
    const baseFontSize = fontSize * fontScaleFactor * 2.5 // Adjust for canvas resolution
    
    ctx.save()
    
    // Text styling for engraving effect
    ctx.font = `bold ${baseFontSize}px ${fontFamily}`
    ctx.fillStyle = '#000000' // Black engraving
    ctx.textAlign = textAlign as CanvasTextAlign
    ctx.textBaseline = 'middle'
    
    // Add engraving depth effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
    ctx.shadowBlur = 2
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1

    // Legacy text positioning removed - now using modular logoArea and textArea system

    // Apply animation masking
    if (isAnimating && progress < 1) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(
        engravingArea.x,
        engravingArea.y,
        engravingArea.width * progress,
        engravingArea.height
      )
      ctx.clip()
    }

    // Logo positioning - smaller area on the left side of nameplate
    const logoArea = {
      x: canvas.width * 0.2314,      // 23.14% from left
      y: canvas.height * 0.5407,     // 54.07% from top
      width: canvas.width * 0.2241,   // 22.41% width
      height: canvas.height * 0.1018  // 10.18% height
    };

    // Define nameplate area - CENTER text on entire nameplate
    const nameplateArea = {
      x: canvas.width * 0.225,       // 22.5% from left
      y: canvas.height * 0.525,      // 52.5% from top
      width: canvas.width * 0.577,    // 57.7% width
      height: canvas.height * 0.141   // 14.1% height
    };
    
    // Calculate absolute center of nameplate
    const nameplateCenterX = nameplateArea.x + (nameplateArea.width / 2);  // 51.35% of canvas
    const nameplateCenterY = nameplateArea.y + (nameplateArea.height / 2); // 59.55% of canvas

    // Apply animation masking
    if (isAnimating && progress < 1) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(
        engravingArea.x,
        engravingArea.y,
        engravingArea.width * progress,
        engravingArea.height
      )
      ctx.clip()
    }

    // Check if we should show logo and/or text - now supports both simultaneously
    const shouldShowLogo = batteryData.logo || (showLogo && (logoUrl || logoImage));
    const shouldShowText = batteryData.line1 || batteryData.line2 || text;
    
    // Draw logo if present (left side)
    if (shouldShowLogo) {
      const logoSource = batteryData.logo || logoUrl || logoImage
      console.log('Rendering logo on left side with source:', {
        batteryDataLogo: !!batteryData.logo,
        showLogo: showLogo,
        logoUrl: !!logoUrl,
        logoImage: !!logoImage,
        sourceLength: logoSource?.length
      })
      drawLogoInArea(ctx, logoSource, logoArea, progress)
    }
    
    // Draw text if present (right side) - always show text area
    if (shouldShowText || !shouldShowLogo) {
      const textRow1 = batteryData.line1 || (text.split('\n')[0]) || 'YOUR COMPANY';
      const textRow2 = batteryData.line2 || (text.split('\n')[1]) || 'Phone • Website';

      // Row 1: Company name (using precise positioning from HTML tool)
      const row1FontSize = 31 * fontScaleFactor;  // 31px as determined by positioning tool
      ctx.font = `bold ${row1FontSize}px 'Poppins', ${fontFamily}`;
      ctx.textAlign = 'center';  // Center align the text
      ctx.textBaseline = 'middle';
      
      const row1X = canvas.width * 0.616;   // 61.6% from left
      const row1Y = canvas.height * 0.536;  // 53.6% from top (56.1% - 2.5%)
      
      // Draw Row 1 with engraving effect
      ctx.fillText(textRow1.toUpperCase(), row1X, row1Y);
      ctx.globalAlpha = 0.3;
      ctx.fillText(textRow1.toUpperCase(), row1X + 0.5, row1Y + 0.5);
      ctx.globalAlpha = 1;

      // Row 2: Contact info (using precise positioning from HTML tool) 
      const row2FontSize = 21 * fontScaleFactor;  // 21px as determined by positioning tool
      ctx.font = `bold ${row2FontSize}px 'Poppins', ${fontFamily}`;
      ctx.textAlign = 'center';  // Center align the text
      
      const row2X = canvas.width * 0.616;   // 61.6% from left
      const row2Y = canvas.height * 0.615;  // 61.5% from top (64% - 2.5%)
      
      // Draw Row 2 with engraving effect
      ctx.fillText(textRow2.toUpperCase(), row2X, row2Y);
      ctx.globalAlpha = 0.3;
      ctx.fillText(textRow2.toUpperCase(), row2X + 0.5, row2Y + 0.5);
      ctx.globalAlpha = 1;
    }

    if (isAnimating && progress < 1) {
      ctx.restore()
    }

    ctx.restore()

    // Capture preview image when fully rendered (not during animation)
    if (progress === 1 && !isAnimating) {
      // Small delay to ensure rendering is complete
      setTimeout(() => {
        capturePreviewImage(canvas)
        // Log for debugging
        console.log('Preview image captured from canvas')
      }, 100)
    }

    // Removed metallic shine effect - text appears directly on metal surface
  }

  // Text wrapping function
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    // First split by newlines to handle explicit line breaks
    const paragraphs = text.split('\n')
    const lines: string[] = []
    
    paragraphs.forEach(paragraph => {
      // Then handle word wrapping within each paragraph
      const words = paragraph.split(' ')
      let currentLine = ''

      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const metrics = ctx.measureText(testLine)
        
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = testLine
        }
      })
      
      if (currentLine) {
        lines.push(currentLine)
      }
    })
    
    return lines
  }

  // Logo drawing function for designated logo area
  const drawLogoInArea = (
    ctx: CanvasRenderingContext2D, 
    logoUrl: string, 
    logoArea: any, 
    progress: number
  ) => {
    const logo = new Image()
    
    // Set crossOrigin for better compatibility
    logo.crossOrigin = 'anonymous'
    
    logo.onload = () => {
      console.log('Logo loaded successfully in canvas, dimensions:', logo.width, 'x', logo.height)
      
      try {
        // Use logoScale from store for size control - adjusted for smaller logo area
        const scaleFactor = logoScale || 0.9
        const maxLogoWidth = logoArea.width * 0.9 * scaleFactor
        const maxLogoHeight = logoArea.height * 0.9 * scaleFactor
        
        ctx.save()
        ctx.globalAlpha = Math.min(progress, 0.95)  // Better visibility
        
        // Maintain aspect ratio by calculating dimensions based on original logo dimensions
        const aspectRatio = logo.width / logo.height
        let drawWidth = maxLogoWidth
        let drawHeight = maxLogoHeight
        
        if (aspectRatio > 1) {
          // Wider than tall - fit to width
          drawHeight = drawWidth / aspectRatio
          if (drawHeight > maxLogoHeight) {
            drawHeight = maxLogoHeight
            drawWidth = drawHeight * aspectRatio
          }
        } else {
          // Taller than wide - fit to height
          drawWidth = drawHeight * aspectRatio
          if (drawWidth > maxLogoWidth) {
            drawWidth = maxLogoWidth
            drawHeight = drawWidth / aspectRatio
          }
        }
        
        // Perfect center calculation - use the exact center of the logo area
        const centerX = logoArea.x + logoArea.width / 2
        const centerY = logoArea.y + logoArea.height / 2
        const finalX = centerX - drawWidth / 2
        const finalY = centerY - drawHeight / 2
        
        console.log('Drawing centered logo at position:', {
          x: finalX,
          y: finalY,
          width: drawWidth,
          height: drawHeight,
          logoArea: logoArea,
          scaleFactor: scaleFactor
        })
        
        // Add subtle drop shadow for better visibility on metal surface
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
        ctx.shadowBlur = 3
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
        
        ctx.drawImage(logo, finalX, finalY, drawWidth, drawHeight)
        ctx.restore()
        
        console.log('Logo drawn successfully on canvas')
        
        // Trigger a re-render of the canvas after logo loads
        setTimeout(() => {
          renderCanvas(progress)
        }, 50)
      } catch (error) {
        console.error('Error drawing logo on canvas:', error)
        ctx.restore()
      }
    }
    
    logo.onerror = (error) => {
      console.error('Failed to load logo image:', error, 'URL:', logoUrl?.substring(0, 100) + '...')
    }
    
    console.log('Setting logo source, URL type:', typeof logoUrl, 'Length:', logoUrl?.length)
    logo.src = logoUrl
  }

  // Placeholder logo function - not used when in logo mode
  const drawPlaceholderLogo = (
    ctx: CanvasRenderingContext2D,
    logoArea: any,
    progress: number
  ) => {
    // Don't draw placeholder in logo mode - canvas should be clean for logo
    return
  }

  // Removed metallic shine effect function - no longer needed

  // Animation loop
  useEffect(() => {
    if (isAnimating && batteryImg) {
      console.log('Starting animation with logo state:', { showLogo, logoUrl: !!logoUrl, logoImage: !!logoImage })
      progressRef.current = 0
      
      const animate = () => {
        progressRef.current += 0.013 // Animation speed reduced by 35% (was 0.02, now ~0.013)
        
        if (progressRef.current <= 1) {
          renderCanvas(progressRef.current)
          animationRef.current = requestAnimationFrame(animate)
        } else {
          renderCanvas(1)
        }
      }
      
      animate()
    } else if (batteryImg) {
      console.log('Rendering static canvas with logo state:', { showLogo, logoUrl: !!logoUrl, logoImage: !!logoImage })
      renderCanvas(1)
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isAnimating, batteryImg, text, fontSize, fontFamily, textAlign, showLogo, logoUrl, logoImage, logoScale])

  // Re-render when text or settings change - include logoImage and logoScale in dependencies
  useEffect(() => {
    if (batteryImg && !isAnimating) {
      console.log('Re-rendering canvas due to state change:', {
        showLogo,
        logoUrl: !!logoUrl,
        logoImage: !!logoImage,
        logoScale,
        text
      })
      renderCanvas(1)
      
      // Capture preview after render with a longer delay for logo loading
      const captureDelay = (showLogo && (logoUrl || logoImage)) ? 500 : 200
      const captureTimer = setTimeout(() => {
        if (canvasRef.current) {
          capturePreviewImage(canvasRef.current)
          console.log('Preview captured after state change')
        }
      }, captureDelay)
      
      return () => clearTimeout(captureTimer)
    }
  }, [batteryImg, text, fontSize, fontFamily, textAlign, showLogo, logoUrl, logoImage, logoScale, capturePreviewImage, batteryData])

  return (
    <div style={{ width: '100%', height: '100%', maxWidth: '451px', maxHeight: '451px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {isLoading ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              border: '2px solid #E5E7EB', 
              borderTopColor: '#006FEE', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite', 
              margin: '0 auto 16px' 
            }}></div>
            <p style={{ color: '#9CA3AF' }}>Loading FlexVolt battery...</p>
          </div>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          style={{ 
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: 'transparent'
          }}
        />
      )}
    </div>
  )
}