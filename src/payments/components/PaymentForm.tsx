import React, { useState, useEffect, useCallback } from 'react';
import { PaymentRequest, PaymentResult, PaymentMethod } from '@/types/payments';
import { usePaymentOrchestrator } from '../hooks/usePaymentOrchestrator';
import { CreditCardIcon, ShieldCheckIcon, LockClosedIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface PaymentFormProps {
  amount: number;
  currency: string;
  customerId: string;
  onSuccess: (result: PaymentResult) => void;
  onError: (error: string) => void;
  className?: string;
}

interface FormErrors {
  cardNumber?: string;
  expiryDate?: string;
  cvc?: string;
  holderName?: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency,
  customerId,
  onSuccess,
  onError,
  className = ''
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'google_pay' | 'paypal'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    holderName: '',
    saveCard: false
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [securityIndicator, setSecurityIndicator] = useState({ level: 'high', message: 'Secure payment protected by 256-bit SSL encryption' });

  const { processPayment, isLoading, error: orchestratorError } = usePaymentOrchestrator();

  // Real-time form validation
  const validateField = useCallback((field: string, value: string): string | undefined => {
    switch (field) {
      case 'cardNumber':
        const cleanNumber = value.replace(/\s/g, '');
        if (!cleanNumber) return 'Card number is required';
        if (cleanNumber.length < 13) return 'Card number must be at least 13 digits';
        if (!/^\d+$/.test(cleanNumber)) return 'Card number must contain only digits';
        if (!luhnCheck(cleanNumber)) return 'Invalid card number';
        return undefined;
      
      case 'expiryDate':
        if (!value) return 'Expiry date is required';
        const match = value.match(/^(\d{2})\/(\d{2})$/);
        if (!match) return 'Format: MM/YY';
        const month = parseInt(match[1]);
        const year = parseInt(`20${match[2]}`);
        if (month < 1 || month > 12) return 'Invalid month';
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          return 'Card has expired';
        }
        return undefined;
      
      case 'cvc':
        if (!value) return 'CVC is required';
        if (!/^\d{3,4}$/.test(value)) return 'CVC must be 3-4 digits';
        return undefined;
      
      case 'holderName':
        if (!value.trim()) return 'Cardholder name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return undefined;
      
      default:
        return undefined;
    }
  }, []);

  // Luhn algorithm for card validation
  const luhnCheck = (cardNumber: string): boolean => {
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  // Format card number with spaces
  const formatCardNumber = (value: string): string => {
    const cleanValue = value.replace(/\s/g, '');
    const groups = cleanValue.match(/.{1,4}/g) || [];
    return groups.join(' ').substring(0, 19); // Max 16 digits + 3 spaces
  };

  // Format expiry date
  const formatExpiryDate = (value: string): string => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length >= 2) {
      return `${cleanValue.substring(0, 2)}/${cleanValue.substring(2, 4)}`;
    }
    return cleanValue;
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvc') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Real-time validation
    const error = validateField(field, formattedValue);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isProcessing || isLoading) return;

    // Validate all fields
    const newErrors: FormErrors = {};
    Object.entries(formData).forEach(([field, value]) => {
      if (field !== 'saveCard') {
        const error = validateField(field, value);
        if (error) newErrors[field as keyof FormErrors] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsProcessing(true);

    try {
      const paymentRequest: PaymentRequest = {
        amount: { value: amount, currency },
        paymentMethod: {
          type: paymentMethod,
          details: paymentMethod === 'card' ? {
            number: formData.cardNumber.replace(/\s/g, ''),
            expiryMonth: formData.expiryDate.split('/')[0],
            expiryYear: `20${formData.expiryDate.split('/')[1]}`,
            cvc: formData.cvc,
            holderName: formData.holderName
          } : undefined
        },
        customer: { id: customerId, email: '' },
        metadata: {
          saveCard: formData.saveCard,
          sessionId: `session_${Date.now()}`,
          userAgent: navigator.userAgent
        }
      };

      const result = await processPayment(paymentRequest);
      
      if (result.status === 'SUCCESS') {
        onSuccess(result);
      } else {
        onError(result.errorMessage || 'Payment failed');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle alternative payment methods
  const handleAlternativePayment = async (method: 'apple_pay' | 'google_pay' | 'paypal') => {
    setIsProcessing(true);
    setPaymentMethod(method);

    try {
      const paymentRequest: PaymentRequest = {
        amount: { value: amount, currency },
        paymentMethod: { type: method },
        customer: { id: customerId, email: '' },
        metadata: {
          sessionId: `session_${Date.now()}`,
          userAgent: navigator.userAgent
        }
      };

      const result = await processPayment(paymentRequest);
      
      if (result.status === 'SUCCESS') {
        onSuccess(result);
      } else if (result.status === 'REQUIRES_ACTION' && result.actionRequired?.nextActionUrl) {
        // Redirect for payment completion
        window.location.href = result.actionRequired.nextActionUrl;
      } else {
        onError(result.errorMessage || `${method} payment failed`);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : `${method} payment failed`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className={`bg-white border-2 border-[#E6F4FF] rounded-xl p-6 transition-all duration-300 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-[#006FEE] to-[#0050B3] rounded-lg">
            <CreditCardIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#111827]">Secure Payment</h3>
            <p className="text-sm text-[#6B7280]">Complete your FlexVolt battery order</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-[#6B7280]">Total Amount</p>
          <p className="text-xl font-bold text-[#006FEE]">{formatAmount(amount, currency)}</p>
        </div>
      </div>

      {/* Security Indicator */}
      <div className="flex items-center gap-2 p-3 bg-[#F0F9FF] border border-[#E0F2FE] rounded-lg mb-6">
        <ShieldCheckIcon className="w-5 h-5 text-[#006FEE]" />
        <div className="flex-1">
          <p className="text-sm font-medium text-[#006FEE]">Secure Transaction</p>
          <p className="text-xs text-[#6B7280]">{securityIndicator.message}</p>
        </div>
        <LockClosedIcon className="w-4 h-4 text-[#10B981]" />
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-[#111827] mb-3">Payment Method</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`p-3 border-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
              paymentMethod === 'card'
                ? 'border-[#006FEE] bg-[#F0F9FF] text-[#006FEE]'
                : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#006FEE] hover:bg-[#F9FAFB]'
            }`}
          >
            <CreditCardIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Credit Card</span>
          </button>
          <button
            type="button"
            onClick={() => handleAlternativePayment('paypal')}
            disabled={isProcessing}
            className="p-3 border-2 border-[#E5E7EB] rounded-lg transition-all duration-200 flex items-center gap-2 hover:border-[#0070BA] hover:bg-[#F9FAFB] disabled:opacity-50"
          >
            <div className="w-5 h-5 bg-[#0070BA] rounded text-white text-xs flex items-center justify-center font-bold">P</div>
            <span className="text-sm font-medium">PayPal</span>
          </button>
        </div>
        
        {/* Apple Pay & Google Pay */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <button
            type="button"
            onClick={() => handleAlternativePayment('apple_pay')}
            disabled={isProcessing}
            className="p-3 border-2 border-[#E5E7EB] rounded-lg transition-all duration-200 flex items-center gap-2 hover:border-[#000] hover:bg-[#F9FAFB] disabled:opacity-50"
          >
            <div className="w-5 h-5 bg-black rounded text-white text-xs flex items-center justify-center font-bold">🍎</div>
            <span className="text-sm font-medium">Apple Pay</span>
          </button>
          <button
            type="button"
            onClick={() => handleAlternativePayment('google_pay')}
            disabled={isProcessing}
            className="p-3 border-2 border-[#E5E7EB] rounded-lg transition-all duration-200 flex items-center gap-2 hover:border-[#4285F4] hover:bg-[#F9FAFB] disabled:opacity-50"
          >
            <div className="w-5 h-5 bg-[#4285F4] rounded text-white text-xs flex items-center justify-center font-bold">G</div>
            <span className="text-sm font-medium">Google Pay</span>
          </button>
        </div>
      </div>

      {/* Card Form (only shown when card is selected) */}
      {paymentMethod === 'card' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Number */}
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-2">Card Number</label>
            <div className="relative">
              <input
                type="text"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                placeholder="1234 5678 9012 3456"
                className={`w-full p-3 pr-12 bg-[#F9FAFB] border-2 rounded-lg text-[#111827] placeholder-[#9CA3AF] transition-all duration-200 focus:outline-none focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,111,238,0.1)] ${
                  errors.cardNumber
                    ? 'border-[#EF4444] focus:border-[#EF4444]'
                    : 'border-[#E5E7EB] focus:border-[#006FEE]'
                }`}
                maxLength={19}
              />
              <CreditCardIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
            </div>
            {errors.cardNumber && (
              <p className="mt-1 text-sm text-[#EF4444] flex items-center gap-1">
                <ExclamationTriangleIcon className="w-4 h-4" />
                {errors.cardNumber}
              </p>
            )}
          </div>

          {/* Expiry and CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">Expiry Date</label>
              <input
                type="text"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                placeholder="MM/YY"
                className={`w-full p-3 bg-[#F9FAFB] border-2 rounded-lg text-[#111827] placeholder-[#9CA3AF] transition-all duration-200 focus:outline-none focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,111,238,0.1)] ${
                  errors.expiryDate
                    ? 'border-[#EF4444] focus:border-[#EF4444]'
                    : 'border-[#E5E7EB] focus:border-[#006FEE]'
                }`}
                maxLength={5}
              />
              {errors.expiryDate && (
                <p className="mt-1 text-sm text-[#EF4444]">{errors.expiryDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">CVC</label>
              <input
                type="text"
                value={formData.cvc}
                onChange={(e) => handleInputChange('cvc', e.target.value)}
                placeholder="123"
                className={`w-full p-3 bg-[#F9FAFB] border-2 rounded-lg text-[#111827] placeholder-[#9CA3AF] transition-all duration-200 focus:outline-none focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,111,238,0.1)] ${
                  errors.cvc
                    ? 'border-[#EF4444] focus:border-[#EF4444]'
                    : 'border-[#E5E7EB] focus:border-[#006FEE]'
                }`}
                maxLength={4}
              />
              {errors.cvc && (
                <p className="mt-1 text-sm text-[#EF4444]">{errors.cvc}</p>
              )}
            </div>
          </div>

          {/* Cardholder Name */}
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-2">Cardholder Name</label>
            <input
              type="text"
              value={formData.holderName}
              onChange={(e) => handleInputChange('holderName', e.target.value)}
              placeholder="John Smith"
              className={`w-full p-3 bg-[#F9FAFB] border-2 rounded-lg text-[#111827] placeholder-[#9CA3AF] transition-all duration-200 focus:outline-none focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,111,238,0.1)] ${
                errors.holderName
                  ? 'border-[#EF4444] focus:border-[#EF4444]'
                  : 'border-[#E5E7EB] focus:border-[#006FEE]'
              }`}
            />
            {errors.holderName && (
              <p className="mt-1 text-sm text-[#EF4444]">{errors.holderName}</p>
            )}
          </div>

          {/* Save Card Option */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.saveCard}
                onChange={(e) => setFormData(prev => ({ ...prev, saveCard: e.target.checked }))}
                className="sr-only"
              />
              <div className={`w-5 h-5 border-2 rounded transition-all duration-200 ${
                formData.saveCard
                  ? 'bg-[#006FEE] border-[#006FEE]'
                  : 'bg-white border-[#E5E7EB]'
              }`}>
                {formData.saveCard && (
                  <svg className="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </label>
            <span className="text-sm text-[#6B7280]">Save card for future purchases</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing || isLoading || Object.keys(errors).some(key => errors[key as keyof FormErrors])}
            className="w-full p-4 bg-[#006FEE] text-white font-semibold rounded-lg transition-all duration-200 hover:bg-[#0050B3] hover:transform hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,111,238,0.25)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
          >
            {(isProcessing || isLoading) ? (
              <>
                <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <LockClosedIcon className="w-5 h-5" />
                <span>Complete Secure Payment • {formatAmount(amount, currency)}</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Error Display */}
      {(orchestratorError || errors) && (
        <div className="mt-4 p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-lg">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-[#EF4444]" />
            <p className="text-sm font-medium text-[#EF4444]">
              {orchestratorError || 'Please correct the errors above'}
            </p>
          </div>
        </div>
      )}

      {/* Trust Badges */}
      <div className="mt-6 pt-4 border-t border-[#E5E7EB]">
        <div className="flex items-center justify-center gap-6 text-xs text-[#6B7280]">
          <div className="flex items-center gap-1">
            <ShieldCheckIcon className="w-4 h-4 text-[#10B981]" />
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center gap-1">
            <LockClosedIcon className="w-4 h-4 text-[#10B981]" />
            <span>PCI Compliant</span>
          </div>
          <div className="flex items-center gap-1">
            <CreditCardIcon className="w-4 h-4 text-[#10B981]" />
            <span>Bank Grade Security</span>
          </div>
        </div>
      </div>
    </div>
  );
};