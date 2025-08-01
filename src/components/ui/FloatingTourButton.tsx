'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Info, HelpCircle } from 'lucide-react'

interface FloatingTourButtonProps {
  onClick: () => void
}

export default function FloatingTourButton({ onClick }: FloatingTourButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <button
        onClick={onClick}
        className="relative group"
        aria-label="Start Guided Tour"
      >
        {/* Main button */}
        <div className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:shadow-xl">
          <HelpCircle className="w-6 h-6" />
        </div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap">
            Start Guided Tour
            <div className="absolute bottom-[-4px] right-[20px] w-2 h-2 bg-gray-900 transform rotate-45" />
          </div>
        </div>
        
        {/* Pulse effect */}
        <div className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-20" />
      </button>
    </motion.div>
  )
}