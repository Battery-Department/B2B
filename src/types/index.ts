/**
 * RHY Supplier Portal - Central Type Definitions
 * Enterprise-grade TypeScript definitions for FlexVolt battery supply chain management
 * Supports multi-warehouse operations: US, Japan, EU, Australia
 * @version 1.0.0
 * @author RHY Development Team
 */

// ================================
// RE-EXPORT EXISTING TYPES
// ================================

export * from './auth'
export * from './payments'
export * from './quiz-v2'
export * from './meta'

// ================================
// CORE BUSINESS DOMAIN TYPES
// ================================

export interface FlexVoltProduct {
  id: string
  sku: string
  name: string
  model: 'FlexVolt-6Ah' | 'FlexVolt-9Ah' | 'FlexVolt-15Ah'
  capacity: 6 | 9 | 15 // Ah
  voltage: '20V/60V MAX'
  price: number // USD base price
  regionalPricing: Record<'US' | 'JP' | 'EU' | 'AU', {
    price: number
    currency: 'USD' | 'JPY' | 'EUR' | 'AUD'
    taxRate: number
    availableForOrder: boolean
  }>
  specifications: {
    runtime: number // hours
    grade: 'Professional' | 'Heavy-duty' | 'Industrial'
    compatibility: string[]
    weight: number // kg
    dimensions: {
      length: number
      width: number
      height: number
    }
    certifications: string[]
  }
  inventory: WarehouseInventory[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface WarehouseInventory {
  warehouse: 'US' | 'JP' | 'EU' | 'AU'
  location: string
  stock: number
  reserved: number
  available: number
  reorderLevel: number
  maxCapacity: number
  lastStockUpdate: Date
  leadTimeDays: number
}

export interface VolumeDiscount {
  tier: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4'
  minimumAmount: number // USD
  discountPercentage: number // 10, 15, 20, 25
  description: string
  benefits: string[]
  dedicatedSupport?: boolean
  annualContractDiscount?: number
}

export interface Order {
  id: string
  orderNumber: string
  supplierId: string
  warehouseCode: 'US' | 'JP' | 'EU' | 'AU'
  status: OrderStatus
  items: OrderItem[]
  totals: {
    subtotal: number
    discountAmount: number
    discountPercentage: number
    taxAmount: number
    shippingAmount: number
    total: number
    currency: string
  }
  shipping: ShippingDetails
  payment: PaymentDetails
  timeline: {
    ordered: Date
    confirmed?: Date
    processing?: Date
    shipped?: Date
    delivered?: Date
    cancelled?: Date
  }
  compliance: ComplianceInfo
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'ON_HOLD'

export interface OrderItem {
  id: string
  productId: string
  sku: string
  quantity: number
  unitPrice: number
  lineTotal: number
  discountApplied?: number
  specifications?: Record<string, any>
}

export interface ShippingDetails {
  method: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' | 'FREIGHT'
  carrier: string
  trackingNumber?: string
  estimatedDelivery: Date
  actualDelivery?: Date
  address: Address
  cost: number
  insurance?: number
}

export interface PaymentDetails {
  method: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'NET_TERMS' | 'PURCHASE_ORDER'
  status: 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED'
  transactionId?: string
  amount: number
  currency: string
  processedAt?: Date
  gatewayResponse?: Record<string, any>
}

export interface Address {
  type: 'BILLING' | 'SHIPPING' | 'WAREHOUSE'
  companyName?: string
  contactName: string
  addressLine1: string
  addressLine2?: string
  city: string
  stateProvince: string
  postalCode: string
  country: string
  phone?: string
  email?: string
  isDefault?: boolean
}

export interface ComplianceInfo {
  region: 'US' | 'JP' | 'EU' | 'AU'
  regulations: string[]
  certificates: string[]
  taxId?: string
  vatNumber?: string
  exportDocuments?: string[]
  customsValue?: number
  harmonizedCode?: string
}

// ================================
// SUPPLIER MANAGEMENT TYPES
// ================================

export interface Supplier {
  id: string
  companyName: string
  legalName: string
  contactInfo: {
    primaryContact: string
    email: string
    phone: string
    website?: string
  }
  address: Address
  businessDetails: {
    type: 'MANUFACTURER' | 'DISTRIBUTOR' | 'RETAILER' | 'SERVICE'
    registrationNumber: string
    taxId: string
    vatNumber?: string
    duns?: string
    establishedYear: number
    employees: number
    annualRevenue?: number
  }
  supplierTier: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE'
  warehouseAccess: WarehouseAccess[]
  performanceMetrics: SupplierMetrics
  contracts: Contract[]
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL'
  onboardingCompleted: boolean
  lastActivityAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface SupplierMetrics {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  onTimeDeliveryRate: number
  returnRate: number
  satisfactionScore: number
  paymentTermsAdherence: number
  lastUpdated: Date
}

export interface Contract {
  id: string
  type: 'MASTER_AGREEMENT' | 'PURCHASE_CONTRACT' | 'DISTRIBUTION_AGREEMENT'
  effectiveDate: Date
  expirationDate: Date
  terms: ContractTerms
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'TERMINATED'
  signedBy: string[]
  documentUrl?: string
}

export interface ContractTerms {
  volumeCommitment?: number
  paymentTerms: string
  deliveryTerms: string
  qualityStandards: string[]
  penaltyClauses?: string[]
  renewalOptions?: string
}

// ================================
// ANALYTICS & REPORTING TYPES
// ================================

export interface AnalyticsData {
  period: 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'
  startDate: Date
  endDate: Date
  metrics: Record<string, number>
  dimensions: Record<string, string | number>
  warehouse?: 'US' | 'JP' | 'EU' | 'AU'
  aggregationType: 'SUM' | 'AVERAGE' | 'COUNT' | 'MIN' | 'MAX'
}

export interface DashboardWidget {
  id: string
  type: 'METRIC' | 'CHART' | 'TABLE' | 'MAP' | 'KPI'
  title: string
  description?: string
  dataSource: string
  configuration: Record<string, any>
  refreshInterval: number // seconds
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  permissions: string[]
}

export interface ReportDefinition {
  id: string
  name: string
  description: string
  category: 'SALES' | 'INVENTORY' | 'PERFORMANCE' | 'COMPLIANCE' | 'FINANCIAL'
  parameters: ReportParameter[]
  schedule?: ReportSchedule
  format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON'
  recipients: string[]
  isActive: boolean
}

export interface ReportParameter {
  name: string
  type: 'DATE' | 'STRING' | 'NUMBER' | 'BOOLEAN' | 'SELECT'
  required: boolean
  defaultValue?: any
  options?: string[]
}

export interface ReportSchedule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
  dayOfWeek?: number
  dayOfMonth?: number
  hour: number
  timezone: string
}

// ================================
// SYSTEM & INFRASTRUCTURE TYPES
// ================================

export interface ApiEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  description: string
  parameters?: ApiParameter[]
  requestBody?: any
  responses: Record<string, any>
  authentication: 'NONE' | 'JWT' | 'API_KEY' | 'OAUTH'
  rateLimit?: {
    requests: number
    window: number // seconds
  }
  deprecated?: boolean
}

export interface ApiParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  description: string
  example?: any
  validation?: Record<string, any>
}

export interface ServiceHealth {
  service: string
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'MAINTENANCE'
  uptime: number
  responseTime: number
  lastCheck: Date
  dependencies: ServiceDependency[]
  metrics: Record<string, number>
}

export interface ServiceDependency {
  name: string
  type: 'DATABASE' | 'API' | 'CACHE' | 'QUEUE' | 'STORAGE'
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR'
  lastCheck: Date
  connectionString?: string
}

export interface AuditLog {
  id: string
  userId?: string
  userEmail?: string
  action: string
  resource: string
  resourceId?: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  success: boolean
  errorMessage?: string
  timestamp: Date
  warehouse?: 'US' | 'JP' | 'EU' | 'AU'
  sessionId?: string
  requestId?: string
}

// ================================
// UI & COMPONENT TYPES
// ================================

export interface ComponentProps {
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  testId?: string
}

export interface TableColumn<T = any> {
  key: string
  title: string
  dataIndex: keyof T
  width?: number | string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, record: T, index: number) => React.ReactNode
  fixed?: 'left' | 'right'
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'date'
  required?: boolean
  placeholder?: string
  options?: SelectOption[]
  validation?: Record<string, any>
  helpText?: string
  disabled?: boolean
  defaultValue?: any
}

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
  group?: string
}

