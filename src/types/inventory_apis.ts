/**
 * RHY SUPPLIER PORTAL - INVENTORY APIS TYPES (RHY_046)
 * =====================================================
 * Comprehensive TypeScript types for inventory API infrastructure
 * Supports enterprise-grade inventory management, forecasting, and analytics
 * Integrates with Batch 1 warehouse and authentication systems
 */

// ================================
// CORE INVENTORY TYPES
// ================================

export type WarehouseLocation = 'US' | 'JP' | 'EU' | 'AU'

export type ProductCategory = 'battery' | 'module' | 'pack' | 'accessory'

export type ProductStatus = 'ACTIVE' | 'DISCONTINUED' | 'COMING_SOON'

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

export type MovementType = 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | 'ADJUSTMENT' | 'DAMAGED' | 'RETURN'

export type ForecastPeriod = '7_DAYS' | '30_DAYS' | '90_DAYS' | '1_YEAR'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type SupplierTier = 'STANDARD' | 'PROFESSIONAL' | 'COMMERCIAL' | 'ENTERPRISE'

export type TrendDirection = 'INCREASING' | 'DECREASING' | 'STABLE'

export type VelocityCategory = 'FAST' | 'MEDIUM' | 'SLOW'

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// ================================
// PRODUCT INTERFACES
// ================================

export interface ProductSpecifications {
  voltage?: string
  capacity?: string
  chemistry?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  compatibleTools?: string[]
  certifications?: string[]
  safetyRating?: string
  warrantyPeriod?: string
}

export interface InventoryProduct {
  id: string
  sku: string
  name: string
  category: ProductCategory
  basePrice: number
  specifications: ProductSpecifications
  imageUrl?: string
  status: ProductStatus
  warehouseInventory: WarehouseInventory[]
  flexvoltInfo?: FlexVoltInfo
  pricingTiers?: PricingTiers
  globalAvailability?: GlobalAvailability
}

export interface FlexVoltInfo {
  voltageCompatibility: string
  contractorGrade: boolean
  volumeDiscountEligible: boolean
  targetMarket: string
}

export interface PricingTiers {
  standard: number
  volume_1000: number
  volume_2500: number
  volume_5000: number
  volume_7500: number
  currency: string
  eligibility: {
    contractor: string[]
    professional: string[]
    commercial: string[]
    enterprise: string[]
  }
}

export interface GlobalAvailability {
  global: {
    totalStock: number
    inStockWarehouses: number
    averageDeliveryDays: number
  }
  regions: Record<WarehouseLocation, RegionalAvailability>
}

export interface RegionalAvailability {
  quantity: number
  status: StockStatus
  estimatedDelivery: number
  currency: string
  nextRestockDate?: string
}

// ================================
// WAREHOUSE INVENTORY INTERFACES
// ================================

export interface WarehouseInventory {
  warehouseId: string
  warehouseLocation: WarehouseLocation
  quantity: number
  reservedQuantity: number
  availableQuantity: number
  minimumLevel: number
  maximumLevel: number
  reorderPoint: number
  lastRestocked: Date
  stockStatus: StockStatus
  forecastedDemand: number
  nextDeliveryDate?: Date
}

export interface WarehouseContext {
  location: WarehouseLocation
  name: string
  timezone: string
  currency: string
  operatingHours: string
  cutoffTime: string
  nextBusinessDay: string
}

export interface WarehouseBusinessContext {
  market: string
  seasonality: string
  economicFactors: string[]
  competitiveEnvironment: string
  regulatoryFactors: string[]
}

// ================================
// STOCK MOVEMENT INTERFACES
// ================================

export interface StockMovement {
  id: string
  productId: string
  warehouseId: string
  type: MovementType
  quantity: number
  previousQuantity: number
  newQuantity: number
  reason: string
  performedBy: string
  timestamp: Date
  batchNumber?: string
  serialNumbers?: string[]
  cost?: number
  supplier?: string
  orderReference?: string
}

export interface StockUpdate {
  productId: string
  warehouseId: string
  action: 'ADJUST' | 'RESTOCK' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'DAMAGED' | 'RETURN'
  quantity: number
  reason: string
  batchNumber?: string
  serialNumbers?: string[]
  cost?: number
  supplier?: string
  orderReference?: string
  notes?: string
}

