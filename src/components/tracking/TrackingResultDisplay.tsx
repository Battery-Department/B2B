'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useEngravingStore } from '@/lib/engraving-store'
import { 
  Shield, CheckCircle, MapPin, Calendar, User, 
  Phone, Building, QrCode, Zap, Award
} from 'lucide-react'

interface TrackingResultDisplayProps {
  onClose?: () => void
}

export const TrackingResultDisplay: React.FC<TrackingResultDisplayProps> = ({ onClose }) => {
  const { primaryText, secondaryText } = useEngravingStore()
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  // Generate a battery ID based on custom text
  const generateBatteryId = () => {
    const hash = (primaryText + secondaryText).split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    return `FB-${Math.abs(hash).toString().substring(0, 8)}`
  }

  const batteryId = generateBatteryId()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative w-full max-w-4xl mx-auto p-4"
    >
      {/* Phone Mockup Container */}
      <div className="relative mx-auto" style={{ maxWidth: '375px' }}>
        {/* iPhone Frame */}
        <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
          {/* Screen */}
          <div className="relative bg-white rounded-[2.5rem] overflow-hidden" style={{ minHeight: '812px' }}>
            {/* Status Bar */}
            <div className="bg-gray-900 text-white px-6 py-2 flex justify-between items-center text-xs">
              <span>9:41 AM</span>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-3 border border-white rounded-sm">
                  <div className="w-full h-full bg-white rounded-sm scale-x-75 origin-left"></div>
                </div>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>

            {/* Success Banner */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4"
            >
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8" />
                <div>
                  <h2 className="text-xl font-bold">Battery Verified ✓</h2>
                  <p className="text-green-100 text-sm">Protection Active</p>
                </div>
              </div>
            </motion.div>

            {/* Content Container */}
            <div className="px-6 py-6 space-y-6">
              {/* Battery Info Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Battery Details</h3>
                    <p className="text-sm text-gray-500">Registered & Protected</p>
                  </div>
                  <div className="bg-yellow-400 p-3 rounded-xl">
                    <Zap className="w-6 h-6 text-gray-900" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <QrCode className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Battery ID</p>
                      <p className="font-semibold text-gray-900">{batteryId}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Owner</p>
                      <p className="font-semibold text-gray-900">{primaryText || 'Your Company'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="font-semibold text-gray-900">{secondaryText || 'Contact Info'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Registered</p>
                      <p className="font-semibold text-gray-900">{today}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Protection Features */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <h3 className="text-lg font-semibold text-gray-900">Active Protection Features</h3>
                
                {[
                  { icon: Shield, text: "Instant Owner Verification", color: "text-green-600" },
                  { icon: MapPin, text: "Nationwide Tracking Active", color: "text-blue-600" },
                  { icon: Award, text: "Warranty Registered", color: "text-purple-600" },
                  { icon: Phone, text: "24/7 Recovery Support", color: "text-orange-600" }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center space-x-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
                  >
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    <span className="text-gray-900 font-medium">{feature.text}</span>
                    <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                  </motion.div>
                ))}
              </motion.div>

              {/* Action Button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="pt-4"
              >
                <button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Continue to Battery Selection
                </button>
              </motion.div>

              {/* Bottom Message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center text-sm text-gray-500 pt-4"
              >
                Your battery is now protected against theft and loss
              </motion.p>
            </div>
          </div>

          {/* iPhone Notch */}
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl"></div>
        </div>

        {/* Phone Shadow */}
        <div className="absolute inset-0 bg-gray-900 rounded-[3rem] transform translate-y-1 -z-10 opacity-20 blur-xl"></div>
      </div>
    </motion.div>
  )
}