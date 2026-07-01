import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('roadnet_token');
  return res;
}