export interface StockSummary {
  warehouse: WarehouseLocation
  totalItems: number
  inStock: number
  lowStock: number
  outOfStock: number
  totalValue: number
  stockPercentages: {
    inStock: number
    lowStock: number
    outOfStock: number
  }
  timestamp: string
}

// ================================
// FORECASTING INTERFACES
// ================================

export interface InventoryForecast {
  productId: string
  warehouseId: string
  forecastPeriod: ForecastPeriod
  predictedDemand: number
  confidenceLevel: number
  recommendedOrderQuantity: number
  suggestedOrderDate: Date
  stockoutRisk: RiskLevel
  seasonalFactors: SeasonalFactor[]
  trendAnalysis: TrendAnalysis
  advancedMetrics?: AdvancedForecastMetrics
  flexvoltInsights?: FlexVoltForecastInsights
  optimization?: OptimizationRecommendations
  scenarios?: ScenarioAnalysis
  financialImpact?: FinancialImpact
}

export interface SeasonalFactor {
  month: number
  multiplier: number
}

export interface TrendAnalysis {
  direction: TrendDirection
  percentage: number
}

export interface AdvancedForecastMetrics {
  demandVariability: number
  seasonalIndex: number
  trendStrength: number
  forecastAccuracy: number
  businessImpact: BusinessImpact
}

export interface BusinessImpact {
  revenueImpact: number
  costSavings: number
  roi: number
  paybackPeriod: string
}

export interface FlexVoltForecastInsights {
  voltageCompatibility: string
  targetMarket: string
  competitivePosition: string
  crossSellOpportunities: string[]
  contractorSegments: {
    residential: number
    commercial: number
    industrial: number
  }
  seasonalDemand: {
    constructionSeason: number
    offSeason: number
    holidayBoost: number
  }
}

export interface OptimizationRecommendations {
  orderOptimization: {
    recommendedOrderSize: number
    orderFrequency: string
    economicOrderQuantity: number
    safetyStock: number
  }
  costOptimization: {
    inventoryHoldingCost: string
    orderingCost: string
    stockoutCost: string
    totalCost: string
  }
  tierBenefits: Record<string, any>
}

export interface ScenarioAnalysis {
  optimistic: ForecastScenario
  baseline: ForecastScenario
  pessimistic: ForecastScenario
  worstCase: ForecastScenario
}

export interface ForecastScenario {
  demand: number
  probability: number
  drivers: string[]
}

export interface FinancialImpact {
  revenueProjection: number
  profitMargin: number
  expectedProfit: number
  inventoryInvestment: number
  cashFlowImpact: {
    positive: number
    negative: number
    net: number
  }
  riskAdjustedValue: number
}

// ================================
// ANALYTICS INTERFACES
// ================================

export interface InventoryPerformanceMetrics {
  warehouseId: string
  period: string
  totalProducts: number
  totalValue: number
  turnoverRate: number
  stockAccuracy: number
  fillRate: number
  averageInventoryDays: number
  deadStockPercentage: number
  fastMovingProducts: string[]
  slowMovingProducts: string[]
  profitabilityAnalysis: ProfitabilityAnalysis
}

export interface ProfitabilityAnalysis {
  highMarginProducts: string[]
  lowMarginProducts: string[]
  totalMargin: number
}

export interface StockInsights {
  velocityCategory: VelocityCategory
  reorderRecommendation: ReorderRecommendation
  stockoutRisk: RiskLevel
  optimizationSuggestions: string[]
}

export interface ReorderRecommendation {
  shouldReorder: boolean
  suggestedQuantity: number
  urgency: UrgencyLevel
}

export interface FlexVoltData {
  voltageClass: string
  contractorApplication: string[]
  volumeDiscountTiers: VolumeDiscountTier[]
}

export interface VolumeDiscountTier {
  tier: string
  minimumOrder: number
  discountedPrice: number
  savings: number
  eligible: boolean
}

// ================================
// BUSINESS INTELLIGENCE INTERFACES
// ================================

export interface BusinessInsights {
  summary: {
    totalProducts: number
    batteryProducts: number
    inStockProducts: number
    outOfStockProducts: number
    stockPercentage: number
  }
  flexvolt: {
    available: number
    categories: {
      '6Ah': number
      '9Ah': number
      '15Ah': number
    }
    averagePrice: number
  }
  supplierTier: {
    current: SupplierTier
    benefits: string[]
    nextTierRequirements?: TierRequirements
  }
  recommendations: BusinessRecommendation[]
}

