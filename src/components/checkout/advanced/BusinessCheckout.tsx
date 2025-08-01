// Terminal 3 Phase 2: Business Checkout Component
// B2B specific features: PO numbers, net payment terms, tax exemption

'use client'

import React, { useState, useEffect } from 'react'
import { Building, FileText, CreditCard, Users, Shield, Calendar, CheckCircle, AlertTriangle, Info } from 'lucide-react'

export interface BusinessCheckoutProps {
  cartItems: any[]
  total: number
  customerId: string
  onBusinessOrderComplete: (orderId: string, businessData: BusinessOrderData) => void
  className?: string
}

export interface BusinessOrderData {
  purchaseOrderNumber: string
  paymentTerms: 'net_15' | 'net_30' | 'net_60' | 'credit_card'
  taxExemption: {
    enabled: boolean
    certificateNumber?: string
    expiryDate?: string
    states: string[]
  }
  departmentCode?: string
  projectCode?: string
  approver: {
    name: string
    email: string
    title: string
  }
  billingContact: {
    name: string
    email: string
    phone: string
  }
  costCenter?: string
  budgetCode?: string
}

export interface PaymentTerm {
  id: string
  name: string
  description: string
  daysNet: number
  discountPercent?: number
  discountDays?: number
  requiresApproval: boolean
  minimumAmount?: number
}

