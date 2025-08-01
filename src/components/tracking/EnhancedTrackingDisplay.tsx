'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEngravingStore } from '@/lib/engraving-store'
import { 
  Shield, CheckCircle, MapPin, Calendar, User, Phone, Building, 
  QrCode, Zap, Award, Globe, Mail, Navigation, X, ExternalLink,
  Smartphone, Battery, Lock, Star, ArrowRight, ChevronRight
} from 'lucide-react'

interface CompanyData {
  name: string
  website?: string
  email?: string
  phone?: string
  address?: string
  rating?: number
  reviews?: number
}

interface EnhancedTrackingDisplayProps {
  onClose: () => void
  onContinue: () => void
}

// Mock company data - in production this would come from your database
const mockCompanyDatabase: { [key: string]: CompanyData } = {
  'ACME CONSTRUCTION': {
    name: 'ACME Construction Inc.',
    website: 'www.acmeconstruction.com',
    email: 'info@acmeconstruction.com',
    phone: '(617) 555-1234',
    address: '123 Main St, Boston, MA 02134',
    rating: 4.8,
    reviews: 127
  },
  'DEFAULT': {
    name: 'Your Company',
    website: 'www.yourcompany.com',
    email: 'info@yourcompany.com',
    phone: '(555) 123-4567',
    address: 'Your Address',
    rating: 5.0,
    reviews: 0
  }
}

