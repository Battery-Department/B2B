'use client'

import React, { createContext, useContext, useState, ReactNode, Children, cloneElement, isValidElement } from 'react'

// Generic compound component utilities
interface CompoundComponentConfig {
  displayName: string
  defaultProps?: Record<string, any>
  contextValue?: any
}

export function createCompoundComponent<T extends Record<string, any>>(
  config: CompoundComponentConfig
) {
  const Context = createContext<T | null>(null)
  
  const useCompoundContext = () => {
    const context = useContext(Context)
    if (!context) {
      throw new Error(`Compound component must be used within ${config.displayName}`)
    }
    return context
  }

  return { Context, useCompoundContext }
}

// Modal Compound Component
interface ModalContextType {
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
}

const { Context: ModalContext, useCompoundContext: useModalContext } = 
  createCompoundComponent<ModalContextType>({ displayName: 'Modal' })

interface ModalProps {
  children: ReactNode
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export const Modal = ({ children, defaultOpen = false, onOpenChange }: ModalProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const onClose = () => {
    setIsOpen(false)
    onOpenChange?.(false)
  }

  const onOpen = () => {
    setIsOpen(true)
    onOpenChange?.(true)
  }

  return (
    <ModalContext.Provider value={{ isOpen, onClose, onOpen }}>
      {children}
    </ModalContext.Provider>
  )
}

const ModalTrigger = ({ children }: { children: ReactNode }) => {
  const { onOpen } = useModalContext()
  
  return (
    <div onClick={onOpen} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  )
}

const ModalContent = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  const { isOpen, onClose } = useModalContext()

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}>
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {children}
      </div>
    </div>
  )
}

const ModalHeader = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`px-6 py-4 border-b ${className}`}>
    {children}
  </div>
)

const ModalBody = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
)

const ModalFooter = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`px-6 py-4 border-t flex justify-end space-x-2 ${className}`}>
    {children}
  </div>
)

const ModalClose = ({ children }: { children: ReactNode }) => {
  const { onClose } = useModalContext()
  
  return (
    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
      {children}
    </button>
  )
}

Modal.Trigger = ModalTrigger
Modal.Content = ModalContent
Modal.Header = ModalHeader
Modal.Body = ModalBody
Modal.Footer = ModalFooter
Modal.Close = ModalClose

// Dropdown Compound Component
interface DropdownContextType {
  isOpen: boolean
  toggle: () => void
  close: () => void
  selectedValue: string | null
  onSelect: (value: string) => void
}

const { Context: DropdownContext, useCompoundContext: useDropdownContext } = 
  createCompoundComponent<DropdownContextType>({ displayName: 'Dropdown' })

interface DropdownProps {
  children: ReactNode
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export const Dropdown = ({ children, defaultValue = null, onValueChange }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(defaultValue)

  const toggle = () => setIsOpen(!isOpen)
  const close = () => setIsOpen(false)
  
  const onSelect = (value: string) => {
    setSelectedValue(value)
    setIsOpen(false)
    onValueChange?.(value)
  }

  return (
    <DropdownContext.Provider value={{ isOpen, toggle, close, selectedValue, onSelect }}>
      <div className="relative">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

const DropdownTrigger = ({ children }: { children: ReactNode }) => {
  const { toggle } = useDropdownContext()
  
  return (
    <button onClick={toggle} className="dropdown-trigger">
      {children}
    </button>
  )
}

const DropdownContent = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  const { isOpen, close } = useDropdownContext()

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={close} />
      <div className={`absolute top-full left-0 z-20 bg-white border border-gray-200 rounded-md shadow-lg min-w-full ${className}`}>
        {children}
      </div>
    </>
  )
}

const DropdownItem = ({ 
  children, 
  value, 
  className = '' 
}: { 
  children: ReactNode
  value: string
  className?: string 
}) => {
  const { onSelect, selectedValue } = useDropdownContext()
  const isSelected = selectedValue === value
  
  return (
    <button
      onClick={() => onSelect(value)}
      className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${isSelected ? 'bg-blue-50 text-blue-600' : ''} ${className}`}
    >
      {children}
    </button>
  )
}

Dropdown.Trigger = DropdownTrigger
Dropdown.Content = DropdownContent
Dropdown.Item = DropdownItem

// Accordion Compound Component
interface AccordionContextType {
  openItems: Set<string>
  toggle: (itemId: string) => void
  allowMultiple: boolean
}

const { Context: AccordionContext, useCompoundContext: useAccordionContext } = 
  createCompoundComponent<AccordionContextType>({ displayName: 'Accordion' })

interface AccordionProps {
  children: ReactNode
  allowMultiple?: boolean
  defaultOpenItems?: string[]
}

export const Accordion = ({ children, allowMultiple = false, defaultOpenItems = [] }: AccordionProps) => {
  const [openItems, setOpenItems] = useState(new Set(defaultOpenItems))

  const toggle = (itemId: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev)
      
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        if (!allowMultiple) {
          newSet.clear()
        }
        newSet.add(itemId)
      }
      
      return newSet
    })
  }

  return (
    <AccordionContext.Provider value={{ openItems, toggle, allowMultiple }}>
      <div className="accordion">
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

const AccordionItem = ({ 
  children, 
  itemId, 
  className = '' 
}: { 
  children: ReactNode
  itemId: string
  className?: string 
}) => {
  const { openItems } = useAccordionContext()
  const isOpen = openItems.has(itemId)

  return (
    <div className={`border-b ${className}`} data-item-id={itemId} data-open={isOpen}>
      {children}
    </div>
  )
}

const AccordionTrigger = ({ 
  children, 
  itemId, 
  className = '' 
}: { 
  children: ReactNode
  itemId: string
  className?: string 
}) => {
  const { toggle } = useAccordionContext()
  
  return (
    <button
      onClick={() => toggle(itemId)}
      className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 ${className}`}
    >
      {children}
      <span className="text-gray-400">▼</span>
    </button>
  )
}