export interface NotificationMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number // milliseconds
  action?: {
    label: string
    onClick: () => void
  }
  persistent?: boolean
  timestamp: Date
}

export interface LoadingState {
  isLoading: boolean
  error?: string | null
  progress?: number // 0-100
  message?: string
}

export interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// ================================
// CONFIGURATION TYPES
// ================================

export interface AppConfig {
  environment: 'development' | 'staging' | 'production'
  version: string
  apiBaseUrl: string
  features: FeatureFlags
  warehouses: WarehouseConfig[]
  security: SecurityConfig
  performance: PerformanceConfig
  integrations: IntegrationConfig
}

export interface FeatureFlags {
  multiWarehouse: boolean
  realTimeSync: boolean
  advancedAnalytics: boolean
  mobileApp: boolean
  apiV2: boolean
  [key: string]: boolean
}

export interface WarehouseConfig {
  code: 'US' | 'JP' | 'EU' | 'AU'
  name: string
  location: string
  timezone: string
  currency: 'USD' | 'JPY' | 'EUR' | 'AUD'
  language: string
  operatingHours: {
    start: string
    end: string
    timezone: string
  }
  contactInfo: {
    phone: string
    email: string
    address: Address
  }
  capabilities: string[]
  maxOrderValue: number
  leadTimeDays: number
}