export const EnhancedTrackingDisplay: React.FC<EnhancedTrackingDisplayProps> = ({ 
  onClose, 
  onContinue 
}) => {
  const { primaryText, secondaryText } = useEngravingStore()
  const [companyData, setCompanyData] = useState<CompanyData>(mockCompanyDatabase.DEFAULT)
  const [activeView, setActiveView] = useState<'phone' | 'desktop'>('phone')
  
  // Fetch company data based on engraving text
  useEffect(() => {
    // In production, this would be an API call to your database
    const companyKey = primaryText?.toUpperCase() || 'DEFAULT'
    const data = mockCompanyDatabase[companyKey] || mockCompanyDatabase.DEFAULT
    setCompanyData({
      ...data,
      name: primaryText || data.name
    })
  }, [primaryText])

  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  // Generate battery ID
  const generateBatteryId = () => {
    const hash = (primaryText + secondaryText).split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    return `FB-${Math.abs(hash).toString().substring(0, 8)}`
  }

  const batteryId = generateBatteryId()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-full flex flex-col"
    >
      {/* Header with View Toggle */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Battery Protection Portal
          </h2>
          <p className="text-blue-100 text-sm">Viewing as: {companyData.name}</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-blue-800/30 p-1 rounded-lg">
          <button
            onClick={() => setActiveView('phone')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${
              activeView === 'phone' ? 'bg-white text-blue-700' : 'text-white hover:bg-blue-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-sm font-medium">Mobile</span>
          </button>
          <button
            onClick={() => setActiveView('desktop')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${
              activeView === 'desktop' ? 'bg-white text-blue-700' : 'text-white hover:bg-blue-700'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">Desktop</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-100 p-6 overflow-auto">
        <AnimatePresence mode="wait">
          {activeView === 'phone' ? (
            <PhoneView 
              key="phone"
              companyData={companyData}
              batteryId={batteryId}
              today={today}
            />
          ) : (
            <DesktopView 
              key="desktop"
              companyData={companyData}
              batteryId={batteryId}
              today={today}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Action Footer */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-600 mb-1">Ready to secure your batteries?</p>
            <p className="text-lg font-semibold text-gray-900">
              Continue to complete your order with theft protection included
            </p>
          </div>
          
          <div className="flex gap-3">
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:border-gray-400 transition-colors"
            >
              Back to Design
            </motion.button>
            
            <motion.button
              onClick={onContinue}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              Continue to Battery Selection
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Phone View Component
const PhoneView: React.FC<{
  companyData: CompanyData
  batteryId: string
  today: string
}> = ({ companyData, batteryId, today }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative mx-auto" 
      style={{ maxWidth: '375px' }}
    >
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

          {/* App Header */}
          <div className="bg-gradient-to-b from-blue-600 to-blue-700 text-white px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">FlexBat Protect</h1>
                <p className="text-blue-100">Battery Security System</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
            </div>
            
            {/* Success Banner */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-green-500 text-white rounded-xl p-4 flex items-center gap-3"
            >
              <CheckCircle className="w-8 h-8 flex-shrink-0" />
              <div>
                <p className="font-bold text-lg">Battery Verified!</p>
                <p className="text-green-100 text-sm">Protection active for {companyData.name}</p>
              </div>
            </motion.div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Battery Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-6 text-black shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm opacity-80">Battery ID</p>
                  <p className="text-xl font-bold">{batteryId}</p>
                </div>
                <Battery className="w-8 h-8" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="opacity-80">Model</p>
                  <p className="font-semibold">FlexVolt 20V/60V</p>
                </div>
                <div>
                  <p className="opacity-80">Registered</p>
                  <p className="font-semibold">{today}</p>
                </div>
              </div>
            </motion.div>

            {/* Company Info */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-50 rounded-2xl p-6 space-y-4"
            >
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-gray-600" />
                Registered Owner
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Company</p>
                    <p className="font-semibold text-gray-900">{companyData.name}</p>
                  </div>
                </div>
                
                {companyData.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-semibold text-gray-900">{companyData.phone}</p>
                    </div>
                  </div>
                )}
                
                {companyData.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-semibold text-gray-900">{companyData.email}</p>
                    </div>
                  </div>
                )}
                
                {companyData.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Website</p>
                      <p className="font-semibold text-gray-900">{companyData.website}</p>
                    </div>
                  </div>
                )}
                
                {companyData.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-semibold text-gray-900">{companyData.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Protection Features */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              <h3 className="font-bold text-gray-900">Active Protection</h3>
              
              {[
                { icon: Shield, text: "Theft Deterrent Active", color: "bg-green-500" },
                { icon: MapPin, text: "GPS Tracking Enabled", color: "bg-blue-500" },
                { icon: Lock, text: "Ownership Verified", color: "bg-purple-500" },
                { icon: Award, text: "Warranty Protected", color: "bg-orange-500" }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm"
                >
                  <div className={`w-10 h-10 ${feature.color} rounded-lg flex items-center justify-center`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-900">{feature.text}</span>
                  <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* iPhone Notch */}
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl"></div>
      </div>
    </motion.div>
  )
}

// Desktop View Component
const DesktopView: React.FC<{
  companyData: CompanyData
  batteryId: string
  today: string
}> = ({ companyData, batteryId, today }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="max-w-6xl mx-auto"
    >
      {/* Browser Chrome */}
      <div className="bg-gray-800 rounded-t-lg p-3 flex items-center gap-3">
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <div className="flex-1 bg-gray-700 rounded px-4 py-1 text-sm text-gray-300">
          https://protect.flexbat.com/verify/{batteryId}
        </div>
        <ExternalLink className="w-4 h-4 text-gray-400" />
      </div>

      {/* Website Content */}
      <div className="bg-white rounded-b-lg shadow-2xl">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Battery Protection Verified
                </h1>
                <p className="text-xl text-blue-100">
                  This FlexBat battery is protected and registered to {companyData.name}
                </p>
              </div>
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center"
              >
                <Shield className="w-12 h-12" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="px-8 py-12">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Battery Details */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-8 border-2 border-yellow-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Battery className="w-8 h-8 text-yellow-600" />
                Battery Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Battery ID</p>
                  <p className="text-xl font-bold text-gray-900">{batteryId}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Model</p>
                    <p className="font-semibold">FlexVolt 20V/60V MAX</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Capacity</p>
                    <p className="font-semibold">9Ah / 3Ah</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registration Date</p>
                  <p className="font-semibold">{today}</p>
                </div>
                <div className="pt-4 border-t border-yellow-200">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Genuine FlexBat Product</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Owner Details */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Building className="w-8 h-8 text-blue-600" />
                Registered Owner
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Company Name</p>
                  <p className="text-xl font-bold text-gray-900">{companyData.name}</p>
                  {companyData.rating && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < Math.floor(companyData.rating!) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {companyData.rating} ({companyData.reviews} reviews)
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {companyData.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{companyData.phone}</span>
                    </div>
                  )}
                  
                  {companyData.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{companyData.email}</span>
                    </div>
                  )}
                  
                  {companyData.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <a href={`https://${companyData.website}`} className="text-blue-600 hover:underline">
                        {companyData.website}
                      </a>
                    </div>
                  )}
                  
                  {companyData.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{companyData.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Protection Features */}
          <div className="mt-12 bg-gray-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Active Protection Features
            </h2>
            
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { 
                  icon: Shield, 
                  title: "Theft Protection", 
                  desc: "Deters theft with visible ownership",
                  color: "text-green-600",
                  bg: "bg-green-100"
                },
                { 
                  icon: MapPin, 
                  title: "GPS Tracking", 
                  desc: "Locate your battery if lost",
                  color: "text-blue-600",
                  bg: "bg-blue-100"
                },
                { 
                  icon: Lock, 
                  title: "Verified Ownership", 
                  desc: "Instant owner verification",
                  color: "text-purple-600",
                  bg: "bg-purple-100"
                },
                { 
                  icon: Award, 
                  title: "Warranty Plus", 
                  desc: "Extended warranty coverage",
                  color: "text-orange-600",
                  bg: "bg-orange-100"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="text-center"
                >
                  <div className={`w-16 h-16 ${feature.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Found this battery? Contact the owner or report it to FlexBat support.
            </p>
            <div className="flex gap-4 justify-center">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Contact Owner
              </button>
              <button className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:border-gray-400 transition-colors">
                Report Found Battery
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}