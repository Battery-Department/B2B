'use client'

// Internationalization (i18n) system for Terminal 1 Phase 3

export interface TranslationKey {
  [key: string]: string | TranslationKey
}

export interface Locale {
  code: string
  name: string
  direction: 'ltr' | 'rtl'
  translations: TranslationKey
}

export interface I18nConfig {
  defaultLocale: string
  fallbackLocale: string
  supportedLocales: string[]
  detectBrowserLanguage: boolean
  persistUserChoice: boolean
}

// Default translations
const enTranslations: TranslationKey = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    remove: 'Remove',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    clear: 'Clear',
    apply: 'Apply',
    reset: 'Reset',
  },
  navigation: {
    home: 'Home',
    products: 'Products',
    cart: 'Cart',
    account: 'Account',
    orders: 'Orders',
    support: 'Support',
    about: 'About',
    contact: 'Contact',
  },
  forms: {
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Please enter a valid phone number',
    passwordTooShort: 'Password must be at least 8 characters',
    passwordMismatch: 'Passwords do not match',
    invalidCreditCard: 'Please enter a valid credit card number',
    invalidZipCode: 'Please enter a valid ZIP code',
    selectOption: 'Please select an option',
    fileTooBig: 'File size is too large',
    fileTypeNotSupported: 'File type is not supported',
  },
  products: {
    battery: 'Battery',
    voltage: 'Voltage',
    capacity: 'Capacity',
    price: 'Price',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    lowStock: 'Low Stock',
    addToCart: 'Add to Cart',
    viewDetails: 'View Details',
    specifications: 'Specifications',
    reviews: 'Reviews',
    description: 'Description',
  },
  cart: {
    empty: 'Your cart is empty',
    total: 'Total',
    subtotal: 'Subtotal',
    tax: 'Tax',
    shipping: 'Shipping',
    discount: 'Discount',
    checkout: 'Checkout',
    continueShopping: 'Continue Shopping',
    removeItem: 'Remove Item',
    updateQuantity: 'Update Quantity',
    quantity: 'Quantity',
  },
  checkout: {
    shippingAddress: 'Shipping Address',
    billingAddress: 'Billing Address',
    paymentMethod: 'Payment Method',
    orderSummary: 'Order Summary',
    placeOrder: 'Place Order',
    processingOrder: 'Processing Order...',
    orderConfirmation: 'Order Confirmation',
    orderNumber: 'Order Number',
    trackOrder: 'Track Order',
    estimatedDelivery: 'Estimated Delivery',
  },
  accessibility: {
    skipToContent: 'Skip to main content',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    previousPage: 'Go to previous page',
    nextPage: 'Go to next page',
    sortBy: 'Sort by',
    filterBy: 'Filter by',
    searchResults: 'Search results',
    loading: 'Loading content',
    error: 'Error loading content',
  },
  errors: {
    generic: 'Something went wrong. Please try again.',
    network: 'Network error. Please check your connection.',
    timeout: 'Request timed out. Please try again.',
    notFound: 'The requested resource was not found.',
    unauthorized: 'You are not authorized to access this resource.',
    forbidden: 'Access to this resource is forbidden.',
    serverError: 'Server error. Please try again later.',
    validation: 'Please correct the errors and try again.',
  },
}

const esTranslations: TranslationKey = {
  common: {
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Agregar',
    remove: 'Quitar',
    close: 'Cerrar',
    back: 'Atrás',
    next: 'Siguiente',
    previous: 'Anterior',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    clear: 'Limpiar',
    apply: 'Aplicar',
    reset: 'Restablecer',
  },
  navigation: {
    home: 'Inicio',
    products: 'Productos',
    cart: 'Carrito',
    account: 'Cuenta',
    orders: 'Pedidos',
    support: 'Soporte',
    about: 'Acerca de',
    contact: 'Contacto',
  },
  products: {
    battery: 'Batería',
    voltage: 'Voltaje',
    capacity: 'Capacidad',
    price: 'Precio',
    inStock: 'En Stock',
    outOfStock: 'Agotado',
    lowStock: 'Stock Bajo',
    addToCart: 'Agregar al Carrito',
    viewDetails: 'Ver Detalles',
    specifications: 'Especificaciones',
    reviews: 'Reseñas',
    description: 'Descripción',
  },
  // ... other Spanish translations
}

const frTranslations: TranslationKey = {
  common: {
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    remove: 'Retirer',
    close: 'Fermer',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    search: 'Rechercher',
    filter: 'Filtrer',
    sort: 'Trier',
    clear: 'Effacer',
    apply: 'Appliquer',
    reset: 'Réinitialiser',
  },
  // ... other French translations
}

// Supported locales
export const SUPPORTED_LOCALES: Locale[] = [
  {
    code: 'en',
    name: 'English',
    direction: 'ltr',
    translations: enTranslations,
  },
  {
    code: 'es',
    name: 'Español',
    direction: 'ltr',
    translations: esTranslations,
  },
  {
    code: 'fr',
    name: 'Français',
    direction: 'ltr',
    translations: frTranslations,
  },
]