export interface TierRequirements {
  nextTier: SupplierTier
  volumeRequired: string
  timeRequired: string
}

export interface BusinessRecommendation {
  type: 'STOCK_ALERT' | 'TIER_UPGRADE' | 'PRODUCT_EXPANSION' | 'OPTIMIZATION'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  action: string
  products?: { id: string; name: string }[]
  benefits?: string[]
  suggestions?: string[]
}

export interface MarketConditions {
  economicIndicators: {
    gdpGrowth: number
    constructionIndex: number
    manufacturingPMI: number
    inflation: number
  }
  industryTrends: {
    batteryDemandGrowth: number
    professionalToolsMarket: string
    competitiveIntensity: string
    priceVolatility: string
  }
  lastUpdated: string
}

export interface SeasonalProfile {
  peakMonths: number[]
  lowMonths: number[]
  holidays: string[]
  adjustmentFactors: number[]
}

export interface CompetitiveAnalysis {
  competitorMapping: {
    directCompetitors: string[]
    marketLeader: string
    ourPosition: number
  }
  pricingAnalysis: {
    premiumPosition: boolean
    priceAdvantage: string
    valueProposition: string
  }
}

export interface MarketTrends {
  emergingTrends: string[]
  technologyTrends: string[]
}

// ================================
// API REQUEST/RESPONSE INTERFACES
// ================================

export interface ProductQueryParams {
  warehouse?: WarehouseLocation
  category?: ProductCategory
  status?: ProductStatus
  search?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  page: number
  limit: number
  sortBy: 'name' | 'price' | 'category' | 'stock' | 'updated'
  sortOrder: 'asc' | 'desc'
  includeForecasting: boolean
  includeMetrics: boolean
}

export interface StockQueryParams {
  warehouse: WarehouseLocation
  productId?: string
  stockStatus?: StockStatus
  movementType?: MovementType
  startDate?: string
  endDate?: string
  page: number
  limit: number
  includeMovements: boolean
  includeAlerts: boolean
  includeAnalytics: boolean
}

export interface ForecastingQueryParams {
  warehouse: WarehouseLocation
  productId?: string
  period: ForecastPeriod
  riskLevel?: RiskLevel
  includeSeasonality: boolean
  includeTrends: boolean
  confidenceThreshold: number
  includeOptimization: boolean
  includeScenarios: boolean
  includeFinancialImpact: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
  metadata: ApiMetadata
}

export interface ApiMetadata {
  operationId: string
  duration?: number
  timestamp: string
  version?: string
  supplier?: SupplierContext
  performance?: PerformanceMetrics
  rateLimitRemaining?: number
  [key: string]: any
}

export interface SupplierContext {
  id: string
  tier: SupplierTier
  warehouseAccess?: WarehouseLocation[]
  analyticsLevel?: string
}

export interface PerformanceMetrics {
  responseTime: number
  dbQueries?: string
  cacheHit?: boolean
}

// ================================
// PAGINATION INTERFACES
// ================================

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// ================================
// SECURITY INTERFACES
// ================================

export interface SecurityContext {
  ipAddress: string
  userAgent: string
  warehouse?: WarehouseLocation
}

export interface AuditContext {
  operationId: string
  action: string
  supplierId: string
  success: boolean
  securityContext: SecurityContext
  metadata?: Record<string, any>
}

// ================================
// ADVANCED ANALYTICS INTERFACES
// ================================

export interface InventoryAnalytics {
  trends: {
    weekOverWeek: number
    monthOverMonth: number
    quarterOverQuarter: number
  }
  predictions: {
    nextWeekDemand: number
    nextMonthDemand: number
    seasonalAdjustment: number
  }
  efficiency: {
    warehouseUtilization: number
    pickingAccuracy: number
    cycleTime: number
  }
}

export interface ForecastingMethodology {
  algorithms: string[]
  dataPoints: number
  confidenceLevel: number
  lastTrainingDate: string
  nextModelUpdate: string
  accuracyMetrics: {
    mape: number // Mean Absolute Percentage Error
    rmse: number // Root Mean Square Error
    mae: number  // Mean Absolute Error
  }
}

