'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from './useToast'

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  email?: boolean
  phone?: boolean
  zipCode?: boolean
  creditCard?: boolean
  custom?: (value: any) => string | null
  message?: string
}

export interface FieldValidation {
  [fieldName: string]: ValidationRule[]
}

export interface ValidationErrors {
  [fieldName: string]: string
}

export interface FormValidationOptions {
  validateOnChange?: boolean
  validateOnBlur?: boolean
  showToastOnError?: boolean
  debounceMs?: number
}

export const useFormValidation = (
  validation: FieldValidation,
  options: FormValidationOptions = {}
) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    showToastOnError = false,
    debounceMs = 300,
  } = options

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [isValidating, setIsValidating] = useState(false)
  const { showToast } = useToast()

  const validateField = useCallback(
    (fieldName: string, value: any): string | null => {
      const rules = validation[fieldName]
      if (!rules) return null

      for (const rule of rules) {
        // Required validation
        if (rule.required && (!value || value.toString().trim() === '')) {
          return rule.message || `${fieldName} is required`
        }

        // Skip other validations if value is empty (unless required)
        if (!value || value.toString().trim() === '') continue

        const stringValue = value.toString()

        // Length validations
        if (rule.minLength && stringValue.length < rule.minLength) {
          return rule.message || `${fieldName} must be at least ${rule.minLength} characters`
        }

        if (rule.maxLength && stringValue.length > rule.maxLength) {
          return rule.message || `${fieldName} must be no more than ${rule.maxLength} characters`
        }

        // Pattern validation
        if (rule.pattern && !rule.pattern.test(stringValue)) {
          return rule.message || `${fieldName} format is invalid`
        }

        // Email validation
        if (rule.email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(stringValue)) {
            return rule.message || 'Please enter a valid email address'
          }
        }

        // Phone validation
        if (rule.phone) {
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
          const cleanPhone = stringValue.replace(/[\s\-\(\)\.]/g, '')
          if (!phoneRegex.test(cleanPhone)) {
            return rule.message || 'Please enter a valid phone number'
          }
        }

        // ZIP code validation
        if (rule.zipCode) {
          const zipRegex = /^\d{5}(-\d{4})?$/
          if (!zipRegex.test(stringValue)) {
            return rule.message || 'Please enter a valid ZIP code'
          }
        }

        // Credit card validation (basic Luhn algorithm)
        if (rule.creditCard) {
          const cleaned = stringValue.replace(/\s/g, '')
          if (!isValidCreditCard(cleaned)) {
            return rule.message || 'Please enter a valid credit card number'
          }
        }

        // Custom validation
        if (rule.custom) {
          const customError = rule.custom(value)
          if (customError) {
            return customError
          }
        }
      }

      return null
    },
    [validation]
  )

  const validateForm = useCallback(
    (formData: { [key: string]: any }): ValidationErrors => {
      const newErrors: ValidationErrors = {}

      Object.keys(validation).forEach(fieldName => {
        const error = validateField(fieldName, formData[fieldName])
        if (error) {
          newErrors[fieldName] = error
        }
      })

      return newErrors
    },
    [validation, validateField]
  )

  const validateSingleField = useCallback(
    (fieldName: string, value: any) => {
      setIsValidating(true)
      
      const timeoutId = setTimeout(() => {
        const error = validateField(fieldName, value)
        
        setErrors(prev => {
          const newErrors = { ...prev }
          if (error) {
            newErrors[fieldName] = error
          } else {
            delete newErrors[fieldName]
          }
          return newErrors
        })

        if (error && showToastOnError && touched.has(fieldName)) {
          showToast({
            variant: 'error',
            title: 'Validation Error',
            description: error
          })
        }

        setIsValidating(false)
      }, debounceMs)

      return () => clearTimeout(timeoutId)
    },
    [validateField, showToastOnError, touched, debounceMs, showToast]
  )

  const handleFieldChange = useCallback(
    (fieldName: string, value: any) => {
      if (validateOnChange) {
        return validateSingleField(fieldName, value)
      }
    },
    [validateOnChange, validateSingleField]
  )

  const handleFieldBlur = useCallback(
    (fieldName: string, value: any) => {
      setTouched(prev => new Set([...prev, fieldName]))
      
      if (validateOnBlur) {
        return validateSingleField(fieldName, value)
      }
    },
    [validateOnBlur, validateSingleField]
  )

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors({})
    setTouched(new Set())
  }, [])

  const isValid = Object.keys(errors).length === 0
  const hasErrors = Object.keys(errors).length > 0

  return {
    errors,
    touched,
    isValidating,
    isValid,
    hasErrors,
    validateField,
    validateForm,
    validateSingleField,
    handleFieldChange,
    handleFieldBlur,
    clearFieldError,
    clearAllErrors,
  }
}

// Credit card validation using Luhn algorithm
function isValidCreditCard(cardNumber: string): boolean {
  if (!/^\d+$/.test(cardNumber)) return false
  if (cardNumber.length < 13 || cardNumber.length > 19) return false

  let sum = 0
  let shouldDouble = false

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i), 10)

    if (shouldDouble) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    shouldDouble = !shouldDouble
  }

  return sum % 10 === 0
}

// Common validation rules
export const commonValidationRules = {
  required: { required: true },
  email: { email: true, required: true },
  phone: { phone: true },
  zipCode: { zipCode: true, required: true },
  creditCard: { creditCard: true, required: true },
  password: { 
    required: true, 
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: 'Password must contain at least 8 characters, including uppercase, lowercase, and number'
  },
  confirmPassword: (originalPassword: string) => ({
    required: true,
    custom: (value: string) => {
      if (value !== originalPassword) {
        return 'Passwords do not match'
      }
      return null
    }
  }),
  name: { required: true, minLength: 2, maxLength: 50 },
  address: { required: true, minLength: 5, maxLength: 100 },
  city: { required: true, minLength: 2, maxLength: 50 },
  state: { required: true, minLength: 2, maxLength: 2 },
}

// Form validation hook with predefined common forms
export const useCheckoutValidation = () => {
  return useFormValidation({
    firstName: [commonValidationRules.name],
    lastName: [commonValidationRules.name],
    email: [commonValidationRules.email],
    phone: [commonValidationRules.phone],
    address: [commonValidationRules.address],
    city: [commonValidationRules.city],
    state: [commonValidationRules.state],
    zipCode: [commonValidationRules.zipCode],
    cardNumber: [commonValidationRules.creditCard],
    expiryDate: [
      { required: true, pattern: /^(0[1-9]|1[0-2])\/\d{2}$/, message: 'Enter date in MM/YY format' }
    ],
    cvv: [
      { required: true, pattern: /^\d{3,4}$/, message: 'Enter 3 or 4 digit CVV' }
    ],
    cardName: [commonValidationRules.name],
  })
}

export const useRegistrationValidation = (password?: string) => {
  return useFormValidation({
    firstName: [commonValidationRules.name],
    lastName: [commonValidationRules.name],
    email: [commonValidationRules.email],
    password: [commonValidationRules.password],
    confirmPassword: [commonValidationRules.confirmPassword(password || '')],
    agreeToTerms: [{ required: true, message: 'You must agree to the terms and conditions' }],
  })
}