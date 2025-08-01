/**
 * RHY Supplier Portal - Environment Configuration Management
 * Secure, type-safe environment variable handling with validation
 * and multi-environment support for global warehouse operations
 */

import { z } from 'zod'

// ============================================================================
// ENVIRONMENT VALIDATION SCHEMAS
// ============================================================================

const DatabaseConfigSchema = z.object({
  url: z.string().url().or(z.string().startsWith('file:')),
  poolSize: z.coerce.number().int().min(1).max(100).default(20),
  connectionTimeout: z.coerce.number().int().min(1000).max(60000).default(30000),
  queryTimeout: z.coerce.number().int().min(1000).max(120000).default(30000),
  ssl: z.boolean().default(false),
  logging: z.boolean().default(false)
})

const SecurityConfigSchema = z.object({
  jwtSecret: z.string().min(32, 'JWT secret must be at least 32 characters'),
  jwtExpiration: z.string().default('8h'),
  bcryptRounds: z.coerce.number().int().min(10).max(15).default(12),
  sessionTimeout: z.coerce.number().int().min(900).max(86400).default(28800),
  maxLoginAttempts: z.coerce.number().int().min(3).max(10).default(5),
  lockoutDuration: z.coerce.number().int().min(300).max(3600).default(900),
  corsOrigin: z.string().or(z.array(z.string())).default('*'),
  rateLimitRequests: z.coerce.number().int().min(10).max(1000).default(100),
  rateLimitWindow: z.coerce.number().int().min(1).max(60).default(15)
})

const AIConfigSchema = z.object({
  openaiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  huggingfaceApiKey: z.string().optional(),
  googleAiApiKey: z.string().optional(),
  modelEndpoint: z.string().url().default('https://api.openai.com/v1'),
  embeddingsModel: z.string().default('text-embedding-3-small'),
  chatModel: z.string().default('gpt-4-turbo-preview'),
  completionModel: z.string().default('gpt-3.5-turbo'),
  requestTimeout: z.coerce.number().int().min(5000).max(120000).default(30000),
  maxRetries: z.coerce.number().int().min(1).max(5).default(3),
  rateLimit: z.coerce.number().int().min(10).max(1000).default(100),
  loggingEnabled: z.boolean().default(true),
  metricsEnabled: z.boolean().default(true),
  costTracking: z.boolean().default(true)
})

const PaymentConfigSchema = z.object({
  stripePublishableKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  stripeWebhookSecret: z.string().optional(),
  paypalClientId: z.string().optional(),
  paypalClientSecret: z.string().optional(),
  enabledProviders: z.array(z.enum(['stripe', 'paypal', 'bank_transfer'])).default(['stripe']),
  defaultCurrency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'AUD']).default('USD'),
  testMode: z.boolean().default(true)
})

const MetaConfigSchema = z.object({
  pixelId: z.string().optional(),
  accessToken: z.string().optional(),
  testEventCode: z.string().optional(),
  webhookVerifyToken: z.string().optional(),
  appSecret: z.string().optional(),
  apiVersion: z.string().default('v19.0'),
  enabled: z.boolean().default(false)
})

const RedisConfigSchema = z.object({
  url: z.string().optional(),
  host: z.string().default('localhost'),
  port: z.coerce.number().int().min(1).max(65535).default(6379),
  password: z.string().optional(),
  db: z.coerce.number().int().min(0).max(15).default(0),
  enableOfflineQueue: z.boolean().default(false),
  maxRetriesPerRequest: z.coerce.number().int().min(0).max(10).default(3),
  retryDelayOnFailover: z.coerce.number().int().min(100).max(10000).default(1000),
  connectionTimeout: z.coerce.number().int().min(1000).max(30000).default(10000)
})

const EmailConfigSchema = z.object({
  provider: z.enum(['sendgrid', 'smtp', 'postmark']).default('sendgrid'),
  sendgridApiKey: z.string().optional(),
  fromEmail: z.string().email().default('noreply@rhy-supplier.com'),
  fromName: z.string().default('RHY Supplier Portal'),
  smtpHost: z.string().optional(),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpSecure: z.boolean().default(true)
})

