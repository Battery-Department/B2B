'use client'

import { apiClient } from '../api/ui-api-client'

// Validation rule types
export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'min' | 'max' | 'pattern' | 'custom' | 'async'
  value?: any
  message: string
  validator?: (value: any, formData: Record<string, any>) => boolean | Promise<boolean>
  asyncEndpoint?: string
  debounceMs?: number
}

export interface FieldConfig {
  name: string
  label: string
  type: 'text' | 'email' | 'phone' | 'number' | 'password' | 'select' | 'checkbox' | 'textarea'
  rules: ValidationRule[]
  dependencies?: string[] // Fields this field depends on
  defaultValue?: any
  placeholder?: string
  options?: Array<{ value: any; label: string }> // For select fields
}

export interface FormConfig {
  fields: FieldConfig[]
  submitEndpoint?: string
  autoSave?: {
    enabled: boolean
    endpoint: string
    intervalMs: number
    storageKey: string
  }
  onSubmit?: (formData: Record<string, any>) => Promise<any>
  validateOnChange?: boolean
  validateOnBlur?: boolean
  showErrorsInline?: boolean
}

export interface ValidationError {
  field: string
  message: string
  type: string
}

export interface FormState {
  values: Record<string, any>
  errors: ValidationError[]
  touched: Record<string, boolean>
  isSubmitting: boolean
  isValid: boolean
  isDirty: boolean
  submitCount: number
}

// Async validation cache
interface AsyncValidationCache {
  [key: string]: {
    result: boolean
    timestamp: number
    ttl: number
  }
}

export class FormValidationEngine {
  private config: FormConfig
  private state: FormState
  private listeners: Set<(state: FormState) => void> = new Set()
  private asyncValidationCache: AsyncValidationCache = {}
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map()
  private autoSaveTimer?: NodeJS.Timeout

  constructor(config: FormConfig) {
    this.config = config
    this.state = this.initializeState()
    
    // Setup auto-save if enabled
    if (config.autoSave?.enabled) {
      this.setupAutoSave()
    }
  }

  // Initialize form state
  private initializeState(): FormState {
    const values: Record<string, any> = {}
    
    // Set default values
    this.config.fields.forEach(field => {
      values[field.name] = field.defaultValue ?? ''
    })

    // Try to restore from storage if auto-save is enabled
    if (this.config.autoSave?.enabled) {
      const saved = this.loadFromStorage()
      if (saved) {
        Object.assign(values, saved)
      }
    }

    return {
      values,
      errors: [],
      touched: {},
      isSubmitting: false,
      isValid: true,
      isDirty: false,
      submitCount: 0,
    }
  }

