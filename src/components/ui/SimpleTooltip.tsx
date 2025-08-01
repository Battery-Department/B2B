'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SimpleTooltipProps {
  content: string
  children: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export default function SimpleTooltip({ 
  content, 
  children, 
  placement = 'top' 
}: SimpleTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const getPositionClasses = () => {
    switch (placement) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2'
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2'
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2'
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
    }
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${getPositionClasses()} z-50 pointer-events-none whitespace-nowrap`}
          >
            <div className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg">
              {content}
              {/* Arrow */}
              <div className={`absolute w-2 h-2 bg-blue-600 transform rotate-45 ${
                placement === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
                placement === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
                placement === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
                'left-[-4px] top-1/2 -translate-y-1/2'
              }`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}