const WarehouseConfigSchema = z.object({
  defaultWarehouse: z.enum(['us-west', 'japan', 'eu', 'australia']).default('us-west'),
  syncInterval: z.coerce.number().int().min(10000).max(300000).default(30000),
  maxConcurrentSync: z.coerce.number().int().min(1).max(10).default(4),
  enableRealTimeSync: z.boolean().default(true),
  inventoryThreshold: z.coerce.number().int().min(0).max(1000).default(10),
  autoReorderEnabled: z.boolean().default(false),
  crossWarehouseFulfillment: z.boolean().default(true)
})

const MonitoringConfigSchema = z.object({
  enableMetrics: z.boolean().default(true),
  enableTracing: z.boolean().default(false),
  enableLogging: z.boolean().default(true),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  sentryDsn: z.string().optional(),
  sentryEnvironment: z.string().default('development'),
  prometheusEnabled: z.boolean().default(false),
  healthCheckInterval: z.coerce.number().int().min(5000).max(300000).default(30000)
})

const FeatureFlagsSchema = z.object({
  multiWarehouse: z.boolean().default(true),
  realTimeInventory: z.boolean().default(true),
  advancedAnalytics: z.boolean().default(true),
  mfaEnforcement: z.boolean().default(true),
  complianceAutomation: z.boolean().default(true),
  predictiveOrdering: z.boolean().default(false),
  aiRecommendations: z.boolean().default(true),
  mobileOptimization: z.boolean().default(true),
  offlineSupport: z.boolean().default(false),
  quizIntelligence: z.boolean().default(true),
  metaIntegration: z.boolean().default(false),
  realTimeMonitoring: z.boolean().default(true),
  behavioralAnalytics: z.boolean().default(true)
})

const ApplicationConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().int().min(1000).max(65535).default(3000),
  baseUrl: z.string().url().default('http://localhost:3000'),
  wsUrl: z.string().url().default('ws://localhost:3000'),
  version: z.string().default('1.0.0'),
  buildId: z.string().optional(),
  deploymentId: z.string().optional(),
  region: z.string().default('us-west'),
  enableHttps: z.boolean().default(false),
  enableCompression: z.boolean().default(true),
  maxRequestSize: z.string().default('10mb'),
  requestTimeout: z.coerce.number().int().min(5000).max(300000).default(30000)
})

const EnvironmentSchema = z.object({
  app: ApplicationConfigSchema,
  database: DatabaseConfigSchema,
  security: SecurityConfigSchema,
  ai: AIConfigSchema,
  payment: PaymentConfigSchema,
  meta: MetaConfigSchema,
  redis: RedisConfigSchema,
  email: EmailConfigSchema,
  warehouse: WarehouseConfigSchema,
  monitoring: MonitoringConfigSchema,
  features: FeatureFlagsSchema
})

// ============================================================================
// ENVIRONMENT LOADER
// ============================================================================

function loadEnvironmentVariable(key: string, fallback?: string): string | undefined {
  return process.env[key] || fallback
}

function loadBooleanVariable(key: string, fallback: boolean = false): boolean {
  const value = process.env[key]
  if (value === undefined) return fallback
  return value.toLowerCase() === 'true' || value === '1'
}

function loadNumberVariable(key: string, fallback?: number): number | undefined {
  const value = process.env[key]
  if (value === undefined) return fallback
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? fallback : parsed
}

// ============================================================================
// CONFIGURATION BUILDER
// ============================================================================

