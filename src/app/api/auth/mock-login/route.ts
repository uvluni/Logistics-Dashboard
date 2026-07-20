import { NextRequest, NextResponse } from 'next/server';
import { verifyCSRFToken } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token (in dev, allow bypass if needed)
    const csrfToken = request.cookies.get('csrf_token')?.value;
    const csrfHeader = request.headers.get('x-csrf-token');

    const isDev = process.env.NODE_ENV !== 'production';
    const csrfValid = csrfToken && csrfHeader && verifyCSRFToken(csrfHeader) && csrfHeader === csrfToken;

    if (!isDev && !csrfValid) {
      return NextResponse.json(
        { error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    const res = NextResponse.json({ token: 'mock-token-dev', success: true });
    res.cookies.set('roadnet_token', 'mock-token-dev', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || process.env.FORCE_HTTPS === 'true',
      sameSite: 'strict',
      maxAge: 86400,
      path: '/',
    });

    // Clear CSRF token after use
    if (csrfValid) {
      res.cookies.delete('csrf_token');
    }

    return res;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Mock login error:', error instanceof Error ? error.message : String(error));
    }
    return NextResponse.json(
      { error: 'Mock login failed' },
      { status: 500 }
    );
  }
}
