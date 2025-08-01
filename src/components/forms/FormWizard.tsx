'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Check, AlertCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAnimation, useStaggeredChildren } from '@/hooks/useAnimation'
import { useToast } from '@/hooks/useToast'

export interface FormStep {
  id: string
  title: string
  description?: string
  icon?: React.ReactNode
  component: React.ComponentType<FormStepComponentProps>
  validation?: (data: any) => Promise<ValidationResult> | ValidationResult
  optional?: boolean
  condition?: (data: any) => boolean // Show step conditionally
}

export interface ValidationResult {
  isValid: boolean
  errors?: { [field: string]: string }
  warnings?: { [field: string]: string }
}

export interface FormStepComponentProps {
  data: any
  onChange: (data: any) => void
  onValidation: (result: ValidationResult) => void
  isActive: boolean
  errors?: { [field: string]: string }
  warnings?: { [field: string]: string }
}

export interface FormWizardProps {
  steps: FormStep[]
  onComplete: (data: any) => Promise<void> | void
  onCancel?: () => void
  initialData?: any
  persistData?: boolean
  persistKey?: string
  showProgress?: boolean
  allowSkipOptional?: boolean
  validateOnChange?: boolean
  className?: string
}

export interface FormWizardState {
  currentStepIndex: number
  completedSteps: Set<number>
  stepValidation: { [stepIndex: number]: ValidationResult }
  formData: any
  isSubmitting: boolean
}

