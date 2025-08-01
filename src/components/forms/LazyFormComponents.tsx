'use client'

import { lazy, Suspense, ComponentType } from 'react'
import { LoadingSpinner } from '../ui/LoadingSpinner'

// Lazy load complex form components
const AddressAutocomplete = lazy(() => import('./AddressAutocomplete').then(module => ({ default: module.AddressAutocomplete })))
const PaymentMethodSelector = lazy(() => import('./PaymentMethodSelector').then(module => ({ default: module.PaymentMethodSelector })))
const FormWizard = lazy(() => import('./FormWizard').then(module => ({ default: module.FormWizard })))

// Form loading fallback component
const FormLoadingFallback = ({ type }: { type: string }) => (
  <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 animate-pulse">
    <div className="flex items-center space-x-3">
      <LoadingSpinner size="sm" />
      <p className="text-sm text-gray-500">Loading {type}...</p>
    </div>
    <div className="mt-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
)

// Higher-order component for lazy form wrapper
const withFormLazyLoading = <T extends {}>(
  FormComponent: ComponentType<T>,
  componentName: string
) => {
  return (props: T) => (
    <Suspense fallback={<FormLoadingFallback type={componentName} />}>
      <FormComponent {...props} />
    </Suspense>
  )
}

// Exported lazy form components
export const LazyAddressAutocomplete = withFormLazyLoading(AddressAutocomplete, 'Address Autocomplete')
export const LazyPaymentMethodSelector = withFormLazyLoading(PaymentMethodSelector, 'Payment Method Selector')
export const LazyFormWizard = withFormLazyLoading(FormWizard, 'Form Wizard')

// Form component registry for dynamic loading
export const FORM_COMPONENTS = {
  'address-autocomplete': LazyAddressAutocomplete,
  'payment-method-selector': LazyPaymentMethodSelector,
  'form-wizard': LazyFormWizard,
} as const

export type FormComponentType = keyof typeof FORM_COMPONENTS

// Dynamic form component loader
interface DynamicFormComponentProps {
  type: FormComponentType
  props?: any
}

export const DynamicFormComponent = ({ type, props = {} }: DynamicFormComponentProps) => {
  const FormComponent = FORM_COMPONENTS[type]
  
  if (!FormComponent) {
    return (
      <div className="flex items-center justify-center p-8 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600">Unknown form component: {type}</p>
      </div>
    )
  }

  return <FormComponent {...props} />
}

// Preload form components for better UX
export const preloadFormComponent = (type: FormComponentType) => {
  switch (type) {
    case 'address-autocomplete':
      import('./AddressAutocomplete')
      break
    case 'payment-method-selector':
      import('./PaymentMethodSelector')
      break
    case 'form-wizard':
      import('./FormWizard')
      break
  }
}

// Smart form component loader with progressive enhancement
interface SmartFormProps {
  type: FormComponentType
  fallbackComponent?: ComponentType<any>
  preload?: boolean
  props?: any
}

export const SmartFormComponent = ({ 
  type, 
  fallbackComponent: Fallback, 
  preload = false,
  props = {} 
}: SmartFormProps) => {
  // Preload if requested
  if (preload) {
    preloadFormComponent(type)
  }

  const FormComponent = FORM_COMPONENTS[type]

  if (!FormComponent) {
    if (Fallback) {
      return <Fallback {...props} />
    }
    return (
      <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
        <p className="text-yellow-800">Form component '{type}' not available</p>
      </div>
    )
  }

  return (
    <Suspense 
      fallback={
        Fallback ? <Fallback {...props} loading /> : <FormLoadingFallback type={type} />
      }
    >
      <FormComponent {...props} />
    </Suspense>
  )
}

// Bundle size optimization utilities
export const getFormComponentStats = () => {
  return {
    totalComponents: Object.keys(FORM_COMPONENTS).length,
    availableTypes: Object.keys(FORM_COMPONENTS) as FormComponentType[],
    loadedComponents: [], // This would be populated by a module tracker in a real implementation
  }
}

// Form component feature detection
export const supportsFormComponent = (type: FormComponentType): boolean => {
  return type in FORM_COMPONENTS
}

// Progressive loading for checkout flow
export const preloadCheckoutComponents = () => {
  // Preload critical checkout components
  preloadFormComponent('payment-method-selector')
  preloadFormComponent('address-autocomplete')
}