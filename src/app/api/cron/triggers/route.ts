import { NextRequest, NextResponse } from 'next/server'
import { runScheduledTriggers } from '@/services/triggers/behavioral-triggers'

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic'

// This endpoint should be called by a cron job service (e.g., Vercel Cron, GitHub Actions, or external service)
export async function GET(request: NextRequest) {
  try {
    // Verify the request is authorized (add your own auth mechanism)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Run scheduled triggers
    await runScheduledTriggers()
    
    return NextResponse.json({ 
      success: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error running scheduled triggers:', error)
    return NextResponse.json(
      { error: 'Failed to run triggers' },
      { status: 500 }
    )
  }
}