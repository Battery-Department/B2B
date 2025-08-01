'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { useFocus, respectsReducedMotion } from "@/hooks/useAnimation"
import { designTokens } from "@/lib/design-tokens"

const inputVariants = cva(
  [
    "flex w-full rounded-lg transition-all duration-300 ease-in-out",
    "border-2 placeholder:text-[#94A3B8]",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F1F5F9]",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
    // Mobile optimizations
    "text-base md:text-sm", // Larger text on mobile to prevent zoom
    "min-h-[44px] md:min-h-0", // Touch target for mobile
    // High contrast support
    "[data-high-contrast='true']:border-current",
    // Reduced motion support
    "motion-reduce:transition-none motion-reduce:transform-none",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "border-[#E6F4FF] bg-[#F9FAFB] text-[#374151]",
          "hover:border-[#93C5FD] hover:bg-white",
          "focus:border-[#006FEE] focus:bg-white focus:ring-[#006FEE]/20 focus:shadow-[0_0_0_3px_rgba(0,111,238,0.1)]",
          "read-only:bg-gray-50 read-only:border-gray-200 read-only:cursor-default",
        ].join(" "),
        outline: [
          "border-[#E5E7EB] bg-white text-[#374151]",
          "hover:border-[#D1D5DB]",
          "focus:border-[#006FEE] focus:ring-[#006FEE]/20",
        ].join(" "),
        filled: [
          "border-transparent bg-[#F8FAFC] text-[#374151]",
          "hover:bg-[#F1F5F9]",
          "focus:bg-white focus:border-[#006FEE] focus:ring-[#006FEE]/20",
        ].join(" "),
        error: [
          "border-[#FCA5A5] bg-[#FEE2E2] text-[#DC2626]",
          "hover:border-[#EF4444]",
          "focus:border-[#EF4444] focus:bg-white focus:ring-[#EF4444]/20 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]",
          "placeholder:text-[#F87171]",
        ].join(" "),
        success: [
          "border-[#BBF7D0] bg-[#F0FDF4] text-[#059669]",
          "hover:border-[#10B981]",
          "focus:border-[#10B981] focus:bg-white focus:ring-[#10B981]/20",
        ].join(" "),
      },
      inputSize: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 py-1 text-sm",
        lg: "h-12 px-5 py-3 text-lg",
        xl: "h-14 px-6 py-4 text-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  error?: boolean
  success?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  enhancedFocus?: boolean
  helpText?: string
  errorMessage?: string
  label?: string
  required?: boolean
  clearable?: boolean
  loading?: boolean
  onClear?: () => void
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    variant,
    inputSize,
    error,
    success,
    icon,
    iconPosition = "left",
    enhancedFocus = true,
    helpText,
    errorMessage,
    label,
    required,
    clearable,
    loading,
    onClear,
    onFocus,
    onBlur,
    ...props 
  }, ref) => {
    const { isFocused, focusProps, getFocusStyle } = useFocus()
    const [hasValue, setHasValue] = React.useState(Boolean(props.value || props.defaultValue))
    const [internalValue, setInternalValue] = React.useState(props.value || props.defaultValue || '')
    const inputId = React.useId()
    const helpTextId = React.useId()
    const errorId = React.useId()
    
    // Determine variant based on error/success state
    const effectiveVariant = error ? "error" : success ? "success" : variant

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (enhancedFocus) focusProps.onFocus()
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (enhancedFocus) focusProps.onBlur()
      setHasValue(e.target.value.length > 0)
      onBlur?.(e)
    }
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setInternalValue(value)
      setHasValue(value.length > 0)
      props.onChange?.(e)
    }
    
    const handleClear = () => {
      setInternalValue('')
      setHasValue(false)
      onClear?.()
    }

    const inputElement = (
      <input
        id={props.id || inputId}
        type={type}
        className={cn(
          inputVariants({ variant: effectiveVariant, inputSize }),
          icon && iconPosition === "left" && "pl-10",
          icon && iconPosition === "right" && "pr-10",
          clearable && hasValue && "pr-10",
          loading && "pr-10",
          enhancedFocus && isFocused && !respectsReducedMotion() && "transform scale-[1.02]",
          className
        )}
        style={enhancedFocus ? getFocusStyle({}) : undefined}
        value={internalValue}
        aria-describedby={cn(
          helpText && helpTextId,
          (error || errorMessage) && errorId
        )}
        aria-invalid={error || Boolean(errorMessage)}
        aria-required={required}
        ref={ref}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        {...props}
      />
    )

    const inputWrapper = (
      <div className="relative">
        {icon && iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none z-10">
            {icon}
          </div>
        )}
        {inputElement}
        {icon && iconPosition === "right" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none z-10">
            {icon}
          </div>
        )}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
            <svg
              className="animate-spin h-4 w-4 text-[#006FEE]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
        {clearable && hasValue && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#374151] transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-[#006FEE]/20 rounded"
            aria-label="Clear input"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    )
    
    // Full input with label, help text, and error message
    if (label || helpText || errorMessage) {
      return (
        <div className="space-y-2">
          {label && (
            <label
              htmlFor={props.id || inputId}
              className={cn(
                "block text-sm font-medium text-[#374151]",
                required && "after:content-['*'] after:ml-0.5 after:text-[#EF4444]"
              )}
            >
              {label}
            </label>
          )}
          {inputWrapper}
          {helpText && !error && !errorMessage && (
            <p id={helpTextId} className="text-sm text-[#64748B]">
              {helpText}
            </p>
          )}
          {(error || errorMessage) && (
            <p id={errorId} className="text-sm text-[#EF4444] flex items-center gap-1">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errorMessage || "This field has an error"}
            </p>
          )}
        </div>
      )
    }
    
    return inputWrapper
  }
)
Input.displayName = "Input"

export { Input, inputVariants }