export interface StrategicInsights {
  portfolioHealth: {
    diversification: string
    concentrationRisk: string
    balanceScore: number
  }
  marketPosition: {
    competitiveAdvantage: string
    marketShare: string
    growthOpportunity: string
  }
  strategicRecommendations: string[]
}

export interface SupplierRecommendations {
  immediate: string[]
  shortTerm: string[]
  longTerm: string[]
  tierSpecific: string[]
}

export interface InventoryOptimization {
  overallOptimization: {
    currentInventoryValue: string
    optimizedInventoryValue: string
    potentialSavings: string
    turnoverImprovement: string
  }
  productLevelOptimization: ProductOptimization[]
}

export interface ProductOptimization {
  productId: string
  currentStock: number
  optimizedStock: number
  impact: 'REDUCE' | 'INCREASE'
}

export interface CostReductionOpportunities {
  inventoryReduction: string
  orderingEfficiency: string
  stockoutPrevention: string
  totalOpportunity: string
  implementationCost: string
  netBenefit: string
}

export interface RiskMitigationStrategies {
  highRiskProducts: number
  mitigationStrategies: string[]
  contingencyPlans: string[]
}

export interface SupplierActionPlan {
  week1: string[]
  week2: string[]
  month1: string[]
  quarter1: string[]
}

// ================================
// CUSTOM FORECASTING INTERFACES
// ================================

export interface ForecastingConfig {
  warehouse: WarehouseLocation
  productIds: string[]
  forecastHorizon: number
  algorithms: ForecastingAlgorithm[]
  seasonalityFactors?: SeasonalityFactors
  businessConstraints?: BusinessConstraints
}

export type ForecastingAlgorithm = 'ARIMA' | 'EXPONENTIAL_SMOOTHING' | 'LINEAR_REGRESSION' | 'NEURAL_NETWORK'

export interface SeasonalityFactors {
  holidays: boolean
  weather: boolean
  events: boolean
}

export interface BusinessConstraints {
  minOrderQuantity?: number
  maxOrderQuantity?: number
  leadTime?: number
  stockoutCost?: number
  holdingCost?: number
}

export interface CustomForecastingJob {
  operationId: string
  jobId: string
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
  estimatedCompletion: string
  warehouse: WarehouseLocation
  productCount: number
  algorithms: ForecastingAlgorithm[]
  resultUrl: string
}

// ================================
// ERROR INTERFACES
// ================================

export interface InventoryApiError {
  code: string
  message: string
  details?: any
  operationId?: string
  timestamp?: string
}

// ================================
// CONFIGURATION INTERFACES
// ================================

export interface InventoryApiConfig {
  maxRetries: number
  timeoutMs: number
  cacheEnabled: boolean
  cacheTtlMs: number
  rateLimitWindow: number
  rateLimitMax: number
}

// ================================
// UTILITY TYPES
// ================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// ================================
// EXPORT COLLECTIONS
// ================================

export type {
  // Core types
  WarehouseLocation,
  ProductCategory,
  ProductStatus,
  StockStatus,
  MovementType,
  ForecastPeriod,
  RiskLevel,
  SupplierTier,
  TrendDirection,
  VelocityCategory,
  UrgencyLevel,
  ForecastingAlgorithm
}

// Main interface collections for easy importing
export interface InventoryApisTypes {
  // Product related
  InventoryProduct: InventoryProduct
  ProductSpecifications: ProductSpecifications
  FlexVoltInfo: FlexVoltInfo
  PricingTiers: PricingTiers
  GlobalAvailability: GlobalAvailability
  
  // Warehouse related
  WarehouseInventory: WarehouseInventory
  WarehouseContext: WarehouseContext
  
  // Stock related
  StockMovement: StockMovement
  StockUpdate: StockUpdate
  StockSummary: StockSummary
  StockInsights: StockInsights
  
  // Forecasting related
  InventoryForecast: InventoryForecast
  ForecastingConfig: ForecastingConfig
  
  // Analytics related
  InventoryPerformanceMetrics: InventoryPerformanceMetrics
  BusinessInsights: BusinessInsights
  
  // API related
  ApiResponse: ApiResponse<any>
  ApiMetadata: ApiMetadata
  PaginationInfo: PaginationInfo
  SecurityContext: SecurityContext
}