export const FormWizard: React.FC<FormWizardProps> = ({
  steps,
  onComplete,
  onCancel,
  initialData = {},
  persistData = true,
  persistKey = 'form-wizard-data',
  showProgress = true,
  allowSkipOptional = true,
  validateOnChange = true,
  className = '',
}) => {
  const { showToast } = useToast()
  const { style: containerStyle } = useAnimation('fadeIn', { delay: 100 })
  const { getChildStyle } = useStaggeredChildren(steps.length, 100)

  // Load persisted data
  const loadPersistedData = useCallback(() => {
    if (!persistData || typeof window === 'undefined') return initialData
    
    try {
      const saved = localStorage.getItem(persistKey)
      return saved ? { ...initialData, ...JSON.parse(saved) } : initialData
    } catch {
      return initialData
    }
  }, [persistData, persistKey, initialData])

  const [state, setState] = useState<FormWizardState>(() => ({
    currentStepIndex: 0,
    completedSteps: new Set(),
    stepValidation: {},
    formData: loadPersistedData(),
    isSubmitting: false,
  }))

  // Get visible steps (excluding conditional steps)
  const visibleSteps = steps.filter(step => 
    !step.condition || step.condition(state.formData)
  )

  const currentStep = visibleSteps[state.currentStepIndex]
  const isFirstStep = state.currentStepIndex === 0
  const isLastStep = state.currentStepIndex === visibleSteps.length - 1

  // Persist data changes
  useEffect(() => {
    if (persistData && typeof window !== 'undefined') {
      try {
        localStorage.setItem(persistKey, JSON.stringify(state.formData))
      } catch (error) {
        console.warn('Failed to persist form data:', error)
      }
    }
  }, [state.formData, persistData, persistKey])

  // Clear persisted data when form is completed
  const clearPersistedData = useCallback(() => {
    if (persistData && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(persistKey)
      } catch (error) {
        console.warn('Failed to clear persisted data:', error)
      }
    }
  }, [persistData, persistKey])

  const updateFormData = (newData: any) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...newData }
    }))
  }

  const handleValidation = async (stepIndex: number, result: ValidationResult) => {
    setState(prev => ({
      ...prev,
      stepValidation: {
        ...prev.stepValidation,
        [stepIndex]: result
      }
    }))

    if (result.isValid) {
      setState(prev => ({
        ...prev,
        completedSteps: new Set([...prev.completedSteps, stepIndex])
      }))
    } else {
      setState(prev => ({
        ...prev,
        completedSteps: new Set([...prev.completedSteps].filter(i => i !== stepIndex))
      }))
    }
  }

  const validateCurrentStep = async (): Promise<boolean> => {
    if (!currentStep.validation) return true

    try {
      const result = await currentStep.validation(state.formData)
      await handleValidation(state.currentStepIndex, result)
      
      if (!result.isValid) {
        showToast({
          variant: 'error',
          title: 'Validation Failed',
          description: 'Please fix the errors before continuing.'
        })
      }
      
      return result.isValid
    } catch (error) {
      console.error('Validation error:', error)
      showToast({
        variant: 'error',
        title: 'Validation Error',
        description: 'An error occurred during validation. Please try again.'
      })
      return false
    }
  }

  const goToStep = async (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= visibleSteps.length) return

    // If going forward, validate current step
    if (stepIndex > state.currentStepIndex) {
      const isValid = await validateCurrentStep()
      if (!isValid && !currentStep.optional) return
    }

    setState(prev => ({
      ...prev,
      currentStepIndex: stepIndex
    }))
  }

  const goToNextStep = () => goToStep(state.currentStepIndex + 1)
  const goToPreviousStep = () => goToStep(state.currentStepIndex - 1)

  const handleComplete = async () => {
    // Validate all required steps
    const invalidSteps: string[] = []
    
    for (let i = 0; i < visibleSteps.length; i++) {
      const step = visibleSteps[i]
      if (!step.optional && !state.completedSteps.has(i)) {
        if (step.validation) {
          const result = await step.validation(state.formData)
          if (!result.isValid) {
            invalidSteps.push(step.title)
          }
        }
      }
    }

    if (invalidSteps.length > 0) {
      showToast({
        variant: 'error',
        title: 'Incomplete Form',
        description: `Please complete: ${invalidSteps.join(', ')}`
      })
      return
    }

    setState(prev => ({ ...prev, isSubmitting: true }))

    try {
      await onComplete(state.formData)
      clearPersistedData()
      showToast({
        variant: 'success',
        title: 'Form Completed',
        description: 'Your information has been submitted successfully.'
      })
    } catch (error) {
      console.error('Form submission error:', error)
      showToast({
        variant: 'error',
        title: 'Submission Failed',
        description: 'An error occurred while submitting the form. Please try again.'
      })
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  const getStepStatus = (stepIndex: number) => {
    if (state.completedSteps.has(stepIndex)) return 'completed'
    if (stepIndex === state.currentStepIndex) return 'current'
    if (stepIndex < state.currentStepIndex) return 'incomplete'
    return 'upcoming'
  }

  const currentStepValidation = state.stepValidation[state.currentStepIndex]

  return (
    <div className={`max-w-4xl mx-auto ${className}`} style={containerStyle}>
      {/* Progress indicator */}
      {showProgress && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#0A051E]">
              Step {state.currentStepIndex + 1} of {visibleSteps.length}
            </h2>
            <span className="text-sm text-[#64748B]">
              {Math.round(((state.currentStepIndex + 1) / visibleSteps.length) * 100)}% Complete
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#F3F4F6] rounded-full h-2 mb-6">
            <div
              className="h-2 bg-gradient-to-r from-[#006FEE] to-[#0084FF] rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((state.currentStepIndex + 1) / visibleSteps.length) * 100}%`
              }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-between">
            {visibleSteps.map((step, index) => {
              const status = getStepStatus(index)
              
              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center cursor-pointer group"
                  style={getChildStyle(index)}
                  onClick={() => goToStep(index)}
                >
                  {/* Step circle */}
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-2 transition-all duration-300 ${
                      status === 'completed'
                        ? 'bg-[#10B981] border-[#10B981] text-white'
                        : status === 'current'
                        ? 'bg-[#006FEE] border-[#006FEE] text-white'
                        : status === 'incomplete'
                        ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]'
                        : 'bg-[#F8FAFC] border-[#E5E7EB] text-[#64748B]'
                    } ${
                      index <= state.currentStepIndex ? 'group-hover:scale-110' : ''
                    }`}
                  >
                    {status === 'completed' ? (
                      <Check className="w-5 h-5" />
                    ) : status === 'incomplete' ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : status === 'upcoming' && step.condition ? (
                      <Lock className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>

                  {/* Step label */}
                  <div className="text-center">
                    <div
                      className={`text-sm font-medium mb-1 ${
                        status === 'current'
                          ? 'text-[#006FEE]'
                          : status === 'completed'
                          ? 'text-[#10B981]'
                          : 'text-[#64748B]'
                      }`}
                    >
                      {step.title}
                    </div>
                    {step.optional && (
                      <div className="text-xs text-[#94A3B8]">Optional</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Current step content */}
      <div className="bg-white rounded-xl border-2 border-[#E6F4FF] p-8 mb-8">
        {/* Step header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {currentStep.icon}
            <h3 className="text-xl font-bold text-[#0A051E]">
              {currentStep.title}
            </h3>
          </div>
          {currentStep.description && (
            <p className="text-[#64748B]">{currentStep.description}</p>
          )}
        </div>

        {/* Step component */}
        <currentStep.component
          data={state.formData}
          onChange={updateFormData}
          onValidation={(result) => handleValidation(state.currentStepIndex, result)}
          isActive={true}
          errors={currentStepValidation?.errors}
          warnings={currentStepValidation?.warnings}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {!isFirstStep && (
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={state.isSubmitting}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}
          
          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={state.isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          {currentStep.optional && allowSkipOptional && !isLastStep && (
            <Button
              variant="ghost"
              onClick={goToNextStep}
              disabled={state.isSubmitting}
            >
              Skip
            </Button>
          )}
          
          {!isLastStep ? (
            <Button
              onClick={goToNextStep}
              disabled={
                state.isSubmitting ||
                (!currentStep.optional && !state.completedSteps.has(state.currentStepIndex))
              }
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              loading={state.isSubmitting}
              loadingText="Submitting..."
              disabled={
                state.isSubmitting ||
                visibleSteps.some((step, index) => 
                  !step.optional && !state.completedSteps.has(index)
                )
              }
            >
              Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}