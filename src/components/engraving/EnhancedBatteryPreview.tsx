'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useEngravingStore } from '@/lib/engraving-store'
import FlexVoltCanvasPreview from './FlexVoltCanvasPreview'

// Icon components
const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2.5V12.5M10 12.5L6.66667 9.16667M10 12.5L13.3333 9.16667M3.33333 14.1667V15.8333C3.33333 16.7538 4.07953 17.5 5 17.5H15C15.9205 17.5 16.6667 16.7538 16.6667 15.8333V14.1667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 7C16.6569 7 18 5.65685 18 4C18 2.34315 16.6569 1 15 1C13.3431 1 12 2.34315 12 4C12 5.65685 13.3431 7 15 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 13C6.65685 13 8 11.6569 8 10C8 8.34315 6.65685 7 5 7C3.34315 7 2 8.34315 2 10C2 11.6569 3.34315 13 5 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 19C16.6569 19 18 17.6569 18 16C18 14.3431 16.6569 13 15 13C13.3431 13 12 14.3431 12 16C12 17.6569 13.3431 19 15 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.58984 11.51L12.4198 14.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.4098 5.51001L7.58984 8.49001" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const EmailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 6.5L10 11L17.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.5 6.5C2.5 5.39543 3.39543 4.5 4.5 4.5H15.5C16.6046 4.5 17.5 5.39543 17.5 6.5V13.5C17.5 14.6046 16.6046 15.5 15.5 15.5H4.5C3.39543 15.5 2.5 14.6046 2.5 13.5V6.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C10.1495 18 10.298 17.9954 10.4454 17.9862V11.7955H8.40909V9.68182H10.4454V7.95455C10.4454 5.93636 11.6109 4.86364 13.3164 4.86364C14.1164 4.86364 14.8027 4.92273 15 4.94591V6.84545H13.8409C12.94 6.84545 12.7727 7.28182 12.7727 7.89545V9.68182H14.9345L14.6591 11.7955H12.7727V17.6836C15.8018 16.8309 18 13.9864 18 10Z" fill="currentColor"/>
  </svg>
)

const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.2461 4.82031C17.6289 5.08594 16.9727 5.26562 16.2773 5.36719C16.9883 4.95312 17.5273 4.29688 17.7852 3.51953C17.1289 3.90625 16.4023 4.19141 15.6211 4.35938C15 3.73828 14.1211 3.36328 13.1523 3.36328C11.2734 3.36328 9.75 4.88672 9.75 6.76562C9.75 7.02734 9.78125 7.28125 9.83594 7.52344C6.99219 7.38281 4.46094 6.03516 2.73828 3.88672C2.44531 4.38281 2.27344 4.95312 2.27344 5.5625C2.27344 6.73438 2.88281 7.76953 3.80078 8.375C3.23438 8.35938 2.70312 8.21875 2.23438 7.98438V8.02734C2.23438 9.67578 3.42188 11.0469 4.99219 11.3555C4.70703 11.4336 4.40625 11.4727 4.09766 11.4727C3.87891 11.4727 3.66797 11.4531 3.46094 11.4141C3.89062 12.7656 5.16406 13.7539 6.66797 13.7812C5.48828 14.6797 4.00781 15.2109 2.39844 15.2109C2.125 15.2109 1.85547 15.1953 1.58984 15.1641C3.10938 16.1172 4.91016 16.6719 6.84766 16.6719C13.1445 16.6719 16.5742 11.5273 16.5742 7.15625C16.5742 7.01172 16.5703 6.86719 16.5625 6.72656C17.2344 6.25391 17.7852 5.66797 18.2461 4.82031Z" fill="currentColor"/>
  </svg>
)

const LinkedInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.19727 6.21094H1.39453V17H4.19727V6.21094Z" fill="currentColor"/>
    <path d="M2.79688 4.75C3.71875 4.75 4.46875 4 4.46875 3.07812C4.46875 2.15625 3.71875 1.40625 2.79688 1.40625C1.875 1.40625 1.125 2.15625 1.125 3.07812C1.125 4 1.875 4.75 2.79688 4.75Z" fill="currentColor"/>
    <path d="M11.2383 6.21094H8.54297V17H11.3438V11.332C11.3438 9.92969 11.6055 8.57812 13.332 8.57812C15.0586 8.57812 15.0586 10.1758 15.0586 11.4219V17H17.8672V10.7656C17.8672 7.89844 17.2422 5.94141 13.9648 5.94141C12.3789 5.94141 11.3164 6.82031 10.8672 7.64844H10.8203V6.21094H8.12891V17H10.9375V11.332L11.2383 6.21094Z" fill="currentColor"/>
  </svg>
)

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2C5.58 2 2 5.58 2 10C2 11.46 2.36 12.84 2.98 14.04L2.02 17.44C1.96 17.64 2.02 17.86 2.16 18C2.26 18.1 2.4 18.16 2.54 18.16C2.6 18.16 2.66 18.14 2.72 18.12L6.14 17.16C7.32 17.76 8.64 18.08 10 18.08C14.42 18.08 18 14.5 18 10.08C18 5.66 14.42 2.08 10 2.08V2ZM14.46 13.3C14.24 13.88 13.34 14.38 12.64 14.5C12.14 14.58 11.5 14.64 10.02 14.02C7.96 13.16 6.68 10.9 6.56 10.74C6.44 10.58 5.66 9.52 5.66 8.42C5.66 7.32 6.24 6.78 6.46 6.54C6.68 6.3 6.94 6.24 7.1 6.24C7.26 6.24 7.42 6.24 7.56 6.24C7.7 6.24 7.9 6.18 8.08 6.6C8.26 7.02 8.74 8.12 8.8 8.24C8.86 8.36 8.9 8.5 8.82 8.66C8.74 8.82 8.7 8.94 8.58 9.08C8.46 9.22 8.32 9.4 8.22 9.5C8.1 9.62 7.98 9.76 8.12 10C8.26 10.24 8.72 10.98 9.42 11.58C10.3 12.34 11.04 12.58 11.28 12.7C11.52 12.82 11.66 12.8 11.8 12.64C11.94 12.48 12.4 11.94 12.56 11.7C12.72 11.46 12.88 11.5 13.1 11.58C13.32 11.66 14.42 12.2 14.66 12.32C14.9 12.44 15.04 12.5 15.1 12.6C15.16 12.7 15.16 13.12 14.98 13.64L14.46 13.3Z" fill="currentColor"/>
  </svg>
)

const SMSIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 12.5C17.1326 12.5 17.2598 12.4473 17.3536 12.3536C17.4473 12.2598 17.5 12.1326 17.5 12V5C17.5 4.86739 17.4473 4.74021 17.3536 4.64645C17.2598 4.55268 17.1326 4.5 17 4.5H3C2.86739 4.5 2.74021 4.55268 2.64645 4.64645C2.55268 4.74021 2.5 4.86739 2.5 5V12C2.5 12.1326 2.55268 12.2598 2.64645 12.3536C2.74021 12.4473 2.86739 12.5 3 12.5H7.5V15.5L11 12.5H17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

interface EnhancedBatteryPreviewProps {
  batteryImage?: string
  batteryData?: {
    line1: string
    line2: string
    logo: string
  }
  canvasRef?: React.RefObject<HTMLCanvasElement>
}

