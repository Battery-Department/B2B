import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Battery } from './BatteryStore'

export interface CartItem {
  id: string
  battery: Battery
  quantity: number
  addedAt: string
  customizations?: {
    warranty?: string
    installation?: boolean
    accessories?: string[]
  }
  price: number // Final price after customizations
  originalPrice: number
}

export interface ShippingAddress {
  id: string
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  zipCode: string
  country: string
  phone?: string
  isDefault: boolean
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'paypal' | 'bank' | 'crypto'
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
}

export interface CartTotals {
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
}

export interface CartState {
  // Cart items
  items: CartItem[]
  
  // Checkout state
  shippingAddress: ShippingAddress | null
  billingAddress: ShippingAddress | null
  paymentMethod: PaymentMethod | null
  shippingMethod: string | null
  
  // Saved addresses and payment methods
  savedAddresses: ShippingAddress[]
  savedPaymentMethods: PaymentMethod[]
  
  // Discounts and coupons
  appliedCoupons: string[]
  availableDiscounts: {
    id: string
    code: string
    description: string
    type: 'percentage' | 'fixed'
    value: number
    minAmount?: number
    expiresAt?: string
  }[]
  
  // Cart state
  isLoading: boolean
  error: string | null
  lastUpdated: string
  
  // Actions
  addItem: (battery: Battery, quantity?: number, customizations?: CartItem['customizations']) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  
  // Item customizations
  updateCustomizations: (itemId: string, customizations: CartItem['customizations']) => void
  
  // Addresses
  addAddress: (address: Omit<ShippingAddress, 'id'>) => string
  updateAddress: (id: string, updates: Partial<ShippingAddress>) => void
  removeAddress: (id: string) => void
  setDefaultAddress: (id: string) => void
  setShippingAddress: (address: ShippingAddress | null) => void
  setBillingAddress: (address: ShippingAddress | null) => void
  
  // Payment methods
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => string
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethod>) => void
  removePaymentMethod: (id: string) => void
  setDefaultPaymentMethod: (id: string) => void
  setPaymentMethod: (method: PaymentMethod | null) => void
  
  // Shipping
  setShippingMethod: (method: string) => void
  
  // Coupons and discounts
  applyCoupon: (code: string) => Promise<boolean>
  removeCoupon: (code: string) => void
  
  // Calculations
  calculateTotals: () => CartTotals
  getItemCount: () => number
  getTotalItems: () => number
  
  // Utilities
  getItem: (itemId: string) => CartItem | undefined
  hasItem: (batteryId: string) => boolean
  getItemQuantity: (batteryId: string) => number
  
  // Validation
  validateCart: () => {
    valid: boolean
    errors: string[]
  }
  
  // Persistence
  saveCart: () => Promise<void>
  loadCart: () => Promise<void>
  
  // State management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

// Helper functions
const calculateItemPrice = (battery: Battery, customizations?: CartItem['customizations']): number => {
  let price = battery.price
  
  if (customizations?.warranty === 'extended') {
    price += battery.price * 0.15 // 15% for extended warranty
  }
  
  if (customizations?.installation) {
    price += 50 // $50 installation fee
  }
  
  if (customizations?.accessories) {
    // Add accessories cost (simplified)
    price += customizations.accessories.length * 25
  }
  
  return price
}

const calculateShipping = (items: CartItem[], shippingMethod?: string): number => {
  const totalWeight = items.reduce((weight, item) => 
    weight + (item.battery.specifications.weight * item.quantity), 0
  )
  
  if (shippingMethod === 'express') {
    return Math.max(25, totalWeight * 2)
  } else if (shippingMethod === 'overnight') {
    return Math.max(50, totalWeight * 4)
  } else {
    // Standard shipping
    return totalWeight > 50 ? 0 : 15 // Free shipping over 50kg
  }
}

const calculateTax = (subtotal: number, shippingAddress?: ShippingAddress | null): number => {
  if (!shippingAddress) return 0
  
  // Simplified tax calculation based on state
  const taxRates: Record<string, number> = {
    'CA': 0.0875, // California
    'NY': 0.08,   // New York
    'TX': 0.0625, // Texas
    'FL': 0.06,   // Florida
    'WA': 0.065   // Washington
  }
  
  const rate = taxRates[shippingAddress.state] || 0.05 // Default 5%
  return subtotal * rate
}

