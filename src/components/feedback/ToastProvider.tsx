'use client'

import React from 'react'
import { ToastContainer } from './ToastContainer'

export interface ToastProviderProps {
  children: React.ReactNode
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  maxToasts?: number
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  maxToasts = 5,
}) => {
  return (
    <>
      {children}
      <ToastContainer position={position} maxToasts={maxToasts} />
    </>
  )
}