'use client'

import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'
import { useTheme } from '../../hooks/useTheme'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useAccessibility } from '../../hooks/useAccessibility'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  footer?: React.ReactNode
  className?: string
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  footer,
  className = '',
}) => {
  const { theme } = useTheme()
  const { shouldAnimate, getAnimationDuration } = useReducedMotion()
  const { trapFocus, restoreFocus, announce, generateId } = useAccessibility()
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  const titleId = generateId('modal-title')
  const descriptionId = generateId('modal-description')

  // Size classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  }

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, closeOnEscape])

  // Focus management
  useEffect(() => {
    if (!isOpen) return

    // Save current focus
    previousActiveElement.current = document.activeElement as HTMLElement

    // Announce modal opening
    if (title) {
      announce(`${title} dialog opened`, 'assertive')
    }

    // Trap focus within modal
    if (modalRef.current) {
      const cleanup = trapFocus(modalRef.current)
      return () => {
        cleanup()
        // Restore focus when closing
        if (previousActiveElement.current) {
          previousActiveElement.current.focus()
        }
      }
    }
  }, [isOpen, title, trapFocus, announce])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    animation: shouldAnimate ? `fadeIn ${getAnimationDuration(200)}ms ease-out` : 'none',
  }

  const modalStyles: React.CSSProperties = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadows.xl,
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    animation: shouldAnimate ? `slideUp ${getAnimationDuration(300)}ms ease-out` : 'none',
  }

  const headerStyles: React.CSSProperties = {
    padding: '1.5rem',
    borderBottom: `1px solid ${theme.colors.border}`,
  }

  const contentStyles: React.CSSProperties = {
    padding: '1.5rem',
    overflowY: 'auto',
    flex: 1,
  }

  const footerStyles: React.CSSProperties = {
    padding: '1.5rem',
    borderTop: `1px solid ${theme.colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  }

  return (
    <>
      {/* Overlay */}
      <div
        style={overlayStyles}
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      >
        {/* Modal */}
        <div
          ref={modalRef}
          className={`${sizeClasses[size]} ${className}`}
          style={modalStyles}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div style={headerStyles}>
              <div className="flex items-start justify-between">
                <div>
                  {title && (
                    <h2
                      id={titleId}
                      className="text-lg font-semibold"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p
                      id={descriptionId}
                      className="mt-1 text-sm"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="-mt-1 -mr-1"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div style={contentStyles}>{children}</div>

          {/* Footer */}
          {footer && <div style={footerStyles}>{footer}</div>}
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes fadeIn {
            from, to {
              opacity: 1;
            }
          }

          @keyframes slideUp {
            from, to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        }
      `}</style>
    </>
  )
}

// Confirmation modal component
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
}) => {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'danger'
      case 'warning':
        return 'warning'
      default:
        return 'primary'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={getConfirmButtonVariant()} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  )
}