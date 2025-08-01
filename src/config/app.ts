/**
 * RHY Supplier Portal - Application Configuration
 * Enterprise-grade configuration management for FlexVolt battery operations
 * across 4 global warehouses with multi-region compliance
 */

import { z } from 'zod'

// ============================================================================
// WAREHOUSE CONFIGURATION
// ============================================================================

export const WAREHOUSES = {
  US_WEST: {
    id: 'us-west',
    name: 'US West Coast',
    location: 'Los Angeles, CA',
    timezone: 'America/Los_Angeles', 
    currency: 'USD',
    language: 'en',
    businessHours: {
      start: '06:00',
      end: '18:00',
      timezone: 'PST'
    },
    compliance: ['OSHA', 'EPA', 'DOT'],
    shippingZones: ['US', 'CA', 'MX'],
    enabled: true
  },
  JAPAN: {
    id: 'japan',
    name: 'Japan Distribution Center',
    location: 'Tokyo, Japan',
    timezone: 'Asia/Tokyo',
    currency: 'JPY',
    language: 'ja',
    businessHours: {
      start: '09:00',
      end: '18:00',
      timezone: 'JST'
    },
    compliance: ['JIS', 'PSE', 'RoHS'],
    shippingZones: ['JP', 'KR', 'TW'],
    enabled: true
  },
  EU: {
    id: 'eu',
    name: 'European Union Hub',
    location: 'Berlin, Germany',
    timezone: 'Europe/Berlin',
    currency: 'EUR',
    language: 'de',
    businessHours: {
      start: '08:00',
      end: '17:00',
      timezone: 'CET'
    },
    compliance: ['GDPR', 'CE', 'RoHS', 'WEEE'],
    shippingZones: ['EU', 'UK', 'NO', 'CH'],
    enabled: true
  },
  AUSTRALIA: {
    id: 'australia',
    name: 'Australia Pacific',
    location: 'Sydney, Australia',
    timezone: 'Australia/Sydney',
    currency: 'AUD',
    language: 'en',
    businessHours: {
      start: '08:00',
      end: '17:00',
      timezone: 'AEDT'
    },
    compliance: ['ACMA', 'TGA', 'EPEAT'],
    shippingZones: ['AU', 'NZ', 'PG'],
    enabled: true
  }
} as const

// ============================================================================
// FLEXVOLT PRODUCT CONFIGURATION
// ============================================================================

export const FLEXVOLT_PRODUCTS = {
  '6AH': {
    id: 'flexvolt-6ah',
    name: 'FlexVolt 6Ah Battery',
    capacity: '6Ah',
    voltage: '20V/60V MAX',
    price: 149.00,
    runtime: 2,
    grade: 'Professional',
    weight: '1.4kg',
    chargingTime: 60,
    warranty: 36,
    features: ['Dual voltage', 'Professional grade', 'LED fuel gauge'],
    applications: ['Light construction', 'Maintenance', 'DIY projects']
  },
  '9AH': {
    id: 'flexvolt-9ah',
    name: 'FlexVolt 9Ah Battery',
    capacity: '9Ah',
    voltage: '20V/60V MAX',
    price: 239.00,
    runtime: 3,
    grade: 'Heavy-duty',
    weight: '1.8kg',
    chargingTime: 90,
    warranty: 36,
    features: ['Dual voltage', 'Heavy-duty grade', 'LED fuel gauge', 'Temperature protection'],
    applications: ['Medium construction', 'HVAC', 'Electrical work']
  },
  '15AH': {
    id: 'flexvolt-15ah',
    name: 'FlexVolt 15Ah Battery',
    capacity: '15Ah',
    voltage: '20V/60V MAX',
    price: 359.00,
    runtime: 5,
    grade: 'Industrial',
    weight: '2.6kg',
    chargingTime: 120,
    warranty: 36,
    features: ['Dual voltage', 'Industrial grade', 'LED fuel gauge', 'Temperature protection', 'Impact resistance'],
    applications: ['Heavy construction', 'Industrial operations', 'Fleet management']
  }
} as const

