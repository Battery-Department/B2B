'use client'

import React from 'react'

interface BboxProps {
  label: string
  children: React.ReactNode
  className?: string
}

export default function Bbox({ label, children, className = '' }: BboxProps) {
  const isDev = process.env.NEXT_PUBLIC_DEV_BBOX === 'true'
  
  if (!isDev) {
    return <>{children}</>
  }
  
  return (
    <div 
      className={`dev-bbox ${className}`}
      data-bbox={label}
    >
      {children}
    </div>
  )
}