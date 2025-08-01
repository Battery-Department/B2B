'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Battery, Sparkles, Shield, ChevronRight } from 'lucide-react'

// Dynamically import components that use client-side features
const BatteryTrackingDemoModal = dynamic(
  () => import('@/components/tracking/BatteryTrackingDemoModal').then(mod => ({ default: mod.BatteryTrackingDemoModal })),
  { ssr: false }
)

const BatteryTrackingDemoTrigger = dynamic(
  () => import('@/components/tracking/BatteryTrackingDemoModal').then(mod => ({ default: mod.BatteryTrackingDemoTrigger })),
  { ssr: false }
)

export default function BatteryTrackingDemoPage() {
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [primaryText, setPrimaryText] = useState('')
  const [secondaryText, setSecondaryText] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const savedPrimary = localStorage.getItem('engravingPrimaryText')
      const savedSecondary = localStorage.getItem('engravingSecondaryText')
      if (savedPrimary) setPrimaryText(savedPrimary)
      if (savedSecondary) setSecondaryText(savedSecondary)
    }
  }, [])

  // Set demo text
  const handleSetDemoText = () => {
    setPrimaryText('ACME CONSTRUCTION')
    setSecondaryText('555-1234 • acme.com')
    if (typeof window !== 'undefined') {
      localStorage.setItem('engravingPrimaryText', 'ACME CONSTRUCTION')
      localStorage.setItem('engravingSecondaryText', '555-1234 • acme.com')
    }
  }

  const handleTextChange = (field: 'primary' | 'secondary', value: string) => {
    if (field === 'primary') {
      setPrimaryText(value)
      if (typeof window !== 'undefined') {
        localStorage.setItem('engravingPrimaryText', value)
      }
    } else {
      setSecondaryText(value)
      if (typeof window !== 'undefined') {
        localStorage.setItem('engravingSecondaryText', value)
      }
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-2">Battery Tracking Modal Demo</h1>
            <p className="text-blue-100 text-lg">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Battery Tracking Modal Demo
          </h1>
          <p className="text-blue-100 text-lg">
            Experience the world-class QR scanner animation and protection features
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Demo Setup Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Battery className="w-8 h-8 text-yellow-500 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Setup Your Battery
            </h2>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Line 1 (Company Name)
              </label>
              <input
                type="text"
                value={primaryText}
                onChange={(e) => handleTextChange('primary', e.target.value)}
                placeholder="YOUR COMPANY"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Line 2 (Contact Info)
              </label>
              <input
                type="text"
                value={secondaryText}
                onChange={(e) => handleTextChange('secondary', e.target.value)}
                placeholder="555-1234 • company.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleSetDemoText}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center transition-colors"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Use demo text
          </button>
        </div>

        {/* Features Preview */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
            What You'll Experience
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-red-100 p-2 rounded-lg mr-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Laser QR Scanner</h4>
                  <p className="text-sm text-gray-600">Realistic red laser animation scanning your battery's QR code</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Protection Database</h4>
                  <p className="text-sm text-gray-600">See the loading animation as we access the protection system</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <ChevronRight className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Three-Stage Journey</h4>
                  <p className="text-sm text-gray-600">Scanning → Database Access → Protection Details</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <Battery className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">iPhone Mockup</h4>
                  <p className="text-sm text-gray-600">View your battery's protection status on a phone screen</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Launch Button */}
        <div className="flex flex-col items-center space-y-8">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800 mb-2">🎯 Battery Tracking Demo</p>
            <p className="text-gray-600 mb-6">
              See exactly what your customers will see when they scan your battery
            </p>
            
            <BatteryTrackingDemoTrigger 
              onClick={() => setShowDemoModal(true)}
              hasCustomText={!!primaryText || !!secondaryText}
            />
          </div>

          <p className="text-sm text-gray-500 text-center max-w-md">
            💡 Tip: The button will pulse when you've added custom text to your battery
          </p>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">How to Test:</h3>
          <ol className="space-y-2 text-sm text-gray-700">
            <li>1. Enter custom text for your battery (or use demo text)</li>
            <li>2. Click "See Your Battery's Protection"</li>
            <li>3. View the battery tracking experience in the modal</li>
          </ol>
        </div>
      </div>

      {/* Modal */}
      {mounted && (
        <BatteryTrackingDemoModal 
          isOpen={showDemoModal}
          onClose={() => setShowDemoModal(false)}
        />
      )}
    </div>
  )
}