export interface SecurityConfig {
  jwtExpiration: number
  mfaRequired: boolean
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    maxAge: number // days
  }
  rateLimiting: {
    requests: number
    window: number // seconds
  }
  auditLogging: boolean
  encryptionAtRest: boolean
}

export interface PerformanceConfig {
  cacheTimeout: number // seconds
  batchSize: number
  maxConcurrentRequests: number
  timeout: number // milliseconds
  retryAttempts: number
  compressionEnabled: boolean
}

export interface IntegrationConfig {
  stripe: {
    publicKey: string
    webhookSecret: string
    enabled: boolean
  }
  meta: {
    pixelId: string
    accessToken: string
    enabled: boolean
  }
  ai: {
    openai: {
      apiKey: string
      model: string
      enabled: boolean
    }
    anthropic: {
      apiKey: string
      model: string
      enabled: boolean
    }
  }
}

// ================================
// UTILITY TYPES
// ================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type NonEmptyArray<T> = [T, ...T[]]

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type Enum<T> = T[keyof T]

export type ValueOf<T> = T[keyof T]

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never
}[keyof T]

export type NonNullable<T> = T extends null | undefined ? never : T

export type Awaited<T> = T extends Promise<infer U> ? U : T

// ================================
// API RESPONSE WRAPPERS
// ================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, any>
    stack?: string
  }
  meta?: {
    timestamp: string
    requestId: string
    version: string
    pagination?: PaginationInfo
    warehouse?: 'US' | 'JP' | 'EU' | 'AU'
  }
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: Required<ApiResponse['meta']> & {
    pagination: PaginationInfo
  }
}

export interface BatchResponse<T> extends ApiResponse {
  data: {
    successful: T[]
    failed: Array<{
      item: any
      error: string
    }>
    total: number
    successCount: number
    failureCount: number
  }
}

// ================================
// ENVIRONMENT & RUNTIME TYPES
// ================================