function buildConfiguration() {
  const rawConfig = {
    app: {
      nodeEnv: loadEnvironmentVariable('NODE_ENV', 'development'),
      port: loadNumberVariable('PORT', 3000),
      baseUrl: loadEnvironmentVariable('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000'),
      wsUrl: loadEnvironmentVariable('NEXT_PUBLIC_WS_URL', 'ws://localhost:3000'),
      version: loadEnvironmentVariable('NEXT_PUBLIC_VERSION', '1.0.0'),
      buildId: loadEnvironmentVariable('BUILD_ID'),
      deploymentId: loadEnvironmentVariable('DEPLOYMENT_ID'),
      region: loadEnvironmentVariable('REGION', 'us-west'),
      enableHttps: loadBooleanVariable('ENABLE_HTTPS', false),
      enableCompression: loadBooleanVariable('ENABLE_COMPRESSION', true),
      maxRequestSize: loadEnvironmentVariable('MAX_REQUEST_SIZE', '10mb'),
      requestTimeout: loadNumberVariable('REQUEST_TIMEOUT', 30000)
    },
    database: {
      url: loadEnvironmentVariable('DATABASE_URL', 'file:./dev.db'),
      poolSize: loadNumberVariable('DB_POOL_SIZE', 20),
      connectionTimeout: loadNumberVariable('DB_CONNECTION_TIMEOUT', 30000),
      queryTimeout: loadNumberVariable('DB_QUERY_TIMEOUT', 30000),
      ssl: loadBooleanVariable('DB_SSL', false),
      logging: loadBooleanVariable('DB_LOGGING', false)
    },
    security: {
      jwtSecret: loadEnvironmentVariable('JWT_SECRET', 'dev-secret-key-change-in-production-minimum-32-chars'),
      jwtExpiration: loadEnvironmentVariable('JWT_EXPIRATION', '8h'),
      bcryptRounds: loadNumberVariable('BCRYPT_ROUNDS', 12),
      sessionTimeout: loadNumberVariable('SESSION_TIMEOUT', 28800),
      maxLoginAttempts: loadNumberVariable('MAX_LOGIN_ATTEMPTS', 5),
      lockoutDuration: loadNumberVariable('LOCKOUT_DURATION', 900),
      corsOrigin: loadEnvironmentVariable('CORS_ORIGIN', '*'),
      rateLimitRequests: loadNumberVariable('RATE_LIMIT_REQUESTS', 100),
      rateLimitWindow: loadNumberVariable('RATE_LIMIT_WINDOW', 15)
    },
    ai: {
      openaiApiKey: loadEnvironmentVariable('OPENAI_API_KEY'),
      anthropicApiKey: loadEnvironmentVariable('ANTHROPIC_API_KEY'),
      huggingfaceApiKey: loadEnvironmentVariable('HUGGINGFACE_API_KEY'),
      googleAiApiKey: loadEnvironmentVariable('GOOGLE_AI_API_KEY'),
      modelEndpoint: loadEnvironmentVariable('AI_MODEL_ENDPOINT', 'https://api.openai.com/v1'),
      embeddingsModel: loadEnvironmentVariable('AI_EMBEDDINGS_MODEL', 'text-embedding-3-small'),
      chatModel: loadEnvironmentVariable('AI_CHAT_MODEL', 'gpt-4-turbo-preview'),
      completionModel: loadEnvironmentVariable('AI_COMPLETION_MODEL', 'gpt-3.5-turbo'),
      requestTimeout: loadNumberVariable('AI_REQUEST_TIMEOUT', 30000),
      maxRetries: loadNumberVariable('AI_MAX_RETRIES', 3),
      rateLimit: loadNumberVariable('AI_RATE_LIMIT', 100),
      loggingEnabled: loadBooleanVariable('AI_LOGGING_ENABLED', true),
      metricsEnabled: loadBooleanVariable('AI_METRICS_ENABLED', true),
      costTracking: loadBooleanVariable('AI_COST_TRACKING', true)
    },
    payment: {
      stripePublishableKey: loadEnvironmentVariable('STRIPE_PUBLISHABLE_KEY'),
      stripeSecretKey: loadEnvironmentVariable('STRIPE_SECRET_KEY'),
      stripeWebhookSecret: loadEnvironmentVariable('STRIPE_WEBHOOK_SECRET'),
      paypalClientId: loadEnvironmentVariable('PAYPAL_CLIENT_ID'),
      paypalClientSecret: loadEnvironmentVariable('PAYPAL_CLIENT_SECRET'),
      enabledProviders: loadEnvironmentVariable('PAYMENT_PROVIDERS', 'stripe').split(','),
      defaultCurrency: loadEnvironmentVariable('DEFAULT_CURRENCY', 'USD'),
      testMode: loadBooleanVariable('PAYMENT_TEST_MODE', true)
    },
    meta: {
      pixelId: loadEnvironmentVariable('META_PIXEL_ID'),
      accessToken: loadEnvironmentVariable('META_ACCESS_TOKEN'),
      testEventCode: loadEnvironmentVariable('META_TEST_EVENT_CODE'),
      webhookVerifyToken: loadEnvironmentVariable('META_WEBHOOK_VERIFY_TOKEN'),
      appSecret: loadEnvironmentVariable('META_APP_SECRET'),
      apiVersion: loadEnvironmentVariable('META_API_VERSION', 'v19.0'),
      enabled: loadBooleanVariable('META_INTEGRATION_ENABLED', false)
    },
    redis: {
      url: loadEnvironmentVariable('REDIS_URL'),
      host: loadEnvironmentVariable('REDIS_HOST', 'localhost'),
      port: loadNumberVariable('REDIS_PORT', 6379),
      password: loadEnvironmentVariable('REDIS_PASSWORD'),
      db: loadNumberVariable('REDIS_DB', 0),
      enableOfflineQueue: loadBooleanVariable('REDIS_OFFLINE_QUEUE', false),
      maxRetriesPerRequest: loadNumberVariable('REDIS_MAX_RETRIES', 3),
      retryDelayOnFailover: loadNumberVariable('REDIS_RETRY_DELAY', 1000),
      connectionTimeout: loadNumberVariable('REDIS_CONNECTION_TIMEOUT', 10000)
    },
    email: {
      provider: loadEnvironmentVariable('EMAIL_PROVIDER', 'sendgrid'),
      sendgridApiKey: loadEnvironmentVariable('SENDGRID_API_KEY'),
      fromEmail: loadEnvironmentVariable('FROM_EMAIL', 'noreply@rhy-supplier.com'),
      fromName: loadEnvironmentVariable('FROM_NAME', 'RHY Supplier Portal'),
      smtpHost: loadEnvironmentVariable('SMTP_HOST'),
      smtpPort: loadNumberVariable('SMTP_PORT'),
      smtpUser: loadEnvironmentVariable('SMTP_USER'),
      smtpPassword: loadEnvironmentVariable('SMTP_PASSWORD'),
      smtpSecure: loadBooleanVariable('SMTP_SECURE', true)
    },
    warehouse: {
      defaultWarehouse: loadEnvironmentVariable('DEFAULT_WAREHOUSE', 'us-west'),
      syncInterval: loadNumberVariable('WAREHOUSE_SYNC_INTERVAL', 30000),
      maxConcurrentSync: loadNumberVariable('WAREHOUSE_MAX_CONCURRENT_SYNC', 4),
      enableRealTimeSync: loadBooleanVariable('WAREHOUSE_REAL_TIME_SYNC', true),
      inventoryThreshold: loadNumberVariable('WAREHOUSE_INVENTORY_THRESHOLD', 10),
      autoReorderEnabled: loadBooleanVariable('WAREHOUSE_AUTO_REORDER', false),
      crossWarehouseFulfillment: loadBooleanVariable('WAREHOUSE_CROSS_FULFILLMENT', true)
    },
    monitoring: {
      enableMetrics: loadBooleanVariable('ENABLE_METRICS', true),
      enableTracing: loadBooleanVariable('ENABLE_TRACING', false),
      enableLogging: loadBooleanVariable('ENABLE_LOGGING', true),
      logLevel: loadEnvironmentVariable('LOG_LEVEL', 'info'),
      sentryDsn: loadEnvironmentVariable('SENTRY_DSN'),
      sentryEnvironment: loadEnvironmentVariable('SENTRY_ENVIRONMENT', 'development'),
      prometheusEnabled: loadBooleanVariable('PROMETHEUS_ENABLED', false),
      healthCheckInterval: loadNumberVariable('HEALTH_CHECK_INTERVAL', 30000)
    },
    features: {
      multiWarehouse: loadBooleanVariable('FEATURE_MULTI_WAREHOUSE', true),
      realTimeInventory: loadBooleanVariable('FEATURE_REAL_TIME_INVENTORY', true),
      advancedAnalytics: loadBooleanVariable('FEATURE_ADVANCED_ANALYTICS', true),
      mfaEnforcement: loadBooleanVariable('FEATURE_MFA_ENFORCEMENT', true),
      complianceAutomation: loadBooleanVariable('FEATURE_COMPLIANCE_AUTOMATION', true),
      predictiveOrdering: loadBooleanVariable('FEATURE_PREDICTIVE_ORDERING', false),
      aiRecommendations: loadBooleanVariable('FEATURE_AI_RECOMMENDATIONS', true),
      mobileOptimization: loadBooleanVariable('FEATURE_MOBILE_OPTIMIZATION', true),
      offlineSupport: loadBooleanVariable('FEATURE_OFFLINE_SUPPORT', false),
      quizIntelligence: loadBooleanVariable('FEATURE_QUIZ_INTELLIGENCE', true),
      metaIntegration: loadBooleanVariable('FEATURE_META_INTEGRATION', false),
      realTimeMonitoring: loadBooleanVariable('FEATURE_REAL_TIME_MONITORING', true),
      behavioralAnalytics: loadBooleanVariable('FEATURE_BEHAVIORAL_ANALYTICS', true)
    }
  }

  return EnvironmentSchema.parse(rawConfig)
}

