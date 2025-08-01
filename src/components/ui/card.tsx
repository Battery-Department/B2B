'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { useHover, respectsReducedMotion } from "@/hooks/useAnimation"

const cardVariants = cva(
  [
    "rounded-xl bg-white transition-all duration-300 ease-in-out",
    "border-2",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "border-[#E6F4FF] shadow-lithi-lg",
          "hover:shadow-lithi-xl hover:-translate-y-1",
        ].join(" "),
        outline: [
          "border-[#E5E7EB] shadow-none",
          "hover:border-[#D1D5DB] hover:shadow-lithi",
        ].join(" "),
        elevated: [
          "border-[#E6F4FF] shadow-lithi-xl",
          "hover:shadow-2xl hover:-translate-y-2",
        ].join(" "),
        interactive: [
          "border-[#E6F4FF] shadow-lithi cursor-pointer",
          "hover:border-[#006FEE] hover:shadow-lithi-xl hover:-translate-y-1",
          "active:translate-y-0 active:shadow-lithi",
        ].join(" "),
        flat: [
          "border-transparent shadow-none bg-[#F8FAFC]",
          "hover:bg-[#F1F5F9]",
        ].join(" "),
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  hoverable?: boolean
  enhancedHover?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hoverable, enhancedHover = true, style, ...props }, ref) => {
    const { isHovered, hoverProps, getHoverStyle } = useHover()
    const shouldUseEnhancedHover = enhancedHover && !respectsReducedMotion()
    
    const cardStyle = shouldUseEnhancedHover 
      ? getHoverStyle(style || {}, {
          transform: hoverable ? 'translateY(-4px)' : 'translateY(-2px)',
          boxShadow: hoverable 
            ? '0 16px 48px rgba(0, 111, 238, 0.2)' 
            : '0 8px 24px rgba(0, 111, 238, 0.15)',
        })
      : style

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant: hoverable ? "interactive" : variant, padding }),
          className
        )}
        style={cardStyle}
        {...(shouldUseEnhancedHover ? hoverProps : {})}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 px-6 pt-6 pb-2",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-bold leading-none tracking-tight text-[#0A051E]",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[#64748B]", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-6 pb-6 pt-2", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center px-6 pb-6 pt-0",
      "border-t border-[#E6F4FF] mt-6 pt-6",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }