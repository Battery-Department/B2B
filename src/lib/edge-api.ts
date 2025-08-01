/**
 * Edge-compatible API utilities for Vercel deployment
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Edge runtime configuration
export const runtime = 'edge'

// Response helpers
export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function error(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

// Request validation
export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data?: T; error?: NextResponse }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { data }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        error: error(
          `Validation error: ${err.errors.map(e => e.message).join(', ')}`,
          400
        )
      }
    }
    return { error: error('Invalid request body', 400) }
  }
}

// Auth helpers (without heavy dependencies)
export async function getSessionFromRequest(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null

  // For edge runtime, we'll use a simple JWT verification
  // In production, use @vercel/edge or similar edge-compatible JWT library
  try {
    // Simplified session lookup using KV
    const { kv } = await import('@vercel/kv')
    const session = await kv.get(`session:${token}`)
    return session
  } catch {
    return null
  }
}

// CORS headers for edge
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

// Rate limiting for edge (using KV)
export async function rateLimit(
  identifier: string,
  limit = 10,
  window = 60
): Promise<boolean> {
  try {
    const { kv } = await import('@vercel/kv')
    const key = `rate_limit:${identifier}`
    
    const current = await kv.incr(key)
    
    if (current === 1) {
      await kv.expire(key, window)
    }
    
    return current <= limit
  } catch {
    // If KV fails, allow the request
    return true
  }
}

// Edge-compatible error handler
export function handleEdgeError(error: unknown): NextResponse {
  console.error('Edge API Error:', error)
  
  if (error instanceof Error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
  
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  )
}

// Database query wrapper for edge
export async function edgeQuery<T>(
  query: () => Promise<T>
): Promise<{ data?: T; error?: Error }> {
  try {
    const data = await query()
    return { data }
  } catch (err) {
    return { error: err as Error }
  }
}

// Edge-compatible logging
export function edgeLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const log = { timestamp, level, message, data }
  
  if (level === 'error') {
    console.error(JSON.stringify(log))
  } else if (level === 'warn') {
    console.warn(JSON.stringify(log))
  } else {
    console.log(JSON.stringify(log))
  }
}

// Middleware for edge routes
export function withEdgeMiddleware(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      // Add CORS headers
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 200, headers: corsHeaders() })
      }

      // Rate limiting
      const ip = request.headers.get('x-forwarded-for') || 'unknown'
      const limited = await rateLimit(ip)
      
      if (!limited) {
        return error('Too many requests', 429)
      }

      // Execute handler
      const response = await handler(request)
      
      // Add CORS headers to response
      Object.entries(corsHeaders()).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return response
    } catch (err) {
      return handleEdgeError(err)
    }
  }
}

// Type-safe API route builder
export function createEdgeRoute<TBody = any, TQuery = any>() {
  return {
    GET: (
      handler: (request: NextRequest, query: TQuery) => Promise<NextResponse>
    ) => {
      return withEdgeMiddleware(async (request) => {
        const { searchParams } = new URL(request.url)
        const query = Object.fromEntries(searchParams) as TQuery
        return handler(request, query)
      })
    },
    
    POST: (
      schema: z.ZodSchema<TBody>,
      handler: (request: NextRequest, body: TBody) => Promise<NextResponse>
    ) => {
      return withEdgeMiddleware(async (request) => {
        const { data, error } = await validateRequest(request, schema)
        if (error) return error
        return handler(request, data!)
      })
    },
    
    PUT: (
      schema: z.ZodSchema<TBody>,
      handler: (request: NextRequest, body: TBody) => Promise<NextResponse>
    ) => {
      return withEdgeMiddleware(async (request) => {
        const { data, error } = await validateRequest(request, schema)
        if (error) return error
        return handler(request, data!)
      })
    },
    
    DELETE: (
      handler: (request: NextRequest) => Promise<NextResponse>
    ) => {
      return withEdgeMiddleware(handler)
    }
  }
}