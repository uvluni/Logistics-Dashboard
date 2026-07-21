import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('roadnet_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableId = process.env.AIRTABLE_TABLE_ID;
    const airtableToken = process.env.AIRTABLE_TOKEN;

    if (!baseId || !tableId || !airtableToken) {
      return NextResponse.json(
        { error: 'Airtable configuration missing' },
        { status: 500 }
      );
    }

    const { recordId, field = 'Choose Google coordinates' } = await request.json();

    if (!recordId) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    const url = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          [field]: true,
        },
      }),
    });

    console.log('[Airtable] PATCH response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Airtable] PATCH Error:', response.status, errorText);
      return NextResponse.json(
        { error: `Airtable API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Airtable] Record updated successfully:', recordId);

    return NextResponse.json({
      success: true,
      record: data,
    });
  } catch (error) {
    console.error('[Airtable] PATCH error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Failed to update Airtable record' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('roadnet_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableId = process.env.AIRTABLE_TABLE_ID;
    const airtableToken = process.env.AIRTABLE_TOKEN;

    console.log('[Airtable] Config check:', {
      baseId: baseId ? '✓' : '✗',
      tableId: tableId ? '✓' : '✗',
      airtableToken: airtableToken ? '✓' : '✗',
    });

    if (!baseId || !tableId || !airtableToken) {
      console.error('[Airtable] Missing config:', {
        baseId: !!baseId,
        tableId: !!tableId,
        airtableToken: !!airtableToken,
      });
      return NextResponse.json(
        { error: 'Airtable configuration missing' },
        { status: 500 }
      );
    }

    // Fetch records from Airtable
    const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
    console.log('[Airtable] Fetching from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[Airtable] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Airtable] API Error:', response.status, errorText);
      return NextResponse.json(
        { error: `Airtable API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Airtable] Success! Records count:', data.records?.length || 0);

    return NextResponse.json({
      success: true,
      records: data.records || [],
      totalRecords: data.records?.length || 0,
    });
  } catch (error) {
    console.error('[Airtable] Fetch error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Failed to fetch from Airtable: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