// Create the store
export const useCartStore = create<CartState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        items: [],
        
        shippingAddress: null,
        billingAddress: null,
        paymentMethod: null,
        shippingMethod: null,
        
        savedAddresses: [],
        savedPaymentMethods: [],
        
        appliedCoupons: [],
        availableDiscounts: [],
        
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
        
        // Actions
        addItem: (battery, quantity = 1, customizations) => {
          set((state) => {
            const existingItemIndex = state.items.findIndex(item => 
              item.battery.id === battery.id &&
              JSON.stringify(item.customizations) === JSON.stringify(customizations)
            )
            
            const price = calculateItemPrice(battery, customizations)
            
            if (existingItemIndex >= 0) {
              // Update existing item
              state.items[existingItemIndex].quantity += quantity
              state.items[existingItemIndex].price = price
            } else {
              // Add new item
              const newItem: CartItem = {
                id: `cart-item-${Date.now()}-${Math.random()}`,
                battery,
                quantity,
                addedAt: new Date().toISOString(),
                customizations,
                price,
                originalPrice: battery.price
              }
              state.items.push(newItem)
            }
            
            state.lastUpdated = new Date().toISOString()
          })
        },
        
        removeItem: (itemId) => {
          set((state) => {
            state.items = state.items.filter(item => item.id !== itemId)
            state.lastUpdated = new Date().toISOString()
          })
        },
        
        updateQuantity: (itemId, quantity) => {
          set((state) => {
            const item = state.items.find(item => item.id === itemId)
            if (item) {
              if (quantity <= 0) {
                state.items = state.items.filter(item => item.id !== itemId)
              } else {
                item.quantity = quantity
              }
              state.lastUpdated = new Date().toISOString()
            }
          })
        },
        
        clearCart: () => {
          set((state) => {
            state.items = []
            state.appliedCoupons = []
            state.lastUpdated = new Date().toISOString()
          })
        },
        
        // Item customizations
        updateCustomizations: (itemId, customizations) => {
          set((state) => {
            const item = state.items.find(item => item.id === itemId)
            if (item) {
              item.customizations = customizations
              item.price = calculateItemPrice(item.battery, customizations)
              state.lastUpdated = new Date().toISOString()
            }
          })
        },
        
        // Addresses
        addAddress: (address) => {
          const id = `address-${Date.now()}`
          set((state) => {
            // If this is the first address or marked as default, make it default
            const isDefault = address.isDefault || state.savedAddresses.length === 0
            
            if (isDefault) {
              // Remove default from other addresses
              state.savedAddresses.forEach(addr => {
                addr.isDefault = false
              })
            }
            
            state.savedAddresses.push({
              ...address,
              id,
              isDefault
            })
          })
          return id
        },
        
        updateAddress: (id, updates) => {
          set((state) => {
            const address = state.savedAddresses.find(addr => addr.id === id)
            if (address) {
              Object.assign(address, updates)
              
              if (updates.isDefault) {
                // Remove default from other addresses
                state.savedAddresses.forEach(addr => {
                  if (addr.id !== id) addr.isDefault = false
                })
              }
            }
          })
        },
        
        removeAddress: (id) => {
          set((state) => {
            state.savedAddresses = state.savedAddresses.filter(addr => addr.id !== id)
            
            // Clear shipping/billing if they reference removed address
            if (state.shippingAddress?.id === id) {
              state.shippingAddress = null
            }
            if (state.billingAddress?.id === id) {
              state.billingAddress = null
            }
          })
        },
        
        setDefaultAddress: (id) => {
          set((state) => {
            state.savedAddresses.forEach(addr => {
              addr.isDefault = addr.id === id
            })
          })
        },
        
        setShippingAddress: (address) => {
          set((state) => {
            state.shippingAddress = address
          })
        },
        
        setBillingAddress: (address) => {
          set((state) => {
            state.billingAddress = address
          })
        },
        
        // Payment methods
        addPaymentMethod: (method) => {
          const id = `payment-${Date.now()}`
          set((state) => {
            const isDefault = method.isDefault || state.savedPaymentMethods.length === 0
            
            if (isDefault) {
              state.savedPaymentMethods.forEach(pm => {
                pm.isDefault = false
              })
            }
            
            state.savedPaymentMethods.push({
              ...method,
              id,
              isDefault
            })
          })
          return id
        },
        
        updatePaymentMethod: (id, updates) => {
          set((state) => {
            const method = state.savedPaymentMethods.find(pm => pm.id === id)
            if (method) {
              Object.assign(method, updates)
              
              if (updates.isDefault) {
                state.savedPaymentMethods.forEach(pm => {
                  if (pm.id !== id) pm.isDefault = false
                })
              }
            }
          })
        },
        
        removePaymentMethod: (id) => {
          set((state) => {
            state.savedPaymentMethods = state.savedPaymentMethods.filter(pm => pm.id !== id)
            
            if (state.paymentMethod?.id === id) {
              state.paymentMethod = null
            }
          })
        },
        
        setDefaultPaymentMethod: (id) => {
          set((state) => {
            state.savedPaymentMethods.forEach(pm => {
              pm.isDefault = pm.id === id
            })
          })
        },
        
        setPaymentMethod: (method) => {
          set((state) => {
            state.paymentMethod = method
          })
        },
        
        // Shipping
        setShippingMethod: (method) => {
          set((state) => {
            state.shippingMethod = method
          })
        },
        
        // Coupons and discounts
        applyCoupon: async (code) => {
          // Simulate API call
          const state = get()
          const discount = state.availableDiscounts.find(d => d.code === code)
          
          if (!discount) {
            set((state) => {
              state.error = 'Invalid coupon code'
            })
            return false
          }
          
          if (state.appliedCoupons.includes(code)) {
            set((state) => {
              state.error = 'Coupon already applied'
            })
            return false
          }
          
          const totals = state.calculateTotals()
          if (discount.minAmount && totals.subtotal < discount.minAmount) {
            set((state) => {
              state.error = `Minimum order amount of $${discount.minAmount} required`
            })
            return false
          }
          
          set((state) => {
            state.appliedCoupons.push(code)
            state.error = null
          })
          
          return true
        },
        
        removeCoupon: (code) => {
          set((state) => {
            state.appliedCoupons = state.appliedCoupons.filter(c => c !== code)
          })
        },
        
        // Calculations
        calculateTotals: () => {
          const state = get()
          
          const subtotal = state.items.reduce((total, item) => 
            total + (item.price * item.quantity), 0
          )
          
          let discount = 0
          state.appliedCoupons.forEach(couponCode => {
            const coupon = state.availableDiscounts.find(d => d.code === couponCode)
            if (coupon) {
              if (coupon.type === 'percentage') {
                discount += subtotal * (coupon.value / 100)
              } else {
                discount += coupon.value
              }
            }
          })
          
          const shipping = calculateShipping(state.items, state.shippingMethod || undefined)
          const tax = calculateTax(subtotal - discount, state.shippingAddress)
          const total = subtotal - discount + shipping + tax
          
          return {
            subtotal,
            shipping,
            tax,
            discount,
            total: Math.max(0, total)
          }
        },
        
        getItemCount: () => {
          const state = get()
          return state.items.length
        },
        
        getTotalItems: () => {
          const state = get()
          return state.items.reduce((total, item) => total + item.quantity, 0)
        },
        
        // Utilities
        getItem: (itemId) => {
          const state = get()
          return state.items.find(item => item.id === itemId)
        },
        
        hasItem: (batteryId) => {
          const state = get()
          return state.items.some(item => item.battery.id === batteryId)
        },
        
        getItemQuantity: (batteryId) => {
          const state = get()
          const item = state.items.find(item => item.battery.id === batteryId)
          return item ? item.quantity : 0
        },
        
        // Validation
        validateCart: () => {
          const state = get()
          const errors: string[] = []
          
          if (state.items.length === 0) {
            errors.push('Cart is empty')
          }
          
          state.items.forEach(item => {
            if (item.quantity <= 0) {
              errors.push(`Invalid quantity for ${item.battery.name}`)
            }
            
            if (item.battery.availability === 'out-of-stock') {
              errors.push(`${item.battery.name} is out of stock`)
            }
          })
          
          return {
            valid: errors.length === 0,
            errors
          }
        },
        
        // Persistence
        saveCart: async () => {
          // Implementation would save to backend
          console.log('Cart saved to backend')
        },
        
        loadCart: async () => {
          // Implementation would load from backend
          console.log('Cart loaded from backend')
        },
        
        // State management
        setLoading: (loading) => {
          set((state) => {
            state.isLoading = loading
          })
        },
        
        setError: (error) => {
          set((state) => {
            state.error = error
          })
        }
      })),
      {
        name: 'cart-store',
        partialize: (state) => ({
          items: state.items,
          savedAddresses: state.savedAddresses,
          savedPaymentMethods: state.savedPaymentMethods,
          appliedCoupons: state.appliedCoupons,
          shippingMethod: state.shippingMethod,
          lastUpdated: state.lastUpdated
        })
      }
    ),
    {
      name: 'cart-store'
    }
  )
)

// Selectors
export const useCartSelectors = () => {
  const store = useCartStore()
  
  return {
    totals: store.calculateTotals(),
    itemCount: store.getItemCount(),
    totalItems: store.getTotalItems(),
    isEmpty: store.items.length === 0,
    validation: store.validateCart(),
    
    defaultShippingAddress: store.savedAddresses.find(addr => addr.isDefault),
    defaultPaymentMethod: store.savedPaymentMethods.find(pm => pm.isDefault),
    
    cartSummary: {
      items: store.items.length,
      total: store.calculateTotals().total,
      lastUpdated: store.lastUpdated
    }
  }
}