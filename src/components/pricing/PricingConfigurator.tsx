'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, Zap, Shield, TrendingUp, Users, Calendar,
  Check, ChevronRight, Package, Truck, Building,
  Clock, DollarSign, Percent, Award, Info, ArrowRight
} from 'lucide-react'

interface PricingConfiguratorProps {
  onContinue: () => void
  batteryData?: {
    line1: string
    line2: string
  }
}

// Volume discount tiers
const volumeTiers = [
  { min: 0, max: 999, discount: 0, label: "Standard Pricing" },
  { min: 1000, max: 2499, discount: 10, label: "10% off $1,000+" },
  { min: 2500, max: 4999, discount: 15, label: "15% off $2,500+" },
  { min: 5000, max: null, discount: 20, label: "20% off $5,000+" }
]

// Business types for segmentation
const businessTypes = [
  { id: 'contractor', name: 'General Contractor', icon: Building },
  { id: 'electrical', name: 'Electrical Contractor', icon: Zap },
  { id: 'plumbing', name: 'Plumbing/HVAC', icon: Settings },
  { id: 'construction', name: 'Construction Company', icon: Package },
  { id: 'other', name: 'Other Trade', icon: Users }
]

// Purchase frequency options
const purchaseFrequencies = [
  { id: 'weekly', name: 'Weekly', multiplier: 52 },
  { id: 'monthly', name: 'Monthly', multiplier: 12 },
  { id: 'quarterly', name: 'Quarterly', multiplier: 4 },
  { id: 'annually', name: 'Annually', multiplier: 1 }
]

export default function PricingConfigurator({ onContinue, batteryData }: PricingConfiguratorProps) {
  const [selectedBusinessType, setSelectedBusinessType] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [purchaseFrequency, setPurchaseFrequency] = useState('')
  const [estimatedVolume, setEstimatedVolume] = useState(0)
  const [applicableDiscount, setApplicableDiscount] = useState(0)
  const [showVolumeCalculator, setShowVolumeCalculator] = useState(false)

  // Calculate estimated annual volume
  useEffect(() => {
    if (teamSize && purchaseFrequency) {
      const team = parseInt(teamSize)
      const frequency = purchaseFrequencies.find(f => f.id === purchaseFrequency)
      if (frequency && team > 0) {
        // Estimate: each team member needs 2 batteries per purchase cycle
        const batteriesPerCycle = team * 2
        const annualBatteries = batteriesPerCycle * frequency.multiplier
        // Average battery price $225
        const annualVolume = annualBatteries * 225
        setEstimatedVolume(annualVolume)
        
        // Calculate applicable discount
        const tier = volumeTiers.find(t => 
          annualVolume >= t.min && (t.max === null || annualVolume <= t.max)
        )
        setApplicableDiscount(tier?.discount || 0)
      }
    }
  }, [teamSize, purchaseFrequency])

  const handleContinue = () => {
    // Store configuration data
    sessionStorage.setItem('pricingConfig', JSON.stringify({
      businessType: selectedBusinessType,
      teamSize,
      purchaseFrequency,
      estimatedVolume,
      applicableDiscount
    }))
    onContinue()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-7xl mx-auto px-4 py-12"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Configure Your Pricing
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Tell us about your business to unlock volume discounts and personalized pricing
        </p>
      </motion.div>

      {/* Configuration Grid */}
      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Left Column - Business Configuration */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Business Type Selection */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2 text-blue-600" />
              Business Type
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {businessTypes.map((type) => {
                const Icon = type.icon
                return (
                  <motion.button
                    key={type.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedBusinessType(type.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedBusinessType === type.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${
                      selectedBusinessType === type.id ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    <p className={`text-sm font-medium ${
                      selectedBusinessType === type.id ? 'text-blue-900' : 'text-gray-700'
                    }`}>
                      {type.name}
                    </p>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Team Size */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Team Size
            </h3>
            <input
              type="number"
              min="1"
              max="500"
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              placeholder="Number of team members"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors"
            />
            <p className="text-sm text-gray-500 mt-2">
              How many people on your team use battery-powered tools?
            </p>
          </div>

          {/* Purchase Frequency */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Purchase Frequency
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {purchaseFrequencies.map((freq) => (
                <motion.button
                  key={freq.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPurchaseFrequency(freq.id)}
                  className={`py-3 px-4 rounded-lg border-2 transition-all ${
                    purchaseFrequency === freq.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className={`text-sm font-medium ${
                    purchaseFrequency === freq.id ? 'text-blue-900' : 'text-gray-700'
                  }`}>
                    {freq.name}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Column - Pricing Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Volume Discount Calculator */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border-2 border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Your Volume Discount
            </h3>
            
            {estimatedVolume > 0 ? (
              <>
                <div className="mb-6">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-sm text-gray-600">Estimated Annual Volume</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ${estimatedVolume.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((estimatedVolume / 5000) * 100, 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {applicableDiscount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-green-50 border-2 border-green-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Award className="w-6 h-6 text-green-600 mr-3" />
                          <div>
                            <p className="font-semibold text-green-900">
                              You qualify for {applicableDiscount}% volume discount!
                            </p>
                            <p className="text-sm text-green-700">
                              Save ${(estimatedVolume * applicableDiscount / 100).toLocaleString()} annually
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Complete the form to see your potential savings
              </p>
            )}

            {/* Volume Tiers Display */}
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Volume Discount Tiers</p>
              <div className="space-y-2">
                {volumeTiers.map((tier, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center py-2 px-3 rounded-lg ${
                      estimatedVolume >= tier.min && (tier.max === null || estimatedVolume <= tier.max)
                        ? 'bg-blue-100 border border-blue-300'
                        : 'bg-gray-50'
                    }`}
                  >
                    <span className="text-sm text-gray-700">{tier.label}</span>
                    {tier.discount > 0 && (
                      <span className={`text-sm font-semibold ${
                        estimatedVolume >= tier.min ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        Save {tier.discount}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Benefits Summary */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Benefits Package
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Theft Protection</p>
                  <p className="text-sm text-gray-600">
                    Custom engraving deters theft and helps recovery
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <Clock className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">30-Day Lead Time</p>
                  <p className="text-sm text-gray-600">
                    Custom manufacturing with 10% deposit to secure order
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <Truck className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Free Shipping</p>
                  <p className="text-sm text-gray-600">
                    On orders over $500 to continental US
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <DollarSign className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Net 30 Terms</p>
                  <p className="text-sm text-gray-600">
                    Available for qualified businesses
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-center"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleContinue}
          disabled={!selectedBusinessType || !teamSize || !purchaseFrequency}
          className={`flex items-center px-8 py-4 rounded-lg font-semibold text-lg transition-all ${
            selectedBusinessType && teamSize && purchaseFrequency
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue to Battery Selection
          <ArrowRight className="w-5 h-5 ml-2" />
        </motion.button>
      </motion.div>

      {/* Info Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <p className="text-sm text-gray-500 flex items-center justify-center">
          <Info className="w-4 h-4 mr-1" />
          Pricing is customized based on your business needs and volume
        </p>
      </motion.div>
    </motion.div>
  )
}