const AccordionContent = ({ 
  children, 
  itemId, 
  className = '' 
}: { 
  children: ReactNode
  itemId: string
  className?: string 
}) => {
  const { openItems } = useAccordionContext()
  const isOpen = openItems.has(itemId)

  if (!isOpen) return null

  return (
    <div className={`px-4 py-3 bg-gray-50 ${className}`}>
      {children}
    </div>
  )
}

Accordion.Item = AccordionItem
Accordion.Trigger = AccordionTrigger
Accordion.Content = AccordionContent

// Tabs Compound Component
interface TabsContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const { Context: TabsContext, useCompoundContext: useTabsContext } = 
  createCompoundComponent<TabsContextType>({ displayName: 'Tabs' })

interface TabsProps {
  children: ReactNode
  defaultTab: string
  onTabChange?: (tab: string) => void
}

export const Tabs = ({ children, defaultTab, onTabChange }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    onTabChange?.(tab)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className="tabs">
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const TabsList = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`flex border-b ${className}`}>
    {children}
  </div>
)

const TabsTrigger = ({ 
  children, 
  value, 
  className = '' 
}: { 
  children: ReactNode
  value: string
  className?: string 
}) => {
  const { activeTab, setActiveTab } = useTabsContext()
  const isActive = activeTab === value

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-4 py-2 border-b-2 transition-colors ${
        isActive 
          ? 'border-blue-500 text-blue-600' 
          : 'border-transparent text-gray-600 hover:text-gray-800'
      } ${className}`}
    >
      {children}
    </button>
  )
}

const TabsContent = ({ 
  children, 
  value, 
  className = '' 
}: { 
  children: ReactNode
  value: string
  className?: string 
}) => {
  const { activeTab } = useTabsContext()
  const isActive = activeTab === value

  if (!isActive) return null

  return (
    <div className={`pt-4 ${className}`}>
      {children}
    </div>
  )
}

Tabs.List = TabsList
Tabs.Trigger = TabsTrigger
Tabs.Content = TabsContent

// Form Compound Component with Validation
interface FormContextType {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  setValue: (name: string, value: any) => void
  setError: (name: string, error: string) => void
  clearError: (name: string) => void
  setTouched: (name: string) => void
  validate: () => boolean
  isSubmitting: boolean
}

const { Context: FormContext, useCompoundContext: useFormContext } = 
  createCompoundComponent<FormContextType>({ displayName: 'Form' })

interface FormProps {
  children: ReactNode
  initialValues?: Record<string, any>
  validationSchema?: Record<string, (value: any) => string | null>
  onSubmit: (values: Record<string, any>) => void | Promise<void>
}

export const Form = ({ children, initialValues = {}, validationSchema = {}, onSubmit }: FormProps) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouchedState] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setValue = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Validate on change if field was touched
    if (touched[name] && validationSchema[name]) {
      const error = validationSchema[name](value)
      if (error) {
        setErrors(prev => ({ ...prev, [name]: error }))
      } else {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[name]
          return newErrors
        })
      }
    }
  }

  const setError = (name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const clearError = (name: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
  }

  const setTouched = (name: string) => {
    setTouchedState(prev => ({ ...prev, [name]: true }))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    Object.entries(validationSchema).forEach(([field, validator]) => {
      const error = validator(values[field])
      if (error) {
        newErrors[field] = error
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormContext.Provider value={{
      values,
      errors,
      touched,
      setValue,
      setError,
      clearError,
      setTouched,
      validate,
      isSubmitting
    }}>
      <form onSubmit={handleSubmit}>
        {children}
      </form>
    </FormContext.Provider>
  )
}

const FormField = ({ 
  name, 
  children, 
  className = '' 
}: { 
  name: string
  children: ReactNode
  className?: string 
}) => {
  const { errors } = useFormContext()
  const hasError = !!errors[name]

  return (
    <div className={`form-field ${hasError ? 'has-error' : ''} ${className}`}>
      {children}
      {hasError && (
        <span className="text-red-500 text-sm mt-1">{errors[name]}</span>
      )}
    </div>
  )
}

const FormInput = ({ 
  name, 
  type = 'text', 
  placeholder,
  className = '' 
}: { 
  name: string
  type?: string
  placeholder?: string
  className?: string 
}) => {
  const { values, setValue, setTouched } = useFormContext()

  return (
    <input
      type={type}
      name={name}
      value={values[name] || ''}
      placeholder={placeholder}
      onChange={(e) => setValue(name, e.target.value)}
      onBlur={() => setTouched(name)}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  )
}

const FormSubmit = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  const { isSubmitting } = useFormContext()

  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 ${className}`}
    >
      {isSubmitting ? 'Submitting...' : children}
    </button>
  )
}

Form.Field = FormField
Form.Input = FormInput
Form.Submit = FormSubmit