// ============================================================================
// VOLUME DISCOUNT CONFIGURATION
// ============================================================================

export const VOLUME_DISCOUNTS = [
  {
    threshold: 1000,
    percentage: 10,
    tier: 'Small Contractor',
    benefits: ['Volume pricing', 'Standard support']
  },
  {
    threshold: 2500,
    percentage: 15,
    tier: 'Medium Fleet',
    benefits: ['Enhanced pricing', 'Priority support', 'Extended warranty']
  },
  {
    threshold: 5000,
    percentage: 20,
    tier: 'Large Enterprise',
    benefits: ['Enterprise pricing', 'Dedicated support', 'Custom configurations']
  },
  {
    threshold: 10000,
    percentage: 25,
    tier: 'Strategic Partner',
    benefits: ['Best pricing', 'Account manager', 'Co-marketing opportunities', 'Beta access']
  }
] as const

// ============================================================================
// SUPPLIER TYPE CONFIGURATION
// ============================================================================

export const SUPPLIER_TYPES = {
  DIRECT: {
    id: 'direct',
    name: 'Direct Manufacturer',
    accessLevel: 'full',
    capabilities: ['manufacture', 'distribution', 'warranty', 'support'],
    permissions: ['view_all', 'edit_products', 'manage_inventory', 'access_analytics']
  },
  DISTRIBUTOR: {
    id: 'distributor',
    name: 'Regional Distributor',
    accessLevel: 'limited',
    capabilities: ['distribution', 'regional_support'],
    permissions: ['view_region', 'manage_orders', 'track_inventory']
  },
  RETAILER: {
    id: 'retailer',
    name: 'Authorized Retailer',
    accessLevel: 'view_only',
    capabilities: ['sales', 'basic_support'],
    permissions: ['view_products', 'place_orders', 'track_shipments']
  },
  FLEET_MANAGER: {
    id: 'fleet_manager',
    name: 'Fleet Manager',
    accessLevel: 'analytics',
    capabilities: ['bulk_ordering', 'fleet_management'],
    permissions: ['view_analytics', 'bulk_orders', 'manage_fleet']
  },
  SERVICE_PARTNER: {
    id: 'service_partner',
    name: 'Service Partner',
    accessLevel: 'support_tools',
    capabilities: ['warranty_service', 'technical_support'],
    permissions: ['access_support_tools', 'manage_warranties', 'technical_docs']
  }
} as const

// ============================================================================
// SYSTEM CONFIGURATION
// ============================================================================

export const SYSTEM_CONFIG = {
  // Performance Settings
  performance: {
    apiTimeout: 30000,
    dbConnectionTimeout: 5000,
    warehouseSyncInterval: 30000,
    maxConcurrentRequests: 100,
    cacheTimeout: 300000
  },
  
  // Security Settings
  security: {
    sessionTimeout: 28800, // 8 hours
    maxLoginAttempts: 5,
    lockoutDuration: 900, // 15 minutes
    passwordMinLength: 12,
    requireSpecialChars: true,
    requireMFA: true,
    auditLogRetention: 2592000 // 30 days
  },
  
  // Rate Limiting
  rateLimiting: {
    requestsPerWindow: 100,
    windowSizeMinutes: 15,
    burstLimit: 20
  },
  
  // Data Sync
  dataSync: {
    inventorySyncInterval: 30000,
    priceSyncInterval: 300000,
    complianceSyncInterval: 3600000, // 1 hour
    maxRetries: 3,
    retryDelay: 5000
  }
} as const

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURE_FLAGS = {
  MULTI_WAREHOUSE: true,
  REAL_TIME_INVENTORY: true,
  ADVANCED_ANALYTICS: true,
  MFA_ENFORCEMENT: true,
  COMPLIANCE_AUTOMATION: true,
  PREDICTIVE_ORDERING: false, // Beta feature
  AI_RECOMMENDATIONS: true,
  MOBILE_OPTIMIZATION: true,
  OFFLINE_SUPPORT: false // Coming soon
} as const

// ============================================================================
// INTEGRATION CONFIGURATION
// ============================================================================