// Default configuration
const DEFAULT_CONFIG: I18nConfig = {
  defaultLocale: 'en',
  fallbackLocale: 'en',
  supportedLocales: SUPPORTED_LOCALES.map(locale => locale.code),
  detectBrowserLanguage: true,
  persistUserChoice: true,
}

// I18n class
export class I18n {
  private config: I18nConfig
  private currentLocale: string
  private translations: Map<string, TranslationKey> = new Map()
  private changeListeners: Array<(locale: string) => void> = []

  constructor(config: Partial<I18nConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    // Load translations
    SUPPORTED_LOCALES.forEach(locale => {
      this.translations.set(locale.code, locale.translations)
    })

    // Initialize locale
    this.currentLocale = this.detectInitialLocale()
    this.applyLocale(this.currentLocale)
  }

  private detectInitialLocale(): string {
    // Check localStorage first
    if (this.config.persistUserChoice && typeof window !== 'undefined') {
      const saved = localStorage.getItem('preferred-locale')
      if (saved && this.config.supportedLocales.includes(saved)) {
        return saved
      }
    }

    // Detect browser language
    if (this.config.detectBrowserLanguage && typeof window !== 'undefined') {
      const browserLang = navigator.language.split('-')[0]
      if (this.config.supportedLocales.includes(browserLang)) {
        return browserLang
      }
    }

    return this.config.defaultLocale
  }

  private applyLocale(locale: string) {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale
      
      const localeData = SUPPORTED_LOCALES.find(l => l.code === locale)
      if (localeData) {
        document.documentElement.dir = localeData.direction
      }
    }
  }

  setLocale(locale: string) {
    if (!this.config.supportedLocales.includes(locale)) {
      console.warn(`Locale '${locale}' is not supported`)
      return
    }

    this.currentLocale = locale
    this.applyLocale(locale)

    // Persist choice
    if (this.config.persistUserChoice && typeof window !== 'undefined') {
      localStorage.setItem('preferred-locale', locale)
    }

    // Notify listeners
    this.changeListeners.forEach(listener => listener(locale))
  }

  getLocale(): string {
    return this.currentLocale
  }

  getLocaleData(): Locale | undefined {
    return SUPPORTED_LOCALES.find(locale => locale.code === this.currentLocale)
  }

  getSupportedLocales(): Locale[] {
    return SUPPORTED_LOCALES
  }

  translate(key: string, params?: Record<string, string>): string {
    const translation = this.getTranslation(key)
    
    if (!params) {
      return translation
    }

    // Replace parameters in translation
    return Object.entries(params).reduce((result, [param, value]) => {
      return result.replace(new RegExp(`{{${param}}}`, 'g'), value)
    }, translation)
  }

  private getTranslation(key: string): string {
    const keys = key.split('.')
    const currentTranslations = this.translations.get(this.currentLocale)
    const fallbackTranslations = this.translations.get(this.config.fallbackLocale)

    // Try current locale first
    let translation = this.getNestedValue(currentTranslations, keys)
    
    // Fall back to default locale
    if (!translation && currentTranslations !== fallbackTranslations) {
      translation = this.getNestedValue(fallbackTranslations, keys)
    }

    // Return key if no translation found
    return translation || key
  }

  private getNestedValue(obj: any, keys: string[]): string | null {
    let current = obj
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return null
      }
    }

    return typeof current === 'string' ? current : null
  }

  onLocaleChange(listener: (locale: string) => void) {
    this.changeListeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.changeListeners.indexOf(listener)
      if (index > -1) {
        this.changeListeners.splice(index, 1)
      }
    }
  }

  // Pluralization helper
  plural(key: string, count: number, params?: Record<string, string>): string {
    const pluralKey = count === 1 ? `${key}.singular` : `${key}.plural`
    return this.translate(pluralKey, { ...params, count: count.toString() })
  }

  // Date formatting
  formatDate(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
    return new Intl.DateTimeFormat(this.currentLocale, options).format(date)
  }

  // Number formatting
  formatNumber(number: number, options: Intl.NumberFormatOptions = {}): string {
    return new Intl.NumberFormat(this.currentLocale, options).format(number)
  }

  // Currency formatting
  formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat(this.currentLocale, {
      style: 'currency',
      currency,
    }).format(amount)
  }
}

// Global i18n instance
export const i18n = new I18n()

// Convenience function for translations
export const t = (key: string, params?: Record<string, string>): string => {
  return i18n.translate(key, params)
}

// React hook for i18n
import { useState, useEffect } from 'react'

export function useI18n() {
  const [locale, setLocale] = useState(i18n.getLocale())

  useEffect(() => {
    const unsubscribe = i18n.onLocaleChange(setLocale)
    return unsubscribe
  }, [])

  return {
    locale,
    setLocale: i18n.setLocale.bind(i18n),
    t: i18n.translate.bind(i18n),
    formatDate: i18n.formatDate.bind(i18n),
    formatNumber: i18n.formatNumber.bind(i18n),
    formatCurrency: i18n.formatCurrency.bind(i18n),
    supportedLocales: i18n.getSupportedLocales(),
    localeData: i18n.getLocaleData(),
  }
}