  // Subscribe to state changes
  subscribe(listener: (state: FormState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Notify listeners of state changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state))
  }

  // Update state and notify listeners
  private updateState(updates: Partial<FormState>): void {
    this.state = { ...this.state, ...updates }
    this.notifyListeners()
  }

  // Get current form state
  getState(): FormState {
    return { ...this.state }
  }

  // Set field value
  async setValue(fieldName: string, value: any): Promise<void> {
    const newValues = { ...this.state.values, [fieldName]: value }
    const isDirty = this.checkIfDirty(newValues)
    
    this.updateState({
      values: newValues,
      isDirty,
      touched: { ...this.state.touched, [fieldName]: true },
    })

    // Validate on change if enabled
    if (this.config.validateOnChange) {
      await this.validateField(fieldName)
    }

    // Handle field dependencies
    await this.handleFieldDependencies(fieldName)

    // Auto-save if enabled
    if (this.config.autoSave?.enabled && isDirty) {
      this.scheduleAutoSave()
    }
  }

  // Set multiple values at once
  async setValues(values: Record<string, any>): Promise<void> {
    const newValues = { ...this.state.values, ...values }
    const isDirty = this.checkIfDirty(newValues)
    
    const touched = { ...this.state.touched }
    Object.keys(values).forEach(key => {
      touched[key] = true
    })

    this.updateState({
      values: newValues,
      isDirty,
      touched,
    })

    // Validate all changed fields
    if (this.config.validateOnChange) {
      await this.validateFields(Object.keys(values))
    }
  }

  // Mark field as touched
  setTouched(fieldName: string, touched: boolean = true): void {
    this.updateState({
      touched: { ...this.state.touched, [fieldName]: touched },
    })
  }

  // Validate single field
  async validateField(fieldName: string): Promise<ValidationError[]> {
    const field = this.config.fields.find(f => f.name === fieldName)
    if (!field) return []

    const value = this.state.values[fieldName]
    const errors: ValidationError[] = []

    // Run all validation rules
    for (const rule of field.rules) {
      const error = await this.executeValidationRule(field, rule, value)
      if (error) {
        errors.push(error)
        break // Stop at first error for this field
      }
    }

    // Update state with new errors
    const updatedErrors = this.state.errors.filter(e => e.field !== fieldName)
    if (errors.length > 0) {
      updatedErrors.push(...errors)
    }

    const isValid = updatedErrors.length === 0
    this.updateState({ errors: updatedErrors, isValid })

    return errors
  }

  // Validate multiple fields
  async validateFields(fieldNames: string[]): Promise<ValidationError[]> {
    const allErrors: ValidationError[] = []
    
    for (const fieldName of fieldNames) {
      const errors = await this.validateField(fieldName)
      allErrors.push(...errors)
    }

    return allErrors
  }

  // Validate all fields
  async validateAll(): Promise<boolean> {
    const fieldNames = this.config.fields.map(f => f.name)
    await this.validateFields(fieldNames)
    return this.state.isValid
  }

  // Execute individual validation rule
  private async executeValidationRule(
    field: FieldConfig, 
    rule: ValidationRule, 
    value: any
  ): Promise<ValidationError | null> {
    try {
      let isValid = false

      switch (rule.type) {
        case 'required':
          isValid = this.validateRequired(value)
          break
        
        case 'email':
          isValid = this.validateEmail(value)
          break
        
        case 'phone':
          isValid = this.validatePhone(value)
          break
        
        case 'min':
          isValid = this.validateMin(value, rule.value)
          break
        
        case 'max':
          isValid = this.validateMax(value, rule.value)
          break
        
        case 'pattern':
          isValid = this.validatePattern(value, rule.value)
          break
        
        case 'custom':
          if (rule.validator) {
            isValid = await rule.validator(value, this.state.values)
          }
          break
        
        case 'async':
          isValid = await this.validateAsync(field.name, value, rule)
          break
      }

      if (!isValid) {
        return {
          field: field.name,
          message: rule.message,
          type: rule.type,
        }
      }

      return null
    } catch (error) {
      console.error(`Validation error for field ${field.name}:`, error)
      return {
        field: field.name,
        message: 'Validation failed',
        type: 'error',
      }
    }
  }

  // Built-in validators
  private validateRequired(value: any): boolean {
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'boolean') return true
    return value !== null && value !== undefined && String(value).trim() !== ''
  }

  private validateEmail(value: any): boolean {
    if (!value) return true // Allow empty for optional fields
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(String(value))
  }

  private validatePhone(value: any): boolean {
    if (!value) return true
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/
    return phoneRegex.test(String(value)) && String(value).replace(/\D/g, '').length >= 10
  }

  private validateMin(value: any, min: number): boolean {
    if (typeof value === 'number') return value >= min
    if (typeof value === 'string') return value.length >= min
    if (Array.isArray(value)) return value.length >= min
    return true
  }

  private validateMax(value: any, max: number): boolean {
    if (typeof value === 'number') return value <= max
    if (typeof value === 'string') return value.length <= max
    if (Array.isArray(value)) return value.length <= max
    return true
  }

  private validatePattern(value: any, pattern: string | RegExp): boolean {
    if (!value) return true
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    return regex.test(String(value))
  }

  // Async validation with caching and debouncing
  private async validateAsync(fieldName: string, value: any, rule: ValidationRule): Promise<boolean> {
    if (!rule.asyncEndpoint) return true

    // Create cache key
    const cacheKey = `${fieldName}:${JSON.stringify(value)}:${rule.asyncEndpoint}`
    
    // Check cache first
    const cached = this.asyncValidationCache[cacheKey]
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.result
    }

    // Debounce async calls
    if (rule.debounceMs) {
      return new Promise((resolve) => {
        const existingTimer = this.debounceTimers.get(fieldName)
        if (existingTimer) {
          clearTimeout(existingTimer)
        }

        const timer = setTimeout(async () => {
          const result = await this.performAsyncValidation(rule.asyncEndpoint!, value)
          this.cacheAsyncResult(cacheKey, result)
          resolve(result)
        }, rule.debounceMs)

        this.debounceTimers.set(fieldName, timer)
      })
    }

    // Immediate async validation
    const result = await this.performAsyncValidation(rule.asyncEndpoint, value)
    this.cacheAsyncResult(cacheKey, result)
    return result
  }

  private async performAsyncValidation(endpoint: string, value: any): Promise<boolean> {
    try {
      const response = await apiClient.post(endpoint, { value })
      return response.data?.isValid ?? false
    } catch (error) {
      console.error('Async validation failed:', error)
      return false
    }
  }

  private cacheAsyncResult(key: string, result: boolean): void {
    this.asyncValidationCache[key] = {
      result,
      timestamp: Date.now(),
      ttl: 300000, // 5 minutes
    }
  }

  // Handle field dependencies
  private async handleFieldDependencies(changedField: string): Promise<void> {
    const dependentFields = this.config.fields.filter(
      field => field.dependencies?.includes(changedField)
    )

    for (const field of dependentFields) {
      await this.validateField(field.name)
    }
  }

  // Check if form is dirty
  private checkIfDirty(values: Record<string, any>): boolean {
    return this.config.fields.some(field => {
      const currentValue = values[field.name]
      const defaultValue = field.defaultValue ?? ''
      return currentValue !== defaultValue
    })
  }

  // Form submission
  async submit(): Promise<any> {
    this.updateState({ 
      isSubmitting: true, 
      submitCount: this.state.submitCount + 1 
    })

    try {
      // Validate all fields first
      const isValid = await this.validateAll()
      
      if (!isValid) {
        throw new Error('Form validation failed')
      }

      // Call custom submit handler or use default endpoint
      let result
      if (this.config.onSubmit) {
        result = await this.config.onSubmit(this.state.values)
      } else if (this.config.submitEndpoint) {
        const response = await apiClient.post(this.config.submitEndpoint, this.state.values)
        result = response.data
      } else {
        throw new Error('No submit handler or endpoint configured')
      }

      // Clear auto-save data on successful submit
      if (this.config.autoSave?.enabled) {
        this.clearStorage()
      }

      this.updateState({ isSubmitting: false, isDirty: false })
      return result

    } catch (error) {
      this.updateState({ isSubmitting: false })
      throw error
    }
  }

  // Auto-save functionality
  private setupAutoSave(): void {
    if (!this.config.autoSave) return

    // Load saved data on initialization
    const saved = this.loadFromStorage()
    if (saved) {
      this.updateState({ values: { ...this.state.values, ...saved } })
    }
  }

  private scheduleAutoSave(): void {
    if (!this.config.autoSave?.enabled) return

    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer)
    }

    this.autoSaveTimer = setTimeout(() => {
      this.performAutoSave()
    }, this.config.autoSave.intervalMs || 2000)
  }

  private async performAutoSave(): Promise<void> {
    if (!this.config.autoSave || !this.state.isDirty) return

    try {
      // Save to local storage
      this.saveToStorage(this.state.values)

      // Save to server if endpoint provided
      if (this.config.autoSave.endpoint) {
        await apiClient.post(this.config.autoSave.endpoint, {
          formData: this.state.values,
          timestamp: Date.now(),
        })
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }

  private saveToStorage(data: Record<string, any>): void {
    if (!this.config.autoSave?.storageKey) return
    
    try {
      localStorage.setItem(this.config.autoSave.storageKey, JSON.stringify({
        data,
        timestamp: Date.now(),
      }))
    } catch (error) {
      console.error('Failed to save to storage:', error)
    }
  }

  private loadFromStorage(): Record<string, any> | null {
    if (!this.config.autoSave?.storageKey) return null
    
    try {
      const saved = localStorage.getItem(this.config.autoSave.storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.data
      }
    } catch (error) {
      console.error('Failed to load from storage:', error)
    }
    
    return null
  }

  private clearStorage(): void {
    if (!this.config.autoSave?.storageKey) return
    
    try {
      localStorage.removeItem(this.config.autoSave.storageKey)
    } catch (error) {
      console.error('Failed to clear storage:', error)
    }
  }

  // Reset form
  reset(): void {
    this.updateState(this.initializeState())
    this.clearStorage()
  }

  // Cleanup
  destroy(): void {
    // Clear timers
    this.debounceTimers.forEach(timer => clearTimeout(timer))
    this.debounceTimers.clear()
    
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer)
    }

    // Clear listeners
    this.listeners.clear()

    // Clear cache
    this.asyncValidationCache = {}
  }

  // Get field errors
  getFieldErrors(fieldName: string): ValidationError[] {
    return this.state.errors.filter(error => error.field === fieldName)
  }

  // Check if field has errors
  hasFieldError(fieldName: string): boolean {
    return this.getFieldErrors(fieldName).length > 0
  }

  // Get field value
  getFieldValue(fieldName: string): any {
    return this.state.values[fieldName]
  }

  // Check if field is touched
  isFieldTouched(fieldName: string): boolean {
    return this.state.touched[fieldName] ?? false
  }
}