// ============================================================================
// CONFIGURATION INSTANCE
// ============================================================================

let environmentConfig: z.infer<typeof EnvironmentSchema> | null = null

export function getEnvironmentConfig(): z.infer<typeof EnvironmentSchema> {
  if (!environmentConfig) {
    try {
      environmentConfig = buildConfiguration()
    } catch (error) {
      console.error('❌ Environment configuration validation failed:', error)
      throw new Error(`Invalid environment configuration: ${error instanceof z.ZodError ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') : error}`)
    }
  }
  return environmentConfig
}

// ============================================================================
// CONFIGURATION UTILITIES
// ============================================================================

export function isDevelopment(): boolean {
  return getEnvironmentConfig().app.nodeEnv === 'development'
}

export function isProduction(): boolean {
  return getEnvironmentConfig().app.nodeEnv === 'production'
}

export function isTest(): boolean {
  return getEnvironmentConfig().app.nodeEnv === 'test'
}

export function requireEnvironmentVariable(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`)
  }
  return value
}

export function getWarehouseRegion(): string {
  return getEnvironmentConfig().app.region
}

export function isFeatureEnabled(feature: keyof z.infer<typeof EnvironmentSchema>['features']): boolean {
  return getEnvironmentConfig().features[feature]
}

export function getDatabaseConfig() {
  return getEnvironmentConfig().database
}

export function getSecurityConfig() {
  return getEnvironmentConfig().security
}

export function getAIConfig() {
  return getEnvironmentConfig().ai
}

export function getPaymentConfig() {
  return getEnvironmentConfig().payment
}

export function getMetaConfig() {
  return getEnvironmentConfig().meta
}

export function getRedisConfig() {
  return getEnvironmentConfig().redis
}

export function getEmailConfig() {
  return getEnvironmentConfig().email
}

export function getWarehouseConfig() {
  return getEnvironmentConfig().warehouse
}

export function getMonitoringConfig() {
  return getEnvironmentConfig().monitoring
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateEnvironment(): { valid: boolean; errors: string[] } {
  try {
    buildConfiguration()
    return { valid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }
    }
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error']
    }
  }
}

export function getConfigurationSummary() {
  const config = getEnvironmentConfig()
  return {
    environment: config.app.nodeEnv,
    region: config.app.region,
    version: config.app.version,
    features: Object.entries(config.features)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature),
    integrations: {
      database: !!config.database.url,
      redis: !!config.redis.url || config.redis.host !== 'localhost',
      ai: !!(config.ai.openaiApiKey || config.ai.anthropicApiKey),
      payment: !!(config.payment.stripeSecretKey || config.payment.paypalClientSecret),
      meta: config.meta.enabled && !!config.meta.pixelId,
      email: !!(config.email.sendgridApiKey || config.email.smtpHost)
    }
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type EnvironmentConfig = z.infer<typeof EnvironmentSchema>
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>
export type SecurityConfig = z.infer<typeof SecurityConfigSchema>
export type AIConfig = z.infer<typeof AIConfigSchema>
export type PaymentConfig = z.infer<typeof PaymentConfigSchema>
export type MetaConfig = z.infer<typeof MetaConfigSchema>
export type RedisConfig = z.infer<typeof RedisConfigSchema>
export type EmailConfig = z.infer<typeof EmailConfigSchema>
export type WarehouseConfig = z.infer<typeof WarehouseConfigSchema>
export type MonitoringConfig = z.infer<typeof MonitoringConfigSchema>
export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default getEnvironmentConfig