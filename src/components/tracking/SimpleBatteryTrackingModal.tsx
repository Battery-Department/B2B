'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, X } from 'lucide-react'
import { QRScannerAnimation } from './QRScannerAnimation'
import { BatteryTrackingIframeModal } from './BatteryTrackingIframeModal'

interface SimpleBatteryTrackingModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue?: () => void
}

type ModalStage = 'scanning' | 'tracking'

export const SimpleBatteryTrackingModal: React.FC<SimpleBatteryTrackingModalProps> = ({ 
  isOpen, 
  onClose,
  onContinue
}) => {
  const [stage, setStage] = useState<ModalStage>('scanning')

  const handleScanComplete = () => {
    // Short delay then switch to tracking view
    setTimeout(() => {
      setStage('tracking')
    }, 500)
  }

  const handleClose = () => {
    setStage('scanning') // Reset for next time
    onClose()
  }

  // If we're in tracking stage, show the iframe modal instead
  if (stage === 'tracking') {
    return (
      <BatteryTrackingIframeModal
        isOpen={isOpen}
        onClose={handleClose}
        onContinue={onContinue}
      />
    )
  }

  return (
    <AnimatePresence>
      {isOpen && stage === 'scanning' && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-4 top-[50%] -translate-y-[50%] md:inset-x-auto md:left-[50%] md:-translate-x-[50%] max-w-2xl w-full z-50"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-6 h-6" />
                    <h2 className="text-xl font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Scan Your Protected Battery
                    </h2>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="relative bg-gray-50 p-6">
                <QRScannerAnimation onScanComplete={handleScanComplete} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Simple Trigger Button
export const SimpleBatteryTrackingTrigger: React.FC<{
  onClick: () => void
  hasCustomText?: boolean
}> = ({ onClick, hasCustomText = false }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        bg-gradient-to-r from-blue-600 to-blue-700 
        hover:from-blue-700 hover:to-blue-800 text-white font-semibold 
        py-4 px-8 rounded-xl shadow-lg transform transition-all duration-300 
        hover:shadow-xl flex items-center justify-center space-x-3
        ${hasCustomText ? 'animate-pulse' : ''}
      `}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <Shield className="w-5 h-5" />
      <span>See Your Battery's Protection</span>
      <span className="text-xl">🛡️</span>
    </motion.button>
  )
}