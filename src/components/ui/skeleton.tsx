import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const skeletonVariants = cva(
  "animate-pulse rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#F1F5F9] via-[#E5E7EB] to-[#F1F5F9] bg-[length:200%_100%]",
        light: "bg-[#F8FAFC]",
        primary: "bg-gradient-to-r from-[#E6F4FF] via-[#93C5FD] to-[#E6F4FF] bg-[length:200%_100%]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({
  className,
  variant,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  )
}

// Pre-built skeleton components for common use cases
const SkeletonCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border-2 border-[#E6F4FF] bg-white p-6 space-y-4",
      className
    )}
    {...props}
  >
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-6 w-2/3" />
    </div>
    <Skeleton className="h-20 w-full" />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
))
SkeletonCard.displayName = "SkeletonCard"

const SkeletonLine = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Skeleton
    ref={ref}
    className={cn("h-4 w-full", className)}
    {...props}
  />
))
SkeletonLine.displayName = "SkeletonLine"

const SkeletonButton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Skeleton
    ref={ref}
    className={cn("h-10 w-24 rounded-lg", className)}
    {...props}
  />
))
SkeletonButton.displayName = "SkeletonButton"

const SkeletonAvatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Skeleton
    ref={ref}
    className={cn("h-10 w-10 rounded-full", className)}
    {...props}
  />
))
SkeletonAvatar.displayName = "SkeletonAvatar"

const SkeletonInput = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Skeleton
    ref={ref}
    className={cn("h-10 w-full rounded-lg", className)}
    {...props}
  />
))
SkeletonInput.displayName = "SkeletonInput"

const SkeletonTable = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full space-y-3", className)}
    {...props}
  >
    <div className="flex gap-4">
      <Skeleton className="h-6 flex-1" />
      <Skeleton className="h-6 flex-1" />
      <Skeleton className="h-6 flex-1" />
      <Skeleton className="h-6 w-20" />
    </div>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-20" />
      </div>
    ))}
  </div>
))
SkeletonTable.displayName = "SkeletonTable"

// Custom skeleton animation styles
const skeletonStyles = `
  @keyframes skeleton-shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  .animate-pulse {
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = skeletonStyles
  document.head.appendChild(styleElement)
}

export { 
  Skeleton,
  SkeletonCard,
  SkeletonLine,
  SkeletonButton,
  SkeletonAvatar,
  SkeletonInput,
  SkeletonTable,
  skeletonVariants 
}