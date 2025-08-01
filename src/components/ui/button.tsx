'use client'

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { useRipple, respectsReducedMotion } from "@/hooks/useAnimation"
import { designTokens } from "@/lib/design-tokens"

// Loading spinner component
const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg
    className={cn("animate-spin h-4 w-4", className)}
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
)

const buttonVariants = cva(
  [
    // Base styles
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold",
    "transition-all duration-300 ease-in-out select-none touch-manipulation",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    // Mobile touch targets (44px minimum for accessibility)
    "min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0",
    // High contrast mode support
    "[data-high-contrast='true']:border-2 [data-high-contrast='true']:border-current",
    // Reduced motion support
    "motion-reduce:transition-none motion-reduce:transform-none",
    // Focus management for keyboard users
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-[#006FEE] text-white border-2 border-transparent",
          "hover:bg-[#0050B3] hover:shadow-[0_8px_24px_rgba(0,111,238,0.3)] hover:-translate-y-[2px]",
          "active:translate-y-0 active:shadow-[0_4px_12px_rgba(0,111,238,0.2)] active:scale-[0.98]",
          "focus-visible:ring-[#006FEE] focus-visible:shadow-[0_0_0_3px_rgba(0,111,238,0.1)]",
          "disabled:bg-gray-300 disabled:text-gray-500",
        ].join(" "),
        destructive: [
          "bg-[#EF4444] text-white",
          "hover:bg-[#DC2626] hover:shadow-lithi-button hover:-translate-y-[2px]",
          "active:translate-y-0 active:shadow-lithi",
          "focus-visible:ring-[#EF4444] focus-visible:shadow-lithi-focus",
        ].join(" "),
        outline: [
          "border-2 border-[#E6F4FF] bg-white text-[#006FEE]",
          "hover:bg-[#E6F4FF] hover:border-[#006FEE] hover:shadow-lithi hover:-translate-y-[2px]",
          "active:translate-y-0 active:shadow-lithi-sm",
          "focus-visible:ring-[#006FEE] focus-visible:shadow-lithi-focus",
        ].join(" "),
        secondary: [
          "bg-[#F8FAFC] text-[#374151] border border-[#E5E7EB]",
          "hover:bg-[#F1F5F9] hover:border-[#D1D5DB] hover:shadow-lithi hover:-translate-y-[2px]",
          "active:translate-y-0 active:shadow-lithi-sm",
          "focus-visible:ring-[#006FEE] focus-visible:shadow-lithi-focus",
        ].join(" "),
        ghost: [
          "text-[#374151]",
          "hover:bg-[#F8FAFC] hover:text-[#006FEE] hover:shadow-none",
          "active:bg-[#F1F5F9]",
          "focus-visible:ring-[#006FEE] focus-visible:shadow-lithi-focus",
        ].join(" "),
        link: [
          "text-[#006FEE] underline-offset-4",
          "hover:underline hover:text-[#0050B3]",
          "focus-visible:ring-[#006FEE] focus-visible:shadow-lithi-focus",
        ].join(" "),
        gradient: [
          "bg-gradient-to-r from-[#006FEE] to-[#0050B3] text-white",
          "hover:shadow-lithi-button-hover hover:-translate-y-[2px]",
          "active:translate-y-0 active:shadow-lithi-button",
          "focus-visible:ring-[#006FEE] focus-visible:shadow-lithi-focus",
        ].join(" "),
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
        "icon-lg": "h-12 w-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  enableRipple?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    disabled,
    children,
    enableRipple = true,
    onClick,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    const { createRipple, rippleElements } = useRipple()
    const isDisabled = disabled || loading
    const shouldShowRipple = enableRipple && !respectsReducedMotion() && !isDisabled
    
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (shouldShowRipple) {
        createRipple(event)
      }
      onClick?.(event)
    }
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          shouldShowRipple && "relative overflow-hidden"
        )}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        onClick={handleClick}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner />
            {loadingText || children}
          </>
        ) : (
          children
        )}
        {shouldShowRipple && (
          <span className="absolute inset-0 pointer-events-none">
            {rippleElements}
          </span>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }