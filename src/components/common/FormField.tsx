'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input, InputProps } from '@/components/ui/input'
import { AlertCircle, CheckCircle } from 'lucide-react'

export interface FormFieldProps extends InputProps {
  label?: string
  description?: string
  error?: string
  success?: string
  required?: boolean
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({
    className,
    label,
    description,
    error,
    success,
    required,
    id,
    ...props
  }, ref) => {
    const fieldId = id || `field-${React.useId()}`
    const hasError = !!error
    const hasSuccess = !!success && !hasError

    return (
      <div className="space-y-2">
        {label && (
          <Label
            htmlFor={fieldId}
            className={cn(
              "text-sm font-medium",
              hasError && "text-[#EF4444]",
              hasSuccess && "text-[#10B981]"
            )}
          >
            {label}
            {required && <span className="text-[#EF4444] ml-1">*</span>}
          </Label>
        )}

        {description && !hasError && !hasSuccess && (
          <p className="text-xs text-[#64748B]">{description}</p>
        )}

        <div className="relative">
          <Input
            ref={ref}
            id={fieldId}
            error={hasError}
            success={hasSuccess}
            className={className}
            {...props}
          />
          
          {(hasError || hasSuccess) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {hasError && <AlertCircle className="w-4 h-4 text-[#EF4444]" />}
              {hasSuccess && <CheckCircle className="w-4 h-4 text-[#10B981]" />}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-[#EF4444] flex items-center gap-1 animate-fade-in">
            {error}
          </p>
        )}

        {success && (
          <p className="text-xs text-[#10B981] flex items-center gap-1 animate-fade-in">
            {success}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

export { FormField }