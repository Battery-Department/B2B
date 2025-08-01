'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEngravingStore } from '@/lib/engraving-store'
import { X, ExternalLink, Shield, Phone, Mail, MapPin, Calendar, CheckCircle } from 'lucide-react'

interface BatteryTrackingIframeModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue?: () => void
}

export const BatteryTrackingIframeModal: React.FC<BatteryTrackingIframeModalProps> = ({
  isOpen,
  onClose,
  onContinue
}) => {
  const { primaryText, secondaryText } = useEngravingStore()
  const [loading, setLoading] = useState(true)

  // Generate battery ID from company name
  const generateBatteryId = () => {
    const hash = (primaryText + secondaryText).split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    return `FV-2024-${Math.abs(hash).toString().substring(0, 6)}`
  }

  const batteryId = generateBatteryId()
  const companyName = primaryText || 'Your Company'
  
  // Extract phone from secondary text if it matches pattern
  const extractPhone = (text: string) => {
    const phoneMatch = text?.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
    return phoneMatch ? phoneMatch[0] : '(555) 123-4567';
  }
  
  const phone = extractPhone(secondaryText)
  const email = `info@${companyName.toLowerCase().replace(/\s+/g, '')}.com`
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  useEffect(() => {
    if (isOpen) {
      // Simulate loading
      const timer = setTimeout(() => setLoading(false), 1000)
      return () => clearTimeout(timer)
    } else {
      setLoading(true)
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:left-[50%] md:-translate-x-[50%] md:w-[90%] md:max-w-6xl z-50"
          >
            <div className="bg-white rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6" />
                  <div>
                    <h2 className="text-xl font-semibold">Battery Protection Portal</h2>
                    <p className="text-sm text-blue-100">Live tracking for {companyName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.open(`/battery-scan-demo?company=${encodeURIComponent(companyName)}&id=${batteryId}`, '_blank')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Browser Chrome */}
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex-1 bg-white rounded px-3 py-1 text-sm text-gray-600 font-mono">
                  https://battery-department.com/verify/{batteryId}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto bg-gray-50">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading battery information...</p>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-full bg-white">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      <div className="max-w-4xl mx-auto px-6 py-8">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="text-4xl font-bold">B</div>
                              <h1 className="text-2xl font-semibold">Battery Department</h1>
                            </div>
                          </div>
                          <div className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">Verified Protected Battery</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Battery Info */}
                    <div className="max-w-4xl mx-auto px-6 py-8">
                      <div className="text-center mb-8">
                        <p className="text-gray-600 mb-2">Battery ID:</p>
                        <p className="text-3xl font-bold text-gray-900">{batteryId}</p>
                      </div>

                      {/* Owner Card */}
                      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                        <div className="text-center mb-6">
                          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-10 h-10 text-blue-600" />
                          </div>
                          <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">Registered Owner</p>
                          <h2 className="text-3xl font-bold text-gray-900">{companyName}</h2>
                          <p className="text-gray-600 mt-2 flex items-center justify-center gap-1">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Protected since {today}
                          </p>
                        </div>

                        {/* Contact Information */}
                        <div className="border-t border-gray-200 pt-8 mt-8">
                          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Contact Information</h3>
                          
                          <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center">
                              <div className="flex justify-center mb-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Phone className="w-6 h-6 text-blue-600" />
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">PHONE</p>
                              <p className="font-semibold text-gray-900">{phone}</p>
                              <button className="text-blue-600 text-sm mt-2 hover:underline">
                                Call Now →
                              </button>
                            </div>

                            <div className="text-center">
                              <div className="flex justify-center mb-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Mail className="w-6 h-6 text-blue-600" />
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">EMAIL</p>
                              <p className="font-semibold text-gray-900 text-sm">{email}</p>
                              <button className="text-blue-600 text-sm mt-2 hover:underline">
                                Send Email →
                              </button>
                            </div>

                            <div className="text-center">
                              <div className="flex justify-center mb-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <MapPin className="w-6 h-6 text-blue-600" />
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">ADDRESS</p>
                              <p className="font-semibold text-gray-900">123 Main St, Boston,</p>
                              <p className="font-semibold text-gray-900">MA 02111</p>
                              <button className="text-blue-600 text-sm mt-2 hover:underline">
                                Get Directions →
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Protection Features */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                          Active Protection Features
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {[
                            'Theft Deterrent System Active',
                            'Nationwide Recovery Network',
                            'Owner Verification Enabled',
                            'Warranty Protection Active',
                            '24/7 Support Available',
                            'GPS Tracking Ready'
                          ].map((feature, index) => (
                            <div key={index} className="flex items-center gap-3 bg-white rounded-lg p-4">
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                              <span className="text-gray-900 font-medium">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-white border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    This battery is protected by Battery Department's theft prevention system
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    {onContinue && (
                      <button
                        onClick={() => {
                          onClose()
                          onContinue()
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Continue Shopping
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}