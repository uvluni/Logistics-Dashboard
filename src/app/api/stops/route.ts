import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('roadnet_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Rate limiting: 30 requests per minute per token
    if (!checkRateLimit(token, 30, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const { searchParams } = new URL(request.url);
    const sessionDate = searchParams.get('sessionDate');

    if (!sessionDate || !/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
      return NextResponse.json(
        { error: 'Invalid sessionDate format. Use yyyy-MM-dd' },
        { status: 400 }
      );
    }

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Missing API base URL' },
        { status: 500 }
      );
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const stopsUrl = `${baseUrl}/v1/dailyplan/routes?expand=All&sessionDate=${sessionDate}`;
    const stopsResponse = await fetch(stopsUrl, { headers });

    if (stopsResponse.status === 401) {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      );
    }

    if (!stopsResponse.ok) {
      const errorText = await stopsResponse.text();
      return NextResponse.json(
        {
          error: 'Failed to fetch data from ROADNET',
          details: {
            status: stopsResponse.status,
            errorText: errorText.substring(0, 500),
          }
        },
        { status: stopsResponse.status }
      );
    }

    let data;
    try {
      data = await stopsResponse.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Failed to parse ROADNET response' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Stops fetch error:', error instanceof Error ? error.message : String(error));
    }
    return NextResponse.json(
      { error: 'Failed to fetch stops' },
      { status: 500 }
    );
  }
}
