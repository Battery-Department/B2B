import { NextRequest, NextResponse } from 'next/server';
import { googleAuth } from '@/lib/auth/google-oauth';
import { cookies } from 'next/headers';

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle errors from Google
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect('/auth/signin?error=oauth_denied');
    }

    if (!code) {
      return NextResponse.redirect('/auth/signin?error=no_code');
    }

    // Exchange code for tokens
    const tokens = await googleAuth.getTokens(code);
    
    if (!tokens.access_token) {
      return NextResponse.redirect('/auth/signin?error=no_token');
    }

    // Get user info from Google
    const googleUser = await googleAuth.getUserInfo(tokens.access_token);
    
    // Find or create user in database
    const user = await googleAuth.findOrCreateUser(googleUser);
    
    // Generate session token
    const sessionToken = googleAuth.generateSessionToken(user);
    
    // Set session cookie
    cookies().set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    // Decode state to get return URL
    let returnUrl = '/customer/dashboard';
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        returnUrl = stateData.returnUrl || returnUrl;
      } catch (e) {
        console.error('Failed to decode state:', e);
      }
    }

    // Redirect to dashboard or return URL
    return NextResponse.redirect(new URL(returnUrl, request.url));
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect('/auth/signin?error=callback_error');
  }
}