export interface RuntimeEnvironment {
  NODE_ENV: 'development' | 'production' | 'test'
  DATABASE_URL: string
  JWT_SECRET: string
  NEXTAUTH_SECRET: string
  RHY_DATABASE_URL: string
  OPENAI_API_KEY?: string
  ANTHROPIC_API_KEY?: string
  STRIPE_SECRET_KEY?: string
  STRIPE_PUBLISHABLE_KEY?: string
  META_PIXEL_ID?: string
  META_ACCESS_TOKEN?: string
  REDIS_URL?: string
  VERCEL_URL?: string
  [key: string]: string | undefined
}

export interface BuildInfo {
  version: string
  buildTime: string
  commitHash: string
  branch: string
  environment: string
  nodeVersion: string
  nextVersion: string
}

// ================================
// ERROR HANDLING TYPES
// ================================

export interface AppError extends Error {
  code: string
  statusCode: number
  details?: Record<string, any>
  timestamp: Date
  requestId?: string
  userId?: string
}

export type ErrorBoundaryProps = {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

// ================================
// TESTING TYPES
// ================================

export interface TestContext {
  user?: Partial<Supplier>
  warehouse?: 'US' | 'JP' | 'EU' | 'AU'
  permissions?: string[]
  mockData?: Record<string, any>
}

export interface MockApiResponse<T = any> {
  success: boolean
  data?: T
  delay?: number
  error?: {
    code: string
    message: string
  }
}

// ================================
// GLOBAL TYPE AUGMENTATIONS
// ================================

declare global {
  namespace NodeJS {
    interface ProcessEnv extends RuntimeEnvironment {}
  }

  interface Window {
    ENV: Partial<RuntimeEnvironment>
    gtag?: (...args: any[]) => void
    fbq?: (...args: any[]) => void
  }
}

// ================================
// MODULE AUGMENTATIONS
// ================================

declare module 'next/navigation' {
  interface NavigateOptions {
    warehouse?: 'US' | 'JP' | 'EU' | 'AU'
  }
}

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    'data-testid'?: string
  }
}

// ================================
// TYPE GUARDS & UTILITIES
// ================================

export const isFlexVoltProduct = (obj: any): obj is FlexVoltProduct => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.sku === 'string' &&
    ['FlexVolt-6Ah', 'FlexVolt-9Ah', 'FlexVolt-15Ah'].includes(obj.model) &&
    [6, 9, 15].includes(obj.capacity)
  )
}

export const isValidWarehouse = (code: string): code is 'US' | 'JP' | 'EU' | 'AU' => {
  return ['US', 'JP', 'EU', 'AU'].includes(code)
}

export const isOrderStatus = (status: string): status is OrderStatus => {
  return [
    'PENDING',
    'CONFIRMED', 
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
    'ON_HOLD'
  ].includes(status)
}

export const isSupplierTier = (tier: string): tier is 'STANDARD' | 'PREMIUM' | 'ENTERPRISE' => {
  return ['STANDARD', 'PREMIUM', 'ENTERPRISE'].includes(tier)
}

// ================================
// BRANDED TYPES FOR TYPE SAFETY
// ================================

export type ProductId = string & { readonly brand: unique symbol }
export type SupplierId = string & { readonly brand: unique symbol }
export type OrderId = string & { readonly brand: unique symbol }
export type UserId = string & { readonly brand: unique symbol }
export type SessionId = string & { readonly brand: unique symbol }

export const createProductId = (id: string): ProductId => id as ProductId
export const createSupplierId = (id: string): SupplierId => id as SupplierId
export const createOrderId = (id: string): OrderId => id as OrderId
export const createUserId = (id: string): UserId => id as UserId
export const createSessionId = (id: string): SessionId => id as SessionId

// ================================
// EXPORT DEFAULT TYPE DEFINITIONS
// ================================

export default {
  FlexVoltProduct,
  Order,
  Supplier,
  AnalyticsData,
  ApiResponse,
  AppConfig,
  RuntimeEnvironment
} as const