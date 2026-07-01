import { NextRequest, NextResponse } from 'next/server';
import { verifyCSRFToken } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  // Verify CSRF token (except for logout on page init)
  const csrfToken = request.cookies.get('csrf_token')?.value;
  const csrfHeader = request.headers.get('x-csrf-token');

  // Allow logout without CSRF if no token exists (e.g., on page refresh)
  if (csrfToken && csrfHeader) {
    if (!verifyCSRFToken(csrfHeader) || csrfHeader !== csrfToken) {
      return NextResponse.json(
        { error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete('roadnet_token');
  res.cookies.delete('csrf_token');
  return res;
}
