'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useEngravingStore } from '@/lib/engraving-store'

interface QRScannerAnimationProps {
  onScanComplete: () => void
  qrCodeUrl?: string
}

export const QRScannerAnimation: React.FC<QRScannerAnimationProps> = ({ 
  onScanComplete, 
  qrCodeUrl = '/images/battery-qr-code.png' 
}) => {
  const [scanning, setScanning] = useState(false)
  const [scanComplete, setScanComplete] = useState(false)
  const { primaryText, secondaryText } = useEngravingStore()

  useEffect(() => {
    if (scanning && !scanComplete) {
      // Complete scan after animation
      const timer = setTimeout(() => {
        setScanComplete(true)
        // Small delay before transitioning to next stage
        setTimeout(() => {
          onScanComplete()
        }, 500)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [scanning, scanComplete, onScanComplete])

  const startScan = () => {
    setScanning(true)
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-gray-900 mb-8 text-center"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Scan Your Protected Battery
      </motion.h3>

      {/* Battery Mockup with QR Code */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, rotateY: -10 }}
        animate={{ scale: 1, opacity: 1, rotateY: scanning ? 0 : -10 }}
        transition={{ type: "spring", stiffness: 300, damping: 80 }}
        style={{ perspective: '1000px' }}
        className="relative mb-8"
      >
        {/* Battery Container */}
        <div className="relative w-[320px] md:w-[400px] h-[240px] md:h-[300px] bg-gradient-to-b from-[#FFCE00] to-[#FFB800] rounded-lg shadow-2xl transform-gpu">
          {/* Battery Top Terminal */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-gray-800 rounded-t-lg"></div>
          
          {/* FlexBat Logo */}
          <div className="absolute top-4 left-4 text-black font-bold text-xl" style={{ fontFamily: "'Poppins', sans-serif" }}>
            FlexBat
          </div>
          
          {/* Voltage Label */}
          <div className="absolute top-4 right-4 text-black font-semibold text-sm">
            20V/60V MAX
          </div>

          {/* Metal Nameplate with QR Code */}
          <div className="absolute bottom-6 left-6 right-6 h-20 md:h-24 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 rounded-md shadow-inner flex items-center p-3">
            {/* QR Code Container */}
            <div className="relative w-16 h-16 md:w-20 md:h-20 bg-white rounded p-1 mr-3 md:mr-4 overflow-hidden">
              <Image
                src={qrCodeUrl}
                alt="Battery QR Code"
                width={72}
                height={72}
                className={`w-full h-full object-contain ${scanComplete ? 'animate-pulse' : ''}`}
              />
              
              {/* Laser Scanner Effect */}
              <AnimatePresence>
                {scanning && !scanComplete && (
                  <motion.div
                    className="absolute inset-0 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent"
                      style={{
                        boxShadow: '0 0 10px #ef4444, 0 0 20px #ef4444, 0 0 30px #dc2626',
                      }}
                      initial={{ top: '-2px' }}
                      animate={{ top: '100%' }}
                      transition={{
                        duration: 2,
                        ease: "easeInOut",
                        repeat: scanning && !scanComplete ? Infinity : 0,
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Success Glow */}
              <AnimatePresence>
                {scanComplete && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 pointer-events-none"
                  >
                    <div className="w-full h-full bg-green-400 opacity-30 rounded animate-pulse"></div>
                    <div className="absolute inset-0 border-2 border-green-500 rounded animate-ping"></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Custom Engraving Text */}
            <div className="flex-1 overflow-hidden">
              <div className="text-gray-800 font-bold text-xs md:text-sm truncate">
                {primaryText || 'YOUR COMPANY'}
              </div>
              <div className="text-gray-700 text-xs truncate">
                {secondaryText || '555-1234 • company.com'}
              </div>
            </div>
          </div>

          {/* Scanning Indicator Lights */}
          <AnimatePresence>
            {scanning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-1/2 right-4 transform -translate-y-1/2"
              >
                <div className="flex flex-col space-y-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-red-600 rounded-full"
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1.2, 0.8],
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
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* Action Button or Status */}
      <AnimatePresence mode="wait">
        {!scanning && (
          <motion.button
            key="scan-button"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ delay: 0.5 }}
            onClick={startScan}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Scan QR Code</span>
          </motion.button>
        )}
        
        {scanning && !scanComplete && (
          <motion.div
            key="scanning-status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="text-red-600 font-semibold text-lg animate-pulse flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
              <span>Scanning in progress...</span>
            </div>
            <p className="text-gray-500 text-sm mt-2">Hold steady for best results</p>
          </motion.div>
        )}
        
        {scanComplete && (
          <motion.div
            key="scan-complete"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="text-green-600 font-semibold text-lg flex items-center justify-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Scan Complete!</span>
            </div>
            <p className="text-gray-500 text-sm mt-2">Accessing protection database...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}