export const INTEGRATIONS = {
  ERP: {
    enabled: true,
    syncInterval: 300000,
    endpoints: {
      inventory: '/api/erp/inventory',
      orders: '/api/erp/orders',
      pricing: '/api/erp/pricing'
    }
  },
  CRM: {
    enabled: true,
    provider: 'salesforce',
    syncCustomers: true,
    syncInterval: 600000
  },
  PAYMENT: {
    providers: ['stripe', 'paypal', 'bank_transfer'],
    defaultProvider: 'stripe',
    multiCurrency: true
  },
  SHIPPING: {
    providers: ['fedex', 'ups', 'dhl', 'local'],
    trackingEnabled: true,
    labelGeneration: true
  }
} as const

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const WarehouseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  location: z.string().min(1),
  timezone: z.string(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'AUD']),
  language: z.string().length(2),
  enabled: z.boolean()
})

export const ProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  capacity: z.string(),
  voltage: z.string(),
  price: z.number().positive(),
  runtime: z.number().positive(),
  grade: z.enum(['Professional', 'Heavy-duty', 'Industrial'])
})

export const SupplierTypeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  accessLevel: z.enum(['full', 'limited', 'view_only', 'analytics', 'support_tools']),
  capabilities: z.array(z.string()),
  permissions: z.array(z.string())
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Warehouse = z.infer<typeof WarehouseSchema>
export type Product = z.infer<typeof ProductSchema>
export type SupplierType = z.infer<typeof SupplierTypeSchema>
export type WarehouseId = keyof typeof WAREHOUSES
export type ProductId = keyof typeof FLEXVOLT_PRODUCTS
export type SupplierTypeId = keyof typeof SUPPLIER_TYPES

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getWarehouseById(id: string): typeof WAREHOUSES[keyof typeof WAREHOUSES] | null {
  return Object.values(WAREHOUSES).find(warehouse => warehouse.id === id) || null
}

export function getProductById(id: string): typeof FLEXVOLT_PRODUCTS[keyof typeof FLEXVOLT_PRODUCTS] | null {
  return Object.values(FLEXVOLT_PRODUCTS).find(product => product.id === id) || null
}

export function getApplicableDiscount(orderValue: number): typeof VOLUME_DISCOUNTS[number] | null {
  return [...VOLUME_DISCOUNTS]
    .reverse()
    .find(discount => orderValue >= discount.threshold) || null
}

export function calculateDiscountedPrice(originalPrice: number, orderValue: number): number {
  const discount = getApplicableDiscount(orderValue)
  if (!discount) return originalPrice
  
  return originalPrice * (1 - discount.percentage / 100)
}

export function isWarehouseOperational(warehouseId: string): boolean {
  const warehouse = getWarehouseById(warehouseId)
  if (!warehouse) return false
  
  const now = new Date()
  const currentHour = now.getHours()
  const [startHour] = warehouse.businessHours.start.split(':').map(Number)
  const [endHour] = warehouse.businessHours.end.split(':').map(Number)
  
  return warehouse.enabled && currentHour >= startHour && currentHour < endHour
}

export function getAvailableWarehouses(): Array<typeof WAREHOUSES[keyof typeof WAREHOUSES]> {
  return Object.values(WAREHOUSES).filter(warehouse => warehouse.enabled)
}

export function getWarehouseForRegion(countryCode: string): typeof WAREHOUSES[keyof typeof WAREHOUSES] | null {
  return Object.values(WAREHOUSES).find(warehouse => 
    warehouse.shippingZones.includes(countryCode.toUpperCase())
  ) || null
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  WAREHOUSES,
  FLEXVOLT_PRODUCTS,
  VOLUME_DISCOUNTS,
  SUPPLIER_TYPES,
  SYSTEM_CONFIG,
  FEATURE_FLAGS,
  INTEGRATIONS,
  getWarehouseById,
  getProductById,
  getApplicableDiscount,
  calculateDiscountedPrice,
  isWarehouseOperational,
  getAvailableWarehouses,
  getWarehouseForRegion
}