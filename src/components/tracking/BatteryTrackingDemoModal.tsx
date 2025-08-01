'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, QrCode } from 'lucide-react'
import { createPortal } from 'react-dom'
// Removed Zustand store import to avoid SSR issues

interface BatteryTrackingDemoModalProps {
  isOpen?: boolean
  onClose?: () => void
  onContinue?: () => void
}

export const BatteryTrackingDemoModal: React.FC<BatteryTrackingDemoModalProps> = ({ 
  isOpen: externalIsOpen, 
  onClose: externalOnClose,
  onContinue 
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [primaryText, setPrimaryText] = useState('')
  const [secondaryText, setSecondaryText] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [mounted, setMounted] = useState(false)
  
  // Use external control if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const handleClose = externalOnClose || (() => setInternalIsOpen(false))
  
  // Generate battery ID from custom text
  const generateBatteryId = () => {
    const hash = (primaryText + secondaryText)
      .split('')
      .reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc)
      }, 0)
    return `FV-2024-${Math.abs(hash).toString().substring(0, 6).padEnd(6, '0')}`
  }
  
  // Load from localStorage when modal opens
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const savedPrimary = localStorage.getItem('engravingPrimaryText') || ''
      const savedSecondary = localStorage.getItem('engravingSecondaryText') || ''
      setPrimaryText(savedPrimary)
      setSecondaryText(savedSecondary)
    }
  }, [isOpen])

  // Build demo URL with user's data
  useEffect(() => {
    if (isOpen && primaryText) {
      const params = new URLSearchParams({
        company: primaryText || 'Your Company',
        phone: extractPhone(secondaryText) || '(555) 123-4567',
        email: `info@${(primaryText || 'company').toLowerCase().replace(/\s+/g, '')}.com`,
        batteryId: generateBatteryId(),
        demo: 'true'
      })
      
      // Use relative URL for same domain
      setDemoUrl(`/battery-scan-demo?${params}`)
    }
  }, [isOpen, primaryText, secondaryText])
  
  // Extract phone number from text if it exists
  const extractPhone = (text: string) => {
    const phoneMatch = text?.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
    return phoneMatch ? phoneMatch[0] : null;
  }
  
  // Set mounted when component mounts
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Show button only if user has entered custom text
  const showButton = primaryText || secondaryText
  
  if (!showButton && !externalIsOpen) return null

  return (
    <>
      {/* Trigger Button - only show if not externally controlled */}
      {externalIsOpen === undefined && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => setInternalIsOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          <QrCode className="w-5 h-5" />
          See How The QR Tracking Works
        </motion.button>
      )}
      
      {/* Modal - render in portal */}
      {mounted && typeof document !== 'undefined' && isOpen && createPortal(
        <AnimatePresence mode="wait">
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={handleClose}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                style={{ zIndex: 99998 }}
              />
              
              {/* Modal Container */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.3,
                  ease: [0.25, 0.1, 0.25, 1]
                }}
                className="fixed inset-0 bg-white shadow-2xl overflow-hidden flex flex-col"
                style={{ zIndex: 99999 }}
              >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-2xl font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Your Battery Protection System
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    This is exactly what anyone will see when they scan your protected battery
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Browser Chrome */}
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex-1 bg-white rounded px-3 py-1 text-sm text-gray-600 font-mono">
                  batterydpt.com/verify/{generateBatteryId()}
                </div>
              </div>
              
              {/* Demo Content */}
              <div className="flex-1 bg-gray-50 overflow-hidden">
                <iframe
                  src={demoUrl}
                  className="w-full h-full"
                  title="Battery Tracking Demo"
                  allow="fullscreen"
                />
              </div>
              
              {/* Footer */}
              <div className="bg-gray-100 px-6 py-4 text-center border-t border-gray-200 flex-shrink-0">
                <p className="text-lg font-semibold text-gray-700 mb-3">
                  Every battery you order includes this FREE theft protection system
                </p>
                <button
                  onClick={() => {
                    handleClose()
                    if (onContinue) {
                      onContinue()
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-xl transition-all duration-200 inline-flex items-center gap-3 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Continue to Order
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </motion.div>
          </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

// Export trigger button separately for flexible placement
export const BatteryTrackingDemoTrigger: React.FC<{
  onClick: () => void
  hasCustomText?: boolean
}> = ({ onClick, hasCustomText }) => {
  if (!hasCustomText) return null
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transform transition-all duration-200 hover:shadow-lg"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <QrCode className="w-5 h-5" />
      See How The QR Tracking Works
    </motion.button>
  )
}