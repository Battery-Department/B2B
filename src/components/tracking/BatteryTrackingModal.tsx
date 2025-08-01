'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, X, Loader2, Database } from 'lucide-react'
import { QRScannerAnimation } from './QRScannerAnimation'
import { TrackingResultDisplay } from './TrackingResultDisplay'
import { EnhancedTrackingDisplay } from './EnhancedTrackingDisplay'
import { BatteryTrackingIframeModal } from './BatteryTrackingIframeModal'

interface BatteryTrackingModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue?: () => void
  useEnhancedDisplay?: boolean
}

type ModalStage = 'scanning' | 'loading' | 'result'

export const BatteryTrackingModal: React.FC<BatteryTrackingModalProps> = ({ 
  isOpen, 
  onClose,
  onContinue,
  useEnhancedDisplay = true
}) => {
  const [stage, setStage] = useState<ModalStage>('scanning')

  const handleScanComplete = () => {
    setStage('loading')
    // Simulate database access
    setTimeout(() => {
      setStage('result')
    }, 1500)
  }

  const handleClose = () => {
    setStage('scanning') // Reset for next time
    onClose()
  }

  const getStageTitle = () => {
    switch (stage) {
      case 'scanning':
        return 'Scanning Your Protected Battery'
      case 'loading':
        return 'Accessing Protection Database'
      case 'result':
        return 'Your Battery Protection Active'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="fixed inset-x-4 top-[50%] -translate-y-[50%] md:inset-x-auto md:left-[50%] md:-translate-x-[50%] max-w-5xl w-full z-50"
          >
            <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden ${stage === 'result' && useEnhancedDisplay ? 'max-w-7xl' : ''}`}>
              {/* Modal Header - Only show for non-enhanced result stage */}
              {!(stage === 'result' && useEnhancedDisplay) && (
                <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-6 h-6" />
                      <h2 className="text-xl font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        {getStageTitle()}
                      </h2>
                    </div>
                    <button
                      onClick={handleClose}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Progress Indicator */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-800">
                    <motion.div
                      className="h-full bg-white"
                      initial={{ width: '0%' }}
                      animate={{ 
                        width: stage === 'scanning' ? '33%' : stage === 'loading' ? '66%' : '100%' 
                      }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Content */}
              <div className={`relative ${stage === 'result' && useEnhancedDisplay ? '' : 'bg-gray-50'}`} style={{ minHeight: stage === 'result' && useEnhancedDisplay ? 'auto' : '500px' }}>
                <AnimatePresence mode="wait">
                  {/* Scanning Stage */}
                  {stage === 'scanning' && (
                    <motion.div
                      key="scanning"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="p-6"
                    >
                      <QRScannerAnimation onScanComplete={handleScanComplete} />
                    </motion.div>
                  )}

                  {/* Loading Stage */}
                  {stage === 'loading' && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center justify-center min-h-[500px] p-6"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="relative"
                      >
                        <Database className="w-16 h-16 text-blue-600" />
                        <motion.div
                          className="absolute inset-0"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Database className="w-16 h-16 text-blue-600 opacity-30" />
                        </motion.div>
                      </motion.div>
                      
                      <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl font-semibold text-gray-900 mt-6 mb-2"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                      >
                        Accessing Protection Database
                      </motion.h3>
                      
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-600 text-center max-w-md"
                      >
                        Verifying battery registration and activating nationwide tracking system...
                      </motion.p>

                      {/* Loading Progress Dots */}
                      <div className="flex space-x-2 mt-8">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-3 h-3 bg-blue-600 rounded-full"
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Result Stage */}
                  {stage === 'result' && (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={useEnhancedDisplay ? "" : "p-6"}
                    >
                      {useEnhancedDisplay ? (
                        <EnhancedTrackingDisplay 
                          onClose={handleClose} 
                          onContinue={() => {
                            handleClose()
                            onContinue?.()
                          }}
                        />
                      ) : (
                        <TrackingResultDisplay onClose={handleClose} />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Trigger Button Component
interface BatteryTrackingTriggerProps {
  onClick: () => void
  hasCustomText?: boolean
}

export const BatteryTrackingTrigger: React.FC<BatteryTrackingTriggerProps> = ({ 
  onClick, 
  hasCustomText = false 
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        group relative bg-gradient-to-r from-blue-600 to-blue-700 
        hover:from-blue-700 hover:to-blue-800 text-white font-semibold 
        py-4 px-8 rounded-xl shadow-lg transform transition-all duration-300 
        hover:shadow-xl flex items-center justify-center space-x-3
        ${hasCustomText ? 'animate-pulse' : ''}
      `}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <Shield className="w-5 h-5" />
      <span>See Your Battery's Future Protection</span>
      <span className="text-xl">🛡️</span>

      {/* Hover Preview */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute -top-20 left-1/2 transform -translate-x-1/2 
                       bg-gray-900 text-white p-3 rounded-lg shadow-xl 
                       pointer-events-none whitespace-nowrap z-10"
          >
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white rounded p-1">
                <img 
                  src="/images/battery-qr-code.png" 
                  alt="QR Preview" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-sm">Scan to see protection features</span>
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 
                            border-l-transparent border-r-transparent border-t-gray-900"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}