export default function EnhancedBatteryPreview({ 
  batteryImage = '/images/flexbat-battery.png',
  batteryData = { line1: '', line2: '', logo: '' },
  canvasRef: externalCanvasRef
}: EnhancedBatteryPreviewProps) {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = externalCanvasRef || internalCanvasRef
  const containerRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  
  const { 
    text, 
    primaryText,
    secondaryText,
    showSecondaryText,
    setIsAnimating,
    isAnimating,
    capturePreviewImage 
  } = useEngravingStore()
  
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now())

  // Get display text - prioritize new batteryData structure
  const displayText = batteryData.line1 || batteryData.line2 
    ? `${batteryData.line1 || ''}\n${batteryData.line2 || ''}`.trim()
    : showSecondaryText 
      ? `${primaryText}\n${secondaryText}`
      : text || primaryText

  // Start animation automatically on mount
  useEffect(() => {
    setIsAnimating(true)
  }, [setIsAnimating])
  
  // Real-time update detection with < 100ms animation
  useEffect(() => {
    const currentTime = Date.now()
    if (currentTime - lastUpdateTime > 50) { // Debounce rapid changes
      setIsUpdating(true)
      setLastUpdateTime(currentTime)
      
      // Quick pulse animation for real-time feedback
      const timer = setTimeout(() => {
        setIsUpdating(false)
        // Capture preview after update completes
        if (canvasRef.current) {
          setTimeout(() => {
            capturePreviewImage(canvasRef.current!)
          }, 200)
        }
      }, 100) // Sub-100ms animation target
      
      return () => clearTimeout(timer)
    }
  }, [text, primaryText, secondaryText, showSecondaryText, lastUpdateTime, capturePreviewImage])

  // Share functionality
  const handleShare = (platform: string) => {
    const shareUrl = window.location.href
    const shareText = `Check out my custom engraved FlexVolt battery! ${displayText}`
    
    let url = ''
    
    switch (platform) {
      case 'email':
        url = `mailto:?subject=My Custom FlexVolt Battery&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`
        break
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        break
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        break
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
        break
      case 'sms':
        // For SMS, we'll use a simple share with text only
        url = `sms:?body=${encodeURIComponent(shareText + ' ' + shareUrl)}`
        break
    }
    
    if (url) {
      window.open(url, '_blank')
      setShowShareModal(false)
    }
  }

  // Export functionality
  const handleExport = async () => {
    if (!canvasRef.current) return
    
    setIsExporting(true)
    
    try {
      // Ensure preview image is captured before export
      capturePreviewImage(canvasRef.current)
      
      // Create a temporary canvas for export
      const exportCanvas = document.createElement('canvas')
      const exportCtx = exportCanvas.getContext('2d')
      if (!exportCtx) return
      
      // Set high quality size
      const qualityMultiplier = 4
      
      exportCanvas.width = canvasRef.current.width * qualityMultiplier
      exportCanvas.height = canvasRef.current.height * qualityMultiplier
      
      // Scale and draw
      exportCtx.scale(qualityMultiplier, qualityMultiplier)
      exportCtx.drawImage(canvasRef.current, 0, 0)
      
      // Convert to blob and download
      exportCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `battery-engraving-${Date.now()}.png`
          a.click()
          URL.revokeObjectURL(url)
        }
      }, 'image/png', 1.0)
    } finally {
      setIsExporting(false)
    }
  }


  return (
    <div style={{
      backgroundColor: 'transparent',
      borderRadius: '12px',
      padding: '24px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'visible'
    }}>
      {/* Removed header action buttons per design requirements */}


      {/* Clean Preview container */}
      <div 
        ref={containerRef}
        style={{
          flex: 1,
          backgroundColor: 'transparent',
          position: 'relative',
          overflow: 'visible',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        {/* Clean Battery Preview */}
        <FlexVoltCanvasPreview
          canvasRef={canvasRef}
          batteryImage={batteryImage}
          text={displayText}
          batteryData={batteryData}
        />
      </div>

      {/* Share Modal removed - now in top navigation */}
      {false && showShareModal && (
        <div 
          style={{
            position: 'absolute',
            top: '80px',
            right: '24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
            padding: '8px',
            zIndex: 10,
            minWidth: '200px'
          }}
        >
          <div style={{
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: '600',
            color: '#6B7280',
            borderBottom: '1px solid #F3F4F6',
            marginBottom: '4px'
          }}>
            Share via
          </div>
          
          <button
            onClick={() => handleShare('email')}
            style={{
              width: '100%',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              textAlign: 'left',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <EmailIcon />
            Email
          </button>

          <button
            onClick={() => handleShare('facebook')}
            style={{
              width: '100%',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              textAlign: 'left',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <FacebookIcon />
            Facebook
          </button>

          <button
            onClick={() => handleShare('twitter')}
            style={{
              width: '100%',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              textAlign: 'left',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <TwitterIcon />
            Twitter
          </button>

          <button
            onClick={() => handleShare('linkedin')}
            style={{
              width: '100%',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              textAlign: 'left',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <LinkedInIcon />
            LinkedIn
          </button>

          <button
            onClick={() => handleShare('whatsapp')}
            style={{
              width: '100%',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              textAlign: 'left',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <WhatsAppIcon />
            WhatsApp
          </button>

          <button
            onClick={() => handleShare('sms')}
            style={{
              width: '100%',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              textAlign: 'left',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <SMSIcon />
            SMS
          </button>
        </div>
      )}

      {/* Click outside to close modal */}
      {showShareModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9
          }}
          onClick={() => setShowShareModal(false)}
        />
      )}

      {/* Loading overlay */}
      {isExporting && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          borderRadius: '12px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '3px solid #E5E7EB',
              borderTopColor: '#006FEE',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Exporting your design...
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}