// React hook for using the validation engine
export function useFormValidation(config: FormConfig) {
  const [engine] = React.useState(() => new FormValidationEngine(config))
  const [state, setState] = React.useState(engine.getState())

  React.useEffect(() => {
    const unsubscribe = engine.subscribe(setState)
    return () => {
      unsubscribe()
      engine.destroy()
    }
  }, [engine])

  return {
    engine,
    state,
    setValue: (field: string, value: any) => engine.setValue(field, value),
    setValues: (values: Record<string, any>) => engine.setValues(values),
    setTouched: (field: string, touched?: boolean) => engine.setTouched(field, touched),
    validateField: (field: string) => engine.validateField(field),
    validateAll: () => engine.validateAll(),
    submit: () => engine.submit(),
    reset: () => engine.reset(),
    getFieldErrors: (field: string) => engine.getFieldErrors(field),
    hasFieldError: (field: string) => engine.hasFieldError(field),
    getFieldValue: (field: string) => engine.getFieldValue(field),
    isFieldTouched: (field: string) => engine.isFieldTouched(field),
  }
}

// Utility function to create common field configurations
export const createFieldConfig = {
  email: (name: string, label: string, required = false): FieldConfig => ({
    name,
    label,
    type: 'email',
    rules: [
      ...(required ? [{ type: 'required' as const, message: `${label} is required` }] : []),
      { type: 'email' as const, message: 'Please enter a valid email address' },
    ],
  }),

  phone: (name: string, label: string, required = false): FieldConfig => ({
    name,
    label,
    type: 'phone',
    rules: [
      ...(required ? [{ type: 'required' as const, message: `${label} is required` }] : []),
      { type: 'phone' as const, message: 'Please enter a valid phone number' },
    ],
  }),

  password: (name: string, label: string, minLength = 8): FieldConfig => ({
    name,
    label,
    type: 'password',
    rules: [
      { type: 'required' as const, message: `${label} is required` },
      { type: 'min' as const, value: minLength, message: `${label} must be at least ${minLength} characters` },
      { 
        type: 'pattern' as const, 
        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        message: 'Password must contain uppercase, lowercase, and number'
      },
    ],
  }),

  required: (name: string, label: string, type: FieldConfig['type'] = 'text'): FieldConfig => ({
    name,
    label,
    type,
    rules: [
      { type: 'required' as const, message: `${label} is required` },
    ],
  }),
}