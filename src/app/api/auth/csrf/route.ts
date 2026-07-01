import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  try {
    const token = generateCSRFToken();
    
    const res = NextResponse.json({ token });
    
    // Store token in httpOnly cookie for validation
    res.cookies.set('csrf_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || process.env.FORCE_HTTPS === 'true',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      path: '/',
    });
    
    return res;
  } catch (error) {
    console.error('CSRF token generation error');
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
