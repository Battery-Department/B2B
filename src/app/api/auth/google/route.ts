import { NextRequest, NextResponse } from 'next/server';
import { googleAuth } from '@/lib/auth/google-oauth';

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get the return URL from query params (where to redirect after login)
    const searchParams = request.nextUrl.searchParams;
    const returnUrl = searchParams.get('returnUrl') || '/customer/dashboard';
    
    // Generate state token for security
    const state = Buffer.from(JSON.stringify({
      returnUrl,
      timestamp: Date.now(),
    })).toString('base64');
    
    // Get Google OAuth URL
    const authUrl = googleAuth.getAuthUrl(state);
    
    // Redirect to Google
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.redirect('/auth/signin?error=oauth_error');
  }
}