const BusinessCheckout: React.FC<BusinessCheckoutProps> = ({
  cartItems,
  total,
  customerId,
  onBusinessOrderComplete,
  className = ''
}) => {
  const [businessData, setBusinessData] = useState<Partial<BusinessOrderData>>({
    paymentTerms: 'credit_card',
    taxExemption: {
      enabled: false,
      states: []
    }
  })
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [approvalRequired, setApprovalRequired] = useState(false)
  const [taxExemptSavings, setTaxExemptSavings] = useState(0)

  // Available payment terms
  const paymentTerms: PaymentTerm[] = [
    {
      id: 'credit_card',
      name: 'Credit Card',
      description: 'Immediate payment via credit card',
      daysNet: 0,
      requiresApproval: false
    },
    {
      id: 'net_15',
      name: 'Net 15',
      description: 'Payment due within 15 days',
      daysNet: 15,
      discountPercent: 2,
      discountDays: 10,
      requiresApproval: false,
      minimumAmount: 1000
    },
    {
      id: 'net_30',
      name: 'Net 30',
      description: 'Payment due within 30 days',
      daysNet: 30,
      discountPercent: 1,
      discountDays: 10,
      requiresApproval: true,
      minimumAmount: 2500
    },
    {
      id: 'net_60',
      name: 'Net 60',
      description: 'Payment due within 60 days',
      daysNet: 60,
      requiresApproval: true,
      minimumAmount: 5000
    }
  ]

  // Calculate tax exemption savings
  useEffect(() => {
    if (businessData.taxExemption?.enabled) {
      const taxRate = 0.0875 // 8.75% average tax rate
      setTaxExemptSavings(total * taxRate)
    } else {
      setTaxExemptSavings(0)
    }
  }, [businessData.taxExemption?.enabled, total])

  // Check if approval is required
  useEffect(() => {
    const selectedTerm = paymentTerms.find(term => term.id === businessData.paymentTerms)
    setApprovalRequired(selectedTerm?.requiresApproval || false)
  }, [businessData.paymentTerms])

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      // Handle nested objects
      const [parent, child] = field.split('.')
      setBusinessData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof BusinessOrderData],
          [child]: value
        }
      }))
    } else {
      setBusinessData(prev => ({
        ...prev,
        [field]: value
      }))
    }

    // Clear validation errors for this field
    setValidationErrors(prev => prev.filter(error => !error.includes(field)))
  }

  const validateBusinessData = (): boolean => {
    const errors: string[] = []

    // PO Number validation
    if (!businessData.purchaseOrderNumber) {
      errors.push('Purchase Order Number is required')
    }

    // Approver validation for terms requiring approval
    if (approvalRequired) {
      if (!businessData.approver?.name) {
        errors.push('Approver name is required')
      }
      if (!businessData.approver?.email) {
        errors.push('Approver email is required')
      }
    }

    // Tax exemption validation
    if (businessData.taxExemption?.enabled) {
      if (!businessData.taxExemption.certificateNumber) {
        errors.push('Tax exemption certificate number is required')
      }
      if (!businessData.taxExemption.expiryDate) {
        errors.push('Tax exemption certificate expiry date is required')
      }
    }

    // Billing contact validation
    if (!businessData.billingContact?.name) {
      errors.push('Billing contact name is required')
    }
    if (!businessData.billingContact?.email) {
      errors.push('Billing contact email is required')
    }

    // Payment terms validation
    const selectedTerm = paymentTerms.find(term => term.id === businessData.paymentTerms)
    if (selectedTerm?.minimumAmount && total < selectedTerm.minimumAmount) {
      errors.push(`Minimum order amount for ${selectedTerm.name} is $${selectedTerm.minimumAmount.toLocaleString()}`)
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleBusinessSubmit = async () => {
    if (!validateBusinessData()) {
      return
    }

    setIsProcessing(true)

    try {
      // Create business order
      const orderId = `BIZ-${Date.now()}`
      const finalBusinessData = businessData as BusinessOrderData

      // Calculate final total with tax exemption
      const finalTotal = businessData.taxExemption?.enabled 
        ? total - taxExemptSavings 
        : total

      // Create business order data
      const businessOrder = {
        id: orderId,
        customerId,
        type: 'business',
        items: cartItems,
        subtotal: total,
        taxExemptSavings,
        total: finalTotal,
        businessData: finalBusinessData,
        status: approvalRequired ? 'pending_approval' : 'confirmed',
        createdAt: new Date().toISOString(),
        metadata: {
          requiresApproval: approvalRequired,
          paymentTerms: finalBusinessData.paymentTerms,
          taxExempt: finalBusinessData.taxExemption?.enabled || false
        }
      }

      // Save business order
      localStorage.setItem(`business_order_${orderId}`, JSON.stringify(businessOrder))
      
      // Save to general orders list
      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]')
      existingOrders.unshift(businessOrder)
      localStorage.setItem('orders', JSON.stringify(existingOrders))

      // Clear cart
      localStorage.removeItem('cart')

      onBusinessOrderComplete(orderId, finalBusinessData)
    } catch (error) {
      console.error('Business checkout failed:', error)
      setValidationErrors(['Order processing failed. Please try again.'])
    } finally {
      setIsProcessing(false)
    }
  }

  const selectedPaymentTerm = paymentTerms.find(term => term.id === businessData.paymentTerms)

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-lg ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Building size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Business Checkout</h3>
            <p className="text-gray-600">Complete your business order with enterprise features</p>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="font-medium text-red-800">Please correct the following errors:</span>
            </div>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Business Information Form */}
        <div className="space-y-6">
          {/* Purchase Order Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={18} />
              Purchase Order Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Order Number *
                </label>
                <input
                  type="text"
                  value={businessData.purchaseOrderNumber || ''}
                  onChange={(e) => handleInputChange('purchaseOrderNumber', e.target.value)}
                  placeholder="PO-2024-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Code
                </label>
                <input
                  type="text"
                  value={businessData.departmentCode || ''}
                  onChange={(e) => handleInputChange('departmentCode', e.target.value)}
                  placeholder="CONST-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Code
                </label>
                <input
                  type="text"
                  value={businessData.projectCode || ''}
                  onChange={(e) => handleInputChange('projectCode', e.target.value)}
                  placeholder="PROJECT-2024-A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Center
                </label>
                <input
                  type="text"
                  value={businessData.costCenter || ''}
                  onChange={(e) => handleInputChange('costCenter', e.target.value)}
                  placeholder="CC-TOOLS-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={18} />
              Payment Terms
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentTerms.map(term => (
                <div
                  key={term.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    businessData.paymentTerms === term.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${
                    term.minimumAmount && total < term.minimumAmount
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  onClick={() => {
                    if (!term.minimumAmount || total >= term.minimumAmount) {
                      handleInputChange('paymentTerms', term.id)
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{term.name}</h5>
                    {businessData.paymentTerms === term.id && (
                      <CheckCircle size={18} className="text-indigo-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{term.description}</p>
                  
                  {term.discountPercent && (
                    <div className="text-sm text-green-600">
                      {term.discountPercent}% discount if paid within {term.discountDays} days
                    </div>
                  )}
                  
                  {term.requiresApproval && (
                    <div className="text-sm text-amber-600 flex items-center gap-1">
                      <Info size={12} />
                      Requires approval
                    </div>
                  )}
                  
                  {term.minimumAmount && (
                    <div className="text-sm text-gray-500">
                      Minimum order: ${term.minimumAmount.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tax Exemption */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Shield size={18} />
                Tax Exemption
              </h4>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={businessData.taxExemption?.enabled || false}
                  onChange={(e) => handleInputChange('taxExemption.enabled', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Tax Exempt Order
                </span>
              </label>
            </div>
            
            {businessData.taxExemption?.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Exemption Certificate Number *
                  </label>
                  <input
                    type="text"
                    value={businessData.taxExemption?.certificateNumber || ''}
                    onChange={(e) => handleInputChange('taxExemption.certificateNumber', e.target.value)}
                    placeholder="TX-EXEMPT-123456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={businessData.taxExemption?.expiryDate || ''}
                    onChange={(e) => handleInputChange('taxExemption.expiryDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
            
            {taxExemptSavings > 0 && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle size={16} />
                  <span className="font-medium">
                    Tax Exemption Savings: ${taxExemptSavings.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Approval Required */}
          {approvalRequired && (
            <div className="bg-amber-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={18} />
                Approval Required
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approver Name *
                  </label>
                  <input
                    type="text"
                    value={businessData.approver?.name || ''}
                    onChange={(e) => handleInputChange('approver.name', e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approver Email *
                  </label>
                  <input
                    type="email"
                    value={businessData.approver?.email || ''}
                    onChange={(e) => handleInputChange('approver.email', e.target.value)}
                    placeholder="john.smith@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approver Title
                  </label>
                  <input
                    type="text"
                    value={businessData.approver?.title || ''}
                    onChange={(e) => handleInputChange('approver.title', e.target.value)}
                    placeholder="Project Manager"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Billing Contact */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={18} />
              Billing Contact
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name *
                </label>
                <input
                  type="text"
                  value={businessData.billingContact?.name || ''}
                  onChange={(e) => handleInputChange('billingContact.name', e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={businessData.billingContact?.email || ''}
                  onChange={(e) => handleInputChange('billingContact.email', e.target.value)}
                  placeholder="jane.doe@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={businessData.billingContact?.phone || ''}
                  onChange={(e) => handleInputChange('billingContact.phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="mt-6 bg-indigo-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${total.toLocaleString()}</span>
            </div>
            {taxExemptSavings > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Tax Exemption Savings:</span>
                <span>-${taxExemptSavings.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total:</span>
              <span>${(total - taxExemptSavings).toLocaleString()}</span>
            </div>
          </div>
          
          {selectedPaymentTerm && (
            <div className="mt-4 p-3 bg-white rounded border">
              <div className="text-sm text-gray-600">
                <strong>Payment Terms:</strong> {selectedPaymentTerm.name}
              </div>
              {selectedPaymentTerm.daysNet > 0 && (
                <div className="text-sm text-gray-600">
                  Due Date: {new Date(Date.now() + selectedPaymentTerm.daysNet * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <button
            onClick={handleBusinessSubmit}
            disabled={isProcessing || validationErrors.length > 0}
            className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
              isProcessing || validationErrors.length > 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing Business Order...
              </>
            ) : approvalRequired ? (
              <>
                <Calendar size={20} />
                Submit for Approval
              </>
            ) : (
              <>
                <Building size={20} />
                Place Business Order
              </>
            )}
          </button>
          
          <div className="text-center mt-4 text-sm text-gray-500">
            {approvalRequired 
              ? 'Order will be sent for approval before processing'
              : 'Your business order will be processed immediately'
            }
          </div>
        </div>
      </div>
    </div>
  )
}

export default BusinessCheckout