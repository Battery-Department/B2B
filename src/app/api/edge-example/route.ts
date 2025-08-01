/**
 * Example Edge API Route
 * Shows how to create edge-compatible API routes
 */

import { createEdgeRoute, success, error, edgeLog } from '@/lib/edge-api'
import { z } from 'zod'

// Enable edge runtime
export const runtime = 'edge'

// Define schemas
const querySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => parseInt(val || '10'))
})

const createSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().optional()
})

// Create route handlers
const route = createEdgeRoute<z.infer<typeof createSchema>, z.infer<typeof querySchema>>()

// GET handler
export const GET = route.GET(async (request, query) => {
  edgeLog('info', 'GET /api/edge-example', query)
  
  // Simulate database query using KV
  const { kv } = await import('@vercel/kv')
  const examples = await kv.get('examples') || []
  
  // Pagination
  const start = (query.page - 1) * query.limit
  const end = start + query.limit
  const paginatedExamples = (examples as any[]).slice(start, end)
  
  return success({
    data: paginatedExamples,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: (examples as any[]).length
    }
  })
})

// POST handler
export const POST = route.POST(createSchema, async (request, body) => {
  edgeLog('info', 'POST /api/edge-example', body)
  
  // Validate session
  const session = await request.headers.get('authorization')
  if (!session) {
    return error('Unauthorized', 401)
  }
  
  // Store in KV
  const { kv } = await import('@vercel/kv')
  const id = crypto.randomUUID()
  const example = { id, ...body, createdAt: new Date().toISOString() }
  
  // Get existing examples
  const examples = await kv.get('examples') || []
  
  // Add new example
  await kv.set('examples', [...(examples as any[]), example])
  
  return success(example, 201)
})

// PUT handler
export const PUT = route.PUT(createSchema, async (request, body) => {
  edgeLog('info', 'PUT /api/edge-example', body)
  
  // Get ID from URL
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  
  if (!id) {
    return error('ID required', 400)
  }
  
  // Update in KV
  const { kv } = await import('@vercel/kv')
  const examples = await kv.get('examples') || []
  
  const updated = (examples as any[]).map(ex => 
    ex.id === id ? { ...ex, ...body, updatedAt: new Date().toISOString() } : ex
  )
  
  await kv.set('examples', updated)
  
  return success({ id, ...body })
})

// DELETE handler
export const DELETE = route.DELETE(async (request) => {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  
  if (!id) {
    return error('ID required', 400)
  }
  
  edgeLog('info', 'DELETE /api/edge-example', { id })
  
  // Delete from KV
  const { kv } = await import('@vercel/kv')
  const examples = await kv.get('examples') || []
  
  const filtered = (examples as any[]).filter(ex => ex.id !== id)
  await kv.set('examples', filtered)
  
  return success({ deleted: true })
})