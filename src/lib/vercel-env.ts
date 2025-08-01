/**
 * Vercel environment detection and configuration
 */

export const isVercel = !!process.env.VERCEL
export const isProduction = process.env.NODE_ENV === 'production'
export const isDevelopment = process.env.NODE_ENV === 'development'

// Database configuration
export const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || 'file:./dev.db'

// KV configuration
export const kvUrl = process.env.KV_REST_API_URL
export const hasKV = !!kvUrl

// Feature flags
export const features = {
  database: !isVercel || !!process.env.POSTGRES_URL,
  kv: hasKV,
  auth: true,
  ai: !!process.env.OPENAI_API_KEY,
  email: !!process.env.SENDGRID_API_KEY,
  payments: !!process.env.STRIPE_SECRET_KEY
}

// Logging
export function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  if (isVercel) {
    console[level](`[Vercel] ${message}`)
  } else {
    console[level](message)
  }
}